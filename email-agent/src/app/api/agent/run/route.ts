import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { agentRequestSchema } from "@/lib/schemas";
import { runMailboxAutomation } from "@/lib/server/emailAgent";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const parsed = agentRequestSchema.parse(payload);
    const summary = await runMailboxAutomation(parsed);
    return NextResponse.json({ summary });
  } catch (error) {
    console.error("Agent automation error", error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          message: "Validation failed",
          errors: error.issues,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Unexpected server error",
      },
      { status: 500 },
    );
  }
}
