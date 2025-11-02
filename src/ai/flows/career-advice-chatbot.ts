'use server';

/**
 * @fileOverview Provides a career advice chatbot that offers personalized advice based on the user's profile.
 * This is a standard, non-streaming flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { loadPrompt } from '../prompt-loader';

// Define the schema for a single message in the history
const MessageSchema = z.object({
  role: z.enum(['user', 'bot', 'system']), // Allow system role for context
  text: z.string(),
});

const CareerAdviceChatbotInputSchema = z.object({
  userInput: z.string().describe("The user's question or request for career advice."),
  history: z.array(MessageSchema).optional().describe("The conversation history between the user and the chatbot."),
  userProfileJson: z.string().optional().describe("A JSON string containing the user's profile and evaluation data."),
});
export type CareerAdviceChatbotInput = z.infer<typeof CareerAdviceChatbotInputSchema>;

const CareerAdviceChatbotOutputSchema = z.object({
  advice: z.string().describe("The chatbot's personalized career advice."),
});
export type CareerAdviceChatbotOutput = z.infer<typeof CareerAdviceChatbotOutputSchema>;

// This is a standard Server Action again
export async function careerAdviceChatbot(input: CareerAdviceChatbotInput): Promise<CareerAdviceChatbotOutput> {
  return careerAdviceChatbotFlow(input);
}

const careerAdviceChatbotFlow = ai.defineFlow(
  {
    name: 'careerAdviceChatbotFlow',
    inputSchema: CareerAdviceChatbotInputSchema,
    outputSchema: CareerAdviceChatbotOutputSchema,
  },
  async (input) => {
    const { userInput, history = [], userProfileJson } = input;

    // The system prompt now depends on whether profile JSON is provided.
    const systemPrompt = loadPrompt('chatbot/career-chatbot.md', {
      userProfileJson: userProfileJson || 'No profile data provided. Provide generic advice and encourage the user to use the personalized feature if they have a profile.',
    });

    // Format the conversation history into a string.
    const formattedHistory = history
      .map((message) => `${message.role === 'user' ? 'User' : 'AI'}: ${message.text}`)
      .join('\n');

    // Construct the final prompt, including system instructions, history, and the new user input.
    const finalPrompt = `${systemPrompt}\n\nHere is the conversation history:\n${formattedHistory}\n\nUser: ${userInput}\nAI:`;

    // Use ai.generate() to get the full response at once.
    const response = await ai.generate({
      prompt: finalPrompt,
      model: 'vertexai/gemini-2.5-flash',
    });

    return { advice: response.text };
  }
);