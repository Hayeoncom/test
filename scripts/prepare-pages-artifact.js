#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { performance } = require('perf_hooks');

const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, '.pages-dist');
const generatedPagesDir = 'content/generated-pages';
const imageMaxDimension = 1400;
const jpegQuality = 78;
const artifactWarningBytes = 900 * 1024 * 1024;
const artifactFailBytes = 1024 * 1024 * 1024;
const imageCacheDir = process.env.PAGES_IMAGE_CACHE_DIR
  ? path.resolve(rootDir, process.env.PAGES_IMAGE_CACHE_DIR)
  : path.join(rootDir, '.cache/pages-images');
const imageCacheManifestPath = path.join(imageCacheDir, 'manifest.json');
const imageOptimizationPolicyVersion = '2026-06-26-v1';
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

function addOptionalFile(relativePath) {
  if (!relativePath || relativePath.includes('..')) return;
  const normalized = toPosix(relativePath);
  if (fs.existsSync(rootPath(normalized)) && fs.statSync(rootPath(normalized)).isFile()) {
    includeFiles.add(normalized);
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

function collectGeneratedJsonReferences(value, keyName) {
  if (Array.isArray(value)) {
    value.forEach((item) => collectGeneratedJsonReferences(item, keyName));
    return;
  }

  if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      collectGeneratedJsonReferences(child, key);
    }
    return;
  }

  if (typeof value !== 'string') return;

  if (['image', 'homeImage', 'href', 'prev', 'next', 'src'].includes(keyName)) {
    addReference(value);
  }
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getGeneratedHomeCards() {
  return listFiles(generatedPagesDir)
    .filter((name) => name.endsWith('.json'))
    .sort()
    .map((jsonFile) => {
      const page = parseJson(jsonFile);
      if (!page || page.visible === false || page.showOnHome !== true) return null;
      return {
        title: page.homeTitle || page.title || '',
        meta: page.homeSubtitle || page.homeMeta || page.description || '',
        image: page.homeImage || '',
        href: page.sourceHtml || `${page.slug}.html`,
        order: typeof page.homeOrder === 'number' ? page.homeOrder : (
          typeof page.displayOrder === 'number' ? page.displayOrder : 999
        ),
      };
    })
    .filter((card) => card && card.title && card.image && card.href)
    .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
}

function renderGeneratedHomeCard(card, index) {
  return `                <div class="imgli${index} generated-home-card">
                    <ul class="clearfix">
                         <li>
                         <a href="${escapeHtml(card.href)}" onfocus="this.blur()">
                         <img src="${escapeHtml(card.image)}" alt="${escapeHtml(card.title)}">
                         <span>${escapeHtml(card.title)}</span>
                         </a>
                         <P>${escapeHtml(card.meta)}</P>
                         </li>
                     </ul>
                 </div>
                 <!-- generated:${escapeHtml(card.href)} -->
`;
}

function injectGeneratedHomeCards() {
  const cards = getGeneratedHomeCards();
  if (!cards.length) {
    return { count: 0, cards: [] };
  }

  const indexPath = distPath('index.html');
  let html = fs.readFileSync(indexPath, 'utf8');
  const existingCardCount = (html.match(/<div class="imgli\d+/g) || []).length;
  const cardHtml = cards
    .map((card, offset) => renderGeneratedHomeCard(card, existingCardCount + offset))
    .join('\n');
  const marker = /(\s*<\/section>\s*<!--\s*\/\/contents1\s*-->)/;

  if (!marker.test(html)) {
    errors.push('index.html: contents1 insertion marker not found');
    return { count: 0, cards: [] };
  }

  html = html.replace(marker, `\n${cardHtml}$1`);
  fs.writeFileSync(indexPath, html);
  return {
    count: cards.length,
    cards: cards.map((card) => ({ href: card.href, image: card.image, title: card.title })),
  };
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

function writeFile(relativePath, content) {
  const target = distPath(relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
}

function ensureDirectory(relativePath) {
  fs.mkdirSync(distPath(relativePath), { recursive: true });
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

function formatSeconds(milliseconds) {
  return Number((milliseconds / 1000).toFixed(3));
}

function getFileSha256(absolutePath) {
  const hash = crypto.createHash('sha256');
  hash.update(fs.readFileSync(absolutePath));
  return hash.digest('hex');
}

function commandExists(command) {
  const pathDirs = (process.env.PATH || '').split(path.delimiter);
  return pathDirs.some((dir) => {
    const candidate = path.join(dir, command);
    try {
      fs.accessSync(candidate, fs.constants.X_OK);
      return true;
    } catch {
      return false;
    }
  });
}

function getImageOptimizer() {
  if (commandExists('magick')) return { command: 'magick', type: 'imagemagick' };
  if (commandExists('convert')) return { command: 'convert', type: 'imagemagick' };
  if (commandExists('sips')) return { command: 'sips', type: 'sips' };
  return null;
}

function runOptimizer(command, args) {
  const result = require('child_process').spawnSync(command, args, {
    encoding: 'utf8',
    maxBuffer: 1024 * 1024,
  });

  if (result.error) return { ok: false, message: result.error.message };
  if (result.status !== 0) {
    const message = (result.stderr || result.stdout || '').trim();
    return { ok: false, message: message || `${command} exited with ${result.status}` };
  }

  return { ok: true };
}

function getOptimizerVersion(optimizer) {
  const args = optimizer.command === 'sips' ? ['--version'] : ['-version'];
  const result = require('child_process').spawnSync(optimizer.command, args, {
    encoding: 'utf8',
    maxBuffer: 1024 * 1024,
  });
  if (result.error || result.status !== 0) {
    return 'unknown';
  }
  return (result.stdout || result.stderr || '').split('\n')[0].trim() || 'unknown';
}

function getPolicy(optimizer) {
  return {
    version: imageOptimizationPolicyVersion,
    maxDimension: imageMaxDimension,
    jpegQuality,
    optimizerType: optimizer.type,
    optimizerCommand: optimizer.command,
    optimizerVersion: getOptimizerVersion(optimizer),
  };
}

function loadImageCacheManifest() {
  if (!fs.existsSync(imageCacheManifestPath)) {
    return { version: 1, entries: {} };
  }

  try {
    const manifest = JSON.parse(fs.readFileSync(imageCacheManifestPath, 'utf8'));
    if (manifest && manifest.version === 1 && manifest.entries && typeof manifest.entries === 'object') {
      return manifest;
    }
  } catch (error) {
    console.warn(`Ignoring image cache manifest: ${error.message}`);
  }

  return { version: 1, entries: {} };
}

function saveImageCacheManifest(manifest, stats) {
  fs.mkdirSync(imageCacheDir, { recursive: true });
  manifest.updatedAt = new Date().toISOString();
  manifest.policy = stats.policy;
  manifest.imageCount = Object.keys(manifest.entries).length;
  fs.writeFileSync(imageCacheManifestPath, JSON.stringify(manifest, null, 2));
}

function getCacheKey(relativePath, sourceHash, sourceBytes, policy) {
  const value = JSON.stringify({
    relativePath,
    sourceHash,
    sourceBytes,
    policy,
  });
  return crypto.createHash('sha256').update(value).digest('hex');
}

function getCacheFilePath(cacheKey, extension) {
  return path.join(imageCacheDir, 'files', `${cacheKey}${extension.toLowerCase()}`);
}

function getSourceImageMetadata(relativePath) {
  const sourcePath = rootPath(relativePath);
  const stat = fs.statSync(sourcePath);
  return {
    sourcePath,
    sourceBytes: stat.size,
    sourceHash: getFileSha256(sourcePath),
  };
}

function optimizeWithImageMagick(optimizer, source, target, extension) {
  const resize = `${imageMaxDimension}x${imageMaxDimension}>`;
  const isJpeg = /\.jpe?g$/i.test(extension);
  const isPng = /\.png$/i.test(extension);
  if (!isJpeg && !isPng) return { ok: false, message: `unsupported extension ${extension}` };

  const args = [
    source,
    '-auto-orient',
    '-resize',
    resize,
    '-strip',
  ];

  if (isJpeg) {
    args.push('-quality', String(jpegQuality));
  } else {
    args.push('-define', 'png:compression-level=9');
  }

  args.push(target);
  return runOptimizer(optimizer.command, args);
}

function optimizeWithSips(optimizer, target, extension) {
  const isJpeg = /\.jpe?g$/i.test(extension);
  const isPng = /\.png$/i.test(extension);
  if (!isJpeg && !isPng) return { ok: false, message: `unsupported extension ${extension}` };

  const args = isJpeg
    ? ['-s', 'format', 'jpeg', '-s', 'formatOptions', String(jpegQuality), '-Z', String(imageMaxDimension), target]
    : ['-Z', String(imageMaxDimension), target];

  return runOptimizer(optimizer.command, args);
}

function optimizeImage(relativePath, optimizer, cacheContext) {
  const absolutePath = distPath(relativePath);
  const extension = path.extname(relativePath);
  if (!/\.(jpe?g|png)$/i.test(extension)) return { skipped: true, reason: 'unsupported' };
  if (!fs.existsSync(absolutePath)) return { skipped: true, reason: 'missing' };

  let metadata;
  try {
    metadata = getSourceImageMetadata(relativePath);
  } catch (error) {
    return { skipped: true, reason: `source metadata failed: ${error.message}` };
  }

  const cacheKey = getCacheKey(relativePath, metadata.sourceHash, metadata.sourceBytes, cacheContext.policy);
  const cacheEntry = cacheContext.manifest.entries[relativePath];
  const cachePath = getCacheFilePath(cacheKey, extension);

  if (
    cacheEntry &&
    cacheEntry.cacheKey === cacheKey &&
    cacheEntry.sourceHash === metadata.sourceHash &&
    cacheEntry.sourceBytes === metadata.sourceBytes &&
    fs.existsSync(cachePath)
  ) {
    fs.copyFileSync(cachePath, absolutePath);
    const cachedBytes = fs.statSync(absolutePath).size;
    return {
      cached: true,
      originalBytes: metadata.sourceBytes,
      optimizedBytes: cachedBytes,
      savedBytes: Math.max(metadata.sourceBytes - cachedBytes, 0),
      cacheKey,
    };
  }

  const originalBytes = fs.statSync(absolutePath).size;
  const tempPath = `${absolutePath}.optimizing-${process.pid}${extension}`;
  let result;

  try {
    if (optimizer.type === 'sips') {
      fs.copyFileSync(absolutePath, tempPath);
      result = optimizeWithSips(optimizer, tempPath, extension);
    } else {
      result = optimizeWithImageMagick(optimizer, absolutePath, tempPath, extension);
    }

    if (!result.ok) {
      fs.rmSync(tempPath, { force: true });
      return { skipped: true, reason: result.message };
    }

    const optimizedBytes = fs.existsSync(tempPath) ? fs.statSync(tempPath).size : 0;
    let optimized = false;
    let skippedReason = null;

    if (optimizedBytes > 0 && optimizedBytes < originalBytes) {
      fs.renameSync(tempPath, absolutePath);
      optimized = true;
    } else {
      fs.rmSync(tempPath, { force: true });
      skippedReason = 'not smaller';
    }

    fs.mkdirSync(path.dirname(cachePath), { recursive: true });
    fs.copyFileSync(absolutePath, cachePath);
    const finalBytes = fs.statSync(absolutePath).size;
    cacheContext.manifest.entries[relativePath] = {
      cacheKey,
      relativePath,
      cachePath: toPosix(path.relative(rootDir, cachePath)),
      sourceHash: metadata.sourceHash,
      sourceBytes: metadata.sourceBytes,
      optimizedBytes: finalBytes,
      policy: cacheContext.policy,
      optimized,
      skippedReason,
      updatedAt: new Date().toISOString(),
    };

    if (optimized) {
      return {
        optimized: true,
        originalBytes,
        optimizedBytes: finalBytes,
        savedBytes: originalBytes - finalBytes,
        cacheKey,
      };
    }

    return { skipped: true, reason: skippedReason, originalBytes, optimizedBytes, cacheKey };
  } catch (error) {
    fs.rmSync(tempPath, { force: true });
    return { skipped: true, reason: error.message };
  }
}

function optimizeDistImages() {
  const optimizer = getImageOptimizer();
  if (!optimizer) {
    errors.push('No image optimizer found. Install ImageMagick or run on macOS with sips.');
    return null;
  }

  const startedAt = performance.now();
  const policy = getPolicy(optimizer);
  const cacheContext = {
    manifest: loadImageCacheManifest(),
    policy,
  };
  const stats = {
    tool: optimizer.command,
    optimizerType: optimizer.type,
    optimizerVersion: policy.optimizerVersion,
    policyVersion: imageOptimizationPolicyVersion,
    maxDimension: imageMaxDimension,
    jpegQuality,
    cacheDir: toPosix(path.relative(rootDir, imageCacheDir)),
    checked: 0,
    cacheHits: 0,
    cacheMisses: 0,
    copiedFromCache: 0,
    optimized: 0,
    skipped: 0,
    originalBytes: 0,
    optimizedBytes: 0,
    savedBytes: 0,
    skippedReasons: {},
    policy,
  };

  Array.from(referencedImages)
    .filter((name) => /\.(jpe?g|png)$/i.test(name))
    .sort()
    .forEach((imagePath) => {
      stats.checked += 1;
      const result = optimizeImage(imagePath, optimizer, cacheContext);
      if (result.cached) {
        stats.cacheHits += 1;
        stats.copiedFromCache += 1;
        stats.originalBytes += result.originalBytes;
        stats.optimizedBytes += result.optimizedBytes;
        stats.savedBytes += result.savedBytes;
      } else {
        stats.cacheMisses += 1;
      }

      if (result.optimized) {
        stats.optimized += 1;
        stats.originalBytes += result.originalBytes;
        stats.optimizedBytes += result.optimizedBytes;
        stats.savedBytes += result.savedBytes;
      } else if (!result.cached) {
        stats.skipped += 1;
        const reason = result.reason || 'unknown';
        stats.skippedReasons[reason] = (stats.skippedReasons[reason] || 0) + 1;
      }
    });

  saveImageCacheManifest(cacheContext.manifest, stats);
  stats.durationSeconds = formatSeconds(performance.now() - startedAt);
  stats.cacheEntries = Object.keys(cacheContext.manifest.entries).length;
  stats.originalSize = formatBytes(stats.originalBytes);
  stats.optimizedSize = formatBytes(stats.optimizedBytes);
  stats.savedSize = formatBytes(stats.savedBytes);
  return stats;
}

function getArtifactSizeCheck(totalBytes) {
  const result = {
    warningBytes: artifactWarningBytes,
    failBytes: artifactFailBytes,
    warningSize: formatBytes(artifactWarningBytes),
    failSize: formatBytes(artifactFailBytes),
    status: 'pass',
  };

  if (totalBytes > artifactFailBytes) {
    result.status = 'fail';
  } else if (totalBytes > artifactWarningBytes) {
    result.status = 'warning';
  }

  return result;
}

function collectIncludes() {
  const site = parseJson('content/site.json');

  ['.nojekyll', 'CNAME', 'favicon.ico', 'style.css'].forEach(addFile);
  addOptionalFile('assets/images/uploads/.gitkeep');
  fs.readdirSync(rootDir)
    .filter((name) => name.endsWith('.style.css'))
    .sort()
    .forEach(addFile);

  ['assets/common.css', 'assets/site.js', 'assets/cms-renderer.js'].forEach(addFile);
  [
    'content/site.json',
    ...listFiles('content/pages').filter((name) => name.endsWith('.json')),
    ...listFiles(generatedPagesDir).filter((name) => name.endsWith('.json')),
  ].forEach(addFile);

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

  listFiles(generatedPagesDir)
    .filter((name) => name.endsWith('.json'))
    .sort()
    .forEach((jsonFile) => collectGeneratedJsonReferences(parseJson(jsonFile), 'generatedPage'));
}

function writePagesAdminRedirect() {
  writeFile('admin/index.html', `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex, nofollow">
  <meta http-equiv="refresh" content="0; url=https://hayeon-cms-auth.netlify.app/admin/">
  <title>Hayeon CMS Admin</title>
  <style>
    body {
      margin: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: #222;
      background: #fafafa;
    }
    main {
      width: min(520px, calc(100% - 48px));
      line-height: 1.7;
    }
    a {
      color: #222;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <main>
    <h1>CMS Admin</h1>
    <p>CMS 관리자 화면은 아래 주소에서 사용합니다.</p>
    <p><a href="https://hayeon-cms-auth.netlify.app/admin/">https://hayeon-cms-auth.netlify.app/admin/</a></p>
  </main>
  <script>
    window.location.replace('https://hayeon-cms-auth.netlify.app/admin/');
  </script>
</body>
</html>
`);
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
  writePagesAdminRedirect();
  ensureDirectory('assets/images/uploads');
  ensureDirectory(generatedPagesDir);
  const generatedPages = require('./generate-static-pages').generateStaticPages({
    outputDir: distDir,
  });
  const generatedHomeCards = injectGeneratedHomeCards();
  const optimization = optimizeDistImages();

  if (errors.length > 0) {
    console.error(`Pages artifact preparation failed: ${errors.length} error(s)`);
    errors.forEach((error) => console.error(`- ${error}`));
    process.exit(1);
  }

  const distFiles = listFiles('.pages-dist');
  const totalBytes = getDirectorySize(distDir);
  const sizeCheck = getArtifactSizeCheck(totalBytes);
  const manifest = {
    outputDir: '.pages-dist',
    fileCount: distFiles.length,
    totalBytes,
    totalSize: formatBytes(totalBytes),
    htmlFiles: Array.from(includeFiles).filter((name) => name.endsWith('.html')).length,
    generatedPages,
    generatedHomeCards,
    imageFiles: referencedImages.size,
    referencedUploads: Array.from(referencedImages).filter((name) => name.startsWith('assets/images/uploads/')).length,
    optimization,
    sizeCheck,
    excluded: [
      '.git/',
      '.github/',
      'docs/',
      'scripts/',
      'reports/',
      'prompt/',
      '.netlify-admin/',
      'assets/images/unused/',
      'netlify.toml',
      'Epilogue.zip',
      'Rota - FREE.zip',
      'Photography/',
      'travel/',
      '.DS_Store',
    ],
  };

  console.log('Pages artifact prepared');
  console.log(JSON.stringify(manifest, null, 2));

  if (sizeCheck.status === 'warning') {
    console.warn(`Pages artifact warning: ${manifest.totalSize} exceeds ${sizeCheck.warningSize}`);
  }

  if (sizeCheck.status === 'fail') {
    console.error(`Pages artifact failed: ${manifest.totalSize} exceeds ${sizeCheck.failSize}`);
    process.exit(1);
  }
}

main();
