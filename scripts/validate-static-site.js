#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const rootArgIndex = args.indexOf('--root');
const rootDir = path.resolve(
  repoRoot,
  rootArgIndex >= 0 && args[rootArgIndex + 1] ? args[rootArgIndex + 1] : '.',
);
const rootName = path.basename(rootDir);
const isPagesArtifact = rootName === '.pages-dist';
const isNetlifyAdminArtifact = rootName === '.netlify-admin';

const expectedHtml = [
  'index.html',
  '2019 tokyo.html',
  'document.hk.html',
  'document.london.html',
  'document.ny.html',
  'document.tokyo.html',
  'document.tokyo2.html',
  'fukuoka.html',
  'fukuoka2.html',
  'fukuoka3.html',
  'hongkongmacau.html',
  'london.html',
  'new york.html',
  'osaka.html',
  'osaka2.html',
  'tokyo.html',
  'tokyo2.html',
  'tokyo3.html',
  'tokyoagain.html',
].sort();

const errors = [];
const checked = {
  files: 0,
  html: 0,
  json: 0,
  references: 0,
};

function rel(filePath) {
  return path.relative(rootDir, filePath).split(path.sep).join('/') || '.';
}

function addError(message) {
  errors.push(message);
}

function filePath(relativePath) {
  return path.join(rootDir, relativePath);
}

function readFile(relativePath) {
  checked.files += 1;
  return fs.readFileSync(filePath(relativePath), 'utf8');
}

function exists(relativePath) {
  return fs.existsSync(filePath(relativePath));
}

function isFile(relativePath) {
  try {
    return fs.statSync(filePath(relativePath)).isFile();
  } catch {
    return false;
  }
}

function isDirectory(relativePath) {
  try {
    return fs.statSync(filePath(relativePath)).isDirectory();
  } catch {
    return false;
  }
}

function assertFile(relativePath) {
  if (!isFile(relativePath)) {
    addError(`${relativePath}: missing file`);
    return false;
  }
  return true;
}

function assertDirectory(relativePath) {
  if (!isDirectory(relativePath)) {
    addError(`${relativePath}: missing directory`);
    return false;
  }
  return true;
}

function listFilesRecursive(relativePath) {
  const base = filePath(relativePath);
  if (!fs.existsSync(base)) return [];
  const files = [];

  for (const entry of fs.readdirSync(base, { withFileTypes: true })) {
    const child = path.join(relativePath, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFilesRecursive(child));
    } else if (entry.isFile()) {
      files.push(child.split(path.sep).join('/'));
    }
  }

  return files;
}

function isExternalReference(value) {
  return /^(https?:)?\/\//i.test(value) ||
    /^(mailto|tel|javascript|data):/i.test(value) ||
    value.startsWith('#');
}

function normalizeReference(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed || isExternalReference(trimmed)) return null;

  const withoutHash = trimmed.split('#')[0];
  const withoutQuery = withoutHash.split('?')[0];
  if (!withoutQuery) return null;

  let normalized = withoutQuery.replace(/^\/+/, '');
  try {
    normalized = decodeURI(normalized);
  } catch {
    return normalized;
  }
  return normalized;
}

function assertLocalReference(source, value) {
  const normalized = normalizeReference(value);
  if (!normalized) return;

  if (normalized.includes('..')) {
    addError(`${source}: path traversal reference is not allowed: ${value}`);
    return;
  }

  checked.references += 1;
  if (!exists(normalized)) {
    addError(`${source}: referenced file does not exist: ${value}`);
  }
}

function parseJson(relativePath) {
  checked.json += 1;
  try {
    return JSON.parse(readFile(relativePath));
  } catch (error) {
    addError(`${relativePath}: JSON parse error (${error.message})`);
    return null;
  }
}

