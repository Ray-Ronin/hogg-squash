# Hogg Squash after v1: build plan

Written 2026-10-23 from `CLAUDE.md`, `docs/decisions.md`, `docs/open-questions.md`, `docs/art-style-guide.md`, `docs/theme.md` and `docs/plan.md` (its rules, S12–S12e and the Session log, especially the CP-F entries), with the owner's answers to the planning questions.
v1 is released (CP-F, version 1.0.0). This plan adds the four things the owner picked at CP-F, in this order: **audio, more characters, a crowd, a tournament**.
`docs/plan.md` stays as the v1 history: read a section of it only when a session here points at it.
The work is split into small Claude Code sessions, as in v1. Each one leaves the game working, tests passing and its work committed.

## Status

Tick a line (`[x]`) when its session or checkpoint is finished. **The next session to run is the first unticked line.**
A line marked `[-]` is on hold: it's skipped and doesn't count as unticked, until the owner brings it back.
Lines marked *(you)* are things the owner does. Lines marked 💳 are spend approvals (SpriteCook credits, or ElevenLabs credits for sound): the session after it stops and waits for your OK before generating anything.

**Audio**
- [x] **S13** Sound engine: the first-input rule, the Effects level, pause and mute; placeholder sounds made in code
- [x] **P1** Prerequisites for sound *(you)*: ElevenLabs Starter plan, its connector in Claude Code (can be done any time before A6) *(done 2026-10-26 with the free plan instead, the owner's call: `decisions.md`, "Audio")*
- [x] 💳 Approve ElevenLabs spend for A6 *(you)*
- [x] **A6** Sound effects: generate, trim and level the game's sounds
- [x] **S14** Sound effects in the game: hooking them up, variety and the mix
- [x] **CP-G** Play-test 5 *(you)*: sound
- [x] 💳 Approve ElevenLabs spend for A6b *(you)*: up to 300 credits
- [x] **A6b** Sound effects round 2: the dive, the menu sounds and a shoe squeak *(added at CP-G)*
- [x] **S14b** Sound fix-up: a louder miss whoosh, Effects default 5, shoe squeaks, A6b's files *(added at CP-G)*
- [-] **P2** Prerequisites for music *(you)*: the full ElevenLabs connector, and the free plan's terms for music *(added at CP-G; on hold 2026-11-03, the owner's call)*
- [-] 💳 Approve ElevenLabs spend for A6c *(you)* (A6c gives the price first) *(on hold)*
- [-] **A6c** Menu music: a few short loops in different styles; the owner picks one *(added at CP-G; on hold)*
- [-] **S14c** Music in the game: a Music level, the loop on the title and menus only *(added at CP-G; on hold)*

