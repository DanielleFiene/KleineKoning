/**
 * components/project-search.tsx
 * 
 * Component voor het zoeken, beheren en verwijderen van projecten. Ondersteunt filtering
 * op klant, unit, afrondingsregel, sortering, bulk delete met waarschuwing over
 * 7-jaar bewaarplicht, en weergave van totaal uren per project.
 */
"use client";

import { useState, useMemo } from "react";
import { deleteProject } from "@/app/actions/projects";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import {
  Box,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  InputAdornment,
  Chip,
} from "@mui/material";
import { Edit, Trash2, Search, Download, Filter } from "lucide-react";
import { useToast } from "@/components/toast-provider";

interface Project {
  id: string;
  name: string;
  rate_ex_btw?: number | null;
  default_unit: string;
  rounding_rule: string;
  client_id: string;
  clients?: { name: string } | null;
  totalHours?: number;
  lastActivity?: Date | string | null;
}

export function ProjectSearch({ initialProjects, clients }: { initialProjects: Project[]; clients: { id: string; name: string }[] }) {
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [projects, setProjects] = useState(initialProjects);
  const [sortBy, setSortBy] = useState<"name" | "client" | "hours" | "rate" | "activity">("name");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [unitFilter, setUnitFilter] = useState<string>("all");
  const [roundingFilter, setRoundingFilter] = useState<string>("all");
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set());
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const router = useRouter();

  // Get unique units and rounding rules for filters
  const units = useMemo(() => {
    const uniqueUnits = new Set<string>();
    projects.forEach((project) => {
      uniqueUnits.add(project.default_unit);
    });
    return Array.from(uniqueUnits).sort();
  }, [projects]);

  const roundingRules = useMemo(() => {
    const uniqueRules = new Set<string>();
    projects.forEach((project) => {
      uniqueRules.add(project.rounding_rule);
    });
    return Array.from(uniqueRules).sort();
  }, [projects]);

  // Filter and sort projects
  const filteredAndSortedProjects = useMemo(() => {
    let filtered = projects.filter((project) => {
      const matchesSearch = project.name.toLowerCase().includes(search.toLowerCase()) ||
        (project.clients?.name || "").toLowerCase().includes(search.toLowerCase());
      const matchesClient = clientFilter === "all" || project.client_id === clientFilter;
      const matchesUnit = unitFilter === "all" || project.default_unit === unitFilter;
      const matchesRounding = roundingFilter === "all" || project.rounding_rule === roundingFilter;
      return matchesSearch && matchesClient && matchesUnit && matchesRounding;
    });

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      } else if (sortBy === "client") {
        const aClient = a.clients?.name || "";
        const bClient = b.clients?.name || "";
        return aClient.localeCompare(bClient);
      } else if (sortBy === "hours") {
        const aHours = a.totalHours || 0;
        const bHours = b.totalHours || 0;
        return bHours - aHours;
      } else if (sortBy === "rate") {
        const aRate = a.rate_ex_btw || 0;
        const bRate = b.rate_ex_btw || 0;
        return bRate - aRate;
      } else {
        // activity
        const aDate = a.lastActivity ? new Date(a.lastActivity).getTime() : 0;
        const bDate = b.lastActivity ? new Date(b.lastActivity).getTime() : 0;
        return bDate - aDate;
      }
    });

    return filtered;
  }, [projects, search, clientFilter, unitFilter, roundingFilter, sortBy]);

  const handleDelete = async (id: string) => {
    setProjectToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!projectToDelete) return;
    try {
      await deleteProject(projectToDelete);
      setProjects(projects.filter((p) => p.id !== projectToDelete));
      setSelectedProjects((prev) => {
        const next = new Set(prev);
        next.delete(projectToDelete);
        return next;
      });
      setDeleteConfirmOpen(false);
      setProjectToDelete(null);
      toast.showSuccess("Project verwijderd");
      router.refresh();
    } catch (error) {
      toast.showError("Fout bij verwijderen: " + (error as Error).message);
      setDeleteConfirmOpen(false);
      setProjectToDelete(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProjects.size === 0) return;
    const message = `Weet je zeker dat je ${selectedProjects.size} project(en) wilt verwijderen?\n\n⚠️ Let op: Alle bijbehorende tijdentries worden ook permanent verwijderd. Deze actie kan niet ongedaan worden gemaakt.\n\nControleer of je voldoet aan de bewaarplicht voor administratieve gegevens (minimaal 7 jaar voor de belastingdienst). Zorg voor een backup voordat je verwijdert.`;
    if (!confirm(message)) {
      return;
    }
    try {
      await Promise.all(Array.from(selectedProjects).map((id) => deleteProject(id)));
      setProjects(projects.filter((p) => !selectedProjects.has(p.id)));
      setSelectedProjects(new Set());
      toast.showSuccess(`${selectedProjects.size} project(en) verwijderd`);
      router.refresh();
    } catch (error) {
      toast.showError("Fout bij verwijderen: " + (error as Error).message);
    }
  };

  const handleSelectAll = () => {
    if (selectedProjects.size === filteredAndSortedProjects.length) {
      setSelectedProjects(new Set());
    } else {
      setSelectedProjects(new Set(filteredAndSortedProjects.map((p) => p.id)));
    }
  };

  const handleSelectProject = (id: string) => {
    setSelectedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleExportCSV = () => {
    const csvRows = [];
    csvRows.push(["Naam", "Klant", "Tarief (ex BTW)", "Unit", "Afronding", "Totaal Uren", "Laatste Activiteit"]);
    filteredAndSortedProjects.forEach((project) => {
      csvRows.push([
        project.name,
        project.clients?.name || "-",
        project.rate_ex_btw ? `€${project.rate_ex_btw.toFixed(2)}` : "-",
        project.default_unit,
        project.rounding_rule,
        (project.totalHours || 0).toFixed(2),
        project.lastActivity ? format(new Date(project.lastActivity), "d MMM yyyy", { locale: nl }) : "Nooit",
      ]);
    });
    const csvContent = csvRows
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    
    // Add UTF-8 BOM for Excel compatibility (especially for euro sign)
    const csvWithBom = "\uFEFF" + csvContent;
    const blob = new Blob([csvWithBom], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `projecten_export_${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
  };

  // Statistics
  const totalProjects = projects.length;
  const totalHours = projects.reduce((sum, p) => sum + (p.totalHours || 0), 0);
  const avgRate = projects.filter((p) => p.rate_ex_btw).length > 0
    ? projects.filter((p) => p.rate_ex_btw).reduce((sum, p) => sum + (p.rate_ex_btw || 0), 0) / projects.filter((p) => p.rate_ex_btw).length
    : 0;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Statistics Cards */}
      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
        <Card sx={{ flex: { xs: "1 1 100%", sm: "1 1 calc(33.333% - 16px)" } }}>
          <CardContent>
            <Typography variant="h4" color="primary" fontWeight="bold">
              {totalProjects}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Totaal Projecten
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: { xs: "1 1 100%", sm: "1 1 calc(33.333% - 16px)" } }}>
          <CardContent>
            <Typography variant="h4" color="secondary" fontWeight="bold">
              {totalHours.toFixed(1)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Totaal Uren
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: { xs: "1 1 100%", sm: "1 1 calc(33.333% - 16px)" } }}>
          <CardContent>
            <Typography variant="h4" color="success.main" fontWeight="bold">
              {avgRate > 0 ? `€${avgRate.toFixed(2)}` : "-"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Gem. Tarief
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Search, Filter, Sort, Actions */}
      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
        <TextField
          size="small"
          placeholder="Zoek projecten..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
          sx={{ flex: 1, minWidth: 200 }}
        />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Klant</InputLabel>
          <Select
            value={clientFilter}
            label="Klant"
            onChange={(e) => setClientFilter(e.target.value)}
            startAdornment={<Filter size={18} style={{ marginRight: 8 }} />}
          >
            <MenuItem value="all">Alle klanten</MenuItem>
            {clients.map((client) => (
              <MenuItem key={client.id} value={client.id}>
                {client.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Unit</InputLabel>
          <Select value={unitFilter} label="Unit" onChange={(e) => setUnitFilter(e.target.value)}>
            <MenuItem value="all">Alle units</MenuItem>
            {units.map((unit) => (
              <MenuItem key={unit} value={unit}>
                {unit}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Afronding</InputLabel>
          <Select value={roundingFilter} label="Afronding" onChange={(e) => setRoundingFilter(e.target.value)}>
            <MenuItem value="all">Alle regels</MenuItem>
            {roundingRules.map((rule) => (
              <MenuItem key={rule} value={rule}>
                {rule}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Sorteer op</InputLabel>
          <Select value={sortBy} label="Sorteer op" onChange={(e) => setSortBy(e.target.value as any)}>
            <MenuItem value="name">Naam</MenuItem>
            <MenuItem value="client">Klant</MenuItem>
            <MenuItem value="hours">Uren</MenuItem>
            <MenuItem value="rate">Tarief</MenuItem>
            <MenuItem value="activity">Laatste Activiteit</MenuItem>
          </Select>
        </FormControl>
        <Button variant="outlined" startIcon={<Download size={18} />} onClick={handleExportCSV} size="small">
          Export CSV
        </Button>
        {selectedProjects.size > 0 && (
          <Button variant="contained" color="error" onClick={handleBulkDelete} size="small">
            Verwijder ({selectedProjects.size})
          </Button>
        )}
      </Box>

      {filteredAndSortedProjects.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          Geen projecten gevonden
        </Typography>
      ) : (
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={selectedProjects.size > 0 && selectedProjects.size < filteredAndSortedProjects.length}
                    checked={filteredAndSortedProjects.length > 0 && selectedProjects.size === filteredAndSortedProjects.length}
                    onChange={handleSelectAll}
                  />
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Naam</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Klant</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Tarief</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Unit</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Afronding</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Uren</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Laatste Activiteit</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Acties</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAndSortedProjects.map((project) => (
                <TableRow key={project.id} selected={selectedProjects.has(project.id)}>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedProjects.has(project.id)}
                      onChange={() => handleSelectProject(project.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <Link href={`/projects/${project.id}`} style={{ textDecoration: "none" }}>
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
                  <TableCell>
                    <Link href={`/clients/${project.client_id}`} style={{ textDecoration: "none" }}>
                      <Typography
                        sx={{
                          color: "primary.main",
                          "&:hover": {
                            textDecoration: "underline",
                          },
                        }}
                      >
                        {project.clients?.name || "-"}
                      </Typography>
                    </Link>
                  </TableCell>
                  <TableCell align="right">
                    {project.rate_ex_btw ? (
                      <Typography variant="body2" fontWeight="medium">
                        €{project.rate_ex_btw.toFixed(2)}
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        -
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip label={project.default_unit} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Chip label={project.rounding_rule} size="small" variant="outlined" color="secondary" />
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">{(project.totalHours || 0).toFixed(1)}u</Typography>
                  </TableCell>
                  <TableCell>
                    {project.lastActivity ? (
                      <Typography variant="body2" color="text.secondary">
                        {format(new Date(project.lastActivity), "d MMM yyyy", { locale: nl })}
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Nooit
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Link href={`/projects/${project.id}/edit`} style={{ textDecoration: "none" }}>
                        <IconButton size="small" title="Bewerken">
                          <Edit size={18} />
                        </IconButton>
                      </Link>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(project.id)}
                        color="error"
                        title="Verwijderen"
                      >
                        <Trash2 size={18} />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Project verwijderen?</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            Weet je zeker dat je dit project wilt verwijderen? Alle bijbehorende tijdentries worden ook permanent verwijderd. Deze actie kan niet ongedaan worden gemaakt.
          </Typography>
          <Typography variant="body2" color="warning.main" sx={{ fontWeight: 600 }}>
            ⚠️ Let op: Controleer of je voldoet aan de bewaarplicht voor administratieve gegevens (minimaal 7 jaar voor de belastingdienst). Zorg voor een backup voordat je verwijdert.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)} sx={{ color: "text.primary" }}>Annuleren</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Verwijderen
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

