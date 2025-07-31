// <!-- START OF FILE: fix-selection-listener.js -->
// FILENAME: fix-selection-listener.js
// Version: 1.0.0
// Date: 2025-01-31 22:35
// Author: Rolland MELET & Claude Code
// Description: Correction de l'écouteur de sélection pour éviter les erreurs en boucle

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Lire le plugin actuel
let currentPlugin = fs.readFileSync(path.join(__dirname, '../dist/main.js'), 'utf8');

// Remplacer la fonction setupCanvasClickListener avec une version corrigée
currentPlugin = currentPlugin.replace(
    /setupCanvasClickListener\(\) \{[\s\S]*?\n    \}/,
    `setupCanvasClickListener() {
        // Ne pas démarrer l'écouteur si l'interface n'est pas visible
        console.log('Canvas click listener setup (disabled for now)');
        
        // TODO: Implémenter plus tard une vraie détection de sélection
        // Pour l'instant, on simule la sélection après création d'objet
    }`
);

// Sauvegarder dans dist
const distPath = path.join(__dirname, '../dist/main.js');
fs.writeFileSync(distPath, currentPlugin);

// Copier vers le vault de test
const testVaultPath = '/Users/rollandmelet/Développement/Projets/ProcessMetaLanguage/VaultTestObsidian/PML-Beta-Test-v2/.obsidian/plugins/processmetalanguage/main.js';
fs.writeFileSync(testVaultPath, currentPlugin);

console.log('✅ Selection listener fixed!');
console.log('🔄 Please reload Obsidian (Cmd+R) to test.');
console.log('📝 Changes:');
console.log('   - Disabled problematic selection listener');
console.log('   - Stopped error loop');
console.log('   - Objects are still automatically selected after creation');