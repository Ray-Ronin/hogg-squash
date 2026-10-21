#!/bin/sh
# Export art/character/player.aseprite as the game's sheet: PNG + JSON (array, with tags and the feet slice).
# Run from the repo root after a2-build.lua (A2; A3 re-exports the same way with its extra tags).
A="${ASEPRITE:-/c/Program Files (x86)/Steam/steamapps/common/Aseprite/Aseprite.exe}"
"$A" -b art/character/player.aseprite \
  --sheet public/hogg-squash/assets/player-100.png \
  --data public/hogg-squash/assets/player-100.json \
  --format json-array --sheet-type rows --sheet-columns 8 \
  --filename-format "{tag} {tagframe0}" \
  --list-tags --list-slices
