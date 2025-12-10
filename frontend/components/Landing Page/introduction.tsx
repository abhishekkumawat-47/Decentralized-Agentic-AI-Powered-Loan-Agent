"use client"

import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Ban, SearchCheck } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const oldWay = [
  { text: 'Slow approval process' },
  { text: 'Human bias in decisions' },
  { text: 'Manual documentation' },
  { text: 'Centralized control' },
];

const newWay = [
  { text: 'Instant automated decisions' },
  { text: 'Unbiased AI analysis' },
  { text: 'On-chain verification' },
  { text: 'Fully decentralized' },
];

const Introduction = () => {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (sectionRef.current) {
      gsap.fromTo(
        sectionRef.current.querySelectorAll('.fade-item'),
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.1,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    }
  }, []);

  return (
    <section ref={sectionRef} className="py-24 relative">
      <div className="absolute inset-0 circuit-pattern opacity-20" />
      
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-display  text-center text-3xl md:text-4xl font-bold text-primary text-glow tracking-wider mb-4">
            THE OLD WAY IS BROKEN
          </h2>
        </motion.div>

        {/* Comparison Grid */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Traditional Finance */}
          <div className="glass-card rounded-xl p-8 border-primary/50" style={{ boxShadow: '0 0 30px hsl(0 100% 50% / 0.2)' }}>
            <h3 className="font-display text-xl font-bold text-primary text-glow-subtle mb-6 tracking-wide">
              Traditional Finance
            </h3>
            <div className="space-y-4">
              {oldWay.map((item, index) => (
                <div key={index} className="fade-item flex items-center gap-4 text-muted-foreground">
                  <span className="text-foreground"><Ban /></span>
                  <span className="tracking-wide">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* NeoFin Agentic AI */}
          <div className="glass-card rounded-xl p-8 border-primary/50" style={{ boxShadow: '0 0 30px hsl(0 100% 50% / 0.2)' }}>
            <h3 className="font-display text-xl font-bold text-primary text-glow-subtle mb-6 tracking-wide">
              Our Agentic AI Solution
           </h3>
            <div className="space-y-4">
              {newWay.map((item, index) => (
                <div key={index} className="fade-item flex items-center gap-4 text-foreground">
                   <span className="text-foreground"><SearchCheck /></span>
                  <span className="tracking-wide">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Introduction;