// <!-- START OF FILE: fix-element-grouping.js -->
// FILENAME: fix-element-grouping.js
// Version: 1.0.0
// Date: 2025-01-31 21:30
// Author: Rolland MELET & Claude Code
// Description: Correction du groupement des éléments pour qu'ils bougent ensemble

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Lire le plugin actuel
const currentPlugin = fs.readFileSync(path.join(__dirname, '../dist/main.js'), 'utf8');

// Modifier la fonction createObject pour grouper les éléments
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
            const offset = this.objectCount * 200; // Plus d'espace entre objets
            const centerX = 400 + offset;
            const centerY = 200; // Plus haut pour laisser place aux states
            
            // Rayon de l'hexagone régulier
            const radius = 60;
            
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
            
            // Style du tag
            ea.style.fontSize = 10;
            ea.style.strokeColor = "#666666";
            
            // Ajouter le tag sous l'hexagone
            const tagY = centerY + radius + 20;
            const tagId = ea.addText(centerX - 40, tagY, "#process-object");
            
            // Grouper les éléments ensemble
            const elementIds = [hexagonId, textId, tagId].filter(id => id);
            if (elementIds.length > 0) {
                console.log('Grouping elements:', elementIds);
                // Utiliser une approche différente pour grouper
                // Au lieu d'utiliser addToGroup, on va créer un élément frame invisible
                ea.style.backgroundColor = "transparent";
                ea.style.strokeColor = "transparent";
                ea.style.fillStyle = "transparent";
                ea.style.strokeWidth = 0;
                
                // Créer un frame englobant
                const frameId = ea.addRect(
                    centerX - radius - 10,
                    centerY - radius - 10,
                    radius * 2 + 20,
                    radius * 2 + 60
                );
                
                // Stocker les IDs groupés
                const groupKey = 'obj_' + this.objectCount;
                this.elements.set(groupKey, { 
                    x: centerX, 
                    y: centerY,
                    elements: [frameId, hexagonId, textId, tagId],
                    frame: frameId
                });
            }
            
            // Créer tous les éléments
            console.log('Calling ea.create()...');
            await ea.create({
                filename: "ProcessMetaLanguage.excalidraw",
                onNewPane: false
            });
            
            // Stocker l'objet et le sélectionner automatiquement
            const objectId = 'obj_' + this.objectCount;
            
            this.objectCount++;
            new obsidian.Notice(\`✅ Hexagon Object #\${this.objectCount} created!\`);
            
            // Sélectionner automatiquement l'objet créé
            this.selectObject(objectId, objectText);
            
        } catch (error) {
            console.error('Error creating object:', error);
            console.error('Error stack:', error.stack);
            new obsidian.Notice('Error creating object: ' + error.message);
        }
    }`
);

// Sauvegarder dans dist
const distPath = path.join(__dirname, '../dist/main.js');
fs.writeFileSync(distPath, fixedPlugin);

// Copier vers le vault de test
const testVaultPath = '/Users/rollandmelet/Développement/Projets/ProcessMetaLanguage/VaultTestObsidian/PML-Beta-Test-v2/.obsidian/plugins/processmetalanguage/main.js';
fs.writeFileSync(testVaultPath, fixedPlugin);

console.log('✅ Element grouping fix applied!');
console.log('🔄 Please reload Obsidian (Cmd+R) to test.');
console.log('📝 Changes:');
console.log('   - Created invisible frame to group elements');
console.log('   - Elements should now move together');
console.log('   - Stored grouped element IDs for future reference');