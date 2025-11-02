'use server';

import { generateWithPro, ai } from '@/ai/genkit';
import { z } from 'genkit';
import { loadPrompt } from '../prompt-loader';
type Part = { role: 'system' | 'user' | 'model'; text: string };

// Schemas remain the same...
const DifficultySchema = z.enum(['easy', 'intermediate', 'hard']);
const FeedbackItemSchema = z.object({ Metric: z.string(), Evaluation: z.string(), Score: z.string() });
const QuestionPairSchema = z.object({ QuestionNumber: z.string(), Question: z.string(), FinalScore: z.string(), Feedback: z.array(FeedbackItemSchema), PotentialAreasOfImprovement: z.string(), IdealAnswer: z.string() });
const InterviewEvaluationSchema = z.object({ FinalEvaluation: z.object({ SoftSkillScore: z.string(), OverallFeedback: z.string() }), QuestionPairs: z.array(QuestionPairSchema) });
export type InterviewEvaluation = z.infer<typeof InterviewEvaluationSchema>;
const InterviewInputSchema = z.object({ resumeText: z.string().optional(), candidateName: z.string(), jobRole: z.string(), focusField: z.string(), difficulty: DifficultySchema, history: z.any(), userResponse: z.string() });
export type InterviewInput = z.infer<typeof InterviewInputSchema>;
const InterviewOutputSchema = z.object({ question: z.string(), history: z.any(), evaluation: InterviewEvaluationSchema.optional() });
export type InterviewOutput = z.infer<typeof InterviewOutputSchema>;

export async function conductInterview(input: InterviewInput): Promise<InterviewOutput> {
  return interviewFlow(input);
}

const interviewFlow = ai.defineFlow(
  {
    name: 'interviewFlow',
    inputSchema: InterviewInputSchema,
    outputSchema: InterviewOutputSchema,
  },
  async (input) => {
    const { resumeText, candidateName, jobRole, focusField, difficulty, history, userResponse } = input;
    const femaleNames = ['Disha'];
    const interviewerName = femaleNames[Math.floor(Math.random() * femaleNames.length)];
    const promptPathMap = { easy: 'mock-interview/easy-prompt.md', intermediate: 'mock-interview/intermediate-prompt.md', hard: 'mock-interview/hard-prompt.md' };
    const systemInstruction = loadPrompt(promptPathMap[difficulty], { interviewerName, candidate_name: candidateName, job_role: jobRole, focus_field: focusField, resumeText: resumeText || 'No resume provided.' });
    const chatHistory: Part[] = history.length > 0 ? history : [{ role: 'system', text: systemInstruction }];
    chatHistory.push({ role: 'user', text: userResponse });
    const transcript = chatHistory.slice(-12).filter(m => m.role !== 'system').map(m => `${m.role === 'user' ? 'Candidate' : 'Interviewer'}: ${m.text}`).join('\n');
    const modelTurns = chatHistory.filter(m => m.role === 'model').length;
    const targetTurns = difficulty === 'easy' ? 8 : difficulty === 'intermediate' ? 12 : 20;
    const userRequestedEnd = /\b(end|finish|stop|thank you|evaluation)\b/i.test(userResponse);
    const forceEvaluation = userRequestedEnd || modelTurns >= targetTurns;
    
    const evaluationInstruction = `
- The interview is now complete.
- Your next response MUST be ONLY the final evaluation JSON.
- Base your evaluation STRICTLY on the questions asked by the Interviewer and the answers provided by the Candidate in the TRANSCRIPT above.
- Do NOT include any questions in your evaluation that were not asked in the transcript.
- For each question-answer pair in the transcript, generate a corresponding entry in the "QuestionPairs" array.`;

    const prompt = `SYSTEM INSTRUCTIONS\n${systemInstruction}\n\nTRANSCRIPT\n${transcript}\n\nRESPONSE RULES\n- Ask ONE question only.\n- Keep tone professional.\n${forceEvaluation ? evaluationInstruction : ''}\n`;

    const response = await generateWithPro(prompt);
    const responseText = response.text;
    const newHistory = [...chatHistory, { role: 'model', text: responseText }];

    // CRITICAL FIX: Robust JSON parsing to end the interview loop.
    try {
      let cleanedText = responseText.trim().replace(/```json/g, '').replace(/```/g, '');
      const jsonStartIndex = cleanedText.indexOf('{');
      const jsonEndIndex = cleanedText.lastIndexOf('}') + 1;
      if (jsonStartIndex !== -1 && jsonEndIndex > jsonStartIndex) {
        const jsonString = cleanedText.substring(jsonStartIndex, jsonEndIndex);
        const jsonResponse = JSON.parse(jsonString);
        if (jsonResponse.FinalEvaluation && jsonResponse.QuestionPairs) {
          const validatedEvaluation = InterviewEvaluationSchema.parse(jsonResponse);
          return {
            question: 'Interview finished!',
            history: newHistory,
            evaluation: validatedEvaluation,
          };
        }
      }
    } catch (e) {
      // Not a JSON evaluation, so continue the interview.
    }

    return {
      question: responseText,
      history: newHistory,
    };
  }
);