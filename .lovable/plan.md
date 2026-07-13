## Goal
Produce a ~45–55 second motion-graphics demo video (MP4) that walks through the SmartInVest app journey, plus a matching voiceover-ready script.

## Deliverables
1. `/mnt/documents/smartinvest-demo.mp4` — 1920×1080, 30fps, ~50s Remotion video
2. `/mnt/documents/smartinvest-script.md` — timed narration script aligned to each scene

## Video structure (6 scenes, ~50s total)

```text
Scene 1 (0–6s)   Logo reveal — "SmartInVest" wordmark + tagline
Scene 2 (6–14s)  Sign in with VodaPay — phone mockup, red VodaPay button, KYC + consent chips
Scene 3 (14–24s) Set preferences — risk / goal / sectors chips animating in
Scene 4 (24–34s) Browse & AI-ranked picks — instrument cards with "% match" badges, filter pills
Scene 5 (34–42s) Buy fractional shares — purchase sheet, R50 minimum, projected value
Scene 6 (42–50s) Portfolio + AI tutor + withdraw — pie chart highlight, chat bubbles, withdraw confirmation
Outro (50–54s)   "SmartInVest — invest smarter, from R50" + logo
```

## Visual direction
- Palette pulled from the app's dark theme: deep near-black background, primary green/teal accent (matching `--primary`), VodaPay red (#e60000) for the auth beat only, soft muted text
- Typography: Inter (body) + Space Grotesk (display) via `@remotion/google-fonts`
- Motif: rounded "pill" shapes echoing the app's `rounded-full` UI, a subtle animated gradient background, staggered card entrances (spring, damping 18)
- Motion system: default entrance = 12px translate-up + fade over 18 frames; hero moments = spring scale with slight overshoot; scene transitions = `wipe` from `@remotion/transitions` (consistent direction)

## Script (voiceover-ready, ~130 words)
Delivered plain-English, friendly tone, matched to scene timings — full text written in the script file. Rough beats:
- Hook: "Meet SmartInVest — the AI-powered way to start investing from just R50."
- Auth: "Sign in securely with VodaPay. KYC and consent handled in seconds."
- Preferences: "Tell us your risk, goal, and sectors you love."
- Discover: "Our AI ranks every instrument for you — see your match score at a glance."
- Buy: "Buy fractional shares from R50. See your projected value before you commit."
- Portfolio + AI: "Track everything in one place. Ask the built-in tutor anything — from 'what is fractional trading' to 'what's my best performer'."
- Withdraw + close: "Withdraw from any position, any time. SmartInVest — invest smarter."

## Technical approach
- Scaffold Remotion project under `remotion/` per the video-creator skill (musl compositor fix, ffmpeg symlinks)
- All motion via `useCurrentFrame()` + `interpolate` / `spring` — no CSS animations
- `<TransitionSeries>` with `wipe` transitions between scenes
- Mock up app UI in-scene with plain divs styled to match the app (no screenshots needed) — rounded cards, pill buttons, chat bubbles
- Render headlessly via `scripts/render-remotion.mjs` (muted, concurrency 1, chrome-for-testing)
- Spot-check 3–4 key frames with `remotion still` before the full render

## Out of scope
- No audio track baked in (script is delivered separately so you can record voiceover)
- No changes to the app source code

Ready to build on approval.