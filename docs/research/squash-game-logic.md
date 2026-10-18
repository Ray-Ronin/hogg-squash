# Squash (Gaelco, 1992) — How the Game Logic Works

Reverse-engineered 2026-10-18 from the program ROM (`squash.d16` + `squash.d18`, World ver. 1.0) with **Ghidra 12.1.3** (headless,
in a cloud workspace), and cross-checked against the MAME recording in `mame_run/`. Addresses are 68000 ROM / RAM addresses so
anyone can find them again in `ghidra_analysis/listing.asm`.

**Confidence key:** ✅ read directly from code and matched against MAME data · 🟡 read from code, meaning inferred · ❓ not found yet.

---

## 1. Big picture

- 68000 game loop: a frame-synced main loop (`0x0424`) plus a **cooperative "object" scheduler**. 24 object slots
  (64 bytes each) live at `0xFF8000–0xFF85FF`; each active object runs a handler picked from a type table at `0x0478`
  (crowd, scoreboard, HUD text, predictor, etc.). ✅
- Four fixed "actors" follow the object table: **ball `0xFF8600`**, **player 1 `0xFF8630`**, **player 2 `0xFF8660`**, and a
  spare (`0xFF8690`). Each is 0x30 bytes. ✅
- Global game mode `0xFFB7B0` selects the top-level screen (12 = match setup/select, 13 = match in progress, …) and
  `0xFFB93E` is the rally sub-state (1 = rally live, 2 = point being scored). ✅
- Scores: `0xFFB948` (P1) / `0xFFB949` (P2). Faults remaining: `0xFFB9C4`. Round: `0xFFB9C0`. ✅

### Copy protection (why the game was hard to read)
Gaelco hid most of the control flow:
- **Encrypted jump tables.** `trap #1` is a switch statement whose table of addresses is stored *encrypted*. The handler writes
  each entry through the custom "encrypted screen RAM" at `0x102000` and reads back the decrypted address. ✅
- **Encrypted constants.** Gravity, shot tables and some return addresses are stored encrypted and only become real numbers when
  written through the same chip (e.g. gravity is written to `0x102408`, shot parameters to `0x10240C`). ✅
- I ported MAME's Gaelco decryption (keys `0x0F / 0x4228`) to Python (`ghidra_analysis/gcrypt.py`) and a Ghidra script, and
  decrypted 22 jump tables (197 code targets), the gravity table and all shot tables. ✅
- Other "traps" are the game's mini-OS: `trap #2` run objects, `trap #3` spawn object (inline id), `trap #4` sound,
  `trap #5` spawn with inline parameters, `trap #8` queue sound. ✅

---

## 2. Coordinate system (game units)

| Axis | Field | Range | Notes |
|---|---|---|---|
| x (left/right) | ball `+0x02` | **−144 … +144** | side walls at ±0x90 ✅ |
| y (height) | ball `+0x06` | 0 = floor | back-wall glass is 75 units high ✅ |
| z (depth) | ball `+0x0A` | **0 = front wall … 183 = back wall** | 0x125 (293) = ball has left the court ✅ |

- Positions and velocities are 32-bit **16.16 fixed point**; velocities at `+0x0E (vx) / +0x12 (vy) / +0x16 (vz)`. ✅
- The court is **not** to real scale: width 288 units = 6.4 m (≈45 u/m), depth 183 units = 9.75 m (≈19 u/m),
  height ≈35 u/m. For Hogg Squash, simplest is to copy these game units and the camera projection rather than "real metres".
- The game runs at ~57.4 fps (arcade refresh), with a global time-scale multiplier (below).

---

## 3. Ball physics (✅ `0x80C6` integrate, `0x81C2` collide, `0x82D2` restitution)

Every frame — **collisions are checked first, then the ball moves** (confirmed frame-by-frame in MAME; the 7-frame swing look-ahead uses the opposite order). The predictor reuses the same two functions:

