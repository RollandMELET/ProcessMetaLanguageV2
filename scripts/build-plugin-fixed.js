// <!-- START OF FILE: build-plugin-fixed.js -->
// FILENAME: build-plugin-fixed.js
// Version: 1.0.0
// Date: 2025-08-01 16:00
// Author: Rolland MELET & Claude Code
// Description: Fixed build script for ProcessMetaLanguage plugin

import esbuild from 'esbuild';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '..');

/**
 * Fix duplicate exports in files
 * @sideEffect Modifies files
 */
async function fixDuplicateExports() {
    console.log('🔧 Fixing duplicate exports...');
    
    const filesToFix = [
        'ui/main-interface.js',
        'export/360sc-mapper.js',
        'export/matrix-generator.js',
        'export/workflow-compiler.js',
        'export/openapi-generator.js',
        'validation/architecture-validator.js'
    ];
    
    for (const file of filesToFix) {
        const filePath = path.join(ROOT_DIR, file);
        try {
            let content = await fs.readFile(filePath, 'utf8');
            
            // Remove duplicate exports at end of file
            content = content.replace(/\n\/\/ Export.*\nexport\s*{\s*\w+.*};/g, '\n// Export already done via export class');
            content = content.replace(/\nexport\s*{\s*\w+.*};\s*$/g, '\n// Export already done via export class');
            
            await fs.writeFile(filePath, content);
            console.log(`✅ Fixed ${file}`);
        } catch (error) {
            console.log(`⚠️  Could not fix ${file}: ${error.message}`);
        }
    }
}

/**
 * Build the plugin with fixes
 * @sideEffect Creates built files in dist/
 */
async function build() {
    console.log('🔨 Building ProcessMetaLanguage plugin (with fixes)...');
    
    try {
        // First, fix duplicate exports
        await fixDuplicateExports();
        
        // Ensure dist directory exists
        await fs.mkdir(path.join(ROOT_DIR, 'dist'), { recursive: true });
        
        // Bundle main plugin file
        const result = await esbuild.build({
            entryPoints: [path.join(ROOT_DIR, 'main.js')],
            bundle: true,
            external: ['obsidian'],
            format: 'cjs',
            target: 'es2018',
            logLevel: 'info',
            sourcemap: false, // Disable for cleaner output
            treeShaking: true,
            outfile: path.join(ROOT_DIR, 'dist', 'main.js'),
            platform: 'browser',
            define: {
                'process.env.NODE_ENV': '"production"'
            },
            loader: {
                '.js': 'js',
                '.css': 'css',
                '.json': 'json'
            },
            // Ignore warnings
            logOverride: {
                'commonjs-variable-in-esm': 'silent'
            }
        });
        
        // Log any warnings
        if (result.warnings.length > 0) {
            console.log(`⚠️  Build completed with ${result.warnings.length} warnings`);
        }
        
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
            console.log('ℹ️  No styles.css found, creating default...');
            
            // Create default styles
            const defaultStyles = `/* ProcessMetaLanguage Styles */
.pml-toolbar {
    position: fixed;
    right: 20px;
    top: 100px;
    z-index: 1000;
    background: var(--background-primary);
    border: 1px solid var(--background-modifier-border);
    border-radius: 8px;
    padding: 10px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.pml-button {
    display: block;
    width: 100%;
    padding: 8px 12px;
    margin: 4px 0;
    background: var(--interactive-normal);
    border: 1px solid var(--background-modifier-border);
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
}

.pml-button:hover {
    background: var(--interactive-hover);
}

.pml-panel {
    background: var(--background-primary);
    border: 1px solid var(--background-modifier-border);
    border-radius: 8px;
    padding: 20px;
    margin: 10px 0;
}`;
            
            await fs.writeFile(
                path.join(ROOT_DIR, 'dist', 'styles.css'),
                defaultStyles
            );
        }
        
        // Create README for dist
        const readmeContent = `# ProcessMetaLanguage Plugin Distribution

This directory contains the built plugin files ready for installation in Obsidian.

## Installation

1. Copy the entire \`dist\` folder to your vault's \`.obsidian/plugins/\` directory
2. Rename it to \`processmetalanguage\`
3. Enable the plugin in Obsidian settings

## Files

- \`main.js\` - The bundled plugin code
- \`manifest.json\` - Plugin metadata
- \`styles.css\` - Plugin styles

## Version

Built from ProcessMetaLanguage v1.0.0
`;
        
        await fs.writeFile(
            path.join(ROOT_DIR, 'dist', 'README.md'),
            readmeContent
        );
        
        console.log('✅ Build complete!');
        console.log('📁 Output directory: dist/');
        console.log('📦 Ready for installation in Obsidian');
        
    } catch (error) {
        console.error('❌ Build failed:', error);
        process.exit(1);
    }
}

// Run build
build();

// <!-- END OF FILE: build-plugin-fixed.js -->