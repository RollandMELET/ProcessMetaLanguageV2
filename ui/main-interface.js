// <!-- START OF FILE: main-interface.js -->
// FILENAME: main-interface.js
// Version: 1.0.0
// Date: 2025-07-31 20:00
// Author: Rolland MELET & Claude Code
// Description: Interface principale ProcessMetaLanguage - TASK-F007 Phase 6 orchestration complète système

/**
 * Module ProcessMetaLanguage - Interface Principale
 * 
 * Interface utilisateur principale qui orchestre tous les composants ProcessMetaLanguage.
 * Fournit une expérience utilisateur intuitive et cohérente pour la création de processus
 * industriels avec architecture État-Actions deux niveaux.
 * 
 * Fonctionnalités principales:
 * - Navigation principale entre tous les modules
 * - Tableau de bord avec métriques temps réel
 * - Accès rapide aux outils de création
 * - Gestion des projets et workflows
 * - Intégration native Obsidian + Excalidraw
 * - Interface responsive et ergonomique
 */

import { ComponentsPalette } from './components-palette.js';
import { TemplateSelector } from './template-selector.js';
import { CustomizationPanel } from './customization-panel.js';
import { WorkflowCompiler } from '../export/workflow-compiler.js';
import { MatrixGenerator } from '../export/matrix-generator.js';
import { OpenAPIGenerator } from '../export/openapi-generator.js';
import { SmartConnectMapper } from '../export/360sc-mapper.js';

/**
 * Interface principale ProcessMetaLanguage
 * Point d'entrée unique pour toutes les fonctionnalités système
 * @class
 */
export class ProcessMetaLanguageInterface {
    /**
     * Crée une instance de l'interface principale
     * @param {Object} app - Instance de l'application Obsidian
     * @param {Object} excalidrawAPI - API ExcalidrawAutomate
     * @param {Object} options - Options de configuration
     * @param {string} options.theme - Thème interface ('light', 'dark', 'auto')
     * @param {boolean} options.autoSave - Sauvegarde automatique
     * @param {Object} options.layout - Configuration layout interface
     * @sideEffect Crée interface DOM, event listeners, initialise modules
     * @example
     * // Initialisation interface principale
     * const pmlInterface = new ProcessMetaLanguageInterface(this.app, ExcalidrawAutomate, {
     *   theme: 'auto',
     *   autoSave: true,
     *   layout: { sidebar: 'right', toolbar: 'top' }
     * });
     * await pmlInterface.initialize();
     * pmlInterface.show();
     */
    constructor(app, excalidrawAPI, options = {}) {
        this.app = app;
        this.ea = excalidrawAPI;
        
        // Configuration par défaut
        this.config = {
            theme: options.theme || 'auto',
            autoSave: options.autoSave !== false,
            layout: {
                sidebar: options.layout?.sidebar || 'right',
                toolbar: options.layout?.toolbar || 'top',
                width: options.layout?.width || 350,
                height: options.layout?.height || '100vh'
            },
            ...options
        };
        
        // État interface
        this.isVisible = false;
        this.currentView = 'dashboard'; // dashboard, creation, templates, export, settings
        this.currentProject = null;
        this.modules = new Map();
        this.metrics = {
            objectsCreated: 0,
            statesCreated: 0,
            actionsCreated: 0,
            templatesUsed: new Set(),
            exportsGenerated: 0,
            sessionStartTime: Date.now()
        };
        
        // DOM Elements
        this.container = null;
        this.sidebar = null;
        this.mainContent = null;
        this.navigationBar = null;
        this.statusBar = null;
        
        // Event handlers storage
        this.eventHandlers = new Map();
        
        console.log('🚀 ProcessMetaLanguage Interface initialisée');
    }
    
    /**
     * Initialise l'interface et tous ses modules
     * @returns {Promise<void>}
     * @sideEffect Charge modules, crée DOM, attache event listeners
     * @example
     * await pmlInterface.initialize();
     */
    async initialize() {
        try {
            console.log('⚡ Initialisation interface ProcessMetaLanguage...');
            
            // Initialiser modules core
            await this.initializeModules();
            
            // Créer structure DOM
            this.createDOM();
            
            // Attacher event listeners
            this.attachEventListeners();
            
            // Charger projet par défaut ou dernier projet
            await this.loadProject();
            
            // Initialiser thème
            this.applyTheme();
            
            console.log('✅ Interface ProcessMetaLanguage initialisée avec succès');
            
        } catch (error) {
            console.error('❌ Erreur initialisation interface:', error);
            this.showError('Erreur initialisation', error.message);
            throw error;
        }
    }
    
    /**
     * Initialise tous les modules ProcessMetaLanguage
     * @returns {Promise<void>}
     * @private
     */
    async initializeModules() {
        // Module palette composants
        this.modules.set('palette', new ComponentsPalette(this.app, this.ea, {
            position: this.config.layout.sidebar,
            integrated: true,
            onComponentCreated: (type, id) => this.onComponentCreated(type, id)
        }));
        
        // Module sélection templates
        this.modules.set('templates', new TemplateSelector(this.app, {
            templatesPath: './templates/epcis/',
            onSelect: (templates) => this.onTemplatesSelected(templates),
            multiSelect: true,
            integrated: true
        }));
        
        // Module personnalisation
        this.modules.set('customization', new CustomizationPanel(this.app, {
            onUpdate: (changes) => this.onCustomizationUpdate(changes),
            integrated: true
        }));
        
        // Modules export
        this.modules.set('workflowCompiler', new WorkflowCompiler({
            outputFormat: 'comprehensive',
            enableValidation: true
        }));
        
        this.modules.set('matrixGenerator', new MatrixGenerator({
            analysisDepth: 'detailed',
            includeMetrics: true
        }));
        
        this.modules.set('openApiGenerator', new OpenAPIGenerator({
            apiTitle: 'ProcessMetaLanguage API',
            version: '1.0.0',
            enableSwaggerUI: true
        }));
        
        this.modules.set('smartConnectMapper', new SmartConnectMapper({
            enableWebhooks: true,
            syncMode: 'bidirectional'
        }));
        
        // Initialiser tous les modules
        for (const [name, module] of this.modules) {
            if (module.initialize) {
                await module.initialize();
                console.log(`✅ Module ${name} initialisé`);
            }
        }
    }
    
