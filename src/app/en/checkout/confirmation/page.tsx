import CheckoutConfirmationView from '@/views/CheckoutConfirmationView';

export const dynamic = 'force-dynamic';

type Status = 'done' | 'denied' | 'cancel';

export default async function CheckoutConfirmationPageEn({
  searchParams,
}: {
  searchParams: Promise<{ cart?: string; status?: string }>;
}) {
  const sp = await searchParams;
  const cartId = sp.cart ? parseInt(sp.cart, 10) || 0 : 0;
  const status: Status = sp.status === 'denied' || sp.status === 'cancel' ? sp.status : 'done';
  return <CheckoutConfirmationView locale="en" cartId={cartId} status={status} />;
}
