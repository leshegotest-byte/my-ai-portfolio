import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, ShieldCheck } from "lucide-react";
import {
  readPendingUser,
  clearPendingUser,
  emailFromUserInfo,
  passwordFromUserInfo,
} from "@/lib/vodapay";
import { TermsModal } from "@/components/TermsModal";

export const Route = createFileRoute("/consent")({
  validateSearch: (s) => ({ redirect: (s.redirect as string) || "/" }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/" });
  },
  component: ConsentPage,
});

function ConsentPage() {
  const navigate = useNavigate();
  const { redirect: redirectTo } = Route.useSearch();
  const [agreed, setAgreed] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const pending = typeof window !== "undefined" ? readPendingUser() : null;

  if (!pending) {
    return (
      <div className="min-h-screen bg-background grid place-items-center px-5">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">No VodaPay session found.</p>
          <button
            onClick={() => navigate({ to: "/login", search: { redirect: "/" } })}
            className="bg-primary text-primary-foreground rounded-full px-6 py-2 font-medium"
          >
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  const continueFlow = async () => {
    if (!agreed) {
      toast.error("Please confirm you are 18 or older");
      return;
    }
    if (!acceptedTerms) {
      toast.error("Please accept the Terms & Conditions");
      return;
    }
    setLoading(true);
    try {
      const email = emailFromUserInfo(pending);
      const password = passwordFromUserInfo(pending);
      const displayName = pending.userName?.fullName ?? pending.nickName ?? email.split("@")[0];

      // Try sign in first; if user doesn't exist, sign them up.
      let { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        const { error: signUpErr } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: displayName },
          },
        });
        if (signUpErr) throw signUpErr;
        // Auto-confirm is enabled, so sign in immediately.
        const { error: retryErr } = await supabase.auth.signInWithPassword({ email, password });
        if (retryErr) throw retryErr;
      }

      clearPendingUser();
      toast.success("You're in");
      navigate({ to: redirectTo });
    } catch (err: any) {
      toast.error(err.message ?? "Could not complete sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-5">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-3xl p-6 shadow-[var(--shadow-glow)]">
          <div className="size-12 rounded-2xl bg-primary/15 grid place-items-center mb-4">
            <ShieldCheck className="size-6 text-primary" />
          </div>
          <h1 className="text-xl font-bold mb-1">Age verification</h1>
          <p className="text-sm text-muted-foreground mb-5">
            Hi {pending.userName?.firstName ?? pending.nickName ?? "there"} — investing on SmartInVest
            requires you to be at least 18 years old. Please confirm before continuing.
          </p>

          <div className="bg-background/40 rounded-2xl p-4 text-sm space-y-1 mb-5">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Name</span>
              <span>{pending.userName?.fullName ?? "—"}</span>
            </div>
            {pending.contactInfos?.map((c) => (
              <div key={c.contactType} className="flex justify-between">
                <span className="text-muted-foreground capitalize">
                  {c.contactType.replace("_", " ").toLowerCase()}
                </span>
                <span>{c.contactNo}</span>
              </div>
            ))}
          </div>

          <label className="flex items-start gap-3 cursor-pointer select-none mb-3">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 size-4 accent-primary"
            />
            <span className="text-sm">
              I confirm that I am <strong>18 years of age or older</strong>.
            </span>
          </label>

          <label className="flex items-start gap-3 cursor-pointer select-none mb-5">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-1 size-4 accent-primary"
            />
            <span className="text-sm">
              I have read and agree to the{" "}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setTermsOpen(true);
                }}
                className="text-primary underline underline-offset-2 hover:opacity-80"
              >
                Terms &amp; Conditions
              </button>
              .
            </span>
          </label>

          <button
            type="button"
            onClick={continueFlow}
            disabled={loading || !agreed || !acceptedTerms}
            className="w-full bg-primary text-primary-foreground rounded-full py-3 font-semibold hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="size-4 animate-spin" />}
            Continue
          </button>
          <button
            type="button"
            onClick={() => {
              clearPendingUser();
              navigate({ to: "/login", search: { redirect: "/" } });
            }}
            className="w-full mt-2 text-sm text-muted-foreground hover:text-foreground transition"
          >
            Cancel
          </button>
        </div>
      </div>
      <TermsModal
        open={termsOpen}
        onClose={() => setTermsOpen(false)}
        onAccept={() => {
          setAcceptedTerms(true);
          setTermsOpen(false);
        }}
      />
    </div>
  );
}
