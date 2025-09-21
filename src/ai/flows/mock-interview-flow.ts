'use server';

import { generateWithPro, ai } from '@/ai/genkit';
import { z } from 'genkit';
import { loadPrompt } from '../prompt-loader';
type Part = { role: 'system' | 'user' | 'model'; text: string };

// Schemas
const DifficultySchema = z.enum(['easy', 'intermediate', 'hard']);
const FeedbackItemSchema = z.object({ Metric: z.string(), Evaluation: z.string(), Score: z.string() });
const QuestionPairSchema = z.object({ QuestionNumber: z.string(), Question: z.string(), FinalScore: z.string(), Feedback: z.array(FeedbackItemSchema), PotentialAreasOfImprovement: z.string(), IdealAnswer: z.string() });
const InterviewEvaluationSchema = z.object({ FinalEvaluation: z.object({ SoftSkillScore: z.string(), OverallFeedback: z.string() }), QuestionPairs: z.array(QuestionPairSchema) });
export type InterviewEvaluation = z.infer<typeof InterviewEvaluationSchema>;

// --- CHANGE 1: Add focusCategory to the input schema ---
const InterviewInputSchema = z.object({ 
  resumeText: z.string().optional(), 
  candidateName: z.string(), 
  jobRole: z.string(), 
  focusCategory: z.string(), // <-- ADDED
  focusField: z.string(), 
  difficulty: DifficultySchema, 
  history: z.any(), 
  userResponse: z.string() 
});
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
    // --- CHANGE 2: Destructure the new focusCategory ---
    const { resumeText, candidateName, jobRole, focusCategory, focusField, difficulty, history, userResponse } = input;
    
    const femaleNames = ['Anya Verma'];
    const interviewerName = femaleNames[Math.floor(Math.random() * femaleNames.length)];
    const promptPathMap = { easy: 'mock-interview/easy-prompt.md', intermediate: 'mock-interview/intermediate-prompt.md', hard: 'mock-interview/hard-prompt.md' };

    // --- CHANGE 3: Pass both category and field to the prompt loader ---
    const systemInstruction = loadPrompt(promptPathMap[difficulty], { 
      interviewerName, 
      candidate_name: candidateName, 
      job_role: jobRole, 
      focus_category: focusCategory, // <-- ADDED
      focus_field: focusField, 
      resumeText: resumeText || 'No resume provided.' 
    });

    const chatHistory: Part[] = history.length > 0 ? history : [{ role: 'system', text: systemInstruction }];
    chatHistory.push({ role: 'user', text: userResponse });

    const transcript = chatHistory.slice(-12).filter(m => m.role !== 'system').map(m => `${m.role === 'user' ? 'Candidate' : 'Interviewer'}: ${m.text}`).join('\n');
    const modelTurns = chatHistory.filter(m => m.role === 'model').length;
    
    const targetTurns = difficulty === 'easy' ? 4 : difficulty === 'intermediate' ? 6 : 8; 
    
    const userRequestedEnd = /\b(stop the interview|finish the interview|stop|that's all)\b/i.test(userResponse);
    const forceEvaluation = userRequestedEnd || modelTurns >= targetTurns;

    if (forceEvaluation) {
      const evaluationPrompt = `
        SYSTEM: You are an expert interviewer providing a final, detailed evaluation.
        TASK: Based *only* on the conversation transcript provided below, generate a final evaluation in a strict JSON format.
        CONTEXT: The interview was for a ${jobRole} role, focusing on the field of ${focusField} within the broader ${focusCategory} category.
        
        TRANSCRIPT:
        ---
        ${transcript}
        ---

        IMPORTANT INSTRUCTIONS:
        1.  **Evaluate Only What's in the Transcript**: Your \`QuestionPairs\` array in the JSON output MUST ONLY contain questions that were actually asked by the "Interviewer" in the transcript. Do not invent placeholder questions.
        2.  **Handle Short Interviews Gracefully**: If the transcript is short, state in the "OverallFeedback" that a full evaluation was not possible. Score only the answered questions.
        3.  **STRICT JSON OUTPUT**: Your *entire response* must be ONLY the JSON object.

        JSON SCHEMA:
        {
          "FinalEvaluation": { "SoftSkillScore": "string (e.g., '7/10')", "OverallFeedback": "string" },
          "QuestionPairs": [
            {
              "QuestionNumber": "string",
              "Question": "string (The exact question from the transcript)",
              "FinalScore": "string (e.g., '8/10')",
              "Feedback": [{ "Metric": "string", "Evaluation": "string", "Score": "string" }],
              "PotentialAreasOfImprovement": "string",
              "IdealAnswer": "string"
            }
          ]
        }

        Now, generate the JSON output based *only* on the provided transcript.`;

      const response = await generateWithPro(evaluationPrompt);
      
      try {
        let cleanedText = response.text.trim().replace(/```json/g, '').replace(/```/g, '');
        const jsonStartIndex = cleanedText.indexOf('{');
        const jsonEndIndex = cleanedText.lastIndexOf('}') + 1;
        
        if (jsonStartIndex !== -1 && jsonEndIndex > jsonStartIndex) {
          const jsonString = cleanedText.substring(jsonStartIndex, jsonEndIndex);
          const jsonResponse = JSON.parse(jsonString);
          const validatedEvaluation = InterviewEvaluationSchema.parse(jsonResponse);
          
          return {
            question: 'Interview finished! Here is your evaluation.',
            history: chatHistory,
            evaluation: validatedEvaluation,
          };
        } else {
            throw new Error("No valid JSON object found in the evaluation response.");
        }
      } catch (e) {
        console.error("Failed to parse evaluation JSON:", e, "Raw response:", response.text);
        return {
          question: "I tried to generate your evaluation but encountered an error. Please try ending the interview again.",
          history: history,
        };
      }
    } else {
      const conversationalPrompt = `
        # SYSTEM INSTRUCTIONS
        ${systemInstruction}

        # CONVERSATION HISTORY (recent turns)
        ${transcript}

        # YOUR TASK
        1.  Review your persona and mission in the SYSTEM INSTRUCTIONS.
        2.  Review the CONVERSATION HISTORY to understand what has already been discussed.
        3.  Formulate the **single next question** for the interview, using the resume and specialization for targeting.
        4.  Your response must be ONLY the question itself.`;
      
      const response = await generateWithPro(conversationalPrompt);
      const newHistory = [...chatHistory, { role: 'model', text: response.text }];
      
      return {
        question: response.text,
        history: newHistory,
      };
    }
  }
);