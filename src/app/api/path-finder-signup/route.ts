import { NextRequest, NextResponse } from "next/server";
// --- MODIFICATION START ---
// The scoreAnswers function is no longer needed here.
import { geminiExplainRoles } from "@/ai/flows/path-finder";
// --- MODIFICATION END ---

export async function POST(req: NextRequest) {
  try {
    const { answers } = await req.json();
    if (!answers) {
      return NextResponse.json({ error: "Missing answers" }, { status: 400 });
    }

    // --- MODIFICATION START ---
    // Removed the incorrect scoring step. We now pass the raw answers directly.
    const roles = await geminiExplainRoles(answers);
    // --- MODIFICATION END ---

    return NextResponse.json({ roles });
  } catch (err: any) {
    console.error("❌ API error in /api/path-finder-signup:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}