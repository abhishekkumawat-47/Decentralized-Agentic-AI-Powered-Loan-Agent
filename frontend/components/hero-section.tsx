"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ArrowRight } from "lucide-react";
import ColorBends from "./background-animation";
import { useTheme } from "@/contexts/theme-context";

interface HeroSectionProps {
  onStartChat: () => void;
}

export function HeroSection({ onStartChat }: HeroSectionProps) {
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const decorRef = useRef<HTMLDivElement>(null);

const backgroundColors = theme === "dark"
  ? ["#ff0000", "#ff1a1a", "#cc0000", "#ff3333", "#990000", "#ff6666"] 
  : ["#ff0000", "#ff3333", "#ff6666", "#cc0000", "#ff9999", "#ffcccc"];


  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    tl.fromTo(
      titleRef.current,
      { y: 50, opacity: 0 },
      { y: 0, opacity: 1, duration: 1 }
    )
      .fromTo(
        subtitleRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8 },
        "-=0.5"
      )
      .fromTo(
        buttonRef.current,
        { scale: 0.8, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.6 },
        "-=0.3"
      )
      .fromTo(
        decorRef.current,
        { scale: 0, rotation: -180 },
        { scale: 1, rotation: 0, duration: 1 },
        "-=0.8"
      );

    gsap.to(buttonRef.current, {
      boxShadow: "0 0 30px var(--primary)",
      repeat: -1,
      yoyo: true,
      duration: 1.5,
      ease: "power1.inOut",
    });
  }, [theme]);

  return (
    <section
      id="home"
      ref={containerRef}
      className="min-h-screen flex items-center justify-center relative overflow-hidden pt-16"
    >
      {/* Animated Background */}
      <div className="absolute inset-0 blur-lg w-full h-full">
        <ColorBends
          colors={["#ffec66" , "ecd53f"]}
          rotation={0}
          speed={0.2}
          scale={1}
          frequency={1}
          warpStrength={1}
          mouseInfluence={0}
          parallax={0.5}
          noise={0.1}
          transparent
        />
      </div>

      <div
        ref={decorRef}
        className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full bg-primary/10 blur-3xl pointer-events-none z-10"
      />

      <div className="max-w-4xl mx-auto px-4 text-center relative z-20">
        <h1
          ref={titleRef}
          className="text-4xl sm:text-5xl md:text-7xl font-bold text-foreground mb-6 text-balance"
        >
          Get Approved in <span className="text-primary">Few Minutes</span>
        </h1>

        <p
          ref={subtitleRef}
          className="text-lg sm:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto text-pretty"
        >
          Experience the future of lending with our intelligent AI agents. Fast
          approvals, personalized offers, and seamless verification — all in one
          conversation.
        </p>

        <button
          ref={buttonRef}
          onClick={onStartChat}
          className="inline-flex cursor-pointer items-center gap-3 px-8 py-4 bg-primary text-primary-foreground rounded-2xl text-lg font-semibold hover:opacity-90 transition-opacity shadow-lg"
        >
          Start Your Application
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </section>
  );
}
