// app/(dashboard)/clients/[id]/page.tsx
import { getClient } from "@/app/actions/clients";
import { getProjectsByClient } from "@/app/actions/projects";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit } from "lucide-react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function ClientDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const client = await getClient(params.id);
  const projects = await getProjectsByClient(params.id);

  return (
    <div>
      <div>
        <div>
          <h1>{client.name}</h1>
          <p>
            BTW Profiel: {client.btw_profile.label} ({client.btw_profile.percentage}%)
          </p>
        </div>
        <div>
          <Link href={`/clients/${params.id}/edit`}>
            <Button variant="outline">
              <Edit />
              Bewerken
            </Button>
          </Link>
          <Link href={`/projects/new?client_id=${params.id}`}>
            <Button>
              <Plus />
              Nieuw Project
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Projecten</CardTitle>
          <CardDescription>
            Alle projecten voor deze klant
          </CardDescription>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <p>
              Nog geen projecten voor deze klant
            </p>
          ) : (
            <div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Naam</TableHead>
                    <TableHead>Tarief (ex BTW)</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Afronding</TableHead>
                    <TableHead>Acties</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell>
                        <Link href={`/projects/${project.id}`}>
                          {project.name}
                        </Link>
                        <div>
                          {project.rate_ex_btw
                            ? `€${project.rate_ex_btw.toFixed(2)}`
                            : "-"} • {project.default_unit} • {project.rounding_rule}
                        </div>
                      </TableCell>
                      <TableCell>
                        {project.rate_ex_btw
                          ? `€${project.rate_ex_btw.toFixed(2)}`
                          : "-"}
                      </TableCell>
                      <TableCell>{project.default_unit}</TableCell>
                      <TableCell>{project.rounding_rule}</TableCell>
                      <TableCell>
                        <Link href={`/projects/${project.id}/edit`}>
                          <Button variant="ghost" size="sm">
                            <Edit />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
