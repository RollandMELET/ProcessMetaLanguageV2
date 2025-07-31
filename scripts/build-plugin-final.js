// <!-- START OF FILE: build-plugin-final.js -->
// FILENAME: build-plugin-final.js
// Version: 1.0.0
// Date: 2025-08-01 16:30
// Author: Rolland MELET & Claude Code
// Description: Final build script for ProcessMetaLanguage plugin

import esbuild from 'esbuild';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '..');

/**
 * Clean and prepare files for build
 * @sideEffect Modifies files
 */
async function prepareFiles() {
    console.log('🧹 Preparing files...');
    
    // Fix bidirectional-sync.js dynamic import
    const biSyncPath = path.join(ROOT_DIR, 'sync/bidirectional-sync.js');
    let biSyncContent = await fs.readFile(biSyncPath, 'utf8');
    biSyncContent = biSyncContent.replace(
        "const fs = await import('fs/promises');",
        "const { fs } = await import('../utils/obsidian-adapter.js');"
    );
    await fs.writeFile(biSyncPath, biSyncContent);
    
    // Fix any remaining duplicate exports
    const filesToFix = [
        'sync/markdown-reader.js',
        'sync/canvas-updater.js',
        'sync/bidirectional-sync.js',
        'sync/canvas-reader.js',
        'sync/batch-processor.js',
        'sync/performance-optimizer.js'
    ];
    
    for (const file of filesToFix) {
        const filePath = path.join(ROOT_DIR, file);
        try {
            let content = await fs.readFile(filePath, 'utf8');
            // Remove duplicate exports
            content = content.replace(/\nexport\s*{\s*\w+.*};\s*$/gm, '\n// Export already done');
            await fs.writeFile(filePath, content);
        } catch (error) {
            console.log(`⚠️  Could not fix ${file}`);
        }
    }
}

/**
 * Build the plugin
 * @sideEffect Creates dist files
 */
async function build() {
    console.log('🔨 Building ProcessMetaLanguage plugin...');
    
    try {
        // Prepare files first
        await prepareFiles();
        
        // Ensure dist directory
        await fs.mkdir(path.join(ROOT_DIR, 'dist'), { recursive: true });
        
        // Build configuration
        await esbuild.build({
            entryPoints: [path.join(ROOT_DIR, 'main.js')],
            bundle: true,
            external: ['obsidian'],
            format: 'cjs',
            target: 'es2018',
            logLevel: 'info',
            sourcemap: false,
            treeShaking: true,
            outfile: path.join(ROOT_DIR, 'dist', 'main.js'),
            platform: 'browser',
            define: {
                'process.env.NODE_ENV': '"production"',
                'global': 'window'
            },
            loader: {
                '.js': 'js',
                '.css': 'text',
                '.json': 'json'
            },
            inject: [path.join(ROOT_DIR, 'scripts', 'shims.js')],
            banner: {
                js: `/* ProcessMetaLanguage v1.0.0 - Built ${new Date().toISOString()} */`
            }
        });
        
        // Copy manifest
        await fs.copyFile(
            path.join(ROOT_DIR, 'manifest.json'),
            path.join(ROOT_DIR, 'dist', 'manifest.json')
        );
        
        // Create/copy styles
        const stylesContent = `/* ProcessMetaLanguage Styles */
.pml-interface {
    position: fixed;
    right: 20px;
    top: 100px;
    width: 300px;
    max-height: 80vh;
    background: var(--background-primary);
    border: 1px solid var(--background-modifier-border);
    border-radius: 8px;
    padding: 15px;
    overflow-y: auto;
    z-index: 1000;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.pml-toolbar {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.pml-button {
    padding: 8px 12px;
    background: var(--interactive-normal);
    border: 1px solid var(--background-modifier-border);
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 14px;
}

.pml-button:hover {
    background: var(--interactive-hover);
}

.pml-button:active {
    background: var(--interactive-accent);
    color: var(--text-on-accent);
}

.pml-section {
    margin-top: 15px;
    padding-top: 15px;
    border-top: 1px solid var(--background-modifier-border);
}

.pml-section-title {
    font-weight: 600;
    margin-bottom: 8px;
    font-size: 14px;
}

.pml-template-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 6px;
}

.pml-template-button {
    padding: 6px;
    font-size: 12px;
    text-align: center;
}

.pml-panel {
    background: var(--background-secondary);
    border-radius: 6px;
    padding: 12px;
    margin-top: 10px;
}

.pml-input {
    width: 100%;
    padding: 6px 10px;
    background: var(--background-primary);
    border: 1px solid var(--background-modifier-border);
    border-radius: 4px;
    margin-bottom: 8px;
}

.pml-status {
    font-size: 12px;
    color: var(--text-muted);
    margin-top: 8px;
}

.pml-success {
    color: var(--text-success);
}

.pml-error {
    color: var(--text-error);
}`;
        
        await fs.writeFile(
            path.join(ROOT_DIR, 'dist', 'styles.css'),
            stylesContent
        );
        
        // Create install instructions
        const installMd = `# Installation Instructions

## Quick Install

1. Download the \`dist\` folder
2. Copy it to your vault's \`.obsidian/plugins/\` directory
3. Rename the folder to \`processmetalanguage\`
4. Enable the plugin in Obsidian Settings → Community Plugins

## Requirements

- Obsidian v1.4.16+
- Excalidraw plugin v2.0.0+ (with ExcalidrawAutomate enabled)
- Templater plugin v2.0.0+

## First Use

1. Open an Excalidraw drawing
2. Use Cmd/Ctrl+P → "ProcessMetaLanguage: Toggle Interface"
3. Start designing your process!

## Troubleshooting

If the plugin doesn't load:
1. Check the console (Cmd+Option+I / Ctrl+Shift+I)
2. Ensure Excalidraw is installed and enabled
3. Make sure ExcalidrawAutomate is enabled in Excalidraw settings
4. Try restarting Obsidian

## Support

- GitHub: https://github.com/RollandMELET/ProcessMetaLanguage
- Documentation: See docs/ folder
`;
        
        await fs.writeFile(
            path.join(ROOT_DIR, 'dist', 'INSTALL.md'),
            installMd
        );
        
        console.log('✅ Build complete!');
        console.log('📁 Output: dist/');
        console.log('📦 Files created:');
        console.log('   - main.js (plugin bundle)');
        console.log('   - manifest.json (plugin metadata)');
        console.log('   - styles.css (plugin styles)');
        console.log('   - INSTALL.md (installation guide)');
        
    } catch (error) {
        console.error('❌ Build failed:', error);
        process.exit(1);
    }
}

// First create shims file
async function createShims() {
    const shimsContent = `// Shims for browser environment
if (typeof global === 'undefined') {
    window.global = window;
}
if (typeof process === 'undefined') {
    window.process = { env: {} };
}
`;
    
    await fs.writeFile(
        path.join(ROOT_DIR, 'scripts', 'shims.js'),
        shimsContent
    );
}

// Run build
createShims().then(build);

// <!-- END OF FILE: build-plugin-final.js -->