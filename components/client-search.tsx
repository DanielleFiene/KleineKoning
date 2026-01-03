"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Search, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import { deleteClient } from "@/app/actions/clients";
import { useRouter } from "next/navigation";

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
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Zoek klanten..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8"
        />
      </div>

      {filteredClients.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          {search ? "Geen klanten gevonden" : "Nog geen klanten toegevoegd"}
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Naam</TableHead>
              <TableHead>BTW Profiel</TableHead>
              <TableHead className="text-right">Acties</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.map((client) => (
              <TableRow key={client.id}>
                <TableCell className="font-medium">
                  <Link
                    href={`/clients/${client.id}`}
                    className="hover:underline"
                  >
                    {client.name}
                  </Link>
                </TableCell>
                <TableCell>
                  {client.btw_profile.label} ({client.btw_profile.percentage}%)
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Link href={`/clients/${client.id}/edit`}>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(client.id)}
                    >
                      <Trash2 className="h-4 w-4" />
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

