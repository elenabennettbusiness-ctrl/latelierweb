import React, { useRef, useEffect, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { Star } from 'lucide-react';

const reviews = [
  {
    name: 'Yassine M.',
    rating: 5,
    text: 'Un cadre magnifique, une ambiance top et une cuisine délicieuse. Le Big Medina est un must ! Le service est impeccable.',
    date: 'Il y a 2 semaines'
  },
  {
    name: 'Sarah L.',
    rating: 5,
    text: 'Les pizzas sont excellentes, surtout la Quatre Saisons. L\'ambiance avec la musique live le weekend est parfaite pour un dîner en couple.',
    date: 'Il y a 1 mois'
  },
  {
    name: 'Ahmed B.',
    rating: 4,
    text: 'Très bon restaurant avec un large choix de plats. L\'entrecôte était parfaitement cuite. Terrasse agréable. Je recommande vivement.',
    date: 'Il y a 3 semaines'
  },
  {
    name: 'Marie D.',
    rating: 5,
    text: 'Le tiramisu est divin ! Endroit parfait pour un dîner d\'anniversaire. Le personnel est aux petits soins. Bravo à toute l\'équipe.',
    date: 'Il y a 1 mois'
  },
  {
    name: 'Karim H.',
    rating: 4,
    text: 'Excellents cocktails et plats halal de qualité. Le carpaccio de bœuf est un régal. Parking facile à trouver.',
    date: 'Il y a 2 mois'
  },
  {
    name: 'Nadia R.',
    rating: 5,
    text: 'Notre restaurant préféré à Fès ! Les pâtes carbonara sont incroyables. Ambiance décontractée mais élégante.',
    date: 'Il y a 3 semaines'
  },
];

function ReviewCard({ review, index }) {
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const cardRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    });
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setMousePos({ x: 0.5, y: 0.5 })}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="relative p-6 md:p-8 rounded-sm overflow-hidden group cursor-default"
      style={{
        background: `radial-gradient(circle at ${mousePos.x * 100}% ${mousePos.y * 100}%, rgba(197,160,89,0.08) 0%, rgba(10,10,10,0.95) 70%)`,
        border: '0.5px solid rgba(197,160,89,0.15)',
        transform: `perspective(1000px) rotateX(${(mousePos.y - 0.5) * -3}deg) rotateY(${(mousePos.x - 0.5) * 3}deg)`,
        transition: 'transform 0.2s ease-out, background 0.3s ease-out',
      }}
    >
      {/* Glow border effect */}
      <div
        className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `radial-gradient(200px circle at ${mousePos.x * 100}% ${mousePos.y * 100}%, rgba(197,160,89,0.12), transparent 70%)`,
        }}
      />

      <div className="relative z-10">
        <div className="flex items-center gap-1 mb-4">
          {Array.from({ length: 5 }, (_, i) => (
            <Star
              key={i}
              size={14}
              className={i < review.rating ? 'fill-gold text-gold' : 'text-marble/20'}
            />
          ))}
        </div>
        <p className="font-body text-sm md:text-base leading-relaxed text-marble/80 mb-6 italic">
          "{review.text}"
        </p>
        <div className="flex items-center justify-between">
          <p className="font-heading text-lg text-gold">{review.name}</p>
          <p className="font-body text-[10px] text-marble/30 tracking-wider uppercase">{review.date}</p>
        </div>
      </div>
    </motion.div>
  );
}

export default function ReviewsSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <section id="reviews" className="relative py-24 md:py-40 px-6 md:px-12 overflow-hidden">
      <div className="max-w-6xl mx-auto" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-16"
        >
          <p className="font-body text-xs tracking-[0.3em] uppercase text-gold mb-4">Avis Clients</p>
          <h2 className="font-heading text-4xl md:text-6xl font-light italic text-marble mb-4">
            Ils en Parlent
          </h2>
          <div className="gold-line w-16 mx-auto mb-6" />
          <div className="flex items-center justify-center gap-2">
            <div className="flex gap-0.5">
              {[1,2,3,4].map(i => <Star key={i} size={18} className="fill-gold text-gold" />)}
              <Star size={18} className="fill-gold/50 text-gold/50" />
            </div>
            <span className="font-heading text-2xl text-gold ml-2">3.9</span>
            <span className="font-body text-xs text-marble/40 ml-1">/ 5 — 235 avis Google</span>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((review, i) => (
            <ReviewCard key={i} review={review} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}