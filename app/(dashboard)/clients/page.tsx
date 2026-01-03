// app/(dashboard)/clients/page.tsx
import { getClients } from "@/app/actions/clients";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Add, Search } from "@mui/icons-material";
import { ClientSearch } from "@/components/client-search";

export default async function ClientsPage() {
  const clients = await getClients();

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Klanten</h1>
        </div>
        <Link href="/clients/new">
          <Button>
            <Add />
            Nieuwe Klant
          </Button>
        </Link>
      </div>

      {/* Content Card */}
      <Card>
        <CardHeader className="p-4">
          <CardTitle className="text-lg font-medium text-slate-900">Klantenlijst</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <ClientSearch initialClients={clients} />
        </CardContent>
      </Card>
    </div>
  );
}
