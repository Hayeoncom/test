# Main Production Operation Checklist

## Purpose

This document lists the checks required to operate the production `main` branch deployment after the 027 cutover.

Do not force push to `main`. Use normal commits, pull requests, or revert commits for production changes and rollback.

## Current Operating State

- Public site: `https://hayeon.kr/`
- CMS admin URL: `https://hayeon-cms-auth.netlify.app/admin/`
- GitHub Pages deploy type: GitHub Actions Pages
- Production operating branch: `main`
- Pages workflow trigger branch: `main`
- CMS backend branch: `main`
- Netlify admin deploy branch: `main`
- Public site `admin/`: guide/redirect page to the Netlify admin URL
- Public site `admin/config.yml`: excluded from Pages artifact
- Netlify admin artifact: `.netlify-admin` with `admin/index.html` and `admin/config.yml`
- Generated CMS travel pages: `content/generated-pages/*.json` creates `.pages-dist/<slug>.html` during GitHub Actions Pages build

## Branch Roles

`main` is the production branch for public site deployment and CMS saves.

`refactor/ver1` is retained only as historical context for the temporary test deployment and as a rollback reference when needed.

## Required Checks Before Production Changes

Run these checks before pushing production changes:

```sh
git status --short
git rev-parse main
git rev-parse origin/main
node scripts/validate-content.js
node --check assets/site.js
node --check assets/cms-renderer.js
node --check scripts/prepare-pages-artifact.js
node --check scripts/generate-static-pages.js
node --check scripts/prepare-netlify-admin.js
node --check scripts/validate-static-site.js
node scripts/validate-static-site.js
node scripts/prepare-pages-artifact.js
node scripts/validate-static-site.js --root .pages-dist
node scripts/prepare-netlify-admin.js
node scripts/validate-static-site.js --root .netlify-admin
git diff --check
```

Required public URL checks:

```text
https://hayeon.kr/
https://hayeon.kr/index.html
https://hayeon.kr/content/site.json
https://hayeon.kr/content/pages/home.json
https://hayeon.kr/content/pages/tokyo.json
https://hayeon.kr/assets/common.css
https://hayeon.kr/assets/site.js
https://hayeon.kr/assets/cms-renderer.js
https://hayeon.kr/favicon.ico
https://hayeon.kr/admin/
```

Required public exclusions:

```text
https://hayeon.kr/admin/config.yml
https://hayeon.kr/docs/cms-image-policy.md
https://hayeon.kr/scripts/validate-content.js
https://hayeon.kr/assets/images/unused/document.png
https://hayeon.kr/Epilogue.zip
https://hayeon.kr/netlify.toml
https://hayeon.kr/.netlify-admin/
```

Required Netlify admin URL checks:

```text
https://hayeon-cms-auth.netlify.app/admin/
https://hayeon-cms-auth.netlify.app/admin/config.yml
```

## Production Files And Settings

Keep these aligned on `main`:

```text
admin/config.yml
.github/workflows/pages-deploy.yml
content/pages/*.json
content/generated-pages/*.json
docs/cms-operation-checklist.md
docs/netlify-cms-auth-admin.md
docs/cms-image-policy.md
docs/github-actions-pages-deployment.md
```

External settings:

```text
Netlify admin site deploy branch: main
GitHub Pages source: GitHub Actions
CMS operator checklist used outside the repository
```

Settings that should remain unchanged:

```text
CNAME: hayeon.kr
Netlify build command: node scripts/prepare-netlify-admin.js
Netlify publish directory: .netlify-admin
Netlify custom domain: do not connect hayeon.kr or www.hayeon.kr
```

## Production Change Steps

Use these steps for production changes after cutover:

1. Confirm that `main` is clean and up to date.
2. Apply approved changes in a normal branch or direct `main` commit according to repository policy.
3. Confirm `admin/config.yml`:

```yml
backend:
  branch: main
```

4. Confirm `.github/workflows/pages-deploy.yml`:

```yml
on:
  push:
    branches:
      - main
  workflow_dispatch:
```

5. Confirm `originalUrl` values use `refs/heads/main`.
6. For new CMS travel pages, confirm `slug` uses `^[a-z0-9-]+$`, `sourceHtml` is `<slug>.html`, and the name does not collide with the protected 19 root HTML files.
7. Push `main` only after local validation passes.
8. Confirm GitHub Actions Pages workflow for `main`.
9. Validate the public site, public exclusions, generated page URLs, and Netlify admin URLs.
10. Test one CMS save flow on the Netlify admin URL when user login is available.

