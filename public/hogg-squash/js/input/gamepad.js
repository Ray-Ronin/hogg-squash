// @ts-check
// Gamepads through the browser's Gamepad API, polled once per sim step. Chrome and Edge report Xbox and PlayStation
// pads in the "standard" layout; Firefox is best effort (same button numbers, and a D-pad on axes 6/7 if the pad isn't
// "standard"). A browser only reports a pad after one of its buttons has been pressed, so pads join by pressing one.
// Default mapping (docs/controls.md): left stick (dead zone) or D-pad = move, A/Cross = HARD, B/Circle or X/Square = SOFT,
// Start = pause. Pads aren't remappable (only keys are, S11).

/**
 * The standard layout's buttons and the stick's dead zone.
 * DIAGONAL: a stick axis counts once it is this share of the stick's push (sin 22.5°), so the stick has 8 directions.
 */
export const PAD = {
  DEAD_ZONE: 0.3,
  DIAGONAL: 0.383,
  HARD: [0],                  // A / Cross
  SOFT: [1, 2],               // B / Circle, X / Square
  START: [9],                 // Start / Options
  DPAD: { up: 12, down: 13, left: 14, right: 15 },
};

/** A pad's buttons as the game reads them. @typedef {{ up: boolean, down: boolean, left: boolean, right: boolean, hard: boolean, soft: boolean, start: boolean }} PadButtons */

/** What a pad looks like to this module (a real Gamepad, or a fake one in the tests). @typedef {{ index: number, id: string, connected: boolean, mapping: string, axes: readonly number[], buttons: readonly { pressed: boolean }[] }} PadLike */

/**
 * One pad in one poll.
 * @typedef {object} PadInput
 * @property {number} index     the browser's slot for this pad (stays the same while it is plugged in)
 * @property {string} id        the browser's name for it
 * @property {PadButtons} held
 * @property {PadButtons} pressed  went down since the last poll
 * @property {boolean} any      some button (any button, not the stick) went down since the last poll
 */

/** @param {PadLike} pad @param {number} i */
const button = (pad, i) => !!pad.buttons[i]?.pressed;

/**
 * What a pad holds right now: the stick (outside the dead zone, 8 ways) or the D-pad moves, buttons as mapped.
 * @param {PadLike} pad
 * @returns {PadButtons}
 */
export function padHeld(pad) {
  const [x = 0, y = 0] = pad.axes;
  const push = Math.hypot(x, y);
  const stick = push > PAD.DEAD_ZONE;
  const dir = { up: stick && y < -PAD.DIAGONAL * push, down: stick && y > PAD.DIAGONAL * push,
    left: stick && x < -PAD.DIAGONAL * push, right: stick && x > PAD.DIAGONAL * push };
  // some non-standard pads (Firefox) give the D-pad as axes 6 and 7
  const hat = pad.mapping !== 'standard' && pad.axes.length >= 8;
  const [hx, hy] = hat ? [pad.axes[6], pad.axes[7]] : [0, 0];
  return {
    up: dir.up || button(pad, PAD.DPAD.up) || hy < -0.5,
    down: dir.down || button(pad, PAD.DPAD.down) || hy > 0.5,
    left: dir.left || button(pad, PAD.DPAD.left) || hx < -0.5,
    right: dir.right || button(pad, PAD.DPAD.right) || hx > 0.5,
    hard: PAD.HARD.some(i => button(pad, i)),
    soft: PAD.SOFT.some(i => button(pad, i)),
    start: PAD.START.some(i => button(pad, i)),
  };
}

/** @param {PadButtons} now @param {PadButtons | undefined} before @returns {PadButtons} */
function edges(now, before) {
  const out = { ...now };
  for (const k of /** @type {(keyof PadButtons)[]} */ (Object.keys(now))) out[k] = now[k] && !before?.[k];
  return out;
}

/**
 * Polls the pads and remembers each one's last state, so presses can be told from holds.
 * A pad seen for the first time with a button down counts as a press (that press is what made the browser show it).
 * @param {() => readonly (PadLike | null)[]} [getPads]
 */
export function createPads(getPads = () => (navigator.getGamepads ? navigator.getGamepads() : [])) {
  /** @type {Map<number, { held: PadButtons, buttons: boolean[] }>} */
  const last = new Map();
  return {
    /**
     * Read every pad once.
     * @returns {{ pads: PadInput[], gone: number[] }}  gone: the indexes of pads unplugged since the last poll
     */
    poll() {
      /** @type {PadInput[]} */
      const pads = [];
      const seen = new Set();
      for (const pad of getPads()) {
        if (!pad || !pad.connected) continue;
        seen.add(pad.index);
        const held = padHeld(pad);
        const buttons = pad.buttons.map(b => b.pressed);
        const before = last.get(pad.index);
        pads.push({ index: pad.index, id: pad.id, held, pressed: edges(held, before?.held),
          any: buttons.some((b, i) => b && !before?.buttons[i]) });
        last.set(pad.index, { held, buttons });
      }
      const gone = [...last.keys()].filter(i => !seen.has(i));
      for (const i of gone) last.delete(i);
      return { pads, gone };
    },
  };
}

/** A short name for a pad on screen, from the browser's id ("Xbox 360 Controller (XInput STANDARD GAMEPAD)"). @param {string} id */
export function padName(id) {
  const name = id.replace(/\s*\(.*$/, '').replace(/^[0-9a-f]{4}-[0-9a-f]{4}-/i, '').trim();
  return (name || 'Controller').slice(0, 30);
}
