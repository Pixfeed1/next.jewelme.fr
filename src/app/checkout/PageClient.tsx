'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { homeUrl, localeHref, cmsUrl } from '@/lib/url-builder';
import { useCart } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth-context';
import { useLocale } from '@/lib/locale-context';
import { trackBeginCheckout } from '@/lib/gtag';
import { useT } from '@/lib/i18n';
import { getProductImageUrl } from '@/lib/presta';
import VoucherForm from '@/components/VoucherForm';
import PaymentMethodSelector, { type PaymentOption } from '@/components/PaymentMethodSelector';
import PayboxRedirectForm from '@/components/PayboxRedirectForm';

const PAYBOX_ID = 'paybox';

interface Country { id: number; iso: string; name: string; need_zip_code: boolean; zip_format: string; contains_states: boolean; }
interface PaymentMethod { id: string; name: string; label: string; instructions: string; }
interface Carrier { id: number; name: string; delay: string; price: number; price_str: string; logo: string | null; is_free: boolean; }
interface InitData { countries: Country[]; payment_methods: PaymentMethod[]; cgv: { id_cms: number; slug: string; title: string } | null; default_country: number; }

type Step = 1 | 2 | 3 | 4;

interface AddressForm {
  alias: string;
  company: string;
  address1: string;
  address2: string;
  postcode: string;
  city: string;
  id_country: number;
  phone: string;
}

const emptyAddr = (idCountry = 8): AddressForm => ({
  alias: 'Mon adresse',
  company: '', address1: '', address2: '',
  postcode: '', city: '', id_country: idCountry, phone: '',
});

