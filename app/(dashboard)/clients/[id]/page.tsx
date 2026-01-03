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
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{client.name}</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            BTW Profiel: {client.btw_profile.label} ({client.btw_profile.percentage}%)
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Link href={`/clients/${params.id}/edit`} className="w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto">
              <Edit className="h-4 w-4 mr-2" />
              Bewerken
            </Button>
          </Link>
          <Link href={`/projects/new?client_id=${params.id}`} className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Nieuw Project
            </Button>
          </Link>
        </div>
      </div>

      <Card className="shadow-sm">
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
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Naam</TableHead>
                    <TableHead className="hidden md:table-cell">Tarief (ex BTW)</TableHead>
                    <TableHead className="hidden lg:table-cell">Unit</TableHead>
                    <TableHead className="hidden lg:table-cell">Afronding</TableHead>
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
                        <div className="text-xs text-muted-foreground md:hidden mt-1">
                          {project.rate_ex_btw
                            ? `€${project.rate_ex_btw.toFixed(2)}`
                            : "-"} • {project.default_unit} • {project.rounding_rule}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {project.rate_ex_btw
                          ? `€${project.rate_ex_btw.toFixed(2)}`
                          : "-"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">{project.default_unit}</TableCell>
                      <TableCell className="hidden lg:table-cell">{project.rounding_rule}</TableCell>
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

