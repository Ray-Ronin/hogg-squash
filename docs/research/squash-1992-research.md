# Squash (Gaelco, 1992) — Research Reference

Compiled 2026-10-18 for the **Hogg Squash** web game project.
Sources: web research (listed at the bottom) plus direct analysis of the ROM set in this folder
(`Squash 1992 rom.zip`). Items marked **[ROM]** were confirmed by extracting text/graphics from the ROM.
Items marked **[unconfirmed]** are reasonable guesses that should be checked by playing the game in MAME.

---

## ⭐ See also `Squash_Game_Logic.md` (reverse-engineered code, 2026-10-18)
Decompiling the program ROM with Ghidra revealed the exact ball physics, shot tables, CPU AI, difficulty tables and tournament
rules. Highlights that update this doc: **winning a round gives +2 faults ("EXTRA BALL")**; the 1-player tournament is
5 single games to 9; **2-player matches are best of 5 games (or best of 3 by DIP)**; the CPU uses a reaction delay and a
"ghost ball" predictor; no per-character stats were found (characters appear cosmetic).

## 0. Findings from running the ROM in MAME (2026-10-18)

The game was run in MAME 0.289 with an automated Lua script (`mame_run/squash_probe.lua`) that watched attract mode,
inserted coins, cycled the character select and played ~3.5 minutes of matches with a random-input bot, recording
997 screenshots, real palettes, every frame of sprite RAM and periodic work-RAM dumps. Curated screenshots are in
`mame_screenshots/`. These findings replace earlier **[unconfirmed]** items.

### The 8 players (SELECT YOUR PLAYER screen, 2 rows of 4)
| Slot | Country (flag) | Look |
|---|---|---|
| Top 1 | **Germany** | blond, white shirt |
| Top 2 | **USA** | brown hair, green shirt, thumbs-up |
| Top 3 | **Russia** | blond with headband, red shirt |
| Top 4 | **Italy** | brown hair & moustache, blue shirt |
| Bottom 1 | **Turkey** | black hair & moustache, purple shirt |
| Bottom 2 | **Brazil** | Black player, orange shirt |
| Bottom 3 | **Spain** | glasses, yellow shirt |
| Bottom 4 | **Japan** | black hair, white/blue shirt |
- No names are shown anywhere — players are identified only by portrait + flag. Left/right moves the cursor and wraps within a row; the selected portrait pops out larger with "PLAYER 1" above it. Starfield + purple light-burst background.
- In-match, each player wears a distinct shirt colour (green, purple, blue, light-blue, white seen) so both are readable from behind.

### Controls — confirmed
- **Button 1 (left) = HARD, Button 2 (right) = SOFT.** The attract demo shows a two-button panel on the front wall with "HARD" lighting over the left button. Recorded hits after Button 1 presses were also faster on average.

### Scoring — confirmed **rally scoring, first to 9**
- Score bytes found in work RAM (`0xFFB948` = player 1, `0xFFB949` = opponent). Points were scored by both sides at a steady ~9–10 s cadence with no "hand-out" rallies in between (e.g. 0-1 → 1-1 → 1-2 …). Every rally awards a point to its winner — not real-1992 server-only scoring.
- The game ended at 9 (lost 2-9) and immediately went to CONTINUE / player select.
- HUD top-left has **4 boxes per player** with flags that fill in with the final game score (showed "2" / "9") — likely a multi-game record or round history **[still unconfirmed — need to win a game]**.

### Faults = lives
- **FAULT** counter (top-right, starts at 5 per credit) drops by 1 every time you **lose a point**. At 0 the screen dims and **CONTINUE — PLAY? 9…0** countdown appears on the front wall (insert coin + start to continue the same match, score kept).
- At each serve the front wall shows **"ball in play"** above 5 ball icons, with used faults crossed out with a red X.
- **CREDIT** counter shows credits remaining.

### Match presentation (in order)
1. Title: flaming "SQUASH" logo on orange gradient, Gaelco logo, "© 1992 Barcelona Gaelco S.A.". Boot shows a colour-bar test screen with ROM checksum 015AEF61.
2. **Match intro**: camera faces the glass back wall and grandstand of the **"Royal Squash Club"** — crowd, cheerleaders with pom-poms, players walk on facing the camera. Then it cuts to the behind-the-player view.
3. **Rally view**: camera behind the back wall looking at the front wall; full court floor visible; players seen from behind. A thin blue line across the floor marks the glass back wall.
4. After each point: **"POINT"** + giant score (e.g. "0-1") painted on the front wall; or **"OUT"** for out-of-court; a cheering spectator pops up in the bottom-right corner.
5. **Match end**: back to the grandstand view — winner celebrates with arms raised, loser slumps with dizzy stars.

