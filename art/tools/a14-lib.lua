-- A14 helpers shared by a14-print-extract.lua and a14-build.lua: Mr. Sells's palette groups and the shirt's anchor.

local L = dofile("C:/Hogg Squash/hogg-squash/art/tools/pixel-lib.lua")
local M = {}

function M.indices(pal)
  local I = function(n) return L.paletteIndex(pal, n) end
  local S = {
    SD = I("shirt red shade (A13)"), SR = I("shirt red (A13)"), SL = I("shirt red light (A13)"),
    O = I("outline"), W = I("white"), KITRED = I("kit red"),
  }
  S.shirt = { [S.SD] = true, [S.SR] = true, [S.SL] = true }
  -- the generator's reds, and the tee entry each becomes inside the shirt (as in a13-build.lua)
  S.toShirt = {
    [I("red 1 (deepest)")] = S.SD, [I("red 2")] = S.SD, [I("tin")] = S.SD,
    [I("Hogg red (court lines)")] = S.SR, [I("kit red")] = S.SR, [I("red highlight")] = S.SL,
  }
  S.light = {}
  for _, n in ipairs({ "grey 2", "grey 3", "side wall", "white kit shade", "front wall", "white" }) do S.light[I(n)] = true end
  S.skinHair = {}
  for _, n in ipairs({ "skin 4", "skin 5", "skin 6 (highlight)", "skin 7 (light, S15)", "hair dark", "hair" }) do
    S.skinHair[I(n)] = true
  end
  return S
end

-- The shirt's anchor: the mean column of its pixels, and its top row within 6 px of that column.
function M.anchor(q, S, isShirt)
  isShirt = isShirt or function(c) return S.shirt[c] end
  local sx, n = 0, 0
  for y = 0, q.h - 1 do for x = 0, q.w - 1 do
    if isShirt(q.px[y][x]) then sx = sx + x; n = n + 1 end
  end end
  if n == 0 then return nil end
  local cx = math.floor(sx / n + 0.5)
  for y = 0, q.h - 1 do
    for x = cx - 6, cx + 6 do
      if x >= 0 and x < q.w and isShirt(q.px[y][x]) then return cx, y end
    end
  end
end

return M
