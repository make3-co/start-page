# Custom Start Page

A clean, customizable browser start page with bookmarks, groups, clock, and weather.

## Features
- **Grouped Bookmarks**: Organize your links into custom groups.
- **Live Clock**: Shows current time and date.
- **Weather**: Displays current temperature (defaults to NYC, tries geolocation).
- **Edit Mode**: Add, edit, and delete groups and links directly from the UI.
- **Data Persistence**: Saves your configuration to your browser's LocalStorage.
- **Import/Export**: Backup your configuration to JSON.

## Setup & Editing
1. Open `index.html` in your browser.
2. Click the **Edit** icon (pencil) in the top right to enter Edit Mode.
3. **Add Group**: Click the big "+" card at the bottom.
4. **Add Link**: Click "Add Link" inside any group.
5. **Edit/Delete**: Click existing links to edit or delete them.
6. **Settings**: Click "Settings" to view/export your raw JSON data.

## Deployment (Cloudflare)

This project is a static site (HTML/CSS/JS). The best way to host it on Cloudflare is using **Cloudflare Pages**.

### Option 1: Cloudflare Dashboard (Easiest)
1. Go to the [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. Navigate to **Pages** > **Create a project** > **Direct Upload**.
3. Upload this entire folder.
4. Deploy!

### Option 2: Wrangler CLI
1. Install Wrangler: `npm install -g wrangler`
2. Run:
   ```bash
   wrangler pages deploy . --project-name my-start-page
   ```

## Customization
- **Styling**: Edit `styles.css` to change colors or layout.
- **Default Data**: Edit `data.js` to change the initial bookmarks for new users.


