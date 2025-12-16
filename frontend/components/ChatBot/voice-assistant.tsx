"use client";

import { useState, useEffect, useRef } from 'react';
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

  const speakResponse = async (text: string) => {
    if (!audioRecorderRef.current || isMuted) return;

    try {
      setIsSpeaking(true);
      await audioRecorderRef.current.speak(
        text,
        locale,
        () => setIsSpeaking(false),
        () => setIsSpeaking(true)
      );
    } catch (error) {
      console.error('Error speaking:', error);
      setIsSpeaking(false);
    }
  };

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
          setTimeout(() => {
            speakResponse(cleanText);
          }, 500);
        }
      }
    }
  }, [messages, isMuted]);
  
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
    <div className="w-full h-full pt-16 flex flex-col items-center justify-center space-y-12 bg-background">
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
