// <!-- START OF FILE: fix-split-error.js -->
// FILENAME: fix-split-error.js
// Version: 1.0.0
// Date: 2025-01-31 20:00
// Author: Rolland MELET & Claude Code
// Description: Correction de l'erreur split avec addText

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fixSplitPlugin = `
var obsidian = require('obsidian');

// Configuration basique
const PML_CONFIG = {
    objectSize: { width: 120, height: 80 },
    stateSize: { width: 80, height: 40 },
    actionSize: { width: 140, height: 60 },
    colors: {
        object: '#3498db',
        state: '#e74c3c',
        action: '#2ecc71',
        secondaryAction: '#f39c12'
    }
};

class ProcessMetaLanguagePlugin extends obsidian.Plugin {
    constructor() {
        super(...arguments);
        this.objectCount = 0;
        this.stateCount = 0;
        this.actionCount = 0;
    }

    async onload() {
        console.log('ProcessMetaLanguage: Plugin loading...');
        
        this.excalidrawAPI = null;
        this.interfaceVisible = false;
        
        // Commande de test
        this.addCommand({
            id: 'pml-test',
            name: 'Test ProcessMetaLanguage',
            callback: () => {
                new obsidian.Notice('ProcessMetaLanguage v1.0.0-beta.1 is working!');
            }
        });
        
        // Commande pour toggle interface
        this.addCommand({
            id: 'pml-toggle-interface',
            name: 'Toggle Interface',
            callback: () => this.toggleInterface()
        });
        
        // Commande pour créer un objet
        this.addCommand({
            id: 'pml-create-object',
            name: 'Create Object',
            callback: () => this.createObject()
        });
        
        // Vérifier ExcalidrawAutomate périodiquement
        this.registerInterval(
            window.setInterval(() => {
                if (typeof ExcalidrawAutomate !== 'undefined' && !this.excalidrawAPI) {
                    this.excalidrawAPI = ExcalidrawAutomate;
                    console.log('ProcessMetaLanguage: ExcalidrawAutomate connected!');
                    this.initializeFullPlugin();
                }
            }, 1000)
        );
        
        console.log('ProcessMetaLanguage: Plugin loaded successfully');
    }
    
    async initializeFullPlugin() {
        // Ajouter plus de commandes
        this.addCommand({
            id: 'pml-create-state',
            name: 'Create State',
            callback: () => this.createState()
        });
        
        this.addCommand({
            id: 'pml-create-action',
            name: 'Create Action',
            callback: () => this.createAction()
        });
        
        console.log('ProcessMetaLanguage: Full features initialized');
    }
    
    async toggleInterface() {
        if (!this.excalidrawAPI) {
            new obsidian.Notice('Please open an Excalidraw drawing first!');
            return;
        }
        
        this.interfaceVisible = !this.interfaceVisible;
        
        if (this.interfaceVisible) {
            this.showInterface();
        } else {
            this.hideInterface();
        }
    }
    
    getActiveExcalidrawView() {
        const activeView = this.app.workspace.getActiveViewOfType(obsidian.View);
        if (activeView && activeView.getViewType() === 'excalidraw') {
            return activeView;
        }
        return null;
    }
    
    showInterface() {
        // Créer une interface simple
        const container = document.createElement('div');
        container.id = 'pml-interface';
        container.className = 'pml-interface';
        container.innerHTML = \`
            <div class="pml-toolbar">
                <h3>ProcessMetaLanguage</h3>
                <button class="pml-button" onclick="app.plugins.plugins.processmetalanguage.createObject()">
                    🔷 Create Object (Hexagon)
                </button>
                <button class="pml-button" onclick="app.plugins.plugins.processmetalanguage.createState()">
                    🚩 Create State (Banner)
                </button>
                <button class="pml-button" onclick="app.plugins.plugins.processmetalanguage.createAction()">
                    ⚡ Create Action (Rectangle)
                </button>
                <div class="pml-section">
                    <div class="pml-status">
                        ✅ Plugin v1.0.0-beta.1
                    </div>
                    <div class="pml-status">
                        📊 Beta Test Mode
                    </div>
                    <div class="pml-status pml-help">
                        💡 Fixed split error
                    </div>
                </div>
            </div>
        \`;
        
        document.body.appendChild(container);
        
        // Ajouter les styles
        this.addStyles();
        
        new obsidian.Notice('ProcessMetaLanguage Interface opened');
    }
    
    hideInterface() {
        const container = document.getElementById('pml-interface');
        if (container) {
            container.remove();
        }
        new obsidian.Notice('ProcessMetaLanguage Interface closed');
    }
    
    async createObject() {
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
            ea.clear(); // Clear pour éviter l'accumulation dans ea
            
            // Position avec décalage pour éviter la superposition
            const offset = this.objectCount * 150;
            const centerX = 400 + offset;
            const centerY = 300;
            
            // Dimensions de l'hexagone
            const width = PML_CONFIG.objectSize.width;
            const height = PML_CONFIG.objectSize.height;
            
            // Calculer les 6 points de l'hexagone (pointe en haut)
            const points = [];
            for (let i = 0; i < 6; i++) {
                // Rotation de -90 degrés pour avoir la pointe en haut
                const angle = (Math.PI / 3) * i - Math.PI / 2;
                const x = centerX + (width / 2) * Math.cos(angle);
                const y = centerY + (height / 2) * Math.sin(angle);
                points.push([x, y]);
            }
            // Fermer explicitement le polygone en ajoutant le premier point à la fin
            points.push(points[0]);
            
            // Style pour l'hexagone
            ea.style.backgroundColor = PML_CONFIG.colors.object;
            ea.style.strokeColor = "#000000";
            ea.style.fillStyle = "solid";
            ea.style.strokeWidth = 2;
            ea.style.roughness = 0;
            
            // Créer la ligne polygonale fermée (hexagone)
            console.log('Creating hexagon with points:', points);
            ea.addLine(points);
            
            // Style du texte
            ea.style.fontSize = 16;
            ea.style.fontFamily = 1;
            ea.style.textAlign = "center";
            ea.style.verticalAlign = "middle";
            ea.style.strokeColor = "#000000";
            ea.style.backgroundColor = "transparent";
            
            // Ajouter le texte au centre - avec x et y en premier
            const objectText = "Object #" + (this.objectCount + 1);
            console.log('Adding text:', objectText, 'at', centerX, centerY);
            ea.addText(centerX, centerY, objectText, {
                width: width,
                height: 30,
                textAlign: "center",
                verticalAlign: "middle"
            });
            
            // Style du tag
            ea.style.fontSize = 10;
            ea.style.strokeColor = "#666666";
            
            // Ajouter le tag sous l'hexagone
            const tagY = centerY + height/2 + 20;
            ea.addText(centerX, tagY, "#process-object", {
                width: width,
                height: 20,
                textAlign: "center"
            });
            
            // Créer tous les éléments avec des options
            console.log('Calling ea.create() with options...');
            await ea.create({
                filename: "ProcessMetaLanguage.excalidraw",
                onNewPane: false
            });
            
            this.objectCount++;
            new obsidian.Notice(\`✅ Hexagon Object #\${this.objectCount} created!\`);
            console.log(\`Hexagon Object #\${this.objectCount} created successfully\`);
            
        } catch (error) {
            console.error('Error creating object:', error);
            console.error('Error stack:', error.stack);
            new obsidian.Notice('Error creating object: ' + error.message);
        }
    }
    
    async createState() {
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
            ea.clear();
            
            // Position avec décalage
            const offset = this.stateCount * 120;
            const centerX = 400 + offset;
            const centerY = 450;
            
            // Dimensions du fanion
            const width = PML_CONFIG.stateSize.width;
            const height = PML_CONFIG.stateSize.height;
            
            // Points du fanion (rectangle avec pointe à droite)
            const points = [
                [centerX - width/2, centerY - height/2],  // Haut gauche
                [centerX + width/2 - 15, centerY - height/2],  // Haut droit (avant pointe)
                [centerX + width/2, centerY],  // Pointe droite
                [centerX + width/2 - 15, centerY + height/2],  // Bas droit (après pointe)
                [centerX - width/2, centerY + height/2],   // Bas gauche
                [centerX - width/2, centerY - height/2]   // Retour au début pour fermer
            ];
            
            // Style de l'état
            ea.style.backgroundColor = PML_CONFIG.colors.state;
            ea.style.strokeColor = "#000000";
            ea.style.fillStyle = "solid";
            ea.style.strokeWidth = 2;
            ea.style.roughness = 0;
            
            // Créer le fanion
            ea.addLine(points);
            
            // Style du texte
            ea.style.fontSize = 14;
            ea.style.fontFamily = 1;
            ea.style.strokeColor = "#FFFFFF";
            ea.style.backgroundColor = "transparent";
            
            // Texte au centre avec paramètres corrects
            const stateText = "State #" + (this.stateCount + 1);
            ea.addText(centerX - 10, centerY, stateText, {
                width: width - 15,
                height: 20,
                textAlign: "center",
                verticalAlign: "middle"
            });
            
            // Style du tag
            ea.style.fontSize = 10;
            ea.style.strokeColor = "#666666";
            
            // Tag
            ea.addText(centerX, centerY + height/2 + 15, "#process-state", {
                width: width,
                height: 20,
                textAlign: "center"
            });
            
            // Créer avec options
            await ea.create({
                filename: "ProcessMetaLanguage.excalidraw",
                onNewPane: false
            });
            
            this.stateCount++;
            new obsidian.Notice(\`✅ Banner State #\${this.stateCount} created!\`);
            
        } catch (error) {
            console.error('Error creating state:', error);
            new obsidian.Notice('Error creating state: ' + error.message);
        }
    }
    
    async createAction() {
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
            ea.clear();
            
            // Position avec décalage
            const offset = this.actionCount * 160;
            const centerX = 400 + offset;
            const centerY = 600;
            
            // Style de l'action
            ea.style.backgroundColor = PML_CONFIG.colors.action;
            ea.style.strokeColor = "#000000";
            ea.style.fillStyle = "solid";
            ea.style.strokeWidth = 2;
            ea.style.roughness = 0;
            ea.style.roundness = { type: 2 };
            
            // Créer rectangle arrondi pour l'action
            ea.addRect(
                centerX - PML_CONFIG.actionSize.width / 2,
                centerY - PML_CONFIG.actionSize.height / 2,
                PML_CONFIG.actionSize.width,
                PML_CONFIG.actionSize.height
            );
            
            // Style du texte
            ea.style.fontSize = 16;
            ea.style.fontFamily = 1;
            ea.style.strokeColor = "#000000";
            ea.style.backgroundColor = "transparent";
            
            // Texte
            const actionText = "Action #" + (this.actionCount + 1);
            ea.addText(centerX, centerY, actionText, {
                width: PML_CONFIG.actionSize.width,
                height: 30,
                textAlign: "center",
                verticalAlign: "middle"
            });
            
            // Style du tag
            ea.style.fontSize = 10;
            ea.style.strokeColor = "#666666";
            
            // Tag
            ea.addText(centerX, centerY + PML_CONFIG.actionSize.height/2 + 15, "#process-action", {
                width: PML_CONFIG.actionSize.width,
                height: 20,
                textAlign: "center"
            });
            
            // Créer avec options
            await ea.create({
                filename: "ProcessMetaLanguage.excalidraw",
                onNewPane: false
            });
            
            this.actionCount++;
            new obsidian.Notice(\`✅ Action #\${this.actionCount} created!\`);
            
        } catch (error) {
            console.error('Error creating action:', error);
            new obsidian.Notice('Error creating action: ' + error.message);
        }
    }
    
    addStyles() {
        const style = document.createElement('style');
        style.textContent = \`
            .pml-interface {
                position: fixed;
                right: 20px;
                top: 100px;
                width: 280px;
                background: var(--background-primary);
                border: 1px solid var(--background-modifier-border);
                border-radius: 8px;
                padding: 15px;
                z-index: 1000;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
            }
            
            .pml-toolbar {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            
            .pml-toolbar h3 {
                margin: 0 0 10px 0;
                font-size: 16px;
                text-align: center;
                padding-bottom: 10px;
                border-bottom: 1px solid var(--background-modifier-border);
            }
            
            .pml-button {
                padding: 10px 12px;
                background: var(--interactive-normal);
                border: 1px solid var(--background-modifier-border);
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                text-align: left;
                transition: all 0.2s;
            }
            
            .pml-button:hover {
                background: var(--interactive-hover);
                transform: translateX(2px);
            }
            
            .pml-section {
                margin-top: 15px;
                padding-top: 10px;
                border-top: 1px solid var(--background-modifier-border);
            }
            
            .pml-status {
                margin-top: 6px;
                font-size: 12px;
                color: var(--text-muted);
            }
            
            .pml-help {
                font-style: italic;
            }
        \`;
        document.head.appendChild(style);
    }
    
    onunload() {
        this.hideInterface();
        console.log('ProcessMetaLanguage: Plugin unloaded');
    }
}

module.exports = ProcessMetaLanguagePlugin;
`;

// Sauvegarder dans dist
const distPath = path.join(__dirname, '../dist/main.js');
fs.writeFileSync(distPath, fixSplitPlugin);

// Copier vers le vault de test
const testVaultPath = '/Users/rollandmelet/Développement/Projets/ProcessMetaLanguage/VaultTestObsidian/PML-Beta-Test-v2/.obsidian/plugins/processmetalanguage/main.js';
fs.writeFileSync(testVaultPath, fixSplitPlugin);

console.log('✅ Fix split error plugin created!');
console.log('🔄 Please reload Obsidian (Cmd+R) to test.');
console.log('📝 Changes:');
console.log('   - Changed addText signature: x, y, text, options');
console.log('   - Added width/height options for text alignment');
console.log('   - This should resolve the split error');