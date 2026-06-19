#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, '.pages-dist');
const imageMaxDimension = 2200;
const jpegQuality = 82;
const artifactWarningBytes = 900 * 1024 * 1024;
const artifactFailBytes = 1024 * 1024 * 1024;
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

function optimizeImage(relativePath, optimizer) {
  const absolutePath = distPath(relativePath);
  const extension = path.extname(relativePath);
  if (!/\.(jpe?g|png)$/i.test(extension)) return { skipped: true, reason: 'unsupported' };
  if (!fs.existsSync(absolutePath)) return { skipped: true, reason: 'missing' };

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
    if (optimizedBytes > 0 && optimizedBytes < originalBytes) {
      fs.renameSync(tempPath, absolutePath);
      return {
        optimized: true,
        originalBytes,
        optimizedBytes,
        savedBytes: originalBytes - optimizedBytes,
      };
    }

    fs.rmSync(tempPath, { force: true });
    return { skipped: true, reason: 'not smaller', originalBytes, optimizedBytes };
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

  const stats = {
    tool: optimizer.command,
    maxDimension: imageMaxDimension,
    jpegQuality,
    checked: 0,
    optimized: 0,
    skipped: 0,
    originalBytes: 0,
    optimizedBytes: 0,
    savedBytes: 0,
    skippedReasons: {},
  };

  Array.from(referencedImages)
    .filter((name) => /\.(jpe?g|png)$/i.test(name))
    .sort()
    .forEach((imagePath) => {
      stats.checked += 1;
      const result = optimizeImage(imagePath, optimizer);
      if (result.optimized) {
        stats.optimized += 1;
        stats.originalBytes += result.originalBytes;
        stats.optimizedBytes += result.optimizedBytes;
        stats.savedBytes += result.savedBytes;
      } else {
        stats.skipped += 1;
        const reason = result.reason || 'unknown';
        stats.skippedReasons[reason] = (stats.skippedReasons[reason] || 0) + 1;
      }
    });

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
  ensureDirectory('assets/images/uploads');
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
