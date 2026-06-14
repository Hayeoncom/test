# Test Result

## 2026-06-14 - Osaka Travel Migration

Build:

- Command: `ASTRO_TELEMETRY_DISABLED=1 npm run build`
- Result: pass
- Generated routes:
  - `/travel/2018-osaka/`
  - `/osaka.html`
  - `/osaka2.html`

Chrome MCP setup:

- The bundled `mcp__chrome` transport had a stale profile conflict and then closed after duplicate `chrome-devtools-mcp` processes were stopped.
- Codex Chrome Extension backend was not listed by `agent.browsers.list()`.
- Verification was completed with the local `chrome-devtools-mcp` package over MCP stdio, connected to a temporary Chrome profile launched with `--remote-debugging-port=9222`.

Desktop verification:

- URL: `http://127.0.0.1:4321/travel/2018-osaka/`
- Viewport: `1280x900`
- Final href: `/travel/2018-osaka/`
- Image count: 130
- Broken images after full lazy-load scroll: 0
- Audio controls: present
- Audio source: `/travel/18osaka/パンとスープとネコ日和.mp3`
- Horizontal overflow: false
- Console errors: none

Mobile verification:

- URL: `http://127.0.0.1:4321/travel/2018-osaka/`
- Emulated viewport: `390x844`, mobile/touch
- Reported `innerWidth`: 390
- Image count: 130
- Broken images after full lazy-load scroll: 0
- Audio controls: present
- Audio source: `/travel/18osaka/パンとスープとネコ日和.mp3`
- Horizontal overflow: false
- Console errors: none

Legacy URL verification:

- `http://127.0.0.1:4321/osaka.html` redirects to `/travel/2018-osaka/`
- `http://127.0.0.1:4321/osaka2.html` redirects to `/travel/2018-osaka/`
- Both wrapper paths render the migrated Osaka page with 130 images, audio controls, no broken images, and no console errors.

Notes:

- The Osaka MP3 remains excluded from staging and commits as a macOS Unicode normalization artifact.
- The external GitHub Pages music URL was replaced with the existing local repository asset path to avoid Chrome ORB blocking and console issues.

## 2026-06-14 - Tokyo And Fukuoka Travel Migration

Created/modified files:

- `src/content/travel/2018-tokyo.md`
- `src/content/travel/2019-fukuoka.md`
- `src/pages/tokyo.html.ts`
- `src/pages/tokyo2.html.ts`
- `src/pages/tokyo3.html.ts`
- `src/pages/fukuoka.html.ts`
- `src/pages/fukuoka2.html.ts`
- `src/pages/fukuoka3.html.ts`
- `tokyo.html`
- `tokyo2.html`
- `tokyo3.html`
- `fukuoka.html`
- `fukuoka2.html`
- `fukuoka3.html`
- `src/components/AudioPlayer.astro`
- `src/layouts/BaseLayout.astro`

Image count comparison:

- Tokyo legacy HTML images: 158
- Tokyo Astro Markdown figures: 158
- Fukuoka legacy HTML images: 147
- Fukuoka Astro Markdown figures: 147

Build:

- Command: `ASTRO_TELEMETRY_DISABLED=1 npm run build`
- Result: pass
- Generated routes:
  - `/travel/2018-tokyo/`
  - `/travel/2019-fukuoka/`
  - `/tokyo.html`
  - `/tokyo2.html`
  - `/tokyo3.html`
  - `/fukuoka.html`
  - `/fukuoka2.html`
  - `/fukuoka3.html`

Chrome MCP setup:

- Used `chrome-devtools-mcp` through MCP stdio, connected to a temporary Chrome profile launched with `--remote-debugging-port=9222`.
- Verified desktop with `1280x900`.
- Verified mobile with `390x844`, mobile/touch emulation.

Tokyo desktop verification:

- URL: `http://127.0.0.1:4321/travel/2018-tokyo/`
- Final href: `/travel/2018-tokyo/`
- Title: `TOKYO`
- Image count: 158
- Broken images after full lazy-load scroll: 0
- Caption count: 90
- Location caption count: 11
- Audio controls: present
- Audio source: Google Drive URL from the legacy page
- Horizontal overflow: false
- Console errors: none

Tokyo mobile verification:

- URL: `http://127.0.0.1:4321/travel/2018-tokyo/`
- Emulated viewport: `390x844`, mobile/touch
- Reported `innerWidth`: 390
- Image count: 158
- Broken images after full lazy-load scroll: 0
- Audio controls: present
- Horizontal overflow: false
- Console errors: none

Fukuoka desktop verification:

- URL: `http://127.0.0.1:4321/travel/2019-fukuoka/`
- Final href: `/travel/2019-fukuoka/`
- Title: `Umai Fukuoka`
- Image count: 147
- Broken images after full lazy-load scroll: 0
- Caption count: 87
- Location caption count: 13
- Audio controls: present
- Audio source: Google Drive URL from the legacy page
- Horizontal overflow: false
- Console errors: none

Fukuoka mobile verification:

- URL: `http://127.0.0.1:4321/travel/2019-fukuoka/`
- Emulated viewport: `390x844`, mobile/touch
- Reported `innerWidth`: 390
- Image count: 147
- Broken images after full lazy-load scroll: 0
- Audio controls: present
- Horizontal overflow: false
- Console errors: none

Legacy URL verification:

- `/tokyo.html` redirects to `/travel/2018-tokyo/`
- `/tokyo2.html` redirects to `/travel/2018-tokyo/`
- `/tokyo3.html` redirects to `/travel/2018-tokyo/`
- `/fukuoka.html` redirects to `/travel/2019-fukuoka/`
- `/fukuoka2.html` redirects to `/travel/2019-fukuoka/`
- `/fukuoka3.html` redirects to `/travel/2019-fukuoka/`
- All legacy wrapper checks ended on the intended new page.
- All legacy wrapper checks had broken image count 0 and console errors none.

Notes:

- Existing image files were not moved, renamed, deleted, staged, or committed.
- Existing music files were not moved, renamed, deleted, staged, or committed.
- Tokyo and Fukuoka retain their legacy Google Drive music URLs. `AudioPlayer` now uses `preload="none"` so browser validation does not trigger external media policy errors before playback.
- Added a data URL favicon link in `BaseLayout.astro` to avoid browser-generated `/favicon.ico` 404 console noise.
- The Osaka MP3 Unicode normalization artifact remains excluded from staging and commits.
- Migration commit hash: `2715802`
