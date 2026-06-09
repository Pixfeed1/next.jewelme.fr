import type { ExtraField } from '@/lib/presta';

export default function ShopExtras({ extras }: { extras: ExtraField[] }) {
  if (!extras || extras.length === 0) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20, maxWidth: 600 }}>
      {extras.map((e) => (
        <div
          key={e.id}
          className={`shop-extra ${e.customClass || ''}`}
          dangerouslySetInnerHTML={{ __html: e.content }}
        />
      ))}
    </div>
  );
}
