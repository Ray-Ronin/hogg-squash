-- A13 build: Mr. Sells's concept, cleaned to a ready frame from the back and the front at the 100 px scale
-- (he is 96 px head to soles), his red spirit tee moved into its own palette entries, the prints redrawn by hand,
-- and the owner's previews in both kits (the black P2 / CPU tee made by the planned `kit` swap below).
-- Run in Aseprite (batch): Aseprite.exe -b --script "C:/Hogg Squash/hogg-squash/art/tools/a13-build.lua"
-- Sources: art/spritecook/a13/back-4.png and front-2.png (art/spritecook-manifest.md, A13).

local L = dofile("C:/Hogg Squash/hogg-squash/art/tools/pixel-lib.lua")
local R = L.ROOT
local pal = L.loadPalette(R .. "art/palette/hogg-squash.gpl")
local I = function(n) return L.paletteIndex(pal, n) end

local HEIGHT = 96           -- head to soles; the others are 100 (plan-v3.md, A13 "Agreed with the owner")
local FRAME, PIVOT_X, PIVOT_Y = 150, 73, 148   -- player-100's frame and `feet` pivot

local SD, SR, SL = I("shirt red shade (A13)"), I("shirt red (A13)"), I("shirt red light (A13)")
local O, W = I("outline"), I("white")

-- Colours the cleaner may pick: neutrals, reds, the fair end of the skin ramp (skin 4 to 7) and hair.
-- The shirt entries are never picked by the cleaner; the shirt mask below assigns them.
local ALLOW = {}
for _, n in ipairs({ "outline", "black kit", "black kit light", "grey 1", "grey 2", "grey 3", "side wall",
  "white kit shade", "front wall", "white", "red 1 (deepest)", "red 2", "tin", "Hogg red (court lines)", "kit red",
  "red highlight", "skin 4", "skin 5", "skin 6 (highlight)", "skin 7 (light, S15)",
  "hair dark", "hair" }) do ALLOW[I(n)] = true end

