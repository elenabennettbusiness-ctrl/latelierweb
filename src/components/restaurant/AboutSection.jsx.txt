import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

export default function AboutSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="about" className="relative py-24 md:py-40 px-6 md:px-12 overflow-hidden">
      <div className="max-w-6xl mx-auto" ref={ref}>
        {/* Gold line */}
        <div className="gold-line w-24 mb-12" />

        <div className="grid md:grid-cols-2 gap-16 md:gap-24 items-center">
          {/* Text */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="font-body text-xs tracking-[0.3em] uppercase text-gold mb-4">
              Notre Histoire
            </p>
            <h2 className="font-heading text-4xl md:text-6xl font-light italic text-marble mb-8 leading-tight">
              Là où Fès rencontre la Méditerranée
            </h2>
            <div className="space-y-6">
              <p className="font-body text-base leading-relaxed text-marble/70">
                Au cœur de Fès, à deux pas du Rond-point Marjane, L'Atelier est bien plus qu'un restaurant — c'est un atelier culinaire où chaque plat est une œuvre d'art. Notre cuisine fusionne les saveurs authentiques du Maroc avec l'élégance de la gastronomie méditerranéenne.
              </p>
              <p className="font-body text-base leading-relaxed text-marble/70">
                Dans un cadre intimiste baigné de lumières tamisées et bercé par des concerts live, nous vous invitons à vivre une expérience gastronomique unique — des grillades flambées aux pizzas artisanales, des pâtes fraîches aux desserts d'exception.
              </p>
            </div>

            <div className="mt-10 flex items-center gap-8">
              <div>
                <p className="font-heading text-4xl italic text-gold">3.9</p>
                <p className="font-body text-xs text-marble/50 tracking-wider uppercase mt-1">Google · 235 avis</p>
              </div>
              <div className="w-[0.5px] h-12 bg-gold/30" />
              <div>
                <p className="font-heading text-4xl italic text-gold">50-250</p>
                <p className="font-body text-xs text-marble/50 tracking-wider uppercase mt-1">MAD par personne</p>
              </div>
            </div>
          </motion.div>

          {/* Image */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, x: 40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="relative overflow-hidden">
              <img
                src="https://media.base44.com/images/public/user_6a41c4d745d7d2a779b8a3c7/d2c5b3b09_munucenimaticimage.png"
                alt="L'Atelier Restaurant menu"
                className="w-full h-auto object-cover"
              />
              <div className="absolute inset-0 border border-gold/20" />
            </div>
            {/* Decorative gold corner */}
            <div className="absolute -top-4 -right-4 w-24 h-24 border-t border-r border-gold/30" />
            <div className="absolute -bottom-4 -left-4 w-24 h-24 border-b border-l border-gold/30" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}