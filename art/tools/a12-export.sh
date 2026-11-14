#!/bin/sh
# Export the A12 tournament sheet as PNG + JSON (Aseprite JSON array, with its slices: bounds and pivots).
# Run from the repo root after a12-tournament.lua.
A="${ASEPRITE:-/c/Program Files (x86)/Steam/steamapps/common/Aseprite/Aseprite.exe}"
"$A" -b art/ui/tournament.aseprite \
  --sheet public/hogg-squash/assets/tournament.png \
  --data public/hogg-squash/assets/tournament.json \
  --format json-array --sheet-type rows --sheet-columns 1 \
  --list-slices
