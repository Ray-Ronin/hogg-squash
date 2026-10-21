-- Hand fixes for a2-build.lua, applied after the scripted cleanup.
--   [tag][n] = { { x, y, colourName or 0 }, ... }  single pixels in the cleaned frame (before it is placed)
--   offset[tag][n] = { dx, dy }                     nudge one frame after the soles go on the ground line
--   erase[tag][n] = { { x0, y0, x1, y1 }, ... }     clear rectangles, relative to the feet pivot (inclusive)
return {
  erase = {
    -- A3: the forehand's contact frame has a ghost racket shaft standing up from the real one.
    forehand = { [4] = { { 30, -108, 34, -85 } } },
  },
}
