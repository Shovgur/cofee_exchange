'use client';

import BottomNav from "@/components/navigation/BottomNav";
import DesktopSidebar from "@/components/navigation/DesktopSidebar";
import type { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useCallback } from "react";
import { useRef } from "react";

const NAV_PAGES = ['/feed', '/map', '/menu', '/coupons', '/admin', '/profile'];

function resolvePageIndex(pathname: string): number {
  if (pathname === '/' || pathname === '/feed') return 0;
  for (let i = 1; i < NAV_PAGES.length; i++) {
    if (pathname.startsWith(NAV_PAGES[i])) return i;
  }
  return -1;
}

export default function MainLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    touchStartX.current = null;
    touchStartY.current = null;

    // Only react to clearly horizontal swipes
    if (Math.abs(dx) < 80 || Math.abs(dy) > Math.abs(dx) * 0.6) return;

    const idx = resolvePageIndex(pathname);
    if (idx === -1) return;

    if (dx < 0 && idx < NAV_PAGES.length - 1) {
      // Swipe left → next page
      router.push(NAV_PAGES[idx + 1]);
    } else if (dx > 0 && idx > 0) {
      // Swipe right → previous page
      router.push(NAV_PAGES[idx - 1]);
    }
  }, [pathname, router]);

  return (
    <div className="min-h-lvh bg-bg">
      {/* Desktop sidebar (hidden on mobile) */}
      <DesktopSidebar />

      <div className="lg:ml-64">
        {/* Desktop: inner page wrapper */}
        <div className="lg:max-w-none">
          <div className="max-w-lg mx-auto lg:max-w-none lg:mx-0 relative flex flex-col max-lg:h-[100dvh] max-lg:max-h-[100dvh] max-lg:min-h-0 max-lg:overflow-hidden lg:min-h-screen lg:h-auto lg:max-h-none lg:overflow-visible">
            <main
              className="flex flex-1 min-h-0 flex-col overflow-y-auto overflow-x-visible scrollable bg-bg pt-[env(safe-area-inset-top,0px)] pb-nav-safe lg:overflow-visible lg:pb-0 lg:pt-0"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              {children}
            </main>
            {/* Mobile bottom nav (hidden on desktop) */}
            <div className="lg:hidden">
              <BottomNav />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
