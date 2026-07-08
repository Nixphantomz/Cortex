# Cortex — Your AI DeFi Operator

Built for the OKX AI Genesis Hackathon (XLayer track).

## Phase 1 (this drop): Foundation
- Design tokens: charcoal/milky surfaces, lavender/mint/silver accents (`tailwind.config.ts`)
- Dark/light theme toggle, persisted, no flash on load
- The Orb — signature living element with 5 states: idle, thinking, executing, success, error (`components/orb.tsx`)
- Hero page with a working orb-state demo (click the orb)

## Run it locally

```bash
npm install
npm run dev
```

Then open http://localhost:3000. Click the orb to cycle through its states.

## Roadmap
- **Phase 2** — Chat interface (intent input → route/simulate/execute cards)
- **Phase 3** — Agent brain (LLM tool-calling for swap/lend/borrow decisions)
- **Phase 4** — On-chain execution (wagmi/viem + RainbowKit, XLayer integration)
- **Phase 5** — Portfolio intelligence (net worth, yield, idle-asset suggestions)
- **Phase 6** — Submission polish (demo video, OKX.AI listing copy, docs)

## Design principles (keep these as we build)
- The orb IS the status — no "Loading..." labels, no spinners
- Animations stay 200–400ms, nothing bounces or shakes
- Backgrounds are never pure black/white — always the warm charcoal / milky tones
- Judging criteria rewards a real, usable product over visual complexity — resist the urge to add features that don't serve "can this become a business?"
