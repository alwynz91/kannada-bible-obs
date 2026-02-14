# Complete Guide: Reset VPS → Deploy Kannada Bible OBS

From a fresh VPS to live at **https://bible.pearmax.in**

---

## Part 1: Reset & Prepare VPS

### Step 1: Reset Your Hostinger VPS

1. Log in to **Hostinger** (hpanel.hostinger.com)
2. Go to **VPS** → select your VPS
3. Click **Management** or **Control Panel**
4. Find **Reinstall** or **Reset / Rebuild**
5. Choose **Ubuntu 22.04** (or latest LTS)
6. Click **Reinstall** and confirm
7. Wait 5–10 minutes for the reset to complete

---

### Step 2: Get Your VPS Details

1. In Hostinger VPS panel, note:
   - **IP Address** (e.g. `123.45.67.89`)
   - **Username** (usually `root`)
   - **Password** (or use SSH key if you have one)

2. Save these — you’ll need them for SSH and DNS.

---

### Step 3: Add DNS Record in Hostinger

1. In Hostinger, go to **Domains** → **pearmax.in**
2. Click **Manage** → **DNS / Nameservers**
3. Add an **A record**:
   - **Name:** `bible`
   - **Points to:** Your VPS IP (from Step 2)
   - **TTL:** 14400
4. Save
5. DNS can take 5–30 minutes to propagate

---

## Part 2: Connect & Setup Server

### Step 4: Connect via SSH

On your Mac, open Terminal and run:

```bash
ssh root@YOUR_VPS_IP
```

Replace `YOUR_VPS_IP` with your actual IP. Enter the password when asked.

You should see a prompt like: `root@vps-xxxxx:~#`

---

### Step 5: Update System

```bash
apt update && apt upgrade -y
```

---

### Step 6: Install Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
```

Verify:

```bash
node -v
npm -v
```

You should see `v20.x.x` and a version number.

---

### Step 7: Create Project Directory

```bash
mkdir -p /var/www/kannada-bible-obs
```

---

### Step 8: Upload Your Project (from your Mac)

**Open a new Terminal window on your Mac** (keep SSH open in the other one) and run:

```bash
cd /Volumes/SSD/kannada-bible-obs
scp -r dock browser data server root@YOUR_VPS_IP:/var/www/kannada-bible-obs/
```

Replace `YOUR_VPS_IP` with your VPS IP. Enter the password when asked.

When it finishes, all files are on the VPS.

---

## Part 3: Run the App

### Step 9: Install Dependencies & Start with PM2

**Back in the SSH session** on the VPS:

```bash
cd /var/www/kannada-bible-obs/server
npm install
npm install -g pm2
pm2 start ecosystem.config.cjs
```

Check it’s running:

```bash
pm2 status
```

You should see `kannada-bible-obs` with status `online`.

---

### Step 10: Make App Run on Reboot

```bash
pm2 save
pm2 startup
```

Copy and run the command that `pm2 startup` prints (it looks like `sudo env PATH=...`). This keeps the app running after a reboot.

---

## Part 4: Nginx & HTTPS

### Step 11: Install Nginx

```bash
apt install -y nginx
```

---

### Step 12: Configure Nginx

```bash
cp /var/www/kannada-bible-obs/server/nginx.conf /etc/nginx/sites-available/kannada-bible-obs
ln -s /etc/nginx/sites-available/kannada-bible-obs /etc/nginx/sites-enabled/
```

Remove default site (optional, avoids conflicts):

```bash
rm /etc/nginx/sites-enabled/default
```

Test config:

```bash
nginx -t
```

Reload Nginx:

```bash
systemctl reload nginx
```

---

### Step 13: Add SSL (HTTPS)

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d bible.pearmax.in
```

When prompted:
- Enter your email
- Agree to terms (Y)
- Choose to redirect HTTP to HTTPS (option 2)

---

## Part 5: Test

### Step 14: Verify It Works

1. Open in a browser: **https://bible.pearmax.in**
   - You should see: "Kannada Bible OBS Server Running!"

2. Open **https://bible.pearmax.in/dock/**
   - You should see the dock UI

3. Open **https://bible.pearmax.in/browser/**
   - You should see the output page (may show "Loading..." until you select a verse)

---

## Summary: URLs to Use

| Purpose          | URL                               |
|------------------|-----------------------------------|
| Dock (control)   | https://bible.pearmax.in/dock/    |
| OBS Browser Source | https://bible.pearmax.in/browser/ |

---

## Troubleshooting

| Problem | Command to try |
|---------|----------------|
| App not running | `pm2 restart kannada-bible-obs` |
| See app logs | `pm2 logs kannada-bible-obs` |
| Nginx error | `nginx -t` then `systemctl status nginx` |
| Check port 3000 | `curl http://localhost:3000` |
