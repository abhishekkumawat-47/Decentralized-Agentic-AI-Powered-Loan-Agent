/**
 * Speech Recognition Event - fired when recognition results are available
 */
export interface ISpeechRecognitionEvent extends Event {
  /** Index of the first result that has changed */
  readonly resultIndex: number;
  /** List of recognition results */
  readonly results: ISpeechRecognitionResultList;
}

/**
 * Speech Recognition Error Event - fired when recognition encounters an error
 */
export interface ISpeechRecognitionErrorEvent extends Event {
  /** Type of error that occurred */
  readonly error: 
    | 'no-speech'
    | 'aborted'
    | 'audio-capture'
    | 'network'
    | 'not-allowed'
    | 'service-not-allowed'
    | 'bad-grammar'
    | 'language-not-supported';
  /** Detailed error message */
  readonly message: string;
}

/**
 * List of speech recognition results
 */
export interface ISpeechRecognitionResultList {
  /** Number of results in the list */
  readonly length: number;
  /** Get result at specific index */
  item(index: number): ISpeechRecognitionResult;
  /** Array-like access to results */
  [index: number]: ISpeechRecognitionResult;
}

/**
 * A single speech recognition result
 */
export interface ISpeechRecognitionResult {
  /** Number of alternatives for this result */
  readonly length: number;
  /** Whether this is the final result (not interim) */
  readonly isFinal: boolean;
  /** Get alternative at specific index */
  item(index: number): ISpeechRecognitionAlternative;
  /** Array-like access to alternatives */
  [index: number]: ISpeechRecognitionAlternative;
}

/**
 * A single alternative interpretation of recognized speech
 */
export interface ISpeechRecognitionAlternative {
  /** The recognized text */
  readonly transcript: string;
  /** Confidence score (0-1) */
  readonly confidence: number;
}

/**
 * Main Speech Recognition interface
 * Provides continuous speech recognition capabilities
 */
export interface ISpeechRecognition extends EventTarget {
  // Configuration properties
  /** Whether to continue listening after each recognition */
  continuous: boolean;
  /** Grammar rules (not widely supported) */
  grammars: any;
  /** Whether to provide interim results while speaking */
  interimResults: boolean;
  /** Language for recognition (e.g., 'en-US', 'hi-IN') */
  lang: string;
  /** Maximum number of alternative interpretations to provide */
  maxAlternatives: number;

  // Event handlers
  /** Fired when audio capture ends */
  onaudioend: ((this: ISpeechRecognition, ev: Event) => any) | null;
  /** Fired when audio capture starts */
  onaudiostart: ((this: ISpeechRecognition, ev: Event) => any) | null;
  /** Fired when recognition service disconnects */
  onend: ((this: ISpeechRecognition, ev: Event) => any) | null;
  /** Fired when recognition error occurs */
  onerror: ((this: ISpeechRecognition, ev: ISpeechRecognitionErrorEvent) => any) | null;
  /** Fired when no speech was recognized */
  onnomatch: ((this: ISpeechRecognition, ev: ISpeechRecognitionEvent) => any) | null;
  /** Fired when recognition results are available */
  onresult: ((this: ISpeechRecognition, ev: ISpeechRecognitionEvent) => any) | null;
  /** Fired when sound (speech or not) stops being detected */
  onsoundend: ((this: ISpeechRecognition, ev: Event) => any) | null;
  /** Fired when sound (speech or not) starts being detected */
  onsoundstart: ((this: ISpeechRecognition, ev: Event) => any) | null;
  /** Fired when speech recognized ends */
  onspeechend: ((this: ISpeechRecognition, ev: Event) => any) | null;
  /** Fired when speech recognized starts */
  onspeechstart: ((this: ISpeechRecognition, ev: Event) => any) | null;
  /** Fired when recognition service starts */
  onstart: ((this: ISpeechRecognition, ev: Event) => any) | null;

  // Methods
  /** Abort recognition immediately */
  abort(): void;
  /** Start recognition */
  start(): void;
  /** Stop recognition (processes current audio) */
  stop(): void;
}

// ============================================================================
// GLOBAL WINDOW DECLARATIONS
// ============================================================================

declare global {
  interface Window {
    /**
     * Standard Speech Recognition constructor
     * Available in Chrome/Edge
     */
    SpeechRecognition: {
      new (): ISpeechRecognition;
    };
    
    /**
     * Webkit-prefixed Speech Recognition constructor
     * Available in Safari and older Chrome
     */
    webkitSpeechRecognition: {
      new (): ISpeechRecognition;
    };
  }
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Check if Speech Recognition is supported in current browser
 */
export type SpeechRecognitionSupport = {
  supported: boolean;
  vendor: 'standard' | 'webkit' | 'none';
};

/**
 * Language codes supported by Web Speech API
 */
export type SpeechLanguageCode = 
  | 'en-US' | 'en-GB' | 'en-AU' | 'en-CA' | 'en-IN'
  | 'hi-IN' | 'te-IN' | 'mr-IN' | 'bn-IN' | 'pa-IN'
  | 'es-ES' | 'es-MX' | 'fr-FR' | 'de-DE' | 'it-IT'
  | 'ja-JP' | 'ko-KR' | 'zh-CN' | 'zh-TW' | 'ru-RU'
  | string; // Allow other language codes

/**
 * Configuration options for Speech Recognition
 */
export interface SpeechRecognitionConfig {
  /** Language to recognize */
  language?: SpeechLanguageCode;
  /** Continue listening after recognition */
  continuous?: boolean;
  /** Provide interim results */
  interimResults?: boolean;
  /** Max number of alternatives */
  maxAlternatives?: number;
}

// ============================================================================
// RE-EXPORT FOR CONVENIENCE
// ============================================================================

export type SpeechRecognition = ISpeechRecognition;
export type SpeechRecognitionEvent = ISpeechRecognitionEvent;
export type SpeechRecognitionErrorEvent = ISpeechRecognitionErrorEvent;
export type SpeechRecognitionResult = ISpeechRecognitionResult;
export type SpeechRecognitionAlternative = ISpeechRecognitionAlternative;
export type SpeechRecognitionResultList = ISpeechRecognitionResultList;
