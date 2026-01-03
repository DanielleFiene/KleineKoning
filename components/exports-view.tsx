// components/exports-view.tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getTimeEntries } from "@/app/actions/time-entries";
import { createStatement, updateStatementPdfUrl } from "@/app/actions/statements";
import { FileText, Download, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

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
  const [previewData, setPreviewData] = useState<any>(null);
  const [generating, setGenerating] = useState(false);
  const [statements, setStatements] = useState(initialStatements);

  const calculatePeriod = () => {
    const today = new Date();
    let start: Date, end: Date;

    if (periodType === "week") {
      const dayOfWeek = today.getDay();
      const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      start = new Date(today.setDate(diff));
      start.setHours(0, 0, 0, 0);
      end = new Date(start);
      end.setDate(end.getDate() + 6);
      end.setHours(23, 59, 59, 999);
    } else if (periodType === "month") {
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
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
      // Create statement snapshot
      const { statement, client } = await createStatement(
        selectedClient,
        previewData.period.start,
        previewData.period.end,
        previewData.entries
      );

      // Generate PDF
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

      // Update statement with PDF URL
      await updateStatementPdfUrl(statement.id, pdfUrl);

      // Refresh statements list
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

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Exports</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Genereer PDF urenstaten per klant en periode
        </p>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Nieuwe Export</CardTitle>
          <CardDescription>Selecteer klant en periode</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="client">Klant *</Label>
            <Select value={selectedClient} onValueChange={setSelectedClient}>
              <SelectTrigger>
                <SelectValue placeholder="Selecteer klant" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Periode *</Label>
            <Select value={periodType} onValueChange={(v: any) => setPeriodType(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Deze week</SelectItem>
                <SelectItem value="month">Deze maand</SelectItem>
                <SelectItem value="custom">Aangepast</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {periodType === "custom" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start">Van</Label>
                <Input
                  id="start"
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end">Tot</Label>
                <Input
                  id="end"
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                />
              </div>
            </div>
          )}

          <Button onClick={handlePreview} disabled={!selectedClient}>
            Preview
          </Button>
        </CardContent>
      </Card>

      {previewData && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>
              {previewData.client} - {format(new Date(previewData.period.start), "d MMM", { locale: nl })} tot{" "}
              {format(new Date(previewData.period.end), "d MMM yyyy", { locale: nl })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.keys(entriesByDate).length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Geen entries in deze periode
                </p>
              ) : (
                <>
                  {Object.entries(entriesByDate).map(([date, dayEntries]: [string, any]) => {
                    const dayTotal = dayEntries.reduce(
                      (sum: number, e: any) => sum + e.duration_minutes,
                      0
                    );
                    return (
                      <div key={date} className="space-y-2">
                        <div className="flex flex-col sm:flex-row sm:justify-between gap-2 font-semibold">
                          <span className="text-sm sm:text-base">{format(new Date(date), "EEEE d MMMM", { locale: nl })}</span>
                          <span className="text-sm sm:text-base">{formatDuration(dayTotal)}</span>
                        </div>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Project</TableHead>
                                <TableHead className="hidden md:table-cell">Omschrijving</TableHead>
                                <TableHead className="text-right">Duur</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {dayEntries.map((entry: any) => (
                                <TableRow key={entry.id}>
                                  <TableCell className="font-medium">
                                    {entry.projects?.name || "-"}
                                    <div className="text-xs text-muted-foreground md:hidden mt-1">
                                      {entry.description}
                                    </div>
                                  </TableCell>
                                  <TableCell className="hidden md:table-cell">{entry.description}</TableCell>
                                  <TableCell className="text-right">
                                    {formatDuration(entry.duration_minutes)}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    );
                  })}
                  <div className="pt-4 border-t">
                    <div className="flex justify-between font-bold text-base sm:text-lg">
                      <span>Totaal</span>
                      <span>
                        {formatDuration(
                          previewData.entries.reduce(
                            (sum: number, e: any) => sum + e.duration_minutes,
                            0
                          )
                        )}
                      </span>
                    </div>
                  </div>
                  <Button
                    onClick={handleGeneratePDF}
                    disabled={generating}
                    className="w-full"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        PDF genereren...
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4 mr-2" />
                        Genereer PDF
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Gegenereerde Statements</CardTitle>
          <CardDescription>Alle gegenereerde urenstaten</CardDescription>
        </CardHeader>
        <CardContent>
          {statements.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nog geen statements gegenereerd
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Statement #</TableHead>
                    <TableHead className="hidden md:table-cell">Klant</TableHead>
                    <TableHead className="hidden lg:table-cell">Periode</TableHead>
                    <TableHead className="hidden lg:table-cell">Gegenereerd op</TableHead>
                    <TableHead className="text-right">Acties</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {statements.map((statement) => (
                    <TableRow key={statement.id}>
                      <TableCell className="font-medium">
                        {statement.statement_number}
                        <div className="text-xs text-muted-foreground md:hidden mt-1">
                          {statement.clients.name}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{statement.clients.name}</TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {format(new Date(statement.period_start), "d MMM", { locale: nl })} -{" "}
                        {format(new Date(statement.period_end), "d MMM yyyy", { locale: nl })}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {format(new Date(statement.generated_at), "d MMM yyyy HH:mm", { locale: nl })}
                      </TableCell>
                      <TableCell className="text-right">
                        {statement.pdf_url ? (
                          <a href={statement.pdf_url} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" size="sm" className="w-full sm:w-auto">
                              <Download className="h-4 w-4 sm:mr-2" />
                              <span className="hidden sm:inline">Download</span>
                            </Button>
                          </a>
                        ) : (
                          <span className="text-sm text-muted-foreground">Geen PDF</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

