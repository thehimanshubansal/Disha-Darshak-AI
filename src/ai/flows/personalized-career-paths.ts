'use server';

/**
 * @fileOverview Provides personalized career path suggestions based on the skills listed in a resume.
 */

import {ai, generateWithFlash} from '@/ai/genkit';
import {z} from 'genkit';
import { loadPrompt } from '../prompt-loader';
import { FIELDS_OF_INTEREST } from '@/lib/fields-of-interest';

const SuggestCareerPathsInputSchema = z.object({
  resumeText: z
    .string()
    .describe('The text content of the user\u2019s resume.'),
});
export type SuggestCareerPathsInput = z.infer<typeof SuggestCareerPathsInputSchema>;

// --- MODIFICATION START ---
// Added 'category' to the schema
const CareerPathSchema = z.object({
  title: z.string().describe('The title of the suggested career path (the specific field).'),
  category: z.string().describe('The main category for the career path.'),
  reason: z.string().describe('The reason why this career path is suggested based on the skills.'),
  next: z.array(z.string()).describe('A list of skills to learn next for this career path.'),
});
// --- MODIFICATION END ---

const SuggestCareerPathsOutputSchema = z.array(CareerPathSchema);
export type SuggestCareerPathsOutput = z.infer<typeof SuggestCareerPathsOutputSchema>;

export async function suggestCareerPaths(input: SuggestCareerPathsInput): Promise<SuggestCareerPathsOutput> {
  return suggestCareerPathsFlow(input);
}

// --- MODIFICATION START ---
// The flow now uses loadPrompt and generateWithFlash to handle the more complex prompt.
const suggestCareerPathsFlow = ai.defineFlow(
  {
    name: 'suggestCareerPathsFlow',
    inputSchema: SuggestCareerPathsInputSchema,
    outputSchema: SuggestCareerPathsOutputSchema,
  },
  async ({ resumeText }) => {
    const prompt = loadPrompt('career-paths/suggester-prompt.md', {
        fields_of_interest: JSON.stringify(FIELDS_OF_INTEREST, null, 2),
        resumeText: resumeText,
    });

    const { text } = await generateWithFlash(prompt);
    
    try {
        const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const output = JSON.parse(cleaned);
        return SuggestCareerPathsOutputSchema.parse(output);
    } catch (error) {
        console.error("Failed to parse personalized career paths:", error);
        throw new Error("Could not generate career suggestions.");
    }
  }
);
// --- MODIFICATION END ---