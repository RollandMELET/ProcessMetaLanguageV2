// <!-- START OF FILE: final-working-plugin.js -->
// FILENAME: final-working-plugin.js
// Version: 1.0.0
// Date: 2025-08-01 18:30
// Author: Rolland MELET & Claude Code
// Description: Version finale fonctionnelle du plugin pour beta test

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const finalPlugin = `
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
                    🔷 Create Object
                </button>
                <button class="pml-button" onclick="app.plugins.plugins.processmetalanguage.createState()">
                    🚩 Create State
                </button>
                <button class="pml-button" onclick="app.plugins.plugins.processmetalanguage.createAction()">
                    ⚡ Create Action
                </button>
                <div class="pml-section">
                    <div class="pml-status">
                        ✅ Plugin v1.0.0-beta.1
                    </div>
                    <div class="pml-status">
                        📊 Beta Test Mode
                    </div>
                    <div class="pml-status pml-help">
                        💡 Click buttons to add elements
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
            
            // Configurer la vue pour ExcalidrawAutomate
            ea.setView(view);
            ea.clear();
            
            // Position au centre du viewport
            const centerX = 400;
            const centerY = 300;
            
            // Style pour l'objet
            const objectStyle = {
                backgroundColor: PML_CONFIG.colors.object,
                strokeColor: "#000000",
                fillStyle: "solid",
                strokeWidth: 2,
                roughness: 0,
                roundness: { type: 3, value: 15 }
            };
            
            // Créer un rectangle arrondi (représentant l'objet)
            const id = ea.addRect(
                centerX - PML_CONFIG.objectSize.width / 2,
                centerY - PML_CONFIG.objectSize.height / 2,
                PML_CONFIG.objectSize.width,
                PML_CONFIG.objectSize.height,
                objectStyle
            );
            
            // Ajouter le texte
            ea.addText(
                centerX - 35,
                centerY - 10,
                "New Object",
                {
                    fontSize: 16,
                    fontFamily: 1,
                    textAlign: "center",
                    verticalAlign: "middle"
                }
            );
            
            // Ajouter le tag ProcessMetaLanguage
            ea.addText(
                centerX - 50,
                centerY + 50,
                "#process-object",
                {
                    fontSize: 10,
                    fontFamily: 3,
                    textAlign: "center",
                    strokeColor: "#666666"
                }
            );
            
            // Ajouter à la canvas
            await ea.create();
            
            new obsidian.Notice('✅ Object created successfully!');
            console.log('Object created with ID:', id);
            
        } catch (error) {
            console.error('Error creating object:', error);
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
            
            // Position
            const centerX = 400;
            const centerY = 400;
            
            // Style pour l'état
            const stateStyle = {
                backgroundColor: PML_CONFIG.colors.state,
                strokeColor: "#000000",
                fillStyle: "solid",
                strokeWidth: 2,
                roughness: 0
            };
            
            // Créer état (bannière)
            ea.addRect(
                centerX - PML_CONFIG.stateSize.width / 2,
                centerY - PML_CONFIG.stateSize.height / 2,
                PML_CONFIG.stateSize.width,
                PML_CONFIG.stateSize.height,
                stateStyle
            );
            
            // Texte
            ea.addText(
                centerX - 15,
                centerY - 8,
                "State",
                {
                    fontSize: 14,
                    fontFamily: 1,
                    textAlign: "center",
                    verticalAlign: "middle",
                    strokeColor: "#FFFFFF"
                }
            );
            
            // Tag
            ea.addText(
                centerX - 35,
                centerY + 30,
                "#process-state",
                {
                    fontSize: 10,
                    fontFamily: 3,
                    strokeColor: "#666666"
                }
            );
            
            await ea.create();
            
            new obsidian.Notice('✅ State created successfully!');
            
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
            
            // Position
            const centerX = 400;
            const centerY = 500;
            
            // Style pour l'action
            const actionStyle = {
                backgroundColor: PML_CONFIG.colors.action,
                strokeColor: "#000000",
                fillStyle: "solid",
                strokeWidth: 2,
                roughness: 0,
                roundness: { type: 2, value: 10 }
            };
            
            // Créer action
            ea.addRect(
                centerX - PML_CONFIG.actionSize.width / 2,
                centerY - PML_CONFIG.actionSize.height / 2,
                PML_CONFIG.actionSize.width,
                PML_CONFIG.actionSize.height,
                actionStyle
            );
            
            // Texte
            ea.addText(
                centerX - 35,
                centerY - 8,
                "Main Action",
                {
                    fontSize: 16,
                    fontFamily: 1,
                    textAlign: "center",
                    verticalAlign: "middle"
                }
            );
            
            // Tag
            ea.addText(
                centerX - 40,
                centerY + 40,
                "#process-action",
                {
                    fontSize: 10,
                    fontFamily: 3,
                    strokeColor: "#666666"
                }
            );
            
            await ea.create();
            
            new obsidian.Notice('✅ Action created successfully!');
            
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
                width: 250px;
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
fs.writeFileSync(distPath, finalPlugin);

// Copier vers le vault de test
const testVaultPath = '/Users/rollandmelet/Développement/Projets/ProcessMetaLanguage/VaultTestObsidian/PML-Beta-Test-v2/.obsidian/plugins/processmetalanguage/main.js';
fs.writeFileSync(testVaultPath, finalPlugin);

console.log('✅ Final working plugin created!');
console.log('🔄 Please reload Obsidian (Cmd+R) to test.');