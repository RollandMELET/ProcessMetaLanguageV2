// <!-- START OF FILE: fix-interface-duplication.js -->
// FILENAME: fix-interface-duplication.js
// Version: 1.0.0
// Date: 2025-01-31 23:20
// Author: Rolland MELET & Claude Code
// Description: Corriger la duplication de boutons dans l'interface

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Lire le plugin actuel
let currentPlugin = fs.readFileSync(path.join(__dirname, '../dist/main.js'), 'utf8');

// Corriger l'interface HTML en supprimant les duplications
currentPlugin = currentPlugin.replace(
    /<button class="pml-button" onclick="app\.plugins\.plugins\.processmetalanguage\.linkActionToState\(\)"[\s\S]*?<\/button>\s*<button class="pml-button" onclick="app\.plugins\.plugins\.processmetalanguage\.linkStateToObject\(\)"[\s\S]*?<\/button>\s*<button class="pml-button" onclick="app\.plugins\.plugins\.processmetalanguage\.createAction\(\)">[\s\S]*?<\/button>/,
    `<button class="pml-button" onclick="app.plugins.plugins.processmetalanguage.linkActionToState()" 
                        id="pml-add-action-btn" disabled>
                    🎯 Add Action to State
                </button>
                
                <button class="pml-button" onclick="app.plugins.plugins.processmetalanguage.createAction()">
                    ⚡ Create Action (Rectangle)
                </button>`
);

// Sauvegarder dans dist
const distPath = path.join(__dirname, '../dist/main.js');
fs.writeFileSync(distPath, currentPlugin);

// Copier vers le vault de test
const testVaultPath = '/Users/rollandmelet/Développement/Projets/ProcessMetaLanguage/VaultTestObsidian/PML-Beta-Test-v2/.obsidian/plugins/processmetalanguage/main.js';
fs.writeFileSync(testVaultPath, currentPlugin);

console.log('✅ Interface duplication fixed!');
console.log('🔄 Please reload Obsidian (Cmd+R) to test.');