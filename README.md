# Edge Notes

A sharpening log for knives. The one question it answers: **what angle did I use on this knife last time?**

Android app, built with Capacitor and plain JavaScript. Everything stays on the phone: no account, no sync, no analytics.

## Install on a phone

Open [Releases](https://github.com/joshrpr/EdgeNotes/releases), pick the newest `edge-notes-android-*` release, and download `edge-notes.apk`. Android will ask you to allow installs from this source; that is expected for a sideloaded app. Installing over an older build keeps your knives, sharpenings and photos.

## What it does

- **Library** — every knife sorted by its last sharpening, with the angle and how long ago it was. Search filters as you type. Knives never sharpened sit at the end.
- **Knife** — the last angle at 44 sp, the included angle, a small 10–25° tick scale, then the full history newest first. Tapping a history row edits it.
- **Sharpen again** — opens the log sheet with the previous angle and today's date already filled in. Saving is one more tap.
- **Log sheet** — angle per side (1–45°, a comma works), rating from Dull to Hair whittling, burr raised, stropped, and notes. Save stays disabled until the angle makes sense.
- **Photos** — camera or gallery, downscaled to 1400 px and stored in IndexedDB, never uploaded.
- **Backup and restore** — one JSON file with every knife and photo. Restoring merges: it adds what is missing and never overwrites a session you already have.
- **Updates** — the app checks this repository's releases on launch and offers the new APK when the build number is higher.

## Where the data lives

Metadata is in `localStorage` under `edge-notes-v1`; photos are blobs in the IndexedDB database `edge-notes-photos`. Uninstalling the app or choosing **Erase everything** removes both. A backup file is the only copy that survives, so the library footer always shows when the last one was made.

## Development

```sh
npm install
npm test            # domain tests, node --test
npm run sync        # cap sync android
npm run assets      # regenerate launcher icons and splash screens
```

To run the web build in a browser:

```sh
python -m http.server 4321 -d web
# open http://127.0.0.1:4321/
```

There is no bundler and no framework. `web/index.html` loads, in order, `core.js` (pure domain logic, also required by the tests), `store.js` (metadata), `photos.js` (IndexedDB), `native.js` (Capacitor bridge with browser fallbacks) and `app.js` (router and views).

Android needs Java 21 and the Android SDK. No JDK is required for the web build or the tests.

```sh
npm run sync
cd android && ./gradlew assembleRelease -PbuildNumber=42
```

## Releases

`.github/workflows/android.yml` runs the tests, syncs the web assets, builds a signed release APK and publishes it as `edge-notes.apk` on a release tagged `edge-notes-android-<run number>`.

The build number becomes the Android `versionCode` and `versionName` (`1.0.<n>`), so it must only ever go up. Do not publish a release without an APK: the in-app update check looks for the newest `edge-notes-android-*` tag.

The sideload key in `android/keystore/sideload.keystore` is the same key the archery app uses, which is deliberate: it is a public repository and the key is for sideloading only, not for a store listing.

## Documents

- [PRODUCT.md](PRODUCT.md) — the product record: who it is for and what it must do.
- [docs/requirements.md](docs/requirements.md) — the functional contract.
- [docs/design-brief.md](docs/design-brief.md) — the interface contract: Toolroom, one stack, the angle readout.
