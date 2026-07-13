import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { theme } from "../theme";

const instruments = [
  { name: "Naspers", sector: "Technology", ticker: "NPN", price: 3450, ret: 14.2, risk: "Medium", match: 92 },
  { name: "Standard Bank ETF", sector: "Finance", ticker: "SBK", price: 210, ret: 9.5, risk: "Low", match: 87 },
  { name: "Sasol Green", sector: "Energy", ticker: "SOL", price: 148, ret: 18.4, risk: "High", match: 74 },
  { name: "Discovery Health", sector: "Healthcare", ticker: "DSY", price: 176, ret: 11.1, risk: "Medium", match: 68 },
];

export const SceneDiscover: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const title = spring({ frame, fps, config: { damping: 18 } });

  return (
    <AbsoluteFill style={{ padding: "80px 100px", flexDirection: "row", gap: 80, alignItems: "center" }}>
      <div style={{ flex: 1, opacity: title, transform: `translateX(${interpolate(title, [0, 1], [-30, 0])}px)` }}>
        <div style={{ fontSize: 22, color: theme.primary, fontWeight: 600, marginBottom: 12 }}>STEP 03 · DISCOVER</div>
        <div style={{ fontFamily: "Space Grotesk", fontSize: 82, fontWeight: 700, letterSpacing: -1, lineHeight: 1.05 }}>
          Every pick,<br />ranked for you
        </div>
        <div style={{ fontSize: 26, color: theme.muted, marginTop: 20, lineHeight: 1.4, maxWidth: 500 }}>
          Filter by risk, sector, return. See your personal <span style={{ color: theme.primary, fontWeight: 600 }}>% match</span> at a glance.
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 30, flexWrap: "wrap" }}>
          {["All", "★ Watchlist", "Low risk", "Tech", "≥10%"].map((t, i) => {
            const s = spring({ frame: frame - 40 - i * 6, fps, config: { damping: 18 } });
            return (
              <div key={t} style={{ opacity: s, transform: `scale(${s})`, padding: "10px 20px", borderRadius: 999, background: i === 0 ? theme.primary : theme.card, color: i === 0 ? "#062018" : theme.muted, border: `1px solid ${i === 0 ? theme.primary : theme.border}`, fontSize: 18, fontWeight: 500 }}>
                {t}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 20 }}>
        {instruments.map((it, i) => {
          const s = spring({ frame: frame - 40 - i * 20, fps, config: { damping: 20 } });
          return (
            <div
              key={it.name}
              style={{
                background: theme.card,
                border: `1px solid ${theme.border}`,
                borderRadius: 28,
                padding: 26,
                opacity: s,
                transform: `translateY(${interpolate(s, [0, 1], [30, 0])}px)`,
                boxShadow: it.match >= 90 ? `0 0 40px ${theme.primary}22` : "none",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <div style={{ fontSize: 24, fontWeight: 600 }}>{it.name}</div>
                    {it.match >= 70 && (
                      <div style={{ fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 999, background: `${theme.primary}33`, color: theme.primary }}>
                        {it.match}% match
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: 14, color: theme.muted, marginTop: 4 }}>{it.sector} · {it.ticker}</div>
                </div>
                <div style={{ fontSize: 20, color: it.risk === "Low" ? "#7bd3f0" : it.risk === "High" ? theme.danger : theme.primary, fontWeight: 600 }}>
                  {it.risk}
                </div>
              </div>
              <div style={{ display: "flex", gap: 30, marginTop: 20, paddingTop: 18, borderTop: `1px solid ${theme.border}` }}>
                <Stat label="PRICE" value={`R${it.price.toLocaleString()}`} />
                <Stat label="RETURN" value={`+${it.ret}%`} accent />
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const Stat: React.FC<{ label: string; value: string; accent?: boolean }> = ({ label, value, accent }) => (
  <div>
    <div style={{ fontSize: 11, color: theme.muted, letterSpacing: 1 }}>{label}</div>
    <div style={{ fontSize: 20, fontWeight: 700, color: accent ? theme.primary : theme.text, marginTop: 3 }}>{value}</div>
  </div>
);
