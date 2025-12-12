"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Send, Mic, Bot, User, ArrowLeft, Volume2, VolumeX, Pause } from "lucide-react"
import Link from "next/link"
import gsap from "gsap"
import { ProgressTracker } from "@/components/ChatBot/progress-tracker"
import { AgentToast } from "@/components/ChatBot/agent-toast"
import { OfferCard } from "@/components/ChatBot/offer-card"
import { FileUpload } from "@/components/ChatBot/file-upload"
import { VoiceWaveform } from "@/components/ChatBot/voice-waveform"
import { textToSpeech, VOICE_IDS } from "@/lib/elevenlabs"

// Web Speech API type declarations
interface SpeechRecognitionErrorEvent extends Event {
  error: string
  message?: string
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
  resultIndex: number
}

interface SpeechRecognitionResultList {
  readonly length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  readonly length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
  readonly isFinal: boolean
}

interface SpeechRecognitionAlternative {
  readonly transcript: string
  readonly confidence: number
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null
  onend: ((this: SpeechRecognition, ev: Event) => void) | null
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null
  start(): void
  stop(): void
}

declare global {
  interface Window {
    webkitSpeechRecognition: new () => SpeechRecognition
  }
}

interface Message {
  id: number
  role: "user" | "assistant" | "system"
  content: string
  offers?: Offer[]
  requiresUpload?: string
}

interface Offer {
  id: number
  amount: string
  interest: string
  tenure: string
  emi: string
  processingFee: string
}

interface UserProfile {
  name?: string
  phone?: string
  email?: string
  monthlyIncome?: number
  employmentType?: string
  requestedAmount?: number
  loanPurpose?: string
}

const mockOffers: Offer[] = [
  { id: 1, amount: "5,00,000", interest: "10.5", tenure: "36 months", emi: "16,143", processingFee: "10,000" },
  { id: 2, amount: "5,00,000", interest: "11.0", tenure: "48 months", emi: "12,950", processingFee: "7,500" },
  { id: 3, amount: "5,00,000", interest: "11.5", tenure: "60 months", emi: "11,015", processingFee: "5,000" },
]

