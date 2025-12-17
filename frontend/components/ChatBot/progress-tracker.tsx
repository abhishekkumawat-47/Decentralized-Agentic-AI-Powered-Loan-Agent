"use client"

import { useEffect, useRef } from "react"
import gsap from "gsap"
import { Check } from "lucide-react"

// 5-Stage Loan Process Flow
const stages = [
  { 
    id: 0, 
    label: "Application", 
    description: "Start",
    icon: "1" 
  },
  { 
    id: 1, 
    label: "Offers", 
    description: "Compare",
    icon: "2" 
  },
  { 
    id: 2, 
    label: "Verification", 
    description: "KYC",
    icon: "3" 
  },
  { 
    id: 3, 
    label: "Underwriting", 
    description: "Review",
    icon: "4"
  },
  { 
    id: 4, 
    label: "Sanction", 
    description: "Approved",
    icon: "5"
  },
]

interface ProgressTrackerProps {
  currentStage: number
}

export function ProgressTracker({ currentStage }: ProgressTrackerProps) {
  const stepsRef = useRef<HTMLDivElement[]>([])

  useEffect(() => {
    stepsRef.current.forEach((step, index) => {
      if (!step) return;
      
      if (index === currentStage) {
        gsap.to(step, {
          scale: 1.05,
          duration: 0.3,
          ease: "power2.out",
        })
        const pulseRing = step.querySelector(".pulse-ring");
        if (pulseRing) {
          gsap.to(pulseRing, {
            scale: 1.5,
            opacity: 0,
            duration: 1,
            repeat: -1,
            ease: "power1.out",
          })
        }
      } else {
        gsap.to(step, { scale: 1, duration: 0.3 })
        const pulseRing = step.querySelector(".pulse-ring");
        if (pulseRing) {
          gsap.killTweensOf(pulseRing);
        }
      }
    })
  }, [currentStage])

  return (
    <div className="h-full w-full flex flex-col items-center justify-center py-6 px-2">
      <div className="flex flex-col items-center gap-3">
        {stages.map((stage, index) => {
          const isActive = index === currentStage
          const isCompleted = index < currentStage
          
          return (
            <div key={stage.id} className="flex flex-col items-center">
              <div
                ref={(el) => {
                  if (el) stepsRef.current[index] = el
                }}
                className="flex flex-col items-center relative group"
              >
                <div
                  className={`
                    w-10 h-10 lg:w-12 lg:h-12 cursor-pointer rounded-full flex items-center justify-center font-medium transition-all relative
                    ${
                      isCompleted
                        ? "bg-primary text-white shadow-lg shadow-primary/50"
                        : isActive
                          ? "bg-primary text-white shadow-lg shadow-primary/50"
                          : "bg-muted/50 border-2 border-border text-muted-foreground"
                    }
                  `}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5 lg:w-6 lg:h-6" />
                  ) : (
                    <span className="text-lg lg:text-xl">{stage.icon}</span>
                  )}
                </div>
                
                {/* Tooltip on hover */}
                <div className="absolute left-full ml-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap bg-primary backdrop-blur-md border border-primary/30 rounded-tr-3xl rounded-br-3xl rounded-bl-3xl rounded-tl-sm  px-3 py-2 shadow-lg shadow-primary/20 z-10">
                  <p className="text-xs font-semibold text-white">{stage.label}</p>
                  <p className="text-[10px] text-white">{stage.description}</p>
                </div>
              </div>
              
              {/* Vertical connector line */}
              {index < stages.length - 1 && (
                <div className="w-0.5 h-8 lg:h-10 my-1">
                  <div className={`w-full h-full transition-all ${index < currentStage ? "bg-primary" : "bg-border"}`} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
