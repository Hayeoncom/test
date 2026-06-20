# Main Production Cutover Checklist

## Purpose

This document lists the checks and controlled steps required before moving the current `refactor/ver1` operating setup to the production `main` branch.

The 026 scope is preparation only. Do not merge to `main`, push to `main`, change GitHub Pages source, or change the Netlify deploy branch during this step.

## Current Operating State

- Public site: `https://hayeon.kr/`
- CMS admin URL: `https://hayeon-cms-auth.netlify.app/admin/`
- GitHub Pages deploy type: GitHub Actions Pages
- Current temporary operating branch: `refactor/ver1`
- Planned production branch: `main`
- Current Pages workflow trigger branch: `refactor/ver1`
- Current CMS backend branch: `refactor/ver1`
- Current Netlify admin deploy branch: `refactor/ver1`
- Public site `admin/`: guide/redirect page to the Netlify admin URL
- Public site `admin/config.yml`: excluded from Pages artifact
- Netlify admin artifact: `.netlify-admin` with `admin/index.html` and `admin/config.yml`

## Branch Roles

`refactor/ver1` is the current validated operating branch for the temporary production deployment.

`main` is the planned production branch. It must not become the active CMS save branch or Pages deployment branch until the user approves a separate cutover task.

## Required Checks Before Cutover

Run these checks before changing any production branch setting:

```sh
git status --short
git rev-parse refactor/ver1
git rev-parse main
git rev-parse origin/refactor/ver1
git rev-parse origin/main
node scripts/validate-content.js
node --check assets/site.js
node --check assets/cms-renderer.js
node --check scripts/prepare-pages-artifact.js
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

## Files And Settings To Change During Cutover

Change these together in the main cutover task:

```text
admin/config.yml
.github/workflows/pages-deploy.yml
content/pages/*.json
docs/cms-operation-checklist.md
docs/netlify-cms-auth-admin.md
docs/cms-image-policy.md
docs/github-actions-pages-deployment.md
```

External settings to change during cutover:

```text
Netlify admin site deploy branch
GitHub Pages deployment branch policy if repository settings require branch-specific approval
CMS operator checklist used outside the repository
```

Settings that should remain unchanged:

```text
CNAME: hayeon.kr
GitHub Pages source: GitHub Actions
Netlify build command: node scripts/prepare-netlify-admin.js
Netlify publish directory: .netlify-admin
Netlify custom domain: do not connect hayeon.kr or www.hayeon.kr
```

## Cutover Steps

These steps require explicit user approval in a separate task:

1. Confirm that `refactor/ver1` is pushed and the latest Pages workflow is successful.
2. Confirm that `main` is ready to receive the `refactor/ver1` site state.
3. Merge or otherwise apply the approved `refactor/ver1` changes into `main`.
4. Update `admin/config.yml`:

```yml
backend:
  branch: main
```

5. Update `.github/workflows/pages-deploy.yml`:

```yml
on:
  push:
    branches:
      - main
  workflow_dispatch:
```

6. Update `originalUrl` values that reference `refs/heads/refactor/ver1`.
7. Update repository documentation that still names `refactor/ver1` as the active operating branch.
8. Push `main` only after local validation passes.
9. Change the Netlify admin site deploy branch to `main` in the Netlify UI.
10. Run the GitHub Actions Pages workflow for `main`.
11. Validate the public site, public exclusions, and Netlify admin URLs.
12. Test one CMS save flow on the Netlify admin URL after confirming branch settings.

## originalUrl Transition Policy

Current temporary branch standard:

```text
https://raw.githubusercontent.com/Hayeoncom/test/refs/heads/refactor/ver1/<image-path>
```

Production `main` standard:

```text
https://raw.githubusercontent.com/Hayeoncom/test/refs/heads/main/<image-path>
```

Known current conversion target:

```text
content/pages/tokyo.json
https://raw.githubusercontent.com/Hayeoncom/test/refs/heads/refactor/ver1/assets/images/tokyo/img0.jpeg
```

Expected converted value:

```text
https://raw.githubusercontent.com/Hayeoncom/test/refs/heads/main/assets/images/tokyo/img0.jpeg
```

Before cutover, re-run:

```sh
rg -n "refs/heads/refactor/ver1|raw.githubusercontent.com/Hayeoncom/test" content docs admin .github scripts
```

Convert only content values that must open original images from the production branch. Do not add `originalUrl` to home cards.

## GitHub Actions Pages Verification

After the `main` workflow runs, verify:

- Workflow name: `Deploy Pages`
- Run branch: `main`
- Commit SHA matches the intended `main` cutover commit
- `Validate CMS content` step passes
- `Validate source references` step passes
- `Prepare Pages artifact` step reports artifact size below 1 GB
- `Validate Pages artifact` step passes
- `Upload Pages artifact` does not include `admin/config.yml`
- `Deploy to GitHub Pages` reports success
- Deployed Pages version matches the intended `main` commit

## Netlify Admin Verification

After changing the Netlify deploy branch to `main`, verify:

- Netlify deploy branch is `main`
- Build command is `node scripts/prepare-netlify-admin.js`
- Publish directory is `.netlify-admin`
- `https://hayeon-cms-auth.netlify.app/admin/` returns 200
- `https://hayeon-cms-auth.netlify.app/admin/config.yml` returns 200
- `admin/config.yml` contains `backend.branch: main`
- `admin/config.yml` keeps `site_domain: hayeon-cms-auth.netlify.app`
- CMS login starts from the Netlify admin URL, not from `hayeon.kr/admin/`

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

## Rollback Procedure

If the `main` cutover fails after branch settings are changed:

1. Stop additional CMS edits until branch policy is corrected.
2. Revert the cutover commit on `main` or restore the last known valid `main` commit.
3. If Netlify was changed to `main`, temporarily set the Netlify admin deploy branch back to `refactor/ver1`.
4. If the Pages workflow on `main` is failing, use the latest successful `refactor/ver1` deployment as the reference state.
5. Confirm `hayeon.kr/admin/` remains only a guide/redirect page.
6. Confirm `hayeon.kr/admin/config.yml` remains 404.
7. Confirm CMS saves are not writing to a branch that no longer deploys.
8. Document the failed step, commit SHA, and URL checks before retrying.

## Cutover Stop Conditions

Do not run the main cutover when any of these conditions are true:

- `refactor/ver1` GitHub Actions Pages run is failing.
- Netlify admin `/admin/` returns a non-200 status.
- Netlify admin `/admin/config.yml` returns a non-200 status.
- Required `hayeon.kr` public URLs fail.
- Public exclusion URLs return 200.
- `originalUrl` conversion targets are not listed.
- CMS save branch and Pages deploy branch would differ after cutover.
- User iPhone Safari check has not been performed.
- `git status --short` is not clean before cutover.
- User has not approved the separate main cutover task.
