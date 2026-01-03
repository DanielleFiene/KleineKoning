"use client";

import { useState } from "react";
import { getTimeEntries } from "@/app/actions/time-entries";
import { createStatement, updateStatementPdfUrl, deleteStatement, getStatement } from "@/app/actions/statements";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subYears, isAfter } from "date-fns";
import { nl } from "date-fns/locale";
import { getTodayDate, parseDateString } from "@/lib/utils/date";
import {
  Container,
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Link as MuiLink,
  IconButton,
  Chip,
  InputAdornment,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Menu,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import { ContentCopy, Download, Delete, Search, Refresh, GetApp, Email, FilterList, Info, MoreVert, PictureAsPdf, Add } from "@mui/icons-material";
import { InfoIcon } from "@/components/info-icon";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

interface Client {
  id: string;
  name: string;
}

interface Statement {
  id: string;
  statement_number: string;
  period_start: string;
  period_end: string;
  generated_at: string;
  pdf_url: string | null;
  clients: { name: string };
}

export function ExportsView({
  clients,
  initialStatements,
}: {
  clients: Client[];
  initialStatements: Statement[];
}) {
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [periodType, setPeriodType] = useState<"week" | "month" | "custom">("week");
  const [customStart, setCustomStart] = useState<Date | null>(null);
  const [customEnd, setCustomEnd] = useState<Date | null>(null);
  const [groupByDay, setGroupByDay] = useState(true);
  const [showProjectColumn, setShowProjectColumn] = useState(true);
  const [previewData, setPreviewData] = useState<any>(null);
  const [generating, setGenerating] = useState(false);
  const [statements, setStatements] = useState(initialStatements);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "client" | "number">("date");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [statementToDelete, setStatementToDelete] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailAddresses, setEmailAddresses] = useState<string[]>([""]);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [emailIncludePdfLink, setEmailIncludePdfLink] = useState(true);
  const [emailIncludePdfAttachment, setEmailIncludePdfAttachment] = useState(false);
  const [emailIncludeCsv, setEmailIncludeCsv] = useState(false);
  const [emailStatementId, setEmailStatementId] = useState<string | null>(null);
  const [emailPreviewData, setEmailPreviewData] = useState<any>(null);
  const [statementMenuAnchor, setStatementMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedStatement, setSelectedStatement] = useState<Statement | null>(null);

  const calculatePeriod = () => {
    const today = getTodayDate();
    let start: Date, end: Date;

    if (periodType === "week") {
      start = startOfWeek(today, { weekStartsOn: 1 });
      end = endOfWeek(start, { weekStartsOn: 1 });
    } else if (periodType === "month") {
      start = startOfMonth(today);
      end = endOfMonth(today);
    } else {
      if (!customStart || !customEnd) {
        throw new Error("Selecteer beide datums");
      }
      start = customStart;
      end = customEnd;
    }

    // Format dates as YYYY-MM-DD without timezone issues
    const formatDateString = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    return {
      start: formatDateString(start),
      end: formatDateString(end),
    };
  };

  const handlePreview = async () => {
    if (!selectedClient) {
      alert("Selecteer een klant");
      return;
    }

    if (periodType === "custom" && (!customStart || !customEnd)) {
      alert("Selecteer beide datums");
      return;
    }

    const period = calculatePeriod();

    try {
      const entries = await getTimeEntries({
        clientId: selectedClient,
        startDate: period.start,
        endDate: period.end,
      });

      const client = clients.find((c) => c.id === selectedClient);
      setPreviewData({
        client: client?.name || "",
        period,
        entries,
      });
    } catch (error) {
      alert("Fout bij ophalen data: " + (error as Error).message);
    }
  };

  const handleGeneratePDF = async () => {
    if (!previewData || !selectedClient) {
      return;
    }

    setGenerating(true);
    try {
      const { statement, client } = await createStatement(
        selectedClient,
        previewData.period.start,
        previewData.period.end,
        previewData.entries
      );

      if (!client) {
        alert("Fout: Klant niet gevonden");
        setGenerating(false);
        return;
      }

      const response = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          statementId: statement.id,
          clientName: client.name,
          statementNumber: statement.statement_number,
          periodStart: previewData.period.start,
          periodEnd: previewData.period.end,
          entries: previewData.entries,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const { pdfUrl } = await response.json();
      if (!pdfUrl) {
        throw new Error("Geen PDF URL ontvangen van server");
      }
      
      await updateStatementPdfUrl(statement.id, pdfUrl);
      
      // Store statement ID for email functionality
      setEmailStatementId(statement.id);

      // Download PDF directly
      const link = document.createElement("a");
      link.href = pdfUrl;
      link.download = `urenstaat_${client.name.replace(/[^a-zA-Z0-9]/g, "_")}_${previewData.period.start}_${previewData.period.end}.html`;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      const statementsResponse = await fetch("/api/statements");
      const newStatements = await statementsResponse.json();
      setStatements(newStatements);
    } catch (error) {
      alert("Fout bij genereren PDF: " + (error as Error).message);
    } finally {
      setGenerating(false);
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}u ${mins}min` : `${hours}u`;
  };

  const entriesByDate = previewData
    ? previewData.entries.reduce((acc: any, entry: any) => {
        const date = entry.date;
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push(entry);
        return acc;
      }, {})
    : {};

  const periodTotal = previewData
    ? previewData.entries.reduce((sum: number, e: any) => sum + e.duration_minutes, 0)
    : 0;

  // Filter and sort statements
  const filteredAndSortedStatements = statements
    .filter((stmt) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        stmt.statement_number.toLowerCase().includes(query) ||
        stmt.clients.name.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      if (sortBy === "date") {
        return new Date(b.generated_at).getTime() - new Date(a.generated_at).getTime();
      } else if (sortBy === "client") {
        return a.clients.name.localeCompare(b.clients.name);
      } else {
        return a.statement_number.localeCompare(b.statement_number);
      }
    });

  // Statistics
  const totalStatements = statements.length;
  const totalHoursByClient = statements.reduce((acc: any, stmt) => {
    const clientName = stmt.clients.name;
    if (!acc[clientName]) acc[clientName] = 0;
    // We don't have hours in statements, so we'll calculate from entries if available
    return acc;
  }, {});

  // Check if statement is within 7-year retention period
  const isWithinRetentionPeriod = (statement: Statement): boolean => {
    const generatedDate = new Date(statement.generated_at);
    const sevenYearsAgo = subYears(new Date(), 7);
    return isAfter(generatedDate, sevenYearsAgo);
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    setStatementToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!statementToDelete) return;
    try {
      await deleteStatement(statementToDelete);
      setStatements(statements.filter((s) => s.id !== statementToDelete));
      setDeleteConfirmOpen(false);
      setStatementToDelete(null);
    } catch (error) {
      alert("Fout bij verwijderen: " + (error as Error).message);
      setDeleteConfirmOpen(false);
      setStatementToDelete(null);
    }
  };

  // Quick action: Re-export last period
  const handleReexportLast = async () => {
    if (statements.length === 0) {
      alert("Geen statements beschikbaar");
      return;
    }
    const lastStatement = statements[0]; // Already sorted by date desc
    const clientId = clients.find((c) => c.name === lastStatement.clients.name)?.id;
    if (!clientId) {
      alert("Klant niet gevonden");
      return;
    }
    setSelectedClient(clientId);
    setPeriodType("custom");
    const startDate = parseDateString(lastStatement.period_start);
    const endDate = parseDateString(lastStatement.period_end);
    setCustomStart(startDate);
    setCustomEnd(endDate);
    
    // Wait for state to update, then trigger preview
    await new Promise(resolve => setTimeout(resolve, 200));
    await handlePreview();
  };

  // Export to CSV
  const handleExportCSV = (statementData?: { entries: any[]; client: string; period: { start: string; end: string } }) => {
    const data = statementData || previewData;
    if (!data) {
      alert("Geen data beschikbaar");
      return;
    }
    const csvRows = [];
    csvRows.push(["Datum", "Project", "Omschrijving", "Duur (minuten)"]);
    data.entries.forEach((entry: any) => {
      csvRows.push([
        entry.date,
        entry.project_name || entry.projects?.name || "",
        entry.description,
        entry.duration_minutes.toString(),
      ]);
    });
    const csvContent = csvRows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    // Sanitize client name for filename (remove special characters)
    const sanitizedClientName = (data.client || "export").replace(/[^a-zA-Z0-9]/g, "_");
    link.download = `export_${sanitizedClientName}_${data.period.start}_${data.period.end}.csv`;
    link.click();
  };

  // Handle statement actions menu
  const handleStatementMenuOpen = (event: React.MouseEvent<HTMLElement>, statement: Statement) => {
    setStatementMenuAnchor(event.currentTarget);
    setSelectedStatement(statement);
  };

  const handleStatementMenuClose = () => {
    setStatementMenuAnchor(null);
    setSelectedStatement(null);
  };

  // Generate PDF for existing statement
  const handleRegeneratePDF = async () => {
    if (!selectedStatement) return;
    handleStatementMenuClose();
    
    setGenerating(true);
    try {
      // Get full statement with lines
      const fullStatement = await getStatement(selectedStatement.id);
      if (!fullStatement || !fullStatement.statement_lines) {
        alert("Statement data niet gevonden");
        setGenerating(false);
        return;
      }

      // Convert statement_lines to entries format
      const entries = fullStatement.statement_lines.map((line: any) => ({
        date: line.date,
        description: line.description,
        duration_minutes: line.duration_minutes,
        projects: { name: line.project_name },
      }));

      const response = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          statementId: selectedStatement.id,
          clientName: selectedStatement.clients.name,
          statementNumber: selectedStatement.statement_number,
          periodStart: selectedStatement.period_start,
          periodEnd: selectedStatement.period_end,
          entries,
        }),
      });

      const { pdfUrl } = await response.json();
      await updateStatementPdfUrl(selectedStatement.id, pdfUrl);

      // Download PDF directly
      const link = document.createElement("a");
      link.href = pdfUrl;
      link.download = `urenstaat_${selectedStatement.clients.name.replace(/[^a-zA-Z0-9]/g, "_")}_${selectedStatement.period_start}_${selectedStatement.period_end}.html`;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Refresh statements
      const statementsResponse = await fetch("/api/statements");
      const newStatements = await statementsResponse.json();
      setStatements(newStatements);
    } catch (error) {
      alert("Fout bij genereren PDF: " + (error as Error).message);
    } finally {
      setGenerating(false);
    }
  };

  // Export CSV for existing statement
  const handleExportStatementCSV = async () => {
    if (!selectedStatement) return;
    handleStatementMenuClose();
    
    try {
      const fullStatement = await getStatement(selectedStatement.id);
      if (!fullStatement || !fullStatement.statement_lines) {
        alert("Statement data niet gevonden");
        return;
      }

      const entries = fullStatement.statement_lines.map((line: any) => ({
        date: line.date,
        description: line.description,
        duration_minutes: line.duration_minutes,
        project_name: line.project_name,
      }));

      handleExportCSV({
        entries,
        client: selectedStatement.clients.name,
        period: {
          start: selectedStatement.period_start,
          end: selectedStatement.period_end,
        },
      });
    } catch (error) {
      alert("Fout bij exporteren CSV: " + (error as Error).message);
    }
  };

  // Email existing statement
  const handleEmailStatement = async () => {
    if (!selectedStatement) {
      console.error("No statement selected for email");
      return;
    }
    
    try {
      handleStatementMenuClose();
      
      const clientName = selectedStatement.clients?.name || selectedStatement.clients?.name || "Onbekende klant";
      const startDate = format(parseDateString(selectedStatement.period_start), "d MMMM yyyy", { locale: nl });
      const endDate = format(parseDateString(selectedStatement.period_end), "d MMMM yyyy", { locale: nl });
      
      setEmailAddresses([""]);
      setEmailSubject(`Urenstaat ${clientName} - ${startDate} tot ${endDate}`);
      setEmailBody(`Beste,\n\nHierbij de urenstaat voor ${clientName} voor de periode ${startDate} tot ${endDate}.\n\nMet vriendelijke groet`);
      setEmailIncludePdfLink(true);
      setEmailIncludePdfAttachment(false);
      setEmailIncludeCsv(false);
      setEmailStatementId(selectedStatement.id);
      setEmailPreviewData(null);
      setPreviewData({
        client: clientName,
        period: {
          start: selectedStatement.period_start,
          end: selectedStatement.period_end,
        },
        entries: [], // We don't need entries for email
      });
      setEmailDialogOpen(true);
    } catch (error) {
      console.error("Error opening email dialog:", error);
      alert("Fout bij openen email dialog: " + (error as Error).message);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3 } }}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {/* Page Header */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
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
            Export
          </Typography>
          <InfoIcon title="Genereer PDF urenstaten voor klanten. Selecteer een periode, bekijk de preview en exporteer naar PDF, CSV of email." />
        </Box>

        {/* Selectieblok */}
        <Paper elevation={1} sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
            Nieuwe Export
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
                <Typography variant="body2" fontWeight={500}>
                  Klant <span style={{ color: "red" }}>*</span>
                </Typography>
                <InfoIcon title="Selecteer de klant waarvoor je een urenstaat wilt genereren. Alleen tijdentries van deze klant worden meegenomen." size="small" />
              </Box>
              <FormControl fullWidth sx={{ maxWidth: 400 }}>
                <InputLabel id="export-client-label">Klant *</InputLabel>
                <Select
                  labelId="export-client-label"
                  id="export-client"
                  value={selectedClient}
                  label="Klant *"
                  onChange={(e) => setSelectedClient(e.target.value)}
                >
                  {clients.map((client) => (
                    <MenuItem key={client.id} value={client.id}>
                      {client.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
                <Typography variant="body2" fontWeight={500}>
                  Periode <span style={{ color: "red" }}>*</span>
                </Typography>
                <InfoIcon title="Kies de periode voor de export. Week: huidige week. Maand: huidige maand. Aangepast: selecteer zelf een start- en einddatum." size="small" />
              </Box>
              <FormControl fullWidth sx={{ maxWidth: 400 }}>
                <InputLabel id="period-type-label">Periode *</InputLabel>
                <Select
                  labelId="period-type-label"
                  id="period-type"
                  value={periodType}
                  label="Periode *"
                  onChange={(e) => setPeriodType(e.target.value as "week" | "month" | "custom")}
                >
                  <MenuItem value="week">Week</MenuItem>
                  <MenuItem value="month">Maand</MenuItem>
                  <MenuItem value="custom">Aangepast</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {periodType === "custom" && (
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={nl}>
                <Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
                    <Typography variant="body2" fontWeight={500}>
                      Datum bereik
                    </Typography>
                    <InfoIcon title="Selecteer de start- en einddatum voor de export. Alle tijdentries tussen deze datums worden meegenomen." size="small" />
                  </Box>
                  <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                    <DatePicker
                      label="Van"
                      value={customStart}
                      onChange={(newValue) => setCustomStart(newValue)}
                      slotProps={{
                        textField: {
                          sx: { maxWidth: 200 },
                        },
                      }}
                      format="d MMM yyyy"
                    />
                    <DatePicker
                      label="Tot"
                      value={customEnd}
                      onChange={(newValue) => setCustomEnd(newValue)}
                      slotProps={{
                        textField: {
                          sx: { maxWidth: 200 },
                        },
                      }}
                      format="d MMM yyyy"
                    />
                  </Box>
                </Box>
              </LocalizationProvider>
            )}

            <Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 1 }}>
                <Typography variant="body2" fontWeight={500}>
                  Export opties
                </Typography>
                <InfoIcon title="Configureer hoe de export wordt weergegeven. Groeperen per dag: entries worden gegroepeerd per dag. Toon projectkolom: projectnaam wordt getoond in de export." size="small" />
              </Box>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={groupByDay}
                      onChange={(e) => setGroupByDay(e.target.checked)}
                    />
                  }
                  label="Groeperen per dag"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={showProjectColumn}
                      onChange={(e) => setShowProjectColumn(e.target.checked)}
                    />
                  }
                  label="Toon projectkolom"
                />
              </Box>
            </Box>

            <Button
              onClick={handlePreview}
              disabled={!selectedClient}
              variant="contained"
              sx={{ alignSelf: "flex-start" }}
            >
              Preview
            </Button>
          </Box>
        </Paper>

        {/* Preview */}
        {previewData && (
          <Paper elevation={1} sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
              Preview
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {previewData.client} - {format(parseDateString(previewData.period.start), "d MMM", { locale: nl })} tot{" "}
              {format(parseDateString(previewData.period.end), "d MMM yyyy", { locale: nl })}
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <Box sx={{ p: 2, backgroundColor: "grey.50", borderRadius: 1 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Header</Typography>
                <Typography variant="body2">Klant: {previewData.client}</Typography>
                <Typography variant="body2">
                  Periode: {format(parseDateString(previewData.period.start), "d MMM", { locale: nl })} -{" "}
                  {format(parseDateString(previewData.period.end), "d MMM yyyy", { locale: nl })}
                </Typography>
                <Typography variant="body2">Opgesteld op: {format(new Date(), "d MMMM yyyy", { locale: nl })}</Typography>
              </Box>

              {Object.keys(entriesByDate).length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Geen entries in deze periode
                </Typography>
              ) : (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  {Object.entries(entriesByDate).map(([date, dayEntries]: [string, any]) => {
                    const dayTotal = dayEntries.reduce(
                      (sum: number, e: any) => sum + e.duration_minutes,
                      0
                    );
                    return (
                      <Box key={date} sx={{ border: 1, borderColor: "divider", borderRadius: 1, overflow: "hidden" }}>
                        <Box sx={{ p: 2, backgroundColor: "grey.100", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <Typography variant="subtitle2" fontWeight={600}>
                            {format(new Date(date), "EEEE d MMMM", { locale: nl })}
                          </Typography>
                          <Chip label={`Totaal: ${formatDuration(dayTotal)}`} size="small" color="primary" />
                        </Box>
                        <TableContainer>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                {showProjectColumn && (
                                  <TableCell sx={{ fontWeight: 600 }}>Project</TableCell>
                                )}
                                <TableCell sx={{ fontWeight: 600 }}>Omschrijving</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Duur</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {dayEntries.map((entry: any) => (
                                <TableRow key={entry.id}>
                                  {showProjectColumn && (
                                    <TableCell>{entry.projects?.name || "-"}</TableCell>
                                  )}
                                  <TableCell>{entry.description}</TableCell>
                                  <TableCell>{formatDuration(entry.duration_minutes)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Box>
                    );
                  })}
                  <Box sx={{ p: 2, backgroundColor: "primary.main", color: "white", borderRadius: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="subtitle1" fontWeight={600}>
                      Periodetotaal
                    </Typography>
                    <Typography variant="subtitle1" fontWeight={600}>
                      {formatDuration(periodTotal)}
                    </Typography>
                  </Box>
                </Box>
              )}

              {/* Acties */}
              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                <Button
                  onClick={handleGeneratePDF}
                  disabled={generating}
                  variant="contained"
                  startIcon={generating ? undefined : <Download />}
                >
                  {generating ? "PDF genereren..." : "Genereer PDF"}
                </Button>
                <Button
                  onClick={() => handleExportCSV()}
                  variant="outlined"
                  startIcon={<GetApp />}
                >
                  Exporteer CSV
                </Button>
                {previewData && (
                  <Button
                    onClick={() => {
                      const startDate = format(parseDateString(previewData.period.start), "d MMMM yyyy", { locale: nl });
                      const endDate = format(parseDateString(previewData.period.end), "d MMMM yyyy", { locale: nl });
                      setEmailAddresses([""]);
                      setEmailSubject(`Urenstaat ${previewData.client} - ${startDate} tot ${endDate}`);
                      setEmailBody(`Beste,\n\nHierbij de urenstaat voor ${previewData.client} voor de periode ${startDate} tot ${endDate}.\n\nMet vriendelijke groet`);
                      setEmailIncludePdfLink(true);
                      setEmailIncludePdfAttachment(false);
                      setEmailIncludeCsv(false);
                      setEmailStatementId(null);
                      setEmailPreviewData(previewData);
                      setEmailDialogOpen(true);
                    }}
                    variant="outlined"
                    startIcon={<Email />}
                    disabled={!previewData}
                  >
                    Email
                  </Button>
                )}
              </Box>
            </Box>
          </Paper>
        )}

        {/* Statistieken */}
        <Paper elevation={1} sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Statistieken
          </Typography>
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <Card sx={{ flex: { xs: "1 1 100%", sm: "1 1 calc(50% - 8px)", md: "1 1 calc(25% - 12px)" } }}>
              <CardContent>
                <Typography variant="h4" color="primary" fontWeight="bold">
                  {totalStatements}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Totaal Statements
                </Typography>
              </CardContent>
            </Card>
            <Card sx={{ flex: { xs: "1 1 100%", sm: "1 1 calc(50% - 8px)", md: "1 1 calc(25% - 12px)" } }}>
              <CardContent>
                <Typography variant="h4" color="secondary" fontWeight="bold">
                  {clients.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Klanten
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </Paper>

        {/* Statement lijst */}
        <Paper elevation={1} sx={{ p: 3 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Gegenereerde Statements ({filteredAndSortedStatements.length})
            </Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<Refresh />}
                onClick={handleReexportLast}
                disabled={statements.length === 0}
              >
                Laatste periode opnieuw
              </Button>
            </Box>
          </Box>

          {/* Zoek en sorteer */}
          <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap" }}>
            <TextField
              size="small"
              placeholder="Zoek statements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
              <InputLabel>Sorteer op</InputLabel>
              <Select
                value={sortBy}
                label="Sorteer op"
                onChange={(e) => setSortBy(e.target.value as "date" | "client" | "number")}
              >
                <MenuItem value="date">Datum (nieuwste)</MenuItem>
                <MenuItem value="client">Klant</MenuItem>
                <MenuItem value="number">Statement #</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {filteredAndSortedStatements.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Nog geen statements gegenereerd
            </Typography>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Statement #</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Klant</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Periode</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Aangemaakt op</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Acties</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredAndSortedStatements.map((statement) => (
                    <TableRow key={statement.id}>
                      <TableCell>{statement.statement_number}</TableCell>
                      <TableCell>{statement.clients.name}</TableCell>
                      <TableCell>
                        {format(new Date(statement.period_start), "d MMM", { locale: nl })} -{" "}
                        {format(new Date(statement.period_end), "d MMM yyyy", { locale: nl })}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          {format(new Date(statement.generated_at), "d MMM yyyy HH:mm", { locale: nl })}
                          {isWithinRetentionPeriod(statement) && (
                            <InfoIcon
                              title="Binnen 7-jaar bewaartermijn (wettelijk verplicht voor Belastingdienst)"
                              size="small"
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                          {statement.pdf_url && (
                            <>
                              <MuiLink
                                href={statement.pdf_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                              >
                                <Download fontSize="small" />
                                Download PDF
                              </MuiLink>
                              <IconButton
                                size="small"
                                onClick={async () => {
                                  try {
                                    // Create a short, clean URL
                                    const shortUrl = `${window.location.origin}/api/pdf/${statement.id}`;
                                    await navigator.clipboard.writeText(shortUrl);
                                    alert("PDF link gekopieerd naar klembord!");
                                  } catch (error) {
                                    // Fallback for older browsers or if clipboard API fails
                                    const shortUrl = `${window.location.origin}/api/pdf/${statement.id}`;
                                    const textArea = document.createElement("textarea");
                                    textArea.value = shortUrl;
                                    textArea.style.position = "fixed";
                                    textArea.style.left = "-999999px";
                                    textArea.style.top = "-999999px";
                                    document.body.appendChild(textArea);
                                    textArea.focus();
                                    textArea.select();
                                    try {
                                      document.execCommand("copy");
                                      alert("PDF link gekopieerd naar klembord!");
                                    } catch (err) {
                                      alert("Kon link niet kopiëren. Gebruik Ctrl+C op de link.");
                                    }
                                    document.body.removeChild(textArea);
                                  }
                                }}
                                title="Kopieer PDF link naar klembord"
                              >
                                <ContentCopy fontSize="small" />
                              </IconButton>
                            </>
                          )}
                          <IconButton
                            size="small"
                            onClick={(e) => handleStatementMenuOpen(e, statement)}
                            title="Meer acties"
                          >
                            <MoreVert fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(statement.id)}
                            title="Verwijder"
                            color="error"
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
        </Paper>

        {/* Statement Actions Menu */}
        <Menu
          anchorEl={statementMenuAnchor}
          open={Boolean(statementMenuAnchor)}
          onClose={handleStatementMenuClose}
        >
          <MenuItem onClick={handleRegeneratePDF} disabled={generating}>
            <ListItemIcon>
              <PictureAsPdf fontSize="small" />
            </ListItemIcon>
            <ListItemText>PDF genereren/downloaden</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleExportStatementCSV}>
            <ListItemIcon>
              <GetApp fontSize="small" />
            </ListItemIcon>
            <ListItemText>Exporteer CSV</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleEmailStatement}>
            <ListItemIcon>
              <Email fontSize="small" />
            </ListItemIcon>
            <ListItemText>Email</ListItemText>
          </MenuItem>
        </Menu>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
          <DialogTitle>Statement verwijderen?</DialogTitle>
          <DialogContent>
            {statementToDelete && (() => {
              const statement = statements.find((s) => s.id === statementToDelete);
              const withinRetention = statement ? isWithinRetentionPeriod(statement) : false;
              return (
                <>
                  <Typography sx={{ mb: withinRetention ? 2 : 0 }}>
                    Weet je zeker dat je dit statement wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.
                  </Typography>
                  {withinRetention && (
                    <Box
                      sx={{
                        p: 2,
                        bgcolor: "warning.light",
                        borderRadius: 1,
                        border: "1px solid",
                        borderColor: "warning.main",
                      }}
                    >
                      <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
                        <Info sx={{ color: "warning.dark", mt: 0.5 }} />
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                            Waarschuwing: Bewaartermijn
                          </Typography>
                          <Typography variant="body2">
                            Dit statement is minder dan 7 jaar oud. Volgens de Nederlandse wetgeving moeten facturen en urenstaten minimaal 7 jaar bewaard blijven voor de Belastingdienst. 
                            Het verwijderen van dit statement kan problemen veroorzaken bij een eventuele belastingcontrole.
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  )}
                </>
              );
            })()}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteConfirmOpen(false)}>Annuleren</Button>
            <Button onClick={confirmDelete} color="error" variant="contained">
              Verwijderen
            </Button>
          </DialogActions>
        </Dialog>

        {/* Email Dialog */}
        <Dialog open={emailDialogOpen} onClose={() => setEmailDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Email urenstaat</DialogTitle>
          <DialogContent>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}>
              <Box>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                  Email adressen
                </Typography>
                {emailAddresses.map((email, index) => (
                  <Box key={index} sx={{ display: "flex", gap: 1, mb: 1, alignItems: "flex-start" }}>
                    <TextField
                      label={`Email adres ${index + 1}`}
                      value={email}
                      onChange={(e) => {
                        const newAddresses = [...emailAddresses];
                        newAddresses[index] = e.target.value;
                        setEmailAddresses(newAddresses);
                      }}
                      placeholder="bijv. klant@voorbeeld.nl"
                      fullWidth
                      required={index === 0}
                      autoFocus={index === 0}
                      type="email"
                    />
                    {emailAddresses.length > 1 && (
                      <IconButton
                        onClick={() => {
                          const newAddresses = emailAddresses.filter((_, i) => i !== index);
                          setEmailAddresses(newAddresses);
                        }}
                        color="error"
                        sx={{ mt: 1 }}
                      >
                        <Delete />
                      </IconButton>
                    )}
                  </Box>
                ))}
                <Button
                  startIcon={<Add />}
                  onClick={() => setEmailAddresses([...emailAddresses, ""])}
                  variant="outlined"
                  size="small"
                  sx={{ mt: 1 }}
                >
                  Email adres toevoegen
                </Button>
              </Box>
              <TextField
                label="Onderwerp"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                fullWidth
                required
              />
              <TextField
                label="Bericht"
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                fullWidth
                multiline
                rows={6}
                required
              />
              
              <Box sx={{ mt: 2, p: 2, backgroundColor: "grey.50", borderRadius: 1 }}>
                <Typography variant="body2" sx={{ mb: 1.5, fontWeight: 500 }}>
                  Wat meesturen?
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={emailIncludePdfLink}
                        onChange={(e) => setEmailIncludePdfLink(e.target.checked)}
                      />
                    }
                    label="PDF download link"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={emailIncludeCsv}
                        onChange={(e) => setEmailIncludeCsv(e.target.checked)}
                      />
                    }
                    label="CSV download link"
                  />
                </Box>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEmailDialogOpen(false)}>Annuleren</Button>
            <Button
              onClick={async () => {
                // Filter valid email addresses
                const validEmails = emailAddresses
                  .map(email => email.trim())
                  .filter(email => email.length > 0 && email.includes("@"));
                
                if (validEmails.length === 0) {
                  alert("Voer minimaal één geldig email adres in");
                  return;
                }
                if (!emailSubject || !emailBody) {
                  alert("Vul onderwerp en bericht in");
                  return;
                }
                
                // Build email body with selected attachments
                let finalBody = emailBody;
                
                // Add PDF link if selected
                if (emailIncludePdfLink) {
                  let pdfUrl = "";
                  if (emailStatementId) {
                    // For existing statement, use short URL
                    pdfUrl = `${window.location.origin}/api/pdf/${emailStatementId}`;
                  } else if (emailPreviewData) {
                    // For preview, check if we have a statement for this preview data
                    const matchingStatement = statements.find((s: Statement) => 
                      s.clients.name === emailPreviewData.client &&
                      s.period_start === emailPreviewData.period.start &&
                      s.period_end === emailPreviewData.period.end
                    );
                    if (matchingStatement && matchingStatement.pdf_url) {
                      pdfUrl = `${window.location.origin}/api/pdf/${matchingStatement.id}`;
                    } else {
                      // No PDF yet, suggest generating it first
                      pdfUrl = `${window.location.origin}/exports`;
                      finalBody += `\n\nLet op: Genereer eerst de PDF voordat je deze email verstuurt.`;
                    }
                  }
                  if (pdfUrl) {
                    finalBody += `\n\n📎 PDF download: ${pdfUrl}`;
                  }
                }
                
                // Add CSV download link if selected
                // Note: mailto doesn't support attachments, so we provide download links
                if (emailIncludeCsv) {
                  let csvUrl = "";
                  if (emailStatementId) {
                    // For existing statement, create CSV download link
                    csvUrl = `${window.location.origin}/api/csv/${emailStatementId}`;
                  } else if (emailPreviewData) {
                    // For preview, check if we have a statement for this preview data
                    const matchingStatement = statements.find((s: Statement) => 
                      s.clients.name === emailPreviewData.client &&
                      s.period_start === emailPreviewData.period.start &&
                      s.period_end === emailPreviewData.period.end
                    );
                    if (matchingStatement) {
                      csvUrl = `${window.location.origin}/api/csv/${matchingStatement.id}`;
                    } else {
                      csvUrl = `${window.location.origin}/exports`;
                      finalBody += `\n\nLet op: Genereer eerst de export voordat je de CSV link kunt gebruiken.`;
                    }
                  }
                  if (csvUrl) {
                    finalBody += `\n\n📎 CSV download: ${csvUrl}`;
                  }
                }
                
                // Join multiple emails with comma for mailto
                const emailList = validEmails.join(",");
                
                // Properly encode subject and body for mailto links
                const encodedSubject = encodeURIComponent(emailSubject);
                const encodedBody = encodeURIComponent(finalBody)
                  .replace(/%0A/g, '%0D%0A'); // Convert LF (\n) to CRLF (%0D%0A)
                
                // Use proper mailto format with encoding
                const mailtoLink = `mailto:${emailList}?subject=${encodedSubject}&body=${encodedBody}`;
                
                // Try to open the mailto link
                try {
                  window.location.href = mailtoLink;
                } catch (error) {
                  // Fallback: create a temporary link element if direct href fails
                  const link = document.createElement('a');
                  link.href = mailtoLink;
                  link.click();
                }
                
                setEmailDialogOpen(false);
              }}
              variant="contained"
              disabled={emailAddresses.filter(e => e.trim().includes("@")).length === 0 || !emailSubject || !emailBody}
            >
              Open Email Client {emailAddresses.filter(e => e.trim().includes("@")).length > 1 ? `(${emailAddresses.filter(e => e.trim().includes("@")).length} adressen)` : ""}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
}