```js
// S = gameSpeed/256 (1.094 … 1.188 by difficulty, table 0x1FEE); G = gravity (0x1F80…0x2140 / 65536)
// all values in game units per frame (16.16 fixed point in the original)
function integrate(b) {
  if (Math.abs(b.vx) <= 0.25) b.vx = 0;          // tiny velocities snap to zero
  if (Math.abs(b.vz) <= 0.25) b.vz = 0;
  b.x += b.vx * S;
  b.z += b.vz * S;   if (b.z >= 293) b.outOfCourt = true;
  b.y += b.vy * S;
  if (b.y > 0) b.vy -= G;                        // gravity only while airborne
  else {                                         // rolling on the floor: friction
    b.vx = towardZero(b.vx, 0.0625);
    b.vz = towardZero(b.vz, 0.0625);
  }
}

function collide(b) {
  if (b.x <= -144 && b.vx < 0) { b.vx = -b.vx; damp(b, |b.vx|);      event('sideWall'); }
  else if (b.x >= 144 && b.vx > 0) { b.vx = -b.vx; damp(b, |b.vx|);  event('sideWall'); }
  else if (b.z <= 0 && b.vz < 0) { b.vz = -b.vz; damp(b, 2*|b.vz|);  event('frontWall'); } // front wall hits 2× harder
  else if (b.y <= 0 && b.vy < 0) {                                    // floor
    b.vy = -b.vy; if (b.vy < 0.25) b.vy = 0;
    b.bounces++;                                                      // 2nd bounce = point over
    dampFloor(b, |b.vy|);                                             // depth speed kept at 1.5× the coefficient
    event('floor');
  }
  else if (b.z >= 183 && b.y <= 75 && b.vz > 0) { b.vz = -b.vz; damp(b, |b.vz|); event('backGlass'); }
}

// restitution = table[idx]/256, idx = clamp(int(impactSpeed*2) - bounceOffset, 0, 31)
const REST = [173,169,164,159,155,150,146,142,138,134,130,126,123,119,116,113,
              110,107,104,101,99,96,94,92,90,88,86,84,83,81,80,79];   // 0.68 (slow) … 0.31 (fast)
// damp(): vx,vy,vz *= REST[idx]/256      dampFloor(): vx,vy *= c; vz *= 1.5*c
```

**Why rallies feel playable:** the front wall measures impact at *double* speed, so a hard 25 m/s drive comes off at only
~0.3× pace (MAME measured 25 → 7 m/s ✅). Slow balls keep ~68% of their speed. Harder difficulty levels shift `bounceOffset`
(−1 … −3), making the ball slightly "deader".

---

## 4. Hitting the ball (✅ `0x726A` classify, `0x6EF2` apply shot)

1. **Look-ahead:** when a player is about to hit, the game copies the ball and runs the physics **7 frames ahead** to see
   where the ball will be at contact. ✅
2. **Classify the contact** into flags on the player (`+0x1B`): ball high (>24 units), very high (>48 → overhead), stretched
   reach, which side of the body, too far away (no shot). ✅/🟡 (side = forehand/backhand is inferred)
3. **Pick a shot row** from one of three tables by the ball's depth: front court (z ≤ 72, table `0x77EC`), mid (≤ 136,
   `0x778C`), back (`0x784C`). Each table has 12 contact types × 2 buttons. ✅
4. **Apply the shot** (all ✅):
   - depth speed `vz = −old_vz/4 + power × 256 × powerMult` (powerMult 16–19 by difficulty) → toward the front wall
   - vertical `vy = lift / power` (so a fast shot gets less lift — trajectories are "aimed" at a wall height)
   - sideways `vx = old_vx/2 + (side − side×aim/4) × lateralMult`, mirrored for the other side of the body.
     **`aim` (0–7) is NOT the joystick** (tested: holding all 8 directions made no difference). It follows **timing**, i.e.
     where the ball is in depth relative to the player when struck: late (ball behind) → 0–2 = angled one way, level →
     3–4 = straight, early (ball in front) → 5–7 = angled the other way. ✅ (measured; the exact rule has ±1–2 scatter)
   - **randomness:** final depth speed × (0.75 … 1.19) from a frame-counter RNG.
   - near a side wall the sideways speed is clamped so you can't drive straight into the wall.

