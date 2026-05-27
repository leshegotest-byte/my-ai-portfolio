// VodaPay SSO helper. In the VodaPay mini-program WebView, `window.my` is
// injected and we use postMessage to request an auth code. Outside that
// environment (regular browser preview) we fall back to a mock identity so
// the flow can be exercised end-to-end.

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

/**
 * Exchange an authCode for user info. In production this should hit your
 * backend which calls the VodaPay token + user-info APIs. For now we mock.
 */
async function exchangeAuthCode(_authCode: string): Promise<VodaPayUserInfo> {
  await new Promise((r) => setTimeout(r, 400));
  return MOCK_USER;
}

/**
 * Trigger VodaPay SSO. Resolves with the userInfo payload.
 * Times out / falls back to mock when not inside the VodaPay WebView.
 */
export function signInWithVodaPay(): Promise<VodaPayUserInfo> {
  return new Promise((resolve, reject) => {
    const my = typeof window !== "undefined" ? window.my : undefined;

    if (!my || typeof my.postMessage !== "function") {
      // Not inside VodaPay — simulate so the journey is testable in preview.
      exchangeAuthCode("mock-auth-code").then(resolve).catch(reject);
      return;
    }

    const timer = setTimeout(() => {
      reject(new Error("VodaPay sign-in timed out"));
    }, 30_000);

    my.onMessage = (data: any) => {
      if (data?.action?.type === "AuthCode") {
        clearTimeout(timer);
        exchangeAuthCode(String(data.action.details ?? "")).then(resolve).catch(reject);
      }
    };

    my.postMessage({ action: { type: "getAuthCode" } });
  });
}

export function emailFromUserInfo(u: VodaPayUserInfo): string {
  const email = u.contactInfos?.find((c) => c.contactType === "EMAIL")?.contactNo;
  if (email) return email;
  // Fallback synthetic email keyed off the stable userId.
  return `vp_${u.userId.replace(/[^a-zA-Z0-9]/g, "")}@vodapay.user`;
}

export function passwordFromUserInfo(u: VodaPayUserInfo): string {
  // Deterministic password derived from the VodaPay userId so the same SSO
  // user always lands on the same Supabase account. Demo-only.
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
