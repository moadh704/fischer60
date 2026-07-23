# Fischer60

Beautiful interactive website for all **60 games** from Bobby Fischer's classic book *My 60 Memorable Games*.

**Live site:** https://moadh704.github.io/fischer60/

## Deploy with the classic branch method (recommended)

This is the most reliable way:

### 1. On your computer run:

```bash
git clone https://github.com/moadh704/fischer60.git
cd fischer60
npm install
npm run build
npx gh-pages -d dist
```

(The last command will create/update the `gh-pages` branch with the built files.)

### 2. Enable GitHub Pages from branch:

1. Go to https://github.com/moadh704/fischer60/settings/pages
2. Under **Source** choose **Deploy from a branch**
3. Branch: `gh-pages`  /  Folder: `/ (root)`
4. Click **Save**

Wait 1–2 minutes and the site will be live at:
**https://moadh704.github.io/fischer60/**

---

## Local development

```bash
npm install
npm run dev
```

## Tech

- Vite + React + TypeScript
- Tailwind CSS
- chess.js + react-chessboard
