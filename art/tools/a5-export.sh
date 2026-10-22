#!/bin/sh
# Export the A5 UI sheet as PNG + JSON (Aseprite JSON array, with its slices: bounds, and `center` for the
# 9-slice pieces). Run from the repo root after a5-ui.lua. The font (font.png + font.json) and the title
# (title.png) are written by a5-font.lua and a5-title.lua themselves.
A="${ASEPRITE:-/c/Program Files (x86)/Steam/steamapps/common/Aseprite/Aseprite.exe}"
"$A" -b art/ui/ui.aseprite \
  --sheet public/hogg-squash/assets/ui.png \
  --data public/hogg-squash/assets/ui.json \
  --format json-array --sheet-type rows --sheet-columns 1 \
  --list-slices
