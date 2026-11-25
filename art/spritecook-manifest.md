# SpriteCook manifest

Every SpriteCook generation for Hogg Squash: asset ID, prompt, model, settings and credit cost.
No ROM, MAME or Gaelco images were uploaded or used as references for any of these.

## A1: palette and style test sprite

**Approved spend:** up to 64 credits (32 concept round + 32 optional refine round), 2026-10-20.

### Concept round (job `4be19486-8bd9-4846-967c-a297a4e2b60e`): 32 credits

- **Model:** GPT 2.5 Flare (`gpt-image-2.5-flare`), quality medium, 1K square, pixel art, transparent background, 4 variations, size hint 128×128, smart crop tightest. No reference images.
- **Prompt:** Full-body adult squash player seen directly from behind (back view, we see their back, not their face), in a ready stance waiting for the ball: knees bent, feet shoulder-width apart, weight forward, racket held up in the right hand in front of the body. Red short-sleeve sports shirt with black trim, black shorts, white socks, white court shoes, short dark hair. Single character, centred, whole body visible from head to feet.
- **Style:** clean 16-bit sports game sprite, bold readable shapes, dark outline, limited palette, bright even lighting
- **Theme:** indoor squash court sports game, school colours red, black and white

| File (`art/spritecook/a1/`) | Asset ID | Size |
|---|---|---|
| `concept-1.png` | `4875bc64-4382-4511-88ad-4f727146034d` | 132×132 |
| `concept-2.png` | `21565b89-5f29-45d9-bf7f-818d028c66e2` | 146×146 |
| `concept-3.png` | `928a16c7-393e-4518-a61d-65d75d0c5411` | 142×142 |
| `concept-4.png` | `db1eb2a8-7816-44de-b78a-ee5810bd5790` | 124×124 |

**Picked:** concept 4 (`db1eb2a8-7816-44de-b78a-ee5810bd5790`), the style reference for all later character art.
The refine round was skipped. **A1 total: 32 of the 64 approved credits.**

## A2: character animations, part 1 (ready, run, serve)

**Approved spend:** up to 160 credits (5 animations at about 20 + up to 3 re-runs), 2026-10-20.

All jobs: `animate_game_art` on A1's concept 4 (`db1eb2a8-7816-44de-b78a-ee5810bd5790`), pixel-engine v1.1, pixel mode, Basic background removal, edge margin 6, auto-enhance off, spritesheet output (140×140 cells, 8 fps). 20 credits each.

| File (`art/spritecook/a2/`) | sha12 | Asset ID | Job | Frames | Used in the sheet |
|---|---|---|---|---|---|
| `ready.png` | `d218a5880c82` | `a9d6ba6d-a913-415d-8741-49206ac643bb` | `9503b3ce-2c17-4636-8912-4bfa58dd7bc0` | 8 | `ready`: frames 1–8 |
| `run_side.png` | `5613341f7fa6` | `91d48c53-c57d-4615-b0f8-ae3a5fb09f29` | `52e46f35-d9d5-4c26-ab16-43f426ed505e` | 8 | `run_side`: frames 2–8 |
| `run_up-try1.png` | `b5e0a85ba8da` | `d2dced47-6b79-4991-a8e1-e0dba7b41a8e` | `c1ab6d6c-48d8-47cf-93a1-3cf13b4e5223` | 8 | not used: the racket vanishes or swaps hands halfway |
| `run_up.png` (re-run) | `b64cd9fed76f` | `49f21a1a-9ede-4de0-8534-00b609fbe327` | `76187ac7-dc31-4f7c-a612-a6336c3550e0` | 8 | `run_up`: frames 2–8 |
| `run_down.png` | `3eea07459508` | `dfe5f773-141c-4eae-a3ba-29259bfc64ba` | `357aec06-f33d-40a9-83c5-55090db0de92` | 8 | `run_down`: frames 2–8 |
| `serve.png` | `006f2ff0034b` | `eebca29c-4e86-4e23-ac10-21a2dae0b3f3` | `3a11b412-3fcf-4611-b4f8-d978e5b7b80d` | 12 | `serve`: frames 2–7 (8–12 lose the racket) |

Frame 1 of every output is the source pose itself, so the run loops start at frame 2.

**Prompts** (all begin "The squash player in a red short-sleeve shirt with black side panels, black shorts, white socks and white shoes"):
- **ready:** "…is seen from behind, standing in a ready stance waiting for the ball. Knees stay bent and both feet stay planted in the same spot on the ground; the body bobs gently up and down in a light, springy rhythm, shoulders rising and falling slightly. The racket in the right hand stays held up in front, swaying a little with the bounce. The player keeps facing away from the camera the whole time and does not turn or step."
- **run_side:** "…is seen from behind and shuffles sideways to the right in a quick side-step run, staying low with knees bent. The body keeps facing away from the camera toward the front wall the whole time; only the legs move across, the right foot stepping out and the left foot following, in a smooth looping shuffle. The racket stays held up in the right hand in front of the body, and the head and torso stay level and steady."
- **run_up, try 1:** "…runs straight away from the camera, seen from directly behind, in a looping running cycle. Legs alternate in quick athletic strides with the soles of the white shoes showing as each foot kicks back, arms pumping, the racket held in the right hand moving with the arm. The player keeps facing away from the camera the whole time, running in place without shrinking or moving across the frame."
- **run_up, re-run:** "…jogs forward away from the camera, seen from directly behind, in a looping run cycle that stays in place in the frame. The legs alternate in short quick strides, knees bent, the white soles showing as each foot lifts behind. The right hand keeps gripping the squash racket the whole time, held up beside the right shoulder with the racket head pointing up, clearly visible in every frame; only the left arm swings. The player always faces away from the camera." Negative prompt: "racket disappearing, racket in left hand, racket lowered, turning around, face visible".
- **run_down:** "…is seen from behind and backpedals toward the camera in a looping cycle, still facing away from the camera toward the front wall. Short quick backward steps, knees bent, weight on the balls of the feet, upper body leaning slightly forward and level. The racket stays held up in the right hand in front of the body. The player never turns around and stays in place in the frame without growing."
- **serve:** "…is seen from behind and serves. Standing with feet apart, the left hand tosses a small black ball up in front of the body, the right arm draws the racket back and up behind the shoulder, then swings it forward and over in one smooth stroke toward the front wall, following through across the body, and returns to the ready stance. The feet stay in place and the player keeps facing away from the camera throughout."

**A2 total: 120 of the 160 approved credits** (5 animations + 1 re-run). Account after A2: 648 credits.

## A3: character animations, part 2 (swings, dive, get-up)

**Approved spend:** up to 160 credits (4 animations + an optional get-up job at about 20 each, + up to 3 re-runs), 2026-10-21.

All jobs: `animate_game_art` on A1's concept 4 (`db1eb2a8-7816-44de-b78a-ee5810bd5790`), pixel-engine v1.1, pixel mode, Basic background removal, auto-enhance off, spritesheet output (8 fps). 20 credits each, whatever the frame count (12 or 16). The edge margin was raised for the racket and the dive (the service caps it at 25): 15 gives 164 px cells, 25 gives 188 px cells. The margin goes on the sides and top only; the soles stay on the cell's bottom edge.

