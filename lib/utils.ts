/**
 * lib/utils.ts
 * 
 * Utility functie voor het mergen van CSS classnames. Combineert clsx en tailwind-merge
 * voor intelligente classname merging met Tailwind CSS conflict resolution.
 */
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Vertaal unit waarde naar Nederlands
 */
export function formatUnit(unit: string): string {
  const unitMap: Record<string, string> = {
    minutes: "Minuten",
    quarter: "Kwartier",
    hour: "Uur",
    day: "Dag",
  };
  return unitMap[unit] || unit;
}
