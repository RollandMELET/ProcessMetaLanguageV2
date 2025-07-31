// <!-- START OF FILE: fix-selection-and-hexagon.js -->
// FILENAME: fix-selection-and-hexagon.js
// Version: 1.0.0
// Date: 2025-01-31 22:30
// Author: Rolland MELET & Claude Code
// Description: Correction de la sélection d'objet et de la forme hexagonale

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Lire le plugin actuel
let currentPlugin = fs.readFileSync(path.join(__dirname, '../dist/main.js'), 'utf8');

// 1. Ajouter un écouteur de sélection sur le canvas
currentPlugin = currentPlugin.replace(
    /setupCanvasClickListener\(\) \{[\s\S]*?\}/,
    `setupCanvasClickListener() {
        const activeView = this.getActiveExcalidrawView();
        if (!activeView || !activeView.excalidrawAPI) {
            console.log('Canvas not ready for click listener');
            return;
        }
        
        // Écouter les changements de sélection
        const checkSelection = () => {
            if (!this.excalidrawAPI) return;
            
            const ea = this.excalidrawAPI;
            const selectedElements = ea.getViewSelectedElements();
            
            if (selectedElements && selectedElements.length > 0) {
                // Chercher si un objet est sélectionné
                for (const [objectId, objectData] of this.elements) {
                    if (objectData.type === 'object' && objectData.elementIds) {
                        // Vérifier si un des éléments de l'objet est sélectionné
                        const isObjectSelected = objectData.elementIds.some(id => 
                            selectedElements.some(el => el.id === id)
                        );
                        
                        if (isObjectSelected) {
                            const objectName = objectData.name || objectId.replace('obj_', 'Object #');
                            this.selectObject(objectId, objectName);
                            return;
                        }
                    }
                }
            }
        };
        
        // Vérifier périodiquement la sélection
        this.registerInterval(
            window.setInterval(checkSelection, 500)
        );
        
        console.log('Canvas selection listener setup completed');
    }`
);

// 2. Corriger createObject pour stocker les elementIds et le nom
currentPlugin = currentPlugin.replace(
    /\/\/ Stocker l'objet et le sélectionner automatiquement[\s\S]*?this\.selectObject\(objectId, objectText\);/g,
    `// Stocker l'objet et le sélectionner automatiquement
            const objectId = 'obj_' + this.objectCount;
            this.elements.set(objectId, { 
                x: centerX, 
                y: centerY,
                type: "object",
                tag: "#process-object",
                elementIds: elementIds,
                name: objectText
            });
            
            this.objectCount++;
            new obsidian.Notice(\`✅ Hexagon Object #\${this.objectCount} created and grouped!\`);
            
            // Sélectionner automatiquement l'objet créé
            this.selectObject(objectId, objectText);`
);

// 3. Forcer la forme hexagonale en supprimant toute tentative d'utiliser addPolygon
currentPlugin = currentPlugin.replace(
    /\/\/ Créer l'hexagone[\s\S]*?const hexagonId = ea\.addLine\(points\);/g,
    `// Créer l'hexagone (toujours avec addLine)
            const points = [];
            for (let i = 0; i <= 6; i++) { // <= 6 pour fermer l'hexagone
                const angle = (Math.PI / 3) * i - Math.PI / 2;
                const x = centerX + radius * Math.cos(angle);
                const y = centerY + radius * Math.sin(angle);
                points.push([x, y]);
            }
            const hexagonId = ea.addLine(points);`
);

// Sauvegarder dans dist
const distPath = path.join(__dirname, '../dist/main.js');
fs.writeFileSync(distPath, currentPlugin);

// Copier vers le vault de test
const testVaultPath = '/Users/rollandmelet/Développement/Projets/ProcessMetaLanguage/VaultTestObsidian/PML-Beta-Test-v2/.obsidian/plugins/processmetalanguage/main.js';
fs.writeFileSync(testVaultPath, currentPlugin);

console.log('✅ Selection and hexagon fixes applied!');
console.log('🔄 Please reload Obsidian (Cmd+R) to test.');
console.log('📝 Changes:');
console.log('   - Added canvas selection listener');
console.log('   - Objects can now be selected by clicking');
console.log('   - Fixed hexagon shape consistency');
console.log('   - Stored element IDs for selection detection');