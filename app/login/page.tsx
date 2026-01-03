"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CircularProgress } from "@mui/material";
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
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-[420px]">
        {/* Brand Section */}
        <div className="mb-10 text-center">
          <div className="mb-4 inline-flex">
            <Image
              src="/KleineKoning.jpg"
              alt="KleineKoning Logo"
              width={100}
              height={100}
              className="rounded-2xl object-cover"
              priority
            />
          </div>
          <h1 className="mb-1 text-3xl font-bold tracking-tight">Kleine Koning</h1>
          <p className="text-sm text-muted-foreground">Tijdregistratie en urenstaat</p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl bg-card p-10 shadow-sm transition-shadow hover:shadow-md">
          <div className="space-y-6">
            {/* Header */}
            <div className="space-y-1 text-center">
              <h2 className="text-2xl font-semibold tracking-tight">Inloggen</h2>
              <p className="text-sm text-muted-foreground">
                Voer je email adres in om een magic link te ontvangen
              </p>
            </div>
            
            {/* Form */}
            <form onSubmit={handleMagicLink} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
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
                  className="h-11 rounded-lg transition-all focus:ring-2 focus:ring-primary/20"
                />
              </div>
              
              <Button 
                type="submit" 
                disabled={loading}
                className="h-11 w-full rounded-lg font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? (
                  <>
                    <CircularProgress size={16} sx={{ mr: 1 }} />
                    Verzenden...
                  </>
                ) : (
                  "Stuur magic link"
                )}
              </Button>
              
              {message && (
                <div className={`rounded-xl p-4 text-sm text-center transition-all ${
                  message.includes("Fout") 
                    ? "bg-destructive/10 text-destructive" 
                    : "bg-primary/10 text-primary"
                }`}>
                  {message}
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Je ontvangt een beveiligde login link in je email
        </p>
      </div>
    </div>
  );
}