import { getProjects } from "@/app/actions/projects";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Projecten</h1>
        <p className="text-muted-foreground">
          Beheer projecten per klant met tarieven en afrondingsregels
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Alle Projecten</CardTitle>
          <CardDescription>
            Overzicht van alle projecten
          </CardDescription>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nog geen projecten toegevoegd
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Naam</TableHead>
                  <TableHead>Klant</TableHead>
                  <TableHead>Tarief (ex BTW)</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Afronding</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project: any) => (
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
                      {project.clients?.name || "-"}
                    </TableCell>
                    <TableCell>
                      {project.rate_ex_btw
                        ? `€${project.rate_ex_btw.toFixed(2)}`
                        : "-"}
                    </TableCell>
                    <TableCell>{project.default_unit}</TableCell>
                    <TableCell>{project.rounding_rule}</TableCell>
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
