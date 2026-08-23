import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "OWNER") {
    return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();

  const data: any = {};

  if (typeof body.firstName === "string") {
    data.firstName = body.firstName.trim();
  }
  if (typeof body.lastName === "string") {
    data.lastName = body.lastName.trim();
  }
  if (typeof body.bio === "string") {
    data.bio = body.bio.trim();
  }
  if (typeof body.isActive === "boolean") {
    data.isActive = body.isActive;
  }

  if (Array.isArray(body.serviceIds)) {
    await db.employeeService.deleteMany({
      where: { employeeId: id }
    });

    if (body.serviceIds.length > 0) {
      data.services = {
        create: body.serviceIds.map((sid: string) => ({
          serviceId: sid
        }))
      };
    }
  }

  if (Object.keys(data).length > 0) {
    await db.employee.update({
      where: { id },
      data
    });
  }

  return NextResponse.json({ success: true });
}
