// <!-- START OF FILE: excalidraw-toolbar.js -->
// FILENAME: excalidraw-toolbar.js
// Version: 1.0.0
// Date: 2025-07-31 21:00
// Author: Rolland MELET & Claude Code
// Description: Barre outils Excalidraw personnalisée ProcessMetaLanguage - TASK-F008 Phase 6

/**
 * Module ProcessMetaLanguage - Barre Outils Excalidraw Personnalisée
 * 
 * Intègre les outils ProcessMetaLanguage directement dans la barre d'outils Excalidraw.
 * Fournit accès 1-clic aux fonctionnalités de création et manipulation des composants.
 * 
 * Fonctionnalités:
 * - Boutons création rapide (Objet, État, Action)
 * - Outils templates EPCIS 2.0
 * - Raccourcis validation et export
 * - Intégration native ExcalidrawAutomate
 * - Thème adaptatif Obsidian
 * - Groupes logiques d'outils
 */

import { ObjectCreator } from '../components/object-creator.js';
import { StateCreator } from '../components/state-creator.js';
import { ActionCreator } from '../components/action-creator.js';
import { TemplateSelector } from './template-selector.js';

/**
 * Créateur de barre d'outils ProcessMetaLanguage pour Excalidraw
 * @class
 */
export class ExcalidrawToolbar {
    /**
     * Initialise la barre d'outils personnalisée
     * @param {Object} app - Instance Obsidian App
     * @param {Object} excalidrawAPI - API ExcalidrawAutomate
     * @param {Object} options - Configuration toolbar
     * @param {Object} [options.position='top'] - Position toolbar (top, bottom, left, right)
     * @param {boolean} [options.compact=false] - Mode compact pour mobile
     * @param {string} [options.theme='auto'] - Thème interface (auto, light, dark)
     * @param {Array} [options.groups] - Groupes d'outils personnalisés
     */
    constructor(app, excalidrawAPI, options = {}) {
        this.app = app;
        this.ea = excalidrawAPI;
        
        // Configuration
        this.config = {
            position: options.position || 'top',
            compact: options.compact || false,
            theme: options.theme || 'auto',
            autoHide: options.autoHide !== false,
            showLabels: options.showLabels !== false,
            customGroups: options.groups || []
        };
        
        // État toolbar
        this.toolbarElement = null;
        this.isVisible = false;
        this.currentTool = null;
        this.shortcuts = new Map();
        
        // Composants
        this.objectCreator = null;
        this.stateCreator = null;
        this.actionCreator = null;
        this.templateSelector = null;
        
        // Métriques usage
        this.metrics = {
            toolsUsed: new Map(),
            sessionStart: Date.now(),
            totalCreations: 0
        };
        
        console.log('🛠️ ExcalidrawToolbar initialisée');
    }
    
    /**
     * Initialise la barre d'outils et ses composants
     * @returns {Promise<void>}
     * @sideEffect Crée toolbar DOM, initialise composants, attache événements
     */
    async initialize() {
        try {
            console.log('🚀 Initialisation ExcalidrawToolbar...');
            
            // Initialiser composants ProcessMetaLanguage
            await this.initializeComponents();
            
            // Créer structure DOM toolbar
            this.createToolbarDOM();
            
            // Configurer raccourcis clavier
            this.setupKeyboardShortcuts();
            
            // Attacher événements
            this.attachEventListeners();
            
            // Appliquer thème
            this.applyTheme();
            
            console.log('✅ ExcalidrawToolbar initialisée avec succès');
            
        } catch (error) {
            console.error('❌ Erreur initialisation toolbar:', error);
            throw error;
        }
    }
    
    /**
     * Initialise les composants ProcessMetaLanguage
     * @private
     */
    async initializeComponents() {
        // Créer instances composants
        this.objectCreator = new ObjectCreator(this.ea);
        this.stateCreator = new StateCreator(this.ea);
        this.actionCreator = new ActionCreator(this.ea);
        this.templateSelector = new TemplateSelector(this.app, this.ea);
        
        // Initialiser si nécessaire
        await this.templateSelector.initialize();
        
        console.log('🧩 Composants ProcessMetaLanguage initialisés');
    }
    