    /**
     * Crée la structure DOM de l'interface
     * @sideEffect Crée et insère éléments DOM dans la page
     * @private
     */
    createDOM() {
        // Container principal
        this.container = document.createElement('div');
        this.container.id = 'processmetlanguage-interface';
        this.container.className = 'pml-interface';
        
        // Structure responsive
        this.container.innerHTML = `
            <div class="pml-header">
                <div class="pml-logo">
                    <span class="pml-icon">⚙️</span>
                    <h1>ProcessMetaLanguage</h1>
                    <span class="pml-version">v1.0.0</span>
                </div>
                <div class="pml-toolbar">
                    <button class="pml-btn pml-btn-primary" data-action="new-project">
                        📄 Nouveau Projet
                    </button>
                    <button class="pml-btn pml-btn-secondary" data-action="open-project">
                        📁 Ouvrir Projet
                    </button>
                    <button class="pml-btn pml-btn-secondary" data-action="save-project">
                        💾 Sauvegarder
                    </button>
                </div>
                <div class="pml-user-controls">
                    <button class="pml-btn pml-btn-icon" data-action="settings" title="Paramètres">
                        ⚙️
                    </button>
                    <button class="pml-btn pml-btn-icon" data-action="help" title="Aide">
                        ❓
                    </button>
                </div>
            </div>
            
            <div class="pml-main">
                <nav class="pml-sidebar ${this.config.layout.sidebar}">
                    <div class="pml-nav-section">
                        <h3>🏠 Navigation</h3>
                        <ul class="pml-nav-list">
                            <li><button class="pml-nav-btn active" data-view="dashboard">📊 Tableau de Bord</button></li>
                            <li><button class="pml-nav-btn" data-view="creation">🎨 Création</button></li>
                            <li><button class="pml-nav-btn" data-view="templates">📋 Templates</button></li>
                            <li><button class="pml-nav-btn" data-view="export">📤 Export</button></li>
                            <li><button class="pml-nav-btn" data-view="validation">✅ Validation</button></li>
                        </ul>
                    </div>
                    
                    <div class="pml-nav-section">
                        <h3>⚡ Actions Rapides</h3>
                        <div class="pml-quick-actions">
                            <button class="pml-quick-btn" data-action="create-object" title="Créer Objet">
                                ⬢ Objet
                            </button>
                            <button class="pml-quick-btn" data-action="create-state" title="Créer État">
                                🏷️ État
                            </button>
                            <button class="pml-quick-btn" data-action="create-action" title="Créer Action">
                                ▶️ Action
                            </button>
                        </div>
                    </div>
                    
                    <div class="pml-nav-section">
                        <h3>📈 Métriques</h3>
                        <div class="pml-metrics">
                            <div class="pml-metric">
                                <span class="pml-metric-value" id="objects-count">0</span>
                                <span class="pml-metric-label">Objets</span>
                            </div>
                            <div class="pml-metric">
                                <span class="pml-metric-value" id="states-count">0</span>
                                <span class="pml-metric-label">États</span>
                            </div>
                            <div class="pml-metric">
                                <span class="pml-metric-value" id="actions-count">0</span>
                                <span class="pml-metric-label">Actions</span>
                            </div>
                        </div>
                    </div>
                </nav>
                
                <main class="pml-content">
                    <div id="pml-view-dashboard" class="pml-view active">
                        ${this.createDashboardView()}
                    </div>
                    <div id="pml-view-creation" class="pml-view">
                        ${this.createCreationView()}
                    </div>
                    <div id="pml-view-templates" class="pml-view">
                        ${this.createTemplatesView()}
                    </div>
                    <div id="pml-view-export" class="pml-view">
                        ${this.createExportView()}
                    </div>
                    <div id="pml-view-validation" class="pml-view">
                        ${this.createValidationView()}
                    </div>
                </main>
            </div>
            
            <div class="pml-status-bar">
                <div class="pml-status-left">
                    <span id="pml-project-status">Projet: <strong id="pml-current-project">Nouveau Projet</strong></span>
                    <span id="pml-canvas-status">Canvas: <strong>Connecté</strong></span>
                </div>
                <div class="pml-status-right">
                    <span id="pml-session-time">Session: <span id="session-duration">00:00</span></span>
                    <span id="pml-auto-save" class="pml-status-indicator ${this.config.autoSave ? 'active' : ''}">
                        Auto-Save ${this.config.autoSave ? 'ON' : 'OFF'}
                    </span>
                </div>
            </div>
        `;
        
        // Ajouter styles CSS
        this.addStyles();
        
        // Stocker références DOM
        this.sidebar = this.container.querySelector('.pml-sidebar');
        this.mainContent = this.container.querySelector('.pml-content');
        this.navigationBar = this.container.querySelector('.pml-header');
        this.statusBar = this.container.querySelector('.pml-status-bar');
    }
    