| File (`art/spritecook/a3/`) | sha12 | Asset ID | Job | Frames | Margin | Used in the sheet |
|---|---|---|---|---|---|---|
| `forehand.png` | `08859ec8e2c0` | `dee7d877-4eb8-4b05-9eb2-34436a967965` | `ffe24aab-e13a-4165-bb5d-9984382dffa3` | 12 | 15 | `forehand`: frames 3, 5–11 |
| `backhand.png` | `55cdabd6bbc8` | `984cdee9-d2a0-4775-86ae-06e0991d80fd` | `d518724f-3ca1-4e0b-a045-9ee6e944c791` | 12 | 15 | `backhand`: frames 4, 6–12 |
| `overhead.png` | `736ed7c65f00` | `edc3c42f-d5a6-41f4-b920-956c59992386` | `54dab373-a8c0-401c-b8c4-46b2bbe664a3` | 12 | 25 | `overhead`: frames 3, 5–11 |
| `dive-try1.png` | `6b87c0d61b03` | `3fa482f0-0380-4e01-9db8-5ee0f770db30` | `cda1fde1-1c7a-4273-a7f5-b7ae58043631` | 16 | 25 | not used: a good sideways dive, but the racket goes to the left hand once the player lands (frames 7–12), with white smear trails |
| `dive-try2.png` (re-run 1) | `c12df24440d9` | `b4bf4a0b-c57a-4aa7-807a-7ae57d0a37da` | `7918d3a2-7f6e-4434-9ad2-826c0a748c36` | 16 | 25 | not used: the racket stays in hand, but the player dives straight ahead toward the front wall, not to the side |
| `dive.png` (re-run 2) | `c77a22ecef1a` | `c606d7f4-e80a-4dde-a69a-3624cb05098b` | `5b116514-6834-4da0-93e8-ffe24a3dfa0f` | 16 | 25 | `dive`: frames 3–16 |

A first dive submission with edge margin 30 was refused by the service before it ran (no charge). The optional get-up job wasn't needed: re-run 2 gets up by itself.

**Prompts** (all begin "The squash player in a red short-sleeve shirt with black side panels, black shorts, white socks and white shoes"):
- **forehand:** "…is seen from behind and plays a forehand. Feet stay planted apart, knees bent. The right hand grips the squash racket the whole time: it draws the racket back and out to the right side at shoulder height, then swings it forward and across in one smooth flat stroke toward the front wall, following through across the body to the left shoulder, and returns to the ready stance with the racket held up in front. The racket stays in the right hand and clearly visible in every frame. The player keeps facing away from the camera throughout and does not step or turn around." Negative prompt: "racket disappearing, racket in left hand, turning around, face visible, stepping away".
- **backhand:** "…is seen from behind and plays a backhand. Feet stay planted apart, knees bent. The right hand grips the squash racket the whole time: it takes the racket back across the body to the left side, racket head up behind the left shoulder, shoulders turning a little to the left, then swings it out and forward to the right in one smooth stroke toward the front wall, following through with the right arm extended out to the right side, and returns to the ready stance with the racket held up in front. The racket stays in the right hand and clearly visible in every frame. The player keeps facing away from the camera throughout and does not step or turn around." Negative prompt: as forehand.
- **overhead:** "…is seen from behind and plays an overhead smash. Feet stay planted apart. The right hand grips the squash racket the whole time: it lifts the racket up and back behind the right shoulder, racket head just above the head, then swings it forward and down over the right shoulder in one quick stroke toward the front wall, following through down across the body to the left hip, and returns to the ready stance with the racket held up in front. The racket stays in the right hand and clearly visible in every frame, never higher than a little above the head. The player keeps facing away from the camera throughout and does not jump, step or turn around." Negative prompt: "racket disappearing, racket in left hand, turning around, face visible, jumping, ball".
- **dive, try 1:** "…is seen from behind and dives to the right to reach a ball. The player lunges far out to the right, stretching the racket arm out low to the right, and falls onto the floor, landing on the right side and lying stretched out flat on the ground for a moment, still facing away from the camera toward the front wall. Then the player pushes up off the floor with both hands, gets back onto the feet and returns to the ready stance with the racket held up in front. The right hand keeps gripping the squash racket the whole time and it stays clearly visible in every frame. The player never turns to face the camera." Negative prompt: "racket disappearing, racket in left hand, turning around, face visible, rolling over".
- **dive, re-run 1:** "…is seen from behind and dives to the right to reach a ball. The player lunges far out to the right with the racket arm stretched out low to the right, lands on the floor and lies stretched out flat on the ground for a moment, still facing away from the camera toward the front wall. The right hand never lets go of the squash racket: while the player lies on the floor, the racket lies flat on the floor in the right hand at the end of the outstretched right arm, its red frame and white strings clearly visible. Then the player pushes up off the floor with the left hand, still gripping the racket in the right hand, gets back onto the feet and returns to the ready stance with the racket held up in front. The racket is clearly visible in every single frame." Negative prompt: "racket disappearing, empty right hand, racket in left hand, turning around, face visible, rolling over, motion blur, smear trails".
- **dive, re-run 2 (used):** "…is seen from behind and dives sideways to the right side of the picture to reach a ball. The player steps out to the right, lunges and flies sideways to the right with the body horizontal and the right arm and racket leading out to the right, then lands on the floor and lies stretched out across the picture from left to right, feet on the left, head and racket on the right, still facing away from the camera. The right hand never lets go of the squash racket: while the player lies on the floor, the racket lies flat on the floor at the end of the outstretched right arm on the right, its red frame and white strings clearly visible. The left hand stays empty. Then the player pushes up off the floor with the left hand, kneels, stands back up and returns to the ready stance with the racket held up in front in the right hand." Negative prompt: "racket disappearing, empty right hand, racket in left hand, diving forward, diving away from the camera, turning around, face visible, rolling over, motion blur, smear trails".

**A3 total: 120 of the 160 approved credits** (4 animations + 2 dive re-runs). Account after A3: 528 credits.

## A4: court background, ball and effects

**Approved spend:** up to 16 credits (a wood-floor texture + 1 re-run), 2026-10-22. The owner also approved hand-drawn "HOGG RAZORBACKS" wall boards with a small Mission Success colour stripe (no credits).

| File (`art/spritecook/a4/`) | sha12 | Asset ID | Job | Size | Credits | Used in |
|---|---|---|---|---|---|---|
| `wood.png` | `f7b541308ebd` | `216cea5b-2646-4ce0-8d10-1997358bce97` | `1ac947af-e383-472f-83b3-70ca5cfd154a` | 230×230 | 8 | the court floor (`art/tools/a4-court.lua` maps it onto the floor in perspective at 75 texture px per metre, pulls it halfway or more towards the plain floor colour and locks it to the five wood colours) |

