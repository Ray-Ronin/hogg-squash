# Hogg Squash after v2: more characters

Written 2026-11-17 from `CLAUDE.md`, `docs/decisions.md` ("Characters", "After v2") and `docs/plan-v2.md` (its rules, "Finalized characters: shared rules and template", A7z, A8z, S15b and the Session log), with the owner's answers to the planning questions.
v2 is released (CP-J, version 2.0.0). This plan turns the three recolours, **Ronin, Ben and Adam**, into finalized characters with their own full sheets, as Coach Zain was made. It also gets the game ready for more characters later, and gives all four characters a trophy pose for the champion screen.
`docs/plan-v2.md` stays as the v2 history. Its rules, its art rules and its finalized-character template still apply, with the changes listed below. Read a section of it when a session here points at it.

## Status

Tick a line (`[x]`) when its session or checkpoint is finished. **The next session to run is the first unticked line.**
A line marked `[-]` is on hold: it's skipped and doesn't count as unticked, until the owner brings it back.
Lines marked *(you)* are things the owner does. Lines marked 💳 are SpriteCook spend approvals: the session after it stops and waits for your OK before generating anything.

**Ready for more characters**
- [ ] **S19** The select screen in two rows past four characters, the "?" card always last (built now, tested with a longer test roster)
- [ ] **P3** Prerequisites *(you)*: Ronin's, Ben's and Adam's agreement and photos; a SpriteCook top-up (about 1,300 credits)

**Ronin**
- [ ] **L1** Agree Ronin's look *(you, planning only)*
- [ ] 💳 Approve SpriteCook spend for A13 *(you)*
- [ ] **A13** Art: Ronin's concept, from the back and the front, in both kits
- [ ] 💳 Approve SpriteCook spend for A14 *(you)*
- [ ] **A14** Art: Ronin, every animation and the front-view idle; he replaces his recolour in the roster

**Ben**
- [ ] **L2** Agree Ben's look *(you, planning only)*
- [ ] 💳 Approve SpriteCook spend for A15 *(you)*
- [ ] **A15** Art: Ben's concept
- [ ] 💳 Approve SpriteCook spend for A16 *(you)*
- [ ] **A16** Art: Ben, every animation; he replaces his recolour

**Adam**
- [ ] **L3** Agree Adam's look *(you, planning only)*
- [ ] 💳 Approve SpriteCook spend for A17 *(you)*
- [ ] **A17** Art: Adam's concept
- [ ] 💳 Approve SpriteCook spend for A18 *(you)*
- [ ] **A18** Art: Adam, every animation; he replaces his recolour

**The trophy and the release**
- [ ] 💳 Approve SpriteCook spend for A19 *(you)*
- [ ] **A19** Art: the trophy pose for all four characters
- [ ] **S20** The trophy pose on the champion screen; the recolour code's leftovers tidied
- [ ] **CP-K** Play-test 7 and go-live *(you)*: the four characters, version 2.20.0

---

## Rules for every session

The same as `docs/plan-v2.md`, "Rules for every session" and "Art sessions: shared rules", with these changes:
1. **Start:** read `CLAUDE.md`, `docs/decisions.md` and this file, then the `plan-v2.md` sections the session names. Every line above your session must be ticked (or `[-]`). If one isn't, stop and ask.
2. **Version numbers: `2.<session>.<fix>`, carrying on from S18.** S19 is 2.19.0, a fix after it 2.19.1. Art sessions (A13–A19) and planning lines (L1–L3) don't change the version. CP-K's release is S20's version, 2.20.0, or a fix after it. There's no 3.0.0 unless the owner asks for one.
3. **Finalized characters** follow `plan-v2.md`, "Finalized characters: shared rules and template". A13–A18 copy A7z and A8z, and L1–L3 are the template's step 1.
4. **Keep the ids.** Ronin, Ben and Adam keep `ronin`, `ben` and `adam` in `characters.json`, so saved settings and saved tournaments still find them. Each animation session swaps its character's entry from the shared `player-100` sheet (with its skin and hair recolours) to its own sheet. Nothing else in the roster moves.
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
- **Four characters for now:** Coach Zain stays as he is, and **Ronin, Ben and Adam** get their own full sheets in their recolours' places, in that order. More characters can be added later.
- **Full sheets,** not recolours: each of the three gets a concept session and an animation session, as Coach Zain did.
- **The select screen:** one row of cards while there are four characters. **With five or more it becomes two rows,** and the "?" random card is **always last**.

