import type { PrestaProduct } from '@/lib/presta';

interface Props {
  product: PrestaProduct;
  position?: 'absolute' | 'static';
}

interface Badge {
  label: string;
  background: string;
  color: string;
}

export default function ProductBadges({ product, position = 'absolute' }: Props) {
  const badges: Badge[] = [];
  // En rupture : on n'affiche pas de badge tape-a-l'oeil
  // (le bouton panier desactive signale deja l'indisponibilite)
  // Mais on n'affiche pas Nouveau/Promo non plus si en rupture
  if ((product.quantity ?? 0) > 0) {
    if (product.isNew) {
      badges.push({ label: 'Nouveau', background: '#1877F2', color: '#fff' });
    }
    if (product.onSale) {
      badges.push({ label: 'Promo', background: '#e63946', color: '#fff' });
    }
  }

  if (badges.length === 0) return null;

  return (
    <div
      style={{
        position,
        top: position === 'absolute' ? 8 : undefined,
        left: position === 'absolute' ? 8 : undefined,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        zIndex: 2,
      }}
    >
      {badges.map((b) => (
        <span
          key={b.label}
          style={{
            background: b.background,
            color: b.color,
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            padding: '4px 10px',
            borderRadius: 2,
            display: 'inline-block',
            width: 'fit-content',
          }}
        >
          {b.label}
        </span>
      ))}
    </div>
  );
}
