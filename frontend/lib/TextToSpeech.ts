export interface VoiceSettings {
  rate: number
  pitch: number
  volume: number
  lang?: string
}

export const defaultVoiceSettings: VoiceSettings = {
  rate: 1.0,
  pitch: 1.0,
  volume: 1.0,
}

// Voice profile mapping (browser-native, completely free)
export const VOICE_IDS = {
  RACHEL: "female-en-US", // Professional female voice
  ADAM: "male-en-US", // Professional male voice
  SARAH: "female-en-US", // Friendly female voice
  ANTONI: "male-en-US", // Conversational male voice
}

/**
 * Convert text to speech using FREE Web Speech API
 * @param text - The text to convert to speech
 * @param voiceId - The voice preference (e.g., 'female-en-US')
 * @param language - Language code (e.g., 'en-US', 'hi-IN')
 * @returns Audio blob that can be played
 */
export async function textToSpeech(
  text: string,
  voiceId: string = VOICE_IDS.RACHEL,
  language: string = 'en-US'
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      // Use Web Speech API (completely free!)
      const synthesis = window.speechSynthesis;
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Extract gender preference from voiceId
      const isFemale = voiceId.includes('female');
      
      // Configure utterance
      utterance.lang = language;
      utterance.rate = defaultVoiceSettings.rate;
      utterance.pitch = defaultVoiceSettings.pitch;
      utterance.volume = defaultVoiceSettings.volume;
      
      // Select best voice for language and gender
      const voices = synthesis.getVoices();
      const preferredVoice = voices.find(v => {
        const matchesLang = v.lang.startsWith(language.split('-')[0]);
        const matchesGender = isFemale ? v.name.toLowerCase().includes('female') : v.name.toLowerCase().includes('male');
        return matchesLang && matchesGender;
      }) || voices.find(v => v.lang.startsWith(language.split('-')[0])) || voices[0];
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
      
      // Create a silent audio blob to maintain compatibility
      // (Web Speech API plays directly, no blob needed)
      utterance.onend = () => {
        // Return empty blob for compatibility
        const emptyBlob = new Blob([], { type: "audio/mpeg" });
        resolve(emptyBlob);
      };
      
      utterance.onerror = (error) => {
        console.error("Speech synthesis error:", error);
        reject(error);
      };
      
      synthesis.speak(utterance);
      
    } catch (error) {
      console.error("Error generating speech:", error);
      reject(error);
    }
  });
}

/**
 * Play audio from a blob (compatibility wrapper)
 * @param audioBlob - The audio blob to play
 * @returns Promise that resolves when audio finishes playing
 */
export function playAudio(audioBlob: Blob): Promise<void> {
  return new Promise((resolve, reject) => {
    // Web Speech API plays directly, so just resolve
    setTimeout(resolve, 100);
  });
}

/**
 * Stream text-to-speech for real-time playback using FREE Web Speech API
 * @param text - The text to convert to speech
 * @param voiceId - The voice preference
 * @param language - Language code
 * @returns Audio element for compatibility (Web Speech API handles playback)
 */
export async function streamTextToSpeech(
  text: string,
  voiceId: string = VOICE_IDS.RACHEL,
  language: string = 'en-US'
): Promise<HTMLAudioElement> {
  try {
    // Trigger speech synthesis
    await textToSpeech(text, voiceId, language);
    
    // Return dummy audio element for compatibility
    const audio = new Audio();
    return audio;
  } catch (error) {
    console.error("Error streaming speech:", error);
    throw error;
  }
}

/**
 * Stop all speech synthesis
 */
export function stopSpeaking(): void {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

/**
 * Check if Web Speech API is supported
 */
export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/**
 * Get available voices for a language
 */
export function getVoicesForLanguage(language: string): SpeechSynthesisVoice[] {
  if (!isSpeechSupported()) return [];
  
  const voices = window.speechSynthesis.getVoices();
  return voices.filter(v => v.lang.startsWith(language.split('-')[0]));
}
