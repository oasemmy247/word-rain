# 🌧️ Word Rain

A fast, fun typing game. Words fall from the sky, and you type each one before it hits the ground.

**▶ Play it here:** https://YOUR-USERNAME.github.io/word-rain/

## How to play

- Choose a difficulty (**Easy**, **Normal** or **Hard**) and a scene (🌅 **Sunset**, 🌃 **Neon City** or 🌲 **Forest**), then press **Start**.
- Type a falling word into the box at the bottom. You don't need to press Enter.
- The word you're typing lights up yellow. If the box turns red, you made a typo.
- Each word that hits the ground costs a life. Words glow red when they're close.
- Every 8 words you go up a level: the words fall faster and get longer.

### Combos
Clear words in a row without missing any. Every 5 in a row multiplies your points, up to **x5**.

### Power-ups
| Power-up | Type it to… |
|----------|-------------|
| 💣 Bomb | clear every word on screen |
| ❄️ Freeze | slow time down for 5 seconds |
| ❤️ Heart | get an extra life (max 5) |

Missing a power-up doesn't cost a life.

### Controls
- **Enter** starts the game
- **Esc** pauses or resumes. The game also pauses by itself if you switch tabs.
- 🔊 turns the sound on or off

At the end you'll see your score, words cleared, accuracy, typing speed (WPM), best combo and level. Your best score for each difficulty is saved in your browser.

## Built with

Plain HTML, CSS and JavaScript. No libraries, no images, no audio files. The background scenes are drawn in code with SVG, and the sounds are made in code with the Web Audio API.

| File         | What it does                                       |
|--------------|----------------------------------------------------|
| `index.html` | The structure: top bar, game area, menus           |
| `style.css`  | Colours, layout, rain and all the animations       |
| `script.js`  | The game: falling words, typing, power-ups, sound  |
| `scenes.js`  | The three illustrated background scenes            |

## Ideas for later

- [ ] Word themes (animals, countries, food)
- [ ] Online leaderboard
- [ ] Boss words (very long words worth big points)
