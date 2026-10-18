# Hogg Squash

A local-play browser squash game (1P vs CPU, or 2P on one keyboard / two gamepads), served at https://roninray.com/hogg-squash/ by Cloudflare Workers.

- Game files live in `public/hogg-squash/`. No build step: `public/` is served as-is.
- Every push to `main` deploys automatically via Cloudflare Workers Builds.
- `npm test` runs the physics tests (Node 18+). `npm run dev` serves locally with Wrangler.
- Start with `CLAUDE.md` and `docs/decisions.md`.
