"use client";

import Link from "next/link";
import {
  LayoutGrid,
  SlidersHorizontal,
  GlassWater,
  ShoppingCart,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const SECTIONS = [
  {
    href: "/admin/settings",
    title: "Настройки",
    description: "Параметры движка цен и принудительный пересчёт",
    icon: SlidersHorizontal,
  },
  {
    href: "/admin/drinks",
    title: "Напитки",
    description: "Каталог, цены и статусы позиций",
    icon: GlassWater,
  },
  {
    href: "/admin/sales",
    title: "Продажи",
    description: "Тестовые продажи для проверки биржи",
    icon: ShoppingCart,
  },
] as const;

export default function AdminHubPage() {
  return (
    <div className="min-h-full pb-8 sm:pb-12">
      <div className="border-b border-border bg-bg/95 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-4 backdrop-blur-md sm:px-4 lg:px-8 lg:pt-8">
        <div className="mx-auto flex max-w-3xl items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange/15">
            <LayoutGrid size={22} className="text-orange" />
          </div>
          <div className="min-w-0 pt-0.5">
            <h1 className="text-xl font-bold leading-tight sm:text-2xl">
              Админ
            </h1>
            <p className="mt-1 text-xs text-muted sm:text-sm">
              Выберите раздел — на телефоне все инструменты доступны отсюда.
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-5 w-full max-w-3xl space-y-3 px-3 sm:mt-8 sm:space-y-4 sm:px-4 lg:px-8">
        {SECTIONS.map(({ href, title, description, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-4 rounded-2xl border border-border bg-surface p-4",
              "min-h-[4.5rem] transition-colors active:bg-surface-el",
              "hover:border-orange/40 hover:bg-surface-el sm:p-5",
            )}
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange/12">
              <Icon size={22} className="text-orange" strokeWidth={1.9} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-white">{title}</div>
              <p className="mt-0.5 text-[13px] leading-snug text-muted sm:text-sm">
                {description}
              </p>
            </div>
            <ChevronRight
              className="shrink-0 text-muted"
              size={20}
              strokeWidth={2}
            />
          </Link>
        ))}
      </div>
    </div>
  );
}
