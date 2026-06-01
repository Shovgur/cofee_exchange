'use client';

import BottomNav from "@/components/navigation/BottomNav";
import DesktopSidebar from "@/components/navigation/DesktopSidebar";
import type { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useRef } from "react";
import { cn } from "@/lib/utils";

const NAV_PAGES = ['/feed', '/map', '/menu', '/coupons', '/profile'];

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
      <DesktopSidebar />

      <div className="lg:ml-64">
        <div className="lg:max-w-none">
          {/* Mobile PWA: fixed на весь экран + один safe-area сверху на оболочке, не на <main> */}
          <div
            className={cn(
              'app-mobile-shell relative mx-auto flex w-full max-w-lg flex-col bg-bg',
              'max-lg:fixed max-lg:inset-0 max-lg:z-0 max-lg:overflow-hidden',
              'lg:max-w-none lg:mx-0 lg:static lg:min-h-screen lg:overflow-visible',
            )}
          >
            <main
              className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-visible scrollable bg-bg pb-nav-safe lg:overflow-visible lg:pb-0"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              {children}
            </main>
            <div className="lg:hidden shrink-0">
              <BottomNav />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
