# Controls

Each player has six actions: **left, right, up (toward the front wall), down, HARD, SOFT**.
As in the arcade, shot angle comes from swing *timing*, not the joystick, so two hit buttons are all a player needs.
The input layer turns keyboard keys or gamepad buttons into these actions, so the game code never knows which device is in use.

## Keyboard: two players, one keyboard (decided 2026-10-18)

| | Move | HARD | SOFT |
|---|---|---|---|
| **Player 1** (left side) | W A S D | F | G |
| **Player 2** (right side) | Arrow keys | Numpad 0 | Numpad . |

*All keys are remappable* (options screen). Laptops without a numpad will need to remap P2's hit keys; suggested fallback: . (period) and / (slash), or K / L.
*Num Lock doesn't matter:* with Num Lock off, those keys act as Insert/Delete, but the game reads the physical key (`Numpad0`, `NumpadDecimal`), so they work either way.
*Single player:* either layout works, and P1's layout is the default.

### Pitfalls this layout avoids
- **Never use Ctrl as a hit key.** If P1 is holding **W** and P2 presses **Ctrl**, the browser sees **Ctrl+W** and closes the tab, and a web page can't block that shortcut. Ctrl+R / Ctrl+S / Ctrl+D have similar problems. **Alt** opens browser menus on Windows. Tab moves focus.
- **Keyboard ghosting.** Many cheaper keyboards can't register some combinations of 3+ keys pressed at once, so a key press just doesn't arrive. WASD + F/G and the arrow cluster usually work together, but it varies by keyboard. Plan: a small **"key test" screen** in the options that lights up every key being held, so players can check their keyboard. Hit keys should be **remappable**.
- **Physical key position, not letter.** Read `KeyboardEvent.code` (`KeyW`, `ArrowLeft`, `Period`…) rather than `key`. Then the layout stays in the same place on AZERTY/QWERTZ keyboards.
- **Stop the browser reacting.** Call `preventDefault()` on game keys, otherwise arrows scroll the page (and `/`, if remapped to, opens quick-find in Firefox).
- **Lost focus.** If the window loses focus (alt-tab), clear all held keys and pause, so nobody keeps running forever.

## Gamepads: two controllers on one PC
- Uses the browser **Gamepad API**, polled once per frame (`navigator.getGamepads()`).
- **A browser only reports a gamepad after a button on it has been pressed** (a privacy rule). So the menu should say "Press any button on your controller", then assign that pad to the next free player slot.
- Xbox and PlayStation controllers report the browser's *standard* layout in Chrome and Edge. Firefox is less consistent. Default mapping: **left stick or D-pad = move, A/Cross = HARD, B/Circle or X/Square = SOFT, Start = pause**.
- Mixing is allowed: P1 on the keyboard and P2 on a gamepad, or the reverse. (Built in S7: a player's keys keep working after their pad joins, and left/right on a pad in the controller overlay changes sides.)
- Handle unplugging mid-match: pause and show "Controller disconnected".

## Touch controls: phones and tablets (decided 2026-10-20, built in S11b)
- On-screen buttons over the canvas: move on the left (D-pad or thumb stick), **HARD** and **SOFT** on the right. Menus work by tapping.
- **Shown only when someone is playing by touch.** Setting "Touch controls: Auto / On / Off" (default Auto):
  - **Auto:** hidden at start, shown on the first touch, hidden again on a key press or gamepad input. Screen size and user-agent guesses aren't used, because touchscreen laptops and tablets with keyboards fool them.
  - **On / Off:** always or never shown.
- Read `touchstart`/`touchend` (not `click`) so two fingers work at once, and set `touch-action: none` so the page doesn't scroll or zoom.
- **1P vs CPU only on touch.** 2P needs a keyboard or gamepads.
- The game is 640×360 (landscape), so portrait phones get a "Turn your phone sideways" message.

## Menu navigation and pause
- Arrows/WASD + Enter/Space, or the D-pad + A. (Built in S10: a player's HARD key also means OK and SOFT means back, as do A and B/X on a pad; Esc goes back a step.)
- **Esc pauses** (and Start on a gamepad).
- **Fullscreen catch:** while the game is fullscreen, the browser uses Esc to exit fullscreen and the page may never see the key. So the game also pauses whenever it leaves fullscreen or the window loses focus.
