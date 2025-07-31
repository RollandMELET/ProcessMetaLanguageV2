// <!-- START OF FILE: pml-plugin-integration.js -->
// FILENAME: pml-plugin-integration.js
// Version: 1.0.0
// Date: 2025-07-31 20:15
// Author: Rolland MELET & Claude Code
// Description: Plugin Obsidian pour intégration interface ProcessMetaLanguage - TASK-F007 Phase 6

/**
 * Module ProcessMetaLanguage - Plugin Obsidian Integration
 * 
 * Plugin Obsidian pour intégrer ProcessMetaLanguage dans l'environnement Obsidian.
 * Fournit commands, ribbon buttons, et intégration native avec ExcalidrawAutomate.
 * 
 * Fonctionnalités:
 * - Command palette integration
 * - Ribbon button pour accès rapide
 * - Status bar indicator
 * - Settings tab pour configuration
 * - Hotkeys customisables
 * - Auto-détection Excalidraw canvas
 */

import { Plugin, Notice, TFile, Modal, Setting } from 'obsidian';
import { ProcessMetaLanguageInterface } from './main-interface.js';

/**
 * Plugin principal ProcessMetaLanguage pour Obsidian
 * @extends Plugin
 */
export default class ProcessMetaLanguagePlugin extends Plugin {
    /**
     * Initialise le plugin ProcessMetaLanguage
     * @sideEffect Configure plugin, ajoute commands, ribbon, status bar
     */
    async onload() {
        console.log('🚀 Chargement ProcessMetaLanguage Plugin...');
        
        // Configuration par défaut
        await this.loadSettings();
        
        // Variables d'état
        this.pmlInterface = null;
        this.isInterfaceVisible = false;
        this.excalidrawAPI = null;
        this.statusBarItem = null;
        
        // Initialiser ExcalidrawAutomate
        await this.initializeExcalidrawAutomate();
        
        // Ajouter ribbon button
        this.addRibbonIcon('gear', 'ProcessMetaLanguage', () => {
            this.toggleInterface();
        });
        
        // Ajouter commands
        this.addCommands();
        
        // Ajouter status bar
        this.addStatusBar();
        
        // Ajouter settings tab
        this.addSettingTab(new ProcessMetaLanguageSettingTab(this.app, this));
        
        // Surveiller ouverture fichiers Excalidraw
        this.registerEvent(
            this.app.workspace.on('file-open', (file) => {
                if (file && this.isExcalidrawFile(file)) {
                    this.onExcalidrawFileOpen(file);
                }
            })
        );
        
        console.log('✅ ProcessMetaLanguage Plugin chargé avec succès');
    }
    
    /**
     * Nettoie le plugin au déchargement
     * @sideEffect Ferme interface, nettoie ressources
     */
    onunload() {
        console.log('🔄 Déchargement ProcessMetaLanguage Plugin...');
        
        if (this.pmlInterface) {
            this.pmlInterface.destroy();
            this.pmlInterface = null;
        }
        
        this.isInterfaceVisible = false;
        
        console.log('✅ ProcessMetaLanguage Plugin déchargé');
    }
    
    /**
     * Initialise ExcalidrawAutomate API
     * @returns {Promise<void>}
     * @private
     */
    async initializeExcalidrawAutomate() {
        try {
            // Attendre que ExcalidrawAutomate soit disponible
            let attempts = 0;
            while (!window.ExcalidrawAutomate && attempts < 50) {
                await this.sleep(100);
                attempts++;
            }
            
            if (window.ExcalidrawAutomate) {
                this.excalidrawAPI = window.ExcalidrawAutomate;
                console.log('✅ ExcalidrawAutomate connecté');
            } else {
                console.warn('⚠️ ExcalidrawAutomate non disponible');
                new Notice('ProcessMetaLanguage: ExcalidrawAutomate non trouvé. Fonctionnalités limitées.');
            }
        } catch (error) {
            console.error('❌ Erreur initialisation ExcalidrawAutomate:', error);
        }
    }
    
