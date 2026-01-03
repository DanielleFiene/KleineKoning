// components/exports-view.tsx
"use client";

import { useState } from "react";
import { getTimeEntries } from "@/app/actions/time-entries";
import { createStatement, updateStatementPdfUrl } from "@/app/actions/statements";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
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
    <div>
      <div>
        <h1>Export</h1>
        <p>Genereer PDF urenstaten per klant en periode</p>
      </div>

      {/* Selectieblok */}
      <div>
        <div>
          <div>Nieuwe Export</div>
          <div>Selecteer klant en periode</div>
        </div>
        <div>
          <div>
            <label htmlFor="export-client">Klant *</label>
            <select
              id="export-client"
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              required
            >
              <option value="">Selecteer klant</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label>Periode *</label>
            <select
              value={periodType}
              onChange={(e) => setPeriodType(e.target.value as "week" | "month" | "custom")}
            >
              <option value="week">Week</option>
              <option value="month">Maand</option>
              <option value="custom">Aangepast</option>
            </select>
          </div>

          {periodType === "custom" && (
            <div>
              <div>
                <label htmlFor="custom-start">Van</label>
                <input
                  id="custom-start"
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="custom-end">Tot</label>
                <input
                  id="custom-end"
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                />
              </div>
            </div>
          )}

          <div>
            <label>
              <input
                type="checkbox"
                checked={groupByDay}
                onChange={(e) => setGroupByDay(e.target.checked)}
              />
              Groeperen per dag
            </label>
            <label>
              <input
                type="checkbox"
                checked={showProjectColumn}
                onChange={(e) => setShowProjectColumn(e.target.checked)}
              />
              Toon projectkolom
            </label>
          </div>

          <button onClick={handlePreview} disabled={!selectedClient}>
            Preview
          </button>
        </div>
      </div>

      {/* Preview */}
      {previewData && (
        <div>
          <div>
            <div>Preview</div>
            <div>
              {previewData.client} - {format(new Date(previewData.period.start), "d MMM", { locale: nl })} tot{" "}
              {format(new Date(previewData.period.end), "d MMM yyyy", { locale: nl })}
            </div>
          </div>
          <div>
            <div>
              <div>Header</div>
              <div>Klant: {previewData.client}</div>
              <div>
                Periode: {format(new Date(previewData.period.start), "d MMM", { locale: nl })} -{" "}
                {format(new Date(previewData.period.end), "d MMM yyyy", { locale: nl })}
              </div>
              <div>Opgesteld op: {format(new Date(), "d MMMM yyyy", { locale: nl })}</div>
            </div>

            {Object.keys(entriesByDate).length === 0 ? (
              <div>
                <p>Geen entries in deze periode</p>
              </div>
            ) : (
              <div>
                {Object.entries(entriesByDate).map(([date, dayEntries]: [string, any]) => {
                  const dayTotal = dayEntries.reduce(
                    (sum: number, e: any) => sum + e.duration_minutes,
                    0
                  );
                  return (
                    <div key={date}>
                      <div>
                        <div>{format(new Date(date), "EEEE d MMMM", { locale: nl })}</div>
                        <div>Totaal: {formatDuration(dayTotal)}</div>
                      </div>
                      <div>
                        <table>
                          <thead>
                            <tr>
                              {showProjectColumn && <th>Project</th>}
                              <th>Omschrijving</th>
                              <th>Duur</th>
                            </tr>
                          </thead>
                          <tbody>
                            {dayEntries.map((entry: any) => (
                              <tr key={entry.id}>
                                {showProjectColumn && <td>{entry.projects?.name || "-"}</td>}
                                <td>{entry.description}</td>
                                <td>{formatDuration(entry.duration_minutes)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
                <div>
                  <div>
                    <span>Periodetotaal</span>
                    <span>{formatDuration(periodTotal)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Acties */}
            <div>
              <button onClick={handleGeneratePDF} disabled={generating}>
                {generating ? "PDF genereren..." : "Genereer PDF"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Statement lijst */}
      <div>
        <div>
          <div>Gegenereerde Statements</div>
          <div>Alle gegenereerde urenstaten</div>
        </div>
        <div>
          {statements.length === 0 ? (
            <p>Nog geen statements gegenereerd</p>
          ) : (
            <div>
              <table>
                <thead>
                  <tr>
                    <th>Statement #</th>
                    <th>Klant</th>
                    <th>Periode</th>
                    <th>Aangemaakt op</th>
                    <th>Acties</th>
                  </tr>
                </thead>
                <tbody>
                  {statements.map((statement) => (
                    <tr key={statement.id}>
                      <td>{statement.statement_number}</td>
                      <td>{statement.clients.name}</td>
                      <td>
                        {format(new Date(statement.period_start), "d MMM", { locale: nl })} -{" "}
                        {format(new Date(statement.period_end), "d MMM yyyy", { locale: nl })}
                      </td>
                      <td>
                        {format(new Date(statement.generated_at), "d MMM yyyy HH:mm", { locale: nl })}
                      </td>
                      <td>
                        {statement.pdf_url ? (
                          <div>
                            <a href={statement.pdf_url} target="_blank" rel="noopener noreferrer">
                              Download PDF
                            </a>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(statement.pdf_url || "");
                                alert("Link gekopieerd!");
                              }}
                            >
                              Kopieer link
                            </button>
                          </div>
                        ) : (
                          <span>Geen PDF</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
