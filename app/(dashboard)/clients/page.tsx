/**
 * app/(dashboard)/clients/page.tsx
 * 
 * Clients dashboard pagina. Server component die data ophaalt en doorgeeft aan
 * Client component. Geen MUI imports hier om bundle size te verkleinen.
 */
import { getClientsWithStats } from "@/app/actions/clients";
import ClientsPageClient from "./ClientsPageClient";

export const runtime = 'edge';

export default async function ClientsPage() {
  const clients = await getClientsWithStats();

  return <ClientsPageClient clients={clients} />;
}