- **Model:** GPT 2.5 Flare (`gpt-image-2.5-flare`), quality medium, 1K square, pixel art, mode `texture`, background included, size hint 128×128, smart crop off, palette constraint: the five wood colours (`#8f6a3e #b48a56 #cfa772 #dfbd8c #ecd3a8`). No reference images.
- **Prompt:** Seamless tileable top-down texture of a light maple hardwood sports-court floor: long narrow pale boards running vertically, staggered end joints, subtle straight wood grain, even bright lighting, no markings, no lines, no logos
- **Style:** clean 16-bit pixel art, limited palette
- The re-run wasn't needed. Everything else in A4 (walls, lines, tin, boards, ball, shadow, landing marker, impact ring, sparkle) is drawn by script in Aseprite, with no credits.

**A4 total: 8 of the 16 approved credits.** Account after A4: 520 credits.

## A5: font, callouts, score panel, title art

**Approved spend:** up to 64 credits (a 4-variation mascot concept round + an optional 2-image refine round), 2026-10-22. Everything else in A5 (font, callouts, score panels, serve tag, menu pieces, logotype) is drawn by script in Aseprite, with no credits.

### Mascot concept round (job `931cb905-88e6-493f-814a-04575d716177`): 32 credits

- **Model:** GPT 2.5 Flare (`gpt-image-2.5-flare`), quality medium, 1K square, pixel art, transparent background, 4 variations, size hint 160×160, smart crop tightest, palette constraint: the neutrals, reds, skin and hair colours (22 of the shared palette). No reference images.
- **Prompt:** Original cartoon razorback wild boar mascot standing upright on two legs like a sports player, full body, facing the viewer in a confident three-quarter pose, gripping a squash racket in one hoof raised over its shoulder, a squash ball in the other. Dark brown bristly fur with a spiky mane ridge along its back, two short curved white tusks, a determined grin, bright eyes. Wears a red short-sleeve sports shirt with black side panels and black shorts with red stripes, white court shoes. Fierce but friendly, energetic mascot for a school squash game. Single character, centred, whole body visible.
- **Style:** clean 16-bit sports game title-screen mascot, bold readable shapes, dark outline, limited palette, bright even lighting
- **Theme:** indoor squash sports game, school colours red, black and white

