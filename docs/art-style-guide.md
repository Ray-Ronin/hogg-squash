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

The v1 character is an **adult player in red and black**. The CPU and P2 in versus use the same character, **palette-swapped** (different shirt colour). No second character needed.

Also needed: the ball + shadow, landing marker, front-wall impact ring, the court (front wall, side walls, floor and lines, tin; **no back wall or crowd in v1**), score panel, a bitmap font, POINT / OUT / FAULT / GAME text, and simple menu screens.

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

## 5. Still to settle (in the build)
- (Decided: character height 70–100 px on the smooth curve, art at 100 px, scaled smoothly; see §3.)
- (Decided: no back wall and no crowd drawn in v1.)
