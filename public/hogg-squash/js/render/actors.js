// @ts-check
// The ball, its shadow and the placeholder player box, drawn in depth order (far first).
import { FP } from '../squash-physics.js';
import { project } from './projection.js';

const BALL_RADIUS_M = 0.05;           // drawn larger than a real ball (0.02 m) so it reads at 640×360
const COLOURS = { ball: '#1b1b1b', shadow: 'rgba(0, 0, 0, 0.35)', box: '#c8102e', boxSwing: '#ff6a7f', outline: '#000' };

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {{ x: number, y: number, z: number }} ball  16.16
 * @param {{ x: number, z: number, swing: unknown }} player  16.16
 * @param {{ boxHeight: number }} opts  the box is a fixed pixel height at any depth, as sprites will be
 */
export function drawActors(ctx, ball, player, opts) {
  const bx = ball.x / FP, by = Math.max(0, ball.y / FP), bz = ball.z / FP;

  const shadow = project(bx, 0, bz);
  const r = Math.max(1, BALL_RADIUS_M * shadow.scale);
  ctx.fillStyle = COLOURS.shadow;
  ctx.beginPath();
  ctx.ellipse(shadow.sx, shadow.sy, r * 1.2, r * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();

  const drawBall = () => {
    const p = project(bx, by, bz);
    ctx.fillStyle = COLOURS.ball;
    ctx.beginPath();
    ctx.arc(p.sx, p.sy - r, r, 0, Math.PI * 2);
    ctx.fill();
  };
  const drawBox = () => {
    const p = project(player.x / FP, 0, player.z / FP);
    const h = opts.boxHeight, w = Math.round(h * 0.36);
    const x = Math.round(p.sx - w / 2), y = Math.round(p.sy) - h;
    ctx.fillStyle = COLOURS.outline;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = player.swing ? COLOURS.boxSwing : COLOURS.box;
    ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
  };

  if (bz < player.z / FP) { drawBall(); drawBox(); } else { drawBox(); drawBall(); }
}
