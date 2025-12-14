"use client";

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

const FinalCTA = () => {
  const t = useTranslations();

  return (
    <section className="py-32 relative overflow-hidden">
      {/* Intense radial glow background */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary/30 rounded-full blur-[150px] opacity-70"
      />
      
      <div className="absolute inset-0 circuit-pattern opacity-30" />
      
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <h2 className="font-display text-3xl md:text-5xl lg:text-6xl font-bold text-foreground tracking-wider mb-8">
            {t("finalCTA.readyTo")}{' '}
            <span className="text-primary text-glow">{t("finalCTA.automate")}</span>
            <br />
            {t("finalCTA.yourFinances")}
          </h2>
          
          <Link href="/en/chat">
          <motion.button
            className="btn-cyber cursor-pointer px-12 py-5 text-foreground font-display font-bold text-xl uppercase tracking-widest rounded-lg"
          >
            {t("finalCTA.cta")}
          </motion.button>
            </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default FinalCTA;