function getGeneratedPages() {
  const directory = 'content/generated-pages';
  if (!exists(directory)) return [];

  return listFilesRecursive(directory)
    .filter((name) => name.endsWith('.json'))
    .sort()
    .map((relativePath) => {
      const page = parseJson(relativePath);
      if (!page || typeof page.sourceHtml !== 'string') {
        return null;
      }
      if (page.visible === false) {
        return null;
      }
      return {
        json: relativePath,
        sourceHtml: page.sourceHtml.trim(),
        slug: typeof page.slug === 'string' ? page.slug.trim() : '',
      };
    })
    .filter(Boolean);
}

function collectJsonReferences(value, source, keyName) {
  if (Array.isArray(value)) {
    value.forEach((item) => collectJsonReferences(item, source, keyName));
    return;
  }

  if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      collectJsonReferences(child, source, key);
    }
    return;
  }

  if (typeof value !== 'string') return;

  if (keyName === 'group') {
    value.split(',').forEach((entry) => {
      const candidate = entry.includes(':') ? entry.split(':').slice(1).join(':') : entry;
      const trimmed = candidate.trim();
      if (/\.(html|json|css|js|png|jpe?g|gif|webp|svg|ico|yml)$/i.test(trimmed)) {
        assertLocalReference(`${source}:${keyName}`, trimmed);
      }
    });
    return;
  }

  if (['sourceHtml', 'json', 'image', 'href', 'prev', 'next', 'src'].includes(keyName)) {
    assertLocalReference(`${source}:${keyName}`, value);
  }
}

function collectGeneratedJsonReferences(value, source, keyName) {
  if (Array.isArray(value)) {
    value.forEach((item) => collectGeneratedJsonReferences(item, source, keyName));
    return;
  }

  if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      collectGeneratedJsonReferences(child, source, key);
    }
    return;
  }

  if (typeof value !== 'string') return;

  if (['image', 'href', 'prev', 'next', 'src'].includes(keyName)) {
    assertLocalReference(`${source}:${keyName}`, value);
  }
}

function validateContentJson() {
  assertFile('content/site.json');
  assertDirectory('content/pages');

  const site = parseJson('content/site.json');
  if (!site) return;

  if (!Array.isArray(site.pages)) {
    addError('content/site.json: pages must be an array');
    return;
  }

  const sourceHtml = site.pages.map((page) => page.sourceHtml).sort();
  if (sourceHtml.length !== expectedHtml.length || sourceHtml.some((name, index) => name !== expectedHtml[index])) {
    addError(`content/site.json: expected 19 root HTML entries, found ${sourceHtml.length}`);
  }

  collectJsonReferences(site, 'content/site.json', 'site');

  const pageFiles = listFilesRecursive('content/pages').filter((name) => name.endsWith('.json')).sort();
  if (pageFiles.length !== 19) {
    addError(`content/pages: expected 19 JSON files, found ${pageFiles.length}`);
  }

  for (const pageFile of pageFiles) {
    const page = parseJson(pageFile);
    if (page) collectJsonReferences(page, pageFile, 'page');
  }

  const generatedFiles = listFilesRecursive('content/generated-pages').filter((name) => name.endsWith('.json')).sort();
  for (const generatedFile of generatedFiles) {
    const page = parseJson(generatedFile);
    if (page) collectGeneratedJsonReferences(page, generatedFile, 'generatedPage');
  }
}

