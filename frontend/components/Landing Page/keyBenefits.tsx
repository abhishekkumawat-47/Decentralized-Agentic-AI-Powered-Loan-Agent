"use client"

import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useTranslations } from 'next-intl';

gsap.registerPlugin(ScrollTrigger);

const KeyBenefits = () => {
  const cardsRef = useRef<HTMLDivElement[]>([]);
  const t = useTranslations();

  const benefits = [
    {
      number: '01',
      titleKey: 'keyBenefits.benefit1.title',
      descriptionKey: 'keyBenefits.benefit1.description',
    },
    {
      number: '02',
      titleKey: 'keyBenefits.benefit2.title',
      descriptionKey: 'keyBenefits.benefit2.description',
    },
    {
      number: '03',
      titleKey: 'keyBenefits.benefit3.title',
      descriptionKey: 'keyBenefits.benefit3.description',
    },
    {
      number: '04',
      titleKey: 'keyBenefits.benefit4.title',
      descriptionKey: 'keyBenefits.benefit4.description',
    },
    {
      number: '05',
      titleKey: 'keyBenefits.benefit5.title',
      descriptionKey: 'keyBenefits.benefit5.description',
    },
    {
      number: '06',
      titleKey: 'keyBenefits.benefit6.title',
      descriptionKey: 'keyBenefits.benefit6.description',
    },
  ];

  useEffect(() => {
    const cards = cardsRef.current;
    
    cards.forEach((card, index) => {
      gsap.fromTo(
        card,
        { opacity: 0, scale: 0.92, y: 25 },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.45,
          delay: index * 0.06,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: card,
            start: 'top 90%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    });
  }, []);

  return (
    <section id="features" className="py-24 relative">
      <div className="absolute inset-0 circuit-pattern opacity-20" />
      
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="flex items-center justify-center gap-4 mb-16"
        >
          <span className="section-dot" />
          <h2 className="font-display text-center text-2xl md:text-3xl font-bold tracking-wider text-foreground">
            {t("keyBenefits.title")}
          </h2>
          <span className="section-dot" />
        </motion.div>

        {/* Benefits Grid - 2x3 */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {benefits.map((benefit, index) => (
            <div
              key={benefit.number}
              ref={(el) => { if (el) cardsRef.current[index] = el; }}
              className="glass-card rounded-xl p-6 group"
            >
              <motion.div
                className="w-16 h-16 mb-4 rounded-full bg-card border border-primary/30 flex items-center justify-center text-primary group-hover:border-primary/70 transition-all group-hover:shadow-[0_0_20px_hsl(0_100%_50%/0.3)]"
              >
                {benefit.number}
              </motion.div>
              <h3 className="font-display text-base font-bold mb-2 text-foreground tracking-wide">
                {t(benefit.titleKey)}
              </h3>
              <p className="text-sm text-muted-foreground tracking-wide">{t(benefit.descriptionKey)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default KeyBenefits;