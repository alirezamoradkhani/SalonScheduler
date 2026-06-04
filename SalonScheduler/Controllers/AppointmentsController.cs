using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SalonScheduler.Data;

namespace SalonScheduler.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AppointmentsController : ControllerBase
    {
        private readonly SalonDbContext _context;

        public AppointmentsController(SalonDbContext context)
        {
            _context = context;
        }

        // --- AUTHENTICATION ENDPOINTS ---

        // POST: api/appointments/auth/register
        [HttpPost("auth/register")]
        public async Task<ActionResult<BarberDto>> Register([FromBody] RegisterBarberDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Username) ||
                string.IsNullOrWhiteSpace(dto.Password) ||
                string.IsNullOrWhiteSpace(dto.FullName))
            {
                return BadRequest("تمامی فیلدهای ستاره‌دار الزامی هستند.");
            }

            var usernameExists = await _context.Barbers.AnyAsync(b => b.Username.ToLower() == dto.Username.ToLower());
            if (usernameExists)
            {
                return BadRequest("این نام کاربری از قبل در سیستم ثبت شده است.");
            }

            // In production, please use BCrypt.Net or ASP.NET Core Identity PasswordHasher to hash
            // This is a clear representation of password hash insertion
            var passwordHash = SimpleHash(dto.Password);

            var barber = new Barber
            {
                Username = dto.Username.ToLower(),
                FullName = dto.FullName,
                PasswordHash = passwordHash,
                SalonName = dto.SalonName,
                CreatedAt = DateTime.UtcNow
            };

            _context.Barbers.Add(barber);
            await _context.SaveChangesAsync();

            return Ok(new BarberDto
            {
                Id = barber.Id,
                Username = barber.Username,
                FullName = barber.FullName,
                SalonName = barber.SalonName
            });
        }

        // POST: api/appointments/auth/login
        [HttpPost("auth/login")]
        public async Task<ActionResult<BarberDto>> Login([FromBody] LoginDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Username) || string.IsNullOrWhiteSpace(dto.Password))
            {
                return BadRequest("نام کاربری و رمز عبور الزامی هستند.");
            }

            var barber = await _context.Barbers.FirstOrDefaultAsync(b => b.Username.ToLower() == dto.Username.ToLower());
            if (barber == null)
            {
                return Unauthorized("نام کاربری یا رمز عبور اشتباه است.");
            }

            var inputHash = SimpleHash(dto.Password);
            if (barber.PasswordHash != inputHash)
            {
                return Unauthorized("نام کاربری یا رمز عبور اشتباه است.");
            }

            return Ok(new BarberDto
            {
                Id = barber.Id,
                Username = barber.Username,
                FullName = barber.FullName,
                SalonName = barber.SalonName
            });
        }

        // --- APPOINTMENTS ENDPOINTS ---

        // GET: api/appointments
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Appointment>>> GetAppointments([FromQuery] string? date, [FromQuery] int? barberId)
        {
            if (barberId == null || barberId <= 0)
            {
                return BadRequest("شناسه آرایشگر رفرش یا ورود الزامی است.");
            }

            var query = _context.Appointments
                .Include(a => a.Service)
                .Where(a => a.BarberId == barberId)
                .AsQueryable();

            if (!string.IsNullOrEmpty(date) && DateTime.TryParse(date, out var parsedDate))
            {
                query = query.Where(a => a.Date.Date == parsedDate.Date);
            }

            return await query.OrderBy(a => a.Date).ThenBy(a => a.TimeSlot).ToListAsync();
        }

        // GET: api/appointments/services
        [HttpGet("services")]
        public async Task<ActionResult<IEnumerable<Service>>> GetServices()
        {
            return await _context.Services.ToListAsync();
        }

        // POST: api/appointments
        [HttpPost]
        public async Task<ActionResult<Appointment>> BookAppointment([FromBody] AppointmentDto dto)
        {
            if (dto.BarberId <= 0)
            {
                return BadRequest("ورود آرایشگر برای رزرو الزامی است.");
            }

            if (string.IsNullOrWhiteSpace(dto.ClientName) ||
                string.IsNullOrWhiteSpace(dto.ClientPhone) ||
                string.IsNullOrWhiteSpace(dto.TimeSlot))
            {
                return BadRequest("تمامی اطلاعات ضروری را وارد کنید.");
            }

            // Checks for existing booking at the same date and time slot for the SAME barber
            var isDoubleBooked = await _context.Appointments
                .AnyAsync(a => a.BarberId == dto.BarberId && a.Date == dto.Date.Date && a.TimeSlot == dto.TimeSlot);

            if (isDoubleBooked)
            {
                return BadRequest("این زمان قبلاً توسط مشتری دیگری برای این آرایشگر رزرو شده است.");
            }

            // Verify service exists
            var serviceExists = await _context.Services.AnyAsync(s => s.Id == dto.ServiceId);
            if (!serviceExists)
            {
                return BadRequest("سرویس انتخابی نامعتبر است.");
            }

            var appointment = new Appointment
            {
                BarberId = dto.BarberId,
                ClientName = dto.ClientName,
                ClientPhone = dto.ClientPhone,
                Date = dto.Date.Date,
                TimeSlot = dto.TimeSlot,
                ServiceId = dto.ServiceId,
                Notes = dto.Notes,
                CreatedAt = DateTime.UtcNow
            };

            _context.Appointments.Add(appointment);
            await _context.SaveChangesAsync();

            // Include service details in response
            await _context.Entry(appointment).Reference(a => a.Service).LoadAsync();

            return CreatedAtAction(nameof(GetAppointments), new { id = appointment.Id }, appointment);
        }

        // DELETE: api/appointments/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> CancelAppointment(int id, [FromQuery] int barberId)
        {
            var appointment = await _context.Appointments.FindAsync(id);
            if (appointment == null)
            {
                return NotFound("نوبت مورد نظر یافت نشد.");
            }

            if (appointment.BarberId != barberId)
            {
                return Unauthorized("شما مجاز به لغو نوبت‌های آرایشگرهای دیگر نیستید.");
            }

            _context.Appointments.Remove(appointment);
            await _context.SaveChangesAsync();

            return Ok(new { message = "نوبت با موفقیت لغو شد." });
        }

        // Helper string hashing for clean, representation code
        private static string SimpleHash(string password)
        {
            using (var sha256 = System.Security.Cryptography.SHA256.Create())
            {
                var bytes = System.Text.Encoding.UTF8.GetBytes(password);
                var hash = sha256.ComputeHash(bytes);
                return Convert.ToBase64String(hash);
            }
        }
    }

    // --- REVENUE DATA TRANSFER OBJECTS ---

    public class RegisterBarberDto
    {
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string? SalonName { get; set; }
    }

    public class LoginDto
    {
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class BarberDto
    {
        public int Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string? SalonName { get; set; }
    }

    public class AppointmentDto
    {
        public int BarberId { get; set; }
        public string ClientName { get; set; } = string.Empty;
        public string ClientPhone { get; set; } = string.Empty;
        public DateTime Date { get; set; }
        public string TimeSlot { get; set; } = string.Empty;
        public int ServiceId { get; set; }
        public string? Notes { get; set; }
    }
}
