# Art style guide

Pixel art, original characters and courts, drawn in Aseprite. Sharper than the 1992 arcade but still clearly pixel art.

## 1. Internal resolution: **640×360** (decided)
The game draws to a 640×360 canvas, then scales it up by a whole number with no smoothing, so every pixel stays crisp:
1280×720 (2×), 1920×1080 (3×), 2560×1440 (4×). Other window sizes get the largest whole-number scale that fits, with a border.

- That's 2× the arcade's detail in each direction, so a sprite has about 4× as many pixels to draw.
- 16:9: the court sits in the middle; the extra width holds the score panel, player names and Hogg branding (and a crowd, later).
- The physics doesn't care: the sim works in arcade units and is projected onto the 640×360 canvas.

## 2. Palette
- **Base it on Hogg colours: red, black and white** (see `theme.md`), plus court neutrals (light wood floor, white walls) and skin/hair tones.
- One shared, limited palette (around 32–48 colours) for everything, so characters, court and UI look like they belong together. Aseprite can lock sprites to it.
- Court: white walls, red lines, light wood floor (like the Hogg courts). Bright and readable. The **ball must stand out from every background** (walls and floor), with a dark shadow under it on the floor.
- Players: a darker outline (or selective outlining) so they read against the floor.

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

The v1 character is an **adult player in red and black**. The CPU and P2 in versus use the same character, **palette-swapped** (different shirt colour). No second character needed.

Also needed: the ball + shadow, landing marker, front-wall impact ring, the court (front wall, side walls, floor and lines, tin; **no back wall or crowd in v1**), score panel, a bitmap font, POINT / OUT / FAULT / GAME text, and simple menu screens.

## 4. Pipeline: SpriteCook + Aseprite
1. **SpriteCook** (AI generation): concept art, a base character sprite, first-pass animations, court pieces and UI. Use the same style reference images on every request so assets stay consistent.
2. **Aseprite** (cleanup, done by Claude through the Aseprite connection): AI output always needs fixing for a game: lock it to our palette, fix the size so the character is the same height in every frame, line up the feet, remove stray pixels and blur, and tidy the timing of the contact frame.
3. One `.aseprite` file per character, with **tags** for each animation and a **slice or pivot** marking the feet (ground contact point).
4. Export: **spritesheet PNG + JSON (array, with tags)**. Both Phaser and a plain-Canvas loader can read this.
5. Source `.aseprite` files go in the repo (e.g. `art/`); exported PNG/JSON go in `public/hogg-squash/assets/`.

**SpriteCook account (checked 2026-10-18):** free tier, **0 credits**. Still images cost roughly **5–25 credits each** depending on model and quality (e.g. GPT 2.5 Flare: 5 low / 8 medium / 25 high at 1K; it supports pixel art and transparency). Animations cost more. Credits are needed before any generation.

## 5. Still to settle (in the build)
- Character height on screen in pixels: this sets everything else. Fix it with one test sprite before drawing a full set. (At 640×360 a player around 90–120 px tall is a reasonable starting guess, to be confirmed against the court view.)
- (Decided: no back wall and no crowd drawn in v1.)
