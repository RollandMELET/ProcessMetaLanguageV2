// <!-- START OF FILE: fix-grouping-final.js -->
// FILENAME: fix-grouping-final.js
// Version: 1.0.0
// Date: 2025-01-31 21:50
// Author: Rolland MELET & Claude Code
// Description: Correction finale du groupement avec la méthode addToGroup()

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Lire le plugin actuel
const currentPlugin = fs.readFileSync(path.join(__dirname, '../dist/main.js'), 'utf8');

// Remplacer la fonction createObject avec la bonne méthode de groupement
const fixedPlugin = currentPlugin.replace(
    /async createObject\(\) \{[\s\S]*?\n        \} catch \(error\) \{[\s\S]*?\n        \}\n    \}/,
    `async createObject() {
        if (!this.excalidrawAPI) {
            new obsidian.Notice('Please open an Excalidraw drawing first!');
            return;
        }
        
        try {
            const ea = this.excalidrawAPI;
            
            // Obtenir la vue active
            const view = this.getActiveExcalidrawView();
            if (!view) {
                new obsidian.Notice('Please focus on an Excalidraw drawing!');
                return;
            }
            
            console.log('Creating hexagon object #' + (this.objectCount + 1));
            ea.setView(view);
            
            // Position avec décalage pour éviter la superposition
            const offset = this.objectCount * 200;
            const centerX = 400 + offset;
            const centerY = 200;
            
            // Rayon de l'hexagone régulier
            const radius = 60;
            
            // Tableau pour stocker les IDs des éléments
            const elementIds = [];
            
            // Style pour l'hexagone
            ea.style.backgroundColor = PML_CONFIG.colors.object;
            ea.style.strokeColor = "#000000";
            ea.style.fillStyle = "solid";
            ea.style.strokeWidth = 2;
            ea.style.roughness = 0;
            
            // Créer l'hexagone
            let hexagonId;
            if (ea.addPolygon) {
                console.log('Using addPolygon for hexagon');
                hexagonId = ea.addPolygon(centerX, centerY, radius, 6);
            } else {
                console.log('Using addLine for hexagon');
                const points = [];
                for (let i = 0; i < 6; i++) {
                    const angle = (Math.PI / 3) * i - Math.PI / 2;
                    const x = centerX + radius * Math.cos(angle);
                    const y = centerY + radius * Math.sin(angle);
                    points.push([x, y]);
                }
                points.push(points[0]);
                hexagonId = ea.addLine(points);
            }
            if (hexagonId) {
                elementIds.push(hexagonId);
                console.log('Hexagon created with ID:', hexagonId);
            }
            
            // Style du texte
            ea.style.fontSize = 16;
            ea.style.fontFamily = 1;
            ea.style.textAlign = "center";
            ea.style.verticalAlign = "middle";
            ea.style.strokeColor = "#000000";
            ea.style.backgroundColor = "transparent";
            
            // Ajouter le texte au centre
            const objectText = "Object #" + (this.objectCount + 1);
            const textId = ea.addText(centerX - 40, centerY - 10, objectText);
            if (textId) {
                elementIds.push(textId);
                console.log('Text created with ID:', textId);
            }
            
            // Style du tag
            ea.style.fontSize = 10;
            ea.style.strokeColor = "#666666";
            
            // Ajouter le tag sous l'hexagone
            const tagY = centerY + radius + 20;
            const tagId = ea.addText(centerX - 40, tagY, "#process-object");
            if (tagId) {
                elementIds.push(tagId);
                console.log('Tag created with ID:', tagId);
            }
            
            // Grouper les éléments avec addToGroup()
            if (elementIds.length > 0 && ea.addToGroup) {
                console.log('Grouping elements with IDs:', elementIds);
                const groupId = ea.addToGroup(elementIds);
                console.log('Group created with ID:', groupId);
            } else {
                console.log('addToGroup not available or no elements to group');
            }
            
            // Créer tous les éléments
            console.log('Calling ea.create()...');
            await ea.create({
                filename: "ProcessMetaLanguage.excalidraw",
                onNewPane: false
            });
            
            // Stocker l'objet et le sélectionner automatiquement
            const objectId = 'obj_' + this.objectCount;
            this.elements.set(objectId, { x: centerX, y: centerY });
            
            this.objectCount++;
            new obsidian.Notice(\`✅ Hexagon Object #\${this.objectCount} created and grouped!\`);
            
            // Sélectionner automatiquement l'objet créé
            this.selectObject(objectId, objectText);
            
        } catch (error) {
            console.error('Error creating object:', error);
            console.error('Error stack:', error.stack);
            new obsidian.Notice('Error creating object: ' + error.message);
        }
    }`
);

