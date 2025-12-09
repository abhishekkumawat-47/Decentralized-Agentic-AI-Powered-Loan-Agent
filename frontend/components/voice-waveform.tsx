"use client"

export function VoiceWaveform() {
  return (
    <div className="flex items-center justify-center gap-1 h-8">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="wave-bar w-1 h-4 bg-primary rounded-full" />
      ))}
    </div>
  )
}
