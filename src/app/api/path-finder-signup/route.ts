import { NextRequest, NextResponse } from "next/server";
import { scoreAnswers, geminiExplainRoles } from "@/ai/flows/path-finder";

export async function POST(req: NextRequest) {
  try {
    const { answers } = await req.json();
    if (!answers) {
      return NextResponse.json({ error: "Missing answers" }, { status: 400 });
    }

    // derive scores
    const scores = scoreAnswers(answers);

    // ask Gemini for top 3 roles
    const roles = await geminiExplainRoles(scores, answers);

    return NextResponse.json({ roles });
  } catch (err: any) {
    console.error("❌ API error in /api/path-finder-signup:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