    /**
     * Ajoute les commands au command palette
     * @private
     */
    addCommands() {
        // Command principale - Toggle interface
        this.addCommand({
            id: 'toggle-interface',
            name: 'Toggle ProcessMetaLanguage Interface',
            callback: () => {
                this.toggleInterface();
            },
            hotkeys: [{ modifiers: ['Mod', 'Shift'], key: 'p' }]
        });
        
        // Command - Nouveau projet
        this.addCommand({
            id: 'new-project',
            name: 'New ProcessMetaLanguage Project',
            callback: () => {
                this.createNewProject();
            }
        });
        
        // Command - Créer objet
        this.addCommand({
            id: 'create-object',
            name: 'Create Process Object',
            callback: () => {
                this.createComponent('object');
            },
            hotkeys: [{ modifiers: ['Mod', 'Shift'], key: 'o' }]
        });
        
        // Command - Créer état
        this.addCommand({
            id: 'create-state',
            name: 'Create Process State',
            callback: () => {
                this.createComponent('state');
            },
            hotkeys: [{ modifiers: ['Mod', 'Shift'], key: 's' }]
        });
        
        // Command - Créer action
        this.addCommand({
            id: 'create-action',
            name: 'Create Process Action',
            callback: () => {
                this.createComponent('action');
            },
            hotkeys: [{ modifiers: ['Mod', 'Shift'], key: 'a' }]
        });
        
        // Command - Export workflow
        this.addCommand({
            id: 'export-workflow',
            name: 'Export Process Workflow',
            callback: () => {
                this.exportWorkflow();
            }
        });
        
        // Command - Validation processus
        this.addCommand({
            id: 'validate-process',
            name: 'Validate Process Architecture',
            callback: () => {
                this.validateProcess();
            }
        });
        
        // Command - Templates EPCIS
        this.addCommand({
            id: 'open-templates',
            name: 'Open EPCIS Templates',
            callback: () => {
                this.openTemplates();
            }
        });
    }
    
    /**
     * Ajoute la status bar
     * @private
     */
    addStatusBar() {
        this.statusBarItem = this.addStatusBarItem();
        this.updateStatusBar();
    }
    
    /**
     * Met à jour la status bar
     * @private
     */
    updateStatusBar() {
        if (!this.statusBarItem) return;
        
        const status = this.isInterfaceVisible ? 'Active' : 'Inactive';
        const icon = this.isInterfaceVisible ? '🟢' : '⚫';
        
        this.statusBarItem.setText(`${icon} PML: ${status}`);
        this.statusBarItem.title = `ProcessMetaLanguage ${status} - Click to toggle`;
        
        // Rendre cliquable
        this.statusBarItem.onClickEvent(() => {
            this.toggleInterface();
        });
    }
    
    /**
     * Toggle l'interface ProcessMetaLanguage
     */
    async toggleInterface() {
        try {
            if (this.isInterfaceVisible) {
                await this.hideInterface();
            } else {
                await this.showInterface();
            }
        } catch (error) {
            console.error('❌ Erreur toggle interface:', error);
            new Notice(`Erreur: ${error.message}`);
        }
    }
    
    /**
     * Affiche l'interface ProcessMetaLanguage
     */
    async showInterface() {
        if (this.isInterfaceVisible || !this.excalidrawAPI) {
            return;
        }
        
        try {
            // Créer interface si pas déjà fait
            if (!this.pmlInterface) {
                this.pmlInterface = new ProcessMetaLanguageInterface(
                    this.app,
                    this.excalidrawAPI,
                    {
                        theme: this.settings.theme,
                        autoSave: this.settings.autoSave,
                        layout: this.settings.layout
                    }
                );
                
                await this.pmlInterface.initialize();
            }
            
            // Afficher interface
            this.pmlInterface.show();
            this.isInterfaceVisible = true;
            
            // Mettre à jour status bar
            this.updateStatusBar();
            
            new Notice('ProcessMetaLanguage Interface ouverte');
            console.log('👁️ Interface ProcessMetaLanguage affichée');
            
        } catch (error) {
            console.error('❌ Erreur affichage interface:', error);
            new Notice(`Erreur ouverture interface: ${error.message}`);
        }
    }
    
    /**
     * Masque l'interface ProcessMetaLanguage
     */
    async hideInterface() {
        if (!this.isInterfaceVisible || !this.pmlInterface) {
            return;
        }
        
        try {
            this.pmlInterface.hide();
            this.isInterfaceVisible = false;
            
            // Mettre à jour status bar
            this.updateStatusBar();
            
            new Notice('ProcessMetaLanguage Interface fermée');
            console.log('🙈 Interface ProcessMetaLanguage masquée');
            
        } catch (error) {
            console.error('❌ Erreur masquage interface:', error);
        }
    }
    
    /**
     * Vérifie si un fichier est un canvas Excalidraw
     * @param {TFile} file - Fichier à vérifier
     * @returns {boolean} True si fichier Excalidraw
     * @private
     */
    isExcalidrawFile(file) {
        return file && file.extension === 'excalidraw';
    }
    