-- The planned P2 / CPU `kit` swap for A14's roster entry: the tee turns black (its two store colours), the print,
-- shorts, socks and shoes are untouched (they don't use these entries).
local KIT = {
  { "shirt red shade (A13)", "black kit" },
  { "shirt red (A13)", "black kit light" },
  { "shirt red light (A13)", "grey 1" },
}
local KITMAP = {}
for _, p in ipairs(KIT) do KITMAP[I(p[1])] = I(p[2]) end
local function hex(c) return string.format("#%02x%02x%02x", c[1], c[2], c[3]) end
local kitJson = {}
for _, p in ipairs(KIT) do kitJson[#kitJson + 1] = string.format('["%s", "%s"]', hex(pal[I(p[1])]), hex(pal[I(p[2])])) end
print("kit: [" .. table.concat(kitJson, ", ") .. "]")

local function clean(file)
  local src = L.loadSource(R .. "art/spritecook/a13/" .. file)
  local q = L.quantize(pal, L.areaResize(src, HEIGHT), 0.5, ALLOW)
  L.despeckle(q)
  L.smoothLone(q, { [O] = true })
  L.outline(q, O)
  L.despeckle(q)
  return q
end

-- Inside the shirt (a box minus the arms), the generator's reds become the tee's own three entries.
-- Outline pixels stay outline (the creases and the arm lines), except small closed creases (below).
local TO_SHIRT = {
  [I("red 1 (deepest)")] = SD, [I("red 2")] = SD, [I("tin")] = SD,
  [I("Hogg red (court lines)")] = SR, [I("kit red")] = SR, [I("red highlight")] = SL,
}
local function inRect(x, y, r) return x >= r[1] and x <= r[3] and y >= r[2] and y <= r[4] end
local function shirt(q, box, holes)
  local function inShirt(x, y)
    if not inRect(x, y, box) then return false end
    for _, h in ipairs(holes) do if inRect(x, y, h) then return false end end
    return true
  end
  for y = box[2], box[4] do for x = box[1], box[3] do
    local c = q.px[y][x]
    if inShirt(x, y) and TO_SHIRT[c] then q.px[y][x] = TO_SHIRT[c] end
  end end
  -- Outline-coloured specks inside the shirt (8-connected clusters of 3 px or fewer that touch no background)
  -- become shirt shade, so the tee reads as cloth, not dirt.
  local seen = {}
  for y = 0, q.h - 1 do seen[y] = {} end
  for y = box[2], box[4] - 2 do for x = box[1], box[3] do
    if q.px[y][x] == O and not seen[y][x] and inShirt(x, y) then
      local list, stack, open = {}, { { x, y } }, false
      seen[y][x] = true
      while #stack > 0 do
        local p = table.remove(stack)
        list[#list + 1] = p
        for dy = -1, 1 do for dx = -1, 1 do
          local nx, ny = p[1] + dx, p[2] + dy
          local c = L.at(q, nx, ny)
          if c == 0 then open = true
          elseif c == O and not seen[ny][nx] then
            seen[ny][nx] = true
            stack[#stack + 1] = { nx, ny }
          end
        end end
      end
      local inside = true
      for _, p in ipairs(list) do if not inShirt(p[1], p[2]) then inside = false end end
      if not open and inside and #list <= 3 then
        for _, p in ipairs(list) do q.px[p[2]][p[1]] = SD end
      end
    end
  end end
end

-- Clear a print area to plain shirt red, then stamp a pattern at (x, y); `ring` (optional) draws a 1 px
-- ring of that colour around the stamped pixels, over the shirt only.
local function clear(q, r)
  for y = r[2], r[4] do for x = r[1], r[3] do
    if q.px[y][x] ~= 0 then q.px[y][x] = SR end
  end end
end
local SHIRT = { [SD] = true, [SR] = true, [SL] = true }
local function stamp(q, x, y, rows, key, ring)
  local put = {}
  for dy, row in ipairs(rows) do
    for dx = 1, #row do
      local k = row:sub(dx, dx)
      if key[k] then
        q.px[y + dy - 1][x + dx - 1] = key[k]
        put[#put + 1] = { x + dx - 1, y + dy - 1 }
      end
    end
  end
  if ring then
    for _, p in ipairs(put) do
      for dy = -1, 1 do for dx = -1, 1 do
        local nx, ny = p[1] + dx, p[2] + dy
        if SHIRT[L.at(q, nx, ny)] then q.px[ny][nx] = ring end
      end end
    end
  end
end

---------------------------------------------------------------- the back (concept 4)
local back = clean("back-4.png")          -- 68 x 96
-- No arm holes: the arms are skin, never red. Only the racket's red rim (top right) is kept out.
shirt(back, { 9, 16, 58, 49 }, { { 55, 0, 67, 27 } })
-- The print, simplified to what reads at sprite size: SELLS in 3 x 5 white capitals with a black outline across
-- the shoulders, and a small dark red boar's head facing right under it, ringed in white like the front's.
clear(back, { 23, 19, 45, 34 })
local GLYPH5 = {
  S = { "PPP", "P..", "PPP", "..P", "PPP" },
  E = { "PPP", "P..", "PP.", "P..", "PPP" },
  L = { "P..", "P..", "P..", "P..", "PPP" },
}
local name = "SELLS"
for i = 1, #name do stamp(back, 25 + (i - 1) * 4, 20, GLYPH5[name:sub(i, i)], { P = W }, O) end
stamp(back, 31, 28, {
  "b.b....",
  "eeee...",
  "efoeee.",
  "beeeeee",
  ".bbeew.",
  "...b...",
}, { e = I("red 2"), b = I("red 1 (deepest)"), f = I("kit red"), w = W, o = O }, W)

---------------------------------------------------------------- the front (front concept 2)
local front = clean("front-2.png")        -- 66 x 96
-- No arm holes (the arms are skin); only the racket's red rim (top left) is kept out.
shirt(front, { 12, 16, 56, 48 }, { { 0, 0, 15, 24 } })
-- The store print, simplified: a dark red boar standing side-on (facing left), HOGG in 3 x 4 dark red capitals
-- ringed in white, and MIDDLE SCHOOL as a broken white line under it.
clear(front, { 24, 21, 42, 36 })
local BOAR = { b = I("red 2"), d = I("red 1 (deepest)"), e = I("kit red"), o = O }
stamp(front, 29, 22, {
  ".bb......",
  "boebbbbb.",
  "bbbbbbbbb",
  ".dbbbbbd.",
  ".d.d..d.d",
}, BOAR, W)
local GLYPH4 = {
  H = { "P.P", "PPP", "P.P", "P.P" },
  O = { "PPP", "P.P", "P.P", "PPP" },
  G = { "PPP", "P..", "P.P", "PPP" },
}
local word = "HOGG"
for i = 1, #word do stamp(front, 26 + (i - 1) * 4, 29, GLYPH4[word:sub(i, i)], { P = I("red 2") }, W) end
stamp(front, 27, 35, { "wwwwww.wwwwww" }, { w = W })

---------------------------------------------------------------- checks
local function count(q, idx)
  local n = 0
  for y = 0, q.h - 1 do for x = 0, q.w - 1 do if q.px[y][x] == idx then n = n + 1 end end end
  return n
end
for nm, q in pairs({ back = back, front = front }) do
  local _, miny, _, maxy = L.bounds(q)
  print(string.format("%s: %d x %d, %d px tall; shirt shade %d, red %d, light %d", nm, q.w, q.h, maxy - miny + 1,
    count(q, SD), count(q, SR), count(q, SL)))
end

---------------------------------------------------------------- art/character/sells.aseprite
-- 150 x 150 frames like player-100: frame 1 `ready` (the back), frame 2 `front_ready` (the front), one `feet`
-- slice with its pivot on the ground point. A14 builds the full sheet on this.
local function placeAt(q)
  local fx, fy = L.feetX(q)
  return math.floor(PIVOT_X - fx + 0.5), PIVOT_Y - fy
end
do
  local spr = Sprite(FRAME, FRAME, ColorMode.INDEXED)
  spr:setPalette(L.asepritePalette(pal))
  spr.transparentColor = 0
  spr.layers[1].name = "sells"
  spr:newEmptyFrame(2)
  for f, q in ipairs({ back, front }) do
    local img = Image(FRAME, FRAME, ColorMode.INDEXED)
    local ox, oy = placeAt(q)
    for y = 0, q.h - 1 do for x = 0, q.w - 1 do
      if q.px[y][x] ~= 0 then img:drawPixel(ox + x, oy + y, q.px[y][x]) end
    end end
    spr:newCel(spr.layers[1], f, img, Point(0, 0))
    spr.frames[f].duration = 0.125
  end
  local t1 = spr:newTag(1, 1); t1.name = "ready"
  local t2 = spr:newTag(2, 2); t2.name = "front_ready"
  local slice = spr:newSlice(Rectangle(PIVOT_X - 8, PIVOT_Y - 3, 16, 4))
  slice.name = "feet"
  slice.pivot = Point(8, 3)
  spr:saveAs(R .. "art/character/sells.aseprite")
  spr:close()
end

---------------------------------------------------------------- previews
local pc = app.pixelColor
local function rgb(r, g, b) return pc.rgba(r, g, b, 255) end

local function saveScaled(img, path, s)
  local spr = Sprite(img.width, img.height, ColorMode.RGB)
  spr.cels[1].image = img
  spr:resize(img.width * s, img.height * s)
  spr:saveAs(path)
  spr:close()
end

local function crop(q, r)
  local o = { w = r[3] - r[1] + 1, h = r[4] - r[2] + 1, px = {} }
  for y = 0, o.h - 1 do
    o.px[y] = {}
    for x = 0, o.w - 1 do o.px[y][x] = q.px[r[2] + y][r[1] + x] end
  end
  return o
end

-- a13-print.png: 4x close-up of the tee, back and front, P1 (red) then P2 / CPU (black).
do
  local panels = {
    crop(back, { 9, 14, 58, 50 }), crop(L.remap(back, KITMAP), { 9, 14, 58, 50 }),
    crop(front, { 10, 14, 58, 50 }), crop(L.remap(front, KITMAP), { 10, 14, 58, 50 }),
  }
  local gap, Wd = 6, 6
  for _, p in ipairs(panels) do Wd = Wd + p.w + gap end
  local img = Image(Wd, 37 + 12, ColorMode.RGB)
  img:clear(rgb(223, 189, 140))
  local x = gap
  for _, p in ipairs(panels) do
    L.blit(img, pal, p, x, 6)
    x = x + p.w + gap
  end
  saveScaled(img, R .. "art/mockups/a13-print.png", 4)
end

-- Coach Zain's `ready` and `front_ready` first frames from his sheet's source (indices match: the palette only grew).
local function zainFrames()
  local spr = app.open(R .. "art/character/zain.aseprite")
  local out = {}
  for _, tag in ipairs(spr.tags) do
    if tag.name == "ready" or tag.name == "front_ready" then
      local cel = spr.layers[1]:cel(tag.fromFrame.frameNumber)
      local q = { w = FRAME, h = FRAME, px = {} }
      for y = 0, FRAME - 1 do
        q.px[y] = {}
        for x = 0, FRAME - 1 do
          local sx, sy = x - cel.position.x, y - cel.position.y
          local img = cel.image
          q.px[y][x] = (sx >= 0 and sy >= 0 and sx < img.width and sy < img.height) and img:getPixel(sx, sy) or 0
        end
      end
      out[tag.name] = q
    end
  end
  spr:close()
  return out
end
local ZKIT = {
  [I("shirt black (A7z)")] = I("white kit shade"), [I("shirt black light (A7z)")] = I("white"),
  [I("shirt print (A7z)")] = I("black kit"),
}

-- a13-sells.png: on the court at the art's own size (106 px for Zain, 96 for Sells),
-- top: from the back (Zain P1, Sells P1, Sells P2, Zain P2); bottom: the same from the front.
do
  local cspr = app.open(R .. "public/hogg-squash/assets/court.png")
  app.command.ChangePixelFormat { format = "rgb" }
  local court = Image(640, 360, ColorMode.RGB)
  court:drawImage(cspr.cels[1].image, cspr.cels[1].position)
  cspr:close()
  local z = zainFrames()
  local function place(img, q, gx, gy)
    local fx, fy = L.feetX(q)
    L.blit(img, pal, q, math.floor(gx - fx + 0.5), gy - fy)
  end
  local img = Image(640, 720, ColorMode.RGB)
  for row, pair in ipairs({ { back, z.ready }, { front, z.front_ready } }) do
    local panel = Image(640, 360, ColorMode.RGB)
    panel:drawImage(court, Point(0, 0))
    local gy = 336
    place(panel, pair[2], 190, gy)
    place(panel, pair[1], 270, gy)
    place(panel, L.remap(pair[1], KITMAP), 370, gy)
    place(panel, L.remap(pair[2], ZKIT), 450, gy)
    img:drawImage(panel, Point(0, (row - 1) * 360))
  end
  saveScaled(img, R .. "art/mockups/a13-sells.png", 2)
end

print("A13 build done")
