import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import {
  defaultTvMenuDocument,
  normalizeTvMenuDocument,
  type TvMenuDocument,
} from '@/lib/tv-menu/config';

export const dynamic = 'force-dynamic';

/**
 * Конфиг ТВ-меню хранится на стороне Next-сервера, чтобы телевизор в кофейне
 * видел то же, что настроил админ на другом устройстве. Своего API под
 * кастомизацию ТВ-меню у бэкенда нет.
 */
const CONFIG_PATH = process.env.TV_MENU_CONFIG_PATH
  ? path.resolve(process.env.TV_MENU_CONFIG_PATH)
  : path.join(process.cwd(), '.data', 'tv-menu-config.json');

// Резервная копия в памяти: на read-only ФС (serverless) запись упадёт,
// но в пределах живого инстанса конфиг продолжит работать.
let memoryDoc: TvMenuDocument | null = null;

async function readDoc(): Promise<TvMenuDocument> {
  try {
    const raw = await fs.readFile(CONFIG_PATH, 'utf8');
    return normalizeTvMenuDocument(JSON.parse(raw));
  } catch {
    return memoryDoc ?? defaultTvMenuDocument();
  }
}

async function writeDoc(doc: TvMenuDocument): Promise<{ persisted: boolean }> {
  memoryDoc = doc;
  try {
    await fs.mkdir(path.dirname(CONFIG_PATH), { recursive: true });
    await fs.writeFile(CONFIG_PATH, JSON.stringify(doc, null, 2), 'utf8');
    return { persisted: true };
  } catch {
    return { persisted: false };
  }
}

export async function GET() {
  const doc = await readDoc();
  return NextResponse.json(doc, { headers: { 'Cache-Control': 'no-store' } });
}

export async function PUT(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Некорректный JSON' }, { status: 400 });
  }

  const doc = normalizeTvMenuDocument(body);
  doc.updatedAt = new Date().toISOString();

  const { persisted } = await writeDoc(doc);
  return NextResponse.json(
    { ...doc, persisted },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
