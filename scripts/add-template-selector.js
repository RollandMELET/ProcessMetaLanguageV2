// <!-- START OF FILE: add-template-selector.js -->
// FILENAME: add-template-selector.js
// Version: 1.0.0
// Date: 2025-01-31 20:45
// Author: Rolland MELET & Claude Code
// Description: Ajout du sélecteur de templates EPCIS au plugin

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const addTemplateSelectorPlugin = `
var obsidian = require('obsidian');

// Configuration basique
const PML_CONFIG = {
    objectSize: { width: 120, height: 120 }, // Hexagone régulier
    stateSize: { width: 100, height: 50 },   // Fanion plus grand et mieux proportionné
    actionSize: { width: 140, height: 60 },
    colors: {
        object: '#3498db',
        state: '#e74c3c',
        action: '#2ecc71',
        secondaryAction: '#f39c12'
    }
};

// Templates EPCIS 2.0
const EPCIS_TEMPLATES = {
    businessSteps: [
        'accepting', 'arriving', 'assembling', 'collecting', 'commissioning',
        'consigning', 'creating_class_instance', 'cycle_counting', 'decommissioning',
        'departing', 'destroying', 'disassembling', 'dispensing', 'encoding',
        'entering_exiting', 'holding', 'inspecting', 'installing', 'killing',
        'loading', 'observing', 'packing', 'picking', 'receiving', 'removing',
        'repackaging', 'repairing', 'replacing', 'reserving', 'retail_selling',
        'sampling', 'sensor_reporting', 'shipping', 'staging_outbound',
        'stock_taking', 'stocking', 'storing', 'transporting', 'unloading',
        'unpacking', 'void_shipping'
    ],
    dispositions: [
        'active', 'available', 'completeness_inferred', 'completeness_verified',
        'conformant', 'container_closed', 'container_open', 'damaged', 'destroyed',
        'dispensed', 'disposed', 'encoded', 'expired', 'in_progress', 'in_transit',
        'inactive', 'mismatch_instance', 'mismatch_class', 'mismatch_quantity',
        'needs_replacement', 'non_conformant', 'non_sellable_other',
        'partially_dispensed', 'recalled', 'reserved', 'retail_sold', 'returned',
        'sellable_accessible', 'sellable_not_accessible', 'stolen', 'unknown'
    ]
};

class ProcessMetaLanguagePlugin extends obsidian.Plugin {
    constructor() {
        super(...arguments);
        this.objectCount = 0;
        this.stateCount = 0;
        this.actionCount = 0;
        this.templatesVisible = false;
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
                    <button class="pml-button pml-templates-button" onclick="app.plugins.plugins.processmetalanguage.toggleTemplates()">
                        📋 Templates EPCIS
                    </button>
                </div>
                
                <div id="pml-templates-panel" class="pml-templates-panel" style="display: none;">
                    <h4>EPCIS 2.0 Templates</h4>
                    
                    <div class="pml-template-category">
                        <label>Business Steps (41)</label>
                        <select id="pml-business-steps" class="pml-select">
                            <option value="">Select business step...</option>
                            \${EPCIS_TEMPLATES.businessSteps.map(step => 
                                \`<option value="\${step}">\${step.replace(/_/g, ' ')}</option>\`
                            ).join('')}
                        </select>
                        <button class="pml-button pml-button-small" onclick="app.plugins.plugins.processmetalanguage.applyBusinessStep()">
                            Apply
                        </button>
                    </div>
                    
                    <div class="pml-template-category">
                        <label>Dispositions (25)</label>
                        <select id="pml-dispositions" class="pml-select">
                            <option value="">Select disposition...</option>
                            \${EPCIS_TEMPLATES.dispositions.map(disp => 
                                \`<option value="\${disp}">\${disp.replace(/_/g, ' ')}</option>\`
                            ).join('')}
                        </select>
                        <button class="pml-button pml-button-small" onclick="app.plugins.plugins.processmetalanguage.applyDisposition()">
                            Apply
                        </button>
                    </div>
                </div>
                
                <div class="pml-section">
                    <div class="pml-status">
                        ✅ Plugin v1.0.0-beta.1
                    </div>
                    <div class="pml-status">
                        📊 Beta Test Mode
                    </div>
                    <div class="pml-status pml-help">
                        💡 Templates ready
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
    
    toggleTemplates() {
        const panel = document.getElementById('pml-templates-panel');
        if (panel) {
            this.templatesVisible = !this.templatesVisible;
            panel.style.display = this.templatesVisible ? 'block' : 'none';
        }
    }
    
    async applyBusinessStep() {
        const select = document.getElementById('pml-business-steps');
        if (!select || !select.value) {
            new obsidian.Notice('Please select a business step');
            return;
        }
        
        const businessStep = select.value;
        new obsidian.Notice(\`Applied business step: \${businessStep}\`);
        
        // Créer un objet avec le business step
        await this.createTemplatedObject('Business Step', businessStep);
    }
    
    async applyDisposition() {
        const select = document.getElementById('pml-dispositions');
        if (!select || !select.value) {
            new obsidian.Notice('Please select a disposition');
            return;
        }
        
        const disposition = select.value;
        new obsidian.Notice(\`Applied disposition: \${disposition}\`);
        
        // Créer un état avec la disposition
        await this.createTemplatedState('Disposition', disposition);
    }
    
    async createTemplatedObject(type, template) {
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
            
            // Position
            const offset = this.objectCount * 150;
            const centerX = 400 + offset;
            const centerY = 300;
            const radius = 60;
            
            // Style
            ea.style.backgroundColor = PML_CONFIG.colors.object;
            ea.style.strokeColor = "#000000";
            ea.style.fillStyle = "solid";
            ea.style.strokeWidth = 2;
            ea.style.roughness = 0;
            
            // Hexagone
            if (ea.addPolygon) {
                ea.addPolygon(centerX, centerY, radius, 6);
            } else {
                const points = [];
                for (let i = 0; i < 6; i++) {
                    const angle = (Math.PI / 3) * i - Math.PI / 2;
                    const x = centerX + radius * Math.cos(angle);
                    const y = centerY + radius * Math.sin(angle);
                    points.push([x, y]);
                }
                points.push(points[0]);
                ea.addLine(points);
            }
            
            // Texte
            ea.style.fontSize = 14;
            ea.style.fontFamily = 1;
            ea.style.strokeColor = "#000000";
            ea.style.backgroundColor = "transparent";
            
            const objectText = template.replace(/_/g, ' ');
            ea.addText(centerX - objectText.length * 4, centerY - 10, objectText);
            
            // Tag
            ea.style.fontSize = 10;
            ea.style.strokeColor = "#666666";
            ea.addText(centerX - 40, centerY + radius + 20, "#process-object");
            
            // Métadonnées EPCIS
            ea.style.fontSize = 9;
            ea.style.strokeColor = "#999999";
            ea.addText(centerX - 50, centerY + radius + 35, \`EPCIS: \${type}\`);
            
            await ea.create({
                filename: "ProcessMetaLanguage.excalidraw",
                onNewPane: false
            });
            
            this.objectCount++;
            new obsidian.Notice(\`✅ \${type} Object created: \${template}\`);
            
        } catch (error) {
            console.error('Error creating templated object:', error);
            new obsidian.Notice('Error: ' + error.message);
        }
    }
    
    async createTemplatedState(type, template) {
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
            
            // Position
            const offset = this.stateCount * 130;
            const centerX = 400 + offset;
            const centerY = 450;
            const width = PML_CONFIG.stateSize.width;
            const height = PML_CONFIG.stateSize.height;
            
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
            
            // Style
            ea.style.backgroundColor = PML_CONFIG.colors.state;
            ea.style.strokeColor = "#000000";
            ea.style.fillStyle = "solid";
            ea.style.strokeWidth = 2;
            ea.style.roughness = 0;
            
            ea.addLine(points);
            
            // Texte
            ea.style.fontSize = 12;
            ea.style.fontFamily = 1;
            ea.style.strokeColor = "#FFFFFF";
            ea.style.backgroundColor = "transparent";
            
            const stateText = template.replace(/_/g, ' ');
            ea.addText(centerX - stateText.length * 3, centerY - 7, stateText);
            
            // Tag
            ea.style.fontSize = 10;
            ea.style.strokeColor = "#666666";
            ea.addText(centerX - 40, centerY + height/2 + 15, "#process-state");
            
            // Métadonnées EPCIS
            ea.style.fontSize = 9;
            ea.style.strokeColor = "#999999";
            ea.addText(centerX - 50, centerY + height/2 + 30, \`EPCIS: \${type}\`);
            
            await ea.create({
                filename: "ProcessMetaLanguage.excalidraw",
                onNewPane: false
            });
            
            this.stateCount++;
            new obsidian.Notice(\`✅ \${type} State created: \${template}\`);
            
        } catch (error) {
            console.error('Error creating templated state:', error);
            new obsidian.Notice('Error: ' + error.message);
        }
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
            
            // Position avec décalage pour éviter la superposition
            const offset = this.objectCount * 150;
            const centerX = 400 + offset;
            const centerY = 300;
            
            // Rayon de l'hexagone régulier
            const radius = 60;
            
            // Style pour l'hexagone
            ea.style.backgroundColor = PML_CONFIG.colors.object;
            ea.style.strokeColor = "#000000";
            ea.style.fillStyle = "solid";
            ea.style.strokeWidth = 2;
            ea.style.roughness = 0;
            
            // Créer l'hexagone avec addPolygon si disponible, sinon utiliser addLine
            if (ea.addPolygon) {
                // Utiliser addPolygon si disponible
                console.log('Using addPolygon for hexagon');
                ea.addPolygon(centerX, centerY, radius, 6);
            } else {
                // Sinon, utiliser addLine avec les points calculés
                console.log('Using addLine for hexagon');
                const points = [];
                for (let i = 0; i < 6; i++) {
                    const angle = (Math.PI / 3) * i - Math.PI / 2;
                    const x = centerX + radius * Math.cos(angle);
                    const y = centerY + radius * Math.sin(angle);
                    points.push([x, y]);
                }
                points.push(points[0]); // Fermer le polygone
                ea.addLine(points);
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
            ea.addText(centerX - 40, centerY - 10, objectText);
            
            // Style du tag
            ea.style.fontSize = 10;
            ea.style.strokeColor = "#666666";
            
            // Ajouter le tag sous l'hexagone
            const tagY = centerY + radius + 20;
            ea.addText(centerX - 40, tagY, "#process-object");
            
            // Créer tous les éléments
            console.log('Calling ea.create()...');
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
            
            // Position avec décalage
            const offset = this.stateCount * 130;
            const centerX = 400 + offset;
            const centerY = 450;
            
            // Dimensions du fanion
            const width = PML_CONFIG.stateSize.width;
            const height = PML_CONFIG.stateSize.height;
            
            // Points du fanion - forme plus stable et reconnaissable
            const points = [
                [centerX - width/2, centerY - height/2],          // Haut gauche
                [centerX + width/2 - 20, centerY - height/2],     // Haut droit (avant encoche)
                [centerX + width/2, centerY - height/2 + 15],     // Début encoche haute
                [centerX + width/2 - 15, centerY],                // Milieu encoche
                [centerX + width/2, centerY + height/2 - 15],     // Fin encoche basse
                [centerX + width/2 - 20, centerY + height/2],     // Bas droit (après encoche)
                [centerX - width/2, centerY + height/2],          // Bas gauche
                [centerX - width/2, centerY - height/2]           // Retour au début pour fermer
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
            
            // Texte au centre
            const stateText = "State #" + (this.stateCount + 1);
            ea.addText(centerX - 35, centerY - 7, stateText);
            
            // Style du tag
            ea.style.fontSize = 10;
            ea.style.strokeColor = "#666666";
            
            // Tag
            ea.addText(centerX - 40, centerY + height/2 + 15, "#process-state");
            
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
            ea.addText(centerX - 35, centerY - 8, actionText);
            
            // Style du tag
            ea.style.fontSize = 10;
            ea.style.strokeColor = "#666666";
            
            // Tag
            ea.addText(centerX - 40, centerY + PML_CONFIG.actionSize.height/2 + 15, "#process-action");
            
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
                width: 300px;
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
            
            .pml-templates-button {
                background: var(--background-secondary);
            }
            
            .pml-button-small {
                padding: 4px 8px;
                font-size: 12px;
            }
            
            .pml-section {
                margin-top: 15px;
                padding-top: 10px;
                border-top: 1px solid var(--background-modifier-border);
            }
            
            .pml-templates-panel {
                margin-top: 10px;
                padding: 10px;
                background: var(--background-secondary);
                border-radius: 4px;
            }
            
            .pml-templates-panel h4 {
                margin: 0 0 10px 0;
                font-size: 14px;
            }
            
            .pml-template-category {
                margin-bottom: 15px;
            }
            
            .pml-template-category label {
                display: block;
                margin-bottom: 5px;
                font-size: 12px;
                font-weight: bold;
            }
            
            .pml-select {
                width: 100%;
                padding: 5px;
                margin-bottom: 5px;
                background: var(--background-primary);
                border: 1px solid var(--background-modifier-border);
                border-radius: 3px;
                font-size: 12px;
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
fs.writeFileSync(distPath, addTemplateSelectorPlugin);

// Copier vers le vault de test
const testVaultPath = '/Users/rollandmelet/Développement/Projets/ProcessMetaLanguage/VaultTestObsidian/PML-Beta-Test-v2/.obsidian/plugins/processmetalanguage/main.js';
fs.writeFileSync(testVaultPath, addTemplateSelectorPlugin);

console.log('✅ Template selector added to plugin!');
console.log('🔄 Please reload Obsidian (Cmd+R) to test.');
console.log('📝 Changes:');
console.log('   - Added Templates EPCIS button');
console.log('   - Shows 41 business steps + 25 dispositions');
console.log('   - Creates templated objects and states with EPCIS metadata');