### Courts seen
- **Attract-mode court**: green-tinted glass side walls with spectators visible through them, light-blue front wall, spotlights.
- **Qualify Game court**: beige plaster walls, light wooden floor, red court lines, ad boards along the tin.
- HUD round label read "QUALIFY GAME" throughout (the bot never won).

### HUD layout (320×240, top 26 px)
`[flags + 4 game boxes ×2] [ROUND NAME] [flag | POINTS p1 | p2 | flag] [rotating ad: Super Squash / Olympic Games / Power Ball / Racket for Winners] [FAULT n] [CREDIT n]`

### On-court helpers
- **Ball shadow** on the floor (separate sprite) — shows depth.
- **Red down-arrow landing marker** showing where the ball will bounce.
- **Impact ring** sprite where the ball strikes the front wall; a sparkle sprite on racket contact.
- Ball sprite has **7 sizes** (scaled by depth): codes F980 (nearest) → F998 (at front wall).

### Measured ball timing (approximate — from sprite tracking, 24 front-wall hits)
Depth/height converted to metres with a perspective fit of the court lines; treat as ±20%.
| Measurement | Typical |
|---|---|
| Racket hit → front wall | **~0.35 s** (0.17–0.78) |
| Front wall → first floor bounce | **~0.9 s** (up to 1.1) |
| Ball speed toward front wall | **~25 m/s** (14–43) |
| Ball speed coming back off front wall | **~7 m/s** (4–11) — the front wall kills most of the pace, giving time to reach it |
| Ball height at front-wall impact | ~2.6 m typical (0.2–3.3) |
| Max ball height | ~4.2 m |
| Typical contact height | ~0.3–1 m, often near the back of the court |
Raw data: `mame_screenshots/ball_analysis.json`.

### Rerunning / extending the probe
Double-click `mame_run/run_squash_probe.bat` (Windows). Edit `squash_probe.lua` to change what it records. A smarter bot (track the ball from sprite RAM and move under the landing arrow) would let it win and reveal the later rounds, other courts and what happens after winning.

---

## 1. At a glance

| Item | Detail |
|---|---|
| Title | Squash (Spanish working name also seen: *Frontón*) |
| Developer / Publisher | Gaelco S.A., Barcelona, Spain (in-house) |
| Year | 1992 — title graphic reads "© JUNE 1992 BARCELONA GAELCO S.A." **[ROM]** |
| Genre | Sports (racket sport), 1-on-1 |
| Players | 1 (vs CPU) or 2 simultaneous (head-to-head) |
| Controls | 8-way joystick + 2 buttons: Button 1 = **HARD**, Button 2 = **SOFT** (confirmed in MAME) |
| Cabinet | JAMMA, horizontal monitor, mono sound |
| Perspective | "Behind view": camera behind the players looking at the front wall, pseudo-3D court |
| Re-releases | Evercade *Gaelco Arcade 2* cartridge (2022); *Gaelco Sports Collection* by QUByte Interactive (PC/PS/Xbox/Switch, Oct 22 2026, censored) |

### Credits **[ROM — credits screen tiles]**
- **Director:** Luis Jonama (also a Gaelco co-founder)
- **Graphics:** Esteve Polls, Xavi Fradera
- **Software:** Alexander Ekjanov

---

## 2. Core gameplay

Taken from the official descriptions (Internet Archive / DeVuego / Critic, Sir!) and reviews:

- Follows the general rules of squash: serve against the front wall, players alternate hits until someone fails to return.
- **First to 9 points wins a game.** The in-game instruction screen literally says **"WIN 9 POINTS"** **[ROM]**.
  - Confirmed in MAME: **rally scoring** (every rally scores), not the 1992 real-world server-only rule. See §0.
