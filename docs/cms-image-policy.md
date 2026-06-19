# CMS Image Original and Optimized Delivery Policy

## Purpose

This site keeps source image paths stable while GitHub Actions builds a lightweight Pages artifact. The repository stores original images under `assets/images/**`; the deployed site serves optimized copies from `.pages-dist` with the same public paths.

## Current Image Flow

```text
CMS content JSON
content/pages/*.json
  image: assets/images/<page>/<file>
        |
        | scripts/prepare-pages-artifact.js
        v
.pages-dist/assets/images/<page>/<file>
  optimized copy, same public URL
        |
        v
https://hayeon.kr/assets/images/<page>/<file>
```

- CMS uploads are configured in `admin/config.yml`.
  - `media_folder`: `assets/images/uploads`
  - `public_folder`: `assets/images/uploads`
- Page JSON stores display image paths in each item `image` field.
- `assets/cms-renderer.js` renders the `image` field as the page image.
- `scripts/prepare-pages-artifact.js` copies referenced files into `.pages-dist`, then optimizes the copied JPG/PNG files only.
- Original files in `assets/images/**` are not modified during artifact generation.
- The public URL remains unchanged, but the deployed file is the optimized artifact copy.

## Why Original Images Should Stay Out of the Pages Artifact

- GitHub Pages artifact must remain below the deployment size limit.
- Original source images are currently several GB in total.
- Users browsing pages should receive optimized images for faster loading.
- Original image access should be an explicit action, not the default page payload.

## Optional `originalUrl` Field

CMS page items may include an optional `originalUrl` field:

```json
{
  "image": "assets/images/tokyo/sample.jpg",
  "alt": "Tokyo",
  "caption": "Sample image",
  "originalUrl": "https://example.com/original/tokyo/sample.jpg"
}
```

Rules:

- `image` remains the optimized display image path.
- `originalUrl` is optional.
- If `originalUrl` is missing, the image has no original-view link.
- If `originalUrl` is present, the image opens the original URL in a new tab/window.
- Original links must use `target="_blank"` with `rel="noopener noreferrer"`.
- Page number links must not use this behavior.

## Original Storage Options

### A. GitHub Raw or Blob URL

Structure:

```text
Original: current repository assets/images/**
Display: optimized GitHub Pages artifact image
Original view: raw.githubusercontent.com or GitHub blob URL
```

Pros:

- Smallest structural change.
- Existing original files can be reused.
- Works for short-term testing without new storage.

Cons:

- Repository size keeps growing.
- Raw/blob URLs depend on GitHub URL and branch policy.
- Not ideal as a long-term image CDN.

Current test branch standard:

```text
https://raw.githubusercontent.com/Hayeoncom/test/refs/heads/refactor/ver1/<image-path>
```

Representative test URL:

```text
https://raw.githubusercontent.com/Hayeoncom/test/refs/heads/refactor/ver1/assets/images/tokyo/img0.jpeg
```

When the production branch changes to `main`, update the standard to:

```text
https://raw.githubusercontent.com/Hayeoncom/test/refs/heads/main/<image-path>
```

### B. Separate Original Image Repository or GitHub Releases

Structure:

```text
Original: separate GitHub repository or release asset
Display: optimized GitHub Pages artifact image
Original view: separate original URL
```

Pros:

- Separates site delivery from original storage.
- Reduces pressure on the site repository.

Cons:

- Requires a URL management process.
- CMS upload workflow must preserve the relationship between display image and original URL.

### C. Object Storage or CDN

Examples:

- Cloudflare R2
- AWS S3 and CloudFront
- Backblaze B2
- Other object storage with CDN

Structure:

```text
Original: object storage
Display: optimized GitHub Pages artifact image
Original view: object storage or CDN original URL
```

Pros:

- Best fit for long-term large image storage.
- Keeps the Git repository small.
- Can support original, web, thumbnail, and future derivative sizes.

Cons:

- Requires account, permissions, cost review, and upload workflow.
- CMS integration needs follow-up design.

## Recommendation

- Short term: use option A or B with optional `originalUrl` fields for selected images only.
- Long term: evaluate option C for original image storage and stable public original URLs.
- Keep `image` as the site display path and keep the existing URL structure.
- Do not include unreferenced originals or full original archives in the Pages artifact.

## CMS Operation Guideline

1. Upload or keep the optimized display image path in `image`.
2. Store the full-size original image outside the Pages artifact path.
3. Add `originalUrl` only when original viewing is needed.
4. Verify that `originalUrl` is an `http` or `https` URL.
5. Confirm that the page display still loads `assets/images/<page>/<file>`.
6. Confirm that clicking the image opens the original URL in a new tab/window.
7. Confirm that page number links still navigate in the current tab.

## Follow-up Work

- Decide whether original images stay in the current repository, a separate repository, or object storage.
- Define naming rules for original and optimized image pairs.
- Add CMS editorial guidance for when `originalUrl` should be filled.
- Consider automated validation for selected original URLs without downloading the full image.
