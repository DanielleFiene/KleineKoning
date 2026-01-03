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
    <div>
      <div>
        <h1>Project bewerken</h1>
        <p>
          Wijzig de instellingen van dit project
        </p>
      </div>
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