export default function ChatPage() {
  // WebSocket connection to Flask server
  const wsRef = useRef<WebSocket | null>(null)
  const pendingAssistantIdRef = useRef<number | null>(null)
  const [wsReady, setWsReady] = useState(false)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: "assistant",
      content:
        "Welcome to Decentralized Agentic AI Powered Loan Assistant.\n\nI will help you get a personalized loan in just a few minutes through our 5-step process:\n\n• Application Details\n• Loan Offers\n• Verification\n• Underwriting\n• Sanction Letter\n\nLet's start! What is your full name?",
    },
  ])

  const addMessage = useCallback((message: Message) => {
    setMessages((prev) => [...prev, message])
  }, [])

  // WebSocket connection setup
  useEffect(() => {
    const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:5001/ws"
    const API_KEY = process.env.NEXT_PUBLIC_WS_API_KEY || "dev-local-key"

    const connectWebSocket = () => {
      try {
        const url = API_KEY ? `${WS_URL}?api_key=${encodeURIComponent(API_KEY)}` : WS_URL
        console.log("Connecting to WebSocket with API key:", API_KEY ? "configured" : "missing")
        const ws = new WebSocket(url)
        wsRef.current = ws

        ws.onopen = () => {
          setWsReady(true)
          console.log("WS connected to Gemini backend")
        }

        ws.onclose = () => {
          setWsReady(false)
          console.log("WS disconnected, attempting reconnect...")
          // Attempt to reconnect after 3 seconds
          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket()
          }, 3000)
        }

        ws.onerror = (err) => {
          console.error("WS error", err)
        }

        ws.onmessage = (ev) => {
          try {
            const msg = JSON.parse(ev.data)
            if (!msg || !msg.type) return

            if (msg.type === "chat_start") {
              // Create a placeholder assistant message if not present
              if (!pendingAssistantIdRef.current) {
                const id = Date.now() + 2
                pendingAssistantIdRef.current = id
                addMessage({ id, role: "assistant", content: "" })
              }
            } else if (msg.type === "chat_delta") {
              const id = pendingAssistantIdRef.current
              if (!id) return
              setMessages((prev) => {
                return prev.map((m) =>
                  m.id === id && m.role === "assistant"
                    ? { ...m, content: (m.content || "") + (msg.delta || "") }
                    : m
                )
              })
            } else if (msg.type === "chat_complete") {
              pendingAssistantIdRef.current = null
            } else if (msg.type === "chat_error") {
              console.error("chat_error", msg.error)
              pendingAssistantIdRef.current = null
              
              let errorMessage = "I apologize, but I encountered an error. Please try again."
              if (msg.error === "unauthorized") {
                errorMessage = "Connection unauthorized. Please check your API key configuration."
              }
              
              addMessage({ 
                id: Date.now() + 3, 
                role: "assistant", 
                content: errorMessage
              })
            }
          } catch (e) {
            console.error("WS message parse error", e)
          }
        }

        return ws
      } catch (e) {
        console.error("Failed to create WebSocket", e)
        return null
      }
    }

    const ws = connectWebSocket()

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      try { 
        if (ws) ws.close() 
      } catch {}
    }
  }, [addMessage])

  const [input, setInput] = useState("")
  const [currentStage, setCurrentStage] = useState(0)
  const [agentMessage, setAgentMessage] = useState("")
  const [showAgentToast, setShowAgentToast] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [showOffers, setShowOffers] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [uploadType, setUploadType] = useState("")
  const [userProfile, setUserProfile] = useState<UserProfile>({})
  const [collectionStep, setCollectionStep] = useState(0)
  const [micPermission, setMicPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt')
  
  // Voice playback states
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isGeneratingVoice, setIsGeneratingVoice] = useState(false)
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null)
  const [voiceQueue, setVoiceQueue] = useState<string[]>([])

  const containerRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const autoSubmitTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastSpokenMessageIdRef = useRef<number | null>(null)
  const isSpeakingRef = useRef(false)
  const pendingVoiceInputRef = useRef<string>('')
  const handleSendRef = useRef<(() => void) | null>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, showOffers, showUpload])

  // Speak text using ElevenLabs
  const speak = useCallback(async (text: string, messageId?: number) => {
    if (!isVoiceEnabled || !text || isSpeakingRef.current) return

    if (messageId && lastSpokenMessageIdRef.current === messageId) {
      return
    }

    try {
      setIsGeneratingVoice(true)
      isSpeakingRef.current = true
      if (messageId) lastSpokenMessageIdRef.current = messageId
      
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
        audioRef.current = null
      }

      const audioBlob = await textToSpeech(text, VOICE_IDS.RACHEL)
      setIsGeneratingVoice(false)
      setIsSpeaking(true)
      
      const audioUrl = URL.createObjectURL(audioBlob)
      const audio = new Audio(audioUrl)
      
      audioRef.current = audio
      setCurrentAudio(audio)

      audio.onended = () => {
        URL.revokeObjectURL(audioUrl)
        isSpeakingRef.current = false
        setIsSpeaking(false)
        setCurrentAudio(null)
        audioRef.current = null
      }

      audio.onerror = (error) => {
        console.error('Audio playback error:', error)
        URL.revokeObjectURL(audioUrl)
        isSpeakingRef.current = false
        setIsSpeaking(false)
        setIsGeneratingVoice(false)
        setCurrentAudio(null)
        audioRef.current = null
      }

      await audio.play()
    } catch (error) {
      console.error("Error speaking text:", error)
      isSpeakingRef.current = false
      setIsSpeaking(false)
      setIsGeneratingVoice(false)
    }
  }, [isVoiceEnabled])

  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      audioRef.current = null
    }
    isSpeakingRef.current = false
    setIsSpeaking(false)
    setCurrentAudio(null)
  }, [])

  const toggleVoicePlayback = useCallback(() => {
    if (isSpeaking) {
      stopSpeaking()
    }
    setIsVoiceEnabled(!isVoiceEnabled)
  }, [isVoiceEnabled, isSpeaking, stopSpeaking])

  // Auto-speak assistant messages
  useEffect(() => {
    const lastMessage = messages[messages.length - 1]
    if (lastMessage && lastMessage.role === "assistant" && isVoiceEnabled && !isSpeakingRef.current) {
      if (lastSpokenMessageIdRef.current === lastMessage.id) {
        return
      }
      
      const cleanText = lastMessage.content
        .replace(/[┌├└│─]/g, '')
        .replace(/\n{3,}/g, '\n\n')
        .replace(/•/g, '')
        .trim()
      
      if (cleanText) {
        setTimeout(() => {
          speak(cleanText, lastMessage.id)
        }, 100)
      }
    }
  }, [messages, isVoiceEnabled, speak])

  // Entry animation
  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(containerRef.current, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: "power3.out" })
    }
  }, [])

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
      isSpeakingRef.current = false
    }
  }, [])

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
      const SpeechRecognition = window.webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = true
      recognitionRef.current.lang = "en-US"

      recognitionRef.current.onstart = () => {
        console.log('Speech recognition started')
        setIsListening(true)
      }

      recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
        if (isSpeakingRef.current && audioRef.current) {
          audioRef.current.pause()
          audioRef.current = null
          isSpeakingRef.current = false
          setIsSpeaking(false)
        }
        
        let interimTranscript = ''
        let finalTranscript = ''

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' '
          } else {
            interimTranscript += transcript
          }
        }

        if (finalTranscript) {
          const finalText = finalTranscript.trim()
          setInput(finalText)
          pendingVoiceInputRef.current = finalText
          
          if (autoSubmitTimeoutRef.current) {
            clearTimeout(autoSubmitTimeoutRef.current)
          }
          
          autoSubmitTimeoutRef.current = setTimeout(() => {
            if (pendingVoiceInputRef.current) {
              setIsListening(false)
              try {
                recognitionRef.current?.stop()
              } catch (e) {
                // Already stopped
              }
              
              setTimeout(() => {
                if (handleSendRef.current) {
                  handleSendRef.current()
                }
              }, 100)
            }
          }, 1500)
        } else if (interimTranscript) {
          setInput(interimTranscript)
        }
      }

      recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
        if (event.error === 'not-allowed' || event.error === 'permission-denied') {
          console.error('Microphone permission denied')
          setMicPermission('denied')
          alert('Microphone access denied. Please allow microphone access in your browser settings.')
          setIsListening(false)
        } else if (event.error === 'no-speech') {
          console.log('No speech detected')
          setIsListening(false)
        } else if (event.error === 'aborted') {
          console.log('Speech recognition aborted')
          setIsListening(false)
        } else if (event.error === 'network') {
          console.log('Network error (this is normal and can be ignored)')
        } else {
          console.warn('Speech recognition error:', event.error, event.message || '')
          setIsListening(false)
        }
      }

      recognitionRef.current.onend = () => {
        setIsListening(false)
      }
    }
    
    return () => {
      if (autoSubmitTimeoutRef.current) {
        clearTimeout(autoSubmitTimeoutRef.current)
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch (e) {
          // Already stopped
        }
      }
    }
  }, [])

  const showAgent = (message: string, duration = 2000) => {
    setAgentMessage(message)
    setShowAgentToast(true)
    setTimeout(() => setShowAgentToast(false), duration)
  }

  const handleSend = useCallback(async () => {
    const currentInput = input.trim() || pendingVoiceInputRef.current.trim()
    if (!currentInput) return

    const userMessage: Message = {
      id: Date.now(),
      role: "user",
      content: currentInput,
    }
    addMessage(userMessage)
    const userInput = currentInput
    setInput("")
    pendingVoiceInputRef.current = ""

    // Build conversation history for context
    const conversationHistory = messages.map((m) => ({
      role: m.role === "system" ? "assistant" : m.role,
      content: m.content,
    }))

    // Add system context about the loan application process
    const systemContext = {
      role: "assistant",
      content: `You are a helpful loan assistant. Current stage: ${currentStage === 0 ? "Application Details" : currentStage === 1 ? "Loan Offers" : currentStage === 2 ? "Verification" : currentStage === 3 ? "Underwriting" : "Sanction"}. Current collection step: ${collectionStep}. User profile: ${JSON.stringify(userProfile)}. Be concise and professional.`
    }

    // Send message to Flask WebSocket for Gemini LLM response
    try {
      const ws = wsRef.current
      if (ws && wsReady && ws.readyState === WebSocket.OPEN) {
        const payload = {
          event: "chat_message",
          data: {
            message_id: `${Date.now()}`,
            message: userInput,
            history: [systemContext, ...conversationHistory],
          },
        }
        ws.send(JSON.stringify(payload))
      } else {
        // WebSocket not ready, show error
        addMessage({
          id: Date.now() + 1,
          role: "assistant",
          content: "Sorry, I'm having trouble connecting to the server. Please wait a moment and try again.",
        })
      }
    } catch (e) {
      console.error("WS send error", e)
      addMessage({
        id: Date.now() + 1,
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
      })
    }

    // Local logic for specific workflow stages (document upload, offer selection, etc.)
    // This runs alongside Gemini responses to handle UI state
    if (currentStage === 0) {
      // Application Details stage - collect information
      if (collectionStep === 0 && !userProfile.name) {
        setUserProfile({ ...userProfile, name: userInput })
        setCollectionStep(1)
      } else if (collectionStep === 1 && !userProfile.monthlyIncome) {
        const income = Number.parseInt(userInput.replace(/[^0-9]/g, ""))
        if (!isNaN(income)) {
          setUserProfile({ ...userProfile, monthlyIncome: income })
          setCollectionStep(2)
        }
      } else if (collectionStep === 2 && !userProfile.employmentType) {
        const empType = userInput === "1" ? "Salaried" : userInput === "2" ? "Self-Employed" : userInput
        setUserProfile({ ...userProfile, employmentType: empType })
        setCollectionStep(3)
      } else if (collectionStep === 3 && !userProfile.email) {
        setUserProfile({ ...userProfile, email: userInput })
        setCollectionStep(4)
      } else if (collectionStep === 4 && !userProfile.phone) {
        setUserProfile({ ...userProfile, phone: userInput })
        setCollectionStep(5)
      } else if (collectionStep === 5 && !userProfile.requestedAmount) {
        const amount = Number.parseInt(userInput.replace(/[^0-9]/g, ""))
        if (!isNaN(amount)) {
          setUserProfile({ ...userProfile, requestedAmount: amount })
          setCollectionStep(6)
        }
      } else if (collectionStep === 6 && !userProfile.loanPurpose) {
        setUserProfile({ ...userProfile, loanPurpose: userInput })
        
        addMessage({
          id: Date.now() + 1,
          role: "system",
          content: "Application details collected successfully",
        })

        showAgent("Master Agent processing your details...", 1500)

        setTimeout(() => {
          setCurrentStage(1)
          showAgent("Sales Agent fetching personalized offers from OfferMart...", 2000)

          setTimeout(() => {
            const profile = { ...userProfile, loanPurpose: userInput }
            const income = profile.monthlyIncome || 50000
            const requested = profile.requestedAmount || 500000
            
            const eligibleAmount = Math.min(requested, income * 24)
            const baseRate = 10.5
            
            const dynamicOffers = [
              {
                id: 1,
                amount: new Intl.NumberFormat("en-IN").format(eligibleAmount),
                interest: baseRate.toFixed(1),
                tenure: "36 months",
                emi: new Intl.NumberFormat("en-IN").format(Math.round((eligibleAmount * (baseRate / 1200) * Math.pow(1 + baseRate / 1200, 36)) / (Math.pow(1 + baseRate / 1200, 36) - 1))),
                processingFee: new Intl.NumberFormat("en-IN").format(Math.round(eligibleAmount * 0.02)),
              },
              {
                id: 2,
                amount: new Intl.NumberFormat("en-IN").format(eligibleAmount),
                interest: (baseRate + 0.5).toFixed(1),
                tenure: "48 months",
                emi: new Intl.NumberFormat("en-IN").format(Math.round((eligibleAmount * ((baseRate + 0.5) / 1200) * Math.pow(1 + (baseRate + 0.5) / 1200, 48)) / (Math.pow(1 + (baseRate + 0.5) / 1200, 48) - 1))),
                processingFee: new Intl.NumberFormat("en-IN").format(Math.round(eligibleAmount * 0.015)),
              },
              {
                id: 3,
                amount: new Intl.NumberFormat("en-IN").format(eligibleAmount),
                interest: (baseRate + 1).toFixed(1),
                tenure: "60 months",
                emi: new Intl.NumberFormat("en-IN").format(Math.round((eligibleAmount * ((baseRate + 1) / 1200) * Math.pow(1 + (baseRate + 1) / 1200, 60)) / (Math.pow(1 + (baseRate + 1) / 1200, 60) - 1))),
                processingFee: new Intl.NumberFormat("en-IN").format(Math.round(eligibleAmount * 0.01)),
              },
            ]
            
            addMessage({
              id: Date.now(),
              role: "assistant",
              content: `Perfect, ${profile.name}!\n\nBased on your profile:\n• Monthly Income: ₹${new Intl.NumberFormat("en-IN").format(income)}\n• Employment: ${profile.employmentType}\n• Requested Amount: ₹${new Intl.NumberFormat("en-IN").format(requested)}\n\nHere are your pre-approved personalized loan offers from our OfferMart:\n\nPlease select the offer that suits you best:`,
            })
            setShowOffers(true)
          }, 2000)
        }, 1500)
      }
    }
  }, [addMessage, collectionStep, currentStage, input, showAgent, userProfile, messages, wsReady])

  useEffect(() => {
    handleSendRef.current = handleSend
  }, [handleSend])

  const handleOfferSelect = (offer: Offer) => {
    setShowOffers(false)
    addMessage({
      id: Date.now(),
      role: "user",
      content: `I'll take the ${offer.tenure} plan at ${offer.interest}% interest with EMI of ₹${offer.emi}`,
    })

    addMessage({
      id: Date.now() + 1,
      role: "system",
      content: `Offer selected: ₹${offer.amount} @ ${offer.interest}% for ${offer.tenure}`,
    })

    showAgent("Master Agent initiating Verification process...", 1500)

    setTimeout(() => {
      setCurrentStage(2)
      showAgent("Verification Agent checking KYC & Credit Bureau...", 2000)

      setTimeout(() => {
        addMessage({
          id: Date.now(),
          role: "assistant",
          content: `Now let's verify your identity and check your credit profile.\n\nFor KYC verification, I need to verify your PAN card.\n\nPlease provide your PAN number:`,
        })
      }, 2000)
    }, 1500)
  }

  const handleFileUpload = (file: File) => {
    setShowUpload(false)
    addMessage({
      id: Date.now(),
      role: "user",
      content: `Uploaded: ${file.name}`,
    })

    addMessage({
      id: Date.now() + 1,
      role: "system",
      content: "Document uploaded successfully",
    })

    showAgent("Document Processor analyzing file with OCR...", 2500)

    setTimeout(() => {
      addMessage({
        id: Date.now(),
        role: "system",
        content: "Document verified - Salary: ₹" + new Intl.NumberFormat("en-IN").format(userProfile.monthlyIncome || 50000),
      })

      showAgent("Master Agent contacting Underwriting Agent...", 1500)

      setTimeout(() => {
        setCurrentStage(3)
        showAgent("Underwriting Agent evaluating risk profile & making decision...", 2500)

        setTimeout(() => {
          const creditScore = Math.floor(Math.random() * (850 - 700)) + 700
          const decision = creditScore >= 750 ? "APPROVED" : creditScore >= 700 ? "APPROVED" : "CONDITIONAL"

          addMessage({
            id: Date.now(),
            role: "system",
            content: `Credit Score: ${creditScore}/900 (${creditScore >= 750 ? "Excellent" : "Good"})`,
          })

          setTimeout(() => {
            addMessage({
              id: Date.now(),
              role: "system",
              content: `Risk Assessment: Low Risk\nFOIR Check: 42% (Within limits)\nUnderwriting Decision: ${decision}`,
            })

            showAgent("Sanction Letter Generator creating your approval letter...", 1500)

            setTimeout(() => {
              setCurrentStage(4)

              setTimeout(() => {
                addMessage({
                  id: Date.now(),
                  role: "assistant",
                  content: `Congratulations, ${userProfile.name}!\n\nYour loan has been SANCTIONED!\n\nSanction Letter Details:\n┌────────────────────┐\nApplication ID: LOAN_${Date.now()}\nApproved Amount: ₹${mockOffers[0].amount}\nInterest Rate: ${mockOffers[0].interest}% p.a.\nTenure: ${mockOffers[0].tenure}\nMonthly EMI: ₹${mockOffers[0].emi}\nProcessing Fee: ₹${mockOffers[0].processingFee}\n└────────────────────┘\n\nYour sanction letter has been digitally signed and recorded on blockchain for tamper-proof verification.\n\nA copy has been emailed to ${userProfile.email}\nSMS confirmation sent to ${userProfile.phone}\n\nFunds will be credited to your account within 24 hours after agreement signing!\n\nThank you for choosing Decentralized Agentic AI Powered Loan Assistant.`,
                })

                addMessage({
                  id: Date.now() + 1,
                  role: "system",
                  content: "Sanction letter generated & blockchain verified\nTransaction Hash: 0xa3f5e8d9c7b6a5f4e3d2c1b0",
                })
              }, 1500)
            }, 1500)
          }, 1000)
        }, 2500)
      }, 1500)
    }, 2500)
  }

  const toggleVoice = async () => {
    if (isListening) {
      try {
        recognitionRef.current?.stop()
      } catch (e) {
        console.log('Error stopping recognition:', e)
      }
      setIsListening(false)
    } else {
      if (isSpeaking) {
        stopSpeaking()
      }
      
      if (!recognitionRef.current) {
        alert('Speech recognition is not supported in this browser. Please use Chrome or Edge.')
        return
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        stream.getTracks().forEach(track => track.stop())
        setMicPermission('granted')
        
        try {
          recognitionRef.current.start()
          console.log('Attempting to start speech recognition...')
        } catch (error) {
          console.error('Error starting recognition:', error)
          alert('Failed to start voice input. Please try again.')
          setIsListening(false)
        }
      } catch (error) {
        console.error('Microphone permission error:', error)
        setMicPermission('denied')
        alert('Microphone access is required for voice input. Please allow microphone access and try again.')
      }
    }
  }

  return (
    <main className="h-screen w-screen bg-background flex overflow-hidden">
      {/* Vertical Progress Tracker Sidebar */}
      <aside className="hidden md:flex w-16 lg:w-20 shrink-0 bg-background/50 border-r border-border">
        <ProgressTracker currentStage={currentStage} />
      </aside>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="shrink-0 bg-background/95 backdrop-blur-md border-b border-border">
          <div className="px-4 sm:px-6 h-12 sm:h-14 flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-xs sm:text-sm font-medium">Back</span>
            </Link>

            {/* Status Indicator */}
          {(isListening || isSpeaking || isGeneratingVoice) && (
            <div className="mb-2 flex items-center justify-center text-xs sm:text-sm text-muted-foreground animate-in fade-in slide-in-from-bottom-2">
              {isListening && (
                <span className="flex items-center gap-1 text-primary">
                  <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
                  Listening...
                </span>
              )}
              {isGeneratingVoice && (
                <span className="flex items-center gap-1 text-orange-500">
                  <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
                  Generating voice...
                </span>
              )}
              {isSpeaking && !isGeneratingVoice && (
                <span className="flex items-center gap-1 text-blue-500">
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                  Speaking...
                </span>
              )}
            </div>
          )}

            <div className="flex items-center gap-2">
              {/* WebSocket Status */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 text-xs">
                <span className={`w-2 h-2 rounded-full ${wsReady ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                <span className="text-muted-foreground hidden sm:inline">{wsReady ? 'Connected' : 'Disconnected'}</span>
              </div>

              {/* Voice Control */}
              <button
                onClick={toggleVoicePlayback}
                className={`p-2 rounded-lg cursor-pointer transition-all ${
                  isVoiceEnabled
                    ? "bg-primary/10 text-primary hover:bg-primary/20"
                    : "bg-muted/50 text-muted-foreground hover:text-foreground"
                }`}
                aria-label="Toggle voice playback"
                title={isVoiceEnabled ? "Voice On" : "Voice Off"}
              >
                {isVoiceEnabled ? <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" /> : <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>

              {/* Stop Speaking Button */}
              {isSpeaking && (
                <button
                  onClick={stopSpeaking}
                  className="p-2 rounded-lg cursor-pointer bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all"
                  aria-label="Stop speaking"
                  title="Stop Speaking"
                >
                  <Pause className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Agent Toast */}
        {showAgentToast && (
          <div className="shrink-0 flex justify-center py-2 px-4">
            <AgentToast message={agentMessage} isVisible={showAgentToast} />
          </div>
        )}

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6" ref={containerRef}>
        <div className="max-w-4xl mx-auto py-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}
            >
              {message.role !== "user" && (
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                  <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                </div>
              )}

              <div
                className={`
                  max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 shadow-sm
                  ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : message.role === "system"
                        ? "bg-green-500/10 text-green-600 dark:text-green-400 text-sm border border-green-500/20"
                        : "bg-muted/80 text-foreground border border-border/50"
                  }
                `}
              >
                <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap">{message.content}</p>
              </div>

              {message.role === "user" && (
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-muted flex items-center justify-center shrink-0 border border-border">
                  <User className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}

          {/* Offer Cards */}
          {showOffers && (
            <div className="grid gap-3 mt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {mockOffers.map((offer, index) => (
                <OfferCard key={offer.id} offer={offer} onSelect={handleOfferSelect} index={index} />
              ))}
            </div>
          )}

          {/* File Upload */}
          {showUpload && (
            <div className="mt-4 cursor-pointer animate-in fade-in slide-in-from-bottom-4 duration-500">
              <FileUpload onFileSelect={handleFileUpload} documentType={uploadType} />
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="shrink-0 border-t border-border bg-background/95 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-end gap-2 sm:gap-3">
            <button
              onClick={toggleVoice}
              disabled={micPermission === 'denied'}
              className={`
                p-2.5 sm:p-3 cursor-pointer rounded-full border border-white transition-all shrink-0 relative
                ${isListening ? "text-primary-foreground" : "bg-muted/80 text-muted-foreground hover:text-foreground hover:bg-muted"}
                ${micPermission === 'denied' ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              aria-label="Voice input"
              title={
                micPermission === 'denied' 
                  ? 'Microphone access denied - Please enable in browser settings'
                  : isListening 
                  ? "Stop listening (Click to stop)" 
                  : "Start voice input (Click to speak)"
              }
            >
              {isListening ? <Mic /> : <Mic className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>

            <div className="flex-1 relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                placeholder="Type your message..."
                className="w-full bg-muted/80 rounded-xl sm:rounded-2xl px-4 py-2.5 sm:py-3 pr-12 text-sm sm:text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 border border-border/50"
              />
            </div>

            <button
              onClick={handleSend}
              disabled={!input.trim() && !pendingVoiceInputRef.current.trim()}
              className="p-2.5 sm:p-3 cursor-pointer rounded-full bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/20 shrink-0"
              aria-label="Send message"
            >
              <Send className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Decentralized Agentic AI Powered Loan Assistant with Gemini • Your data is encrypted and secure.
          </p>
        </div>
      </div>
      </div>
    </main>
  )
}