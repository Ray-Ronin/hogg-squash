-- A7z build: Coach Zain's concept, cleaned to a ready frame from the back and the front at the 100 px scale
-- (he is 106 px head to soles), his shirt moved into its own palette entries, the prints redrawn by hand,
-- and the owner's previews in both kits (the white kit made by the planned `kit` swap below).
-- Run in Aseprite (batch): dofile("C:/Hogg Squash/hogg-squash/art/tools/a7z-build.lua")
-- Sources: art/spritecook/a7z/back-3.png and front-1.png (art/spritecook-manifest.md, A7z).

local L = dofile("C:/Hogg Squash/hogg-squash/art/tools/pixel-lib.lua")
local R = L.ROOT
local pal = L.loadPalette(R .. "art/palette/hogg-squash.gpl")
local I = function(n) return L.paletteIndex(pal, n) end

local HEIGHT = 106          -- head to soles; the others are 100 (plan-v2.md, "Finalized characters")
local FRAME, PIVOT_X, PIVOT_Y = 150, 73, 148   -- player-100's frame and `feet` pivot

local SB, SBL, SP = I("shirt black (A7z)"), I("shirt black light (A7z)"), I("shirt print (A7z)")
local O = I("outline")

-- Colours the cleaner may pick: neutrals, reds, Zain's skin ramp (skin 0, 1, 2, 2b, 3, 4) and hair.
-- The shirt entries are never picked by the cleaner; the shirt mask below assigns them.
local ALLOW = {}
for _, n in ipairs({ "outline", "black kit", "black kit light", "grey 1", "grey 2", "grey 3", "side wall",
  "white kit shade", "front wall", "white", "red 1 (deepest)", "red 2", "tin", "Hogg red (court lines)", "kit red",
  "red highlight", "skin 0 (deepest, A7z)", "skin 1 (deepest)", "skin 2", "skin 2b (A7z)", "skin 3", "skin 4",
  "hair dark", "hair" }) do ALLOW[I(n)] = true end

