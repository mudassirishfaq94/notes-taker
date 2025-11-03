# Notes Taker

[![Deploy static site to GitHub Pages](https://github.com/mudassirishfaq94/notes-taker/actions/workflows/pages.yml/badge.svg)](https://github.com/mudassirishfaq94/notes-taker/actions/workflows/pages.yml)

Live site (after first deployment): https://mudassirishfaq94.github.io/notes-taker/

A simple, modern notes app built with HTML, Tailwind CSS, and vanilla JavaScript. Notes are stored locally in your browser using localStorage.

## Features

- Create, edit, delete notes
- Markdown support with safe rendering (marked + DOMPurify)
- Categories and tags
- Search across title, content, and tags
- Date range filtering (by note creation date)
- Dark/light theme (system-aware)
- Drag-and-drop reordering on the home grid
- Standalone All Notes page with a masonry layout

## Project Structure

- `index.html` — main app (create notes, categories, home grid)
- `app.js` — core logic for the main app
- `all.html` — standalone, full-width view to browse all notes
- `all.js` — logic for the All Notes page (search/category/date filters, masonry rendering)

## Local Preview

1. Ensure you have Node.js installed.
2. From the project folder, run:

   ```bash
   npx serve -p 5173
   ```

3. Open the app:
   - Main: `http://localhost:5173/index.html`
   - All Notes page: `http://localhost:5173/all.html`

Alternatively, any static server works (e.g., VS Code Live Server, http-server, etc.).

## Usage

- Create notes on the main page (index.html). Use categories, tags, and choose an accent color.
- Use the header search input to quickly find notes.
- Use the home view’s date filters (Start date, End date) to narrow by created date.
- Click “See all notes” (link in header) to open the standalone All Notes page.
  - Filters available: Search, Category, Start date, End date
  - Notes render in a responsive masonry grid

### Dark Mode
Theme respects system preferences. You can toggle theme in the header.

### Data Persistence
Notes, categories, and theme are saved in localStorage keys:

- `notes_taker__notes`
- `notes_taker__categories`
- `notes_taker__theme` (values: `light`, `dark`, or `system`)

## Screenshots

Add screenshots to the `docs/screenshots` folder and update the paths below.

![Home](docs/screenshots/home.png)
![All Notes](docs/screenshots/all-notes.png)

## GitHub Pages

This repository includes a GitHub Actions workflow to deploy the static site to GitHub Pages. After pushing to `main`, GitHub will publish the site at:

```
https://mudassirishfaq94.github.io/notes-taker/
```

It uses the official `actions/deploy-pages` flow. No build step is required for this project; it simply uploads the root directory.

### Manual enablement (first time)

If Pages isn’t enabled automatically, go to:

1. GitHub repo → Settings → Pages
2. Source = “GitHub Actions” (recommended)

Re-run the workflow from the Actions tab if needed.

## Development Notes

- The All Notes page filters by `createdAt`. Start date includes the entire start day, and End date includes the entire end day.
- Sorting in All Notes page is by latest `updatedAt` (fallback to `createdAt`).
- Markdown rendering is sanitized with DOMPurify to avoid XSS.

## License

MIT