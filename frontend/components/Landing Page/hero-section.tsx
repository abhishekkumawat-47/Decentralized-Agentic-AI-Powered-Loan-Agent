"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useTranslations } from 'next-intl';

const HeroSection = () => {
  const t = useTranslations();

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-24 pb-12 overflow-hidden">

      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary/30 rounded-full blur-[150px] opacity-70 hidden dark:block"
      />

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="flex flex-col items-center text-center max-w-5xl mx-auto">

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="font-display text-3xl md:text-5xl lg:text-6xl font-bold tracking-wider leading-tight mb-6"
          >
            <span className="text-foreground">{t("hero.title.decentralized")}</span>{" "}
            <span className="text-primary text-glow">{t("hero.title.agenticAI")}</span>
            <br />
            <span className="text-foreground">{t("hero.title.loanAgent")}</span>
          </motion.h1>

          {/* Subtext */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10 tracking-wide"
          >
            {t("hero.subtitle")}
          </motion.p>

          {/* CTA Button */}
          <Link href="/en/chat">
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            
            className="btn-cyber cursor-pointer px-10 py-4 text-foreground font-display font-bold text-lg uppercase tracking-widest rounded"
          >
            {t("hero.cta")}
          </motion.button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
