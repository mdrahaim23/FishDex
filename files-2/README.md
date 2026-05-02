# FISHDEX — PWA

Pokédex-style fishing collection tracker. Saltwater fish, persistent state in `localStorage`, offline-capable PWA you can install to your phone's homescreen.

## What's in this folder

- `index.html` — the app (everything inline: styles, JS, all 18 fish sprites as base64)
- `manifest.json` — PWA manifest (name, icons, theme colors)
- `sw.js` — service worker (precaches shell, offline support, versioned cache)
- `icon-*.png` — PWA icons (192, 512 standard + maskable; 120/152/167/180 for iOS)
- `favicon-*.png` — browser tab icons (16, 32)

## Deploying to GitHub Pages

1. Create a new public repo (e.g. `fishdex`).
2. Drop all files in this folder into the repo root and push.
3. On GitHub: **Settings → Pages → Source: Deploy from a branch → main / root → Save**.
4. Wait ~1 minute. Your site goes live at `https://<your-username>.github.io/<repo>/`.
5. Open it on your phone in **Safari** (iOS) or **Chrome** (Android).
6. **iOS:** Share button → "Add to Home Screen". **Android:** Three-dot menu → "Install app" or "Add to Home screen".

The icon and "FISHDEX" name from the manifest will be picked up automatically.

## Updating the app after deploy

When you change `index.html` (e.g. add new fish via Claude chat):

1. Replace `index.html` in the repo and push.
2. **Bump `CACHE_VERSION` in `sw.js`** — change `'fishdex-v1'` to `'fishdex-v2'`, etc. This is what forces installed PWAs to fetch the new version instead of serving the stale cached one. If you forget this, your phone will keep showing the old version.
3. Push. The next time the app loads while online, the new SW takes over and the old cache is purged.

## Adding new fish

Come back to Claude with the source image(s) and the rarity tier. Claude runs the locked-in pixel-art pipeline (128px, +30% sat / +20% contrast, 16-color quantize, dark outline from each fish's own darkest tones halved) and gives back an updated `index.html` with the new sprite baked into the `FISH` array. Drop that file into the repo, bump the cache version, push.

## Editing catches

Tap the ✎ button on any catch log entry. Modal pre-fills with current date/location/notes. Save updates the log entry and re-runs `reconcileCollection()` so the collection card reflects the most recent catch (by date) for that fish.

## Storage

- `fishdex:state:v1` — `{ catches: { [fishId]: { date, location, notes } } }` (most recent catch per fish)
- `fishdex:log:v1` — full chronological log array

Both in `localStorage`. On first load, if the keys aren't set but `window.storage` exists (running inside a Claude artifact context), it migrates the data over once. After that it's pure `localStorage` — no Claude dependency at runtime.

## Known caveats

- Service workers require **HTTPS**. GitHub Pages serves HTTPS by default, so this just works. If you ever serve the files over plain HTTP (e.g. a LAN share), the SW won't register and PWA install won't work.
- Cache name lives in `sw.js`. Don't forget the bump on deploy or your users (you) will get stuck on old versions.
- Google Fonts are loaded from a CDN. The SW caches them after first load, so subsequent offline loads work.
