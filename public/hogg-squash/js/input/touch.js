// @ts-check
// Touch controls for phones and tablets (docs/controls.md, "Touch controls"): HTML buttons over the canvas (the
// markup and look are in index.html), a stick on the left for moving and HARD / SOFT on the right, plus small pause
// and fullscreen buttons. They give the same actions as the keys and pads (input/actions.js), so the sim never
// knows; on the menus the stick moves, HARD is OK and SOFT is back, like a pad. A speaker button beside the fullscreen
// button turns Sound on and off (S13).
// When they show (automatic, no setting; the owner's call after S11b): hidden at start (shown from the start only on a
// phone-like screen: coarse pointer, no hover), shown on the first touch, hidden again when a key is pressed or a pad
// is used. So someone on a computer never sees them.
// Touch is 1P vs CPU only (docs/decisions.md, "Mobile and touch"): the title greys out 2P while they show.
// Touch events (not click), each finger followed by its identifier, so moving and hitting work at once.
// The state and the stick's directions are plain functions, so Node can test them
// (test/touch.test.js); only createTouchControls touches the page.
import { PAD } from './gamepad.js';

/** @typedef {import('../sim/player.js').Actions} Actions */
/** @typedef {{ up: boolean, down: boolean, left: boolean, right: boolean }} Dirs */
/** @typedef {Dirs & { hard: boolean, soft: boolean, pause: boolean }} TouchButtons */
/** One sim step's touch input: the stick's directions held, and what went down since the last step. @typedef {{ held: Dirs, pressed: TouchButtons }} TouchInput */

/** The stick: no direction within this share of its radius of the centre; 8 ways beyond it, as a pad's stick. */
export const STICK = { DEAD: 0.25, DIAGONAL: PAD.DIAGONAL, KNOB: 0.55 };

/**
 * Whether the controls show. touched: touch was used more recently than a key or a pad.
 * @typedef {{ touched: boolean }} TouchState
 */

/** @param {boolean} [phone]  a phone-like screen: they show from the start @returns {TouchState} */
export function makeTouchState(phone = false) {
  return { touched: phone };
}

/** @param {TouchState} s */
export function touchShowing(s) {
  return s.touched;
}

/** The screen was touched. @param {TouchState} s */
export function noteTouch(s) {
  s.touched = true;
}

/** A key was pressed or a pad used. @param {TouchState} s */
export function noteKeyOrPad(s) {
  s.touched = false;
}

/**
 * The stick's directions for a finger dx, dy (px, y down) from its centre, on a stick `radius` px across the middle.
 * @param {number} dx @param {number} dy @param {number} radius @returns {Dirs}
 */
export function stickDirs(dx, dy, radius) {
  const push = Math.hypot(dx, dy);
  const on = push > STICK.DEAD * radius, k = STICK.DIAGONAL * push;
  return { up: on && dy < -k, down: on && dy > k, left: on && dx < -k, right: on && dx > k };
}

/** A player's actions from touch for one sim step: movement held, HARD and SOFT only on a press. @param {TouchInput} t @returns {Actions} */
export function touchActions(t) {
  const { held, pressed } = t;
  return { up: held.up, down: held.down, left: held.left, right: held.right, hard: pressed.hard, soft: pressed.soft };
}

/** The menu moves touch made this step (the stick moves, HARD is OK, SOFT is back, pause is Start). @param {TouchInput} t */
export function touchNavs(t) {
  /** @type {import('../ui/screens.js').Nav[]} */
  const out = [];
  for (const d of /** @type {const} */ (['up', 'down', 'left', 'right'])) if (t.pressed[d]) out.push(d);
  if (t.pressed.hard) out.push('ok');
  if (t.pressed.soft) out.push('back');
  if (t.pressed.pause) out.push('start');
  return out;
}

const noDirs = () => ({ up: false, down: false, left: false, right: false });
const noButtons = () => ({ ...noDirs(), hard: false, soft: false, pause: false });

/**
 * @typedef {object} TouchControls
 * @property {() => TouchInput} take  this step's input (presses since the last call, then forgotten)
 * @property {(on: boolean, inMatch: boolean, overCourt?: boolean) => void} show  show or hide them (the pause button
 *   only in a match). The fullscreen and speaker buttons show with them, and on their own on the screens that aren't
 *   over the court (the title, setup and options), so they can be clicked with a mouse too.
 * @property {(on: boolean) => void} setSound  show the speaker button on (Sound on) or crossed out (off)
 * @property {() => void} release  let go of everything (the window lost focus)
 */

/**
 * Go fullscreen (the whole page, landscape where the browser can lock it), or leave it. Leaving it pauses a match
 * (main.js's fullscreenchange). Must be called from a click or a touch's release.
 * @param {Document} [doc]
 */
export function toggleFullscreen(doc = document) {
  if (doc.fullscreenElement) doc.exitFullscreen().catch(() => {});
  else {
    doc.documentElement.requestFullscreen()
      .then(() => /** @type {any} */ (screen.orientation)?.lock?.('landscape'))
      .catch(() => {});
  }
}

