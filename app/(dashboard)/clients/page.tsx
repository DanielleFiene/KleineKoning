/**
 * app/(dashboard)/clients/page.tsx
 * 
 * Clients dashboard pagina. Server component die alleen de client component rendert.
 * Geen server actions, MUI imports, of Supabase server client om bundle size te verkleinen.
 */
import ClientsPageClient from "./ClientsPageClient";

export default function ClientsPage() {
  return <ClientsPageClient />;
}
