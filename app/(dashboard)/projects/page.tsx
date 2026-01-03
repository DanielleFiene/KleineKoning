// app/(dashboard)/projects/page.tsx
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
    <div className="space-y-4 md:space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Projecten</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Beheer projecten per klant met tarieven en afrondingsregels
        </p>
      </div>

      <Card className="shadow-sm">
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
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Naam</TableHead>
                    <TableHead className="hidden sm:table-cell">Klant</TableHead>
                    <TableHead className="hidden md:table-cell">Tarief (ex BTW)</TableHead>
                    <TableHead className="hidden lg:table-cell">Unit</TableHead>
                    <TableHead className="hidden lg:table-cell">Afronding</TableHead>
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
                        <div className="text-xs text-muted-foreground sm:hidden mt-1">
                          {project.clients?.name || "-"}
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {project.clients?.name || "-"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {project.rate_ex_btw
                          ? `€${project.rate_ex_btw.toFixed(2)}`
                          : "-"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">{project.default_unit}</TableCell>
                      <TableCell className="hidden lg:table-cell">{project.rounding_rule}</TableCell>
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
