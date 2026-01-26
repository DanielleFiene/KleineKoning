/**
 * lib/utils/pdf-html.ts
 * 
 * HTML template generator voor PDF urenstaten. Genereert HTML templates die kunnen worden
 * gebruikt voor PDF generatie. Edge Runtime compatible (geen browser-only APIs).
 */

function formatDate(dateStr: string): string {
  try {
    const [year, month, day] = dateStr.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    const months = [
      "januari",
      "februari",
      "maart",
      "april",
      "mei",
      "juni",
      "juli",
      "augustus",
      "september",
      "oktober",
      "november",
      "december",
    ];
    return `${day} ${months[month - 1]} ${year}`;
  } catch {
    return dateStr;
  }
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}u ${mins}min` : `${hours}u`;
}

interface StatementEntry {
  date: string;
  project_name: string;
  description: string;
  duration_minutes: number;
}

export function generateStatementHTML(
  clientName: string,
  statementNumber: string,
  periodStart: string,
  periodEnd: string,
  entries: StatementEntry[],
  totalMinutes: number
): string {
  // Group entries by date
  const entriesByDate = entries.reduce((acc: Record<string, StatementEntry[]>, entry) => {
    if (!acc[entry.date]) {
      acc[entry.date] = [];
    }
    acc[entry.date].push(entry);
    return acc;
  }, {});

  const today = new Date().toLocaleDateString("nl-NL");

  const dayRows = Object.entries(entriesByDate)
    .map(([date, dayEntries]) => {
      const dayTotal = dayEntries.reduce((sum, e) => sum + e.duration_minutes, 0);
      const entryRows = dayEntries
        .map(
          (entry) => `
        <tr>
          <td>${entry.project_name || "-"}</td>
          <td>${entry.description}</td>
          <td style="text-align: right;">${formatDuration(entry.duration_minutes)}</td>
        </tr>
      `
        )
        .join("");

      return `
      <tr>
        <td colspan="3" style="background-color: #e9e9e9; padding: 8px; font-weight: bold; margin-top: 15px;">
          ${formatDate(date)}
        </td>
      </tr>
      ${entryRows}
      <tr style="background-color: #f9f9f9; font-weight: bold;">
        <td>Dagtotaal</td>
        <td></td>
        <td style="text-align: right;">${formatDuration(dayTotal)}</td>
      </tr>
    `;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Urenstaat ${statementNumber}</title>
  <style>
    @page {
      size: A4;
      margin: 40px;
    }
    body {
      font-family: Arial, sans-serif;
      font-size: 10pt;
      line-height: 1.4;
      color: #000;
      margin: 0;
      padding: 0;
    }
    .header {
      margin-bottom: 30px;
    }
    .title {
      font-size: 24pt;
      font-weight: bold;
      margin-bottom: 10px;
    }
    .header-text {
      margin-bottom: 5px;
      font-size: 11pt;
    }
    .header-text strong {
      font-weight: bold;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 10px;
    }
    th {
      background-color: #f5f5f5;
      padding: 8px 5px;
      text-align: left;
      font-weight: bold;
      border-bottom: 2px solid #333;
    }
    th:last-child {
      text-align: right;
    }
    td {
      padding: 5px;
      border-bottom: 1px solid #ddd;
    }
    td:last-child {
      text-align: right;
    }
    .total {
      margin-top: 20px;
      padding-top: 15px;
      border-top: 2px solid #333;
      text-align: right;
      font-size: 14pt;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">Urenstaat</div>
    <div class="header-text">
      <strong>Klant:</strong> ${clientName}
    </div>
    <div class="header-text">
      <strong>Statementnummer:</strong> ${statementNumber}
    </div>
    <div class="header-text">
      <strong>Periode:</strong> ${formatDate(periodStart)} - ${formatDate(periodEnd)}
    </div>
    <div class="header-text">
      <strong>Opgesteld op:</strong> ${today}
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Project</th>
        <th>Omschrijving</th>
        <th>Duur</th>
      </tr>
    </thead>
    <tbody>
      ${dayRows}
    </tbody>
  </table>

  <div class="total">
    Totaal: ${formatDuration(totalMinutes)}
  </div>
</body>
</html>`;
}

