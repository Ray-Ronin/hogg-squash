-- Hogg Squash A5 (2026-10-22): the four SpriteCook mascot concepts side by side at 2x on the margin colour,
-- numbered, for the owner to pick from. Writes art/mockups/a5-mascot-concepts.png.
local R = "C:/Hogg Squash/hogg-squash/"
local CELL, N = 520, 4
local out = Image(CELL * N, CELL, ColorMode.RGB)
out:clear(app.pixelColor.rgba(22, 22, 26, 255))
for i = 1, N do
  local src = Image { fromFile = R .. "art/spritecook/a5/mascot-" .. i .. ".png" }
  local s = 2
  local ox = (i - 1) * CELL + (CELL - src.width * s) // 2
  local oy = CELL - src.height * s - 10
  for y = 0, src.height - 1 do
    for x = 0, src.width - 1 do
      local c = src:getPixel(x, y)
      if app.pixelColor.rgbaA(c) >= 128 then
        for dy = 0, s - 1 do for dx = 0, s - 1 do out:drawPixel(ox + x * s + dx, oy + y * s + dy, c) end end
      end
    end
  end
  -- the concept's number as 1..4 white bars at the top left of its cell
  for b = 1, i do
    for y = 10, 30 do for x = 0, 3 do out:drawPixel((i - 1) * CELL + 8 + (b - 1) * 8 + x, y, app.pixelColor.rgba(255, 255, 255, 255)) end end
  end
end
out:saveAs(R .. "art/mockups/a5-mascot-concepts.png")
