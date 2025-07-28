// <!-- START OF FILE: vitest.config.js -->
// FILENAME: vitest.config.js
// Version: 1.0.0
// Date: 2025-07-28 16:30
// Author: Rolland MELET & Claude Code
// Description: Configuration Vitest pour les tests ProcessMetaLanguage

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.js'],
    include: ['tests/**/*.test.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: [
        'components/**/*.js',
        'ui/**/*.js'
      ],
      exclude: [
        'node_modules/**',
        'tests/**',
        '*.config.js',
        'scripts/**'
      ]
    }
  }
});

// <!-- END OF FILE: vitest.config.js -->