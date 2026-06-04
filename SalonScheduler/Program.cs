using Microsoft.EntityFrameworkCore;
using SalonScheduler.Data;

var builder = WebApplication.CreateBuilder(args);

// ۱. فعالسازی اتصال دیتابیس SQL Server به همراه اطلاعات کانکشن موجود در appsettings
builder.Services.AddDbContext<SalonDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddControllers();

// اضافه کردن مستندات اختیاری API
builder.Services.AddEndpointsApiExplorer();

var app = builder.Build();

app.UseHttpsRedirection();

// ۲. فعال‌سازی قابلیت لود سایت استاتیک (HTML, CSS, JS) از پوشه wwwroot
app.UseDefaultFiles();
app.UseStaticFiles();

app.UseAuthorization();
app.MapControllers();

app.Run();