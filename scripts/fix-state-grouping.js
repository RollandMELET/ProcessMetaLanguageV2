// <!-- START OF FILE: fix-state-grouping.js -->
// FILENAME: fix-state-grouping.js
// Version: 1.0.0
// Date: 2025-01-31 22:00
// Author: Rolland MELET & Claude Code
// Description: Correction du groupement pour la fonction linkStateToObject()

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Lire le plugin actuel
const currentPlugin = fs.readFileSync(path.join(__dirname, '../dist/main.js'), 'utf8');

// Corriger la fonction linkStateToObject pour grouper les éléments
const fixedPlugin = currentPlugin.replace(
    /async linkStateToObject\(\) \{[\s\S]*?\} catch \(error\) \{[\s\S]*?\}\n    \}/,
    `async linkStateToObject() {
        if (!this.selectedObject) {
            new obsidian.Notice('Please select an object first!');
            return;
        }
        
        if (!this.excalidrawAPI) {
            new obsidian.Notice('Please open an Excalidraw drawing first!');
            return;
        }
        
        try {
            const ea = this.excalidrawAPI;
            const view = this.getActiveExcalidrawView();
            if (!view) {
                new obsidian.Notice('Please focus on an Excalidraw drawing!');
                return;
            }
            
            ea.setView(view);
            
            // Position du state sous l'objet sélectionné
            const objectData = this.elements.get(this.selectedObject.id);
            const centerX = objectData ? objectData.x : 400;
            const centerY = objectData ? objectData.y + 150 : 450; // 150px sous l'objet
            
            // Dimensions du fanion
            const width = PML_CONFIG.stateSize.width;
            const height = PML_CONFIG.stateSize.height;
            
            // Tableau pour stocker les IDs
            const elementIds = [];
            
            // Points du fanion
            const points = [
                [centerX - width/2, centerY - height/2],
                [centerX + width/2 - 20, centerY - height/2],
                [centerX + width/2, centerY - height/2 + 15],
                [centerX + width/2 - 15, centerY],
                [centerX + width/2, centerY + height/2 - 15],
                [centerX + width/2 - 20, centerY + height/2],
                [centerX - width/2, centerY + height/2],
                [centerX - width/2, centerY - height/2]
            ];
            
            // Style de l'état
            ea.style.backgroundColor = PML_CONFIG.colors.state;
            ea.style.strokeColor = "#000000";
            ea.style.fillStyle = "solid";
            ea.style.strokeWidth = 2;
            ea.style.roughness = 0;
            
            // Créer le fanion
            const stateId = ea.addLine(points);
            if (stateId) elementIds.push(stateId);
            
            // Texte
            ea.style.fontSize = 14;
            ea.style.fontFamily = 1;
            ea.style.strokeColor = "#FFFFFF";
            ea.style.backgroundColor = "transparent";
            
            const stateText = "State #" + (this.stateCount + 1);
            const textId = ea.addText(centerX - 35, centerY - 7, stateText);
            if (textId) elementIds.push(textId);
            
            // Tag
            ea.style.fontSize = 10;
            ea.style.strokeColor = "#666666";
            const tagId = ea.addText(centerX - 40, centerY + height/2 + 15, "#process-state");
            if (tagId) elementIds.push(tagId);
            
            // Créer une flèche entre l'objet et l'état
            ea.style.strokeColor = "#000000";
            ea.style.strokeWidth = 2;
            ea.style.strokeStyle = "solid";
            ea.style.startArrowhead = null;
            ea.style.endArrowhead = "arrow";
            
            const arrowY1 = objectData ? objectData.y + 60 : 360;
            const arrowY2 = centerY - height/2 - 10;
            
            const arrowId = ea.addArrow([[centerX, arrowY1], [centerX, arrowY2]]);
            if (arrowId) elementIds.push(arrowId);
            
            // Grouper les éléments avec addToGroup()
            if (elementIds.length > 0 && ea.addToGroup) {
                console.log('Grouping state elements with IDs:', elementIds);
                const groupId = ea.addToGroup(elementIds);
                console.log('State group created with ID:', groupId);
            }
            
            // Créer avec options
            await ea.create({
                filename: "ProcessMetaLanguage.excalidraw",
                onNewPane: false
            });
            
            // Stocker l'état
            this.elements.set('state_' + this.stateCount, { 
                x: centerX, 
                y: centerY, 
                parentObject: this.selectedObject.id,
                elementIds: elementIds
            });
            
            this.stateCount++;
            new obsidian.Notice(\`✅ State linked to \${this.selectedObject.name}!\`);
            
        } catch (error) {
            console.error('Error creating linked state:', error);
            new obsidian.Notice('Error: ' + error.message);
        }
    }`
);

// Sauvegarder dans dist
const distPath = path.join(__dirname, '../dist/main.js');
fs.writeFileSync(distPath, fixedPlugin);

// Copier vers le vault de test
const testVaultPath = '/Users/rollandmelet/Développement/Projets/ProcessMetaLanguage/VaultTestObsidian/PML-Beta-Test-v2/.obsidian/plugins/processmetalanguage/main.js';
fs.writeFileSync(testVaultPath, fixedPlugin);

console.log('✅ State grouping fix applied!');
console.log('🔄 Please reload Obsidian (Cmd+R) to test.');
console.log('📝 Changes:');
console.log('   - Collect all element IDs (state, text, tag, arrow)');
console.log('   - Group elements with addToGroup() before create()');
console.log('   - Store element IDs for reference');