/**
 * The on-screen controls: index.html's #touch with #stick (and its .knob), #hard, #soft and #pause, and #full and the
 * speaker button #sound beside it.
 * @param {Document} [doc]
 * @param {() => void} [onSound]  the speaker button was pressed (called inside the click or the finger's release, so the
 *   sound engine may start there: the browser's rule)
 * @returns {TouchControls}
 */
export function createTouchControls(doc = document, onSound = () => {}) {
  const root = /** @type {HTMLElement} */ (doc.getElementById('touch'));
  const el = (/** @type {string} */ id) => /** @type {HTMLElement} */ (doc.getElementById(id));
  const stick = el('stick'), knob = /** @type {HTMLElement} */ (stick.querySelector('.knob'));
  const pauseBtn = el('pause'), fullBtn = el('full'), soundBtn = el('sound');
  /** @type {Dirs} */
  let held = noDirs();
  /** @type {TouchButtons} */
  let pressed = noButtons();
  /** The finger on the stick (Touch.identifier), if any. */
  let stickFinger = /** @type {number | null} */ (null);

  /** @param {Dirs} dirs @param {number} kx @param {number} ky  the knob's offset (px) */
  function setStick(dirs, kx, ky) {
    for (const d of /** @type {(keyof Dirs)[]} */ (Object.keys(dirs))) if (dirs[d] && !held[d]) pressed[d] = true;
    held = dirs;
    knob.style.transform = `translate(${kx}px, ${ky}px)`;
  }

  /** @param {Touch} t */
  function moveStick(t) {
    const r = stick.getBoundingClientRect(), radius = r.width / 2;
    const dx = t.clientX - (r.left + radius), dy = t.clientY - (r.top + r.height / 2);
    const max = STICK.KNOB * radius, k = Math.min(1, max / (Math.hypot(dx, dy) || 1));
    setStick(stickDirs(dx, dy, radius), dx * k, dy * k);
  }

  /** @param {TouchList} list @param {number | null} id */
  const find = (list, id) => [...list].find(t => t.identifier === id);
  /** Touch listeners that keep the browser out of it (no scrolling, zooming or mouse events). @param {HTMLElement} e @param {string} type @param {(ev: TouchEvent) => void} fn */
  const on = (e, type, fn) => e.addEventListener(type, ev => { ev.preventDefault(); fn(/** @type {TouchEvent} */ (ev)); },
    { passive: false });

  on(stick, 'touchstart', ev => {
    if (stickFinger !== null) return;
    const t = ev.changedTouches[0];
    stickFinger = t.identifier;
    stick.classList.add('on');
    moveStick(t);
  });
  on(stick, 'touchmove', ev => {
    const t = find(ev.changedTouches, stickFinger);
    if (t) moveStick(t);
  });
  const stickUp = (/** @type {TouchEvent} */ ev) => {
    if (!find(ev.changedTouches, stickFinger)) return;
    stickFinger = null;
    stick.classList.remove('on');
    setStick(noDirs(), 0, 0);
  };
  on(stick, 'touchend', stickUp);
  on(stick, 'touchcancel', stickUp);

  // HARD, SOFT and pause act as they go down; the fingers on each are counted so the button lights while held
  for (const [id, button] of /** @type {const} */ ([['hard', 'hard'], ['soft', 'soft'], ['pause', 'pause']])) {
    const e = el(id);
    let fingers = 0;
    on(e, 'touchstart', ev => {
      pressed[button] = true;
      fingers += ev.changedTouches.length;
      e.classList.add('on');
    });
    const up = (/** @type {TouchEvent} */ ev) => {
      fingers = Math.max(0, fingers - ev.changedTouches.length);
      if (!fingers) e.classList.remove('on');
    };
    on(e, 'touchend', up);
    on(e, 'touchcancel', up);
  }

  // fullscreen on the finger's release (touchend can start fullscreen; touchstart can't), or a mouse click; hidden where
  // the browser has none (iPhone Safari)
  on(fullBtn, 'touchstart', () => {});
  on(fullBtn, 'touchend', () => toggleFullscreen(doc));
  fullBtn.addEventListener('click', () => toggleFullscreen(doc));
  // the speaker: Sound on / off, the same way (a finger's release, or a click)
  on(soundBtn, 'touchstart', () => {});
  on(soundBtn, 'touchend', () => onSound());
  soundBtn.addEventListener('click', () => onSound());

  function release() {
    stickFinger = null;
    held = noDirs();
    knob.style.transform = '';
    for (const e of root.querySelectorAll('.on')) e.classList.remove('on');
  }

  return {
    take() {
      const out = { held: { ...held }, pressed };
      pressed = noButtons();
      return out;
    },
    show(showing, inMatch, overCourt = inMatch) {
      if (root.hidden === showing) {
        root.hidden = !showing;
        doc.documentElement.classList.toggle('touch', showing);
        if (!showing) release();
      }
      pauseBtn.hidden = !inMatch;
      fullBtn.hidden = !doc.fullscreenEnabled || !(showing || !overCourt);
      soundBtn.hidden = !(showing || !overCourt);
    },
    setSound(soundOn) {
      soundBtn.classList.toggle('off', !soundOn);
      soundBtn.setAttribute('aria-label', soundOn ? 'Sound off' : 'Sound on');
      soundBtn.title = soundOn ? 'Sound off' : 'Sound on';
    },
    release,
  };
}
