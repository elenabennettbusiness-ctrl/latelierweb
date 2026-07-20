import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import RawReviewCard from './RawReviewCard';
import { prefersReducedMotion, usePointerDrag } from '../menu/usePointerDrag';

/* ============================================================
   ReviewsCarousel — native-scroll infinite review carousel.

   Same proven architecture as the menu's DishCarousel.jsx: native
   `overflow-x: auto` scroll (not a transform) with a 3x-group
   infinite loop corrected by a passive `scroll` listener, a
   mouse-only drag layer via the shared usePointerDrag hook, and a
   desktop-only requestAnimationFrame autoplay.

   Critically, scroll-snap-type stays fully disabled for the whole
   time autoplay owns the element (never toggled back on) — that's
   what the menu carousel's hover-freeze and drag-release bugs both
   traced back to: re-enabling snap while scrollLeft isn't
   card-aligned makes the browser instantly re-snap to the nearest
   card. Mobile/tablet never run autoplay, so they keep native
   `scroll-snap-type: x mandatory` for a crisp one-review-at-a-time
   swipe feel.
   ============================================================ */

function getVisibleCount(width) {
  if (width <= 640) return 1;
  if (width <= 1024) return 2;
  return 3;
}

const AUTOPLAY_SECONDS_PER_CARD = 11; // slower than the menu's 8s - more text to read
const AUTOPLAY_RESUME_DELAY_MS = 2500;
const AUTOPLAY_START_DELAY_MS = 600;

const AVIS_CAROUSEL_STYLES = `
  .avis-carousel {
    position: relative;
    width: 100%;
    overflow-x: auto;
    overflow-y: hidden;
    overscroll-behavior-x: contain;
    outline: none;
    cursor: grab;
    touch-action: pan-x;
    scroll-snap-type: x mandatory;
    scrollbar-width: none;
    -ms-overflow-style: none;
    -webkit-mask-image: linear-gradient(to right, transparent 0%, #000 3%, #000 97%, transparent 100%);
            mask-image: linear-gradient(to right, transparent 0%, #000 3%, #000 97%, transparent 100%);
  }
  .avis-carousel::-webkit-scrollbar { display: none; }
  .avis-carousel--dragging { cursor: grabbing; scroll-behavior: auto; scroll-snap-type: none; }
  .avis-carousel:focus-visible {
    outline: 2px solid #C5A059;
    outline-offset: 6px;
  }
  .avis-carousel__track {
    display: flex;
    align-items: center;
    width: max-content;
    padding: 1rem 0 3rem;
    user-select: none;
    -webkit-user-select: none;
  }
  .avis-carousel__group {
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }

  /* Gutter wrapper only - the review card's own look (background, blur,
     border, shadow, typography, etc.) all comes from the untouched
     Reviews Code HTML/CSS rendered inside RawReviewCard's shadow root;
     nothing here styles the card itself. */
  .avis-card {
    flex: 0 0 var(--card-w, 340px);
    box-sizing: border-box;
    padding: 0 0.75rem;
    scroll-snap-align: start;
  }

  /* First-appearance stagger, driven by ReviewsSection's scroll-reveal wrapper. */
  .avis-reveal .avis-card {
    opacity: 0;
    transform: translate3d(0, 24px, 0);
    transition: opacity 700ms cubic-bezier(0.22, 1, 0.36, 1), transform 700ms cubic-bezier(0.22, 1, 0.36, 1);
    transition-delay: calc(min(var(--i, 0), 8) * 70ms);
  }
  .avis-reveal.is-visible .avis-card {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }

  @media (prefers-reduced-motion: reduce) {
    .avis-reveal .avis-card { transition: none; }
  }
`;

