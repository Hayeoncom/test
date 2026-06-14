# Astro Migration Plan

## Scope

Rebuild the existing static travel and photography site as an Astro static site while preserving the calm, photo-led layout and the existing GitHub Pages URL surface. Content should become maintainable through Markdown files instead of direct HTML edits.

## Initial Repository State

- Working directory: `/Users/hsnkch/hh/test`
- Branch created for the migration: `refactor/astro-content-architecture`
- `git status -sb` after branch creation shows one untracked MP3 path caused by macOS Unicode normalization:
  - `travel/18osaka/パンとスープとネコ日和.mp3`
- `git ls-files` confirms the same Osaka MP3 is tracked under a normalized filename variant.
- This MP3 must not be deleted, staged, committed, or pushed as a new file.
- Removed macOS-generated `.DS_Store` files before work, as instructed.

## Existing Structure

The current site is a flat static site with root-level HTML, CSS, images, and some grouped assets under `travel/`.

Primary HTML URLs:

- `/index.html`
- `/osaka.html`
- `/osaka2.html`
- `/tokyo.html`
- `/tokyo2.html`
- `/tokyo3.html`
- `/fukuoka.html`
- `/fukuoka2.html`
- `/fukuoka3.html`
- `/document.tokyo.html`
- `/document.hk.html`
- `/document.ny.html`
- `/document.london.html`
- `/document.tokyo2.html`
- Additional existing placeholders or older pages:
  - `/2019 tokyo.html`
  - `/hongkongmacau.html`
  - `/london.html`
  - `/new york.html`
  - `/tokyoagain.html`

Main CSS files:

- `style.css` for the home page.
- `osaka.style.css`, `osaka2.style.css` for Osaka travel pages.
- `tokyo.style.css`, `tokyo2.style.css`, `tokyo3.style.css` for Tokyo travel pages.
- `fukuoka.style.css`, `fukuoka2.style.css`, `fukuoka3.style.css` for Fukuoka travel pages.
- `docutokyo.style.css`, `docuhk.style.css` for photography document pages.

Asset locations:

- Most legacy images are root-level `.JPG`, `.jpeg`, `.jpg`, and `.png` files.
- Osaka also uses `travel/18osaka/img-1.jpeg` through `img-9.jpeg`, then root-level `img-10.jpeg` and later image files.
- Tokyo uses root-level `img*.jpeg` files.
- Fukuoka uses root-level `f-img*.jpeg/.jpg` files.
- Photography uses root-level `docu_*` and `IMG_*` files, plus `travel/docu23tokyo/IMG_*.JPG`.
- Existing `travel/*/.gitkeep` folders should remain untouched.

Music paths:

- Osaka references `https://Hayeoncom.github.io/music-project/travel/18osaka/パンとスープとネコ日和.mp3`.
- The repository also contains the same Osaka MP3 under `travel/18osaka/` with a Unicode-normalized filename variant.
- Do not move or delete the audio file. Prefer keeping the existing public URL or a stable root-relative path in front matter.

## Existing Design Characteristics To Preserve

- Quiet white or near-white background.
- Fixed-width desktop composition around 900-1000px.
- Photo-first layout with generous vertical spacing.
- Home page has:
  - Large centered `Hayeon.jpg` heading.
  - 900px-wide image slider.
  - Travel cards in a two-column rhythm with 350px thumbnails.
  - Hover effect that rounds travel thumbnails into circles.
  - Photography section with full-width grayscale image banners and centered overlay text.
- Travel pages have:
  - Narrow, centered photo column on a pale background.
  - Roughly 700px photo width on desktop.
  - Small Korean captions with light font weight.
  - Simple numbered pagination links between old multi-page sections.
  - Osaka includes an audio control and scrolling theme-song text.
- Photography pages have:
  - Very simple full-width vertical photo sequence.
  - Minimal chrome and no heavy navigation.

## Target Astro Architecture

Introduce Astro in place without deleting legacy assets.

Planned structure:

