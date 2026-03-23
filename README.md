# Start Page

A customizable, minimal, and responsive start page for your browser. Features a clock, weather widget, Google search with live autocomplete, Google Apps launcher, and a customizable grid of link groups. Designed for **Cloudflare Pages** with **Cloudflare KV** for syncing across devices.

## Features

- **Customizable Links:** Organize sites into groups and lists with drag-and-drop reordering.
- **Sections:** Group your card groups by category (e.g., "Clients", "Tools") with colored tint overlays.
- **Live Search:** Search bar with Google autocomplete and instant search across your saved links.
- **Sync Across Devices:** Data stored in Cloudflare KV — same layout everywhere.
- **Google Integration:** Google Search, Apps Launcher, and server-side Google OAuth.
- **Branded Groups:** Fetch brand colors, logos, and banners via Brandfetch API.
- **Header Color:** Set custom header colors on non-branded groups.
- **Background Wallpaper:** Choose from presets or set a custom URL.
- **Typography:** Customize fonts and weights for clock, date, and links.
- **Edit Mode:** Add, edit, move, or delete groups and links directly from the UI.
- **Weather & Clock:** Real-time local time and weather.
- **Privacy:** Hide all content when logged out.
- **Apple-inspired Design:** Liquid glass UI with frosted glass cards, subtle animations, and iOS-style controls.

## Tech Stack

- **Frontend:** HTML5, CSS3, Vanilla JavaScript.
- **Hosting:** Cloudflare Pages.
- **Backend/Storage:** Cloudflare Pages Functions + Cloudflare KV.
- **Auth:** Server-side Google OAuth → JWT (HS256) in httpOnly cookie (7-day expiry).
- **Design:** Liquid glass aesthetic with backdrop-filter, system fonts (SF Pro), and Apple HIG-inspired layout.

## Setup & Deployment

### Prerequisites

1. A Cloudflare account.
2. Node.js and npm installed.
3. Wrangler CLI installed (`npm install -g wrangler`).

### 1. Local Development

```bash
npm install
npm run dev
```

`npm run dev` runs `wrangler pages dev` with `--kv START_PAGE_DATA` so the KV binding exists locally.

For Google sign-in locally, create a **`.dev.vars`** file (gitignored):

```
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-secret
GOOGLE_REDIRECT_URI=http://localhost:8788/api/auth/callback
JWT_SECRET=some-long-random-string
```

Add `http://localhost:8788/api/auth/callback` to **Authorized redirect URIs** and `http://localhost:8788` to **Authorized JavaScript origins** in Google Cloud Console.

### 2. Cloudflare Pages Deployment

#### Step A: Deploy

```bash
npx wrangler pages deploy . --project-name my-start-page --branch production
```

#### Step B: Create & Bind KV

1. Cloudflare Dashboard → **Workers & Pages** → **KV** → Create namespace (e.g., `START_PAGE_DATA`).
2. Pages project → **Settings** → **Functions** → **KV Namespace Bindings** → Variable name: `START_PAGE_DATA`.

#### Step C: Configure Google OAuth

1. **Google Cloud Console:**
   - Create a project and configure the OAuth consent screen (set to **Production**).
   - Create an OAuth 2.0 Client (Web Application).
   - Add your domain to **Authorized JavaScript origins**.
   - Add `https://your-domain.com/api/auth/callback` to **Authorized redirect URIs**.

2. **Set secrets:**

   ```bash
   wrangler pages secret put GOOGLE_CLIENT_ID --project-name my-start-page
   wrangler pages secret put GOOGLE_CLIENT_SECRET --project-name my-start-page
   wrangler pages secret put GOOGLE_REDIRECT_URI --project-name my-start-page
   wrangler pages secret put JWT_SECRET --project-name my-start-page
   ```

3. **Set allowed emails** — either in KV (`authConfig` key: `{"allowedEmails": ["you@email.com"]}`) or via Settings UI after first login.

4. **Redeploy** after setting secrets.

#### Step D: Brandfetch API (Optional)

