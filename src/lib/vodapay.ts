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

async function exchangeAuthCode(_authCode: string): Promise<VodaPayUserInfo> {
  await new Promise((r) => setTimeout(r, 400));
  return MOCK_USER;
}

// Global callback — set before React mounts anything
let pendingResolve: ((data: any) => void) | null = null;

// Assign my.onMessage at module load time
if (typeof window !== "undefined") {
  const assignHandler = (attempts = 0) => {
    if (window.my) {
      window.my.onMessage = (data: any) => {
        alert("[VodaPay] onMessage fired: " + JSON.stringify(data));
        if (pendingResolve) {
          pendingResolve(data);
          pendingResolve = null;
        }
      };
      alert("[VodaPay] onMessage handler registered at module load ✅");
    } else if (attempts < 50) {
      setTimeout(() => assignHandler(attempts + 1), 100);
    } else {
      alert("[VodaPay] window.my never appeared after 50 attempts");
    }
  };
  assignHandler();
}

// ENV CHECK — tells us what environment we are running in
setTimeout(() => {
  alert(
    "ENV CHECK\n" +
    "window.my: " + typeof window.my + "\n" +
    "userAgent: " + navigator.userAgent
  );
}, 2000);

export function signInWithVodaPay(): Promise<VodaPayUserInfo> {
  return new Promise((resolve, reject) => {
    const my = typeof window !== "undefined" ? window.my : undefined;

    if (!my || typeof my.postMessage !== "function") {
      alert("[VodaPay] window.my not found — falling back to mock user");
      exchangeAuthCode("mock-auth-code").then(resolve).catch(reject);
      return;
    }

    const timer = setTimeout(() => {
      pendingResolve = null;
      alert("[VodaPay] TIMED OUT — onMessage never fired after 30s");
      reject(new Error("VodaPay sign-in timed out"));
    }, 30_000);

    pendingResolve = (data: any) => {
      if (data?.action?.type === "AuthCode") {
        clearTimeout(timer);
        const userInfo = data.action.details as VodaPayUserInfo;
        alert("[VodaPay] Success! UserInfo: " + JSON.stringify(userInfo));
        resolve(userInfo);
      } else {
        alert("[VodaPay] Unexpected action type: " + JSON.stringify(data?.action?.type));
      }
    };

    // Reassign onMessage here too in case module-load assignment was too early
    my.onMessage = (data: any) => {
      alert("[VodaPay] onMessage fired inside signIn: " + JSON.stringify(data));
      if (pendingResolve) {
        pendingResolve(data);
        pendingResolve = null;
      }
    };

    alert("[VodaPay] Posting getAuthCode to mini-program...");
    my.postMessage({ action: { type: "getAuthCode" } });
  });
}

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