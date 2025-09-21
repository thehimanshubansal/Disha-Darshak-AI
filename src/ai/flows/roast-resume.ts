'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { Part } from 'genkit';
import { loadPrompt } from '../prompt-loader';

// Schemas remain the same...
const RankResumeInputSchema = z.object({
  pdfBase64: z.string().describe('The base64 encoded string of the resume PDF.'),
  jobRole: z.string().describe('The job role the user is applying for.'),
  field: z.string().describe('The industry or field of the job.'),
});
export type RankResumeInput = z.infer<typeof RankResumeInputSchema>;

const RankResumeOutputSchema = z.object({
  match_score: z.number(),
  strengths: z.string(),
  weaknesses: z.string(),
  keywords_missing: z.array(z.string()),
  final_recommendation: z.string(),
});
export type RankResumeOutput = z.infer<typeof RankResumeOutputSchema>;

export const rankResumeFlow = ai.defineFlow(
  { name: 'rankResumeFlow', inputSchema: RankResumeInputSchema, outputSchema: RankResumeOutputSchema },
  async (input) => {
    const promptText = loadPrompt('torch-my-resume/roaster-prompt.md', {
      jobRole: input.jobRole,
      field: input.field,
    });

    const parts: Part[] = [
      { media: { url: `data:application/pdf;base64,${input.pdfBase64}` } },
      { text: promptText },
    ];

    
    const { output } = await ai.generate({
      model: 'vertexai/gemini-2.5-flash',
      prompt: parts,
      output: { schema: RankResumeOutputSchema },
    });

    if (output == null) {
      throw new Error('Failed to generate valid output conforming to the schema.');
    }

    return output;
  }
);

const RoastResumeOutputSchema = z.object({
  roast_comments: z.array(z.string()),
  improvement_tips: z.array(z.string()),
});
export type RoastResumeOutput = z.infer<typeof RoastResumeOutputSchema>;

export const roastResumeFlow = ai.defineFlow(
  { name: 'roastResumeFlow', inputSchema: RankResumeInputSchema, outputSchema: RoastResumeOutputSchema },
  async (input) => {
    const promptText = loadPrompt('torch-my-resume/roaster-prompt.md', {
      jobRole: input.jobRole,
      field: input.field,
    });

    const parts = [
      { media: { url: `data:application/pdf;base64,${input.pdfBase64}` } },
      { text: promptText },
    ];

    const { output } = await ai.generate({
      model: 'vertexai/gemini-2.5-flash',
      prompt: parts,
      output: { schema: RoastResumeOutputSchema },
    });

    if (!output) {
      throw new Error('Failed to generate valid output conforming to the schema.');
    }

    return output;
  }
);