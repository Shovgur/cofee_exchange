'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Monitor,
  Plus,
  Trash2,
  Copy,
  ExternalLink,
  Link2,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Pencil,
  Layers,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { fetchTvMenuDocument, saveTvMenuDocument } from '@/lib/tv-menu/api';
import {
  defaultBoard,
  makeId,
  type TvBoardConfig,
  type TvMenuDocument,
} from '@/lib/tv-menu/config';
import { cn } from '@/lib/utils';

function boardUrl(board: TvBoardConfig): string {
  return `/tv-menu/${board.id}`;
}

function countPositions(board: TvBoardConfig): number {
  return board.screens.reduce(
    (sum, s) => sum + s.sections.reduce((n, sec) => n + sec.items.length, 0),
    0,
  );
}

export default function AdminTvMenuListPage() {
  const router = useRouter();
  const [doc, setDoc] = useState<TvMenuDocument | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    fetchTvMenuDocument()
      .then(setDoc)
      .catch((e) => setError(e instanceof Error ? e.message : 'Ошибка загрузки'));
  }, []);

  const persist = useCallback(async (next: TvMenuDocument, message: string) => {
    setBusy(true);
    try {
      const { doc: saved, persisted } = await saveTvMenuDocument(next);
      setDoc(saved);
      showToast(persisted ? message : 'Сохранено только в памяти сервера', persisted);
      return saved;
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Ошибка сохранения', false);
      return null;
    } finally {
      setBusy(false);
    }
  }, []);

  const addBoard = async () => {
    if (!doc) return;
    const board = defaultBoard(`Меню ${doc.boards.length + 1}`);
    const saved = await persist({ ...doc, boards: [...doc.boards, board] }, 'Доска создана');
    if (saved) router.push(`/admin/tv-menu/${board.id}`);
  };

  const duplicateBoard = async (board: TvBoardConfig) => {
    if (!doc) return;
    const copy: TvBoardConfig = {
      ...structuredClone(board),
      id: makeId('board'),
      name: `${board.name} (копия)`,
    };
    await persist({ ...doc, boards: [...doc.boards, copy] }, 'Доска скопирована');
  };

  const removeBoard = async (board: TvBoardConfig) => {
    if (!doc) return;
    const boards = doc.boards.filter((b) => b.id !== board.id);
    await persist(
      { ...doc, boards: boards.length > 0 ? boards : [defaultBoard()] },
      'Доска удалена',
    );
  };

  const copyLink = async (board: TvBoardConfig) => {
    const url = `${window.location.origin}${boardUrl(board)}`;
    try {
      await navigator.clipboard.writeText(url);
      showToast('Ссылка скопирована', true);
    } catch {
      showToast(url, true);
    }
  };

  if (!doc && !error) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={28} className="animate-spin text-muted" />
      </div>
    );
  }

  return (
    <>
      {toast && (
        <div className={cn(
          'fixed bottom-6 left-1/2 z-[9999] flex -translate-x-1/2 items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg',
          toast.ok ? 'bg-green-500' : 'bg-danger',
        )}>
          {toast.ok ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          {toast.msg}
        </div>
      )}

      <div className="max-w-4xl p-8">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="mb-1 text-2xl font-bold">ТВ-меню</h1>
            <p className="text-sm text-muted">
              Каждая доска — отдельная ссылка со своим оформлением и экранами.
              Настройки одной доски не влияют на остальные.
            </p>
          </div>
          <Button onClick={addBoard} disabled={busy} className="flex items-center gap-2">
            <Plus size={16} /> Новая доска
          </Button>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
            <AlertTriangle size={16} /> {error}
          </div>
        )}

        <div className="space-y-3">
          {doc?.boards.map((board) => {
            const positions = countPositions(board);
            return (
              <div
                key={board.id}
                className="rounded-2xl border border-border bg-surface p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex min-w-0 items-start gap-4">
                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                      style={{
                        background: `color-mix(in srgb, ${board.theme.accent} 15%, transparent)`,
                        color: board.theme.accent,
                      }}
                    >
                      <Monitor size={20} />
                    </div>
                    <div className="min-w-0">
                      <h2 className="truncate text-base font-semibold">{board.name}</h2>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                        <span className="flex items-center gap-1">
                          <Layers size={11} />
                          {board.screens.length === 0
                            ? 'вся доска автоматически'
                            : `${board.screens.length} экр. · ${positions} поз.`}
                        </span>
                        <span>{board.theme.background === 'dark' ? 'тёмная' : 'светлая'}</span>
                        <span>{board.layout.screenDiagonalCm} см</span>
                        {board.rotation.enabled && board.screens.length > 1 && (
                          <span>ротация {board.rotation.intervalSec} с</span>
                        )}
                      </div>
                      <code className="mt-2 inline-block rounded-md bg-surface-el px-2 py-1 text-[11px] text-muted">
                        {boardUrl(board)}
                      </code>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => copyLink(board)}
                      title="Скопировать ссылку"
                      className="rounded-xl border border-border p-2.5 text-muted transition-colors hover:text-foreground"
                    >
                      <Link2 size={15} />
                    </button>
                    <a
                      href={boardUrl(board)}
                      target="_blank"
                      rel="noreferrer"
                      title="Открыть экран"
                      className="rounded-xl border border-border p-2.5 text-muted transition-colors hover:text-foreground"
                    >
                      <ExternalLink size={15} />
                    </a>
                    <button
                      type="button"
                      onClick={() => duplicateBoard(board)}
                      disabled={busy}
                      title="Дублировать"
                      className="rounded-xl border border-border p-2.5 text-muted transition-colors hover:text-foreground disabled:opacity-40"
                    >
                      <Copy size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeBoard(board)}
                      disabled={busy}
                      title="Удалить"
                      className="rounded-xl border border-border p-2.5 text-muted transition-colors hover:border-danger/40 hover:text-danger disabled:opacity-40"
                    >
                      <Trash2 size={15} />
                    </button>
                    <Button
                      onClick={() => router.push(`/admin/tv-menu/${board.id}`)}
                      className="ml-1 flex items-center gap-2"
                    >
                      <Pencil size={15} /> Настроить
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
