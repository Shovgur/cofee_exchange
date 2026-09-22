import { loyaltyDownload } from '@/lib/api/loyalty/client';

export async function downloadAdminExport(
  kind: 'users' | 'coupons' | 'transactions' | 'receipts',
  params: Record<string, string | number | boolean | undefined | null> = {},
): Promise<void> {
  const { blob, filename } = await loyaltyDownload(`admin/exports/${kind}`, params);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
