'use server';

import { generateTTS, ai } from '@/ai/genkit';
import { z } from 'genkit';

const TextToSpeechInputSchema = z.object({
  text: z.string().describe('The text to convert to speech.'),
});
export type TextToSpeechInput = z.infer<typeof TextToSpeechInputSchema>;

const TextToSpeechOutputSchema = z.object({
  audio: z.string().describe("The generated audio as a base64 encoded string."),
});
export type TextToSpeechOutput = z.infer<typeof TextToSpeechOutputSchema>;

export async function textToSpeech(input: TextToSpeechInput): Promise<TextToSpeechOutput> {
  return textToSpeechFlow(input);
}

const textToSpeechFlow = ai.defineFlow(
  {
    name: 'textToSpeechFlow',
    inputSchema: TextToSpeechInputSchema,
    outputSchema: TextToSpeechOutputSchema,
  },
  async ({ text }) => {
    // This now calls your new, updated generateTTS function
    const { audio } = await generateTTS(text);
    if (!audio) {
      throw new Error('No audio media was returned from the model.');
    }
    // This returns the base64 string, which the UI is expecting
    return { audio };
  }
);