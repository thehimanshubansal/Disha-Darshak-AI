'use server';

/**
 * @fileOverview This file defines a Genkit flow for providing resume improvement suggestions.
 *
 * - getResumeImprovementSuggestions - A function that takes resume text as input and returns improvement suggestions.
 * - ResumeImprovementInput - The input type for the getResumeImprovementSuggestions function.
 * - ResumeImprovementOutput - The return type for the getResumeImprovementSuggestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ResumeImprovementInputSchema = z.object({
  resumeText: z
    .string()
    .describe('The text content of the resume to be improved.'),
});
export type ResumeImprovementInput = z.infer<typeof ResumeImprovementInputSchema>;

const ResumeImprovementOutputSchema = z.object({
  suggestions: z
    .string()
    .describe('Suggestions for improving the resume, such as rephrasing sentences or adding keywords.'),
});
export type ResumeImprovementOutput = z.infer<typeof ResumeImprovementOutputSchema>;

export async function getResumeImprovementSuggestions(
  input: ResumeImprovementInput
): Promise<ResumeImprovementOutput> {
  return resumeImprovementFlow(input);
}

const prompt = ai.definePrompt({
  name: 'resumeImprovementPrompt',
  input: {schema: ResumeImprovementInputSchema},
  output: {schema: ResumeImprovementOutputSchema},
  prompt: `You are a resume expert. Review the following resume and provide suggestions for improvement.

Resume:
{{{resumeText}}}

Provide specific suggestions for improvement, such as rephrasing sentences or adding keywords. Focus on improving the overall quality and effectiveness of the resume to help the candidate stand out.`,
});

const resumeImprovementFlow = ai.defineFlow(
  {
    name: 'resumeImprovementFlow',
    inputSchema: ResumeImprovementInputSchema,
    outputSchema: ResumeImprovementOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
