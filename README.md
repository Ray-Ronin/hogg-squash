# Hogg Squash

A local-play browser squash game (1P vs CPU, or 2P on one keyboard / two gamepads; 1P by touch on phones and tablets), served at https://roninray.com/hogg-squash/ by Cloudflare Workers. All-original pixel art, themed on Hogg Middle School (Razorbacks).

**Play:** open the page, pick 1 PLAYER or 2 PLAYERS, a match length and (1P) a level, then your characters. P1 moves with W A S D and hits with F (HARD) and G (SOFT); P2 uses the arrows with Numpad 0 / Numpad . (OPTIONS remaps any key). Gamepads join with any button. On a phone, turn it sideways and use the on-screen stick and buttons. Esc pauses.

- **Characters:** Ronin, Adam, Ben and Coach Zain, each with their own look (P2 and the CPU wear the white kit).
- **Sound:** hits, bounces, the tin, callouts and menu sounds, silent until your first key, click or tap. The Effects level is in OPTIONS; Sound on/off is in the pause menu and on the speaker button.
- **Tournament:** a knockout bracket of 2, 4, 8 or 16 players, as many of them people as you like (the rest are bots at one level, 1–9). Same or rising match lengths, a round title card before each match you play or watch, SKIP or SKIP BOT MATCHES for the bots' matches, a gold trophy for the champion. A human who loses to a bot plays that match again; the tournament is saved in the browser after every match, so you can continue it later.

- Game files live in `public/hogg-squash/`. No build step: `public/` is served as-is.
- Every push to `main` deploys automatically via Cloudflare Workers Builds.
- `npm test` runs the physics and unit tests (Node 18+); `npm run typecheck` checks the types. `npm run dev` serves locally with Wrangler (http://localhost:8787/hogg-squash/).
- Start with `CLAUDE.md`, `docs/decisions.md` and `docs/plan-v2.md` (`docs/plan.md` is the v1 plan and its history).
