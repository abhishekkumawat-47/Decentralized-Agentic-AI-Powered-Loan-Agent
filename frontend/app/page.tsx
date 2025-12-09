"use client"

import { Navbar } from "@/components/navbar"
import { HeroSection } from "@/components/hero-section"
import { FeaturesSection } from "@/components/features-section"
import { useRouter } from "next/navigation"

export default function Home() {
  const router = useRouter()

  const goToChat = () => {
    router.push("/chat")
  }

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <HeroSection onStartChat={goToChat} />
      <FeaturesSection />

      {/* About Section */}
      <section id="about" className="py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
            About <span className="text-primary"> Decentralized Loan Agent
</span>
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
              Decentralized Agentic AI Powered Loan Agent
 leverages cutting-edge agentic AI technology to revolutionize the lending industry. Our multi-agent
            system — comprising specialized Sales, Verification, and Underwriting agents — works in harmony under a
            Master Agent to deliver lightning-fast loan approvals without compromising on security or accuracy.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">© 2025   Decentralized Agentic AI Powered Loan Agent
. All rights reserved.</span>
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">
              Privacy
            </a>
            <a href="#" className="hover:text-foreground transition-colors">
              Terms
            </a>
            <a href="#" className="hover:text-foreground transition-colors">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </main>
  )
}
