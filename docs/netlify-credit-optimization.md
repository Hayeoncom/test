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

## Build Skipped Changes

Netlify build should be skipped when changes are limited to files outside the admin artifact inputs, including:

- `content/pages/*.json`
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

If any admin artifact input changed, the script exits `1`. If only unrelated files changed, it exits `0`. If the required refs are missing or diff cannot be checked, the script exits `1` so the admin build runs.

## Expected Credit Impact

Content-only CMS saves should no longer spend Netlify build minutes. GitHub Actions Pages will still run for public-site deployment, while the existing Netlify admin deployment remains available.

## Why Skipping After CMS Saves Is Normal

CMS saves update public content. The admin application files do not change, so the existing Netlify deployment can continue serving `/admin/` and `/admin/config.yml`.

## Why Admin Config Changes Must Build

`admin/config.yml` controls CMS backend settings, collections, fields, and branch targeting. If it changes, Netlify must rebuild so the admin site serves the new config.

## Stopped Builds Option

Netlify UI may also allow stopping builds.

Pros:

- Strongest credit protection.
- Simple for a fully static admin artifact.

Cons:

- Admin changes will not deploy until builds are manually re-enabled or triggered another way.
- Operators may forget to redeploy after changing `admin/config.yml`.

Build ignore is safer for this repository because it still permits admin-related deploys.

## Credit Usage Check

Operators should check Netlify credit and build usage in the Netlify dashboard for the `hayeon-cms-auth` site. The exact screen can vary by account plan, so use Netlify's site usage, deploys, or billing area for the current account.

## Rollback

To roll back the ignore policy:

1. Remove `ignore = "node scripts/netlify-ignore-build.js"` from `netlify.toml`.
2. Remove `scripts/netlify-ignore-build.js` if no longer needed.
3. Commit and push to `main`.
4. Trigger a Netlify deploy and confirm `/admin/` and `/admin/config.yml` return HTTP 200.

If a content-only deploy was skipped as expected, no rollback is needed.
