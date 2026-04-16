"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export function AdminMobileBackLink() {
  return (
    <div className="sticky top-0 z-[30] border-b border-border bg-bg/98 px-3 py-2.5 pt-[max(0.5rem,env(safe-area-inset-top))] backdrop-blur-md lg:hidden">
      <Link
        href="/admin"
        className="inline-flex items-center gap-0.5 text-sm text-muted transition-colors hover:text-white"
      >
        <ChevronLeft size={18} strokeWidth={2} />
        Все разделы
      </Link>
    </div>
  );
}
