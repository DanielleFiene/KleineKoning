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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 p-4 md:p-6 lg:p-8">
      <div className="w-full max-w-md">
        {/* Brand Section */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center justify-center mb-6">
            <Image
              src="/KleineKoning.jpg"
              alt="KleineKoning Logo"
              width={120}
              height={120}
              className="rounded-xl object-contain shadow-md"
              priority
            />
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">KleineKoning</h1>
          <p className="text-base text-muted-foreground">Tijdregistratie en urenstaat</p>
        </div>

        {/* Login Card */}
        <div className="rounded-xl border bg-card shadow-lg p-8 md:p-10">
          <div className="space-y-8">
            {/* Header */}
            <div className="space-y-2 text-center">
              <h2 className="text-2xl font-semibold tracking-tight">Inloggen</h2>
              <p className="text-sm text-muted-foreground">
                Voer je email adres in om een magic link te ontvangen
              </p>
            </div>
            
            {/* Form */}
            <form onSubmit={handleMagicLink} className="space-y-6">
              <div className="flex flex-col items-center space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-center">
                  Email adres
                </Label>
                <div className="w-full max-w-xs">
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
              </div>
              
              <div className="flex justify-center pt-2">
                <Button 
                  type="submit" 
                  disabled={loading}
                  size="default"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verzenden...
                    </>
                  ) : (
                    "Stuur magic link"
                  )}
                </Button>
              </div>
              
              {message && (
                <div className={`rounded-lg border p-4 text-sm text-center ${
                  message.includes("Fout") 
                    ? "border-destructive/50 bg-destructive/10 text-destructive" 
                    : "border-primary/50 bg-primary/10 text-primary"
                }`}>
                  {message}
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-sm text-muted-foreground">
          Je ontvangt een beveiligde login link in je email
        </p>
      </div>
    </div>
  );
}
