#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const outputDir = path.join(rootDir, '.netlify-admin');

function rootPath(relativePath) {
  return path.join(rootDir, relativePath);
}

function outputPath(relativePath) {
  return path.join(outputDir, relativePath);
}

function copyFile(sourceRelativePath, targetRelativePath = sourceRelativePath) {
  const source = rootPath(sourceRelativePath);
  const target = outputPath(targetRelativePath);

  if (!fs.existsSync(source) || !fs.statSync(source).isFile()) {
    throw new Error(`Missing required file: ${sourceRelativePath}`);
  }

  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}

function writeFile(relativePath, content) {
  const target = outputPath(relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
}

function listFiles(relativePath) {
  const absolutePath = path.join(outputDir, relativePath);
  if (!fs.existsSync(absolutePath)) return [];

  const result = [];
  for (const entry of fs.readdirSync(absolutePath, { withFileTypes: true })) {
    const child = path.join(relativePath, entry.name);
    if (entry.isDirectory()) {
      result.push(...listFiles(child));
    } else if (entry.isFile()) {
      result.push(child.split(path.sep).join('/'));
    }
  }
  return result;
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
  const units = ['B', 'KB', 'MB'];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function main() {
  fs.rmSync(outputDir, { recursive: true, force: true });
  fs.mkdirSync(outputDir, { recursive: true });

  copyFile('admin/index.html');
  copyFile('admin/config.yml');
  copyFile('favicon.ico');
  writeFile('_redirects', '/ /admin/ 302\n');

  const files = listFiles('.');
  const manifest = {
    outputDir: '.netlify-admin',
    fileCount: files.length,
    totalBytes: getDirectorySize(outputDir),
    files: files.sort(),
  };

  manifest.totalSize = formatBytes(manifest.totalBytes);

  console.log('Netlify admin artifact prepared');
  console.log(JSON.stringify(manifest, null, 2));
}

main();