    /**
     * Crée la structure DOM de la toolbar
     * @private
     */
    createToolbarDOM() {
        // Container principal toolbar
        this.toolbarElement = document.createElement('div');
        this.toolbarElement.className = `pml-toolbar pml-toolbar-${this.config.position}`;
        this.toolbarElement.id = 'processmetalanguage-toolbar';
        
        // Groupes d'outils
        const toolGroups = this.getToolGroups();
        
        toolGroups.forEach(group => {
            const groupElement = this.createToolGroup(group);
            this.toolbarElement.appendChild(groupElement);
        });
        
        // Séparateur avec info
        const infoElement = this.createInfoSection();
        this.toolbarElement.appendChild(infoElement);
        
        console.log('🏗️ Structure DOM toolbar créée');
    }
    
    /**
     * Définit les groupes d'outils disponibles
     * @returns {Array} Configuration groupes d'outils
     * @private
     */
    getToolGroups() {
        const baseGroups = [
            {
                id: 'creation',
                label: 'Création',
                icon: '🔧',
                tools: [
                    {
                        id: 'create-object',
                        label: 'Objet',
                        icon: '⬡',
                        tooltip: 'Créer Objet Processus (Ctrl+Shift+O)',
                        shortcut: 'Mod+Shift+O',
                        action: () => this.createComponent('object'),
                        color: '#4a90e2'
                    },
                    {
                        id: 'create-state',
                        label: 'État',
                        icon: '🏷️',
                        tooltip: 'Créer État Processus (Ctrl+Shift+S)',
                        shortcut: 'Mod+Shift+S',
                        action: () => this.createComponent('state'),
                        color: '#7ed321'
                    },
                    {
                        id: 'create-action',
                        label: 'Action',
                        icon: '▭',
                        tooltip: 'Créer Action Processus (Ctrl+Shift+A)',
                        shortcut: 'Mod+Shift+A',
                        action: () => this.createComponent('action'),
                        color: '#f5a623'
                    }
                ]
            },
            {
                id: 'templates',
                label: 'Templates',
                icon: '📋',
                tools: [
                    {
                        id: 'epcis-templates',
                        label: 'EPCIS',
                        icon: '📊',
                        tooltip: 'Templates EPCIS 2.0 (41 Business Steps + 25 Dispositions)',
                        action: () => this.openTemplates(),
                        color: '#9013fe'
                    },
                    {
                        id: 'custom-templates',
                        label: 'Custom',
                        icon: '⚙️',
                        tooltip: 'Templates Personnalisés',
                        action: () => this.openCustomTemplates(),
                        color: '#50e3c2'
                    }
                ]
            },
            {
                id: 'workflow',
                label: 'Workflow',
                icon: '🔄',
                tools: [
                    {
                        id: 'validate-architecture',
                        label: 'Valider',
                        icon: '✅',
                        tooltip: 'Valider Architecture Processus',
                        action: () => this.validateArchitecture(),
                        color: '#7ed321'
                    },
                    {
                        id: 'sync-canvas',
                        label: 'Sync',
                        icon: '🔄',
                        tooltip: 'Synchroniser Canvas ↔ Documentation',
                        action: () => this.syncCanvas(),
                        color: '#4a90e2'
                    }
                ]
            },
            {
                id: 'export',
                label: 'Export',
                icon: '📤',
                tools: [
                    {
                        id: 'export-workflow',
                        label: 'Workflow',
                        icon: '📋',
                        tooltip: 'Exporter Documentation Workflow',
                        action: () => this.exportWorkflow(),
                        color: '#f5a623'
                    },
                    {
                        id: 'export-api',
                        label: 'API',
                        icon: '🔌',
                        tooltip: 'Exporter Spécifications OpenAPI 3.0',
                        action: () => this.exportAPI(),
                        color: '#d0021b'
                    }
                ]
            }
        ];
        
        // Ajouter groupes personnalisés
        return [...baseGroups, ...this.config.customGroups];
    }
    
