// @ts-check
// Game units → metres → screen. The arcade's units aren't to scale (≈45/m across, ≈35.2/m high, ≈18.8/m deep),
// so we project in metres to make the court look like a real 6.4 × 9.75 m court.
// The camera is a pinhole behind the back wall, looking straight at the front wall. It isn't tilted: the image
// is shifted instead (cy), so vertical lines stay vertical. Every camera constant is in CAMERA.
// FROZEN (2026-10-21, S8b): CAMERA is the owner's pick, `wide`, and the painted court (A4) is drawn to it. Moving it
// means repainting the court. ?cam=zoom|old shows the other S8b candidates for comparison only (until S12).

/** Game units per metre on each axis. */
export const UNITS_PER_M = { x: 45, y: 35.2, z: 18.8 };

/** Back wall in metres from the front wall (z = 183 units). */
const COURT_DEPTH_M = 183 / UNITS_PER_M.z;

/**
 * @typedef {{ behindBack: number, height: number, x: number, focal: number, cx: number, cy: number, widen: number }} Camera
 */

/**
 * The S8b candidates (CP-D: "a little wider"); the owner picked wide. old: the S1 camera (front wall 200 × 143 px, floor 440 px wide at the glass, 100 px margins).
 * wide: the same, stretched across only (front wall 220 × 143, floor 484 at the glass, 78 px margins).
 * zoom: focal 10% longer (front wall 220 × 157, 78 px margins), the eye line raised so the floor at the glass stays
 * at y 345, as with old.
 * @type {Record<'old' | 'wide' | 'zoom', Camera>}
 */
export const CAMERAS = {
  old: { behindBack: 8.1, height: 4.0, x: 0, focal: 557, cx: 320, cy: 70, widen: 1 },
  wide: { behindBack: 8.1, height: 4.0, x: 0, focal: 557, cx: 320, cy: 70, widen: 1.1 },
  zoom: { behindBack: 8.1, height: 4.0, x: 0, focal: 612, cx: 320, cy: 43, widen: 1 },
};

/**
 * The camera, frozen at S8b: wide. Front wall 220 × 143 px to the out-line (x 210–430, y 52–195), floor from y 195 at
 * the front wall to y 345 at the glass (150 px deep, 484 px wide there), side margins 78 px at the glass.
 * @type {Camera}
 */
export const CAMERA = {
  behindBack: 8.1,   // metres from the back wall (glass) to the camera
  height: 4.0,       // metres above the floor
  x: 0,              // metres from the court centre line
  focal: 557,        // pixels per metre at 1 m from the camera
  cx: 320,           // screen x of the camera axis
  cy: 70,            // screen y of the camera's eye height
  widen: 1.1,        // screen x offsets are stretched by this (1: true perspective; the court reads 10% wider)
};

/**
 * Switch the camera (?cam=). Call it before the court is first drawn: the court is painted once and cached.
 * @param {keyof typeof CAMERAS} name
 */
export function useCamera(name) {
  Object.assign(CAMERA, CAMERAS[name]);
}

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
    sx: c.cx + (x / UNITS_PER_M.x - c.x) * scale * c.widen,
    sy: c.cy + (c.height - y / UNITS_PER_M.y) * scale,
    scale,
  };
}
