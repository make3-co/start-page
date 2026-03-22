# Start Page

A customizable, minimal, and responsive start page for your browser. It features a clock, weather widget, Google search, Google Apps launcher, and a customizable grid of link groups. It is designed to be hosted on **Cloudflare Pages** and uses **Cloudflare KV** for syncing your configuration across devices.

## Features

- **Customizable Links:** Organize your favorite sites into groups and lists.
- **Sync Across Devices:** Data is stored in Cloudflare KV, so your start page looks the same everywhere.
- **Google Integration:**
  - Google Search bar.
  - Google Apps Launcher.
  - Server-side Google OAuth for editing access (7-day session via httpOnly cookie).
- **Edit Mode:** Easily add, edit, move, or delete groups and links directly from the UI.
- **Weather & Clock:** Real-time local time and weather updates.
- **Branded Groups:** Automatically fetch brand icons for group headers.
- **Secure:** Google OAuth protection with allowed email list to prevent unauthorized changes.

## Tech Stack

- **Frontend:** HTML5, CSS3, Vanilla JavaScript.
- **Hosting:** Cloudflare Pages.
- **Backend/Storage:** Cloudflare Pages Functions + Cloudflare KV.
- **Auth:** Server-side Google OAuth → JWT (HS256) in httpOnly cookie (7-day expiry).

## Setup & Deployment

This project is designed to be deployed to Cloudflare Pages.

### Prerequisites

1.  A Cloudflare account.
2.  Node.js and npm installed.
3.  Wrangler CLI installed (`npm install -g wrangler`).

### 1. Local Development

To run the project locally, you can use Wrangler:

```bash
npx wrangler pages dev .
```

For local dev with secrets, create a `.dev.vars` file in the project root:

```
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-secret
GOOGLE_REDIRECT_URI=http://localhost:8788/api/auth/callback
JWT_SECRET=some-random-secret
```

### 2. Cloudflare Pages Deployment

#### Step A: Create the Project

Deploy from the command line:

```bash
npx wrangler pages deploy . --project-name my-start-page --branch production
```

- **Production deploy:** use `--branch production`.
- **Staging/Preview deploy:** use a different branch, e.g. `--branch staging`.

#### Step B: Create a KV Namespace

1.  Log in to the Cloudflare Dashboard.
2.  Go to **Workers & Pages** > **KV**.
3.  Create a new namespace (e.g., `START_PAGE_DATA`).

#### Step C: Bind KV to Pages

1.  Go to your Pages project settings in the Cloudflare Dashboard.
2.  Navigate to **Settings** > **Functions**.
3.  Scroll to **KV Namespace Bindings**.
4.  Add a new binding:
    - **Variable name:** `START_PAGE_DATA` (must be exact).
    - **KV Namespace:** Select the namespace you created in Step B.

#### Step D: Configure Google OAuth

