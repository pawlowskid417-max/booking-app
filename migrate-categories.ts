import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const services = await prisma.service.findMany();
  
  const uniqueCategories = Array.from(new Set(services.map(s => s.category).filter(c => !!c)));
  
  console.log("Znalezione unikalne kategorie:", uniqueCategories);
  
  for (const cat of uniqueCategories) {
    await prisma.serviceCategory.upsert({
      where: { name: cat },
      update: {},
      create: { name: cat },
    });
  }
  
  console.log("Kategorie zmigrowane pomyślnie.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
