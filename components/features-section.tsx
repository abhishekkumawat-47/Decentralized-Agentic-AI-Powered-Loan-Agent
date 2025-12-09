"use client"

import { useEffect, useRef } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

const features = [
  {
    title: "Master Agent Orchestration",
    description:
      "Our intelligent Master Agent coordinates specialized workers to process your application efficiently.",
  },
  {
    title: "Instant Offer Calculation",
    description: "Sales Agent analyzes your profile and presents personalized loan offers in seconds.",
  },
  {
    title: "Secure Verification",
    description: "Verification Agent ensures document authenticity with bank-grade security protocols.",
  },
  {
    title: "Real-time Underwriting",
    description: "Underwriting Agent evaluates risk and approves loans faster than traditional methods.",
  },
]

export function FeaturesSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const cardsRef = useRef<HTMLDivElement[]>([])

  useEffect(() => {
    cardsRef.current.forEach((card, index) => {
      gsap.fromTo(
        card,
        { y: 80, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: card,
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
          delay: index * 0.15,
        },
      )
    })

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill())
    }
  }, [])

  return (
    <section id="services" ref={sectionRef} className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            How Our <span className="text-primary">Agentic AI</span> Works
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Four specialized AI agents work together to deliver the fastest loan approval experience.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              ref={(el) => {
                if (el) cardsRef.current[index] = el
              }}
              className="p-6 rounded-2xl bg-card border border-border hover:border-primary/50 transition-colors group"
            >
              <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
