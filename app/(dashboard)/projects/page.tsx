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
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Projecten</h1>
        </div>
      </div>

      {/* Content Card */}
      <Card>
        <CardHeader className="p-4">
          <CardTitle className="text-lg font-medium text-slate-900">Alle Projecten</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          {projects.length === 0 ? (
            <p className="text-sm text-slate-600">
              Nog geen projecten toegevoegd
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="bg-slate-100">Naam</TableHead>
                  <TableHead className="bg-slate-100">Klant</TableHead>
                  <TableHead className="bg-slate-100 text-right">Tarief (ex BTW)</TableHead>
                  <TableHead className="bg-slate-100">Unit</TableHead>
                  <TableHead className="bg-slate-100">Afronding</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project: any) => (
                  <TableRow key={project.id}>
                    <TableCell className="text-sm text-slate-900">
                      <Link href={`/projects/${project.id}`} className="hover:text-indigo-600">
                        {project.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm text-slate-900">
                      {project.clients?.name || "-"}
                    </TableCell>
                    <TableCell className="text-sm text-slate-900 text-right">
                      {project.rate_ex_btw
                        ? `€${project.rate_ex_btw.toFixed(2)}`
                        : "-"}
                    </TableCell>
                    <TableCell className="text-sm text-slate-900">{project.default_unit}</TableCell>
                    <TableCell className="text-sm text-slate-900">{project.rounding_rule}</TableCell>
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
