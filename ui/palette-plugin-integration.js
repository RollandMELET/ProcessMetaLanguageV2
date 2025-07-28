// <!-- START OF FILE: palette-plugin-integration.js -->
// FILENAME: palette-plugin-integration.js
// Version: 1.0.0
// Date: 2025-07-28 16:30
// Author: Rolland MELET & Claude Code
// Description: Intégration de la palette ProcessMetaLanguage dans un plugin Obsidian

import { ComponentsPalette } from './components-palette.js';

/**
 * Classe d'intégration de la palette dans un plugin Obsidian
 * Gère le cycle de vie de la palette et son intégration avec Excalidraw
 * @class
 */
export class PalettePluginIntegration {
    /**
     ava* Crée une instance d'intégration de la palette
     * @param {Object} plugin - Instance du plugin Obsidian
     * @example
     * // Dans votre plugin Obsidian
     * export default class ProcessMetaLanguagePlugin extends Plugin {
     *   async onload() {
     *     this.paletteIntegration = new PalettePluginIntegration(this);
     *     await this.paletteIntegration.initialize();
     *   }
     * }
     */
    constructor(plugin) {
        this.plugin = plugin;
        this.app = plugin.app;
        this.palette = null;
        this.excalidrawAPI = null;
        this.isInitialized = false;
        
        // Configuration par défaut
        this.settings = {
            showPalette: true,
            palettePosition: 'right',
            paletteTop: 100,
            enableShortcuts: true,
            autoHidePalette: false
        };
    }

    /**
     * Initialise l'intégration de la palette
     * @returns {Promise<void>}
     * @sideEffect Configure les événements et charge les styles CSS
     * @example
     * await paletteIntegration.initialize();
     */
    async initialize() {
        if (this.isInitialized) return;
        
        try {
            // Charger les paramètres sauvegardés
            await this.loadSettings();
            
            // Injecter les styles CSS
            this.injectStyles();
            
            // Configurer les événements
            this.setupEventListeners();
            
            // Enregistrer les commandes Obsidian
            this.registerCommands();
            
            // Attendre Excalidraw et monter la palette
            await this.waitForExcalidraw();
            
            this.isInitialized = true;
            console.log('ProcessMetaLanguage Palette initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize ProcessMetaLanguage Palette:', error);
            throw error;
        }
    }

    /**
     * Charge les paramètres sauvegardés
     * @private
     * @returns {Promise<void>}
     * @sideEffect Lit les données du plugin Obsidian
     */
    async loadSettings() {
        const savedSettings = await this.plugin.loadData();
        if (savedSettings) {
            Object.assign(this.settings, savedSettings);
        }
    }

    /**
     * Sauvegarde les paramètres
     * @private
     * @returns {Promise<void>}
     * @sideEffect Écrit les données du plugin Obsidian
     */
    async saveSettings() {
        await this.plugin.saveData(this.settings);
    }

    /**
     * Injecte les styles CSS de la palette
     * @private
     * @sideEffect Ajoute un élément style au document
     */
    injectStyles() {
        // Vérifier si les styles sont déjà injectés
        if (document.getElementById('pml-palette-styles')) return;
        
        const styleEl = document.createElement('style');
        styleEl.id = 'pml-palette-styles';
        
        // Importer les styles depuis le fichier CSS
        // Note: En production, vous pourriez vouloir bundler le CSS
        fetch(this.plugin.manifest.dir + '/ui/components-palette.css')
            .then(response => response.text())
            .then(css => {
                styleEl.textContent = css;
                document.head.appendChild(styleEl);
            })
            .catch(error => {
                console.error('Failed to load palette styles:', error);
                // Fallback: styles inline minimaux
                styleEl.textContent = this.getMinimalStyles();
                document.head.appendChild(styleEl);
            });
    }

