import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { theme } from "../theme";

export const SceneIntro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logo = spring({ frame, fps, config: { damping: 14, stiffness: 120 } });
  const title = spring({ frame: frame - 10, fps, config: { damping: 18 } });
  const tag = spring({ frame: frame - 25, fps, config: { damping: 20 } });
  const drift = Math.sin(frame / 30) * 6;

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
      <div
        style={{
          transform: `scale(${logo}) translateY(${drift}px)`,
          width: 160,
          height: 160,
          borderRadius: 44,
          background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDim})`,
          display: "grid",
          placeItems: "center",
          boxShadow: `0 0 100px ${theme.primary}66`,
          marginBottom: 40,
        }}
      >
        <div style={{ fontFamily: "Space Grotesk", fontSize: 96, fontWeight: 700, color: "#052015" }}>S</div>
      </div>
      <div
        style={{
          fontFamily: "Space Grotesk",
          fontSize: 108,
          fontWeight: 700,
          letterSpacing: -2,
          opacity: title,
          transform: `translateY(${interpolate(title, [0, 1], [30, 0])}px)`,
        }}
      >
        SmartInVest
      </div>
      <div
        style={{
          marginTop: 20,
          fontSize: 30,
          color: theme.muted,
          opacity: tag,
          transform: `translateY(${interpolate(tag, [0, 1], [20, 0])}px)`,
        }}
      >
        AI-powered investing, from just <span style={{ color: theme.primary, fontWeight: 600 }}>R50</span>
      </div>
    </AbsoluteFill>
  );
};