**Check against MAME:** power 112 at Normal gives 8.1 units/frame ≈ **25 m/s** and reaches the front wall in ~0.39 s at
≈2.7 m — MAME measured 25 m/s, ~0.35 s and ~2.6 m. ✅

**HARD vs SOFT:** bank 1 = Button 1 (HARD), bank 2 = Button 2 (SOFT) — ✅ confirmed on every recorded swing. In the data, HARD gives higher, deeper *drives*; SOFT gives low front-wall shots
(drops/kills, some very fast low "kill" shots on high balls in the front court).

Full decrypted tables (approximate m/s and wall heights): see **§9**.

### The landing arrow & CPU target (✅ `0x7DFA` predictor, `0x7FCC` target choice)
After each hit a "ghost ball" object re-runs the physics 3 steps per frame until it detects front-wall → floor, records up to
4 candidate intercept points (x, z, frame), and flags `0xFFBAC0`. That point drives the red landing arrow and the CPU.

---

## 5. Players

- Run speed field = 0x14000 (1.25). Measured movement: **2.5 units/frame sideways, 1.25 units/frame in depth**,
  diagonals get both at full speed; joystick UP = toward the front wall. Slower (0xC000) while swinging/recovering. ✅
- **Serves** use a fixed straight trajectory (vx 0, vz −9.0, vy ≈ 6.5 units/frame) from a serve table (`0x7404`). ✅
- Both players had identical speed and shot multipliers in the recording, and **no per-character stat table was found** —
  the 8 characters appear to be cosmetic (portrait, flag, shirt). 🟡 (worth one more check if stats matter to you)
- Dive: when the contact is a "stretch", a dive/stretch animation plays and the player can't move until it ends. 🟡
- There are 12 swing animations (pointer table `0x52FC`) matching the 12 contact types. ✅

---

## 6. CPU opponent (✅ `0x7B0E`, state machine in player `+0x1A`)

1. When it becomes the CPU's turn, start a **reaction-delay countdown** (frames, from the difficulty table) and spawn the predictor.
2. Wait for the delay.
3. When the predictor has a landing solution, choose the **earliest intercept point it can reach in time**
   (run time + reaction delay vs. frames until the ball gets there); if none is reachable, take the best one. Stand 32 units
   to the side so the ball is on the racket side. Clamp to the court (x −147…104, z 22…178).
4. Run there; when the ball reaches the planned contact frame, classify and swing (same shot tables as the human).
5. After hitting, **recover toward the T** (centre, about z = 96) — but offset by a **positioning error** that grows each
   rally by the table's "error step", so it occasionally leaves gaps. ✅/🟡

### Rubber-banding (✅ `0x38FE`, `0x3AAE`)
- In the early rounds (round number ≤ continues used + 1), if **you lead by 4+ while under 7 points**, or **reach 7 while
  the CPU is under 7**, the CPU's difficulty index is bumped up mid-match (table `0x3844`).
- After every point the CPU's positioning error grows by its "error step"; if the CPU leads by 4+, a further handicap value
  is bumped. 🟡 Run speeds are also trimmed slightly (by 0x400) after points.

---

## 7. Difficulty, rounds and lives

### Difficulty index = DIP difficulty × 5 + "skill level" (0–4) ✅ (`0x38A8`)
"Skill level" (`0xFFB9BE`) rises as you win rounds; it is a hidden rating of how well you're playing.

