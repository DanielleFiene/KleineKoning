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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{client.name}</h1>
          <p className="text-muted-foreground">
            BTW Profiel: {client.btw_profile.label} ({client.btw_profile.percentage}%)
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/clients/${params.id}/edit`}>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Bewerken
            </Button>
          </Link>
          <Link href={`/projects/new?client_id=${params.id}`}>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
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
            <p className="text-center text-muted-foreground py-8">
              Nog geen projecten voor deze klant
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Naam</TableHead>
                  <TableHead>Tarief (ex BTW)</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Afronding</TableHead>
                  <TableHead className="text-right">Acties</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/projects/${project.id}`}
                        className="hover:underline"
                      >
                        {project.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {project.rate_ex_btw
                        ? `€${project.rate_ex_btw.toFixed(2)}`
                        : "-"}
                    </TableCell>
                    <TableCell>{project.default_unit}</TableCell>
                    <TableCell>{project.rounding_rule}</TableCell>
                    <TableCell className="text-right">
                      <Link href={`/projects/${project.id}/edit`}>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

