/**
 * app/(dashboard)/time/page.tsx
 * 
 * Time entries dashboard pagina. Toont TimeEntriesView component met weekoverzicht,
 * filters, en timer functionaliteit. Server component die data ophaalt en doorgeeft.
 */
import { getTimeEntries } from "@/app/actions/time-entries";
import { getClients } from "@/app/actions/clients";
import { TimeEntriesView } from "@/components/time-entries-view";
import { startOfWeek, endOfWeek, format } from "date-fns";
import { getCurrentWeekMonday, parseDateString } from "@/lib/utils/date";

export const runtime = 'edge';

export default async function TimePage({
  searchParams,
}: {
  searchParams: Promise<{
    week?: string;
    client_id?: string;
    project_id?: string;
  }>;
}) {
  const params = await searchParams;
  
  // Bereken de maandag van de week
  let monday: Date;
  
  if (params.week) {
    console.log("[TimePage] DEBUG: week parameter found:", params.week);
    // Parse week parameter without timezone issues
    try {
      const weekDate = parseDateString(params.week);
      console.log("[TimePage] DEBUG: parsed weekDate:", {
        weekDate: weekDate.toString(),
        weekDateISO: weekDate.toISOString(),
        isValid: !isNaN(weekDate.getTime()),
      });
      if (!isNaN(weekDate.getTime())) {
        // Krijg maandag van deze week
        monday = startOfWeek(weekDate, { weekStartsOn: 1 });
        console.log("[TimePage] DEBUG: calculated monday:", {
          monday: monday.toString(),
          mondayISO: monday.toISOString(),
        });
      } else {
        // Invalide datum, gebruik huidige week
        console.log("[TimePage] DEBUG: invalid date, using current week");
        monday = getCurrentWeekMonday();
      }
    } catch (error) {
      // Parse error, gebruik huidige week
      console.log("[TimePage] DEBUG: parse error:", error);
      monday = getCurrentWeekMonday();
    }
  } else {
    // Geen week parameter, gebruik huidige week
    console.log("[TimePage] DEBUG: no week parameter, using current week");
    monday = getCurrentWeekMonday();
  }
  
  console.log("[TimePage] DEBUG: final monday:", {
    monday: monday.toString(),
    mondayISO: monday.toISOString(),
    formatted: format(monday, 'yyyy-MM-dd'),
  });
  
  const sunday = endOfWeek(monday, { weekStartsOn: 1 });

  // Format dates using local components to avoid timezone issues
  const formatLocalDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const filters: any = {
    startDate: formatLocalDate(monday),
    endDate: formatLocalDate(sunday),
  };

  if (params.client_id) {
    filters.clientId = params.client_id;
  }

  if (params.project_id) {
    filters.projectId = params.project_id;
  }

  const entries = await getTimeEntries(filters);
  const clients = await getClients();

  const weekStartString = format(monday, 'yyyy-MM-dd');
  console.log("[TimePage] Final weekStart string:", weekStartString);
  
  return (
    <TimeEntriesView
      initialEntries={entries}
      clients={clients}
      weekStart={weekStartString}
    />
  );
}