| DIP difficulty | skill level | CPU reaction delay (frames) | CPU positioning error step | game speed | shot power mult | bounce offset | gravity |
|---|---|---|---|---|---|---|---|
| Normal | 0 | 16 | 16 | 280 (1.094×) | 17 | -1 | 0x1F80 |
| Normal | 1 | 8 | 12 | 284 (1.109×) | 18 | -2 | 0x1FB8 |
| Normal | 2 | 7 | 10 | 288 (1.125×) | 18 | -2 | 0x1FF0 |
| Normal | 3 | 6 | 8 | 288 (1.125×) | 19 | -3 | 0x2028 |
| Normal | 4 | 4 | 4 | 292 (1.141×) | 19 | -3 | 0x2060 |
| Easy | 0 | 20 | 20 | 280 (1.094×) | 16 | 0 | 0x1F80 |
| Easy | 1 | 12 | 16 | 284 (1.109×) | 17 | -1 | 0x1FB8 |
| Easy | 2 | 8 | 10 | 288 (1.125×) | 18 | -2 | 0x1FF0 |
| Easy | 3 | 5 | 7 | 292 (1.141×) | 18 | -2 | 0x2028 |
| Easy | 4 | 4 | 5 | 292 (1.141×) | 19 | -2 | 0x2060 |
| Hard | 0 | 16 | 16 | 280 (1.094×) | 18 | -2 | 0x1F80 |
| Hard | 1 | 8 | 12 | 284 (1.109×) | 18 | -2 | 0x1FB8 |
| Hard | 2 | 5 | 8 | 288 (1.125×) | 19 | -3 | 0x1FF0 |
| Hard | 3 | 3 | 6 | 292 (1.141×) | 19 | -3 | 0x2060 |
| Hard | 4 | 2 | 3 | 296 (1.156×) | 19 | -3 | 0x2100 |
| Hardest | 0 | 10 | 12 | 288 (1.125×) | 18 | -2 | 0x1F80 |
| Hardest | 1 | 6 | 10 | 288 (1.125×) | 19 | -2 | 0x1FF0 |
| Hardest | 2 | 4 | 6 | 292 (1.141×) | 19 | -3 | 0x2140 |
| Hardest | 3 | 2 | 4 | 296 (1.156×) | 19 | -3 | 0x2060 |
| Hardest | 4 | 1 | 2 | 304 (1.188×) | 19 | -3 | 0x2140 |

### Tournament (1 player) ✅ (`0x4400`)
- 5 rounds: **Qualify Game → 8th Final → Quarter-Final → Semi-Final → Final**, one game to 9 each (rally scoring).
- **Win a round:** +2 faults ("EXTRA BALL"), round +1, skill level +1. In the Qualify round: win by **7+** → skill +2,
  win by **less than 2** → skill +0.
- **Win the Final** → ending sequence. **Lose** → CONTINUE countdown; continuing keeps the round and score.
- Faults: 4/5/6/7 per credit (DIP); each point you lose costs one.

### 2 players ✅
- Head-to-head **best of 5 games (first to 3)**, or **best of 3 (first to 2)** with the "2P continue: 1 credit / 3 games" DIP.
- The HUD's game boxes record each game's score.

---

## 8. Recreating it in Hogg Squash (practical recipe)

1. Use the game units in §2 and the physics in §3 at a 57.4 Hz (or 60 Hz) fixed step. Start with Normal / skill 0:
   `S = 1.094`, `G = 0x1F80/65536 ≈ 0.123`, `powerMult = 17`, `bounceOffset = −1`.
2. Implement hitting as: look 7 frames ahead → classify contact → table lookup (§9) → velocity formula (§4) → ±random.
3. Show the ghost-ball landing marker; it doubles as the CPU's target.
4. CPU = reaction delay + run to the earliest reachable intercept + recover to the T with growing error; scale with the
   difficulty table; add the rubber-band rule.
5. Rally scoring to 9, faults as lives, 5-round ladder with +2 faults per round won.
6. Online versus: the physics is fully deterministic apart from the RNG — seed it from the match so both clients agree.

