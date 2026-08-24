const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { getBookableDaysOverview } = require('./src/lib/availability');

async function main() {
  const service = await prisma.service.findFirst();
  const emp = await prisma.employee.findFirst();
  if(!service || !emp) return console.log("No data");
  
  // mock db import inside availability.ts will fail if we just run it because it's a TS module?
  // Let's just write the overview logic here
}
main();
