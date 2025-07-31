// <!-- START OF FILE: fix-object-metadata.js -->
// FILENAME: fix-object-metadata.js
// Version: 1.0.0
// Date: 2025-01-31 22:25
// Author: Rolland MELET & Claude Code
// Description: Correction du stockage des métadonnées pour les objets

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Lire le plugin actuel
let currentPlugin = fs.readFileSync(path.join(__dirname, '../dist/main.js'), 'utf8');

// Corriger le stockage des objets avec métadonnées
currentPlugin = currentPlugin.replace(
    /\/\/ Stocker l'objet et le sélectionner automatiquement\s*\n\s*const objectId = 'obj_' \+ this\.objectCount;\s*\n\s*this\.elements\.set\(objectId, { x: centerX, y: centerY }\);/g,
    `// Stocker l'objet et le sélectionner automatiquement
            const objectId = 'obj_' + this.objectCount;
            this.elements.set(objectId, { 
                x: centerX, 
                y: centerY,
                type: "object",
                tag: "#process-object"
            });`
);

// Sauvegarder dans dist
const distPath = path.join(__dirname, '../dist/main.js');
fs.writeFileSync(distPath, currentPlugin);

// Copier vers le vault de test
const testVaultPath = '/Users/rollandmelet/Développement/Projets/ProcessMetaLanguage/VaultTestObsidian/PML-Beta-Test-v2/.obsidian/plugins/processmetalanguage/main.js';
fs.writeFileSync(testVaultPath, currentPlugin);

console.log('✅ Object metadata fix applied!');
console.log('🔄 Please reload Obsidian (Cmd+R) to test.');