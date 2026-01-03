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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Klanten</h1>
          <p className="text-muted-foreground">
            Beheer je klanten en hun BTW-profielen
          </p>
        </div>
        <Link href="/clients/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nieuwe Klant
          </Button>
        </Link>
      </div>

      <Card>
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
