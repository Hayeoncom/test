#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const contentDir = path.join(rootDir, 'content');
const pagesDir = path.join(contentDir, 'pages');
const siteFile = path.join(contentDir, 'site.json');

const allowedPageTypes = new Set(['document-gallery', 'gallery', 'home', 'placeholder']);
const allowedSectionTypes = new Set(['documentCards', 'gallery', 'slider', 'travelCards']);
const errors = [];
let checkedFiles = 0;

function rel(filePath) {
  return path.relative(rootDir, filePath).split(path.sep).join('/');
}

function addError(filePath, message) {
  errors.push(`${rel(filePath)}: ${message}`);
}

function readJson(filePath) {
  checkedFiles += 1;
  let text;

  try {
    text = fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    addError(filePath, `cannot read file (${error.message})`);
    return null;
  }

  if (text.trim().length === 0) {
    addError(filePath, 'empty JSON file');
    return null;
  }

  if (text.charCodeAt(0) === 0xfeff) {
    addError(filePath, 'unexpected UTF-8 BOM');
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    addError(filePath, `JSON parse error (${error.message})`);
    return null;
  }
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function requireString(filePath, object, field) {
  if (typeof object[field] !== 'string' || object[field].trim() === '') {
    addError(filePath, `${field} must be a non-empty string`);
    return false;
  }

  return true;
}

function requireNamedString(filePath, value, label) {
  if (typeof value !== 'string' || value.trim() === '') {
    addError(filePath, `${label} must be a non-empty string`);
    return false;
  }

  return true;
}

function fileExistsFromRoot(relativePath) {
  return fs.existsSync(path.join(rootDir, relativePath));
}

function isExternalUrl(value) {
  return /^https?:\/\//i.test(value);
}

function validateOptionalUrl(filePath, value, field) {
  if (typeof value !== 'string' || value.trim() === '') return;

  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) {
      addError(filePath, `${field} must use http or https: ${value}`);
    }
  } catch {
    addError(filePath, `${field} must be a valid URL: ${value}`);
  }
}

function validateLocalPath(filePath, value, field) {
  if (typeof value !== 'string' || value.trim() === '') {
    addError(filePath, `${field} must be a non-empty path`);
    return;
  }

  if (!isExternalUrl(value) && !fileExistsFromRoot(value)) {
    addError(filePath, `${field} path does not exist: ${value}`);
  }
}

function validateSite() {
  const data = readJson(siteFile);
  if (!data) return;

  if (!isObject(data)) {
    addError(siteFile, 'site JSON must be an object');
    return;
  }

  requireString(siteFile, data, 'title');

  if (!Array.isArray(data.pages)) {
    addError(siteFile, 'pages must be an array');
  } else {
    for (const [index, page] of data.pages.entries()) {
      if (!isObject(page)) {
        addError(siteFile, `pages[${index}] must be an object`);
        continue;
      }

      requireNamedString(siteFile, page.id, `pages[${index}].id`);
      requireNamedString(siteFile, page.sourceHtml, `pages[${index}].sourceHtml`);
      requireNamedString(siteFile, page.json, `pages[${index}].json`);
      validateLocalPath(siteFile, page.sourceHtml, `pages[${index}].sourceHtml`);
      validateLocalPath(siteFile, page.json, `pages[${index}].json`);

      if (!allowedPageTypes.has(page.pageType)) {
        addError(siteFile, `pages[${index}].pageType has unsupported value: ${page.pageType}`);
      }
    }
  }

  if (typeof data.imageUploadPath !== 'string' || data.imageUploadPath.trim() === '') {
    addError(siteFile, 'imageUploadPath must be a non-empty string');
  }
}

function validateAudio(filePath, page) {
  if (!page.audio || typeof page.audio.src !== 'string' || page.audio.src.trim() === '') return;

  try {
    new URL(page.audio.src);
  } catch {
    addError(filePath, `audio.src must be a valid URL: ${page.audio.src}`);
  }
}

function validateItem(filePath, item, pathLabel) {
  if (!isObject(item)) {
    addError(filePath, `${pathLabel} must be an object`);
    return;
  }

  if (Object.prototype.hasOwnProperty.call(item, 'image') && item.image !== '') {
    validateLocalPath(filePath, item.image, `${pathLabel}.image`);
  }

  if (Object.prototype.hasOwnProperty.call(item, 'originalUrl')) {
    validateOptionalUrl(filePath, item.originalUrl, `${pathLabel}.originalUrl`);
  }

  if (Object.prototype.hasOwnProperty.call(item, 'href')) {
    if (typeof item.href !== 'string' || item.href.trim() === '') {
      addError(filePath, `${pathLabel}.href must not be empty`);
    } else if (!isExternalUrl(item.href) && !fileExistsFromRoot(item.href)) {
      addError(filePath, `${pathLabel}.href path does not exist: ${item.href}`);
    }
  }

  if (Object.prototype.hasOwnProperty.call(item, 'visible') && typeof item.visible !== 'boolean') {
    addError(filePath, `${pathLabel}.visible must be boolean`);
  }
}

function validatePage(filePath) {
  const page = readJson(filePath);
  if (!page) return;

  if (!isObject(page)) {
    addError(filePath, 'page JSON must be an object');
    return;
  }

  requireString(filePath, page, 'id');
  requireString(filePath, page, 'sourceHtml');
  requireString(filePath, page, 'pageType');
  requireString(filePath, page, 'title');

  if (typeof page.sourceHtml === 'string' && page.sourceHtml.trim() !== '') {
    validateLocalPath(filePath, page.sourceHtml, 'sourceHtml');
  }

  if (!allowedPageTypes.has(page.pageType)) {
    addError(filePath, `pageType has unsupported value: ${page.pageType}`);
  }

  if (Object.prototype.hasOwnProperty.call(page, 'displayOrder') && typeof page.displayOrder !== 'number') {
    addError(filePath, 'displayOrder must be number');
  }

  if (!Array.isArray(page.sections)) {
    addError(filePath, 'sections must be an array');
  } else {
    for (const [sectionIndex, section] of page.sections.entries()) {
      const sectionPath = `sections[${sectionIndex}]`;

      if (!isObject(section)) {
        addError(filePath, `${sectionPath} must be an object`);
        continue;
      }

      if (!allowedSectionTypes.has(section.type)) {
        addError(filePath, `${sectionPath}.type has unsupported value: ${section.type}`);
      }

      if (!Array.isArray(section.items)) {
        addError(filePath, `${sectionPath}.items must be an array`);
        continue;
      }

      for (const [itemIndex, item] of section.items.entries()) {
        validateItem(filePath, item, `${sectionPath}.items[${itemIndex}]`);
      }
    }
  }

  validateAudio(filePath, page);
}

function main() {
  validateSite();

  if (!fs.existsSync(pagesDir)) {
    errors.push('content/pages: directory does not exist');
  } else {
    const pageFiles = fs.readdirSync(pagesDir)
      .filter((name) => name.endsWith('.json'))
      .sort();

    for (const fileName of pageFiles) {
      validatePage(path.join(pagesDir, fileName));
    }
  }

  if (errors.length > 0) {
    console.error(`Content validation failed: ${errors.length} error(s) in ${checkedFiles} file(s)`);
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
  }

  console.log(`Content validation passed: ${checkedFiles} file(s) checked`);
}

main();
