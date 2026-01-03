// app/(dashboard)/projects/new/page.tsx
import { getClients } from "@/app/actions/clients";
import { ProjectForm } from "@/components/project-form";

export default async function NewProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ client_id?: string }>;
}) {
  // Await searchParams (Next.js 15+)
  const params = await searchParams;
  const clients = await getClients();

  return (
    <div>
      <div>
        <h1>Nieuw Project</h1>
        <p>
          Voeg een nieuw project toe aan een klant
        </p>
      </div>
      <ProjectForm clients={clients} defaultClientId={params.client_id} />
    </div>
  );
}
