-- Hogg Squash A4 (2026-10-22): check images for the court and effects (not used by the game).
-- Run after a4-court.lua, a4-fx.lua and a4-export.sh. Writes to art/mockups/:
--   a4-fx.png              the effects sheet at 4x on the floor colour
--   a4-ball-contrast.png   every ball size (with its shadow below) on every background it can be seen against, at 4x
--   a4-court-scene.png     the painted court with balls, shadows and landing markers where the game would put them

local R = "C:/Hogg Squash/hogg-squash/"
local pc = app.pixelColor

local court = app.open(R .. "public/hogg-squash/assets/court.png")
local cimg, cpal = court.cels[1].image, court.palettes[1]
local fx = app.open(R .. "art/fx/fx.aseprite")
local fpal = fx.palettes[1]
local function rgb(p, i) return p:getColor(i).rgbaPixel end
local function courtPx(x, y) return rgb(cpal, cimg:getPixel(x, y)) end
local function fxFrame(tag, n)
  for _, t in ipairs(fx.tags) do if t.name == tag then return fx.cels[t.fromFrame.frameNumber + n].image end end
end
-- Draw fx frame onto an RGB image with its centre (24, 24) at (cx, cy), scaled by k.
local function blit(dst, src, cx, cy, k)
  k = k or 1
  for y = 0, src.height - 1 do
    for x = 0, src.width - 1 do
      local i = src:getPixel(x, y)
      if i ~= 0 then
        for a = 0, k - 1 do for b = 0, k - 1 do dst:drawPixel(cx + (x - 24) * k + a, cy + (y - 24) * k + b, rgb(fpal, i)) end end
      end
    end
  end
end

-- 1. The sheet at 4x.
local cols, rows = 8, 4
local sheet = Image(cols * 48 * 4, rows * 48 * 4, ColorMode.RGB)
sheet:clear(pc.rgba(223, 189, 140, 255))
for i = 1, #fx.frames do
  local cel = fx.cels[i]
  local c, r = (i - 1) % cols, (i - 1) // cols
  blit(sheet, cel.image, c * 192 + 96, r * 192 + 96, 4)
end
sheet:saveAs(R .. "art/mockups/a4-fx.png")

-- 2. Contrast grid: backgrounds (court spots) by ball size.
local SPOTS = {
  { "front wall", 320, 120 }, { "tin", 300, 187 }, { "side wall", 100, 230 }, { "board HOGG", 120, 270 },
  { "board RAZORBACKS", 520, 270 }, { "floor", 280, 300 }, { "short line", 300, 250 }, { "half line", 320, 320 },
}
local P, K = 16, 4
local grid = Image(5 * P * K, #SPOTS * P * K, ColorMode.RGB)
for si, s in ipairs(SPOTS) do
  for d = 0, 4 do
    local patch = Image(P, P, ColorMode.RGB)
    for y = 0, P - 1 do for x = 0, P - 1 do patch:drawPixel(x, y, courtPx(s[2] - 8 + x, s[3] - 8 + y)) end end
    if si >= 6 then blit(patch, fxFrame("shadow", d), 8, 12) end
    blit(patch, fxFrame("ball", d), 8, 7)
    for y = 0, P - 1 do for x = 0, P - 1 do
      local v = patch:getPixel(x, y)
      for a = 0, K - 1 do for b = 0, K - 1 do grid:drawPixel((d * P + x) * K + a, ((si - 1) * P + y) * K + b, v) end end
    end end
  end
end
grid:saveAs(R .. "art/mockups/a4-ball-contrast.png")

-- 3. A scene: the court with balls in flight and their shadows, two landing markers, a ring and a sparkle.
local U = { x = 45, y = 35.2, z = 18.8 }
local D0 = 183 / U.z + 8.1
local function project(x, y, z)
  local d = D0 - z / U.z
  local s = 557 / d
  return 320 + x / U.x * s * 1.1, 70 + (4.0 - y / U.y) * s, s
end
local function ballSize(z)
  local _, _, s = project(0, 0, z)
  return math.max(0, math.min(4, math.floor(2 * 0.05 * s + 0.5) - 3))
end
local scene = Image(640, 360, ColorMode.RGB)
for y = 0, 359 do for x = 0, 639 do scene:drawPixel(x, y, courtPx(x, y)) end end
local MARK = { 40, 80, 115, 145, 172 }
for _, m in ipairs({ { -60, 150 }, { 70, 100 } }) do
  local best, bd = 0, math.huge
  for i, z in ipairs(MARK) do if math.abs(z - m[2]) < bd then best, bd = i - 1, math.abs(z - m[2]) end end
  local sx, sy = project(m[1], 0, m[2])
  blit(scene, fxFrame("landing", best), math.floor(sx), math.floor(sy))
end
for _, b in ipairs({ { -100, 30, 5 }, { 40, 60, 40 }, { 0, 20, 90 }, { 90, 40, 130 }, { -50, 8, 160 }, { 120, 15, 178 } }) do
  local x, y, z = b[1], b[2], b[3]
  local d = ballSize(z)
  local sx, sy = project(x, 0, z)
  blit(scene, fxFrame("shadow", d), math.floor(sx), math.floor(sy))
  local bx, by = project(x, y, z)
  blit(scene, fxFrame("ball", d), math.floor(bx), math.floor(by - (d + 3) / 2))
end
local rx, ry = project(-40, 90, 0)
blit(scene, fxFrame("ring", 1), math.floor(rx), math.floor(ry))
local kx, ky = project(60, 25, 120)
blit(scene, fxFrame("sparkle", 1), math.floor(kx), math.floor(ky))
scene:saveAs(R .. "art/mockups/a4-court-scene.png")
