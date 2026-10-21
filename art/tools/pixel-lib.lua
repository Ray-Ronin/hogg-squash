-- Hogg Squash art helpers for Aseprite's Lua API (A1, 2026-10-20).
-- Turns a SpriteCook still into a clean, palette-locked sprite at an exact height:
-- crop, area-average downscale, alpha threshold, nearest palette colour, outline, despeckle.
-- Load with dofile(); everything is on the returned table.

local M = {}

M.ROOT = "C:/Hogg Squash/hogg-squash/"
M.OUTLINE = { 11, 10, 13 }

-- Palette from a GIMP .gpl file: list of { r, g, b, name }.
function M.loadPalette(path)
  local pal = {}
  for line in io.lines(path) do
    local r, g, b, name = line:match("^%s*(%d+)%s+(%d+)%s+(%d+)%s*(.*)$")
    if r then pal[#pal + 1] = { tonumber(r), tonumber(g), tonumber(b), name } end
  end
  return pal
end

function M.paletteIndex(pal, name)
  for i, c in ipairs(pal) do if c[4] == name then return i end end
  error("no palette colour " .. name)
end

-- Source PNG as a pixel grid { w, h, px[y][x] = { r, g, b, a } }, alpha thresholded at 128 and
-- cropped to the opaque bounds.
function M.loadSource(path)
  local img = Image { fromFile = path }
  local pc = app.pixelColor
  local minx, miny, maxx, maxy = img.width, img.height, -1, -1
  for it in img:pixels() do
    if pc.rgbaA(it()) >= 128 then
      minx = math.min(minx, it.x); maxx = math.max(maxx, it.x)
      miny = math.min(miny, it.y); maxy = math.max(maxy, it.y)
    end
  end
  local g = { w = maxx - minx + 1, h = maxy - miny + 1, px = {} }
  for y = 0, g.h - 1 do
    g.px[y] = {}
    for x = 0, g.w - 1 do
      local v = img:getPixel(x + minx, y + miny)
      local a = pc.rgbaA(v) >= 128 and 255 or 0
      g.px[y][x] = { pc.rgbaR(v), pc.rgbaG(v), pc.rgbaB(v), a }
    end
  end
  return g
end

-- Area-average resize of a grid to height h (width keeps the aspect), premultiplied alpha.
-- Returns float pixels; alpha is 0..1 coverage.
function M.areaResize(g, h)
  local s = g.h / h
  local w = math.max(1, math.floor(g.w / s + 0.5))
  local sx = g.w / w
  local out = { w = w, h = h, px = {} }
  for ty = 0, h - 1 do
    out.px[ty] = {}
    local y0, y1 = ty * s, (ty + 1) * s
    for tx = 0, w - 1 do
      local x0, x1 = tx * sx, (tx + 1) * sx
      local r, gg, b, a, area = 0, 0, 0, 0, 0
      for yy = math.floor(y0), math.min(g.h - 1, math.ceil(y1) - 1) do
        local wy = math.min(y1, yy + 1) - math.max(y0, yy)
        for xx = math.floor(x0), math.min(g.w - 1, math.ceil(x1) - 1) do
          local wx = math.min(x1, xx + 1) - math.max(x0, xx)
          local p = g.px[yy][xx]
          local wgt = wx * wy
          local al = p[4] / 255
          r = r + p[1] * al * wgt; gg = gg + p[2] * al * wgt; b = b + p[3] * al * wgt
          a = a + al * wgt; area = area + wgt
        end
      end
      if a > 0 then out.px[ty][tx] = { r / a, gg / a, b / a, a / area }
      else out.px[ty][tx] = { 0, 0, 0, 0 } end
    end
  end
  return out
end

-- One cell of a horizontal spritesheet as an uncropped pixel grid, alpha thresholded at 128 (A2).
-- Keeping the whole cell keeps every frame of an animation on the same ground line and centre.
function M.loadCell(img, i, cw, ch)
  local pc = app.pixelColor
  local g = { w = cw, h = ch, px = {} }
  for y = 0, ch - 1 do
    g.px[y] = {}
    for x = 0, cw - 1 do
      local v = img:getPixel(i * cw + x, y)
      local a = pc.rgbaA(v) >= 128 and 255 or 0
      g.px[y][x] = { pc.rgbaR(v), pc.rgbaG(v), pc.rgbaB(v), a }
    end
  end
  return g
end

-- Opaque bounds of a pixel grid (alpha > 0).
function M.gridBounds(g)
  local minx, miny, maxx, maxy = g.w, g.h, -1, -1
  for y = 0, g.h - 1 do for x = 0, g.w - 1 do
    if g.px[y][x][4] > 0 then
      minx = math.min(minx, x); maxx = math.max(maxx, x)
      miny = math.min(miny, y); maxy = math.max(maxy, y)
    end
  end end
  return minx, miny, maxx, maxy
end

-- Area-average resize by an exact factor s (< 1), the same for every frame (A2). Output is
-- ceil(w * s) × ceil(h * s); premultiplied alpha, like areaResize.
function M.areaScale(g, s)
  local w, h = math.ceil(g.w * s), math.ceil(g.h * s)
  local k = 1 / s
  local out = { w = w, h = h, px = {} }
  for ty = 0, h - 1 do
    out.px[ty] = {}
    local y0, y1 = ty * k, math.min(g.h, (ty + 1) * k)
    for tx = 0, w - 1 do
      local x0, x1 = tx * k, math.min(g.w, (tx + 1) * k)
      local r, gg, b, a, area = 0, 0, 0, 0, 0
      for yy = math.floor(y0), math.min(g.h - 1, math.ceil(y1) - 1) do
        local wy = math.min(y1, yy + 1) - math.max(y0, yy)
        for xx = math.floor(x0), math.min(g.w - 1, math.ceil(x1) - 1) do
          local wx = math.min(x1, xx + 1) - math.max(x0, xx)
          local p = g.px[yy][xx]
          local wgt = wx * wy
          local al = p[4] / 255
          r = r + p[1] * al * wgt; gg = gg + p[2] * al * wgt; b = b + p[3] * al * wgt
          a = a + al * wgt; area = area + wgt
        end
      end
      if a > 0 then out.px[ty][tx] = { r / a, gg / a, b / a, a / area }
      else out.px[ty][tx] = { 0, 0, 0, 0 } end
    end
  end
  return out
end

-- cleanAt's pipeline at a fixed scale instead of a fixed height (A2: every frame at the same scale).
function M.cleanScaled(pal, src, s)
  local q = M.quantize(pal, M.areaScale(src, s), 0.5, M.characterColours(pal))
  M.despeckle(q)
  M.smoothLone(q, { [M.paletteIndex(pal, "outline")] = true })
  M.outline(q, M.paletteIndex(pal, "outline"))
  M.despeckle(q)
  return q
end

-- Nearest palette entry by "redmean" weighted RGB distance.
-- `allow` (optional) is a set of usable indices.
function M.nearest(pal, r, g, b, allow)
  local best, bd = 1, math.huge
  for i, c in ipairs(pal) do
    if allow and not allow[i] then goto continue end
    local rm = (r + c[1]) / 2
    local dr, dg, db = r - c[1], g - c[2], b - c[3]
    local d = (2 + rm / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rm) / 256) * db * db
    if d < bd then best, bd = i, d end
    ::continue::
  end
  return best