// Remplacer aussi createState pour appliquer le même fix
const fixedPlugin2 = fixedPlugin.replace(
    /async createState\(\) \{[\s\S]*?this\.stateCount\+\+;\s*new obsidian\.Notice[^;]+;\s*\} catch/,
    `async createState() {
        // Créer un state indépendant (sans lien)
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
            
            // Position avec décalage
            const offset = this.stateCount * 130;
            const centerX = 400 + offset;
            const centerY = 450;
            
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
            
            // Style du texte
            ea.style.fontSize = 14;
            ea.style.fontFamily = 1;
            ea.style.strokeColor = "#FFFFFF";
            ea.style.backgroundColor = "transparent";
            
            // Texte au centre
            const stateText = "State #" + (this.stateCount + 1);
            const textId = ea.addText(centerX - 35, centerY - 7, stateText);
            if (textId) elementIds.push(textId);
            
            // Style du tag
            ea.style.fontSize = 10;
            ea.style.strokeColor = "#666666";
            
            // Tag
            const tagId = ea.addText(centerX - 40, centerY + height/2 + 15, "#process-state");
            if (tagId) elementIds.push(tagId);
            
            // Grouper les éléments
            if (elementIds.length > 0 && ea.addToGroup) {
                const groupId = ea.addToGroup(elementIds);
                console.log('State elements grouped with ID:', groupId);
            }
            
            // Créer avec options
            await ea.create({
                filename: "ProcessMetaLanguage.excalidraw",
                onNewPane: false
            });
            
            this.stateCount++;
            new obsidian.Notice(\`✅ Banner State #\${this.stateCount} created and grouped!\`);
            
        } catch`
);

// Remplacer createAction aussi
const fixedPlugin3 = fixedPlugin2.replace(
    /async createAction\(\) \{[\s\S]*?this\.actionCount\+\+;\s*new obsidian\.Notice[^;]+;\s*\} catch/,
    `async createAction() {
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
            
            // Position avec décalage
            const offset = this.actionCount * 160;
            const centerX = 400 + offset;
            const centerY = 600;
            
            // Tableau pour stocker les IDs
            const elementIds = [];
            
            // Style de l'action
            ea.style.backgroundColor = PML_CONFIG.colors.action;
            ea.style.strokeColor = "#000000";
            ea.style.fillStyle = "solid";
            ea.style.strokeWidth = 2;
            ea.style.roughness = 0;
            ea.style.roundness = { type: 2 };
            
            // Créer rectangle arrondi pour l'action
            const rectId = ea.addRect(
                centerX - PML_CONFIG.actionSize.width / 2,
                centerY - PML_CONFIG.actionSize.height / 2,
                PML_CONFIG.actionSize.width,
                PML_CONFIG.actionSize.height
            );
            if (rectId) elementIds.push(rectId);
            
            // Style du texte
            ea.style.fontSize = 16;
            ea.style.fontFamily = 1;
            ea.style.strokeColor = "#000000";
            ea.style.backgroundColor = "transparent";
            
            // Texte
            const actionText = "Action #" + (this.actionCount + 1);
            const textId = ea.addText(centerX - 35, centerY - 8, actionText);
            if (textId) elementIds.push(textId);
            
            // Style du tag
            ea.style.fontSize = 10;
            ea.style.strokeColor = "#666666";
            
            // Tag
            const tagId = ea.addText(centerX - 40, centerY + PML_CONFIG.actionSize.height/2 + 15, "#process-action");
            if (tagId) elementIds.push(tagId);
            
            // Grouper les éléments
            if (elementIds.length > 0 && ea.addToGroup) {
                const groupId = ea.addToGroup(elementIds);
                console.log('Action elements grouped with ID:', groupId);
            }
            
            // Créer avec options
            await ea.create({
                filename: "ProcessMetaLanguage.excalidraw",
                onNewPane: false
            });
            
            this.actionCount++;
            new obsidian.Notice(\`✅ Action #\${this.actionCount} created and grouped!\`);
            
        } catch`
);

// Sauvegarder dans dist
const distPath = path.join(__dirname, '../dist/main.js');
fs.writeFileSync(distPath, fixedPlugin3);

// Copier vers le vault de test
const testVaultPath = '/Users/rollandmelet/Développement/Projets/ProcessMetaLanguage/VaultTestObsidian/PML-Beta-Test-v2/.obsidian/plugins/processmetalanguage/main.js';
fs.writeFileSync(testVaultPath, fixedPlugin3);

console.log('✅ Final grouping fix applied with addToGroup() method!');
console.log('🔄 Please reload Obsidian (Cmd+R) to test.');
console.log('📝 Changes:');
console.log('   - Uses correct ea.addToGroup() method');
console.log('   - Groups elements before ea.create()');
console.log('   - Applied to all creation functions (Object, State, Action)');
console.log('   - Elements should now move together as one unit');