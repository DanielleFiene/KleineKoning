/**
 * app/(dashboard)/revenue/RevenuePageClient.tsx
 * 
 * Client component voor revenue overzicht. Bevat filtering, tabel weergave,
 * per project breakdown en CSV export functionaliteit.
 */
"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  endOfQuarter,
  startOfYear,
  endOfYear,
  subWeeks,
  subMonths,
  subQuarters,
  subYears,
} from "date-fns";
import { nl } from "date-fns/locale";
import {
  Container,
  Box,
  Paper,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Collapse,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Checkbox,
  FormControlLabel,
  CircularProgress,
} from "@mui/material";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Download,
  Mail,
  FileText,
  Plus,
  Trash2,
} from "lucide-react";
import { useToast } from "@/components/toast-provider";
import { InfoIcon } from "@/components/info-icon";
import type { RevenueEntry } from "@/app/actions/revenue";

export default function RevenuePageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set());
  const [data, setData] = useState<RevenueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodType, setPeriodType] = useState<string>("week");
  const [periodOffset, setPeriodOffset] = useState<number>(0);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailAddresses, setEmailAddresses] = useState<string[]>([""]);
  const [customMessage, setCustomMessage] = useState("");
  const [includePdf, setIncludePdf] = useState(true);
  const [includeCsv, setIncludeCsv] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  // Load data when period changes
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/revenue?startDate=${startDate}&endDate=${endDate}`
        );
        if (!response.ok) {
          throw new Error("Fout bij ophalen data");
        }
        const revenueData = await response.json();
        setData(revenueData);
      } catch (error) {
        toast.showError("Fout bij ophalen data: " + (error as Error).message);
      } finally {
        setLoading(false);
      }
    }

    if (startDate && endDate) {
      loadData();
    }
  }, [startDate, endDate, toast]);

  // Calculate period dates from search params
  useEffect(() => {
    const type = searchParams.get("type") || "week";
    const offset = parseInt(searchParams.get("period") || "0", 10);
    
    setPeriodType(type);
    setPeriodOffset(offset);

    // Get current date using local date components to avoid timezone issues
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const day = today.getDate();
    const now = new Date(year, month, day); // Local date at midnight
    
    let start: Date;
    let end: Date;

    switch (type) {
      case "month":
        start = startOfMonth(subMonths(now, offset));
        end = endOfMonth(subMonths(now, offset));
        break;
      case "quarter":
        start = startOfQuarter(subQuarters(now, offset));
        end = endOfQuarter(subQuarters(now, offset));
        break;
      case "year":
        start = startOfYear(subYears(now, offset));
        end = endOfYear(subYears(now, offset));
        break;
      default: // week
        start = startOfWeek(subWeeks(now, offset), { weekStartsOn: 1 });
        end = endOfWeek(subWeeks(now, offset), { weekStartsOn: 1 });
    }

    // Format dates using local date components to avoid timezone issues
    const formatLocalDate = (date: Date): string => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const d = String(date.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    };

    setStartDate(formatLocalDate(start));
    setEndDate(formatLocalDate(end));
  }, [searchParams]);

  const handlePeriodTypeChange = (type: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("type", type);
    params.set("period", "0");
    router.push(`/revenue?${params.toString()}`);
  };

  const handlePeriodChange = (offset: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", offset.toString());
    router.push(`/revenue?${params.toString()}`);
  };

  const toggleClientExpansion = (clientId: string) => {
    setExpandedClients((prev) => {
      const next = new Set(prev);
      if (next.has(clientId)) {
        next.delete(clientId);
      } else {
        next.add(clientId);
      }
      return next;
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("nl-NL", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatHours = (hours: number) => {
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    
    if (minutes === 0) {
      return `${wholeHours}u`;
    }
    if (wholeHours === 0) {
      return `${minutes}min`;
    }
    return `${wholeHours}u ${minutes}min`;
  };

  const formatPeriodLabel = () => {
    if (!startDate || !endDate) {
      return "Laden...";
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Validate dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return "Ongeldige datum";
    }

    switch (periodType) {
      case "month":
        const monthLabel = format(start, "MMMM yyyy", { locale: nl });
        const weekNumber = format(start, "w", { locale: nl });
        return `${monthLabel} (week ${weekNumber})`;
      case "quarter":
        const quarter = Math.floor(start.getMonth() / 3) + 1;
        const quarterLabel = `Q${quarter} ${format(start, "yyyy", { locale: nl })}`;
        const quarterWeekNumber = format(start, "w", { locale: nl });
        return `${quarterLabel} (week ${quarterWeekNumber})`;
      case "year":
        const yearLabel = format(start, "yyyy", { locale: nl });
        const yearMonth = format(start, "MMMM", { locale: nl });
        return `${yearLabel} (${yearMonth})`;
      default: // week
        const weekLabel = `${format(start, "d MMM", { locale: nl })} - ${format(end, "d MMM yyyy", { locale: nl })}`;
        const weekNum = format(start, "w", { locale: nl });
        return `${weekLabel} (week ${weekNum})`;
    }
  };

  const handleExportCSV = () => {
    const csvRows: string[] = [];
    
    // Header
    csvRows.push("Klant,Project,Uren,Tarief (ex BTW),Inkomsten (ex BTW)");

    // Data
    data.forEach((entry) => {
      if (entry.projects.length === 0) {
        csvRows.push(`"${entry.clientName}",Geen projecten,${entry.totalHours},,`);
      } else {
        entry.projects.forEach((project) => {
          const rate = project.rateExBtw !== null ? project.rateExBtw.toFixed(2) : "";
          csvRows.push(
            `"${entry.clientName}","${project.projectName}",${project.hours},${rate},${project.revenue.toFixed(2)}`
          );
        });
      }
    });

    // Total
    const totalHours = data.reduce((sum, e) => sum + e.totalHours, 0);
    const totalRevenue = data.reduce((sum, e) => sum + e.totalRevenue, 0);
    csvRows.push(`TOTAAL,,${totalHours.toFixed(2)},,${totalRevenue.toFixed(2)}`);

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `inkomsten-${startDate}-${endDate}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.showSuccess("CSV geëxporteerd");
  };

  const handleGeneratePDF = async () => {
    if (data.length === 0) {
      toast.showWarning("Geen data om te exporteren");
      return;
    }

    setGeneratingPdf(true);
    try {
      const response = await fetch("/api/generate-revenue-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          periodType,
          periodLabel: formatPeriodLabel(),
          startDate,
          endDate,
          entries: data,
          totalHours,
          totalRevenue,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "PDF generatie mislukt");
      }

      const result = await response.json();
      const { pdfUrl } = result;

      // Download PDF
      if (pdfUrl) {
        if (pdfUrl.startsWith("data:")) {
          const link = document.createElement("a");
          link.href = pdfUrl;
          link.download = `inkomsten-${startDate}-${endDate}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      }

      toast.showSuccess("PDF gegenereerd en gedownload!");
    } catch (error) {
      toast.showError("Fout bij genereren PDF: " + (error as Error).message);
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleSendEmail = async () => {
    // Parse email addresses
    const parsedEmails = emailAddresses
      .flatMap((email) => email.split(/[,\n]/))
      .map((email) => email.trim())
      .filter((email) => email.length > 0 && email.includes("@"));

    if (parsedEmails.length === 0) {
      toast.showError("Voeg minstens één geldig email adres toe");
      return;
    }

    if (!includePdf && !includeCsv) {
      toast.showError("Selecteer minstens PDF of CSV om te versturen");
      return;
    }

    setSendingEmail(true);
    try {
      // Generate PDF if needed
      let pdfUrl: string | null = null;
      if (includePdf) {
        const pdfResponse = await fetch("/api/generate-revenue-pdf", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            periodType,
            periodLabel: formatPeriodLabel(),
            startDate,
            endDate,
            entries: data,
            totalHours,
            totalRevenue,
          }),
        });

        if (pdfResponse.ok) {
          const pdfResult = await pdfResponse.json();
          pdfUrl = pdfResult.pdfUrl;
        }
      }

      // Generate CSV if needed
      let csvContent: string | null = null;
      if (includeCsv) {
        const csvRows: string[] = [];
        csvRows.push("Klant,Project,Uren,Tarief (ex BTW),Inkomsten (ex BTW)");
        data.forEach((entry) => {
          if (entry.projects.length === 0) {
            csvRows.push(`"${entry.clientName}",Geen projecten,${entry.totalHours},,`);
          } else {
            entry.projects.forEach((project) => {
              const rate = project.rateExBtw !== null ? project.rateExBtw.toFixed(2) : "";
              csvRows.push(
                `"${entry.clientName}","${project.projectName}",${project.hours},${rate},${project.revenue.toFixed(2)}`
              );
            });
          }
        });
        const totalHours = data.reduce((sum, e) => sum + e.totalHours, 0);
        const totalRevenue = data.reduce((sum, e) => sum + e.totalRevenue, 0);
        csvRows.push(`TOTAAL,,${totalHours.toFixed(2)},,${totalRevenue.toFixed(2)}`);
        csvContent = csvRows.join("\n");
      }

      // Send email via API
      const emailResponse = await fetch("/api/send-revenue-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailAddresses: parsedEmails,
          customMessage: customMessage || undefined,
          periodType,
          periodLabel: formatPeriodLabel(),
          startDate,
          endDate,
          includePdf,
          includeCsv,
          pdfUrl,
          csvContent,
        }),
      });

      const result = await emailResponse.json();

      if (result.fallback) {
        // Email service not configured - use mailto links
        const subject = encodeURIComponent(`Inkomsten Overzicht - ${formatPeriodLabel()}`);
        const bodyText = customMessage || `Beste,\n\nHierbij het inkomsten overzicht voor de periode ${formatPeriodLabel()}.\n\nMet vriendelijke groet`;
        const body = encodeURIComponent(bodyText);
        const mailtoLink = `mailto:${parsedEmails.join(",")}?subject=${subject}&body=${body}`;
        window.location.href = mailtoLink;
        toast.showSuccess("Email client wordt geopend");
      } else if (result.success) {
        toast.showSuccess(`Email verstuurd naar ${result.sent} adres(sen)`);
        setEmailDialogOpen(false);
        setEmailAddresses([""]);
        setCustomMessage("");
      } else {
        throw new Error(result.error || "Fout bij versturen email");
      }
    } catch (error) {
      toast.showError("Fout bij versturen email: " + (error as Error).message);
    } finally {
      setSendingEmail(false);
    }
  };

  const totalHours = data.reduce((sum, e) => sum + e.totalHours, 0);
  const totalRevenue = data.reduce((sum, e) => sum + e.totalRevenue, 0);
  const totalRevenueBruto = data.reduce((sum, e) => sum + e.totalRevenueBruto, 0);
  const clientsWithoutRevenue = data.filter((e) => e.totalRevenue === 0).length;
  const hasAnyBtw = data.some((e) => e.btwPercentage > 0);

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3 } }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
          Inkomsten Overzicht
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Bruto inkomsten per klant op basis van gewerkte uren en project tarieven (ex BTW)
        </Typography>
      </Box>

      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Periode Type</InputLabel>
            <Select
              value={periodType}
              onChange={(e) => handlePeriodTypeChange(e.target.value)}
              label="Periode Type"
            >
              <MenuItem value="week">Week</MenuItem>
              <MenuItem value="month">Maand</MenuItem>
              <MenuItem value="quarter">Kwartaal</MenuItem>
              <MenuItem value="year">Jaar</MenuItem>
            </Select>
          </FormControl>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconButton
              size="small"
              onClick={() => handlePeriodChange(periodOffset + 1)}
              title="Vorige periode"
            >
              <ChevronLeft size={20} />
            </IconButton>
            <Typography variant="body1" sx={{ minWidth: 200, textAlign: "center" }}>
              {formatPeriodLabel()}
            </Typography>
            <IconButton
              size="small"
              onClick={() => handlePeriodChange(periodOffset - 1)}
              disabled={periodOffset === 0}
              title="Volgende periode"
            >
              <ChevronRight size={20} />
            </IconButton>
          </Box>

          <Box sx={{ flex: 1 }} />

          <Button
            variant="outlined"
            startIcon={<Download size={18} />}
            onClick={handleExportCSV}
            disabled={data.length === 0}
          >
            Export CSV
          </Button>
          <Button
            variant="outlined"
            startIcon={<FileText size={18} />}
            onClick={handleGeneratePDF}
            disabled={data.length === 0 || generatingPdf}
          >
            {generatingPdf ? "Genereren..." : "Export PDF"}
          </Button>
          <Button
            variant="contained"
            startIcon={<Mail size={18} />}
            onClick={() => setEmailDialogOpen(true)}
            disabled={data.length === 0}
            sx={{
              background: "linear-gradient(90deg, #6366f1 0%, #9333ea 100%)",
              "&:hover": {
                background: "linear-gradient(90deg, #4f46e5 0%, #7e22ce 100%)",
              },
            }}
          >
            Mailen
          </Button>
        </Box>
      </Paper>

      {loading ? (
        <Paper elevation={1} sx={{ p: 4, textAlign: "center" }}>
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "200px" }}>
            <CircularProgress />
          </Box>
        </Paper>
      ) : data.length === 0 ? (
        <Paper elevation={1} sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="body1" color="text.secondary">
            Geen data beschikbaar voor deze periode
          </Typography>
        </Paper>
      ) : (
        <>
          <Paper elevation={1} sx={{ mb: 3 }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: "bold" }}>Klant</TableCell>
                    <TableCell align="right" sx={{ fontWeight: "bold" }}>
                      Totaal Uren
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: "bold" }}>
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 0.5 }}>
                        Inkomsten (netto)
                        <InfoIcon title="Netto = exclusief BTW. Dit is het bedrag zonder BTW." size="small" />
                      </Box>
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: "bold" }}>
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 0.5 }}>
                        Inkomsten (bruto)
                        <InfoIcon title="Bruto = inclusief BTW. Dit is het bedrag met BTW erbij. Alleen zichtbaar als er een BTW percentage is ingesteld." size="small" />
                      </Box>
                    </TableCell>
                    <TableCell width={60}></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.map((entry) => (
                    <React.Fragment key={entry.clientId}>
                      <TableRow
                        hover
                        sx={{
                          backgroundColor:
                            entry.totalRevenue > 0
                              ? "transparent"
                              : "action.hover",
                        }}
                      >
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {entry.clientName}
                            </Typography>
                            {entry.totalRevenue === 0 && (
                              <Chip
                                label="Geen tarief"
                                size="small"
                                color="warning"
                                sx={{ fontSize: "0.7rem", height: 20 }}
                              />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          {formatHours(entry.totalHours)}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: "bold" }}>
                          {entry.totalRevenue > 0
                            ? formatCurrency(entry.totalRevenue)
                            : "-"}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: "bold" }}>
                          {entry.totalRevenueBruto > 0 && entry.btwPercentage > 0
                            ? formatCurrency(entry.totalRevenueBruto)
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {entry.projects.length > 0 && (
                            <IconButton
                              size="small"
                              onClick={() => toggleClientExpansion(entry.clientId)}
                            >
                              {expandedClients.has(entry.clientId) ? (
                                <ChevronUp size={18} />
                              ) : (
                                <ChevronDown size={18} />
                              )}
                            </IconButton>
                          )}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell
                          style={{ paddingBottom: 0, paddingTop: 0 }}
                          colSpan={5}
                        >
                          <Collapse
                            in={expandedClients.has(entry.clientId)}
                            timeout="auto"
                            unmountOnExit
                          >
                            <Box sx={{ margin: 2 }}>
                              <Typography
                                variant="subtitle2"
                                sx={{ fontWeight: 600, mb: 1 }}
                              >
                                Per Project:
                              </Typography>
                              <Table size="small">
                                <TableHead>
                                  <TableRow>
                                    <TableCell>Project</TableCell>
                                    <TableCell align="right">Uren</TableCell>
                                    <TableCell align="right">
                                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 0.5 }}>
                                        Tarief (netto)
                                        <InfoIcon title="Netto = exclusief BTW" size="small" />
                                      </Box>
                                    </TableCell>
                                    <TableCell align="right">
                                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 0.5 }}>
                                        Tarief (bruto)
                                        <InfoIcon title="Bruto = inclusief BTW. Alleen zichtbaar als er een BTW percentage is ingesteld." size="small" />
                                      </Box>
                                    </TableCell>
                                    <TableCell align="right">
                                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 0.5 }}>
                                        Inkomsten (netto)
                                        <InfoIcon title="Netto = exclusief BTW" size="small" />
                                      </Box>
                                    </TableCell>
                                    <TableCell align="right">
                                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 0.5 }}>
                                        Inkomsten (bruto)
                                        <InfoIcon title="Bruto = inclusief BTW. Alleen zichtbaar als er een BTW percentage is ingesteld." size="small" />
                                      </Box>
                                    </TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {entry.projects.map((project) => (
                                    <TableRow key={project.projectId}>
                                      <TableCell>{project.projectName}</TableCell>
                                      <TableCell align="right">
                                        {formatHours(project.hours)}
                                      </TableCell>
                                      <TableCell align="right">
                                        {project.rateExBtw !== null
                                          ? formatCurrency(project.rateExBtw)
                                          : "-"}
                                      </TableCell>
                                      <TableCell align="right">
                                        {project.rateIncBtw !== null && entry.btwPercentage > 0
                                          ? formatCurrency(project.rateIncBtw)
                                          : "-"}
                                      </TableCell>
                                      <TableCell align="right">
                                        {project.revenue > 0
                                          ? formatCurrency(project.revenue)
                                          : "-"}
                                      </TableCell>
                                      <TableCell align="right">
                                        {project.revenueBruto > 0 && entry.btwPercentage > 0
                                          ? formatCurrency(project.revenueBruto)
                                          : "-"}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          <Paper elevation={1} sx={{ p: 2 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 2,
              }}
            >
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Totaal Uren
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {formatHours(totalHours)}
                </Typography>
              </Box>
              <Box sx={{ textAlign: "right" }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">
                    Totale Inkomsten (netto)
                  </Typography>
                  <InfoIcon title="Netto = exclusief BTW. Dit is het totaalbedrag zonder BTW." size="small" />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600, color: "primary.main" }}>
                  {formatCurrency(totalRevenue)}
                </Typography>
              </Box>
              {hasAnyBtw && (
                <Box sx={{ textAlign: "right" }}>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 0.5 }}>
                    <Typography variant="body2" color="text.secondary">
                      Totale Inkomsten (bruto)
                    </Typography>
                    <InfoIcon title="Bruto = inclusief BTW. Dit is het totaalbedrag met BTW erbij." size="small" />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: "secondary.main" }}>
                    {formatCurrency(totalRevenueBruto)}
                  </Typography>
                </Box>
              )}
              {clientsWithoutRevenue > 0 && (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Klanten zonder tarief
                  </Typography>
                  <Typography variant="body2" color="warning.main" sx={{ fontWeight: 500 }}>
                    {clientsWithoutRevenue}
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </>
      )}

      {/* Email Dialog */}
      <Dialog
        open={emailDialogOpen}
        onClose={() => {
          setEmailDialogOpen(false);
          setEmailAddresses([""]);
          setCustomMessage("");
          setIncludePdf(true);
          setIncludeCsv(false);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Verstuur inkomsten overzicht per email</DialogTitle>
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
                  />
                }
                label="PDF"
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
              placeholder="Beste,&#10;&#10;Hierbij het inkomsten overzicht..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setEmailDialogOpen(false);
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
            onClick={handleSendEmail}
            variant="contained"
            disabled={
              sendingEmail ||
              emailAddresses.every((email) => !email.trim() || !email.includes("@"))
            }
            startIcon={<Mail size={18} />}
          >
            {sendingEmail ? "Verzenden..." : "Verstuur"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
