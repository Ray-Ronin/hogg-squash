// @ts-check
// Game units → metres → screen. The arcade's units aren't to scale (≈45/m across, ≈35.2/m high, ≈18.8/m deep),
// so we project in metres to make the court look like a real 6.4 × 9.75 m court.
// The camera is a pinhole behind the back wall, looking straight at the front wall. It isn't tilted: the image
// is shifted instead (cy), so vertical lines stay vertical. Every camera constant is in CAMERA.

/** Game units per metre on each axis. */
export const UNITS_PER_M = { x: 45, y: 35.2, z: 18.8 };

/** Back wall in metres from the front wall (z = 183 units). */
const COURT_DEPTH_M = 183 / UNITS_PER_M.z;

export const CAMERA = {
  behindBack: 8.1,   // metres from the back wall (glass) to the camera
  height: 4.0,       // metres above the floor
  x: 0,              // metres from the court centre line
  focal: 557,        // pixels per metre at 1 m from the camera
  cx: 320,           // screen x of the camera axis
  cy: 70,            // screen y of the camera's eye height
};

/**
 * @typedef {{ sx: number, sy: number, scale: number }} ScreenPoint
 * sx, sy in back-buffer pixels; scale = pixels per metre at that depth.
 */

/**
 * Project a point in game units (x across, y height, z depth from the front wall).
 * @param {number} x
 * @param {number} y
 * @param {number} z
 * @returns {ScreenPoint}
 */
export function project(x, y, z) {
  const c = CAMERA;
  const d = COURT_DEPTH_M + c.behindBack - z / UNITS_PER_M.z;   // distance in front of the camera
  const scale = c.focal / d;
  return {
    sx: c.cx + (x / UNITS_PER_M.x - c.x) * scale,
    sy: c.cy + (c.height - y / UNITS_PER_M.y) * scale,
    scale,
  };
}
