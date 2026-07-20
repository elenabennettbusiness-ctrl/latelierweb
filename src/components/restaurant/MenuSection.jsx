import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MENU } from './menu/menuData';
import CategoryNav from './menu/CategoryNav';
import DishCarousel from './menu/DishCarousel';

/* ============================================================
   MenuSection — "Notre Menu"

   Premium, image-driven menu: category tabs (CategoryNav) above
   a draggable, infinite dish carousel (DishCarousel), fed
   entirely from src/assets/NewMenu/ via menuData.js. No prices,
   no buttons — image + dish name only.
   ============================================================ */

const SECTION_STYLES = `
  .carte-reveal {
    opacity: 0;
    transform: translate3d(0, 30px, 0);
    transition: opacity 800ms cubic-bezier(0.22, 1, 0.36, 1), transform 800ms cubic-bezier(0.22, 1, 0.36, 1);
    will-change: transform, opacity;
  }
  .carte-reveal.is-visible {
    opacity: 1;
    transform: none;
  }
  @media (prefers-reduced-motion: reduce) {
    .carte-reveal {
      transition: none;
      opacity: 1;
      transform: none;
    }
  }
  .carte-menu-breakout {
    width: 100vw;
    max-width: 100vw;
    margin-left: calc(50% - 50vw);
    padding: 0 clamp(1rem, 4vw, 3rem);
  }
`;

// Same dependency-free reveal pattern as AboutSection.jsx — toggles
// `.is-visible` once, the first time the ref'd element enters view.
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

export default function MenuSection() {
  const [activeId, setActiveId] = useState(MENU[0]?.id);
  const headerRef = useReveal();
  const navRef = useReveal({ rootMargin: '0px 0px -5% 0px' });
  const panelRef = useReveal({ rootMargin: '0px 0px -5% 0px' });

  const activeCategory = MENU.find((c) => c.id === activeId) || MENU[0];

  if (!activeCategory) return null;

  return (
    <section id="menu" className="relative py-24 md:py-40 overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: SECTION_STYLES }} />

      <div className="max-w-6xl mx-auto px-6 md:px-12 relative z-10">
        <div ref={headerRef} className="carte-reveal text-center mb-14 md:mb-16">
          <p className="font-body text-xs tracking-[0.3em] uppercase text-gold mb-4">Notre Menu</p>
          <h2 className="font-heading text-4xl md:text-6xl font-light italic text-marble mb-4">
            Découvrez Notre Carte
          </h2>
          <div className="gold-line w-16 mx-auto mb-6" />
          <p className="font-body text-sm text-marble/50 max-w-xl mx-auto">
            Une sélection de nos créations, entre tradition marocaine et raffinement méditerranéen.
          </p>
        </div>

        <div ref={navRef} className="carte-reveal mb-8 md:mb-10">
          <CategoryNav categories={MENU} activeId={activeCategory.id} onChange={setActiveId} />
        </div>
      </div>

      <div
        ref={panelRef}
        className="carte-reveal carte-menu-breakout relative z-10"
        id={`carte-panel-${activeCategory.id}`}
        role="tabpanel"
        aria-labelledby={`carte-tab-${activeCategory.id}`}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <DishCarousel dishes={activeCategory.dishes} categoryName={activeCategory.name} />
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
