"use client"

import { useEffect, useRef } from "react"
import gsap from "gsap"
import { Check, FileText, Gift, Shield, TrendingUp, FileCheck } from "lucide-react"

// 5-Stage Realistic Loan Process Flow
const stages = [
  { 
    id: 0, 
    label: "Application", 
    description: "Basic details & eligibility",
    icon: FileText 
  },
  { 
    id: 1, 
    label: "Loan Offers", 
    description: "Personalized offers from OfferMart",
    icon: Gift 
  },
  { 
    id: 2, 
    label: "Verification", 
    description: "KYC, Credit Score & Documents",
    icon: Shield 
  },
  { 
    id: 3, 
    label: "Underwriting", 
    description: "Risk assessment & approval",
    icon: TrendingUp 
  },
  { 
    id: 4, 
    label: "Sanction", 
    description: "Sanction letter generation",
    icon: FileCheck 
  },
]

interface ProgressTrackerProps {
  currentStage: number
}

export function ProgressTracker({ currentStage }: ProgressTrackerProps) {
  const stepsRef = useRef<HTMLDivElement[]>([])

  useEffect(() => {
    stepsRef.current.forEach((step, index) => {
      if (index === currentStage) {
        gsap.to(step, {
          scale: 1.05,
          duration: 0.3,
          ease: "power2.out",
        })
        gsap.to(step.querySelector(".pulse-ring"), {
          scale: 1.5,
          opacity: 0,
          duration: 1,
          repeat: -1,
          ease: "power1.out",
        })
      } else {
        gsap.to(step, { scale: 1, duration: 0.3 })
        gsap.killTweensOf(step.querySelector(".pulse-ring"))
      }
    })
  }, [currentStage])

  return (
    <div className="w-full px-4 py-3 bg-card/30 backdrop-blur-sm rounded-xl border border-border/50">
      <div className="flex items-center justify-between gap-2">
        {stages.map((stage, index) => {
          const Icon = stage.icon
          const isActive = index === currentStage
          const isCompleted = index < currentStage
          
          return (
            <div key={stage.id} className="flex items-center flex-1">
              <div
                ref={(el) => {
                  if (el) stepsRef.current[index] = el
                }}
                className="flex flex-col items-center w-full relative"
              >
                <div
                  className={`
                    w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium transition-all relative
                    ${
                      isCompleted
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/50"
                        : isActive
                          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/50"
                          : "bg-muted border-2 border-border text-muted-foreground"
                    }
                  `}
                >
                  {isCompleted ? (
                    <Check className="w-6 h-6" />
                  ) : (
                    <Icon className="w-6 h-6" />
                  )}
                  {isActive && <div className="pulse-ring absolute inset-0 rounded-full bg-primary/50" />}
                </div>
                <div className="mt-2 text-center">
                  <span
                    className={`block text-xs font-semibold ${
                      index <= currentStage ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {stage.label}
                  </span>
                  <span className="block text-[10px] text-muted-foreground mt-0.5 max-w-[100px] mx-auto">
                    {stage.description}
                  </span>
                </div>
              </div>
              {index < stages.length - 1 && (
                <div className="flex-1 h-0.5 mx-2 -mt-8">
                  <div className={`h-full transition-all ${index < currentStage ? "bg-primary" : "bg-border"}`} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
