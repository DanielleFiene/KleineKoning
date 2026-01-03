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
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Nieuw Project</h1>
        </div>
      </div>

      {/* Content Card */}
      <ProjectForm clients={clients} defaultClientId={params.client_id} />
    </div>
  );
}
