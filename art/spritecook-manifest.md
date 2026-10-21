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
