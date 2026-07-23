# Fischer60

Beautiful interactive website for all **60 games** from Bobby Fischer's classic book *My 60 Memorable Games*.

**Live site (after enabling Pages):**  
https://moadh704.github.io/fischer60/

## Features

- All 60 games with titles
- Interactive chessboard (react-chessboard)
- Clickable move list + auto-play + flip board
- Search by player, year, title, ECO
- Clean dark premium UI

## Local development

```bash
npm install
npm run dev
```

## Deploy to GitHub Pages

The repo already has a GitHub Actions workflow (`.github/workflows/deploy.yml`).

### One-time setup (you need to do this):

1. Go to the repository: https://github.com/moadh704/fischer60
2. Click **Settings** → **Pages** (left sidebar)
3. Under **Build and deployment** → **Source**, select **GitHub Actions**
4. Save

After that, every push to `main` will automatically build and deploy the site.

You can also trigger it manually from the **Actions** tab.

## Tech

- Vite + React + TypeScript
- Tailwind CSS
- chess.js + react-chessboard

---

Made for chess lovers.
