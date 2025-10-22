import fs from 'fs';
import path from 'path';

/**
 * Loads a prompt from the file system and injects template variables.
 * @param promptPath The path to the prompt file relative to the 'src/ai/prompts' directory. E.g., 'resume-analysis/ranker'.
 * @param variables A key-value object of placeholders to replace in the prompt. E.g., { jobRole: 'Engineer' }.
 * @returns The processed prompt string.
 */
export function loadPrompt(promptPath: string, variables: Record<string, string> = {}): string {
  // Construct the full path to the prompt file, automatically adding the '.prompt.md' suffix.
  const fullPath = path.join(process.cwd(), 'src', 'ai', 'prompts', `${promptPath}`);

  try {
    // Read the raw prompt template from the file.
    const template = fs.readFileSync(fullPath, 'utf-8');

    // Replace all placeholders (like {{variableName}}) with their actual values.
    // The 'reduce' function iterates over all provided variables and applies them to the template.
    const processedPrompt = Object.entries(variables).reduce(
      (currentPrompt, [key, value]) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        return currentPrompt.replace(regex, value);
      },
      template
    );

    return processedPrompt;
  } catch (error) {
    console.error(`[PromptLoader Error] Failed to load prompt: ${fullPath}`, error);
    // In a real application, you might want more robust error handling.
    throw new Error(`Could not load or process prompt: ${promptPath}`);
  }
}