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
import { Plus, Search } from "lucide-react";
import { ClientSearch } from "@/components/client-search";

export default async function ClientsPage() {
  const clients = await getClients();

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Klanten</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Beheer je klanten en hun BTW-profielen
          </p>
        </div>
        <Link href="/clients/new">
          <Button className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Nieuwe Klant
          </Button>
        </Link>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Klantenlijst</CardTitle>
          <CardDescription>
            Alle klanten die je hebt toegevoegd
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ClientSearch initialClients={clients} />
        </CardContent>
      </Card>
    </div>
  );
}
