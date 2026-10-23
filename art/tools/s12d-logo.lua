-- Hogg Squash S12d (2026-10-22): the school logo for the match's logo slot (LOGO in js/render/hud.js).
-- Run: Aseprite.exe -b --script "C:/Hogg Squash/hogg-squash/art/tools/s12d-logo.lua"
-- Writes public/hogg-squash/assets/logo.png, indexed on the shared palette.
--
-- The Hogg Razorbacks shield (the owner's file, art/ui/hogg-logo-source.png, the one on the title), made the way
-- a5-title.lua makes the title's crest: area-averaged down, locked to the palette's neutrals and reds, with a 1 px
-- outline. It is made at the slot's size (at most LOGO.SIZE = 66 px either way), so the game draws it 1:1 and never
-- shrinks it smoothly. No shadow: it sits on the dark margin, not on the wall.

local R = "C:/Hogg Squash/hogg-squash/"
local P = dofile(R .. "art/tools/pixel-lib.lua")
local pal = P.loadPalette(R .. "art/palette/hogg-squash.gpl")
local function idx(name)
  for i, c in ipairs(pal) do if c[4] == name or c[4]:sub(1, #name + 1) == name .. " " then return i end end
  error("no palette colour " .. name)
end

local SIZE = 66
local src = P.loadSource(R .. "art/ui/hogg-logo-source.png")
local h = SIZE
while math.floor(src.w * h / src.h + 0.5) > SIZE do h = h - 1 end   -- the shield is a little wider than tall
local allow = {}
for i, c in ipairs(pal) do
  if i <= idx("red highlight") and not c[4]:match("^margin") then allow[i] = true end
end
local q = P.quantize(pal, P.areaResize(src, h), 0.5, allow)
P.outline(q, idx("outline"))

local spr = Sprite(q.w, q.h, ColorMode.INDEXED)
spr:setPalette(P.asepritePalette(pal))
spr.transparentColor = 0
local img = Image(q.w, q.h, ColorMode.INDEXED)
for y = 0, q.h - 1 do for x = 0, q.w - 1 do
  if q.px[y][x] ~= 0 then img:drawPixel(x, y, q.px[y][x]) end
end end
spr.cels[1].image = img
spr:saveCopyAs(R .. "public/hogg-squash/assets/logo.png")
print(string.format("logo %dx%d", q.w, q.h))
