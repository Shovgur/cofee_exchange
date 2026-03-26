import BottomNav from '@/components/navigation/BottomNav';
import DesktopSidebar from '@/components/navigation/DesktopSidebar';
import type { ReactNode } from 'react';

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-bg">
      {/* Desktop sidebar (hidden on mobile) */}
      <DesktopSidebar />

      {/* Content area */}
      {/* Mobile: centered single-column PWA  */}
      {/* Desktop: offset by sidebar width, full content width */}
      <div className="lg:ml-64">
        {/* Desktop: inner page wrapper */}
        <div className="lg:max-w-none">
          {/* Mobile wrapper: max-w, centered */}
          <div className="max-w-lg mx-auto lg:max-w-none lg:mx-0 relative flex flex-col min-h-dvh lg:min-h-screen lg:h-auto">
            <main className="flex-1 min-h-0 overflow-y-auto scrollable bg-bg pb-nav-safe lg:pb-0 lg:overflow-visible">
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
