import { createFileRoute, redirect, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { signInWithVodaPay, stashPendingUser } from "@/lib/vodapay";

export const Route = createFileRoute("/login")({
  validateSearch: (s) => ({ redirect: (s.redirect as string) || "/" }),
  beforeLoad: async ({ search }) => {
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: search.redirect });
  },
  component: LoginPage,
});

function LoginPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { redirect: redirectTo } = Route.useSearch();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-5">
      <div className="w-full max-w-md">
        <Link to="/login" className="flex items-center gap-2 justify-center mb-8">
          <div className="size-10 rounded-2xl bg-primary/15 grid place-items-center">
            <Sparkles className="size-5 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">SmartInVest</h1>
        </Link>

        <div className="bg-card rounded-3xl p-6 shadow-[var(--shadow-glow)] text-center">
          <p className="text-sm text-muted-foreground mb-6">
            Sign in securely with your VodaPay account to access your AI-powered portfolio.
          </p>

          <button
            type="button"
            disabled={loading}
            onClick={async () => {
              setLoading(true);
              try {
                const user = await signInWithVodaPay();
                stashPendingUser(user);
                toast.success(`Welcome ${user.userName?.firstName ?? user.nickName ?? ""}`);
                navigate({ to: "/consent", search: { redirect: redirectTo } });
              } catch (err: any) {
                toast.error(err.message ?? "VodaPay sign-in failed");
              } finally {
                setLoading(false);
              }
            }}
            className="w-full bg-[#e60000] text-white rounded-full py-3 font-semibold hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            Sign in with VodaPay
          </button>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          AI-powered portfolio insights, securely yours.
        </p>
      </div>
    </div>
  );
}
