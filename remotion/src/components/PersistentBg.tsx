import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { theme } from "../theme";

export const PersistentBg: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  return (
    <AbsoluteFill style={{ background: theme.bg, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(1200px 800px at ${20 + Math.sin(t * 0.3) * 10}% ${30 + Math.cos(t * 0.25) * 10}%, ${theme.primary}22 0%, transparent 60%), radial-gradient(1000px 700px at ${80 + Math.cos(t * 0.2) * 8}% ${70 + Math.sin(t * 0.35) * 8}%, ${theme.accent}18 0%, transparent 60%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `linear-gradient(${theme.border}55 1px, transparent 1px), linear-gradient(90deg, ${theme.border}55 1px, transparent 1px)`,
          backgroundSize: "80px 80px",
          opacity: 0.15,
          maskImage: "radial-gradient(ellipse at center, black 40%, transparent 80%)",
        }}
      />
    </AbsoluteFill>
  );
};

export const Phone: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div
    style={{
      width: 440,
      height: 900,
      background: theme.bg2,
      borderRadius: 56,
      border: `2px solid ${theme.border}`,
      boxShadow: `0 40px 120px ${theme.primary}22, 0 0 0 12px #050807`,
      overflow: "hidden",
      position: "relative",
      ...style,
    }}
  >
    <div style={{ position: "absolute", top: 18, left: "50%", transform: "translateX(-50%)", width: 120, height: 28, background: "#000", borderRadius: 20, zIndex: 10 }} />
    <div style={{ padding: "56px 22px 22px", height: "100%", boxSizing: "border-box" }}>{children}</div>
  </div>
);

export const Pill: React.FC<{ children: React.ReactNode; active?: boolean; style?: React.CSSProperties }> = ({ children, active, style }) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "8px 16px",
      borderRadius: 999,
      fontSize: 14,
      fontWeight: 500,
      background: active ? theme.primary : theme.card,
      color: active ? "#062018" : theme.muted,
      border: `1px solid ${active ? theme.primary : theme.border}`,
      ...style,
    }}
  >
    {children}
  </div>
);