    /**
     * Retourne les styles CSS minimaux pour la palette
     * @private
     * @returns {string} CSS minimal
     */
    getMinimalStyles() {
        return `
            .process-metalanguage-palette {
                position: fixed;
                background: var(--background-primary);
                border: 1px solid var(--background-modifier-border);
                border-radius: 8px;
                padding: 12px;
                z-index: 1000;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
            }
            .pml-component-button {
                width: 100%;
                margin: 6px 0;
                padding: 10px;
                background: var(--background-secondary);
                border: 1px solid var(--background-modifier-border);
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            .pml-component-button:hover {
                background: var(--background-modifier-hover);
            }
        `;
    }

    /**
     * Configure les écouteurs d'événements
     * @private
     * @sideEffect Ajoute des listeners au workspace Obsidian
     */
    setupEventListeners() {
        // Écouter l'ouverture d'un fichier Excalidraw
        this.plugin.registerEvent(
            this.app.workspace.on('file-open', (file) => {
                if (file && file.extension === 'excalidraw') {
                    setTimeout(() => this.checkAndMountPalette(), 1000);
                } else {
                    this.unmountPalette();
                }
            })
        );

        // Écouter le changement de vue active
        this.plugin.registerEvent(
            this.app.workspace.on('active-leaf-change', (leaf) => {
                const view = leaf?.view;
                if (view && view.getViewType() === 'excalidraw') {
                    setTimeout(() => this.checkAndMountPalette(), 500);
                } else if (this.settings.autoHidePalette) {
                    this.unmountPalette();
                }
            })
        );

        // Écouter la fermeture du workspace
        this.plugin.register(() => {
            this.unmountPalette();
        });
    }

    /**
     * Enregistre les commandes Obsidian pour la palette
     * @private
     * @sideEffect Ajoute des commandes au registre Obsidian
     */
    registerCommands() {
        // Commande pour toggle la palette
        this.plugin.addCommand({
            id: 'toggle-process-metalanguage-palette',
            name: 'Toggle ProcessMetaLanguage Palette',
            callback: () => this.togglePalette(),
            hotkeys: [
                {
                    modifiers: ['Mod', 'Shift'],
                    key: 'P'
                }
            ]
        });

        // Commandes pour créer des composants
        this.plugin.addCommand({
            id: 'create-process-object',
            name: 'Create Process Object',
            callback: () => this.createComponent('object'),
            hotkeys: [
                {
                    modifiers: ['Mod'],
                    key: '1'
                }
            ]
        });

        this.plugin.addCommand({
            id: 'create-process-state',
            name: 'Create Process State',
            callback: () => this.createComponent('state'),
            hotkeys: [
                {
                    modifiers: ['Mod'],
                    key: '2'
                }
            ]
        });

        this.plugin.addCommand({
            id: 'create-process-action',
            name: 'Create Process Action',
            callback: () => this.createComponent('action'),
            hotkeys: [
                {
                    modifiers: ['Mod'],
                    key: '3'
                }
            ]
        });

        // Commande pour les paramètres
        this.plugin.addCommand({
            id: 'process-metalanguage-settings',
            name: 'ProcessMetaLanguage Settings',
            callback: () => this.openSettings()
        });
    }

    /**
     * Attend que l'API Excalidraw soit disponible
     * @private
     * @returns {Promise<void>}
     */
    async waitForExcalidraw() {
        return new Promise((resolve) => {
            const checkExcalidraw = () => {
                // Vérifier si ExcalidrawAutomate est disponible
                if (window.ExcalidrawAutomate || (window.EA && window.EA.ExcalidrawAutomate)) {
                    this.excalidrawAPI = window.ExcalidrawAutomate || window.EA.ExcalidrawAutomate;
                    this.checkAndMountPalette();
                    resolve();
                } else {
                    // Réessayer après un délai
                    setTimeout(checkExcalidraw, 500);
                }
            };
            
            checkExcalidraw();
        });
    }

    /**
     * Vérifie et monte la palette si nécessaire
     * @private
     * @sideEffect Monte la palette dans le DOM
     */
    checkAndMountPalette() {
        const activeView = this.app.workspace.getActiveViewOfType(
            this.app.workspace.getLeavesOfType('excalidraw')[0]?.view.constructor
        );

        if (activeView && this.settings.showPalette && this.excalidrawAPI) {
            this.mountPalette();
        }
    }

