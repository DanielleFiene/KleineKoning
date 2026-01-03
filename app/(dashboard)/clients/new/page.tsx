import { ClientForm } from "@/components/client-form";

export default function NewClientPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Nieuwe Klant</h1>
        <p className="text-muted-foreground">
          Voeg een nieuwe klant toe aan je lijst
        </p>
      </div>
      <ClientForm />
    </div>
  );
}