- **Move** your player freely around the court with the joystick.
- **Two shot buttons:** HARD (fast, powerful) and SOFT (light / drop shot).
- **Aim:** you choose the direction of the shot when you strike (joystick direction at the moment of contact).
- **Dive:** a risky dive can reach balls that seem out of reach, but the recovery is slow, so you often miss the next return.
- **No collisions:** players cannot bump or block each other (no "let"/obstruction rules to implement).
- **Landing indicator:** a small marker shows where the ball will land (big help for readability — copy this).
- **Serve timer:** if you take too long to serve, a clock appears **("TIME" panel in ROM graphics)**.
- On-court callouts seen in graphics: **OUT**, **POINT**, **FAULT**, **REPLAY** **[ROM]**.
- A commentator voice announces results (reviewers criticised his English!). Many short voice samples in the sound ROM fit this (see §6).
- Reviewers: "controlled with amazing facility", "immediately fun and responsive", "faster paced" than Gaelco's volleyball game,
  realistic ball physics, great perspective. Criticisms: CPU can feel dull/clunky solo; much better with 2 players.

### Single-player progression (tournament)
- Pick 1 of **8 characters, each from a different country** (flag + portrait on select screen) **[ROM: "SELECT PLAYER", flags, 8+ portraits]**.
- Series of matches against progressively harder opponents.
- Tournament round banners in ROM **[ROM]**: **QUALIFY GAME → 8th FINAL → QT. FINAL (quarter) → SEMI-FINAL → FINAL**.
- Different courts as you progress (reviewers mention "several courts", "different courts add variety").
- Court-wall advertising boards in graphics: "OLYMPIC GAMES BARCELONA 1992", "SQUASH", "LEADER", "SUPER SOUND", "gaelco" logos **[ROM]** — a nod to the Barcelona '92 Olympics.
- Crowd/spectators behind the glass back wall cheer and applaud (lots of animated crowd sprites in ROM); reviewers single out the crowd effects as excellent.
- Between plays, the original shows pin-up images of women (one topless). The 2026 re-release hides this behind a Spanish flag. **Recommendation: leave this out of Hogg Squash.**

### Arcade "credit" economy
- A credit buys a limited number of **faults/balls** rather than a whole match. Confirmed in MAME: **each point you lose costs one fault**; at zero you get a 10-second CONTINUE countdown and keep the score if you pay again.
- Operator DIP "Number of Faults": 4 / **5 (default)** / 6 / 7.
- Graphics include **"EXTRA BALL"** banners (1–5) — extra balls appear to be awarded during play **[ROM; trigger condition unconfirmed]**.
- "CONTINUE" screen, "PUSH 1P TO TRY AGAIN", "GAME OVER", "INSERT COIN", "PUSH 1 OR 2 PLAYERS", "FREE PLAY".
- 2-player continue option: "2 credits / 5 games" or "1 credit / 3 games".
- For a web game, translate this into: lives/"balls" system for arcade mode, or drop it in favour of normal match play.

### Scoring & high scores **[ROM]**
- Separate arcade **score** (points) shown with 1UP / 2UP, plus "POINTS" and "TIME" panels.
- Default high-score table (name, score) from program ROM:

| Rank | Name | Score |
|---|---|---|
| 1 | DANI | 80,000 |
| 2 | JORDI | 70,000 |
| 3 | A.J.L. | 65,000 |
| 4 | X.A.G. | 60,000 |
| 5 | ANA | 55,000 |
| 6 | P.G.E.T. | 50,000 |
| 7 | TONY | 45,000 |
| 8 | D.F.B. | 40,000 |
| 9 | AFRICA | 35,000 |
| 10 | T.L.Y. | 30,000 |

- Name entry: up to 6 characters ("Insert name player"), alphabet picker screen.

---

## 3. Characters
- 8 fictional international players. Flags visible in the (unpaletted) graphics include the **USA**, **Turkey** (crescent & star), **Brazil** (diamond), several tricolours, and one with a central emblem. Portraits are distinct head-and-shoulders pictures.
- Confirmed in MAME (§0): **Germany, USA, Russia, Italy, Turkey, Brazil, Spain, Japan**. The game shows no player names.
- Whether characters differ in stats (speed/power) is still **[unconfirmed]**.

---

## 4. Operator settings (DIP switches, from MAME driver)
- Coin A / Coin B ratios; Free Play.
- **Difficulty:** Easy / **Normal** / Hard / Hardest.
- **Number of Faults:** 4 / **5** / 6 / 7.
- 2 Player Continue: 2 credits / 5 games, or 1 credit / 3 games.
- Demo (attract) sounds on/off; Service/test mode.
- Test menu items in ROM: General test, Joystick test, Switch test, Music test, Sound test.
- Program contains region warnings ("This game is for use in any countries excluding the U.S. of America, Canada and Mexico") and a US "Winners Don't Use Drugs" FBI screen (US set ver 1.1).

