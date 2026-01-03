// app/(dashboard)/projects/new/page.tsx
import { getClients } from "@/app/actions/clients";
import { ProjectForm } from "@/components/project-form";

export default async function NewProjectPage({
  searchParams,
}: {
  searchParams: { client_id?: string };
}) {
  const clients = await getClients();

  return (
    <div>
      <div>
        <h1>Nieuw Project</h1>
        <p>
          Voeg een nieuw project toe aan een klant
        </p>
      </div>
      <ProjectForm clients={clients} defaultClientId={searchParams.client_id} />
    </div>
  );
}