    /**
     * Crée un groupe d'outils DOM
     * @param {Object} group - Configuration groupe
     * @returns {HTMLElement} Élément DOM groupe
     * @private
     */
    createToolGroup(group) {
        const groupElement = document.createElement('div');
        groupElement.className = 'pml-tool-group';
        groupElement.dataset.groupId = group.id;
        
        // Label groupe (si pas compact)
        if (!this.config.compact && this.config.showLabels) {
            const labelElement = document.createElement('div');
            labelElement.className = 'pml-group-label';
            labelElement.textContent = group.label;
            labelElement.title = group.tooltip || group.label;
            groupElement.appendChild(labelElement);
        }
        
        // Container outils
        const toolsContainer = document.createElement('div');
        toolsContainer.className = 'pml-tools-container';
        
        // Créer boutons outils
        group.tools.forEach(tool => {
            const toolButton = this.createToolButton(tool);
            toolsContainer.appendChild(toolButton);
        });
        
        groupElement.appendChild(toolsContainer);
        
        return groupElement;
    }
    
    /**
     * Crée un bouton outil
     * @param {Object} tool - Configuration outil
     * @returns {HTMLElement} Bouton outil
     * @private
     */
    createToolButton(tool) {
        const button = document.createElement('button');
        button.className = 'pml-tool-button';
        button.dataset.toolId = tool.id;
        button.title = tool.tooltip || tool.label;
        
        // Style couleur
        if (tool.color) {
            button.style.setProperty('--tool-color', tool.color);
        }
        
        // Contenu bouton
        const iconElement = document.createElement('span');
        iconElement.className = 'pml-tool-icon';
        iconElement.textContent = tool.icon;
        button.appendChild(iconElement);
        
        // Label (si pas compact)
        if (!this.config.compact && this.config.showLabels) {
            const labelElement = document.createElement('span');
            labelElement.className = 'pml-tool-label';
            labelElement.textContent = tool.label;
            button.appendChild(labelElement);
        }
        
        // Événement click
        button.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            try {
                // Visual feedback
                button.classList.add('pml-tool-active');
                
                // Exécuter action
                await tool.action();
                
                // Métriques
                this.updateToolMetrics(tool.id);
                
                console.log(`🎯 Outil utilisé: ${tool.label}`);
                
            } catch (error) {
                console.error(`❌ Erreur outil ${tool.label}:`, error);
            } finally {
                // Retirer feedback après 200ms
                setTimeout(() => {
                    button.classList.remove('pml-tool-active');
                }, 200);
            }
        });
        
        // Enregistrer raccourci si défini
        if (tool.shortcut) {
            this.shortcuts.set(tool.shortcut, tool.action);
        }
        
        return button;
    }
    
    /**
     * Crée la section info toolbar
     * @returns {HTMLElement} Section info
     * @private
     */
    createInfoSection() {
        const infoElement = document.createElement('div');
        infoElement.className = 'pml-toolbar-info';
        
        // Compteur créations
        const counterElement = document.createElement('span');
        counterElement.className = 'pml-creation-counter';
        counterElement.textContent = '0';
        counterElement.title = 'Composants créés cette session';
        
        // Toggle compact
        const toggleButton = document.createElement('button');
        toggleButton.className = 'pml-toggle-compact';
        toggleButton.textContent = this.config.compact ? '📖' : '📑';
        toggleButton.title = 'Toggle Mode Compact';
        toggleButton.addEventListener('click', () => this.toggleCompactMode());
        
        infoElement.appendChild(counterElement);
        infoElement.appendChild(toggleButton);
        
        return infoElement;
    }
    
    /**
     * Configure les raccourcis clavier
     * @private
     */
    setupKeyboardShortcuts() {
        // Gestionnaire événements clavier global
        this.keyboardHandler = (e) => {
            const shortcut = this.getShortcutString(e);
            const action = this.shortcuts.get(shortcut);
            
            if (action && this.isVisible) {
                e.preventDefault();
                e.stopPropagation();
                action();
            }
        };
        
        // Attacher au document
        document.addEventListener('keydown', this.keyboardHandler);
        
        console.log(`⌨️ ${this.shortcuts.size} raccourcis configurés`);
    }
    
    /**
     * Génère string raccourci depuis événement clavier
     * @param {KeyboardEvent} e - Événement clavier
     * @returns {string} String raccourci (ex: "Mod+Shift+O")
     * @private
     */
    getShortcutString(e) {
        const parts = [];
        
        if (e.ctrlKey || e.metaKey) parts.push('Mod');
        if (e.shiftKey) parts.push('Shift');
        if (e.altKey) parts.push('Alt');
        
        parts.push(e.key.toUpperCase());
        
        return parts.join('+');
    }
    
    /**
     * Attache les événements de la toolbar
     * @private
     */
    attachEventListeners() {
        // Détection changement taille fenêtre
        window.addEventListener('resize', () => {
            this.updateToolbarLayout();
        });
        
        // Détection changement thème Obsidian
        if (this.app.workspace) {
            this.app.workspace.on('css-change', () => {
                this.applyTheme();
            });
        }
        
        console.log('👂 Event listeners attachés');
    }
    
    /**
     * Applique le thème à la toolbar
     * @private
     */
    applyTheme() {
        if (!this.toolbarElement) return;
        
        // Détecter thème actuel
        const isDark = document.body.classList.contains('theme-dark') || 
                      (this.config.theme === 'dark') ||
                      (this.config.theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        
        // Appliquer classe thème
        this.toolbarElement.classList.toggle('pml-theme-dark', isDark);
        this.toolbarElement.classList.toggle('pml-theme-light', !isDark);
        
        console.log(`🎨 Thème appliqué: ${isDark ? 'dark' : 'light'}`);
    }
    
    /**
     * Met à jour layout toolbar selon taille écran
     * @private
     */
    updateToolbarLayout() {
        if (!this.toolbarElement) return;
        
        const width = window.innerWidth;
        
        // Mode compact automatique sur mobile
        if (width < 768 && !this.config.compact) {
            this.setCompactMode(true);
        } else if (width >= 768 && this.config.compact && !this.manualCompact) {
            this.setCompactMode(false);
        }
    }
    
    /**
     * Affiche la toolbar
     * @sideEffect Ajoute toolbar au DOM, applique styles
     */
    show() {
        if (this.isVisible || !this.toolbarElement) return;
        
        // Trouver container Excalidraw
        const excalidrawContainer = this.findExcalidrawContainer();
        if (!excalidrawContainer) {
            console.warn('⚠️ Container Excalidraw non trouvé');
            return;
        }
        
        // Ajouter au DOM
        excalidrawContainer.appendChild(this.toolbarElement);
        
        // Animation entrée
        requestAnimationFrame(() => {
            this.toolbarElement.classList.add('pml-toolbar-visible');
        });
        
        this.isVisible = true;
        console.log('👁️ Toolbar ProcessMetaLanguage affichée');
    }
    
    /**
     * Masque la toolbar
     * @sideEffect Retire toolbar du DOM
     */
    hide() {
        if (!this.isVisible || !this.toolbarElement) return;
        
        // Animation sortie
        this.toolbarElement.classList.remove('pml-toolbar-visible');
        
        // Retirer du DOM après animation
        setTimeout(() => {
            if (this.toolbarElement.parentNode) {
                this.toolbarElement.parentNode.removeChild(this.toolbarElement);
            }
        }, 300);
        
        this.isVisible = false;
        console.log('🙈 Toolbar ProcessMetaLanguage masquée');
    }
    
    /**
     * Toggle visibilité toolbar
     */
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }
    
    /**
     * Trouve le container Excalidraw dans le DOM
     * @returns {HTMLElement|null} Container Excalidraw
     * @private
     */
    findExcalidrawContainer() {
        // Sélecteurs possibles pour Excalidraw
        const selectors = [
            '.excalidraw',
            '.excalidraw-wrapper',
            '.excalidraw-container',
            '[data-testid="canvas"]',
            '.workspace-leaf-content[data-type="excalidraw"]'
        ];
        
        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) {
                return element;
            }
        }
        
        return null;
    }
    
    /**
     * Crée un composant ProcessMetaLanguage
     * @param {string} type - Type composant (object, state, action)
     */
    async createComponent(type) {
        try {
            let creator, componentId;
            
            switch (type) {
                case 'object':
                    creator = this.objectCreator;
                    componentId = await creator.createStandardObject({
                        name: `Object-${Date.now()}`,
                        type: 'product',
                        position: this.getCanvasCenter()
                    });
                    break;
                    
                case 'state':
                    creator = this.stateCreator;
                    componentId = await creator.createState({
                        name: `State-${Date.now()}`,
                        disposition: 'active',
                        position: this.getCanvasCenter()
                    });
                    break;
                    
                case 'action':
                    creator = this.actionCreator;
                    componentId = await creator.createAction({
                        name: `Action-${Date.now()}`,
                        type: 'main',
                        businessStep: 'receiving',
                        position: this.getCanvasCenter()
                    });
                    break;
                    
                default:
                    throw new Error(`Type composant non supporté: ${type}`);
            }
            
            // Mettre à jour métriques
            this.metrics.totalCreations++;
            this.updateCreationCounter();
            
            console.log(`✅ Composant ${type} créé: ${componentId}`);
            
        } catch (error) {
            console.error(`❌ Erreur création ${type}:`, error);
            throw error;
        }
    }
    
    /**
     * Obtient le centre du canvas Excalidraw
     * @returns {Object} Position {x, y}
     * @private
     */
    getCanvasCenter() {
        // Position par défaut
        let center = { x: 0, y: 0 };
        
        try {
            // Essayer d'obtenir position via ExcalidrawAutomate
            if (this.ea.getViewSelectedElements) {
                const viewport = this.ea.getViewportCoords();
                if (viewport) {
                    center = {
                        x: viewport.x + (viewport.width / 2),
                        y: viewport.y + (viewport.height / 2)
                    };
                }
            }
        } catch (error) {
            // Position aléatoire proche du centre
            center = {
                x: Math.random() * 200 - 100,
                y: Math.random() * 200 - 100
            };
        }
        
        return center;
    }
    
    /**
     * Ouvre l'interface templates EPCIS
     */
    async openTemplates() {
        try {
            await this.templateSelector.show();
            console.log('📋 Templates EPCIS ouverts');
        } catch (error) {
            console.error('❌ Erreur ouverture templates:', error);
        }
    }
    
    /**
     * Ouvre l'interface templates personnalisés
     */
    async openCustomTemplates() {
        try {
            // TODO: Implémenter interface templates personnalisés
            console.log('⚙️ Templates personnalisés (TODO)');
        } catch (error) {
            console.error('❌ Erreur templates personnalisés:', error);
        }
    }
    
    /**
     * Valide l'architecture du processus actuel
     */
    async validateArchitecture() {
        try {
            // TODO: Implémenter validation architecture
            console.log('✅ Validation architecture (TODO)');
        } catch (error) {
            console.error('❌ Erreur validation:', error);
        }
    }
    
    /**
     * Synchronise le canvas avec la documentation
     */
    async syncCanvas() {
        try {
            // TODO: Implémenter synchronisation
            console.log('🔄 Synchronisation canvas (TODO)');
        } catch (error) {
            console.error('❌ Erreur synchronisation:', error);
        }
    }
    
    /**
     * Exporte la documentation workflow
     */
    async exportWorkflow() {
        try {
            // TODO: Implémenter export workflow
            console.log('📋 Export workflow (TODO)');
        } catch (error) {
            console.error('❌ Erreur export workflow:', error);
        }
    }
    
    /**
     * Exporte les spécifications API
     */
    async exportAPI() {
        try {
            // TODO: Implémenter export API
            console.log('🔌 Export API (TODO)');
        } catch (error) {
            console.error('❌ Erreur export API:', error);
        }
    }
    
    /**
     * Toggle mode compact
     */
    toggleCompactMode() {
        this.manualCompact = true;
        this.setCompactMode(!this.config.compact);
    }
    
    /**
     * Définit le mode compact
     * @param {boolean} compact - Mode compact
     * @private
     */
    setCompactMode(compact) {
        this.config.compact = compact;
        
        if (this.toolbarElement) {
            this.toolbarElement.classList.toggle('pml-toolbar-compact', compact);
        }
        
        // Mettre à jour bouton toggle
        const toggleButton = this.toolbarElement?.querySelector('.pml-toggle-compact');
        if (toggleButton) {
            toggleButton.textContent = compact ? '📖' : '📑';
        }
        
        console.log(`📑 Mode compact: ${compact ? 'ON' : 'OFF'}`);
    }
    
    /**
     * Met à jour les métriques d'usage des outils
     * @param {string} toolId - ID outil utilisé
     * @private
     */
    updateToolMetrics(toolId) {
        const count = this.metrics.toolsUsed.get(toolId) || 0;
        this.metrics.toolsUsed.set(toolId, count + 1);
    }
    
    /**
     * Met à jour le compteur de créations
     * @private
     */
    updateCreationCounter() {
        const counter = this.toolbarElement?.querySelector('.pml-creation-counter');
        if (counter) {
            counter.textContent = this.metrics.totalCreations.toString();
        }
    }
    
    /**
     * Obtient les métriques d'usage
     * @returns {Object} Métriques usage toolbar
     */
    getMetrics() {
        const sessionDuration = Date.now() - this.metrics.sessionStart;
        
        return {
            sessionDuration: Math.round(sessionDuration / 1000), // secondes
            totalCreations: this.metrics.totalCreations,
            toolsUsed: Object.fromEntries(this.metrics.toolsUsed),
            averageCreationsPerMinute: this.metrics.totalCreations / (sessionDuration / 60000)
        };
    }
    
    /**
     * Nettoie et détruit la toolbar
     * @sideEffect Retire DOM, détache événements, nettoie ressources
     */
    destroy() {
        console.log('🔄 Destruction toolbar...');
        
        // Masquer toolbar
        this.hide();
        
        // Détacher événements
        if (this.keyboardHandler) {
            document.removeEventListener('keydown', this.keyboardHandler);
        }
        
        // Nettoyer composants
        if (this.templateSelector) {
            this.templateSelector.destroy?.();
        }
        
        // Nettoyer variables
        this.toolbarElement = null;
        this.shortcuts.clear();
        this.isVisible = false;
        
        console.log('✅ Toolbar détruite');
    }
}

