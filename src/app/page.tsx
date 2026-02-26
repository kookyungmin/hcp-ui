import { HeroSection } from "@/features/landing/ui/hero-section";
import { ServiceGrid } from "@/features/landing/ui/service-grid";
import { Footer } from "@/widgets/footer";
import { TopNav } from "@/widgets/top-nav";

export default function HomePage() {
  return (
    <>
      <TopNav />
      <main>
        <HeroSection />
        <ServiceGrid />
      </main>
      <Footer />
    </>
  );
}
