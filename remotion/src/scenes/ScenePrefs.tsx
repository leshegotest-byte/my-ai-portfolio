import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { Pill } from "../components/PersistentBg";
import { theme } from "../theme";

const risks = ["Low", "Medium", "High"];
const goals = ["Growth", "Income", "Retirement", "Wealth"];
const sectors = ["Technology", "Finance", "Energy", "Healthcare", "Consumer", "Property", "Mining", "Telecoms"];

export const ScenePrefs: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const title = spring({ frame, fps, config: { damping: 18 } });

  return (
    <AbsoluteFill style={{ padding: 100, flexDirection: "column", justifyContent: "center" }}>
      <div style={{ opacity: title, transform: `translateY(${interpolate(title, [0, 1], [20, 0])}px)` }}>
        <div style={{ fontSize: 22, color: theme.primary, fontWeight: 600, marginBottom: 12 }}>STEP 02 · PERSONALIZE</div>
        <div style={{ fontFamily: "Space Grotesk", fontSize: 84, fontWeight: 700, letterSpacing: -1, lineHeight: 1.05 }}>
          Tell us what you're after
        </div>
        <div style={{ fontSize: 26, color: theme.muted, marginTop: 16 }}>
          Risk, goal, and the sectors you love — the AI uses this to rank every pick.
        </div>
      </div>

      <div style={{ marginTop: 80, display: "flex", flexDirection: "column", gap: 40, maxWidth: 1400 }}>
        <PillRow label="RISK APPETITE" items={risks} activeIndex={1} startFrame={30} highlightAt={70} frame={frame} fps={fps} />
        <PillRow label="INVESTMENT GOAL" items={goals} activeIndex={0} startFrame={80} highlightAt={130} frame={frame} fps={fps} />
        <PillRow label="SECTORS" items={sectors} activeIndex={0} multi={[0, 3, 5]} startFrame={140} highlightAt={200} frame={frame} fps={fps} />
      </div>
    </AbsoluteFill>
  );
};

const PillRow: React.FC<{
  label: string;
  items: string[];
  activeIndex: number;
  multi?: number[];
  startFrame: number;
  highlightAt: number;
  frame: number;
  fps: number;
}> = ({ label, items, activeIndex, multi, startFrame, highlightAt, frame, fps }) => {
  return (
    <div>
      <div style={{ fontSize: 16, color: theme.muted, letterSpacing: 2, marginBottom: 16 }}>{label}</div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {items.map((it, i) => {
          const s = spring({ frame: frame - startFrame - i * 5, fps, config: { damping: 18 } });
          const active = multi ? multi.includes(i) : i === activeIndex;
          const highlighted = active && frame >= highlightAt;
          return (
            <div key={it} style={{ transform: `scale(${s})`, opacity: s }}>
              <Pill active={highlighted} style={{ fontSize: 22, padding: "12px 24px" }}>{it}</Pill>
            </div>
          );
        })}
      </div>
    </div>
  );
};
