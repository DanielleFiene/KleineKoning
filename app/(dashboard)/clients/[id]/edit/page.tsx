// app/(dashboard)/clients/[id]/edit/page.tsx
import { getClient } from "@/app/actions/clients";
import { ClientForm } from "@/components/client-form";

export default async function EditClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Await params (Next.js 15+)
  const { id } = await params;
  const client = await getClient(id);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Klant bewerken</h1>
        </div>
      </div>

      {/* Content Card */}
      <ClientForm client={client} />
    </div>
  );
}
