import BottomNav from "@/components/navigation/BottomNav";
import DesktopSidebar from "@/components/navigation/DesktopSidebar";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-lvh bg-bg">
      <DesktopSidebar />

      <div className="lg:ml-64">
        <div className="lg:max-w-none">
          <div
            className={cn(
              "app-mobile-shell relative mx-auto flex w-full max-w-lg flex-col bg-bg",
              "max-lg:fixed max-lg:inset-0 max-lg:z-0 max-lg:overflow-hidden",
              "lg:max-w-none lg:mx-0 lg:static lg:min-h-screen lg:overflow-visible",
            )}
          >
            <main className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-visible scrollable bg-bg max-lg:pb-3 lg:overflow-visible">
              {children}
            </main>
            <BottomNav />
          </div>
        </div>
      </div>
    </div>
  );
}
