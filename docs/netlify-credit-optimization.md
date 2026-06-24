# Netlify Credit Optimization

## Roles

- `https://hayeon.kr/` is the public user site and is deployed by GitHub Actions Pages.
- `https://hayeon-cms-auth.netlify.app/admin/` is the CMS admin site and is deployed by Netlify.
- Netlify must not be connected to `hayeon.kr` or `www.hayeon.kr` as a custom domain.

## Why Build Ignore Exists

CMS edits usually change `content/pages/*.json` or `content/site.json`. Those files are used by GitHub Pages for the public site, but they are not included in the Netlify admin artifact. Rebuilding Netlify for content-only edits uses Netlify credits without changing the admin site.

Netlify build ignore skips those content-only deploys and allows builds only when the admin artifact inputs change.

## Build Required Changes

Netlify build should run when any of these files change:

- `admin/index.html`
- `admin/config.yml`
- `favicon.ico`
- `netlify.toml`
- `scripts/netlify-ignore-build.js`
- `scripts/prepare-netlify-admin.js`

These files affect `.netlify-admin`, so Netlify must rebuild and redeploy the admin site.

Generated public pages are built by GitHub Actions Pages, not Netlify. However, changing the Decap CMS UI for generated pages changes `admin/config.yml`, so Netlify admin must be redeployed once for operators to see the new `신규 여행 페이지` collection.

## Build Skipped Changes

Netlify build should be skipped when changes are limited to files outside the admin artifact inputs, including:

- `content/pages/*.json`
- `content/generated-pages/*.json`
- `content/site.json`
- `assets/images/**`
- `assets/common.css`
- `assets/site.js`
- `assets/cms-renderer.js`
- root HTML files
- `*.style.css`
- `docs/**`
- `reports/**`
- `scripts/prepare-pages-artifact.js`
- `scripts/validate-content.js`
- `scripts/validate-static-site.js`

GitHub Actions Pages still handles public-site deployment for these changes.

## How The Ignore Command Works

`netlify.toml` uses:

```toml
[build]
  command = "node scripts/prepare-netlify-admin.js"
  ignore = "node scripts/netlify-ignore-build.js"
  publish = ".netlify-admin"
```

Netlify interprets ignore command exit codes as:

- `0`: skip the build.
- `1`: run the build.

The script reads `CACHED_COMMIT_REF` and `COMMIT_REF`, then runs:

```bash
git diff --name-only <cached commit> <current commit>
```

If any admin artifact input changed, the script exits `1`. If only unrelated files changed, it exits `0`.

When `CACHED_COMMIT_REF` is missing, the script falls back to checking files changed by the current commit ref. This keeps content-only CMS merge commits eligible for skip even when Netlify does not provide a cached baseline ref. If no commit ref can be found or Git cannot calculate changed files, the script exits `1` so the admin build runs.

## Dashboard Checks After A Failed Skip

If Netlify creates an `error` production deploy for a content-only commit instead of a skipped deploy, check these items in the Netlify dashboard:

- The site deploy branch is `main`.
- The build command is either empty in UI or matches `node scripts/prepare-netlify-admin.js`.
- The publish directory is either empty in UI or matches `.netlify-admin`.
- The base directory is empty unless intentionally configured.
- The repository `netlify.toml` is not overridden by UI settings.
- The deploy log includes the ignore command output.
- The ignore command sees either `CACHED_COMMIT_REF` and `COMMIT_REF`, or the fallback current commit ref.

## Expected Credit Impact

Content-only CMS saves should no longer spend Netlify build minutes. GitHub Actions Pages will still run for public-site deployment, while the existing Netlify admin deployment remains available.

## Why Skipping After CMS Saves Is Normal

CMS saves update public content. The admin application files do not change, so the existing Netlify deployment can continue serving `/admin/` and `/admin/config.yml`.

## Why Admin Config Changes Must Build

`admin/config.yml` controls CMS backend settings, collections, fields, and branch targeting. If it changes, Netlify must rebuild so the admin site serves the new config.

