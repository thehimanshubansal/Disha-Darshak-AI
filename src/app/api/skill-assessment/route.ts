import { NextRequest, NextResponse } from "next/server";
import { scoreAnswers, geminiExplainFull } from "@/ai/flows/path-finder";

export async function POST(req: NextRequest) {
  try {
    const { answers } = await req.json();
    if (!answers) {
      return NextResponse.json({ error: "Missing answers" }, { status: 400 });
    }

    const scores = scoreAnswers(answers);
    const analysis = await geminiExplainFull(scores, answers);

    return NextResponse.json(analysis);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
