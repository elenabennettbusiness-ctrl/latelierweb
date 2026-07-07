import React from 'react';
import Navigation from '@/components/restaurant/Navigation';
import HeroPanels from '@/components/restaurant/HeroPanels';
import AboutSection from '@/components/restaurant/AboutSection';
import MenuSection from '@/components/restaurant/MenuSection';
import GallerySection from '@/components/restaurant/GallerySection';
import ReviewsSection from '@/components/restaurant/ReviewsSection';
import InfoSection from '@/components/restaurant/InfoSection';
import ReservationBar from '@/components/restaurant/ReservationBar';
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

      <AboutSection />

      <div className="px-6 md:px-12">
        <div className="gold-line max-w-6xl mx-auto" />
      </div>

      <MenuSection />

      <div className="px-6 md:px-12">
        <div className="gold-line max-w-6xl mx-auto" />
      </div>

      <GallerySection />

      <div className="px-6 md:px-12">
        <div className="gold-line max-w-6xl mx-auto" />
      </div>

      <ReviewsSection />

      <div className="px-6 md:px-12">
        <div className="gold-line max-w-6xl mx-auto" />
      </div>

      <InfoSection />

      <Footer />
      <ReservationBar />

      {/* Bottom padding for sticky bar */}
      <div className="h-16" />
    </div>
  );
}