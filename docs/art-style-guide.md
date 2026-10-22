# Art style guide

Pixel art, original characters and courts, drawn in Aseprite. Sharper than the 1992 arcade but still clearly pixel art.

## 1. Internal resolution: **640×360** (decided)
The game draws to a 640×360 canvas and scales it up to fill the window (16:9, with bars in the margin colour).
At 1280×720 (2×), 1920×1080 (3×) and 2560×1440 (4×) every pixel is exact. Other sizes use sharp-bilinear scaling:
a whole-number upscale with no smoothing, then a smooth shrink to fit, so pixels stay sharp with slightly soft edges.
`?scale=int` keeps the largest exact whole-number scale instead, with a border. Art is still drawn for 640×360.

- That's 2× the arcade's detail in each direction, so a sprite has about 4× as many pixels to draw.
- 16:9: the court sits in the middle; the extra width holds the score panel, player names and Hogg branding (and a crowd, later).
- The physics doesn't care: the sim works in arcade units and is projected onto the 640×360 canvas.

## 2. Palette
- **Base it on Hogg colours: red, black and white** (see `theme.md`), plus court neutrals (light wood floor, white walls) and skin/hair tones.
- One shared, limited palette (around 32–48 colours) for everything, so characters, court and UI look like they belong together. Aseprite can lock sprites to it.
- Court: white walls, red lines, light wood floor (like the Hogg courts). Bright and readable. The **ball must stand out from every background** (walls and floor), with a dark shadow under it on the floor.
- Players: a darker outline (or selective outlining) so they read against the floor.

**The palette (A1, 2026-10-20):** `art/palette/hogg-squash.gpl`, 36 colours (hex values in `theme.md`). Load it in Aseprite and keep sprites in indexed mode on it. Characters use only the neutrals, reds, skin and hair; wood, glass, effects and the Mission colours are for the court and UI. New colours go into the `.gpl` file (up to 48), never ad hoc.

**Kit swap (P2 / CPU, white and black):** recolour these palette entries, and nothing else:

| P1 (Hogg red) | → P2 / CPU (white) |
|---|---|
| red 1 `#4a0610` | grey 1 `#5a5962` |
| red 2 `#7a0a14` | grey 2 `#8a8a94` |
| tin `#a50d26` | grey 3 `#b4b4bc` |
| Hogg red `#c8102e` | white kit shade `#e6e6ea` |
| kit red `#e8202a` | front wall `#f4f4f0` |
| red highlight `#ff5a52` | white `#ffffff` |

## 3. Sprites needed for v1 (one character)
Viewed from behind, like the arcade.

| Animation | Notes |
|---|---|
| Ready / idle | waiting stance, knees bent |
| Run left/right, run toward front/back | may share frames with mirroring |
| Forehand swing | timing matters: the contact frame must be clear |
| Backhand swing | |
| Serve | |
| Dive + get up | dive reach plus recovery lockout |
| Celebrate / dejected | optional for v1 |

**Height and sizes (decided in A1):** on screen the character is **70 px tall at the front wall to 100 px at the back** (`heightAt` in `js/render/actors.js`). The art is drawn and cleaned **at 100 px only** (head to soles; the racket may stick out above), and the game scales it to the exact height at draw time **with smoothing on** (`docs/decisions.md`, "Sprites: one 100 px sheet, scaled smoothly"). So each animation is one sheet, `player-100.png` + `.json`, with a `feet` slice whose pivot is the ground point between the feet.

**The sheet as built in A2 and A3** (`public/hogg-squash/assets/player-100.png` + `.json`, from `art/character/player.aseprite`; rebuild with `art/tools/a2-build.lua` (hand fixes in `a2-fixes.lua`), export with `art/tools/a2-export.sh`): indexed (palette-locked), 73 frames of 150×150 px in rows of 8, Aseprite JSON array with `frameTags` and the `feet` slice (pivot at x 73, y 148 in the frame). Every frame is at A1's scale (×100/123), with the soles on the same line. The frames grew in A3 because the dive lies across 148 px and the overhead's racket reaches 48 px above the head. In A2 they were 62×115 with the pivot at x 27, y 113; A2's frames are pixel-for-pixel the same relative to the pivot.

