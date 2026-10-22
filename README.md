# Hogg Squash

A local-play browser squash game (1P vs CPU, or 2P on one keyboard / two gamepads; 1P by touch on phones and tablets), served at https://roninray.com/hogg-squash/ by Cloudflare Workers. All-original pixel art, themed on Hogg Middle School (Razorbacks).

**Play:** open the page, pick 1 PLAYER or 2 PLAYERS, a match length and (1P) a level. P1 moves with W A S D and hits with F (HARD) and G (SOFT); P2 uses the arrows with Numpad 0 / Numpad . (OPTIONS remaps any key). Gamepads join with any button. On a phone, turn it sideways and use the on-screen stick and buttons. Esc pauses.

- Game files live in `public/hogg-squash/`. No build step: `public/` is served as-is.
- Every push to `main` deploys automatically via Cloudflare Workers Builds.
- `npm test` runs the physics and unit tests (Node 18+); `npm run typecheck` checks the types. `npm run dev` serves locally with Wrangler (http://localhost:8787/hogg-squash/).
- Start with `CLAUDE.md`, `docs/decisions.md` and `docs/plan.md`.
