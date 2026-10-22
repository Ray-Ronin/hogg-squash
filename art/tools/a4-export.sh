#!/bin/sh
# Export the A4 art: the effects sheet as PNG + JSON (array, with tags, the centre slice and tag data).
# Run from the repo root after a4-fx.lua. The court PNG is written by a4-court.lua itself (its reference layer is hidden).
A="${ASEPRITE:-/c/Program Files (x86)/Steam/steamapps/common/Aseprite/Aseprite.exe}"
"$A" -b art/fx/fx.aseprite \
  --sheet public/hogg-squash/assets/fx.png \
  --data public/hogg-squash/assets/fx.json \
  --format json-array --sheet-type rows --sheet-columns 8 \
  --filename-format "{tag} {tagframe0}" \
  --list-tags --list-slices
