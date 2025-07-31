// <!-- START OF FILE: transform-imports.js -->
// FILENAME: transform-imports.js
// Version: 1.0.0
// Date: 2025-08-01 16:20
// Author: Rolland MELET & Claude Code
// Description: Transform Node.js imports to Obsidian-compatible imports

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '..');

/**
 * Transform imports in a file
 * @sideEffect Modifies file
 */
async function transformFile(filePath) {
    let content = await fs.readFile(filePath, 'utf8');
    let modified = false;
    
    // Transform fs imports
    if (content.includes("import fs from 'fs/promises'") || 
        content.includes('import { promises as fs } from \'fs\'')) {
        content = content.replace(/import fs from 'fs\/promises';?/g, 
            "import { fs } from '../utils/obsidian-adapter.js';");
        content = content.replace(/import { promises as fs } from 'fs';?/g, 
            "import { fs } from '../utils/obsidian-adapter.js';");
        modified = true;
    }
    
    // Transform path imports
    if (content.includes("import path from 'path'")) {
        content = content.replace(/import path from 'path';?/g, 
            "import { path } from '../utils/obsidian-adapter.js';");
        modified = true;
    }
    
    // Transform crypto imports
    if (content.includes("import crypto from 'crypto'") || 
        content.includes("import { randomUUID } from 'crypto'")) {
        content = content.replace(/import crypto from 'crypto';?/g, 
            "import { crypto } from '../utils/obsidian-adapter.js';");
        content = content.replace(/import { randomUUID } from 'crypto';?/g, 
            "import { crypto } from '../utils/obsidian-adapter.js';\nconst randomUUID = crypto.randomUUID;");
        modified = true;
    }
    
    // Transform EventEmitter imports
    if (content.includes("import { EventEmitter } from 'events'")) {
        content = content.replace(/import { EventEmitter } from 'events';?/g, 
            "import { EventEmitter } from '../utils/obsidian-adapter.js';");
        modified = true;
    }
    
    // Transform performance imports
    if (content.includes("import { performance } from 'perf_hooks'")) {
        content = content.replace(/import { performance } from 'perf_hooks';?/g, 
            "import { performance } from '../utils/obsidian-adapter.js';");
        modified = true;
    }
    
    // Adjust relative import paths if needed
    const depth = filePath.split('/').length - ROOT_DIR.split('/').length - 1;
    if (depth > 1) {
        const prefix = '../'.repeat(depth - 1);
        content = content.replace(/from '\.\.\/utils\/obsidian-adapter\.js'/g, 
            `from '${prefix}utils/obsidian-adapter.js'`);
    }
    
    if (modified) {
        await fs.writeFile(filePath, content);
        console.log(`✅ Transformed: ${path.relative(ROOT_DIR, filePath)}`);
    }
    
    return modified;
}

/**
 * Transform all JavaScript files
 * @sideEffect Modifies multiple files
 */
async function transformAll() {
    console.log('🔄 Transforming Node.js imports to Obsidian imports...');
    
    const directories = [
        'core',
        'components', 
        'ui',
        'sync',
        'export',
        'validation'
    ];
    
    let totalTransformed = 0;
    
    for (const dir of directories) {
        const dirPath = path.join(ROOT_DIR, dir);
        try {
            const files = await fs.readdir(dirPath);
            
            for (const file of files) {
                if (file.endsWith('.js')) {
                    const filePath = path.join(dirPath, file);
                    if (await transformFile(filePath)) {
                        totalTransformed++;
                    }
                }
            }
        } catch (error) {
            console.log(`⚠️  Directory not found: ${dir}`);
        }
    }
    
    console.log(`\n✅ Transformed ${totalTransformed} files`);
}

// Run transformation
transformAll().catch(console.error);

// <!-- END OF FILE: transform-imports.js -->