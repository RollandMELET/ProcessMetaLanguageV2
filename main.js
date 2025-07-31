// <!-- START OF FILE: main.js -->
// FILENAME: main.js
// Version: 1.0.0
// Date: 2025-08-01 00:00
// Author: Rolland MELET & Claude Code
// Description: Main plugin file for ProcessMetaLanguage Obsidian plugin

/**
 * ProcessMetaLanguage Plugin for Obsidian
 * 
 * Main entry point for the Obsidian plugin that provides:
 * - Visual process design in Excalidraw
 * - EPCIS 2.0 compliant templates
 * - Bidirectional synchronization
 * - Multi-format export capabilities
 * 
 * @module ProcessMetaLanguagePlugin
 */

import { Plugin, Notice, WorkspaceLeaf } from 'obsidian';

// Import core modules
import { TemplateProcessor } from './core/template-processor.js';
import { TemplateManager } from './core/template-manager.js';
import { WorkflowOrchestrator } from './core/workflow-orchestrator.js';
import { TransitionManager } from './core/transition-manager.js';
import { MainActionGenerator } from './core/main-action-generator.js';

// Import UI modules
import { ProcessMetaLanguageInterface } from './ui/main-interface.js';
import { ExcalidrawToolbar } from './ui/excalidraw-toolbar.js';
import { ComponentsPalette } from './ui/components-palette.js';
import { TemplateSelector } from './ui/template-selector.js';
import { CustomizationPanel } from './ui/customization-panel.js';

// Import sync modules
import { CanvasSync } from './sync/canvas-sync.js';
import { TemplateSync } from './sync/template-sync.js';

// Import automation
import { SmartSuggestions } from './automation/smart-suggestions.js';
import { AutoCompletion } from './automation/auto-completion.js';

// Import validation
import { EPCISValidator } from './validation/epcis-validator.js';
import { ArchitectureValidator } from './validation/architecture-validator.js';

export default class ProcessMetaLanguagePlugin extends Plugin {
    constructor() {
        super(...arguments);
        this.modules = {};
        this.isInitialized = false;
    }

    /**
     * Plugin lifecycle: onload
     * @sideEffect Initializes all modules and UI components
     */
    async onload() {
        console.log('Loading ProcessMetaLanguage v1.0.0');
        
        try {
            // Initialize core modules
            await this.initializeCoreModules();
            
            // Initialize UI
            await this.initializeUI();
            
            // Register commands
            this.registerCommands();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Load settings
            await this.loadSettings();
            
            // Show welcome message on first load
            if (this.settings.firstLoad) {
                this.showWelcomeMessage();
                this.settings.firstLoad = false;
                await this.saveSettings();
            }
            
            this.isInitialized = true;
            console.log('ProcessMetaLanguage loaded successfully');
            
        } catch (error) {
            console.error('Failed to load ProcessMetaLanguage:', error);
            new Notice('ProcessMetaLanguage: Failed to initialize. Check console for details.');
        }
    }

    /**
     * Initialize core processing modules
     * @private
     */
    async initializeCoreModules() {
        // Get ExcalidrawAutomate API
        const ea = await this.getExcalidrawAPI();
        if (!ea) {
            throw new Error('ExcalidrawAutomate not available. Please install and enable Excalidraw plugin.');
        }
        
        // Template processing
        this.modules.templateProcessor = new TemplateProcessor(this.app);
        this.modules.templateManager = new TemplateManager(this.app);
        await this.modules.templateProcessor.initialize();
        await this.modules.templateManager.initialize();
        
        // Workflow management
        this.modules.orchestrator = new WorkflowOrchestrator(this.app, ea);
        this.modules.transitionManager = new TransitionManager(this.app, ea);
        this.modules.mainActionGenerator = new MainActionGenerator(this.app, ea);
        await this.modules.orchestrator.initialize();
        
        // Synchronization
        this.modules.canvasSync = new CanvasSync(this.app, ea);
        this.modules.templateSync = new TemplateSync(this.app, ea);
        await this.modules.canvasSync.initialize();
        await this.modules.templateSync.initialize();
        
        // Validation
        this.modules.epcisValidator = new EPCISValidator();
        this.modules.architectureValidator = new ArchitectureValidator(ea);
        
        // Automation
        this.modules.smartSuggestions = new SmartSuggestions(this.app, ea);
        this.modules.autoCompletion = new AutoCompletion(this.app);
        await this.modules.smartSuggestions.initialize();
        await this.modules.autoCompletion.initialize();
        
        // Expose API globally
        window.ProcessMetaLanguage = {
            version: '1.0.0',
            app: this.app,
            excalidrawAPI: ea,
            ...this.modules,
            events: this.events,
            hooks: this.hooks
        };
    }

