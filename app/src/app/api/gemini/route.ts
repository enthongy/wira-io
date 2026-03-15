import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Branch: BNM SAR Report generation
    if (body.sarPrompt) {
      const sarResponse = await fetch(GEMINI_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: body.sarPrompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 500 },
        }),
      });
      const sarData = await sarResponse.json();
      const sarText = sarData.candidates?.[0]?.content?.parts?.[0]?.text ?? "SAR generation failed.";
      return NextResponse.json({ sarText });
    }

    const { transaction, riskThreshold = 65 } = body;

    const aggressionNote = riskThreshold > 75
      ? "SECURITY FIRST mode: be more aggressive — flag borderline cases as FLAGGED, elevate scores by 10-15 points."
      : riskThreshold < 50
        ? "CUSTOMER FIRST mode: be conservative — only flag clearly fraudulent activity, lower scores by 5-10 points."
        : "BALANCED mode: standard risk assessment.";

    const prompt = `You are a multi-agent AI fraud detection swarm for a Malaysian bank (CIMB / BNM regulated). 
AI Aggression Setting: ${aggressionNote}
Analyze this transaction and respond ONLY with a valid JSON object (no markdown, no explanation outside JSON).

Transaction:
- Amount: RM ${transaction.amount}
- Merchant Category: ${transaction.merchant_category}
- Location Mismatch: ${transaction.location_mismatch}
- Transaction Hour: ${transaction.transaction_hour}:00
- Transaction ID: ${transaction.transaction_id}

You must simulate a 4-agent negotiation between:
- SENTINEL (security analyst): structural anomalies (geo-mismatch, velocity, card pattern)
- ORACLE (behavioral analyst): cross-references historical baseline
- WIRA-LOCAL (local context): Malaysian context, DuitNow patterns, festive calendar
- COMPLIANCE (AML/sanctions): checks if merchant category appears on mock global sanctions or AML watchlist patterns
- SYSTEM: final recommendation synthesis

Each agent produces a short reasoning statement in natural Fintech language (1-2 sentences, professional).

Respond with EXACTLY this JSON structure:
{
  "dialogue": [
    { "agent": "SENTINEL", "message": "<short fraud signal analysis>" },
    { "agent": "ORACLE", "message": "<behavioral pattern analysis>" },
    { "agent": "WIRA-LOCAL", "message": "<local Malaysian context check>" },
    { "agent": "COMPLIANCE", "message": "<AML/sanctions check: is this merchant category typical for money laundering? e.g. Jewellery, Electronics, FX are higher AML risk>" },
    { "agent": "SYSTEM", "message": "<final recommendation and reason>" }
  ],
  "final_risk_score": <integer 1-100>,
  "verdict": "<CRITICAL|FLAGGED|CLEAN>"
}

Risk scoring guide: 
- CLEAN = score 1-30 (normal transaction)
- FLAGGED = score 31-65 (suspicious, review needed)  
- CRITICAL = score 66-100 (high confidence fraud)

Consider: high-value late-night transactions (00-05h) are riskier. Electronics/Jewelry/FX categories are higher risk for AML. Location mismatch = +30 risk. Jewellery/Electronics purchases > RM 1500 = potential structuring.`;

    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 600,
        },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Gemini API error: ${err}`);
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    // Extract JSON from the response (in case Gemini adds extra text)
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in Gemini response");

    const result = JSON.parse(jsonMatch[0]);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Gemini route error:", error.message);
    // Graceful fallback if API fails
    return NextResponse.json({
      dialogue: [
        { agent: "SENTINEL", message: "Transaction velocity and location data suggest elevated risk. Manual review recommended." },
        { agent: "ORACLE", message: "Behavioral patterns diverge from historical baseline. Risk score elevated." },
        { agent: "WIRA-LOCAL", message: "Local transaction context cross-referenced. DuitNow history shows no matching pattern." },
        { agent: "SYSTEM", message: "Recommendation: Flag for Tier 2 analysis. Insufficient data for autonomous resolution." },
      ],
      final_risk_score: 72,
      verdict: "CRITICAL",
      _fallback: true,
    });
  }
}
