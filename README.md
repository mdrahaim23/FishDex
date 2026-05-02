# FISHDEX — PWA

Pokédex-style fishing collection tracker. Saltwater fish, persistent state in `localStorage`, offline-capable PWA you can install to your phone's homescreen.

## What's in this folder

- `index.html` — the app (HTML/CSS/JS in one file, ~50KB now that sprites are external)
- `manifest.json` — PWA manifest (name, icons, theme colors)
- `sw.js` — service worker (precaches shell + sprites, offline support, versioned cache)
- `fish/` — 18 fish sprite PNGs, one per fish (loaded lazily, cached by service worker)
- `icon-*.png` — PWA icons (192, 512 standard + maskable; 120/152/167/180 for iOS)
- `favicon-*.png` — browser tab icons (16, 32)

## Deploying to GitHub Pages

1. Create a new public repo (e.g. `fishdex`).
2. Drop all files **including the `fish/` folder** into the repo root and push.
3. On GitHub: **Settings → Pages → Source: Deploy from a branch → main / root → Save**.
4. Wait ~1 minute. Your site goes live at `https://<your-username>.github.io/<repo>/`.
5. Open it on your phone in **Safari** (iOS) or **Chrome** (Android).
6. **iOS:** Share button → "Add to Home Screen". **Android:** Three-dot menu → "Install app" or "Add to Home screen".

The icon and "FISHDEX" name from the manifest will be picked up automatically.

## Updating the app after deploy

When you change `index.html` (or any other file in the repo):

1. Replace the file(s) in the repo and push.
2. **Bump `CACHE_VERSION` in `sw.js`** (e.g. `'fishdex-v8'` → `'fishdex-v9'`). This forces installed PWAs to fetch the new version instead of serving the stale cached one. If you forget this, your phone will keep showing the old version.
3. Push. Next time the app loads online, the new SW takes over and the old cache is purged.
4. **iOS PWA tip:** force-quit the app (swipe up in app switcher) and reopen if the update doesn't appear within a minute.

## Adding new fish

Come back to Claude with the source image(s) and the rarity tier. Claude runs the locked-in pixel-art pipeline and hands you back:

1. A new PNG file to drop into `fish/` (e.g. `fish/bonefish.png`)
2. A snippet to paste into the `FISH` array in `index.html` (e.g. `{id:"bonefish",name:"Bonefish",rarity:"rare",img:"fish/bonefish.png"}`)
3. A reminder to add the new fish id to the `FISH_IDS` list in `sw.js` so it gets precached for offline use

Then bump `CACHE_VERSION`, commit, and push. (If you forget step 3, the new sprite still loads online — it just won't be available offline until first online view.)

## Editing catches

Tap the ✎ button on any catch log entry. Modal pre-fills with current date/location/notes. Save updates the log entry and re-runs `reconcileCollection()` so the collection card reflects the most recent catch (by date) for that fish.

## Storage

- `fishdex:state:v1` — `{ catches: { [fishId]: { date, location, notes } } }` (most recent catch per fish)
- `fishdex:log:v1` — full chronological log array

Both in `localStorage`. On first load, if the keys aren't set but `window.storage` exists (running inside a Claude artifact context), it migrates the data over once. After that it's pure `localStorage` — no Claude dependency at runtime.

## Performance notes

- Sprites are external PNG files in `fish/`, loaded with `loading="lazy"` and `decoding="async"` so off-screen sprites don't block initial paint or sit in memory.
- The service worker precaches all sprites listed in `FISH_IDS` (in `sw.js`) on install, so the app works fully offline after first online load.
- HTML is ~50KB; sprites total ~290KB on disk; full app cache ~750KB including icons.

## Known caveats

- Service workers require **HTTPS**. GitHub Pages serves HTTPS by default, so this just works. If you ever serve over plain HTTP (e.g. a LAN share), the SW won't register and PWA install won't work.
- Cache name lives in `sw.js`. Don't forget the bump on deploy or you'll get stuck on old versions.
- Google Fonts are loaded from a CDN. The SW caches them after first load, so subsequent offline loads work.
