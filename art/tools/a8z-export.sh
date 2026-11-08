#!/bin/sh
# Export art/character/zain.aseprite as Coach Zain's sheet: PNG + JSON (array, with tags and slices), like player-100.
# Run from the repo root after a8z-build.lua.
A="${ASEPRITE:-/c/Program Files (x86)/Steam/steamapps/common/Aseprite/Aseprite.exe}"
"$A" -b art/character/zain.aseprite \
  --sheet public/hogg-squash/assets/zain-100.png \
  --data public/hogg-squash/assets/zain-100.json \
  --format json-array --sheet-type rows --sheet-columns 8 \
  --filename-format "{tag} {tagframe0}" \
  --list-tags --list-slices
