-- Hogg Squash A5 (2026-10-22): the title screen art, 640 x 360, indexed on the shared palette.
-- Run: Aseprite.exe -b --script "C:/Hogg Squash/hogg-squash/art/tools/a5-title.lua"
-- Writes art/ui/title.aseprite (layers wall, floor, logotype, crest, and a hidden mascot),
-- public/hogg-squash/assets/title.png and the 2x preview art/mockups/a5-title.png (with a sample menu where S10
-- will put it).
--
-- The scene is a squash front wall seen square on: white wall, the red out-line along the top, the tin and its
-- line, and a strip of maple floor. The "HOGG SQUASH" logotype is our 5x7 lettering doubled three times (56 px
-- capitals) with a 2 px outline and a solid drop. On the right is the school's Hogg Razorbacks shield (the owner's
-- call in A5, replacing the mascot; see docs/decisions.md). The mascot, SpriteCook concept 3 (asset 4cc62812) from
-- its full-size raw image (art/spritecook/a5/mascot-3-raw.png, 1024 px), area-averaged down to MASCOT_H px, locked
-- to the character colours and given a 1 px outline, stays in title.aseprite as a hidden layer and is not exported.
-- Left free for the menu (S10): x 44-350, y 196-292 (the slice "menu" in title.aseprite).

