import { getClient } from "@/app/actions/clients";
import { ClientForm } from "@/components/client-form";

export default async function EditClientPage({
  params,
}: {
  params: { id: string };
}) {
  const client = await getClient(params.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Klant bewerken</h1>
        <p className="text-muted-foreground">
          Wijzig de gegevens van deze klant
        </p>
      </div>
      <ClientForm client={client} />
    </div>
  );
}

