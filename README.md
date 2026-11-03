# 🏗️ Builder World

A one-player factory and survival game in a world that goes on forever. Your world saves itself, so you can come back to it.

## How to play

You start next to your 🏰 **centre tower**. Walk with **WASD / arrow keys**, or the joystick on a phone.

- **Gather:** tap 🌲 trees, 🪨 rocks, 🔩 metal scraps and 🫐 berry bushes next to you (hold to keep gathering). It goes in your 🎒 backpack (30 things max).
- **Bring it home:** stuff only counts once it reaches the tower. Walk your backpack there, or build harvesters and run conveyor belts into the tower.
- **Tame animals** by tapping them: 🐺 + 5🫐 = 🐕 **dog** (follows you and fights monsters), 🐀 + 2🫐 = 🐁 **tamed rat** (each one makes harvesters 5% faster).
- **Day and night go round forever.** At night monsters come for the tower, and every night there are more of them. If the tower falls, the game is over.

## Buildings

| | Cost | What it does |
|---|---|---|
| ➡️ Conveyor belt | 1🔩 1🪨 | Carries stuff the way it points. Drag to lay a line. |
| 🔀 Splitter | 2🔩 1🪨 | Sends things left, straight on and right, taking turns. |
| 🧱 Wall | 2🪵 2🪨 | Monsters must break through. Drag to build a line. |
| 🪓 Wood harvester | 1🔩 2🪵 | Build on a tree. Pushes wood out of its arrow side. |
| ⛏️ Rock harvester | 2🔩 1🪨 | Build on a rock. |
| 🧲 Metal harvester | 3🔩 | Build on metal scraps. |
| 🔫 Basic turret | 2🪵 2🪨 2🔩 | Quick shots, range 5. |
| 🎯 Sniper turret | 2🪵 5🔩 | Huge hits from far away, range 10. |
| 🔥 Fire turret | 4🪵 2🪨 4🔩 | Burns everything close by, range 3. |
| 💥 Mega turret | 4🪵 8🪨 10🔩 | Exploding shells, range 6.5. |

The turret costs weren't in the original idea, so these are a first guess. Change them in `BUILD` at the top of `builder.js`.

## Monsters

- 👹 **Rallet:** the basic monster.
- 💀 **Archen:** stops and shoots arrows (from night 2).
- 👾 **Minsi:** tiny, weak and fast.
- 🧌 **Megso:** giant, strong and slow (from night 3).

## Controls

| | Computer | Phone |
|---|---|---|
| Move | WASD / arrows | Joystick |
| Gather, tame, hit | Click | Tap |
| Pick a building | 1–9, 0 | Bottom bar |
| Turn a building | R | ↻ Turn |
| Remove | X, or right-click | 🗑️ Remove |
| Zoom | Mouse wheel, + / − | |
| Pause | P | ☰ |

## Files

- `index.html`: the page and styles.
- `builder.js`: everything else. All the numbers (costs, turret damage, monster strength, day length) are in the tables at the top.