export default function ReviewsCarousel({ cards }) {
  const scrollRef = useRef(null);
  const realGroupRef = useRef(null);
  const groupWidthRef = useRef(0);
  const prevMetricsRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isDesktop, setIsDesktop] = useState(() => (typeof window !== 'undefined' ? window.innerWidth > 1024 : true));
  const reduceMotionRef = useRef(prefersReducedMotion());
  const isHoveredRef = useRef(false);
  const isDraggingRef = useRef(false);
  const autoplayReadyRef = useRef(false);
  const resumeDelayActiveRef = useRef(false);
  const resumeTimerRef = useRef(null);

  const scheduleAutoplayResume = useCallback(() => {
    resumeDelayActiveRef.current = true;
    clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => {
      resumeDelayActiveRef.current = false;
    }, AUTOPLAY_RESUME_DELAY_MS);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined;
    const mq = window.matchMedia('(min-width: 1025px)');
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return undefined;
    setContainerWidth(el.getBoundingClientRect().width);
    const ro = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect?.width;
      if (width) setContainerWidth(width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const fallbackWidth = typeof window !== 'undefined' ? window.innerWidth : 1280;
  const visibleCount = getVisibleCount(containerWidth || fallbackWidth);
  const cardWidth = containerWidth > 0 ? containerWidth / visibleCount : 0;
  const slotWidth = Math.max(cardWidth - 24, 0); // minus the .avis-card gutter (0.75rem each side)
  const loop = cards.length > Math.ceil(visibleCount) + 1;

  const groups = useMemo(() => (loop ? [cards, cards, cards] : [cards]), [cards, loop]);
  const realGroupIndex = loop ? 1 : 0;

  // Mount + resize: (re)anchor scrollLeft so the review in view never
  // silently jumps when cardWidth/groupWidth change, and reset cleanly
  // if loop/fallback mode itself flips across a breakpoint.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    const groupEl = realGroupRef.current;
    if (!el || !groupEl || cardWidth <= 0) return;
    const groupWidth = groupEl.getBoundingClientRect().width;
    if (groupWidth <= 0) return;

    const prev = prevMetricsRef.current;
    if (!prev || prev.loop !== loop) {
      el.scrollLeft = loop ? groupWidth : 0;
    } else {
      const prevBase = prev.loop ? prev.groupWidth : 0;
      const newBase = loop ? groupWidth : 0;
      const ratio = prev.cardWidth > 0 ? (el.scrollLeft - prevBase) / prev.cardWidth : 0;
      el.scrollLeft = newBase + ratio * cardWidth;
    }

    groupWidthRef.current = groupWidth;
    prevMetricsRef.current = { cardWidth, groupWidth, loop };
  }, [cardWidth, loop]);

  // Desktop-only autoplay - see file header comment for why snap-type
  // must stay disabled for the whole time this effect owns the element.
  useEffect(() => {
    autoplayReadyRef.current = false;
    if (!loop || !isDesktop || reduceMotionRef.current) return undefined;
    const timer = setTimeout(() => {
      autoplayReadyRef.current = true;
    }, AUTOPLAY_START_DELAY_MS);
    return () => clearTimeout(timer);
  }, [loop, isDesktop]);

  useEffect(() => {
    if (!loop || !isDesktop || reduceMotionRef.current || cardWidth <= 0) return undefined;
    const el = scrollRef.current;
    if (!el) return undefined;

    el.style.scrollSnapType = 'none';

    const speed = cardWidth / AUTOPLAY_SECONDS_PER_CARD; // px per second
    let rafId;
    let lastTime = null;

    const tick = (now) => {
      if (lastTime === null) lastTime = now;
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      const autoplayActive =
        autoplayReadyRef.current && !isHoveredRef.current && !isDraggingRef.current && !resumeDelayActiveRef.current;
      if (autoplayActive) {
        el.scrollLeft += speed * dt;
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      el.style.scrollSnapType = '';
    };
  }, [loop, isDesktop, cardWidth]);

  // Loop-boundary correction: works identically for every input method
  // since it hooks the generic native `scroll` event.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !loop) return undefined;
    const handleScroll = () => {
      const gw = groupWidthRef.current;
      if (gw <= 0) return;
      if (el.scrollLeft < gw) el.scrollLeft += gw;
      else if (el.scrollLeft >= gw * 2) el.scrollLeft -= gw;
    };
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [loop]);

  const { onPointerDown, onPointerMove, onPointerUp } = usePointerDrag({
    activationPointerTypes: ['mouse'],
    onDragStart: () => {
      isDraggingRef.current = true;
      clearTimeout(resumeTimerRef.current);
      setIsDragging(true);
    },
    onDragMove: ({ dx }) => {
      if (scrollRef.current) scrollRef.current.scrollLeft -= dx;
    },
    onDragEnd: () => {
      isDraggingRef.current = false;
      scheduleAutoplayResume();
      setIsDragging(false);
    },
  });

  const onMouseEnter = useCallback(() => {
    isHoveredRef.current = true;
  }, []);

  const onMouseLeave = useCallback(() => {
    isHoveredRef.current = false;
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return undefined;
    const handleWheel = (e) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      el.scrollLeft += e.deltaY;
      e.preventDefault();
      scheduleAutoplayResume();
    };
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [scheduleAutoplayResume]);

  const onKeyDown = useCallback(
    (e) => {
      const el = scrollRef.current;
      if (!el || cardWidth <= 0) return;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        el.scrollTo({ left: el.scrollLeft + cardWidth, behavior: reduceMotionRef.current ? 'auto' : 'smooth' });
        scheduleAutoplayResume();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        el.scrollTo({ left: el.scrollLeft - cardWidth, behavior: reduceMotionRef.current ? 'auto' : 'smooth' });
        scheduleAutoplayResume();
      }
    },
    [cardWidth, scheduleAutoplayResume]
  );

  return (
    <div
      ref={scrollRef}
      className={`avis-carousel${isDragging ? ' avis-carousel--dragging' : ''}`}
      style={{ '--card-w': `${cardWidth || 0}px` }}
      role="region"
      aria-roledescription="carrousel"
      aria-label="Avis clients"
      tabIndex={0}
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <style dangerouslySetInnerHTML={{ __html: AVIS_CAROUSEL_STYLES }} />
      <div className="avis-carousel__track">
        {groups.map((groupCards, g) => (
          <div
            key={g}
            className="avis-carousel__group"
            ref={g === realGroupIndex ? realGroupRef : undefined}
            aria-hidden={g !== realGroupIndex ? 'true' : undefined}
          >
            {groupCards.map((html, i) => (
              <div key={`${i}-${g}`} className="avis-card" style={{ '--i': i }}>
                <RawReviewCard html={html} slotWidth={slotWidth} index={i} ariaHidden={g !== realGroupIndex} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
