#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, '.pages-dist');
const includeFiles = new Set();
const referencedImages = new Set();
const errors = [];

function toPosix(relativePath) {
  return relativePath.split(path.sep).join('/');
}

function rootPath(relativePath) {
  return path.join(rootDir, relativePath);
}

function distPath(relativePath) {
  return path.join(distDir, relativePath);
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

function addFile(relativePath) {
  if (!relativePath || relativePath.includes('..')) return;
  const normalized = toPosix(relativePath);
  if (fs.existsSync(rootPath(normalized)) && fs.statSync(rootPath(normalized)).isFile()) {
    includeFiles.add(normalized);
  } else {
    errors.push(`Missing required file: ${normalized}`);
  }
}

function addReference(value) {
  const normalized = normalizeReference(value);
  if (!normalized || normalized.includes('..')) return;

  if (fs.existsSync(rootPath(normalized)) && fs.statSync(rootPath(normalized)).isFile()) {
    includeFiles.add(normalized);
    if (normalized.startsWith('assets/images/')) {
      referencedImages.add(normalized);
    }
  } else {
    errors.push(`Missing referenced file: ${normalized}`);
  }
}

function listFiles(relativePath) {
  const absolutePath = rootPath(relativePath);
  if (!fs.existsSync(absolutePath)) return [];
  const result = [];

  for (const entry of fs.readdirSync(absolutePath, { withFileTypes: true })) {
    const child = toPosix(path.join(relativePath, entry.name));
    if (entry.isDirectory()) {
      result.push(...listFiles(child));
    } else if (entry.isFile()) {
      result.push(child);
    }
  }

  return result;
}

function parseJson(relativePath) {
  return JSON.parse(fs.readFileSync(rootPath(relativePath), 'utf8'));
}

function collectJsonReferences(value, keyName) {
  if (Array.isArray(value)) {
    value.forEach((item) => collectJsonReferences(item, keyName));
    return;
  }

  if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      collectJsonReferences(child, key);
    }
    return;
  }

  if (typeof value !== 'string') return;

  if (keyName === 'group') {
    value.split(',').forEach((entry) => {
      const candidate = entry.includes(':') ? entry.split(':').slice(1).join(':') : entry;
      const trimmed = candidate.trim();
      if (/\.(html|json|css|js|png|jpe?g|gif|webp|svg|ico|yml)$/i.test(trimmed)) {
        addReference(trimmed);
      }
    });
    return;
  }

  if (['sourceHtml', 'json', 'image', 'href', 'prev', 'next', 'src'].includes(keyName)) {
    addReference(value);
  }
}

function collectHtmlReferences(relativePath) {
  const html = fs.readFileSync(rootPath(relativePath), 'utf8');
  const attrPattern = /\b(?:src|href|data-content)=["']([^"']+)["']/gi;
  let match;
  while ((match = attrPattern.exec(html)) !== null) {
    addReference(match[1]);
  }
}

function collectCssReferences(relativePath) {
  const css = fs.readFileSync(rootPath(relativePath), 'utf8');
  const pattern = /url\(([^)]+)\)/gi;
  let match;
  while ((match = pattern.exec(css)) !== null) {
    addReference(match[1].trim().replace(/^["']|["']$/g, ''));
  }
}

function copyFile(relativePath) {
  const source = rootPath(relativePath);
  const target = distPath(relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}

function copyDirectory(relativePath) {
  const source = rootPath(relativePath);
  const target = distPath(relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  if (fs.existsSync(source)) {
    fs.cpSync(source, target, { recursive: true });
  } else {
    fs.mkdirSync(target, { recursive: true });
  }
}

function getDirectorySize(absolutePath) {
  if (!fs.existsSync(absolutePath)) return 0;
  const stat = fs.statSync(absolutePath);
  if (stat.isFile()) return stat.size;
  if (!stat.isDirectory()) return 0;

  return fs.readdirSync(absolutePath)
    .reduce((total, entry) => total + getDirectorySize(path.join(absolutePath, entry)), 0);
}

function formatBytes(bytes) {
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function collectIncludes() {
  const site = parseJson('content/site.json');

  ['.nojekyll', 'CNAME', 'favicon.ico', 'style.css'].forEach(addFile);
  fs.readdirSync(rootDir)
    .filter((name) => name.endsWith('.style.css'))
    .sort()
    .forEach(addFile);

  ['assets/common.css', 'assets/site.js', 'assets/cms-renderer.js'].forEach(addFile);
  ['admin/index.html', 'admin/config.yml'].forEach(addFile);
  ['content/site.json', ...listFiles('content/pages').filter((name) => name.endsWith('.json'))].forEach(addFile);

  site.pages
    .map((page) => page.sourceHtml)
    .sort()
    .forEach((htmlFile) => {
      addFile(htmlFile);
      collectHtmlReferences(htmlFile);
    });

  fs.readdirSync(rootDir)
    .filter((name) => name === 'style.css' || name.endsWith('.style.css'))
    .sort()
    .forEach(collectCssReferences);

  collectJsonReferences(site, 'site');
  listFiles('content/pages')
    .filter((name) => name.endsWith('.json'))
    .sort()
    .forEach((jsonFile) => collectJsonReferences(parseJson(jsonFile), 'page'));
}

function main() {
  fs.rmSync(distDir, { recursive: true, force: true });
  fs.mkdirSync(distDir, { recursive: true });

  collectIncludes();

  if (errors.length > 0) {
    console.error(`Pages artifact preparation failed: ${errors.length} error(s)`);
    errors.forEach((error) => console.error(`- ${error}`));
    process.exit(1);
  }

  Array.from(includeFiles).sort().forEach(copyFile);
  copyDirectory('assets/images/uploads');

  const distFiles = listFiles('.pages-dist');
  const manifest = {
    outputDir: '.pages-dist',
    fileCount: distFiles.length,
    totalBytes: getDirectorySize(distDir),
    totalSize: formatBytes(getDirectorySize(distDir)),
    htmlFiles: Array.from(includeFiles).filter((name) => name.endsWith('.html')).length,
    imageFiles: referencedImages.size,
    excluded: [
      '.git/',
      '.github/',
      'docs/',
      'scripts/',
      'reports/',
      'prompt/',
      'assets/images/unused/',
      'Epilogue.zip',
      'Rota - FREE.zip',
      'Photography/',
      'travel/',
      '.DS_Store',
    ],
  };

  console.log('Pages artifact prepared');
  console.log(JSON.stringify(manifest, null, 2));
}

main();
