'use server';

/**
 * @fileOverview A Genkit flow for analyzing resume files and extracting candidate information.
 *
 * - analyzeResume - A function that analyzes uploaded resume files.
 * - ResumeAnalysisInput - The input type for the analyzeResume function.
 * - ResumeAnalysisOutput - The return type for the analyzeResume function.
 */

import { generateWithPro, ai } from '../genkit';
import { z } from 'genkit';
// No need for external PDF libraries - Gemini can process PDFs directly

const ResumeAnalysisInputSchema = z.object({
  file: z.any().describe('The uploaded file (FormData)'),
});
export type ResumeAnalysisInput = z.infer<typeof ResumeAnalysisInputSchema>;

const ResumeAnalysisOutputSchema = z.object({
  name: z.string().describe('The candidate\'s full name'),
  job_role: z.string().describe('The desired job position'),
  focus_field: z.string().describe('The main area of expertise'),
  summary: z.string().describe('A brief summary of the candidate\'s background and experience'),
});
export type ResumeAnalysisOutput = z.infer<typeof ResumeAnalysisOutputSchema>;

export async function analyzeResume(input: ResumeAnalysisInput): Promise<ResumeAnalysisOutput> {
  return resumeAnalysisFlow(input);
}

const resumeAnalysisFlow = ai.defineFlow(
  {
    name: 'resumeAnalysisFlow',
    inputSchema: ResumeAnalysisInputSchema,
    outputSchema: ResumeAnalysisOutputSchema,
  },
  async ({ file }) => {
    try {
      // Support both FormData and File/Blob inputs
      const inputAny: any = file as any;
      const uploaded: any = typeof inputAny?.get === 'function' ? inputAny.get('file') : inputAny;
      if (!uploaded || typeof uploaded.arrayBuffer !== 'function') {
        throw new Error('Invalid upload payload');
      }

      // Convert uploaded file to base64 for direct Gemini processing
      const fileData = await uploaded.arrayBuffer();
      const base64Data = Buffer.from(fileData).toString('base64');
      const fileName: string = (uploaded as any)?.name || 'resume';
      
      const lower = fileName.toLowerCase();
      
      if (lower.endsWith('.pdf')) {
        // Use Gemini's native PDF processing capabilities
        const prompt = `Analyze this PDF resume and extract detailed candidate information for interview context.
Focus on extracting skills, projects, experience, and education mentioned in the resume.

Respond with ONLY a JSON object in this exact format (no markdown, no extra text):
{
  "name": "candidate's full name (if not found, extract from context or use 'Candidate')",
  "job_role": "most suitable job position based on experience and skills", 
  "focus_field": "primary area of expertise/specialization based on skills and experience",
  "summary": "comprehensive 3-4 sentence summary including key skills, notable projects, years of experience, and educational background"
}

IMPORTANT: 
- Return ONLY the JSON object, nothing else
- Use the actual resume content to fill in realistic information
- If name is not clearly stated, try to extract from email or context
- Make the summary detailed and specific to this person's background
- Read all pages of the PDF for complete analysis`;

        // Retry logic for API overload issues
        let response;
        let retries = 3;
        
        while (retries > 0) {
          try {
            response = await generateWithPro(
              [
                { text: prompt },
                { 
                  media: {
                    url: `data:application/pdf;base64,${base64Data}`
                  }
                }
              ]
            );
            break;
          } catch (error: any) {
            const isOverloaded = error.status === 503;
            const isRateLimited = error.status === 429;
            
            if ((isOverloaded || isRateLimited) && retries > 1) {
              // Exponential backoff: 2s, 4s, 8s
              const waitMs = 2000 * Math.pow(2, 3 - retries);
              console.log(`API overloaded/rate limited, retrying in ${waitMs/1000}s...`);
              await new Promise(resolve => setTimeout(resolve, waitMs));
              retries--;
              continue;
            }
            throw error;
          }
        }
        
        if (!response || !response.text) {
          throw new Error('No response from AI after retries');
        }

        // Parse the JSON response
        let analysis;
        try {
          let cleanedText = response.text.trim();
          if (cleanedText.startsWith('```json')) {
            cleanedText = cleanedText.slice(7);
          }
          if (cleanedText.endsWith('```')) {
            cleanedText = cleanedText.slice(0, -3);
          }
          if (cleanedText.startsWith('json')) {
            cleanedText = cleanedText.slice(4);
          }
          
          const startIdx = cleanedText.indexOf('{');
          const endIdx = cleanedText.lastIndexOf('}') + 1;
          
          if (startIdx !== -1 && endIdx > startIdx) {
            const jsonStr = cleanedText.slice(startIdx, endIdx);
            analysis = JSON.parse(jsonStr);
          } else {
            throw new Error('No JSON object found in response');
          }
        } catch (parseError) {
          console.error('Failed to parse resume analysis:', parseError);
          throw parseError;
        }

        return {
          name: analysis.name || 'Candidate',
          job_role: analysis.job_role || 'Software Engineer',
          focus_field: analysis.focus_field || 'Technology',
          summary: analysis.summary || 'No summary available'
        };
      } else {
        throw new Error('Only PDF files are supported');
      }
      
    } catch (error) {
      console.error('Resume analysis error:', error);
      return {
        name: 'Candidate',
        job_role: 'Software Engineer',
        focus_field: 'Technology',
        summary: 'Resume analysis failed, using default values'
      };
    }
  }
);
