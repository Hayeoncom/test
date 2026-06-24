#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const defaultContentDir = path.join(rootDir, 'content', 'generated-pages');
const defaultOutputDir = path.join(rootDir, '.pages-dist');
const rawBaseUrl = 'https://raw.githubusercontent.com/Hayeoncom/test/refs/heads/main/';
const slugPattern = /^[a-z0-9-]+$/;
const reservedSlugs = new Set([
  'admin',
  'assets',
  'content',
  'docs',
  'favicon',
  'index',
  'prompt',
  'reports',
  'scripts',
]);

function toPosix(value) {
  return value.split(path.sep).join('/');
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function listJsonFiles(contentDir) {
  if (!fs.existsSync(contentDir)) return [];
  return fs.readdirSync(contentDir)
    .filter((name) => name.endsWith('.json'))
    .sort()
    .map((name) => path.join(contentDir, name));
}

function getExistingRootHtml() {
  return fs.readdirSync(rootDir)
    .filter((name) => name.endsWith('.html'))
    .sort();
}

function normalizeSourceHtml(page) {
  if (typeof page.sourceHtml === 'string' && page.sourceHtml.trim()) {
    return page.sourceHtml.trim();
  }
  return `${page.slug}.html`;
}

function getGalleryItems(page) {
  if (Array.isArray(page.gallery)) return page.gallery;
  const gallery = Array.isArray(page.sections)
    ? page.sections.find((section) => section && section.type === 'gallery')
    : null;
  return gallery && Array.isArray(gallery.items) ? gallery.items : [];
}

function validatePage(page, jsonFile, existingRootHtml) {
  const errors = [];
  const relativeJson = toPosix(path.relative(rootDir, jsonFile));
  const slug = typeof page.slug === 'string' ? page.slug.trim() : '';
  const sourceHtml = normalizeSourceHtml(page);
  const gallery = getGalleryItems(page);

  ['id', 'slug', 'pageType', 'title'].forEach((field) => {
    if (typeof page[field] !== 'string' || page[field].trim() === '') {
      errors.push(`${relativeJson}: ${field} must be a non-empty string`);
    }
  });

  if (slug && !slugPattern.test(slug)) {
    errors.push(`${relativeJson}: slug must match ${slugPattern}`);
  }

  if (reservedSlugs.has(slug)) {
    errors.push(`${relativeJson}: slug is reserved: ${slug}`);
  }

  if (!sourceHtml.endsWith('.html')) {
    errors.push(`${relativeJson}: sourceHtml must end with .html`);
  }

  if (slug && sourceHtml !== `${slug}.html`) {
    errors.push(`${relativeJson}: sourceHtml must be ${slug}.html`);
  }

  if (existingRootHtml.includes(sourceHtml)) {
    errors.push(`${relativeJson}: sourceHtml conflicts with existing root HTML: ${sourceHtml}`);
  }

  if (page.pageType !== 'generated-gallery') {
    errors.push(`${relativeJson}: pageType must be generated-gallery`);
  }

  if (!Array.isArray(gallery)) {
    errors.push(`${relativeJson}: gallery must be an array`);
  }

  gallery.forEach((item, index) => {
    const label = `${relativeJson}: gallery[${index}]`;
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      errors.push(`${label} must be an object`);
      return;
    }

    const image = typeof item.image === 'string' ? item.image.trim() : '';
    const originalUrl = typeof item.originalUrl === 'string' ? item.originalUrl.trim() : '';

    if (!image) {
      errors.push(`${label}.image must be a non-empty path`);
    } else if (!image.startsWith('assets/images/')) {
      errors.push(`${label}.image must start with assets/images/: ${image}`);
    } else if (!fs.existsSync(path.join(rootDir, image))) {
      errors.push(`${label}.image path does not exist: ${image}`);
    }

    if (!originalUrl) {
      errors.push(`${label}.originalUrl is required for generated gallery images`);
    } else if (originalUrl !== rawBaseUrl + image) {
      errors.push(`${label}.originalUrl must match GitHub raw main image path: ${rawBaseUrl + image}`);
    }
  });

  return errors;
}

