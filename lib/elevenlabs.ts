import { ElevenLabsClient } from "elevenlabs"

const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY,
})

export interface VoiceSettings {
  stability: number
  similarity_boost: number
  style?: number
  use_speaker_boost?: boolean
}

export const defaultVoiceSettings: VoiceSettings = {
  stability: 0.5,
  similarity_boost: 0.75,
  style: 0.0,
  use_speaker_boost: true,
}

// Professional voice IDs from ElevenLabs
export const VOICE_IDS = {
  RACHEL: "21m00Tcm4TlvDq8ikWAM", // Professional female voice
  ADAM: "pNInz6obpgDQGcFmaJgB", // Professional male voice
  SARAH: "EXAVITQu4vr4xnSDxMaL", // Friendly female voice
  ANTONI: "ErXwobaYiN019PkySvjV", // Conversational male voice
}

/**
 * Convert text to speech using ElevenLabs API
 * @param text - The text to convert to speech
 * @param voiceId - The voice ID to use (default: RACHEL)
 * @returns Audio blob that can be played
 */
export async function textToSpeech(
  text: string,
  voiceId: string = VOICE_IDS.RACHEL
): Promise<Blob> {
  try {
    const audio = await elevenlabs.generate({
      voice: voiceId,
      text: text,
      model_id: "eleven_multilingual_v2", // Supports multiple languages including Hindi
      voice_settings: defaultVoiceSettings,
    })

    // Convert the audio stream to a blob
    const chunks: Uint8Array[] = []
    for await (const chunk of audio) {
      chunks.push(chunk)
    }

    const audioBlob = new Blob(chunks as BlobPart[], { type: "audio/mpeg" })
    return audioBlob
  } catch (error) {
    console.error("Error generating speech:", error)
    throw error
  }
}

/**
 * Play audio from a blob
 * @param audioBlob - The audio blob to play
 * @returns Promise that resolves when audio finishes playing
 */
export function playAudio(audioBlob: Blob): Promise<void> {
  return new Promise((resolve, reject) => {
    const audioUrl = URL.createObjectURL(audioBlob)
    const audio = new Audio(audioUrl)

    audio.onended = () => {
      URL.revokeObjectURL(audioUrl)
      resolve()
    }

    audio.onerror = (error) => {
      URL.revokeObjectURL(audioUrl)
      reject(error)
    }

    audio.play().catch(reject)
  })
}

/**
 * Stream text-to-speech for real-time playback
 * @param text - The text to convert to speech
 * @param voiceId - The voice ID to use
 * @returns Audio element for streaming
 */
export async function streamTextToSpeech(
  text: string,
  voiceId: string = VOICE_IDS.RACHEL
): Promise<HTMLAudioElement> {
  try {
    const audioBlob = await textToSpeech(text, voiceId)
    const audioUrl = URL.createObjectURL(audioBlob)
    const audio = new Audio(audioUrl)
    
    // Clean up the URL when audio ends
    audio.addEventListener('ended', () => {
      URL.revokeObjectURL(audioUrl)
    })
    
    return audio
  } catch (error) {
    console.error("Error streaming speech:", error)
    throw error
  }
}
