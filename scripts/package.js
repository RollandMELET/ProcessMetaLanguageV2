// <!-- START OF FILE: package.js -->
// FILENAME: package.js
// Version: 1.0.0
// Date: 2025-08-01 00:15
// Author: Rolland MELET & Claude Code
// Description: Build and package script for ProcessMetaLanguage deployment

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import archiver from 'archiver';
import { createWriteStream } from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');

/**
 * Main packaging function
 * @sideEffect Creates distribution package in dist/
 */
async function packagePlugin() {
    console.log('🚀 Starting ProcessMetaLanguage packaging...');
    
    try {
        // Step 1: Clean dist directory
        await cleanDist();
        
        // Step 2: Create directory structure
        await createDistStructure();
        
        // Step 3: Copy source files
        await copySourceFiles();
        
        // Step 4: Copy templates
        await copyTemplates();
        
        // Step 5: Copy documentation
        await copyDocumentation();
        
        // Step 6: Generate plugin package
        await generatePluginPackage();
        
        // Step 7: Generate release package
        await generateReleasePackage();
        
        console.log('✅ Packaging complete!');
        console.log(`📦 Plugin package: dist/processmetalanguage-1.0.0.zip`);
        console.log(`📦 Release package: dist/ProcessMetaLanguage-v1.0.0-release.zip`);
        
    } catch (error) {
        console.error('❌ Packaging failed:', error);
        process.exit(1);
    }
}

/**
 * Clean dist directory
 */
async function cleanDist() {
    console.log('🧹 Cleaning dist directory...');
    
    try {
        await fs.rm(DIST_DIR, { recursive: true, force: true });
    } catch (error) {
        // Directory might not exist
    }
    
    await fs.mkdir(DIST_DIR, { recursive: true });
}

/**
 * Create distribution directory structure
 */
async function createDistStructure() {
    console.log('📁 Creating directory structure...');
    
    const dirs = [
        'dist/plugin',
        'dist/plugin/components',
        'dist/plugin/core',
        'dist/plugin/sync',
        'dist/plugin/export',
        'dist/plugin/ui',
        'dist/plugin/automation',
        'dist/plugin/validation',
        'dist/plugin/templates',
        'dist/plugin/templates/epcis',
        'dist/plugin/templates/epcis/business-steps',
        'dist/plugin/templates/epcis/dispositions',
        'dist/docs',
        'dist/examples'
    ];
    
    for (const dir of dirs) {
        await fs.mkdir(path.join(ROOT_DIR, dir), { recursive: true });
    }
}

/**
 * Copy source files to dist
 */
async function copySourceFiles() {
    console.log('📋 Copying source files...');
    
    const sourceDirs = [
        'components',
        'core',
        'sync',
        'export',
        'ui',
        'automation',
        'validation'
    ];
    
    // Copy JavaScript modules
    for (const dir of sourceDirs) {
        const srcDir = path.join(ROOT_DIR, dir);
        const destDir = path.join(DIST_DIR, 'plugin', dir);
        
        try {
            const files = await fs.readdir(srcDir);
            for (const file of files) {
                if (file.endsWith('.js')) {
                    await fs.copyFile(
                        path.join(srcDir, file),
                        path.join(destDir, file)
                    );
                }
            }
        } catch (error) {
            console.warn(`⚠️  Directory ${dir} not found, skipping...`);
        }
    }
    
    // Copy root files
    const rootFiles = [
        'main.js',
        'manifest.json',
        'README.md',
        'LICENSE'
    ];
    
    for (const file of rootFiles) {
        try {
            await fs.copyFile(
                path.join(ROOT_DIR, file),
                path.join(DIST_DIR, 'plugin', file)
            );
        } catch (error) {
            console.warn(`⚠️  File ${file} not found, skipping...`);
        }
    }
}

/**
 * Copy template files
 */
async function copyTemplates() {
    console.log('📄 Copying templates...');
    
    const templatesSrc = path.join(ROOT_DIR, 'templates');
    const templatesDest = path.join(DIST_DIR, 'plugin', 'templates');
    
    try {
        await copyDirectory(templatesSrc, templatesDest);
    } catch (error) {
        console.warn('⚠️  Templates directory not found');
    }
}

