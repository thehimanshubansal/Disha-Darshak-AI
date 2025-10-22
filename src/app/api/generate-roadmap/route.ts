// src/app/api/generate-roadmap/route.ts

import { NextRequest, NextResponse } from "next/server";
import { scoreAnswers, geminiGenerateRoadmap } from "@/ai/flows/path-finder";

export async function POST(req: NextRequest) {
  try {
    const { answers, selectedRole } = await req.json();
    if (!answers || !selectedRole) {
      return NextResponse.json({ error: "Missing answers or selected role" }, { status: 400 });
    }

    const scores = scoreAnswers(answers);
    const roadmap = await geminiGenerateRoadmap(scores, answers, selectedRole);

    // Combine all data to be saved in the database
    const finalAnalysis = {
        scores,
        chosenRole: selectedRole,
        roadmap,
    };

    return NextResponse.json(finalAnalysis);
  } catch (err: any) {
    console.error("❌ API error in /api/generate-roadmap:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}