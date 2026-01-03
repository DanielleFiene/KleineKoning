// app/(dashboard)/projects/[id]/edit/page.tsx
import { getProject, getProjects } from "@/app/actions/projects";
import { getClients } from "@/app/actions/clients";
import { ProjectForm } from "@/components/project-form";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Await params (Next.js 15+)
  const { id } = await params;
  const project = await getProject(id);
  const clients = await getClients();

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Project bewerken</h1>
        </div>
      </div>

      {/* Content Card */}
      <ProjectForm
        clients={clients}
        project={{
          id: project.id,
          client_id: project.client_id,
          name: project.name,
          rate_ex_btw: project.rate_ex_btw,
          default_unit: project.default_unit,
          rounding_rule: project.rounding_rule,
        }}
      />
    </div>
  );
}
