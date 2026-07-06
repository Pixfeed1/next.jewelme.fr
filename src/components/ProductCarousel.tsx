'use client';

import { useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, FreeMode } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import 'swiper/css';

import type { PrestaProduct } from '@/lib/presta';
import type { SliderConfig } from '@/lib/headless-api';
import ProductCard from './ProductCard';

interface Props {
  products: PrestaProduct[];
  config: SliderConfig;
  continuous?: boolean;
}

function deriveBreakpoints(c: number) {
  const mobile = Math.min(2, Math.max(1, c - 1));
  const tablet = Math.min(3, Math.max(1, c - 1));
  const medium = Math.min(4, c);
  const large = c;
  return {
    0:    { slidesPerView: mobile, slidesPerGroup: mobile },
    768:  { slidesPerView: tablet, slidesPerGroup: tablet },
    992:  { slidesPerView: medium, slidesPerGroup: medium },
    1220: { slidesPerView: large,  slidesPerGroup: large  },
  };
}

const ChevronLeft = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
    <path d="M17.59 18 19 16.59 14.42 12 19 7.41 17.59 6l-6 6zM11 18l1.41-1.41L7.83 12l4.58-4.59L11 6l-6 6z"/>
  </svg>
);
const ChevronRight = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
    <path d="M6.41 6 5 7.41 9.58 12 5 16.59 6.41 18 12.41 12zM13 6l-1.41 1.41L16.17 12l-4.58 4.59L13 18l6-6z"/>
  </svg>
);

export default function ProductCarousel({ products, config, continuous = false }: Props) {
  const swiperRef = useRef<SwiperType | null>(null);
  if (products.length === 0) return null;
  const cols = Math.max(1, config.columns_desktop || 6);
  const canLoop = products.length > cols;
  const runContinuous = continuous && products.length > cols;

  const showArrows = runContinuous || canLoop;

  return (
    <div className="product-carousel">
      {showArrows && (
        <>
          <button type="button" className="slick-prev" aria-label="Précédent" onClick={() => swiperRef.current?.slidePrev()}>
            <ChevronLeft />
          </button>
          <button type="button" className="slick-next" aria-label="Suivant" onClick={() => swiperRef.current?.slideNext()}>
            <ChevronRight />
          </button>
        </>
      )}
      <Swiper
        modules={(runContinuous || config.autoplay) ? [Autoplay, FreeMode] : []}
        onSwiper={(s) => { swiperRef.current = s; }}
        slidesPerView={2}
        slidesPerGroup={runContinuous ? 1 : 2}
        spaceBetween={8}
        loop={runContinuous ? true : canLoop}
        freeMode={runContinuous ? { enabled: true, momentum: false } : false}
        speed={runContinuous ? 4000 : 1200}
        autoplay={
          runContinuous
            ? { delay: 0, disableOnInteraction: false, pauseOnMouseEnter: true }
            : config.autoplay
              ? { delay: 3500, disableOnInteraction: false, pauseOnMouseEnter: true }
              : false
        }
        breakpoints={deriveBreakpoints(cols)}
      >
        {products.map((p) => (
          <SwiperSlide key={p.id}>
            <ProductCard product={p} />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
