export type VodaPayUserInfo = {
  nickName?: string;
  contactInfos?: { contactType: string; contactNo: string }[];
  userName?: { firstName?: string; lastName?: string; fullName?: string };
  userId: string;
  loginIdInfos?: { loginIdType: string; loginId: string; maskLoginId?: string; hashLoginId?: string }[];
};

declare global {
  interface Window {
    my?: {
      postMessage: (msg: unknown) => void;
      onMessage?: (data: any) => void;
    };
  }
}

const MOCK_USER: VodaPayUserInfo = {
  nickName: "Jane",
  contactInfos: [
    { contactType: "EMAIL", contactNo: "jane@yahoo.com" },
    { contactType: "MOBILE_PHONE", contactNo: "27-157011499" },
  ],
  userName: { firstName: "Jane", lastName: "Doe", fullName: "Jane Doe" },
  userId: "2166100000006727320",
  loginIdInfos: [
    {
      loginIdType: "MOBILE_PHONE",
      loginId: "27-157011499",
      maskLoginId: "27-1****1499",
      hashLoginId: "d1b97505dbd4b88554b796411c8ed4ebfe74ab4977942355fd57e4cd38d41d6d",
    },
  ],
};

// ─── On-screen debug logger ───────────────────────────────────────────────────
function debugLog(msg: string) {
  const timestamp = new Date().toISOString().split("T")[1].slice(0, 8);
  const line = `[${timestamp}] ${msg}`;

  let panel = document.getElementById("__vp_debug__");
  if (!panel) {
    panel = document.createElement("div");
    panel.id = "__vp_debug__";
    panel.style.cssText = `
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      max-height: 40vh;
      overflow-y: auto;
      background: rgba(0,0,0,0.85);
      color: #00ff00;
      font-family: monospace;
      font-size: 11px;
      padding: 8px;
      z-index: 99999;
      border-top: 2px solid #00ff00;
    `;
    document.body.appendChild(panel);
  }

  const entry = document.createElement("div");
  entry.textContent = line;
  panel.appendChild(entry);
  panel.scrollTop = panel.scrollHeight;
}

// ─── Generate a 64-character unique payment request ID ────────────────────────
export function generatePaymentRequestId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const timestamp = Date.now().toString(36).toUpperCase().padStart(12, "0");
  let random = "";
  for (let i = 0; i < 52; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const id = (timestamp + random).slice(0, 64);
  debugLog("Generated paymentRequestId: " + id);
  return id;
}

// ─── Mock fallback ────────────────────────────────────────────────────────────
async function exchangeAuthCode(_authCode: string): Promise<VodaPayUserInfo> {
  await new Promise((r) => setTimeout(r, 400));
  return MOCK_USER;
}

// ─── Global callback registries ───────────────────────────────────────────────
let pendingResolve: ((data: any) => void) | null = null;

