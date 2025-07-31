// <!-- START OF FILE: fix-object-creation-and-selection.js -->
// FILENAME: fix-object-creation-and-selection.js
// Version: 1.0.0
// Date: 2025-01-31 22:45
// Author: Rolland MELET & Claude Code
// Description: Correction complète de la création d'objets et de la sélection

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Lire le plugin actuel
let currentPlugin = fs.readFileSync(path.join(__dirname, '../dist/main.js'), 'utf8');

// 1. Corriger la fonction createObject complètement
currentPlugin = currentPlugin.replace(
    /async createObject\(\) \{[\s\S]*?this\.stateCount\+\+;\s*new obsidian\.Notice\(`✅ Banner State #\$\{this\.stateCount\} created and grouped!\`\);/g,
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
            
            // Créer l'hexagone (toujours avec addLine)
            const points = [];
            for (let i = 0; i <= 6; i++) { // <= 6 pour fermer l'hexagone
                const angle = (Math.PI / 3) * i - Math.PI / 2;
                const x = centerX + radius * Math.cos(angle);
                const y = centerY + radius * Math.sin(angle);
                points.push([x, y]);
            }
            const hexagonId = ea.addLine(points);
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
            
            // Tag supprimé visuellement mais conservé dans les métadonnées
            
            // Grouper les éléments
            if (elementIds.length > 0 && ea.addToGroup) {
                const groupId = ea.addToGroup(elementIds);
                console.log('Object elements grouped with ID:', groupId);
            }
            
            // Créer avec options
            await ea.create({
                filename: "ProcessMetaLanguage.excalidraw",
                onNewPane: false
            });
            
            // Stocker l'objet et le sélectionner automatiquement
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

// 2. Implémenter une détection de sélection sécurisée
currentPlugin = currentPlugin.replace(
    /setupCanvasClickListener\(\) \{[\s\S]*?\}/,
    `setupCanvasClickListener() {
        console.log('Setting up safe canvas selection listener...');
        
        let lastCheckTime = 0;
        const CHECK_INTERVAL = 1000; // Vérifier toutes les secondes
        
        const checkSelection = () => {
            const now = Date.now();
            if (now - lastCheckTime < CHECK_INTERVAL) return;
            lastCheckTime = now;
            
            if (!this.excalidrawAPI || !this.interfaceVisible) return;
            
            const view = this.getActiveExcalidrawView();
            if (!view) return;
            
            try {
                const ea = this.excalidrawAPI;
                ea.setView(view);
                
                // Utiliser getExcalidrawAPI() de la vue au lieu de getViewSelectedElements()
                const api = view.excalidrawAPI;
                if (!api) return;
                
                const selectedElements = api.getSceneElements().filter(el => el.isSelected);
                
                if (selectedElements && selectedElements.length > 0) {
                    // Chercher si un objet est sélectionné
                    for (const [objectId, objectData] of this.elements) {
                        if (objectData.type === 'object' && objectData.elementIds) {
                            // Vérifier si un des éléments de l'objet est sélectionné
                            const isObjectSelected = objectData.elementIds.some(id => 
                                selectedElements.some(el => el.id === id)
                            );
                            
                            if (isObjectSelected && this.selectedObject?.id !== objectId) {
                                const objectName = objectData.name || objectId.replace('obj_', 'Object #');
                                this.selectObject(objectId, objectName);
                                return;
                            }
                        }
                    }
                }
            } catch (error) {
                // Ignorer les erreurs silencieusement
                console.log('Selection check error (ignored):', error.message);
            }
        };
        
        // Vérifier périodiquement la sélection
        this.selectionInterval = window.setInterval(checkSelection, 500);
        this.registerInterval(this.selectionInterval);
        
        console.log('Safe canvas selection listener setup completed');
    }`
);

// 3. Ajouter le nettoyage de l'intervalle dans hideInterface
currentPlugin = currentPlugin.replace(
    /hideInterface\(\) \{[\s\S]*?new obsidian\.Notice\('ProcessMetaLanguage Interface closed'\);/,
    `hideInterface() {
        const container = document.getElementById('pml-interface');
        if (container) {
            container.remove();
        }
        
        // Arrêter l'écouteur de sélection
        if (this.selectionInterval) {
            window.clearInterval(this.selectionInterval);
            this.selectionInterval = null;
        }
        
        new obsidian.Notice('ProcessMetaLanguage Interface closed');`
);

// Sauvegarder dans dist
const distPath = path.join(__dirname, '../dist/main.js');
fs.writeFileSync(distPath, currentPlugin);

// Copier vers le vault de test
const testVaultPath = '/Users/rollandmelet/Développement/Projets/ProcessMetaLanguage/VaultTestObsidian/PML-Beta-Test-v2/.obsidian/plugins/processmetalanguage/main.js';
fs.writeFileSync(testVaultPath, currentPlugin);

console.log('✅ Object creation and selection fixes applied!');
console.log('🔄 Please reload Obsidian (Cmd+R) to test.');
console.log('📝 Changes:');
console.log('   - Fixed createObject counter and messages');
console.log('   - Added object storage in elements Map');
console.log('   - Added automatic selection after creation');
console.log('   - Implemented safe selection detection');
console.log('   - Objects can now be selected manually');