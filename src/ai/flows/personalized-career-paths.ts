'use server';

/**
 * @fileOverview Provides personalized career path suggestions based on the skills listed in a resume.
 *
 * - suggestCareerPaths - A function that suggests career paths based on the skills extracted from a resume.
 * - SuggestCareerPathsInput - The input type for the suggestCareerPaths function.
 * - SuggestCareerPathsOutput - The return type for the suggestCareerPaths function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestCareerPathsInputSchema = z.object({
  resumeText: z
    .string()
    .describe('The text content of the user\u2019s resume.'),
});
export type SuggestCareerPathsInput = z.infer<typeof SuggestCareerPathsInputSchema>;

const CareerPathSchema = z.object({
  title: z.string().describe('The title of the suggested career path.'),
  reason: z.string().describe('The reason why this career path is suggested based on the skills.'),
  next: z.array(z.string()).describe('A list of skills to learn next for this career path.'),
});

const SuggestCareerPathsOutputSchema = z.array(CareerPathSchema);
export type SuggestCareerPathsOutput = z.infer<typeof SuggestCareerPathsOutputSchema>;

export async function suggestCareerPaths(input: SuggestCareerPathsInput): Promise<SuggestCareerPathsOutput> {
  return suggestCareerPathsFlow(input);
}

const suggestCareerPathsPrompt = ai.definePrompt({
  name: 'suggestCareerPathsPrompt',
  input: {schema: SuggestCareerPathsInputSchema},
  output: {schema: SuggestCareerPathsOutputSchema},
  prompt: `You are an expert career counselor. Given the following resume text, suggest 3 potential career paths for the user, explaining why each path is a good fit based on the skills listed in the resume and suggesting skills to learn next.  Output should be JSON.

Resume text: {{{resumeText}}}`,
});

const suggestCareerPathsFlow = ai.defineFlow(
  {
    name: 'suggestCareerPathsFlow',
    inputSchema: SuggestCareerPathsInputSchema,
    outputSchema: SuggestCareerPathsOutputSchema,
  },
  async input => {
    const {output} = await suggestCareerPathsPrompt(input);
    return output!;
  }
);
