"use client"

import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const benefits = [
  {
    number: '01',
    title: 'INSTANT DECISIONS',
    description: 'Complete loan journeys in under Few Minutes with automated agent orchestration.',
  },
  {
    number: '02',
    title: 'TRANSPARENT DECISIONS',
    description: 'Every approval and rejection is logged on blockchain for complete auditability.',
  },
  {
    number: '03',
    title: 'ZERO HUMAN ERROR',
    description: 'Agentic AI follows strict workflows with guardrails to remove manual mistakes.',
  },
  {
    number: '04',
    title: 'FASTER VERIFICATION',
    description: 'Automated KYC, OCR, and credit checks remove manual delays completely.',
  },
  {
    number: '05',
    title: 'BUILT-IN COMPLIANCE',
    description: 'Blockchain-backed audit trails make regulatory checks and reporting effortless.',
  },
  {
    number: '06',
    title: 'COST-EFFICIENT AI',
    description: 'Small Language Models cut inference costs by 97% with no drop in reasoning quality.',
  },
];

const KeyBenefits = () => {
  const cardsRef = useRef<HTMLDivElement[]>([]);

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
            WHY CHOOSE OUR SOLUTION
          </h2>
          <span className="section-dot" />
        </motion.div>

        {/* Benefits Grid - 2x3 */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {benefits.map((benefit, index) => (
            <div
              key={benefit.title}
              ref={(el) => { if (el) cardsRef.current[index] = el; }}
              className="glass-card rounded-xl p-6 group"
            >
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="w-16 h-16 mb-4 rounded-full bg-card border border-primary/30 flex items-center justify-center text-primary group-hover:border-primary/70 transition-all group-hover:shadow-[0_0_20px_hsl(0_100%_50%/0.3)]"
              >
                {benefit.number}
              </motion.div>
              <h3 className="font-display text-base font-bold mb-2 text-foreground tracking-wide">
                {benefit.title}
              </h3>
              <p className="text-sm text-muted-foreground tracking-wide">{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default KeyBenefits;