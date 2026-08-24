import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/panel/login");
  }

  return <>{children}</>;
}
