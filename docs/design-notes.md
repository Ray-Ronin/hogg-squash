> **Note (2026-10-18):** Written before the v1 scope decisions. Where this conflicts with [`decisions.md`](decisions.md), `decisions.md` wins. In particular: online play (sections 1, 6.3, 9) is dropped; v1 has no tournament, one character, no audio, no crowd; matches are one game to 5/7/9/11 (win by 2) with no faults-as-lives; difficulty is a 1–9 selector; P2 keys are arrows + Numpad 0 / Numpad .

# Hogg Squash — Web Game Design Notes (based on Gaelco Squash, 1992)

Starter spec for building the game later with Claude Code. Read `Squash_1992_Research.md` first for the source game's facts.

## 1. Goal
A browser game that plays like Gaelco's Squash: fast 1-on-1 squash from behind the players, two shot buttons,
aimable shots, dive, first to 9. Single-player tournament vs CPU, plus **online 1v1**. All art, characters and audio original.

## 2. Screen & camera
- Internal resolution 320×240 (arcade native), scaled up with nearest-neighbour for a crisp pixel look (or 640×480 for HD-pixel art).
- Camera behind the court looking at the front wall. Front wall near top of screen; floor recedes upward; side walls angled; glass back wall + crowd at bottom/foreground.
- Simulate in true 3D (x = width, y = height, z = depth from front wall), render with a simple projection to 2D. Draw a **shadow** under the ball on the floor + a **landing marker** for the predicted bounce.

## 3. Court model (real squash dimensions, scale as needed)
- 6.4 m wide × 9.75 m deep. Front wall: out-line 4.57 m, service line 1.78 m, tin 0.48 m.
- Side walls: out-line slopes from 4.57 m (front) to 2.13 m (back). Back wall out-line 2.13 m.
- Short line 5.49 m from front wall; half-court line; two service boxes.
- Rules to enforce: ball must hit front wall above tin and below out-line before bouncing; may hit side/back walls; must be returned before second bounce.

## 4. Physics
- Fixed timestep (e.g. 60 Hz). Ball: position/velocity in 3D, gravity, floor restitution ~0.5–0.6, slight drag.
- **Front wall should strongly damp depth speed (~0.3×)** — measured in the original: ~25 m/s in, ~7 m/s out. Side/back walls can be livelier.
- Shot = set ball velocity on contact:
  - **HARD**: high speed, low arc, aims to hit front wall low.
  - **SOFT**: low speed, drops short after the front wall (drop shot / boast).
  - Shot angle: in the original it comes from swing timing (early = angled one way, late = the other), not the joystick. Hogg Squash could keep that or add joystick aiming as a deliberate change.