1.  **Google Cloud Console:**
    - Create a project in the [Google Cloud Console](https://console.cloud.google.com/).
    - Go to **Google Auth Platform** > **Branding** and configure the consent screen.
    - Set publishing status to **Production** (under **Audience**).
    - Go to **Clients** > **Create Client** (Web Application).
    - Add your domain (e.g., `https://csullivan.me`) to **Authorized JavaScript origins**.
    - Add `https://your-domain.com/api/auth/callback` to **Authorized redirect URIs**.
    - Copy the **Client ID** and **Client Secret**.

2.  **Set Secrets via Wrangler:**

    ```bash
    wrangler pages secret put GOOGLE_CLIENT_ID --project-name my-start-page
    wrangler pages secret put GOOGLE_CLIENT_SECRET --project-name my-start-page
    wrangler pages secret put GOOGLE_REDIRECT_URI --project-name my-start-page
    wrangler pages secret put JWT_SECRET --project-name my-start-page
    ```

    - `GOOGLE_CLIENT_ID` — from Google Cloud Console
    - `GOOGLE_CLIENT_SECRET` — from Google Cloud Console
    - `GOOGLE_REDIRECT_URI` — `https://your-domain.com/api/auth/callback`
    - `JWT_SECRET` — any random string (generate with `openssl rand -base64 32`)

3.  **Set Allowed Emails (first time):**

    Either set directly in KV:
    - Go to **Workers & Pages** > **KV** > Your Namespace.
    - Add key: `authConfig`
    - Value: `{"allowedEmails": ["your.email@gmail.com"]}`

    Or leave it empty and set via the Settings UI after first login (when no authConfig exists, the site allows open access so you can configure it from the UI).

4.  **Redeploy** after setting secrets:

    ```bash
    npx wrangler pages deploy . --project-name my-start-page --branch production
    ```

#### Step E: Add Brandfetch Secrets (Optional — for branded icons)

Set these in **Settings** > **Environment variables** (both Production and Preview):

- **BRANDFETCH_API_KEY** (Secret)
- **BRANDFETCH_CLIENT_ID** (Secret)

Redeploy after adding.

### 3. Auth Flow

1.  User clicks the Google icon (top right) → redirected to Google OAuth consent.
2.  Google redirects back to `/api/auth/callback` with an authorization code.
3.  Server exchanges the code for user info, verifies email against allowed list.
4.  Server signs a JWT and sets it as an `httpOnly` cookie (7-day expiry).
5.  User is now authenticated — edit button and settings become visible.
6.  On logout, the cookie is cleared via `POST /api/auth/logout`.

### 4. Usage

1.  Open your deployed site.
2.  Click the **Google icon** (top right) to sign in.
3.  Once signed in, an **Edit** button (pencil icon) and **Settings** (gear) icon appear.
4.  Toggle Edit Mode to add groups, rearrange links, or delete items.
5.  To manage allowed emails or privacy settings, open Settings.
6.  Changes are automatically saved to the cloud.

### 5. Data Loading & Persistence

- On page load the client tries `GET /api/data` (Cloudflare KV). If `appData` exists in KV, that is used.
- If KV is empty or unreachable, it falls back to `localStorage` (`startPageData`).
- If both KV and `localStorage` are empty, it falls back to `default_data.js` (shipped with the app).
- Any edits save to both `localStorage` (for fast reloads) and KV (for persistence across deploys).
- KV content is not overwritten by new deploys; it keeps the last saved data until you clear/replace it.

**Privacy note:** Anything shipped in the static bundle (e.g., `default_data.js`) is visible via View Source/DevTools even if the UI hides it when logged out. To keep links private, avoid shipping real data in `default_data.js`; store real data in KV and require auth so only `/api/data` (with a valid session) returns the content.

## Project Structure

- `index.html` — Main entry point.
- `styles.css` — All styling.
- `script.js` — Frontend logic (UI rendering, event listeners, auth).
- `default_data.js` — Default fallback data (used if KV is empty).
- `functions/` — Backend (Cloudflare Pages Functions):
  - `lib/jwt.js` — JWT signing and verification (HS256).
  - `api/auth/login.js` — Redirects to Google OAuth.
  - `api/auth/callback.js` — Exchanges code for token, sets JWT cookie.
  - `api/auth/me.js` — Returns current user from JWT cookie.
  - `api/auth/logout.js` — Clears the JWT cookie.
  - `api/data.js` — GET/PUT for app data (Cloudflare KV).
  - `api/auth_setup.js` — PUT to update allowed emails in KV.
  - `api/brandfetch_config.js` — Exposes Brandfetch credentials to frontend.

## Migrating from Client-Side Google Sign-In

If you previously had this project running with the old client-side Google Sign-In (GSI SDK), follow these steps to update to the new server-side OAuth flow.

### What Changed

- **Old:** Google Identity Services SDK loaded in the browser. Google issued a short-lived JWT (~1 hour) directly to the client. Token stored in `localStorage`. You got logged out whenever the token expired or you closed the browser.
- **New:** Server-side OAuth Authorization Code flow. Your server exchanges an auth code with Google, then issues its own JWT as an `httpOnly` cookie that lasts 7 days. Sessions persist across browser restarts.

### Migration Steps

#### 1. Pull the Latest Code

```bash
git pull origin main
```

#### 2. Get a Google Client Secret

The old setup only needed a Client ID. The new setup also requires a **Client Secret**.

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Credentials**.
2. Find your existing OAuth 2.0 Client (or create a new one — type: **Web application**).
3. Add `https://your-domain.com/api/auth/callback` to **Authorized redirect URIs**.
4. Make sure `https://your-domain.com` is in **Authorized JavaScript origins**.
5. Copy the **Client ID** and **Client Secret**.

> **Important:** If your OAuth consent screen is in **Testing** mode, either add your email as a test user (under **Audience**) or switch to **Production** mode.

#### 3. Set Environment Secrets

```bash
wrangler pages secret put GOOGLE_CLIENT_ID --project-name your-project-name
wrangler pages secret put GOOGLE_CLIENT_SECRET --project-name your-project-name
wrangler pages secret put GOOGLE_REDIRECT_URI --project-name your-project-name
wrangler pages secret put JWT_SECRET --project-name your-project-name
```

When prompted, enter:
- `GOOGLE_CLIENT_ID` — your Client ID from step 2
- `GOOGLE_CLIENT_SECRET` — your Client Secret from step 2
- `GOOGLE_REDIRECT_URI` — `https://your-domain.com/api/auth/callback`
- `JWT_SECRET` — generate one with `openssl rand -base64 32`

#### 4. Update KV authConfig

The old `authConfig` KV entry had a `clientId` field. The new format only uses `allowedEmails`.

Go to **Cloudflare Dashboard** → **Workers & Pages** → **KV** → your namespace, and update the `authConfig` key:

**Old format:**
```json
{"clientId": "xxx.apps.googleusercontent.com", "allowedEmails": ["you@example.com"]}
```

**New format:**
```json
{"allowedEmails": ["you@example.com"]}
```

Just remove the `clientId` field and keep `allowedEmails`.

#### 5. Deploy

```bash
npx wrangler pages deploy . --project-name your-project-name --branch production
```

#### 6. Clear Browser Cache

Hard refresh your site (`Cmd + Shift + R` / `Ctrl + Shift + R`) or open in an incognito window. The old cached JavaScript may still try to use the GSI SDK.

### Troubleshooting

| Problem | Solution |
|---------|----------|
| "The OAuth client was deleted" | Your old Google Client ID was deleted. Create a new one in Google Cloud Console. |
| "Access blocked: Authorization Error" | Your OAuth consent screen isn't configured or is in Testing mode without your email as a test user. Go to Google Cloud Console → **Branding** / **Audience**. |
| Google login button not visible | Hard refresh or try incognito. Old cached JS may be running. |
| Sign-in redirects but nothing happens | Check that `GOOGLE_REDIRECT_URI` matches exactly what's in your Google Cloud Console authorized redirect URIs. |
| 500 error on login | Secrets not set. Run `wrangler pages secret list --project-name your-project-name` to verify all 4 secrets exist. Then redeploy. |

## License

Personal use.
