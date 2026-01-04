/**
 * components/client-search.tsx
 * 
 * Component voor het zoeken, beheren en verwijderen van klanten. Ondersteunt filtering
 * op BTW profiel, sortering, bulk delete met waarschuwing over 7-jaar bewaarplicht,
 * en CSV export functionaliteit.
 */
"use client";

import { useState, useMemo } from "react";
import { deleteClient } from "@/app/actions/clients";
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
  Tooltip,
} from "@mui/material";
import { Edit, Delete, Add, Search, GetApp, FilterList, Info } from "@mui/icons-material";
import { useToast } from "@/components/toast-provider";

interface Client {
  id: string;
  name: string;
  rate_ex_btw?: number | null;
  btw_profile: {
    label: string;
    percentage: number;
    rule: string;
  };
  projectCount?: number;
  totalHours?: number;
  lastActivity?: Date | string | null;
}

export function ClientSearch({ initialClients }: { initialClients: Client[] }) {
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [clients, setClients] = useState(initialClients);
  const [sortBy, setSortBy] = useState<"name" | "projects" | "activity">("name");
  const [btwFilter, setBtwFilter] = useState<string>("all");
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set());
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);
  const router = useRouter();

  // Get unique BTW profiles for filter
  const btwProfiles = useMemo(() => {
    const profiles = new Set<string>();
    clients.forEach((client) => {
      profiles.add(client.btw_profile.label);
    });
    return Array.from(profiles).sort();
  }, [clients]);

  // Filter and sort clients
  const filteredAndSortedClients = useMemo(() => {
    let filtered = clients.filter((client) => {
      const matchesSearch = client.name.toLowerCase().includes(search.toLowerCase());
      const matchesBtw = btwFilter === "all" || client.btw_profile.label === btwFilter;
      return matchesSearch && matchesBtw;
    });

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      } else if (sortBy === "projects") {
        const aProjects = a.projectCount || 0;
        const bProjects = b.projectCount || 0;
        return bProjects - aProjects;
      } else {
        // activity
        const aDate = a.lastActivity ? new Date(a.lastActivity).getTime() : 0;
        const bDate = b.lastActivity ? new Date(b.lastActivity).getTime() : 0;
        return bDate - aDate;
      }
    });

    return filtered;
  }, [clients, search, btwFilter, sortBy]);

  const handleDelete = async (id: string) => {
    setClientToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!clientToDelete) return;
    try {
      await deleteClient(clientToDelete);
      setClients(clients.filter((c) => c.id !== clientToDelete));
      setSelectedClients((prev) => {
        const next = new Set(prev);
        next.delete(clientToDelete);
        return next;
      });
      setDeleteConfirmOpen(false);
      setClientToDelete(null);
      toast.showSuccess("Klant verwijderd");
      router.refresh();
    } catch (error) {
      toast.showError("Fout bij verwijderen: " + (error as Error).message);
      setDeleteConfirmOpen(false);
      setClientToDelete(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedClients.size === 0) return;
    const message = `Weet je zeker dat je ${selectedClients.size} klant(en) wilt verwijderen?\n\n⚠️ Let op: Alle bijbehorende projecten en tijdentries worden ook permanent verwijderd. Deze actie kan niet ongedaan worden gemaakt.\n\nControleer of je voldoet aan de bewaarplicht voor administratieve gegevens (minimaal 7 jaar voor de belastingdienst). Zorg voor een backup voordat je verwijdert.`;
    if (!confirm(message)) {
      return;
    }
    try {
      await Promise.all(Array.from(selectedClients).map((id) => deleteClient(id)));
      setClients(clients.filter((c) => !selectedClients.has(c.id)));
      setSelectedClients(new Set());
      toast.showSuccess(`${selectedClients.size} klant(en) verwijderd`);
      router.refresh();
    } catch (error) {
      toast.showError("Fout bij verwijderen: " + (error as Error).message);
    }
  };

  const handleSelectAll = () => {
    if (selectedClients.size === filteredAndSortedClients.length) {
      setSelectedClients(new Set());
    } else {
      setSelectedClients(new Set(filteredAndSortedClients.map((c) => c.id)));
    }
  };

  const handleSelectClient = (id: string) => {
    setSelectedClients((prev) => {
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
    csvRows.push(["Naam", "BTW Profiel", "Tarief (ex BTW)", "Aantal Projecten", "Totaal Uren", "Laatste Activiteit"]);
    filteredAndSortedClients.forEach((client) => {
      csvRows.push([
        client.name,
        `${client.btw_profile.label} (${client.btw_profile.percentage}%)`,
        client.rate_ex_btw ? `€${client.rate_ex_btw.toFixed(2)}` : "-",
        (client.projectCount || 0).toString(),
        (client.totalHours || 0).toFixed(2),
        client.lastActivity ? format(new Date(client.lastActivity), "d MMM yyyy", { locale: nl }) : "Nooit",
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
    link.download = `klanten_export_${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
  };

  // Statistics
  const totalClients = clients.length;
  const totalProjects = clients.reduce((sum, c) => sum + (c.projectCount || 0), 0);
  const totalHours = clients.reduce((sum, c) => sum + (c.totalHours || 0), 0);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Statistics Cards */}
      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
        <Card sx={{ flex: { xs: "1 1 100%", sm: "1 1 calc(33.333% - 16px)" } }}>
          <CardContent>
            <Typography variant="h4" color="primary" fontWeight="bold">
              {totalClients}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Totaal Klanten
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: { xs: "1 1 100%", sm: "1 1 calc(33.333% - 16px)" } }}>
          <CardContent>
            <Typography variant="h4" color="secondary" fontWeight="bold">
              {totalProjects}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Totaal Projecten
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: { xs: "1 1 100%", sm: "1 1 calc(33.333% - 16px)" } }}>
          <CardContent>
            <Typography variant="h4" color="success.main" fontWeight="bold">
              {totalHours.toFixed(1)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Totaal Uren
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Search, Filter, Sort, Actions */}
      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
        <TextField
          size="small"
          placeholder="Zoek klanten..."
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
          <InputLabel>BTW Profiel</InputLabel>
          <Select
            value={btwFilter}
            label="BTW Profiel"
            onChange={(e) => setBtwFilter(e.target.value)}
            startAdornment={<FilterList sx={{ mr: 1, fontSize: 18 }} />}
          >
            <MenuItem value="all">Alle profielen</MenuItem>
            {btwProfiles.map((profile) => (
              <MenuItem key={profile} value={profile}>
                {profile}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Sorteer op</InputLabel>
          <Select value={sortBy} label="Sorteer op" onChange={(e) => setSortBy(e.target.value as any)}>
            <MenuItem value="name">Naam</MenuItem>
            <MenuItem value="projects">Aantal Projecten</MenuItem>
            <MenuItem value="activity">Laatste Activiteit</MenuItem>
          </Select>
        </FormControl>
        <Button variant="outlined" startIcon={<GetApp />} onClick={handleExportCSV} size="small">
          Export CSV
        </Button>
        {selectedClients.size > 0 && (
          <Button variant="contained" color="error" onClick={handleBulkDelete} size="small">
            Verwijder ({selectedClients.size})
          </Button>
        )}
      </Box>

      {filteredAndSortedClients.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          Geen klanten gevonden
        </Typography>
      ) : (
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={selectedClients.size > 0 && selectedClients.size < filteredAndSortedClients.length}
                    checked={filteredAndSortedClients.length > 0 && selectedClients.size === filteredAndSortedClients.length}
                    onChange={handleSelectAll}
                  />
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Naam</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>BTW Profiel</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Tarief</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Projecten</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Uren</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Laatste Activiteit</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Acties</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAndSortedClients.map((client) => (
                <TableRow key={client.id} selected={selectedClients.has(client.id)}>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedClients.has(client.id)}
                      onChange={() => handleSelectClient(client.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <Link href={`/clients/${client.id}`} style={{ textDecoration: "none" }}>
                      <Typography
                        sx={{
                          color: "primary.main",
                          "&:hover": {
                            textDecoration: "underline",
                          },
                        }}
                      >
                        {client.name}
                      </Typography>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={`${client.btw_profile.label} (${client.btw_profile.percentage}%)`}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    {client.rate_ex_btw ? (
                      <Typography variant="body2" fontWeight="medium">
                        €{client.rate_ex_btw.toFixed(2)}
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        -
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">{client.projectCount || 0}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">{(client.totalHours || 0).toFixed(1)}u</Typography>
                  </TableCell>
                  <TableCell>
                    {client.lastActivity ? (
                      <Typography variant="body2" color="text.secondary">
                        {format(new Date(client.lastActivity), "d MMM yyyy", { locale: nl })}
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Nooit
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Link href={`/projects/new?client_id=${client.id}`} style={{ textDecoration: "none" }}>
                        <IconButton size="small" title="Nieuw Project" color="primary">
                          <Add fontSize="small" />
                        </IconButton>
                      </Link>
                      <Link href={`/clients/${client.id}/edit`} style={{ textDecoration: "none" }}>
                        <IconButton size="small" title="Bewerken">
                          <Edit fontSize="small" />
                        </IconButton>
                      </Link>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(client.id)}
                        color="error"
                        title="Verwijderen"
                      >
                        <Delete fontSize="small" />
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
        <DialogTitle>Klant verwijderen?</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            Weet je zeker dat je deze klant wilt verwijderen? Alle bijbehorende projecten en tijdentries worden ook permanent verwijderd. Deze actie kan niet ongedaan worden gemaakt.
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
