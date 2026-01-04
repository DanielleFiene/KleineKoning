// app/(dashboard)/exports/page.tsx
import { getClients } from "@/app/actions/clients";
import { getStatements } from "@/app/actions/statements";
import { ExportsView } from "@/components/exports-view";

export const runtime = 'edge';

export default async function ExportsPage() {
  const clients = await getClients();
  const statements = await getStatements();

  return <ExportsView clients={clients} initialStatements={statements} />;
}
