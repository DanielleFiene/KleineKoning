import { getClients } from "@/app/actions/clients";
import { ProjectForm } from "@/components/project-form";

export default async function NewProjectPage({
  searchParams,
}: {
  searchParams: { client_id?: string };
}) {
  const clients = await getClients();

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Nieuw Project</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Voeg een nieuw project toe aan een klant
        </p>
      </div>
      <ProjectForm clients={clients} defaultClientId={searchParams.client_id} />
    </div>
  );
}

