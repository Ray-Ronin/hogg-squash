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
