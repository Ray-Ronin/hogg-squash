-- A8z build: Coach Zain's full sheet, from the SpriteCook animations (art/spritecook/a8z/), to player-100's contract
-- plus an 8-frame front_ready. Writes art/character/zain.aseprite; export with art/tools/a8z-export.sh, previews with
-- art/tools/a8z-preview.lua.
-- Run: Aseprite -b --script "C:/Hogg Squash/hogg-squash/art/tools/a8z-build.lua"
--
-- Every file is read at its own scale (106 px for its source pose, frame 1). In each used frame the shirt print is
-- found by matching frame 1's print, which gives the torso's position and angle. From that come the shirt mask (its
-- blacks move to the shirt's own palette entries, so the white kit only changes the shirt) and A7z's hand-drawn print,
-- stamped afresh so it doesn't shimmer.

local L = dofile("C:/Hogg Squash/hogg-squash/art/tools/pixel-lib.lua")
local R = L.ROOT
local pal = L.loadPalette(R .. "art/palette/hogg-squash.gpl")
local I = function(n) return L.paletteIndex(pal, n) end

local HEIGHT = 106
local FRAME, PIVOT_X, PIVOT_Y = 150, 73, 148
local SB, SBL, SP = I("shirt black (A7z)"), I("shirt black light (A7z)"), I("shirt print (A7z)")
local O = I("outline")
local KITRED = I("kit red")

local ALLOW = {}
for _, n in ipairs({ "outline", "black kit", "black kit light", "grey 1", "grey 2", "grey 3", "side wall",
  "white kit shade", "front wall", "white", "red 1 (deepest)", "red 2", "tin", "Hogg red (court lines)", "kit red",
  "red highlight", "skin 0 (deepest, A7z)", "skin 1 (deepest)", "skin 2", "skin 2b (A7z)", "skin 3", "skin 4",
  "hair dark", "hair" }) do ALLOW[I(n)] = true end

-- Coarse colour classes, for matching the print: 1 dark, 2 light, 3 red, 4 skin.
local CLASS = {}
for _, n in ipairs({ "outline", "black kit", "black kit light", "grey 1", "hair dark", "hair" }) do CLASS[I(n)] = 1 end
for _, n in ipairs({ "grey 2", "grey 3", "side wall", "white kit shade", "front wall", "white" }) do CLASS[I(n)] = 2 end
for _, n in ipairs({ "red 1 (deepest)", "red 2", "tin", "Hogg red (court lines)", "kit red", "red highlight" }) do CLASS[I(n)] = 3 end
for _, n in ipairs({ "skin 0 (deepest, A7z)", "skin 1 (deepest)", "skin 2", "skin 2b (A7z)", "skin 3", "skin 4" }) do CLASS[I(n)] = 4 end

local TO_SHIRT = { [I("black kit")] = SB, [I("hair dark")] = SB, [I("black kit light")] = SBL, [I("grey 1")] = SBL }

---------------------------------------------------------------- the two views (coordinates from a7z-build.lua)
local BK = { e = KITRED, b = I("red 2"), f = I("red highlight"), w = I("white"), o = O, P = SP }
local GLYPH = {
  S = { ".PP", ".P.", "PP." }, Q = { ".P.", "P.P", ".PP" }, U = { "P.P", "P.P", "PPP" },
  A = { ".P.", "PPP", "P.P" }, H = { "P.P", "PPP", "P.P" },
}
local function stampList(items, key)
  local out = {}
  for _, it in ipairs(items) do
    for dy, row in ipairs(it.rows) do
      for dx = 1, #row do
        local k = row:sub(dx, dx)
        if key[k] then out[#out + 1] = { it.x + dx - 1, it.y + dy - 1, key[k] } end
      end
    end
  end
  return out
end
local backItems = { { x = 24, y = 19, rows = { "b.b....", "eeee...", "efoeee.", "beeeeee", ".bbeew.", "...b..." } } }
do
  local word = "SQUASH"
  for i = 1, #word do backItems[#backItems + 1] = { x = 26, y = 26 + (i - 1) * 4, rows = GLYPH[word:sub(i, i)] } end
end
local VIEWS = {
  back = {
    template = { 20, 18, 33, 49 },         -- the area matched between frames (print plus a little shirt)
    centre = { 26.5, 33.5 },
    clear = { 22, 19, 31, 48 },            -- cleared to shirt black before the print is stamped
    stamp = stampList(backItems, BK),
    collar = 18, hem = 49, crease = 46,    -- rows on the A7z grid
    halfWidth = 18, sleeve = 32, headHalf = 10,
  },
  front = {
    template = { 26, 24, 45, 36 },
    centre = { 35.5, 30 },
    clear = { 30, 27, 41, 33 },
    stamp = stampList({ { x = 30, y = 28, rows = { "PP.PP.PP.PP", "PP.PP.PP.PP", ".eeeeeeeee.", "...dddd...." } } },
      { P = SP, e = KITRED, d = I("Hogg red (court lines)") }),
    collar = 18, hem = 47, crease = 44,
    halfWidth = 20, sleeve = 32, headHalf = 0,
    neck = { 27, 34, 23 },                 -- x from, x to, down to row: the neck hole (the print isn't on his centre line)
  },
}

---------------------------------------------------------------- the tags
-- `f` lists { file, source frame (1-based) }. Mixed files are deliberate: the generator's own contact frames were
-- unusable in places (art/spritecook-manifest.md, A8z), and all the back-view files share one pose and scale.
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
  { name = "serve", f = seq("serve", { 2, 3, 4, 6, 7, 8 }), ms = { 40, 40, 42, 64, 64, 64 }, contact = 4, once = true },
  { name = "forehand", f = { { "forehand", 2 }, { "forehand", 3 }, { "forehand", 4 }, { "backhand", 10 },
      { "forehand", 6 }, { "forehand", 8 }, { "forehand", 9 }, { "forehand", 11 } },
    ms = SWINGMS, contact = 4, once = true },
  { name = "backhand", f = seq("backhand", { 4, 6, 7, 8, 10, 10, 11, 12 }), ms = SWINGMS, contact = 4, once = true },
  { name = "overhead", f = seq("overhead", { 4, 5, 3, 2, 6, 7, 8, 11 }), ms = SWINGMS, contact = 4, once = true },
  { name = "dive", f = seq("dive", { 2, 5, 6, 9, 11, 9, 11, 9, 11, 9, 12, 13, 15, 16 }),
    ms = { 40, 40, 42, 100, 230, 230, 230, 230, 230, 231, 100, 100, 100, 100 }, contact = 4, once = true, dive = true },
  -- Source frames 4 to 6 draw a ball over the racket, so the loop bobs down and up on the clean ones.
  { name = "front_ready", f = seq("front_ready", { 1, 2, 7, 3, 3, 8, 2, 1 }), ms = { 125 }, view = "front" },
}

-- Hand fixes: tag -> tag frame (1-based) -> rectangles to erase, in frame pixels { x0, y0, x1, y1 }.
local ERASE = {}
ERASE.serve = { [5] = { { 88, 59, 98, 69 } } }  -- the generator's ball, touching his head
-- File -> source frame -> smears the generator left, cut from the raw frame so the outline forms around what's left.
-- Rectangles in cleaned-grid pixels.
local SMEARS = {
  dive = {
    [5] = { { 47, 68, 58, 78 } },        -- a grey ghost of the shoe under the thigh
    [12] = { { 28, 63, 36, 71 } },       -- a grey streak from the left hand to the shoe
    [13] = { { 27, 66, 35, 86 } },       -- a grey streak hanging from the left hand
  },
}
-- File -> source frame -> the torso's place, where the match can't find the print: in the dive the body is
-- foreshortened, leaning towards us with the print about half its length (`vs`, read off the raw frames). `vs`
-- squeezes the print and the shirt's limits along the spine.
local TRACK = {
  dive = {
    [5] = { x = 55, y = 37, a = 0, vs = 0.53 },
    [6] = { x = 56.5, y = 46.5, a = 0, vs = 0.45 },
    [9] = { x = 57, y = 53.5, a = 0, vs = 0.40 },
    [11] = { x = 57, y = 53.5, a = 0, vs = 0.40 },
    [12] = { x = 51.5, y = 48, a = 0, vs = 0.47 },
    [13] = { x = 49, y = 47, a = 0, vs = 0.47 },
  },
}

-- The generator turned the reds brown in these two files, so the racket and the shoe trim get kit red back.
local RERED = { serve = true, dive = true }

---------------------------------------------------------------- cleaning
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

local FILES = {}
local function fileInfo(name)
  if FILES[name] then return FILES[name] end
  local img = Image { fromFile = R .. "art/spritecook/a8z/" .. name .. ".png" }
  local isFront = name == "front_ready"
  local info = { img = img, cell = img.height, squeeze = isFront and 0.9 or nil, islands = isFront and 200 or nil,
    cache = {} }
  local src = L.loadCell(img, 0, info.cell, info.cell)
  local _, y0, _, y1 = L.gridBounds(src)
  info.scale = HEIGHT / (y1 - y0 + 1)
  FILES[name] = info
  return info
end

local function cleanFrame(name, f)
  local info = fileInfo(name)
  if info.cache[f] then return info.cache[f] end
  local src = L.loadCell(info.img, f - 1, info.cell, info.cell)
  for _, r in ipairs((SMEARS[name] or {})[f] or {}) do
    for y = math.floor(r[2] / info.scale), math.min(src.h - 1, math.ceil(r[4] / info.scale)) do
      for x = math.floor(r[1] / info.scale), math.min(src.w - 1, math.ceil(r[3] / info.scale)) do
        src.px[y][x] = { 0, 0, 0, 0 }
      end
    end
  end
  if info.squeeze then src = squeeze(src, info.squeeze) end
  local q = L.quantize(pal, L.areaScale(src, info.scale), 0.5, ALLOW)
  L.despeckle(q)
  L.smoothLone(q, { [O] = true })
  L.outline(q, O)
  L.despeckle(q)
  L.dropIslands(q, info.islands or 60)         -- the balls the generator drew near the racket
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

---------------------------------------------------------------- tracking the print
local function fileTemplate(name, view)
  local info = fileInfo(name)
  if info.template then return info.template end
  local q = cleanFrame(name, 1)
  local x0, y0 = L.bounds(q)
  local V = VIEWS[view]
  local t = { cx = x0 + V.centre[1], cy = y0 + V.centre[2], ox = x0, oy = y0, list = {} }
  for y = V.template[2], V.template[4] do for x = V.template[1], V.template[3] do
    local c = CLASS[L.at(q, x0 + x, y0 + y)] or 0
    if c ~= 0 then
      t.list[#t.list + 1] = { x - V.centre[1], y - V.centre[2], c, (c == 1) and 1 or 3 }
    end
  end end
  info.template = t
  return t
end

local function score(q, t, cx, cy, ca, sa)
  local s, W, H, px = 0, q.w, q.h, q.px
  for _, p in ipairs(t.list) do
    local x = math.floor(cx + p[1] * ca - p[2] * sa + 0.5)
    local y = math.floor(cy + p[1] * sa + p[2] * ca + 0.5)
    if x >= 0 and y >= 0 and x < W and y < H and CLASS[px[y][x]] == p[3] then s = s + p[4] end
  end
  return s
end

local function track(q, t, opts)
  local best, bx, by, ba = -1, t.cx, t.cy, 0
  for a = -opts.amax, opts.amax, opts.astep do
    local r = math.rad(a)
    local ca, sa = math.cos(r), math.sin(r)
    for dy = -opts.win, opts.win, 2 do for dx = -opts.win, opts.win, 2 do
      local s = score(q, t, t.cx + dx, t.cy + dy, ca, sa) - math.abs(a) * 0.05
      if s > best then best, bx, by, ba = s, t.cx + dx, t.cy + dy, a end
    end end
  end
  -- refine: position by 1 px, angle by a third of the coarse step
  local r0 = math.floor(opts.astep / 3)
  for a = ba - r0, ba + r0, math.max(1, r0) do
    local r = math.rad(a)
    local ca, sa = math.cos(r), math.sin(r)
    for dy = -2, 2 do for dx = -2, 2 do
      local s = score(q, t, bx + dx, by + dy, ca, sa)
      if s > best then best, bx, by, ba = s, bx + dx, by + dy, a end
    end end
  end
  local total = 0
  for _, p in ipairs(t.list) do total = total + p[4] end
  return bx, by, ba, best / total
end

---------------------------------------------------------------- the racket head: its largest patch of light strings
local function findRacket(q, isDive, tr, V)
  local _, _, _, soles = L.bounds(q)
  local torsoX = tr.x
  local r = math.rad(tr.a)
  local ca, sa = math.cos(r), math.sin(r)
  local function inPrint(x, y)
    local dx, dy = x - tr.x, y - tr.y
    local gx, gy = dx * ca + dy * sa + V.centre[1], (-dx * sa + dy * ca) / (tr.vs or 1) + V.centre[2]
    return gx >= V.clear[1] - 1 and gx <= V.clear[3] + 1 and gy >= V.clear[2] - 1 and gy <= V.clear[4] + 1
  end
  local seen, bestList = {}, nil
  for y = 0, q.h - 1 do seen[y] = {} end
  for y = 0, q.h - 1 do for x = 0, q.w - 1 do
    if CLASS[q.px[y][x]] == 2 and not seen[y][x] then
      local list, stack = {}, { { x, y } }
      seen[y][x] = true
      local sx, sy = 0, 0
      while #stack > 0 do
        local p = table.remove(stack)
        list[#list + 1] = p
        sx = sx + p[1]; sy = sy + p[2]
        for dy = -1, 1 do for dx = -1, 1 do
          local nx, ny = p[1] + dx, p[2] + dy
          if CLASS[L.at(q, nx, ny)] == 2 and not seen[ny][nx] then
            seen[ny][nx] = true
            stack[#stack + 1] = { nx, ny }
          end
        end end
      end
      local cx, cy = sx / #list, sy / #list
      local ok
      if isDive then ok = cx > torsoX + 8 else ok = cy < soles - 16 end
      -- With the racket out of sight, the biggest light patch is the print itself: not a racket.
      local onPrint = 0
      for _, p in ipairs(list) do if inPrint(p[1], p[2]) then onPrint = onPrint + 1 end end
      if onPrint >= #list * 0.7 and #list < 90 then ok = false end
      if ok and (not bestList or #list > #bestList.list) then
        bestList = { list = list, x = cx, y = cy }
      end
    end
  end end
  if not bestList or #bestList.list < 12 then return nil end
  bestList.mask = {}
  for _, p in ipairs(bestList.list) do
    for dy = -3, 3 do for dx = -3, 3 do
      local k = (p[2] + dy) * 1000 + (p[1] + dx)
      bestList.mask[k] = true
    end end
  end
  return bestList
end

---------------------------------------------------------------- shirt and print
local function paint(q, tr, V, racket)
  local r = math.rad(tr.a)
  local ca, sa = math.cos(r), math.sin(r)
  local function uv(x, y)
    local dx, dy = x - tr.x, y - tr.y
    return dx * ca + dy * sa, (-dx * sa + dy * ca) / (tr.vs or 1)
  end
  local function inRacket(x, y) return racket and racket.mask[y * 1000 + x] end
  local collar, hem = V.collar - V.centre[2], V.hem - V.centre[2]
  local crease = V.crease - V.centre[2]

  -- candidates: the blacks inside the torso's box, or out to the sleeves, but not the head
  local cand, comps = {}, {}
  for y = 0, q.h - 1 do cand[y] = {} end
  for y = 0, q.h - 1 do for x = 0, q.w - 1 do
    if TO_SHIRT[q.px[y][x]] and not inRacket(x, y) then
      local u, v = uv(x, y)
      local aU = math.abs(u)
      local head = v < collar and aU < V.headHalf
      if V.neck then
        local gx, gy = u + V.centre[1], v + V.centre[2]
        if gy < V.collar or (gx >= V.neck[1] and gx <= V.neck[2] and gy <= V.neck[3]) then head = true end
      end
      if v <= hem and v >= collar - 12 and aU <= V.sleeve and not head then cand[y][x] = true end
    end
  end end
  -- a connected patch counts if it reaches the central torso (so a racket handle by the hand doesn't)
  local seen = {}
  for y = 0, q.h - 1 do seen[y] = {} end
  for y = 0, q.h - 1 do for x = 0, q.w - 1 do
    if cand[y][x] and not seen[y][x] then
      local list, stack, central = {}, { { x, y } }, false
      seen[y][x] = true
      while #stack > 0 do
        local p = table.remove(stack)
        list[#list + 1] = p
        local u, v = uv(p[1], p[2])
        if math.abs(u) <= V.halfWidth and v >= collar and v <= hem then central = true end
        for dy = -1, 1 do for dx = -1, 1 do
          local nx, ny = p[1] + dx, p[2] + dy
          if nx >= 0 and ny >= 0 and nx < q.w and ny < q.h and cand[ny][nx] and not seen[ny][nx] then
            seen[ny][nx] = true
            stack[#stack + 1] = { nx, ny }
          end
        end end
      end
      if central then for _, p in ipairs(list) do q.px[p[2]][p[1]] = TO_SHIRT[q.px[p[2]][p[1]]] end end
    end
  end end

  -- small outline-coloured creases inside the shirt become shirt black (or the white kit shows them as specks)
  local seenO = {}
  for y = 0, q.h - 1 do seenO[y] = {} end
  for y = 0, q.h - 1 do for x = 0, q.w - 1 do
    if q.px[y][x] == O and not seenO[y][x] then
      local u, v = uv(x, y)
      if math.abs(u) <= V.halfWidth and v >= collar and v <= crease then
        local list, stack, open, inside = {}, { { x, y } }, false, true
        seenO[y][x] = true
        while #stack > 0 do
          local p = table.remove(stack)
          list[#list + 1] = p
          local pu, pv = uv(p[1], p[2])
          if math.abs(pu) > V.halfWidth or pv < collar or pv > crease then inside = false end
          for dy = -1, 1 do for dx = -1, 1 do
            local nx, ny = p[1] + dx, p[2] + dy
            local c = L.at(q, nx, ny)
            if c == 0 then open = true
            elseif c == O and not seenO[ny][nx] then
              seenO[ny][nx] = true
              stack[#stack + 1] = { nx, ny }
            elseif c ~= O and CLASS[c] and CLASS[c] ~= 1 and c ~= SB and c ~= SBL then
              local nu, nv = uv(nx, ny)
              if not (nu >= V.clear[1] - V.centre[1] and nu <= V.clear[3] - V.centre[1]
                  and nv >= V.clear[2] - V.centre[2] and nv <= V.clear[4] - V.centre[2]) then open = true end
            end
          end end
        end
        if not open and inside and #list <= 4 then
          for _, p in ipairs(list) do q.px[p[2]][p[1]] = SB end
        end
      end
    end
  end end

  -- Thick shadows inside the shirt quantize to outline, and would stay black on the white kit: an outline pixel with
  -- nothing but outline and shirt around it becomes shirt black, a few layers deep. Real edges touch skin or the
  -- background, so they stay.
  for _ = 1, 4 do
    local fix = {}
    for y = 0, q.h - 1 do for x = 0, q.w - 1 do
      if q.px[y][x] == O and not inRacket(x, y) then
        local u, v = uv(x, y)
        if math.abs(u) <= V.sleeve and v >= collar and v <= crease then
          local ok = true
          for dy = -1, 1 do for dx = -1, 1 do
            local c = L.at(q, x + dx, y + dy)
            if c ~= O and c ~= SB and c ~= SBL then ok = false end
          end end
          if ok then fix[#fix + 1] = { x, y } end
        end
      end
    end end
    for _, p in ipairs(fix) do q.px[p[2]][p[1]] = SB end
  end

  -- clear the print area, then stamp the print (nearest pixel, so a turned torso turns the print with it)
  local stampAt = {}
  for _, s in ipairs(V.stamp) do stampAt[s[2] * 1000 + s[1]] = s[3] end
  local reach = 40
  for y = math.max(0, math.floor(tr.y - reach)), math.min(q.h - 1, math.ceil(tr.y + reach)) do
    for x = math.max(0, math.floor(tr.x - reach)), math.min(q.w - 1, math.ceil(tr.x + reach)) do
      local c = q.px[y][x]
      if c ~= 0 and not inRacket(x, y) then
        local u, v = uv(x, y)
        local gx = math.floor(u + V.centre[1] + 0.5)
        local gy = math.floor(v + V.centre[2] + 0.5)
        if gx >= V.clear[1] and gx <= V.clear[3] and gy >= V.clear[2] and gy <= V.clear[4] then
          if c ~= O then q.px[y][x] = SB end
          local st = stampAt[gy * 1000 + gx]
          if st then q.px[y][x] = st end
        end
      end
    end
  end
end

local function reRed(q, racket, isDive)
  local _, _, _, soles = L.bounds(q)
  for y = 0, q.h - 1 do for x = 0, q.w - 1 do
    if CLASS[q.px[y][x]] == 4 then
      local nearRacket = racket and racket.mask[y * 1000 + x]
      local shoe = (not isDive) and y > soles - 9
      if nearRacket or shoe then q.px[y][x] = KITRED end
    end
  end end
end

---------------------------------------------------------------- build
local frames = {}
local racketPoints = {}
for _, t in ipairs(TAGS) do
  t.first = #frames + 1
  local view = t.view or "back"
  local V = VIEWS[view]
  for n, spec in ipairs(t.f) do
    local name, f = spec[1], spec[2]
    local tpl = fileTemplate(name, view)
    local q = copy(cleanFrame(name, f))
    local opts = t.dive and { win = 50, amax = 36, astep = 6 }
      or (view == "front" and { win = 8, amax = 0, astep = 1 })
      or { win = 34, amax = 30, astep = 6 }
    local x, y, a, match = track(q, tpl, opts)
    local over = (TRACK[name] or {})[f]
    if over then x, y, a = over.x, over.y, over.a end
    if view == "front" or math.abs(a) <= 15 then a = 0 end   -- a small tilt only makes the letters jagged
    local vs = over and over.vs or nil
    local racket = findRacket(q, t.dive, { x = x, y = y, a = a, vs = vs }, V)
    if RERED[name] then reRed(q, racket, t.dive) end
    paint(q, { x = x, y = y, a = a, vs = vs }, V, racket)
    -- where this frame goes: the file's source pose has its feet on the pivot; every frame's soles on the ground line
    local base = cleanFrame(name, 1)
    local fx = L.feetX(base)
    local _, _, _, soles = L.bounds(q)
    local dx = math.floor(PIVOT_X - fx + 0.5)
    if t.runs then dx = dx + math.floor(tpl.cx - x + 0.5) end
    local dy = PIVOT_Y - soles
    frames[#frames + 1] = { q = q, dx = dx, dy = dy, ms = t.ms[n] or t.ms[#t.ms], tag = t.name, n = n, file = name, src = f,
      track = { x = x, y = y, a = a, match = match }, racket = racket }
    if t.contact == n then
      racketPoints[t.name] = racket and { math.floor(racket.x + dx + 0.5), math.floor(racket.y + dy + 0.5) } or nil
    end
    print(string.format("%-11s %2d  %-11s src %2d  torso %5.1f,%5.1f  angle %4d  match %.2f%s", t.name, n, name, f, x, y, a,
      match, racket and "" or "  (no racket found)"))
  end
  t.last = #frames
end

local spr = Sprite(FRAME, FRAME, ColorMode.INDEXED)
spr:setPalette(L.asepritePalette(pal))
spr.transparentColor = 0
spr.layers[1].name = "zain"
for i = 2, #frames do spr:newEmptyFrame() end
local function erased(fr, x, y)
  for _, r in ipairs((ERASE[fr.tag] or {})[fr.n] or {}) do
    if x >= r[1] and x <= r[3] and y >= r[2] and y <= r[4] then return true end
  end
  return false
end
local clipped = 0
for i, fr in ipairs(frames) do
  local img = Image(FRAME, FRAME, ColorMode.INDEXED)
  local minx, miny, maxx = FRAME, FRAME, -1
  for y = 0, fr.q.h - 1 do for x = 0, fr.q.w - 1 do
    local c = fr.q.px[y][x]
    if c ~= 0 then
      local px, py = x + fr.dx, y + fr.dy
      if px < 0 or py < 0 or px >= FRAME or py >= FRAME then clipped = clipped + 1
      elseif not erased(fr, px, py) then
        img:drawPixel(px, py, c)
        minx = math.min(minx, px); maxx = math.max(maxx, px); miny = math.min(miny, py)
      end
    end
  end end
  spr:newCel(spr.layers[1], i, img, Point(0, 0))
  spr.frames[i].duration = fr.ms / 1000
  fr.top, fr.x0, fr.x1 = miny, minx, maxx
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

---------------------------------------------------------------- checks
-- The shirt entries stay inside the shirt by construction; count them per frame, and report the tallest and widest.
local minTop, minX, maxX = FRAME, FRAME, -1
for _, fr in ipairs(frames) do
  minTop = math.min(minTop, fr.top); minX = math.min(minX, fr.x0); maxX = math.max(maxX, fr.x1)
end
print(string.format("clipped pixels %d; highest pixel y %d, x range %d-%d", clipped, minTop, minX, maxX))

spr:saveAs(R .. "art/character/zain.aseprite")
spr:close()
print("A8z build done, " .. #frames .. " frames")