Settled by the plan (say so if you disagree):
- **Real people, with their agreement.** Ronin, Ben and Adam are drawn from photos only once each has agreed (P3). Their photos stay outside the repo in `C:\Hogg Squash\Character References\<id>\`, as Coach Zain's do.
- **The two-row screen is built now (S19),** before any fifth character exists, and tested with a longer test roster. That way a later character is still art plus one roster entry, with no game code. With four characters the screen looks as it does today.
- **The palette goes up from 48 colours to 64.** The palette has about 47 colours with Coach Zain, so three new faces, hair colours and perhaps shirts won't fit in 48. Sixty-four keeps one shared palette and leaves room for later characters. Each character's own shirt and print still get palette entries used nowhere else on its sprite, so its P2 / CPU kit swap works.
- **Their kits:** each character wears the Hogg red-and-black kit (the standard swap, no `kit` entry) unless L1–L3 agree on their own shirt, as Coach Zain has.
- **The trophy pose comes last (A19),** in one session for all four characters, as `plan-v2.md` (A12, S18) said. S20 then shows it on the champion screen.
- **SpriteCook credits:** **96** on 2026-11-17. Coach Zain cost 392: his concept 192 and his animations 200, with no re-runs. Three characters at about 400 each plus room for re-runs, and the trophy pose for four (about 100–160), comes to **about 1,300–1,400**. That means **a top-up of about 1,300 before A13** (P3). Each 💳 line gets its own price first.
- **Not in this plan:** music and the crowd (still on hold from `plan-v2.md`), stat differences between characters (looks only, as before), new courts, voice callouts.

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
- **Tests** (`test/screens.test.js`): a test roster of 4, 5, 6, 8 and 9 characters. The cards fit and don't overlap each other or the big figures. "?" is last. The moves reach every card. The tap hit areas match the cards. The real four-character roster draws exactly as before.
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

- **Agreement:** Ronin, Ben and Adam each agree to be in the game, drawn from their photos.
- **Photos** in `C:\Hogg Squash\Character References\ronin\`, `\ben\` and `\adam\`: the face (front and side if you can), the whole body, and the shirt's front and back if they get their own. Coach Zain's folder shows what worked.
- **SpriteCook:** top up about 1,300 credits (96 now). A13 alone needs about 190.

---

## L1, L2, L3: Agree each character's look *(you, planning only)*

The template's step 1 (`plan-v2.md`, "Finalized characters"), one character at a time, before that character's concept. No credits.
- Who they are. The name for the select screen, plus a `short` one if it's wider than the 62 px name slot. That they have agreed.
- Their body (height about 94–108 px head to soles against the standard 100, and their build), skin and hair.
- Their kit: the Hogg red and black (the standard swap), or their own shirt and its P2 / CPU version.
- Which photos to use.
- Then write the agreed look into the character's concept session below ("Agreed with the owner"), as A7z did.

**Starter prompt** (planning-only session; swap the name)
```text
Planning only: change no files except docs/plan-v3.md and docs/decisions.md.
We're doing L1 of docs/plan-v3.md: "Agree Ronin's look". Read docs/plan-v3.md and plan-v2.md's "Finalized characters" and A7z.
The photos are in C:\Hogg Squash\Character References\ronin\ (look at them; never commit them).
Ask me the template's step-1 questions, write the answers into A13's "Agreed with the owner", tick L1, and commit. Ask me before pushing.
```

---

## A13 / A15 / A17: Art: the character's concept

**Goal:** the character's look, approved from the back and the front in both kits, so the next session can animate them.

**Agreed with the owner:** *(filled in by L1 / L2 / L3)*

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
We're doing Session A13 of docs/plan-v3.md: "Art: Ronin's concept".
Read CLAUDE.md, docs/decisions.md ("Characters"), docs/art-style-guide.md, docs/plan-v3.md (rules, decisions, A13) and plan-v2.md ("Art sessions: shared rules", "Finalized characters", A7z and its Session log entry). Check L1 is ticked.
The reference photos are in C:\Hogg Squash\Character References\ronin\ (never commit them).
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
- **The roster** (art sessions may edit it): the character's entry keeps its id and changes to `"sheet": "<id>-100"`, drops its skin and hair recolours, and gets a `kit` and `short` if needed.
- Check them in the game: a match in each kit, the select screen from the front, a mirror match. No console warnings.
- Previews (`art/mockups/a14-*` etc.): a strip and GIFs per tag in both kits.

**Not in scope:** game code (if the game needs a change to show them, stop and ask), the trophy pose (A19).

**Done when…** the owner has approved every animation and the front idle in both kits; the sheet passes `sheetProblems` in Node; the roster entry is in with its old id; `npm test` passes; the manifest shows the credits within the approved amount.

**Starter prompt** (swap the session, name and concept session)
```text
We're doing Session A14 of docs/plan-v3.md: "Art: Ronin, every animation".
Read CLAUDE.md, docs/decisions.md ("Characters"), docs/art-style-guide.md (§3, §4, "Characters"), docs/plan-v3.md (rules, A13's Session log entry, A14) and plan-v2.md ("Art sessions: shared rules", "Finalized characters", A8z and its Session log entry). Check A13 is ticked.
First check my SpriteCook balance and list the planned generations with estimated credits, then STOP and wait for my OK before generating anything.
No game code changes (the roster entry is allowed). Finish with "Done when", tick A14, add a Session log entry, and commit. Ask me before pushing.
```

---

## A19: Art: the trophy pose for all four characters

**Goal:** each of the four characters holding A12's gold trophy (`assets/tournament.png`, `trophy`), for the champion screen.

**In scope**
- **Spend gate** as above: one animation per character, with the trophy as a reference. Settle the tag's name and frame count first (suggested: `trophy`, from the front, 8 frames, looping, the same `feet` pivot).
- Clean each to that tag in its own sheet, with the trophy's colours from the palette. Re-export the four sheets.
- Previews: the four together, in both kits (`art/mockups/a19-trophy.png`).
- Record the tag in `docs/art-style-guide.md` §3 as optional (a sheet without it still works).

**Not in scope:** game code (S20 uses the tag).

**Done when…** the owner has approved the four poses; every sheet still passes `sheetProblems`; `npm test` passes; the manifest is up to date.

**Starter prompt**
```text
We're doing Session A19 of docs/plan-v3.md: "Art: the trophy pose for all four characters".
Read CLAUDE.md, docs/decisions.md ("Characters", "Tournament": the look), docs/art-style-guide.md (§3, "Characters"), docs/plan-v3.md (rules, the A14/A16/A18 Session log entries, A19) and plan-v2.md ("Art sessions: shared rules", A12).
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
