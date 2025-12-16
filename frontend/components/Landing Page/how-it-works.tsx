"use client"

import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useTranslations } from 'next-intl';

gsap.registerPlugin(ScrollTrigger);

const getStepIcon = (number: string) => {
  switch(number) {
    case '01':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user-round-search-icon lucide-user-round-search">
          <circle cx="10" cy="8" r="5"/>
          <path d="M2 21a8 8 0 0 1 10.434-7.62"/>
          <circle cx="18" cy="18" r="3"/>
          <path d="m22 22-1.9-1.9"/>
        </svg>
      );
    case '02':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-search-corner-icon lucide-file-search-corner">
          <path d="M11.1 22H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.706.706l3.589 3.588A2.4 2.4 0 0 1 20 8v3.25"/>
          <path d="M14 2v5a1 1 0 0 0 1 1h5"/>
          <path d="m21 22-2.88-2.88"/>
          <circle cx="16" cy="17" r="3"/>
        </svg>
      );
    case '03':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shield-question-mark-icon lucide-shield-question-mark">
          <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>
          <path d="M9.1 9a3 3 0 0 1 5.82 1c0 2-3 3-3 3"/>
          <path d="M12 17h.01"/>
        </svg>
      );
    case '04':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-notebook-pen-icon lucide-notebook-pen">
          <path d="M13.4 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7.4"/>
          <path d="M2 6h4"/>
          <path d="M2 10h4"/>
          <path d="M2 14h4"/>
          <path d="M2 18h4"/>
          <path d="M21.378 5.626a1 1 0 1 0-3.004-3.004l-5.01 5.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z"/>
        </svg>
      );
    case '05':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-clipboard-check-icon lucide-clipboard-check">
          <rect width="8" height="4" x="8" y="2" rx="1" ry="1"/>
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
          <path d="m9 14 2 2 4-4"/>
        </svg>
      );
    default:
      return null;
  }
};

const steps = [
  {
    number: '01',
    titleKey: 'howItWorks.steps.step1.title',
    descriptionKey: 'howItWorks.steps.step1.description',
  },
  {
    number: '02',
    titleKey: 'howItWorks.steps.step2.title',
    descriptionKey: 'howItWorks.steps.step2.description',
  },
  {
    number: '03',
    titleKey: 'howItWorks.steps.step3.title',
    descriptionKey: 'howItWorks.steps.step3.description',
  },
  {
    number: '04',
    titleKey: 'howItWorks.steps.step4.title',
    descriptionKey: 'howItWorks.steps.step4.description',
  },
  {
    number: '05',
    titleKey: 'howItWorks.steps.step5.title',
    descriptionKey: 'howItWorks.steps.step5.description',
  },
];


const HowItWorks = () => {
  const t = useTranslations();

  return (
    <section id="how-it-works" className="py-24 relative">
      <div className="absolute inset-0 circuit-pattern opacity-20" />
      
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="flex text-center items-center justify-center gap-4 mb-16"
        >
          <span className="section-dot" />
          <h2 className="font-display text-2xl md:text-3xl font-bold tracking-wider text-foreground">
            {t("howItWorks.title")}
          </h2>
          <span className="section-dot" />
        </motion.div>

        {/* Steps */}
        <div className="relative max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step) => (
              <div
                key={step.number}
                className="glass-card rounded-xl p-8 text-center group relative"
              >
                {/* Step number badge */}
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white font-display font-bold px-4 py-1 rounded text-sm">
                  {step.number}
                </div>
                
                <motion.div
                  className="w-20 h-20 mx-auto mb-6 rounded-full bg-card border border-primary/30 flex items-center justify-center text-primary group-hover:border-primary/70 transition-all group-hover:shadow-glow-lg"
                >
                  {getStepIcon(step.number)}
                </motion.div>
                <h3 className="font-display text-lg font-bold mb-3 text-foreground tracking-wide">
                  {t(step.titleKey)}
                </h3>
                <p className="text-muted-foreground tracking-wide">{t(step.descriptionKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;