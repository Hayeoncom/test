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
