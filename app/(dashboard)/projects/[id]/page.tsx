// app/(dashboard)/projects/[id]/page.tsx
import { getProject } from "@/app/actions/projects";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit } from "@mui/icons-material";
import Link from "next/link";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Await params (Next.js 15+)
  const { id } = await params;
  const project = await getProject(id);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{project.name}</h1>
          <p className="text-sm text-slate-600 mt-1">
            Klant: {(project as any).clients?.name || "-"}
          </p>
        </div>
        <Link href={`/projects/${id}/edit`}>
          <Button variant="outline">
            <Edit />
            Bewerken
          </Button>
        </Link>
      </div>

      {/* Content Card */}
      <Card>
        <CardHeader className="p-4">
          <CardTitle className="text-lg font-medium text-slate-900">Project Details</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-slate-600 mb-1">Tarief (ex BTW)</p>
              <p className="text-sm text-slate-900">
                {project.rate_ex_btw ? `€${project.rate_ex_btw.toFixed(2)}` : "Niet ingesteld"}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-1">Standaard Unit</p>
              <p className="text-sm text-slate-900">{project.default_unit}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-1">Afrondingsregel</p>
              <p className="text-sm text-slate-900">{project.rounding_rule}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
