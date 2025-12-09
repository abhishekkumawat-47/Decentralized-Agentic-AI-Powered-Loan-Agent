"use client"

import { useEffect, useRef } from "react"
import gsap from "gsap"
import { Check, IndianRupee } from "lucide-react"

interface Offer {
  id: number
  amount: string
  interest: string
  tenure: string
  emi: string
  processingFee: string
}

interface OfferCardProps {
  offer: Offer
  onSelect: (offer: Offer) => void
  index: number
}

export function OfferCard({ offer, onSelect, index }: OfferCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    gsap.fromTo(
      cardRef.current,
      { x: 50, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.5, delay: index * 0.15, ease: "power3.out" },
    )
  }, [index])

  return (
    <div
      ref={cardRef}
      className="p-4 rounded-xl bg-card border border-border hover:border-primary cursor-pointer transition-colors group"
      onClick={() => onSelect(offer)}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1 text-primary">
          <IndianRupee className="w-5 h-5" />
          <span className="text-xl font-bold">{offer.amount}</span>
        </div>
        <div className="w-6 h-6 rounded-full border-2 border-muted group-hover:border-primary group-hover:bg-primary/10 transition-colors flex items-center justify-center">
          <Check className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-muted-foreground">Interest</span>
          <p className="text-foreground font-medium">{offer.interest}% p.a.</p>
        </div>
        <div>
          <span className="text-muted-foreground">Tenure</span>
          <p className="text-foreground font-medium">{offer.tenure}</p>
        </div>
        <div>
          <span className="text-muted-foreground">EMI</span>
          <p className="text-foreground font-medium">₹{offer.emi}/month</p>
        </div>
        <div>
          <span className="text-muted-foreground">Processing Fee</span>
          <p className="text-foreground font-medium">₹{offer.processingFee}</p>
        </div>
      </div>
    </div>
  )
}
