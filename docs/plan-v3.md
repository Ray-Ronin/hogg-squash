# Hogg Squash after v2: more characters

Written 2026-11-17 from `CLAUDE.md`, `docs/decisions.md` ("Characters", "After v2") and `docs/plan-v2.md` (its rules, "Finalized characters: shared rules and template", A7z, A8z, S15b and the Session log), with the owner's answers to the planning questions.
v2 is released (CP-J, version 2.0.0). This plan replaces the three recolours with finalized characters that have their own full sheets, as Coach Zain was made. **Ben and Adam were placeholders:** two new characters take their places. **Ronin** comes last: he gets his own sheet or is replaced by a new character too (the owner decides at L3). The plan also gets the game ready for more characters later, and gives all four characters a trophy pose for the champion screen.
`docs/plan-v2.md` stays as the v2 history. Its rules, its art rules and its finalized-character template still apply, with the changes listed below. Read a section of it when a session here points at it.

## Status

Tick a line (`[x]`) when its session or checkpoint is finished. **The next session to run is the first unticked line.**
A line marked `[-]` is on hold: it's skipped and doesn't count as unticked, until the owner brings it back.
Lines marked *(you)* are things the owner does. Lines marked 💳 are SpriteCook spend approvals: the session after it stops and waits for your OK before generating anything.

