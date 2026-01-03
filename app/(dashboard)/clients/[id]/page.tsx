// app/(dashboard)/clients/[id]/page.tsx
import { getClient } from "@/app/actions/clients";
import { getProjectsByClient } from "@/app/actions/projects";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Add, Edit } from "@mui/icons-material";
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
  params: Promise<{ id: string }>;
}) {
  // Await params (Next.js 15+)
  const { id } = await params;
  const client = await getClient(id);
  const projects = await getProjectsByClient(id);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{client.name}</h1>
          <p className="text-sm text-slate-600 mt-1">
            BTW Profiel: {client.btw_profile.label} ({client.btw_profile.percentage}%)
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/clients/${id}/edit`}>
            <Button variant="outline">
              <Edit />
              Bewerken
            </Button>
          </Link>
          <Link href={`/projects/new?client_id=${id}`}>
            <Button>
              <Add />
              Nieuw Project
            </Button>
          </Link>
        </div>
      </div>

      {/* Content Card */}
      <Card>
        <CardHeader className="p-4">
          <CardTitle className="text-lg font-medium text-slate-900">Projecten</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          {projects.length === 0 ? (
            <p className="text-sm text-slate-600">
              Nog geen projecten voor deze klant
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Naam</TableHead>
                  <TableHead className="text-right">Tarief (ex BTW)</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Afronding</TableHead>
                  <TableHead>Acties</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell className="text-sm text-slate-900">
                      <Link href={`/projects/${project.id}`} className="hover:text-indigo-600">
                        {project.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm text-slate-900 text-right">
                      {project.rate_ex_btw
                        ? `€${project.rate_ex_btw.toFixed(2)}`
                        : "-"}
                    </TableCell>
                    <TableCell className="text-sm text-slate-900">{project.default_unit}</TableCell>
                    <TableCell className="text-sm text-slate-900">{project.rounding_rule}</TableCell>
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
