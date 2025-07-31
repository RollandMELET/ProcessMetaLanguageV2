// <!-- START OF FILE: implement-state-action-workflow.js -->
// FILENAME: implement-state-action-workflow.js
// Version: 1.0.0
// Date: 2025-01-31 23:15
// Author: Rolland MELET & Claude Code
// Description: Implémenter le workflow complet État-Action pour ProcessMetaLanguage

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Lire le plugin actuel
let currentPlugin = fs.readFileSync(path.join(__dirname, '../dist/main.js'), 'utf8');

// 1. Mettre à jour l'interface HTML pour inclure la sélection d'État
currentPlugin = currentPlugin.replace(
    /<div class="pml-selection-info">[\s\S]*?<\/div>\s*<\/div>/,
    `<div class="pml-selection-info">
                    <div id="pml-selected-object" class="pml-selected-item">
                        No object selected
                    </div>
                </div>
                
                <button class="pml-button" onclick="app.plugins.plugins.processmetalanguage.linkStateToObject()" 
                        id="pml-add-state-btn" disabled>
                    🚩 Add State to Object
                </button>
                
                <div class="pml-selection-info">
                    <div id="pml-selected-state" class="pml-selected-item">
                        No state selected
                    </div>
                </div>
                
                <button class="pml-button" onclick="app.plugins.plugins.processmetalanguage.linkActionToState()" 
                        id="pml-add-action-btn" disabled>
                    🎯 Add Action to State
                </button>`
);

// 2. Mettre à jour setupCanvasClickListener pour détecter aussi les États
currentPlugin = currentPlugin.replace(
    /\/\/ Chercher si un objet est sélectionné[\s\S]*?}\s*}\s*}\s*}\s*} catch/,
    `// Chercher si un objet ou un état est sélectionné
                    for (const [elementId, elementData] of this.elements) {
                        if (elementData.elementIds) {
                            // Vérifier si un des éléments est sélectionné
                            const isSelected = elementData.elementIds.some(id => 
                                selectedElements.some(el => el.id === id)
                            );
                            
                            if (isSelected) {
                                if (elementData.type === 'object' && this.selectedObject?.id !== elementId) {
                                    const objectName = elementData.name || elementId.replace('obj_', 'Object #');
                                    this.selectObject(elementId, objectName);
                                    return;
                                } else if (elementData.type === 'state' && this.selectedState?.id !== elementId) {
                                    const stateName = elementData.name || elementId.replace('state_', 'State #');
                                    this.selectState(elementId, stateName);
                                    return;
                                }
                            }
                        }
                    }
                }
            } catch`
);

// 3. Ajouter la fonction selectState après selectObject
currentPlugin = currentPlugin.replace(
    /selectObject\(objectId, objectName\) \{[\s\S]*?new obsidian\.Notice\(`Object selected: \$\{objectName\}`\);\s*}/,
    `selectObject(objectId, objectName) {
        this.selectedObject = { id: objectId, name: objectName };
        
        // Mettre à jour l'interface
        const selectedInfo = document.getElementById('pml-selected-object');
        const addStateBtn = document.getElementById('pml-add-state-btn');
        
        if (selectedInfo) {
            selectedInfo.innerHTML = \`✅ Selected: \${objectName}\`;
            selectedInfo.className = 'pml-selected-item pml-selected-active';
        }
        
        if (addStateBtn) {
            addStateBtn.disabled = false;
        }
        
        new obsidian.Notice(\`Object selected: \${objectName}\`);
    }
    
    selectState(stateId, stateName) {
        this.selectedState = { id: stateId, name: stateName };
        
        // Mettre à jour l'interface
        const selectedInfo = document.getElementById('pml-selected-state');
        const addActionBtn = document.getElementById('pml-add-action-btn');
        
        if (selectedInfo) {
            selectedInfo.innerHTML = \`✅ Selected: \${stateName}\`;
            selectedInfo.className = 'pml-selected-item pml-selected-active';
        }
        
        if (addActionBtn) {
            addActionBtn.disabled = false;
        }
        
        new obsidian.Notice(\`State selected: \${stateName}\`);
    }`
);

// 4. Ajouter la fonction linkActionToState après linkStateToObject
currentPlugin = currentPlugin.replace(
    /async linkStateToObject\(\) \{[\s\S]*?}\s*}\s*async createObject/,
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
            
            // Tag visuel supprimé pour les états liés
            
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
            const stateId2 = 'state_' + this.stateCount;
            this.elements.set(stateId2, { 
                x: centerX, 
                y: centerY, 
                parentObject: this.selectedObject.id,
                elementIds: elementIds,
                type: "state",
                tag: "#process-state",
                name: stateText
            });
            
            this.stateCount++;
            new obsidian.Notice(\`✅ State linked to \${this.selectedObject.name}!\`);
            
        } catch (error) {
            console.error('Error creating linked state:', error);
            new obsidian.Notice('Error: ' + error.message);
        }
    }
    
    async linkActionToState() {
        if (!this.selectedState) {
            new obsidian.Notice('Please select a state first!');
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
            
            // Position de l'action sous l'état sélectionné
            const stateData = this.elements.get(this.selectedState.id);
            const centerX = stateData ? stateData.x : 400;
            const centerY = stateData ? stateData.y + 100 : 550; // 100px sous l'état
            
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
            
            // Créer une flèche entre l'état et l'action
            ea.style.strokeColor = "#000000";
            ea.style.strokeWidth = 2;
            ea.style.strokeStyle = "solid";
            ea.style.startArrowhead = null;
            ea.style.endArrowhead = "arrow";
            
            const arrowY1 = stateData ? stateData.y + 25 : 475;
            const arrowY2 = centerY - PML_CONFIG.actionSize.height/2 - 10;
            
            const arrowId = ea.addArrow([[centerX, arrowY1], [centerX, arrowY2]]);
            if (arrowId) elementIds.push(arrowId);
            
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
            
            // Stocker l'action
            const actionId = 'action_' + this.actionCount;
            this.elements.set(actionId, { 
                x: centerX, 
                y: centerY,
                parentState: this.selectedState.id,
                elementIds: elementIds,
                type: "action",
                tag: "#process-action",
                name: actionText
            });
            
            this.actionCount++;
            new obsidian.Notice(\`✅ Action linked to \${this.selectedState.name}!\`);
            
        } catch (error) {
            console.error('Error creating linked action:', error);
            new obsidian.Notice('Error: ' + error.message);
        }
    }
    
    async createObject`
);

// Sauvegarder dans dist
const distPath = path.join(__dirname, '../dist/main.js');
fs.writeFileSync(distPath, currentPlugin);

// Copier vers le vault de test
const testVaultPath = '/Users/rollandmelet/Développement/Projets/ProcessMetaLanguage/VaultTestObsidian/PML-Beta-Test-v2/.obsidian/plugins/processmetalanguage/main.js';
fs.writeFileSync(testVaultPath, currentPlugin);

console.log('✅ State-Action workflow implemented!');
console.log('🔄 Please reload Obsidian (Cmd+R) to test.');
console.log('📝 Changes:');
console.log('   - Added State selection interface');
console.log('   - Added "Add Action to State" button');
console.log('   - Implemented selectState() function');
console.log('   - Implemented linkActionToState() function');
console.log('   - States can now have Actions attached');
console.log('   - Complete workflow Object→State→Action is possible');