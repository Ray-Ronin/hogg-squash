-- Hogg Squash A5 (2026-10-22): the lettering shared by the font, the UI pieces and the title.
-- Load with dofile(); everything is on the returned table.
--
-- Glyphs are our own blocky 5x7 capitals (the A4 wall-board letters, art/tools/a4-court.lua, extended), with
-- lowercase and punctuation. Every glyph sits in a 9-row cell: rows 0-6 are the capitals, the baseline is under
-- row 6, rows 7-8 hold descenders. Bigger sizes are the same glyphs doubled with `scale2` (a Scale2x-style
-- doubling that adds pixels on diagonal steps only, so diagonals stay smooth and square corners stay square),
-- then styled with `style` (fill, lower shade, top highlight, 1 px outline, drop shadow).

local M = {}

M.CELL, M.CAP = 9, 7

local G = {
  A = { "01110", "10001", "10001", "11111", "10001", "10001", "10001" },
  B = { "11110", "10001", "10001", "11110", "10001", "10001", "11110" },
  C = { "01110", "10001", "10000", "10000", "10000", "10001", "01110" },
  D = { "11110", "10001", "10001", "10001", "10001", "10001", "11110" },
  E = { "11111", "10000", "10000", "11110", "10000", "10000", "11111" },
  F = { "11111", "10000", "10000", "11110", "10000", "10000", "10000" },
  G = { "01110", "10001", "10000", "10111", "10001", "10001", "01111" },
  H = { "10001", "10001", "10001", "11111", "10001", "10001", "10001" },
  I = { "111", "010", "010", "010", "010", "010", "111" },
  J = { "00111", "00010", "00010", "00010", "00010", "10010", "01100" },
  K = { "10001", "10010", "10100", "11000", "10100", "10010", "10001" },
  L = { "10000", "10000", "10000", "10000", "10000", "10000", "11111" },
  M = { "10001", "11011", "10101", "10101", "10001", "10001", "10001" },
  N = { "10001", "10001", "11001", "10101", "10011", "10001", "10001" },
  O = { "01110", "10001", "10001", "10001", "10001", "10001", "01110" },
  P = { "11110", "10001", "10001", "11110", "10000", "10000", "10000" },
  Q = { "01110", "10001", "10001", "10001", "10101", "10010", "01101" },
  R = { "11110", "10001", "10001", "11110", "10100", "10010", "10001" },
  S = { "01111", "10000", "10000", "01110", "00001", "00001", "11110" },
  T = { "11111", "00100", "00100", "00100", "00100", "00100", "00100" },
  U = { "10001", "10001", "10001", "10001", "10001", "10001", "01110" },
  V = { "10001", "10001", "10001", "10001", "10001", "01010", "00100" },
  W = { "10001", "10001", "10001", "10101", "10101", "10101", "01010" },
  X = { "10001", "10001", "01010", "00100", "01010", "10001", "10001" },
  Y = { "10001", "10001", "01010", "00100", "00100", "00100", "00100" },
  Z = { "11111", "00001", "00010", "00100", "01000", "10000", "11111" },

  a = { "00000", "00000", "01110", "00001", "01111", "10001", "01111" },
  b = { "10000", "10000", "11110", "10001", "10001", "10001", "11110" },
  c = { "00000", "00000", "01111", "10000", "10000", "10000", "01111" },
  d = { "00001", "00001", "01111", "10001", "10001", "10001", "01111" },
  e = { "00000", "00000", "01110", "10001", "11111", "10000", "01111" },
  f = { "0011", "0100", "1110", "0100", "0100", "0100", "0100" },
  g = { "00000", "00000", "01111", "10001", "10001", "10001", "01111", "00001", "01110" },
  h = { "10000", "10000", "11110", "10001", "10001", "10001", "10001" },
  i = { "1", "0", "1", "1", "1", "1", "1" },
  j = { "001", "000", "001", "001", "001", "001", "001", "101", "010" },
  k = { "1000", "1000", "1001", "1010", "1100", "1010", "1001" },
  l = { "10", "10", "10", "10", "10", "10", "01" },
  m = { "00000", "00000", "11010", "10101", "10101", "10101", "10101" },
  n = { "00000", "00000", "11110", "10001", "10001", "10001", "10001" },
  o = { "00000", "00000", "01110", "10001", "10001", "10001", "01110" },
  p = { "00000", "00000", "11110", "10001", "10001", "10001", "11110", "10000", "10000" },
  q = { "00000", "00000", "01111", "10001", "10001", "10001", "01111", "00001", "00001" },
  r = { "0000", "0000", "1011", "1100", "1000", "1000", "1000" },
  s = { "00000", "00000", "01111", "10000", "01110", "00001", "11110" },
  t = { "0100", "0100", "1110", "0100", "0100", "0100", "0011" },
  u = { "00000", "00000", "10001", "10001", "10001", "10011", "01101" },
  v = { "00000", "00000", "10001", "10001", "10001", "01010", "00100" },
  w = { "00000", "00000", "10001", "10001", "10101", "10101", "01010" },
  x = { "00000", "00000", "10001", "01010", "00100", "01010", "10001" },
  y = { "00000", "00000", "10001", "10001", "10001", "10001", "01111", "00001", "01110" },
  z = { "00000", "00000", "11111", "00010", "00100", "01000", "11111" },

  -- digits are all 5 wide, so scores line up
  ["0"] = { "01110", "10001", "10011", "10101", "11001", "10001", "01110" },
  ["1"] = { "00100", "01100", "00100", "00100", "00100", "00100", "01110" },
  ["2"] = { "01110", "10001", "00001", "00010", "00100", "01000", "11111" },
  ["3"] = { "11111", "00010", "00100", "00010", "00001", "10001", "01110" },
  ["4"] = { "00010", "00110", "01010", "10010", "11111", "00010", "00010" },
  ["5"] = { "11111", "10000", "11110", "00001", "00001", "10001", "01110" },
  ["6"] = { "00110", "01000", "10000", "11110", "10001", "10001", "01110" },
  ["7"] = { "11111", "00001", "00010", "00100", "01000", "01000", "01000" },
  ["8"] = { "01110", "10001", "10001", "01110", "10001", "10001", "01110" },
  ["9"] = { "01110", "10001", "10001", "01111", "00001", "00010", "01100" },

  ["-"] = { "000", "000", "000", "111", "000", "000", "000" },
  ["–"] = { "00000", "00000", "00000", "11111", "00000", "00000", "00000" },   -- en dash (scores: 11–9)
  [":"] = { "0", "0", "1", "0", "0", "1", "0" },
  ["."] = { "0", "0", "0", "0", "0", "0", "1" },
  ["!"] = { "1", "1", "1", "1", "1", "0", "1" },
  ["?"] = { "01110", "10001", "00001", "00010", "00100", "00000", "00100" },
  ["'"] = { "1", "1", "0", "0", "0", "0", "0" },
  [","] = { "00", "00", "00", "00", "00", "01", "01", "10" },
  ["/"] = { "00001", "00010", "00010", "00100", "01000", "01000", "10000" },
  ["("] = { "001", "010", "100", "100", "100", "010", "001" },
  [")"] = { "100", "010", "001", "001", "001", "010", "100" },
  ["<"] = { "0001", "0010", "0100", "1000", "0100", "0010", "0001" },
  [">"] = { "1000", "0100", "0010", "0001", "0010", "0100", "1000" },
  ["+"] = { "00000", "00100", "00100", "11111", "00100", "00100", "00000" },
}

