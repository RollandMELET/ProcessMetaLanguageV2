// <!-- START OF FILE: create-working-plugin.js -->
// FILENAME: create-working-plugin.js
// Version: 1.0.0
// Date: 2025-08-01 18:00
// Author: Rolland MELET & Claude Code
// Description: Crée un plugin fonctionnel avec les fonctionnalités de base

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const workingPlugin = `
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
                <div class="pml-status">
                    Status: <span class="pml-success">Ready</span>
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
            const api = ea.getExcalidrawAPI();
            
            // Position au centre du viewport
            const viewportCenter = {
                x: api.getAppState().scrollX + window.innerWidth / 2,
                y: api.getAppState().scrollY + window.innerHeight / 2
            };
            
            // Créer un hexagone
            const hexagon = {
                type: "ellipse",
                x: viewportCenter.x - PML_CONFIG.objectSize.width / 2,
                y: viewportCenter.y - PML_CONFIG.objectSize.height / 2,
                width: PML_CONFIG.objectSize.width,
                height: PML_CONFIG.objectSize.height,
                backgroundColor: PML_CONFIG.colors.object,
                strokeColor: "#000000",
                roughness: 0
            };
            
            const id = await ea.addElement(hexagon);
            
            // Ajouter le texte
            const text = {
                type: "text",
                x: viewportCenter.x - 30,
                y: viewportCenter.y - 10,
                text: "New Object",
                fontSize: 16,
                fontFamily: 1
            };
            
            await ea.addElement(text);
            
            new obsidian.Notice('Object created successfully!');
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
        
        new obsidian.Notice('State creation coming soon!');
    }
    
    async createAction() {
        if (!this.excalidrawAPI) {
            new obsidian.Notice('Please open an Excalidraw drawing first!');
            return;
        }
        
        new obsidian.Notice('Action creation coming soon!');
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
            }
            
            .pml-button {
                padding: 8px 12px;
                background: var(--interactive-normal);
                border: 1px solid var(--background-modifier-border);
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
            }
            
            .pml-button:hover {
                background: var(--interactive-hover);
            }
            
            .pml-status {
                margin-top: 10px;
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
fs.writeFileSync(distPath, workingPlugin);

// Copier vers le vault de test
const testVaultPath = '/Users/rollandmelet/Développement/Projets/ProcessMetaLanguage/VaultTestObsidian/PML-Beta-Test-v2/.obsidian/plugins/processmetalanguage/main.js';
fs.writeFileSync(testVaultPath, workingPlugin);

console.log('✅ Working plugin created with basic features!');
console.log('🔄 Please reload Obsidian (Cmd+R) to test the new version.');