**More characters**
- [-] 💳 Approve SpriteCook spend for A7 *(you)* *(on hold)*
- [-] **A7** Art: concepts for three new characters *(on hold 2026-11-03, the owner's call: recolours only for now)*
- [x] **S15** Character roster and the character select screen, with recolours of the current player as the roster for now
- [-] 💳 Approve SpriteCook spend for A8 *(you)* *(on hold)*
- [-] **A8** Art: character 2, every animation *(on hold)*
- [-] 💳 Approve SpriteCook spend for A9 *(you)* (a credit top-up is likely needed first) *(on hold)*
- [-] **A9** Art: character 3, every animation *(on hold)*
- [-] 💳 Approve SpriteCook spend for A10 *(you)* *(on hold)*
- [-] **A10** Art: character 4, every animation *(on hold)*
- [x] 💳 Approve SpriteCook spend for A7z *(you)* *(added 2026-11-07: the first finalized character; 192 approved)*
- [x] **A7z** Art: Coach Zain's concept, from the back and the front, in both kits
- [x] 💳 Approve SpriteCook spend for A8z *(you)* *(296 approved, no top-up needed)*
- [x] **A8z** Art: Coach Zain, every animation and the front-view idle
- [x] **S15b** Finalized characters in the game: per-character kits, the front view on select, Coach Zain replaces Will
- [ ] **CP-H** Play-test 6 *(you)*: the characters (the recolours, Coach Zain and the select screen)

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

These apply to A6, A6b, A6c (music) and to A11's crowd sounds:
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

**Outcome (2026-10-29):** done by interview; the answers are in the Session log. The timing, the surfaces, the speed shaping, HARD against SOFT and the jingles were all right. The fixes went into A6b and S14b, and the owner asked for menu music, so P2, A6c and S14c were added too, all before A7.

## A6b: Sound effects round 2 (the dive, the menu sounds, a shoe squeak) *(added at CP-G)*

**Goal:** real files for the sounds that still play A6's placeholders, plus a shoe squeak.

**In scope**
- Follow "Sound sessions: shared rules". The spend gate's estimate uses A6's measured price (10 credits a second of sound, not 200 an effect). **Approve up to 300 credits.**
- Generate two or three prompts each, then variants only of the ones the owner likes:
  - `dive`: the player's dive and landing on a wooden court floor (about 1 s);
  - the four menu sounds, `menu-move`, `menu-ok`, `menu-back` and `menu-key` (short, 0.5 s or less). **The owner hasn't picked a style:** offer two or three styles (for example soft UI clicks, retro bleeps, sporty taps), let them listen, then generate the set in the style they pick. If none wins, the in-code bleeps stay;
  - `squeak`: a basketball-style shoe squeak on a wooden court from a sharp stop (short, under 0.5 s; two or three variants so it doesn't repeat). A6's squeak take was rejected, so try new wording. Name it `squeak` in `sfx.json` (S14b adds the event; until then the file loads and goes unused). *(As done: the game warns about a name it doesn't know and a test forbids warnings, so A6b shipped the files and S14b lists them; see the Session log.)*
- Clean, level against A6's set (the squeak quieter than a SOFT hit), export to `assets/sfx/`, and add the names to `sfx.json`.

**Not in scope:** game code (the squeak's event is S14b), music (A6c), re-doing A6's sounds.

**Depends on:** CP-G, and the 💳 approval line above it.

**Main files:** `audio/elevenlabs-manifest.md`, `audio/elevenlabs/a6b/`, `audio/make-sfx.mjs`, `public/hogg-squash/assets/sfx/`, `sfx.json`.

**Done when…**
- The owner has heard and picked each sound, or chosen to keep its placeholder.
- The manifest shows the credits spent within the approved 300.
- `npm test` passes, and the game loads the new files with no console errors (`?sound=log&dev`: `dive` and any picked menu sounds now come from files).

**Starter prompt**
```text
We're doing Session A6b of docs/plan-v2.md: "Sound effects round 2 (the dive, the menu sounds, a shoe squeak)".
Read CLAUDE.md, docs/decisions.md ("Audio") and docs/plan-v2.md ("Sound sessions: shared rules", A6's and CP-G's Session log entries, A6b). Check CP-G is ticked.
First check my ElevenLabs balance and list the planned generations with prompts and estimated credits (up to 300 approved), then STOP and wait for my OK before generating anything. For the menu sounds, let me hear a few styles before making the set.
No game code changes. Never use or describe the arcade's sounds. Finish with "Done when", tick A6b, add a Session log entry, and commit. Ask me before pushing.
```

## S14b: Sound fix-up (CP-G's notes) *(added at CP-G)*

**Goal:** CP-G's fixes: the miss whoosh heard, a quieter default and shoe squeaks.

**In scope**
- **The miss whoosh about twice as loud:** both swings' levels in `sfx.json` roughly doubled (from 0.12–0.19 to about 0.25–0.38), still well under a hit. The owner found it too quiet on every device and for both HARD and SOFT.
- **Effects default 5** (was 7). Players who already saved a level keep it; only the default changes. Update the test that checks the default.
- **Shoe squeaks:** a new sound name `squeak`, with a placeholder in `synth.js`, and A6b's two files listed in `sfx.json` once the name exists: `"squeak": { "files": ["squeak-1.mp3", "squeak-2.mp3"], "level": 0.18 }` (A6b shipped them unlisted; 0.18 puts them about 3 dB under a SOFT hit, before any extra quieting S14b's cue adds). It plays **when a player stops sharply or changes direction just before hitting**, on **about one such hit in three** (at random), quieter than the hit and panned by the player's x. Work it out in `main.js` from the players' positions over the last few frames before the hit (read only; nothing in `js/sim/`); keep the rule pure and tested in `sounds.js`, like `cuesFor`. A CPU hit counts the same as a human one.
- Check A6b's files (the dive and any picked menu sounds) play on their events with `?sound=log`.

**Not in scope:** new sound files (A6b), music (A6c, S14c), changing the speed shaping, the jingles' levels or the timing (all judged right at CP-G), any change to `js/sim/`.

**Depends on:** A6b.

**Main files:** `public/hogg-squash/assets/sfx/sfx.json`, `js/audio/sounds.js`, `js/audio/audio.js`, `js/audio/synth.js`, `js/main.js`, tests.

**Done when…**
- `npm test` and `npm run typecheck` pass.
- A real match with `?sound=log` logs `squeak` on some hits that follow a sharp stop and never on hits from a steady run, along with the louder swings and A6b's sounds.
- A first visit (no saved settings) shows Effects 5.
- No console errors from a cold load to the result screen. Version 1.14.1.

**You check or decide at the end:** listen to a match: is the whoosh right now, and do the squeaks come often enough without getting repetitive?

**Starter prompt**
```text
We're doing Session S14b of docs/plan-v2.md: "Sound fix-up (CP-G's notes)".
Read CLAUDE.md, docs/decisions.md ("Audio") and docs/plan-v2.md (rules, the S14, CP-G and A6b Session log entries, S14b). Check A6b is ticked.
Build S14b's "In scope" list only. Nothing in js/sim/.
Go through "Done when", tick S14b, add a Session log entry, and commit. Ask me before pushing.
```

> **Music is on hold (2026-11-03, the owner's call):** P2, A6c and S14c are skipped for now, and the owner will decide later whether the game wants music at all. They stay written here in case it does; if so, untick them (`[ ]`) and run them next. CP-J's "what comes next" is the latest point to decide.

## P2: Prerequisites for music *(you)* *(added at CP-G)*

- **Add the full ElevenLabs connector.** The connector used for A6 is the restricted one, with no music. Add the full one as a custom connector at `https://api.elevenlabs.io/v1/mcp` and check that a music tool appears in a new Claude Code session.
- **Check the free plan's terms for music** on the ElevenLabs website: whether music made on the free plan can be used in a non-commercial game the way the sound effects are, and whether it needs the same credit (the build page's THE TOOLS already names ElevenLabs). If it can't, say so at the start of A6c, which then stops: either a paid month or no music (the owner's call).

## A6c: Menu music *(added at CP-G)*

**Goal:** one short music loop for the title and menus, picked by ear from a few styles.

**In scope**
- Follow "Sound sessions: shared rules" (music instead of effects; no game code). **Spend gate:** first find the music price (credits a second or a minute) and list the planned generations with their lengths and estimated credits, then stop for the owner's 💳 OK.
- **The owner wants to hear options first:** generate three or four short candidates in different styles (for example upbeat chiptune, a sporty school pep-band feel, chill lo-fi; all original, nothing like the arcade's music), about 20–30 s each. Then generate a final take or two in the picked style.
- Make it loop without a click or a gap (cut on a bar line, check the join), level it well under the effects so it never covers the menu sounds, and export it (stereo is fine; keep it under about 1 MB). Put it next to the effects, under a name S14c reads (for example `music-menu` in `sfx.json` or its own small list; S14c's call).
- Record every generation in `audio/elevenlabs-manifest.md`, with the plan and the terms P2 found.

**Not in scope:** game code (S14c), music during play, voice, crowd sounds.

**Depends on:** P2, S14b, and the 💳 approval line above it.

**Main files:** `audio/elevenlabs-manifest.md`, `audio/elevenlabs/a6c/`, `public/hogg-squash/assets/sfx/`.

**Done when…**
- The owner has heard the styles and picked a loop, which loops cleanly.
- The manifest shows the credits spent within the approved amount, and the licence terms.
- `npm test` passes, and the page still works because nothing in its code changed.

**Starter prompt**
```text
We're doing Session A6c of docs/plan-v2.md: "Menu music".
Read CLAUDE.md, docs/decisions.md ("Audio") and docs/plan-v2.md ("Sound sessions: shared rules", P2, A6c). Check P2 and S14b are ticked and the full ElevenLabs connector has a music tool.
First find the music price and list the planned generations with estimated credits, then STOP and wait for my OK before generating anything. Let me hear a few styles before the final take.
No game code changes. Never use or describe the arcade's music. Finish with "Done when", tick A6c, add a Session log entry, and commit. Ask me before pushing.
```

## S14c: Music in the game (a Music level, title and menus only) *(added at CP-G)*

**Goal:** A6c's loop plays on the title and menus, never in play, with its own level.

**In scope**
- **A Music level** on the Options screen (Off, 1–10, the same square curve as Effects; the default set by ear, for the owner to judge), saved with the other sound settings in `localStorage`. The options panel gets a sixth button; re-space it as S13 did.
- **Where it plays:** the title, the options and the other menus, looping. It fades out (about half a second) when a match starts and is silent in play, the pause menu and the point freeze. It comes back on the title after a match.
- It obeys everything the effects do: silent until the first key, click or tap; suspended with the window blurred or the tab hidden; Sound on/off and the speaker button mute it too. Load it after the effects so it never delays the first sound.
- A music bus beside the effects (its own gain before the limiter), so the Effects and Music levels are separate.
- `?sound=log` logs the music starting, fading and stopping.

**Not in scope:** music in play, more tracks, new sound files, any change to `js/sim/`.

**Depends on:** A6c.

**Main files:** `js/audio/audio.js`, `js/audio/sounds.js`, the options screen, `js/main.js`, `assets/sfx/`, tests.

**Done when…**
- `npm test` and `npm run typecheck` pass (new tests: the Music level's saving and clamping, the music on the right screens only).
- In the browser with `?sound=log`: the music starts with the first key on the title, fades out at the serve, is silent through the match and comes back on the title; Music Off, Sound off and the speaker button each silence it.
- No console errors from a cold load to the result screen. Version 1.14.2.

**You check or decide at the end:** listen on a computer and a phone: is the Music level's default right, and does the loop get tiring on the menus? Then go to A7.

**Starter prompt**
```text
We're doing Session S14c of docs/plan-v2.md: "Music in the game (a Music level, title and menus only)".
Read CLAUDE.md, docs/decisions.md ("Audio") and docs/plan-v2.md (rules, the S14b and A6c Session log entries, S14c). Check A6c is ticked.
Build S14c's "In scope" list only. Nothing in js/sim/.
Go through "Done when", tick S14c, add a Session log entry, and commit. Ask me before pushing.
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

*On hold (2026-11-03, the owner's call): S15's recolours are the roster for now. The characters proposed before the hold are in the Session log.*

**Goal:** pick the look of three new players, so A8–A10 can animate them.

**In scope**
- Agree with the owner first (no credits): who the three are. Suggestions for variety: a woman player; a taller, lankier player; a stockier, older coach type; different skin tones and hair. All invented, adults, seen from behind in the ready stance like A1, in the Hogg red and black kit. Give each a made-up name (short enough for the score panel's name slot).
- After the spend gate: one concept round per character (SpriteCook, 4 variations, the A1 style reference), and an optional refine round.
- Clean the picked concept of each to a ready frame at 100 px (as A1 did) and show the four characters side by side on our court, in both kits (`art/mockups/a7-roster.png`).
- Record the names, looks and asset IDs in `art/spritecook-manifest.md` and `docs/art-style-guide.md` (a "Characters" table).

**Not in scope:** animations (A8–A10), game code, the select screen (S15).

**Depends on:** S14b (CP-G's fix-ups come first; the menu music is on hold), and the 💳 approval line above it.

**Main files:** `art/character/`, `art/mockups/a7-roster.png`, `art/spritecook-manifest.md`, `art/palette/hogg-squash.gpl`, `docs/art-style-guide.md`.

**Done when…**
- The owner has approved the three looks and names, in both kits.
- The manifest shows the credits spent within the approved amount.
- `npm test` still passes, and the page still works because nothing in it changed.

**You check or decide at the end:** approve the looks and names, or ask for changes (each change is another spend approval). Top up SpriteCook credits now if A8–A10 won't fit.

**Starter prompt**
```text
We're doing Session A7 of docs/plan-v2.md: "Art: concepts for three new characters".
Read CLAUDE.md, docs/decisions.md ("Characters"), docs/art-style-guide.md, docs/theme.md and docs/plan-v2.md ("Art sessions: shared rules" + A7). Check S14b is ticked (the music lines are on hold, so they don't count).
First agree the three characters with me, then check my SpriteCook balance and list the planned generations with estimated credits, then STOP and wait for my OK before generating anything.
No game code changes. Never use ROM/MAME/Gaelco images as references. Finish with "Done when", tick A7, add a Session log entry, and commit. Ask me before pushing.
```

## S15: Character roster and the character select screen

**Goal:** the game can hold several characters and players can pick one. It works with recolours of the current player, so each new sheet, if A8–A10 come back, just appears.

**In scope**
- **The roster:** `assets/characters.json` lists each character: id, name, sheet (`player-100` for the current one), and any extra recolours. The loader (`js/engine/assets.js`, `js/render/sprites.js`) loads every listed sheet, builds each one's white kit with the existing kit swap, and checks each sheet against the contract (tags, frame counts, contact frames, `feet`, `racket <tag>`); a sheet that fails is left out with a console warning, not a broken game.
- **The recolours are the roster for now** *(changed 2026-11-03: A7–A10 are on hold)*: three recolours of the current player (skin and hair from the palette; new tones go into `art/palette/hogg-squash.gpl`, up to 48), so four characters in all, sharing `player-100`'s body and animations. Hair stays off the kit's reds, or the white kit's swap would recolour it. Drawn at load from the one sheet, with no credits; note what that does to memory and loading.
- **Names first:** at the start of the session, agree with the owner the look and name of each recolour and the current player's name (invented people, fitting the 62 px name slot in `large-white`; `Dez` was suggested for the current player).
- **The select screen** (`js/ui/select.js`), after the difficulty step: each player picks with their own controls (P1 on the left, P2 on the right, the CPU's pick shown in 1P, random by default, re-rollable). Each character's `ready` animation plays in the kit it will wear. Touch: tap a character. The flow in `docs/decisions.md` (Screens) is updated: … → difficulty (1P only) → **characters** → controller assignment → match.
- Rematch keeps the picks; the result screen and score panels use the characters' names where they now say P1 / P2 / CPU (check they fit the 62 px name slot; keep P1 / P2 if a name doesn't fit).
- Loading: show the loading bar until every sheet is in; note the page's download size with four sheets.
- Tests: the roster's validation; the screen transitions (2P picks twice; rematch keeps the picks; the CPU's pick); a mirror match is allowed.

**Not in scope:** new SpriteCook art, stat differences (looks only), the tournament, any change to `js/sim/` (characters don't change the play).

**Depends on:** S14b (A7 is on hold; the names are agreed at the start of this session).

**Main files:** `assets/characters.json`, `js/engine/assets.js`, `js/render/sprites.js`, `js/render/actors.js`, `js/ui/select.js`, `js/ui/screens.js`, `js/main.js`, `js/render/hud.js`, `test/screens.test.js`, `test/roster.test.js`, `docs/decisions.md` (Screens, Characters).

**Done when…**
- `npm test` and `npm run typecheck` pass.
- In the browser: 1P and 2P matches with different picks, a mirror match, a rematch, on keyboard and touch; a deliberately broken roster entry is left out with a warning.
- No console errors from a cold load to the result screen. Version 1.15.0.

**You check or decide at the end:** the screen's layout and wording, where it sits in the flow, and whether the CPU's pick should be random or chosen.

*(As built, 2026-11-07: Ronin, Adam, Ben and Will, Ronin first; see the Session log and `decisions.md`, "Characters".)*

**Starter prompt**
```text
We're doing Session S15 of docs/plan-v2.md: "Character roster and the character select screen".
Read CLAUDE.md, docs/decisions.md (Screens, Characters), docs/art-style-guide.md (§2 and §3) and docs/plan-v2.md (rules, the 2026-11-03 Session log entries, S15). Check S14b is ticked (the music lines and A7–A10 are on hold, so they don't count).
First agree the recolours' looks and names and the current player's name with me, then build S15's "In scope" list only. Characters are looks only: nothing in js/sim/ changes.
Go through "Done when", tick S15, add a Session log entry, and commit. Ask me before pushing.
```

## A8, A9, A10: Art: characters 2, 3 and 4, every animation

*On hold (2026-11-03, the owner's call), with A7. If they come back, S15's roster takes them with no game code change.*
*(2026-11-07) New characters now come one at a time as **finalized characters** (below: the template, then A7z, A8z and S15b for Coach Zain). A7–A10 stay on hold as written.*

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

## Finalized characters: shared rules and template *(added 2026-11-07)*

A **finalized character** has its own body, its own sheet and, if wanted, its own shirt, and takes a recolour's place in the roster. Coach Zain is the first (A7z, A8z, S15b below). S15b builds the code once. After it, each later character is art plus one roster entry, with no game code.

**Changes to "Art sessions: shared rules"** for finalized characters (everything else there still applies):
- **Real people** are allowed when they have agreed (`decisions.md`, "Characters"). Their reference photos stay **outside the repo**, in `C:\Hogg Squash\Character References\<id>\`. They are never committed and never go in `art/`. They are uploaded to SpriteCook as references only, and the manifest records their asset IDs, not the files.
- **Their own shirt** is allowed. The shirt body and its print use **their own palette entries**, used nowhere else on the sprite (not the shorts, socks, skin or hair). That lets a per-character `kit` swap in `characters.json` make a P2 / CPU version that is clearly different from P1 (usually white) without touching the shorts. A character in the usual red kit needs no `kit` and gets the standard swap.
- **Height and build may differ.** The character is drawn inside the 150×150 frame, about 94 to 108 px head to soles against the standard 100. `ART_HEIGHT` stays 100: the game scales every frame by the same factor, so a taller drawing plays taller. The overhead's racket must still fit the frame. Play is unchanged (the sim never sees characters).
- **Front view:** an optional `front_ready` tag (8 frames, loops, the same `feet` pivot). The select screen shows it once S15b is in.
- **Palette:** 48 colours at most. Coach Zain brings it to about 47. Will's blond hair tones are free once Zain replaces him, but the next character may still need **the owner's call on the cap** (raise it, or share tones) before its concept.

**Template for each later character**
1. **Agree with the owner first** (planning only, no credits):
   - who they are, their name (the full name for select, plus a `short` one if the full one is wider than the 62 px name slot in `large-white`), and that a real person has agreed;
   - their body (height, build), skin and hair, the shirt and its P2 version;
   - the photos, and which recolour they replace.
   Then add their concept, animation and 💳 lines to the Status list, copying A7z and A8z.
2. **Concept session**, like A7z.
3. **Animation session**, like A8z. It also adds the roster entry (art sessions may), checks the character in the game, and changes no version.

## A7z: Art: Coach Zain's concept *(added 2026-11-07)*

**Goal:** Coach Zain's look, approved from the back and the front in both kits, so A8z can animate him.

**Agreed with the owner (2026-11-07)**
- **Who:** Coach Zain, a real coach who has agreed to be in the game. The owner's reference photos (two of his face, the shirt's front and back) are in `C:\Hogg Squash\Character References\zain\`, outside the repo.
- **Body:** a little taller and slimmer than the others, about 106 px head to soles (they are 100), with narrower shoulders and limbs. Short dark hair faded at the sides, and a full dark beard trimmed short.
- **Skin:** the unused Maya look's ramp (from `art/mockups/s15-looks.png`), drawn into his sheet rather than recoloured. Dark to light: `#2a1710 #3e2216 #6b3a24 #7f4529 #9c5232 #c46a40`. `#7f4529` and `#2a1710` aren't in the palette yet.
- **P1 kit:** the real Hogg Squash Team shirt, black with short sleeves and a round neck.
  - Front: "HOGG" in white over "SQUASH TEAM" in red, small on the left chest.
  - Back: a red boar's head over "SQUASH" running down the spine in light grey capitals.
  - Black shorts; white socks and shoes, like everyone.
- **P2 / CPU kit:** a white version of the same shirt. The print stays readable: the white letters turn black, the red stays red. The shorts stay black.
- **Print:** simplified to what reads at sprite size. The back is about 30 px tall, so the letters are about 4 px and the boar about 6. The owner sees a close-up before anything is animated.
- **Name:** "Coach Zain" on the select screen and "Zain" on the score panel and the result. The full name is 106 px in `large-white` and the slot is 62; S15b adds the short name.
- **Replaces:** Will, so the roster becomes Ronin, Adam, Ben, Coach Zain.

**In scope**
- **Spend gate:** check the SpriteCook balance (488 at the last record, 2026-10-23). List the generations with model, quality and estimated credits, then stop for the owner's OK.
- Upload the four photos to SpriteCook (the `spritecook-upload-assets` flow).
- A back-view concept in the ready stance (4 variations). Style reference: A1 concept 4 (`db1eb2a8-7816-44de-b78a-ee5810bd5790`), with the photos as references. An optional refine round.
- The front view, made from the picked back concept (`rotate_sprite` or `make_rotation_sheet`, or a concept round with the picked one as reference).
- Clean both in Aseprite to a ready frame at the 100 px scale, with him about 106 px tall, locked to the palette.
  - New entries in `art/palette/hogg-squash.gpl`: Maya's two tones, the shirt's two blacks and the print's white. That makes about 47 of 48.
  - Write down the planned `kit` swap (a [from, to] list) for S15b.
- Previews for the owner, with the white kit made by the planned swap:
  - a 4× close-up of the print, back and front, in both kits (`art/mockups/a7z-print.png`);
  - Zain beside Ronin on the court, back and front, in both kits (`art/mockups/a7z-zain.png`).
- Record the look, the asset IDs and the costs in `art/spritecook-manifest.md`, and add Zain to the "Characters" table in `docs/art-style-guide.md`.

**Not in scope:** animations (A8z), game code, the roster file (S15b).

**Depends on:** S15, and the 💳 line above it.

**Main files:** `art/character/zain.aseprite`, `art/mockups/a7z-*.png`, `art/palette/hogg-squash.gpl`, `art/spritecook-manifest.md`, `docs/art-style-guide.md`.

**Done when…**
- The owner has approved the look and the print, from the back and the front, in both kits.
- The manifest shows the credits spent within the approved amount.
- `npm test` still passes, because nothing in the game changed.

**You check or decide at the end:** approve the look and the print, or ask for changes (each change is another spend approval). Top up SpriteCook credits if A8z won't fit.

**Starter prompt**
```text
We're doing Session A7z of docs/plan-v2.md: "Art: Coach Zain's concept".
Read CLAUDE.md, docs/decisions.md ("Characters"), docs/art-style-guide.md, docs/theme.md and docs/plan-v2.md ("Art sessions: shared rules", "Finalized characters", A7z). Check S15 is ticked.
The reference photos are in C:\Hogg Squash\Character References\zain\ (never commit them).
First check my SpriteCook balance and list the planned generations with estimated credits, then STOP and wait for my OK before generating anything.
No game code changes. Never use ROM/MAME/Gaelco images as references. Finish with "Done when", tick A7z, add a Session log entry, and commit. Ask me before pushing.
```

## A8z: Art: Coach Zain, every animation *(added 2026-11-07)*

**Goal:** Coach Zain's full sheet, cleaned to the contract, plus a front-view idle for the select screen.

**In scope**
- **Spend gate** as in A7z: 10 animations at about 20 credits each by v1's prices, so approve up to about 320. If the balance won't cover it, say how many credits to top up.
- `animate_game_art` on the picked back concept for every contract tag: `ready`, `run_side`, `run_up`, `run_down`, `serve`, `forehand`, `backhand`, `overhead`, `dive`.
  - Start from v1's prompts (`art/spritecook-manifest.md`, A2 and A3), with the player described as Zain ("a tall, slim coach in a black short-sleeve team shirt with a red boar's head on the back…").
  - Use the lessons in v1's A2/A3 Session log (the racket changing hands, the dive's direction).
  - Add `front_ready`, an 8-frame front-view idle, from the front concept.
  - *(A7z)* Animate back concept 3 (`e60bd106-76db-4638-a31d-d397282be092`) and front concept 1 (`f5b47d79-0fad-4680-8868-d09f2f6124a5`). The front is cleaned at **90% width** (the owner's call), so `front_ready` gets the same squeeze (`a7z-build.lua`'s `clean(file, 0.9)`). Reference images are billed once per variation on still images; price any reference-heavy job with that in mind.
- Clean in Aseprite to the contract, with `art/tools/a2-build.lua`, `pixel-lib.lua` and a `zain` build script if needed:
  - the same height in every frame (about 106 px), feet lined up on the `feet` slice;
  - the contact frames, and the `racket <tag>` slices (`racket-slices.lua`);
  - the shirt and print colours in their own palette entries only (a check: none of them appear anywhere else, in any frame);
  - the overhead fits the 150 px frame.
- Export `public/hogg-squash/assets/zain-100.png` + `.json` (source: `art/character/zain.aseprite`). It doesn't go in the roster yet; S15b adds it with the kit.
- Previews: a strip and GIFs per tag in both kits (`art/mockups/a8z-*`), with the white kit made by the planned swap.

**Not in scope:** game code, the roster file, a win celebration (later).

**Depends on:** A7z, and the 💳 line above it.

**Main files:** `art/character/zain.aseprite`, `art/tools/`, `public/hogg-squash/assets/zain-100.png` + `.json`, `art/spritecook-manifest.md`, `docs/art-style-guide.md`.

**Done when…**
- The owner has approved every animation and the front idle, in both kits.
- The sheet passes `sheetProblems` (`js/render/roster.js`) in Node, and has an 8-frame `front_ready` tag.
- The manifest shows the credits spent within the approved amount.
- `npm test` still passes.

**You check or decide at the end:** approve the animations, or ask for re-runs (another spend approval).

**Starter prompt**
```text
We're doing Session A8z of docs/plan-v2.md: "Art: Coach Zain, every animation".
Read CLAUDE.md, docs/decisions.md ("Characters"), docs/art-style-guide.md (§3, §4, "Characters"), docs/plan-v2.md ("Art sessions: shared rules", "Finalized characters", A7z's Session log entry, A8z) and the A2/A3 entries in docs/plan.md's Session log. Check A7z is ticked.
First check my SpriteCook balance and list the planned generations with estimated credits, then STOP and wait for my OK before generating anything.
No game code changes. Never use ROM/MAME/Gaelco images as references. Finish with "Done when", tick A8z, add a Session log entry, and commit. Ask me before pushing.
```

## S15b: Finalized characters in the game *(added 2026-11-07)*

**Goal:** the game shows a finalized character in its own kits and, on the select screen, from the front. Coach Zain replaces Will. After this, later finalized characters need only data.

**In scope**
- **A per-character kit:** a `characters.json` entry may have `kit`, a list of [from, to] palette colours (`#rrggbb`). It replaces `KIT_SWAP` for the P2 / CPU kit (`colouring` in `js/render/roster.js`). `parseRoster` checks it (well formed, no colour listed twice). An entry without it gets the standard swap, so the recolours are unchanged.
- **A short name:** an optional `short`, used where the full name doesn't fit the 62 px name slot (the score panels, the wall's notes, the result). The select screen shows `name`. `sideNames` tries `name`, then `short`, then P1 / P2 / CPU as now.
- **The front view:** an optional `front_ready` tag in the sheet contract (if present: it loops and has at least 1 frame).
  - `previewOf` builds the select screen's atlas from it when the sheet has one, and `js/ui/select.js` plays it on the cards and the big figures.
  - A sheet without it shows `ready` from the back, as now.
- **The roster:** replace Will with `{ "id": "zain", "name": "Coach Zain", "short": "Zain", "sheet": "zain-100", "kit": [...] }`, using A7z's swap. No skin or hair recolours (they're drawn into the sheet).
- **Memory and download:** Zain's sheet is a second image. Note its size, and the atlas memory if the frame isn't 150×150.
- **Tests** (`test/roster.test.js`):
  - `kit`: a good one, a bad colour, and that it's used for kit 1 only;
  - `short`: it fits, and the fallback order;
  - `front_ready`: optional, and a broken one is left out with a warning;
  - the real roster with Zain;
  - Zain's white kit has no shirt black left on any frame (like S15's recolour test).
- **Docs:** `decisions.md` ("Characters", as built), `art-style-guide.md` §2 and §3 (the per-character kit, the optional tag, heights), `CLAUDE.md`'s status line.

**Not in scope:** a win celebration or result-screen art, other characters, anything in `js/sim/`.

**Depends on:** A8z (the sheet). The code can be written against a small test sheet as soon as A7z has fixed the kit swap, but it ships with A8z's sheet.

**Main files:** `assets/characters.json`, `js/render/roster.js`, `js/render/sprites.js`, `js/ui/select.js`, `js/main.js`, `test/roster.test.js`, `docs/decisions.md`, `docs/art-style-guide.md`, `CLAUDE.md`.

**Done when…**
- `npm test` and `npm run typecheck` pass.
- In the browser:
  - a cold load with no console warnings;
  - the select screen shows Ronin, Adam, Ben and Coach Zain, with Zain from the front;
  - a match with Zain as P1 (black shirt) and as P2 / CPU (white shirt): visibly taller and slimmer, and the racket meets the ball on every swing and the dive;
  - a Zain mirror match, a rematch, keyboard and touch;
  - "Coach Zain" on the select screen, the short name on the panel and the result.
- Version 1.15.1.

**You check or decide at the end:** how Zain looks in the game in both kits; the front view next to the others' back views on the select screen.

**Starter prompt**
```text
We're doing Session S15b of docs/plan-v2.md: "Finalized characters in the game".
Read CLAUDE.md, docs/decisions.md (Screens, Characters), docs/art-style-guide.md (§2 and §3) and docs/plan-v2.md (rules, "Finalized characters", the A7z and A8z Session log entries, S15b). Check A8z is ticked.
Build S15b's "In scope" list only. Characters are looks only: nothing in js/sim/ changes.
Go through "Done when", tick S15b, add a Session log entry, and commit. Ask me before pushing.
```

## CP-H: Play-test 6: the characters *(you)*

1. Play a match as each character, 1P and 2P. Can you tell them apart at the front and back of the court, in both kits?
2. Does any recolour look off (skin or hair against the kit, the floor or the walls)?
3. **Coach Zain:** does he look like himself, taller and slimmer, in both shirts? Does the print read?
4. Is the select screen clear, with Zain from the front and the others from the back? Is the CPU's pick right (random or chosen)?
5. Who is the next finalized character, and which recolour do they replace (the template under "Finalized characters")?

**Starter prompt** (planning-only session)
```text
Planning only: change no files except docs/plan-v2.md and docs/decisions.md.
Read docs/plan-v2.md and its Session log. My CP-H feedback: <notes>.
Add the fixes as a small fix-up session (S15c, or an art re-run with its own 💳 line) before A11 if needed, and the next finalized character's lines if I named one (the "Finalized characters" template), tick CP-H, and commit. Don't push.
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
- **Release prep** as S12 did: check in Chrome, Edge and Firefox, at 60 Hz and a high refresh rate if available, and a phone (touch, sound after the first tap); a cold load with an empty cache (note the total download size: the character sheets, the crowd, sounds); caching still fine after a deploy.
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
- 2026-10-29, S14 (sound effects in the game, 1.14.0): `sounds.js` gains `cuesFor` (each sound's volume and pan from what happened), `pickVariant` and `SHAPE`; `audio.js` plays cues with a pan, a per-name `rate` from `sfx.json`, a ±3% pitch wobble on the racket and the ball, variants never twice running, each file loaded once, and a limiter on the master; `main.js` passes the ball's place and speed (read only, nothing in `js/sim/`). `sfx.json`: the shared bounce pitched per surface (floor 0.92, front wall 1.06), the soft swing 1.08, the ball sounds' levels raised a little. 2 new tests (156 unit tests in all).
  - **Credit line:** the owner put ElevenLabs in THE TOOLS on the build page (roninray-site, "Build page: add ElevenLabs to THE TOOLS"), so nothing was added in the game; recorded in `decisions.md` and the manifest. It names and links ElevenLabs rather than quoting the exact line; the owner judged that enough for now.
  - **Measured:** ball speeds at each collision in six CPU matches (units a frame): front wall 1.9–4.1 (median 2.6), floor 1.8–3.4, side walls up to 6.8, back glass mostly about 1.4; the volume curve is set from these. **Hit to sound: 40–53 ms** from the event to the sound being heard (Chrome: 10 ms base + 40 ms output latency, from `getOutputTimestamp`); the sound starts on its event's step, so the delay is the audio output itself, about one to two display frames behind the picture. Nothing to shift in code; the owner listens at CP-G.
  - **Checked in the browser** (Chrome in the app; Claude can't hear, so by `?sound=log`): CPU-against-CPU matches (P1 handed to a CPU in the dev hook) logged every one of the 14 file sounds on its event, `out` by putting the ball over the back glass by hand (CPUs never hit out); only `dive` and the menu sounds played placeholders, as A6 left them. Each page load fetched 11 files, `bounce-1.mp3` and `swing-1.mp3` once each. A cold load to the result screen: no console errors or warnings; v1.14.0 shown. The first rally ran in real time; the rest were stepped fast through the dev hook (the pane was hidden, which stops its animation frames), so the latency numbers come from the real-time part. **By tests only:** the cues (speed, depth, pan, tin and out keeping the ball's place, jingles centred), variants never twice running, `sfx.json`'s `rate` checked and clamped. **Not checked:** Edge, Firefox and a phone (for the owner at CP-G), and the limiter by ear.
  - **Download size:** about 87 KB for the sound code and files together (the files unchanged from A6, 76 KB).
  - **For the owner (CP-G):** is the mix right (the bounce pitches, the glass's hiss, HARD against SOFT, the jingles' levels), is the speed shaping too strong or too weak, and is 7 the right default? Push A6 and S14 together (the credit is now on the build page).
  - **Next:** CP-G (play-test 5: sound).
- 2026-10-29, CP-G (play-test 5: sound; planning only, no version change): the owner played 1P and 2P on a computer and a phone, then answered CP-G's questions in an interview.
  - **Right as it is:** every hit, bounce and jingle sounds right and on time; the 40–53 ms delay can't be heard. The floor, walls and glass sound different enough; no hiss on the glass. The speed shaping, HARD against SOFT and the jingles' levels are right. Sound on/off and the speaker button work. The gamepad-only note makes sense.
  - **To fix (S14b):** the miss whoosh is too quiet on every device, for both swings: about double. The default Effects level goes from 7 to 5.
  - **To add:** real files for the dive and the four menu sounds (the owner wants to hear menu styles before picking), and shoe squeaks on about one hit in three when the player stops sharply just before hitting (A6b makes the files, up to 300 credits; S14b adds the event).
  - **Settled:** the iPhone's silent switch keeps muting the game.
  - **Music: yes, on the title and menus only**, never in play (changes "effects only"). The owner wants to hear a few styles first. The ElevenLabs connector used so far is the restricted one with no music, so P2 (the owner) adds the full connector and checks the free plan's terms for music; A6c makes the loop and S14c puts it in with a Music level.
  - **Plan changes:** P2, A6b, S14b, A6c and S14c added with their 💳 lines, all before A7; A7 now depends on S14c. Decisions in `decisions.md`, "Audio".
  - **Next:** 💳 approve A6b's spend, then A6b.
- 2026-10-30, A6b (sound effects round 2; no version change): real files for the dive and the four menu sounds, and two shoe-squeak variants for S14b; sources, prompts and costs in `audio/elevenlabs-manifest.md` (raw takes in `audio/elevenlabs/a6b/`, listening page from its `make-listen.mjs`); `audio/make-sfx.mjs` now builds A6's and A6b's files from either folder (A6's 11 files rebuilt byte for byte).
  - **Credits: 90 of the 300 approved** (round 1, 10 takes: 75; round 2, one more squeak: 5; round 3, style B's back and key: 10). The connector can't read the balance; about 9,690 left by A6's figure. The free plan refused several takes as busy (nothing charged); the squeak has two variants, not three.
  - **Picked by the owner:** dive D2 (a padded thud with a short slide); squeak S1 (a basketball sneaker's chirp from a hard stop), two takes; menus **style B, retro bleeps** (B's move and OK from round 1, back and key made to match in round 3). The menu pick took three turns: first the in-code bleeps, then style A (A6's untried soft UI clicks, committed in the first A6b commit), then, hearing A built, the owner found B's move was the sound they meant. Style C (string tick and whistle) wasn't picked.
  - **Cleanup** as A6 (start on the attack, 40 ms fade, mono, -1 dB peak, 96 kbit/s). The dive is 0.40 s; the squeaks 0.30 s each (their raw takes peak over full scale, so they're brought down). **The menu files keep each whole take (0.48 s):** style A's first build cut move, back and key shorter, and the owner heard them as different sounds; the listening page now plays the built files beside their takes. Sound files 132 KB in all (was 76).
  - **`sfx.json`:** `dive` 0.6, `menu-move` 0.35, `menu-ok` 0.15 (its take is much louder), `menu-back` 0.3, `menu-key` 0.33, so the four are about equally loud. **`squeak` isn't listed:** the game warns about a name it doesn't know and a test forbids warnings, so the plan's "list it and it goes unused" wasn't possible without code; S14b adds the name and the line (in S14b's list, level 0.18, under a SOFT hit).
  - **Checked in the browser** (Claude can't hear them, so by `?sound=log&dev`): every file loads (200), `dive` and the four menu sounds log from files at their levels, not placeholders, and there are no console warnings or errors; the squeak files aren't fetched yet. The owner heard the built style-B files on the listening page and approved them. `npm test` (156 unit tests) and `npm run typecheck` pass. **Not checked:** the new levels by ear in a match.
  - **Fixed in passing:** A6's `make-listen.mjs` read every take's peak as 0 dB (ffmpeg's report was only read when it failed), so its "very quiet" warning never showed; both listening scripts now read it.
  - **For S14b / the owner:** the menu and dive levels are a starting guess; tune by ear with the squeak's.
  - **Next:** S14b (sound fix-up).
- 2026-10-31, S14b (sound fix-up, 1.14.1): CP-G's fixes. `sfx.json`: both swings doubled (HARD 0.19 → 0.38, SOFT 0.12 → 0.25) and A6b's squeaks listed (`squeak`, two variants, 0.18); `audio.js`: Effects default 5 (saved levels are kept); `sounds.js`: the `squeak` name and its rule (`SQUEAK`, `sharpStop`, `squeakCues`); `synth.js`: a squeak placeholder; `main.js` keeps each player's last 13 places (read only, nothing in `js/sim/`) and plays the squeaks after a step's other sounds. 1 new test, 2 updated for the default (157 unit tests in all).
  - **The squeak's rule:** the swing plants the player from the press, 7 frames before the hit, so every hit finds them still. A hit counts as a sharp stop when the player ran (at least 1 court unit a frame for at least 2 frames) in the 12 frames up to the hit, which reaches 4 frames before the press; a turn there counts as well. A player who had stood still that long never squeaks, nor does being put back on the serve spots. Then one in three at random, panned by the player's x. CPUs count the same. The plan's "steady run" can't happen as such (nobody runs through a hit), so it's read as "had already stopped and waited".
  - **Measured:** in six CPU-against-CPU matches to 9 (Node), 743 of 1,370 hits (54%) came off a sharp stop, so about 1 hit in 6 squeaks.
  - **Checked in the browser** (Chrome in the app, `?sound=log&dev`; Claude can't hear, so by the log): with no saved settings the options show EFFECTS 5 and nothing is saved. After a key press, a CPU-against-CPU match (P1 handed to a CPU in the dev hook, stepped fast) to the result screen logged 40 squeaks on the 128 hits that followed a sharp stop (31%), none on the other 103, each at x0.18 panned by the player; misses at x0.38 / x0.25; `dive` and `menu-ok` from files; no placeholder anywhere. A cold load to the result screen without the log: no console errors or warnings, 18 sound files fetched (both squeaks 200). **By tests only:** the rule's edge cases (stopped too long ago, standing, still running, a turn, a one-frame nudge, a jump to the serve spot), the chance and the pan, and a CPU match where squeaks only come off sharp stops. **Not checked:** the menu-back and menu-key files in this session (A6b logged them from files), and anything by ear.
  - **Download size:** sound files 97 KB on disk (18 MP3s); S14b adds the two squeaks (9 KB) to what a page fetches.
  - **For the owner:** listen to a match: is the whoosh right now, and do the squeaks come often enough without getting repetitive? `SQUEAK.CHANCE` and the squeak's level in `sfx.json` are the knobs. Tune the menu and dive levels by ear too.
  - **Next:** P2 (the owner: the full ElevenLabs connector and the free plan's terms for music).
- 2026-11-03, music on hold (planning only, no version change): A6c was started and stopped at its first checks (P2 not done, no music tool in the connector, the free plan's music terms not yet looked up). Nothing was generated and no credits were spent. The owner then chose to skip music for now and decide later whether the game wants it at all.
  - **Plan changes:** P2, A6c's 💳 line, A6c and S14c are marked `[-]` (on hold; the Status section says what that means) but stay written; A7 now depends on S14b. The game stays effects only, with no Music level. `decisions.md`, "Audio".
  - **Next:** 💳 approve A7's spend, then A7.
- 2026-11-03, new character art on hold (planning only, no version change): A7 was started and stopped at its first step, before the balance was checked. Nothing was generated and no credits were spent. The owner chose recolours of the current player for now, to save the credits; the plan put the character art at about 880 of its roughly 1,000 credits.
  - **Plan changes:** A7–A10 and their 💳 lines are marked `[-]` but stay written. S15 now depends on S14b, and its recolours are the roster for now, not tests; names are agreed at its start. CP-H stays, with its questions updated, so A11's dependency on it is unchanged. `decisions.md`, "Characters".
  - **Trade-off:** everyone shares one body and its animations, so the tournament's opponents differ by skin, hair and name only.
  - **If A7 comes back:** these were proposed but never agreed. Maya: a woman in her 20s, slim and compact, long dark ponytail, medium brown skin. Otis: a tall, lanky man in his 30s, black short flat-top, deep brown skin, narrow shoulders and long limbs. Hank: a stocky coach of about 60, grey hair thinning on the crown, light weathered skin. All three stay 100 px head to soles, and their names fit the name slot (at most 48 px of 62).
  - **Next:** S15.
- 2026-11-07, S15 (character roster and select screen, 1.15.0): four characters, all recolours of `player-100`, picked on a new screen after the level (1P) or the length (2P). New: `assets/characters.json` (the roster), `js/render/roster.js` (entry and sheet checks, `SHEET_CONTRACT`, the atlas cache, each side's name), `js/ui/select.js`; `sprites.js` gains `recolour` and `hairMask` (`buildAtlas` takes a colouring and an optional frame list); `screens.js` gains the `select` screen (per-side moves, the CPU's random pick and re-roll, taps), `settings.picks`; the HUD and result take names; `main.js` loads the roster, then each sheet it names, and builds the match's two atlases from the picks. Nothing in `js/sim/` changed. 12 new tests (169 unit tests in all; `test/roster.test.js`, `test/png.js` reads the sheet in Node).
  - **Agreed with the owner first:** five candidates were drawn (`art/mockups/s15-looks.png`). The owner picked the names and looks, and asked for **Ronin to be the main player** (P1's starting pick, first in the roster): Ronin (a new skin ramp between Adam's and Will's, auburn hair), Adam (the original art), Ben (Adam's skin, black hair), Will (fair skin, blond hair). Preview of the four as built, coloured by the game's own code: `art/mockups/s15-roster.png`. Six palette tones added (42 of 48). The plan's "Dez" isn't used.
  - **The hair problem and its fix:** the sheet's two hair colours are also the shorts' dark shading (`hair dark` is 9,019 pixels, most of them not hair), so a plain colour swap would speckle the shorts on any hair lighter than black. The hair is recoloured only in each frame's largest blob of those colours, plus any of them within 2 px of its box; that is the head in all 73 frames, the dive included (a test checks every frame: one head's worth of pixels, above y 75 standing or at the head end of the dive).
  - **The CPU's pick:** random by default; up / down (or a tap on it) rolls another, never the same one. A mirror match is allowed; its names fall back to P1 / P2 / CPU.
  - **Checked in the browser** (Chrome in the app, `?dev`, real key events): 1P by keyboard (the CPU rolled, P1 picked Will by wrapping left from Ronin), the match named Will and Ben on the panels and the wall, played out (P1 handed to a CPU) to "WILL WINS 11–9"; a rematch kept the picks and the same sheets; 2P with each player's own keys (P2's arrows moved only P2; F locked only P1), back from the controllers to the characters, a mirror match (both Will, red and white, named P1 / P2); touch at 844 × 390 with real touch events (a tap on the CPU rolled it, a tap below it where SOFT sits did nothing, a tap on Adam's card picked him, the match started); a roster with three broken entries (a bad id, a kit-red hair, a missing sheet) loaded the four good characters with one warning for each; a cold load to the result with no console messages; the `?level=` shortcut still skips the menus. **By tests only:** the roster's validation, the sheet contract on a broken copy, the recolour on every frame in both kits, the screen's moves (2P picks twice, the CPU's pick, rematch, back, taps, no roster), the names' fallback, the words fitting the font.
  - **Fixed on the way:** with touch showing, the SOFT button covered the CPU's "Tap for another" line, so a tap there would have gone back; the lines now sit above the CPU's figure and only the figure rolls.
  - **Memory and loading:** a full sheet in one kit is about 7.6 MB of canvas; only the match's two are kept (built when the match is set up, about 20 ms each in Node), plus the select screen's `ready` loops (0.76 MB each, up to 8): about 21 MB, against v1's 15 MB. The loading bar counts the roster and each sheet. **Download size:** no new images (the four share `player-100.png`, 72 KB); the roster file is 1.2 KB and the new code about 13 KB.
  - **For the owner (CP-H):** the screen's layout and wording; random or chosen CPU picks; whether the four are told apart well enough at the front of the court. Also seen: on a phone the speaker button sits over the right score panel's name (S13's place; it covered "CPU" the same way before).
  - **Next:** CP-H (play-test 6: the characters).
- 2026-11-07, finalized characters planned (planning only, no version change): the owner wants characters with their own bodies and art, one at a time, each replacing a recolour. The first is **Coach Zain**, a real coach based on the owner's photos.
  - **Plan changes:** a "Finalized characters" section (rule changes and a template for later ones), and A7z (concept), A8z (animations) and S15b (code, 1.15.1) with their 💳 lines, all before CP-H. A7–A10 stay on hold as written. CP-H's questions now include Zain and the next character; its fix-up session is S15c.
  - **The owner's answers:**
    - **Body:** slightly taller and slimmer, about 106 px against 100. Skin from the unused Maya look.
    - **Kit:** the real black Hogg Squash Team shirt (the print simplified to what reads, a close-up approved before animating), black shorts. P2 / CPU wears a white version, so the two sides and a mirror match can be told apart.
    - **Front view:** a front-facing idle on the select screen only. A win celebration comes later.
    - **Photos:** the face and shirt photos are uploaded to SpriteCook as references. Zain has agreed. They're kept in `C:\Hogg Squash\Character References\zain\`, outside the repo.
    - **Roster:** Zain replaces Will (Ronin, Adam, Ben, Coach Zain).
    - **Name:** "Coach Zain". It measures 106 px in `large-white` against the 62 px name slot, so S15b adds a short name ("Zain", 40 px) for the score panel and the result.
  - **Why S15b needs code:** the white kit swap only changes the kit's reds, and a black shirt shares its blacks with the shorts. So the shirt and print get their own palette entries, and a character can carry its own `kit` swap. The select screen has no front view, so an optional `front_ready` tag is added. Height needs no code: every frame is scaled by `ART_HEIGHT`, so a taller drawing plays taller.
  - **Credits:** about 30–60 for A7z's concept and front view and up to about 320 for A8z, against 488 at the last record (2026-10-23).
  - **Next:** 💳 approve A7z's spend, then A7z.
- 2026-11-07, A7z (Coach Zain's concept, no version change): Zain's look from the back and the front, cleaned to a ready frame at the 100 px scale (106 px head to soles), approved by the owner in both kits. No game code changed.
  - **Spend:** 192 of the 192 approved credits; 488 → 296. The four photos were uploaded as references (no charge; they stay in `C:\Hogg Squash\Character References\zain\`, not in the repo). **Reference images are billed once per variation**, not once per job as estimated: the back round (4 variations, 3 references: A1 concept 4, face-2, the shirt back) cost 128, not 56, so the front round was re-priced to 2 variations (concept 3, face-2, the shirt front: 64) and the optional refines were dropped. All in `art/spritecook-manifest.md`.
  - **Picked:** back concept 3 (the slimmest, with the beard along the jaw) and front concept 1 (slimmer than front 2; the face reads). The owner then asked for the front a little skinnier from the same image: it's squeezed to 90% width before cleaning (69 → 62 px), with the height unchanged.
  - **Built:** `art/tools/a7z-build.lua` → `art/character/zain.aseprite` (150 × 150 frames, `ready` from the back, `front_ready` from the front, the `feet` pivot at 73, 148) and the previews `art/mockups/a7z-print.png` (the print at 4×, both kits) and `a7z-zain.png` (beside Ronin on the court, both kits). The cleaner is `pixel-lib.lua`'s, limited to Zain's skin ramp; inside a shirt mask the generator's blacks (and the dark shadows it matched to `hair dark`) become the shirt's own entries, and small outline-coloured creases there become shirt black, or the white kit would show them as black specks.
  - **Palette:** five entries added at the end of the `.gpl` (no index moves), 47 of 48: skin 0 `#2a1710` and skin 2b `#7f4529` (Maya's ramp), shirt black `#262529`, shirt black light `#3b3a41`, shirt print `#dcdce0`. The shirt entries appear only inside the shirt by construction (the shirt mask and the prints are the only places the script writes them).
  - **The print, redrawn by hand:** back, a red boar's head (about 7 × 6) over SQUASH in 3 × 3 capitals down the spine. The plan's 4-px letters don't fit: the shirt is 31 rows from collar to hem and boar plus six 4-row letters need 35. Front, four letter blocks ("HOGG") over two red lines ("SQUASH TEAM"); at this size it reads as a chest logo, not words.
  - **The planned `kit` swap for S15b:** `[["#262529", "#e6e6ea"], ["#3b3a41", "#ffffff"], ["#dcdce0", "#252429"]]` (shirt → white kit shade, highlight → white, print → black kit; the reds and the shorts are untouched). `art-style-guide.md`, "Characters".
  - **Checks:** `npm test` passes, as before (nothing in the game changed). The previews were checked by eye in both kits.
  - **For A8z:** the balance (296) is under its estimate (about 320), so a top-up of about 50–100 credits is likely first. The front idle needs the same 90% squeeze.
  - **Next:** 💳 approve A8z's spend, then A8z.
- 2026-11-08, A8z (Coach Zain, every animation, no version change): his full sheet, approved by the owner in both kits. No game code changed; he isn't in the roster yet (S15b).
  - **Spend:** 200 of the 296 approved credits: 10 `animate_game_art` jobs at 20 each, no re-runs; 296 → 96. No top-up was needed. All in `art/spritecook-manifest.md`.
  - **The source:** SpriteCook refuses pixel animation from anything over 256 px, at no charge, and back concept 3 is 278 px. So the jobs ran on a 256 px area-averaged copy, a free upload (`d2d2d9de-d8a4-437e-aa9c-b5e4b7b1a08a`). A 256 px source leaves no room for an edge margin: every cell is 256 px whatever margin is asked for. The racket and the dive still fit. Later characters should use a source of about 200 px if they need margins.
  - **Built:** `art/tools/a8z-build.lua` → `art/character/zain.aseprite`, exported by `art/tools/a8z-export.sh` to `public/hogg-squash/assets/zain-100.png` + `.json`: 81 frames of 150 × 150, the nine contract tags plus `front_ready`, the `feet` pivot at 73, 148. Each file is read at its own scale, with its source pose at 106 px, and every frame's soles go on the ground line.
  - **Frames picked, not re-run:** the generator's output was mostly good, with bad frames in places. The forehand's contact frame comes from `backhand.png` frame 10, because its own draws two rackets; the backhand shows one follow-through frame twice, replacing a broken one; the serve leaves out the frame with the racket over the shirt. The dive's 1.4 s on the floor alternates two frames, and `front_ready` loops over its clean frames, because three others draw a ball over the racket. Lists are in the manifest.
  - **The shirt, in every frame:** the script finds the print by matching the file's first frame, which gives the torso's place and angle. From that it moves the shirt's blacks to the shirt's own entries and stamps A7z's hand-drawn print afresh, so it doesn't shimmer. Thick shadows inside the shirt, which quantize to outline, become shirt black, or they'd stay black on the white kit. In the dive the body is foreshortened, so the torso's place and a squeeze along the spine are set by hand for six frames; there the print is about half its length and doesn't read as letters.
  - **Cleanup by hand:** three grey smears cut from the dive's raw frames and one ball erased from the serve. The generator turned the reds brown in `serve.png` and `dive.png`, so the racket and the shoe trim get kit red back, except the shoe trim in the dive.
  - **Racket points:** serve 58, 74; forehand 117, 75; backhand 39, 75; overhead 97, 53; dive 118, 130. The overhead's is about 38 px lower than `player-100`'s (79, 15). The game's shift is capped at 1% of the height, so he doesn't float, but his racket sits lower against a high ball. **For S15b and CP-H:** check it in play.
  - **Previews:** `art/mockups/a8z-strips.png` (every frame in both kits, the contact frames marked), `a8z-<tag>-p1.gif` and `-p2.gif`, and `a8z-review.html`, which shows them all together (serve the folder, as it won't load its GIFs from `file://`).
  - **Checks:** `sheetProblems` finds nothing; `npm test` passes. A check in `art/tools/a8z-preview.lua` found no shirt-coloured pixels outside the shirt's rows, in any frame (it looks at rows only, so the rest was checked by eye in the white kit). **Not checked:** the sheet in the game, as it isn't in the roster until S15b.
  - **Next:** S15b.
- 2026-11-08, S15b (finalized characters in the game, 1.15.1): Coach Zain replaces Will, in his own black shirt as P1 and a white one as P2 / CPU, from the front on the select screen, "Coach Zain" there and "Zain" on the panel, the wall and the result. New in `js/render/roster.js`: `kit`, `short`, `colouring` (exported), `previewTag`, the optional `front_ready`; `sideNames` now takes the characters. `js/ui/select.js` plays the front view. Nothing in `js/sim/` changed. 5 new tests and more cases in 4 others (174 unit tests in all; `test/roster.test.js`). As built: `decisions.md`, "Finalized characters".
  - **A typo in A7z's swap, found and fixed:** A7z's notes gave shirt black as `#262529`, but the palette and the sheet have `#26252a` (38 37 42). No pixel in any frame is `#262529`, so as written the white kit would have left the shirt black. A7z's and A8z's previews swap by palette entry name, so they never showed it. `characters.json`, `art-style-guide.md` and `theme.md` now say `#26252a`; A7z's entry above stays as written. A new test checks that every swap's `from` colour is on its character's sheet and every `to` colour is in the palette, for later characters too.
  - **Fixed on the way:** in a Zain mirror match P2's inner frame cut through his name ("oach Zai"). The cards went from 58 px wide and 62 apart to 60 and 64, and the inner frame stops above the name. A test checks that each name fits inside a picked card's frame.
  - **Zain's overhead (the owner asked for a close look).** Its racket point (97, 53) is 38 px lower than `player-100`'s (79, 15), and 18 px further out. Drawn with the game's own renderer on the same contacts:
    - **The pose:** his arm is bent with the elbow near shoulder height, and the racket stands upright beside his head; the racket's top is about level with his crown (the point itself is 8 px below it). `player-100`'s arm is straight up, with the point 17 px above the crown. So his reads as a high forehand more than an overhead reach. It looks natural, and the wind-up and follow-through flow, but it isn't a big overhead.
    - **Against the ball, in play: closer, not further.** The worry in A8z's entry doesn't hold for the balls actually played. Over 59,421 contacts (180 matches, the reference player against levels 3, 5 and 8, the same contacts on both sheets), the median distance from racket head to ball on the overhead is **16.5 px for Zain, 37.5 px for `player-100`**. At a ball height of y 48–60 his racket is about level with it, 15 px to its side; `player-100`'s is 20–30 px above it. At y 60–70, 19 against 31.
    - **Very high balls are where he falls short.** Overheads in those matches stopped at y 69.6, and 16% were at y 60 or more. A human can press for a ball up to y 84 (2.4 m). Staged in the game at y 70 and 84 he is visibly under it. Worked out from the sheets, with the ball straight above his feet, at y 72 and 84 his racket is 23 and 38 px below it at mid-court and 42 and 65 px at the back; `player-100`'s is within 3 and 10 px at mid-court and 5 and 27 px at the back.
    - **Left as it is:** nothing changed. The owner judges it in play at CP-H. A re-run is 20 credits (96 left).
  - **"The racket meets the ball", checked:** in the same sense as every other character, not literally. The 1% shift the owner picked in S12 leaves a gap on all of them. Median racket-to-ball gap, `player-100` → Zain: serve 37 → 35 px, forehand 42 → 37, backhand 53 → 52, overhead 37.5 → 16.5, dive 27 → 35 (the one that's worse: his dive's racket point is 11 px shorter).
  - **Checked in the browser** (Chrome in the app, `?dev`, real key and touch events): a fresh load with no console messages (read three times, the last after touch and without `?dev`); the select screen with Ronin, Adam, Ben and Coach Zain, Zain from the front; 1P as Zain (black shirt) against Ronin (white kit) played out by a CPU to "ZAIN WINS 9–6", with "Zain" on the panel and "Zain's point" on the wall; a rematch (same picks, same atlases kept, 0–0); 2P with each player's own keys, Adam against Zain as P2 (white shirt); a Zain mirror match played out, named P1 / CPU; each swing's contact frame seen in both kits (serve, forehand, backhand, overhead, dive; the dive in the white kit only); a backhand overhead, staged; touch at 844 × 390 with real touch events (a tap on the CPU rolled it to Zain, a tap on a card picked, Tap to play, the HARD button served). Taller and slimmer: visible beside the others in play and on the select screen. **By tests only:** `kit`'s and `short`'s validation, the fallback order, a broken `front_ready`, the white kit on all 81 frames (no shirt colour left, nothing else changed), that his frame timings equal `player-100`'s. **Not checked:** a real phone; a gamepad.
  - **Memory and loading:** Zain's frames are 150 × 150, but with 81 frames his full atlas is 1232 × 1694, 8.3 MB of canvas against 7.6 (`front_ready`'s 8 frames come along, unused in a match). A Zain mirror match with all eight previews is about 23 MB, against S15's 21. **Download size:** his sheet adds 67 KB (PNG) and 24 KB of JSON (1.2 KB gzipped); the page's files come to about 414 KB as sent.
  - **For the owner (CP-H):** how Zain looks in both kits; the overhead above; the front view next to the back views. Also seen: with touch, the speaker button sits over the right score panel's name, as noted in S15, and "Coach Zain" under the CPU's figure just touches the SOFT button.
  - **Next:** CP-H (play-test 6: the characters).