- Contact window: ball within racket reach (sphere around player's hitting side) while button pressed; timing offset alters accuracy.
- Dive: burst toward ball with extended reach, then a recovery lockout (~0.6–1.0 s) where the player can't move.
- No player–player collision (matches the original).

## 5. Rules & flow
- Serve from a service box, alternating sides; serve must land in opposite back quarter. Serve timer (show a clock after ~5 s, auto-fault later).
- First to 9 wins the game. Option setting: classic hand-in/hand-out (server scores only) vs rally scoring (PAR). Default to whichever MAME play-testing shows the original used.
- Callouts: OUT, FAULT, POINT, "Game", "Match" (announcer voice + big sprite text).
- Arcade mode extras: "balls"/faults as lives (default 5), extra-ball awards, score points, top-10 high-score table with 6-char names.

## 6. Modes
1. **Tournament (1P vs CPU):** pick 1 of 8 characters → Qualify → Round of 16 → Quarter-final → Semi-final → Final. Each round new court + harder CPU.
2. **Versus local** (two players, one keyboard / two gamepads).
3. **Versus online** (headline feature).
4. Practice (solo against the wall).

## 7. CPU AI
- Predict ball trajectory (run physics forward) → move to intercept point.
- Difficulty knobs: reaction delay, movement speed, prediction error, shot choice quality (aims away from the opponent), dive willingness. Map to Easy / Normal / Hard / Hardest like the original DIP setting.

## 8. Characters
8 original players, each with a country flag, portrait, colour scheme, and small stat differences (speed, power, reach, dive recovery). Keep the spread small so all are viable.

## 9. Online multiplayer architecture (suggested)
- Client: TypeScript + HTML5 Canvas (or Phaser 3 / PixiJS). Deterministic fixed-step simulation.
- Networking: WebSocket server (Node.js, e.g. Colyseus or a plain `ws` server) with **server-authoritative** physics, client-side prediction for your own player, interpolation for the opponent and the ball. Alternative: rollback netcode (GGPO-style) — great for a 2-player game but needs fully deterministic physics.
- Matchmaking: quick match + private room codes. Leaderboards in a small DB (e.g. SQLite/Postgres/Supabase).
- Input: keyboard (arrows + Z = soft, X = hard), Gamepad API, touch controls for mobile.

## 10. Presentation checklist
- Big, well-animated sprites (run, ready stance, forehand, backhand, dive, celebrate, dejected).
- Animated crowd behind the glass that reacts to points; ad boards on walls; several distinct courts.
- Score panel: player names + flags, points, serve indicator, timer.
- Attract mode, title screen, how-to-play screen ("WIN 9 POINTS", SOFT / HARD buttons), character select with flags, tournament bracket, game over / continue, name entry.
- Leave out the original's between-point pin-up images.

## 11. Legal / IP
The ROM, its graphics and sounds are Gaelco's copyrighted material (now part of a commercial 2026 re-release). Use the extracted assets only as visual/audio reference. Don't ship them or anything traced from them, and don't use the name "Squash by Gaelco" or their logos. Gameplay mechanics themselves are fine to recreate.

## 12. Answered by the MAME run (see research doc §0)
- 8 countries: Germany, USA, Russia, Italy, Turkey, Brazil, Spain, Japan (no names shown).
- Rally scoring, first to 9. Button 1 = HARD, Button 2 = SOFT.
- Faults: lose a point = lose a fault; 5 per credit; continue keeps the score.
- Ball timing targets for physics tuning: hit→front wall ≈0.35 s; front wall→bounce ≈0.9 s; ~25 m/s in, ~7 m/s back off the front wall (heavy front-wall damping is what makes rallies playable); impact height ~2.6 m; max height ~4 m.
- Presentation: grandstand intro/outro ("Royal Squash Club", cheerleaders), POINT/OUT + giant score on the front wall, "ball in play" fault icons at each serve, CONTINUE countdown on the front wall, red landing arrow, ball shadow, front-wall impact ring.

## 12b. From the decompiled code (see `Squash_Game_Logic.md`)
- Copy the original's exact model: game units (x ±144, z 0–183, glass 75 high), 16.16 velocities, gravity ≈0.123 u/frame²,
  speed-dependent restitution table (0.68→0.31), front wall judged at 2× impact speed, floor keeps 1.5× depth speed, floor friction.
- Hitting: 7-frame look-ahead → contact type (12 kinds) × court zone (3) × button (2) table → velocity formula + 0.75–1.19× random. Shot angle = swing timing (early/late), not joystick.
- A verified JavaScript physics core is in `public/hogg-squash/js/squash-physics.js` (npm test replays the arcade frame-by-frame).
- CPU: reaction delay (16 frames at Normal start → 1 frame at Hardest top) + earliest-reachable intercept + recover to the T with error.
- Difficulty index = DIP × 5 + hidden skill level (0–4, rises as you win). Rubber-band bump when the human runs away early.
- Tournament: 5 games to 9; +2 faults per round won; 2P best of 5 (or 3).

## 13. Still open
- Character stats: none found in code (likely cosmetic).
- Answered in code: 1P = one game per round; 2P = best of 5 or 3.
- Later rounds' courts and what "REPLAY" does (EXTRA BALL = +2 faults per round won).
- Answered: shot angle comes from swing timing, not the joystick; run speed 2.5 (sideways) / 1.25 (depth) units per frame. Still open: dive range.
(A smarter bot in `mame_run/squash_probe.lua` — move under the landing arrow, swing when the ball is near — could answer these.)
