-- A3 review strips: the A3 tags of art/character/player.aseprite as rows, 3x, on the court floor colour, with the
-- ground line and the feet pivot marked and a red bar under each tag's contact frame (tag data "contact=<n>").
-- Run in Aseprite (batch) after a2-build.lua. Writes art/mockups/a3-strips.png.
local R = "C:/Hogg Squash/hogg-squash/"
local SHOW = { forehand = true, backhand = true, overhead = true, dive = true }
local spr = app.open(R .. "art/character/player.aseprite")
local SC, GAP = 3, 4
local feet = spr.slices[1]
local gx = feet.bounds.x + feet.pivot.x
local gy = feet.bounds.y + feet.pivot.y
local tags, most = {}, 0
for _, t in ipairs(spr.tags) do
  if SHOW[t.name] then
    tags[#tags + 1] = { name = t.name, frames = t.frames, fromFrame = t.fromFrame, data = t.data }
    most = math.max(most, t.frames)
  end
end
-- The dive again, mirrored about the feet pivot, as the game will draw a dive to the left.
for _, t in ipairs(spr.tags) do
  if t.name == "dive" then tags[#tags + 1] = { name = "dive_left", frames = t.frames, fromFrame = t.fromFrame,
    data = t.data, flip = true } end
end
local cols = math.min(most, 8)
local cw, ch = (spr.width + GAP) * SC, (spr.height + GAP) * SC
local rows = 0
for _, t in ipairs(tags) do rows = rows + math.ceil(t.frames / cols) end
local out = Image(cols * cw, rows * ch, ColorMode.RGB)
local pc = app.pixelColor
out:clear(pc.rgba(223, 189, 140, 255))
local GUIDE = pc.rgba(40, 90, 220, 255)
local CONTACT = pc.rgba(220, 20, 30, 255)
local row = 0
for _, t in ipairs(tags) do
  local contact = tonumber((t.data or ""):match("contact=(%d+)"))
  for k = 0, t.frames - 1 do
    local flat = Image(spr.width, spr.height, ColorMode.RGB)
    flat:drawSprite(spr, t.fromFrame.frameNumber + k)
    local ox, oy = (k % cols) * cw, (row + math.floor(k / cols)) * ch
    for y = 0, spr.height - 1 do for x = 0, spr.width - 1 do
      local sx = t.flip and math.floor(2 * gx) - x or x
      local v = (sx >= 0 and sx < spr.width) and flat:getPixel(sx, y) or 0
      local guide = (y == math.floor(gy)) or (x == math.floor(gx))
      if pc.rgbaA(v) > 0 or guide then
        if pc.rgbaA(v) == 0 then v = GUIDE end
        for dy = 0, SC - 1 do for dx = 0, SC - 1 do out:drawPixel(ox + x * SC + dx, oy + y * SC + dy, v) end end
      end
    end end
    if k == contact then
      for y = spr.height * SC + 2, spr.height * SC + GAP * SC - 2 do
        for x = 0, spr.width * SC - 1 do out:drawPixel(ox + x, oy + y, CONTACT) end
      end
    end
  end
  row = row + math.ceil(t.frames / cols)
end
out:saveAs(R .. "art/mockups/a3-strips.png")
