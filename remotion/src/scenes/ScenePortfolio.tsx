import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { theme } from "../theme";

const holdings = [
  { name: "Naspers", value: 4200, color: theme.primary },
  { name: "Sasol Green", value: 1800, color: theme.accent },
  { name: "SBK ETF", value: 1500, color: "#7bd3f0" },
  { name: "Discovery", value: 900, color: "#c084fc" },
];
const total = holdings.reduce((a, b) => a + b.value, 0);

export const ScenePortfolio: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const inSpring = spring({ frame, fps, config: { damping: 20 } });
  const highlight = spring({ frame: frame - 60, fps, config: { damping: 18 } });
  const chatShow = frame - 100;

  const messages = [
    { role: "user", text: "What is fractional trading?", at: 100 },
    { role: "ai", text: "It means you can buy a slice of a share — like R50 of a R3,000 stock. You own that percentage.", at: 130 },
    { role: "user", text: "What's my best performer?", at: 180 },
    { role: "ai", text: "Naspers — up 14.2% projected. It's 42% of your portfolio.", at: 210 },
  ];

  return (
    <AbsoluteFill style={{ padding: 80, flexDirection: "row", gap: 60, alignItems: "center" }}>
      <div style={{ flex: 1, opacity: inSpring, transform: `translateY(${interpolate(inSpring, [0, 1], [30, 0])}px)` }}>
        <div style={{ fontSize: 22, color: theme.primary, fontWeight: 600, marginBottom: 12 }}>STEP 05 · YOUR PORTFOLIO</div>
        <div style={{ fontFamily: "Space Grotesk", fontSize: 68, fontWeight: 700, letterSpacing: -1, lineHeight: 1.05 }}>
          Track, learn,<br />withdraw
        </div>

        <div style={{ marginTop: 40, display: "flex", alignItems: "center", gap: 40 }}>
          <Donut segments={holdings} total={total} highlightIdx={0} highlightAmt={highlight} />
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {holdings.map((h, i) => (
              <div key={h.name} style={{ display: "flex", alignItems: "center", gap: 10, opacity: i === 0 ? Math.max(0.5, highlight) : 0.8 }}>
                <div style={{ width: 14, height: 14, borderRadius: 4, background: h.color }} />
                <div style={{ fontSize: 18, fontWeight: 600 }}>{h.name}</div>
                <div style={{ fontSize: 16, color: theme.muted }}>R{h.value.toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 30, display: "flex", gap: 12 }}>
          <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 20, padding: "12px 20px" }}>
            <div style={{ fontSize: 11, color: theme.muted, letterSpacing: 1 }}>TOTAL INVESTED</div>
            <div style={{ fontSize: 22, fontWeight: 700, marginTop: 2 }}>R{total.toLocaleString()}</div>
          </div>
          <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 20, padding: "12px 20px" }}>
            <div style={{ fontSize: 11, color: theme.muted, letterSpacing: 1 }}>PROJECTED 1Y</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: theme.primary, marginTop: 2 }}>R{Math.round(total * 1.12).toLocaleString()}</div>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 32, padding: 28, height: 640, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <div style={{ width: 36, height: 36, borderRadius: 12, background: `${theme.primary}22`, display: "grid", placeItems: "center", color: theme.primary, fontWeight: 700 }}>AI</div>
          <div style={{ fontFamily: "Space Grotesk", fontSize: 22, fontWeight: 700 }}>AI Tutor</div>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12, overflow: "hidden" }}>
          {messages.map((m, i) => {
            const s = spring({ frame: chatShow - (m.at - 100), fps, config: { damping: 20 } });
            if (s <= 0) return null;
            return (
              <div
                key={i}
                style={{
                  alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                  maxWidth: "85%",
                  background: m.role === "user" ? theme.primary : theme.bg,
                  color: m.role === "user" ? "#062018" : theme.text,
                  padding: "14px 18px",
                  borderRadius: 22,
                  fontSize: 18,
                  lineHeight: 1.4,
                  opacity: s,
                  transform: `translateY(${interpolate(s, [0, 1], [12, 0])}px)`,
                }}
              >
                {m.text}
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Donut: React.FC<{ segments: typeof holdings; total: number; highlightIdx: number; highlightAmt: number }> = ({ segments, total, highlightIdx, highlightAmt }) => {
  const size = 260;
  const r = 100;
  const cx = size / 2;
  const cy = size / 2;
  let a0 = -Math.PI / 2;
  return (
    <svg width={size} height={size}>
      {segments.map((s, i) => {
        const frac = s.value / total;
        const a1 = a0 + frac * Math.PI * 2;
        const large = frac > 0.5 ? 1 : 0;
        const push = i === highlightIdx ? 10 * highlightAmt : 0;
        const mid = (a0 + a1) / 2;
        const dx = Math.cos(mid) * push;
        const dy = Math.sin(mid) * push;
        const x0 = cx + Math.cos(a0) * r + dx;
        const y0 = cy + Math.sin(a0) * r + dy;
        const x1 = cx + Math.cos(a1) * r + dx;
        const y1 = cy + Math.sin(a1) * r + dy;
        const path = `M ${cx + dx} ${cy + dy} L ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1} Z`;
        a0 = a1;
        return <path key={i} d={path} fill={s.color} opacity={i === highlightIdx ? 1 : 0.85} />;
      })}
      <circle cx={cx} cy={cy} r={55} fill={theme.bg} />
      <text x={cx} y={cy - 4} textAnchor="middle" fill={theme.muted} fontSize="11" letterSpacing="1">TOTAL</text>
      <text x={cx} y={cy + 18} textAnchor="middle" fill={theme.text} fontSize="22" fontWeight="700">R{(total / 1000).toFixed(1)}k</text>
    </svg>
  );
};
