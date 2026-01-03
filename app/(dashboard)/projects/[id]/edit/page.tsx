import { getProject, getProjects } from "@/app/actions/projects";
import { getClients } from "@/app/actions/clients";
import { ProjectForm } from "@/components/project-form";

export default async function EditProjectPage({
  params,
}: {
  params: { id: string };
}) {
  const project = await getProject(params.id);
  const clients = await getClients();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Project bewerken</h1>
        <p className="text-muted-foreground">
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

