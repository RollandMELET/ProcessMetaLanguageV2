// <!-- START OF FILE: build-plugin.js -->
// FILENAME: build-plugin.js
// Version: 1.0.0
// Date: 2025-08-01 00:30
// Author: Rolland MELET & Claude Code
// Description: Build script for ProcessMetaLanguage plugin

import esbuild from 'esbuild';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '..');

/**
 * Build the plugin
 * @sideEffect Creates built files in dist/
 */
async function build() {
    console.log('🔨 Building ProcessMetaLanguage plugin...');
    
    try {
        // Ensure dist directory exists
        await fs.mkdir(path.join(ROOT_DIR, 'dist'), { recursive: true });
        
        // Bundle main plugin file
        await esbuild.build({
            entryPoints: [path.join(ROOT_DIR, 'main.js')],
            bundle: true,
            external: ['obsidian'],
            format: 'cjs',
            target: 'es2018',
            logLevel: 'info',
            sourcemap: 'inline',
            treeShaking: true,
            outfile: path.join(ROOT_DIR, 'dist', 'main.js'),
        });
        
        // Copy manifest
        await fs.copyFile(
            path.join(ROOT_DIR, 'manifest.json'),
            path.join(ROOT_DIR, 'dist', 'manifest.json')
        );
        
        // Copy styles if they exist
        try {
            await fs.copyFile(
                path.join(ROOT_DIR, 'styles.css'),
                path.join(ROOT_DIR, 'dist', 'styles.css')
            );
        } catch (error) {
            console.log('ℹ️  No styles.css found, skipping...');
        }
        
        console.log('✅ Build complete!');
        
    } catch (error) {
        console.error('❌ Build failed:', error);
        process.exit(1);
    }
}

// Run build
build();

// <!-- END OF FILE: build-plugin.js -->