/**
 * app/(dashboard)/clients/[id]/page.tsx
 * 
 * Client detail pagina. Toont klantgegevens en alle bijbehorende projecten.
 * Server component met Edge Runtime support.
 */
import { getClient } from "@/app/actions/clients";
import { getProjectsByClient } from "@/app/actions/projects";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import IconButton from "@mui/material/IconButton";
import { Plus, Edit } from "lucide-react";
import Link from "next/link";
import { InfoIcon } from "@/components/info-icon";
import { formatUnit } from "@/lib/utils";

export const runtime = 'edge';

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
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3 } }}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {/* Page Header */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <Box>
            <Typography
              variant="h4"
              component="h1"
              sx={{
                fontWeight: "bold",
                background: "linear-gradient(90deg, #6366f1 0%, #9333ea 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {client.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              BTW Profiel: {client.btw_profile.label} ({client.btw_profile.percentage}%)
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 2 }}>
            <Link href={`/clients/${id}/edit`} style={{ textDecoration: "none" }}>
              <Button variant="outlined" startIcon={<Edit size={18} />}>
                Bewerken
              </Button>
            </Link>
            <Link href={`/projects/new?client_id=${id}`} style={{ textDecoration: "none" }}>
              <Button variant="contained" startIcon={<Plus size={18} />}>
                Nieuw Project
              </Button>
            </Link>
          </Box>
        </Box>

        {/* Client Tarief Card */}
        {client.rate_ex_btw && (
          <Paper elevation={1} sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Klant Tarief
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">
                    Tarief (netto)
                  </Typography>
                  <InfoIcon title="Netto = exclusief BTW. Dit is het tarief zonder BTW." size="small" />
                </Box>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  €{client.rate_ex_btw.toFixed(2)}
                </Typography>
              </Box>
              {client.btw_profile.percentage > 0 && (
                <Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
                    <Typography variant="body2" color="text.secondary">
                      Tarief (bruto)
                    </Typography>
                    <InfoIcon title="Bruto = inclusief BTW. Dit is het tarief met BTW erbij." size="small" />
                  </Box>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    €{(client.rate_ex_btw * (1 + client.btw_profile.percentage / 100)).toFixed(2)}
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        )}

        {/* Content Card */}
        <Paper elevation={1} sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
            Projecten
          </Typography>
          {projects.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Nog geen projecten voor deze klant
            </Typography>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Naam</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 0.5 }}>
                        Tarief (netto)
                        <InfoIcon title="Netto = exclusief BTW. Dit is het tarief zonder BTW." size="small" />
                      </Box>
                    </TableCell>
                    {client.btw_profile.percentage > 0 && (
                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 0.5 }}>
                          Tarief (bruto)
                          <InfoIcon title="Bruto = inclusief BTW. Dit is het tarief met BTW erbij." size="small" />
                        </Box>
                      </TableCell>
                    )}
                    <TableCell sx={{ fontWeight: 600 }}>Unit</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Afronding</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Acties</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {projects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell>
                        <Link
                          href={`/projects/${project.id}`}
                          style={{ textDecoration: "none" }}
                        >
                          <Typography
                            sx={{
                              color: "primary.main",
                              "&:hover": {
                                textDecoration: "underline",
                              },
                            }}
                          >
                            {project.name}
                          </Typography>
                        </Link>
                      </TableCell>
                      <TableCell align="right">
                        {project.rate_ex_btw
                          ? `€${project.rate_ex_btw.toFixed(2)}`
                          : "-"}
                      </TableCell>
                      {client.btw_profile.percentage > 0 && (
                        <TableCell align="right">
                          {project.rate_ex_btw
                            ? `€${(project.rate_ex_btw * (1 + client.btw_profile.percentage / 100)).toFixed(2)}`
                            : "-"}
                        </TableCell>
                      )}
                      <TableCell>{formatUnit(project.default_unit)}</TableCell>
                      <TableCell>{project.rounding_rule}</TableCell>
                      <TableCell>
                        <Link href={`/projects/${project.id}/edit`} style={{ textDecoration: "none" }}>
                          <IconButton size="small" title="Bewerken">
                            <Edit size={18} />
                          </IconButton>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Box>
    </Container>
  );
}
