// src/ai/genkit.ts
import { genkit } from "genkit";
import { vertexAI } from "@genkit-ai/vertexai";
import * as dotenv from "dotenv";
import { TextToSpeechClient } from '@google-cloud/text-to-speech'; // <-- ADD THIS IMPORT

dotenv.config();

const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID ;
const location = process.env.GOOGLE_CLOUD_LOCATION ;

if (process.env.NODE_ENV !== "production" && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  process.env.GOOGLE_APPLICATION_CREDENTIALS = "service-account-key.json";
}

export const ai = genkit({
  plugins: [vertexAI({ projectId, location })],
  model: "vertexai/gemini-2.5-pro", // Using 1.5 Pro, but you can use 2.5 as well
});

// ---------- Types ----------
export interface AIResult {
  text: string;
  output: string;
  raw: unknown;
}

// MODIFIED: This interface is now simpler
export interface TTSResult {
  audio: string | null; // This will hold the base64 encoded audio string
  raw: unknown;
}

// ---------- Models ----------
export const FLASH_MODEL = "vertexai/gemini-2.5-flash";
export const PRO_MODEL = "vertexai/gemini-2.5-pro";

// --- TTS Voices (from Cloud Text-to-Speech API) ---
const INDIAN_FEMALE_VOICE = 'en-IN-Wavenet-D';

// ---------- Wrappers ----------
export async function generateWithFlash(prompt: any, options?: Record<string, unknown>): Promise<AIResult> {
  const result = await ai.generate({
    model: FLASH_MODEL,
    prompt,
    ...options,
  });
  return { text: result.text, output: result.text, raw: result };
}

export async function generateWithPro(prompt: any, options?: Record<string, unknown>): Promise<AIResult> {
  const result = await ai.generate({
    model: PRO_MODEL,
    prompt,
    ...options,
  });
  return { text: result.text, output: result.text, raw: result };
}

// --- REPLACED: This is the new generateTTS function using the dedicated API ---
export async function generateTTS(text: string): Promise<TTSResult> {
  // 1. Instantiate a client
  const client = new TextToSpeechClient();

  // 2. Construct the request payload with the Indian female voice
  const request = {
    input: { text: text },
    voice: { languageCode: 'en-IN', name: INDIAN_FEMALE_VOICE },
    audioConfig: { audioEncoding: 'MP3' as const },
  };

  try {
    // 3. Perform the text-to-speech request
    const [response] = await client.synthesizeSpeech(request);
    
    // 4. Get the audio content and convert it to a base64 string
    const audioContent = response.audioContent;
    if (audioContent instanceof Uint8Array) {
        const audioBase64 = Buffer.from(audioContent).toString('base64');
        return {
            audio: audioBase64,
            raw: response,
        };
    }
    
    throw new Error('Invalid audio content received from the API.');

  } catch (error) {
    console.error("Error calling Google Cloud Text-to-Speech API:", error);
    throw new Error("Failed to generate speech. Ensure the API is enabled and you have permissions.");
  }
}


export const FLASH_MODEL_NAME = FLASH_MODEL;
export const PRO_MODEL_NAME = PRO_MODEL;