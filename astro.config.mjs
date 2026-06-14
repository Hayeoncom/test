import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://hayeon.kr',
  output: 'static',
  build: {
    format: 'directory'
  },
  markdown: {
    shikiConfig: {
      theme: 'github-light'
    }
  }
});