-- The planned P2 / CPU `kit` swap for S15b: the shirt turns white, its print black; the red stays red, and the
-- shorts, socks and shoes are untouched (they don't use these entries).
local KIT = {
  { "shirt black (A7z)", "white kit shade" },
  { "shirt black light (A7z)", "white" },
  { "shirt print (A7z)", "black kit" },
}
local KITMAP = {}
for _, p in ipairs(KIT) do KITMAP[I(p[1])] = I(p[2]) end

-- The standard swap (art-style-guide.md §2), for Ronin's white kit in the previews.
local SWAP = {
  [I("red 1 (deepest)")] = I("grey 1"), [I("red 2")] = I("grey 2"), [I("tin")] = I("grey 3"),
  [I("Hogg red (court lines)")] = I("white kit shade"), [I("kit red")] = I("front wall"), [I("red highlight")] = I("white"),
}

-- `widthScale` (optional, < 1) narrows the figure: the source is squeezed sideways before the usual
-- downscale, so the height stays HEIGHT (the owner's call: the front view a little slimmer, same image).
local function squeeze(src, k)
  local w = math.max(1, math.floor(src.w * k + 0.5))
  local o = { w = w, h = src.h, px = {} }
  local sx = src.w / w
  for y = 0, src.h - 1 do
    o.px[y] = {}
    for tx = 0, w - 1 do
      local x0, x1 = tx * sx, (tx + 1) * sx
      local r, g, b, a, area = 0, 0, 0, 0, 0
      for xx = math.floor(x0), math.min(src.w - 1, math.ceil(x1) - 1) do
        local wgt = math.min(x1, xx + 1) - math.max(x0, xx)
        local p = src.px[y][xx]
        local al = p[4] / 255
        r = r + p[1] * al * wgt; g = g + p[2] * al * wgt; b = b + p[3] * al * wgt
        a = a + al * wgt; area = area + wgt
      end
      if a / area >= 0.5 then o.px[y][tx] = { r / a, g / a, b / a, 255 }
      else o.px[y][tx] = { 0, 0, 0, 0 } end
    end
  end
  return o
end

local function clean(file, widthScale)
  local src = L.loadSource(R .. "art/spritecook/a7z/" .. file)
  if widthScale then src = squeeze(src, widthScale) end
  local q = L.quantize(pal, L.areaResize(src, HEIGHT), 0.5, ALLOW)
  L.despeckle(q)
  L.smoothLone(q, { [O] = true })
  L.outline(q, O)
  L.despeckle(q)
  return q
end

-- Inside the shirt (a box minus the arms and neck), the generator's blacks become the shirt's own two entries:
-- black kit and the dark shadows (hair dark) -> shirt black; black kit light and grey 1 highlights -> shirt black light.
-- Outline pixels stay outline (the creases and the arm lines).
local TO_SHIRT = { [I("black kit")] = SB, [I("hair dark")] = SB, [I("black kit light")] = SBL, [I("grey 1")] = SBL }
local function inRect(x, y, r) return x >= r[1] and x <= r[3] and y >= r[2] and y <= r[4] end
local function shirt(q, box, holes, creaseRows)
  local function inShirt(x, y)
    if not inRect(x, y, box) then return false end
    for _, h in ipairs(holes) do if inRect(x, y, h) then return false end end
    return true
  end
  for y = box[2], box[4] do for x = box[1], box[3] do
    local c = q.px[y][x]
    if inShirt(x, y) and TO_SHIRT[c] then q.px[y][x] = TO_SHIRT[c] end
  end end
  -- Small outline-coloured creases inside the shirt (8-connected clusters of 4 px or fewer that touch no
  -- background) become shirt black, or the white kit would show them as black specks. The arm gaps touch the
  -- background and the hem line is below `creaseRows`, so both stay.
  local seen = {}
  for y = 0, q.h - 1 do seen[y] = {} end
  for y = box[2], creaseRows do for x = box[1], box[3] do
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
      for _, p in ipairs(list) do if not inShirt(p[1], p[2]) or p[2] > creaseRows then inside = false end end
      if not open and inside and #list <= 4 then
        for _, p in ipairs(list) do q.px[p[2]][p[1]] = SB end
      end
    end
  end end
end

-- Clear a print area to plain shirt black (keeping outline pixels), then draw rows of a pattern at (x, y).
local function clear(q, r)
  for y = r[2], r[4] do for x = r[1], r[3] do
    if q.px[y][x] ~= 0 and q.px[y][x] ~= O then q.px[y][x] = SB end
  end end
end
local function stamp(q, x, y, rows, key)
  for dy, row in ipairs(rows) do
    for dx = 1, #row do
      local k = row:sub(dx, dx)
      if key[k] then q.px[y + dy - 1][x + dx - 1] = key[k] end
    end
  end
end

---------------------------------------------------------------- the back (concept 3)
local back = clean("back-3.png")          -- 58 x 106
shirt(back, { 11, 18, 43, 49 }, { { 0, 33, 16, 49 }, { 38, 35, 57, 49 } }, 46)
-- The print, simplified to what reads at sprite size: a red boar's head facing right between the shoulder blades,
-- over SQUASH running down the spine in 3 x 3 capitals (the shirt is 31 rows from collar to hem, so 4-row
-- letters and the boar don't both fit).
clear(back, { 22, 19, 31, 48 })
local BK = { e = I("kit red"), b = I("red 2"), f = I("red highlight"), w = I("white"), o = O, P = SP }
stamp(back, 24, 19, {
  "b.b....",
  "eeee...",
  "efoeee.",
  "beeeeee",
  ".bbeew.",
  "...b...",
}, BK)
local GLYPH = {
  S = { ".PP", ".P.", "PP." }, Q = { ".P.", "P.P", ".PP" }, U = { "P.P", "P.P", "PPP" },
  A = { ".P.", "PPP", "P.P" }, H = { "P.P", "PPP", "P.P" },
}
local word = "SQUASH"
for i = 1, #word do stamp(back, 26, 26 + (i - 1) * 4, GLYPH[word:sub(i, i)], BK) end

---------------------------------------------------------------- the front (front concept 1)
local front = clean("front-1.png", 0.9)   -- 62 x 106: squeezed to 90% width, the owner's call (slimmer, like the back)
shirt(front, { 15, 18, 50, 47 }, { { 27, 18, 34, 23 }, { 0, 34, 19, 47 }, { 44, 35, 61, 47 } }, 44)
-- "HOGG" (white) over "SQUASH TEAM" (red), small on his left chest: four letter blocks over two red lines.
clear(front, { 30, 27, 41, 33 })
stamp(front, 30, 28, {
  "PP.PP.PP.PP",
  "PP.PP.PP.PP",
  ".eeeeeeeee.",
  "...dddd....",
}, { P = SP, e = I("kit red"), d = I("Hogg red (court lines)") })

---------------------------------------------------------------- checks
-- The shirt entries must stay inside the shirt: none in the head, the arms' skin, the shorts or the racket.
local function count(q, idx)
  local n = 0
  for y = 0, q.h - 1 do for x = 0, q.w - 1 do if q.px[y][x] == idx then n = n + 1 end end end
  return n
end
for name, q in pairs({ back = back, front = front }) do
  local _, miny, _, maxy = L.bounds(q)
  print(string.format("%s: %d x %d, %d px tall; shirt black %d, light %d, print %d", name, q.w, q.h, maxy - miny + 1,
    count(q, SB), count(q, SBL), count(q, SP)))
end

---------------------------------------------------------------- art/character/zain.aseprite
-- 150 x 150 frames like player-100: frame 1 `ready` (the back), frame 2 `front_ready` (the front), one `feet`
-- slice with its pivot on the ground point. A8z builds the full sheet on this.
local function placeAt(q)
  local fx, fy = L.feetX(q)
  return math.floor(PIVOT_X - fx + 0.5), PIVOT_Y - fy
end
do
  local spr = Sprite(FRAME, FRAME, ColorMode.INDEXED)
  spr:setPalette(L.asepritePalette(pal))
  spr.transparentColor = 0
  spr.layers[1].name = "zain"
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
  spr:saveAs(R .. "art/character/zain.aseprite")
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

-- a7z-print.png: 4x close-up of the shirt, back and front, P1 then P2 / CPU.
do
  local panels = {
    crop(back, { 9, 14, 46, 52 }), crop(L.remap(back, KITMAP), { 9, 14, 46, 52 }),
    crop(front, { 12, 14, 52, 52 }), crop(L.remap(front, KITMAP), { 12, 14, 52, 52 }),
  }
  local gap, W = 6, 6
  for _, p in ipairs(panels) do W = W + p.w + gap end
  local img = Image(W, 39 + 12, ColorMode.RGB)
  img:clear(rgb(223, 189, 140))
  local x = gap
  for _, p in ipairs(panels) do
    L.blit(img, pal, p, x, 6)
    x = x + p.w + gap
  end
  saveScaled(img, R .. "art/mockups/a7z-print.png", 4)
end

-- Ronin's ready frame (player-100 frame 1 with his S15 recolour: skin everywhere, hair on the head only).
local function ronin()
  local spr = app.open(R .. "public/hogg-squash/assets/player-100.png")
  app.command.ChangePixelFormat { format = "rgb" }
  local cel = spr.cels[1]
  local src = cel.image
  local byRgb = {}
  for i, c in ipairs(pal) do byRgb[c[1] * 65536 + c[2] * 256 + c[3]] = i end
  local q = { w = FRAME, h = FRAME, px = {} }
  for y = 0, FRAME - 1 do
    q.px[y] = {}
    for x = 0, FRAME - 1 do
      local sx, sy = x - cel.position.x, y - cel.position.y
      local v = (sx >= 0 and sy >= 0 and sx < src.width and sy < src.height) and src:getPixel(sx, sy) or 0
      if pc.rgbaA(v) < 128 then q.px[y][x] = 0
      else
        local key = pc.rgbaR(v) * 65536 + pc.rgbaG(v) * 256 + pc.rgbaB(v)
        q.px[y][x] = byRgb[key] or L.nearest(pal, pc.rgbaR(v), pc.rgbaG(v), pc.rgbaB(v))
      end
    end
  end
  spr:close()
  local skin = {
    [I("skin 6 (highlight)")] = I("skin 7 (light, S15)"), [I("skin 5")] = I("skin 6 (highlight)"),
    [I("skin 4")] = I("skin 5"), [I("skin 3")] = I("skin 4"), [I("skin 2")] = I("skin 3"),
    [I("skin 1 (deepest)")] = I("skin 2"),
  }
  q = L.remap(q, skin)
  local hair = { [I("hair")] = I("hair auburn (S15)"), [I("hair dark")] = I("hair auburn dark (S15)") }
  -- the largest 8-connected blob of the two hair colours is the head
  local seen, best = {}, {}
  for y = 0, FRAME - 1 do seen[y] = {} end
  for y = 0, FRAME - 1 do for x = 0, FRAME - 1 do
    if hair[q.px[y][x]] and not seen[y][x] then
      local list, stack = {}, { { x, y } }
      seen[y][x] = true
      while #stack > 0 do
        local p = table.remove(stack)
        list[#list + 1] = p
        for dy = -1, 1 do for dx = -1, 1 do
          local nx, ny = p[1] + dx, p[2] + dy
          if nx >= 0 and ny >= 0 and nx < FRAME and ny < FRAME and not seen[ny][nx] and hair[q.px[ny][nx]] then
            seen[ny][nx] = true
            stack[#stack + 1] = { nx, ny }
          end
        end end
      end
      if #list > #best then best = list end
    end
  end end
  for _, p in ipairs(best) do q.px[p[2]][p[1]] = hair[q.px[p[2]][p[1]]] end
  return q
end

-- a7z-zain.png: on the court at the art's own size (100 px for Ronin, 106 for Zain: the back of the court),
-- top: from the back (Ronin P1, Zain P1, Zain P2, Ronin P2); bottom: Zain from the front beside Ronin from the back.
do
  local cspr = app.open(R .. "public/hogg-squash/assets/court.png")   -- indexed: convert so its colours come with it
  app.command.ChangePixelFormat { format = "rgb" }
  local court = Image(640, 360, ColorMode.RGB)
  court:drawImage(cspr.cels[1].image, cspr.cels[1].position)
  cspr:close()
  local rq = ronin()
  local function place(img, q, gx, gy)
    local fx, fy = L.feetX(q)
    L.blit(img, pal, q, math.floor(gx - fx + 0.5), gy - fy)
  end
  local img = Image(640, 720, ColorMode.RGB)
  for row, zain in ipairs({ back, front }) do
    local oy = (row - 1) * 360
    local panel = Image(640, 360, ColorMode.RGB)
    panel:drawImage(court, Point(0, 0))
    local gy = 336
    place(panel, rq, 200, gy)
    place(panel, zain, 270, gy)
    place(panel, L.remap(zain, KITMAP), 370, gy)
    place(panel, L.remap(rq, SWAP), 440, gy)
    img:drawImage(panel, Point(0, oy))
  end
  saveScaled(img, R .. "art/mockups/a7z-zain.png", 2)
end

print("A7z build done")
