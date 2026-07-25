# Fischer60

**Beautiful interactive website** for all **60 games** from Bobby Fischer's classic book *My 60 Memorable Games*.

**Live site:** [https://fischer60.vercel.app](https://fischer60.vercel.app)

---

## Features

- Full PGN replay of every game with modern chessboard
- Last-move highlighting
- Captured pieces display
- Keyboard navigation (← → moves, Space play/pause, F flip, M mute, N/P games)
- Autoplay with speed control (Slow → Blitz)
- **Move sounds** (move / capture / check / castle / promote) with mute toggle
- Search by title, player, year, ECO, game number
- Copy PGN button
- Previous / Next game navigation
- Premium dark UI inspired by high-end chess platforms
- Fully responsive (mobile game selector)

## Tech

- Vite + React 18 + TypeScript
- Tailwind CSS
- chess.js + react-chessboard

## Sounds

Place the following files in `public/sounds/`:

| File | Description |
|------|-------------|
| `move.mp3` | Regular piece move |
| `capture.mp3` | Capture / en passant |
| `check.mp3` | Check |
| `castle.mp3` | Castling |
| `promote.mp3` | Pawn promotion |

**Recommended free source (Chess.com-style):**

```bash
# Clone the repo or download the mp3s
git clone https://github.com/harrenray/Chess-Sounds.git
# Then rename/copy:
# move-self.mp3 → public/sounds/move.mp3
# capture.mp3   → public/sounds/capture.mp3
# move-check.mp3 → public/sounds/check.mp3
# castle.mp3    → public/sounds/castle.mp3
# promote.mp3   → public/sounds/promote.mp3
```

Alternative free packs: Lichess “piano” / “sfx” themes (AGPL) or Kenney UI Audio.

If the files are missing the player fails silently (no console spam).

## Local development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

Deployed on **Vercel**.
