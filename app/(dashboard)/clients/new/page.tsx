// app/(dashboard)/clients/new/page.tsx
import { ClientForm } from "@/components/client-form";

export default function NewClientPage() {
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Nieuwe Klant</h1>
        </div>
      </div>

      {/* Content Card */}
      <ClientForm />
    </div>
  );
}