// ─── Assign my.onMessage at module load ───────────────────────────────────────
if (typeof window !== "undefined") {
  const init = () => {
    debugLog("Module loaded");
    debugLog("window.my = " + typeof window.my);

    const assignHandler = (attempts = 0) => {
      if (window.my) {
        window.my.onMessage = (data: any) => {
          debugLog("onMessage fired: " + JSON.stringify(data));
          if (pendingResolve) {
            pendingResolve(data);
            pendingResolve = null;
          }
        };
        debugLog("onMessage handler registered ✅");
      } else if (attempts < 50) {
        setTimeout(() => assignHandler(attempts + 1), 100);
      } else {
        debugLog("window.my never appeared after 50 attempts ❌");
      }
    };

    assignHandler();

    setTimeout(() => {
      debugLog("ENV CHECK: window.my = " + typeof window.my);
      debugLog("userAgent: " + navigator.userAgent.slice(0, 80));
    }, 2000);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
}

// ─── Auth SSO ─────────────────────────────────────────────────────────────────
export function signInWithVodaPay(): Promise<VodaPayUserInfo> {
  return new Promise((resolve, reject) => {
    const my = typeof window !== "undefined" ? window.my : undefined;

    debugLog("signInWithVodaPay called");
    debugLog("window.my at call time = " + typeof my);

    if (!my || typeof my.postMessage !== "function") {
      debugLog("window.my not found — falling back to mock ❌");
      exchangeAuthCode("mock-auth-code").then(resolve).catch(reject);
      return;
    }

    const timer = setTimeout(() => {
      pendingResolve = null;
      debugLog("TIMED OUT — onMessage never fired ❌");
      reject(new Error("VodaPay sign-in timed out"));
    }, 30_000);

    pendingResolve = (data: any) => {
      if (data?.action?.type === "AuthCode") {
        clearTimeout(timer);
        const userInfo = data.action.details as VodaPayUserInfo;
        debugLog("Auth success! userId = " + userInfo.userId);
        resolve(userInfo);
      } else {
        debugLog("Unexpected action: " + JSON.stringify(data?.action?.type));
      }
    };

    my.onMessage = (data: any) => {
      debugLog("onMessage fired inside signIn: " + JSON.stringify(data));
      if (pendingResolve) {
        pendingResolve(data);
        pendingResolve = null;
      }
    };

    debugLog("Posting getAuthCode to mini-program...");
    my.postMessage({ action: { type: "getAuthCode" } });
  });
}

// ─── Payment ──────────────────────────────────────────────────────────────────
export function initiateVodaPayPayment(amountInCents: number): Promise<{ success: boolean; result: any }> {
  return new Promise((resolve, reject) => {
    const my = typeof window !== "undefined" ? window.my : undefined;

    const paymentRequestId = generatePaymentRequestId();

    debugLog("initiateVodaPayPayment called");
    debugLog("amount (cents): " + amountInCents);
    debugLog("paymentRequestId: " + paymentRequestId);

    if (!my || typeof my.postMessage !== "function") {
      debugLog("window.my not found — cannot process payment ❌");
      reject(new Error("VodaPay not available"));
      return;
    }

    const timer = setTimeout(() => {
      pendingResolve = null;
      debugLog("Payment TIMED OUT ❌");
      reject(new Error("VodaPay payment timed out"));
    }, 60_000);

    pendingResolve = (data: any) => {
      if (data?.action?.type === "PaymentResult") {
        clearTimeout(timer);
        debugLog("Payment result: " + JSON.stringify(data.action.details));
        resolve({ success: true, result: data.action.details });
      } else {
        debugLog("Unexpected action during payment: " + JSON.stringify(data?.action?.type));
      }
    };

    my.onMessage = (data: any) => {
      debugLog("onMessage fired inside payment: " + JSON.stringify(data));
      if (pendingResolve) {
        pendingResolve(data);
        pendingResolve = null;
      }
    };

    debugLog("Posting Payment to mini-program...");
    my.postMessage({
      action: {
        type: "Payment",
        command: {
          paymentRequestId,
          paymentAmount: amountInCents,
        },
      },
    });
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
export function emailFromUserInfo(u: VodaPayUserInfo): string {
  const email = u.contactInfos?.find((c) => c.contactType === "EMAIL")?.contactNo;
  if (email) return email;
  return `vp_${u.userId.replace(/[^a-zA-Z0-9]/g, "")}@vodapay.user`;
}

export function passwordFromUserInfo(u: VodaPayUserInfo): string {
  return `vp!${u.userId}!SmartInVest`;
}

const STORAGE_KEY = "vp_pending_user";

export function stashPendingUser(u: VodaPayUserInfo) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(u));
}

export function readPendingUser(): VodaPayUserInfo | null {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as VodaPayUserInfo; } catch { return null; }
}

export function clearPendingUser() {
  sessionStorage.removeItem(STORAGE_KEY);
}