---

## 9. Decrypted shot tables

"power" = depth-speed byte, "lift" = vertical numerator (negative = smash downward), "side" = sideways byte. Speeds and
front-wall heights are estimates for a Normal/skill-0 game from a typical contact point. *forehand/backhand naming is inferred.

**Front court (ball depth ≤ 72)**

| # | contact | HARD power | HARD lift | HARD side | → speed m/s | → wall height m | SOFT power | SOFT lift | SOFT side | → speed m/s | → wall height m |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 0 | low, forehand* | 112 | 14336 | 104 | 25 | 1.7 | 80 | 3072 | 160 | 18 | 0.8 |
| 1 | high, forehand* | 112 | 16384 | 128 | 25 | 2.0 | 160 | 4096 | 192 | 36 | 0.5 |
| 2 | low, stretch, forehand* | 112 | 14336 | 96 | 25 | 1.7 | 96 | 4096 | 176 | 21 | 0.8 |
| 3 | high, stretch, forehand* | 112 | 18432 | 120 | 25 | 2.2 | 160 | 4096 | 160 | 36 | 0.5 |
| 4 | low, backhand* | 96 | 14336 | 96 | 21 | 2.3 | 96 | 4096 | 144 | 21 | 0.8 |
| 5 | high, backhand* | 112 | 16384 | 128 | 25 | 2.0 | 160 | 4096 | 192 | 36 | 0.5 |
| 6 | low, stretch, backhand* | 112 | 12288 | 96 | 25 | 1.5 | 96 | 4096 | 144 | 21 | 0.8 |
| 7 | high, stretch, backhand* | 128 | 14336 | 112 | 28 | 1.4 | 160 | 4096 | 144 | 36 | 0.5 |
| 8 | overhead (side 1) | 144 | 16384 | 64 | 32 | 1.3 | 128 | -512 | 160 | 28 | 0.2 |
| 9 | overhead (side 2) | 144 | 16384 | 64 | 32 | 1.3 | 112 | -512 | 160 | 25 | 0.2 |
| 10 | special (side 1) | 112 | 6144 | 80 | 25 | 0.9 | 112 | 6144 | 80 | 25 | 0.9 |
| 11 | special (side 2) | 112 | 5376 | 80 | 25 | 0.8 | 112 | 5376 | 80 | 25 | 0.8 |

**Mid court (73–136)**

| # | contact | HARD power | HARD lift | HARD side | → speed m/s | → wall height m | SOFT power | SOFT lift | SOFT side | → speed m/s | → wall height m |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 0 | low, forehand* | 112 | 9472 | 136 | 25 | 2.1 | 96 | 4096 | 144 | 21 | 1.1 |
| 1 | high, forehand* | 128 | 10240 | 160 | 28 | 1.8 | 128 | 4096 | 160 | 28 | 0.7 |
| 2 | low, stretch, forehand* | 120 | 10240 | 128 | 27 | 2.0 | 96 | 4096 | 144 | 21 | 1.1 |
| 3 | high, stretch, forehand* | 136 | 12288 | 96 | 30 | 1.9 | 128 | 4096 | 160 | 28 | 0.7 |
| 4 | low, backhand* | 104 | 10240 | 120 | 23 | 2.6 | 96 | 4096 | 144 | 21 | 1.1 |
| 5 | high, backhand* | 128 | 10240 | 160 | 28 | 1.8 | 128 | 4096 | 160 | 28 | 0.7 |
| 6 | low, stretch, backhand* | 104 | 8192 | 96 | 23 | 2.0 | 112 | 4096 | 144 | 25 | 0.9 |
| 7 | high, stretch, backhand* | 128 | 8192 | 96 | 28 | 1.4 | 128 | 4096 | 135 | 28 | 0.7 |
| 8 | overhead (side 1) | 192 | -384 | 208 | 43 | 0.1 | 128 | 1280 | 144 | 28 | 0.3 |
| 9 | overhead (side 2) | 176 | -384 | 208 | 39 | 0.1 | 128 | 1280 | 144 | 28 | 0.3 |
| 10 | special (side 1) | 112 | 6144 | 80 | 25 | 1.3 | 112 | 6144 | 80 | 25 | 1.3 |
| 11 | special (side 2) | 112 | 5376 | 80 | 25 | 1.2 | 112 | 5376 | 80 | 25 | 1.2 |

