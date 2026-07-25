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

Sounds are loaded automatically from a public source (Chess.com-style effects).
No local files required — just works after deploy.

Mute with the 🔊 button or press **M**.

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
