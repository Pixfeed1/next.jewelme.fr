'use client';
import { useEffect } from 'react';
import { trackViewItem } from '@/lib/gtag';

interface Props {
  id: number;
  name: string;
  price: number;
}

export default function TrackViewItem({ id, name, price }: Props) {
  useEffect(() => {
    trackViewItem({ id, name, price });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
  return null;
}
