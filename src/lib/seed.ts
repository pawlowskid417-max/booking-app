import { PrismaClient } from '@prisma/client';
import { scryptSync, randomBytes } from "crypto";

const db = new PrismaClient();

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

async function run() {
  console.log("Czyszczenie bazy...");
  await db.notificationLog.deleteMany();
  await db.appointment.deleteMany();
  await db.dayOverride.deleteMany();
  await db.workingHour.deleteMany();
  await db.employeeService.deleteMany();
  await db.service.deleteMany();
  await db.employee.deleteMany();
  await db.user.deleteMany();
  await db.bookingSettings.deleteMany();

  console.log("Ustawienia rezerwacji...");
  await db.bookingSettings.create({
    data: {
      id: 'singleton',
      bookingWindowDays: 30,
      minLeadTimeHours: 2,
      slotStepMinutes: 30,
      autoConfirmBookings: true,
      salonName: 'Studio Paznokci Bella',
      salonPhone: '+48 600 100 200',
      salonAddress: 'ul. Kwiatowa 12, Warszawa',
      contactEmail: 'kontakt@studiobella.pl'
    }
  });

  console.log("Tworzenie użytkownika właściciela...");
  const owner = await db.user.create({
    data: {
      email: "wlasciciel@studiobella.pl",
      passwordHash: hashPassword("admin123"),
      role: 'OWNER'
    }
  });

  console.log("Tworzenie pracowników...");
  const anna = await db.employee.create({
    data: {
      firstName: 'Anna',
      lastName: 'Kowalska',
      bio: 'Specjalistka manicure hybrydowego i zdobień, 8 lat doświadczenia.',
      isActive: true,
      displayOrder: 0,
      userId: owner.id
    }
  });

  const kasia = await db.employee.create({
    data: {
      firstName: 'Kasia',
      lastName: 'Nowak',
      bio: 'Ekspertka pedicure i przedłużania paznokci żelem.',
      isActive: true,
      displayOrder: 1
    }
  });

  console.log("Tworzenie usług...");
  const servicesData = [
    { name: "Manicure hybrydowy", desc: "Klasyczny manicure z lakierem hybrydowym", duration: 60, price: 12000 },
    { name: "Manicure hybrydowy + zdobienia", desc: "Manicure z artystycznymi zdobieniami", duration: 90, price: 16000 },
    { name: "Przedłużanie paznokci żelem", desc: "Przedłużanie na formach lub tipsach", duration: 120, price: 22000 },
    { name: "Pedicure klasyczny", desc: "Pielęgnacja stóp z lakierowaniem", duration: 60, price: 14000 },
    { name: "Uzupełnienie żelu", desc: "Uzupełnienie odrostu przy przedłużanych paznokciach", duration: 90, price: 18000 },
  ];

  const createdServices = [];
  for (const [idx, s] of servicesData.entries()) {
    const created = await db.service.create({
      data: {
        name: s.name,
        description: s.desc,
        durationMin: s.duration,
        priceCents: s.price,
        isActive: true,
        displayOrder: idx
      }
    });
    createdServices.push(created);
  }

  console.log("Przypisywanie usług do pracowników...");
  for (const s of createdServices) {
    await db.employeeService.create({
      data: { employeeId: anna.id, serviceId: s.id }
    });
  }

  const kasiaServiceNames = ["Manicure hybrydowy", "Pedicure klasyczny", "Uzupełnienie żelu"];
  for (const s of createdServices) {
    if (kasiaServiceNames.includes(s.name)) {
      await db.employeeService.create({
        data: { employeeId: kasia.id, serviceId: s.id }
      });
    }
  }

  console.log("Tworzenie grafiku pracy...");
  const annaHours = [
    { weekday: 1, start: "09:00", end: "17:00" },
    { weekday: 2, start: "09:00", end: "17:00" },
    { weekday: 3, start: "09:00", end: "17:00" },
    { weekday: 4, start: "09:00", end: "17:00" },
    { weekday: 5, start: "09:00", end: "17:00" },
    { weekday: 6, start: "09:00", end: "14:00" },
  ];
  for (const h of annaHours) {
    await db.workingHour.create({
      data: { employeeId: anna.id, weekday: h.weekday, startTime: h.start, endTime: h.end, isActive: true }
    });
  }

  const kasiaHours = [
    { weekday: 2, start: "10:00", end: "18:00" },
    { weekday: 3, start: "10:00", end: "18:00" },
    { weekday: 4, start: "10:00", end: "18:00" },
    { weekday: 5, start: "10:00", end: "18:00" },
    { weekday: 6, start: "10:00", end: "16:00" },
  ];
  for (const h of kasiaHours) {
    await db.workingHour.create({
      data: { employeeId: kasia.id, weekday: h.weekday, startTime: h.start, endTime: h.end, isActive: true }
    });
  }

  console.log("Gotowe! Dane testowe:");
  console.log("  Panel: /panel/login");
  console.log("  Email: wlasciciel@studiobella.pl");
  console.log("  Hasło: admin123");
}

run().then(() => db.$disconnect()).catch(async (e) => {
  console.error(e);
  await db.$disconnect();
  process.exit(1);
});
