# Deploy Kannada Bible OBS on Render

---

## Step 1: Push to GitHub

1. Create a new repository on GitHub (e.g. `kannada-bible-obs`)
2. In your project folder on Mac, run:

```bash
cd /Volumes/SSD/kannada-bible-obs
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/kannada-bible-obs.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

---

## Step 2: Deploy on Render

1. Go to [render.com](https://render.com) and sign up / log in
2. Click **New +** → **Web Service**
3. Connect your GitHub account and select the `kannada-bible-obs` repo
4. Configure:
   - **Name:** `kannada-bible-obs` (or any name)
   - **Region:** Oregon (or nearest to you)
   - **Branch:** `main`
   - **Runtime:** Node
   - **Build Command:** `cd server && npm install`
   - **Start Command:** `node server/server.js`
   - **Plan:** Free
5. Click **Create Web Service**
6. Wait for deployment (2–5 minutes)

---

## Step 3: Get Your URL

When deployment completes, Render gives you a URL like:

**https://kannada-bible-obs-xxxx.onrender.com**

Your URLs:

- **Dock:** `https://kannada-bible-obs-xxxx.onrender.com/dock/`
- **OBS Browser Source:** `https://kannada-bible-obs-xxxx.onrender.com/browser/`

---

## Step 4: Add Custom Domain (Optional)

To use **bible.pearmax.in**:

1. In Render Dashboard → your service → **Settings** → **Custom Domains**
2. Add: `bible.pearmax.in`
3. Render will show DNS instructions
4. In Hostinger: Add a **CNAME** record:
   - **Name:** `bible`
   - **Points to:** the hostname Render gives (e.g. `kannada-bible-obs-xxxx.onrender.com`)

---

## Note: Free Tier Sleep

On the free plan, the service sleeps after ~15 minutes of no traffic. The first request after sleep may take 30–60 seconds. For always-on behavior, use a paid plan or a simple uptime ping service.
