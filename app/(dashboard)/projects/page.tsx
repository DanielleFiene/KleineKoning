/**
 * app/(dashboard)/projects/page.tsx
 * 
 * Projects dashboard pagina. Server component die alleen de client component rendert.
 * Geen server actions, MUI imports, of Supabase server client om bundle size te verkleinen.
 */
import ProjectsPageClient from "./ProjectsPageClient";

export default function ProjectsPage() {
  return <ProjectsPageClient />;
}
