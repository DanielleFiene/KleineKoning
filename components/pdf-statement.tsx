// components/pdf-statement.tsx
// PDF component for @react-pdf/renderer
import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";

// Register fonts if needed (optional)
// Font.register({
//   family: "Roboto",
//   src: "https://fonts.gstatic.com/s/roboto/v27/KFOmCnqEu92Fr1Mu4mxP.ttf",
// });

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    marginBottom: 10,
    fontWeight: "bold",
  },
  headerText: {
    marginBottom: 5,
    fontSize: 11,
  },
  dayHeader: {
    backgroundColor: "#e9e9e9",
    padding: 8,
    marginTop: 15,
    marginBottom: 5,
    fontWeight: "bold",
    fontSize: 11,
  },
  table: {
    marginBottom: 10,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    paddingVertical: 5,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f5f5f5",
    paddingVertical: 8,
    fontWeight: "bold",
    borderBottomWidth: 2,
    borderBottomColor: "#333",
  },
  tableCell: {
    flex: 1,
    paddingHorizontal: 5,
  },
  tableCellProject: {
    flex: 1.5,
    paddingHorizontal: 5,
  },
  tableCellDescription: {
    flex: 2,
    paddingHorizontal: 5,
  },
  tableCellDuration: {
    flex: 0.8,
    paddingHorizontal: 5,
    textAlign: "right",
  },
  dayTotal: {
    flexDirection: "row",
    paddingVertical: 5,
    fontWeight: "bold",
    backgroundColor: "#f9f9f9",
  },
  total: {
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 2,
    borderTopColor: "#333",
    textAlign: "right",
    fontSize: 14,
    fontWeight: "bold",
  },
});

interface StatementEntry {
  date: string;
  project_name: string;
  description: string;
  duration_minutes: number;
}

interface PDFStatementProps {
  clientName: string;
  statementNumber: string;
  periodStart: string;
  periodEnd: string;
  entries: StatementEntry[];
  totalMinutes: number;
}

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

export function PDFStatement({
  clientName,
  statementNumber,
  periodStart,
  periodEnd,
  entries,
  totalMinutes,
}: PDFStatementProps) {
  // Group entries by date
  const entriesByDate = entries.reduce((acc: Record<string, StatementEntry[]>, entry) => {
    if (!acc[entry.date]) {
      acc[entry.date] = [];
    }
    acc[entry.date].push(entry);
    return acc;
  }, {});

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Urenstaat</Text>
          <Text style={styles.headerText}>
            <Text style={{ fontWeight: "bold" }}>Klant:</Text> {clientName}
          </Text>
          <Text style={styles.headerText}>
            <Text style={{ fontWeight: "bold" }}>Statementnummer:</Text> {statementNumber}
          </Text>
          <Text style={styles.headerText}>
            <Text style={{ fontWeight: "bold" }}>Periode:</Text> {formatDate(periodStart)} - {formatDate(periodEnd)}
          </Text>
          <Text style={styles.headerText}>
            <Text style={{ fontWeight: "bold" }}>Opgesteld op:</Text> {new Date().toLocaleDateString("nl-NL")}
          </Text>
        </View>

        {Object.entries(entriesByDate).map(([date, dayEntries]) => {
          const dayTotal = dayEntries.reduce((sum, e) => sum + e.duration_minutes, 0);
          return (
            <View key={date}>
              <View style={styles.dayHeader}>
                <Text>{formatDate(date)}</Text>
              </View>
              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={styles.tableCellProject}>Project</Text>
                  <Text style={styles.tableCellDescription}>Omschrijving</Text>
                  <Text style={styles.tableCellDuration}>Duur</Text>
                </View>
                {dayEntries.map((entry, idx) => (
                  <View key={idx} style={styles.tableRow}>
                    <Text style={styles.tableCellProject}>{entry.project_name || "-"}</Text>
                    <Text style={styles.tableCellDescription}>{entry.description}</Text>
                    <Text style={styles.tableCellDuration}>{formatDuration(entry.duration_minutes)}</Text>
                  </View>
                ))}
                <View style={styles.dayTotal}>
                  <Text style={[styles.tableCellProject, { fontWeight: "bold" }]}>Dagtotaal</Text>
                  <Text style={[styles.tableCellDescription, { fontWeight: "bold" }]}></Text>
                  <Text style={[styles.tableCellDuration, { fontWeight: "bold" }]}>
                    {formatDuration(dayTotal)}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}

        <View style={styles.total}>
          <Text>Totaal: {formatDuration(totalMinutes)}</Text>
        </View>
      </Page>
    </Document>
  );
}

