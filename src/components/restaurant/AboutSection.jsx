import React, { useEffect, useRef } from 'react';

/* ============================================================
   AboutSection — "Notre Histoire"
   Three-block editorial layout:

     Block 1 (text LEFT  | image RIGHT) → 1.webp
     Block 2 (image LEFT | text RIGHT ) → 2.webp
     Block 3 (text LEFT  | image RIGHT) → 3.webp

   Each block animates independently on scroll into view:
     - Text lines fade + move up ~30px, staggered
     - Images fade + scale 0.95 → 1 + move up ~20px
   Pure CSS animations driven by an IntersectionObserver
   toggling a single `.is-visible` class on each block.
   No Framer Motion, no GSAP.
   ============================================================ */

// ------------------ Reveal hook (no deps) ------------------
// Adds `is-visible` to a ref'd element the first time it
// crosses into the viewport. Used to trigger the CSS
// entrance animations defined in the <style> block.
function useReveal(options = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      // No IO support → show immediately (progressive enhancement).
      if (el) el.classList.add('is-visible');
      return;
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

// ------------------ Block component -----------------------
// A single editorial block: text column + image column,
// alternating via the `reverse` prop.
function StoryBlock({
  reverse = false,
  eyebrow,
  heading,
  children,
  image,
  imageAlt,
  imageFirst = false,
  blockRef,
}) {
  return (
    <article
      ref={blockRef}
      className="story-block grid md:grid-cols-12 gap-10 md:gap-16 lg:gap-20 items-center"
    >
      {/* Text column — order controlled by `imageFirst` */}
      <div
        className={[
          'story-text md:col-span-5',
          imageFirst ? 'md:order-2' : 'md:order-1',
        ].join(' ')}
      >
        {eyebrow && (
          <p className="story-eyebrow font-body text-[11px] md:text-xs tracking-[0.32em] uppercase text-gold mb-6 md:mb-8">
            {eyebrow}
          </p>
        )}
        {heading && (
          <h3 className="story-heading font-heading text-3xl md:text-4xl lg:text-5xl font-light italic text-marble mb-6 md:mb-8 leading-[1.15]">
            {heading}
          </h3>
        )}
        <div className="story-body font-body text-base md:text-[17px] leading-[1.85] text-marble/70 space-y-5 md:space-y-6 max-w-[44ch]">
          {children}
        </div>
      </div>

      {/* Image column */}
      <div
        className={[
          'story-image-wrap md:col-span-7',
          imageFirst ? 'md:order-1' : 'md:order-2',
        ].join(' ')}
      >
        <figure className="story-figure relative overflow-hidden rounded-[10px] bg-obsidian/40">
          <img
            src={image}
            alt={imageAlt}
            loading="lazy"
            decoding="async"
            draggable="false"
            className="story-img block w-full h-auto object-cover"
          />
        </figure>
      </div>
    </article>
  );
}

// ------------------ Main section -----------------------
export default function AboutSection() {
  // Three independent reveal observers — one per block.
  const block1Ref = useReveal();
  const block2Ref = useReveal();
  const block3Ref = useReveal();

  return (
    <section
      id="about"
      className="relative py-24 md:py-36 lg:py-40 px-6 md:px-10 lg:px-12 overflow-hidden"
    >
      {/* -------- Animations, shadows, reduced motion -------- */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            /* ---- Container + content width ---- */
            .story-container {
              max-width: 1280px;
              margin-left: auto;
              margin-right: auto;
            }

            /* ---- Block spacing (large vertical rhythm) ---- */
            .story-stack {
              display: flex;
              flex-direction: column;
              gap: 7rem;       /* mobile */
            }
            @media (min-width: 768px) {
              .story-stack { gap: 10rem; }   /* tablet */
            }
            @media (min-width: 1024px) {
              .story-stack { gap: 12rem; }   /* desktop */
            }

            /* ---- Image: soft luxury shadow ---- */
            .story-img {
              border-radius: 10px;
              box-shadow:
                0 30px 60px -28px rgba(0, 0, 0, 0.65),
                0 14px 28px -16px rgba(0, 0, 0, 0.40);
              transform: translate3d(0, 0, 0);
              will-change: transform, opacity;
            }

            /* ---- Text/image entrance: initial (hidden) state ---- */
            .story-block .story-eyebrow,
            .story-block .story-heading,
            .story-block .story-body > * {
              opacity: 0;
              transform: translate3d(0, 30px, 0);
              transition:
                opacity 800ms cubic-bezier(0.22, 1, 0.36, 1),
                transform 800ms cubic-bezier(0.22, 1, 0.36, 1);
              will-change: transform, opacity;
            }
            .story-block .story-image-wrap {
              opacity: 0;
              transform: translate3d(0, 20px, 0) scale(0.95);
              transition:
                opacity 900ms cubic-bezier(0.22, 1, 0.36, 1),
                transform 900ms cubic-bezier(0.22, 1, 0.36, 1);
              will-change: transform, opacity;
            }

            /* ---- Revealed state (toggled by IntersectionObserver) ---- */
            .story-block.is-visible .story-eyebrow {
              opacity: 1;
              transform: translate3d(0, 0, 0);
              transition-delay: 0ms;
            }
            .story-block.is-visible .story-heading {
              opacity: 1;
              transform: translate3d(0, 0, 0);
              transition-delay: 120ms;
            }
            .story-block.is-visible .story-body > *:nth-child(1) {
              opacity: 1;
              transform: translate3d(0, 0, 0);
              transition-delay: 240ms;
            }
            .story-block.is-visible .story-body > *:nth-child(2) {
              opacity: 1;
              transform: translate3d(0, 0, 0);
              transition-delay: 340ms;
            }
            .story-block.is-visible .story-body > *:nth-child(3) {
              opacity: 1;
              transform: translate3d(0, 0, 0);
              transition-delay: 440ms;
            }
            .story-block.is-visible .story-body > *:nth-child(4) {
              opacity: 1;
              transform: translate3d(0, 0, 0);
              transition-delay: 540ms;
            }
            .story-block.is-visible .story-body > *:nth-child(5) {
              opacity: 1;
              transform: translate3d(0, 0, 0);
              transition-delay: 640ms;
            }
            .story-block.is-visible .story-body > *:nth-child(6) {
              opacity: 1;
              transform: translate3d(0, 0, 0);
              transition-delay: 740ms;
            }
            .story-block.is-visible .story-body > *:nth-child(7) {
              opacity: 1;
              transform: translate3d(0, 0, 0);
              transition-delay: 840ms;
            }
            .story-block.is-visible .story-body > *:nth-child(8) {
              opacity: 1;
              transform: translate3d(0, 0, 0);
              transition-delay: 940ms;
            }
            .story-block.is-visible .story-body > *:nth-child(9) {
              opacity: 1;
              transform: translate3d(0, 0, 0);
              transition-delay: 1040ms;
            }
            .story-block.is-visible .story-image-wrap {
              opacity: 1;
              transform: translate3d(0, 0, 0) scale(1);
              transition-delay: 100ms;
            }

            /* ---- Highlighted quote ---- */
            .story-quote {
              border-left: 1px solid rgba(197, 160, 89, 0.45);
              padding-left: 1.5rem;
              font-family: 'Cormorant Garamond', serif;
              font-style: italic;
              font-size: 1.35rem;
              line-height: 1.6;
              color: rgba(235, 235, 235, 0.85);
            }
            @media (min-width: 768px) {
              .story-quote {
                font-size: 1.5rem;
                padding-left: 1.75rem;
              }
            }

            /* ---- Reduced motion: skip the entrance, show final state ---- */
            @media (prefers-reduced-motion: reduce) {
              .story-block .story-eyebrow,
              .story-block .story-heading,
              .story-block .story-body > *,
              .story-block .story-image-wrap {
                opacity: 1;
                transform: none;
                transition: none;
              }
            }

            /* ---- Responsive tweaks ---- */
            @media (max-width: 767px) {
              .story-stack { gap: 5rem; }
              .story-figure { max-width: 100%; }
            }
          `,
        }}
      />

      <div className="story-container">
        {/* Optional small overline + section heading (very subtle) */}
        <div className="mb-20 md:mb-28 lg:mb-32 max-w-3xl">
          <p className="font-body text-[11px] md:text-xs tracking-[0.32em] uppercase text-gold mb-5">
            Notre Histoire
          </p>
          <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl font-light italic text-marble leading-[1.1]">
            Là où Fès rencontre la Méditerranée
          </h2>
          <div className="gold-line w-16 mt-8" />
        </div>

        {/* Three editorial blocks */}
        <div className="story-stack">
          {/* ----- BLOCK 1: text LEFT, image RIGHT ----- */}
          <StoryBlock
            blockRef={block1Ref}
            eyebrow="L'Atelier"
            heading="Une maison, une atmosphère, une signature."
            image="/Histoire/1.webp"
            imageAlt="L'Atelier Restaurant — intérieur et ambiance"
            imageFirst={false}
          >
            <p>
              Au cœur de Fès, à deux pas du Rond-point Marjane, L'Atelier
              est bien plus qu'un restaurant — c'est un atelier culinaire
              où chaque plat est une œuvre d'art. Notre cuisine fusionne
              les saveurs authentiques du Maroc avec l'élégance de la
              gastronomie méditerranéenne.
            </p>
            <p>
              Dans un cadre intimiste baigné de lumières tamisées et bercé
              par des concerts live, nous vous invitons à vivre une
              expérience gastronomique unique — des grillades flambées aux
              pizzas artisanales, des pâtes fraîches aux desserts
              d'exception.
            </p>
          </StoryBlock>

          {/* ----- BLOCK 2: image LEFT, text RIGHT ----- */}
          <StoryBlock
            blockRef={block2Ref}
            eyebrow="La philosophie"
            heading="Une cuisine de saison, sincère et vivante."
            image="/Histoire/2.webp"
            imageAlt="Cuisine ouverte, gestes précis et produits frais"
            imageFirst={true}
          >
            <p>
              Notre cuisine est un dialogue permanent entre la Méditerranée
              et le Maroc. Les herbes aromatiques, les agrumes, les huiles
              d'olive pressées à froid, les épices torréfiées sur place
              arrivent chaque matin pour composer des assiettes justes,
              lisibles, vibrantes.
            </p>
            <p>
              Chaque geste compte : pâtes façonnées à la main, pâte à
              pizza fermentée 48 heures, grillades au feu de bois, sauces
              longuement mijotées. Le produit dicte la partition, le chef
              ne fait que révéler ce qu'il a de meilleur.
            </p>
            <p>
              Nous travaillons main dans la main avec des producteurs
              locaux et des artisans qui partagent notre exigence. C'est
              cette alliance du savoir-faire et du terroir qui donne à
              L'Atelier sa voix.
            </p>
          </StoryBlock>

          {/* ----- BLOCK 3: text LEFT, image RIGHT ----- */}
          <StoryBlock
            blockRef={block3Ref}
            eyebrow="L'expérience"
            heading="Plus qu'un repas : un moment suspendu."
            image="/Histoire/3.webp"
            imageAlt="Service attentionné, ambiance feutrée et live music"
            imageFirst={false}
          >
            <p>
              L'Atelier a été pensé comme un lieu où l'on prend le temps.
              Le temps de s'installer, d'échanger, de lever son verre, de
              laisser la musique live tisser un fil discret entre les
              tables. Notre équipe de salle veille à chaque détail avec
              chaleur et discrétion.
            </p>
            <p>
              Que ce soit pour un dîner intime, une table d'amis ou une
              occasion particulière, nous composons chaque moment avec
              attention. La cave, les cocktails signatures et la carte
              des desserts prolongent l'expérience jusqu'au dernier
              instant de la soirée.
            </p>
            <blockquote className="story-quote">
              « Une table où l'on revient, non par habitude, mais par
              désir. »
            </blockquote>
          </StoryBlock>
        </div>
      </div>
    </section>
  );
}
