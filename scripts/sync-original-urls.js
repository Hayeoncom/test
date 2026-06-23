#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const pagesDir = path.join(rootDir, 'content', 'pages');
const rawBaseUrl = 'https://raw.githubusercontent.com/Hayeoncom/test/refs/heads/main/';
const dryRun = process.argv.includes('--dry-run');

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isTargetImage(page, section, item) {
  if (!item || typeof item.image !== 'string' || item.image.trim() === '') {
    return false;
  }

  if (page.pageType === 'home') {
    return false;
  }

  return section && section.type === 'gallery';
}

function rawUrlFor(imagePath) {
  return rawBaseUrl + imagePath.trim().replace(/^\/+/, '');
}

function collectStats() {
  return {
    files: 0,
    imageItems: 0,
    targetItems: 0,
    excludedHomeItems: 0,
    withOriginalUrl: 0,
    missingOriginalUrl: 0,
    changedOriginalUrl: 0,
    refactorOriginalUrl: 0,
    pagesOriginalUrl: 0,
    nonRawMainOriginalUrl: 0,
  };
}

function updateStats(stats, page, section, item) {
  if (!isObject(item) || typeof item.image !== 'string' || item.image.trim() === '') {
    return;
  }

  stats.imageItems += 1;

  if (page.pageType === 'home') {
    stats.excludedHomeItems += 1;
  }

  const originalUrl = typeof item.originalUrl === 'string' ? item.originalUrl.trim() : '';
  if (originalUrl) {
    stats.withOriginalUrl += 1;
    if (originalUrl.includes('refs/heads/refactor/ver1')) {
      stats.refactorOriginalUrl += 1;
    }
    if (/^https:\/\/hayeon\.kr\//i.test(originalUrl) || /netlify\.app/i.test(originalUrl)) {
      stats.pagesOriginalUrl += 1;
    }
    if (!originalUrl.startsWith(rawBaseUrl) || originalUrl !== rawUrlFor(item.image)) {
      stats.nonRawMainOriginalUrl += 1;
    }
  } else {
    stats.missingOriginalUrl += 1;
  }

  if (isTargetImage(page, section, item)) {
    stats.targetItems += 1;
  }
}

function main() {
  const before = collectStats();
  const after = collectStats();
  const files = fs.readdirSync(pagesDir)
    .filter((fileName) => fileName.endsWith('.json'))
    .sort();
  const changedFiles = [];

  for (const fileName of files) {
    const filePath = path.join(pagesDir, fileName);
    const originalText = fs.readFileSync(filePath, 'utf8');
    const page = JSON.parse(originalText);
    before.files += 1;
    after.files += 1;

    for (const section of page.sections || []) {
      for (const item of section.items || []) {
        updateStats(before, page, section, item);

        if (isTargetImage(page, section, item)) {
          const nextOriginalUrl = rawUrlFor(item.image);
          if (item.originalUrl !== nextOriginalUrl) {
            item.originalUrl = nextOriginalUrl;
          }
        } else if (page.pageType === 'home' && Object.prototype.hasOwnProperty.call(item, 'originalUrl')) {
          delete item.originalUrl;
        }

        updateStats(after, page, section, item);
      }
    }

    const nextText = `${JSON.stringify(page, null, 2)}\n`;
    if (nextText !== originalText) {
      changedFiles.push(fileName);
      if (!dryRun) {
        fs.writeFileSync(filePath, nextText);
      }
    }
  }

  after.changedOriginalUrl = changedFiles.length;

  console.log(JSON.stringify({
    dryRun,
    rawBaseUrl,
    before,
    after,
    changedFiles,
  }, null, 2));
}

main();
