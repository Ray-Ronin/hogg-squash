# Open questions

Last updated 2026-10-18. **Nothing here blocks writing the build plan.** These are details the plan should settle, each with a suggested default.

1. **Difficulty 1–9 mapping.** The arcade's 20 internal steps aren't in easy→hard order. Default: build a smooth 1–9 table from the arcade's values (CPU reaction delay, positioning error, game pace), with level 1 slower than the arcade's Easy start and level 9 equal to its hardest.
2. **Does difficulty change game pace, or only CPU skill?** Default: like the arcade, both (for 1P). 2P versus uses one fixed mid-level pace.
3. **Arcade's mid-match "rubber band"** (the CPU gets harder if the human runs away with the score). Default: leave it out; the player chose a level.
4. **Character height on screen** at 640×360. Default: settle with the step-1 test, starting around 90–120 px.
5. **Exact Hogg colour shades.** Default: pick a red, black and white for the shared palette during the first art step. **Settled in A1 (2026-10-20):** Hogg red `#c8102e`, kit red `#e8202a`, black `#252429`, white `#ffffff`; the full palette is in `theme.md`.
6. **Logo use on a public site.** The owner approved using Hogg's colours and logo; worth confirming the school is happy with it appearing publicly.
7. **Missing pieces to port from the decompiled code** (no decision needed): tin and out-line checks, serve rules, CPU movement, CPU-only shot adjustments, dive range.
