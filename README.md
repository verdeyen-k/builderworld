# 🏗️ Builder World

A one-player factory and survival game in a world that goes on forever. There are 4 save files (🔴 red, 🔵 blue, 🟢 green and 🟡 yellow), and each world saves itself so you can come back to it.

## How to play

You start next to your 🏰 **centre tower**. Walk with **WASD / arrow keys**, or the joystick on a phone.

- **Gather:** tap 🌲 trees, 🪨 rocks, 🔩 metal scraps and 🫐 berry bushes next to you (hold to keep gathering). It goes in your 🎒 backpack (30 things max).
- **Bring it home:** stuff only counts once it reaches the tower. Walk your backpack there, or build harvesters and run conveyor belts into the tower.
- **Tame animals** by tapping them: 🐺 + 5🫐 = 🐕 **dog** (follows you and fights monsters), 🐀 + 2🫐 = 🐁 **tamed rat** (each one makes harvesters 5% faster), 🐔 + 7🫐 = 🐓 **chicken** (each one makes dogs 5% stronger), 🦉 + 9🫐 = **owl** (follows you and heals you and your dogs nearby).
- **Day and night go round forever.** At night monsters come for the tower, and every night there are more of them. If the tower falls, the game is over.

## Buildings

| | Cost | What it does |
|---|---|---|
| ➡️ Conveyor belt | 1🔩 1🪨 | Carries stuff the way it points. Drag to lay a line. |
| 🌉 Over belt | 2🔩 2🪨 | A raised belt that goes over other belts and walls, so two lines can cross. Stuff drops off its end onto a belt or the tower. |
| 🔀 Splitter | 2🔩 1🪨 | Sends things left, straight on and right, taking turns. |
| 🏭 Furnace | 9🪨 | Belt rocks into it. Each rock becomes 💠 xenonite or 🔶 kenalite (50% each), which come out of its arrow side. |
| ✨ Speed up | 1🔶 | Tap or drag over belts, over belts and splitters to make them 2× faster. |
| 🚗 Car | 4🪨 1💠 | Tap it to get in and drive 2.4× faster than walking. Pick a turret and tap a car to put the turret on it. |
| 🧱 Wall | 2🪵 2🪨 | Monsters must break through. Drag to build a line. |
| 🪓 Wood harvester | 1🔩 2🪵 | Build on a tree. Pushes wood out of its arrow side. |
| ⛏️ Rock harvester | 2🔩 1🪨 | Build on a rock. |
| 🧲 Metal harvester | 3🔩 | Build on metal scraps. |
| 🔫 Basic turret | 2🪵 2🪨 2🔩 | Quick shots, range 5. |
| 🎯 Sniper turret | 2🪵 5🔩 | Huge hits from far away, range 10. |
| 🔥 Fire turret | 4🪵 2🪨 4🔩 | Burns everything close by, range 3. |
| 💥 Mega turret | 4🪵 8🪨 10🔩 | Exploding shells, range 6.5. |

The turret costs weren't in the original idea, so these are a first guess. Change them in `BUILD` at the top of `builder.js`.

## Playing with friends

- **Host:** start or continue a world, open the ☰ menu and press **🌐 Invite friends**. You get a 5-letter code.
- **Join:** on the start screen, type the code under **Play with friends** and press **Join**.
- Up to 8 players can build in one world. Everyone shares the tower's stuff, but each player has their own backpack, and dogs and owls follow whoever tamed them.
- The host's browser runs the world and saves it in the host's save file. While friends are there the world keeps going even with the menu open. If the host leaves, the game ends for everyone.
- Browsers connect straight to each other. [PeerJS](https://peerjs.com/) (its free public server) only helps them find each other using the code. Some school or work networks block this kind of connection.

## Monsters

- 👹 **Rallet:** the basic monster.
- 💀 **Archen:** stops and shoots arrows (from night 2).
- 👾 **Minsi:** tiny, weak and fast.
- 🧌 **Megso:** giant, strong and slow (from night 3).
- 👺 **Doubleshot:** shoots 2 bullets at a time from super far away, range 9, so only sniper turrets can reach it (from night 4).

## Controls

| | Computer | Phone |
|---|---|---|
| Move | WASD / arrows | Joystick |
| Gather, tame, hit | Click | Tap |
| Pick a building | 1–9, 0, O (over belt), F (furnace), T (speed up), C (car) | Bottom bar |
| Turn a building | R | ↻ Turn |
| Remove | X, or right-click | 🗑️ Remove |
| Zoom | Mouse wheel, + / − | |
| Pause | P | ☰ |

## Files

- `index.html`: the page and styles.
- `builder.js`: everything else. All the numbers (costs, turret damage, monster strength, day length) are in the tables at the top.
- `version.txt`: the newest version number. When you change the game, bump it here and in the two `7`s in `index.html` (`builder.js?v=` and `var V =`), so old copies in browsers reload themselves.
