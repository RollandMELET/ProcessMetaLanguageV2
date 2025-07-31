// <!-- START OF FILE: fix-element-grouping-v2.js -->
// FILENAME: fix-element-grouping-v2.js
// Version: 1.0.0
// Date: 2025-01-31 21:35
// Author: Rolland MELET & Claude Code
// Description: Correction du groupement avec l'API native d'Excalidraw

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Lire le plugin actuel
const currentPlugin = fs.readFileSync(path.join(__dirname, '../dist/main.js'), 'utf8');

// Modifier la fonction createObject pour utiliser le groupement natif
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
            
            // Créer un groupe qui contient tous les éléments
            // On va créer tous les éléments d'abord, puis les grouper
            const elements = [];
            
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
            if (hexagonId) elements.push(hexagonId);
            
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
            if (textId) elements.push(textId);
            
            // Style du tag
            ea.style.fontSize = 10;
            ea.style.strokeColor = "#666666";
            
            // Ajouter le tag sous l'hexagone
            const tagY = centerY + radius + 20;
            const tagId = ea.addText(centerX - 40, tagY, "#process-object");
            if (tagId) elements.push(tagId);
            
            // Essayer de grouper avec l'API Excalidraw
            if (ea.group && elements.length > 0) {
                console.log('Trying to group elements with ea.group():', elements);
                ea.group(elements);
            } else {
                console.log('ea.group not available or no elements to group');
                // Alternative: créer le groupe manuellement après création
                await ea.create({
                    filename: "ProcessMetaLanguage.excalidraw",
                    onNewPane: false
                });
                
                // Après création, essayer de grouper via l'API de la vue
                setTimeout(() => {
                    if (view.excalidraw && view.excalidraw.getSceneElements) {
                        const sceneElements = view.excalidraw.getSceneElements();
                        const lastElements = sceneElements.slice(-3); // Les 3 derniers éléments créés
                        
                        if (lastElements.length === 3 && view.excalidraw.group) {
                            console.log('Grouping elements after creation');
                            view.excalidraw.group(lastElements.map(el => el.id));
                        }
                    }
                }, 100);
                
                // Stocker l'objet
                const objectId = 'obj_' + this.objectCount;
                this.elements.set(objectId, { x: centerX, y: centerY });
                
                this.objectCount++;
                new obsidian.Notice(\`✅ Hexagon Object #\${this.objectCount} created!\`);
                
                // Sélectionner automatiquement l'objet créé
                this.selectObject(objectId, objectText);
                return;
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

console.log('✅ Element grouping fix v2 applied!');
console.log('🔄 Please reload Obsidian (Cmd+R) to test.');
console.log('📝 Changes:');
console.log('   - Uses native Excalidraw grouping API');
console.log('   - Fallback to post-creation grouping');
console.log('   - No invisible frames');