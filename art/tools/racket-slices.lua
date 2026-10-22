-- S8b: where the racket head is on each swing tag's contact frame, as one 1x1 slice per tag ("racket <tag>"),
-- exported to player-100.json with the sheet. The game draws a swinging sprite up or down so that this point meets the
-- ball on the contact frame (RACKET in js/render/sprites.js). No new art: the points are data.
-- The pixels are the centres of the racket head's light-grey strings, measured on each contact frame (the largest
-- grey patch above the socks; the dive's lies on the floor), in frame pixels (feet pivot at x 73, y 148).
-- Run on the existing file (then export with a2-export.sh):
--   Aseprite -b art/character/player.aseprite --script art/tools/racket-slices.lua
-- a2-build.lua also calls it (with RACKET_SLICES_LIB set), so a rebuild keeps the slices.

local POINTS = {
  serve    = { 59, 65 },    -- over the left shoulder, swinging across
  forehand = { 111, 69 },   -- out to the right at shoulder height
  backhand = { 59, 66 },    -- by the left shoulder
  overhead = { 79, 15 },    -- straight up
  dive     = { 129, 128 },  -- on the floor at the end of the right arm
}

local function add(spr)
  for i = #spr.slices, 1, -1 do
    if spr.slices[i].name:match("^racket ") then spr:deleteSlice(spr.slices[i]) end
  end
  for _, tag in ipairs({ "serve", "forehand", "backhand", "overhead", "dive" }) do
    local p = POINTS[tag]
    local s = spr:newSlice(Rectangle(p[1], p[2], 1, 1))
    s.name = "racket " .. tag
  end
end

if not RACKET_SLICES_LIB then
  local spr = app.activeSprite
  add(spr)
  spr:saveAs(spr.filename)
  print("racket slices added to " .. spr.filename)
end

return { POINTS = POINTS, add = add }