function validateHtml() {
  const htmlFiles = fs.readdirSync(rootDir)
    .filter((name) => name.endsWith('.html'))
    .sort();
  const generatedPages = getGeneratedPages();
  const generatedHtml = generatedPages.map((page) => page.sourceHtml).sort();
  const expectedHtmlForRoot = isPagesArtifact
    ? expectedHtml.concat(generatedHtml).sort()
    : expectedHtml;

  if (htmlFiles.length !== expectedHtmlForRoot.length) {
    addError(`root HTML count: expected ${expectedHtmlForRoot.length}, found ${htmlFiles.length}`);
  }

  const missing = expectedHtmlForRoot.filter((name) => !htmlFiles.includes(name));
  missing.forEach((name) => addError(`${name}: expected root HTML file is missing`));

  for (const htmlFile of expectedHtml) {
    if (!assertFile(htmlFile)) continue;
    checked.html += 1;

    const html = readFile(htmlFile);
    const viewportCount = (html.match(/<meta\s+name=["']viewport["']/gi) || []).length;
    if (viewportCount !== 1) addError(`${htmlFile}: viewport meta count must be 1, found ${viewportCount}`);
    if (!html.includes('href="assets/common.css"')) addError(`${htmlFile}: assets/common.css reference missing`);
    if (!html.includes('src="assets/site.js"')) addError(`${htmlFile}: assets/site.js reference missing`);
    if (!html.includes('src="assets/cms-renderer.js"')) addError(`${htmlFile}: assets/cms-renderer.js reference missing`);
    if (!/data-content=["']content\/pages\/[^"']+\.json["']/.test(html)) {
      addError(`${htmlFile}: data-content JSON reference missing`);
    }

    const attrPattern = /\b(?:src|href|data-content)=["']([^"']+)["']/gi;
    let match;
    while ((match = attrPattern.exec(html)) !== null) {
      assertLocalReference(htmlFile, match[1]);
    }
  }

  if (!isPagesArtifact) {
    generatedHtml
      .filter((name) => htmlFiles.includes(name))
      .forEach((name) => addError(`${name}: generated HTML must not be committed at repository root`));
    return;
  }

  for (const page of generatedPages) {
    if (!assertFile(page.sourceHtml)) continue;
    checked.html += 1;

    const html = readFile(page.sourceHtml);
    const viewportCount = (html.match(/<meta\s+name=["']viewport["']/gi) || []).length;
    if (viewportCount !== 1) addError(`${page.sourceHtml}: viewport meta count must be 1, found ${viewportCount}`);
    if (!html.includes('href="assets/common.css"')) addError(`${page.sourceHtml}: assets/common.css reference missing`);
    if (!html.includes('src="assets/site.js"')) addError(`${page.sourceHtml}: assets/site.js reference missing`);
    if (!html.includes('src="assets/cms-renderer.js"')) addError(`${page.sourceHtml}: assets/cms-renderer.js reference missing`);
    if (!html.includes(`data-content="${page.json}"`)) {
      addError(`${page.sourceHtml}: generated page data-content must point to ${page.json}`);
    }

    const attrPattern = /\b(?:src|href|data-content)=["']([^"']+)["']/gi;
    let match;
    while ((match = attrPattern.exec(html)) !== null) {
      assertLocalReference(page.sourceHtml, match[1]);
    }
  }
}

function validateCss() {
  const cssFiles = fs.readdirSync(rootDir)
    .filter((name) => name === 'style.css' || name.endsWith('.style.css'))
    .sort();

  if (!cssFiles.includes('style.css')) addError('style.css: missing root CSS file');

  for (const cssFile of cssFiles) {
    const css = readFile(cssFile);
    const pattern = /url\(([^)]+)\)/gi;
    let match;
    while ((match = pattern.exec(css)) !== null) {
      const ref = match[1].trim().replace(/^["']|["']$/g, '');
      assertLocalReference(cssFile, ref);
    }
  }
}

function validateJavaScriptReferences() {
  ['assets/cms-renderer.js', 'assets/site.js'].forEach((jsFile) => {
    if (!assertFile(jsFile)) return;
    const js = readFile(jsFile);
    const pattern = /["']((?:assets|content|admin)\/[^"']+)["']/g;
    let match;
    while ((match = pattern.exec(js)) !== null) {
      assertLocalReference(jsFile, match[1]);
    }
  });
}

function validateAdminConfig() {
  if (isPagesArtifact) {
    if (!assertFile('admin/index.html')) return;
    if (exists('admin/config.yml')) addError('admin/config.yml: must not be present in GitHub Pages artifact');

    const index = readFile('admin/index.html');
    if (!index.includes('hayeon-cms-auth.netlify.app/admin/')) {
      addError('admin/index.html: GitHub Pages admin page must point to Netlify admin URL');
    }
    if (/decap-cms/i.test(index)) {
      addError('admin/index.html: GitHub Pages admin page must not load Decap CMS');
    }
    return;
  }

  if (!assertFile('admin/index.html')) return;
  if (!assertFile('admin/config.yml')) return;

  const index = readFile('admin/index.html');
  if (!/decap-cms/i.test(index)) addError('admin/index.html: Decap CMS script reference missing');

  const config = readFile('admin/config.yml');
  if (/\t/.test(config)) addError('admin/config.yml: tab indentation is not allowed');
  if (!/repo:\s*Hayeoncom\/test/.test(config)) addError('admin/config.yml: backend.repo must be Hayeoncom/test');
  if (!/branch:\s*main/.test(config)) addError('admin/config.yml: backend.branch must be main');
  if (!/site_domain:\s*hayeon-cms-auth\.netlify\.app/.test(config)) {
    addError('admin/config.yml: backend.site_domain must be hayeon-cms-auth.netlify.app');
  }
  if (!/media_folder:\s*["']assets\/images\/uploads["']/.test(config)) {
    addError('admin/config.yml: media_folder must be assets/images/uploads');
  }
  if (!/public_folder:\s*["']assets\/images\/uploads["']/.test(config)) {
    addError('admin/config.yml: public_folder must be assets/images/uploads');
  }
  if (!/name:\s*["']site["']/.test(config)) addError('admin/config.yml: site collection missing');
  if (!/name:\s*["']pages["']/.test(config)) addError('admin/config.yml: pages collection missing');
  if (!/name:\s*["']generated_pages["']/.test(config)) addError('admin/config.yml: generated_pages collection missing');
  if (!/name:\s*["']originalUrl["']/.test(config)) addError('admin/config.yml: originalUrl field missing');
}

function validateRequiredFiles() {
  if (isNetlifyAdminArtifact) {
    assertFile('favicon.ico');
    return;
  }

  [
    '.nojekyll',
    'CNAME',
    'favicon.ico',
    'assets/common.css',
    'assets/site.js',
    'assets/cms-renderer.js',
  ].forEach(assertFile);

  assertDirectory('assets/images/uploads');

  if (assertFile('CNAME')) {
    const cname = readFile('CNAME').trim();
    if (cname !== 'hayeon.kr') addError(`CNAME: expected hayeon.kr, found ${cname || '(empty)'}`);
  }
}

function validateArtifactExclusions() {
  if (path.resolve(rootDir) === path.resolve(repoRoot)) return;

  [
    '.github',
    'docs',
    'scripts',
    'reports',
    'prompt',
    'Photography',
    '.netlify-admin',
    'assets/images/unused',
  ].forEach((relativePath) => {
    if (exists(relativePath)) addError(`${relativePath}: excluded path is present in artifact`);
  });

  ['Epilogue.zip', 'Rota - FREE.zip', 'netlify.toml'].forEach((relativePath) => {
    if (exists(relativePath)) addError(`${relativePath}: excluded file is present in artifact`);
  });
}

function main() {
  if (!fs.existsSync(rootDir)) {
    addError(`${rootDir}: root does not exist`);
  } else if (isNetlifyAdminArtifact) {
    validateRequiredFiles();
    validateAdminConfig();
  } else {
    validateRequiredFiles();
    validateContentJson();
    validateHtml();
    validateCss();
    validateJavaScriptReferences();
    validateAdminConfig();
    validateArtifactExclusions();
  }

  if (errors.length > 0) {
    console.error(`Static site validation failed: ${errors.length} error(s)`);
    errors.forEach((error) => console.error(`- ${error}`));
    process.exit(1);
  }

  console.log(`Static site validation passed: ${rel(rootDir)}`);
  console.log(`Checked ${checked.html} HTML, ${checked.json} JSON, ${checked.references} local reference(s)`);
}

main();
