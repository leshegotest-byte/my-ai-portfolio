import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ShieldAlert, ArrowRight } from "lucide-react";
import { readPendingUser, clearPendingUser, requestKycUpgrade, kycLabel } from "@/lib/vodapay";

export const Route = createFileRoute("/kyc-required")({
  validateSearch: (s) => ({ redirect: (s.redirect as string) || "/" }),
  component: KycRequiredPage,
});

function KycRequiredPage() {
  const navigate = useNavigate();
  const pending = typeof window !== "undefined" ? readPendingUser() : null;
  const level = kycLabel(pending?.kycLevel);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-5">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-3xl p-6 shadow-[var(--shadow-glow)] text-center">
          <div className="size-14 rounded-2xl bg-destructive/15 grid place-items-center mx-auto mb-4">
            <ShieldAlert className="size-7 text-destructive" />
          </div>
          <h1 className="text-xl font-bold mb-2">Pro Wallet verification required</h1>
          <p className="text-sm text-muted-foreground mb-4">
            SmartInVest is only available to fully verified VodaPay Pro Wallet customers.
            Your account is currently at KYC level <strong>{level}</strong>, but{" "}
            <strong>Pro</strong> is required to invest.
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            Complete your KYC upgrade in VodaPay and come back to start investing.
          </p>

          <button
            type="button"
            onClick={requestKycUpgrade}
            className="w-full bg-primary text-primary-foreground rounded-full py-3 font-semibold hover:opacity-90 transition flex items-center justify-center gap-2"
          >
            Upgrade to Pro Wallet
            <ArrowRight className="size-4" />
          </button>

          <button
            type="button"
            onClick={() => {
              clearPendingUser();
              navigate({ to: "/login", search: { redirect: "/" } });
            }}
            className="w-full mt-3 text-sm text-muted-foreground hover:text-foreground transition"
          >
            Back to sign in
          </button>
        </div>
      </div>
    </div>
  );
}
