import { X } from "lucide-react";
import { useEffect } from "react";

interface TermsModalProps {
  open: boolean;
  onClose: () => void;
  onAccept: () => void;
}

export function TermsModal({ open, onClose, onAccept }: TermsModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="terms-title"
    >
      <div
        className="bg-card border border-border rounded-3xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 id="terms-title" className="text-lg font-bold">Terms &amp; Conditions</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="size-8 rounded-full grid place-items-center hover:bg-background/50 transition"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4 space-y-5 text-sm text-muted-foreground">
          <section>
            <h3 className="font-semibold text-foreground mb-1">1. Eligibility</h3>
            <p>You must be at least 18 years of age to create an account and use SmartInVest. By accepting these terms you confirm that you meet this age requirement and that the information you provide is accurate.</p>
          </section>
          <section>
            <h3 className="font-semibold text-foreground mb-1">2. Investment Risk Disclaimer</h3>
            <p>All investments carry risk, including loss of principal. Past performance is not indicative of future results. Values of stocks, ETFs, and other instruments may fluctuate, and you may receive back less than you invested.</p>
          </section>
          <section>
            <h3 className="font-semibold text-foreground mb-1">3. Privacy &amp; Data Usage</h3>
            <p>We collect personal information (name, contact details, identifiers) to operate the service, verify your identity, and personalize recommendations. We do not sell your data. See our Privacy Policy for full details.</p>
          </section>
          <section>
            <h3 className="font-semibold text-foreground mb-1">4. User Responsibilities</h3>
            <p>You are responsible for the security of your account credentials, the accuracy of the information you provide, and for all activity carried out under your account. Notify us immediately of any unauthorized access.</p>
          </section>
          <section>
            <h3 className="font-semibold text-foreground mb-1">5. No Financial Advice</h3>
            <p>SmartInVest provides tools, data, and educational content. Nothing in the app constitutes financial, legal, or tax advice. You should consult a qualified professional before making investment decisions.</p>
          </section>
          <section>
            <h3 className="font-semibold text-foreground mb-1">6. Account &amp; Portfolio Usage</h3>
            <p>Your account and portfolio are for personal, non-commercial use. You may not use the service to engage in market manipulation, money laundering, or any activity that violates applicable law. We reserve the right to suspend accounts that violate these terms.</p>
          </section>
          <section>
            <h3 className="font-semibold text-foreground mb-1">7. Changes to Terms</h3>
            <p>We may update these terms from time to time. Continued use of the service after changes take effect constitutes acceptance of the updated terms.</p>
          </section>
        </div>

        <div className="p-5 border-t border-border flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-full py-3 font-semibold border border-border hover:bg-background/50 transition"
          >
            Cancel
          </button>
          <button
            onClick={onAccept}
            className="flex-1 bg-primary text-primary-foreground rounded-full py-3 font-semibold hover:opacity-90 transition"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
