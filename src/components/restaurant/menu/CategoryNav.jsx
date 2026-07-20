import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { prefersReducedMotion, usePointerDrag } from './usePointerDrag';

/* ============================================================
   CategoryNav — premium horizontal category tab selector.

   Native overflow-x + scroll-snap gives correct touch-swipe
   momentum for free; a mouse-only drag-to-scroll layer sits on
   top since overflow-x:auto alone doesn't support click-drag.
   A single sliding indicator (not per-tab underlines) tracks the
   active tab's measured position/width.
   ============================================================ */

const CATEGORY_NAV_STYLES = `
  .carte-catnav {
    position: relative;
    width: 100%;
    display: flex;
    justify-content: center;
  }
  .carte-catnav__track {
    position: relative;
    display: flex;
    gap: 2.5rem;
    max-width: 100%;
    overflow-x: auto;
    overflow-y: hidden;
    padding: 0.5rem 1.5rem 1.85rem;
    scroll-snap-type: x proximity;
    scrollbar-width: none;
    -ms-overflow-style: none;
    cursor: grab;
    touch-action: pan-x;
    user-select: none;
    -webkit-user-select: none;
  }
  .carte-catnav__track::-webkit-scrollbar { display: none; }
  .carte-catnav__track.is-dragging { cursor: grabbing; scroll-behavior: auto; }
  .carte-catnav__tab {
    flex: 0 0 auto;
    scroll-snap-align: center;
    background: none;
    border: none;
    padding: 0.5rem 0.25rem;
    font-family: 'Inter', sans-serif;
    font-size: 0.7rem;
    letter-spacing: 0.26em;
    text-transform: uppercase;
    color: rgba(235, 235, 235, 0.45);
    white-space: nowrap;
    cursor: pointer;
    transition: color 500ms cubic-bezier(0.22, 1, 0.36, 1), text-shadow 500ms cubic-bezier(0.22, 1, 0.36, 1);
  }
  .carte-catnav__tab:hover { color: rgba(235, 235, 235, 0.8); }
  .carte-catnav__tab[data-active='true'] {
    color: #EBEBEB;
    text-shadow: 0 0 14px rgba(197, 160, 89, 0.45);
  }
  .carte-catnav__tab:focus-visible {
    outline: 2px solid #C5A059;
    outline-offset: 6px;
    border-radius: 2px;
  }
  .carte-catnav__indicator {
    position: absolute;
    bottom: 0.85rem;
    left: 0;
    height: 1.5px;
    background: linear-gradient(90deg, transparent, #C5A059, transparent);
    transition: transform 500ms cubic-bezier(0.22, 1, 0.36, 1), width 500ms cubic-bezier(0.22, 1, 0.36, 1);
    pointer-events: none;
  }
  @media (max-width: 1024px) {
    .carte-catnav__track { gap: 2rem; }
  }
  @media (max-width: 640px) {
    .carte-catnav__track { gap: 1.5rem; justify-content: flex-start; }
  }
  @media (prefers-reduced-motion: reduce) {
    .carte-catnav__tab, .carte-catnav__indicator { transition: none; }
  }
`;

export default function CategoryNav({ categories, activeId, onChange }) {
  const trackRef = useRef(null);
  const tabRefs = useRef(new Map());
  const suppressClickRef = useRef(false);
  const [indicator, setIndicator] = useState({ x: 0, width: 0, ready: false });

  const updateIndicator = useCallback(() => {
    const track = trackRef.current;
    const el = tabRefs.current.get(activeId);
    if (!track || !el) return;
    const trackRect = track.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    setIndicator({
      x: elRect.left - trackRect.left + track.scrollLeft,
      width: elRect.width,
      ready: true,
    });
  }, [activeId]);

  useLayoutEffect(() => {
    updateIndicator();
  }, [updateIndicator, categories]);

  useEffect(() => {
    window.addEventListener('resize', updateIndicator);
    return () => window.removeEventListener('resize', updateIndicator);
  }, [updateIndicator]);

  useEffect(() => {
    const track = trackRef.current;
    const el = tabRefs.current.get(activeId);
    if (!track || !el) return;
    // Scroll only the tab strip's own horizontal axis via scrollBy on the
    // track element itself - scrollIntoView() was scrolling the whole
    // page vertically on mount, since this element has no vertically
    // scrollable ancestor other than the window itself.
    const trackRect = track.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const delta = elRect.left + elRect.width / 2 - (trackRect.left + trackRect.width / 2);
    track.scrollBy({ left: delta, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  }, [activeId]);

  const { onPointerDown, onPointerMove, onPointerUp } = usePointerDrag({
    activationPointerTypes: ['mouse'],
    onDragStart: () => {
      trackRef.current?.classList.add('is-dragging');
    },
    onDragMove: ({ dx }) => {
      if (trackRef.current) trackRef.current.scrollLeft -= dx;
    },
    onDragEnd: ({ wasDrag }) => {
      trackRef.current?.classList.remove('is-dragging');
      suppressClickRef.current = wasDrag;
      requestAnimationFrame(() => {
        suppressClickRef.current = false;
      });
    },
  });

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return undefined;
    const handleWheel = (e) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      track.scrollLeft += e.deltaY;
      e.preventDefault();
    };
    track.addEventListener('wheel', handleWheel, { passive: false });
    return () => track.removeEventListener('wheel', handleWheel);
  }, []);

  const handleTabClick = useCallback(
    (id) => {
      if (suppressClickRef.current) return;
      onChange(id);
    },
    [onChange]
  );

  const onKeyDown = useCallback(
    (e) => {
      const idx = categories.findIndex((c) => c.id === activeId);
      let nextIdx = null;
      if (e.key === 'ArrowRight') nextIdx = (idx + 1) % categories.length;
      else if (e.key === 'ArrowLeft') nextIdx = (idx - 1 + categories.length) % categories.length;
      else if (e.key === 'Home') nextIdx = 0;
      else if (e.key === 'End') nextIdx = categories.length - 1;
      if (nextIdx === null) return;
      e.preventDefault();
      const next = categories[nextIdx];
      onChange(next.id);
      tabRefs.current.get(next.id)?.focus();
    },
    [activeId, categories, onChange]
  );

  return (
    <nav className="carte-catnav" aria-label="Catégories du menu">
      <style dangerouslySetInnerHTML={{ __html: CATEGORY_NAV_STYLES }} />
      <div
        ref={trackRef}
        className="carte-catnav__track"
        role="tablist"
        aria-orientation="horizontal"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
      >
        {categories.map((cat) => (
          <button
            key={cat.id}
            ref={(el) => {
              if (el) tabRefs.current.set(cat.id, el);
              else tabRefs.current.delete(cat.id);
            }}
            id={`carte-tab-${cat.id}`}
            type="button"
            role="tab"
            aria-selected={cat.id === activeId}
            aria-controls={`carte-panel-${cat.id}`}
            tabIndex={cat.id === activeId ? 0 : -1}
            data-active={cat.id === activeId ? 'true' : 'false'}
            className="carte-catnav__tab"
            onClick={() => handleTabClick(cat.id)}
          >
            {cat.name}
          </button>
        ))}
        {indicator.ready && (
          <span
            className="carte-catnav__indicator"
            aria-hidden="true"
            style={{ transform: `translateX(${indicator.x}px)`, width: `${indicator.width}px` }}
          />
        )}
      </div>
    </nav>
  );
}
