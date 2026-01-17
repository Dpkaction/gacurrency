import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import AboutSection from "@/components/AboutSection";
import PhasesSection from "@/components/PhasesSection";
import NotificationsSection from "@/components/NotificationsSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSection />
        <AboutSection />
        <PhasesSection />
        <NotificationsSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
