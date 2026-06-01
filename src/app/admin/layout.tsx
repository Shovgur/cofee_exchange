'use client';

import type { ReactNode } from 'react';
import AuthGate from '@/components/auth/AuthGate';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import AdminDesktopOnly from '@/components/admin/AdminDesktopOnly';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGate fallbackMessage="Войдите в аккаунт, чтобы открыть админ-панель.">
      <AdminDesktopOnly>
        <div className="min-h-lvh bg-bg">
          <AdminSidebar />
          <div className="flex min-h-lvh flex-col pl-64">
            <AdminHeader />
            <main className="flex-1 overflow-y-auto">{children}</main>
          </div>
        </div>
      </AdminDesktopOnly>
    </AuthGate>
  );
}
