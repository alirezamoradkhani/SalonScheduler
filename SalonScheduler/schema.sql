CREATE TABLE [Barbers] (
    [Id] INT IDENTITY(1,1) NOT NULL,
    [FullName] NVARCHAR(150) NOT NULL,
    [Username] NVARCHAR(50) NOT NULL,
    [PasswordHash] NVARCHAR(255) NOT NULL,
    [SalonName] NVARCHAR(150) NULL,
    [CreatedAt] DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT [PK_Barbers] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [UQ_Barbers_Username] UNIQUE ([Username])
);

CREATE TABLE [Services] (
    [Id] INT IDENTITY(1,1) NOT NULL,
    [NameFa] NVARCHAR(100) NOT NULL,
    [NameEn] NVARCHAR(100) NOT NULL,
    [Price] DECIMAL(18, 2) NOT NULL,
    [DurationMin] INT NOT NULL,
    CONSTRAINT [PK_Services] PRIMARY KEY CLUSTERED ([Id] ASC)
);

CREATE TABLE [Appointments] (
    [Id] INT IDENTITY(1,1) NOT NULL,
    [BarberId] INT NOT NULL, 
    [ClientName] NVARCHAR(150) NOT NULL,
    [ClientPhone] NVARCHAR(20) NOT NULL,
    [Date] DATE NOT NULL,
    [TimeSlot] NVARCHAR(10) NOT NULL,
    [ServiceId] INT NOT NULL,
    [Notes] NVARCHAR(500) NULL,
    [CreatedAt] DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT [PK_Appointments] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [FK_Appointments_Barbers] FOREIGN KEY ([BarberId]) REFERENCES [Barbers] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_Appointments_Services] FOREIGN KEY ([ServiceId]) REFERENCES [Services] ([Id]) ON DELETE CASCADE
);

CREATE UNIQUE INDEX [UX_Appointments_Barber_Date_TimeSlot]
ON [Appointments] ([BarberId], [Date], [TimeSlot]);

-- Seed default services
INSERT INTO [Services] ([NameFa], [NameEn], [Price], [DurationMin]) VALUES
(N'اصلاح مو (کلاسیک)', 'Haircut (Classic)', 150000, 45),
(N'اصلاح ریش و خط دور', 'Beard Trim & Lineup', 80000, 30),
(N'پکیج داماد / VIP', 'VIP Grooming Suite', 500000, 120),
(N'پاکسازی پوست و اسکراب', 'Facial & Skin Care', 120000, 40),
(N'رنگ مو / دکلره', 'Hair Coloring', 250000, 90);
