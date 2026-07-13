import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { theme } from "../theme";

export const SceneOutro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logo = spring({ frame, fps, config: { damping: 14, stiffness: 120 } });
  const line = spring({ frame: frame - 20, fps, config: { damping: 20 } });
  const tag = spring({ frame: frame - 40, fps, config: { damping: 20 } });

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
      <div
        style={{
          transform: `scale(${logo})`,
          width: 120,
          height: 120,
          borderRadius: 32,
          background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDim})`,
          display: "grid",
          placeItems: "center",
          boxShadow: `0 0 80px ${theme.primary}66`,
          marginBottom: 30,
        }}
      >
        <div style={{ fontFamily: "Space Grotesk", fontSize: 68, fontWeight: 700, color: "#052015" }}>S</div>
      </div>
      <div
        style={{
          fontFamily: "Space Grotesk",
          fontSize: 88,
          fontWeight: 700,
          letterSpacing: -1.5,
          opacity: line,
          transform: `translateY(${interpolate(line, [0, 1], [20, 0])}px)`,
        }}
      >
        Invest smarter.
      </div>
      <div
        style={{
          marginTop: 16,
          fontSize: 32,
          color: theme.muted,
          opacity: tag,
        }}
      >
        <span style={{ color: theme.primary, fontWeight: 600 }}>SmartInVest</span> — from just R50.
      </div>
    </AbsoluteFill>
  );
};
