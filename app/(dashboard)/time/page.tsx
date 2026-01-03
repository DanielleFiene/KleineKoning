import { getTimeEntries } from "@/app/actions/time-entries";
import { getClients } from "@/app/actions/clients";
import { TimeEntriesView } from "@/components/time-entries-view";
import { startOfWeek, endOfWeek, format } from "date-fns";

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
    // Parse week parameter
    const weekDate = new Date(params.week);
    if (!isNaN(weekDate.getTime())) {
      // Krijg maandag van deze week
      monday = startOfWeek(weekDate, { weekStartsOn: 1 });
    } else {
      // Invalide datum, gebruik huidige week
      monday = startOfWeek(new Date(), { weekStartsOn: 1 });
    }
  } else {
    // Geen week parameter, gebruik huidige week
    monday = startOfWeek(new Date(), { weekStartsOn: 1 });
  }
  
  const sunday = endOfWeek(monday, { weekStartsOn: 1 });

  const filters: any = {
    startDate: format(monday, 'yyyy-MM-dd'),
    endDate: format(sunday, 'yyyy-MM-dd'),
  };

  if (params.client_id) {
    filters.clientId = params.client_id;
  }

  if (params.project_id) {
    filters.projectId = params.project_id;
  }

  const entries = await getTimeEntries(filters);
  const clients = await getClients();

  return (
    <TimeEntriesView
      initialEntries={entries}
      clients={clients}
      weekStart={format(monday, 'yyyy-MM-dd')}
    />
  );
}