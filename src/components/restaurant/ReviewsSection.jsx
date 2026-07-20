import React, { useEffect, useRef } from 'react';
import GoogleWordmark from './GoogleWordmark';
import RatingStars from './reviews/RatingStars';
import ReviewsCarousel from './reviews/ReviewsCarousel';
import { REVIEW_CARDS, HAPPY_BACKGROUND } from './reviews/reviewsData';

/* ============================================================
   ReviewsSection — "Avis Clients"

   Premium, photo-backed testimonial section: gold label + heading
   + short description, a stacked Google rating block, then an
   infinite auto-scrolling review carousel (ReviewsCarousel), all
   floating above a full-bleed background photo (src/assets/Happy/)
   with a dark overlay + vignette. Falls back to a plain gradient
   until a real photo is dropped into Happy/.
   ============================================================ */

const SECTION_STYLES = `
  .avis-reveal {
    opacity: 0;
    transform: translate3d(0, 30px, 0);
    transition: opacity 800ms cubic-bezier(0.22, 1, 0.36, 1), transform 800ms cubic-bezier(0.22, 1, 0.36, 1);
    will-change: transform, opacity;
  }
  .avis-reveal.is-visible {
    opacity: 1;
    transform: none;
  }
  @media (prefers-reduced-motion: reduce) {
    .avis-reveal {
      transition: none;
      opacity: 1;
      transform: none;
    }
  }

  .avis-bg-photo {
    position: absolute;
    inset: 0;
    z-index: 0;
    background-size: cover;
    background-position: center;
  }
  .avis-bg-overlay {
    position: absolute;
    inset: 0;
    z-index: 1;
    background: linear-gradient(180deg, rgba(10, 10, 10, 0.68) 0%, rgba(10, 10, 10, 0.74) 100%);
  }
  .avis-bg-vignette {
    position: absolute;
    inset: 0;
    z-index: 1;
    background: radial-gradient(120% 100% at 50% 30%, transparent 35%, rgba(10, 10, 10, 0.65) 100%);
  }
  @media (min-width: 1025px) {
    .avis-bg-photo { background-attachment: fixed; }
  }

  .avis-rating__label {
    font-family: 'Inter', sans-serif;
    font-weight: 700;
    font-size: 0.8rem;
    letter-spacing: 0.32em;
    text-transform: uppercase;
    color: #C5A059;
  }
  .avis-rating__number {
    font-family: 'Inter', sans-serif;
    font-weight: 800;
    font-size: clamp(3.25rem, 6vw, 4.75rem);
    letter-spacing: -0.02em;
    line-height: 1;
    color: #EBEBEB;
  }
  .avis-rating__subtitle {
    font-family: 'Inter', sans-serif;
    font-weight: 500;
    font-size: 0.85rem;
    letter-spacing: 0.06em;
    color: rgba(235, 235, 235, 0.6);
  }
`;

// Same dependency-free reveal pattern used by AboutSection.jsx/MenuSection.jsx.
function useReveal(options = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      if (el) el.classList.add('is-visible');
      return undefined;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        root: null,
        rootMargin: options.rootMargin || '0px 0px -10% 0px',
        threshold: options.threshold || 0.12,
      }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [options.rootMargin, options.threshold]);

  return ref;
}

export default function ReviewsSection() {
  const headerRef = useReveal();
  const ratingRef = useReveal({ rootMargin: '0px 0px -5% 0px' });
  const carouselRef = useReveal({ rootMargin: '0px 0px -5% 0px' });

  const backgroundStyle = HAPPY_BACKGROUND
    ? { backgroundImage: `url(${HAPPY_BACKGROUND})` }
    : { backgroundImage: 'linear-gradient(160deg, #17130d 0%, #0A0A0A 55%, #050504 100%)' };

  return (
    <section id="reviews" className="relative py-24 md:py-40 px-6 md:px-12 overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: SECTION_STYLES }} />
      <div className="avis-bg-photo" style={backgroundStyle} aria-hidden="true" />
      <div className="avis-bg-overlay" aria-hidden="true" />
      <div className="avis-bg-vignette" aria-hidden="true" />

      <div className="max-w-6xl mx-auto relative z-10">
        <div ref={headerRef} className="avis-reveal text-center mb-10 md:mb-12">
          <p className="font-body text-xs tracking-[0.3em] uppercase text-gold mb-4">Avis Clients</p>
          <h2 className="font-heading text-4xl md:text-6xl font-light italic text-marble mb-4">Ils en Parlent</h2>
          <div className="gold-line w-16 mx-auto mb-6" />
          <p className="font-body text-sm text-marble/50 max-w-xl mx-auto">
            Chaque avis reflète notre engagement envers une expérience culinaire mémorable et un service irréprochable.
          </p>
        </div>

        <div ref={ratingRef} className="avis-reveal flex flex-col items-center gap-3 mb-16 md:mb-20">
          <p className="avis-rating__label">Excellent</p>
          <RatingStars rating={4.9} size={32} gap={8} />
          <p className="avis-rating__number">4.9</p>
          <p className="avis-rating__subtitle">Basé sur 235 avis Google</p>
          <GoogleWordmark className="h-6 w-auto mt-1" />
        </div>

        <div ref={carouselRef} className="avis-reveal">
          <ReviewsCarousel cards={REVIEW_CARDS} />
        </div>
      </div>
    </section>
  );
}
