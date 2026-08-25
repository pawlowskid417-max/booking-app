"use client";

import { SWRConfig } from "swr";
import { fetcher } from "@/lib/fetcher";
import { usePathname } from "next/navigation";
import PanelNav from "@/components/PanelNav";
import { AnimatePresence, motion } from "motion/react";

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === "/panel/login";

  return (
    <div className="flex flex-col min-h-screen bg-[var(--background)]">
      <SWRConfig value={{ fetcher, revalidateOnFocus: false, dedupingInterval: 10000 }}>
        {!isLogin && <PanelNav />}
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15, ease: "easeInOut" }}
            className="flex-1 flex flex-col"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </SWRConfig>
    </div>
  );
}
