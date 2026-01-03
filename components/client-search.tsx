// components/client-search.tsx
"use client";

import { useState } from "react";
import { deleteClient } from "@/app/actions/clients";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
    <div>
      <div>
        <label htmlFor="client-search">Zoeken</label>
        <input
          id="client-search"
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Zoek op naam..."
        />
      </div>

      {filteredClients.length === 0 ? (
        <div>
          <p>Geen klanten gevonden</p>
        </div>
      ) : (
        <div>
          <table>
            <thead>
              <tr>
                <th>Naam</th>
                <th>BTW Profiel</th>
                <th>Acties</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((client) => (
                <tr key={client.id}>
                  <td>
                    <Link href={`/clients/${client.id}`}>
                      {client.name}
                    </Link>
                  </td>
                  <td>
                    {client.btw_profile.label} ({client.btw_profile.percentage}%)
                  </td>
                  <td>
                    <Link href={`/clients/${client.id}/edit`}>
                      <button>Bewerken</button>
                    </Link>
                    <button onClick={() => handleDelete(client.id)}>
                      Verwijderen
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
