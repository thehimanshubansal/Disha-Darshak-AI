// src/ai/flows/path-finder.ts

import { generateWithFlash } from "@/ai/genkit";
import { FIELDS_OF_INTEREST } from "@/lib/fields-of-interest";

const LIKERT_MAP: Record<string, number> = {
  strongly_disagree: 1,
  disagree: 2,
  neutral: 3,
  agree: 4,
  strongly_agree: 5,
};

function cleanJSONResponse(text: string): string {
  return text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
}

export function scoreAnswers(answers: Record<string, any>) {
  const getAns = (qid: string): string => {
    const val = answers[qid];
    if (typeof val === "object" && val?.answer) return val.answer;
    return String(val ?? "neutral");
  };

  const l = (qid: string) => LIKERT_MAP[getAns(qid)] ?? 3;

  const analytical = (l("q9") + l("q16")) / 2;
  const creative = (l("q10") + l("q17")) / 2;
  const teamwork = l("q13");
  const independence = 6 - l("q13");
  const stability = l("q12");

  return {
    analytical,
    creative,
    teamwork,
    independent: independence,
    stability,
    travel: getAns("q14"),
    education: getAns("q6"),
    specialization: getAns("q7"),
    industry_interest: getAns("q15"),
    goal: getAns("q19"),
    constraint: getAns("q20"),
  };
}

// ---------- Gemini Explain Roles (For Signup) ----------
// Updated to handle short questionnaire (q1-q6) without scores
export async function geminiExplainRoles(answers: Record<string, any>) {
  const allSubFields = Object.values(FIELDS_OF_INTEREST).flatMap(cat => cat.subFields);

  const prompt = `
You are an expert career counselor AI. Your task is to analyze a user's answers to a short signup questionnaire (questions q1 to q6) and suggest the top 3 most suitable career fields from the available list. Base your suggestions STRICTLY on the answers provided—do not default to generic or top-listed fields without clear matches. Suggest only fields from the available list.

**USER'S ANSWERS:**
${JSON.stringify(answers, null, 2)}

**AVAILABLE CAREER FIELDS:**
[${allSubFields.join(', ')}]

**QUESTIONNAIRE DETAILS (for reference in your analysis):**
- q1: Highest education level (e.g., "high_school", "bachelors").
- q2: Field of study or major (e.g., "Computer Science").
- q3: Current situation (e.g., "student", "working").
- q4: Top skills (array, e.g., ["Technical/Programming", "Analytical/Data"]).
- q5: Interested industries (e.g., "Tech, Healthcare").
- q6: Ideal job description (free text, e.g., "A role involving data analysis and innovation").

**INSTRUCTIONS:**
1. **Step-by-Step Analysis (Chain of Thought):**
   - Education & Background: Summarize q1, q2, q3. How does their education level, field of study, and current situation influence field fits? (E.g., a "bachelors" in "Computer Science" as a "recent_grad" points to fields like "Software Development" or "Data Science & Analytics").
   - Skills: From q4, identify key strengths. Match to fields (e.g., "Technical/Programming" and "Analytical/Data" strongly suggest "Data Science & Analytics" or "AI & Machine Learning").
   - Interests: From q5, note industries and map to fields (e.g., "Tech" -> "Software Development", "Finance" -> "Financial Analysis").
   - Preferences: From q6, extract job ideals (e.g., "innovative tech role" -> "AI & Machine Learning").
   - Overall Matching: Cross-reference all answers to select the top 3 fields from the available list. Prioritize strong alignments—do NOT pick unrelated or default fields like the first ones in the list. If no strong match, choose the closest based on partial evidence.

2. If answers are vague or incomplete, still attempt to match based on what's provided, but note limitations in your reasoning.

3. Your entire response must be ONLY a JSON object in this exact format:
   {
     "reasoning": "Your step-by-step analysis here (3-5 sentences).",
     "fields": ["Best Match Field 1", "Best Match Field 2", "Best Match Field 3"]
   }

Do not suggest categories, specific jobs, or fields outside the available list.
`;

  const { text } = await generateWithFlash(prompt);
  try {
    const clean = cleanJSONResponse(text);
    const parsed = JSON.parse(clean);
    console.log("AI Reasoning for Signup Suggestions:", parsed.reasoning);
    return Array.isArray(parsed.fields) ? parsed.fields : [];
  } catch {
    console.error("Failed to parse fields JSON:", text);
    return [];
  }
}

// ---------- Gemini Explain Full (For detailed skill assessment) ----------
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

// ---------- Gemini Generate Roadmap (For selected role) ----------
export async function geminiGenerateRoadmap(scores: Record<string, any>, answers: Record<string, any>, selectedRole: string) {
  const prompt = `
A user has completed a career questionnaire and selected their desired career path.
Selected Career Path: ${selectedRole}
User's Scores: ${JSON.stringify(scores, null, 2)}
User's Answers: ${JSON.stringify(answers, null, 2)}

Task:
Generate a detailed, personalized career roadmap for the user. Return a JSON object with this structure:
{
  "introduction": "Brief, encouraging intro.",
  "key_skills_to_develop": [{ "skill": "Skill Name", "importance": "Why it's crucial." }],
  "learning_resources": [{ "type": "Online Courses", "recommendations": ["Course 1"] }],
  "project_ideas": ["Beginner project", "Intermediate project", "Advanced project"],
  "timeline_steps": [{ "duration": "Months 0-3", "action_items": ["Action 1"] }],
  "final_advice": "A concluding motivational tip."
}
Ensure the response is strictly in the specified JSON format.`;
  
  const { text } = await generateWithFlash(prompt);
  try {
      const clean = cleanJSONResponse(text);
      return JSON.parse(clean);
  } catch {
      console.error("Failed to parse roadmap JSON:", text);
      return null;
  }
}