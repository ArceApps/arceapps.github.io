/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true, // Allows using describe, it, expect without imports
    include: ['src/**/*.{test,spec}.{js,ts}'],
  },
});
