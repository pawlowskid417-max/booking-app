const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  console.log("Settings:", await prisma.bookingSettings.findFirst());
  console.log("Working hours count:", await prisma.workingHour.count());
  const hours = await prisma.workingHour.findMany();
  console.log("First working hour:", hours[0]);
}
main().finally(() => prisma.$disconnect());
