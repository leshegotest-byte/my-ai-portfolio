import { createFileRoute, redirect, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  validateSearch: (s) => ({ redirect: (s.redirect as string) || "/" }),
  beforeLoad: async ({ search }) => {
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: search.redirect });
  },
  component: LoginPage,
});

const schema = z.object({
  email: z.string().email("Enter a valid email").max(255),
  password: z.string().min(6, "At least 6 characters").max(72),
  displayName: z.string().trim().max(60).optional(),
});

function LoginPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { redirect: redirectTo } = Route.useSearch();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password, displayName });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: displayName || email.split("@")[0] },
          },
        });
        if (error) throw error;
        toast.success("Account created!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back!");
      }
      navigate({ to: redirectTo });
    } catch (err: any) {
      toast.error(err.message ?? "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-5">
      <div className="w-full max-w-md">
        <Link to="/login" className="flex items-center gap-2 justify-center mb-8">
          <div className="size-10 rounded-2xl bg-primary/15 grid place-items-center">
            <Sparkles className="size-5 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">SmartInVest</h1>
        </Link>

        <div className="bg-card rounded-3xl p-6 shadow-[var(--shadow-glow)]">
          <div className="flex bg-background/40 rounded-full p-1 mb-6">
            {(["signin", "signup"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`flex-1 py-2 text-sm rounded-full font-medium transition ${
                  mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                {m === "signin" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-3">
            {mode === "signup" && (
              <Field label="Display name">
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Jane Doe"
                  className="input"
                />
              </Field>
            )}
            <Field label="Email">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="input"
              />
            </Field>
            <Field label="Password">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="input"
              />
            </Field>
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-primary text-primary-foreground rounded-full py-3 font-semibold hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="size-4 animate-spin" />}
              {mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          AI-powered portfolio insights, securely yours.
        </p>
      </div>

      <style>{`
        .input {
          width: 100%;
          background: transparent;
          border: 1px solid var(--color-border);
          border-radius: 9999px;
          padding: 0.7rem 1rem;
          color: var(--color-foreground);
          outline: none;
          font-size: 0.95rem;
        }
        .input:focus { border-color: var(--color-primary); }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs text-muted-foreground ml-3">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
