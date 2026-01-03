// app/(dashboard)/clients/new/page.tsx
import { ClientForm } from "@/components/client-form";

export default function NewClientPage() {
  return (
    <div>
      <div>
        <h1>Nieuwe Klant</h1>
        <p>
          Voeg een nieuwe klant toe aan je lijst
        </p>
      </div>
      <ClientForm />
    </div>
  );
}
