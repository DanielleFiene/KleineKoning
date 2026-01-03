// app/(dashboard)/projects/[id]/page.tsx
import { getProject } from "@/app/actions/projects";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import Link from "next/link";

export default async function ProjectDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const project = await getProject(params.id);

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{project.name}</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Klant: {(project as any).clients?.name || "-"}
          </p>
        </div>
        <Link href={`/projects/${params.id}/edit`} className="w-full sm:w-auto">
          <Button variant="outline" className="w-full sm:w-auto">
            <Edit className="h-4 w-4 mr-2" />
            Bewerken
          </Button>
        </Link>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 md:space-y-6">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Tarief (ex BTW)</p>
            <p className="text-lg font-semibold">
              {project.rate_ex_btw ? `€${project.rate_ex_btw.toFixed(2)}` : "Niet ingesteld"}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Standaard Unit</p>
            <p className="text-lg font-semibold">{project.default_unit}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Afrondingsregel</p>
            <p className="text-lg font-semibold">{project.rounding_rule}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