## originalUrl Policy

Production branch standard:

```text
https://raw.githubusercontent.com/Hayeoncom/test/refs/heads/main/<image-path>
```

Known production original URL example:

```text
content/pages/tokyo.json
https://raw.githubusercontent.com/Hayeoncom/test/refs/heads/main/assets/images/tokyo/img0.jpeg
```

During audits, run:

```sh
rg -n "refs/heads/main|refs/heads/refactor/ver1|raw.githubusercontent.com/Hayeoncom/test" content docs admin .github scripts
```

Content values that open original images must use the production branch. Do not add `originalUrl` to home cards.

## GitHub Actions Pages Verification

After the `main` workflow runs, verify:

- Workflow name: `Deploy Pages`
- Run branch: `main`
- Commit SHA matches the intended `main` production commit
- `Validate CMS content` step passes
- `Validate source references` step passes
- `Prepare Pages artifact` step reports artifact size below 1 GB
- `Validate Pages artifact` step passes
- Generated CMS pages exist only in `.pages-dist`, not as committed root HTML files
- `Upload Pages artifact` does not include `admin/config.yml`
- `Deploy to GitHub Pages` reports success
- Deployed Pages version matches the intended `main` commit

## Netlify Admin Verification

After Netlify deploys `main`, verify:

- Netlify deploy branch is `main`
- Build command is `node scripts/prepare-netlify-admin.js`
- Publish directory is `.netlify-admin`
- `https://hayeon-cms-auth.netlify.app/admin/` returns 200
- `https://hayeon-cms-auth.netlify.app/admin/config.yml` returns 200
- `admin/config.yml` contains `backend.branch: main`
- `admin/config.yml` keeps `site_domain: hayeon-cms-auth.netlify.app`
- CMS login starts from the Netlify admin URL, not from `hayeon.kr/admin/`

When `admin/config.yml` changes to adjust the generated pages collection, temporarily switch Netlify builds to Active builds, deploy the admin artifact, verify `/admin/` and `/admin/config.yml`, then switch back to Stopped builds.

## iPhone Safari Manual Checks

Use a real iPhone Safari session to check:

- Home first slideshow to spaceship emoji spacing
- Home travel cards remain two columns
- Home lower image overlay text remains on image and does not overlap incoherently
- Detail page number area remains visually compact
- Tokyo/Fukuoka number order is `1 -> 2 -> 3`
- Osaka number order is `1 -> 2`
- Detail audio area does not overflow horizontally
- Detail original image click opens the raw URL in a new tab/window
- Page number links navigate in the current tab
- If a generated page exists, it opens at `https://hayeon.kr/<slug>.html`, images render, raw original links open in a new tab/window, and horizontal overflow is absent

## Rollback Procedure

If production fails after `main` changes:

1. Stop additional CMS edits until branch policy is corrected.
2. Prefer a revert commit on `main`; do not use force push.
3. Use `backup/main-before-027-*` as the reference for pre-cutover state.
4. If Netlify was changed to `main`, temporarily set the Netlify admin deploy branch back to `refactor/ver1` only when the public site is also rolled back to that branch policy.
5. Confirm `hayeon.kr/admin/` remains only a guide/redirect page.
6. Confirm `hayeon.kr/admin/config.yml` remains 404.
7. Confirm CMS saves are not writing to a branch that no longer deploys.
8. If the failure is generated-page specific, revert the `content/generated-pages/<slug>.json` change with a normal revert commit and confirm the generated URL state after Pages deploy.
9. Document the failed step, commit SHA, and URL checks before retrying.

## Stop Conditions

Do not push production changes when any of these conditions are true:

- `main` GitHub Actions Pages run is failing.
- Netlify admin `/admin/` returns a non-200 status.
- Netlify admin `/admin/config.yml` returns a non-200 status.
- Required `hayeon.kr` public URLs fail.
- Public exclusion URLs return 200.
- `originalUrl` values point to the wrong branch.
- CMS save branch and Pages deploy branch differ.
- User iPhone Safari check has not been performed for layout-sensitive changes.
- `git status --short` is not clean before deployment.
- `main` was not backed up before a risky production change.
