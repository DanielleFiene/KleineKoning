// app/(dashboard)/clients/[id]/edit/page.tsx
import { getClient } from "@/app/actions/clients";
import { ClientForm } from "@/components/client-form";

export default async function EditClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Await params (Next.js 15+)
  const { id } = await params;
  const client = await getClient(id);

  return (
    <div>
      <div>
        <h1>Klant bewerken</h1>
        <p>
          Wijzig de gegevens van deze klant
        </p>
      </div>
      <ClientForm client={client} />
    </div>
  );
}
