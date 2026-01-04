/**
 * app/api/statements/route.ts
 * 
 * API route voor het ophalen van alle statements voor de ingelogde gebruiker.
 * Retourneert JSON array van statements met client informatie. Edge Runtime compatible.
 */
import { getStatements } from "@/app/actions/statements";
import { NextResponse } from "next/server";

export const runtime = 'edge';

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

