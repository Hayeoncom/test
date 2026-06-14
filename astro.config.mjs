import { defineConfig } from 'astro/config';
import { copyFileSync, cpSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';

const assetExtensions = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  '.svg',
  '.mp3',
  '.m4a',
  '.wav',
  '.ogg',
  '.zip'
]);

function copyLegacyAssets() {
  return {
    name: 'copy-legacy-assets',
    hooks: {
      'astro:build:done': ({ dir }) => {
        const outDir = dir.pathname;
        const root = new URL('.', import.meta.url).pathname;

        for (const name of readdirSync(root)) {
          const source = join(root, name);
          const stat = statSync(source);

          if (stat.isFile() && (assetExtensions.has(extname(name).toLowerCase()) || name === 'CNAME')) {
            copyFileSync(source, join(outDir, name));
          }
        }

        const travelSource = join(root, 'travel');
        if (existsSync(travelSource)) {
          mkdirSync(join(outDir, 'travel'), { recursive: true });
          cpSync(travelSource, join(outDir, 'travel'), {
            recursive: true,
            filter: (source) => {
              const stat = statSync(source);
              return stat.isDirectory() || assetExtensions.has(extname(source).toLowerCase());
            }
          });
        }
      }
    }
  };
}

export default defineConfig({
  site: 'https://hayeon.kr',
  output: 'static',
  integrations: [copyLegacyAssets()],
  build: {
    format: 'directory'
  },
  markdown: {
    shikiConfig: {
      theme: 'github-light'
    }
  }
});
