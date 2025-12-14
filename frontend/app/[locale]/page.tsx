"use client"

import HeroSection from "@/components/Landing Page/hero-section";
import HowItWorks from "@/components/Landing Page/how-it-works";
import Introduction from "@/components/Landing Page/introduction";
import KeyBenefits from "@/components/Landing Page/keyBenefits";
import Header from "@/components/Navbar/navbar";
import PartnersMarquee from "@/components/Landing Page/techonology";
import Footer from "@/components/footer";
import FinalCTA from "@/components/Landing Page/finalCTA";

const Index = () => {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Header />
      <main>
        <HeroSection />
        <Introduction />
        <HowItWorks />
        <KeyBenefits />
        <PartnersMarquee />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