local R = "C:/Hogg Squash/hogg-squash/"
local P = dofile(R .. "art/tools/pixel-lib.lua")
local T = dofile(R .. "art/tools/a5-lib.lua")
local pal = P.loadPalette(R .. "art/palette/hogg-squash.gpl")
local function idx(name)
  for i, c in ipairs(pal) do if c[4] == name or c[4]:sub(1, #name + 1) == name .. " " then return i end end
  error("no palette colour " .. name)
end

local W, H = 640, 360
local OUT, BLACK, BLACK_HI = idx("outline"), idx("black kit"), idx("black kit light")
local RED, RED_HI, TIN, DEEP = idx("Hogg red"), idx("red highlight"), idx("tin"), idx("red 2")
local WALL, SIDE, GREY3 = idx("front wall"), idx("side wall"), idx("grey 3")
local WOOD1, WOOD2, WOOD3, FLOOR, WOOD_HI = idx("wood 1"), idx("wood 2"), idx("wood 3"), idx("floor"), idx("wood highlight")

local OUT_Y = 22                 -- the out-line's top row (3 px)
local TIN_TOP, FLOOR_Y = 296, 322 -- the tin line's top row (3 px), then the tin board, then the floor

local function layerImage() local i = Image(W, H, ColorMode.INDEXED); i:clear(0); return i end

-- Wall -----------------------------------------------------------------------------------------------------------
local wall = layerImage()
for y = 0, FLOOR_Y - 1 do for x = 0, W - 1 do wall:drawPixel(x, y, WALL) end end
for y = OUT_Y, OUT_Y + 2 do for x = 0, W - 1 do wall:drawPixel(x, y, RED) end end
for x = 0, W - 1 do wall:drawPixel(x, OUT_Y + 3, SIDE) end                    -- the line's faint shadow
for y = TIN_TOP, TIN_TOP + 2 do for x = 0, W - 1 do wall:drawPixel(x, y, RED) end end
for y = TIN_TOP + 3, FLOOR_Y - 1 do for x = 0, W - 1 do wall:drawPixel(x, y, TIN) end end
for x = 0, W - 1 do wall:drawPixel(x, TIN_TOP + 3, DEEP) end
-- faint ball marks, scattered deterministically
local seed = 7
local function rnd(n) seed = (seed * 1103515245 + 12345) % 2147483648; return seed % n end
for _ = 1, 70 do
  local x, y = rnd(W - 4), OUT_Y + 8 + rnd(TIN_TOP - OUT_Y - 16)
  wall:drawPixel(x, y, SIDE)
  if rnd(3) == 0 then wall:drawPixel(x + 1, y, SIDE) end
  if rnd(5) == 0 then wall:drawPixel(x, y + 1, GREY3) end
end

-- Floor: boards running away from the wall (vertical seams), lighter towards the viewer -------------------------
local floor = layerImage()
for y = FLOOR_Y, H - 1 do
  for x = 0, W - 1 do
    local c = FLOOR
    if y == FLOOR_Y then c = WOOD1 elseif y <= FLOOR_Y + 2 then c = WOOD2 end
    floor:drawPixel(x, y, c)
  end
end
for b = 0, W // 22 + 1 do                                                     -- seams fan out a little
  for y = FLOOR_Y + 3, H - 1 do
    local t = (y - FLOOR_Y) / (H - FLOOR_Y)
    local x = math.floor(320 + (b * 22 - 320) * (1 + 0.25 * t) + 0.5)
    if x >= 0 and x < W then floor:drawPixel(x, y, WOOD3) end
  end
end
seed = 3
for _ = 1, 40 do                                                               -- grain flecks
  local x, y = rnd(W), FLOOR_Y + 4 + rnd(H - FLOOR_Y - 4)
  floor:drawPixel(x, y, rnd(2) == 0 and WOOD3 or WOOD_HI)
end

-- Logotype -------------------------------------------------------------------------------------------------------
local logo = layerImage()
local HOGG_ST = { fill = RED, shade = TIN, shadeRow = 32, hi = RED_HI, outline = OUT, ow = 2, shadow = BLACK, drop = 5 }
local SQUASH_ST = { fill = BLACK, shade = OUT, shadeRow = 32, hi = BLACK_HI, outline = OUT, ow = 2, shadow = RED, drop = 5 }
local hogg, squash = T.text("HOGG", 8, HOGG_ST), T.text("SQUASH", 8, SQUASH_ST)
local LOGO_X = 44
T.put(logo, hogg, LOGO_X + (squash.w - hogg.w) // 2, 38)
T.put(logo, squash, LOGO_X, 38 + 70)

-- Mascot ---------------------------------------------------------------------------------------------------------
local MASCOT_H = 292
local src = P.loadSource(R .. "art/spritecook/a5/mascot-3-raw.png")
local q = P.cleanAt(pal, src, MASCOT_H)
local mascot = layerImage()
local mx = W - 40 - q.w
local my = H - 8 - q.h
-- a soft floor shadow under the feet
local fx, _ = P.feetX(q, 6)
for y = -3, 3 do for x = -60, 60 do
  if (x / 60) ^ 2 + (y / 3.5) ^ 2 <= 1 then
    local px, py = math.floor(mx + fx + x), H - 9 + y
    if px >= 0 and px < W and py < H then mascot:drawPixel(px, py, WOOD2) end
  end
end end
for y = 0, q.h - 1 do for x = 0, q.w - 1 do
  local c = q.px[y][x]
  if c ~= 0 then mascot:drawPixel(mx + x, my + y, c) end
end end

-- School crest ---------------------------------------------------------------------------------------------------
-- The Hogg Razorbacks shield (the owner's file, art/ui/hogg-logo-source.png), area-averaged down to CREST_H px,
-- locked to the palette's neutrals and reds, with a 1 px outline so its cream rim reads on the white wall, and a
-- side-wall shadow 3 px down and right, as if it hangs on the wall.
local CREST_H = 240
local crestSrc = P.loadSource(R .. "art/ui/hogg-logo-source.png")
local allow = {}
for i, c in ipairs(pal) do
  if i <= idx("red highlight") and not c[4]:match("^margin") then allow[i] = true end
end
local cq = P.quantize(pal, P.areaResize(crestSrc, CREST_H), 0.5, allow)
P.outline(cq, OUT)
local crest = layerImage()
local cx = W - 40 - cq.w
local cy = (OUT_Y + 3 + TIN_TOP) // 2 - cq.h // 2
for y = 0, cq.h - 1 do for x = 0, cq.w - 1 do
  if cq.px[y][x] ~= 0 then crest:drawPixel(cx + x + 3, cy + y + 3, SIDE) end
end end
for y = 0, cq.h - 1 do for x = 0, cq.w - 1 do
  local c = cq.px[y][x]
  if c ~= 0 then crest:drawPixel(cx + x, cy + y, c) end
end end

-- Sprite and save ------------------------------------------------------------------------------------------------
local spr = Sprite(W, H, ColorMode.INDEXED)
spr:setPalette(P.asepritePalette(pal))
spr.transparentColor = 0
local order = { { "wall", wall }, { "floor", floor }, { "logotype", logo }, { "crest", crest }, { "mascot", mascot } }
local mascotLayer
for i, o in ipairs(order) do
  local layer = i == 1 and spr.layers[1] or spr:newLayer()
  layer.name = o[1]
  spr:newCel(layer, 1, o[2], Point(0, 0))
  if o[1] == "mascot" then layer.isVisible = false; mascotLayer = layer end
end
local menu = spr:newSlice(Rectangle(44, 196, 306, 96))
menu.name = "menu"
spr:saveAs(R .. "art/ui/title.aseprite")
spr:deleteLayer(mascotLayer)
spr:flatten()
spr:saveCopyAs(R .. "public/hogg-squash/assets/title.png")

-- Preview at 2x, with a sample menu in the free area
local flat = Image(spr)
local pv = Image(W, H, ColorMode.RGB)
for y = 0, H - 1 do for x = 0, W - 1 do
  local c = flat:getPixel(x, y)
  if c ~= 0 then local p = pal[c]; pv:drawPixel(x, y, app.pixelColor.rgba(p[1], p[2], p[3], 255)) end
end end
local LR = { fill = RED, shade = TIN, shadeRow = 8, outline = OUT, shadow = GREY3, drop = 1 }
local LD = { fill = BLACK, shade = OUT, shadeRow = 8, outline = OUT, shadow = GREY3, drop = 1 }
local function txt(str, st, x, y)
  local t = T.text(str, 2, st)
  for yy = 0, t.h - 1 do for xx = 0, t.w - 1 do
    local c = t.px[yy][xx]
    if c ~= 0 then local p = pal[c]; pv:drawPixel(x + xx, y + yy, app.pixelColor.rgba(p[1], p[2], p[3], 255)) end
  end end
end
local menuX = LOGO_X + 40
txt("1 PLAYER", LR, menuX, 214); txt("2 PLAYERS", LD, menuX, 238); txt("OPTIONS", LD, menuX, 262)
local ui = app.open(R .. "art/ui/ui.aseprite")
local uimg = Image(ui)
for _, s in ipairs(ui.slices) do
  if s.name == "cursor" then
    local b = s.bounds
    for yy = 0, b.height - 1 do for xx = 0, b.width - 1 do
      local c = uimg:getPixel(b.x + xx, b.y + yy)
      if c ~= 0 then local p = pal[c]; pv:drawPixel(menuX - 14 + xx, 217 + yy, app.pixelColor.rgba(p[1], p[2], p[3], 255)) end
    end end
  end
end
local big = Image(W * 2, H * 2, ColorMode.RGB)
for y = 0, H - 1 do for x = 0, W - 1 do
  local v = pv:getPixel(x, y)
  big:drawPixel(2 * x, 2 * y, v); big:drawPixel(2 * x + 1, 2 * y, v); big:drawPixel(2 * x, 2 * y + 1, v); big:drawPixel(2 * x + 1, 2 * y + 1, v)
end end
big:saveAs(R .. "art/mockups/a5-title.png")
print(string.format("crest %dx%d at %d,%d; logotype %d wide", cq.w, cq.h, cx, cy, squash.w))