    /**
     * Monte la palette dans l'interface
     * @sideEffect Crée et affiche la palette
     * @example
     * paletteIntegration.mountPalette();
     */
    mountPalette() {
        if (this.palette) {
            // La palette est déjà montée
            return;
        }

        try {
            this.palette = new ComponentsPalette(
                this.app,
                this.excalidrawAPI,
                {
                    position: this.settings.palettePosition,
                    top: this.settings.paletteTop
                }
            );

            this.palette.mount();
            
            // Ajouter un callback personnalisé pour la fermeture
            const originalUnmount = this.palette.unmount.bind(this.palette);
            this.palette.unmount = () => {
                originalUnmount();
                this.palette = null;
                this.settings.showPalette = false;
                this.saveSettings();
            };

        } catch (error) {
            console.error('Failed to mount ProcessMetaLanguage palette:', error);
        }
    }

    /**
     * Démonte la palette de l'interface
     * @sideEffect Retire la palette du DOM
     * @example
     * paletteIntegration.unmountPalette();
     */
    unmountPalette() {
        if (this.palette) {
            this.palette.unmount();
            this.palette = null;
        }
    }

    /**
     * Bascule l'affichage de la palette
     * @sideEffect Monte ou démonte la palette
     * @example
     * paletteIntegration.togglePalette();
     */
    togglePalette() {
        if (this.palette) {
            this.unmountPalette();
            this.settings.showPalette = false;
        } else {
            this.checkAndMountPalette();
            this.settings.showPalette = true;
        }
        this.saveSettings();
    }

    /**
     * Crée un composant du type spécifié
     * @param {string} type - Type de composant ('object', 'state', 'action')
     * @sideEffect Crée un élément dans le canvas Excalidraw
     * @example
     * paletteIntegration.createComponent('object');
     */
    createComponent(type) {
        if (!this.palette) {
            // Monter la palette si nécessaire
            this.checkAndMountPalette();
            
            // Attendre un peu que la palette soit montée
            setTimeout(() => {
                if (this.palette) {
                    this.createComponentInternal(type);
                }
            }, 100);
        } else {
            this.createComponentInternal(type);
        }
    }

    /**
     * Crée un composant (méthode interne)
     * @private
     * @param {string} type - Type de composant
     */
    createComponentInternal(type) {
        switch (type) {
            case 'object':
                this.palette.createObject();
                break;
            case 'state':
                this.palette.createState();
                break;
            case 'action':
                this.palette.createAction();
                break;
        }
    }

    /**
     * Ouvre les paramètres de la palette
     * @sideEffect Affiche un modal de paramètres
     * @example
     * paletteIntegration.openSettings();
     */
    openSettings() {
        // Implémenter un modal de paramètres Obsidian
        // Pour l'instant, on peut simplement logger
        console.log('ProcessMetaLanguage Settings:', this.settings);
        
        // TODO: Implémenter un vrai modal de paramètres
        // Utiliser this.app.setting pour créer un onglet de paramètres
    }

    /**
     * Nettoie les ressources lors de la désactivation
     * @sideEffect Retire tous les éléments et listeners
     * @example
     * // Dans votre plugin Obsidian
     * async onunload() {
     *   this.paletteIntegration.cleanup();
     * }
     */
    cleanup() {
        this.unmountPalette();
        
        // Retirer les styles
        const styleEl = document.getElementById('pml-palette-styles');
        if (styleEl) {
            styleEl.remove();
        }
        
        this.isInitialized = false;
    }

    /**
     * Obtient les statistiques d'utilisation
     * @returns {Object} Statistiques de la palette
     * @example
     * const stats = paletteIntegration.getStats();
     * console.log(`Palette utilisée ${stats.totalCreated} fois`);
     */
    getStats() {
        if (this.palette) {
            return this.palette.getUsageStats();
        }
        
        return {
            objectsCreated: 0,
            statesCreated: 0,
            actionsCreated: 0,
            sessionDuration: 0
        };
    }
}

// Export pour utilisation dans un plugin Obsidian
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PalettePluginIntegration;
}

// <!-- END OF FILE: palette-plugin-integration.js -->