/**
 * Styles CSS pour la toolbar ProcessMetaLanguage
 * Intégration native avec le thème Obsidian
 */
export const TOOLBAR_CSS = `
/* Toolbar principale */
.pml-toolbar {
    position: absolute;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: var(--background-primary);
    border: 1px solid var(--background-modifier-border);
    border-radius: 8px;
    box-shadow: var(--shadow-s);
    font-family: var(--font-interface);
    font-size: 12px;
    z-index: 1000;
    opacity: 0;
    transform: translateY(-10px);
    transition: all 0.3s ease;
}

/* Positions toolbar */
.pml-toolbar-top {
    top: 10px;
    left: 50%;
    transform: translateX(-50%) translateY(-10px);
}

.pml-toolbar-bottom {
    bottom: 10px;
    left: 50%;
    transform: translateX(-50%) translateY(10px);
}

.pml-toolbar-left {
    top: 50%;
    left: 10px;
    flex-direction: column;
    transform: translateY(-50%) translateX(-10px);
}

.pml-toolbar-right {
    top: 50%;
    right: 10px;
    flex-direction: column;
    transform: translateY(-50%) translateX(10px);
}

/* Animation visible */
.pml-toolbar-visible {
    opacity: 1;
    transform: translateX(-50%) translateY(0) !important;
}

.pml-toolbar-visible.pml-toolbar-left {
    transform: translateY(-50%) translateX(0) !important;
}

.pml-toolbar-visible.pml-toolbar-right {
    transform: translateY(-50%) translateX(0) !important;
}

/* Mode compact */
.pml-toolbar-compact {
    padding: 4px 6px;
    gap: 4px;
}

.pml-toolbar-compact .pml-group-label {
    display: none;
}

.pml-toolbar-compact .pml-tool-label {
    display: none;
}

.pml-toolbar-compact .pml-tool-button {
    min-width: 28px;
    height: 28px;
    padding: 4px;
}

/* Groupes d'outils */
.pml-tool-group {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
}

.pml-toolbar-left .pml-tool-group,
.pml-toolbar-right .pml-tool-group {
    margin-bottom: 8px;
}

.pml-group-label {
    font-size: 10px;
    font-weight: 600;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    white-space: nowrap;
}

.pml-tools-container {
    display: flex;
    gap: 2px;
}

.pml-toolbar-left .pml-tools-container,
.pml-toolbar-right .pml-tools-container {
    flex-direction: column;
}

/* Boutons outils */
.pml-tool-button {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    min-width: 36px;
    height: 36px;
    padding: 6px;
    background: var(--background-secondary);
    border: 1px solid var(--background-modifier-border);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
    overflow: hidden;
}

.pml-tool-button:hover {
    background: var(--background-modifier-hover);
    border-color: var(--interactive-accent);
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.pml-tool-button:active,
.pml-tool-button.pml-tool-active {
    background: var(--interactive-accent);
    color: white;
    transform: translateY(0);
}

/* Couleurs personnalisées outils */
.pml-tool-button[style*="--tool-color"]:hover {
    border-color: var(--tool-color);
    background: color-mix(in srgb, var(--tool-color) 10%, var(--background-secondary));
}

.pml-tool-button[style*="--tool-color"]:active,
.pml-tool-button[style*="--tool-color"].pml-tool-active {
    background: var(--tool-color);
}

/* Icônes et labels */
.pml-tool-icon {
    font-size: 14px;
    line-height: 1;
}

.pml-tool-label {
    font-size: 9px;
    font-weight: 500;
    color: var(--text-muted);
    line-height: 1;
    white-space: nowrap;
}

.pml-tool-button:hover .pml-tool-label {
    color: var(--text-normal);
}

.pml-tool-button:active .pml-tool-label,
.pml-tool-button.pml-tool-active .pml-tool-label {
    color: white;
}

/* Section info */
.pml-toolbar-info {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-left: 8px;
    padding-left: 8px;
    border-left: 1px solid var(--background-modifier-border);
}

.pml-creation-counter {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 20px;
    height: 20px;
    background: var(--interactive-accent);
    color: white;
    border-radius: 10px;
    font-size: 10px;
    font-weight: 600;
}

.pml-toggle-compact {
    background: none;
    border: none;
    font-size: 12px;
    cursor: pointer;
    padding: 2px;
    border-radius: 4px;
    transition: background-color 0.2s ease;
}

.pml-toggle-compact:hover {
    background: var(--background-modifier-hover);
}

/* Thème sombre */
.pml-theme-dark {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.pml-theme-dark .pml-tool-button {
    background: var(--background-secondary);
    border-color: var(--background-modifier-border);
}

.pml-theme-dark .pml-tool-button:hover {
    background: var(--background-modifier-hover);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

/* Responsive */
@media (max-width: 768px) {
    .pml-toolbar {
        padding: 6px 8px;
        gap: 6px;
    }
    
    .pml-tool-button {
        min-width: 32px;
        height: 32px;
    }
    
    .pml-toolbar-info {
        margin-left: 6px;
        padding-left: 6px;
    }
}

/* Animations */
@keyframes pml-tool-ripple {
    0% {
        transform: scale(0);
        opacity: 1;
    }
    100% {
        transform: scale(4);
        opacity: 0;
    }
}

.pml-tool-button::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 5px;
    height: 5px;
    background: rgba(255, 255, 255, 0.5);
    opacity: 0;
    border-radius: 100%;
    transform: scale(1, 1) translate(-50%);
    transform-origin: 50% 50%;
}

.pml-tool-button:active::after {
    animation: pml-tool-ripple 0.6s ease-out;
}
`;

// <!-- END OF FILE: excalidraw-toolbar.js -->