```text
src/
  content/
    config.ts
    travel/
    photography/
  components/
    AudioPlayer.astro
    ImageFigure.astro
    PhotographyCard.astro
    SiteFooter.astro
    SiteHeader.astro
    TravelCard.astro
  layouts/
    BaseLayout.astro
    TravelLayout.astro
    PhotographyLayout.astro
  pages/
    index.astro
    travel/[id].astro
    photography/[id].astro
  styles/
    base.css
    home.css
    travel.css
    photography.css
    responsive.css
```

## Content Model

Travel entries should be Markdown files in `src/content/travel/`.

Front matter:

```yaml
id: 2018-osaka
title: Summer x2 Osaka
date: 2018-08
location: Osaka, Japan
thumbnail: /osaka.jpg
music: /travel/18osaka/パンとスープとネコ日和.mp3
musicTitle: パンとスープとネコ日和 OST
status: published
legacyUrls:
  - /osaka.html
  - /osaka2.html
```

Photography entries should be Markdown files in `src/content/photography/`.

Front matter:

```yaml
id: 2022-london
title: LONDON
date: 2022-12
location: London, United Kingdom
thumbnail: /l2.JPG
camera: Canon EOS M50
status: published
legacyUrls:
  - /document.london.html
```

Only `status: published` entries should appear on the generated home page.

## URL Compatibility Strategy

Astro pages will provide the new canonical URLs:

- `/travel/2018-osaka/`
- `/travel/2018-tokyo/`
- `/travel/2019-fukuoka/`
- `/photography/2019-tokyo/`
- `/photography/2019-hong-kong/`
- `/photography/2020-new-york/`
- `/photography/2022-london/`
- `/photography/2023-tokyo/`

Keep legacy root HTML URLs as compatibility wrappers. The wrappers should be tiny static HTML files with:

- `<meta http-equiv="refresh" content="0; url=/travel/.../">`
- A canonical link.
- A visible fallback link for users and crawlers.

This preserves bookmarked URLs without requiring server-side redirects on GitHub Pages.

Legacy wrapper mapping:

- `/osaka.html` -> `/travel/2018-osaka/`
- `/osaka2.html` -> `/travel/2018-osaka/`
- `/tokyo.html` -> `/travel/2018-tokyo/`
- `/tokyo2.html` -> `/travel/2018-tokyo/`
- `/tokyo3.html` -> `/travel/2018-tokyo/`
- `/fukuoka.html` -> `/travel/2019-fukuoka/`
- `/fukuoka2.html` -> `/travel/2019-fukuoka/`
- `/fukuoka3.html` -> `/travel/2019-fukuoka/`
- `/document.tokyo.html` -> `/photography/2019-tokyo/`
- `/document.hk.html` -> `/photography/2019-hong-kong/`
- `/document.ny.html` -> `/photography/2020-new-york/`
- `/document.london.html` -> `/photography/2022-london/`
- `/document.tokyo2.html` -> `/photography/2023-tokyo/`

## Implementation Constraints

- Do not delete existing images or audio files.
- Do not bulk move assets into `public/`.
- Do not stage or commit the Unicode-normalization MP3 as an untracked file.
- Keep image paths root-relative where possible so GitHub Pages and local preview resolve them consistently.
- Use Astro only. Do not add React or Vue.
- Use Markdown content collections for user-maintained content.
- Run Chrome verification on localhost for desktop and 390px mobile views after page migrations.
- Record verification results in `TEST-RESULT.md`.

## Verification Plan

For each migrated section:

- Run `npm run build`.
- Run `npm run preview`.
- Check desktop rendering in Chrome.
- Check mobile width 390px in Chrome.
- Confirm no horizontal scrolling.
- Confirm expected image count.
- Confirm console has no blocking errors.
- Confirm audio controls are visible where applicable.
- Confirm legacy wrapper URLs land on the new pages.

## Status And Diff Records

- After branch creation, `git status -sb` contained only the known MP3 normalization artifact.
- This planning step adds only `MIGRATION-PLAN.md`.
- `git diff --stat` should show only this plan file before the first commit.