Tags that play once have `"repeat": "1"`; tags with a contact frame have `"data": "contact=<n>"`, where n is the 0-based frame within the tag (the same number as in the frame name, e.g. `forehand 3`). Mirror a tag about the `feet` pivot (x → 2 × 73 − x), not the frame centre.

**Racket slices (S8b):** each swing tag (`serve`, `forehand`, `backhand`, `overhead`, `dive`) has a 1×1 slice `racket <tag>` on the racket head's centre in its contact frame (frame pixels: serve 59,65; forehand 111,69; backhand 59,66; overhead 79,15; dive 129,128). The game shifts a swinging sprite so this point meets the ball (`docs/decisions.md`, "Racket height at contact"). They are data only: `art/tools/racket-slices.lua` adds them to `player.aseprite` (and `a2-build.lua` calls it), and the exported PNG is unchanged.

| Tag | Frames | Timing | Notes |
|---|---|---|---|
| `ready` | 8 | 125 ms each, loop | a small knee bounce |
| `run_side` | 7 | 75 ms each, loop | runs to the right, facing the front wall; the game mirrors it for left |
| `run_up` | 7 | 75 ms each, loop | toward the front wall |
| `run_down` | 7 | 75 ms each, loop | backpedalling, still facing the front wall |
| `serve` | 6 | 40, 40, 42, 64, 64, 64 ms, once | the sim's swing: contact on frame 4 at 122 ms, back to `ready` at 314 ms |
| `forehand` | 8 | 40, 40, 42, then 39, 38, 38, 38, 39 ms, once | racket back high on the right, contact on frame 4 (122 ms) with the racket out to the right at shoulder height, follow-through across to the left; done at 314 ms (`SWING`) |
| `backhand` | 8 | as `forehand` | racket taken back behind the head to the left, contact on frame 4 (122 ms) with the racket on the left at shoulder height, follow-through out to the right; done at 314 ms |
| `overhead` | 8 | as `forehand` | racket dropped behind the back, contact on frame 4 (122 ms) with the racket straight up; in frames 5–7 the follow-through passes in front of the body, so the racket is mostly hidden for about 115 ms |
| `dive` | 14 | 40, 40, 42, 100, 6 × ≈230, 4 × 100 ms, once | dives to the right (mirror it for left): lunge, full stretch on contact (frame 4, 122 ms), lies flat 1.4 s with the racket on the floor, springs back up; done at 2003 ms (`DIVE`, 115 sim frames) |

The runners stand up straighter than the crouched ready pose, so their heads are 4–10 px higher at the same scale. That is the pose, not a size change. Mirrored, `run_side` and `dive` hold the racket in the left hand.

The v1 character is an **adult player in red and black**. The CPU and P2 in versus use the same character, **palette-swapped** (different shirt colour). No second character needed.

Also needed: the ball + shadow, landing marker, front-wall impact ring, the court (front wall, side walls, floor and lines, tin; **no back wall or crowd in v1**), score panel, a bitmap font, POINT / OUT / FAULT / GAME text, and simple menu screens.