---

## 5. Hardware (for reference)
- PCB REF. 922804/1 or /2 (same board as *Thunder Hoop*).
- CPU: Motorola **68000 @ 10 MHz**. Sound: **OKI M6295** ADPCM @ 1 MHz (≈7.6 kHz samples), single 512 KB sample ROM, bank-switched.
- Video: **320×240** visible, ~57.4 Hz refresh. Two scrolling tilemap layers of 16×16 tiles (32×32 tiles each) + sprites (16×16 or 8×8 pieces). 4-bit (16-colour) tiles, 1024-colour palette (15-bit xBGR).
- Video RAM writes are encrypted (Gaelco protection). Graphics ROMs themselves are *not* encrypted, which is how tile sheets were extracted.
- Timing-based protection: wrong CPU/refresh speed produces corrupt "Insert Coin" sprites after continuing.

### This ROM set
Your zip matches MAME set **`squash`** — "Squash (World, ver. 1.0, checksum 015aef61)" (SHA1 of program ROMs d16 `f4aada17…`, d18 `4fe8666a…` match MAME exactly). Other sets: `squasha` (USA ver 1.1), `squashb` (newer PCB, not working).

**To play it for reference:** install MAME on Windows, put the zip (renamed to `squash.zip`) in MAME's `roms` folder, run `mame squash`. Record the select screen, a full match and each court — this fills every **[unconfirmed]** item above.

---

## 6. Audio
- 84 ADPCM samples decoded to WAV in `rom_extracts/sounds` (see README there).
- Short samples (#1–#39, 0.1–4 s): sound effects and voice. A run of ~12 similar-length clips (#15–#26, ~0.6 s each) looks like the announcer's spoken numbers/score calls **[unconfirmed]**.
- Long samples in banked areas (#64–#75, 2–17 s): music loops / crowd ambience.

---

## 7. What to keep for Hogg Squash (design takeaways)
1. Behind-the-player pseudo-3D court, front wall at top of screen, glass back wall with crowd in foreground.
2. Two buttons: HARD vs SOFT; joystick direction at contact = aim. Dive with a recovery penalty.
3. Landing-spot shadow/marker for the ball.
4. First to 9 points; quick rallies; serve timer.
5. 8 characters with country flags; tournament ladder Qualify → Round of 16 → QF → SF → Final with escalating CPU difficulty and different courts.
6. Big-sprite, colourful 1992 arcade look; strong crowd reactions; announcer callouts (OUT! POINT! FAULT!).
7. 2-player head-to-head is where the game shines — online versus is the natural headline feature.
8. Use only original art/audio/characters — the ROM extracts are reference only.

---

## Sources
- [Internet Archive — Squash (Ver. 1.0)](https://archive.org/details/arcade_squash)
- [Museum of the Game / KLOV — Squash](https://arcade-museum.com/Videogame/squash--gaelco)
- [DeVuego press kit — Squash](https://www.devuego.es/en/presskit/squash) · [DeVuego game page](https://www.devuego.es/en/fgame/squash)
- [Critic, Sir! — Squash](https://www.criticsir.com/media/game/46825)
- [ComputerEmuZone — Squash review](https://computeremuzone.com/ficha/1293/squash?l=en)
- [Retro Arcadia — Gaelco Arcade 2 review](https://retroarcadia.blog/2022/08/02/game-review-gaelco-arcade-2-on-evercade-vs/)
- [Seafoam Gaming — Gaelco Arcade 2 review](https://seafoamgaming.com/2024/12/26/gaelco-arcade-2-evercade-review/)
- [Midlife Gamer Geek — Gaelco Arcade 2 review](https://midlifegamergeek.com/2023/12/03/review-gaelco-arcade-2-evercade-arcade-cartridge-6/)
- [Time Extension — Gaelco Sports Collection announcement](https://www.timeextension.com/news/2026/09/the-gaelco-sports-collection-features-five-arcade-hits-including-the-scandalous-squash)
- [Time Extension — Gaelco Sports Collection launches Oct 22](https://www.timeextension.com/news/2026/10/the-gaelco-sports-collection-featuring-the-scandalous-squash-launches-october-22)
- [Wikipedia — Gaelco](https://en.wikipedia.org/wiki/Gaelco)
- MAME source, `src/mame/gaelco/gaelco.cpp` and `gaelco_v.cpp` (driver by Manuel Abadia) — github.com/mamedev/mame
