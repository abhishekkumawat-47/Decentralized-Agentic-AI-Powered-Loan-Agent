"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { AudioRecorder } from '@/lib/audio-recorder';
import { LiveWaveform, SpeakingWaveform } from './live-waveform';
import { useLocale } from 'next-intl';

interface VoiceAssistantProps {
  onTranscript: (text: string) => void;
  onResponse: (text: string) => Promise<void>;
  onClose?: () => void;
  messages?: Array<{ id: number; role: string; content: string }>;
}

export function VoiceAssistant({ onTranscript, onResponse, onClose, messages = [] }: VoiceAssistantProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [frequencyData, setFrequencyData] = useState<Uint8Array>(new Uint8Array(128));
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  
  const audioRecorderRef = useRef<AudioRecorder | null>(null);
  const locale = useLocale();
  const interruptionCheckRef = useRef<NodeJS.Timeout | null>(null);
  const highVolumeCountRef = useRef(0);

  useEffect(() => {
    // Check if Web Speech API is supported
    if (!AudioRecorder.isSupported()) {
      setIsSupported(false);
      console.warn('Web Speech API not supported in this browser');
      return;
    }

    // Initialize audio recorder
    const recorder = new AudioRecorder();
    audioRecorderRef.current = recorder;
    
    // Auto-start recording immediately
    const initRecording = async () => {
      try {
        setIsRecording(true);
        
        await recorder.startRecording(
          (text, isFinal) => {
            // Always show interim text
            if (!isFinal) {
              setCurrentTranscript(text);
            } else {
              // Final transcript - check if it's valid before sending
              const trimmedText = text.trim();
              const wordCount = trimmedText.split(/\s+/).filter(w => w.length > 0).length;
              
              // Only send if we have at least 1 meaningful word (2+ characters)
              if (trimmedText && wordCount >= 1 && trimmedText.length >= 2) {
                setCurrentTranscript('');
                onTranscript(trimmedText);
              } else {
                setCurrentTranscript('');
              }
            }
          },
          (data) => {
            setFrequencyData(data);
          },
          locale
        );
      } catch (error) {
        console.error('Failed to auto-start recording:', error);
        setIsRecording(false);
        alert('Failed to access microphone. Please grant permission.');
      }
    };
    
    // Start immediately
    initRecording();

    return () => {
      if (recorder) {
        recorder.stopRecording();
        recorder.stopSpeaking();
      }
    };
  }, [locale, onTranscript]);

  const startRecording = async () => {
    
    if (!audioRecorderRef.current) {
      console.error('No audio recorder reference');
      return;
    }
    
    if (!isSupported) {
      console.error('Speech API not supported');
      return;
    }

    try {
      setIsRecording(true);
      
      await audioRecorderRef.current.startRecording(
        (text, isFinal) => {
          setCurrentTranscript(text);
          
          // When speech is finalized, send to chat immediately
          if (isFinal && text.trim()) {
            console.log('Final transcript - sending message:', text);
            setCurrentTranscript('');
            // Send message immediately
            onTranscript(text);
          }
        },
        (data) => {
          setFrequencyData(data);
        },
        locale
      );
      console.log('Recording started successfully');
    } catch (error) {
      console.error('Error starting recording:', error);
      setIsRecording(false);
      alert('Failed to access microphone. Please grant permission.');
    }
  };

  const stopRecording = () => {
    if (audioRecorderRef.current) {
      audioRecorderRef.current.stopRecording();
      setIsRecording(false);
      setCurrentTranscript('');
    }
    // Close the voice assistant
    onClose?.();
  };

  // Ref to store current speech utterance for interruption
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  
  // Start monitoring for user interruption during AI speech
  const startInterruptionMonitoring = useCallback(() => {
    if (!audioRecorderRef.current || interruptionCheckRef.current) return;
    
    highVolumeCountRef.current = 0;
    
    // Start a minimal audio monitoring (without speech recognition) during AI speech
    const checkInterruption = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const audioContext = new AudioContext();
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        analyser.fftSize = 256;
        
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        
        const monitor = () => {
          if (!isSpeaking || !window.speechSynthesis.speaking) {
            // Stop monitoring
            stream.getTracks().forEach(track => track.stop());
            audioContext.close();
            highVolumeCountRef.current = 0;
            return;
          }
          
          analyser.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
          
          // Detect sustained loud audio (likely user speaking)
          if (average > 50) { // Higher threshold to avoid detecting AI speech
            highVolumeCountRef.current++;
            
            // If loud audio persists for 3 consecutive checks, it's an interruption
            if (highVolumeCountRef.current >= 3) {
              console.log('User interruption detected - loud sustained audio');
              window.speechSynthesis.cancel();
              setIsSpeaking(false);
              stream.getTracks().forEach(track => track.stop());
              audioContext.close();
              highVolumeCountRef.current = 0;
              return;
            }
          } else {
            // Reset counter if audio drops
            highVolumeCountRef.current = 0;
          }
          
          interruptionCheckRef.current = setTimeout(monitor, 100);
        };
        
        monitor();
      } catch (error) {
        console.error('Failed to start interruption monitoring:', error);
      }
    };
    
    checkInterruption();
  }, [isSpeaking]);
  
  const speakResponse = useCallback(async (text: string) => {
    if (!audioRecorderRef.current || isMuted) {
      console.log('Speech skipped:', { hasRecorder: !!audioRecorderRef.current, isMuted });
      return;
    }

    try {
      console.log('Speaking response:', text.substring(0, 50) + '...');
      
      // Cancel any ongoing speech first
      if (window.speechSynthesis.speaking) {
        console.log('Cancelling ongoing speech');
        window.speechSynthesis.cancel();
      }
      
      // Stop recording before speaking to avoid feedback loop
      const wasRecording = isRecording;
      if (wasRecording && audioRecorderRef.current) {
        console.log('Pausing recording for speech');
        audioRecorderRef.current.stopRecording();
        setIsRecording(false);
      }
      
      // Small delay to ensure recording stops
      await new Promise(resolve => setTimeout(resolve, 200));
      
      setIsSpeaking(true);
      
      // Create and store utterance for potential interruption
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = audioRecorderRef.current.getLanguageCode?.(locale) || locale;
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      currentUtteranceRef.current = utterance;
      
      // Get best voice for language
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        const languageCode = utterance.lang.split('-')[0];
        const preferredVoice = voices.find((v) => v.lang.startsWith(languageCode));
        const defaultVoice = voices.find((v) => v.default);
        utterance.voice = preferredVoice || defaultVoice || voices[0];
      }
      
      utterance.onstart = () => {
        console.log('Speech started');
        setIsSpeaking(true);
        // Start monitoring for interruptions
        setTimeout(() => {
          startInterruptionMonitoring();
        }, 500); // Give it 500ms before starting interruption detection
      };
      
      utterance.onend = () => {
        console.log('Speech ended naturally');
        setIsSpeaking(false);
        currentUtteranceRef.current = null;
        
        // Clear interruption monitoring
        if (interruptionCheckRef.current) {
          clearTimeout(interruptionCheckRef.current);
          interruptionCheckRef.current = null;
        }
        highVolumeCountRef.current = 0;
        
        // Wait a bit longer before resuming to ensure AI speech is fully done
        if (wasRecording && audioRecorderRef.current) {
          console.log('Waiting before resuming recording...');
          // Wait 800ms to ensure speech is completely finished and no echoes
          setTimeout(() => {
            if (!audioRecorderRef.current || isSpeaking) return;
            
            console.log('Resuming recording after speech');
            audioRecorderRef.current.startRecording(
              (text, isFinal) => {
                if (!isFinal) {
                  setCurrentTranscript(text);
                } else {
                  const trimmedText = text.trim();
                  const wordCount = trimmedText.split(/\s+/).filter(w => w.length > 0).length;
                  
                  if (trimmedText && wordCount >= 1 && trimmedText.length >= 2) {
                    setCurrentTranscript('');
                    onTranscript(trimmedText);
                  } else {
                    setCurrentTranscript('');
                  }
                }
              },
              (data) => {
                setFrequencyData(data);
              },
              locale
            );
            setIsRecording(true);
          }, 800);
        }
      };
      
      utterance.onerror = (error: any) => {
        const errorType = error.error || 'unknown';
        if (errorType !== 'interrupted' && errorType !== 'canceled') {
          console.error(`Speech synthesis ${errorType}`);
        }
        setIsSpeaking(false);
        currentUtteranceRef.current = null;
        
        // Clear interruption monitoring
        if (interruptionCheckRef.current) {
          clearTimeout(interruptionCheckRef.current);
          interruptionCheckRef.current = null;
        }
        highVolumeCountRef.current = 0;
        
        // Resume recording on error
        if (wasRecording && audioRecorderRef.current && !isRecording) {
          setTimeout(() => {
            if (!audioRecorderRef.current) return;
            audioRecorderRef.current.startRecording(
              (text, isFinal) => {
                if (!isFinal) {
                  setCurrentTranscript(text);
                } else {
                  const trimmedText = text.trim();
                  const wordCount = trimmedText.split(/\s+/).filter(w => w.length > 0).length;
                  if (trimmedText && wordCount >= 1 && trimmedText.length >= 2) {
                    setCurrentTranscript('');
                    onTranscript(trimmedText);
                  } else {
                    setCurrentTranscript('');
                  }
                }
              },
              (data) => setFrequencyData(data),
              locale
            );
            setIsRecording(true);
          }, 300);
        }
      };
      
      // Speak using native API
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('Error speaking:', error);
      setIsSpeaking(false);
      currentUtteranceRef.current = null;
      
      // Clear interruption monitoring
      if (interruptionCheckRef.current) {
        clearTimeout(interruptionCheckRef.current);
        interruptionCheckRef.current = null;
      }
      highVolumeCountRef.current = 0;
    }
  }, [isMuted, isRecording, locale, onTranscript, isSpeaking, startInterruptionMonitoring]);

  const toggleMute = () => {
    if (isSpeaking && audioRecorderRef.current) {
      audioRecorderRef.current.stopSpeaking();
      setIsSpeaking(false);
    }
    setIsMuted(!isMuted);
  };

  // Auto-speak AI responses when they come in
  const lastMessageRef = useRef<number | null>(null);
  
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'assistant' && lastMessage.id !== lastMessageRef.current) {
        lastMessageRef.current = lastMessage.id;
        const cleanText = lastMessage.content
          .replace(/[┌├└│─]/g, '')
          .replace(/\n{3,}/g, '\n\n')
          .replace(/•/g, '')
          .trim();
        
        if (cleanText && !isMuted) {
          console.log('Voice Assistant auto-speaking response:', cleanText.substring(0, 50) + '...');
          // Immediate speak without delay for better responsiveness
          speakResponse(cleanText);
        }
      }
    }
  }, [messages, isMuted, speakResponse]);
  
  useEffect(() => {
    // Expose the speak function
    (window as any).speakAIResponse = speakResponse;

    return () => {
      delete (window as any).speakAIResponse;
    };
  }, [isMuted, locale]);

  if (!isSupported) {
    return (
      <div className="text-sm text-muted-foreground text-center p-4 border border-yellow-500/20 rounded-lg">
        Voice features not supported in this browser. Try Chrome, Edge, or Safari.
      </div>
    );
  }

  return (
    <div className="w-full h-full pt-12 flex flex-col items-center justify-center space-y-12 bg-background">
      <div className="relative w-full flex-1 flex items-center justify-center px-4 sm:px-8">
        <div className="w-full">
          {!isMuted ? (
            <LiveWaveform 
              frequencyData={frequencyData}
              isActive={isRecording}
              height={400}
            />
          ) : (
            <div className="flex items-center justify-center h-[400px] text-muted-foreground">
              <div className="flex flex-col items-center gap-4">
                <VolumeX className="w-16 h-16 opacity-30" />
                <p className="text-sm">Voice output is muted</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex absolute bottom-0 items-center justify-center gap-3 pb-12">
        {/* Record Button */}
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isSpeaking}
          className={`
            relative flex cursor-pointer items-center justify-center p-2 rounded-full
            transition-all duration-300 shadow-lg
            ${isRecording 
              ? 'border border-red-600 bg-red-600 hover:bg-red-500' 
              : 'border border-foreground/20'
            }
            ${isSpeaking ? 'opacity-50 cursor-not-allowed' : ''}
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        >
          {isRecording ? (
            <>
              <MicOff className="w-6 h-6 text-white" />
            </>
          ) : (
            <>
              <Mic className="w-6 h-6 text-white" />
            </>
          )}
        </button>

        {/* Mute Toggle */}
        <button
          onClick={toggleMute}
          className={`
            p-2.5 cursor-pointer rounded-full transition-all
            border border-foreground/20 hover:border-foreground/40
          `}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? (
            <VolumeX className="w-5 h-5 text-white" />
          ) : (
            <Volume2 className="w-5 h-5 text-white" />
          )}
        </button>
      </div>
    </div>
  );
}