**Back court (> 136)**

| # | contact | HARD power | HARD lift | HARD side | → speed m/s | → wall height m | SOFT power | SOFT lift | SOFT side | → speed m/s | → wall height m |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 0 | low, forehand* | 112 | 9728 | 112 | 25 | 2.8 | 96 | 6144 | 96 | 21 | 2.1 |
| 1 | high, forehand* | 144 | 9728 | 144 | 32 | 1.8 | 96 | 6144 | 128 | 21 | 2.1 |
| 2 | low, stretch, forehand* | 120 | 9728 | 96 | 27 | 2.5 | 96 | 6144 | 80 | 21 | 2.1 |
| 3 | high, stretch, forehand* | 144 | 9728 | 96 | 32 | 1.8 | 96 | 6144 | 80 | 21 | 2.1 |
| 4 | low, backhand* | 112 | 9728 | 104 | 25 | 2.8 | 96 | 6144 | 80 | 21 | 2.1 |
| 5 | high, backhand* | 144 | 9728 | 144 | 32 | 1.8 | 80 | 6144 | 80 | 18 | 2.9 |
| 6 | low, stretch, backhand* | 120 | 9728 | 96 | 27 | 2.5 | 96 | 6144 | 80 | 21 | 2.1 |
| 7 | high, stretch, backhand* | 144 | 9728 | 96 | 32 | 1.8 | 96 | 6144 | 80 | 21 | 2.1 |
| 8 | overhead (side 1) | 192 | 8192 | 80 | 43 | 1.0 | 112 | 4096 | 80 | 25 | 0.9 |
| 9 | overhead (side 2) | 176 | 8192 | 80 | 39 | 1.1 | 112 | 4096 | 80 | 25 | 0.9 |
| 10 | special (side 1) | 112 | 6144 | 80 | 25 | 1.6 | 112 | 6144 | 80 | 25 | 1.6 |
| 11 | special (side 2) | 112 | 5376 | 80 | 25 | 1.4 | 112 | 6144 | 80 | 25 | 1.6 |

---

## 10. Not found yet ❓
- Exact front-wall **tin / out-line** height checks and the rules that call OUT.
- The exact formula behind the timing → `aim` value (the measured trend is in §4).
- CPU-only shot adjustments (the CPU's hits differ from the plain formula about half the time).
- Serve rules (service boxes, short line) — the serve routine wasn't traced.
- Character differences (none found, but not ruled out).
- What `0xFFB9C8` (a multiplier used for CPU delay and per-round bonuses) is for.

## 11. Verified JavaScript port (golden tests)
`prototype/` holds `squash-physics.js`, a fixed-point JavaScript port, plus tests that replay ~92,000 frames recorded from
the real game in MAME:
- **458 complete ball flights (29,634 frames) reproduced with zero error.**
- **Shot selection identical on 244/244 swings.** Human hit velocities exact on 87/98 hits (+24 serves).
Run `npm test` in `prototype/`.

## Files
- `ghidra_analysis/listing.asm` — full annotated disassembly (decrypted jump tables commented as `case n -> addr`).
- `ghidra_analysis/decompiled.c` — Ghidra pseudo-C for 357 functions (indirect jumps still read poorly in places).
- `ghidra_analysis/ram_xrefs.tsv` — which code reads/writes each RAM address.
- `ghidra_analysis/gcrypt.py` — Gaelco decryption (Python). `ghidra_analysis/scripts/` — the Ghidra scripts used.
