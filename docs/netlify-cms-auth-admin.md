# Netlify CMS Admin Domain

## Purpose

The public site remains on GitHub Pages at `https://hayeon.kr/`. The CMS admin UI is served from the Netlify OAuth site at `https://hayeon-cms-auth.netlify.app/admin/`.

This split keeps the public site DNS unchanged while allowing Decap CMS to run on the same origin as the Netlify OAuth provider.

## Domains

- Public site: `https://hayeon.kr/`
- CMS admin site: `https://hayeon-cms-auth.netlify.app/admin/`
- OAuth provider site domain: `hayeon-cms-auth.netlify.app`

Do not move `hayeon.kr` or `www.hayeon.kr` DNS to Netlify for this setup. If those domains were added to the Netlify site and show `Pending External DNS verification`, remove or leave them unused. The Netlify default domain is enough for CMS admin login.

## Admin-Only Netlify Artifact

Netlify only needs the CMS admin files:

```text
.netlify-admin/
  _redirects
  favicon.ico
  admin/
    index.html
    config.yml
```

The artifact is created by:

```sh
node scripts/prepare-netlify-admin.js
```

The Netlify build config is:

```toml
[build]
  command = "node scripts/prepare-netlify-admin.js"
  publish = ".netlify-admin"
```

The `.netlify-admin/` directory is generated output and is not committed.

## What Netlify Does Not Serve

The Netlify CMS admin site does not serve the public website content. It excludes:

- root travel and document HTML pages
- `assets/images/**`
- `content/**`
- `docs/**`
- `scripts/**`
- `reports/**`
- `prompt/**`
- zip archives
- `.pages-dist/**`

Decap CMS reads and writes repository data through the GitHub API using the backend settings in `admin/config.yml`.

## CMS Backend Settings

The admin config must keep:

```yml
backend:
  name: github
  repo: Hayeoncom/test
  branch: main
  site_domain: hayeon-cms-auth.netlify.app
```

Do not write OAuth secrets, tokens, client secrets, passwords, or session cookies into repository files or reports.

## Login Flow

1. Open `https://hayeon-cms-auth.netlify.app/admin/`.
2. Click `Login with GitHub`.
3. Complete GitHub OAuth authorization in the popup.
4. Confirm that the popup closes or returns control to the CMS admin page.
5. Confirm that the `Pages` and `Site Settings` collections are visible.

Do not start CMS login from `https://hayeon.kr/admin/` for this admin flow.

## If Login Stops At Authorized

Check:

- The login start URL is `https://hayeon-cms-auth.netlify.app/admin/`.
- `admin/config.yml` has `site_domain: hayeon-cms-auth.netlify.app`.
- The Netlify site has the GitHub OAuth provider configured.
- The GitHub OAuth App callback URL is `https://api.netlify.com/auth/done`.
- Browser popup blocking is disabled for the Netlify admin site.
- Browser tracking protection or third-party cookie rules are not blocking the popup/opener flow.

If this still fails, evaluate a self-hosted OAuth proxy or another CMS auth provider.

## CMS Save To Public Site Flow

1. CMS admin saves content to `Hayeoncom/test` on `main`.
2. The repository receives a commit or editorial workflow PR.
3. GitHub Actions `Deploy Pages` runs for `main`.
4. The Pages artifact is built from the public site files.
5. GitHub Pages deploys `https://hayeon.kr/`.

The public site should continue to validate that its artifact stays below 1 GB and excludes Netlify admin build files.

## Original URL Policy

Home card images keep their existing page navigation links and do not receive `originalUrl` wrappers.

For detail/gallery images in production, use:

```text
https://raw.githubusercontent.com/Hayeoncom/test/refs/heads/main/<image-path>
```

Representative production value:

```text
https://raw.githubusercontent.com/Hayeoncom/test/refs/heads/main/assets/images/tokyo/img0.jpeg
```

## Main Branch Operation

Production uses these branch settings together:

- `admin/config.yml` `backend.branch`: `main`
- `.github/workflows/pages-deploy.yml` trigger branch: `main`
- CMS save branch: `main`
- Netlify admin deploy branch: `main`
- `originalUrl` standard:

```text
https://raw.githubusercontent.com/Hayeoncom/test/refs/heads/main/<image-path>
```
