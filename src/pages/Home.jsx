import React from 'react';
import Navigation from '@/components/restaurant/Navigation';
import HeroPanels from '@/components/restaurant/HeroPanels';
import Marquee from '@/components/restaurant/Marquee';
import GalleryMarquee from '@/components/restaurant/GalleryMarquee';
import AboutSection from '@/components/restaurant/AboutSection';
import MenuMarquee from '@/components/restaurant/MenuMarquee';
import MenuSection from '@/components/restaurant/MenuSection';
import ReviewsSection from '@/components/restaurant/ReviewsSection';
import InfoSection from '@/components/restaurant/InfoSection';
import Footer from '@/components/restaurant/Footer';
import FluidCursor from '@/components/restaurant/FluidCursor';

export default function Home() {
  return (
    <div className="min-h-screen bg-obsidian text-marble overflow-x-hidden">
      <FluidCursor />
      <Navigation />
      <HeroPanels />

      {/* Gold separator */}
      <div className="px-6 md:px-12">
        <div className="gold-line max-w-6xl mx-auto" />
      </div>

      <Marquee />

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

      <ReviewsSection />

      <div className="px-6 md:px-12">
        <div className="gold-line max-w-6xl mx-auto" />
      </div>

      <InfoSection />

      <Footer />
    </div>
  );
}