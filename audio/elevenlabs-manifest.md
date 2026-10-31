# ElevenLabs manifest

Every ElevenLabs generation for Hogg Squash: prompt, length, settings, date, plan and credit cost.
No sound from the arcade game (or any recording of it) was uploaded, described or named in any prompt.

## Plan and licence

- **Plan: ElevenLabs Free** (the owner's call, 2026-10-29; `docs/decisions.md`, "Audio"). Hogg Squash is a non-commercial school project that is never sold, so the free plan's non-commercial terms fit.
- **Credit required:** the free plan asks for a credit to ElevenLabs wherever its sounds are used. Credit line to show: **"Sound effects made with ElevenLabs (elevenlabs.io)"**. Where it's shown (S14, the owner's call): in THE TOOLS on the build page (https://roninray.com/build/), which names and links ElevenLabs as the maker of the game's sounds; not inside the game for now.
- **Generated through** the ElevenLabs connector in Claude Code (Flows), model **Sound Effects v2** (`eleven_text_to_sound_v2`), all in one flow (`n1PkhXxE06BBn4HJh3o3`). Price: 10 credits per second of sound (a 0.5 s take is 5).

## A6: the game's sound effects

**Approved spend:** first round about 354 credits, cap of 1,000 for all of A6 (2026-10-26); the hit round about 120 more within the cap (2026-10-29).
**Spent: 222 credits** (172 first round, 50 hit round). Balance before A6: about 10,000.

Raw takes are kept in `audio/elevenlabs/a6/` as `<sound>_<prompt>_<generation id>.mp3` (44.1 kHz stereo MP3 as delivered).
`make-listen.mjs` there builds the review page the owner picked from; `envelope.mjs` prints a take's loudness over time.
`audio/make-sfx.mjs` turns the picks into the game's files (trim to the attack, cut the tail, 1 ms fade in, 40 ms fade out, mono, -1 dB peak, MP3 96 kbit/s).

### First round (2026-10-26): 28 takes, 172 credits

Settings: prompt influence 0.5, loop off; length as listed. One take per prompt (a second take per prompt was approved but not needed: ElevenLabs runs only two or three at a time, so the owner listened first).

| Sound | Prompt | Length | Generation | Credits | Picked |
|---|---|---|---|---|---|
| hit-hard A | A hard squash racket smash: a rubber squash ball struck full force by a tightly strung racket, sharp loud crack, single hit, dry | 0.5 s | `YjeXjMtws9UcBmyt9lHI` | 5 | no (nearly silent: peak -49 dB) |
| hit-hard B | Close-up powerful racket strike on a small rubber ball, crisp snappy pop with a short string twang, dry recording | 0.5 s | `hiXTAaHw70DmL6iHU54M` | 5 | no |
| hit-soft A | A gentle squash drop shot: soft touch of racket strings on a rubber ball, light muted pock, single hit, dry | 0.5 s | `stTKvSjqst8Tl9h5pXct` | 5 | no |
| hit-soft B | Light racket tap on a small soft rubber ball, quiet hollow tock, very short | 0.5 s | `lIHrcsgvVThlliZ8w88i` | 5 | no |
| hit-dive | A stretching squash shot at full reach: a quick scrappy racket flick on a rubber ball with a scrape of the frame, single hit | 0.5 s | `cCtucMO3kvl4a8JYlxHM` | 5 | no |
| serve | A squash serve: a firm clean racket strike on a rubber ball after a short toss, medium-loud pop, single hit, dry | 0.5 s | `L3qqiU0oMBsBayDivQuU` | 5 | no |
| swing-hard | A fast racket swing through the air that misses, sharp whoosh, no impact | 0.5 s | `zdamKGfWWw6zxRe3WGoB` | 5 | no |
| swing-soft | A short light racket swish through the air, no impact, quiet | 0.5 s | `bBL7Z7vSC1WuVRBI58q9` | 5 | **yes: both swings** |
| dive | A player diving and landing on a wooden sports floor: quick body thud and shoe scuff, single impact | 0.7 s | `qkXB6pTlIH22kMSeyOLH` | 7 | no |
| squeak | Court shoes squeaking sharply on a polished wooden floor during a quick change of direction, single squeak | 0.5 s | `4rHn0J85aEtXqMjCAILm` | 5 | no |
| wall-front A | A rubber squash ball hitting a solid plaster wall, deep firm thud, single impact, short room echo | 0.5 s | `bVMGH90W4qA2NT68c4TR` | 5 | no |
| wall-front B | Small hard rubber ball smacking a concrete wall indoors, punchy thump, single impact, dry | 0.5 s | `d8V82qgNodpB8TOEEdEv` | 5 | no |
| wall-side | A rubber ball glancing off a plaster side wall, light quick slap, single impact | 0.5 s | `QaQYqjbWc1mPOIjT5pL2` | 5 | no |
| floor A | A small rubber ball bouncing once on a sprung wooden sports floor, soft hollow bounce | 0.5 s | `dUJyFKb75zlCoAUk7wM5` | 5 | **yes: floor and both walls** |
| floor B | Single squash ball bounce on polished hardwood, short dull pat | 0.5 s | `OmryJkz6flKTUT7813jB` | 5 | no |
| glass A | A rubber ball striking a thick tempered-glass wall, dull slightly resonant knock, single impact | 0.5 s | `mofdFWbqJkFT6VTGRKxk` | 5 | **yes** (quiet raw, peak -33 dB, raised 32 dB) |
| glass B | Small ball hitting a heavy glass panel in a sports court, solid knock with a faint ring | 0.5 s | `RDd9lDQDvIgJIWf7eeqg` | 5 | no |
| tin A | A rubber ball hitting a low metal-faced board at the base of a wall, bright tinny clang with a short ring | 0.5 s | `PYAgHkYSyg6kTpqgn5oB` | 5 | no |
| tin B | Ball striking a thin sheet-metal panel, sharp metallic bong, single impact | 0.5 s | `Wjn49hNHQLprprDstS4x` | 5 | **yes** |
| out | Short low electronic fault buzzer, half a second | 0.5 s | `2EqXxAjOaLoe0E7wgGX6` | 5 | **yes** |
| point A | Short bright chiptune jingle for winning a point: three quick rising notes, cheerful, under one second | 1.0 s | `SqPiHFeUtvoOaPfBUJkc` | 10 | no |
| point B | Tiny upbeat 8-bit success sting, two quick notes then a sparkle | 1.0 s | `vTdFYit140ISv3Halfbf` | 10 | **yes** |
| game A | Short triumphant chiptune fanfare for winning a game, bright rising notes ending on a held major chord | 1.5 s | `aC48Dqx0arlppuRmnjhT` | 15 | no |
| game B | Upbeat 8-bit victory jingle, quick arpeggio up to a bright final chord | 1.5 s | `Ol33WoMRPVk3ebJKuXBB` | 15 | **yes** |
| menu-move | Tiny soft UI tick for moving a menu cursor, clean, very short | 0.5 s | `JV8uFjQDJeM2FnuBJpOe` | 5 | skipped for now |
| menu-ok | Bright positive UI confirm blip, two quick rising tones | 0.5 s | `PxbZQb0MdsHZRzn7DW3e` | 5 | skipped for now |
| menu-back | Soft UI cancel blip, two quick falling tones | 0.5 s | `q6RkGVf4GrXrL8Lf2TJa` | 5 | skipped for now |
| menu-key | Crisp UI sound for a setting saved: a short key click then a tiny chime | 0.5 s | `VluKJdqFtXU1MLDfcQgk` | 5 | skipped for now |

### Hit round (2026-10-29): 5 takes, 50 credits

Every first-round hit was rejected (most were nearly silent). Changes: no "squash" in the prompt (the model may read it as squashing), racquetball and tennis wording instead; 1.0 s, trimmed afterwards; prompt influence 0.7. 12 takes (4 prompts × 3) were approved; the owner picked H4 after 5, so the rest weren't made. Raw files are named `hit-r2_<prompt>_<id>.mp3`.

| Prompt | Text | Length | Generation | Credits | Picked |
|---|---|---|---|---|---|
| H1 | Racquetball hit: a hollow rubber ball struck hard by a strung racket, loud crisp pop, close-mic, indoor court | 1.0 s | `PVV2tCYjL1DEHWmmU4wg`, `IysqQt7kyJOehyPnEDkR` | 20 | no |
| H2 | Tennis racket hitting a ball hard, sharp loud thwack of the strings, close-mic, single hit | 1.0 s | `BRQr2QtEhCh1NsPJXQFI` | 10 | no |
| H3 | Loud hollow pock of a small rubber ball hit by a racket in an indoor court, punchy attack, short room tail | 1.0 s | `Ap6mlvVkBzfwZuZNeUgH` | 10 | no |
| H4 | Gentle racket tap on a small rubber ball, soft hollow pock, close-mic | 1.0 s | `jSKxIh9SYiD4ROxbRwTe` | 10 | **yes: every hit sound** |

### The game's files (`public/hogg-squash/assets/sfx/`)

Made by `audio/make-sfx.mjs` from the picks above. Pitch changes are by resampling (a little lower is also a little longer). 76 KB in all.

| File | From | Pitch | Start in the raw take | Length | Used by (`sfx.json`) |
|---|---|---|---|---|---|
| `hit-1.mp3` | H4 `jSKx…` | 1.00 | 0.702 s | 0.123 s | hit-hard |
| `hit-soft-1.mp3` | H4 `jSKx…` | 0.94 | 0.747 s | 0.132 s | hit-soft |
| `serve-1.mp3` | H4 `jSKx…` | 1.04 | 0.675 s | 0.119 s | serve |
| `hit-dive-1.mp3` | H4 `jSKx…` | 0.97 | 0.724 s | 0.127 s | hit-dive |
| `swing-1.mp3` | swing-soft `bBL7…` | 1.00 | 0 | 0.400 s | swing-hard, swing-soft |
| `bounce-1.mp3` | floor A `dUJy…` | 1.00 | 0.138 s | 0.130 s | floor, wall-front, wall-side |
| `glass-1.mp3` | glass A `mofd…` | 1.00 | 0 | 0.250 s | glass |
| `tin-1.mp3` | tin B `Wjn4…` | 1.00 | 0 | 0.350 s | tin |
| `out-1.mp3` | out `2EqX…` | 1.00 | 0 | 0.420 s | out |
| `point-1.mp3` | point B `vTdF…` | 1.00 | 0 | 0.500 s | point |
| `game-1.mp3` | game B `Ol33…` | 1.00 | 0 | 1.373 s | game |

A6b added its files below (see "A6b"). Every sound name now has a file; `squeak` waits for S14b to add the name.

## A6b: the dive, the menu sounds and a shoe squeak

**Approved spend:** up to 300 credits (2026-10-29); round 1 about 80 approved by the owner, round 2 (variants of the picks) in the listed plan.
**Spent: 80 credits** (round 1, 10 takes: 75; round 2, 1 take: 5). The connector has no balance tool; by A6's figure about 9,700 are left.
**Plan:** ElevenLabs Free, as A6 (non-commercial, credit on the build page). Same flow (`n1PkhXxE06BBn4HJh3o3`), Sound Effects v2.

Raw takes are kept in `audio/elevenlabs/a6b/` as `<sound>_<prompt>_<generation id>.mp3`. `make-listen.mjs` there builds the review page (it also plays A6's four menu takes as style A).
Settings for every take: prompt influence 0.7, loop off, one take per prompt; length as listed. No arcade sound was uploaded, described or named.

### Round 1 (2026-10-30): 10 takes, 75 credits

| Sound | Prompt | Length | Generation | Credits | Picked |
|---|---|---|---|---|---|
| dive D1 | A basketball player diving onto a hardwood gym floor: a heavy body thump and a short skid of sneakers and clothing on the wood, single fall, close-mic, no voice | 1.0 s | `7XO1UeFTciBEwwcP5cew` | 10 | no |
| dive D2 | A person throwing themselves sideways and landing hard on a sprung wooden sports floor, dull padded thud with a brief rubbery slide, no voice | 1.0 s | `CaSVEN3YluIkenaAqJTk` | 10 | **yes** |
| dive D3 | A quick lunge and fall onto a varnished wooden court: knee and hip hitting the floor with a firm thud, then a short scrape of a shoe, dry indoor recording, no voice | 1.0 s | `obqrLM1UxkVMKgz6oTRv` | 10 | no |
| squeak S1 | A single basketball sneaker squeak on a polished hardwood gym floor from a sudden hard stop, short sharp rubber chirp | 0.5 s (1.0 s planned; the node was left at 0.5 s from the price check) | `7Pxl1iKqowZeKIbBJvQl` | 5 | **yes** |
| squeak S2 | Close-mic high-pitched squeal of a rubber sole skidding to a stop on a varnished indoor court floor, one quick squeak, no footsteps | 1.0 s | `NbaBeBPAy5PZgI7JpuM8` | 10 | no |
| squeak S3 | A gym shoe gripping and twisting on a glossy wooden floor, bright squeaky chirp, single short squeak, indoor sports hall | 1.0 s | `VxhV81Q9rVkFGr96S3Zj` | 10 | no |
| menu-move B | A tiny retro 8-bit menu blip, one short square-wave beep, clean video game UI sound | 0.5 s | `bSVxU6NirgoDpbdGxyOk` | 5 | no (style B) |
| menu-ok B | A retro 8-bit confirm sound, two quick rising square-wave beeps, bright video game UI sound | 0.5 s | `UltLO3p1FkYmgi2fGRwi` | 5 | no (style B) |
| menu-move C | A very light fingertip tap on tight racket strings, a tiny dry plucky tick, close-mic | 0.5 s | `VLyypMc7IW4TFAxQVDZY` | 5 | no (style C) |
| menu-ok C | A single short referee whistle chirp, bright and quick, under half a second | 0.5 s | `gAtB21SaUGMaxbNqplSI` | 5 | no (style C) |

Menu style A (soft UI clicks) was A6's four first-round menu takes, never heard before A6b; the owner picked it, so no new menu takes were made.

### Round 2 (2026-10-30): 1 take, 5 credits

| Sound | Prompt | Length | Generation | Credits | Picked |
|---|---|---|---|---|---|
| squeak S1 | as S1 above | 0.5 s | `H0X6xUTC4qY769aQdFyx` | 5 | **yes: the second variant** |

A third S1 take was refused three times as busy (free plan; nothing charged), so the squeak has two variants.

### A6b's files (`public/hogg-squash/assets/sfx/`)

Made by `audio/make-sfx.mjs` like A6's. 124 KB for all the sound files.

| File | From | Start in the raw take | Length | Used by (`sfx.json`) |
|---|---|---|---|---|
| `dive-1.mp3` | dive D2 `CaSV…` | 0 | 0.403 s | dive (level 0.6) |
| `squeak-1.mp3` | squeak S1 `7Pxl…` (raw peak +3.3 dB) | 0 | 0.300 s | not listed yet: S14b adds `squeak` (level 0.18) |
| `squeak-2.mp3` | squeak S1 `H0X6…` (raw peak +1.5 dB) | 0 | 0.300 s | not listed yet: S14b adds `squeak` |
| `menu-move-1.mp3` | menu-move A `JV8u…` (A6) | 0 | 0.200 s (cut from a 0.4 s tone) | menu-move (0.25) |
| `menu-ok-1.mp3` | menu-ok A `PxbZ…` (A6) | 0 | 0.341 s | menu-ok (0.3) |
| `menu-back-1.mp3` | menu-back A `q6Rk…` (A6) | 0 | 0.250 s | menu-back (0.35) |
| `menu-key-1.mp3` | menu-key A `VluK…` (A6) | 0 | 0.300 s | menu-key (0.4) |