    /**
     * Callback ouverture fichier Excalidraw
     * @param {TFile} file - Fichier Excalidraw ouvert
     * @private
     */
    async onExcalidrawFileOpen(file) {
        console.log(`📄 Fichier Excalidraw ouvert: ${file.name}`);
        
        // Auto-afficher interface si configuré
        if (this.settings.autoShowOnExcalidraw && !this.isInterfaceVisible) {
            await this.sleep(500); // Attendre que le canvas soit chargé
            await this.showInterface();
        }
        
        // Analyser canvas pour détecter composants ProcessMetaLanguage
        if (this.pmlInterface) {
            // TODO: Analyser canvas et mettre à jour interface
        }
    }
    
    /**
     * Crée un nouveau projet ProcessMetaLanguage
     */
    async createNewProject() {
        const modal = new NewProjectModal(this.app, (projectData) => {
            if (this.pmlInterface) {
                this.pmlInterface.createNewProject(projectData);
            } else {
                // Stocker pour ouverture interface
                this.pendingProject = projectData;
                this.showInterface();
            }
        });
        
        modal.open();
    }
    
    /**
     * Crée un composant ProcessMetaLanguage
     * @param {string} type - Type de composant (object, state, action)
     */
    async createComponent(type) {
        if (!this.excalidrawAPI) {
            new Notice('ExcalidrawAutomate requis pour créer des composants');
            return;
        }
        
        // Vérifier qu'un canvas Excalidraw est ouvert
        const activeView = this.app.workspace.getActiveViewOfType('excalidraw');
        if (!activeView) {
            new Notice('Veuillez ouvrir un canvas Excalidraw');
            return;
        }
        
        try {
            // Afficher interface si pas ouverte
            if (!this.isInterfaceVisible) {
                await this.showInterface();
            }
            
            // Créer composant via interface
            if (this.pmlInterface) {
                await this.pmlInterface.handleComponentCreation(type);
            }
            
        } catch (error) {
            console.error(`❌ Erreur création ${type}:`, error);
            new Notice(`Erreur création ${type}: ${error.message}`);
        }
    }
    
    /**
     * Export le workflow actuel
     */
    async exportWorkflow() {
        if (!this.pmlInterface) {
            new Notice('Interface ProcessMetaLanguage requise');
            return;
        }
        
        try {
            await this.pmlInterface.handleExport('workflow');
        } catch (error) {
            console.error('❌ Erreur export workflow:', error);
            new Notice(`Erreur export: ${error.message}`);
        }
    }
    
    /**
     * Valide le processus actuel
     */
    async validateProcess() {
        if (!this.pmlInterface) {
            new Notice('Interface ProcessMetaLanguage requise');
            return;
        }
        
        try {
            this.pmlInterface.switchView('validation');
            if (!this.isInterfaceVisible) {
                await this.showInterface();
            }
        } catch (error) {
            console.error('❌ Erreur validation:', error);
            new Notice(`Erreur validation: ${error.message}`);
        }
    }
    
    /**
     * Ouvre les templates EPCIS
     */
    async openTemplates() {
        if (!this.pmlInterface) {
            await this.showInterface();
        }
        
        if (this.pmlInterface) {
            this.pmlInterface.switchView('templates');
        }
    }
    
    /**
     * Charge les paramètres du plugin
     */
    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }
    
    /**
     * Sauvegarde les paramètres du plugin
     */
    async saveSettings() {
        await this.saveData(this.settings);
    }
    
    /**
     * Utilitaire sleep
     * @param {number} ms - Millisecondes à attendre
     * @returns {Promise<void>}
     * @private
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

/**
 * Paramètres par défaut du plugin
 */
const DEFAULT_SETTINGS = {
    theme: 'auto',
    autoSave: true,
    autoShowOnExcalidraw: true,
    layout: {
        sidebar: 'right',
        toolbar: 'top',
        width: 350
    },
    hotkeys: {
        toggleInterface: 'Mod+Shift+P',
        createObject: 'Mod+Shift+O',
        createState: 'Mod+Shift+S',
        createAction: 'Mod+Shift+A'
    }
};

/**
 * Modal pour création nouveau projet
 */
class NewProjectModal extends Modal {
    constructor(app, onSubmit) {
        super(app);
        this.onSubmit = onSubmit;
    }
    
