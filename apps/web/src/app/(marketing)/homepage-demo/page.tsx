export const dynamic = 'force-dynamic';

import HeroSection from "@/components/sections/HeroSection";
import FeaturesSection from "@/components/sections/FeaturesSection";
import TestimonialsSection from "@/components/sections/TestimonialsSection";
import PerformanceHUD from "@/components/PerformanceHUD";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <TestimonialsSection />
      <PerformanceHUD />
    </>
  );
}
