import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { Phone, Pill } from "../components/PersistentBg";
import { theme } from "../theme";

export const SceneAuth: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const phoneIn = spring({ frame, fps, config: { damping: 18 } });
  const btn = spring({ frame: frame - 30, fps, config: { damping: 15 } });
  const kyc = spring({ frame: frame - 90, fps, config: { damping: 18 } });
  const consent = spring({ frame: frame - 130, fps, config: { damping: 18 } });
  const check = spring({ frame: frame - 170, fps, config: { damping: 12 } });

  return (
    <AbsoluteFill style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 120 }}>
      <div style={{ maxWidth: 620, transform: `translateX(${interpolate(phoneIn, [0, 1], [-40, 0])}px)`, opacity: phoneIn }}>
        <div style={{ fontSize: 24, color: theme.primary, fontWeight: 600, marginBottom: 16 }}>STEP 01</div>
        <div style={{ fontFamily: "Space Grotesk", fontSize: 78, fontWeight: 700, lineHeight: 1.05, letterSpacing: -1 }}>
          Sign in with <span style={{ color: theme.voda }}>VodaPay</span>
        </div>
        <div style={{ fontSize: 26, color: theme.muted, marginTop: 20, lineHeight: 1.4 }}>
          Secure identity, KYC and consent — handled in seconds. No new passwords.
        </div>
      </div>

      <div style={{ transform: `translateY(${interpolate(phoneIn, [0, 1], [40, 0])}px) scale(${0.9 + phoneIn * 0.1})`, opacity: phoneIn }}>
        <Phone>
          <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center", marginTop: 20 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: `${theme.primary}22`, display: "grid", placeItems: "center", color: theme.primary, fontWeight: 700 }}>S</div>
            <div style={{ fontFamily: "Space Grotesk", fontSize: 24, fontWeight: 700 }}>SmartInVest</div>
          </div>
          <div style={{ marginTop: 60, background: theme.card, borderRadius: 28, padding: 26, textAlign: "center" }}>
            <div style={{ fontSize: 14, color: theme.muted, marginBottom: 20, lineHeight: 1.5 }}>
              Sign in securely with VodaPay to access your AI-powered portfolio.
            </div>
            <div
              style={{
                background: theme.voda,
                color: "white",
                padding: "14px 20px",
                borderRadius: 999,
                fontWeight: 600,
                fontSize: 15,
                transform: `scale(${btn})`,
                boxShadow: `0 8px 30px ${theme.voda}66`,
              }}
            >
              Sign in with VodaPay
            </div>
          </div>
          <div style={{ marginTop: 30, display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
            <div style={{ transform: `scale(${kyc})` }}>
              <Pill active style={{ fontSize: 12 }}>✓ KYC verified</Pill>
            </div>
            <div style={{ transform: `scale(${consent})` }}>
              <Pill active style={{ fontSize: 12 }}>✓ Consent granted</Pill>
            </div>
          </div>
          <div style={{ marginTop: 40, textAlign: "center", opacity: check }}>
            <div style={{ width: 90, height: 90, margin: "0 auto", borderRadius: 999, background: `${theme.primary}22`, display: "grid", placeItems: "center", border: `3px solid ${theme.primary}` }}>
              <div style={{ fontSize: 46, color: theme.primary }}>✓</div>
            </div>
            <div style={{ marginTop: 14, fontSize: 16, fontWeight: 600 }}>You're in.</div>
          </div>
        </Phone>
      </div>
    </AbsoluteFill>
  );
};
