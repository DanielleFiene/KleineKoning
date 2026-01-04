/**
 * app/(dashboard)/projects/page.tsx
 * 
 * Projects dashboard pagina. Server component die data ophaalt en doorgeeft aan
 * Client component. Geen MUI imports hier om bundle size te verkleinen.
 */
import { getProjectsWithStats } from "@/app/actions/projects";
import { getClients } from "@/app/actions/clients";
import ProjectsPageClient from "./ProjectsPageClient";

export const runtime = 'edge';

export default async function ProjectsPage() {
  const projects = await getProjectsWithStats();
  const clients = await getClients();

  return <ProjectsPageClient projects={projects} clients={clients} />;
}
