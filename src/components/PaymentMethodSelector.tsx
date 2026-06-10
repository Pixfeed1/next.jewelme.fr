'use client';

export interface PaymentOption {
  id: string;
  label: string;
  note?: string;
  /** affiche un petit logo CB (option carte bancaire) */
  card?: boolean;
}

interface Props {
  options: PaymentOption[];
  selected: string;
  onSelect: (id: string) => void;
}

function CardLogos() {
  return (
    <span style={{ display: 'inline-flex', gap: 4, marginLeft: 'auto', alignItems: 'center' }} aria-hidden="true">
      {/* CB */}
      <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', background: '#2b3a8c', borderRadius: 3, padding: '2px 5px', letterSpacing: '0.5px' }}>CB</span>
      {/* Visa */}
      <span style={{ fontSize: 11, fontWeight: 700, fontStyle: 'italic', color: '#1a1f71' }}>VISA</span>
      {/* Mastercard */}
      <span style={{ display: 'inline-flex', alignItems: 'center' }}>
        <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#eb001b', display: 'inline-block' }} />
        <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#f79e1b', display: 'inline-block', marginLeft: -5, opacity: 0.9 }} />
      </span>
    </span>
  );
}

export default function PaymentMethodSelector({ options, selected, onSelect }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {options.map((m) => {
        const isSel = selected === m.id;
        return (
          <label key={m.id} style={{
            display: 'block', padding: 16,
            border: isSel ? '2px solid #3f6e51' : '1px solid #e5e0d6',
            borderRadius: 4, cursor: 'pointer', background: isSel ? '#f0f7f2' : '#fff',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input type="radio" name="payment" checked={isSel} onChange={() => onSelect(m.id)} />
              <strong style={{ fontSize: 14 }}>{m.label}</strong>
              {m.card && <CardLogos />}
            </div>
            {isSel && m.note && (
              <p style={{ marginTop: 8, marginLeft: 28, fontSize: 13, color: '#666', lineHeight: 1.5 }}>{m.note}</p>
            )}
          </label>
        );
      })}
    </div>
  );
}
