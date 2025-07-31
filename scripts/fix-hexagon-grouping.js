// <!-- START OF FILE: fix-hexagon-grouping.js -->
// FILENAME: fix-hexagon-grouping.js
// Version: 1.0.0
// Date: 2025-01-31 23:05
// Author: Rolland MELET & Claude Code
// Description: Corriger le groupement de l'hexagone avec les autres éléments

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Lire le plugin actuel
let currentPlugin = fs.readFileSync(path.join(__dirname, '../dist/main.js'), 'utf8');

// Ajouter l'hexagonId aux elementIds juste après sa création
currentPlugin = currentPlugin.replace(
    /const hexagonId = ea\.addLine\(points\);\s*console\.log\('Hexagon polygon created with ID:', hexagonId\);/g,
    `const hexagonId = ea.addLine(points);
            if (hexagonId) {
                elementIds.push(hexagonId);
                console.log('Hexagon polygon created with ID:', hexagonId);
            }`
);

// Sauvegarder dans dist
const distPath = path.join(__dirname, '../dist/main.js');
fs.writeFileSync(distPath, currentPlugin);

// Copier vers le vault de test
const testVaultPath = '/Users/rollandmelet/Développement/Projets/ProcessMetaLanguage/VaultTestObsidian/PML-Beta-Test-v2/.obsidian/plugins/processmetalanguage/main.js';
fs.writeFileSync(testVaultPath, currentPlugin);

console.log('✅ Hexagon grouping fix applied!');
console.log('🔄 Please reload Obsidian (Cmd+R) to test.');
console.log('📝 Changes:');
console.log('   - Hexagon ID is now properly added to elementIds');
console.log('   - Hexagon will be grouped with text');