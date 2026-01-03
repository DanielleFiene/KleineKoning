import { getTimeEntries } from "@/app/actions/time-entries";
import { getClients } from "@/app/actions/clients";
import { TimeEntriesView } from "@/components/time-entries-view";

export default async function TimePage({
  searchParams,
}: {
  searchParams: {
    week?: string;
    client_id?: string;
    project_id?: string;
  };
}) {
  // Calculate week start (Monday)
  const weekParam = searchParams.week || new Date().toISOString().split("T")[0];
  const weekDate = new Date(weekParam);
  const dayOfWeek = weekDate.getDay();
  const diff = weekDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust to Monday
  const monday = new Date(weekDate.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const filters: any = {
    startDate: monday.toISOString().split("T")[0],
    endDate: sunday.toISOString().split("T")[0],
  };

  if (searchParams.client_id) {
    filters.clientId = searchParams.client_id;
  }

  if (searchParams.project_id) {
    filters.projectId = searchParams.project_id;
  }

  const entries = await getTimeEntries(filters);
  const clients = await getClients();

  return (
    <TimeEntriesView
      initialEntries={entries}
      clients={clients}
      weekStart={monday.toISOString().split("T")[0]}
    />
  );
}
