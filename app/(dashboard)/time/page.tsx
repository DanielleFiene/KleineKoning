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
    // Parse week parameter without timezone issues
    try {
      const weekDate = parseDateString(params.week);
      if (!isNaN(weekDate.getTime())) {
        // Krijg maandag van deze week
        monday = startOfWeek(weekDate, { weekStartsOn: 1 });
      } else {
        // Invalide datum, gebruik huidige week
        monday = getCurrentWeekMonday();
      }
    } catch (error) {
      // Parse error, gebruik huidige week
      monday = getCurrentWeekMonday();
    }
  } else {
    // Geen week parameter, gebruik huidige week
    monday = getCurrentWeekMonday();
  }
  
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
  
  return (
    <TimeEntriesView
      initialEntries={entries}
      clients={clients}
      weekStart={weekStartString}
    />
  );
}