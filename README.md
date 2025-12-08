# Start Page

A customizable, minimal, and responsive start page for your browser. It features a clock, weather widget, Google search, Google Apps launcher, and a customizable grid of link groups. It is designed to be hosted on **Cloudflare Pages** and uses **Cloudflare KV** for syncing your configuration across devices.

## Features

- **Customizable Links:** Organize your favorite sites into groups and lists.
- **Sync Across Devices:** Data is stored in Cloudflare KV, so your start page looks the same everywhere.
- **Google Integration:**
  - Google Search bar.
  - Google Apps Launcher.
  - Sign-in with Google for editing access.
- **Edit Mode:** Easily add, edit, move, or delete groups and links directly from the UI.
- **Weather & Clock:** Real-time local time and weather updates.
- **Branded Groups:** Automatically fetch brand icons for group headers.
- **Secure:** Optional Google Sign-In protection to prevent unauthorized changes to your layout.

## Tech Stack

- **Frontend:** HTML5, CSS3, Vanilla JavaScript.
- **Hosting:** Cloudflare Pages.
- **Backend/Storage:** Cloudflare Pages Functions + Cloudflare KV.

## Setup & Deployment

This project is designed to be deployed to Cloudflare Pages.

### Prerequisites

1.  A Cloudflare account.
2.  Node.js and npm installed.
3.  Wrangler CLI installed (`npm install -g wrangler`).

### 1. Local Development

To run the project locally, you can use Wrangler:

```bash
npm install
npx wrangler pages dev .
```

_Note: For local development to work fully with data persistence, you may need to mock the KV bindings or connect to a preview namespace._

### 2. Cloudflare Pages Deployment

#### Step A: Create the Project

You can deploy directly from your command line:

```bash
npx wrangler pages deploy . --project-name my-start-page --branch production
```

- **Production deploy:** use your production branch (e.g., `--branch production` or your main branch name).
- **Staging/Preview deploy:** point to a different branch, e.g. `--branch staging` (or any non-prod branch). Pages will treat that as a Preview environment with separate secrets/vars.
- After changing secrets/vars in the dashboard, redeploy the corresponding environment (Production or Preview) so Functions pick up the changes.

#### Step B: Create a KV Namespace

To store your configuration, you need a KV Namespace.

1.  Log in to the Cloudflare Dashboard.
2.  Go to **Workers & Pages** > **KV**.
3.  Create a new namespace (e.g., `START_PAGE_KV`).

#### Step C: Bind KV to Pages

1.  Go to your new Pages project settings in the Cloudflare Dashboard.
2.  Navigate to **Settings** > **Functions**.
3.  Scroll to **KV Namespace Bindings**.
4.  Add a new binding:
    - **Variable name:** `START_PAGE_DATA` (This must be exact).
    - **KV Namespace:** Select the namespace you created in Step B.
5.  Save the settings.

#### Step D: Add Brandfetch Secrets (for branded icons/banners)

Set these in **Settings** > **Environment variables** (add in both Production and Preview):

- **BRANDFETCH_API_KEY** (Secret)
- **BRANDFETCH_CLIENT_ID** (Secret)

Then redeploy so the Pages Function can expose them to the frontend. If you later remove these secrets, redeploy again to ensure old deployments aren’t still serving them.

#### Step D: Configure Authentication (Optional but Recommended)

To enable editing and syncing, you should configure Google Sign-In.

1.  **Google Cloud Console:**

    - Create a project in the [Google Cloud Console](https://console.cloud.google.com/).
    - Create OAuth 2.0 Client credentials (Web Application).
    - Add your Cloudflare Pages URL (e.g., `https://your-project.pages.dev`) to "Authorized JavaScript origins".
    - Copy the **Client ID**.

2.  **Set Auth Config in KV:**
    You need to manually create a key in your KV namespace to store these secrets.
    - Go to **Workers & Pages** > **KV** > Your Namespace.
    - Click **View** to see keys.
    - Add a new key-value pair:
      - **Key:** `authConfig`
      - **Value:** `{"clientId": "YOUR_GOOGLE_CLIENT_ID", "allowedEmail": "your.email@gmail.com"}`
    - _Note: `allowedEmail` restricts editing to just your account._

### 3. Usage

1.  Open your deployed site.
2.  Click the **Settings** (gear) icon.
3.  Click the Google Sign-In button to authenticate (if configured).
4.  Once signed in, an **Edit** button (pencil icon) will appear.
5.  Toggle Edit Mode to add groups, rearrange links, or delete items.
6.  Changes are automatically saved to the cloud.

### 4. Data Loading & Persistence

- On page load the client tries `GET /api/data` (Cloudflare KV). If `appData` exists in KV, that is used.
- If KV is empty or unreachable, it falls back to `localStorage` (`startPageData`).
- If both KV and `localStorage` are empty, it falls back to `default_data.js` (shipped with the app).
- Any edits save to both `localStorage` (for fast reloads) and KV (for persistence across deploys).
- KV content is not overwritten by new deploys; it keeps the last saved data until you clear/replace it.

**Privacy note:** Anything shipped in the static bundle (e.g., `default_data.js`) is visible via View Source/DevTools even if the UI hides it when logged out. To keep links private, avoid shipping real data in `default_data.js`; store real data in KV and require auth so only `/api/data` (with a valid token) returns the content.

## Project Structure

- `index.html`: Main entry point.
- `styles.css`: All styling.
- `script.js`: Frontend logic (UI rendering, event listeners).
- `default_data.js`: Default fallback data (used if KV is empty).
- `functions/api/`: Backend logic.
  - `data.js`: Handles GET/PUT requests to Cloudflare KV.

## License

Personal use.