    onOpen() {
        const { contentEl } = this;
        contentEl.createEl('h2', { text: 'Nouveau Projet ProcessMetaLanguage' });
        
        const form = contentEl.createEl('form');
        
        // Nom projet
        const nameContainer = form.createEl('div', { cls: 'setting-item' });
        nameContainer.createEl('div', { text: 'Nom du projet', cls: 'setting-item-name' });
        const nameInput = nameContainer.createEl('input', { 
            type: 'text', 
            placeholder: 'Mon Processus Industriel',
            cls: 'setting-item-control'
        });
        
        // Description
        const descContainer = form.createEl('div', { cls: 'setting-item' });
        descContainer.createEl('div', { text: 'Description', cls: 'setting-item-name' });
        const descInput = descContainer.createEl('textarea', { 
            placeholder: 'Description du processus...',
            cls: 'setting-item-control'
        });
        
        // Type industrie
        const industryContainer = form.createEl('div', { cls: 'setting-item' });
        industryContainer.createEl('div', { text: 'Industrie', cls: 'setting-item-name' });
        const industrySelect = industryContainer.createEl('select', { cls: 'setting-item-control' });
        
        ['Manufacturing', 'Logistics', 'Retail', 'Healthcare', 'Food & Beverage', 'Automotive', 'Other'].forEach(industry => {
            industrySelect.createEl('option', { value: industry.toLowerCase(), text: industry });
        });
        
        // Boutons
        const buttonContainer = form.createEl('div', { cls: 'modal-button-container' });
        
        const createBtn = buttonContainer.createEl('button', { 
            text: 'Créer Projet',
            cls: 'mod-cta'
        });
        
        const cancelBtn = buttonContainer.createEl('button', { 
            text: 'Annuler',
            type: 'button'
        });
        
        // Events
        createBtn.addEventListener('click', (e) => {
            e.preventDefault();
            
            const projectData = {
                name: nameInput.value || 'Nouveau Projet',
                description: descInput.value || '',
                industry: industrySelect.value,
                created: new Date().toISOString()
            };
            
            this.onSubmit(projectData);
            this.close();
        });
        
        cancelBtn.addEventListener('click', () => {
            this.close();
        });
        
        // Focus nom
        nameInput.focus();
    }
    
    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

/**
 * Onglet paramètres ProcessMetaLanguage
 */
class ProcessMetaLanguageSettingTab extends PluginSettingTab {
    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
    }
    
    display() {
        const { containerEl } = this;
        containerEl.empty();
        
        containerEl.createEl('h2', { text: 'ProcessMetaLanguage Settings' });
        
        // Thème
        new Setting(containerEl)
            .setName('Theme')
            .setDesc('Interface theme preference')
            .addDropdown(dropdown => dropdown
                .addOption('auto', 'Auto (follow Obsidian)')
                .addOption('light', 'Light')
                .addOption('dark', 'Dark')
                .setValue(this.plugin.settings.theme)
                .onChange(async (value) => {
                    this.plugin.settings.theme = value;
                    await this.plugin.saveSettings();
                }));
        
        // Auto-save
        new Setting(containerEl)
            .setName('Auto-save')
            .setDesc('Automatically save project changes')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.autoSave)
                .onChange(async (value) => {
                    this.plugin.settings.autoSave = value;
                    await this.plugin.saveSettings();
                }));
        
        // Auto-show on Excalidraw
        new Setting(containerEl)
            .setName('Auto-show on Excalidraw')
            .setDesc('Automatically show interface when opening Excalidraw files')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.autoShowOnExcalidraw)
                .onChange(async (value) => {
                    this.plugin.settings.autoShowOnExcalidraw = value;
                    await this.plugin.saveSettings();
                }));
        
        // Sidebar position
        new Setting(containerEl)
            .setName('Sidebar position')
            .setDesc('Position of the interface sidebar')
            .addDropdown(dropdown => dropdown
                .addOption('left', 'Left')
                .addOption('right', 'Right')
                .setValue(this.plugin.settings.layout.sidebar)
                .onChange(async (value) => {
                    this.plugin.settings.layout.sidebar = value;
                    await this.plugin.saveSettings();
                }));
        
        // Sidebar width
        new Setting(containerEl)
            .setName('Sidebar width')
            .setDesc('Width of the interface sidebar in pixels')
            .addSlider(slider => slider
                .setLimits(250, 500, 25)
                .setValue(this.plugin.settings.layout.width)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    this.plugin.settings.layout.width = value;
                    await this.plugin.saveSettings();
                }));
    }
}

// <!-- END OF FILE: pml-plugin-integration.js -->