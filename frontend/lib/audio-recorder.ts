/**
 * Free Audio Recording and Voice Assistant using Web Speech API
 * No external API costs - uses browser's native capabilities
 */
import type {
  ISpeechRecognition,
  ISpeechRecognitionEvent,
  ISpeechRecognitionErrorEvent
} from '@/types/web-speech-api';

/**
 * Free Audio Recording and Voice Assistant using Web Speech API
 * No external API costs - uses browser's native capabilities
 */
export class AudioRecorder {
  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private recognition: ISpeechRecognition | null = null;
  private synthesis: SpeechSynthesis;
  private animationFrameId: number | null = null;
  private isRecordingActive: boolean = false;

  constructor() {
    // Initialize Web Speech API for TTS (completely free)
    this.synthesis = window.speechSynthesis;
  }

  async startRecording(
    onTranscript: (text: string, isFinal: boolean) => void,
    onFrequencyData: (data: Uint8Array) => void,
    language: string = 'en-US'
  ): Promise<void> {
    if (this.isRecordingActive) {
      console.log('  Recording already active, skipping');
      return;
    }

    try {
      this.isRecordingActive = true;
      
      // Get microphone access
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      // Setup Web Audio API for waveform visualization
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.8;

      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      source.connect(this.analyser);

      // Start frequency data animation
      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const animate = () => {
        if (this.analyser) {
          this.analyser.getByteFrequencyData(dataArray);
          onFrequencyData(dataArray);
          this.animationFrameId = requestAnimationFrame(animate);
        }
      };
      animate();

      // Setup Web Speech Recognition API (completely free, browser-native)
      const SpeechRecognitionConstructor = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognitionConstructor) {
        throw new Error('Web Speech API not supported in this browser');
      }
      this.recognition = new SpeechRecognitionConstructor();
      
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 1;
      this.recognition.lang = this.mapLocaleToSpeechLang(language);

      let fullTranscript = '';
      let silenceTimeout: NodeJS.Timeout | null = null;

      this.recognition.onresult = (event: ISpeechRecognitionEvent) => {
        
        // Build complete transcript from all results
        let completeText = '';
        for (let i = 0; i < event.results.length; i++) {
          completeText += event.results[i][0].transcript;
        }
        
        // Check if any result is final
        let hasFinal = false;
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            hasFinal = true;
            break;
          }
        }
        
        if (hasFinal) {
          // Clear any pending timeout
          if (silenceTimeout) {
            clearTimeout(silenceTimeout);
            silenceTimeout = null;
          }
          fullTranscript = '';
          onTranscript(completeText, true);
        } else {
          // Interim result - accumulate complete text
          fullTranscript = completeText;
          onTranscript(completeText, false);
          
          // Clear existing timeout
          if (silenceTimeout) {
            clearTimeout(silenceTimeout);
          }
          
          // Auto-finalize after 1 second of silence
          silenceTimeout = setTimeout(() => {
            const trimmed = fullTranscript.trim();
            if (trimmed && trimmed.length >= 2) {
              onTranscript(trimmed, true);
              fullTranscript = '';
            } else {
              fullTranscript = '';
            }
          }, 1000);
        }
      };

      this.recognition.onerror = (event: ISpeechRecognitionErrorEvent) => {
        // Ignore non-critical errors
        if (event.error === 'aborted' || event.error === 'no-speech') {
          return;
        }
        
        console.error('Speech recognition error:', event.error, event.message || '');
        if (event.error === 'not-allowed') {
          alert('  Microphone access denied. Please allow microphone access.');
        }
      };

      this.recognition.onend = () => {
        
        // Auto-restart if still recording (unless manually stopped)
        if (this.recognition && this.mediaStream && this.isRecordingActive) {
          
          setTimeout(() => {
            if (this.recognition && this.mediaStream && this.isRecordingActive) {
              try {
                this.recognition.start();
                
              } catch (e) {
                
              }
            }
          }, 200);
        }
      };

      this.recognition.start();
    } catch (error) {
      console.error('Error starting recording:', error);
      throw error;
    }
  }

  /**
   * Stop recording and cleanup
   */
  stopRecording(): void {
    this.isRecordingActive = false;
    
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {
      }
      this.recognition = null;
    }

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    console.log('  Recording stopped');
  }

  /**
   * Speak text using Web Speech API
   */
  speak(
    text: string, 
    language: string = 'en-US',
    onEnd?: () => void,
    onStart?: () => void
  ): Promise<void> {
    return new Promise((resolve) => {
      // Cancel any ongoing speech
      this.synthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = this.mapLocaleToSpeechLang(language);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      // Get the best voice for the language
      const voices = this.synthesis.getVoices();
      const voice = voices.find(v => v.lang.startsWith(utterance.lang.split('-')[0])) 
                    || voices.find(v => v.default);
      
      if (voice) {
        utterance.voice = voice;
      }

      utterance.onstart = () => {
        onStart?.();
      };

      utterance.onend = () => {
        onEnd?.();
        resolve();
      };

      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        resolve();
      };

      this.synthesis.speak(utterance);
    });
  }

  /**
   * Stop current speech
   */
  stopSpeaking(): void {
    this.synthesis.cancel();
  }

  /**
   * Get available voices (for selection)
   */
  getAvailableVoices(): SpeechSynthesisVoice[] {
    return this.synthesis.getVoices();
  }

  /**
   * Mapping locale codes to Web Speech API language codes
   */
  private mapLocaleToSpeechLang(locale: string): string {
    const langMap: Record<string, string> = {
      'en': 'en-US',
      'hi': 'hi-IN',
      'pa-Guru': 'pa-IN',
      'mwr': 'hi-IN', // Marwadi uses Hindi voice
      'te': 'te-IN',
      'mr': 'mr-IN',
      'bn': 'bn-IN'
    };
    return langMap[locale] || 'en-US';
  }

  /**
   * Get language code (public accessor)
   */
  getLanguageCode(locale: string): string {
    return this.mapLocaleToSpeechLang(locale);
  }

  /**
   * Check if Web Speech API is supported
   */
  static isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    
    const hasSpeechRecognition = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
    const hasSpeechSynthesis = 'speechSynthesis' in window;
    return hasSpeechRecognition && hasSpeechSynthesis;
  }
}
