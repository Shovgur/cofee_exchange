import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Меню — экран Coffee Exchange',
  description: 'Меню для отображения на телевизорах в сети',
};

/**
 * Отдельно от (main): без сайдбара и нижней навигации — только контент для ТВ.
 */
export default function TvMenuLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