**The court (A4):** `public/hogg-squash/assets/court.png`, 640×360, indexed on the shared palette, painted to the frozen `wide` camera only (`docs/decisions.md`, "FROZEN"). It is built by `art/tools/a4-court.lua` into `art/court/court.aseprite`: layers `margin`, `floor`, `walls`, `boards`, `lines`, plus a hidden `code court (reference)` (the game's code-drawn court, exported from the browser as `art/court/court-code.png`). The script inverts the game's projection at 6×6 samples per pixel: a surface wins a pixel by majority (the canvas's 50% edge), a line wins it at 35% coverage, so the thinnest floor lines (under 1 px deep) stay unbroken. Of the code's 3,242 line pixels, 99.8% are painted as lines, and every painted line pixel is within 1 px of a code line (`art/mockups/a4-court-compare.png`). The floor is a SpriteCook maple texture mapped in perspective (boards about 0.25 m, running front to back), pulled towards the plain floor colour (halfway at the back, 85% at the front wall) and locked to the five wood colours. Hand touches: a grey seam in the front corners and along the foot of the side walls, and faint ball marks on the front wall. The glass edge is the floor's last 2 px in glass blue. **Moving the camera means re-running the script** (its camera and line constants are copied from `projection.js` and `court-rules.js`).
- **Wall boards (the owner's call, A4):** a Hogg red board low on each side wall (z 70–178, 0.14–0.77 m up), white lettering "HOGG" on the left wall and "RAZORBACKS" on the right, so they read "HOGG … RAZORBACKS" across the court. A thin Mission Success orange-and-teal stripe runs along the bottom of each. The letters are our own 5×7 blocky font, spaced evenly on screen (not in metres), so the far end stays readable. **No school logo** (open question 6).

**The effects (A4):** `public/hogg-squash/assets/fx.png` + `fx.json` (Aseprite JSON array, frames named `<tag> <n>`), from `art/fx/fx.aseprite` (built by `art/tools/a4-fx.lua`, exported by `art/tools/a4-export.sh`, previews by `a4-preview.lua`). 48×48 frames; every item is centred on the `centre` slice pixel (24, 24) (odd sizes reach half a pixel further right and down). Hand-drawn, no credits.

| Tag | Frames | Notes |
|---|---|---|
| `ball` | 5 | diameter 3, 4, 5, 6, 7 px (`data` `d=3,4,5,6,7`): the game's 0.05 m ball, so 3 px below z 36, 4 to z 103, 5 to 145, 6 to 174, 7 beyond. Outline black with a grey shine (the two smallest are all outline black, for contrast on the tin). Checked on every background: `art/mockups/a4-ball-contrast.png` |
| `shadow` | 5 | one per ball size, 4–8 px wide (the code's 1.2 r × 0.5 r ellipse), wood 1 with a wood 2 rim from 6 px; opaque, so no alpha needed |
| `landing` | 5 | the code's 0.3 m floor ring with its 2×2 dot, foreshortened as at z 40, 80, 115, 145, 172 (`data`); pick the nearest |
| `ring` | 6 × 58 ms, once | front-wall impact ring, radius 3 → 15 px over the code's 20 sim frames, Hogg red fading through red highlight and grey to a dotted near-white |
| `sparkle` | 4 × 35 ms, once | contact starburst over the code's 8 sim frames, flash yellows, a white core on the first frame |

**The font (A5):** `public/hogg-squash/assets/font.png` + `font.json`, from `art/ui/font.aseprite` (built by `art/tools/a5-font.lua`; the glyphs and styles are in `art/tools/a5-lib.lua`; preview `art/mockups/a5-font.png`). Our own lettering: the A4 boards' blocky 5×7 capitals, plus lowercase (descenders 2 px), 0–9 (all 5 px wide, so scores line up) and `- – : . ! ? ' , / ( ) < > +`. Bigger sizes double the 5×7 letters with a Scale2x-style rule that adds pixels on diagonal steps only (smooth diagonals, square corners). The game never tints: each font is one size in fixed colours.

| Font | Capitals | Look | For |
|---|---|---|---|
| `small`, `small-grey`, `small-dark`, `small-red` | 7 px | plain white, grey 2, black kit, Hogg red; 1 px apart | HUD labels, wall notes ("P1's point"), menus' small print |
| `large-white`, `large-red` | 14 px | 2×, 1 px outline, 1 px drop shadow (Hogg red under white, grey 3 under red) | names, menu items, "P1 WINS 11–9" |
| `huge-white`, `huge-red` | 28 px | 4×, outline, 2 px drop shadow, a red highlight along the tops of the red letters | the score digits in the margins |

`font.json` is `{ image, fonts: { <name>: { height, baseline, spacing, space, glyphs: { <char>: [x, y, w] } } } }`: every glyph of a font is `height` px tall at sheet (x, y), w wide. Draw it at the pen position and advance by w + `spacing` (0 for `large`, 2 for `huge`: the outlines touch); a space advances by `space` + `spacing`. `baseline` is the row just under the capitals. Characters missing from the font must be avoided (or upper-cased).

**The UI pieces (A5):** `public/hogg-squash/assets/ui.png` + `ui.json` (Aseprite JSON array, one frame, with slices), from `art/ui/ui.aseprite` (built by `art/tools/a5-ui.lua`, exported by `art/tools/a5-export.sh`; preview over the court `art/mockups/a5-ui.png`).

| Slice | Size | Notes |
|---|---|---|
| `score panel p1`, `score panel p2` | 66 × 84 | for the 78 px margins (6 px each side). Header in the kit colour (Hogg red for P1, white for P2 / CPU), black body. Sub-slices `… name` (62 × 20, the header), `… score` (62 × 42) and `… serve` (62 × 14) are where to centre the name (`large-white` on P1's red, `large-red` on P2's white), the score (`huge-white`) and the serve tag |
| `serve` | 46 × 11 | the serve indicator: a red tag with a ball and SERVE |
| `serve ball` | 7 × 7 | the ball alone (a bullet or a small serve marker) |
| `panel dark`, `panel light` | 24 × 24, 9-slice | the slice's `center` is the stretchable middle (4 px borders). Dark: black with a red frame, for the margins ("FIRST TO 11 / WIN BY 2") and menus. Light: front-wall white with a red frame |
| `highlight` | 16 × 14, 9-slice | the bar behind the selected menu row |
| `cursor` | 8 × 11 | a red arrow pointing right; mirror it for left |
| `callout POINT`, `OUT`, `TIN`, `DOWN`, `GAME`, `WINS` | 62–110 × 32 | front-wall callouts in the 28 px red lettering |
| `callout DOUBLE BOUNCE` | 107 × 52 | the second-bounce callout (the reason `notUp`), on two lines, a size smaller (21 px capitals, the lettering tripled) so it fits the 220 px wall (the owner's wording) |

**The title (A5):** `public/hogg-squash/assets/title.png`, 640×360, from `art/ui/title.aseprite` (built by `art/tools/a5-title.lua`; preview with a sample menu `art/mockups/a5-title.png`). A squash front wall seen square on (out-line, faint ball marks, tin, a strip of maple floor), the "HOGG SQUASH" logotype (the lettering at 8×, 2 px outline, a 5 px drop: HOGG red on black, SQUASH black on red) and, on the right, the school's Hogg Razorbacks shield (the owner's file `art/ui/hogg-logo-source.png`, area-averaged to 240 px and locked to the neutrals and reds). **The menu goes in x 44–350, y 196–292** (the `menu` slice in `title.aseprite`). The hidden `mascot` layer is the unused SpriteCook razorback.

## 4. Pipeline: SpriteCook + Aseprite
1. **SpriteCook** (AI generation): concept art, a base character sprite, first-pass animations, court pieces and UI. Use the same style reference images on every request so assets stay consistent.
2. **Aseprite** (cleanup, done by Claude through the Aseprite connection): AI output always needs fixing for a game: lock it to our palette, fix the size so the character is the same height in every frame, line up the feet, remove stray pixels and blur, and tidy the timing of the contact frame.
3. One `.aseprite` file per character, with **tags** for each animation and a **slice or pivot** marking the feet (ground contact point).
4. Export: **spritesheet PNG + JSON (array, with tags)**. Both Phaser and a plain-Canvas loader can read this.
5. Source `.aseprite` files go in the repo (e.g. `art/`); exported PNG/JSON go in `public/hogg-squash/assets/`.
6. **Scripted cleanup (A1):** `art/tools/pixel-lib.lua` does the first pass from a SpriteCook still to a clean sprite at an exact height: crop, area-average downscale, alpha cut at 50%, nearest palette colour (character colours only), 1 px outline, stray-pixel removal. `art/tools/a1-build.lua` shows how it's used. Hand fixes come after it.
7. **Style reference:** SpriteCook concept 4 from A1 (asset `db1eb2a8-7816-44de-b78a-ee5810bd5790`) is the reference for every later character generation; pass it as `reference_asset_id` or `style_asset_ids`.

**SpriteCook account (checked 2026-10-18):** free tier, **0 credits**. Still images cost roughly **5–25 credits each** depending on model and quality (e.g. GPT 2.5 Flare: 5 low / 8 medium / 25 high at 1K; it supports pixel art and transparency). Animations cost more. Credits are needed before any generation.
**Update (2026-10-20, A1):** the account is now on the Apprentice tier (800 credits when A1 started). A1 spent 32 (`art/spritecook-manifest.md`). Flare bills a non-square 1K image as 2K and adds 8 credits per reference image.
**After A5 (2026-10-22):** 488 credits (A4 spent 8, A5 32).

## 5. Still to settle (in the build)
- (Decided: character height 70–100 px on the smooth curve, art at 100 px, scaled smoothly; see §3.)
- (Decided: no back wall and no crowd drawn in v1.)
