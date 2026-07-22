/* ============================================================
   mobileHeroSlides — copy + imagery for the mobile Hero.

   This file is the ONLY place to edit mobile Hero text. It is
   plain data with no JSX and no logic, so changing a headline
   never risks the animation code in MobileHero.jsx.

   Each slide is:
     image        fixed — one of the six 1440x2560 frames in
                  public/PhoneHero/. Used at native size, never
                  resized or recompressed. The L'Atelier logo is
                  baked into the artwork near the top of every
                  frame, which is why the Hero draws no logo of
                  its own and why the text block sits low.
     label        small gold category line
     title        large white headline
     description  2–3 lines; longer copy is clamped in CSS
     isPlaceholder
                  marker only — drives no behaviour. Flags a slide
                  whose copy is borrowed from another scene because
                  the desktop Hero only ships four scenes for six
                  images. Replace label/title/description and drop
                  the flag.

   Slide order is the render order. To reorder, move the objects.
   ============================================================ */

// Shared by every slide — the same CTA the desktop Hero uses.
export const CTA = { label: 'Voir notre menu', href: '#menu' };

export const MOBILE_HERO_SLIDES = [
  {
    // Wood-fired oven, flames. Opens the sequence.
    image: '/PhoneHero/1.webp',
    label: 'Raffinement et saveurs',
    title: "Expérience gastronomique d'exception",
    description:
      'Dégustez des plats raffinés préparés avec des ingrédients de première qualité. Chaque assiette est une œuvre d’art culinaire.',
    isPlaceholder: true,
  },
  {
    // Pizza at the fire.
    image: '/PhoneHero/2.webp',
    label: 'Raffinement et saveurs',
    title: "Expérience gastronomique d'exception",
    description:
      'Dégustez des plats raffinés préparés avec des ingrédients de première qualité. Chaque assiette est une œuvre d’art culinaire.',
  },
  {
    // Table setting, brass lamp — the room itself.
    image: '/PhoneHero/3.webp',
    label: 'Ambiance chaleureuse et réconfortante',
    title: 'Une expérience de confort absolu',
    description:
      'Plongez dans une atmosphère accueillante et apaisante, où chaque instant rime avec bien-être.',
  },
  {
    // Sushi platter.
    image: '/PhoneHero/4.webp',
    label: "L'art de la mixologie",
    title: "Des cocktails d'exception",
    description:
      'Des cocktails raffinés, élaborés avec un savoir-faire unique. Une expérience sensorielle où chaque gorgée est un voyage.',
    isPlaceholder: true,
  },
  {
    // Cocktail, close.
    image: '/PhoneHero/5.webp',
    label: "L'art de la mixologie",
    title: "Des cocktails d'exception",
    description:
      'Des cocktails raffinés, élaborés avec un savoir-faire unique. Une expérience sensorielle où chaque gorgée est un voyage.',
  },
  {
    // Bar, bokeh — closes on the evening.
    image: '/PhoneHero/6.webp',
    label: 'Divertissements en direct',
    title: 'Dîner avec des spectacles en direct',
    description:
      'Venez savourer un dîner exceptionnel tout en profitant de spectacles en direct. Chaque soir, un live band anime l’ambiance.',
  },
];
