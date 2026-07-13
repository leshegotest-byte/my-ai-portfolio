import React from "react";
import { AbsoluteFill } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadGrotesk } from "@remotion/google-fonts/SpaceGrotesk";
import { theme } from "./theme";
import { PersistentBg } from "./components/PersistentBg";
import { SceneIntro } from "./scenes/SceneIntro";
import { SceneAuth } from "./scenes/SceneAuth";
import { ScenePrefs } from "./scenes/ScenePrefs";
import { SceneDiscover } from "./scenes/SceneDiscover";
import { SceneBuy } from "./scenes/SceneBuy";
import { ScenePortfolio } from "./scenes/ScenePortfolio";
import { SceneOutro } from "./scenes/SceneOutro";

loadInter("normal", { weights: ["400", "500", "600", "700"], subsets: ["latin"] });
loadGrotesk("normal", { weights: ["500", "700"], subsets: ["latin"] });

const DUR = {
  intro: 150,
  auth: 240,
  prefs: 270,
  discover: 300,
  buy: 240,
  portfolio: 270,
  outro: 120,
};
const T = 20; // transition overlap
export const TOTAL_FRAMES =
  DUR.intro + DUR.auth + DUR.prefs + DUR.discover + DUR.buy + DUR.portfolio + DUR.outro - T * 6;

const transition = () => (
  <TransitionSeries.Transition
    presentation={fade()}
    timing={linearTiming({ durationInFrames: T })}
  />
);

export const MainVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: theme.bg, fontFamily: "Inter, sans-serif", color: theme.text }}>
      <PersistentBg />
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={DUR.intro}>
          <SceneIntro />
        </TransitionSeries.Sequence>
        {transition()}
        <TransitionSeries.Sequence durationInFrames={DUR.auth}>
          <SceneAuth />
        </TransitionSeries.Sequence>
        {transition()}
        <TransitionSeries.Sequence durationInFrames={DUR.prefs}>
          <ScenePrefs />
        </TransitionSeries.Sequence>
        {transition()}
        <TransitionSeries.Sequence durationInFrames={DUR.discover}>
          <SceneDiscover />
        </TransitionSeries.Sequence>
        {transition()}
        <TransitionSeries.Sequence durationInFrames={DUR.buy}>
          <SceneBuy />
        </TransitionSeries.Sequence>
        {transition()}
        <TransitionSeries.Sequence durationInFrames={DUR.portfolio}>
          <ScenePortfolio />
        </TransitionSeries.Sequence>
        {transition()}
        <TransitionSeries.Sequence durationInFrames={DUR.outro}>
          <SceneOutro />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
