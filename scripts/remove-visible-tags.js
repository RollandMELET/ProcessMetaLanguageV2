// <!-- START OF FILE: remove-visible-tags.js -->
// FILENAME: remove-visible-tags.js
// Version: 1.0.0
// Date: 2025-01-31 22:20
// Author: Rolland MELET & Claude Code
// Description: Suppression de l'affichage visuel des tags tout en conservant les métadonnées

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Lire le plugin actuel
let currentPlugin = fs.readFileSync(path.join(__dirname, '../dist/main.js'), 'utf8');

// 1. Retirer le tag visible dans createObject
currentPlugin = currentPlugin.replace(
    /\/\/ Style du tag[\s\S]*?const tagId = ea\.addText\([^)]+\);\s*if \(tagId\) elementIds\.push\(tagId\);/g,
    '// Tag supprimé visuellement mais conservé dans les métadonnées'
);

// 2. Ajuster le groupement dans createObject pour ne pas inclure tagId
currentPlugin = currentPlugin.replace(
    /const tagId = ea\.addText\([^)]+\);\s*if \(tagId\) {\s*elementIds\.push\(tagId\);\s*console\.log\('Tag created with ID:', tagId\);\s*}/g,
    '// Tag visuel supprimé'
);

// 3. Retirer le tag visible dans createState
currentPlugin = currentPlugin.replace(
    /\/\/ Tag\s*\n\s*const tagId = ea\.addText\(centerX[^,]+,[^,]+, "#process-state"\);\s*if \(tagId\) elementIds\.push\(tagId\);/g,
    '// Tag visuel supprimé pour les états'
);

// 4. Retirer le tag visible dans linkStateToObject
currentPlugin = currentPlugin.replace(
    /\/\/ Tag\s*\n\s*ea\.style\.fontSize = 10;\s*ea\.style\.strokeColor = "#666666";\s*const tagId = ea\.addText\([^)]+\);\s*if \(tagId\) elementIds\.push\(tagId\);/g,
    '// Tag visuel supprimé pour les états liés'
);

// 5. Retirer le tag visible dans createAction
currentPlugin = currentPlugin.replace(
    /\/\/ Tag\s*\n\s*const tagId = ea\.addText\(centerX[^,]+,[^,]+, "#process-action"\);\s*if \(tagId\) elementIds\.push\(tagId\);/g,
    '// Tag visuel supprimé pour les actions'
);

// 6. Ajouter les métadonnées de type dans le stockage des éléments
currentPlugin = currentPlugin.replace(
    /this\.elements\.set\(objectId, { x: centerX, y: centerY }\);/g,
    'this.elements.set(objectId, { x: centerX, y: centerY, type: "object", tag: "#process-object" });'
);

currentPlugin = currentPlugin.replace(
    /this\.elements\.set\('state_' \+ this\.stateCount, {\s*x: centerX,\s*y: centerY,\s*parentObject: this\.selectedObject\.id,?\s*elementIds: elementIds\s*}\);/g,
    `this.elements.set('state_' + this.stateCount, { 
                x: centerX, 
                y: centerY, 
                parentObject: this.selectedObject.id,
                elementIds: elementIds,
                type: "state",
                tag: "#process-state"
            });`
);

// Sauvegarder dans dist
const distPath = path.join(__dirname, '../dist/main.js');
fs.writeFileSync(distPath, currentPlugin);

// Copier vers le vault de test
const testVaultPath = '/Users/rollandmelet/Développement/Projets/ProcessMetaLanguage/VaultTestObsidian/PML-Beta-Test-v2/.obsidian/plugins/processmetalanguage/main.js';
fs.writeFileSync(testVaultPath, currentPlugin);

console.log('✅ Visible tags removed!');
console.log('🔄 Please reload Obsidian (Cmd+R) to test.');
console.log('📝 Changes:');
console.log('   - Removed visual display of #process-object, #process-state, #process-action');
console.log('   - Tags preserved in internal metadata for future synchronization');
console.log('   - Cleaner visual interface');