// <!-- START OF FILE: simplify-plugin.js -->
// FILENAME: simplify-plugin.js
// Version: 1.0.0
// Date: 2025-08-01 18:20
// Author: Rolland MELET & Claude Code
// Description: Version simplifiée du plugin sans groupes

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const simplifiedPlugin = `
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
                    Create Object
                </button>
                <button class="pml-button" onclick="app.plugins.plugins.processmetalanguage.createState()">
                    Create State
                </button>
                <button class="pml-button" onclick="app.plugins.plugins.processmetalanguage.createAction()">
                    Create Action
                </button>
                <div class="pml-section">
                    <div class="pml-status">
                        ✅ Plugin v1.0.0-beta.1
                    </div>
                    <div class="pml-status">
                        📊 Beta Test Mode
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
            
            // Position au centre du viewport (simplified)
            const centerX = 400;
            const centerY = 300;
            
            // Créer un rectangle arrondi (représentant l'objet)
            ea.addRect(
                centerX - PML_CONFIG.objectSize.width / 2,
                centerY - PML_CONFIG.objectSize.height / 2,
                PML_CONFIG.objectSize.width,
                PML_CONFIG.objectSize.height
            );
            
            // Style
            ea.setFillStyle("solid");
            ea.setBackgroundColor(PML_CONFIG.colors.object);
            ea.setStrokeColor("#000000");
            ea.setRoughness(0);
            ea.setRoundness(3);
            
            // Ajouter le texte
            ea.addText(
                centerX - 35,
                centerY - 10,
                "New Object",
                {
                    fontSize: 16,
                    fontFamily: 1,
                    textAlign: "center"
                }
            );
            
            // Ajouter le tag ProcessMetaLanguage
            ea.addText(
                centerX - 50,
                centerY + 50,
                "#process-object",
                {
                    fontSize: 12,
                    fontFamily: 1,
                    textAlign: "center"
                }
            );
            
            // Ajouter à la canvas sans groupes
            await ea.create();
            
            new obsidian.Notice('✅ Object created successfully!');
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
            
            // Créer état (bannière)
            ea.addRect(
                centerX - PML_CONFIG.stateSize.width / 2,
                centerY - PML_CONFIG.stateSize.height / 2,
                PML_CONFIG.stateSize.width,
                PML_CONFIG.stateSize.height
            );
            
            ea.setFillStyle("solid");
            ea.setBackgroundColor(PML_CONFIG.colors.state);
            ea.setStrokeColor("#000000");
            ea.setRoughness(0);
            
            // Texte
            ea.addText(
                centerX - 15,
                centerY - 8,
                "State",
                {
                    fontSize: 14,
                    fontFamily: 1,
                    textAlign: "center"
                }
            );
            
            // Tag
            ea.addText(
                centerX - 35,
                centerY + 30,
                "#process-state",
                {
                    fontSize: 10,
                    fontFamily: 1
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
            
            // Créer action
            ea.addRect(
                centerX - PML_CONFIG.actionSize.width / 2,
                centerY - PML_CONFIG.actionSize.height / 2,
                PML_CONFIG.actionSize.width,
                PML_CONFIG.actionSize.height
            );
            
            ea.setFillStyle("solid");
            ea.setBackgroundColor(PML_CONFIG.colors.action);
            ea.setStrokeColor("#000000");
            ea.setRoughness(0);
            ea.setRoundness(2);
            
            // Texte
            ea.addText(
                centerX - 25,
                centerY - 8,
                "Main Action",
                {
                    fontSize: 16,
                    fontFamily: 1,
                    textAlign: "center"
                }
            );
            
            // Tag
            ea.addText(
                centerX - 40,
                centerY + 40,
                "#process-action",
                {
                    fontSize: 10,
                    fontFamily: 1
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
                padding: 8px 12px;
                background: var(--interactive-normal);
                border: 1px solid var(--background-modifier-border);
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                text-align: center;
            }
            
            .pml-button:hover {
                background: var(--interactive-hover);
            }
            
            .pml-section {
                margin-top: 15px;
                padding-top: 10px;
                border-top: 1px solid var(--background-modifier-border);
            }
            
            .pml-status {
                margin-top: 8px;
                font-size: 12px;
                color: var(--text-muted);
            }
            
            .pml-success {
                color: var(--text-success);
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
fs.writeFileSync(distPath, simplifiedPlugin);

// Copier vers le vault de test
const testVaultPath = '/Users/rollandmelet/Développement/Projets/ProcessMetaLanguage/VaultTestObsidian/PML-Beta-Test-v2/.obsidian/plugins/processmetalanguage/main.js';
fs.writeFileSync(testVaultPath, simplifiedPlugin);

console.log('✅ Simplified plugin created!');
console.log('🔄 Please reload Obsidian (Cmd+R) to test.');