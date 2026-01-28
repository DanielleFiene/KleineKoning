/**
 * app/(dashboard)/revenue/page.tsx
 * 
 * Revenue overzicht pagina. Server component die alleen de client component rendert.
 * Geen server actions, MUI imports, of Supabase server client om bundle size te verkleinen
 * en Edge Runtime compatibiliteit te behouden.
 */
import dynamic from "next/dynamic";

const RevenuePageClient = dynamic(() => import("./RevenuePageClient"));

export const runtime = 'edge';

export default function RevenuePage() {
  return <RevenuePageClient />;
}
