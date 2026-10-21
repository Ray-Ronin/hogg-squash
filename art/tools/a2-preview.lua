-- A2 review strips: every tag of art/character/player.aseprite as a row, 3x, on the court floor colour, with the
-- ground line and the feet pivot marked. Run in Aseprite (batch) after a2-build.lua.
-- Writes art/mockups/a2-strips.png.
local R = "C:/Hogg Squash/hogg-squash/"
local spr = app.open(R .. "art/character/player.aseprite")
local SC, GAP = 3, 4
local feet = spr.slices[1]
local gx = feet.bounds.x + feet.pivot.x
local gy = feet.bounds.y + feet.pivot.y
local most = 0
for _, t in ipairs(spr.tags) do most = math.max(most, t.frames) end
local cw, ch = (spr.width + GAP) * SC, (spr.height + GAP) * SC
local out = Image(most * cw, #spr.tags * ch, ColorMode.RGB)
local pc = app.pixelColor
out:clear(pc.rgba(223, 189, 140, 255))
local GUIDE = pc.rgba(40, 90, 220, 255)
for row, t in ipairs(spr.tags) do
  for k = 0, t.frames - 1 do
    local flat = Image(spr.width, spr.height, ColorMode.RGB)
    flat:drawSprite(spr, t.fromFrame.frameNumber + k)
    local ox, oy = k * cw, (row - 1) * ch
    for y = 0, spr.height - 1 do for x = 0, spr.width - 1 do
      local v = flat:getPixel(x, y)
      local guide = (y == math.floor(gy)) or (x == math.floor(gx))
      if pc.rgbaA(v) > 0 or guide then
        if pc.rgbaA(v) == 0 then v = GUIDE end
        for dy = 0, SC - 1 do for dx = 0, SC - 1 do out:drawPixel(ox + x * SC + dx, oy + y * SC + dy, v) end end
      end
    end end
  end
end
out:saveAs(R .. "art/mockups/a2-strips.png")
