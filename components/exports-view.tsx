"use client";

import { useState } from "react";
import { getTimeEntries } from "@/app/actions/time-entries";
import { createStatement, updateStatementPdfUrl } from "@/app/actions/statements";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { nl } from "date-fns/locale";
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
} from "@mui/material";
import { ContentCopy, Download } from "@mui/icons-material";

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
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [groupByDay, setGroupByDay] = useState(true);
  const [showProjectColumn, setShowProjectColumn] = useState(true);
  const [previewData, setPreviewData] = useState<any>(null);
  const [generating, setGenerating] = useState(false);
  const [statements, setStatements] = useState(initialStatements);

  const calculatePeriod = () => {
    const today = new Date();
    let start: Date, end: Date;

    if (periodType === "week") {
      start = startOfWeek(today, { weekStartsOn: 1 });
      end = endOfWeek(start, { weekStartsOn: 1 });
    } else if (periodType === "month") {
      start = startOfMonth(today);
      end = endOfMonth(today);
    } else {
      start = new Date(customStart);
      end = new Date(customEnd);
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

    const period = calculatePeriod();
    if (periodType === "custom" && (!customStart || !customEnd)) {
      alert("Vul beide datums in");
      return;
    }

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

      const { pdfUrl } = await response.json();
      await updateStatementPdfUrl(statement.id, pdfUrl);

      const statementsResponse = await fetch("/api/statements");
      const newStatements = await statementsResponse.json();
      setStatements(newStatements);

      alert("PDF gegenereerd! Je kunt het nu downloaden.");
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
              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                <TextField
                  id="custom-start"
                  label="Van"
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{ maxWidth: 200 }}
                />
                <TextField
                  id="custom-end"
                  label="Tot"
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{ maxWidth: 200 }}
                />
              </Box>
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
              <Box sx={{ p: 2, backgroundColor: "grey.50", borderRadius: 1 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Header</Typography>
                <Typography variant="body2">Klant: {previewData.client}</Typography>
                <Typography variant="body2">
                  Periode: {format(new Date(previewData.period.start), "d MMM", { locale: nl })} -{" "}
                  {format(new Date(previewData.period.end), "d MMM yyyy", { locale: nl })}
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
              <Box>
                <Button
                  onClick={handleGeneratePDF}
                  disabled={generating}
                  variant="contained"
                  startIcon={generating ? undefined : <Download />}
                >
                  {generating ? "PDF genereren..." : "Genereer PDF"}
                </Button>
              </Box>
            </Box>
          </Paper>
        )}

        {/* Statement lijst */}
        <Paper elevation={1} sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
            Gegenereerde Statements
          </Typography>
          {statements.length === 0 ? (
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
                  {statements.map((statement) => (
                    <TableRow key={statement.id}>
                      <TableCell>{statement.statement_number}</TableCell>
                      <TableCell>{statement.clients.name}</TableCell>
                      <TableCell>
                        {format(new Date(statement.period_start), "d MMM", { locale: nl })} -{" "}
                        {format(new Date(statement.period_end), "d MMM yyyy", { locale: nl })}
                      </TableCell>
                      <TableCell>
                        {format(new Date(statement.generated_at), "d MMM yyyy HH:mm", { locale: nl })}
                      </TableCell>
                      <TableCell>
                        {statement.pdf_url ? (
                          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
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
                              onClick={() => {
                                navigator.clipboard.writeText(statement.pdf_url || "");
                                alert("Link gekopieerd!");
                              }}
                              title="Kopieer link"
                            >
                              <ContentCopy fontSize="small" />
                            </IconButton>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            Geen PDF
                          </Typography>
                        )}
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