## Stopped Builds Operating Policy

Because `https://hayeon.kr/` is deployed by GitHub Actions Pages, Netlify does
not need to rebuild for public-site changes. The normal operating policy for
`hayeon-cms-auth` is:

- Keep Netlify Build status set to `Stopped builds`.
- Keep the repository connected.
- Keep the OAuth provider settings.
- Keep the existing published admin deployment.
- Do not connect `hayeon.kr` or `www.hayeon.kr` as Netlify custom domains.

Stopped builds is the preferred credit-control setting for this project because
the Netlify site only serves the CMS admin static files. The latest successful
admin deployment can continue serving:

- `https://hayeon-cms-auth.netlify.app/admin/`
- `https://hayeon-cms-auth.netlify.app/admin/config.yml`

Pros:

- Strongest credit protection.
- Simple for a fully static admin artifact.

Cons:

- Admin changes will not deploy until builds are manually re-enabled or triggered another way.
- Operators may forget to redeploy after changing `admin/config.yml`.

Build ignore remains in `netlify.toml` as a fallback, but Stopped builds is the
default operating policy after repeated production deploy `error` states were
observed for commits that do not change the Netlify admin artifact.

## Admin Change Procedure With Stopped Builds

When any of these files change, Netlify admin must be intentionally redeployed:

- `admin/index.html`
- `admin/config.yml`
- `netlify.toml`
- `scripts/prepare-netlify-admin.js`
- `scripts/netlify-ignore-build.js`
- `favicon.ico`

Use this procedure:

1. In Netlify, open `hayeon-cms-auth`.
2. Go to `Project configuration` -> `Build & deploy` -> `Continuous deployment`.
3. Change Build status from `Stopped builds` to `Active builds`.
4. Push the admin-related change to `main` or trigger a deploy for `main`.
5. Confirm `https://hayeon-cms-auth.netlify.app/admin/` returns HTTP 200.
6. Confirm `https://hayeon-cms-auth.netlify.app/admin/config.yml` returns HTTP 200.
7. Confirm `admin/config.yml` still has `backend.branch: main`.
8. Confirm CMS login still enters the GitHub OAuth flow.
9. Change Build status back to `Stopped builds`.

For generated page feature changes, apply the same procedure because the CMS collection definition lives in `admin/config.yml`.

Do not disconnect the repository and do not remove OAuth provider settings when
using this procedure.

## Content-Only CMS Save Procedure With Stopped Builds

When CMS saves only change `content/pages/*.json`, `content/generated-pages/*.json`, or `content/site.json`:

1. Save or publish the CMS content change.
2. Confirm the CMS commit or PR targets `main`.
3. Confirm GitHub Actions Pages runs from `main`.
4. Confirm the GitHub Pages run succeeds.
5. Confirm the public page on `https://hayeon.kr/` reflects the content change.
6. Confirm Netlify does not create a new production deploy for that commit, or
   that any created deploy does not run a build.
7. Confirm Netlify production deploy credit does not increase for that save.

If Netlify creates a production deploy while Build status is `Stopped builds`,
separate deploy record creation from build execution and check Netlify's usage
screen before changing repository files.

For `content/generated-pages/*.json`, GitHub Actions Pages should create the public `<slug>.html` in `.pages-dist`. Netlify admin should not spend build minutes because the admin static files did not change.

## Credit Usage Check

Operators should check Netlify credit and build usage in the Netlify dashboard for the `hayeon-cms-auth` site. The exact screen can vary by account plan, so use Netlify's site usage, deploys, or billing area for the current account.

## Rollback

To roll back the ignore policy:

1. Remove `ignore = "node scripts/netlify-ignore-build.js"` from `netlify.toml`.
2. Remove `scripts/netlify-ignore-build.js` if no longer needed.
3. Commit and push to `main`.
4. Trigger a Netlify deploy and confirm `/admin/` and `/admin/config.yml` return HTTP 200.

If a content-only deploy was skipped as expected, no rollback is needed.
