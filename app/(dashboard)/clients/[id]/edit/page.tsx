import { getClient } from "@/app/actions/clients";
import { ClientForm } from "@/components/client-form";

export default async function EditClientPage({
  params,
}: {
  params: { id: string };
}) {
  const client = await getClient(params.id);

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Klant bewerken</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Wijzig de gegevens van deze klant
        </p>
      </div>
      <ClientForm client={client} />
    </div>
  );
}

