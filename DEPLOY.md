# 🚀 Deploy SkyView to GitHub Pages

> **Free hosting** — your weather dashboard will be live at  
> `https://<your-username>.github.io/skyview-weather/`

---

## Prerequisites
- A free [GitHub](https://github.com) account
- [Git](https://git-scm.com/downloads) installed on your computer

---

## Step-by-step

### 1 · Initialize a git repo

Open a terminal in your project folder and run:

```bash
cd "C:\Users\ABC\.gemini\antigravity\scratch\weather-dashboard"
git init
git add .
git commit -m "🌤 Initial SkyView dashboard"
```

### 2 · Create a GitHub repository

1. Go to [github.com/new](https://github.com/new)
2. Name it **`skyview-weather`** (or anything you like)
3. Keep it **Public**
4. **Do NOT** initialize with README (we already have files)
5. Click **Create repository**

### 3 · Push your code

Copy the commands GitHub shows you, or use:

```bash
git remote add origin https://github.com/<your-username>/skyview-weather.git
git branch -M main
git push -u origin main
```

### 4 · Enable GitHub Pages

1. On your repo page → click **Settings**
2. Scroll to **Pages** (left sidebar)
3. Under **Source**, select **Deploy from a branch**
4. Branch: **`main`** · Folder: **`/ (root)`**
5. Click **Save**

### 5 · Visit your live site 🎉

After ~1 minute, your site is live at:
```
https://<your-username>.github.io/skyview-weather/
```

---

## Updating the site

Every time you push changes, GitHub Pages auto-deploys:

```bash
git add .
git commit -m "✨ Add new feature"
git push
```

---

## Tips

| Tip | Detail |
|-----|--------|
| **Custom domain** | Go to Settings → Pages → Custom domain |
| **HTTPS** | GitHub Pages provides free SSL automatically |
| **404 errors** | Make sure `index.html` is in the **root** of the repo |