-- Every character in the font, in sheet order (the space is only an advance).
M.CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-–:.!?',/()<>+"
M.SPACE = 3      -- the space's width at 1x, before letter spacing

-- The characters of a UTF-8 string, one by one.
function M.chars(s)
  local out = {}
  for _, cp in utf8.codes(s) do out[#out + 1] = utf8.char(cp) end
  return out
end

-- A glyph as a binary grid { w, h = 9, px[y][x] = 0/1 }.
function M.glyph(ch)
  local rows = G[ch] or error("no glyph " .. ch)
  local g = { w = #rows[1], h = M.CELL, px = {} }
  for y = 0, M.CELL - 1 do
    g.px[y] = {}
    for x = 0, g.w - 1 do
      local r = rows[y + 1]
      g.px[y][x] = (r and r:sub(x + 1, x + 1) == "1") and 1 or 0
    end
  end
  return g
end

local function at(g, x, y)
  if x < 0 or y < 0 or x >= g.w or y >= g.h then return 0 end
  return g.px[y][x]
end
M.at = at

-- Double a binary grid. Set pixels become 2x2 blocks (square corners stay square); an empty pixel gets the
-- quarter that touches two set side-neighbours only when the pixel between them diagonally is empty, which is
-- a diagonal step (in an inside corner like H's crossbar it is set, and nothing is added).
function M.scale2(g)
  local o = { w = g.w * 2, h = g.h * 2, px = {} }
  for y = 0, o.h - 1 do o.px[y] = {} end
  for y = 0, g.h - 1 do
    for x = 0, g.w - 1 do
      local p = g.px[y][x]
      local q = { p, p, p, p }                 -- top-left, top-right, bottom-left, bottom-right
      if p == 0 then
        local up, dn, lf, rt = at(g, x, y - 1), at(g, x, y + 1), at(g, x - 1, y), at(g, x + 1, y)
        if up == 1 and lf == 1 and at(g, x - 1, y - 1) == 0 then q[1] = 1 end
        if up == 1 and rt == 1 and at(g, x + 1, y - 1) == 0 then q[2] = 1 end
        if dn == 1 and lf == 1 and at(g, x - 1, y + 1) == 0 then q[3] = 1 end
        if dn == 1 and rt == 1 and at(g, x + 1, y + 1) == 0 then q[4] = 1 end
      end
      o.px[2 * y][2 * x], o.px[2 * y][2 * x + 1] = q[1], q[2]
      o.px[2 * y + 1][2 * x], o.px[2 * y + 1][2 * x + 1] = q[3], q[4]
    end
  end
  return o
end

-- Triple a binary grid, the same way as scale2: set pixels become 3x3 blocks, and on a diagonal step the empty
-- pixel gets the 3-pixel triangle in the corner that touches both set neighbours.
function M.scale3(g)
  local o = { w = g.w * 3, h = g.h * 3, px = {} }
  for y = 0, o.h - 1 do o.px[y] = {} end
  for y = 0, g.h - 1 do
    for x = 0, g.w - 1 do
      local p = g.px[y][x]
      for dy = 0, 2 do for dx = 0, 2 do o.px[3 * y + dy][3 * x + dx] = p end end
      if p == 0 then
        local up, dn, lf, rt = at(g, x, y - 1), at(g, x, y + 1), at(g, x - 1, y), at(g, x + 1, y)
        local corners = {                        -- { needed, corner x, corner y }
          { up == 1 and lf == 1 and at(g, x - 1, y - 1) == 0, 0, 0 },
          { up == 1 and rt == 1 and at(g, x + 1, y - 1) == 0, 2, 0 },
          { dn == 1 and lf == 1 and at(g, x - 1, y + 1) == 0, 0, 2 },
          { dn == 1 and rt == 1 and at(g, x + 1, y + 1) == 0, 2, 2 },
        }
        for _, c in ipairs(corners) do
          if c[1] then
            for dy = 0, 2 do for dx = 0, 2 do
              if math.abs(dx - c[2]) + math.abs(dy - c[3]) <= 1 then o.px[3 * y + dy][3 * x + dx] = 1 end
            end end
          end
        end
      end
    end
  end
  return o
end

-- A glyph at scale 1, 2, 3, 4 or 8 (3 is tripled once; the others are doubled that many times).
function M.scaled(ch, s)
  local g = M.glyph(ch)
  if s == 3 then return M.scale3(g) end
  while s > 1 do g = M.scale2(g); s = s // 2 end
  return g
end

-- A binary grid styled into an index grid (0 = transparent). `st` fields, all palette indices or nil:
--   fill            the letter colour
--   shade, shadeRow the colour of rows at or below shadeRow (in the grid's own rows)
--   hi              the top pixel of every vertical run (a highlight along the tops of the strokes)
--   outline         an outline around the letter, `ow` px wide (default 1; adds ow px on every side)
--   shadow, drop    the outlined letter repeated `drop` px lower in this colour (a solid extrusion)
function M.style(g, st)
  local o1 = st.outline and (st.ow or 1) or 0
  local drop = st.shadow and (st.drop or 1) or 0
  local o = { w = g.w + 2 * o1, h = g.h + 2 * o1 + drop, px = {} }
  for y = 0, o.h - 1 do o.px[y] = {}; for x = 0, o.w - 1 do o.px[y][x] = 0 end end
  local function solid(x, y)                   -- the letter grown by the outline (a diamond), in o's coordinates
    if o1 == 0 then return at(g, x, y) == 1 end
    for dy = -o1, o1 do for dx = -o1, o1 do
      if math.abs(dx) + math.abs(dy) <= o1 and at(g, x - o1 + dx, y - o1 + dy) == 1 then return true end
    end end
    return false
  end
  if drop > 0 then
    for y = 0, o.h - 1 do for x = 0, o.w - 1 do
      for d = 1, drop do if solid(x, y - d) then o.px[y][x] = st.shadow end end
    end end
  end
  if o1 == 1 then
    for y = 0, o.h - 1 do for x = 0, o.w - 1 do if solid(x, y) then o.px[y][x] = st.outline end end end
  end
  for y = 0, g.h - 1 do for x = 0, g.w - 1 do
    if g.px[y][x] == 1 then
      local c = st.fill
      if st.shade and y >= st.shadeRow then c = st.shade end
      if st.hi and at(g, x, y - 1) == 0 then c = st.hi end
      o.px[y + o1][x + o1] = c
    end
  end end
  return o
end

-- A styled glyph: scale s, style st (see M.style).
function M.styled(ch, s, st)
  return M.style(M.scaled(ch, s), st)
end

-- Gap between styled letters so that the letters themselves stand s px apart (the 1 px gap of the 5x7 letters,
-- scaled), whatever the outline adds. Can be negative (outlines touch, shadows overlap).
function M.spacing(s, st)
  return s - (st.outline and 2 * (st.ow or 1) or 0)
end

-- A whole word or line as one index grid (letters styled one by one, laid left to right; later letters
-- overwrite only where they are opaque).
function M.text(str, s, st)
  local gs, w = {}, 0
  local sp = M.spacing(s, st)
  for _, ch in ipairs(M.chars(str)) do
    if ch == " " then
      gs[#gs + 1] = { space = M.SPACE * s }
      w = w + M.SPACE * s + sp
    else
      local g = M.styled(ch, s, st)
      gs[#gs + 1] = g
      w = w + g.w + sp
    end
  end
  w = w - sp
  local h = (gs[1].h or M.styled("A", s, st).h)
  local o = { w = w, h = h, px = {} }
  for y = 0, h - 1 do o.px[y] = {}; for x = 0, w - 1 do o.px[y][x] = 0 end end
  local x0 = 0
  for _, g in ipairs(gs) do
    if g.space then x0 = x0 + g.space + sp
    else
      for y = 0, g.h - 1 do for x = 0, g.w - 1 do
        local c = g.px[y][x]
        if c ~= 0 and x0 + x >= 0 and x0 + x < w then o.px[y][x0 + x] = c end
      end end
      x0 = x0 + g.w + sp
    end
  end
  return o
end

-- Draw an index grid into an indexed Image at (ox, oy), skipping transparent pixels.
function M.put(img, q, ox, oy)
  for y = 0, q.h - 1 do for x = 0, q.w - 1 do
    local c = q.px[y][x]
    if c ~= 0 then img:drawPixel(ox + x, oy + y, c) end
  end end
end

return M
