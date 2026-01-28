/**
 * app/(dashboard)/exports/page.tsx
 * 
 * Exports dashboard pagina. Server component die alleen de client component rendert.
 * Geen server actions, MUI imports, of Supabase server client om bundle size te verkleinen.
 */
import dynamic from "next/dynamic";

const ExportsPageClient = dynamic(() => import("./ExportsPageClient"));

export default function ExportsPage() {
  return <ExportsPageClient />;
}
