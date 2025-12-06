# Bookmark Converter Tools

Two tools to help you convert browser bookmarks (Safari/Chrome) into your start page format.

## Option 1: Interactive Web Tool (Easiest) 🌐

**File:** `bookmark-importer.html`

1. Open `bookmark-importer.html` in your browser
2. Export your bookmarks:
   - **Safari:** File → Export Bookmarks...
   - **Chrome:** Bookmarks → Bookmark Manager → Export bookmarks
3. Drag and drop (or click to upload) your HTML bookmarks file
4. Select which groups and links you want to include
5. Use the search box to filter groups/links
6. Click "Download Formatted JSON"
7. Copy the JSON into your `data.js` file or import via Settings in your start page

**Features:**
- ✅ Visual selection interface
- ✅ Search/filter functionality
- ✅ See stats (total groups, selected links, etc.)
- ✅ No installation required

## Option 2: Node.js Script (Automated) ⚡

**File:** `bookmark-converter.js`

### Setup

```bash
npm install
```

### Usage

```bash
node bookmark-converter.js <bookmarks.html> [output.json]
```

**Example:**
```bash
node bookmark-converter.js Safari_Bookmarks.html converted-bookmarks.json
```

This will:
- Parse your HTML bookmarks file
- Convert all folders to groups
- Convert all bookmarks to links
- Generate a JSON file matching your `example.json` format

### Output Format

The script generates JSON with this structure:
```json
{
  "groups": [
    {
      "id": "g...",
      "title": "Group Name",
      "links": [
        {
          "id": "l...",
          "name": "Link Name",
          "url": "https://...",
          "useFavicon": false
        }
      ],
      "branded": false,
      "brandUrl": null,
      "brandData": null
    }
  ]
}
```

## Importing into Your Start Page

After generating the JSON, you have two options:

### Option A: Copy to data.js
1. Open the generated JSON file
2. Copy the contents
3. Replace the `defaultData` object in `data.js` with your new data

### Option B: Import via Settings
1. Open your start page
2. Click the Settings icon
3. Paste your JSON into the config field
4. Save

## Tips

- The web tool is better for **selective importing** (choosing specific groups/links)
- The Node.js script is better for **bulk importing** (converting everything at once)
- Both tools preserve your bookmark folder structure as groups
- You can always edit the JSON manually if needed