| File (`art/spritecook/a5/`) | sha12 | Asset ID | Size |
|---|---|---|---|
| `mascot-1.png` | `670e0225d0d2` | `e11111f8-c29e-4e18-bbec-c5ff3be1903b` | 250×250 |
| `mascot-2.png` | `7aa8750918d3` | `0d61a6a3-006f-46d9-a747-46d81ff1c940` | 190×190 |
| `mascot-3.png` | `32caad9b175f` | `4cc62812-1361-4ce1-9ea7-2df6941b5251` | 246×246 |
| `mascot-3-raw.png` | `696283354e45` | (the same asset's full-size raw image, no extra credits) | 1024×1024 |
| `mascot-4.png` | `0893112f5357` | `830970e8-9a5a-4d73-bddc-4a0c82cde339` | 202×202 |

**Picked:** concept 3 (`4cc62812-1361-4ce1-9ea7-2df6941b5251`), cleaned from its raw image at 292 px (`art/tools/a5-title.lua`). The comparison is `art/mockups/a5-mascot-concepts.png`.
**Then not used on the title:** the owner chose the school's Hogg Razorbacks shield for the title instead (`docs/decisions.md`). The cleaned mascot stays as a hidden layer in `art/ui/title.aseprite`. The refine round was skipped.

**A5 total: 32 of the 64 approved credits.** Account after A5: 488 credits.

## A7z: Coach Zain's concept (back and front)

**Approved spend:** up to 192 credits (back round 56, front round 64, two optional refines 72, at the estimate of reference images billed once per job), 2026-11-07. After the back round showed references are billed **once per variation**, the front round was re-priced to 2 variations (64) and approved; the refines were dropped.

**Reference uploads** (no credits): the owner's photos of Coach Zain, who has agreed to be in the game. The files stay outside the repo in `C:\Hogg Squash\Character References\zain\` and are never committed; only their asset IDs are recorded.

| Photo | sha12 | Asset ID |
|---|---|---|
| `face-1.jpg` (200×200) | `2ad48f680097` | `9291f03d-9271-42e6-afb7-62a8be64cc69` |
| `face-2.jpg` (447×447) | `f6bbc07d1b86` | `f27f442b-a67d-4e50-b981-cb8066dee1de` |
| `shirt-back.jpg` | `3f15f89315b0` | `a846894c-c3f4-47b6-bc9f-c9ce07eb8660` |
| `shirt-front.jpg` | `e1202f0de7f6` | `46e2b384-8b73-4ebf-b759-06b57ab115fe` |

### Back round (job `97875b95-541e-401f-b6d0-caa4660af816`): 128 credits

- **Model:** GPT 2.5 Flare (`gpt-image-2.5-flare`), quality medium, 1K square, pixel art, transparent background, 4 variations, size hint 128×128, smart crop tightest, outline repair on.
- **References (3):** `reference_asset_id` the shirt-back photo; `style_asset_ids` A1 concept 4 (`db1eb2a8-…`) and face-2. Billed 4 × (8 + 3 × 8) = 128.
- **Prompt:** Full-body adult male squash coach seen directly from behind (back view, we see his back and the back of his head, not his face), in a ready stance waiting for the ball: knees bent, feet shoulder-width apart, weight forward, racket held up in the right hand in front of the body. He is a little taller and slimmer than an average player, with narrower shoulders and slim arms and legs. Short dark brown-black hair, faded short at the sides and back of the head, and a short trimmed full dark beard just visible along the jaw from behind. Warm medium-brown skin. He wears a plain black short-sleeve round-neck sports team shirt like the shirt in the reference photo: on the back, a small red boar's head emblem between the shoulder blades and the word SQUASH in light grey block capitals running vertically down the spine, one letter under another. Black shorts, white socks, white court shoes. Single character, centred, whole body visible from head to feet.
- **Style:** clean 16-bit sports game sprite, bold readable shapes, dark outline, limited palette, bright even lighting, matching the style guide sprite
- **Theme:** indoor squash court sports game, school colours red, black and white

| File (`art/spritecook/a7z/`) | sha12 | Asset ID | Size | Notes |
|---|---|---|---|---|
| `back-1.png` | `05b7c9de2147` | `f0d4fa29-48a4-4bb3-afa3-ec6e4bfadc8c` | 140×140 | small and noisy; SQUASH runs across |
| `back-2.png` | `6d45962755ab` | `c3d9d0f1-96d1-4977-955c-62ae83127058` | 250×250 | strong, square-on |
| `back-3.png` | `60df0df4f544` | `e60bd106-76db-4638-a31d-d397282be092` | 278×278 | **picked**: slimmest, beard along the jaw |
| `back-4.png` | `370d158b58a4` | `03b96d9b-623d-41d9-9f3f-a7b5a6cb5d0e` | 232×232 | off-style, three-quarter view |

### Front round (job `2c1c1402-1c6f-4268-8cd5-09ee86345d87`): 64 credits

- **Settings:** as the back round, 2 variations.
- **References (3):** `reference_asset_id` back concept 3 (`e60bd106-…`); `style_asset_ids` face-2 and the shirt-front photo. Billed 2 × (8 + 3 × 8) = 64.
- **Prompt:** The same squash coach as the reference sprite, now seen directly from the front (front view, facing the camera, we see his face), in the same ready stance waiting for the ball: knees bent, feet shoulder-width apart, weight forward, racket held up in his right hand in front of the body (on the left side of the picture). Same tall slim build, same pixel art style, same proportions and size. His face looks like the man in the face photo: short dark brown-black hair, faded short at the sides, a neat short full dark beard and moustache, dark eyebrows, dark eyes, a friendly confident expression. Warm medium-brown skin. He wears the same plain black short-sleeve round-neck sports team shirt; on the front, a small chest print on the left side of his chest (right side of the picture) like the shirt photo: the word HOGG in white over SQUASH TEAM in red, small. Black shorts, white socks, white court shoes. Single character, centred, whole body visible from head to feet.
- **Style:** clean 16-bit sports game sprite, bold readable shapes, dark outline, limited palette, bright even lighting, matching the reference sprite exactly

| File (`art/spritecook/a7z/`) | sha12 | Asset ID | Size | Notes |
|---|---|---|---|---|
| `front-1.png` | `abcd3378fa7b` | `f5b47d79-0fad-4680-8868-d09f2f6124a5` | 188×188 | **picked**, cleaned at 90% width (the owner's call: slimmer, like the back) |
| `front-2.png` | `1de4bd70839a` | `6765a183-c452-43d5-b327-76723111d7d5` | 290×290 | broader legs, a stray highlight on the nose |

**Cleaned** by `art/tools/a7z-build.lua` into `art/character/zain.aseprite` (`ready` from the back, `front_ready` from the front, 106 px head to soles); prints redrawn by hand. Previews: `art/mockups/a7z-print.png`, `art/mockups/a7z-zain.png`.

**A7z total: 192 of the 192 approved credits.** Account after A7z: 296 credits.

## A8z: Coach Zain, every animation

**Approved spend:** up to 296 credits, the whole balance (10 animations at about 20 + up to 4 re-runs, no top-up), 2026-11-08. The owner also approved uploading a smaller copy of back concept 3 if the original was refused.

**Source:** `animate_game_art` refused back concept 3 at 278×278 before it ran, with no charge ("Pixel animation sources must be 256x256 or smaller"). So `art/spritecook/a8z/back-3-256.png` (sha12 `b6e8e45d23a6`), the same image area-averaged to 256×256, was uploaded for free as asset `d2d2d9de-d8a4-437e-aa9c-b5e4b7b1a08a`. No reference images, and none of the owner's photos, were used in this session.

All jobs: pixel-engine v1.1, pixel mode, Basic background removal, auto-enhance off, spritesheet output (8 fps), 20 credits each. The cells are 256 px whatever the edge margin (6, 15 or 25 were asked for, as in A2 and A3): a 256 px source has no room left for one. `front_ready` is the exception, with 212 px cells from the 188 px front concept.

| File (`art/spritecook/a8z/`) | sha12 | Asset ID | Job | Frames | Source | Used in the sheet |
|---|---|---|---|---|---|---|
| `ready.png` | `724a18aba7e4` | `56fcb069-6196-4168-b8c0-b0fd0b4e6782` | `2c9c2f23-5652-4284-9818-02932694c5d6` | 8 | back | `ready`: 1–8 |
| `run_side.png` | `a5c66554648c` | `3e73ed73-0eca-4468-9690-c490570bc124` | `c681c88e-72a0-401d-91d8-8d8d04fd2256` | 8 | back | `run_side`: 2–8 |
| `run_up.png` | `108cffa48d94` | `8e97daf9-1b0e-4bbf-8a71-682b0d60ad73` | `dc63bc62-bb23-4936-b220-ebff7e4daa80` | 8 | back | `run_up`: 2–8 |
| `run_down.png` | `f6516c4608ad` | `d5a92e0a-c281-4e44-af0a-64361230cfcb` | `c625adab-8181-44ce-913f-761c1303af5a` | 8 | back | `run_down`: 2–8 |
| `serve.png` | `2b50226cd9ba` | `a368d99e-7ea9-467d-be1f-c05cfc9d374f` | `2932db7d-93d9-4d47-93cc-b81764b2d3ca` | 12 | back | `serve`: 2, 3, 4, 6, 7, 8 |
| `forehand.png` | `abe2248b4d72` | `50f242ca-26d1-41bb-a8ca-9e6b2aa31c01` | `7ee457b5-985d-41ed-b0a8-4a89d545371d` | 12 | back | `forehand`: 2, 3, 4, then `backhand.png` 10 (contact), then 6, 8, 9, 11 |
| `backhand.png` | `7df0380e822a` | `8f5022c5-b01d-4abc-ba28-b0cef3a5e057` | `399ad77e-e5b1-4914-8ee7-fb98772a413d` | 12 | back | `backhand`: 4, 6, 7, 8, 10, 10, 11, 12 |
| `overhead.png` | `4dc2376446c9` | `8b662a5e-d5bb-4b8f-9a67-f623398fb496` | `fd170662-7db6-4994-bf01-9916e3620f87` | 12 | back | `overhead`: 4, 5, 3, 2, 6, 7, 8, 11 |
| `dive.png` | `1c3b885adb7b` | `903522d3-81d6-476f-9334-aae768e84594` | `97e24859-2793-4821-b6c6-dc5c87cb2c60` | 16 | back | `dive`: 2, 5, 6, 9, 11, 9, 11, 9, 11, 9, 12, 13, 15, 16 |
| `front_ready.png` | `210563edc574` | `e2cb2863-94c2-4291-8dd8-bec66a27ebec` | `2d1090d0-d23d-472d-a69a-1e8e936d35de` | 8 | front concept 1 | `front_ready`: 1, 2, 7, 3, 3, 8, 2, 1 |

**Frames left out:** `forehand.png` 7 draws two rackets, so the contact frame comes from `backhand.png` 10, which shares its pose and scale. `backhand.png` 9 has a broken racket. `serve.png` 5 puts the racket over the shirt. `dive.png` 8 and 10 have a smeared racket or a ball touching the head. `front_ready.png` 4–6 draw a ball over the racket.

**Prompts** (all but `front_ready` begin "The tall, slim coach in a black short-sleeve team shirt with a red boar's head and the word SQUASH on the back, black shorts, white socks and white shoes"; the rest follows v1's A2 and A3 prompts above with "the player" as "the coach", and "held up in front" as "held up on the right" or "on the right side of the picture", as in his source pose):
- **ready, run_side, run_up, run_down, serve, forehand, backhand, overhead, dive:** the wording of v1's `ready`, `run_side`, `run_up` re-run, `run_down`, `serve`, `forehand`, `backhand`, `overhead` and `dive` re-run 2. `serve` adds "The racket stays in the right hand and clearly visible in every frame, never higher than a little above the head."
- **Negative prompts:** v1's for each; `run_side` and `run_down`: "racket disappearing, racket in left hand, turning around, face visible"; `serve`: the same plus "jumping".
- **front_ready:** "The tall, slim coach with short dark hair and a neat short beard, in a black short-sleeve team shirt with a small chest print, black shorts, white socks and white shoes is seen from the front, facing the camera, standing in a ready stance waiting for the ball. Knees stay bent and both feet stay planted in the same spot on the ground; the body bobs gently up and down in a light, springy rhythm, shoulders rising and falling slightly. The racket in his hand stays held up on the left side of the picture, swaying a little with the bounce. His face stays calm and keeps looking at the camera; he does not turn or step." Negative prompt: "racket disappearing, racket changing hands, turning around, stepping away, face changing".

**Cleaned** by `art/tools/a8z-build.lua` into `art/character/zain.aseprite`, exported to `public/hogg-squash/assets/zain-100.png` + `.json`. Previews: `art/mockups/a8z-strips.png`, `art/mockups/a8z-<tag>-p1.gif` and `-p2.gif`, `art/mockups/a8z-review.html`.

**A8z total: 200 of the 296 approved credits** (10 animations, no re-runs). Account after A8z: 96 credits.

## A19z: Coach Zain's trophy pose

**Approved spend:** up to 96 credits, the whole balance (a still edit, 2 variations, 48; one animation, 20; one re-run in reserve, up to 20), 2026-11-17.

**Uploads (free):** `art/spritecook/a19z/trophy-ref.png` (sha12 `2d96591313c1`), A12's `trophy` slice from `assets/tournament.png` at 3× with no smoothing (our own hand-drawn art), asset `eb729854-6a2b-4859-9e4b-1ac9d558266d`. `art/spritecook/a19z/still-2-200sq.png` (sha12 `e0775e84e679`), variation 2 below area-averaged to 200 px tall and centred on a 200 × 200 canvas, asset `a5c6f27f-ac95-4aff-ac19-a479e7fe1d42` (a first upload at 74 × 200, `31280cc3-6f76-4e60-a6ea-03857f98ee01`, was refused for animation at no charge: sources must be between 1:2 and 2:1). No photos of anyone were used.

**1. The still** (job `b38f8c98-40db-4852-98be-3393938a3441`, **48 credits**): gpt-image-2.5-flare, medium, 1K, 1:1, pixel, transparent, 2 variations. `edit_asset_id` front concept 1 (`f5b47d79-0fad-4680-8868-d09f2f6124a5`), `style_asset_ids` the trophy upload (SpriteCook won't take an edit and a `reference_asset_id` together). Billed 2 × (8 + 2 × 8), as estimated.
- **Prompt:** The same squash coach as the edited sprite, seen directly from the front, facing the camera, celebrating a tournament win: he holds the gold trophy from the reference image up high above his head with both hands, one hand on each side of the trophy's black plinth, arms raised, elbows slightly bent, and a big happy smile. The trophy looks exactly like the reference: a gold cup with two handles, a red band around the cup, on a black plinth with a red plate lettered HOGG. No racket. Same tall slim build, same face, short dark hair and neat short beard, same pixel art style, proportions and size. Same plain black short-sleeve team shirt with the small HOGG chest print, black shorts, white socks and white court shoes, feet planted shoulder-width apart, knees slightly bent. Single character, centred, whole body and the whole trophy visible from the top of the trophy to his feet.

| File (`art/spritecook/a19z/`) | sha12 | Asset ID | Size | Notes |
|---|---|---|---|---|
| `still-1.png` | `78db6c510a7e` | `9de70acf-9f2a-46ed-9f69-fba1207be2f5` | 34×34 | broken: the pixel grid detection shrank it to a 34 px smudge |
| `still-2.png` | `f66c93faa9d5` | `2e069b34-bc8a-485a-a148-c63d5d353e1d` | 306×306 | **picked**: the trophy up in both hands, HOGG on the plinth, his face and shirt kept |

**2. The animation** (job `dab655b1-f1b3-4ebd-b15e-0dd0093cc1a9`, **20 credits**): pixel-engine v1.1, pixel mode, 8 frames, spritesheet, edge margin 15, Basic background removal, auto-enhance off, from `still-2-200sq.png`. 256 px cells.
- **Prompt:** The tall, slim coach in a black short-sleeve team shirt, black shorts, white socks and white shoes is seen from the front, facing the camera, celebrating a win. He holds the gold trophy up above his head with both hands the whole time and never lets go of it; the trophy stays upright and the same size and shape in every frame. He does a small happy bounce in a looping rhythm: knees bend a little and straighten, the body bobs gently up and down, and the arms lift the trophy a little higher on each bounce. His face keeps smiling at the camera. Both feet stay planted in the same spot on the ground; he does not turn, step or jump.
- **Negative prompt:** trophy disappearing, trophy changing shape, dropping the trophy, one-handed, racket, turning around, stepping away, jumping, face changing.

| File (`art/spritecook/a19z/`) | sha12 | Asset ID | Frames | Used in the sheet |
|---|---|---|---|---|
| `trophy.png` | `5d07212cc3b6` | `71f867d8-40d0-4dfb-9800-394aa798ea16` | 8 | `trophy`: 1–8, with frame 1's trophy and hands stamped into every frame (the generator's trophy changes shape, stretching tall in frames 4 and 8) |

**Cleaned** by `art/tools/a8z-build.lua` (the `trophy` tag, after `front_ready`) into `art/character/zain.aseprite`, exported to `public/hogg-squash/assets/zain-100.png` + `.json`. Previews: `art/mockups/a19z-trophy.png`, `a19z-trophy-p1.gif`, `a19z-trophy-p2.gif` (`art/tools/a19z-preview.lua`).

**A19z total: 68 of the 96 approved credits** (one still round, one animation, no re-runs). Account after A19z: 28 credits.

## A13: Mr. Sells's concept (back and front)

**Approved spend:** up to 256 credits (back round 128, front round 64, one spare back round 64, at the A7z rate of 8 a variation plus 8 per reference per variation), 2026-11-23. Account before A13: 828 credits.

**Reference upload** (no credits): the owner's picture of the Hogg Middle School spirit T-shirt in its two store colours, black and red (from the Hogg PTA spirit store; Hogg's name and logo are approved for use by the owner). The file stays outside the repo in `C:\Hogg Squash\Character References\sells\` and is never committed. No face photo: the face comes from the written description in `plan-v3.md`, A13.

| Photo | sha12 | Asset ID |
|---|---|---|
| `shirts-front.png` (718×362) | `a1b01e967b8d` | `b97a7971-7bee-466a-b6a7-6b0dd6b1838e` |

### Back round (job `6e3f3990-1775-4ae8-aa77-5046d0369973`): 128 credits

- **Model:** GPT 2.5 Flare (`gpt-image-2.5-flare`), quality medium, 1K square, pixel art, transparent background, 4 variations, size hint 128×128, smart crop tightest, outline repair on.
- **References (3):** `reference_asset_id` the shirts photo; `style_asset_ids` A1 concept 4 (`db1eb2a8-…`) and Coach Zain's picked back concept 3 (`e60bd106-…`), so the characters match. Billed 4 × (8 + 3 × 8) = 128.
- **Prompt:** Full-body adult male squash player seen directly from behind (back view, we see his back and the back of his head, not his face), in a ready stance waiting for the ball: knees bent, feet shoulder-width apart, weight forward, racket held up in the right hand in front of the body. He is a little shorter than an average player, with a heavy build: a round belly, a broad torso, thick arms and legs. Short brown hair going grey, a little longer on top, and the arms of dark rectangular glasses just visible over his ears; a short full beard, brown going grey, just visible along the jaw from behind. Fair skin. He wears a plain bright red short-sleeve crew-neck cotton T-shirt in the same red as the red shirt in the reference photo. On the back of the shirt: the name SELLS in white block capital letters with a thin black outline running across the shoulders, and under it, between the shoulder blades, a small dark red razorback boar head emblem outlined in white. Black shorts, white socks, white court shoes. Single character, centred, whole body visible from head to feet.
- **Style:** clean 16-bit sports game sprite, bold readable shapes, dark outline, limited palette, bright even lighting, matching the style guide sprites
- **Theme:** indoor squash court sports game, school colours red, black and white

| File (`art/spritecook/a13/`) | sha12 | Asset ID | Size | Notes |
|---|---|---|---|---|
| `back-1.png` | `c97b6226b895` | `8f984f96-8d5c-48db-8db0-4b8d9902c4fe` | 128×128 | square-on, SELLS small and blurred |
| `back-2.png` | `44b295c05a34` | `d893e2f2-beb1-4d5e-9ca7-08d99ad49ca5` | 128×128 | three-quarter view, off-style |
| `back-3.png` | `2727302cbc5b` | `144dad8e-ca45-4a55-bb87-cac1d60171c9` | 32×32 | came out tiny |
| `back-4.png` | `1717fd4e7690` | `eaea04a1-714f-4cfc-a090-2aa22b67ef72` | 200×200 | **picked**: square-on, heavy build, SELLS and the boar read |

### Front round (job `6ecd2db7-ea64-4fa6-88b3-70d348239083`): 64 credits

- **Settings:** as the back round, 2 variations.
- **References (3):** `reference_asset_id` back concept 4 (`eaea04a1-…`); `style_asset_ids` Coach Zain's picked front concept 1 (`f5b47d79-…`) and the shirts photo. Billed 2 × (8 + 3 × 8) = 64.
- **Prompt:** The same squash player as the reference sprite, now seen directly from the front (front view, facing the camera, we see his face), in the same ready stance waiting for the ball: knees bent, feet shoulder-width apart, weight forward, racket held up in his right hand in front of the body (on the left side of the picture). Same short heavy build with a round belly, broad torso and thick arms and legs, same pixel art style, same proportions and size. His face: fair skin, short brown hair going grey, a little longer on top and swept to the side, rectangular glasses with dark frames, a short full beard and moustache, brown going grey, a friendly expression. He wears the same plain bright red short-sleeve crew-neck T-shirt as the red shirt in the shirt photo, with its print centred on the chest like the photo: a dark red razorback boar standing side-on, under it the word HOGG in red slanted block capitals with a white and black outline, and under that MIDDLE SCHOOL in small white capitals. Black shorts, white socks, white court shoes. Single character, centred, whole body visible from head to feet.
- **Style:** clean 16-bit sports game sprite, bold readable shapes, dark outline, limited palette, bright even lighting, matching the reference sprite exactly

| File (`art/spritecook/a13/`) | sha12 | Asset ID | Size | Notes |
|---|---|---|---|---|
| `front-1.png` | `de7ee0ec0e0a` | `aff48e13-b8c0-4c7b-a914-8827adc24f8d` | 120×120 | small; the print a smudge |
| `front-2.png` | `218087d8c4d7` | `ecf84f12-cb9b-41f9-9c07-3baec104598f` | 330×330 | **picked**: glasses, grey-brown beard, the HOGG print reads |

**Cleaned** by `art/tools/a13-build.lua` into `art/character/sells.aseprite` (`ready` from the back, `front_ready` from the front, 96 px head to soles); prints redrawn by hand. Previews: `art/mockups/a13-print.png`, `art/mockups/a13-sells.png`.

**A13 total: 192 of the 256 approved credits** (the spare back round wasn't needed). Account after A13: 636 credits.

## A14: Mr. Sells, every animation (with his trombone)

**Approved spend:** up to 280 credits for the ten animations with a racket (10 at 20 + up to 4 re-runs), 2026-11-23. Then, after those were made, **the owner's call: his racket becomes a trombone**, with up to 290 more approved for it (two still edits and the ten animations again, plus up to 2 re-runs), the same day. Account before A14: 636 credits.

All animation jobs: pixel-engine v1.1, pixel mode, Basic background removal, auto-enhance off, spritesheet output (8 fps), 20 credits each. Edge margin 6 for `ready`, the runs and `front_ready` (224 px cells), 15 for `serve`, `forehand` and `backhand`, 25 for `overhead` and `dive` (256 px cells). No photos of anyone were used; all sources are our own SpriteCook output.

### 1. With a racket (not used in the sheet): 200 credits

**Source:** back concept 4 (`eaea04a1-…`, 200 × 200) as it is; front concept 2 (`ecf84f12-…`, 330 px, over the animator's 256 px limit) area-averaged to `art/spritecook/a14/front-2-200.png` (sha12 `64ba49a3ae6c`), a free upload, asset `4d998e50-2de0-41e3-a533-12d2eb758a18`.

**Prompts:** A8z's (v1's A2 and A3 wording), each beginning "The short, heavy-set squash player with greying hair, in a red short-sleeve crew-neck T-shirt with SELLS and a small boar's head on the back, black shorts, white socks and white shoes", with "held up in front" as "held up on the right", A8z's extra serve sentence and A8z's negative prompts (the swings add "two rackets"). `front_ready`: "…with short greying hair, dark rectangular glasses and a short greying beard, in a red short-sleeve crew-neck T-shirt with a HOGG boar print on the chest…", as A8z's otherwise; its negative prompt adds "ball, glasses disappearing".

| File (`art/spritecook/a14/`) | sha12 | Asset ID | Job | Frames |
|---|---|---|---|---|
| `ready.png` | `38bd8a82b642` | `cfcddc95-5d41-41ba-8383-e2d0760bd298` | `6867d968-edd4-44e9-8e18-f7957318610d` | 8 |
| `run_side.png` | `8e6d97e1a90c` | `ad23752e-7442-4aa9-bf2b-f1fa8638a53c` | `d3d400fb-5a84-4102-bad1-7626f7aa4b5f` | 8 |
| `run_up.png` | `0c8cbc620fa9` | `3b9c445c-714c-4b8f-8517-9fa056e36183` | `9ef22ce7-822e-4b7c-9af8-b8f7cc5c133e` | 8 |
| `run_down.png` | `e5c5ec84e7d7` | `255d77db-97a4-4942-a3a2-f7cd5a7ffad3` | `52ecc1d2-b6ce-4f0c-b9e4-52df25848acd` | 8 |
| `serve.png` | `41afde8bc200` | `5fc61447-8825-40d4-b5eb-6b9eb60ef01a` | `eac75cd3-f4b6-4cf5-a2d1-b02346ca9f69` | 12 |
| `forehand.png` | `12819d089ad1` | `da455a0e-f41e-417e-bb3b-d2017df2bd1e` | `88aa2b3a-116a-484a-a78d-597862ba7f29` | 12 |
| `backhand.png` | `0ea603538566` | `4883ac18-07c0-49fd-a3c0-627e24f085c9` | `dca3f2e2-5756-4579-9960-38623203f753` | 12 |
| `overhead.png` | `be66243a86f3` | `c2367a37-9e8d-493e-a5f7-4fe43d716262` | `b91c6ed4-9309-4c3d-946b-feeaac22a160` | 12 |
| `dive.png` | `b63cb9e71ea0` | `d54d4761-900e-40c7-a6bc-b2e702a2626a` | `6694f411-d825-432d-9f7d-388069b52437` | 16 |
| `front_ready.png` | `cbb17880eb4a` | `61199e88-d59e-4dc5-b18f-ab4046f4d51e` | `09f57439-e0f0-4e2b-9302-0a45b57aaefd` | 8 |

These were cleaned into a full sheet (the forehand's contact from `backhand.png` 9, its doubled racket head erased) before the owner asked for the trombone; that sheet was replaced and never committed.

### 2. The trombone stills: 64 credits

Both: gpt-image-2.5-flare, medium, 1K, 1:1, pixel, transparent, 2 variations, size hint 200 × 200, an edit (`edit_asset_id`) with no other references. **Billed 32 each** (2 × (8 + 8): the edited image counts as a reference; the plan had priced the back at 16).

- **Back** (job `87b29dda-757a-4d75-8a6d-3845181a8459`), editing back concept 4. **Prompt:** The same squash player as the edited sprite, seen directly from behind in the same ready stance, but instead of a squash racket he holds a shiny brass trombone in his right hand, gripped by its neck like a racket, held up on the right side of the picture with the bell pointing up, the long U-shaped slide hanging down beside his right arm. The trombone is gold-coloured brass with a round flared bell, clearly readable. Everything else exactly the same: the same short heavy build, greying hair, the red crew-neck T-shirt with SELLS and the small boar's head on the back, black shorts, white socks and white shoes, the same pixel art style, proportions and size. Single character, centred, whole body and the whole trombone visible.
- **Front** (job `a15f7df1-6642-4c56-ab25-505006e1c93a`), editing front concept 2. **Prompt:** the same, seen directly from the front, the trombone in his right hand "(on the left side of the picture)", with "the same face with dark rectangular glasses and a short greying beard", "the HOGG boar print on the chest" and "the same pixel art style, proportions, size and framing, the whole head visible".

| File (`art/spritecook/a14/`) | sha12 | Asset ID | Size | Notes |
|---|---|---|---|---|
| `tb-back-1.png` | `f2549dd5a8ae` | `d9a8f3bf-3872-4029-91d3-55efe42947bc` | 230×230 | a good trombone, but a red collar band behind his head: **its trombone used** (below) |
| `tb-back-2.png` | `76518f7ce314` | `2a67e88e-5561-4fd7-8e73-229deee267fd` | 108×108 | small, the same collar |
| `tb-front-1.png` | `bc52455e8f58` | `61c36512-6228-493e-8352-d3febeb653f3` | 298×298 | taller and slimmer than him |
| `tb-front-2.png` | `041a6abc65fa` | `c4492ba9-88a9-41eb-9b83-aaf3add6c06c` | 258×258 | **picked**: his build, glasses and beard, the trombone up on the left |

**Uploads (free):** `tb-back-src.png` (sha12 `319b78506252`), asset `b34493a5-75fd-46a9-a658-02deb6deaf97`: back concept 4 with its racket removed and `tb-back-1.png`'s trombone pasted in behind his hand, area-averaged to his scale (`art/tools/a14-trombone-source.lua`). `tb-front-2-200.png` (sha12 `4d4279582ff5`), asset `e4bb42a6-0a4a-4558-b3af-441f1adc61b7`: `tb-front-2.png` area-averaged to 200 px.

### 3. The trombone animations (used): 200 credits

**Prompts:** as in 1, with "who plays with a gold brass trombone instead of a racket," after the shoes, "the racket" as "the trombone" ("bell up" where it is held up; the swings add "like a racket"), and the negative prompts' "racket" as "trombone" plus "racket" itself. Sources: `tb-back-src.png` for the nine back tags, `tb-front-2-200.png` for `front_ready`.

| File (`art/spritecook/a14/trombone/`) | sha12 | Asset ID | Job | Frames | Used in the sheet |
|---|---|---|---|---|---|
| `ready.png` | `fdf2e4e706b3` | `3d9d60be-2f95-4622-885d-b9d2d298aff9` | `645be538-4d60-46cb-894f-f1fe270f5db6` | 8 | `ready`: 1–8 |
| `run_side.png` | `bde64234e45d` | `04cb4cf5-0096-4d72-a92c-d73ab11e7720` | `33386a53-3008-41bd-83ea-52bf4127e7dc` | 8 | `run_side`: 2–8 |
| `run_up.png` | `73e1ca4d482c` | `9bf822ea-7c54-45d9-a3ec-69ad4e393d09` | `aa8c3e76-cf16-40a9-a70b-d25ff0baf40f` | 8 | `run_up`: 2–8 |
| `run_down.png` | `81226df31c5a` | `78c8612f-3fd6-43e7-996b-2f962aa77705` | `97a38b0f-bea5-473c-a7a5-c72959ecf638` | 8 | `run_down`: 2–8 |
| `serve.png` | `953879842d21` | `7b8f1cab-edf1-4f1b-bbf1-84d105b96ce0` | `c425d05c-30c1-431b-b91f-835fc4439834` | 12 | `serve`: 3, 5, 7, 8, 9, 11 |
| `forehand.png` | `8ccecf82006d` | `db5eacd6-6103-46f0-889e-08fb5be80a31` | `a65a7d2c-f6f3-4bf6-831e-aa32d2b36734` | 12 | `forehand`: 3, 4, 5, then `backhand.png` 9 (contact), then 7, 8, 10, 12 |
| `backhand.png` | `2b5ad20071fc` | `d3468417-c701-4ccb-8fcc-231e6cf64b97` | `e5418a47-8b3f-4e3c-aab9-32e2089e1506` | 12 | `backhand`: 3, 4, 5, 6, 7, 9, 10, 12 |
| `overhead.png` | `7ad490a61dda` | `e675d33b-974d-47d6-9fa3-500292f986ad` | `5df19d6e-4a15-48a9-9051-4786e14dfe3e` | 12 | `overhead`: 3, 5, 6, 7, 8, 9, 10, 12 |
| `dive.png` | `0f3a92a94df1` | `93d44e1d-0f94-4f89-8b8b-b3206a689331` | `1f6f8db5-ec20-4732-9c2a-96ea2ff1e86e` | 16 | `dive`: 2, 4, 5, 6, …, 16 (contact on 6) |
| `front_ready.png` | `210412e77472` | `0550bc14-a49b-4970-8cb0-89f90e0a9ba2` | `3d0e447e-59d8-43f9-bc4d-c91cad5f9db5` | 8 | `front_ready`: 1–8 |

**Frames left out:** `forehand.png` 6, its own contact frame, smears the trombone into two thin lines with no bell (they vanish at sprite size), so the contact is `backhand.png` 9. The rest are left out only to fit the contract's frame counts.

**Cleaned** by `art/tools/a14-build.lua` (with `a14-lib.lua`, and the prints in `a14-print.lua`, taken from A13's concept by `a14-print-extract.lua`) into `art/character/sells.aseprite`, exported by `art/tools/a14-export.sh` to `public/hogg-squash/assets/sells-100.png` + `.json`. Previews: `art/mockups/a14-strips.png`, `a14-<tag>-p1.gif` and `-p2.gif`, `a14-review.html` (`art/tools/a14-preview.lua`).

**A14 total: 464 credits** (the racket round 200 of its 280; the trombone 264 of its 290; no re-runs). Account after A14: 172 credits.

## A17: Mr. Alvarado's concept (back and front, holding his football)

**Approved spend:** up to 192 credits (back round 128, front round 64, at 8 a variation plus 8 per reference per variation), 2026-11-25, after a top-up. Account before A17: 172 credits, then 2,020 after the owner's top-up (now the Adventurer tier).

**Reference upload** (no credits): the owner's photo of Mr. Alvarado's face, who has agreed to be in the game. The file stays outside the repo in `C:\Hogg Squash\Character References\alvarado\` and is never committed. No cap or body photo: those come from the written description in `plan-v3.md`, A17.

| Photo | sha12 | Asset ID |
|---|---|---|
| `face-1.png` (46×55) | `659791650798` | `43a06a6a-ae67-48e4-b408-8359630ff843` |

### Back round (job `e5d1699e-1f10-4b52-8a13-ecab97c610c9`): 128 credits

- **Model:** GPT 2.5 Flare (`gpt-image-2.5-flare`), quality medium, 1K square, pixel art, transparent background, 4 variations, size hint 128×128, smart crop tightest, outline repair on.
- **References (3):** `reference_asset_id` the face photo; `style_asset_ids` A1 concept 4 (`db1eb2a8-…`) and Coach Zain's picked back concept 3 (`e60bd106-…`), so the characters match. Billed 4 × (8 + 3 × 8) = 128.
- **Prompt:** Full-body adult male squash player seen directly from behind (back view, we see his back and the back of his head, not his face), in a ready stance waiting for the ball: knees bent, feet shoulder-width apart, weight forward. Instead of a racket he holds a brown leather American football with white laces and white stripes in his right hand, held up in front of the body like a racket; the football is drawn bigger than a real one, about the size of a racket head. He is a little shorter than an average player, with an average build and normal proportions. Light-medium tan skin. Short black hair seen at the sides and the back of his neck under a baseball cap worn forwards: from behind we see the cap's black crown and its strap at the back. The thin arms of light-framed glasses are just visible over his ears. He wears a bright red short-sleeve polo shirt with a collar. On the back of the polo: the word COACH in white block capital letters with a thin black outline running across the shoulders. No number. Black shorts, white socks, white court shoes. Single character, centred, whole body visible from head to feet.
- **Style:** clean 16-bit sports game sprite, bold readable shapes, dark outline, limited palette, bright even lighting, matching the style guide sprites
- **Theme:** indoor squash court sports game, school colours red, black and white

| File (`art/spritecook/a17/`) | sha12 | Asset ID | Size | Notes |
|---|---|---|---|---|
| `back-1.png` | `8a586acf78e8` | `ef2295b1-be2b-4f24-b72d-fefd7518c26d` | 250×250 | **picked**: the stance and proportions closest to Sells's and Zain's, the ball up on the right where their rackets are, short and average build; under 256 px, so A18 can animate it as it is |
| `back-2.png` | `8c5ddcb3c6a6` | `cb3ca86c-f5fb-4a53-bebd-1992d4785c58` | 270×270 | the biggest ball, a wide stance |
| `back-3.png` | `3a783ed191f1` | `32a5a402-e753-41c3-a1e9-e6e34ad20cc7` | 236×236 | like 1, a little softer |
| `back-4.png` | `1548b41d642e` | `dcd5e2a6-08e8-442c-9d59-21c3e6d0d377` | 328×328 | the crispest, but longer-legged and taller-looking |

### Front round (job `c52944d1-e758-453f-9419-44f07775108c`): 64 credits

- **Settings:** as the back round, 2 variations.
- **References (3):** `reference_asset_id` back concept 1 (`ef2295b1-…`); `style_asset_ids` Coach Zain's picked front concept 1 (`f5b47d79-…`) and the face photo. Billed 2 × (8 + 3 × 8) = 64.
- **Prompt:** The same squash player as the reference sprite, now seen directly from the front (front view, facing the camera, we see his face), in the same ready stance waiting for the ball: knees bent, feet shoulder-width apart, weight forward, holding the same big brown leather American football with white laces and white stripes up in his right hand in front of the body (on the left side of the picture), where a racket would be. Same short average build, same pixel art style, same proportions and size. His face, like the face photo: light-medium tan skin, a dark moustache joining a goatee, a short dark beard shadow along the jaw, thin light-grey rectangular glasses, a friendly expression; short black hair at the sides under his cap. He wears a baseball cap forwards: a black crown with a red brim, and a small red razorback boar on the front of the crown. He wears the same bright red short-sleeve polo shirt with a collar and a short button placket; small on his left chest (the right side of the picture) a small red razorback boar with the words HOGG FOOTBALL under it in tiny white letters. Black shorts, white socks, white court shoes. Single character, centred, whole body visible from head to feet.
- **Style:** clean 16-bit sports game sprite, bold readable shapes, dark outline, limited palette, bright even lighting, matching the reference sprite exactly

| File (`art/spritecook/a17/`) | sha12 | Asset ID | Size | Notes |
|---|---|---|---|---|
| `front-1.png` | `278d21859de7` | `761655bf-7690-4f35-8e15-30a18a9f0712` | 310×310 | a very wide stance (77 px wide at 96 tall, against the back's 56): too broad for an average build |
| `front-2.png` | `7c69608ad41d` | `4290c4ff-e2f5-4f25-97a4-c2bcf083a940` | 250×250 | **picked**: 61 px wide, close to the back; the cap's red brim and razorback, moustache and goatee read |

Neither front drew glasses that read at sprite size, and the eyes were 2 px dark marks, so the eyes and glasses are drawn by hand in the cleanup, like Mr. Sells's (dark frames; the owner's call).

**Cleaned** by `art/tools/a17-build.lua` into `art/character/alvarado.aseprite` (`ready` from the back, `front_ready` from the front, 96 px head to soles); the prints, eyes and glasses redrawn by hand. Previews: `art/mockups/a17-print.png`, `art/mockups/a17-alvarado.png`.

**A17 total: 192 of the 192 approved credits.** Account after A17: 1,828 credits.
