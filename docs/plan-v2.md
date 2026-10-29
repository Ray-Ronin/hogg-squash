# Hogg Squash after v1: build plan

Written 2026-10-23 from `CLAUDE.md`, `docs/decisions.md`, `docs/open-questions.md`, `docs/art-style-guide.md`, `docs/theme.md` and `docs/plan.md` (its rules, S12–S12e and the Session log, especially the CP-F entries), with the owner's answers to the planning questions.
v1 is released (CP-F, version 1.0.0). This plan adds the four things the owner picked at CP-F, in this order: **audio, more characters, a crowd, a tournament**.
`docs/plan.md` stays as the v1 history: read a section of it only when a session here points at it.
The work is split into small Claude Code sessions, as in v1. Each one leaves the game working, tests passing and its work committed.

## Status

Tick a line (`[x]`) when its session or checkpoint is finished. **The next session to run is the first unticked line.**
Lines marked *(you)* are things the owner does. Lines marked 💳 are spend approvals (SpriteCook credits, or ElevenLabs credits for sound): the session after it stops and waits for your OK before generating anything.

**Audio**
- [x] **S13** Sound engine: the first-input rule, the Effects level, pause and mute; placeholder sounds made in code
- [x] **P1** Prerequisites for sound *(you)*: ElevenLabs Starter plan, its connector in Claude Code (can be done any time before A6) *(done 2026-10-26 with the free plan instead, the owner's call: `decisions.md`, "Audio")*
- [x] 💳 Approve ElevenLabs spend for A6 *(you)*
- [x] **A6** Sound effects: generate, trim and level the game's sounds
- [ ] **S14** Sound effects in the game: hooking them up, variety and the mix
- [ ] **CP-G** Play-test 5 *(you)*: sound

**More characters**
- [ ] 💳 Approve SpriteCook spend for A7 *(you)*
- [ ] **A7** Art: concepts for three new characters
- [ ] **S15** Character roster and the character select screen
- [ ] 💳 Approve SpriteCook spend for A8 *(you)*
- [ ] **A8** Art: character 2, every animation
- [ ] 💳 Approve SpriteCook spend for A9 *(you)* (a credit top-up is likely needed first)
- [ ] **A9** Art: character 3, every animation
- [ ] 💳 Approve SpriteCook spend for A10 *(you)*
- [ ] **A10** Art: character 4, every animation
- [ ] **CP-H** Play-test 6 *(you)*: the characters

**Crowd**
- [ ] 💳 Approve SpriteCook and ElevenLabs spend for A11 *(you)* (after A11's placement mockups)
- [ ] **A11** Art and sound: the crowd (where it sits, the spectators, crowd sounds)
- [ ] **S16** The crowd in the game: drawing it, reactions and crowd sound
- [ ] **CP-I** Play-test 7 *(you)*: the crowd; settle the tournament's rules

**Tournament**
- [ ] **S17** Tournament: rules, ladder and flow (headless, tested; plain screens)
- [ ] 💳 Approve SpriteCook spend for A12 *(you)* (optional: only if a trophy is generated)
- [ ] **A12** Art: tournament screens (ladder, round titles, trophy, ending)
- [ ] **S18** Tournament art in the game; v2 release prep
- [ ] **CP-J** Release play-test and go-live, version 2.0.0 *(you)*

---

## Rules for every session

Carried over from `docs/plan.md`, updated for v2. Changes from v1 are marked *(v2)*.

1. **Start:** read `CLAUDE.md`, `docs/decisions.md` and this file. Check the status list: every line above your session must be ticked. If one isn't, stop and ask. *(v2)* `docs/plan.md` is the v1 history; read its sections only when your session points at them.
2. **Baseline:** run `npm test` before changing anything and note the result.
3. **Stay in scope.** Do what's under "In scope" and nothing under "Not in scope". If something outside scope turns out to be needed, stop and ask. Don't start the next session's work.
4. **Code style:** plain JavaScript ES modules, `// @ts-check` at the top of every new `.js` file, JSDoc types, no build step, no npm runtime dependencies. The simulation (`js/sim/`) never touches the DOM, canvas, input devices *(v2)* or audio, so Node tests can import it directly. *(v2)* Sound listens to the sim's events the way `render/effects.js` does; it never changes the sim, and anything random in it (which of three hit sounds plays) uses its own random numbers, never the sim's.
5. **Physics file:** don't change the fixed-point maths in `squash-physics.js`. New rules go in new modules that *use* it. Run `npm test` after any edit to the physics file, even a comment.
6. **Check in the browser** with `npm run dev` (Wrangler, http://localhost:8787/hogg-squash/). Fallback if Wrangler gives trouble: `npx http-server public -p 8080 -c-1`, then http://localhost:8080/hogg-squash/. No console errors.
   - *(v2)* **Sound can't be heard by Claude.** Check it by what the code reports (the audio context's state, and `?sound=log`, added in S13, which logs every sound as it plays), and say so. The owner listens.
   - *(v2)* **Phones:** the game must keep loading and playing on a phone with the touch controls. Note the page's total download size whenever a session adds sound or art files.
7. **IP:** never commit or upload (to SpriteCook, ElevenLabs or anywhere else) the ROM, MAME, ROM extracts, MAME screenshots, *(v2)* the arcade's sounds or recordings of them, or anything traced or copied from them. They stay in `../Research Info/`. *(v2)* Generator prompts describe real squash in our own words; never name Gaelco or its game in a prompt.
8. **Finish:**
   - `npm test` passes, and so does `npm run typecheck`;
   - every "Done when" item has been checked, and you say which ones were checked in the browser and which only by tests;
   - *(v2)* set the version in `js/version.js` and `package.json`: **`1.<session>.0` for a session** (S13 → 1.13.0), **the last number +1 for a b session or a smaller fix** (1.13.1). Art and sound sessions (A6–A12) change no game code, so they don't change the version. `docs/decisions.md`, "Version numbers";
   - tick the session's line in the status list and add a few lines to the **Session log** at the bottom of this file (what changed, any numbers measured, anything left for later);
   - commit with the message `Sx: <session name>`, ending with a plain-English `Build-log:` line for https://roninray.com/build/ (see "Commit messages" in `CLAUDE.md`).
9. **Never push without asking.** A push to `main` deploys to https://roninray.com/hogg-squash/. At the end, ask whether to push.
10. **Git:** if `git` isn't on the PATH, use GitHub Desktop's copy: `C:\Users\ronin\AppData\Local\GitHubDesktop\app-3.6.7\resources\app\git\cmd\git.exe` (the version folder changes when GitHub Desktop updates).
11. **Hand-off:** the last thing every session does, after committing, is write the owner a ready-to-paste prompt for the **next unticked line**, and suggest an effort level for it.
    - **The prompt:** start from that line's starter prompt in this file. Update it with anything this session learned, such as changed file names, a new fix-up item, or a question the owner still has to answer. The prompt ends with "Ask me before pushing."
    - **If the next line is a checkpoint** *(you)*: give a short list of what to play-test, then that checkpoint's planning prompt with the `<notes>` placeholders left for the owner.
    - **If the next line is a 💳 approval:** give the art or sound session's prompt. That prompt already begins with the spend gate.
    - **Effort level:** suggest one of `low`, `medium`, `high`, `xhigh` or `max`, with one line of reasoning. Start from the guide below and adjust if this session found the next one harder or easier than planned.

    | Suggested effort | Sessions |
    |---|---|
    | `high` | S13, S15, S17: new foundations (the sound engine, several character sheets, the tournament's rules), where mistakes are costly |
    | `medium` | S14, S16, S18, A6–A12: building on settled code, or art and sound work driven by the shared rules |
    | `medium` | Checkpoint planning sessions (CP-G … CP-I): editing this plan from your notes |

12. *(v2)* **Licences:** every outside file the game ships (a sound, an image) has its source, prompt, plan and licence recorded in its manifest (`art/spritecook-manifest.md`, `audio/elevenlabs-manifest.md`). Nothing ships without a licence we can name.

---

## Decisions made while writing this plan (2026-10-23)

Asked and answered before writing (recorded in `docs/decisions.md`):
- **Order:** audio first, then **more characters, the crowd, the tournament** (the owner's pick of the suggested order). Characters first gives the tournament its opponents; the crowd comes next so the tournament can gather everything: a new opponent each round and a crowd that cheers louder towards the final.
- **Sound: effects only.** No music and no voice callouts for now. The effects are racket hits, the ball on the walls, floor, tin and glass, the serve, shoes, short point and game jingles, and menu sounds.
- **Where sounds come from: ElevenLabs Sound Effects on the paid Starter plan** (about $6 a month). Researched against the alternatives:
  - **ElevenLabs** (picked): the best realistic short effects; paid plans include a commercial licence with no credit line needed; about 150 effects a month on Starter (200 of its 30,000 credits each); an official MCP connector (`text_to_sound_effects`, 0.5–5 s clips) lets a session generate behind a spend gate, as SpriteCook does. Its free plan is not used: it needs an "elevenlabs.io" credit and isn't licensed for commercial use.
  - **Stable Audio 3 Small SFX** (open weights, run on this PC under Stability's community licence, outputs ours): free, but needs a Python setup and ideally an NVIDIA graphics card, and short hits are less certain.
  - **ChipTone** (free, CC0 output) and jsfxr / sfxr: retro bleeps, not realistic squash sounds. Placeholder sounds in S13 are made in code the same way, with no files and no licence.
  - **Not used:** Meta AudioGen (its weights are licensed non-commercial only), any free tier that needs a credit line or forbids commercial use.
  - **Never** the arcade's sounds, as files or as a reference (`CLAUDE.md`, IP rules).
- **Volume:** an **Effects** level on the Options screen (Off, 1–10, saved in the browser like the keys), **Sound on/off** in the pause menu, and a speaker button beside the fullscreen button for touch. The owner chose "effects + music levels"; with effects only there is nothing for a Music level to control, so **a Music level is added only if music is added later**.
- **The browser's first-sound rule:** browsers allow sound only after a key press, click or tap on the page, and a gamepad button does **not** count in Chrome or Firefox. **The game is silent until the first key, click or tap**, which turns sound on with no extra screen. If someone uses only a gamepad, a small "Press a key or tap for sound" note shows on the title.
- **More characters: several new bodies.** Three new SpriteCook characters (four in all), each with every animation. **Looks only:** everyone plays the same (the owner didn't pick stat differences). More can be added later in the same shape (one A session each).
- **SpriteCook credits:** 488 on 2026-10-23. One full character cost about 270 in v1 (concept 32, A2 120, A3 120). This plan needs roughly 1,000 (concepts about 130, three characters about 750 with re-runs, the crowd about 100, a trophy about 30), so **a top-up of about 500–600 credits is needed, likely before A9**.
- **Version numbers after 1.0.0: `1.<session>.<fix>`, sessions carrying on from S12.** S13 is 1.13.0, S13b or a fix after it 1.13.1. Art and sound sessions are A6, A7 … and don't change the version. **2.0.0** is the v2 release (CP-J).

Settled by the plan (say so if you disagree):
- **Every character wears the same two kits**: P1 Hogg red and black, P2 / CPU white and black, so the players can always be told apart and match the score panels' header colours. A mirror match (both picking the same character) is allowed for that reason.
- **The characters are invented people,** never real students or staff (the court photo isn't stored because it shows students). Names are made up in A7.
- **One roster file:** S15 makes the characters data (`assets/characters.json`: name, sheet, kit-swap table), so each art session can add a character with no game code change.
- **Sound files:** short mono files in `public/hogg-squash/assets/sfx/`, MP3 by default (every browser plays it), under about 1 MB in all. Sources and the manifest go in `audio/` at the repo root, which isn't deployed.
- **The crowd's place on screen is decided from mockups** (A11's first step, no credits), before any spend: behind the back glass along the bottom of the screen, in the side margins, or in a gallery above the front wall.
- **The tournament's rules are settled at CP-I,** from the defaults in S17 (the arcade's five-round ladder, 1P only).
- **Not in this plan:** music, voice callouts, more courts (the court is painted for the one frozen camera), high scores, a 2P tournament, online play (never). Any of them can be added at a checkpoint.

## Target file layout (additions)

```
public/hogg-squash/
  js/audio/                  audio.js (the context, first-input unlock, levels, pause), sounds.js (events → sounds), synth.js (placeholder sounds made in code)
  js/ui/                     + select.js (character select, S15), tournament.js (ladder screen, S17)
  js/sim/                    + tournament.js (the ladder's rules, pure, S17)
  assets/sfx/                the game's sound files (A6, A11) + sfx.json (names, files, variants, levels)
  assets/characters.json     the roster (S15)
  assets/<character>-100.png + .json   one sheet per character (A8–A10)
  assets/crowd.png + .json   (A11)
audio/                       sound sources and elevenlabs-manifest.md (not deployed)
art/character/<character>.aseprite   one source per character
```

---

## S13: Sound engine (placeholder sounds made in code)

**Goal:** the game can play sounds. The engine, the first-input rule, the Effects level and pause/mute, with simple placeholder sounds made in code, so A6's files later drop in without code changes.

**In scope**
- `js/audio/audio.js`: one Web Audio context (`latencyHint: 'interactive'`), a master gain and an Effects gain. It starts suspended and is resumed **inside** the first `keydown`, `pointerdown` or `touchend` handler (the browser's rule). Gamepad presses can't unlock it.
- **The gamepad-only note:** while sound is still locked and a pad has been used, the title shows "Press a key or tap for sound" in the small font, clear of the menu, the How to play card and the shield.
- `js/audio/sounds.js`: listens to `stepWorld`'s events beside `effects.add` in `main.js` (`hit` and `swing` by HARD/SOFT and contact type, `serveSwing` / `serve`, `ball` with `frontWall`, `sideWall`, `floor`, the tin and out from the `rally` reason, `rally`, `match`, `newRally`), plus the menus (move, OK, back, a key remapped). One table maps each to a sound name, so A6's files replace the placeholders by name.
- `js/audio/synth.js`: a placeholder for every name, made in code (short noise bursts and tones, no files, no licence).
- **Loading files:** a loader for `assets/sfx/sfx.json` (name → file(s), level, variants), decoded with `decodeAudioData`. Missing files fall back to the placeholder, so the game works before A6.
- **Levels:** an Effects item on the Options screen, Off or 1–10 (default 7, for the owner to judge), saved in `localStorage` beside the keys (the same blocked-storage handling as `input/keymap.js`). A **Sound on/off** item in the pause menu. A speaker button beside the fullscreen button for touch.
- **Pause:** the context is suspended on the pause menu, on blur, with the tab hidden and on the portrait warning, and resumed with play. Nothing plays during the point freeze except the callout and jingle sounds.
- **iPhone:** iOS mutes Web Audio when the silent switch is on. Default: respect the switch (no change); note `navigator.audioSession.type = 'playback'` as the way to override it, for the owner to decide.
- `?sound=log` logs each sound by name as it plays (for checking without hearing); `?sound=off` starts muted.
- Tests (Node, no audio): the event → sound table covers every event and rally reason; the level is saved, loaded and clamped; a blocked `localStorage` doesn't throw.

**Not in scope:** generating or adding sound files (A6, S14), music, voice, crowd sounds, any change to `js/sim/`.

**Depends on:** CP-F (v1 released). P1 isn't needed yet.

**Main files:** `js/audio/audio.js`, `js/audio/sounds.js`, `js/audio/synth.js`, `js/main.js`, `js/ui/screens.js`, `js/ui/options.js`, `js/ui/pause.js`, `js/ui/title.js`, `js/input/touch.js`, `index.html`, `test/audio.test.js`, `docs/decisions.md` ("Audio").

**Done when…**
- `npm test` and `npm run typecheck` pass.
- In the browser with `?sound=log`: no sound before the first key, click or tap (the context reports `suspended`); after it, a full rally logs a hit, wall and floor sound for each shot in order, and a point logs its callout sound; the note shows for a pad-only start and goes after a key press.
- The Effects level and pause's Sound on/off change and are remembered after a reload; pausing suspends the context.
- No console errors from a cold load to the result screen.
- Version 1.13.0.

**You check or decide at the end:** listen to a match with the placeholders: are the hooks in the right places (does a hit sound land on the hit)? The default level, and whether the iPhone silent switch should mute the game.

**Starter prompt**
```text
We're doing Session S13 of docs/plan-v2.md: "Sound engine (placeholder sounds made in code)".
Read CLAUDE.md, docs/decisions.md ("Audio", "Version numbers") and docs/plan-v2.md (rules + S13). Check CP-F is ticked in docs/plan.md.
Build S13's "In scope" list only: no sound files, no music, nothing in js/sim/. Sound must start only after the first key, click or tap.
Go through "Done when", tick S13, add a Session log entry, and commit. Ask me before pushing.
```

---

## P1: Prerequisites for sound *(you)*

- **Subscribe to ElevenLabs Starter** (https://elevenlabs.io/pricing; about $6 a month). Keep it for the months sounds are generated (A6, and A11's crowd sounds); outputs made on a paid plan keep their licence after you cancel. Note the date and plan; A6 records it in the manifest.
- **Make an API key** in ElevenLabs (Developers → API keys). If it offers permissions, allow Sound Effects only. **Never paste the key into the chat**: Claude must not see or type it.
- **Add the official ElevenLabs connector to Claude Code yourself:** install `uv` (`winget install astral-sh.uv`), then add the `elevenlabs-mcp` server (run with `uvx elevenlabs-mcp`) with the environment variable `ELEVENLABS_API_KEY` set to your key, following the server's README. Restart Claude Code and check that a tool named `text_to_sound_effects` appears.
- **Fallback** if the connector won't work: you generate on the ElevenLabs website from A6's prompt list and put the files in `audio/elevenlabs/a6/`; A6 does the rest.

---

## Sound sessions: shared rules

These apply to A6 and to A11's crowd sounds:
- **No game code changes.** Sound sessions only touch `audio/`, `public/hogg-squash/assets/sfx/` (files and `sfx.json`) and docs. Reading the code (the event table in `js/audio/sounds.js`) is fine.
- **Spend gate:** step 1 is to check the ElevenLabs balance (or ask the owner to read it from the website) and list every planned generation with its prompt, length and estimated credits (200 per effect on the 2026-10-23 price list), plus a total. Then **stop and wait for the owner's OK**. If an extra generation is needed beyond the approved list, ask again.
- **IP:** prompts describe real squash in our own words. Never upload, describe or name the arcade's sounds or Gaelco.
- **Manifest:** every generation's prompt, length, settings, date, plan (Starter, commercial licence) and credit cost goes in `audio/elevenlabs-manifest.md`, with the raw file kept in `audio/elevenlabs/<session>/`.
- **Cleanup:** trim the silence before each sound so it starts on its first sample (a hit must sound on the hit frame), fade the tail, convert to mono, level them against each other, and export MP3 (unless a format problem is found, then say so). Name variants `<name>-1`, `-2`, `-3`. Keep the total under about 1 MB.
- **Tools:** trimming and conversion need a command-line tool such as `ffmpeg`. Ask before installing anything.
- **Needs:** P1 done (the connector signed in, the Starter plan active).

## A6: Sound effects (generate, trim, level)

**Goal:** the game's sound effects, generated with ElevenLabs, cleaned and ready to drop in by name.

**In scope**
- After the spend gate, generate (1–3 variants each where repeats would be noticed):
  - racket hits: HARD, SOFT, a dive's stretch hit, the serve;
  - the ball: front wall, side wall, floor bounce, the tin (a real tin is a metal-faced board), the back glass;
  - a swing that misses (a racket whoosh); shoe squeaks (a sharp turn) and a dive landing;
  - short point and game jingles (bright, arcade-like, a second or less; the game one a little longer);
  - menu move, OK, back, and a key being remapped;
  - try one or two prompts per sound first; generate variants only of the ones the owner likes.
- Play the candidates to the owner (as files in the repo folder or a simple local page) and let them pick.
- Clean, export to `assets/sfx/` and write `sfx.json` with the names S13 uses.

**Not in scope:** game code, music, voice, crowd sounds (A11).

**Depends on:** P1, S13 (for the sound names), and the 💳 approval line above it.

**Main files:** `audio/elevenlabs-manifest.md`, `audio/elevenlabs/a6/`, `public/hogg-squash/assets/sfx/`, `sfx.json`.

**Done when…**
- The owner has heard and picked every sound.
- The manifest shows the credits spent within the approved amount, and the plan and licence.
- `npm test` still passes, and the game loads the new files with no console errors (they replace the placeholders by name, with no code change).

**You check or decide at the end:** approve the set, or ask for re-generations (another spend approval).

**Starter prompt**
```text
We're doing Session A6 of docs/plan-v2.md: "Sound effects (generate, trim, level)".
Read CLAUDE.md, docs/decisions.md ("Audio") and docs/plan-v2.md ("Sound sessions: shared rules" + A6). Check S13 and P1 are ticked.
First check my ElevenLabs balance and list the planned generations with prompts and estimated credits, then STOP and wait for my OK before generating anything.
No game code changes. Never use or describe the arcade's sounds. Finish with "Done when", tick A6, add a Session log entry, and commit. Ask me before pushing.
```

## S14: Sound effects in the game (hooking up, variety and the mix)

**Goal:** the real sounds play at the right moments, sound varied and sit well together.

**In scope**
- *(added in A6)* **Show the ElevenLabs credit** ("Sound effects made with ElevenLabs (elevenlabs.io)"): the free plan asks for it wherever its sounds are used (`decisions.md`, "Audio"). Somewhere a player can find it, such as the options screen; the owner picks the place.
- *(added in A6)* `sfx.json` shares one file between several names (`bounce-1.mp3` for the floor and both walls, `swing-1.mp3` for both swings), and the loader fetches and decodes it once per name: load each file once.
- Check every A6 sound plays on its event; fix timing so a hit sounds on its contact frame (measure the delay from the event to the sound starting, with `?sound=log`'s timestamps and the audio context's output latency).
- **Variety:** pick a variant at random (not the same twice in a row); vary the pitch a little (about ±3%) for hits and bounces.
- **By what happened:** HARD louder than SOFT; a bounce's volume follows the ball's speed; a ball near the back wall a little quieter than one at the front wall; optional left/right pan by the ball's x (small, about ±0.3).
- **The mix:** set each sound's level in `sfx.json` so no sound covers the others; a limiter (a `DynamicsCompressor` on the master) so many sounds at once don't clip.
- Check on a phone (the owner) and in Chrome, Edge and Firefox if installed.

**Not in scope:** new sound files (ask; that's another A6 spend), music, voice, crowd sounds, any change to `js/sim/`.

**Depends on:** A6.

**Main files:** `js/audio/sounds.js`, `js/audio/audio.js`, `assets/sfx/sfx.json`, tests.

**Done when…**
- `npm test` and `npm run typecheck` pass.
- Every sound in `sfx.json` has been logged playing on its event in a real match (`?sound=log`), and no placeholder is left in use *(A6: except `dive` and the four menu sounds, which the owner left as placeholders for now)*.
- The measured delay from a hit event to its sound is recorded in the Session log.
- No console errors from a cold load to the result screen. Version 1.14.0.

**You check or decide at the end:** go to CP-G.

**Starter prompt**
```text
We're doing Session S14 of docs/plan-v2.md: "Sound effects in the game (hooking up, variety and the mix)".
Read CLAUDE.md, docs/decisions.md ("Audio") and docs/plan-v2.md (rules, S13's and A6's Session log entries, S14). Check A6 is ticked.
Build S14's "In scope" list only. Nothing in js/sim/.
Go through "Done when", tick S14, add a Session log entry, and commit. Ask me before pushing.
```

## CP-G: Play-test 5: sound *(you)*

Play a 1P and a 2P match with sound on, on a computer and on a phone. Note:
1. Does every hit, bounce and point sound right, and on time?
2. Is anything too loud, too quiet, or annoying after a few rallies (too repetitive)?
3. Is anything missing that should make a sound?
4. Is the default Effects level right? Does the pause menu's Sound on/off and the touch speaker button work?
5. Does the gamepad-only note make sense?
6. With effects in, do you still want no music? (Music would add a Music level and its own spend.)

**Starter prompt** (planning-only session)
```text
Planning only: change no files except docs/plan-v2.md and docs/decisions.md.
Read docs/plan-v2.md and its Session log. My CP-G feedback: <notes>.
Add the fixes as a small fix-up session (S14b) before A7 if needed, tick CP-G, and commit. Don't push.
```

---

## Art sessions: shared rules

Carried over from `docs/plan.md` ("Art sessions: shared rules"), for A7–A12:
- **No game code changes.** Art sessions only touch `art/`, `public/hogg-squash/assets/` (including a new roster entry in `characters.json`) and art docs. Reading the code (for example the swing timings) is fine.
- **Spend gate:** step 1 is to check the SpriteCook balance and list every planned generation with its model, quality and estimated credits, plus a total. Then **stop and wait for the owner's OK**. If an extra generation is needed beyond the approved list, ask again. *(v2)* If the balance won't cover the list, say how many credits to top up.
- **IP:** never upload or reference the ROM extracts, MAME screenshots or Gaelco art. Describe the style in words, and use only our own images (earlier SpriteCook output, our own game's screenshots) as references.
- **Manifest:** every SpriteCook asset ID, prompt, model and credit cost goes in `art/spritecook-manifest.md`.
- **Cleanup in Aseprite** (by Claude, through the Aseprite connection):
  - lock everything to the shared palette (new colours go into `art/palette/hogg-squash.gpl`, up to 48, never ad hoc; *(v2)* new skin and hair tones for new characters go there too);
  - the same height in every frame, with feet lined up and a `feet` slice/pivot;
  - no stray pixels or blur;
  - tags for each animation;
  - export as spritesheet PNG + JSON (array, with tags and slices) to `public/hogg-squash/assets/`.
- Source `.aseprite` files go in `art/`.
- **One size, scaled smoothly:** every character animation is made and cleaned **at 100 px only**, one sheet per character (`<character>-100.png` + `.json`), scaled at draw time with smoothing on (`docs/decisions.md`, "Sprites: one 100 px sheet, scaled smoothly"). First-pass cleanup: `art/tools/pixel-lib.lua`.
- *(v2)* **The same sheet contract as `player-100`** (`docs/art-style-guide.md` §3): the same tags, frame counts and timings (`ready`, `run_side`, `run_up`, `run_down`, `serve`, `forehand`, `backhand`, `overhead`, `dive`), the contact frames in each tag's `data`, the `feet` pivot on the sole line, and the `racket <tag>` slices (`art/tools/racket-slices.lua`). A sheet that doesn't match can't be swapped in.
- *(v2)* **Kits:** every character's art is made in P1's Hogg red and black kit, using the palette entries in the kit-swap table (`art-style-guide.md` §2), so the white P2 / CPU kit is the same recolour.
- *(v2)* **Style reference:** A1's concept 4 (`db1eb2a8-7816-44de-b78a-ee5810bd5790`) for every character, so new ones match the first; plus each new character's own picked concept for its animations.
- **Needs:** the SpriteCook connector signed in and credits on the account, plus Aseprite and its connection.

## A7: Art: concepts for three new characters

**Goal:** pick the look of three new players, so A8–A10 can animate them.

**In scope**
- Agree with the owner first (no credits): who the three are. Suggestions for variety: a woman player; a taller, lankier player; a stockier, older coach type; different skin tones and hair. All invented, adults, seen from behind in the ready stance like A1, in the Hogg red and black kit. Give each a made-up name (short enough for the score panel's name slot).
- After the spend gate: one concept round per character (SpriteCook, 4 variations, the A1 style reference), and an optional refine round.
- Clean the picked concept of each to a ready frame at 100 px (as A1 did) and show the four characters side by side on our court, in both kits (`art/mockups/a7-roster.png`).
- Record the names, looks and asset IDs in `art/spritecook-manifest.md` and `docs/art-style-guide.md` (a "Characters" table).

**Not in scope:** animations (A8–A10), game code, the select screen (S15).

**Depends on:** CP-G, and the 💳 approval line above it.

**Main files:** `art/character/`, `art/mockups/a7-roster.png`, `art/spritecook-manifest.md`, `art/palette/hogg-squash.gpl`, `docs/art-style-guide.md`.

**Done when…**
- The owner has approved the three looks and names, in both kits.
- The manifest shows the credits spent within the approved amount.
- `npm test` still passes, and the page still works because nothing in it changed.

**You check or decide at the end:** approve the looks and names, or ask for changes (each change is another spend approval). Top up SpriteCook credits now if A8–A10 won't fit.

**Starter prompt**
```text
We're doing Session A7 of docs/plan-v2.md: "Art: concepts for three new characters".
Read CLAUDE.md, docs/decisions.md ("Characters"), docs/art-style-guide.md, docs/theme.md and docs/plan-v2.md ("Art sessions: shared rules" + A7). Check CP-G is ticked.
First agree the three characters with me, then check my SpriteCook balance and list the planned generations with estimated credits, then STOP and wait for my OK before generating anything.
No game code changes. Never use ROM/MAME/Gaelco images as references. Finish with "Done when", tick A7, add a Session log entry, and commit. Ask me before pushing.
```

## S15: Character roster and the character select screen

**Goal:** the game can hold several characters and players can pick one. It works now with test recolours of the current player, so each new sheet from A8–A10 just appears.

**In scope**
- **The roster:** `assets/characters.json` lists each character: id, name, sheet (`player-100` for the current one), and any extra recolours. The loader (`js/engine/assets.js`, `js/render/sprites.js`) loads every listed sheet, builds each one's white kit with the existing kit swap, and checks each sheet against the contract (tags, frame counts, contact frames, `feet`, `racket <tag>`); a sheet that fails is left out with a console warning, not a broken game.
- **Test characters until the art lands:** two or three recolours of the current player (skin and hair from the palette), marked as tests in the roster, so the select screen and loading can be checked now. They're removed (or kept, if the owner likes them) at CP-H.
- **The current player gets a name** (the owner picks one; A7 may suggest).
- **The select screen** (`js/ui/select.js`), after the difficulty step: each player picks with their own controls (P1 on the left, P2 on the right, the CPU's pick shown in 1P, random by default, re-rollable). Each character's `ready` animation plays in the kit it will wear. Touch: tap a character. The flow in `docs/decisions.md` (Screens) is updated: … → difficulty (1P only) → **characters** → controller assignment → match.
- Rematch keeps the picks; the result screen and score panels use the characters' names where they now say P1 / P2 / CPU (check they fit the 62 px name slot; keep P1 / P2 if a name doesn't fit).
- Loading: show the loading bar until every sheet is in; note the page's download size with four sheets.
- Tests: the roster's validation; the screen transitions (2P picks twice; rematch keeps the picks; the CPU's pick); a mirror match is allowed.

**Not in scope:** new SpriteCook art, stat differences (looks only), the tournament, any change to `js/sim/` (characters don't change the play).

**Depends on:** A7 (the names and the look of the screen).

**Main files:** `assets/characters.json`, `js/engine/assets.js`, `js/render/sprites.js`, `js/render/actors.js`, `js/ui/select.js`, `js/ui/screens.js`, `js/main.js`, `js/render/hud.js`, `test/screens.test.js`, `test/roster.test.js`, `docs/decisions.md` (Screens, Characters).

**Done when…**
- `npm test` and `npm run typecheck` pass.
- In the browser: 1P and 2P matches with different picks, a mirror match, a rematch, on keyboard and touch; a deliberately broken roster entry is left out with a warning.
- No console errors from a cold load to the result screen. Version 1.15.0.

**You check or decide at the end:** the screen's layout and wording, where it sits in the flow, and whether the CPU's pick should be random or chosen.

**Starter prompt**
```text
We're doing Session S15 of docs/plan-v2.md: "Character roster and the character select screen".
Read CLAUDE.md, docs/decisions.md (Screens, Characters), docs/art-style-guide.md (§3 and "Characters") and docs/plan-v2.md (rules, A7's Session log entry, S15). Check A7 is ticked.
Build S15's "In scope" list only. Characters are looks only: nothing in js/sim/ changes.
Go through "Done when", tick S15, add a Session log entry, and commit. Ask me before pushing.
```

## A8, A9, A10: Art: characters 2, 3 and 4, every animation

One session per character, the same shape each time (A2 and A3 of v1 in one session).

**Goal:** one new character's full sheet, cleaned to the contract and added to the roster.

**In scope**
- After the spend gate: `animate_game_art` on the character's picked concept for every tag (`ready`, `run_side`, `run_up`, `run_down`, `serve`, `forehand`, `backhand`, `overhead`, `dive`), with v1's prompts as the starting point (`art/spritecook-manifest.md`, A2 and A3) and the lessons in v1's A2/A3 Session log (the racket changing hands, the dive's direction). Expect re-runs: v1 needed three over nine animations. About 20 credits each at v1's prices; approve up to about 320 a character.
- Clean in Aseprite to the contract, reusing `art/tools/a2-build.lua` and `pixel-lib.lua` (a per-character build script if needed), add the `racket <tag>` slices, export `<character>-100.png` + `.json`.
- Add the character to `assets/characters.json` (data only, no code) and remove a test recolour if the owner wants.
- Previews: a strip and GIFs per tag in both kits (`art/mockups/a<n>-*.png|gif`), and the character in the game (screenshots from the select screen and a match).

**Not in scope:** game code, other characters, stat differences.

**Depends on:** S15 (the roster and validation), A7 (the concept), and the 💳 approval line above it.

**Main files:** `art/character/<character>.aseprite`, `art/tools/`, `public/hogg-squash/assets/<character>-100.png` + `.json`, `assets/characters.json`, `art/spritecook-manifest.md`, `docs/art-style-guide.md`.

**Done when…**
- The owner has approved every animation in both kits.
- The sheet passes S15's validation (no console warning) and plays a full match in the game.
- The manifest shows the credits spent within the approved amount.
- `npm test` still passes.

**You check or decide at the end:** approve the animations, or ask for re-runs (another spend approval).

**Starter prompt** (replace the session and character)
```text
We're doing Session A8 of docs/plan-v2.md: "Art: character 2, every animation" (<character name>).
Read CLAUDE.md, docs/decisions.md ("Characters"), docs/art-style-guide.md (§3, §4, "Characters"), docs/plan-v2.md ("Art sessions: shared rules", A8–A10) and the A2/A3 entries in docs/plan.md's Session log. Check S15 is ticked.
First check my SpriteCook balance and list the planned generations with estimated credits, then STOP and wait for my OK before generating anything.
No game code changes. Never use ROM/MAME/Gaelco images as references. Finish with "Done when", tick the session, add a Session log entry, and commit. Ask me before pushing.
```

## CP-H: Play-test 6: the characters *(you)*

1. Play a match as each character, 1P and 2P. Do they all read clearly at the front and back of the court, in both kits?
2. Does any animation look off next to the others (height, speed, the racket)?
3. Is the select screen clear? Is the CPU's pick right (random or chosen)?
4. Keep or drop the test recolours?
5. Any character you'd add later (another A session)?

**Starter prompt** (planning-only session)
```text
Planning only: change no files except docs/plan-v2.md and docs/decisions.md.
Read docs/plan-v2.md and its Session log. My CP-H feedback: <notes>.
Add the fixes as a small fix-up session (S15b, or an art re-run with its own 💳 line) before A11 if needed, tick CP-H, and commit. Don't push.
```

---

## A11: Art and sound: the crowd

**Goal:** a crowd that fits the court and the camera, and its sounds.

**In scope**
- **First, where it goes (no credits):** mockups on a screenshot of the game, at 1280×720 and on a phone-sized screen with the touch controls, of:
  - **A. behind the back glass**, along the bottom of the screen: the backs of heads and shoulders in front of the camera, with the glass back wall's frame drawn (the back wall isn't drawn today; the court's back edge is at y 345, so the crowd would overlap the back of the court, where the players are biggest);
  - **B. in the side margins**, beside and under the score panels (78 px wide), facing the court;
  - **C. a gallery above the front wall** (y 0–45).
  The owner picks one (or a mix). Note what each covers (players, HUD, touch buttons).
- **Then the spend gate** (SpriteCook and ElevenLabs, listed separately): a few spectator concepts (invented people, some in Hogg red, white and black, maybe a razorback mascot costume), and short loops for idle, clap and cheer (and a groan, if it reads at that size), using our palette; crowd sounds: a murmur loop, applause, a cheer, a groan, made with ElevenLabs under "Sound sessions: shared rules".
- Clean to the palette; make 6–10 looks by recolouring; export `assets/crowd.png` + `.json` (tags per reaction) and the sounds to `assets/sfx/` with `sfx.json` entries. If A is picked, paint the back glass's frame into the court (`art/tools/a4-court.lua`, the court image only).

**Not in scope:** game code (S16), the tournament.

**Depends on:** CP-H, and the 💳 approval line above it (approved after the placement mockups).

**Main files:** `art/crowd/`, `art/mockups/a11-*.png`, `public/hogg-squash/assets/crowd.png` + `.json`, `assets/sfx/`, `art/spritecook-manifest.md`, `audio/elevenlabs-manifest.md`, `docs/art-style-guide.md`.

**Done when…**
- The owner has picked the placement and approved the spectators and the sounds.
- Both manifests show the credits spent within the approved amounts.
- `npm test` still passes, and the page still works.

**You check or decide at the end:** approve, or ask for changes (another spend approval).

**Starter prompt**
```text
We're doing Session A11 of docs/plan-v2.md: "Art and sound: the crowd".
Read CLAUDE.md, docs/decisions.md, docs/art-style-guide.md, docs/theme.md and docs/plan-v2.md ("Art sessions: shared rules", "Sound sessions: shared rules", A11). Check CP-H is ticked.
First show me the placement mockups (no credits). After I pick, check my SpriteCook and ElevenLabs balances, list the planned generations with estimated credits, then STOP and wait for my OK.
No game code changes. Never use ROM/MAME/Gaelco images or sounds. Finish with "Done when", tick A11, add a Session log entry, and commit. Ask me before pushing.
```

## S16: The crowd in the game (drawing, reactions, crowd sound)

**Goal:** the crowd is in the match and reacts to it.

**In scope**
- Draw the crowd where A11 placed it, in the right layer (behind or in front of the players as the placement needs), with each spectator's look and timing offset so they don't move in step.
- **Reactions** from the sim's events (no sim changes): a murmur while play goes on; a cheer on a point after a long rally (the rally length from the `hit` events) and on GAME; applause on a good point; a groan on a tin. A spectator's reaction lasts about as long as the callout.
- **Crowd sound:** under the Effects level (or a separate Crowd level if the owner asks at CP-I), ducked while the ball is in play so the hits stay clear.
- Performance: the crowd must not slow a phone (draw it from pre-made frames; measure the frame time with and without it).
- Tests: the reaction picker for each event and rally length.

**Not in scope:** new art or sounds, the tournament, any change to `js/sim/`.

**Depends on:** A11.

**Main files:** `js/render/crowd.js`, `js/audio/sounds.js`, `js/main.js`, `assets/sfx/sfx.json`, tests, `docs/decisions.md` (Crowd).

**Done when…**
- `npm test` and `npm run typecheck` pass.
- In the browser: the crowd shows and reacts in a full 1P match (`?sound=log` for its sounds); nothing covers the ball, players, HUD or touch buttons in the chosen layout at 1280×720 and 844×390.
- The frame time with the crowd is recorded. No console errors. Version 1.16.0.

**You check or decide at the end:** go to CP-I.

**Starter prompt**
```text
We're doing Session S16 of docs/plan-v2.md: "The crowd in the game (drawing, reactions, crowd sound)".
Read CLAUDE.md, docs/decisions.md and docs/plan-v2.md (rules, A11's Session log entry, S16). Check A11 is ticked.
Build S16's "In scope" list only. Nothing in js/sim/.
Go through "Done when", tick S16, add a Session log entry, and commit. Ask me before pushing.
```

## CP-I: Play-test 7: the crowd; the tournament's rules *(you)*

Play a few matches with the crowd. Then settle the tournament (S17's defaults in brackets):
1. Does the crowd help or distract? Too loud, too busy, in the way?
2. **Rounds:** how many? (The arcade's five: Qualify, Round of 16, Quarter-final, Semi-final, Final.)
3. **Match length per round:** one length chosen at the start, or fixed? (Chosen, default first to 7.)
4. **Difficulty:** how it rises. (A starting level picked at the start; +1 level each round, up to 9.)
5. **Opponents:** the other characters in turn, repeating when there are more rounds than characters. (Yes; the final against a random one.)
6. **Losing a round:** replay it as often as you like, or out of the tournament? (Replay, with a count of tries shown at the end.)
7. **Saving:** remember the tournament in the browser so it can be finished later? (Yes.)
8. **The crowd by round:** bigger and louder towards the final? (Yes, if the placement allows.)

**Starter prompt** (planning-only session)
```text
Planning only: change no files except docs/plan-v2.md and docs/decisions.md.
Read docs/plan-v2.md and its Session log. My CP-I feedback: <notes>. My tournament answers: <answers>.
Record the tournament rules in docs/decisions.md, update S17, A12 and S18 to match, add a crowd fix-up session (S16b) if needed, tick CP-I, and commit. Don't push.
```

---

## S17: Tournament: rules, ladder and flow

**Goal:** a 1P tournament that plays from the first round to the final, with plain screens (art comes in A12 and S18).

**In scope**
- `js/sim/tournament.js` (pure, Node-tested): the ladder's state from CP-I's rules: the rounds, each round's opponent, level and match length, winning a round, losing (replay or out), the tournament won. The match itself is the existing one (`js/sim/match.js`, `world.js`), set up per round.
- The flow: TOURNAMENT on the title (1P only; touch works) → character select (yours; the opponents come from the ladder) → the ladder screen (round names, your next opponent, the level) → match → back to the ladder (round won or lost) → … → a plain "Tournament won" screen.
- **Saving** (if CP-I said yes): the ladder's state in `localStorage` (the keymap's blocked-storage handling); a "Continue tournament" item on the title when one is saved; quitting a match mid-round counts as… (CP-I's answer, default: replay the round).
- The crowd's size by round, if CP-I said yes (a number S16's crowd reads).
- Tests: the ladder's rules (every round, win and loss, the final, a saved state loaded back, a broken save ignored); the screen transitions.

**Not in scope:** tournament art (A12, S18), 2P tournaments, high scores, new courts, any change to the match rules.

**Depends on:** CP-I (the rules).

**Main files:** `js/sim/tournament.js`, `js/ui/tournament.js`, `js/ui/screens.js`, `js/ui/title.js`, `js/main.js`, `test/tournament.test.js`, `test/screens.test.js`, `docs/decisions.md` (Tournament, Screens).

**Done when…**
- `npm test` and `npm run typecheck` pass.
- In the browser: a whole tournament played to the end (with `?dev` shortcuts for the length, if needed), one round lost and replayed, the tab closed and the tournament continued.
- No console errors. Version 1.17.0.

**You check or decide at the end:** the ladder screen's wording and what it should look like (for A12).

**Starter prompt**
```text
We're doing Session S17 of docs/plan-v2.md: "Tournament: rules, ladder and flow".
Read CLAUDE.md, docs/decisions.md (Tournament, Screens, Match rules) and docs/plan-v2.md (rules, the CP-I notes in the Session log, S17). Check CP-I is ticked.
Build S17's "In scope" list only. The tournament's rules live in js/sim/tournament.js and are tested in Node; no art yet.
Go through "Done when", tick S17, add a Session log entry, and commit. Ask me before pushing.
```

## A12: Art: tournament screens (ladder, round titles, trophy, ending)

**Goal:** the tournament's look.

**In scope**
- Drawn by script in Aseprite in the A5 style, with no credits: the ladder (the five rounds, each opponent's ready frame or face crop, your progress marked), round title cards (QUALIFY, ROUND OF 16 … FINAL) in the bitmap font, and the "Tournament won" screen.
- **Optional, after the spend gate:** a trophy in Hogg colours generated with SpriteCook (one concept round), cleaned to the palette. If the owner prefers, the trophy is drawn by hand instead and the 💳 line is ticked as "not needed".
- Export to `assets/` (`tournament.png` + `.json`, slices as A5's `ui.json`).

**Not in scope:** game code (S18).

**Depends on:** S17, and the 💳 approval line above it.

**Main files:** `art/ui/tournament.aseprite`, `art/tools/a12-*.lua`, `public/hogg-squash/assets/tournament.png` + `.json`, `art/mockups/a12-*.png`, `art/spritecook-manifest.md`, `docs/art-style-guide.md`.

**Done when…**
- The owner has approved the screens (as mockups over the game).
- `npm test` still passes, and the page still works.

**You check or decide at the end:** approve, or ask for changes.

**Starter prompt**
```text
We're doing Session A12 of docs/plan-v2.md: "Art: tournament screens (ladder, round titles, trophy, ending)".
Read CLAUDE.md, docs/decisions.md (Tournament), docs/art-style-guide.md and docs/plan-v2.md ("Art sessions: shared rules", S17's Session log entry, A12). Check S17 is ticked.
If a trophy is to be generated, first check my SpriteCook balance and list the generations with estimated credits, then STOP and wait for my OK.
No game code changes. Finish with "Done when", tick A12, add a Session log entry, and commit. Ask me before pushing.
```

## S18: Tournament art in the game; v2 release prep

**Goal:** the tournament with its art, and the whole v2 ready to release. No new features.

**In scope**
- Use A12's ladder, round titles and ending in S17's screens; a round title card before each tournament match; the crowd bigger by round (if chosen); the jingles for a round won and the tournament won (from A6's set; a new sound needs an A6-style spend).
- **Release prep** as S12 did: check in Chrome, Edge and Firefox, at 60 Hz and a high refresh rate if available, and a phone (touch, sound after the first tap); a cold load with an empty cache (note the total download size: four character sheets, the crowd, sounds); caching still fine after a deploy.
- Update `README.md` (sound, characters, crowd, tournament) and the status line in `CLAUDE.md`.

**Not in scope:** anything in "Not in this plan" above (music, voice, more courts, high scores, a 2P tournament).

**Depends on:** A12.

**Main files:** `js/ui/tournament.js`, `js/render/`, `README.md`, `CLAUDE.md`.

**Done when…**
- `npm test` and `npm run typecheck` pass.
- A whole tournament plays with its art, sounds and crowd; 1P and 2P single matches still work.
- The game works in all the browsers checked. No console errors from a cold load to the tournament's end. Version 1.18.0.

**You check or decide at the end:** go to CP-J.

**Starter prompt**
```text
We're doing Session S18 of docs/plan-v2.md: "Tournament art in the game; v2 release prep".
Read CLAUDE.md, docs/decisions.md and docs/plan-v2.md (rules, A12's Session log entry, S18). Check A12 is ticked.
Build S18's "In scope" list only. No new features.
Go through "Done when", tick S18, add a Session log entry, and commit. Ask me before pushing.
```

## CP-J: Release play-test and go-live, version 2.0.0 *(you)*

1. From the title screen, the way a new player would: a whole tournament, one 1P and one 2P match, with sound on, on a computer and on a phone.
2. Anything to fix becomes a small fix-up session (S18b …) and this checkpoint is replayed after it, as at CP-F.
3. When nothing is left to fix: version **2.0.0**, approve the push, and check https://roninray.com/hogg-squash/ in a private window. List 2.0.0 on the build page (`../roninray-site/content/versions.json`) if wanted.
4. Pick what comes next (music, voice callouts, more courts, more characters…) for another plan, or stop here.

**Starter prompt** (planning-only session)
```text
Planning only: change no files except docs/plan-v2.md, docs/decisions.md, the version (js/version.js, package.json) and CLAUDE.md's status line.
Read docs/plan-v2.md and its Session log. My CP-J feedback: <notes>.
If there's something to fix, add a fix-up session and don't tick CP-J. If not, tick CP-J, set version 2.0.0, and commit. Don't push.
```

---

## Session log

Each session adds a few lines here: date, what changed, numbers measured, anything left for later. The v1 history is in `docs/plan.md`'s Session log.

- 2026-10-23, planning: wrote this plan after v1 (1.0.0). The owner's answers are under "Decisions made while writing this plan" and in `docs/decisions.md` ("After v1", "Audio", "Characters", "Version numbers").
  - **Order:** audio, then characters, crowd, tournament (the owner picked the suggested order).
  - **Audio:** effects only; ElevenLabs Sound Effects on the paid Starter plan (researched against Stable Audio 3 Small SFX, ChipTone / jsfxr and Meta AudioGen); an Effects level, Sound on/off in pause and a speaker button for touch (a Music level only if music comes later); silent until the first key, click or tap, with a note for gamepad-only players.
  - **Characters:** three new bodies (four in all), looks only. SpriteCook has 488 credits; the plan needs about 1,000, so a top-up of about 500–600 before A9.
  - **Versions:** `1.<session>.<fix>` from S13 (1.13.0); 2.0.0 at CP-J.
  - **Next:** S13 (the sound engine, with placeholder sounds made in code). P1 (the owner: ElevenLabs Starter and its connector) can be done any time before A6.
- 2026-10-24, S13 (sound engine, 1.13.0): `js/audio/` (`audio.js`, `sounds.js`, `synth.js`), an empty `assets/sfx/sfx.json`, and `test/audio.test.js` (8 tests; 154 unit tests in all).
  - **Sounds:** 19 names, each with a placeholder made in code (noise bursts and tones, no files): `hit-hard`, `hit-soft`, `hit-dive`, `serve`, `swing-hard`, `swing-soft` (a miss), `dive`, `wall-front`, `wall-side`, `floor`, `glass`, `tin`, `out`, `point` (the callout's jingle), `game`, `menu-move`, `menu-ok`, `menu-back`, `menu-key`. A6 names its files after these in `sfx.json`; anything not listed keeps its placeholder. Shoe squeaks have no event yet: S14 can add one from the players' movement (no sim change), or A6 can skip them.
  - **The first-input rule:** the context is made at load and kept suspended until a key, click or tap, even in a browser that would let it start (the in-app test browser has no autoplay rule, so this is enforced in code). The first key's own menu sound plays as the context starts. A pad-only start shows "Press a key or tap for sound" under the title's red band (dark text on the wood), and it goes on the first key.
  - **Settings:** EFFECTS (Off, 1–10, default 7) on the options screen above BACK (the options panel was re-spaced a little to fit a fifth button); SOUND ON/OFF in the pause menu (third item); a speaker button left of the fullscreen button (on touch, and on the menus for a mouse). Both are saved in `localStorage` (`hogg-squash.sound`); `?sound=off` mutes one visit without saving.
  - **Checked in the browser** (with `?sound=log`; Claude can't hear, so by what the code reports): `suspended` before any input, also after a menu move and a pad press; `running` after the first key; a CPU-against-CPU match logged hit → front wall → floor for each shot in order, a jingle for each of 12 points and one GAME jingle, nothing in the point freeze; pausing suspends the context; the Effects level (5) and Sound off survived a reload; the speaker button turned sound back on; `?sound=off`; no console errors or warnings from a cold load to the result screen. **By tests only:** the event table's coverage (every event type, collision and rally reason), the settings' saving, loading and clamping with blocked or full storage, `sfx.json` checking, the placeholders never clipping.
  - **Download size:** about 23 KB more (the three audio modules and `sfx.json`), no sound files yet.
  - **For the owner (CP-G or before A6):** listen to a match: does each sound land on its moment, and is 7 the right default? Should the iPhone's silent switch mute the game (now: yes; `navigator.audioSession.type = 'playback'` would play through it)?
  - **Next:** P1 (the owner: ElevenLabs Starter and its connector), then A6.
- 2026-10-29, A6 (sound effects; no version change): 11 MP3s in `assets/sfx/` (76 KB in all) and `sfx.json` naming 14 of S13's 19 sounds; sources, prompts and costs in `audio/elevenlabs-manifest.md`; `audio/make-sfx.mjs` rebuilds the files from the raw takes in `audio/elevenlabs/a6/`.
  - **Plan: ElevenLabs Free, not Starter** (the owner's call: a non-commercial school project; `decisions.md`, "Audio"). The free plan asks for a credit line, **"Sound effects made with ElevenLabs (elevenlabs.io)"**, wherever the sounds are used. A6 can't change game code, so the credit isn't in the game yet: S14 adds it (added to S14's list). Until then the sounds would play on the live site without it, so the owner decides whether to push A6 now or with S14.
  - **Credits: 222 of the 1,000 approved** (first round 28 takes, 172; hit round 5 takes, 50). The price is 10 credits per second of sound, far under the plan's 200 per effect. The free plan runs only two or three generations at a time and sometimes refuses one as busy (nothing is charged); waiting a minute works.
  - **Picked by the owner:** the soft swing (both swings), floor A (the floor and both walls), glass A, tin B, out, point B, game B; every first-round hit was rejected (most were nearly silent, peaks of -40 to -49 dB). A second hit round without the word "squash" (racquetball and tennis wording, 1 s, prompt influence 0.7) gave H4, a soft hollow pock, which makes all four hit sounds: HARD as it is, SOFT pitched to 0.94, serve 1.04, the dive's hit 0.97.
  - **Skipped for now (placeholders stay):** the four menu sounds and `dive`. Shoe squeaks were generated once and rejected; they have no event anyway.
  - **Cleanup:** each file starts on its attack (decoded in Chrome, every file's attack is within its first millisecond, so the MP3 encoder delay is handled), tail cut and faded over 40 ms, mono, -1 dB peak, 96 kbit/s. `sfx.json`'s levels are a starting mix from each file's measured loudness (HARD 1, SOFT 0.5, the jingles 0.25–0.4, the swing 0.12–0.19), for S14 and CP-G to tune.
  - **Checked in the browser** (Claude can't hear them, so by what the code reports): all 11 files load with no console warnings; with `?sound=log&dev`, playing every name logs 14 from files and only `dive` and the menu sounds as placeholders. **By tests:** `npm test` (the S13 test that expected an empty `sfx.json` now checks that every listed file is shipped) and `npm run typecheck` pass.
  - **For S14:** the credit line; the loader fetches a shared file once per name (load it once); vary the shared bounce by surface (pitch) so the walls and the floor don't sound identical; the glass was raised 32 dB from a quiet take, so listen for hiss.
  - **Next:** S14 (the sounds in the game).