**Before November 20** *(the 96 subscription credits don't roll over)*
- [x] 💳 Approve SpriteCook spend for A19z *(you)* *(up to 96, the whole balance, approved 2026-11-17)*
- [x] **A19z** Art: Coach Zain's trophy pose, which sets the tag the others follow in A19 *(added 2026-11-17)*

**Ready for more characters**
- [x] **S19** The select screen in two rows past four characters, the "?" card always last (built now, tested with a longer test roster); a saved pick of a character who has left the roster falls back safely
- [ ] **P3** Prerequisites *(you)*: who the two new characters are, their agreement and photos; SpriteCook credits (about 400 per character)

**New character 1: Mr. Sells** *(replaces Ben)*
- [x] **L1** Agree Mr. Sells's look *(you, planning only)* *(2026-11-17; his shirt is still to come, see A13)*
- [x] 💳 Approve SpriteCook spend for A13 (Mr. Sells) *(you)* *(up to 256, approved 2026-11-23)*
- [x] **A13** Art: Mr. Sells's concept, from the back and the front, in both kits *(2026-11-23)*
- [x] 💳 Approve SpriteCook spend for A14 (Mr. Sells) *(you)* *(up to 280, then up to 290 more for the trombone, approved 2026-11-23)*
- [x] **A14** Art: Mr. Sells, every animation and the front-view idle; replaces Ben in the roster *(2026-11-23)*

**New character 2** *(replaces Adam)*
- [ ] **L2** Agree new character 2's look *(you, planning only)*
- [ ] 💳 Approve SpriteCook spend for A15 *(you)*
- [ ] **A15** Art: new character 2's concept
- [ ] 💳 Approve SpriteCook spend for A16 *(you)*
- [ ] **A16** Art: new character 2, every animation; replaces Adam

**Ronin, or his replacement**
- [ ] **L3** Decide: Ronin with his own sheet, or a new character in his place; then agree the look *(you, planning only)*
- [ ] 💳 Approve SpriteCook spend for A17 *(you)*
- [ ] **A17** Art: the concept
- [ ] 💳 Approve SpriteCook spend for A18 *(you)*
- [ ] **A18** Art: every animation; replaces Ronin's recolour

**The trophy and the release**
- [ ] 💳 Approve SpriteCook spend for A19 *(you)*
- [ ] **A19** Art: the trophy pose for the other three characters, matching Zain's (A19z)
- [ ] **S20** The trophy pose on the champion screen; the recolour code's leftovers tidied
- [ ] **CP-K** Play-test 7 and go-live *(you)*: the four characters, version 2.20.0

---

## Rules for every session

The same as `docs/plan-v2.md`, "Rules for every session" and "Art sessions: shared rules", with these changes:
1. **Start:** read `CLAUDE.md`, `docs/decisions.md` and this file, then the `plan-v2.md` sections the session names. Every line above your session must be ticked (or `[-]`). If one isn't, stop and ask.
2. **Version numbers: `2.<session>.<fix>`, carrying on from S18.** S19 is 2.19.0, a fix after it 2.19.1. Art sessions (A13–A19) and planning lines (L1–L3) don't change the version. CP-K's release is S20's version, 2.20.0, or a fix after it. There's no 3.0.0 unless the owner asks for one.
3. **Finalized characters** follow `plan-v2.md`, "Finalized characters: shared rules and template". A13–A18 copy A7z and A8z, and L1–L3 are the template's step 1.
4. **Roster entries.** A new character takes the replaced entry's place in `characters.json` (the same position in the list) with **their own id**: new character 1 where `ben` was, new character 2 where `adam` was. If Ronin stays, he keeps `ronin` and his entry changes from the shared `player-100` sheet (with its skin and hair recolours) to his own sheet. A saved pick or saved tournament that names a removed id falls back safely (S19 makes sure of that). Nothing else in the roster moves.
5. **Order on the select screen:** the roster's order as listed, with the "?" card always last (`decisions.md`, "Characters").
6. **Commit messages and the hand-off** as in `plan-v2.md`. The plan file to name in hand-off prompts is `docs/plan-v3.md`. Every prompt ends with "Ask me before pushing."

| Suggested effort | Sessions |
|---|---|
| `medium` | S19, S20: small changes to settled screens |
| `medium` | A13–A19: art driven by the shared rules and the template |
| `low` | L1–L3, CP-K planning: interviews and plan edits |

---

## Decisions made while writing this plan (2026-11-17)

The owner's answers (also in `docs/decisions.md`, "Characters (v3)"):
- **Four characters for now:** Coach Zain stays as he is. **Ben and Adam were placeholders** and are replaced by two new characters. **Ronin may be replaced too**, so he comes last (L3 decides). More characters can be added later.
- **Full sheets,** not recolours: each of the three gets a concept session and an animation session, as Coach Zain did.
- **The select screen:** one row of cards while there are four characters. **With five or more it becomes two rows,** and the "?" random card is **always last**.

Settled by the plan (say so if you disagree):
- **The new characters come first, Ronin last,** so the decision about him can wait until two finalized characters are in the game.
- **Real people, with their agreement.** Anyone drawn from photos has agreed first (P3, and L3 for Ronin or his replacement). Their photos stay outside the repo in `C:\Hogg Squash\Character References\<id>\`, as Coach Zain's do. An invented character (no photos) is fine too.
- **The two-row screen is built now (S19),** before any fifth character exists, and tested with a longer test roster. That way a later character is still art plus one roster entry, with no game code. With four characters the screen looks as it does today.
- **The palette goes up from 48 colours to 64.** The palette has about 47 colours with Coach Zain, so three new faces, hair colours and perhaps shirts won't fit in 48. Sixty-four keeps one shared palette and leaves room for later characters. Each character's own shirt and print still get palette entries used nowhere else on its sprite, so its P2 / CPU kit swap works.
- **Their kits:** each character wears the Hogg red-and-black kit (the standard swap, no `kit` entry) unless L1–L3 agree on their own shirt, as Coach Zain has.
- **The trophy pose:** Coach Zain's first (A19z, before November 20's reset, with the expiring credits), setting the tag; the other three together at the end (A19), matching his. S20 then shows it on the champion screen.
- **SpriteCook credits:** **96** on 2026-11-17; the subscription adds **800 on November 20** (and monthly after), and the owner is willing to buy more. Coach Zain cost 392: his concept 192 and his animations 200, with no re-runs. Three characters at about 400 each plus room for re-runs, and the trophy pose for four (about 100–160), comes to **about 1,300–1,400**. November's 800 covers about two characters, so a top-up of about 500 (or December's 800) is needed for the third and the trophy pose. Each 💳 line gets its own price first.
- **Not in this plan:** music and the crowd (still on hold from `plan-v2.md`), stat differences between characters (looks only, as before), new courts, voice callouts.

---

## A19z: Art: Coach Zain's trophy pose *(added 2026-11-17)*

**Why now:** the account's 96 subscription credits expire when the subscription resets on November 20 (the owner's understanding), and Zain is the only character whose sheet and concepts exist. This changes the S18 call ("one session for all of them together"): Zain's pose comes first and **sets the tag** that A19 follows for the other three. The owner accepted the small risk that his pose looks a little different from theirs.

**In scope**
- **Spend gate:** approved up to **96** (the whole balance). Still list the planned jobs with estimated credits first and stop for the owner's go. One `animate_game_art` job is about 20 credits by A8z's prices, so this leaves room for re-runs.
- **Settle the tag first** and write it into `docs/art-style-guide.md` §3 as optional: suggested `trophy`, from the front, 8 frames, looping, the same `feet` pivot. Zain holds A12's gold trophy (`assets/tournament.png`, `trophy`) up in both hands, a small happy bob.
- **Source:** Zain's front concept (`f5b47d79-0fad-4680-8868-d09f2f6124a5`, cleaned at 90% width as in A8z) or his cleaned `front_ready` frame, with a crop of our own trophy art as a reference (uploaded via the `spritecook-upload-assets` flow; it's our own art, so the IP rules allow it). If animating doesn't give him the trophy, a still `generate_game_art` edit of the front concept holding it, then animating that, is fine within the budget.
- **Clean in Aseprite** to the tag: about 106 px head to soles, feet on the `feet` slice, locked to the palette, the trophy's gold from the palette entries the trophy art already uses, the shirt and print colours only in their own entries (so the white kit's swap still works). Add the tag to `art/character/zain.aseprite` and re-export `zain-100.png` + `.json`.
- **Previews:** `art/mockups/a19z-trophy.png` and a GIF, in both kits, beside the trophy as drawn on the champion screen.
- The manifest (asset IDs, prompts, credits) and the "Characters" table.

**Not in scope:** game code (S20 shows the tag), the other characters (A19).

**Done when…** the owner has approved the pose in both kits; the sheet still passes `sheetProblems` in Node and has the new tag; `npm test` passes; the manifest shows the credits within the 96. The game is unchanged until S20 (an extra tag is ignored; check there are no console warnings).

**Starter prompt**
```text
We're doing Session A19z of docs/plan-v3.md: "Art: Coach Zain's trophy pose". The 96 SpriteCook credits expire on November 20, so this runs before then.
Read CLAUDE.md, docs/decisions.md ("Characters", "Tournament": the look), docs/art-style-guide.md (§3, §4, "Characters"), docs/plan-v3.md (rules, decisions, A19z) and plan-v2.md ("Art sessions: shared rules", "Finalized characters", A8z and its Session log entry, A12).
Spend is approved up to 96 credits. First check my SpriteCook balance and list the planned jobs with estimated credits, then STOP and wait for my go before generating anything.
No game code changes. Never use ROM/MAME/Gaelco images as references. Finish with "Done when", tick A19z, add a Session log entry, and commit. Ask me before pushing.
```

---

## S19: The select screen ready for more characters

**Goal:** the characters screens (single match and tournament) work for any number of characters. With up to four characters there's one row of cards, as now. With five or more there are two rows. The "?" card is always last.

**In scope**
- **Layout** (`js/ui/select.js`, `SELECT_LAYOUT`, `cardX`):
  - up to five cards (four characters plus "?") stay in one row, exactly as now;
  - six or more go in two rows, the first row full and the second centred, with the "?" card last in the second row;
  - the cards stay clear of both big figures. If two rows at the current card size don't fit, smaller cards in two rows are fine (say which).
- **Moves:** left / right through the cards in order, wrapping as now. Up / down moves between the rows to the nearest card, and P2 and the gamepad use the same moves. Touch taps hit the right card. The CPU's up / down roll still never lands on "?".
- **The tournament's characters screen:** its slots cycle through the roster then "?", as now. Check it with the longer roster too.
- **A removed character:** Ben and Adam will leave the roster (A14, A16), and Ronin may. A saved single-match pick whose id is gone falls back (as Will's did when Coach Zain replaced him in S15b: check it still does). A saved tournament whose entrants include a gone id must still load, play and show a name and a figure for that entrant: it gets the character now in that roster position, or a random one (say which), never a blank or a crash. A saved CPU pick the same.
- **Tests** (`test/screens.test.js`, `test/tournament.test.js` or `test/roster.test.js`): a test roster of 4, 5, 6, 8 and 9 characters. The cards fit and don't overlap each other or the big figures. "?" is last. The moves reach every card. The tap hit areas match the cards. The real four-character roster draws exactly as before. A saved pick and a saved tournament naming `ben` against a roster without him.
- **Docs:** `decisions.md` ("Characters", as built), `CLAUDE.md`'s status line.

**Not in scope:** new art, the roster's real entries, anything in `js/sim/`.

**Main files:** `js/ui/select.js`, `js/ui/screens.js` (if the moves live there), `test/screens.test.js`, `docs/decisions.md`, `CLAUDE.md`.

**Done when…**
- `npm test` and `npm run typecheck` pass.
- In the browser, with the real roster: the screen is unchanged in 1P, 2P and the tournament, by keys, pad and touch.
- In the browser, with a longer test roster (a `?dev` way to load one, or a temporary local edit that isn't committed): the two rows, "?" last, every move and tap.
- Version 2.19.0.

**Starter prompt**
```text
We're doing Session S19 of docs/plan-v3.md: "The select screen ready for more characters".
Read CLAUDE.md, docs/decisions.md (Screens, Characters) and docs/plan-v3.md (rules, decisions, S19), then plan-v2.md's rules. This is the first session of plan-v3; CP-J in plan-v2.md is ticked.
Build S19's "In scope" list only. Nothing in js/sim/ changes.
Go through "Done when", tick S19, add a Session log entry, and commit. Ask me before pushing.
```

---

## P3: Prerequisites *(you)*

- **Who:** the two new characters (real people who agree, or invented ones). Ronin's decision can wait until L3.
- **Photos** for anyone real, in `C:\Hogg Squash\Character References\<id>\` (a short lowercase id, such as `zain`): the face (front and side if you can), the whole body, and the shirt's front and back if they get their own. Coach Zain's folder shows what worked.
- **SpriteCook:** about 400 credits per character. November 20's 800 covers A13–A16; the third character and the trophy pose need a top-up of about 500 or December's credits.

---

## L1, L2, L3: Agree each character's look *(you, planning only)*

The template's step 1 (`plan-v2.md`, "Finalized characters"), one character at a time, before that character's concept. No credits. **L3 starts with the owner's call:** Ronin with his own sheet (keeps `ronin`), or a new character in his place (a new id).
- Who they are, and their id. The name for the select screen, plus a `short` one if it's wider than the 62 px name slot. That they have agreed (if real).
- Their body (height about 94–108 px head to soles against the standard 100, and their build), skin and hair.
- Their kit: the Hogg red and black (the standard swap), or their own shirt and its P2 / CPU version.
- Which photos to use.
- Then write the agreed look into the character's concept session below ("Agreed with the owner"), as A7z did.

**Starter prompt** (planning-only session; swap the name)
```text
Planning only: change no files except docs/plan-v3.md and docs/decisions.md.
We're doing L1 of docs/plan-v3.md: "Agree new character 1's look". Read docs/plan-v3.md and plan-v2.md's "Finalized characters" and A7z.
The photos are in C:\Hogg Squash\Character References\<id>\ (look at them; never commit them).
Ask me the template's step-1 questions, write the answers into A13's "Agreed with the owner" (and the character's name into the Status lines), tick L1, and commit. Ask me before pushing.
```

---

## A13 / A15 / A17: Art: the character's concept

**Goal:** the character's look, approved from the back and the front in both kits, so the next session can animate them.

**Agreed with the owner:** *(filled in by L1 / L2 / L3)*

**A13, Mr. Sells (L1, 2026-11-17)**
- **Who:** David Sells, a real person who has agreed to be in the game. Id: `sells` (the plan's pick; the owner can change it before A13). His photos go in `C:\Hogg Squash\Character References\sells\`, outside the repo.
- **Name:** "Mr. Sells" everywhere, with no short name (the owner's call: it's shorter than "Coach Zain"). Coach Zain's full name shows on the select screen, but the score panel's 62 px slot uses his short "Zain". So A13 measures "Mr. Sells" in `large-white`; if it's wider than 62 px, ask the owner for a short name before A14 adds the roster entry. **A13 (2026-11-23):** it's 80 px, so the owner picked the short name **"Sells"** (48 px) for the score panel; A14's entry is `{ "id": "sells", "name": "Mr. Sells", "short": "Sells", "sheet": "sells-100", "kit": [...] }`.
- **Body:** a little shorter than the others, about 96 px head to soles (they are 100). Heavy build: a round belly, a broad torso, thicker arms and legs.
- **Skin and hair** (from the owner's photo): fair skin. Short brown hair going grey, a little longer on top and swept to the side. A short full beard and moustache, brown going grey. Rectangular glasses with dark frames.
- **Kit (A13, 2026-11-23, the owner's pick from the Hogg PTA spirit store):** the Hogg Middle School spirit T-shirt, a plain crew-neck tee. **P1 wears the red one, P2 / CPU the black one** (the same shirt in its two store colours, so a mirror match is easy to tell apart). Black shorts, white socks and white shoes, as the standard kit.
  - **Front** (from the store photo): centred on the chest, the red razorback standing side-on, the word HOGG under it in red slanted block capitals with a white and black outline, and MIDDLE SCHOOL in small white capitals under that. The print is the same on both colours.
  - **Back** (no photo; designed in A13, the owner's call): SELLS in white block capitals with a thin black outline across the shoulders, and under it, between the shoulder blades, a small red razorback head like the front's, outlined in white. Kept simple so it reads at the 100 px scale, and different from Coach Zain's vertical SQUASH.
  - **Palette:** the shirt red is its own entry (not the kit red `#e8202a`), and the print's reds and white are their own entries, so the P2 swap turns only the shirt's reds into black and dark greys and leaves the print alone. The `kit` swap is written down in A13 for A14's roster entry.
- **Photos to use:** the shirts' front (`shirts-front.png` in the `sells` folder, from the store). No face photo yet, so the face is drawn from the written description above; if one arrives later, it can be used for a re-run.
- **Replaces:** Ben, so the roster becomes Ronin, Adam, Mr. Sells, Coach Zain.
- **Before A13 starts:** settled in A13 (2026-11-23): the shirt above, no face photo for now.

**In scope:** as `plan-v2.md`'s A7z, for this character:
- **Spend gate:** check the balance, list the generations with model, quality and estimated credits (reference images are billed once per variation), then stop for the owner's OK.
- Upload the photos (the `spritecook-upload-assets` flow), make the back concept (style reference: A1 concept 4, `db1eb2a8-7816-44de-b78a-ee5810bd5790`, plus Coach Zain's picked back concept, `e60bd106-76db-4638-a31d-d397282be092`, so the four match), then the front view.
- Clean both in Aseprite to a ready frame at the 100 px scale, locked to the palette (now up to 64; add new entries to `art/palette/hogg-squash.gpl`). Write down the planned `kit` swap if they have their own shirt.
- Previews (`art/mockups/a13-*.png` etc.): the character beside Coach Zain on the court, back and front, in both kits, plus a close-up of any shirt print.
- The manifest and `docs/art-style-guide.md`'s "Characters" table.

**Not in scope:** animations, game code, the roster file.

**Done when…** the owner has approved the look in both kits; the manifest shows the credits within the approved amount; `npm test` still passes.

**Starter prompt** (swap the session, name and folder)
```text
We're doing Session A13 of docs/plan-v3.md: "Art: <name>'s concept".
Read CLAUDE.md, docs/decisions.md ("Characters"), docs/art-style-guide.md, docs/plan-v3.md (rules, decisions, A13) and plan-v2.md ("Art sessions: shared rules", "Finalized characters", A7z and its Session log entry). Check L1 is ticked.
The reference photos are in C:\Hogg Squash\Character References\<id>\ (never commit them).
First check my SpriteCook balance and list the planned generations with estimated credits, then STOP and wait for my OK before generating anything.
No game code changes. Finish with "Done when", tick A13, add a Session log entry, and commit. Ask me before pushing.
```

---

## A14 / A16 / A18: Art: the character, every animation

**Goal:** the character's full sheet and front idle, in the game in their recolour's place.

**In scope:** as `plan-v2.md`'s A8z, for this character:
- **Spend gate** as above: 10 animations (the nine contract tags plus `front_ready`) at about 20 credits each, plus up to 4 re-runs.
- Animate the picked back and front concepts, and clean to the sheet contract (the same height in every frame, `feet` lined up, contact frames, `racket <tag>` slices, the overhead inside the frame, any shirt colours only in their own entries).
- Export `public/hogg-squash/assets/<id>-100.png` + `.json`.
- **The roster** (art sessions may edit it): the new character's entry, with their own id and `"sheet": "<id>-100"` (plus `kit` and `short` if needed), goes where the replaced entry was (A14: Ben's place, A16: Adam's). If Ronin stays (A18), his entry keeps `ronin`, changes to his own sheet and drops its skin and hair recolours.
- Check them in the game: a match in each kit, the select screen from the front, a mirror match, and a saved pick of the replaced character falling back (S19). No console warnings.
- Previews (`art/mockups/a14-*` etc.): a strip and GIFs per tag in both kits.

**Not in scope:** game code (if the game needs a change to show them, stop and ask), the trophy pose (A19).

**Done when…** the owner has approved every animation and the front idle in both kits; the sheet passes `sheetProblems` in Node; the roster entry is in, in the replaced entry's place; `npm test` passes; the manifest shows the credits within the approved amount.

**Starter prompt** (swap the session, name and concept session)
```text
We're doing Session A14 of docs/plan-v3.md: "Art: <name>, every animation".
Read CLAUDE.md, docs/decisions.md ("Characters"), docs/art-style-guide.md (§3, §4, "Characters"), docs/plan-v3.md (rules, A13's Session log entry, A14) and plan-v2.md ("Art sessions: shared rules", "Finalized characters", A8z and its Session log entry). Check A13 is ticked.
First check my SpriteCook balance and list the planned generations with estimated credits, then STOP and wait for my OK before generating anything.
No game code changes (the roster entry is allowed). Finish with "Done when", tick A14, add a Session log entry, and commit. Ask me before pushing.
```

---

## A19: Art: the trophy pose for the other three characters

**Goal:** the other three characters each holding A12's gold trophy, matching Zain's pose from A19z (`assets/tournament.png`, `trophy`), for the champion screen.

**In scope**
- **Spend gate** as above: one animation per character, with the trophy and Zain's A19z pose as references. Use the tag A19z settled (its name, frames and pivot).
- Clean each to that tag in its own sheet, with the trophy's colours from the palette. Re-export the three sheets.
- Previews: all four together, with Zain's from A19z, in both kits (`art/mockups/a19-trophy.png`).

**Not in scope:** game code (S20 uses the tag).

**Done when…** the owner has approved the four poses; every sheet still passes `sheetProblems`; `npm test` passes; the manifest is up to date.

**Starter prompt**
```text
We're doing Session A19 of docs/plan-v3.md: "Art: the trophy pose for the other three characters".
Read CLAUDE.md, docs/decisions.md ("Characters", "Tournament": the look), docs/art-style-guide.md (§3, "Characters"), docs/plan-v3.md (rules, the A19z and A14/A16/A18 Session log entries, A19) and plan-v2.md ("Art sessions: shared rules", A12).
First check my SpriteCook balance and list the planned generations with estimated credits, then STOP and wait for my OK before generating anything.
No game code changes. Finish with "Done when", tick A19, add a Session log entry, and commit. Ask me before pushing.
```

---

## S20: The trophy pose on the champion screen

**Goal:** a champion whose sheet has the trophy tag holds the trophy on the champion screen. One without it stands beside the trophy, as now.

**In scope**
- `js/ui/tournament.js`'s champion screen plays the tag when the sheet has it, in the champion's kit (a bot champion in the white kit).
- The sheet contract: the tag is optional and checked like `front_ready` (`js/render/roster.js`).
- **Tidy:** with no recolours left in the roster, keep the skin and hair recolour support (a later character might use it) but make sure its tests still cover it with a test entry. Remove nothing a test or `decisions.md` still relies on.
- Tests: the optional tag (present, missing, broken), and the champion screen for a character with and without it.
- Docs: `decisions.md` ("Tournament", "Characters", as built), `docs/art-style-guide.md`, `README.md`'s characters line, `CLAUDE.md`'s status line.

**Done when…** `npm test` and `npm run typecheck` pass; in the browser, a tournament won by each character (or a dev shortcut to the champion screen) shows the pose in both kits; no console messages; version 2.20.0.

**Starter prompt**
```text
We're doing Session S20 of docs/plan-v3.md: "The trophy pose on the champion screen".
Read CLAUDE.md, docs/decisions.md (Tournament, Characters), docs/art-style-guide.md (§3) and docs/plan-v3.md (rules, A19's Session log entry, S20). Check A19 is ticked.
Build S20's "In scope" list only. Nothing in js/sim/ changes.
Go through "Done when", tick S20, add a Session log entry, and commit. Ask me before pushing.
```

---

## CP-K: Play-test 7 and go-live *(you)*

1. Play a match as each of the four characters, 1P and 2P, on a computer and a phone. Can you tell them apart at the front and back of the court, in both kits? Does each look like themselves?
2. The select screen: four characters from the front, the "?" card last.
3. A tournament to the champion: the trophy pose.
4. Anything to fix becomes a small fix-up session, and this checkpoint is replayed after it. When nothing is left: approve the push and check https://roninray.com/hogg-squash/ in a private window.
5. What comes next: a fifth character (the template plus one roster entry, with the two-row screen ready), music or the crowd (on hold), or stop here.

**Starter prompt** (planning-only session)
```text
Planning only: change no files except docs/plan-v3.md, docs/decisions.md, the version (js/version.js, package.json) and CLAUDE.md's status line.
Read docs/plan-v3.md and its Session log. My CP-K feedback: <notes>.
If there's something to fix, add a fix-up session and don't tick CP-K. If not, tick CP-K and commit. Ask me before pushing.
```

---

## Session log

Each session adds a few lines here: date, what changed, numbers measured, anything left for later. The v2 history is in `docs/plan-v2.md`'s Session log.

- 2026-11-17, planning: wrote this plan after v2 (2.0.0). The owner's answers: four characters for now, with Ronin, Ben and Adam made into finalized characters with full sheets in that order (more can come later); one row on the select screen at four, two rows past that, the "?" card always last.
  - **SpriteCook:** 96 credits (checked 2026-11-17, apprentice tier, active). Coach Zain cost 392 (concept 192, animations 200). The plan needs about 1,300–1,400, so a top-up of about 1,300 is needed before A13.
  - **Settled by the plan (say if you disagree):** the palette cap goes from 48 to 64; the two-row screen is built first (S19) with a test roster; the ids stay `ronin`, `ben`, `adam`; the trophy pose is made for all four at the end (A19) and shown in S20; versions `2.<session>.<fix>`, with CP-K releasing 2.20.0.
  - **Next:** S19 (needs no credits). P3 (agreement, photos and the top-up) can be done alongside it.
- 2026-11-17, planning (the same day, the owner's correction): **Ben and Adam were placeholders** and are replaced by two new characters (who they are is P3's), and **Ronin may be replaced too**. The order is now new character 1 (Ben's place), new character 2 (Adam's place), then Ronin or his replacement (L3 decides). New characters get their own ids in the replaced entry's place, and S19 also makes a saved pick or tournament naming a removed id fall back safely. Credits: the subscription adds 800 on November 20 (the owner may buy more); that covers the two new characters, and about 500 more (or December's 800) covers the third and the trophy pose.
- 2026-11-17, planning: the owner thinks the 96 subscription credits don't roll over at the November 20 reset, so they go on **Coach Zain's trophy pose** now (A19z, approved up to 96), ahead of S19. It sets the trophy tag the other three follow in A19, which changes S18's call to make all the poses in one session; the owner accepted the small risk of a mismatch.
  - **Next:** A19z (before November 20), then S19.
- 2026-11-17, A19z: **Coach Zain's trophy pose** is in his sheet as the optional `trophy` tag (frames 81–88: front view, 8 × 125 ms, looping, the `feet` pivot), approved by the owner in both kits. The tag is written into the style guide §3; A19 follows it.
  - **Credits:** 68 of the 96 (a still edit of his front concept holding our A12 trophy, 48; the animation, 20; no re-runs), so 28 are left before the reset. Prompts, asset IDs and hashes are in the manifest.
  - **Cleanup** (in `a8z-build.lua`, so his whole sheet still comes from one script): the generator kept reshaping the trophy, so frame 1's trophy and hands are stamped into all eight frames; a red-and-white wristband it drew was recoloured to skin; the shirt print is placed from the chest, not the sprite's top (which is now the trophy), so the white kit's swap works. Frames 0–80 are unchanged. `sheetProblems` finds nothing, `npm test` passes, and the game loads with no console messages.
  - **For later:** the held trophy is about 31 px tall against the 84 px standing one, and is the generator's cup (no handles, the plate a red smudge), not A12's exact drawing. Whether the champion screen still shows the standing trophy beside a champion holding one is S20's call. At the top of the bob the trophy reaches the frame's top edge (nothing cut).
  - **Lessons for A19:** the animator wants a square-ish source of 256 px or less, so pad the still (200×200 here); an edit can't take a reference image, so pass the trophy as a style image instead.
  - **Next:** S19.
- 2026-11-17, S19 (2.19.0): **the characters screens are ready for more characters.** Up to five cards (four characters and "?") stay one row, exactly as before (a test checks every card's spot against S18b's). Six or more are two rows at the **same card size**, the first full (five), the second centred, "?" last; past ten cards the rows narrow to fit (tests only). The layout moved to a new `js/ui/cards.js` so `screens.js` stays free of drawing code.
  - **Moves:** with two rows, up / down go to the nearest card in the other row, for each side's own keys. **In 1P, up / down with no row that way roll the CPU** (with one row: always, as before); its hint becomes "Up at the top: another" with two rows. Taps hit the right card in either row.
  - **A removed character:** a saved single-match or CPU pick falls back as Will's did (first / second). A saved tournament's entrant whose id has gone gets a **random** roster character, chosen from the tournament's seed and the entrant so it's the same on every load (written into the save with the next result); its name and figure show on every screen.
  - **Tests:** 7 new (213 unit tests in all): layouts of 4, 5, 6, 8 and 9 characters (no overlaps, clear of both figures and the lines under them, "?" last), the drawn tap areas against the layout, left / right / up / down reaching every card, the 1P roll, a saved pick and a saved tournament naming `ben` without him, and the test roster.
  - **Checked in the browser** (`?roster=9`, `?drop=ben`): the real roster unchanged in 1P and 2P; with nine, the two rows, "?" last, P1's and P2's keys between the rows, a tap on a second-row card and on "?" (synthetic touches), the tournament's characters screen cycling through all nine then "?"; the owner's saved 8-player tournament (it names Ben) loaded with `?drop=ben` showed Ronin in Ben's place on the bracket (and the save was put back as it was). No console messages. **Not checked:** a real gamepad (it sends the same moves as the keys) or a real phone.
  - **For later:** each extra character adds its select-screen previews (about 0.76 MB of canvas per kit), so nine characters' screen holds about 14 MB of previews against four's 6.
  - **Next:** P3 (the owner's prerequisites), then L1.
- 2026-11-23, A13: **Mr. Sells's concept**, from the back and the front, approved by the owner in both kits. `art/character/sells.aseprite` (frame 1 `ready`, frame 2 `front_ready`, 150 × 150, the `feet` pivot at 73, 148), built by `art/tools/a13-build.lua`; previews `art/mockups/a13-sells.png` (beside Coach Zain on the court) and `a13-print.png`.
  - **His shirt (the owner's calls):** first "keep it simple" (the standard red kit), then the owner sent the Hogg Middle School spirit tee from the PTA spirit store in its two colours (the store page needs a login, so the owner sent the picture): **red for P1, black for P2 / CPU**, the store's front print, and a back designed here (SELLS across the shoulders over a small boar's head). No face photo: the face is drawn from L1's description (glasses, greying hair and beard).
  - **Credits:** 192 of the 256 approved (back round 4 variations, 128; front round 2, 64; the spare re-run wasn't needed). Account: 828 before, 636 after. Prompts, asset IDs and hashes are in the manifest.
  - **Cleanup:** 96 px head to soles; the cleaner picks only skin 4–7 (fair); the tee's reds moved into three new palette entries (`shirt red shade`, `shirt red`, `shirt red light`, 50 of 64), so the P2 swap turns only the tee black and the print, which uses the standard reds and white, stays. Both prints redrawn by hand at sprite size. `npm test` passes.
  - **For A14:** the `kit` swap is `[["#960e1e", "#252429"], ["#d21a28", "#3a3940"], ["#f04842", "#5a5962"]]`. "Mr. Sells" is 80 px in `large-white`, so the owner picked the short name **"Sells"** (48 px). From the back his hair reads mostly dark grey, a little like a cap; fine for now (the owner approved it).
  - **Next:** 💳 approve A14's spend, then A14 (about 320; 636 on the account).
- 2026-11-23, A14: **Mr. Sells's full sheet, with a trombone**, approved by the owner in both kits, and **in the roster in Ben's place** (`{ "id": "sells", "name": "Mr. Sells", "short": "Sells", "sheet": "sells-100", "kit": [...] }`, A13's swap). The roster is now Ronin, Adam, Mr. Sells, Coach Zain. No game code changed; the version stays 2.19.0.
  - **The trombone (the owner's call):** the ten animations were first made with a racket and cleaned into a sheet; the owner then asked for his racket to be a trombone. So two still edits gave him one (the back's pasted onto A13's back concept, as the edit had drawn him a red collar band), and all ten animations were made again from those. He swings the trombone like a racket; the `racket <tag>` slices are on its centre. Its brass uses A12's trophy gold, so the palette is unchanged (50 of 64).
  - **Credits:** 464 (the racket round 200 of the 280 approved; the trombone 264 of the 290 approved: the stills 64, the animations 200; no re-runs). The two edits cost 32 each, not the 16 priced for the back, because the edited image is billed as a reference. Account: 636 before, 172 after. Prompts, asset IDs and hashes are in the manifest.
  - **Built:** `art/tools/a14-build.lua` → `art/character/sells.aseprite` (A13's two concept frames replaced), exported by `art/tools/a14-export.sh` to `public/hogg-squash/assets/sells-100.png` + `.json`: 81 frames of 150 × 150, the nine contract tags plus `front_ready`, the `feet` pivot at 73, 148, 96 px head to soles. Racket points: serve 96, 51; forehand 115, 58; backhand 25, 72; overhead 74, 45; dive 112, 119.
  - **Cleanup:** the tee is the big red patches, moved into its own three entries; A13's prints are stamped afresh at the tee's top centre in every frame but the dive's. The animator puts each file in about 22 colours and draws most of the brass in his skin's colours, so the trombone is found from the one dark brass brown each file has only on it (a skin-like pixel counts when there is brass on both sides of it, as a tube's middle between its edges; in the front view only left of his chest), then put on the gold ramp by brightness. The forehand's own contact frame smears the trombone into two thin lines, so its contact is `backhand.png` 9.
  - **Checks:** `sheetProblems` finds nothing; `npm test` passes (213 unit tests; `test/roster.test.js` now expects Mr. Sells where it expected Ben: test data only); `npm run typecheck` passes. In the browser: the select screen with Mr. Sells from the front in both kits, a mirror match (P1's red tee, P2's black, P1 / P2 on the panels), the serve and a swing in play; no console messages. **Not checked in the browser:** a saved tournament naming Ben (S19's tests cover it against the real roster, and pass); single-match picks aren't kept between visits.
  - **For later:** the trombone is thin at the back of the court and the generator's brass is rough in places (the swings smear it); the front-view face is the generator's darker skin shading, a little more orange than A13's concept. The animations with a racket are kept in `art/spritecook/a14/` (not used).
  - **Next:** L2 (new character 2's look).
