// src/ai/flows/path-finder.ts

import { generateWithFlash } from "@/ai/genkit";

function cleanJSONResponse(text: string): string {
  return text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
}

/**
 * CORRECTED: This function now properly scores answers based on the actual question IDs
 * from the skill assessment forms and handles the numeric likert scale values directly.
 */
export function scoreAnswers(answers: Record<string, any>) {
  // Helper to get a numeric value from a likert scale answer (which are numbers 1-5).
  // Defaults to 3 (neutral) if not found or invalid.
  const getLikertValue = (qid: string): number => {
    const val = answers[qid];
    if (typeof val === 'number' && val >= 1 && val <= 5) {
      return val;
    }
    // Handle the shorter signup quiz which doesn't have all questions
    return 3; 
  };

  // Helper to get a string value from MCQ or text answers
  const getStringValue = (qid: string): string => {
    const val = answers[qid];
    if (typeof val === 'object' && val?.selected) {
      // For "Other" option with text input
      return val.text ? `${val.selected}: ${val.text}` : val.selected;
    }
    return String(val ?? '');
  };

  // Calculate scores based on the actual question IDs from your forms
  const analytical = (getLikertValue("logicVsCreativity") + getLikertValue("problemSolvingStyle")) / 2;
  const creative = (6 - getLikertValue("logicVsCreativity")); // Inverse of logical is creative
  const independence = getLikertValue("workStyle"); // 5 = strongly agree with "prefer working individually"
  const teamwork = 6 - independence; // Teamwork is the inverse of preferring to work alone
  const stability = getLikertValue("workEnvironment"); // 5 = strongly agree with "prefer structured environment"

  return {
    analytical: isNaN(analytical) ? 3 : analytical,
    creative: isNaN(creative) ? 3 : creative,
    teamwork: isNaN(teamwork) ? 3 : teamwork,
    independent: isNaN(independence) ? 3 : independence,
    stability: isNaN(stability) ? 3 : stability,
    // Also pass through some key categorical answers for the AI prompt to use
    education: getStringValue("educationLevel"),
    specialization: getStringValue("specialization"),
    industry_interest: getStringValue("industryPreference"),
    goal: getStringValue("dreamCareer") || getStringValue("futureVision"),
    constraint: getStringValue("constraints"),
  };
}


// ---------- Gemini Explain Roles (For Signup) ----------
export async function geminiExplainRoles(scores: Record<string, any>, answers: Record<string, any>) {
    const prompt = `
  The user has completed a 20-question career questionnaire.
  Scores: ${JSON.stringify(scores, null, 2)}
  Answers: ${JSON.stringify(answers, null, 2)}
  Task:
  1. Suggest the top 3 broad career **fields of interest** (e.g., Data Science, Cloud Computing, UX/UI Design).
  2. Do not suggest specific job roles.
  3. Return strictly as JSON: { "fields": ["Field 1", "Field 2", "Field 3"] }`;

    const { text } = await generateWithFlash(prompt);
    try {
      const clean = cleanJSONResponse(text);
      return JSON.parse(clean).fields ?? [];
    } catch {
      console.error("Failed to parse fields JSON:", text);
      return [];
    }
}

// --- MODIFICATION START ---
// Restoring the geminiExplainFull function to get the initial detailed recommendations.
export async function geminiExplainFull(scores: Record<string, any>, answers: Record<string, any>) {
    const prompt = `
  The user has completed a 20-question career questionnaire.

  Scores:
  ${JSON.stringify(scores, null, 2)}

  Answers:
  ${JSON.stringify(answers, null, 2)}

  Task:
  1. Suggest exactly 3 career paths that match their profile.
  2. For each path, provide:
    - "role": The role name (string)
    - "why_it_fits": 2-3 sentences on why this role matches
    - "how_to_prepare": 2-3 bullet points with concrete preparation steps
  3. Return strictly JSON in this schema:
  {
    "scores": { "analytical": number, "creative": number, /* ...etc */ },
    "roles": [
      {
        "role": "string",
        "why_it_fits": "string",
        "how_to_prepare": ["point1", "point2", "point3"]
      }
    ]
  }`;

    const { text } = await generateWithFlash(prompt);
    try {
      const clean = cleanJSONResponse(text);
      const parsed = JSON.parse(clean);
      return {
        scores: parsed.scores ?? scores,
        roles: parsed.roles ?? [],
      };
    } catch {
      console.error("Failed to parse full analysis JSON:", text);
      return { scores, roles: [] };
    }
}
// --- MODIFICATION END ---


// ---------- Gemini Generate Roadmap (For selected role) ----------
export async function geminiGenerateRoadmap(scores: Record<string, any>, answers: Record<string, any>, selectedRole: string) {
    const prompt = `
    A user has completed a career questionnaire and selected their desired career path.
    Selected Career Path: ${selectedRole}
    User's Scores: ${JSON.stringify(scores, null, 2)}
    User's Answers: ${JSON.stringify(answers, null, 2)}

    Task:
    Generate a detailed, personalized career roadmap. Return a JSON object with this structure:
    {
      "introduction": "Brief, encouraging intro.",
      "timeline_steps": [
        { 
          "duration": "Months 0-3: Foundation", 
          "title": "Build Core Skills",
          "description": "Focus on the fundamentals to create a strong base.",
          "details": [
            { "category": "Skills to Learn", "items": ["Skill 1", "Skill 2"] },
            { "category": "Projects to Build", "items": ["Simple project idea"] },
            { "category": "Key Actions", "items": ["Action 1", "Action 2"] }
          ]
        },
        { 
          "duration": "Months 4-6: Application", 
          "title": "Apply Your Knowledge",
          "description": "Move from theory to practice by building tangible things.",
          "details": [
            { "category": "Skills to Master", "items": ["Advanced Skill 1"] },
            { "category": "Projects to Build", "items": ["Intermediate project idea"] },
            { "category": "Key Actions", "items": ["Action 1", "Action 2"] }
          ]
        }
      ],
      "final_advice": "A concluding motivational tip."
    }
    Ensure the response is strictly in the specified JSON format and provides at least 3-4 and more timeline steps.`;
    
    const { text } = await generateWithFlash(prompt);
    try {
        const clean = cleanJSONResponse(text);
        return JSON.parse(clean);
    } catch {
        console.error("Failed to parse roadmap JSON:", text);
        return null;
    }
}