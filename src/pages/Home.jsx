import React from 'react';
import Navigation from '@/components/restaurant/Navigation';
import HeroPanels from '@/components/restaurant/HeroPanels';
import WelcomeSection from '@/components/restaurant/WelcomeSection';
import Marquee from '@/components/restaurant/Marquee';
import GalleryMarquee from '@/components/restaurant/GalleryMarquee';
import AboutSection from '@/components/restaurant/AboutSection';
import MenuMarquee from '@/components/restaurant/MenuMarquee';
import MenuSection from '@/components/restaurant/MenuSection';
import ReviewsSection from '@/components/restaurant/ReviewsSection';
import HoursSection from '@/components/restaurant/HoursSection';
import LocationSection from '@/components/restaurant/LocationSection';
import InfoSection from '@/components/restaurant/InfoSection';
import Footer from '@/components/restaurant/Footer';
import FluidCursor from '@/components/restaurant/FluidCursor';
import TypographyBackground from '@/components/restaurant/TypographyBackground';
import ReservationModal from '@/components/restaurant/ReservationModal';

export default function Home() {
  return (
    <div className="min-h-screen bg-obsidian text-marble overflow-x-hidden">
      <TypographyBackground />
      <FluidCursor />
      <Navigation />
      <HeroPanels />

      {/* Gold separator */}
      <div className="px-6 md:px-12">
        <div className="gold-line max-w-6xl mx-auto" />
      </div>

      <Marquee />

      <WelcomeSection />

      <GalleryMarquee />

      <AboutSection />

      <div className="px-6 md:px-12">
        <div className="gold-line max-w-6xl mx-auto" />
      </div>

      <MenuMarquee />

      <MenuSection />

      <div className="px-6 md:px-12">
        <div className="gold-line max-w-6xl mx-auto" />
      </div>

      <HoursSection />

      <div className="px-6 md:px-12">
        <div className="gold-line max-w-6xl mx-auto" />
      </div>

      <ReviewsSection />

      <div className="px-6 md:px-12">
        <div className="gold-line max-w-6xl mx-auto" />
      </div>

      <LocationSection />

      <div className="px-6 md:px-12">
        <div className="gold-line max-w-6xl mx-auto" />
      </div>

      <InfoSection />

      <Footer />

      <ReservationModal />
    </div>
  );
}