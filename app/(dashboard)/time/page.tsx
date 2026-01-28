/**
 * app/(dashboard)/time/page.tsx
 * 
 * Time entries dashboard pagina. Server component die alleen de client component rendert.
 * Geen server actions, MUI imports, of Supabase server client om bundle size te verkleinen.
 */
import dynamic from "next/dynamic";

const TimePageClient = dynamic(() => import("./TimePageClient"));

export default function TimePage() {
  return <TimePageClient />;
}