-- A14 (the owner's call, 2026-11-23): Mr. Sells plays with a trombone instead of a racket. SpriteCook's edit of back
-- concept 4 (art/spritecook/a14/tb-back-1.png) drew a good trombone but gave him a red collar band behind the head,
-- so this script pastes only its trombone onto A13's back concept 4 in place of the racket, and writes the result
-- padded to 200 x 200 for the animator (art/spritecook/a14/tb-back-src.png).
-- Run: Aseprite -b --script "C:/Hogg Squash/hogg-squash/art/tools/a14-trombone-source.lua"

local R = "C:/Hogg Squash/hogg-squash/"
local pc = app.pixelColor
local function rgba(img, x, y)
  local c = img:getPixel(x, y)
  return pc.rgbaR(c), pc.rgbaG(c), pc.rgbaB(c), pc.rgbaA(c)
end
local function hsv(r, g, b)
  local mx, mn = math.max(r, g, b), math.min(r, g, b)
  local h = 0
  if mx ~= mn then
    if mx == r then h = 60 * (((g - b) / (mx - mn)) % 6)
    elseif mx == g then h = 60 * ((b - r) / (mx - mn) + 2)
    else h = 60 * ((r - g) / (mx - mn) + 4) end
  end
  return h, mx == 0 and 0 or (mx - mn) / mx, mx / 255
end
local function gold(r, g, b, a)
  if a < 128 then return false end
  local h, s, v = hsv(r, g, b)
  return h >= 30 and h <= 62 and s >= 0.35 and v >= 0.25
end
local function load(path)
  local img = Image { fromFile = path }
  if img.colorMode ~= ColorMode.RGB then
    local o = Image(img.width, img.height, ColorMode.RGB)
    o:drawImage(img)
    img = o
  end
  return img
end

local base = load(R .. "art/spritecook/a13/back-4.png")
local tb = load(R .. "art/spritecook/a14/tb-back-1.png")

-- The body's centre column (at the shorts, 30% up from the soles), its soles, and its head top on that column.
local function body(img, skip)
  local W, H = img.width, img.height
  local soles = 0
  for y = 0, H - 1 do for x = 0, W - 1 do
    local r, g, b, a = rgba(img, x, y)
    if a >= 128 and not skip(x, y, r, g, b, a) then soles = math.max(soles, y) end
  end end
  local top0 = H
  for y = 0, H - 1 do for x = 0, W - 1 do
    local r, g, b, a = rgba(img, x, y)
    if a >= 128 and not skip(x, y, r, g, b, a) then top0 = math.min(top0, y) end
  end end
  local ry = math.floor(soles - (soles - top0) * 0.3)
  local sx, n = 0, 0
  for x = 0, W - 1 do
    local r, g, b, a = rgba(img, x, ry)
    if a >= 128 and not skip(x, ry, r, g, b, a) then sx = sx + x; n = n + 1 end
  end
  local cx = math.floor(sx / n + 0.5)
  local head = soles
  for y = 0, soles do
    for x = cx - 8, cx + 8 do
      local _, _, _, a = rgba(img, x, y)
      if a >= 128 then head = math.min(head, y) end
    end
  end
  return cx, head, soles
end

-- In A13's concept the racket is everything right of the right forearm above the hand: the light strings, its red
-- rim and its dark frame and handle. Skin (the arm and hand) is kept.
local RACKET = { x0 = 138, y1 = 106 }
local function skin(r, g, b)
  local h, s, v = hsv(r, g, b)
  return h >= 8 and h <= 40 and s >= 0.2 and s <= 0.75 and v >= 0.45
end
local function inRacket(x, y, r, g, b, a) return x >= RACKET.x0 and y <= RACKET.y1 and not skin(r, g, b) end

local bx, bh, bs = body(base, inRacket)
local tx, th, ts = body(tb, function(x, y, r, g, b, a) return gold(r, g, b, a) end)
local k = (bs - bh) / (ts - th)
print(string.format("base body centre %d, head %d, soles %d; trombone still %d, %d, %d; scale %.3f", bx, bh, bs, tx, th, ts, k))

-- the trombone, in the still's pixels: right of the shirt (x >= 160), or right of the head above the shoulders
-- (x >= 148, y < 40, for the bell), down to the knees, and not shirt red. Skin is left out only round the hand
-- (x 158-190, y 50-100), where his fingers wrap the trombone.
local function red(r, g, b)
  local h, s = hsv(r, g, b)
  return (h <= 12 or h >= 340) and s >= 0.5
end
local W, H = tb.width, tb.height
local keep = {}
for y = 0, H - 1 do
  keep[y] = {}
  for x = 0, W - 1 do
    local r, g, b, a = rgba(tb, x, y)
    local region = (x >= 160 or (x >= 148 and y < 40)) and y <= 175
    local hand = x >= 158 and x <= 190 and y >= 50 and y <= 100 and skin(r, g, b)
    if a >= 128 and region and not red(r, g, b) and not hand then keep[y][x] = true end
  end
end

local out = Image(200, 200, ColorMode.RGB)
-- the base, minus the racket
for y = 0, base.height - 1 do for x = 0, base.width - 1 do
  local r, g, b, a = rgba(base, x, y)
  if a > 0 and not inRacket(x, y, r, g, b, a) then out:drawPixel(x, y, base:getPixel(x, y)) end
end end
-- the trombone, area-averaged down to the base's scale (so its thin tubes and outline survive) and placed by the
-- bodies; behind the body (only where the base is empty), so his hand grips it
local minx, maxx, miny, maxy = 999, -1, 999, -1
for y = 0, 199 do for x = 0, 199 do
  if pc.rgbaA(out:getPixel(x, y)) == 0 then
    local x0, x1 = tx + (x - 0.5 - bx) / k, tx + (x + 0.5 - bx) / k
    local y0, y1 = ts + (y - 0.5 - bs) / k, ts + (y + 0.5 - bs) / k
    local sr, sg, sb, cov, area = 0, 0, 0, 0, 0
    for sy = math.floor(y0), math.ceil(y1) - 1 do for sx = math.floor(x0), math.ceil(x1) - 1 do
      local wgt = (math.min(x1, sx + 1) - math.max(x0, sx)) * (math.min(y1, sy + 1) - math.max(y0, sy))
      if wgt > 0 then
        area = area + wgt
        if sx >= 0 and sy >= 0 and sx < W and sy < H and keep[sy][sx] then
          local r, g, b = rgba(tb, sx, sy)
          sr = sr + r * wgt; sg = sg + g * wgt; sb = sb + b * wgt; cov = cov + wgt
        end
      end
    end end
    if area > 0 and cov / area >= 0.45 then
      out:drawPixel(x, y, pc.rgba(math.floor(sr / cov + 0.5), math.floor(sg / cov + 0.5), math.floor(sb / cov + 0.5), 255))
      minx = math.min(minx, x); maxx = math.max(maxx, x); miny = math.min(miny, y); maxy = math.max(maxy, y)
    end
  end
end end
print(string.format("trombone placed at x %d-%d, y %d-%d", minx, maxx, miny, maxy))
local spr = Sprite(200, 200, ColorMode.RGB)
spr.cels[1].image = out
spr:saveAs(R .. "art/spritecook/a14/tb-back-src.png")
spr:close()
