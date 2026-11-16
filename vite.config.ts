import {defineConfig} from 'vitest/config';

export default defineConfig({
  // Relative URLs let one build run under any GitHub Pages repository path
  // and inside itch.io's iframe.
  base: './',
  test: {
    include: ['src/**/*_test.ts'],
  },
});
