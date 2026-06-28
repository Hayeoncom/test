const rawBaseUrl = 'https://raw.githubusercontent.com/Hayeoncom/test/refs/heads/main/';

function normalizeImagePath(value) {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/^\/+/, '');
}

function isLocalImagePath(value) {
  return normalizeImagePath(value).startsWith('assets/images/');
}

function rawUrlForImage(value) {
  const imagePath = normalizeImagePath(value);
  if (!imagePath || !isLocalImagePath(imagePath)) return '';
  return rawBaseUrl + imagePath;
}

function resolveOriginalUrl(item) {
  if (!item || typeof item !== 'object') return '';

  const explicit = typeof item.originalUrl === 'string' ? item.originalUrl.trim() : '';
  if (explicit) return explicit;

  return rawUrlForImage(item.image);
}

module.exports = {
  isLocalImagePath,
  normalizeImagePath,
  rawBaseUrl,
  rawUrlForImage,
  resolveOriginalUrl,
};
