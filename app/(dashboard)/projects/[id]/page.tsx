// app/(dashboard)/projects/[id]/page.tsx
import { getProject } from "@/app/actions/projects";
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
} from "@mui/material";
import { Edit } from "lucide-react";
import Link from "next/link";

export const runtime = 'edge';

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Await params (Next.js 15+)
  const { id } = await params;
  const project = await getProject(id);

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
              {project.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Klant: {(project as any).clients?.name || "-"}
            </Typography>
          </Box>
          <Link href={`/projects/${id}/edit`} style={{ textDecoration: "none" }}>
            <Button variant="outlined" startIcon={<Edit size={18} />}>
              Bewerken
            </Button>
          </Link>
        </Box>

        {/* Content Card */}
        <Paper elevation={1} sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
            Project Details
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                Tarief (ex BTW)
              </Typography>
              <Typography variant="body1">
                {project.rate_ex_btw ? `€${project.rate_ex_btw.toFixed(2)}` : "Niet ingesteld"}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                Standaard Unit
              </Typography>
              <Typography variant="body1">{project.default_unit}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                Afrondingsregel
              </Typography>
              <Typography variant="body1">{project.rounding_rule}</Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
