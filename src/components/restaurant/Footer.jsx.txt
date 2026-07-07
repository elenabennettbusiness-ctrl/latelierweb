import React from 'react';
import { MapPin, Phone, Instagram } from 'lucide-react';

export default function Footer() {
  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer className="relative py-16 md:py-24 px-6 md:px-12 border-t border-gold/10">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-3 gap-12 md:gap-16 mb-16">
          {/* Brand */}
          <div>
            <img
              src="https://media.base44.com/images/public/user_6a41c4d745d7d2a779b8a3c7/560a45fdc_Logov1.png"
              alt="L'Atelier Restaurant"
              className="h-14 w-auto mb-6"
            />
            <p className="font-body text-sm text-marble/50 leading-relaxed max-w-xs">
              Une expérience gastronomique où le patrimoine de Fès rencontre la précision de l'art culinaire méditerranéen.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-heading text-lg text-gold mb-6">Navigation</h4>
            <div className="space-y-3">
              {[
                { id: 'hero', label: 'Accueil' },
                { id: 'about', label: 'Notre Histoire' },
                { id: 'menu', label: 'La Carte' },
                { id: 'gallery', label: 'Galerie' },
                { id: 'reviews', label: 'Avis' },
                { id: 'info', label: 'Informations' },
              ].map(link => (
                <button
                  key={link.id}
                  onClick={() => scrollTo(link.id)}
                  className="block font-body text-sm text-marble/40 hover:text-gold transition-colors tracking-wide"
                >
                  {link.label}
                </button>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-heading text-lg text-gold mb-6">Contact</h4>
            <div className="space-y-4">
              <a
                href="https://www.google.com/maps/place/L%E2%80%99atelier+Restaurant/@34.0479463,-5.0378838,17z"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 font-body text-sm text-marble/40 hover:text-gold transition-colors"
              >
                <MapPin size={16} className="mt-0.5 flex-shrink-0" />
                Rond point Marjane, Fès 30000
              </a>
              <a
                href="tel:+212535757619"
                className="flex items-center gap-3 font-body text-sm text-marble/40 hover:text-gold transition-colors"
              >
                <Phone size={16} className="flex-shrink-0" />
                05 35 75 76 19
              </a>
              <a
                href="https://instagram.com/latelier_restaurant_fes"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 font-body text-sm text-marble/40 hover:text-gold transition-colors"
              >
                <Instagram size={16} className="flex-shrink-0" />
                @latelier_restaurant_fes
              </a>
            </div>
          </div>
        </div>

        <div className="gold-line w-full mb-8" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-body text-[10px] text-marble/25 tracking-wider">
            © {new Date().getFullYear()} L'Atelier Restaurant Fès. Tous droits réservés.
          </p>
          <div className="flex items-center gap-6">
            <a href="https://latelierrestaurant.ma" target="_blank" rel="noopener noreferrer" className="font-body text-[10px] text-marble/25 hover:text-gold transition-colors tracking-wider uppercase">
              latelierrestaurant.ma
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}