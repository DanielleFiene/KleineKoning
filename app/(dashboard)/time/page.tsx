/**
 * app/(dashboard)/time/page.tsx
 * 
 * Time entries dashboard pagina. Server component die alleen de client component rendert.
 * Geen server actions, MUI imports, of Supabase server client om bundle size te verkleinen.
 */
import TimePageClient from "./TimePageClient";

export default function TimePage() {
  return <TimePageClient />;
}