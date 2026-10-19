# Hogg Squash: notes for Claude

A browser-based squash game that plays like Gaelco's *Squash* (1992 arcade), with all-original pixel art.
Themed on Hogg Middle School (Razorbacks; red, black, white). **Local play only:** 1 player vs CPU, or 2 players on one keyboard or two gamepads. There is no online play, ever.

**Status:** in development, following `docs/plan.md`. Its status list shows what's done; the next session is the first unticked line.
Read `docs/decisions.md` first, then `docs/plan.md` (its rules, your session, and the Session log).

## How this repo is served
- `public/` is served as-is by the Cloudflare Worker `hogg-squash` (see `wrangler.jsonc`).
- The game lives in `public/hogg-squash/`, which is https://roninray.com/hogg-squash/.
- **Every push to `main` deploys to the live site automatically.** Ask before pushing, and never push something that breaks the page.
- **No build step (yet).** This was decided on purpose. Write plain JavaScript ES modules that run directly from `public/`. Don't add Vite, TypeScript compilation or npm runtime dependencies without asking.
- ES modules don't load from `file://`. Test locally with a static server (`npx wrangler dev`, or `python -m http.server` inside `public/`).

## Physics core
- A verified port of the arcade's ball physics and shot system: `public/hogg-squash/js/squash-physics.js`. Tests: `npm test` from the repo root (Node 18+) replays ~30,000 recorded arcade frames from `test/fixtures/`. **Run the tests after any change to the physics file.**
- The maths is integer 16.16 fixed-point at the arcade's frame rate (1/57.4 s per frame), checked frame by frame against the real game in MAME. **Don't "simplify" or convert it to floats.** The tests would catch the change, but the arcade feel would be lost.
- See `docs/research/physics-core.md` and `docs/research/squash-game-logic.md`.

## Architecture rules
- Plain JavaScript ES modules with `// @ts-check` and JSDoc types. No build. `npm run typecheck` checks the types of everything in `public/hogg-squash/js/` (TypeScript's checker via `npx`, pinned in `package.json`; check only, no output).
- Keep the simulation (physics, rules, CPU) separate from rendering and input. The sim runs at a fixed step; rendering just draws the latest state.
- Input is abstracted into per-player actions (`left right up down hard soft`), so keyboard and gamepad are interchangeable. See `docs/controls.md`.
- The sim is 3D (x = width, y = height, z = depth from the front wall), projected to a fixed 2D camera behind the players.

## IP rules (important)
- Never commit the ROM, MAME, extracted graphics or sounds, screenshots, or anything traced from them. Research material stays in `../Research Info/`, outside the repo.
- Hogg Middle School's name, colours and logo are approved for use by the project owner.
- Don't use the Gaelco name, the "Squash" logo, or any of the original's art or audio. Recreating gameplay mechanics is fine.

## Docs
- `docs/decisions.md`: settled decisions (v1 scope, match rules, difficulty 1–9, controls, screens, art, repo layout).
- `docs/open-questions.md`: small details for the plan to settle, each with a default.
- `docs/controls.md`: keyboard and gamepad layout and the pitfalls to avoid.
- `docs/art-style-guide.md`: art direction (640×360 pixel art), sprite list, SpriteCook + Aseprite pipeline.
- `docs/theme.md`: the Hogg Middle School / Razorbacks theme and colours.
- `docs/research/canvas-vs-phaser.md`: renderer comparison (decided: plain Canvas) and the step-1 test.
- `docs/design-notes.md`: the original full design spec (predates the decisions).
- `docs/research/`: arcade research, decompiled game logic and physics core notes.