    /**
     * Initialize UI components
     * @private
     */
    async initializeUI() {
        const ea = await this.getExcalidrawAPI();
        
        // Main interface
        this.ui = new ProcessMetaLanguageInterface(this.app, ea);
        await this.ui.initialize();
        
        // Toolbar
        this.toolbar = new ExcalidrawToolbar(this.app, ea);
        await this.toolbar.initialize();
        
        // Component palette
        this.palette = new ComponentsPalette(this.app, ea);
        await this.palette.initialize();
        
        // Template selector
        this.templateSelector = new TemplateSelector(this.app, ea);
        await this.templateSelector.initialize();
        
        // Customization panel
        this.customizationPanel = new CustomizationPanel(this.app, ea);
        await this.customizationPanel.initialize();
        
        // Auto-show on Excalidraw files
        this.registerEvent(
            this.app.workspace.on('active-leaf-change', (leaf) => {
                this.handleActiveLeafChange(leaf);
            })
        );
    }

    /**
     * Register plugin commands
     * @private
     */
    registerCommands() {
        // Toggle interface
        this.addCommand({
            id: 'toggle-interface',
            name: 'Toggle ProcessMetaLanguage Interface',
            callback: () => this.ui.toggle(),
            hotkeys: [{ modifiers: ['Ctrl', 'Shift'], key: 'P' }]
        });
        
        // Create object
        this.addCommand({
            id: 'create-object',
            name: 'Create Process Object',
            callback: () => this.palette.createObject(),
            hotkeys: [{ modifiers: ['Ctrl', 'Shift'], key: 'O' }]
        });
        
        // Create state
        this.addCommand({
            id: 'create-state',
            name: 'Create Process State',
            callback: () => this.palette.createState(),
            hotkeys: [{ modifiers: ['Ctrl', 'Shift'], key: 'S' }]
        });
        
        // Create action
        this.addCommand({
            id: 'create-action',
            name: 'Create Process Action',
            callback: () => this.palette.createAction(),
            hotkeys: [{ modifiers: ['Ctrl', 'Shift'], key: 'A' }]
        });
        
        // Validate architecture
        this.addCommand({
            id: 'validate-architecture',
            name: 'Validate Process Architecture',
            callback: () => this.validateArchitecture(),
            hotkeys: [{ modifiers: ['Ctrl', 'Shift'], key: 'V' }]
        });
        
        // Export workflow
        this.addCommand({
            id: 'export-workflow',
            name: 'Export Process Documentation',
            callback: () => this.ui.switchView('export'),
            hotkeys: [{ modifiers: ['Ctrl', 'Shift'], key: 'E' }]
        });
        
        // Initialize new project
        this.addCommand({
            id: 'initialize-project',
            name: 'Initialize ProcessMetaLanguage',
            callback: () => this.initializeProject()
        });
    }

    /**
     * Setup event listeners
     * @private
     */
    setupEventListeners() {
        // Canvas change events
        this.events = new EventTarget();
        this.hooks = new Map();
        
        // Listen for canvas changes
        this.registerInterval(
            window.setInterval(() => {
                if (this.settings.autoSync) {
                    this.modules.canvasSync.checkForChanges();
                }
            }, this.settings.syncInterval || 5000)
        );
    }

    /**
     * Handle active leaf change
     * @param {WorkspaceLeaf} leaf - Active leaf
     * @private
     */
    handleActiveLeafChange(leaf) {
        if (!leaf) return;
        
        const view = leaf.view;
        if (view.getViewType() === 'excalidraw') {
            if (this.settings.autoShowInterface) {
                this.ui.show();
                this.toolbar.show();
            }
        } else {
            this.ui.hide();
            this.toolbar.hide();
        }
    }

