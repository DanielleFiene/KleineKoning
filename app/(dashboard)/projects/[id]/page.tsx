// app/(dashboard)/projects/[id]/page.tsx
import { getProject } from "@/app/actions/projects";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
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
    <div>
      <div>
        <div>
          <h1>{project.name}</h1>
          <p>
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

      <Card>
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <p>Tarief (ex BTW)</p>
            <p>
              {project.rate_ex_btw ? `€${project.rate_ex_btw.toFixed(2)}` : "Niet ingesteld"}
            </p>
          </div>
          <div>
            <p>Standaard Unit</p>
            <p>{project.default_unit}</p>
          </div>
          <div>
            <p>Afrondingsregel</p>
            <p>{project.rounding_rule}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
