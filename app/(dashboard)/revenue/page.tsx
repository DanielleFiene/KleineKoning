/**
 * app/(dashboard)/revenue/page.tsx
 * 
 * Revenue overzicht pagina. Toont bruto inkomsten per klant voor een geselecteerde
 * periode (week, maand, kwartaal, jaar). Berekent revenue op basis van gewerkte
 * uren en project tarieven (ex BTW).
 */
import { RevenuePageClient } from "./RevenuePageClient";
import { getRevenueByPeriod } from "@/app/actions/revenue";
import {
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

export default async function RevenuePage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; type?: string }>;
}) {
  const params = await searchParams;
  const periodType = params.type || "week";
  const periodOffset = parseInt(params.period || "0", 10);

  const now = new Date();
  let startDate: Date;
  let endDate: Date;

  // Calculate period dates based on type and offset
  switch (periodType) {
    case "month":
      startDate = startOfMonth(subMonths(now, -periodOffset));
      endDate = endOfMonth(subMonths(now, -periodOffset));
      break;
    case "quarter":
      startDate = startOfQuarter(subQuarters(now, -periodOffset));
      endDate = endOfQuarter(subQuarters(now, -periodOffset));
      break;
    case "year":
      startDate = startOfYear(subYears(now, -periodOffset));
      endDate = endOfYear(subYears(now, -periodOffset));
      break;
    default: // week
      startDate = startOfWeek(subWeeks(now, -periodOffset), { weekStartsOn: 1 });
      endDate = endOfWeek(subWeeks(now, -periodOffset), { weekStartsOn: 1 });
  }

  const revenueData = await getRevenueByPeriod(
    startDate.toISOString().split("T")[0],
    endDate.toISOString().split("T")[0]
  );

  return (
    <RevenuePageClient
      initialData={revenueData}
      periodType={periodType}
      periodOffset={periodOffset}
      startDate={startDate.toISOString().split("T")[0]}
      endDate={endDate.toISOString().split("T")[0]}
    />
  );
}
