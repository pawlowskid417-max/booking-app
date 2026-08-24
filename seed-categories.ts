import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

async function main() {
  const services = await db.service.findMany();
  
  for (const s of services) {
    let category = "Inne";
    const name = s.name.toLowerCase();
    
    if (name.includes("manicure") || name.includes("żel") || name.includes("przedłużanie") || name.includes("hybryd") || name.includes("uzupełnienie")) {
      category = "Manicure";
    } else if (name.includes("pedicure") || name.includes("stóp") || name.includes("stop")) {
      category = "Pedicure";
    } else if (name.includes("brwi") || name.includes("rzęs") || name.includes("henna")) {
      category = "Brwi i Rzęsy";
    } else if (name.includes("masaż") || name.includes("spa")) {
      category = "SPA";
    }
    
    await db.service.update({
      where: { id: s.id },
      data: { category }
    });
    console.log(`Updated ${s.name} -> ${category}`);
  }
}

main().catch(e => console.error(e)).finally(() => db.$disconnect());
