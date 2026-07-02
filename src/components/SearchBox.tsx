'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface SearchResult {
  id: number;
  name: string;
  manufacturer: string;
  category_slug: string;
  category_id: number;
  slug: string;
  price: number;
  image_url: string;
  /** URL native Presta résolue côté serveur (/api/search/suggest). */
  url?: string;
}

function productUrl(r: SearchResult): string {
  return r.url ?? `/${r.category_id}-${r.category_slug}/${r.id}-${r.slug}.html`;
}

export default function SearchBox({ placeholder = 'Rechercher' }: { placeholder?: string }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    if (query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(query)}&limit=8`);
        const data = await res.json();
        setResults(data.results || []);
      } catch (e) {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
  }, [query]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const navigateToProduct = (r: SearchResult) => {
    router.push(productUrl(r));
    setOpen(false);
    setQuery('');
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (highlightIdx >= 0 && results[highlightIdx]) {
      navigateToProduct(results[highlightIdx]);
    } else if (query.trim().length >= 2) {
      router.push(`/recherche?s=${encodeURIComponent(query)}`);
      setOpen(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIdx(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIdx(i => Math.max(i - 1, -1));
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} style={{ width: '100%', maxWidth: 500, position: 'relative' }}>
      <form onSubmit={onSubmit} className="header-search-form" style={{ width: '100%', position: 'relative' }} autoComplete="off">
        <input
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); setHighlightIdx(-1); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          aria-label={placeholder}
          autoComplete="off"
          style={{ width: '100%', padding: '10px 40px 10px 14px', border: '1px solid var(--or-grey-lighter)', borderRadius: 4, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', background: '#fff', color: 'var(--or-text)' }}
        />
        <button type="submit" aria-label={placeholder}
          style={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)', width: 32, height: 32, background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--or-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className="material-icons" style={{ fontSize: 20 }}>search</i>
        </button>
      </form>

      {open && (results.length > 0 || loading) && (
        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: '#fff', border: '1px solid #ddd', borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', maxHeight: 480, overflowY: 'auto', zIndex: 1000 }}>
          {loading && <div style={{ padding: 12, color: '#888', fontSize: 13 }}>Recherche…</div>}
          {!loading && results.map((r, i) => (
            <div
              key={`${r.id}-${i}`}
              onMouseDown={(e) => { e.preventDefault(); navigateToProduct(r); }}
              onMouseEnter={() => setHighlightIdx(i)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: 8, cursor: 'pointer',
                background: highlightIdx === i ? '#f5f5f5' : '#fff',
                borderBottom: '1px solid #eee'
              }}
            >
              {r.image_url ? (
                <img src={r.image_url} alt="" style={{ width: 48, height: 48, objectFit: 'cover', flexShrink: 0 }} />
              ) : (
                <div style={{ width: 48, height: 48, background: '#eee', flexShrink: 0 }} />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: '#1a1a1a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</div>
                {r.manufacturer && (
                  <div style={{ fontSize: 11, color: '#888' }}>{r.manufacturer}</div>
                )}
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', flexShrink: 0 }}>
                {r.price.toFixed(2)} €
              </div>
            </div>
          ))}
          {!loading && results.length > 0 && (
            <div
              onMouseDown={(e) => { e.preventDefault(); router.push(`/recherche?s=${encodeURIComponent(query)}`); setOpen(false); }}
              style={{ padding: 10, textAlign: 'center', fontSize: 13, color: '#0066cc', cursor: 'pointer', background: '#f9f9f9' }}
            >
              Voir tous les résultats pour « {query} »
            </div>
          )}
        </div>
      )}
    </div>
  );
}
