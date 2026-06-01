"use client";

import type { ReactNode } from "react";
import { User, Phone, Globe, Hash } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCountry } from "@/contexts/CountryContext";

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-border bg-surface px-5 py-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange/12 text-orange">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wider text-muted">
          {label}
        </p>
        <p className="mt-1 text-base font-semibold leading-snug">{value}</p>
      </div>
    </div>
  );
}

export default function AdminAccountPage() {
  const { user } = useAuth();
  const { country } = useCountry();

  if (!user) return null;

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center gap-5">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-orange/20">
          <User size={36} className="text-orange" />
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold leading-tight">{user.name}</h1>
          <p className="mt-1 text-sm text-muted">
            Учётная запись администратора в Coffee Exchange
          </p>
        </div>
      </div>

      <div className="grid max-w-2xl gap-3">
        <InfoRow icon={<Phone size={18} />} label="Телефон" value={user.phone} />
        <InfoRow icon={<Hash size={18} />} label="ID пользователя" value={user.id} />
        <InfoRow icon={<Globe size={18} />} label="Страна" value={`${country.flag} ${country.name}`} />
      </div>
    </div>
  );
}