/**
 * Copy documentation
 */
async function copyDocumentation() {
    console.log('📚 Copying documentation...');
    
    const docFiles = [
        'docs/user-guide.md',
        'docs/api-reference.md',
        'docs/deployment-guide.md',
        'docs/quick-start.md',
        'CHANGELOG.md'
    ];
    
    for (const file of docFiles) {
        try {
            const destFile = path.basename(file);
            await fs.copyFile(
                path.join(ROOT_DIR, file),
                path.join(DIST_DIR, 'docs', destFile)
            );
        } catch (error) {
            console.warn(`⚠️  Doc file ${file} not found`);
        }
    }
    
    // Copy examples
    try {
        await copyDirectory(
            path.join(ROOT_DIR, 'docs', 'examples'),
            path.join(DIST_DIR, 'examples')
        );
    } catch (error) {
        console.warn('⚠️  Examples directory not found');
    }
}

/**
 * Generate plugin package (for Obsidian)
 */
async function generatePluginPackage() {
    console.log('📦 Creating plugin package...');
    
    const output = createWriteStream(path.join(DIST_DIR, 'processmetalanguage-1.0.0.zip'));
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    return new Promise((resolve, reject) => {
        output.on('close', () => {
            console.log(`✅ Plugin package created: ${archive.pointer()} bytes`);
            resolve();
        });
        
        archive.on('error', reject);
        
        archive.pipe(output);
        archive.directory(path.join(DIST_DIR, 'plugin'), false);
        archive.finalize();
    });
}

/**
 * Generate full release package
 */
async function generateReleasePackage() {
    console.log('📦 Creating release package...');
    
    const output = createWriteStream(path.join(DIST_DIR, 'ProcessMetaLanguage-v1.0.0-release.zip'));
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    return new Promise((resolve, reject) => {
        output.on('close', () => {
            console.log(`✅ Release package created: ${archive.pointer()} bytes`);
            resolve();
        });
        
        archive.on('error', reject);
        
        archive.pipe(output);
        
        // Add plugin
        archive.directory(path.join(DIST_DIR, 'plugin'), 'ProcessMetaLanguage');
        
        // Add documentation
        archive.directory(path.join(DIST_DIR, 'docs'), 'documentation');
        
        // Add examples
        archive.directory(path.join(DIST_DIR, 'examples'), 'examples');
        
        // Add installation guide
        const installGuide = `# ProcessMetaLanguage Installation Guide

## Quick Install
1. Download and extract this package
2. Copy the 'ProcessMetaLanguage' folder to your Obsidian vault's .obsidian/plugins/ directory
3. Enable the plugin in Obsidian Settings > Community Plugins
4. Restart Obsidian

## Requirements
- Obsidian v1.4.16 or higher
- Excalidraw plugin v2.0.0 or higher (with ExcalidrawAutomate enabled)
- Templater plugin v2.0.0 or higher

## First Steps
1. Create a new Excalidraw drawing
2. Press Ctrl+Shift+P to open ProcessMetaLanguage interface
3. Start designing your process!

## Documentation
See the 'documentation' folder for:
- User Guide
- API Reference
- Deployment Guide
- Quick Start Guide

## Examples
Check the 'examples' folder for sample workflows

## Support
- GitHub: https://github.com/RollandMELET/ProcessMetaLanguage
- Documentation: https://processmetalanguage.io/docs
- Email: support@processmetalanguage.io

Version: 1.0.0
Release Date: 2025-08-01
`;
        
        archive.append(installGuide, { name: 'INSTALL.md' });
        archive.finalize();
    });
}

/**
 * Recursively copy directory
 */
async function copyDirectory(src, dest) {
    await fs.mkdir(dest, { recursive: true });
    const entries = await fs.readdir(src, { withFileTypes: true });
    
    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        
        if (entry.isDirectory()) {
            await copyDirectory(srcPath, destPath);
        } else {
            await fs.copyFile(srcPath, destPath);
        }
    }
}

// Run packaging
packagePlugin();

// <!-- END OF FILE: package.js -->