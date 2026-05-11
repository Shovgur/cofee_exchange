import BottomNav from "@/components/navigation/BottomNav";
import DesktopSidebar from "@/components/navigation/DesktopSidebar";
import type { ReactNode } from "react";

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-lvh bg-bg">
      {/* Desktop sidebar (hidden on mobile) */}
      <DesktopSidebar />

      <div className="lg:ml-64">
        {/* Desktop: inner page wrapper */}
        <div className="lg:max-w-none">
          <div className="max-w-lg mx-auto lg:max-w-none lg:mx-0 relative flex flex-col max-lg:h-[100dvh] max-lg:max-h-[100dvh] max-lg:min-h-0 max-lg:overflow-hidden lg:min-h-screen lg:h-auto lg:max-h-none lg:overflow-visible">
            <main className="flex flex-1 min-h-0 flex-col overflow-y-auto overflow-x-visible scrollable bg-bg pt-[env(safe-area-inset-top,0px)] pb-nav-safe lg:overflow-visible lg:pb-0 lg:pt-0">
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
