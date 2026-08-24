"use client";

import { SWRConfig } from "swr";
import { fetcher } from "@/lib/fetcher";
import { usePathname } from "next/navigation";
import PanelNav from "@/components/PanelNav";

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === "/panel/login";

  return (
    <div className="flex flex-col min-h-screen bg-[var(--background)]">
      <SWRConfig value={{ fetcher, revalidateOnFocus: false, dedupingInterval: 10000 }}>
        {!isLogin && <PanelNav />}
        {children}
      </SWRConfig>
    </div>
  );
}
