-- A14 build: Mr. Sells's full sheet, with his trombone, from the SpriteCook animations (art/spritecook/a14/trombone/), to player-100's contract
-- plus an 8-frame front_ready. Writes art/character/sells.aseprite (replacing A13's two-frame concept; its prints
-- live on in art/tools/a14-print.lua); export with art/tools/a14-export.sh, previews with art/tools/a14-preview.lua.
-- Run: Aseprite -b --script "C:/Hogg Squash/hogg-squash/art/tools/a14-build.lua"
--
-- Every file is read at its own scale (96 px head to soles for its source pose, frame 1), as in a8z-build.lua. In
-- each frame the tee is found as the big patches of red (not the racket's rim, not the shoe trim) and moved into its
-- own three entries, so the black P2 / CPU tee only changes the tee. A13's hand-drawn print is then stamped afresh at
-- the tee's anchor (its centre column and top), so it doesn't shimmer. The dive's frames keep the generator's print.

local L = dofile("C:/Hogg Squash/hogg-squash/art/tools/pixel-lib.lua")
local A = dofile("C:/Hogg Squash/hogg-squash/art/tools/a14-lib.lua")
local PRINT = dofile("C:/Hogg Squash/hogg-squash/art/tools/a14-print.lua")
local R = L.ROOT
local pal = L.loadPalette(R .. "art/palette/hogg-squash.gpl")
local I = function(n) return L.paletteIndex(pal, n) end
local S = A.indices(pal)
local O = S.O

local HEIGHT = 96
local FRAME, PIVOT_X, PIVOT_Y = 150, 73, 148

-- as a13-build.lua: neutrals, reds, the fair end of the skin ramp and hair (the tee entries come from the mask)
local ALLOW = {}
for _, n in ipairs({ "outline", "black kit", "black kit light", "grey 1", "grey 2", "grey 3", "side wall",
  "white kit shade", "front wall", "white", "red 1 (deepest)", "red 2", "tin", "Hogg red (court lines)", "kit red",
  "red highlight", "skin 4", "skin 5", "skin 6 (highlight)", "skin 7 (light, S15)",
  "hair dark", "hair" }) do ALLOW[I(n)] = true end

-- The trombone (the owner's call, 2026-11-23: he plays with a trombone, not a racket). The animator squeezes every
-- frame into about 22 colours, so most of the brass shares its colours with his skin. One colour, a dark brass brown
-- (about 95, 70, 32, its own in each file), is on the trombone only: it seeds the mask, which then takes the skin-like, light and dark-brown
-- pixels with a seed within BRASS_REACH source pixels on both sides (a tube's middle between its dark edges; a face
-- beside the bell has brass on one side only). In the cleaned frame those pixels go onto A12's trophy gold
-- (art/tools/a12-tournament.lua, `goldify`) by brightness, so his skin elsewhere never turns gold.
local BRASS_REACH = 5
local GOLDRAMP = {   -- { brightness at least, palette entry }, lightest first
  { 215, I("flash") }, { 170, I("hair blond (S15)") }, { 135, I("flash shade") }, { 95, I("hair blond dark (S15)") },
  { 40, I("hair auburn dark (S15)") }, { 0, I("outline") },
}
local GOLDIDX = {}
for _, g in ipairs(GOLDRAMP) do if g[2] ~= I("outline") then GOLDIDX[g[2]] = true end end
-- Each file has its own palette, so the seed is any brass hue (26-60 degrees, saturation 0.4 or more): every file's
-- dark brass brown (about 95, 70, 32) and, in some, real golds. Skin, hair and the beard sit at 11-25 degrees.
local function isSeed(p)
  if p[4] < 128 then return false end
  local r, g, b = p[1], p[2], p[3]
  local mx, mn = math.max(r, g, b), math.min(r, g, b)
  if mx ~= r or mx == mn then return false end
  local h = 60 * ((g - b) / (mx - mn))
  return h >= 26 and h <= 60 and (mx - mn) / mx >= 0.4
end
local function brassLike(p)
  if p[4] < 128 then return false end
  local r, g, b = p[1], p[2], p[3]
  if r - g < -10 then return false end              -- not the greys' blue-ish tints
  if r > 150 and g < 60 then return false end        -- not the shirt's reds
  return true
end
-- front: true for the front view, where the trombone is always on the left of the picture; there the mask stops
-- left of his chest (40% of the way from the shirt's left edge to its middle), since his glasses, beard and the
-- chest print have brass-like browns too.
local function brassMask(src, front)
  local xmax = src.w
  if front then
    local sx, n, minx = 0, 0, src.w
    for y = 0, src.h - 1 do for x = 0, src.w - 1 do
      local p = src.px[y][x]
      if p[4] >= 128 and p[1] > 150 and p[2] < 60 then sx = sx + x; n = n + 1; minx = math.min(minx, x) end
    end end
    if n > 0 then xmax = minx + (sx / n - minx) * 0.4 end
  end
  local seed = {}
  for y = 0, src.h - 1 do
    seed[y] = {}
    for x = 0, src.w - 1 do seed[y][x] = x < xmax and isSeed(src.px[y][x]) end
  end
  local function seedAt(x, y) return x >= 0 and y >= 0 and x < src.w and y < src.h and seed[y][x] end
  -- is there a seed within BRASS_REACH steps of (x, y) going (dx, dy)?
  local function ray(x, y, dx, dy)
    for i = 1, BRASS_REACH do if seedAt(x + dx * i, y + dy * i) then return true end end
    return false
  end
  local m = {}
  for y = 0, src.h - 1 do
    m[y] = {}
    for x = 0, src.w - 1 do
      if seed[y][x] then m[y][x] = true
      elseif x < xmax and brassLike(src.px[y][x]) then
        -- sandwiched between brass, as a tube's light middle is between its dark edges
        if (ray(x, y, -1, 0) and ray(x, y, 1, 0)) or (ray(x, y, 0, -1) and ray(x, y, 0, 1))
          or (ray(x, y, -1, -1) and ray(x, y, 1, 1)) or (ray(x, y, 1, -1) and ray(x, y, -1, 1)) then
          m[y][x] = true
        end
      end
    end
  end
  return m
end

---------------------------------------------------------------- the tags
-- `f` lists { file, source frame (1-based) }. Which frames, and why: art/spritecook-manifest.md, A14.
local SWINGMS = { 40, 40, 42, 39, 38, 38, 38, 39 }
local function seq(file, list)
  local o = {}
  for _, f in ipairs(list) do o[#o + 1] = { file, f } end
  return o
end
local TAGS = {
  { name = "ready", f = seq("ready", { 1, 2, 3, 4, 5, 6, 7, 8 }), ms = { 125 } },
  { name = "run_side", f = seq("run_side", { 2, 3, 4, 5, 6, 7, 8 }), ms = { 75 }, runs = true },
  { name = "run_up", f = seq("run_up", { 2, 3, 4, 5, 6, 7, 8 }), ms = { 75 }, runs = true },
  { name = "run_down", f = seq("run_down", { 2, 3, 4, 5, 6, 7, 8 }), ms = { 75 }, runs = true },
  { name = "serve", f = seq("serve", { 3, 5, 7, 8, 9, 11 }), ms = { 40, 40, 42, 64, 64, 64 }, contact = 4, once = true },
  -- forehand.png 6, its own contact frame, smears the trombone into two thin lines with no bell, so the contact is
  -- backhand.png 9 (the trombone out on his right, arm extended; the same source, margin and scale)
  { name = "forehand", f = { { "forehand", 3 }, { "forehand", 4 }, { "forehand", 5 }, { "backhand", 9 },
      { "forehand", 7 }, { "forehand", 8 }, { "forehand", 10 }, { "forehand", 12 } },
    ms = SWINGMS, contact = 4, once = true },
  { name = "backhand", f = seq("backhand", { 3, 4, 5, 6, 7, 9, 10, 12 }), ms = SWINGMS, contact = 4, once = true },
  { name = "overhead", f = seq("overhead", { 3, 5, 6, 7, 8, 9, 10, 12 }), ms = SWINGMS, contact = 4, once = true },
  { name = "dive", f = seq("dive", { 2, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16 }),
    ms = { 40, 40, 42, 100, 230, 230, 230, 230, 230, 231, 100, 100, 100, 100 }, contact = 4, once = true, dive = true },
  { name = "front_ready", f = seq("front_ready", { 1, 2, 3, 4, 5, 6, 7, 8 }), ms = { 125 }, view = "front" },
}

-- Hand fixes: tag -> tag frame (1-based) -> rectangles to erase, in frame pixels { x0, y0, x1, y1 }.
local ERASE = {}

---------------------------------------------------------------- cleaning
local FILES = {}
local function fileInfo(name)
  if FILES[name] then return FILES[name] end
  local img = Image { fromFile = R .. "art/spritecook/a14/trombone/" .. name .. ".png" }
  local info = { img = img, cell = img.height, cache = {} }
  local src = L.loadCell(img, 0, info.cell, info.cell)
  -- head to soles, without the trombone (its bell can reach above his head)
  local m = brassMask(src, name == "front_ready")
  local y0, y1 = src.h, -1
  for y = 0, src.h - 1 do for x = 0, src.w - 1 do
    if src.px[y][x][4] >= 128 and not m[y][x] then y0 = math.min(y0, y); y1 = math.max(y1, y) end
  end end
  info.scale = HEIGHT / (y1 - y0 + 1)
  FILES[name] = info
  return info
end

local function cleanFrame(name, f)
  local info = fileInfo(name)
  if info.cache[f] then return info.cache[f] end
  local src = L.loadCell(info.img, f - 1, info.cell, info.cell)
  local scaled = L.areaScale(src, info.scale)
  local q = L.quantize(pal, scaled, 0.5, ALLOW)
  local m = brassMask(src, name == "front_ready")
  local k = info.scale
  for y = 0, q.h - 1 do for x = 0, q.w - 1 do
    if q.px[y][x] ~= 0 then
      local n, hit = 0, 0
      for sy = math.floor(y / k), math.min(src.h - 1, math.ceil((y + 1) / k) - 1) do
        for sx = math.floor(x / k), math.min(src.w - 1, math.ceil((x + 1) / k) - 1) do
          n = n + 1
          if m[sy][sx] then hit = hit + 1 end
        end
      end
      if n > 0 and hit / n >= 0.3 then
        local p = scaled.px[y][x]
        local v = 0.3 * p[1] + 0.59 * p[2] + 0.11 * p[3] + 25
        for _, g in ipairs(GOLDRAMP) do if v >= g[1] then q.px[y][x] = g[2]; break end end
      elseif isSeed({ scaled.px[y][x][1], scaled.px[y][x][2], scaled.px[y][x][3], 255 }) then
        -- a brass-coloured brown outside the trombone (in the front view his glasses and the print's shading): hair
        -- dark, not the red it would snap to
        q.px[y][x] = I("hair dark")
      end
    end
  end end
  L.despeckle(q)
  L.smoothLone(q, { [O] = true })
  L.outline(q, O)
  L.despeckle(q)
  L.dropIslands(q, 60)         -- the balls the generator drew
  info.cache[f] = q
  return q
end
local function copy(q)
  local o = { w = q.w, h = q.h, px = {} }
  for y = 0, q.h - 1 do
    o.px[y] = {}
    for x = 0, q.w - 1 do o.px[y][x] = q.px[y][x] end
  end
  return o
end

local function components(q, test)
  local seen, out = {}, {}
  for y = 0, q.h - 1 do seen[y] = {} end
  for y = 0, q.h - 1 do for x = 0, q.w - 1 do
    if test(x, y) and not seen[y][x] then
      local list, stack, sx, sy = {}, { { x, y } }, 0, 0
      seen[y][x] = true
      while #stack > 0 do
        local p = table.remove(stack)
        list[#list + 1] = p
        sx = sx + p[1]; sy = sy + p[2]
        for dy = -1, 1 do for dx = -1, 1 do
          local nx, ny = p[1] + dx, p[2] + dy
          if nx >= 0 and ny >= 0 and nx < q.w and ny < q.h and not seen[ny][nx] and test(nx, ny) then
            seen[ny][nx] = true
            stack[#stack + 1] = { nx, ny }
          end
        end end
      end
      out[#out + 1] = { list = list, x = sx / #list, y = sy / #list }
    end
  end end
  table.sort(out, function(a, b) return #a.list > #b.list end)
  return out
end

-- The trombone (in place of the racket): all its gold, at least 8 px. Its "racket" point for the game
-- is the patch's centre (where it meets the ball); its mask reaches 2 px round, so the print never paints over it.
local function findRacket(q, isDive)
  -- all the gold together (the outline and the cleanup split it into pieces)
  local c = { list = {}, x = 0, y = 0 }
  for y = 0, q.h - 1 do for x = 0, q.w - 1 do
    if GOLDIDX[q.px[y][x]] then c.list[#c.list + 1] = { x, y }; c.x = c.x + x; c.y = c.y + y end
  end end
  if #c.list < 8 then return nil end
  c.x, c.y = c.x / #c.list, c.y / #c.list
  c.mask = {}
  for _, p in ipairs(c.list) do
    for dy = -2, 2 do for dx = -2, 2 do c.mask[(p[2] + dy) * 1000 + p[1] + dx] = true end end
  end
  return c
end

-- The tee: every red patch of 40 px or more that isn't the racket and lies above the shoes (the biggest one always).
local function shirt(q, racket, isDive)
  local _, _, _, soles = L.bounds(q)
  local function inRacket(x, y) return racket and racket.mask[y * 1000 + x] end
  -- (the trombone has no red, so unlike the racket rim it needs no keeping out)
  local comps = components(q, function(x, y) return S.toShirt[q.px[y][x]] end)
  local n = 0
  for i, c in ipairs(comps) do
    if i == 1 or (#c.list >= 40 and (isDive or c.y < soles - 30)) then
      for _, p in ipairs(c.list) do q.px[p[2]][p[1]] = S.toShirt[q.px[p[2]][p[1]]] end
      n = n + #c.list
    end
  end
  -- outline specks inside the tee (closed clusters of 3 px or fewer) become shirt shade, as in a13-build.lua
  for _, c in ipairs(components(q, function(x, y) return q.px[y][x] == O end)) do
    if #c.list <= 3 then
      local closed = true
      for _, p in ipairs(c.list) do
        for dy = -1, 1 do for dx = -1, 1 do
          local v = L.at(q, p[1] + dx, p[2] + dy)
          if v ~= O and not S.shirt[v] then closed = false end
        end end
      end
      if closed then for _, p in ipairs(c.list) do q.px[p[2]][p[1]] = S.SD end end
    end
  end
  return n
end

-- A13's print at the tee's anchor. Only the tee, the generator's print (light, outline, the reds) and nothing in the
-- racket's mask is painted over, so an arm or the racket crossing the back stays in front.
local function stampPrint(q, racket, view)
  local P = PRINT[view]
  local cx, top = A.anchor(q, S)
  if not cx then return nil end
  local key = {}
  for k, n in pairs(P.key) do key[k] = I(n) end
  for r, row in ipairs(P.rows) do
    for c = 1, #row do
      local k = row:sub(c, c)
      local x, y = cx + P.box[1] + c - 1, top + P.box[2] + r - 1
      local v = L.at(q, x, y)
      local paintable = v ~= 0 and (S.shirt[v] or S.light[v] or S.toShirt[v] or v == O
        or (view == "front" and (v == I("hair dark") or S.skinHair[v])))
        and not (racket and racket.mask[y * 1000 + x])
      if paintable and k ~= " " then q.px[y][x] = (k == ".") and S.SR or key[k] end
    end
  end
  return cx, top
end

---------------------------------------------------------------- build
local frames, racketPoints = {}, {}
local anchors = {}
for _, t in ipairs(TAGS) do
  t.first = #frames + 1
  local view = t.view or "back"
  for n, spec in ipairs(t.f) do
    local name, f = spec[1], spec[2]
    local q = copy(cleanFrame(name, f))
    local racket = findRacket(q, t.dive)
    local tee = shirt(q, racket, t.dive)
    local ax, ay
    if not t.dive then ax, ay = stampPrint(q, racket, view) end
    if view == "front" and ay then
      -- reds on his face (the generator's shading on the nose and ears) become skin
      for y = 0, ay - 1 do for x = 0, q.w - 1 do
        if S.toShirt[q.px[y][x]] then q.px[y][x] = I("skin 4") end
      end end
    end
    -- where this frame goes: the file's source pose has its feet on the pivot; every frame's soles on the ground line;
    -- the runs are steadied by the tee's anchor (the generator drifts them across the cell)
    local base = cleanFrame(name, 1)
    local fx = L.feetX(base)
    local _, _, _, soles = L.bounds(q)
    local dx = math.floor(PIVOT_X - fx + 0.5)
    if t.runs then
      if not anchors[name] then
        local b = copy(base)
        shirt(b, findRacket(b, false), false)
        anchors[name] = A.anchor(b, S)
      end
      if ax then dx = dx + anchors[name] - ax end
    end
    local dy = PIVOT_Y - soles
    frames[#frames + 1] = { q = q, dx = dx, dy = dy, ms = t.ms[n] or t.ms[#t.ms], tag = t.name, n = n }
    if t.contact == n then
      racketPoints[t.name] = racket and { math.floor(racket.x + dx + 0.5), math.floor(racket.y + dy + 0.5) } or nil
    end
    print(string.format("%-11s %2d  %-11s src %2d  tee %4d px  anchor %s  racket %s", t.name, n, name, f, tee,
      ax and string.format("%d,%d", ax + dx, ay + dy) or "-",
      racket and string.format("%d,%d (%d px)", math.floor(racket.x + dx + 0.5), math.floor(racket.y + dy + 0.5),
        #racket.list) or "none"))
  end
  t.last = #frames
end

local spr = Sprite(FRAME, FRAME, ColorMode.INDEXED)
spr:setPalette(L.asepritePalette(pal))
spr.transparentColor = 0
spr.layers[1].name = "sells"
for i = 2, #frames do spr:newEmptyFrame() end
local function erased(fr, x, y)
  for _, r in ipairs((ERASE[fr.tag] or {})[fr.n] or {}) do
    if x >= r[1] and x <= r[3] and y >= r[2] and y <= r[4] then return true end
  end
  return false
end
local clipped = 0
local minTop, minX, maxX = FRAME, FRAME, -1
for i, fr in ipairs(frames) do
  local img = Image(FRAME, FRAME, ColorMode.INDEXED)
  for y = 0, fr.q.h - 1 do for x = 0, fr.q.w - 1 do
    local c = fr.q.px[y][x]
    if c ~= 0 then
      local px, py = x + fr.dx, y + fr.dy
      if px < 0 or py < 0 or px >= FRAME or py >= FRAME then clipped = clipped + 1
      elseif not erased(fr, px, py) then
        img:drawPixel(px, py, c)
        minX = math.min(minX, px); maxX = math.max(maxX, px); minTop = math.min(minTop, py)
      end
    end
  end end
  spr:newCel(spr.layers[1], i, img, Point(0, 0))
  spr.frames[i].duration = fr.ms / 1000
end
for _, t in ipairs(TAGS) do
  local tag = spr:newTag(t.first, t.last)
  tag.name = t.name
  if t.once then tag.repeats = 1 end
  if t.contact then tag.data = "contact=" .. (t.contact - 1) end
  local total, before = 0, 0
  for i = t.first, t.last do
    if t.contact and i - t.first + 1 == t.contact then before = total end
    total = total + frames[i].ms
  end
  print(string.format("tag %-11s frames %d-%d, %d ms%s", t.name, t.first - 1, t.last - 1, total,
    t.contact and string.format(", contact on tag frame %d at %d ms", t.contact - 1, before) or ""))
end
local slice = spr:newSlice(Rectangle(PIVOT_X - 8, PIVOT_Y - 3, 16, 4))
slice.name = "feet"
slice.pivot = Point(8, 3)
for _, name in ipairs({ "serve", "forehand", "backhand", "overhead", "dive" }) do
  local p = racketPoints[name]
  if not p then error("no racket point for " .. name) end
  local s = spr:newSlice(Rectangle(p[1], p[2], 1, 1))
  s.name = "racket " .. name
  print(string.format("racket %-9s %d, %d", name, p[1], p[2]))
end
print(string.format("clipped pixels %d; highest pixel y %d, x range %d-%d", clipped, minTop, minX, maxX))

spr:saveAs(R .. "art/character/sells.aseprite")
spr:close()
print("A14 build done, " .. #frames .. " frames")
