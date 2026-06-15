using System;
using Microsoft.EntityFrameworkCore;

namespace SalonScheduler.Data
{
    public class Barber
    {
        public int Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public string? SalonName { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public class Service
    {
        public int Id { get; set; }
        public string NameFa { get; set; } = string.Empty;
        public string NameEn { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public int DurationMin { get; set; }
    }

    public class Appointment
    {
        public int Id { get; set; }
        public int BarberId { get; set; }
        public string ClientName { get; set; } = string.Empty;
        public string ClientPhone { get; set; } = string.Empty;
        public DateTime Date { get; set; }
        public string TimeSlot { get; set; } = string.Empty;
        public int ServiceId { get; set; }
        public string? Notes { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public Barber? Barber { get; set; }
        public Service? Service { get; set; }
    }

    // Entity Framework Core Database Context
    public class SalonDbContext : DbContext
    {
        public SalonDbContext(DbContextOptions<SalonDbContext> options) : base(options)
        {
        }

        public DbSet<Barber> Barbers { get; set; } = null!;
        public DbSet<Service> Services { get; set; } = null!;
        public DbSet<Appointment> Appointments { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);


            modelBuilder.Entity<Barber>()
                .HasIndex(b => b.Username)
                .IsUnique();
            modelBuilder.Entity<Appointment>()
                .HasIndex(a => new { a.BarberId, a.Date, a.TimeSlot })
                .IsUnique();

            modelBuilder.Entity<Appointment>()
                .HasOne(a => a.Barber)
                .WithMany()
                .HasForeignKey(a => a.BarberId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Appointment>()
                .HasOne(a => a.Service)
                .WithMany()
                .HasForeignKey(a => a.ServiceId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