end

-- Palette indices a character may use: neutrals, reds, skin and hair (no wood, glass or effects).
function M.characterColours(pal)
  local allow = {}
  for i, c in ipairs(pal) do
    if i <= M.paletteIndex(pal, "hair") and not c[4]:match("^margin") then allow[i] = true end
  end
  return allow
end

-- Float grid -> index grid (0 = transparent, else palette index), coverage threshold `cut`.
function M.quantize(pal, f, cut, allow)
  local q = { w = f.w, h = f.h, px = {} }
  for y = 0, f.h - 1 do
    q.px[y] = {}
    for x = 0, f.w - 1 do
      local p = f.px[y][x]
      q.px[y][x] = (p[4] >= (cut or 0.5)) and M.nearest(pal, p[1], p[2], p[3], allow) or 0
    end
  end
  return q
end

local function at(q, x, y)
  if x < 0 or y < 0 or x >= q.w or y >= q.h then return 0 end
  return q.px[y][x]
end
M.at = at

-- Drop opaque pixels with at most one opaque 8-neighbour (stray specks and 1 px spurs).
function M.despeckle(q)
  local drop = {}
  for y = 0, q.h - 1 do for x = 0, q.w - 1 do
    if q.px[y][x] ~= 0 then
      local n = 0
      for dy = -1, 1 do for dx = -1, 1 do
        if (dx ~= 0 or dy ~= 0) and at(q, x + dx, y + dy) ~= 0 then n = n + 1 end
      end end
      if n <= 1 then drop[#drop + 1] = { x, y } end
    end
  end end
  for _, p in ipairs(drop) do q.px[p[2]][p[1]] = 0 end
end

-- Recolour lone pixels whose four side neighbours share one other opaque colour (colour noise).
function M.smoothLone(q, keep)
  local fix = {}
  for y = 0, q.h - 1 do for x = 0, q.w - 1 do
    local c = q.px[y][x]
    if c ~= 0 and not (keep and keep[c]) then
      local l, r, u, d = at(q, x - 1, y), at(q, x + 1, y), at(q, x, y - 1), at(q, x, y + 1)
      if l ~= 0 and l ~= c and l == r and r == u and u == d then fix[#fix + 1] = { x, y, l } end
    end
  end end
  for _, p in ipairs(fix) do q.px[p[2]][p[1]] = p[3] end
end

-- 1 px outline: every opaque pixel with a transparent side neighbour becomes the outline colour.
function M.outline(q, idx)
  local edge = {}
  for y = 0, q.h - 1 do for x = 0, q.w - 1 do
    if q.px[y][x] ~= 0 and (at(q, x - 1, y) == 0 or at(q, x + 1, y) == 0 or at(q, x, y - 1) == 0
        or at(q, x, y + 1) == 0) then
      edge[#edge + 1] = { x, y }
    end
  end end
  for _, p in ipairs(edge) do q.px[p[2]][p[1]] = idx end
end

-- Full clean pipeline from a source grid to an index grid exactly h px tall.
function M.cleanAt(pal, src, h)
  local q = M.quantize(pal, M.areaResize(src, h), 0.5, M.characterColours(pal))
  M.despeckle(q)
  M.smoothLone(q, { [M.paletteIndex(pal, "outline")] = true })
  M.outline(q, M.paletteIndex(pal, "outline"))
  M.despeckle(q)
  return q
end

-- Opaque bounds of an index grid.
function M.bounds(q)
  local minx, miny, maxx, maxy = q.w, q.h, -1, -1
  for y = 0, q.h - 1 do for x = 0, q.w - 1 do
    if q.px[y][x] ~= 0 then
      minx = math.min(minx, x); maxx = math.max(maxx, x)
      miny = math.min(miny, y); maxy = math.max(maxy, y)
    end
  end end
  return minx, miny, maxx, maxy
end

-- Ground point between the feet: middle of the opaque span over the bottom `rows` rows.
function M.feetX(q, rows)
  local lo, hi = q.w, -1
  local _, _, _, maxy = M.bounds(q)
  for y = maxy - (rows or 4) + 1, maxy do for x = 0, q.w - 1 do
    if q.px[y][x] ~= 0 then lo = math.min(lo, x); hi = math.max(hi, x) end
  end end
  return (lo + hi) / 2, maxy
end

-- Nearest-neighbour resize of an index grid to height h (imitates drawImage with smoothing off).
function M.nearestResize(q, h)
  local s = q.h / h
  local w = math.max(1, math.floor(q.w / s + 0.5))
  local sx = q.w / w
  local o = { w = w, h = h, px = {} }
  for y = 0, h - 1 do
    o.px[y] = {}
    local yy = math.min(q.h - 1, math.floor((y + 0.5) * s))
    for x = 0, w - 1 do o.px[y][x] = q.px[yy][math.min(q.w - 1, math.floor((x + 0.5) * sx))] end
  end
  return o
end

-- Remap index grid colours through a { [from] = to } table (palette swap).
function M.remap(q, map)
  local o = { w = q.w, h = q.h, px = {} }
  for y = 0, q.h - 1 do
    o.px[y] = {}
    for x = 0, q.w - 1 do local c = q.px[y][x]; o.px[y][x] = map[c] or c end
  end
  return o
end

-- Draw an index grid into an RGB image at (ox, oy).
function M.blit(img, pal, q, ox, oy)
  for y = 0, q.h - 1 do for x = 0, q.w - 1 do
    local c = q.px[y][x]
    if c ~= 0 then
      local p = pal[c]
      img:drawPixel(ox + x, oy + y, app.pixelColor.rgba(p[1], p[2], p[3], 255))
    end
  end end
end

-- An Aseprite Palette object from the .gpl list (index 0 transparent, then the colours).
function M.asepritePalette(pal)
  local p = Palette(#pal + 1)
  p:setColor(0, Color { r = 0, g = 0, b = 0, a = 0 })
  for i, c in ipairs(pal) do p:setColor(i, Color { r = c[1], g = c[2], b = c[3], a = 255 }) end
  return p
end

return M