    /**
     * Crée la vue tableau de bord
     * @returns {string} HTML du tableau de bord
     * @private
     */
    createDashboardView() {
        return `
            <div class="pml-dashboard">
                <div class="pml-dashboard-header">
                    <h2>📊 Tableau de Bord ProcessMetaLanguage</h2>
                    <p>Vue d'ensemble de votre projet et métriques temps réel</p>
                </div>
                
                <div class="pml-dashboard-grid">
                    <div class="pml-card pml-card-primary">
                        <div class="pml-card-header">
                            <h3>🎯 Projet Actuel</h3>
                        </div>
                        <div class="pml-card-content">
                            <div class="pml-project-info">
                                <div class="pml-project-field">
                                    <label>Nom:</label>
                                    <span id="dashboard-project-name">Nouveau Projet</span>
                                </div>
                                <div class="pml-project-field">
                                    <label>Type:</label>
                                    <span id="dashboard-project-type">Processus Industriel</span>
                                </div>
                                <div class="pml-project-field">
                                    <label>Dernière modification:</label>
                                    <span id="dashboard-last-modified">Aujourd'hui</span>
                                </div>
                            </div>
                            <div class="pml-project-actions">
                                <button class="pml-btn pml-btn-primary" data-action="edit-project-info">
                                    ✏️ Modifier Infos
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="pml-card pml-card-secondary">
                        <div class="pml-card-header">
                            <h3>📈 Statistiques</h3>
                        </div>
                        <div class="pml-card-content">
                            <div class="pml-stats-grid">
                                <div class="pml-stat">
                                    <div class="pml-stat-icon">⬢</div>
                                    <div class="pml-stat-info">
                                        <span class="pml-stat-value" id="dashboard-objects">0</span>
                                        <span class="pml-stat-label">Objets</span>
                                    </div>
                                </div>
                                <div class="pml-stat">
                                    <div class="pml-stat-icon">🏷️</div>
                                    <div class="pml-stat-info">
                                        <span class="pml-stat-value" id="dashboard-states">0</span>
                                        <span class="pml-stat-label">États</span>
                                    </div>
                                </div>
                                <div class="pml-stat">
                                    <div class="pml-stat-icon">▶️</div>
                                    <div class="pml-stat-info">
                                        <span class="pml-stat-value" id="dashboard-actions">0</span>
                                        <span class="pml-stat-label">Actions</span>
                                    </div>
                                </div>
                                <div class="pml-stat">
                                    <div class="pml-stat-icon">📋</div>
                                    <div class="pml-stat-info">
                                        <span class="pml-stat-value" id="dashboard-templates">0</span>
                                        <span class="pml-stat-label">Templates</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="pml-card pml-card-accent">
                        <div class="pml-card-header">
                            <h3>🚀 Actions Rapides</h3>
                        </div>
                        <div class="pml-card-content">
                            <div class="pml-quick-actions-grid">
                                <button class="pml-action-card" data-action="quick-object">
                                    <div class="pml-action-icon">⬢</div>
                                    <div class="pml-action-text">Créer Objet</div>
                                </button>
                                <button class="pml-action-card" data-action="quick-template">
                                    <div class="pml-action-icon">📋</div>
                                    <div class="pml-action-text">Appliquer Template</div>
                                </button>
                                <button class="pml-action-card" data-action="quick-export">
                                    <div class="pml-action-icon">📤</div>
                                    <div class="pml-action-text">Export Rapide</div>
                                </button>
                                <button class="pml-action-card" data-action="quick-validation">
                                    <div class="pml-action-icon">✅</div>
                                    <div class="pml-action-text">Valider Processus</div>
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="pml-card pml-card-info">
                        <div class="pml-card-header">
                            <h3>📊 Performance</h3>
                        </div>
                        <div class="pml-card-content">
                            <div class="pml-performance-metrics">
                                <div class="pml-performance-item">
                                    <label>Temps de session:</label>
                                    <span id="session-time-display">00:00:00</span>
                                </div>
                                <div class="pml-performance-item">
                                    <label>Dernière synchronisation:</label>
                                    <span id="last-sync-time">Jamais</span>
                                </div>
                                <div class="pml-performance-item">
                                    <label>Performance Canvas:</label>
                                    <span id="canvas-performance" class="pml-status-good">Excellente</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Crée la vue création de composants
     * @returns {string} HTML de la vue création
     * @private
     */
    createCreationView() {
        return `
            <div class="pml-creation">
                <div class="pml-creation-header">
                    <h2>🎨 Création de Composants</h2>
                    <p>Créez et personnalisez vos objets, états et actions ProcessMetaLanguage</p>
                </div>
                
                <div class="pml-creation-workspace">
                    <div class="pml-creation-toolbar">
                        <div class="pml-tool-group">
                            <h4>🏗️ Composants de Base</h4>
                            <button class="pml-tool-btn pml-tool-object" data-component="object">
                                <div class="pml-tool-icon">⬢</div>
                                <div class="pml-tool-info">
                                    <span class="pml-tool-name">Objet</span>
                                    <span class="pml-tool-desc">Entité tracée (120x80px)</span>
                                </div>
                            </button>
                            <button class="pml-tool-btn pml-tool-state" data-component="state">
                                <div class="pml-tool-icon">🏷️</div>
                                <div class="pml-tool-info">
                                    <span class="pml-tool-name">État</span>
                                    <span class="pml-tool-desc">Condition objet (80x40px)</span>
                                </div>
                            </button>
                            <button class="pml-tool-btn pml-tool-action" data-component="action">
                                <div class="pml-tool-icon">▶️</div>
                                <div class="pml-tool-info">
                                    <span class="pml-tool-name">Action</span>
                                    <span class="pml-tool-desc">Interaction (140x60px)</span>
                                </div>
                            </button>
                        </div>
                        
                        <div class="pml-tool-group">
                            <h4>⚡ Actions Avancées</h4>
                            <button class="pml-tool-btn" data-action="auto-layout">
                                <div class="pml-tool-icon">🔄</div>
                                <div class="pml-tool-info">
                                    <span class="pml-tool-name">Layout Auto</span>
                                    <span class="pml-tool-desc">Organisation automatique</span>
                                </div>
                            </button>
                            <button class="pml-tool-btn" data-action="validate-architecture">
                                <div class="pml-tool-icon">✅</div>
                                <div class="pml-tool-info">
                                    <span class="pml-tool-name">Valider Architecture</span>
                                    <span class="pml-tool-desc">Vérification État-Actions</span>
                                </div>
                            </button>
                        </div>
                    </div>
                    
                    <div class="pml-creation-panel">
                        <div class="pml-panel-header">
                            <h3>🛠️ Propriétés</h3>
                        </div>
                        <div class="pml-panel-content" id="creation-properties">
                            <div class="pml-placeholder">
                                <div class="pml-placeholder-icon">👆</div>
                                <p>Sélectionnez un composant pour modifier ses propriétés</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Crée la vue templates EPCIS
     * @returns {string} HTML de la vue templates
     * @private
     */
    createTemplatesView() {
        return `
            <div class="pml-templates">
                <div class="pml-templates-header">
                    <h2>📋 Templates EPCIS 2.0</h2>
                    <p>Sélectionnez et personnalisez des templates conformes GS1 EPCIS 2.0</p>
                </div>
                
                <div class="pml-templates-workspace">
                    <div class="pml-templates-sidebar">
                        <div class="pml-template-filters">
                            <h4>🔍 Filtres</h4>
                            <div class="pml-filter-group">
                                <label>Catégorie:</label>
                                <select id="template-category-filter">
                                    <option value="all">Toutes</option>
                                    <option value="business-steps">Business Steps</option>
                                    <option value="dispositions">Dispositions</option>
                                </select>
                            </div>
                            <div class="pml-filter-group">
                                <label>Industrie:</label>
                                <select id="template-industry-filter">
                                    <option value="all">Toutes</option>
                                    <option value="manufacturing">Manufacturing</option>
                                    <option value="logistics">Logistique</option>
                                    <option value="retail">Retail</option>
                                </select>
                            </div>
                            <div class="pml-filter-group">
                                <label>Recherche:</label>
                                <input type="text" id="template-search" placeholder="Rechercher templates...">
                            </div>
                        </div>
                        
                        <div class="pml-template-stats">
                            <h4>📊 Statistiques</h4>
                            <div class="pml-stat-item">
                                <span class="pml-stat-label">Business Steps:</span>
                                <span class="pml-stat-value">41</span>
                            </div>
                            <div class="pml-stat-item">
                                <span class="pml-stat-label">Dispositions:</span>
                                <span class="pml-stat-value">25</span>
                            </div>
                            <div class="pml-stat-item">
                                <span class="pml-stat-label">Utilisés:</span>
                                <span class="pml-stat-value" id="templates-used-count">0</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="pml-templates-main">
                        <div class="pml-templates-grid" id="templates-grid">
                            <!-- Templates seront générés dynamiquement -->
                        </div>
                    </div>
                    
                    <div class="pml-templates-preview">
                        <div class="pml-preview-header">
                            <h4>👁️ Preview</h4>
                        </div>
                        <div class="pml-preview-content" id="template-preview">
                            <div class="pml-placeholder">
                                <div class="pml-placeholder-icon">📋</div>
                                <p>Sélectionnez un template pour voir ses détails</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Crée la vue export
     * @returns {string} HTML de la vue export
     * @private
     */
    createExportView() {
        return `
            <div class="pml-export">
                <div class="pml-export-header">
                    <h2>📤 Export et Documentation</h2>
                    <p>Générez documentation, API et mappings pour vos processus</p>
                </div>
                
                <div class="pml-export-grid">
                    <div class="pml-export-card">
                        <div class="pml-export-card-header">
                            <div class="pml-export-icon">📝</div>
                            <h3>Workflow Compiler</h3>
                        </div>
                        <div class="pml-export-card-content">
                            <p>Génère documentation complète du workflow avec API OpenAPI 3.0</p>
                            <div class="pml-export-options">
                                <label>
                                    <input type="checkbox" checked> Documentation markdown
                                </label>
                                <label>
                                    <input type="checkbox" checked> Spécifications API
                                </label>
                                <label>
                                    <input type="checkbox"> Rapport exécutif
                                </label>
                            </div>
                            <button class="pml-btn pml-btn-primary" data-export="workflow">
                                🚀 Générer Workflow
                            </button>
                        </div>
                    </div>
                    
                    <div class="pml-export-card">
                        <div class="pml-export-card-header">
                            <div class="pml-export-icon">📊</div>
                            <h3>Matrix Generator</h3>
                        </div>
                        <div class="pml-export-card-content">
                            <p>Crée matrices de visualisation et analytics avancées</p>
                            <div class="pml-export-options">
                                <label>
                                    <input type="checkbox" checked> Matrice transitions
                                </label>
                                <label>
                                    <input type="checkbox" checked> Dashboard interactif
                                </label>
                                <label>
                                    <input type="checkbox"> Recommandations
                                </label>
                            </div>
                            <button class="pml-btn pml-btn-primary" data-export="matrix">
                                📈 Générer Matrices
                            </button>
                        </div>
                    </div>
                    
                    <div class="pml-export-card">
                        <div class="pml-export-card-header">
                            <div class="pml-export-icon">🔌</div>
                            <h3>OpenAPI Generator</h3>
                        </div>
                        <div class="pml-export-card-content">
                            <p>Génère spécifications API REST avec Swagger UI</p>
                            <div class="pml-export-options">
                                <label>
                                    <input type="checkbox" checked> Spécification OpenAPI 3.0
                                </label>
                                <label>
                                    <input type="checkbox" checked> Swagger UI
                                </label>
                                <label>
                                    <input type="checkbox"> Collection Postman
                                </label>
                            </div>
                            <button class="pml-btn pml-btn-primary" data-export="openapi">
                                🔧 Générer API
                            </button>
                        </div>
                    </div>
                    
                    <div class="pml-export-card">
                        <div class="pml-export-card-header">
                            <div class="pml-export-icon">🔗</div>
                            <h3>360SmartConnect</h3>
                        </div>
                        <div class="pml-export-card-content">
                            <p>Mapping vers 360SmartConnect avec sync bidirectionnelle</p>
                            <div class="pml-export-options">
                                <label>
                                    <input type="checkbox" checked> Mapping avatars
                                </label>
                                <label>
                                    <input type="checkbox" checked> Configuration webhooks
                                </label>
                                <label>
                                    <input type="checkbox"> Scripts déploiement
                                </label>
                            </div>
                            <button class="pml-btn pml-btn-primary" data-export="360sc">
                                🎯 Générer Mapping
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="pml-export-history">
                    <h3>📜 Historique Exports</h3>
                    <div class="pml-export-list" id="export-history">
                        <div class="pml-placeholder">
                            <div class="pml-placeholder-icon">📤</div>
                            <p>Aucun export généré pour le moment</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Crée la vue validation
     * @returns {string} HTML de la vue validation
     * @private
     */
    createValidationView() {
        return `
            <div class="pml-validation">
                <div class="pml-validation-header">
                    <h2>✅ Validation et Qualité</h2>
                    <p>Vérifiez la conformité et la qualité de vos processus</p>
                </div>
                
                <div class="pml-validation-dashboard">
                    <div class="pml-validation-card pml-card-success">
                        <div class="pml-validation-header">
                            <h3>🏗️ Architecture</h3>
                            <span class="pml-status-badge pml-status-good">OK</span>
                        </div>
                        <div class="pml-validation-content">
                            <ul class="pml-validation-list">
                                <li class="pml-validation-item pml-status-good">
                                    ✅ Architecture État-Actions respectée
                                </li>
                                <li class="pml-validation-item pml-status-good">
                                    ✅ Actions principales générées
                                </li>
                                <li class="pml-validation-item pml-status-good">
                                    ✅ Relations graphiques cohérentes
                                </li>
                            </ul>
                            <button class="pml-btn pml-btn-secondary" data-action="validate-architecture">
                                🔍 Valider à Nouveau
                            </button>
                        </div>
                    </div>
                    
                    <div class="pml-validation-card pml-card-info">
                        <div class="pml-validation-header">
                            <h3>📋 EPCIS 2.0</h3>
                            <span class="pml-status-badge pml-status-good">Conforme</span>
                        </div>
                        <div class="pml-validation-content">
                            <ul class="pml-validation-list">
                                <li class="pml-validation-item pml-status-good">
                                    ✅ Business steps conformes GS1
                                </li>
                                <li class="pml-validation-item pml-status-good">
                                    ✅ Dispositions CBV 2.0 valides
                                </li>
                                <li class="pml-validation-item pml-status-good">
                                    ✅ Métadonnées EPCIS complètes
                                </li>
                            </ul>
                            <button class="pml-btn pml-btn-secondary" data-action="validate-epcis">
                                📊 Rapport Conformité
                            </button>
                        </div>
                    </div>
                    
                    <div class="pml-validation-card pml-card-warning">
                        <div class="pml-validation-header">
                            <h3>⚡ Performance</h3>
                            <span class="pml-status-badge pml-status-warning">Attention</span>
                        </div>
                        <div class="pml-validation-content">
                            <ul class="pml-validation-list">
                                <li class="pml-validation-item pml-status-good">
                                    ✅ Synchronisation < 5s
                                </li>
                                <li class="pml-validation-item pml-status-warning">
                                    ⚠️ 12 composants (recommandé: < 10)
                                </li>
                                <li class="pml-validation-item pml-status-good">
                                    ✅ Mémoire usage normal
                                </li>
                            </ul>
                            <button class="pml-btn pml-btn-secondary" data-action="optimize-performance">
                                🚀 Optimiser
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="pml-validation-tools">
                    <h3>🛠️ Outils de Validation</h3>
                    <div class="pml-validation-tools-grid">
                        <button class="pml-validation-tool" data-action="full-validation">
                            <div class="pml-tool-icon">🔍</div>
                            <div class="pml-tool-info">
                                <span class="pml-tool-name">Validation Complète</span>
                                <span class="pml-tool-desc">Analyse approfondie du processus</span>
                            </div>
                        </button>
                        <button class="pml-validation-tool" data-action="consistency-check">
                            <div class="pml-tool-icon">🔄</div>
                            <div class="pml-tool-info">
                                <span class="pml-tool-name">Vérification Cohérence</span>
                                <span class="pml-tool-desc">Détection incohérences</span>
                            </div>
                        </button>
                        <button class="pml-validation-tool" data-action="quality-report">
                            <div class="pml-tool-icon">📊</div>
                            <div class="pml-tool-info">
                                <span class="pml-tool-name">Rapport Qualité</span>
                                <span class="pml-tool-desc">Métriques et recommandations</span>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Ajoute les styles CSS de l'interface
     * @sideEffect Insère styles CSS dans le document
     * @private
     */
    addStyles() {
        const styleId = 'pml-interface-styles';
        
        // Éviter la duplication des styles
        if (document.getElementById(styleId)) {
            return;
        }
        
        const styles = document.createElement('style');
        styles.id = styleId;
        styles.textContent = `
            /* ProcessMetaLanguage Interface Styles */
            .pml-interface {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: var(--background-primary);
                color: var(--text-normal);
                font-family: var(--font-interface);
                font-size: 14px;
                z-index: 1000;
                display: flex;
                flex-direction: column;
            }
            
            /* Header */
            .pml-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 8px 16px;
                background: var(--background-secondary);
                border-bottom: 1px solid var(--background-modifier-border);
                height: 60px;
                flex-shrink: 0;
            }
            
            .pml-logo {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .pml-logo h1 {
                margin: 0;
                font-size: 18px;
                font-weight: 600;
                color: var(--text-accent);
            }
            
            .pml-version {
                background: var(--interactive-accent);
                color: white;
                padding: 2px 6px;
                border-radius: 3px;
                font-size: 10px;
                font-weight: 500;
            }
            
            .pml-toolbar {
                display: flex;
                gap: 8px;
            }
            
            .pml-user-controls {
                display: flex;
                gap: 4px;
            }
            
            /* Buttons */
            .pml-btn {
                padding: 6px 12px;
                border: none;
                border-radius: 4px;
                font-size: 12px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s;
                display: inline-flex;
                align-items: center;
                gap: 4px;
            }
            
            .pml-btn-primary {
                background: var(--interactive-accent);
                color: white;
            }
            
            .pml-btn-primary:hover {
                background: var(--interactive-accent-hover);
            }
            
            .pml-btn-secondary {
                background: var(--background-modifier-hover);
                color: var(--text-normal);
            }
            
            .pml-btn-secondary:hover {
                background: var(--background-modifier-active);
            }
            
            .pml-btn-icon {
                padding: 6px;
                background: transparent;
                color: var(--text-muted);
            }
            
            .pml-btn-icon:hover {
                background: var(--background-modifier-hover);
                color: var(--text-normal);
            }
            
            /* Main Layout */
            .pml-main {
                display: flex;
                flex: 1;
                overflow: hidden;
            }
            
            .pml-sidebar {
                width: ${this.config.layout.width}px;
                background: var(--background-secondary);
                border-right: 1px solid var(--background-modifier-border);
                overflow-y: auto;
                flex-shrink: 0;
            }
            
            .pml-sidebar.right {
                order: 2;
                border-right: none;
                border-left: 1px solid var(--background-modifier-border);
            }
            
            .pml-content {
                flex: 1;
                overflow-y: auto;
                padding: 0;
            }
            
            /* Navigation */
            .pml-nav-section {
                padding: 16px;
                border-bottom: 1px solid var(--background-modifier-border);
            }
            
            .pml-nav-section h3 {
                margin: 0 0 12px 0;
                font-size: 12px;
                font-weight: 600;
                color: var(--text-muted);
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            .pml-nav-list {
                list-style: none;
                margin: 0;
                padding: 0;
            }
            
            .pml-nav-btn {
                display: block;
                width: 100%;
                padding: 8px 12px;
                margin-bottom: 2px;
                background: transparent;
                border: none;
                text-align: left;
                color: var(--text-normal);
                border-radius: 4px;
                cursor: pointer;
                transition: all 0.2s;
                font-size: 13px;
            }
            
            .pml-nav-btn:hover {
                background: var(--background-modifier-hover);
            }
            
            .pml-nav-btn.active {
                background: var(--interactive-accent);
                color: white;
            }
            
            /* Quick Actions */
            .pml-quick-actions {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
            }
            
            .pml-quick-btn {
                flex: 1;
                min-width: 60px;
                padding: 12px 8px;
                background: var(--background-modifier-hover);
                border: none;
                border-radius: 6px;
                text-align: center;
                cursor: pointer;
                transition: all 0.2s;
                font-size: 11px;
                color: var(--text-normal);
            }
            
            .pml-quick-btn:hover {
                background: var(--interactive-accent);
                color: white;
                transform: translateY(-1px);
            }
            
            /* Metrics */
            .pml-metrics {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 12px;
            }
            
            .pml-metric {
                text-align: center;
                padding: 8px;
                background: var(--background-modifier-hover);
                border-radius: 4px;
            }
            
            .pml-metric-value {
                display: block;
                font-size: 20px;
                font-weight: 600;
                color: var(--interactive-accent);
            }
            
            .pml-metric-label {
                font-size: 10px;
                color: var(--text-muted);
                text-transform: uppercase;
            }
            
            /* Views */
            .pml-view {
                display: none;
                padding: 24px;
                height: 100%;
                overflow-y: auto;
            }
            
            .pml-view.active {
                display: block;
            }
            
            /* Dashboard */
            .pml-dashboard-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 20px;
                margin-top: 20px;
            }
            
            .pml-card {
                background: var(--background-secondary);
                border: 1px solid var(--background-modifier-border);
                border-radius: 8px;
                overflow: hidden;
            }
            
            .pml-card-header {
                padding: 16px;
                background: var(--background-modifier-hover);
                border-bottom: 1px solid var(--background-modifier-border);
            }
            
            .pml-card-header h3 {
                margin: 0;
                font-size: 16px;
                font-weight: 600;
            }
            
            .pml-card-content {
                padding: 16px;
            }
            
            /* Status Bar */
            .pml-status-bar {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px 16px;
                background: var(--background-secondary);
                border-top: 1px solid var(--background-modifier-border);
                font-size: 12px;
                color: var(--text-muted);
                flex-shrink: 0;
            }
            
            .pml-status-left, .pml-status-right {
                display: flex;
                gap: 16px;
            }
            
            .pml-status-indicator.active {
                color: var(--interactive-accent);
                font-weight: 500;
            }
            
            /* Responsive */
            @media (max-width: 768px) {
                .pml-sidebar {
                    width: 280px;
                }
                
                .pml-dashboard-grid {
                    grid-template-columns: 1fr;
                }
            }
            
            /* Theme Adaptations */
            .theme-dark .pml-interface {
                --pml-accent: #7c3aed;
            }
            
            .theme-light .pml-interface {
                --pml-accent: #8b5cf6;
            }
        `;
        
        document.head.appendChild(styles);
    }
    
    /**
     * Attache tous les event listeners
     * @sideEffect Ajoute event listeners DOM
     * @private
     */
    attachEventListeners() {
        // Navigation entre vues
        this.container.addEventListener('click', (e) => {
            const navBtn = e.target.closest('.pml-nav-btn');
            if (navBtn) {
                const view = navBtn.dataset.view;
                if (view) {
                    this.switchView(view);
                }
            }
        });
        
        // Actions toolbar
        this.container.addEventListener('click', (e) => {
            const actionBtn = e.target.closest('[data-action]');
            if (actionBtn) {
                const action = actionBtn.dataset.action;
                this.handleAction(action);
            }
        });
        
        // Export buttons
        this.container.addEventListener('click', (e) => {
            const exportBtn = e.target.closest('[data-export]');
            if (exportBtn) {
                const exportType = exportBtn.dataset.export;
                this.handleExport(exportType);
            }
        });
        
        // Création composants
        this.container.addEventListener('click', (e) => {
            const componentBtn = e.target.closest('[data-component]');
            if (componentBtn) {
                const component = componentBtn.dataset.component;
                this.handleComponentCreation(component);
            }
        });
        
        // Timer session
        this.startSessionTimer();
        
        // Auto-save
        if (this.config.autoSave) {
            this.startAutoSave();
        }
    }
    
    /**
     * Change la vue active
     * @param {string} viewName - Nom de la vue à afficher
     * @sideEffect Met à jour DOM interface
     */
    switchView(viewName) {
        // Désactiver vue actuelle
        const currentView = this.container.querySelector('.pml-view.active');
        const currentNavBtn = this.container.querySelector('.pml-nav-btn.active');
        
        if (currentView) currentView.classList.remove('active');
        if (currentNavBtn) currentNavBtn.classList.remove('active');
        
        // Activer nouvelle vue
        const newView = this.container.querySelector(`#pml-view-${viewName}`);
        const newNavBtn = this.container.querySelector(`[data-view="${viewName}"]`);
        
        if (newView) newView.classList.add('active');
        if (newNavBtn) newNavBtn.classList.add('active');
        
        this.currentView = viewName;
        
        // Charger contenu dynamique si nécessaire
        this.loadViewContent(viewName);
        
        console.log(`📄 Vue changée: ${viewName}`);
    }
    
    /**
     * Charge le contenu dynamique d'une vue
     * @param {string} viewName - Nom de la vue
     * @private
     */
    async loadViewContent(viewName) {
        switch (viewName) {
            case 'templates':
                await this.loadTemplatesContent();
                break;
            case 'export':
                this.updateExportHistory();
                break;
            case 'validation':
                await this.updateValidationStatus();
                break;
        }
    }
    
    /**
     * Gère les actions utilisateur
     * @param {string} action - Action à exécuter
     */
    async handleAction(action) {
        console.log(`🎯 Action: ${action}`);
        
        switch (action) {
            case 'new-project':
                await this.createNewProject();
                break;
            case 'open-project':
                await this.openProject();
                break;
            case 'save-project':
                await this.saveProject();
                break;
            case 'settings':
                this.showSettings();
                break;
            case 'help':
                this.showHelp();
                break;
            case 'quick-object':
            case 'create-object':
                await this.createQuickComponent('object');
                break;
            case 'create-state':
                await this.createQuickComponent('state');
                break;
            case 'create-action':
                await this.createQuickComponent('action');
                break;
            case 'quick-template':
                this.switchView('templates');
                break;
            case 'quick-export':
                this.switchView('export');
                break;
            case 'quick-validation':
                this.switchView('validation');
                break;
            default:
                console.log(`⚠️ Action non implémentée: ${action}`);
        }
    }
    
    /**
     * Gère les exports
     * @param {string} exportType - Type d'export
     */
    async handleExport(exportType) {
        console.log(`📤 Export: ${exportType}`);
        
        try {
            const module = this.modules.get(this.getExportModuleName(exportType));
            if (!module) {
                throw new Error(`Module d'export ${exportType} non trouvé`);
            }
            
            // Configuration export basée sur les options UI
            const exportConfig = this.getExportConfig(exportType);
            
            // Afficher loading
            this.showLoading(`Génération ${exportType}...`);
            
            // Exécuter export
            const result = await this.executeExport(module, exportType, exportConfig);
            
            // Mettre à jour métriques
            this.metrics.exportsGenerated++;
            this.updateMetrics();
            
            // Ajouter à l'historique
            this.addToExportHistory(exportType, result);
            
            // Masquer loading
            this.hideLoading();
            
            // Notification succès
            this.showNotification('success', `Export ${exportType} généré avec succès!`);
            
        } catch (error) {
            this.hideLoading();
            this.showError(`Erreur export ${exportType}`, error.message);
            console.error(`❌ Erreur export ${exportType}:`, error);
        }
    }
    
    /**
     * Démarre le timer de session
     * @private
     */
    startSessionTimer() {
        setInterval(() => {
            const duration = Date.now() - this.metrics.sessionStartTime;
            const formatted = this.formatDuration(duration);
            
            const sessionDisplay = this.container.querySelector('#session-time-display');
            const sessionDuration = this.container.querySelector('#session-duration');
            
            if (sessionDisplay) sessionDisplay.textContent = formatted;
            if (sessionDuration) sessionDuration.textContent = formatted.substring(0, 5); // HH:MM
        }, 1000);
    }
    
    /**
     * Met à jour les métriques affichées
     * @sideEffect Met à jour compteurs DOM
     */
    updateMetrics() {
        // Sidebar metrics
        const objectsCount = this.container.querySelector('#objects-count');
        const statesCount = this.container.querySelector('#states-count');
        const actionsCount = this.container.querySelector('#actions-count');
        
        if (objectsCount) objectsCount.textContent = this.metrics.objectsCreated;
        if (statesCount) statesCount.textContent = this.metrics.statesCreated;
        if (actionsCount) actionsCount.textContent = this.metrics.actionsCreated;
        
        // Dashboard metrics
        const dashboardObjects = this.container.querySelector('#dashboard-objects');
        const dashboardStates = this.container.querySelector('#dashboard-states');
        const dashboardActions = this.container.querySelector('#dashboard-actions');
        const dashboardTemplates = this.container.querySelector('#dashboard-templates');
        
        if (dashboardObjects) dashboardObjects.textContent = this.metrics.objectsCreated;
        if (dashboardStates) dashboardStates.textContent = this.metrics.statesCreated;
        if (dashboardActions) dashboardActions.textContent = this.metrics.actionsCreated;
        if (dashboardTemplates) dashboardTemplates.textContent = this.metrics.templatesUsed.size;
    }
    
    /**
     * Affiche l'interface
     * @sideEffect Ajoute interface au DOM
     */
    show() {
        if (this.isVisible) return;
        
        // Ajouter au DOM
        document.body.appendChild(this.container);
        this.isVisible = true;
        
        // Mettre à jour métriques initiales
        this.updateMetrics();
        
        console.log('👁️ Interface ProcessMetaLanguage affichée');
    }
    
    /**
     * Masque l'interface
     * @sideEffect Retire interface du DOM
     */
    hide() {
        if (!this.isVisible) return;
        
        if (this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        this.isVisible = false;
        
        console.log('🙈 Interface ProcessMetaLanguage masquée');
    }
    
    /**
     * Callback création composant
     * @param {string} type - Type de composant créé
     * @param {string} id - ID du composant
     * @private
     */
    onComponentCreated(type, id) {
        this.metrics[`${type}sCreated`]++;
        this.updateMetrics();
        
        console.log(`✅ Composant créé: ${type} (${id})`);
    }
    
    /**
     * Callback sélection templates
     * @param {Array} templates - Templates sélectionnés
     * @private
     */
    onTemplatesSelected(templates) {
        templates.forEach(template => {
            this.metrics.templatesUsed.add(template.id);
        });
        this.updateMetrics();
        
        console.log(`📋 Templates appliqués: ${templates.length}`);
    }
    
    /**
     * Affiche une notification
     * @param {string} type - Type notification (success, error, warning, info)
     * @param {string} message - Message à afficher
     */
    showNotification(type, message) {
        // TODO: Implémenter système de notifications
        console.log(`📢 ${type.toUpperCase()}: ${message}`);
    }
    
    /**
     * Affiche une erreur
     * @param {string} title - Titre erreur
     * @param {string} message - Message erreur
     */
    showError(title, message) {
        console.error(`❌ ${title}: ${message}`);
        this.showNotification('error', `${title}: ${message}`);
    }
    
    /**
     * Formate une durée en millisecondes
     * @param {number} ms - Durée en millisecondes
     * @returns {string} Durée formatée (HH:MM:SS)
     * @private
     */
    formatDuration(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        return `${hours.toString().padStart(2, '0')}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
    }
    
    /**
     * Détruit l'interface et nettoie les ressources
     * @sideEffect Nettoie event listeners, modules, DOM
     */
    destroy() {
        // Masquer interface
        this.hide();
        
        // Nettoyer event handlers
        this.eventHandlers.clear();
        
        // Détruire modules
        for (const [name, module] of this.modules) {
            if (module.destroy) {
                module.destroy();
            }
        }
        this.modules.clear();
        
        // Supprimer styles
        const styles = document.getElementById('pml-interface-styles');
        if (styles) {
            styles.remove();
        }
        
        console.log('🗑️ Interface ProcessMetaLanguage détruite');
    }
}

// Export déjà fait via export class

// <!-- END OF FILE: main-interface.js -->