export default function CheckoutPage() {
  const { locale } = useLocale();
  const t = useT();
  const { cart, refresh } = useCart();
  const { user } = useAuth();

  // GA4 : begin_checkout
  useEffect(() => {
    if (!cart || !cart.items || cart.items.length === 0) return;
    const items = cart.items.map((it: any) => ({
      item_id: it.id_product,
      item_name: it.name || String(it.id_product),
      price: parseFloat(String(it.price_wt ?? it.price ?? 0)),
      quantity: parseInt(String(it.quantity ?? 1), 10),
    }));
    const value = parseFloat(String(cart.totals?.total ?? 0));
    trackBeginCheckout(items, value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const router = useRouter();

  const [step, setStep] = useState<Step>(1);
  const [init, setInit] = useState<InitData | null>(null);
  const [loadingInit, setLoadingInit] = useState(true);

  // Step 1 - personal
  const [email, setEmail] = useState('');
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');

  // Step 2 - addresses
  const [deliveryAddr, setDeliveryAddr] = useState<AddressForm>(emptyAddr());
  const [useSameAddress, setUseSameAddress] = useState(true);
  const [invoiceAddr, setInvoiceAddr] = useState<AddressForm>(emptyAddr());

  // Step 3 - shipping
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [loadingCarriers, setLoadingCarriers] = useState(false);
  const [idCarrier, setIdCarrier] = useState<number | null>(null);
  const [message, setMessage] = useState('');

  // Step 4 - payment
  const [paymentMethod, setPaymentMethod] = useState<string>(PAYBOX_ID);
  const [acceptCgv, setAcceptCgv] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  // Paybox : redirection vers la page de paiement sécurisée
  const [payboxData, setPayboxData] = useState<{ url: string; fields: Record<string, string | number> } | null>(null);

  const fmt = (n: number) => n.toFixed(2).replace('.', ',') + '\u00a0€';

  // Load init
  useEffect(() => {
    fetch('/api/checkout/init').then(r => r.json()).then((d: InitData) => {
      setInit(d);
      setDeliveryAddr(a => ({ ...a, id_country: d.default_country }));
      setInvoiceAddr(a => ({ ...a, id_country: d.default_country }));
      // La carte bancaire (Paybox) reste sélectionnée par défaut (~70% des commandes)
      setLoadingInit(false);
    });
  }, []);

  // Refresh cart on mount
  useEffect(() => { refresh(); }, []);

  // Pré-remplit l'étape 1 si le client est connecté
  useEffect(() => {
    if (user) {
      setEmail(user.email);
      setFirstname(user.firstname);
      setLastname(user.lastname);
    }
  }, [user]);

  // Load carriers when entering step 3
  useEffect(() => {
    if (step !== 3 || !cart || !deliveryAddr.id_country) return;
    setLoadingCarriers(true);
    const token = localStorage.getItem('pixfeed_cart_token') || '';
    fetch(`/api/checkout/carriers?token=${encodeURIComponent(token)}&id_country=${deliveryAddr.id_country}&postcode=${encodeURIComponent(deliveryAddr.postcode)}`)
      .then(r => r.json())
      .then(d => {
        // Trie les transporteurs du moins cher au plus cher
        const sorted: Carrier[] = [...(d.carriers || [])].sort(
          (a: Carrier, b: Carrier) => (a.price ?? 0) - (b.price ?? 0)
        );
        setCarriers(sorted);
        if (sorted.length > 0 && idCarrier === null) setIdCarrier(sorted[0].id);
        setLoadingCarriers(false);
      })
      .catch(() => setLoadingCarriers(false));
  }, [step]);

  const validStep1 = email.includes('@') && firstname.trim() && lastname.trim();
  const validStep2 = deliveryAddr.address1 && deliveryAddr.postcode && deliveryAddr.city && deliveryAddr.id_country && deliveryAddr.phone
    && (useSameAddress || (invoiceAddr.address1 && invoiceAddr.postcode && invoiceAddr.city && invoiceAddr.id_country && invoiceAddr.phone));
  const validStep3 = idCarrier !== null;
  const validStep4 = paymentMethod !== '' && acceptCgv;

  const handleSubmit = async () => {
    if (!validStep4) return;
    setSubmitting(true);
    setSubmitError('');
    const token = localStorage.getItem('pixfeed_cart_token') || '';
    const orderBody = {
      token, email, firstname, lastname,
      delivery_address: deliveryAddr,
      use_same_address: useSameAddress,
      billing_address: useSameAddress ? undefined : invoiceAddr,
      id_carrier: idCarrier,
      payment_method: paymentMethod,
      message,
      accept_cgv: acceptCgv,
    };
    try {
      // Prépare le panier côté Presta (client + adresses + transporteur attachés)
      const r = await fetch('/api/checkout/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderBody),
      });
      const data = await r.json();
      if (!r.ok || data.success === false || data.error) {
        setSubmitError(data.error || 'Erreur lors de la commande');
        setSubmitting(false);
        return;
      }

      // === Carte bancaire (Paybox) : redirection vers le paiement sécurisé ===
      if (paymentMethod === PAYBOX_ID) {
        const initRes = await fetch('/api/paybox/init', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id_cart: data.id_cart ?? data.cart_id ?? cart?.id_cart,
            id_customer: data.id_customer ?? data.customer_id,
            id_address_delivery: data.id_address_delivery ?? data.id_address,
            id_address_invoice: data.id_address_invoice ?? data.id_address_delivery ?? data.id_address,
            id_carrier: idCarrier,
          }),
        });
        const initData = await initRes.json();
        if (initRes.ok && initData.success && initData.url && initData.fields) {
          // Le formulaire caché s'auto-soumet vers Paybox (loader bloquant affiché)
          setPayboxData({ url: initData.url, fields: initData.fields });
          return; // on reste en submitting → loader affiché jusqu'à la redirection
        }
        setSubmitError(initData.error || 'Erreur lors de l\'initialisation du paiement');
        setSubmitting(false);
        return;
      }

      // === Virement bancaire (comportement inchangé) ===
      if (data.success && data.reference) {
        localStorage.removeItem('pixfeed_cart_token');
        router.push(localeHref(`/confirmation/${data.reference}`, locale));
      } else {
        setSubmitError(data.error || 'Erreur lors de la commande');
        setSubmitting(false);
      }
    } catch (e: any) {
      setSubmitError(e.message || 'Erreur réseau');
      setSubmitting(false);
    }
  };

  if (loadingInit) {
    return <div style={{ padding: 48, textAlign: 'center', color: '#888' }}>Chargement…</div>;
  }
  if (!cart || cart.items.length === 0) {
    return (
      <div style={{ maxWidth: 600, margin: '0 auto', padding: 48, textAlign: 'center' }}>
        <p style={{ fontSize: 16, color: '#888' }}>Votre panier est vide.</p>
        <Link href={homeUrl(locale)} style={{ display: 'inline-block', marginTop: 16, padding: '12px 28px', background: '#a3a2a2', color: '#fff', textDecoration: 'none', borderRadius: 4, fontSize: 13, fontWeight: 600, textTransform: 'uppercase' }}>Retour boutique</Link>
      </div>
    );
  }

  const stepLabels = [t('your_info'), t('address'), t('delivery'), t('payment')];
  const payboxLoading = submitting && paymentMethod === PAYBOX_ID;

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px' }}>
      {/* Loader bloquant pendant l'init Paybox + la redirection */}
      {payboxLoading && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(255,255,255,0.92)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}
             role="status" aria-live="polite">
          <div className="orp-spinner" style={{ width: 44, height: 44, border: '4px solid #e5e0d6', borderTopColor: '#3f6e51', borderRadius: '50%', animation: 'spin 0.9s linear infinite' }} />
          <p style={{ fontSize: 15, color: '#333', fontWeight: 600, textAlign: 'center', maxWidth: 320 }}>{t('redirecting_payment')}</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}
      {payboxData && <PayboxRedirectForm url={payboxData.url} fields={payboxData.fields} />}
      <p style={{ marginBottom: 20, fontSize: 13, color: '#888' }}>
        <Link href={homeUrl(locale)} style={{ color: '#888', textDecoration: 'none' }}>Accueil</Link>
        <span style={{ margin: '0 8px' }}>›</span>
        <Link href={localeHref('/panier', locale)} style={{ color: '#888', textDecoration: 'none' }}>Panier</Link>
        <span style={{ margin: '0 8px' }}>›</span>
        <span style={{ color: '#333' }}>Commande</span>
      </p>

      <h1 style={{ fontSize: 26, fontWeight: 700, margin: '0 0 24px' }}>Finaliser ma commande</h1>

      {/* Stepper */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 32, flexWrap: 'wrap' }}>
        {stepLabels.map((label, i) => {
          const n = (i + 1) as Step;
          const done = step > n;
          const active = step === n;
          return (
            <div key={n} style={{
              flex: '1 1 0', minWidth: 140, display: 'flex', alignItems: 'center', gap: 8,
              padding: '12px 16px', background: '#fff',
              border: active ? '2px solid #333' : '2px solid #ddd',
              color: active ? '#333' : done ? '#666' : '#999',
              borderRadius: 4, fontSize: 13, fontWeight: 600,
            }}>
              <span style={{
                width: 24, height: 24, borderRadius: '50%',
                background: active ? '#333' : done ? '#666' : '#ddd',
                color: '#fff',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, flexShrink: 0,
              }}>{done ? '✓' : n}</span>
              <span>{label}</span>
            </div>
          );
        })}
      </div>

      <div style={{ marginBottom: 20 }}>
        <Link href={homeUrl(locale)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#333', color: '#fff', textDecoration: 'none', fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', borderRadius: 3 }}>
          <i className="material-icons" style={{ fontSize: 14 }}>home</i>
          Continuer mes achats
        </Link>
      </div>

      <div className="checkout-layout" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 360px)', gap: 32, alignItems: 'start' }}>
        {/* === FORM (gauche) === */}
        <div>
          {/* STEP 1 - personal */}
          {step === 1 && (
            <section style={sectionStyle}>
              <h2 style={h2Style}>{t('your_info')}</h2>
              {!user && (
                <div style={{ padding: '10px 14px', background: '#f5f0e8', border: '1px solid #e5e0d6', borderRadius: 3, marginBottom: 16, fontSize: 13, color: '#666' }}>
                  <i className="material-icons" style={{ fontSize: 16, verticalAlign: 'middle', marginRight: 6 }}>info_outline</i>
                  {t('guest_checkout')}
                </div>
              )}
              <FormField label="Email *" type="email" value={email} onChange={setEmail} placeholder="vous@exemple.fr" />
              <div className="checkout-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <FormField label="Prénom *" value={firstname} onChange={setFirstname} />
                <FormField label="Nom *" value={lastname} onChange={setLastname} />
              </div>
              <NextBtn disabled={!validStep1} onClick={() => setStep(2)} />
            </section>
          )}

          {/* STEP 2 - addresses */}
          {step === 2 && init && (
            <section style={sectionStyle}>
              <h2 style={h2Style}>{t('address')}</h2>
              <AddressFields addr={deliveryAddr} setAddr={setDeliveryAddr} countries={init.countries} />

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 20, fontSize: 13, cursor: 'pointer' }}>
                <input type="checkbox" checked={useSameAddress} onChange={e => setUseSameAddress(e.target.checked)} />
                Utiliser cette adresse pour la facturation
              </label>

              {!useSameAddress && (
                <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid #e5e0d6' }}>
                  <h2 style={h2Style}>Adresse de facturation</h2>
                  <AddressFields addr={invoiceAddr} setAddr={setInvoiceAddr} countries={init.countries} />
                </div>
              )}

              <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'space-between' }}>
                <BackBtn onClick={() => setStep(1)} />
                <NextBtn disabled={!validStep2} onClick={() => setStep(3)} />
              </div>
            </section>
          )}

          {/* STEP 3 - shipping */}
          {step === 3 && (
            <section style={sectionStyle}>
              <h2 style={h2Style}>Mode de livraison</h2>
              {loadingCarriers ? (
                <p style={{ color: '#888' }}>Calcul des frais de port…</p>
              ) : carriers.length === 0 ? (
                <p style={{ color: '#bf1212' }}>Aucun transporteur disponible pour cette adresse.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {carriers.map(c => (
                    <label key={c.id} style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: 16,
                      border: idCarrier === c.id ? '2px solid #a3a2a2' : '1px solid #e5e0d6',
                      borderRadius: 4, cursor: 'pointer', background: idCarrier === c.id ? '#f0f7f2' : '#fff',
                    }}>
                      <input type="radio" name="carrier" checked={idCarrier === c.id} onChange={() => setIdCarrier(c.id)} />
                      {c.logo && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={c.logo} alt={c.name} style={{ width: 48, height: 32, objectFit: 'contain' }} />
                      )}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{c.name}</div>
                        {c.delay && <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{c.delay}</div>}
                      </div>
                      <strong style={{ color: '#666' }}>{c.price_str}</strong>
                    </label>
                  ))}
                </div>
              )}

              <div style={{ marginTop: 24 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#555' }}>Commentaire (optionnel)</label>
                <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3}
                  placeholder="Une remarque pour votre commande ?"
                  style={{ width: '100%', padding: 10, border: '1px solid #e5e0d6', borderRadius: 4, fontSize: 14, resize: 'vertical', fontFamily: 'inherit' }} />
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'space-between' }}>
                <BackBtn onClick={() => setStep(2)} />
                <NextBtn disabled={!validStep3} onClick={() => setStep(4)} />
              </div>
            </section>
          )}

          {/* STEP 4 - payment */}
          {step === 4 && init && (
            <section style={sectionStyle}>
              <h2 style={h2Style}>{t('payment')}</h2>
              <PaymentMethodSelector
                options={[
                  { id: PAYBOX_ID, label: t('payment_card'), note: t('payment_card_secure'), card: true },
                  ...init.payment_methods.map((m): PaymentOption => ({ id: m.id, label: m.label, note: m.instructions })),
                ]}
                selected={paymentMethod}
                onSelect={setPaymentMethod}
              />

              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: 24, fontSize: 13, cursor: 'pointer' }}>
                <input type="checkbox" checked={acceptCgv} onChange={e => setAcceptCgv(e.target.checked)} style={{ marginTop: 3 }} />
                <span>J&apos;accepte les{' '}
                  {init.cgv ? (
                    <Link href={cmsUrl({ id: init.cgv.id_cms, slug: init.cgv.slug }, locale)} target="_blank" style={{ color: '#666', textDecoration: 'underline' }}>{init.cgv.title}</Link>
                  ) : 'conditions générales de vente'}.</span>
              </label>

              {submitError && (
                <div style={{ marginTop: 16, padding: 12, background: '#fee', color: '#bf1212', fontSize: 13, borderRadius: 4 }}>
                  {submitError}
                </div>
              )}

              <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'space-between' }}>
                <BackBtn onClick={() => setStep(3)} disabled={submitting} />
                <button onClick={handleSubmit} disabled={!validStep4 || submitting}
                  style={{
                    padding: '14px 32px',
                    background: validStep4 && !submitting ? '#3f6e51' : '#ccc',
                    color: '#fff', border: 0, borderRadius: 4,
                    cursor: validStep4 && !submitting ? 'pointer' : 'not-allowed',
                    fontSize: 14, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
                  }}>
                  {submitting
                    ? (paymentMethod === PAYBOX_ID ? t('redirecting_payment') : t('place_order') + '…')
                    : (paymentMethod === PAYBOX_ID ? t('pay_by_card') : t('place_order'))}
                </button>
              </div>
            </section>
          )}
        </div>

        {/* === SUMMARY (droite, sticky) === */}
        <aside style={{ position: 'sticky', top: 24, background: '#fff', border: '1px solid #e5e0d6', borderRadius: 4, padding: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 16px', paddingBottom: 12, borderBottom: '1px solid #e5e0d6' }}>
            Récapitulatif
          </h3>

          <div style={{ marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #f0ece4' }}>
            <VoucherForm />
          </div>
          <div style={{ maxHeight: 280, overflowY: 'auto', marginBottom: 16 }}>
            {[...cart.items].sort((a, b) => a.id_product - b.id_product).map(item => (
              <div key={`${item.id_product}-${item.id_product_attribute}`} style={{ display: 'grid', gridTemplateColumns: '50px 1fr auto', gap: 10, padding: '8px 0', borderBottom: '1px solid #f0ece4', alignItems: 'center' }}>
                {item.image_id ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={getProductImageUrl(item.id_product, item.image_id)} alt={item.name}
                    style={{ width: 50, height: 50, objectFit: 'cover' }} />
                ) : <div style={{ width: 50, height: 50, background: '#eee' }} />}
                <div style={{ fontSize: 12, lineHeight: 1.3, color: '#555', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {item.name}<br /><span style={{ color: '#999' }}>x {item.quantity}</span>
                </div>
                <strong style={{ fontSize: 12, color: '#333', textAlign: 'right' }}>{fmt(item.total_wt)}</strong>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0' }}>
            <span style={{ color: '#666' }}>Sous-total</span><span>{fmt(cart.totals.subtotal ?? 0)}</span>
          </div>
          {cart.totals.discounts && cart.totals.discounts > 0 ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0', color: '#3f6e51' }}>
              <span>Réduction</span><span>− {fmt(cart.totals.discounts)}</span>
            </div>
          ) : null}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0' }}>
            <span style={{ color: '#666' }}>{t('shipping')}</span>
            <span>{idCarrier !== null && carriers.find(c => c.id === idCarrier) ? fmt(carriers.find(c => c.id === idCarrier)!.price) : fmt(cart.totals.shipping)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 700, marginTop: 8, paddingTop: 12, borderTop: '1px solid #e5e0d6' }}>
            <span>Total TTC</span>
            <span style={{ color: '#bf1212' }}>{fmt(
              (cart.totals.subtotal ?? 0)
              + (idCarrier !== null && carriers.find(c => c.id === idCarrier) ? carriers.find(c => c.id === idCarrier)!.price : cart.totals.shipping)
            )}</span>
          </div>
        </aside>
      </div>
    </div>
  );
}

// ──── Sub-components ────
const sectionStyle: React.CSSProperties = { background: '#fff', border: '1px solid #e5e0d6', borderRadius: 4, padding: 24 };
const h2Style: React.CSSProperties = { fontSize: 16, fontWeight: 700, margin: '0 0 20px', textTransform: 'uppercase', letterSpacing: '0.05em' };

function FormField({ label, value, onChange, type = 'text', placeholder = '' }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#555' }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e0d6', borderRadius: 4, fontSize: 14, boxSizing: 'border-box' }} />
    </div>
  );
}

function AddressFields({ addr, setAddr, countries }: { addr: AddressForm; setAddr: (a: AddressForm) => void; countries: Country[]; }) {
  const u = (k: keyof AddressForm, v: any) => setAddr({ ...addr, [k]: v });
  return (
    <>
      <FormField label="Société (optionnel)" value={addr.company} onChange={v => u('company', v)} />
      <FormField label="Adresse *" value={addr.address1} onChange={v => u('address1', v)} placeholder="Numéro et nom de rue" />
      <FormField label="Complément (optionnel)" value={addr.address2} onChange={v => u('address2', v)} />
      <div className="checkout-billing-row" style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 16 }}>
        <FormField label="Code postal *" value={addr.postcode} onChange={v => u('postcode', v)} />
        <FormField label="Ville *" value={addr.city} onChange={v => u('city', v)} />
      </div>
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#555' }}>Pays *</label>
        <select value={addr.id_country} onChange={e => u('id_country', Number(e.target.value))}
          style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e0d6', borderRadius: 4, fontSize: 14, background: '#fff', boxSizing: 'border-box' }}>
          {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <FormField label="Téléphone *" type="tel" value={addr.phone} onChange={v => u('phone', v)} placeholder="+33..." />
    </>
  );
}

function NextBtn({ disabled, onClick }: { disabled?: boolean; onClick: () => void; }) {
  const t = useT();
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ padding: '12px 28px', background: disabled ? '#ccc' : '#3f6e51', color: '#fff', border: 0, borderRadius: 4, cursor: disabled ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
      {t('continue')}
    </button>
  );
}

function BackBtn({ onClick, disabled }: { onClick: () => void; disabled?: boolean; }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ padding: '12px 22px', background: 'transparent', color: '#666', border: '1px solid #3f6e51', borderRadius: 4, cursor: disabled ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
      ← Retour
    </button>
  );
}
