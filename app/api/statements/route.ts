// app/api/statements/route.ts
import { getStatements } from "@/app/actions/statements";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const statements = await getStatements();
    return NextResponse.json(statements);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

