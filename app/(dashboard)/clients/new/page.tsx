// app/(dashboard)/clients/new/page.tsx
import { ClientForm } from "@/components/client-form";

export default function NewClientPage() {
  return (
    <div className="space-y-4 md:space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Nieuwe Klant</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Voeg een nieuwe klant toe aan je lijst
        </p>
      </div>
      <ClientForm />
    </div>
  );
}

