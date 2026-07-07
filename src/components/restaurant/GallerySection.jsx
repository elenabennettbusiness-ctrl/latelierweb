import React, { useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const galleryPanels = [
  {
    image: "https://media.base44.com/images/public/user_6a41c4d745d7d2a779b8a3c7/299be3c6a_Heroimage1.png",
    label: "Ambiance chaleureuse",
    title: "Une expérience de confort absolu",
    description: "Plongez dans un univers où chaque détail est pensé pour votre bien-être."
  },
  {
    image: "https://media.base44.com/images/public/user_6a41c4d745d7d2a779b8a3c7/87b0d1675_Heroimage2.png",
    label: "Soirées musicales",
    title: "Des mélodies qui enchantent",
    description: "Guitare acoustique, jazz et ambiances sonores pour une soirée mémorable."
  },
  {
    image: "https://media.base44.com/images/public/user_6a41c4d745d7d2a779b8a3c7/6494218b2_Heroimage3.png",
    label: "L'art de la flamme",
    title: "Cuisine vivante",
    description: "Nos chefs repoussent les limites de la gastronomie avec passion."
  },
  {
    image: "https://media.base44.com/images/public/user_6a41c4d745d7d2a779b8a3c7/766adde59_Heroimage4.png",
    label: "Fraîcheur garantie",
    title: "Des produits d'exception",
    description: "Sashimis, carpaccios et plats de la mer préparés minute."
  },
];

export default function GallerySection() {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <section id="gallery" className="relative py-24 md:py-40 overflow-hidden">
      <div className="max-w-6xl mx-auto px-6 md:px-12 mb-16" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-center"
        >
          <p className="font-body text-xs tracking-[0.3em] uppercase text-gold mb-4">Galerie</p>
          <h2 className="font-heading text-4xl md:text-6xl font-light italic text-marble mb-4">
            L'Expérience Visuelle
          </h2>
          <div className="gold-line w-16 mx-auto" />
        </motion.div>
      </div>

      {/* Desktop: hover expand panels */}
      <div className="hidden md:flex w-full h-[70vh] min-h-[500px]">
        {galleryPanels.map((panel, i) => {
          const isHovered = hoveredIndex === i;
          const someoneHovered = hoveredIndex !== null;
          return (
            <div
              key={i}
              className="relative overflow-hidden cursor-pointer"
              style={{
                flex: isHovered ? '4 1 0%' : someoneHovered ? '1 1 0%' : '1 1 0%',
                transition: 'flex 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
              }}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: `url('${panel.image}')`,
                  filter: someoneHovered && !isHovered ? 'blur(2px) brightness(0.35)' : 'brightness(0.6)',
                  transform: isHovered ? 'scale(1.08)' : 'scale(1)',
                  transition: 'all 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              {i > 0 && (
                <div className="absolute left-0 top-[10%] bottom-[10%] w-[0.5px] bg-gold/20" />
              )}

              <div className="absolute bottom-0 left-0 right-0 p-8 z-10">
                <p className="font-body text-[10px] tracking-[0.3em] uppercase text-gold mb-2">
                  {panel.label}
                </p>
                <h3 className="font-heading text-2xl md:text-3xl font-light italic text-marble mb-2">
                  {panel.title}
                </h3>
                <p
                  className="font-body text-sm text-marble/60 max-w-xs"
                  style={{
                    opacity: isHovered ? 1 : 0,
                    transform: isHovered ? 'translateY(0)' : 'translateY(10px)',
                    transition: 'all 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
                    transitionDelay: isHovered ? '0.1s' : '0s',
                  }}
                >
                  {panel.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile: stacked */}
      <div className="md:hidden space-y-4 px-6">
        {galleryPanels.map((panel, i) => (
          <div key={i} className="relative h-64 overflow-hidden">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url('${panel.image}')` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
              <p className="font-body text-[10px] tracking-[0.3em] uppercase text-gold mb-1">{panel.label}</p>
              <h3 className="font-heading text-xl font-light italic text-marble mb-1">{panel.title}</h3>
              <p className="font-body text-xs text-marble/60">{panel.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}