    /**
     * Get ExcalidrawAutomate API
     * @returns {Promise<ExcalidrawAutomate|null>}
     * @private
     */
    async getExcalidrawAPI() {
        const excalidraw = this.app.plugins.plugins['obsidian-excalidraw-plugin'];
        if (!excalidraw || !excalidraw.enabled) {
            return null;
        }
        
        // Wait for ExcalidrawAutomate to be available
        let attempts = 0;
        while (!window.ExcalidrawAutomate && attempts < 10) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        return window.ExcalidrawAutomate || null;
    }

    /**
     * Validate current architecture
     * @private
     */
    async validateArchitecture() {
        try {
            const result = await this.modules.architectureValidator.validateArchitecture();
            
            if (result.isValid) {
                new Notice('✅ Architecture validation passed!');
            } else {
                new Notice(`❌ Validation failed: ${result.issues.length} issues found`);
                this.ui.showValidationReport(result);
            }
            
            this.events.dispatchEvent(new CustomEvent('validation:complete', { detail: result }));
            
        } catch (error) {
            console.error('Validation error:', error);
            new Notice('Failed to validate architecture');
        }
    }

    /**
     * Initialize new project
     * @private
     */
    async initializeProject() {
        try {
            // Create necessary folders
            const folders = [
                'ProcessMetaLanguage',
                'ProcessMetaLanguage/templates',
                'ProcessMetaLanguage/exports',
                'ProcessMetaLanguage/drawings'
            ];
            
            for (const folder of folders) {
                if (!await this.app.vault.adapter.exists(folder)) {
                    await this.app.vault.createFolder(folder);
                }
            }
            
            // Copy template files
            await this.copyTemplateFiles();
            
            // Create sample drawing
            await this.createSampleDrawing();
            
            new Notice('ProcessMetaLanguage initialized successfully!');
            
        } catch (error) {
            console.error('Initialization error:', error);
            new Notice('Failed to initialize ProcessMetaLanguage');
        }
    }

    /**
     * Show welcome message
     * @private
     */
    showWelcomeMessage() {
        const fragment = document.createDocumentFragment();
        const div = fragment.createEl('div');
        div.innerHTML = `
            <h3>Welcome to ProcessMetaLanguage!</h3>
            <p>Design industrial traceability processes visually.</p>
            <ul>
                <li>Press <code>Ctrl+Shift+P</code> to toggle interface</li>
                <li>Create your first object with <code>Ctrl+Shift+O</code></li>
                <li>Check out the <a href="https://processmetalanguage.io/docs">documentation</a></li>
            </ul>
        `;
        new Notice(fragment, 10000);
    }

    /**
     * Load plugin settings
     * @private
     */
    async loadSettings() {
        const DEFAULT_SETTINGS = {
            firstLoad: true,
            autoShowInterface: true,
            autoSync: true,
            syncInterval: 5000,
            theme: 'auto',
            language: 'en',
            enableSuggestions: true,
            enableAutoCompletion: true,
            sidebarPosition: 'right',
            defaultObjectType: 'product',
            defaultDisposition: 'active'
        };
        
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    /**
     * Save plugin settings
     * @private
     */
    async saveSettings() {
        await this.saveData(this.settings);
    }

    /**
     * Plugin lifecycle: onunload
     */
    onunload() {
        console.log('Unloading ProcessMetaLanguage');
        
        // Cleanup UI
        if (this.ui) this.ui.destroy();
        if (this.toolbar) this.toolbar.destroy();
        if (this.palette) this.palette.destroy();
        if (this.templateSelector) this.templateSelector.destroy();
        if (this.customizationPanel) this.customizationPanel.destroy();
        
        // Cleanup modules
        Object.values(this.modules).forEach(module => {
            if (module && typeof module.destroy === 'function') {
                module.destroy();
            }
        });
        
        // Remove global reference
        delete window.ProcessMetaLanguage;
    }
}

// <!-- END OF FILE: main.js -->