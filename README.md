# Start Page

A beautiful, customizable start page for your browser. Set it as your homepage and have all your important links, Google search, weather, and clock in one place.

Built with an Apple-inspired "liquid glass" design. Syncs across all your devices.

![Start Page](https://images.unsplash.com/photo-1460500063983-994d4c27756c?w=800&q=60)

## What You Get

- **Your links, organized** — Group your bookmarks into cards. Drag to reorder.
- **Google search** — With live autocomplete suggestions as you type, plus search across your own links.
- **Google Apps launcher** — Quick access to Gmail, Drive, Calendar, etc.
- **Branded groups** — Cards can auto-fetch brand colors and logos (optional, uses Brandfetch API).
- **Sections** — Color-code groups of cards (e.g., all client cards get a blue tint).
- **Custom backgrounds** — Pick from presets or use any image URL.
- **Custom fonts** — Change the clock, date, and link fonts.
- **Private** — Password or Google sign-in. Only you can edit your page.
- **Synced** — Changes save to the cloud and show up on all your devices.

## How It's Built

This runs on [Cloudflare Workers](https://workers.cloudflare.com/) (free tier). Your data is stored in [Cloudflare KV](https://developers.cloudflare.com/kv/).

No frameworks. No build step. Just HTML, CSS, and JavaScript.

---

## Quick Start (5 minutes)

You need a free [Cloudflare account](https://dash.cloudflare.com/sign-up).

### Step 1: Fork This Repo

Click **Fork** at the top of this page. This creates your own copy that stays connected for future updates.

### Step 2: Deploy to Cloudflare

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/) → **Workers & Pages** → **Create**
2. Click the **"Connect to Git"** tab
3. Select your **Start_page** fork
4. Configure the build:
   - **Build command:** `npm run deploy`
   - **Build output:** leave empty
5. Add a **KV namespace** binding:
   - Go to **Settings → Bindings → Add → KV Namespace**
   - Variable name: `START_PAGE_DATA`
   - Select **Create a new namespace** or pick an existing one
6. Trigger a redeploy from the **Deployments** tab

### Step 3: First Visit

Visit your Workers URL. A setup wizard will guide you:

- **Password** (simplest) — Just pick a password. No external setup needed.
- **Google Sign-In** — Paste your Google OAuth credentials right in the wizard. No CLI needed.

That's it. Start adding your links.

### Getting Updates

When new features are released:

1. Go to your fork on GitHub
2. Click **"Sync fork"** → **"Update branch"**
3. Cloudflare will auto-deploy the update

### Alternative: CLI Setup

If you prefer the command line:

```bash
git clone https://github.com/YOUR_USERNAME/Start_page.git
cd Start_page
npm install
npm run setup
```

---

## Authentication

### Password Auth (Recommended for simplicity)

Choose "Password" during the setup wizard. No secrets or external services needed — just set a password and you're in.

### Google Sign-In

If you prefer Google OAuth:

1. Create an OAuth 2.0 Client in [Google Cloud Console](https://console.cloud.google.com/)
2. Add your redirect URI (shown in the setup wizard — it's auto-detected, no need to configure it)
3. Set two secrets:

```bash
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET
```

4. Redeploy: `npm run deploy`

> **Note:** `GOOGLE_REDIRECT_URI` and `JWT_SECRET` are auto-generated. You only need the two secrets above.

---

## Custom Domain

By default, your page lives at `your-worker.workers.dev`. To use a custom domain:

1. Add your domain to Cloudflare (DNS managed by Cloudflare)
2. Edit `wrangler.toml`:

```toml
routes = [
  { pattern = "yourdomain.com", custom_domain = true }
]
```

3. Redeploy: `npm run deploy`

If using Google Sign-In, add the new domain as an authorized redirect URI in Google Cloud Console.

---

## Optional: Branded Groups

Want your cards to show brand logos and colors? (e.g., a Google card with the Google banner)

1. Sign up at [brandfetch.com](https://brandfetch.com) (free tier available)
2. Get your **API Key** and **Client ID**
3. Go to **Settings → Account → Brandfetch API**
4. Enter both keys and save

Now when you edit a group and check "Branded", enter the company's domain (e.g., `google.com`) and it'll fetch their branding.

---

## Running Locally

```bash
npm run dev
```

This starts a local server at `http://localhost:8788`.

For Google sign-in locally, copy `.dev.vars.example` to `.dev.vars` and fill in your credentials:

```bash
cp .dev.vars.example .dev.vars
```

Password auth works locally with no configuration.

---

## Settings

Click the gear icon (top right, visible after sign-in) to open Settings:

| Tab | What it does |
|-----|-------------|
| **Appearance** | Change wallpaper, layout, fonts, and manage sections |
| **Google Apps** | Choose which Google apps show in the launcher |
| **Account** | Set allowed emails, privacy mode, Brandfetch API keys |
| **Data** | Import/export your data as JSON, reset to defaults |

---

## Troubleshooting

**Can't sign in with Google?**
- Make sure your Google OAuth consent screen is set to **Production** (not Testing)
- Check that your redirect URI matches your Workers URL
- Run `npx wrangler secret list` to verify secrets are set

**Page looks broken or outdated?**
- Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
- Try incognito/private window

**Setup wizard won't appear?**
- The wizard only shows when no auth is configured. If you already set up Google OAuth or password auth, it won't show again.

---

## Project Structure

```
public/                     Static files (HTML, CSS, JS)
worker/index.js             Worker entry point — routes API requests
functions/                  API route handlers
  lib/                      Shared utilities (JWT, cookies, KV, OAuth)
  api/auth/                 Auth endpoints (Google OAuth + password)
  api/data.js               Read/write app data
  api/suggest.js            Google autocomplete proxy
  api/setup_status.js       Setup wizard status check
scripts/setup.js            Interactive setup CLI
wrangler.toml               Cloudflare Worker config
```

## License

MIT — see [LICENSE](LICENSE).
