-- Hogg Squash A12 (2026-11-14): the tournament's pieces, drawn pixel by pixel (no SpriteCook).
-- Run: Aseprite.exe -b --script "C:/Hogg Squash/hogg-squash/art/tools/a12-tournament.lua"
-- Writes art/ui/tournament.aseprite (one frame, indexed on the shared palette, one slice per piece), its export
-- public/hogg-squash/assets/tournament.png + .json (by art/tools/a12-export.sh), and the preview
-- art/mockups/a12-trophy.png (both trophies at 1x and 4x). Pieces so far (slice names):
--   trophy        64 x 84: a gold cup (the owner's call)  with two handles and a Hogg red band, on a black plinth with a red plate
--                 lettered HOGG, for the champion screen (its foot's centre: the slice's pivot)
--   trophy small  21 x 25: the same cup, redrawn small, for the middle of the bracket
-- The light comes from the top left, as on the court and the characters.

local R = "C:/Hogg Squash/hogg-squash/"
local P = dofile(R .. "art/tools/pixel-lib.lua")
local T = dofile(R .. "art/tools/a5-lib.lua")
local pal = P.loadPalette(R .. "art/palette/hogg-squash.gpl")
local function idx(name)
  for i, c in ipairs(pal) do if c[4] == name or c[4]:sub(1, #name + 1) == name .. " " then return i end end
  error("no palette colour " .. name)
end

local OUT, BLACK, BLACK_HI = idx("outline"), idx("black kit"), idx("black kit light")
local RED1, RED2, TIN, RED, KIT_RED, RED_HI = idx("red 1"), idx("red 2"), idx("tin"), idx("Hogg red"), idx("kit red"),
  idx("red highlight")
local WHITE, SHADE, GREY3, GREY2, GREY1 = idx("white"), idx("white kit shade"), idx("grey 3"), idx("grey 2"), idx("grey 1")
local function exact(name) for i, c in ipairs(pal) do if c[4] == name then return i end end error("no palette colour " .. name) end
-- Gold, from colours already in the palette (it is at 47 of 48): the effects' flash, Will's unused blond hair tones,
-- the floor's darkest wood and the auburn hair's dark tone for the inside of the cup
local GOLD_HI, GOLD_LIGHT, GOLD, GOLD_DARK, GOLD_DEEP, GOLD_IN = exact("flash"), idx("hair blond"), exact("flash shade"),
  idx("hair blond dark"), idx("wood 1"), idx("hair auburn dark")

local W, H = 128, 96
local img = Image(W, H, ColorMode.INDEXED)
img:clear(0)
local slices = {}
local function px(x, y, c) if x >= 0 and y >= 0 and x < W and y < H then img:drawPixel(x, y, c) end end
local function get(x, y) if x < 0 or y < 0 or x >= W or y >= H then return 0 end return img:getPixel(x, y) end
local function rect(x, y, w, h, c) for yy = y, y + h - 1 do for xx = x, x + w - 1 do px(xx, yy, c) end end end

-- Metal shading across a round body: u is -1 at the left edge, +1 at the right; light from the top left.
local SILVER = { WHITE, SHADE, GREY3, GREY3, GREY2, GREY1 }
local REDS = { RED_HI, KIT_RED, RED, RED, TIN, RED2 }
local function shade(ramp, u)
  if u < -0.80 then return ramp[3] end                       -- the edge picks up the room
  if u < -0.50 then return ramp[1] end                       -- the shine
  if u < -0.15 then return ramp[2] end
  if u < 0.30 then return ramp[3] end
  if u < 0.68 then return ramp[5] end
  return ramp[6]
end

-- Fill a body of revolution: rows y0..y1 with a half-width hw(y) about cx (cx on a half pixel for even widths).
local function body(cx, y0, y1, hw, ramp, band)
  for y = y0, y1 do
    local h = hw(y)
    if h > 0 then
      for x = math.floor(cx - h + 0.5), math.floor(cx + h - 0.5) do
        local u = (x + 0.5 - cx) / h
        local r = (band and band(y)) or ramp
        px(x, y, shade(r, u))
      end
    end
  end
end

-- A 1 px outline around everything drawn inside the box (4-neighbours), in the outline colour.
local function outline(x0, y0, w, h)
  local add = {}
  for y = y0 - 1, y0 + h do for x = x0 - 1, x0 + w do
    if get(x, y) == 0 and (get(x - 1, y) ~= 0 or get(x + 1, y) ~= 0 or get(x, y - 1) ~= 0 or get(x, y + 1) ~= 0) then
      add[#add + 1] = { x, y }
    end
  end end
  for _, p in ipairs(add) do px(p[1], p[2], OUT) end
end

-- A handle: a ring on one side of the bowl, from (attach) out to reach, between rows ya and yb.
local function handle(cx, side, inner, reach, ya, yb, thick)
  local my, ry = (ya + yb) / 2, (yb - ya) / 2
  for y = ya, yb do
    local t = (y - my) / ry
    local outer = inner + (reach - inner) * math.sqrt(math.max(0, 1 - t * t))
    local inn = outer - thick
    for d = math.floor(inner), math.floor(outer) do
      if d >= inn - 0.5 or math.abs(t) > 0.82 then
        local x = side > 0 and math.floor(cx + d) or math.floor(cx - d - 1)
        if get(x, y) == 0 then
          local edge = d >= outer - 1
          local top = t < -0.3
          px(x, y, side < 0 and ((top and WHITE) or (edge and SHADE) or GREY3) or ((top and GREY3) or (edge and GREY1) or GREY2))
        end
      end
    end
  end
end

-- Turn the silver drawn in a box to gold (the cup is drawn in the neutrals, the band and plinth are left alone)
local function goldify(x0, y0, w, h)
  local map = { [WHITE] = WHITE, [SHADE] = GOLD_HI, [GREY3] = GOLD_LIGHT, [GREY2] = GOLD, [GREY1] = GOLD_DARK,
    [BLACK_HI] = GOLD_IN, [OUT] = OUT }
  for y = y0, y0 + h - 1 do for x = x0, x0 + w - 1 do
    local c = map[get(x, y)]
    if c then px(x, y, c) end
  end end
end

-- The big trophy: 64 x 84, top-left at ox, oy -------------------------------------------------------------------
local function bigTrophy(ox, oy)
  local cx = ox + 32
  -- handles first (behind the bowl's edge)
  handle(cx, -1, 17, 29, oy + 8, oy + 27, 3)
  handle(cx, 1, 17, 29, oy + 8, oy + 27, 3)
  -- the bowl: wide at the rim, narrowing to the neck
  local function bowl(y)
    local t = (y - (oy + 4)) / 31
    return 6 + 18 * (1 - t ^ 2.4)
  end
  body(cx, oy + 4, oy + 35, bowl, SILVER, function(y)
    if y >= oy + 13 and y <= oy + 19 then return REDS end
  end)
  -- the band's edges: a light line on top, a dark one under
  for x = cx - 24, cx + 24 do
    if get(x, oy + 13) ~= 0 then px(x, oy + 13, (x < cx - 6) and RED_HI or KIT_RED) end
    if get(x, oy + 19) ~= 0 then px(x, oy + 19, RED1) end
  end
  -- the rim: an ellipse seen from a little above, the inside dark
  for y = oy, oy + 6 do
    local t = (y - (oy + 3)) / 3.4
    local h = 24.5 * math.sqrt(math.max(0, 1 - t * t))
    for x = math.floor(cx - h + 0.5), math.floor(cx + h - 0.5) do
      local u = (x + 0.5 - cx) / h
      local rim = (t < -0.55) or (t > 0.62) or math.abs(u) > 0.9
      px(x, y, rim and ((u < -0.2 and WHITE) or (u < 0.5 and GREY3) or GREY2) or ((u < 0 and GREY1) or BLACK_HI))
    end
  end
  -- the neck, a knob, the stem flaring to the foot
  body(cx, oy + 36, oy + 39, function() return 4 end, SILVER)
  body(cx, oy + 40, oy + 43, function(y) return (y == oy + 40 or y == oy + 43) and 6 or 7 end, SILVER)
  body(cx, oy + 44, oy + 46, function() return 3.5 end, SILVER)
  body(cx, oy + 47, oy + 53, function(y) return 4 + (y - (oy + 47)) * 1.6 end, SILVER)
  body(cx, oy + 54, oy + 56, function() return 15 end, SILVER)
  for x = cx - 15, cx + 14 do px(x, oy + 54, (x < cx - 4) and WHITE or SHADE) end
  outline(ox, oy, 64, 57)
  goldify(ox, oy, 64, 57)
  -- the plinth: black, the top edge catching the light, a red plate with HOGG
  local py = oy + 58
  rect(ox + 9, py, 46, 26, OUT)
  rect(ox + 10, py + 1, 44, 24, BLACK)
  rect(ox + 10, py + 1, 44, 1, BLACK_HI)
  rect(ox + 10, py + 1, 1, 24, BLACK_HI)
  rect(ox + 16, py + 7, 32, 12, RED2)
  rect(ox + 17, py + 8, 30, 10, RED)
  rect(ox + 17, py + 8, 30, 1, KIT_RED)
  rect(ox + 17, py + 17, 30, 1, TIN)
  T.put(img, T.text("HOGG", 1, { fill = WHITE }), ox + 32 - 11, py + 9)
  rect(ox + 9, py + 25, 46, 1, OUT)
  return { x = ox, y = oy, w = 64, h = 84 }
end

-- The small trophy: 21 x 28, drawn by hand (the big one shrunk would blur) -------------------------------------
local SMALL = {
  "....ooooooooooooo....",
  "...owwwssggggg22o....",
  "oooowssbbbbbbbg2oooo.",
  "o.oowsssgggggg22oo.o.",
  "o.owwsssggggg2221o.o.",
  "o.orrkkRRRRRRttR2o.o.",
  "o.ohhkkRRRRRRRtt2o.o.",
  ".oowwsssgggg2221oo...",
  "...owsssggg2221o.....",
  "....owssggg221o......",
  ".....owsgg221o.......",
  "......owsg21o........",
  ".......osg2o.........",
  "......owsg21o........",
  ".......osg2o.........",
  ".......osg2o.........",
  "......owsgg2o........",
  ".....owssgg22o.......",
  "...ooooooooooooo.....",
  "...oBBBBBBBBBBBo.....",
  "...oBdrrrrrrrrdo.....",
  "...oBdRRRRRRRRdo.....",
  "...oBdrrrrrrrrdo.....",
  "...oBBBBBBBBBBBo.....",
  "...ooooooooooooo.....",
}
local KEY = { o = OUT, w = WHITE, s = SHADE, g = GREY3, ["2"] = GREY2, ["1"] = GREY1, b = BLACK_HI,
  r = KIT_RED, k = KIT_RED, R = RED, t = TIN, h = RED_HI, B = BLACK_HI, d = BLACK }
local function smallTrophy(ox, oy)
  for y, row in ipairs(SMALL) do
    for x = 1, #row do
      local c = KEY[row:sub(x, x)]
      if c then px(ox + x - 1, oy + y - 1, c) end
    end
  end
  goldify(ox, oy, #SMALL[1], 18)
  return { x = ox, y = oy, w = #SMALL[1], h = #SMALL }
end

local big = bigTrophy(2, 2)
local small = smallTrophy(72, 2)
slices[#slices + 1] = { name = "trophy", r = big, pivot = { 32, 83 } }
slices[#slices + 1] = { name = "trophy small", r = small, pivot = { 9, small.h - 1 } }

-- Sprite, slices, save -------------------------------------------------------------------------------------------
local spr = Sprite(W, H, ColorMode.INDEXED)
spr:setPalette(P.asepritePalette(pal))
spr.transparentColor = 0
spr.layers[1].name = "tournament"
spr:newCel(spr.layers[1], 1, img, Point(0, 0))
for _, s in ipairs(slices) do
  local sl = spr:newSlice(Rectangle(s.r.x, s.r.y, s.r.w, s.r.h))
  sl.name = s.name
  if s.pivot then sl.pivot = Point(s.pivot[1], s.pivot[2]) end
end
spr:saveAs(R .. "art/ui/tournament.aseprite")

-- Preview: both trophies at 1x and 4x on the dark panel colour
local PW, PH = 128 * 5 + 16, 100 * 4 + 8
local pv = Image(PW, PH, ColorMode.RGB)
local bg = pal[BLACK]
pv:clear(app.pixelColor.rgba(bg[1], bg[2], bg[3], 255))
local function blit(scale, dx, dy)
  for y = 0, H - 1 do for x = 0, W - 1 do
    local c = img:getPixel(x, y)
    if c ~= 0 then
      local p = pal[c]
      local v = app.pixelColor.rgba(p[1], p[2], p[3], 255)
      for yy = 0, scale - 1 do for xx = 0, scale - 1 do pv:drawPixel(dx + x * scale + xx, dy + y * scale + yy, v) end end
    end
  end end
end
blit(1, 4, 4)
blit(4, 136, 4)
pv:saveAs(R .. "art/mockups/a12-trophy.png")
print("tournament sheet " .. W .. "x" .. H .. ", " .. #slices .. " slices")
