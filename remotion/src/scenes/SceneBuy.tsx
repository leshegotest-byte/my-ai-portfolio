import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { Phone } from "../components/PersistentBg";
import { theme } from "../theme";

export const SceneBuy: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const phoneIn = spring({ frame, fps, config: { damping: 18 } });
  const amountProg = interpolate(frame, [40, 130], [50, 500], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const price = 148;
  const shares = amountProg / price;
  const projected = amountProg * 1.184;
  const confirm = spring({ frame: frame - 170, fps, config: { damping: 15 } });

  return (
    <AbsoluteFill style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 100 }}>
      <div style={{ maxWidth: 560, opacity: phoneIn, transform: `translateX(${interpolate(phoneIn, [0, 1], [-30, 0])}px)` }}>
        <div style={{ fontSize: 22, color: theme.primary, fontWeight: 600, marginBottom: 12 }}>STEP 04 · BUY</div>
        <div style={{ fontFamily: "Space Grotesk", fontSize: 78, fontWeight: 700, letterSpacing: -1, lineHeight: 1.05 }}>
          Fractional<br />shares from <span style={{ color: theme.primary }}>R50</span>
        </div>
        <div style={{ fontSize: 24, color: theme.muted, marginTop: 20, lineHeight: 1.4 }}>
          See exactly what you'll own and its projected 1-year value — before you confirm.
        </div>
      </div>

      <div style={{ transform: `translateY(${interpolate(phoneIn, [0, 1], [40, 0])}px)`, opacity: phoneIn }}>
        <Phone>
          <div style={{ fontFamily: "Space Grotesk", fontSize: 24, fontWeight: 700 }}>Sasol Green</div>
          <div style={{ fontSize: 13, color: theme.muted, marginTop: 4 }}>Renewable energy leader</div>

          <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
            <MiniStat label="Price" value="R148" />
            <MiniStat label="Return" value="+18.4%" accent />
            <MiniStat label="Risk" value="High" />
          </div>

          <div style={{ marginTop: 20, background: `${theme.primary}15`, border: `1px solid ${theme.primary}55`, borderRadius: 999, padding: "8px 14px", fontSize: 11, color: theme.primary, textAlign: "center" }}>
            ✨ Fractional shares — invest from R50
          </div>

          <div style={{ marginTop: 18, background: theme.bg, borderRadius: 999, padding: 4, display: "flex" }}>
            <div style={{ flex: 1, textAlign: "center", padding: 10, borderRadius: 999, background: theme.primary, color: "#062018", fontSize: 12, fontWeight: 600 }}>By amount</div>
            <div style={{ flex: 1, textAlign: "center", padding: 10, color: theme.muted, fontSize: 12 }}>By shares</div>
          </div>

          <div style={{ marginTop: 14, border: `1px solid ${theme.border}`, borderRadius: 999, padding: "14px 20px", fontSize: 22, fontWeight: 700 }}>
            R{Math.round(amountProg)}
          </div>

          <div style={{ marginTop: 16, background: theme.bg, borderRadius: 20, padding: 16, fontSize: 13 }}>
            <Row label="Shares you'll own" value={`${shares.toFixed(4)}`} />
            <Row label="Ownership" value={`${(shares * 100).toFixed(1)}% of 1 share`} />
            <Row label="Projected (1y)" value={`R${Math.round(projected)}`} accent />
          </div>

          <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
            <div style={{ flex: 1, textAlign: "center", padding: 12, borderRadius: 999, background: theme.bg, color: theme.muted, fontSize: 13 }}>Cancel</div>
            <div
              style={{
                flex: 1,
                textAlign: "center",
                padding: 12,
                borderRadius: 999,
                background: theme.primary,
                color: "#062018",
                fontSize: 13,
                fontWeight: 700,
                transform: `scale(${1 + Math.max(0, confirm) * 0.05})`,
                boxShadow: confirm > 0 ? `0 0 30px ${theme.primary}88` : "none",
              }}
            >
              {confirm > 0.5 ? "✓ Confirmed" : "Confirm purchase"}
            </div>
          </div>
        </Phone>
      </div>
    </AbsoluteFill>
  );
};

const MiniStat: React.FC<{ label: string; value: string; accent?: boolean }> = ({ label, value, accent }) => (
  <div style={{ flex: 1, background: theme.bg, borderRadius: 16, padding: 10, textAlign: "center" }}>
    <div style={{ fontSize: 9, color: theme.muted, letterSpacing: 1 }}>{label}</div>
    <div style={{ fontSize: 14, fontWeight: 700, color: accent ? theme.primary : theme.text, marginTop: 2 }}>{value}</div>
  </div>
);

const Row: React.FC<{ label: string; value: string; accent?: boolean }> = ({ label, value, accent }) => (
  <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
    <span style={{ color: theme.muted }}>{label}</span>
    <span style={{ fontWeight: 600, color: accent ? theme.primary : theme.text }}>{value}</span>
  </div>
);
