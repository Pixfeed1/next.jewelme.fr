'use client';

import { useEffect, useState } from 'react';

export interface ParcelPointLocation {
  street?: string;
  city?: string;
  zipCode?: string;
  country?: string;
  position?: { latitude: number; longitude: number };
}

export interface ParcelPointOpeningPeriod {
  openingTime: string;
  closingTime: string;
}

export interface ParcelPointOpeningDay {
  weekday: string;
  openingPeriods: ParcelPointOpeningPeriod[];
}

export interface ParcelPointData {
  code: string;
  name: string;
  network: string;
  location: ParcelPointLocation;
  openingDays?: ParcelPointOpeningDay[];
}

export interface ParcelPointEntry {
  distanceFromSearchLocation?: number;
  parcelPoint: ParcelPointData;
}

interface Props {
  carrierId: number;
  initialZipCode: string;
  country: string;
  selectedPointCode?: string | null;
  onSelect: (entry: ParcelPointEntry | null) => void;
}

const WEEKDAY_FR: Record<string, string> = {
  MONDAY: 'Lun',
  TUESDAY: 'Mar',
  WEDNESDAY: 'Mer',
  THURSDAY: 'Jeu',
  FRIDAY: 'Ven',
  SATURDAY: 'Sam',
  SUNDAY: 'Dim',
};

function summarizeHours(days?: ParcelPointOpeningDay[]): string {
  if (!days || days.length === 0) return '';
  const open = days.filter(d => d.openingPeriods && d.openingPeriods.length > 0);
  if (open.length === 0) return '';
  const labels = open.map(d => WEEKDAY_FR[d.weekday] || d.weekday.slice(0, 3));
  return 'Ouvert ' + labels.join(', ');
}

function formatDistance(m?: number): string {
  if (m === undefined || m === null) return '';
  if (m < 1000) return `${Math.round(m)} m`;
  return `${(m / 1000).toFixed(1)} km`;
}

export default function ParcelPointSelector({
  carrierId,
  initialZipCode,
  country,
  selectedPointCode,
  onSelect,
}: Props) {
  const [zipCode, setZipCode] = useState(initialZipCode);
  const [searchZip, setSearchZip] = useState(initialZipCode);
  const [points, setPoints] = useState<ParcelPointEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!searchZip || !country || !carrierId) return;
    setLoading(true);
    setError(null);
    const url = `/api/checkout/parcel-points?id_carrier=${carrierId}&zipCode=${encodeURIComponent(searchZip)}&country=${encodeURIComponent(country)}`;
    fetch(url)
      .then(r => r.json())
      .then(data => {
        if (data?.error) {
          setError(data.error);
          setPoints([]);
        } else if (data?.is_parcel_point && Array.isArray(data.points)) {
          setPoints(data.points);
        } else {
          setPoints([]);
        }
        setLoading(false);
      })
      .catch(err => {
        setError(err?.message || 'Erreur de chargement');
        setLoading(false);
      });
  }, [searchZip, country, carrierId]);

  const handleSearch = () => {
    if (zipCode.trim()) setSearchZip(zipCode.trim());
  };

  return (
    <div style={{
      marginTop: 12,
      padding: 16,
      background: '#f9f7f0',
      border: '1px solid #e5e0d6',
      borderRadius: 4,
    }}>
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#555' }}>
          Choisissez un point relais autour de :
        </label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            value={zipCode}
            onChange={e => setZipCode(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSearch(); } }}
            placeholder="Code postal"
            style={{
              flex: 1,
              padding: '8px 12px',
              border: '1px solid #d8d8d8',
              borderRadius: 4,
              fontSize: 14,
            }}
          />
          <button
            type="button"
            onClick={handleSearch}
            style={{
              padding: '8px 16px',
              background: '#a3a2a2',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            Rechercher
          </button>
        </div>
      </div>

      {loading && <p style={{ color: '#888', fontSize: 13 }}>Recherche en cours…</p>}
      {error && <p style={{ color: '#bf1212', fontSize: 13 }}>{error}</p>}

      {!loading && !error && points.length === 0 && (
        <p style={{ color: '#888', fontSize: 13 }}>Aucun point relais trouvé à proximité.</p>
      )}

      {!loading && points.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 380, overflowY: 'auto' }}>
          {points.slice(0, 15).map(entry => {
            const p = entry.parcelPoint;
            const selected = selectedPointCode === p.code;
            const hours = summarizeHours(p.openingDays);
            const dist = formatDistance(entry.distanceFromSearchLocation);
            return (
              <button
                key={p.code}
                type="button"
                onClick={() => onSelect(entry)}
                style={{
                  display: 'block',
                  textAlign: 'left',
                  padding: 12,
                  background: selected ? '#f0f7f2' : '#fff',
                  border: selected ? '2px solid #a3a2a2' : '1px solid #e5e0d6',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: 13,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ fontWeight: 600 }}>{p.name}</div>
                  {dist && <div style={{ fontSize: 12, color: '#888' }}>{dist}</div>}
                </div>
                <div style={{ color: '#555', marginTop: 4 }}>
                  {p.location.street}, {p.location.zipCode} {p.location.city}
                </div>
                {hours && (
                  <div style={{ color: '#888', fontSize: 12, marginTop: 4 }}>{hours}</div>
                )}
                {selected && (
                  <div style={{ color: '#2a7d3e', fontSize: 12, marginTop: 6, fontWeight: 600 }}>
                    ✓ Sélectionné
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
