import { db } from "./src/lib/db";
import { getBookableDaysOverview } from "./src/lib/availability";

async function main() {
  const settings = await db.bookingSettings.findFirst();
  console.log("Settings:", settings);
  const employee = await db.employee.findFirst();
  console.log("Employee ID:", employee?.id);
  const service = await db.service.findFirst();
  console.log("Service Duration:", service?.durationMin);

  if(employee && service) {
    const days = await getBookableDaysOverview(employee.id, service.durationMin);
    console.log("Available days:", days.filter(d => d.hasSlots).length, "/", days.length);
    console.log("First day:", days[0]);
  }
}

main().catch(console.error).finally(() => process.exit(0));
