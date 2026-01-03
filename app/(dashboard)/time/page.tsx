// app/(dashboard)/time/page.tsx
import { getTimeEntries } from "@/app/actions/time-entries";
import { getClients } from "@/app/actions/clients";
import { TimeEntriesView } from "@/components/time-entries-view";
import { startOfWeek, endOfWeek } from "date-fns";

export default async function TimePage({
  searchParams,
}: {
  searchParams: Promise<{
    week?: string;
    client_id?: string;
    project_id?: string;
  }>;
}) {
  // Await searchParams (Next.js 15+)
  const params = await searchParams;
  
  // Calculate week start (Monday) - always use current date if no week parameter
  const today = new Date();
  let weekStartDate: Date;
  
  if (params.week) {
    // Parse the week parameter as a date
    weekStartDate = new Date(params.week + "T00:00:00"); // Add time to avoid timezone issues
    // Ensure it's a valid date
    if (isNaN(weekStartDate.getTime())) {
      weekStartDate = today;
    } else {
      // Get the Monday of the week parameter
      const weekParamMonday = startOfWeek(weekStartDate, { weekStartsOn: 1 });
      // Get the Monday of the current week
      const currentWeekMonday = startOfWeek(today, { weekStartsOn: 1 });
      
      // If the week parameter is in the past (before current week), use current week instead
      // This ensures we always show the current week by default, not old weeks
      if (weekParamMonday < currentWeekMonday) {
        weekStartDate = today;
      } else {
        // Week is current or future, use it
        weekStartDate = weekStartDate;
      }
    }
  } else {
    // Default to current week - use today's date
    weekStartDate = today;
  }
  
  // Get Monday of the week (week starts on Monday)
  const monday = startOfWeek(weekStartDate, { weekStartsOn: 1 });
  const sunday = endOfWeek(monday, { weekStartsOn: 1 });

  const filters: any = {
    startDate: monday.toISOString().split("T")[0],
    endDate: sunday.toISOString().split("T")[0],
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
      weekStart={monday.toISOString().split("T")[0]}
    />
  );
}
