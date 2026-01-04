/**
 * components/exports-view.tsx
 * 
 * Component voor het genereren en beheren van urenstaat exports. Gebruikers kunnen
 * statements genereren voor een specifieke klant en periode, PDF/CSV exporteren, en
 * statements per email versturen. Ondersteunt bulk delete en signed URL generatie.
 */
"use client";

import { useState } from "react";
import { getTimeEntries } from "@/app/actions/time-entries";
import { createStatement, updateStatementPdfUrl } from "@/app/actions/statements";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO } from "date-fns";
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { Copy, Download, Mail, Plus, Trash2 } from "lucide-react";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useToast } from "@/components/toast-provider";
import { deleteStatement } from "@/app/actions/statements";

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
  const toast = useToast();
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [periodType, setPeriodType] = useState<"week" | "month" | "custom">("week");
  const [customStart, setCustomStart] = useState<Date | null>(null);
  const [customEnd, setCustomEnd] = useState<Date | null>(null);
  const [groupByDay, setGroupByDay] = useState(true);
  const [showProjectColumn, setShowProjectColumn] = useState(true);
  const [previewData, setPreviewData] = useState<any>(null);
  const [generating, setGenerating] = useState(false);
  const [statements, setStatements] = useState(initialStatements);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [selectedStatement, setSelectedStatement] = useState<Statement | null>(null);
  const [emailAddresses, setEmailAddresses] = useState<string[]>([""]);
  const [customMessage, setCustomMessage] = useState<string>("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [includePdf, setIncludePdf] = useState(true);
  const [includeCsv, setIncludeCsv] = useState(false);
  const [selectedStatements, setSelectedStatements] = useState<Set<string>>(new Set());
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [statementToDelete, setStatementToDelete] = useState<string | null>(null);

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

    return {
      start: start.toISOString().split("T")[0],
      end: end.toISOString().split("T")[0],
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
        toast.showError("Fout: Klant niet gevonden");
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
        const errorData = await response.json();
        throw new Error(errorData.error || "PDF generatie mislukt");
      }

      const result = await response.json();
      const { pdfUrl } = result;
      
      // PDF is always generated now (using pdf-lib, no HTML fallback)
      await updateStatementPdfUrl(statement.id, pdfUrl);
      
      // Refresh statements list
      const statementsResponse = await fetch("/api/statements");
      const newStatements = await statementsResponse.json();
      setStatements(newStatements);
      
      // Automatically download the PDF
      if (pdfUrl) {
        if (pdfUrl.startsWith('data:')) {
          // Base64 data URL - download directly
          const link = document.createElement('a');
          link.href = pdfUrl;
          link.download = `urenstaat_${statement.statement_number}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } else {
          // URL - download via API route for reliability
          const link = document.createElement('a');
          link.href = `/api/pdf/${statement.id}`;
          link.download = `urenstaat_${statement.statement_number}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      }
      
      toast.showSuccess("PDF gegenereerd en gedownload!");
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

  const handleDelete = async (id: string) => {
    try {
      await deleteStatement(id);
      setStatements(statements.filter((s) => s.id !== id));
      setSelectedStatements((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      toast.showSuccess("Statement verwijderd");
    } catch (error: any) {
      toast.showError("Fout bij verwijderen: " + error.message);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedStatements.size === 0) return;
    const count = selectedStatements.size;
    try {
      await Promise.all(Array.from(selectedStatements).map((id) => deleteStatement(id)));
      setStatements(statements.filter((s) => !selectedStatements.has(s.id)));
      setSelectedStatements(new Set());
      toast.showSuccess(`${count} statement(s) verwijderd`);
    } catch (error: any) {
      toast.showError("Fout bij verwijderen: " + error.message);
    }
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

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3 } }}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {/* Page Header */}
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
            Export
          </Typography>
        </Box>

        {/* Selectieblok */}
        <Paper elevation={1} sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
            Nieuwe Export
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
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

            {periodType === "custom" && (
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={nl}>
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
              </LocalizationProvider>
            )}

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
              {previewData.client} - {format(new Date(previewData.period.start), "d MMM", { locale: nl })} tot{" "}
              {format(new Date(previewData.period.end), "d MMM yyyy", { locale: nl })}
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <Box sx={{ p: 2, backgroundColor: "action.hover", borderRadius: 1 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Header</Typography>
                <Typography variant="body2" color="text.primary">Klant: {previewData.client}</Typography>
                <Typography variant="body2" color="text.primary">
                  Periode: {format(new Date(previewData.period.start), "d MMM", { locale: nl })} -{" "}
                  {format(new Date(previewData.period.end), "d MMM yyyy", { locale: nl })}
                </Typography>
                <Typography variant="body2" color="text.primary">Opgesteld op: {format(new Date(), "d MMMM yyyy", { locale: nl })}</Typography>
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
                        <Box sx={{ p: 2, backgroundColor: "action.hover", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
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
                  disabled={generating || !previewData}
                  variant="contained"
                  startIcon={generating ? undefined : <Download />}
                >
                  {generating ? "PDF genereren..." : "Genereer PDF"}
                </Button>
                {previewData && (
                  <>
                    <Button
                      onClick={async () => {
                        if (!previewData || !selectedClient) return;
                        const period = calculatePeriod();
                        try {
                          const entries = await getTimeEntries({
                            clientId: selectedClient,
                            startDate: period.start,
                            endDate: period.end,
                          });
                          // Create temporary statement for CSV export
                          const { statement } = await createStatement(
                            selectedClient,
                            period.start,
                            period.end,
                            entries
                          );
                          // Download CSV
                          window.location.href = `/api/csv/${statement.id}`;
                          toast.showSuccess("CSV wordt gedownload");
                        } catch (error) {
                          toast.showError("Fout bij CSV export: " + (error as Error).message);
                        }
                      }}
                      variant="outlined"
                      startIcon={<Download />}
                    >
                      Exporteer CSV
                    </Button>
                    <Button
                      onClick={async () => {
                        if (!previewData || !selectedClient) return;
                        
                        // Create statement first
                        try {
                          const { statement, client } = await createStatement(
                            selectedClient,
                            previewData.period.start,
                            previewData.period.end,
                            previewData.entries
                          );

                          if (!client) {
                            toast.showError("Fout: Klant niet gevonden");
                            return;
                          }

                          // Check if PDF exists, if not generate it
                          let pdfUrl = null;
                          const existingStatement = statements.find(s => s.id === statement.id);
                          if (existingStatement?.pdf_url) {
                            pdfUrl = existingStatement.pdf_url;
                          } else {
                            // Generate PDF first
                            setGenerating(true);
                            try {
                              const pdfResponse = await fetch("/api/generate-pdf", {
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

                              if (!pdfResponse.ok) {
                                const errorData = await pdfResponse.json();
                                throw new Error(errorData.error || "PDF generatie mislukt");
                              }

                              const pdfResult = await pdfResponse.json();
                              pdfUrl = pdfResult.pdfUrl;
                              await updateStatementPdfUrl(statement.id, pdfUrl);
                            } catch (error: any) {
                              toast.showError("Fout bij genereren PDF: " + error.message);
                              setGenerating(false);
                              return;
                            } finally {
                              setGenerating(false);
                            }
                          }

                          // Create statement object for email dialog
                          const statementForEmail: Statement = {
                            id: statement.id,
                            statement_number: statement.statement_number,
                            period_start: previewData.period.start,
                            period_end: previewData.period.end,
                            generated_at: new Date().toISOString(),
                            pdf_url: pdfUrl,
                            clients: { name: client.name },
                          };

                          // Generate default message
                          const periodStart = format(new Date(previewData.period.start), "d MMMM yyyy", { locale: nl });
                          const periodEnd = format(new Date(previewData.period.end), "d MMMM yyyy", { locale: nl });
                          const defaultMsg = `Beste,\n\nHierbij de urenstaat voor ${client.name} voor de periode ${periodStart} tot ${periodEnd}.\n\nMet vriendelijke groet`;
                          setCustomMessage(defaultMsg);
                          setEmailAddresses([""]);
                          setIncludePdf(!!pdfUrl);
                          setIncludeCsv(false);
                          setSelectedStatement(statementForEmail);
                          setEmailDialogOpen(true);

                          // Refresh statements list
                          const statementsResponse = await fetch("/api/statements");
                          const newStatements = await statementsResponse.json();
                          setStatements(newStatements);
                        } catch (error: any) {
                          toast.showError("Fout: " + error.message);
                        }
                      }}
                      variant="outlined"
                      disabled={generating || !previewData}
                      startIcon={<Mail size={18} />}
                    >
                      Mailen
                    </Button>
                  </>
                )}
              </Box>
            </Box>
          </Paper>
        )}

        {/* Statement lijst */}
        <Paper elevation={1} sx={{ p: 3 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Gegenereerde Statements
            </Typography>
            {selectedStatements.size > 0 && (
              <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                <Typography variant="body2" color="text.secondary">
                  {selectedStatements.size} geselecteerd
                </Typography>
                <Button
                  size="small"
                  color="error"
                  variant="outlined"
                                startIcon={<Trash2 size={18} />}
                  onClick={() => {
                    const message = `Weet je zeker dat je ${selectedStatements.size} statement(s) wilt verwijderen?\n\n⚠️ Let op: Deze actie kan niet ongedaan worden gemaakt. Controleer of je voldoet aan de bewaarplicht voor administratieve gegevens (minimaal 7 jaar voor de belastingdienst). Zorg voor een backup voordat je verwijdert.`;
                    if (confirm(message)) {
                      handleBulkDelete();
                    }
                  }}
                >
                  Verwijder geselecteerd
                </Button>
              </Box>
            )}
          </Box>
          {statements.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Nog geen statements gegenereerd
            </Typography>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox" width={50}>
                      <Checkbox
                        checked={statements.length > 0 && statements.every((s) => selectedStatements.has(s.id))}
                        indeterminate={
                          statements.some((s) => selectedStatements.has(s.id)) &&
                          !statements.every((s) => selectedStatements.has(s.id))
                        }
                        onChange={() => {
                          if (selectedStatements.size === statements.length) {
                            setSelectedStatements(new Set());
                          } else {
                            setSelectedStatements(new Set(statements.map((s) => s.id)));
                          }
                        }}
                        size="small"
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Statement #</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Klant</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Periode</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Aangemaakt op</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Acties</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {statements.map((statement) => (
                    <TableRow key={statement.id}>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedStatements.has(statement.id)}
                          onChange={() => {
                            setSelectedStatements((prev) => {
                              const next = new Set(prev);
                              if (next.has(statement.id)) {
                                next.delete(statement.id);
                              } else {
                                next.add(statement.id);
                              }
                              return next;
                            });
                          }}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{statement.statement_number}</TableCell>
                      <TableCell>{statement.clients.name}</TableCell>
                      <TableCell>
                        {format(parseDateString(statement.period_start), "d MMM", { locale: nl })} -{" "}
                        {format(parseDateString(statement.period_end), "d MMM yyyy", { locale: nl })}
                      </TableCell>
                      <TableCell>
                        {format(new Date(statement.generated_at), "d MMM yyyy HH:mm", { locale: nl })}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
                          {statement.pdf_url ? (
                            <>
                              <Button
                                size="small"
                                startIcon={<Download size={18} />}
                                onClick={() => {
                                  // Use API route for reliable PDF download
                                  window.open(`/api/pdf/${statement.id}`, '_blank');
                                }}
                                variant="outlined"
                                sx={{ minWidth: 'auto' }}
                              >
                                PDF
                              </Button>
                              <IconButton
                                size="small"
                                onClick={async () => {
                                  try {
                                    // Get signed URL with expiration (7 days)
                                    const response = await fetch(`/api/pdf/${statement.id}/signed`);
                                    if (response.ok) {
                                      const data = await response.json();
                                      navigator.clipboard.writeText(data.signedUrl);
                                      toast.showSuccess(`Link gekopieerd! (geldig tot ${new Date(data.expiresAt).toLocaleDateString('nl-NL')})`);
                                    } else {
                                      // Fallback to regular API route if signed URL fails
                                      const pdfUrl = `${window.location.origin}/api/pdf/${statement.id}`;
                                      navigator.clipboard.writeText(pdfUrl);
                                      toast.showSuccess("Link gekopieerd!");
                                    }
                                  } catch (error) {
                                    // Fallback to regular API route on error
                                    const pdfUrl = `${window.location.origin}/api/pdf/${statement.id}`;
                                    navigator.clipboard.writeText(pdfUrl);
                                    toast.showSuccess("Link gekopieerd!");
                                  }
                                }}
                                title="Kopieer link (7 dagen geldig)"
                              >
                                <Copy size={18} />
                              </IconButton>
                              <Button
                                size="small"
                                startIcon={<Mail size={18} />}
                                onClick={() => {
                                  setSelectedStatement(statement);
                                  // Generate default message
                                  const periodStart = format(parseDateString(statement.period_start), "d MMMM yyyy", { locale: nl });
                                  const periodEnd = format(parseDateString(statement.period_end), "d MMMM yyyy", { locale: nl });
                                  const clientName = statement.clients.name;
                                  const defaultMsg = `Beste,\n\nHierbij de urenstaat voor ${clientName} voor de periode ${periodStart} tot ${periodEnd}.\n\nMet vriendelijke groet`;
                                  setCustomMessage(defaultMsg);
                                  setEmailAddresses([""]);
                                  setIncludePdf(!!statement.pdf_url);
                                  setIncludeCsv(true);
                                  setEmailDialogOpen(true);
                                }}
                                variant="outlined"
                              >
                                Mailen
                              </Button>
                            </>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              Geen PDF
                            </Typography>
                          )}
                          <Button
                            size="small"
                            startIcon={<Download />}
                            onClick={() => {
                              window.open(`/api/csv/${statement.id}`, '_blank');
                            }}
                            variant="outlined"
                            sx={{ minWidth: 'auto' }}
                          >
                            CSV
                          </Button>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => {
                              setStatementToDelete(statement.id);
                              setDeleteConfirmOpen(true);
                            }}
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
        </Paper>

        {/* Email Dialog */}
        <Dialog
          open={emailDialogOpen}
          onClose={() => {
            setEmailDialogOpen(false);
            setSelectedStatement(null);
            setEmailAddresses([""]);
            setCustomMessage("");
          }}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Verstuur urenstaat per email</DialogTitle>
          <DialogContent>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3, pt: 2 }}>
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Email adressen (één per regel of gescheiden door komma's)
                </Typography>
                {emailAddresses.map((email, index) => (
                  <Box key={index} sx={{ display: "flex", gap: 1, mb: 1 }}>
                    <TextField
                      fullWidth
                      type="email"
                      placeholder="email@voorbeeld.nl"
                      value={email}
                      onChange={(e) => {
                        const newEmails = [...emailAddresses];
                        newEmails[index] = e.target.value;
                        setEmailAddresses(newEmails);
                      }}
                      size="small"
                    />
                    {emailAddresses.length > 1 && (
                      <IconButton
                        onClick={() => {
                          setEmailAddresses(emailAddresses.filter((_, i) => i !== index));
                        }}
                        size="small"
                      >
                        <Trash2 size={18} />
                      </IconButton>
                    )}
                  </Box>
                ))}
                <Button
                                startIcon={<Plus size={18} />}
                  onClick={() => setEmailAddresses([...emailAddresses, ""])}
                  size="small"
                  sx={{ mt: 1, color: "text.primary" }}
                >
                  Voeg email adres toe
                </Button>
              </Box>

              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Bijlagen
                </Typography>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={includePdf}
                      onChange={(e) => setIncludePdf(e.target.checked)}
                      disabled={!selectedStatement?.pdf_url}
                    />
                  }
                  label={`PDF${!selectedStatement?.pdf_url ? ' (nog niet gegenereerd)' : ''}`}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={includeCsv}
                      onChange={(e) => setIncludeCsv(e.target.checked)}
                    />
                  }
                  label="CSV"
                />
              </Box>

              <TextField
                fullWidth
                multiline
                rows={6}
                label="Bericht"
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Beste,&#10;&#10;Hierbij de urenstaat..."
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setEmailDialogOpen(false);
                setSelectedStatement(null);
                setEmailAddresses([""]);
                setCustomMessage("");
                setIncludePdf(true);
                setIncludeCsv(false);
              }}
              sx={{ color: "text.primary" }}
            >
              Annuleren
            </Button>
            <Button
              onClick={async () => {
                if (!selectedStatement) return;
                
                // Check if at least one attachment is selected
                if (!includePdf && !includeCsv) {
                  toast.showError("Selecteer minstens PDF of CSV om te versturen");
                  return;
                }

                // If only PDF is selected but doesn't exist, show error
                if (includePdf && !includeCsv && !selectedStatement.pdf_url) {
                  toast.showError("PDF is nog niet gegenereerd. Selecteer ook CSV of genereer eerst de PDF.");
                  setSendingEmail(false);
                  return;
                }
                
                // If PDF is selected but doesn't exist, just skip it and send CSV
                if (includePdf && !selectedStatement.pdf_url) {
                  toast.showWarning("PDF is nog niet gegenereerd. Alleen CSV wordt verstuurd.");
                  setIncludePdf(false);
                  // Continue with CSV only
                }
                
                // Parse email addresses (split by comma or newline)
                const parsedEmails = emailAddresses
                  .flatMap((email) => email.split(/[,\n]/))
                  .map((email) => email.trim())
                  .filter((email) => email.length > 0 && email.includes("@"));

                if (parsedEmails.length === 0) {
                  toast.showError("Voeg minstens één geldig email adres toe");
                  setSendingEmail(false);
                  return;
                }

                setSendingEmail(true);
                try {
                  const response = await fetch("/api/send-statement-email", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      statementId: selectedStatement.id,
                      emailAddresses: parsedEmails,
                      customMessage: customMessage || undefined,
                      includePdf: includePdf && selectedStatement.pdf_url,
                      includeCsv: includeCsv,
                    }),
                  });

                  const result = await response.json();

                  if (result.fallback) {
                    // Email service not configured - use mailto links
                    const subject = encodeURIComponent(result.emailData.subject);
                    // Body already contains attachment links, no need to add them again
                    const bodyText = result.emailData.body;
                    const body = encodeURIComponent(bodyText);
                    const mailtoLink = `mailto:${parsedEmails.join(",")}?subject=${subject}&body=${body}`;
                    window.location.href = mailtoLink;
                    toast.showSuccess("Email client wordt geopend");
                  } else if (result.success) {
                    toast.showSuccess(`Email verstuurd naar ${result.sent} adres(sen)`);
                    setEmailDialogOpen(false);
                    setSelectedStatement(null);
                    setEmailAddresses([""]);
                    setCustomMessage("");
                  } else {
                    throw new Error(result.error || "Fout bij versturen email");
                  }
                } catch (error: any) {
                  toast.showError("Fout bij versturen email: " + error.message);
                } finally {
                  setSendingEmail(false);
                }
              }}
              variant="contained"
              disabled={sendingEmail || emailAddresses.every(email => !email.trim() || !email.includes("@"))}
              startIcon={<Mail size={18} />}
            >
              {sendingEmail ? "Verzenden..." : "Verstuur"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteConfirmOpen}
          onClose={() => {
            setDeleteConfirmOpen(false);
            setStatementToDelete(null);
          }}
        >
          <DialogTitle>Statement verwijderen?</DialogTitle>
          <DialogContent>
            <Typography sx={{ mb: 2 }}>
              Weet je zeker dat je dit statement wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt en alle gegevens worden permanent verwijderd.
            </Typography>
            <Typography variant="body2" color="warning.main" sx={{ fontWeight: 600 }}>
              ⚠️ Let op: Controleer of je voldoet aan de bewaarplicht voor administratieve gegevens (minimaal 7 jaar voor de belastingdienst). Zorg voor een backup voordat je verwijdert.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setDeleteConfirmOpen(false);
                setStatementToDelete(null);
              }}
            >
              Annuleren
            </Button>
            <Button
              onClick={async () => {
                if (statementToDelete) {
                  await handleDelete(statementToDelete);
                  setDeleteConfirmOpen(false);
                  setStatementToDelete(null);
                }
              }}
              color="error"
              variant="contained"
            >
              Verwijderen
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
}