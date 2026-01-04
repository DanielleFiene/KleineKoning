/**
 * app/page.tsx
 * 
 * Root page component. Redirect automatisch naar /time dashboard pagina.
 */
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/time");
}

