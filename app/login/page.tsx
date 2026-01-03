// app/login/page.tsx
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import Image from "next/image";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setMessage(`Fout: ${error.message}`);
    } else {
      setMessage("Check je email voor de login link!");
    }

    setLoading(false);
  };

  return (
    <div>
      <div>
        <div>
          <div>
            <Image
              src="/KleineKoning.jpg"
              alt="KleineKoning Logo"
              width={100}
              height={100}
              priority
            />
          </div>
          <h1>KleineKoning</h1>
          <p>Tijdregistratie en urenstaat</p>
        </div>

        <div>
          <div>
            <div>
              <h2>Inloggen</h2>
              <p>
                Voer je email adres in om een magic link te ontvangen
              </p>
            </div>
            
            <form onSubmit={handleMagicLink}>
              <div>
                <Label htmlFor="email">
                  Email adres
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jouw@email.nl"
                  required
                  disabled={loading}
                />
              </div>
              
              <Button 
                type="submit" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 />
                    Verzenden...
                  </>
                ) : (
                  "Stuur magic link"
                )}
              </Button>
              
              {message && (
                <div>
                  {message}
                </div>
              )}
            </form>
          </div>
        </div>

        <p>
          Je ontvangt een beveiligde login link in je email
        </p>
      </div>
    </div>
  );
}