function renderGeneratedPage(page, jsonRelativePath) {
  const title = escapeHtml(page.title);
  const description = escapeHtml(page.description || '');
  const audio = page.audio && page.audio.enabled !== false && page.audio.src
    ? page.audio
    : null;
  const audioTitle = page.audio && page.audio.title ? page.audio.title : '';

  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <link rel="icon" href="favicon.ico">
  <link rel="stylesheet" href="assets/common.css">
  <link href="https://fonts.googleapis.com/css2?family=Epilogue:wght@100&family=Jost:ital,wght@0,400;1,200&family=Noto+Sans+Display&family=Noto+Sans+KR:wght@100;300;500&family=Noto+Serif+Georgian&family=Poppins:wght@100&display=swap" rel="stylesheet">
</head>
<body class="generated-gallery-page" data-content="${escapeHtml(jsonRelativePath)}" data-generated-page="true">
  <div id="wrap">
    <header class="generated-page-header">
      <p class="generated-page-kicker">Hayeon.jpg</p>
      <h1 id="generated-title">${title}</h1>
      ${description ? `<p class="generated-page-description">${description}</p>` : ''}
    </header>
    <div class="animated-title" aria-hidden="true">
      <div class="track">
        <div class="content">${description || title}</div>
      </div>
    </div>
    <div class="audio"${audio ? '' : ' hidden'}>
      ${audioTitle ? `<p>${escapeHtml(audioTitle)}</p>` : ''}
      <audio controls loop controlslist="nodownload">
        <source src="${audio ? escapeHtml(audio.src) : ''}" type="${audio ? escapeHtml(audio.type || 'audio/mp3') : 'audio/mp3'}">
      </audio>
    </div>
    <section id="contents" aria-label="${title} gallery"></section>
    <footer id="footer">
      <p>© Hayeon.jpg</p>
    </footer>
  </div>
  <script src="assets/site.js"></script>
  <script src="assets/cms-renderer.js"></script>
</body>
</html>
`;
}

function generateStaticPages(options = {}) {
  const contentDir = options.contentDir || defaultContentDir;
  const outputDir = options.outputDir || defaultOutputDir;
  const jsonFiles = listJsonFiles(contentDir);
  const existingRootHtml = getExistingRootHtml();
  const generated = [];
  const errors = [];

  jsonFiles.forEach((jsonFile) => {
    let page;
    try {
      page = readJson(jsonFile);
    } catch (error) {
      errors.push(`${toPosix(path.relative(rootDir, jsonFile))}: JSON parse error (${error.message})`);
      return;
    }

    const pageErrors = validatePage(page, jsonFile, existingRootHtml);
    errors.push(...pageErrors);
    if (pageErrors.length > 0) return;

    const sourceHtml = normalizeSourceHtml(page);
    const outputFile = path.join(outputDir, sourceHtml);
    const jsonRelativePath = toPosix(path.relative(rootDir, jsonFile));
    fs.mkdirSync(path.dirname(outputFile), { recursive: true });
    fs.writeFileSync(outputFile, renderGeneratedPage(page, jsonRelativePath));
    generated.push(sourceHtml);
  });

  if (errors.length > 0) {
    const error = new Error(`Generated page creation failed: ${errors.length} error(s)`);
    error.details = errors;
    throw error;
  }

  return {
    contentDir: toPosix(path.relative(rootDir, contentDir)) || '.',
    outputDir: toPosix(path.relative(rootDir, outputDir)) || '.',
    count: generated.length,
    htmlFiles: generated,
  };
}

function main() {
  try {
    const manifest = generateStaticPages();
    console.log('Generated static pages prepared');
    console.log(JSON.stringify(manifest, null, 2));
  } catch (error) {
    console.error(error.message);
    if (Array.isArray(error.details)) {
      error.details.forEach((detail) => console.error(`- ${detail}`));
    }
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  generateStaticPages,
  rawBaseUrl,
  reservedSlugs,
  slugPattern,
};
