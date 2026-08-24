import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function OwnerOnlyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  
  if (!user || user.role !== "OWNER") {
    return (
      <div className="flex-1 flex items-center justify-center p-10">
        <div className="text-center bg-white p-8 rounded-2xl shadow-sm border border-red-100 max-w-md">
          <h2 className="text-2xl font-display text-red-600 mb-2">Brak dostępu</h2>
          <p className="text-gray-500">Tylko właściciel salonu ma dostęp do tej sekcji.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
