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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{project.name}</h1>
          <p className="text-muted-foreground">
            Klant: {(project as any).clients?.name || "-"}
          </p>
        </div>
        <Link href={`/projects/${params.id}/edit`}>
          <Button variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Bewerken
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Tarief (ex BTW)</p>
            <p className="text-lg">
              {project.rate_ex_btw ? `€${project.rate_ex_btw.toFixed(2)}` : "Niet ingesteld"}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Standaard Unit</p>
            <p className="text-lg">{project.default_unit}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Afrondingsregel</p>
            <p className="text-lg">{project.rounding_rule}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

