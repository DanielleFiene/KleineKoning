"use client";

import { useState } from "react";
import { deleteClient } from "@/app/actions/clients";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Client {
  id: string;
  name: string;
  btw_profile: {
    label: string;
    percentage: number;
    rule: string;
  };
}

export function ClientSearch({ initialClients }: { initialClients: Client[] }) {
  const [search, setSearch] = useState("");
  const [clients, setClients] = useState(initialClients);
  const router = useRouter();

  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (confirm("Weet je zeker dat je deze klant wilt verwijderen?")) {
      try {
        await deleteClient(id);
        setClients(clients.filter((c) => c.id !== id));
        router.refresh();
      } catch (error) {
        alert("Fout bij verwijderen: " + (error as Error).message);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="client-search">Zoeken</Label>
        <Input
          id="client-search"
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Zoek op naam..."
        />
      </div>

      {filteredClients.length === 0 ? (
        <p className="text-sm text-slate-600">Geen klanten gevonden</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Naam</TableHead>
              <TableHead>BTW Profiel</TableHead>
              <TableHead>Acties</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.map((client) => (
              <TableRow key={client.id}>
                <TableCell className="text-sm text-slate-900">
                  <Link href={`/clients/${client.id}`} className="hover:text-indigo-600">
                    {client.name}
                  </Link>
                </TableCell>
                <TableCell className="text-sm text-slate-900">
                  {client.btw_profile.label} ({client.btw_profile.percentage}%)
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Link href={`/clients/${client.id}/edit`}>
                      <Button variant="ghost" size="sm">Bewerken</Button>
                    </Link>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(client.id)}
                    >
                      Verwijderen
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