Branded group headers use the Brandfetch API. **No server-side secrets needed** — enter your API Key and Client ID in **Settings → Account → Brandfetch API**. Keys are stored in your app data and sync across devices.

Get free keys at [brandfetch.com](https://brandfetch.com).

### 3. Settings

Settings are organized in a tabbed sidebar panel:

| Tab | What it controls |
|-----|-----------------|
| **Appearance** | Wallpaper, layout mode, typography (fonts/weights), sections manager |
| **Google Apps** | Toggle which Google apps appear in the launcher |
| **Account** | Allowed emails, hide-when-logged-out, Brandfetch API keys |
| **Data** | Import/Export JSON, reset defaults |

### 4. Sections

Sections let you visually group your card groups with colored tint overlays:

1. **Create sections** in Settings → Appearance → Sections, or via the section dropdown in the Edit Group modal.
2. **Assign groups** to sections in the Edit Group modal.
3. Groups in the same section are automatically sorted together and share a colored glass tint.
4. **Customize colors** in the Sections manager (Settings → Appearance).

### 5. Auth Flow

1. User clicks the Google icon (top right) → redirected to Google OAuth.
2. Google redirects back to `/api/auth/callback` with an authorization code.
3. Server exchanges code for user info, verifies email against allowed list.
4. Server signs a JWT and sets it as an `httpOnly` cookie (7-day expiry).
5. User is authenticated — edit button and settings become visible.
6. On logout, the cookie is cleared via `POST /api/auth/logout`.

### 6. Data Loading & Persistence

- Page load: `GET /api/data` (KV) → `localStorage` fallback → `default_data.js` fallback.
- Edits save to KV (and localStorage if privacy mode is off).
- KV data persists across deploys.
- Sensitive fields (Brandfetch API keys) are stripped from unauthenticated responses.

**Privacy:** When "Hide content when logged out" is enabled, unauthenticated visitors see only the sign-in button. Data is not cached in localStorage when privacy mode is on.

## Project Structure

```
index.html              — Main entry point
styles.css              — All styling (liquid glass design)
script.js               — Frontend logic, auth, search, settings
default_data.js         — Fallback data when KV is empty
functions/
  lib/
    jwt.js              — JWT signing/verification (HS256)
    auth.js             — Cookie parsing, getAuthUser helper
    cookies.js          — Set-Cookie builder (Secure flag handling)
    kv.js               — KV binding helper
    oauth_env.js        — OAuth credential loading
  api/
    auth/
      login.js          — Redirects to Google OAuth
      callback.js       — Exchanges code, sets JWT cookie
      me.js             — Returns current user from cookie
      logout.js         — Clears JWT cookie
      config.js         — Returns OAuth configuration status
    data.js             — GET/PUT app data (KV)
    auth_setup.js       — PUT allowed emails (KV)
    suggest.js          — Google autocomplete proxy
    brandfetch_config.js — (Legacy) Brandfetch credentials endpoint
```

## Migrating from Client-Side Google Sign-In

If upgrading from the old GSI SDK version:

1. `git pull origin main`
2. Create Google OAuth Client with a **Client Secret** (old setup only needed Client ID).
3. Add `https://your-domain.com/api/auth/callback` to redirect URIs.
4. Set 4 secrets via `wrangler pages secret put` (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI, JWT_SECRET).
5. Update KV `authConfig` — remove `clientId`, keep `allowedEmails`.
6. Redeploy and hard refresh.

See [detailed migration steps](#migrating-from-client-side-google-sign-in) in the previous README version if needed.

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `401: invalid_client` | Wrong Client ID. Compare Cloudflare secret with `.dev.vars` and Google Console. |
| "OAuth client was deleted" | Create a new OAuth client in Google Cloud Console. |
| "Access blocked" | OAuth consent screen not configured or in Testing mode. |
| Buttons visible when logged out | Hard refresh — CSS may be cached. |
| Branded groups not working | Add Brandfetch API Key and Client ID in Settings → Account. |
| Weather not loading | Browser may be blocking geolocation. Falls back to NYC. |
| Search autocomplete not working | The `/api/suggest` proxy requires the Pages Functions to be deployed. |

## License

Personal use.
