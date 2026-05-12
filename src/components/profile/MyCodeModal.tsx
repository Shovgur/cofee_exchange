"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { cn } from "@/lib/utils";
import Modal from "@/components/ui/Modal";

function DemoBarcode({ value }: { value: string }) {
  const digits = value.replace(/\D/g, "") || "12345678";
  const bars: number[] = [];
  let seed = 0;
  for (let i = 0; i < digits.length; i++)
    seed += digits.charCodeAt(i) * (i + 1);
  for (let i = 0; i < 48; i++) {
    const v = Math.abs(Math.sin(seed + i * 1.7)) * 100;
    bars.push(1 + Math.round((v % 5) + (i % 3)));
  }
  return (
    <div className="flex h-14 w-full items-end justify-center gap-[2px] px-2">
      {bars.map((w, i) => (
        <div
          key={i}
          className="rounded-[1px] bg-neutral-900"
          style={{ width: `${w}px`, height: `${28 + (i % 5) * 8}px` }}
        />
      ))}
    </div>
  );
}

type Tab = "barcode" | "qr";

interface Props {
  open: boolean;
  onClose: () => void;
  displayCode: string;
  qrPayload: string;
}

export default function MyCodeModal({
  open,
  onClose,
  displayCode,
  qrPayload,
}: Props) {
  const [tab, setTab] = useState<Tab>("barcode");

  useEffect(() => {
    if (open) setTab("barcode");
  }, [open]);

  return (
    <Modal open={open} onClose={onClose} title="Мой код">
      <div className="space-y-4">
        <div className="flex rounded-2xl bg-surface-el p-1">
          <button
            type="button"
            onClick={() => setTab("barcode")}
            className={cn(
              "flex-1 rounded-xl py-2.5 text-sm font-semibold transition-colors",
              tab === "barcode" ? "bg-orange text-white" : "text-muted",
            )}
          >
            Штрихкод
          </button>
          <button
            type="button"
            onClick={() => setTab("qr")}
            className={cn(
              "flex-1 rounded-xl py-2.5 text-sm font-semibold transition-colors",
              tab === "qr" ? "bg-orange text-white" : "text-muted",
            )}
          >
            QR-код
          </button>
        </div>

        {tab === "barcode" ? (
          <div className="rounded-3xl bg-white p-6 shadow-inner">
            <DemoBarcode value={displayCode} />
            <p className="mt-4 text-center font-mono text-lg font-semibold tracking-widest text-neutral-900 tabular-nums">
              {displayCode}
            </p>
          </div>
        ) : (
          <div className="flex justify-center rounded-3xl bg-white p-6">
            <QRCodeSVG
              value={qrPayload}
              size={200}
              bgColor="#FFFFFF"
              fgColor="#2F241C"
              level="M"
            />
          </div>
        )}

        <p className="text-center text-xs text-muted leading-relaxed">
          Покажите этот код на кассе для начисления Бинов
        </p>
      </div>
    </Modal>
  );
}
