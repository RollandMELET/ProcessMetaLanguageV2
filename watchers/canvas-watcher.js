// <!-- START OF FILE: canvas-watcher.js -->
// FILENAME: canvas-watcher.js
// Version: 1.0.0
// Date: 2025-07-31 17:45
// Author: Rolland MELET & Claude Code
// Description: Surveillance canvas Excalidraw ProcessMetaLanguage - TASK-B011 Phase 4 détection changements automatique

/**
 * Module ProcessMetaLanguage - Canvas Watcher
 * 
 * Système de surveillance intelligent des canvas Excalidraw ProcessMetaLanguage.
 * Détecte les changements visuels et déclenche automatiquement la synchronisation.
 * 
 * Fonctionnalités principales:
 * - Surveillance temps réel des modifications canvas
 * - Détection granulaire des changements d'éléments
 * - Analyse diff des éléments ProcessMetaLanguage
 * - Debouncing intelligent pour éviter triggers excessifs
 * - Cache des states canvas pour comparaison
 * - Intégration avec FileWatcher pour surveillance unifiée
 * - Métriques et logging détaillés
 * - Support hot-reloading et live-reload
 * - Gestion robuste des erreurs et recovery
 */

import { EventEmitter } from 'events';
import { performance } from 'perf_hooks';
import { createHash } from 'crypto';

/**
 * Configuration du canvas watcher
 * @constant {Object}
 */
const CANVAS_WATCHER_CONFIG = {
    // Surveillance des canvas
    watching: {
        enablePolling: true,            // Polling pour changements canvas
        pollingInterval: 1000,          // Intervalle polling en ms
        enableEventListening: true,     // Écoute événements Excalidraw
        enableDeepAnalysis: true,       // Analyse profonde des éléments
        maxCanvasSize: 10000           // Taille max canvas surveillé
    },
    
    // Types d'éléments ProcessMetaLanguage surveillés
    elementTypes: {
        processObject: {
            tag: '#process-object',
            shape: 'hexagon',
            priority: 1,
            trackProperties: ['x', 'y', 'width', 'height', 'text', 'fillColor']
        },
        processState: {
            tag: '#process-state', 
            shape: 'rectangle',
            priority: 2,
            trackProperties: ['x', 'y', 'width', 'height', 'text', 'fillColor']
        },
        processAction: {
            tag: '#process-action',
            shape: 'rectangle',
            priority: 3,
            trackProperties: ['x', 'y', 'width', 'height', 'text', 'fillColor']
        },
        arrow: {
            tag: 'arrow',
            shape: 'arrow',
            priority: 4,
            trackProperties: ['startBinding', 'endBinding', 'points']
        }
    },
    
    // Debouncing et performance
    debouncing: {
        enabled: true,
        delay: 800,                     // 800ms debounce par défaut
        maxDelay: 3000,                 // Délai max avant force trigger
        batchSize: 20,                  // Batch jusqu'à 20 changements
        batchTimeout: 1500              // Timeout batch en ms
    },
    
    // Détection des changements
    changeDetection: {
        enableElementTracking: true,
        enablePropertyTracking: true,
        enableRelationTracking: true,
        enablePositionTracking: true,
        sensitivityThreshold: 5,        // Seuil sensibilité position (px)
        textChangeThreshold: 1          // Seuil changement texte (chars)
    },
    
    // Cache des states canvas
    cache: {
        enabled: true,
        maxStates: 100,                 // Max 100 states en cache
        compressionEnabled: true,
        ttl: 600000                     // TTL 10min
    },
    
    // Intégration synchronisation
    sync: {
        autoTrigger: true,
        triggerDelay: 1200,             // Délai avant déclenchement sync
        maxRetries: 3,
        retryDelay: 2000,
        batchOperations: true
    },
    
    // Monitoring et métriques
    monitoring: {
        enableMetrics: true,
        metricsInterval: 2000,          // Métriques toutes les 2s
        enableLogging: true,
        logLevel: 'info',
        maxLogEntries: 500
    }
};

/**
 * Événement de changement canvas
 * @typedef {Object} CanvasChangeEvent
 * @property {string} type - Type d'événement ('element_added', 'element_modified', 'element_deleted', 'relation_changed')
 * @property {string} canvasId - ID du canvas
 * @property {string} elementId - ID de l'élément modifié
 * @property {string} elementType - Type d'élément ProcessMetaLanguage
 * @property {Object} changes - Détail des changements
 * @property {number} timestamp - Timestamp de l'événement
 * @property {Object} metadata - Métadonnées additionnelles
 */

/**
 * Surveillance intelligente des canvas Excalidraw ProcessMetaLanguage
 * Détecte automatiquement les changements et déclenche la synchronisation
 * 
 * @class CanvasWatcher
 * @extends EventEmitter
 * @example
 * // Surveillance automatique avec synchronisation
 * const watcher = new CanvasWatcher({
 *   pollingInterval: 500,
 *   autoSync: true,
 *   debounceDelay: 600
 * });
 * 
 * await watcher.initialize();
 * 
 * // Écouter événements de changement
 * watcher.on('canvasChanged', (event) => {
 *   console.log(`Canvas modifié: ${event.canvasId} - ${event.type}`);
 * });
 * 
 * // Surveiller canvas spécifique
 * await watcher.startWatching(['canvas-1', 'canvas-2']);
 * 
 * console.log('Surveillance canvas active - les changements déclencheront la sync automatiquement');
 */
export class CanvasWatcher extends EventEmitter {
    /**
     * Initialise la surveillance de canvas
     * @param {Object} options - Options de configuration
     * @param {number} options.pollingInterval - Intervalle polling en ms (défaut: 1000)
     * @param {boolean} options.autoSync - Synchronisation automatique (défaut: true)
     * @param {number} options.debounceDelay - Délai debounce en ms (défaut: 800)
     * @param {Array<string>} options.watchedElements - Types d'éléments à surveiller
     */
    constructor(options = {}) {
        super();
        
        this.config = {
            ...CANVAS_WATCHER_CONFIG,
            ...options
        };
        
        // État du watcher
        this.isInitialized = false;
        this.isWatching = false;
        this.watchedCanvases = new Map();       // CanvasId → CanvasState
        this.pollingInterval = null;
        
        // Debouncing et batching
        this.debounceTimers = new Map();        // CanvasId → Timer
        this.changeBatch = [];
        this.batchTimer = null;
        this.lastTrigger = new Map();           // CanvasId → Timestamp
        
        // Cache des states canvas
        this.canvasStateCache = new Map();      // CanvasId → CompressedState
        this.previousStates = new Map();        // CanvasId → PreviousState
        
        // Métriques de surveillance
        this.metrics = {
            totalChanges: 0,
            changesPerType: {
                element_added: 0,
                element_modified: 0,
                element_deleted: 0,
                relation_changed: 0
            },
            canvasesWatched: 0,
            syncTriggered: 0,
            debounceHits: 0,
            errors: 0,
            averageProcessingTime: 0,
            totalProcessingTime: 0
        };
        
        // Logging et historique
        this.changeLog = [];
        this.errorLog = [];
        
        // Intégration synchronisation
        this.syncCallback = null;
        this.syncInProgress = false;
        this.pendingSyncOperations = new Set();
        
        // Intervalles de maintenance
        this.metricsInterval = null;
        this.cleanupInterval = null;
        
        // Référence ExcalidrawAutomate
        this.excalidrawAutomate = null;
    }
    
    /**
     * Initialise le système de surveillance canvas
     * @returns {Promise<void>}
     * @sideEffect Configure ExcalidrawAutomate, initialise cache, démarre monitoring
     */
    async initialize() {
        try {
            console.log('🎯 Initialisation CanvasWatcher...');
            
            // Vérifier disponibilité ExcalidrawAutomate
            if (typeof window !== 'undefined' && window.ExcalidrawAutomate) {
                this.excalidrawAutomate = window.ExcalidrawAutomate;
                console.log('✅ ExcalidrawAutomate détecté');
            } else {
                console.warn('⚠️ ExcalidrawAutomate non disponible - mode simulation activé');
            }
            
            // Initialiser cache canvas si activé
            if (this.config.cache.enabled) {
                await this.initializeCanvasCache();
            }
            
            // Démarrer monitoring si activé
            if (this.config.monitoring.enableMetrics) {
                this.startMetricsCollection();
            }
            
            // Démarrer nettoyage périodique
            this.startMaintenanceIntervals();
            
            this.isInitialized = true;
            console.log('✅ CanvasWatcher initialisé avec succès');
            
            this.emit('initialized', {
                excalidrawAvailable: !!this.excalidrawAutomate,
                cacheEnabled: this.config.cache.enabled,
                autoSyncEnabled: this.config.sync.autoTrigger
            });
            
        } catch (error) {
            console.error('❌ Erreur initialisation CanvasWatcher:', error);
            throw new Error(`Échec initialisation CanvasWatcher: ${error.message}`);
        }
    }
    
    /**
     * Démarre la surveillance de canvas spécifiés
     * @param {Array<string>} canvasIds - IDs des canvas à surveiller
     * @param {Object} options - Options de surveillance
     * @param {Function} options.syncCallback - Callback de synchronisation
     * @returns {Promise<void>}
     * @sideEffect Démarre polling, active surveillance temps réel
     * @example
     * // Surveiller avec callback de sync personnalisé
     * await watcher.startWatching(['main-canvas', 'draft-canvas'], {
     *   syncCallback: async (events) => {
     *     console.log(`Synchronisation pour ${events.length} changements canvas`);
     *     return await myCanvasSync(events);
     *   }
     * });
     */
    async startWatching(canvasIds = [], options = {}) {
        if (!this.isInitialized) {
            throw new Error('CanvasWatcher non initialisé - appelez initialize() d\'abord');
        }
        
        try {
            console.log(`🎯 Démarrage surveillance de ${canvasIds.length} canvas...`);
            
            // Configurer callback de synchronisation
            if (options.syncCallback) {
                this.syncCallback = options.syncCallback;
            }
            
            // Ajouter canvas à surveiller
            for (const canvasId of canvasIds) {
                await this.addCanvasToWatch(canvasId);
            }
            
            // Démarrer polling si activé
            if (this.config.watching.enablePolling && !this.pollingInterval) {
                this.startPolling();
            }
            
            // Configurer listeners événements Excalidraw si disponible
            if (this.config.watching.enableEventListening && this.excalidrawAutomate) {
                this.setupExcalidrawListeners();
            }
            
            this.isWatching = true;
            
            console.log(`✅ Surveillance active sur ${this.watchedCanvases.size} canvas`);
            
            this.emit('watchingStarted', {
                canvasCount: this.watchedCanvases.size,
                watchedCanvases: Array.from(this.watchedCanvases.keys())
            });
            
        } catch (error) {
            console.error('❌ Erreur démarrage surveillance canvas:', error);
            throw new Error(`Échec démarrage surveillance canvas: ${error.message}`);
        }
    }
    
    /**
     * Ajoute un canvas à la surveillance
     * @param {string} canvasId - ID du canvas à surveiller
     * @returns {Promise<void>}
     * @private
     */
    async addCanvasToWatch(canvasId) {
        try {
            // Obtenir état initial du canvas
            const initialState = await this.captureCanvasState(canvasId);
            
            if (!initialState) {
                throw new Error(`Impossible de capturer l'état initial du canvas ${canvasId}`);
            }
            
            // Enregistrer canvas surveillé
            this.watchedCanvases.set(canvasId, {
                id: canvasId,
                lastUpdate: Date.now(),
                elementCount: initialState.elements.length,
                state: initialState
            });
            
            // Sauvegarder état précédent pour comparaison
            this.previousStates.set(canvasId, this.cloneCanvasState(initialState));
            
            // Mettre en cache si activé
            if (this.config.cache.enabled) {
                this.cacheCanvasState(canvasId, initialState);
            }
            
            this.metrics.canvasesWatched++;
            
            console.log(`👁️ Surveillance ajoutée: canvas ${canvasId} (${initialState.elements.length} éléments)`);
            
        } catch (error) {
            this.logError(`Erreur ajout surveillance canvas ${canvasId}`, error);
            throw error;
        }
    }
    
    /**
     * Démarre le polling des canvas
     * @private
     */
    startPolling() {
        console.log(`🔄 Démarrage polling (${this.config.watching.pollingInterval}ms)...`);
        
        this.pollingInterval = setInterval(() => {
            this.pollCanvasChanges();
        }, this.config.watching.pollingInterval);
    }
    
    /**
     * Poll les changements sur tous les canvas surveillés
     * @private
     */
    async pollCanvasChanges() {
        if (!this.isWatching || this.watchedCanvases.size === 0) return;
        
        const startTime = performance.now();
        
        try {
            const changesToProcess = [];
            
            // Vérifier chaque canvas surveillé
            for (const [canvasId, canvasInfo] of this.watchedCanvases.entries()) {
                const changes = await this.detectCanvasChanges(canvasId);
                if (changes.length > 0) {
                    changesToProcess.push(...changes);
                }
            }
            
            // Traiter les changements détectés
            if (changesToProcess.length > 0) {
                await this.processCanvasChanges(changesToProcess);
            }
            
            // Mettre à jour métriques
            const processingTime = performance.now() - startTime;
            this.updatePollingMetrics(processingTime, changesToProcess.length);
            
        } catch (error) {
            this.logError('Erreur polling canvas', error);
        }
    }
    
    /**
     * Détecte les changements sur un canvas spécifique
     * @param {string} canvasId - ID du canvas à analyser
     * @returns {Promise<Array>} Liste des changements détectés
     * @private
     */
    async detectCanvasChanges(canvasId) {
        try {
            // Capturer état actuel
            const currentState = await this.captureCanvasState(canvasId);
            if (!currentState) return [];
            
            // Obtenir état précédent
            const previousState = this.previousStates.get(canvasId);
            if (!previousState) {
                // Premier scan - sauvegarder et continuer
                this.previousStates.set(canvasId, this.cloneCanvasState(currentState));
                return [];
            }
            
            // Analyser différences
            const changes = this.analyzeCanvasDifferences(canvasId, previousState, currentState);
            
            // Mettre à jour état précédent si changements détectés
            if (changes.length > 0) {
                this.previousStates.set(canvasId, this.cloneCanvasState(currentState));
                this.watchedCanvases.get(canvasId).lastUpdate = Date.now();
                this.watchedCanvases.get(canvasId).state = currentState;
            }
            
            return changes;
            
        } catch (error) {
            this.logError(`Erreur détection changements canvas ${canvasId}`, error);
            return [];
        }
    }
    
    /**
     * Capture l'état actuel d'un canvas
     * @param {string} canvasId - ID du canvas
     * @returns {Promise<Object|null>} État du canvas ou null si erreur
     * @private
     */
    async captureCanvasState(canvasId) {
        try {
            if (this.excalidrawAutomate) {
                // Utiliser ExcalidrawAutomate pour capturer l'état réel
                const elements = await this.excalidrawAutomate.getElements();
                const appState = await this.excalidrawAutomate.getAppState();
                
                return {
                    canvasId: canvasId,
                    timestamp: Date.now(),
                    elements: this.filterProcessMetaLanguageElements(elements),
                    appState: {
                        viewBackgroundColor: appState.viewBackgroundColor,
                        zoom: appState.zoom
                    },
                    checksum: this.calculateStateChecksum(elements)
                };
            } else {
                // Mode simulation - générer état factice
                return this.generateMockCanvasState(canvasId);
            }
            
        } catch (error) {
            console.warn(`⚠️ Erreur capture état canvas ${canvasId}:`, error.message);
            return null;
        }
    }
    
    /**
     * Filtre les éléments ProcessMetaLanguage du canvas
     * @param {Array} elements - Tous les éléments du canvas
     * @returns {Array} Éléments ProcessMetaLanguage uniquement
     * @private
     */
    filterProcessMetaLanguageElements(elements) {
        return elements.filter(element => {
            // Vérifier tags ProcessMetaLanguage
            for (const [type, config] of Object.entries(this.config.elementTypes)) {
                if (element.customData?.tags?.includes(config.tag) || 
                    element.text?.includes(config.tag)) {
                    element.processMetaLanguageType = type;
                    return true;
                }
            }
            
            // Inclure flèches connectées aux éléments ProcessMetaLanguage
            if (element.type === 'arrow') {
                return this.isArrowConnectedToProcessElements(element, elements);
            }
            
            return false;
        });
    }
    
    /**
     * Vérifie si une flèche est connectée aux éléments ProcessMetaLanguage
     * @param {Object} arrow - Élément flèche
     * @param {Array} allElements - Tous les éléments
     * @returns {boolean} True si connectée
     * @private
     */
    isArrowConnectedToProcessElements(arrow, allElements) {
        if (!arrow.startBinding && !arrow.endBinding) return false;
        
        const checkBinding = (binding) => {
            if (!binding || !binding.elementId) return false;
            const connectedElement = allElements.find(el => el.id === binding.elementId);
            return connectedElement && this.isProcessMetaLanguageElement(connectedElement);
        };
        
        return checkBinding(arrow.startBinding) || checkBinding(arrow.endBinding);
    }
    
    /**
     * Vérifie si un élément est de type ProcessMetaLanguage
     * @param {Object} element - Élément à vérifier
     * @returns {boolean} True si ProcessMetaLanguage
     * @private
     */
    isProcessMetaLanguageElement(element) {
        for (const config of Object.values(this.config.elementTypes)) {
            if (element.customData?.tags?.includes(config.tag) || 
                element.text?.includes(config.tag)) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * Analyse les différences entre deux états de canvas
     * @param {string} canvasId - ID du canvas
     * @param {Object} previousState - État précédent
     * @param {Object} currentState - État actuel
     * @returns {Array} Liste des changements détectés
     * @private
     */
    analyzeCanvasDifferences(canvasId, previousState, currentState) {
        const changes = [];
        
        // Créer maps pour comparaison efficace
        const prevElements = new Map(previousState.elements.map(el => [el.id, el]));
        const currElements = new Map(currentState.elements.map(el => [el.id, el]));
        
        // Détecter éléments ajoutés
        for (const [id, element] of currElements) {
            if (!prevElements.has(id)) {
                changes.push(this.createChangeEvent(
                    'element_added',
                    canvasId,
                    id,
                    element.processMetaLanguageType || 'unknown',
                    { element: element }
                ));
            }
        }
        
        // Détecter éléments supprimés
        for (const [id, element] of prevElements) {
            if (!currElements.has(id)) {
                changes.push(this.createChangeEvent(
                    'element_deleted',
                    canvasId,
                    id,
                    element.processMetaLanguageType || 'unknown',
                    { element: element }
                ));
            }
        }
        
        // Détecter éléments modifiés
        for (const [id, currentElement] of currElements) {
            const previousElement = prevElements.get(id);
            if (previousElement) {
                const elementChanges = this.detectElementChanges(previousElement, currentElement);
                if (elementChanges.length > 0) {
                    changes.push(this.createChangeEvent(
                        'element_modified',
                        canvasId,
                        id,
                        currentElement.processMetaLanguageType || 'unknown',
                        { 
                            changes: elementChanges,
                            previousElement: previousElement,
                            currentElement: currentElement
                        }
                    ));
                }
            }
        }
        
        // Détecter changements de relations (flèches)
        const relationChanges = this.detectRelationChanges(previousState, currentState);
        changes.push(...relationChanges);
        
        return changes;
    }
    
    /**
     * Détecte les changements sur un élément spécifique
     * @param {Object} prevElement - Élément précédent
     * @param {Object} currElement - Élément actuel
     * @returns {Array} Liste des propriétés changées
     * @private
     */
    detectElementChanges(prevElement, currElement) {
        const changes = [];
        const elementType = currElement.processMetaLanguageType || 'unknown';
        const trackProperties = this.config.elementTypes[elementType]?.trackProperties || [];
        
        for (const property of trackProperties) {
            const prevValue = this.getElementProperty(prevElement, property);
            const currValue = this.getElementProperty(currElement, property);
            
            if (this.hasPropertyChanged(property, prevValue, currValue)) {
                changes.push({
                    property: property,
                    previousValue: prevValue,
                    currentValue: currValue,
                    changeType: this.classifyPropertyChange(property, prevValue, currValue)
                });
            }
        }
        
        return changes;
    }
    
    /**
     * Obtient la valeur d'une propriété d'élément
     * @param {Object} element - Élément
     * @param {string} property - Nom de la propriété
     * @returns {*} Valeur de la propriété
     * @private
     */
    getElementProperty(element, property) {
        switch (property) {
            case 'x': return element.x;
            case 'y': return element.y;
            case 'width': return element.width;
            case 'height': return element.height;
            case 'text': return element.text || '';
            case 'fillColor': return element.fillColor;
            case 'startBinding': return element.startBinding;
            case 'endBinding': return element.endBinding;
            case 'points': return element.points;
            default: return element[property];
        }
    }
    
    /**
     * Vérifie si une propriété a changé
     * @param {string} property - Nom de la propriété
     * @param {*} prevValue - Valeur précédente
     * @param {*} currValue - Valeur actuelle
     * @returns {boolean} True si changée
     * @private
     */
    hasPropertyChanged(property, prevValue, currValue) {
        if (property === 'x' || property === 'y') {
            // Position: appliquer seuil de sensibilité
            return Math.abs(prevValue - currValue) > this.config.changeDetection.sensitivityThreshold;
        } else if (property === 'text') {
            // Texte: vérifier différence significative
            return prevValue !== currValue && 
                   Math.abs(prevValue.length - currValue.length) >= this.config.changeDetection.textChangeThreshold;
        } else if (typeof prevValue === 'object' && typeof currValue === 'object') {
            // Objets: comparaison JSON
            return JSON.stringify(prevValue) !== JSON.stringify(currValue);
        } else {
            // Comparaison simple
            return prevValue !== currValue;
        }
    }
    
    /**
     * Classifie le type de changement de propriété
     * @param {string} property - Propriété
     * @param {*} prevValue - Valeur précédente
     * @param {*} currValue - Valeur actuelle
     * @returns {string} Type de changement
     * @private
     */
    classifyPropertyChange(property, prevValue, currValue) {
        if (property === 'x' || property === 'y') {
            return 'position_change';
        } else if (property === 'width' || property === 'height') {
            return 'size_change';
        } else if (property === 'text') {
            return 'text_change';
        } else if (property === 'fillColor') {
            return 'style_change';
        } else if (property.includes('Binding')) {
            return 'connection_change';
        } else {
            return 'property_change';
        }
    }
    
    /**
     * Détecte les changements de relations (flèches)
     * @param {Object} previousState - État précédent
     * @param {Object} currentState - État actuel
     * @returns {Array} Changements de relations
     * @private
     */
    detectRelationChanges(previousState, currentState) {
        const changes = [];
        
        // Extraire flèches des deux états
        const prevArrows = previousState.elements.filter(el => el.type === 'arrow');
        const currArrows = currentState.elements.filter(el => el.type === 'arrow');
        
        // Comparer relations
        const prevRelations = this.extractRelations(prevArrows);
        const currRelations = this.extractRelations(currArrows);
        
        // Détecter nouvelles relations
        for (const relation of currRelations) {
            if (!this.relationExists(relation, prevRelations)) {
                changes.push(this.createChangeEvent(
                    'relation_changed',
                    previousState.canvasId,
                    relation.id,
                    'relation',
                    { 
                        changeType: 'relation_added',
                        relation: relation
                    }
                ));
            }
        }
        
        // Détecter relations supprimées
        for (const relation of prevRelations) {
            if (!this.relationExists(relation, currRelations)) {
                changes.push(this.createChangeEvent(
                    'relation_changed',
                    previousState.canvasId,
                    relation.id,
                    'relation',
                    { 
                        changeType: 'relation_removed',
                        relation: relation
                    }
                ));
            }
        }
        
        return changes;
    }
    
    /**
     * Extrait les relations des flèches
     * @param {Array} arrows - Éléments flèches
     * @returns {Array} Relations extraites
     * @private
     */
    extractRelations(arrows) {
        return arrows.map(arrow => ({
            id: arrow.id,
            from: arrow.startBinding?.elementId || null,
            to: arrow.endBinding?.elementId || null,
            type: 'arrow'
        })).filter(rel => rel.from && rel.to);
    }
    
    /**
     * Vérifie si une relation existe dans une liste
     * @param {Object} relation - Relation à chercher
     * @param {Array} relationList - Liste de relations
     * @returns {boolean} True si existe
     * @private
     */
    relationExists(relation, relationList) {
        return relationList.some(rel => 
            rel.from === relation.from && 
            rel.to === relation.to &&
            rel.type === relation.type
        );
    }
    
    /**
     * Crée un événement de changement
     * @param {string} type - Type d'événement
     * @param {string} canvasId - ID du canvas
     * @param {string} elementId - ID de l'élément
     * @param {string} elementType - Type d'élément
     * @param {Object} changes - Détail des changements
     * @returns {Object} Événement de changement
     * @private
     */
    createChangeEvent(type, canvasId, elementId, elementType, changes) {
        return {
            type: type,
            canvasId: canvasId,
            elementId: elementId,
            elementType: elementType,
            changes: changes,
            timestamp: Date.now(),
            metadata: {
                detectionMethod: 'polling',
                processingTime: null // Sera mis à jour lors du traitement
            }
        };
    }
    
    /**
     * Traite les changements détectés
     * @param {Array} changes - Changements à traiter
     * @private
     */
    async processCanvasChanges(changes) {
        try {
            console.log(`🎯 Traitement ${changes.length} changements canvas`);
            
            // Appliquer debouncing si activé
            if (this.config.debouncing.enabled) {
                this.applyCanvasDebouncing(changes);
            } else {
                await this.handleCanvasChanges(changes);
            }
            
        } catch (error) {
            this.logError('Erreur traitement changements canvas', error);
        }
    }
    
    /**
     * Applique le debouncing aux changements canvas
     * @param {Array} changes - Changements à debouncer
     * @private
     */
    applyCanvasDebouncing(changes) {
        // Grouper par canvas
        const changesByCanvas = new Map();
        for (const change of changes) {
            if (!changesByCanvas.has(change.canvasId)) {
                changesByCanvas.set(change.canvasId, []);
            }
            changesByCanvas.get(change.canvasId).push(change);
        }
        
        // Appliquer debouncing par canvas
        for (const [canvasId, canvasChanges] of changesByCanvas.entries()) {
            const debounceKey = canvasId;
            
            // Annuler timer précédent si existant
            if (this.debounceTimers.has(debounceKey)) {
                clearTimeout(this.debounceTimers.get(debounceKey));
                this.metrics.debounceHits++;
            }
            
            // Créer nouveau timer
            const timer = setTimeout(() => {
                this.debounceTimers.delete(debounceKey);
                this.handleCanvasChanges(canvasChanges);
            }, this.config.debouncing.delay);
            
            this.debounceTimers.set(debounceKey, timer);
            
            // Force trigger si délai max atteint
            const lastTrigger = this.lastTrigger.get(debounceKey) || 0;
            const timeSinceLastTrigger = Date.now() - lastTrigger;
            
            if (timeSinceLastTrigger > this.config.debouncing.maxDelay) {
                clearTimeout(timer);
                this.debounceTimers.delete(debounceKey);
                this.handleCanvasChanges(canvasChanges);
            }
        }
    }
    
    /**
     * Gère les changements canvas validés
     * @param {Array} changes - Changements à traiter
     * @private
     */
    async handleCanvasChanges(changes) {
        try {
            console.log(`🎨 Gestion ${changes.length} changements canvas validés`);
            
            // Enrichir événements avec métadonnées
            for (const change of changes) {
                await this.enrichChangeWithMetadata(change);
            }
            
            // Ajouter au batch si batching activé
            if (this.config.debouncing.batchSize > 1) {
                this.addChangesToBatch(changes);
            } else {
                await this.handleSingleCanvasChanges(changes);
            }
            
            // Mettre à jour timestamp dernier trigger
            for (const change of changes) {
                this.lastTrigger.set(change.canvasId, change.timestamp);
            }
            
            // Logger événements
            for (const change of changes) {
                this.logChange(change);
            }
            
        } catch (error) {
            this.logError('Erreur gestion changements canvas', error);
        }
    }
    
    /**
     * Enrichit un changement avec métadonnées supplémentaires
     * @param {Object} change - Changement à enrichir
     * @private
     */
    async enrichChangeWithMetadata(change) {
        const startTime = performance.now();
        
        try {
            // Ajouter informations contextuelles
            change.metadata.processingTime = performance.now() - startTime;
            change.metadata.canvasInfo = this.watchedCanvases.get(change.canvasId);
            
            // Calculer checksum pour validation
            if (change.changes.element) {
                change.metadata.checksum = this.calculateElementChecksum(change.changes.element);
            }
            
        } catch (error) {
            console.warn(`⚠️ Erreur enrichissement métadonnées changement:`, error.message);
        }
    }
    
    /**
     * Ajoute des changements au batch
     * @param {Array} changes - Changements à batcher
     * @private
     */
    addChangesToBatch(changes) {
        this.changeBatch.push(...changes);
        
        // Déclencher traitement si batch plein
        if (this.changeBatch.length >= this.config.debouncing.batchSize) {
            this.processChangeBatch();
        } else if (!this.batchTimer) {
            // Démarrer timer de batch
            this.batchTimer = setTimeout(() => {
                this.processChangeBatch();
            }, this.config.debouncing.batchTimeout);
        }
    }
    
    /**
     * Traite un batch de changements
     * @private
     */
    async processChangeBatch() {
        if (this.changeBatch.length === 0) return;
        
        const batch = [...this.changeBatch];
        this.changeBatch = [];
        
        if (this.batchTimer) {
            clearTimeout(this.batchTimer);
            this.batchTimer = null;
        }
        
        try {
            console.log(`📦 Traitement batch de ${batch.length} changements canvas`);
            
            // Grouper par type de changement pour optimiser
            const groupedChanges = this.groupChangesByType(batch);
            
            // Traiter chaque groupe
            for (const [changeType, changes] of groupedChanges.entries()) {
                await this.handleChangeTypeGroup(changeType, changes);
            }
            
            // Déclencher synchronisation si configuré
            if (this.config.sync.autoTrigger && this.config.sync.batchOperations) {
                await this.triggerBatchSync(batch);
            }
            
        } catch (error) {
            this.logError('Erreur traitement batch changements', error);
        }
    }
    
    /**
     * Traite les changements canvas uniques
     * @param {Array} changes - Changements à traiter
     * @private
     */
    async handleSingleCanvasChanges(changes) {
        try {
            // Émettre événements pour listeners externes
            for (const change of changes) {
                this.emit('canvasChanged', change);
            }
            
            // Traitement spécifique par type de changement
            const groupedChanges = this.groupChangesByType(changes);
            for (const [changeType, typeChanges] of groupedChanges.entries()) {
                await this.handleChangeTypeGroup(changeType, typeChanges);
            }
            
            // Déclencher synchronisation si configuré
            if (this.config.sync.autoTrigger && !this.config.sync.batchOperations) {
                await this.triggerSingleSync(changes);
            }
            
        } catch (error) {
            this.logError('Erreur traitement changements canvas uniques', error);
        }
    }
    
    /**
     * Traite les changements par type
     * @param {string} changeType - Type de changement
     * @param {Array} changes - Changements du type
     * @private
     */
    async handleChangeTypeGroup(changeType, changes) {
        switch (changeType) {
            case 'element_added':
                await this.handleElementAddedChanges(changes);
                break;
            case 'element_modified':
                await this.handleElementModifiedChanges(changes);
                break;
            case 'element_deleted':
                await this.handleElementDeletedChanges(changes);
                break;
            case 'relation_changed':
                await this.handleRelationChanges(changes);
                break;
            default:
                await this.handleGenericChanges(changes);
                break;
        }
    }
    
    /**
     * Traite les ajouts d'éléments
     * @param {Array} changes - Changements d'ajout
     * @private
     */
    async handleElementAddedChanges(changes) {
        console.log(`➕ Traitement ${changes.length} ajouts d'éléments`);
        this.emit('elementsAdded', changes);
    }
    
    /**
     * Traite les modifications d'éléments
     * @param {Array} changes - Changements de modification
     * @private
     */
    async handleElementModifiedChanges(changes) {
        console.log(`✏️ Traitement ${changes.length} modifications d'éléments`);
        this.emit('elementsModified', changes);
    }
    
    /**
     * Traite les suppressions d'éléments
     * @param {Array} changes - Changements de suppression
     * @private
     */
    async handleElementDeletedChanges(changes) {
        console.log(`❌ Traitement ${changes.length} suppressions d'éléments`);
        this.emit('elementsDeleted', changes);
    }
    
    /**
     * Traite les changements de relations
     * @param {Array} changes - Changements de relations
     * @private
     */
    async handleRelationChanges(changes) {
        console.log(`🔗 Traitement ${changes.length} changements de relations`);
        this.emit('relationsChanged', changes);
    }
    
    /**
     * Traite les changements génériques
     * @param {Array} changes - Changements génériques
     * @private
     */
    async handleGenericChanges(changes) {
        console.log(`📝 Traitement ${changes.length} changements génériques`);
        this.emit('genericCanvasChanges', changes);
    }
    
    // Méthodes de synchronisation
    
    /**
     * Déclenche synchronisation pour changements uniques
     * @param {Array} changes - Changements déclencheurs
     * @private
     */
    async triggerSingleSync(changes) {
        if (this.syncInProgress || !this.syncCallback) return;
        
        try {
            console.log(`🔄 Déclenchement sync pour ${changes.length} changements canvas`);
            
            this.syncInProgress = true;
            this.metrics.syncTriggered++;
            
            const result = await this.syncCallback(changes);
            
            this.emit('syncTriggered', {
                type: 'single',
                changes: changes,
                result: result
            });
            
        } catch (error) {
            this.logError('Erreur synchronisation single canvas', error);
        } finally {
            this.syncInProgress = false;
        }
    }
    
    /**
     * Déclenche synchronisation pour batch de changements
     * @param {Array} changes - Batch de changements
     * @private
     */
    async triggerBatchSync(changes) {
        if (this.syncInProgress || !this.syncCallback) return;
        
        try {
            console.log(`🔄 Déclenchement sync batch pour ${changes.length} changements canvas`);
            
            this.syncInProgress = true;
            this.metrics.syncTriggered++;
            
            const result = await this.syncCallback(changes);
            
            this.emit('syncTriggered', {
                type: 'batch',
                changes: changes,
                result: result
            });
            
        } catch (error) {
            this.logError('Erreur synchronisation batch canvas', error);
        } finally {
            this.syncInProgress = false;
        }
    }
    
    // Méthodes utilitaires
    
    groupChangesByType(changes) {
        const grouped = new Map();
        
        for (const change of changes) {
            if (!grouped.has(change.type)) {
                grouped.set(change.type, []);
            }
            grouped.get(change.type).push(change);
        }
        
        return grouped;
    }
    
    cloneCanvasState(state) {
        return JSON.parse(JSON.stringify(state));
    }
    
    calculateStateChecksum(elements) {
        const stateString = JSON.stringify(elements.map(el => ({
            id: el.id,
            type: el.type,
            x: el.x,
            y: el.y,
            text: el.text
        })));
        
        return createHash('md5').update(stateString).digest('hex');
    }
    
    calculateElementChecksum(element) {
        const elementString = JSON.stringify({
            id: element.id,
            type: element.type,
            x: element.x,
            y: element.y,
            text: element.text,
            fillColor: element.fillColor
        });
        
        return createHash('md5').update(elementString).digest('hex').substring(0, 8);
    }
    
    generateMockCanvasState(canvasId) {
        // État factice pour mode simulation
        return {
            canvasId: canvasId,
            timestamp: Date.now(),
            elements: [
                {
                    id: `mock_element_${Date.now()}`,
                    type: 'rectangle',
                    x: 100,
                    y: 100,
                    width: 120,
                    height: 80,
                    text: '#process-object Mock Element',
                    processMetaLanguageType: 'processObject'
                }
            ],
            appState: {
                viewBackgroundColor: '#ffffff',
                zoom: 1.0
            },
            checksum: 'mock_checksum'
        };
    }
    
    // Méthodes de cache
    
    async initializeCanvasCache() {
        console.log('💾 Initialisation cache canvas...');
        // Cache déjà initialisé dans constructor
    }
    
    cacheCanvasState(canvasId, state) {
        if (!this.config.cache.enabled) return;
        
        const compressed = this.compressCanvasState(state);
        this.canvasStateCache.set(canvasId, {
            state: compressed,
            timestamp: Date.now(),
            ttl: Date.now() + this.config.cache.ttl
        });
        
        // Nettoyer cache si trop plein
        if (this.canvasStateCache.size > this.config.cache.maxStates) {
            this.cleanupExpiredCache();
        }
    }
    
    compressCanvasState(state) {
        // Compression simplifiée - garder uniquement l'essentiel
        return {
            canvasId: state.canvasId,
            elementCount: state.elements.length,
            checksum: state.checksum,
            timestamp: state.timestamp
        };
    }
    
    cleanupExpiredCache() {
        const now = Date.now();
        for (const [canvasId, cached] of this.canvasStateCache.entries()) {
            if (cached.ttl < now) {
                this.canvasStateCache.delete(canvasId);
            }
        }
    }
    
    // Listeners Excalidraw
    
    setupExcalidrawListeners() {
        console.log('🎧 Configuration listeners Excalidraw...');
        
        if (this.excalidrawAutomate && this.excalidrawAutomate.onCanvasChange) {
            this.excalidrawAutomate.onCanvasChange((elements, appState) => {
                this.handleExcalidrawEvent(elements, appState);
            });
        }
    }
    
    handleExcalidrawEvent(elements, appState) {
        // Gestionnaire événement Excalidraw temps réel
        console.log('🎨 Événement Excalidraw reçu');
        
        // Filtrer éléments ProcessMetaLanguage
        const processElements = this.filterProcessMetaLanguageElements(elements);
        
        if (processElements.length > 0) {
            // Déclencher analyse différentielle
            this.scheduleEventBasedAnalysis(processElements, appState);
        }
    }
    
    scheduleEventBasedAnalysis(elements, appState) {
        // Programmer analyse basée sur événements
        setTimeout(() => {
            this.performEventBasedAnalysis(elements, appState);
        }, 100); // Petit délai pour éviter events redondants
    }
    
    async performEventBasedAnalysis(elements, appState) {
        // Analyse basée sur événements en temps réel
        console.log('⚡ Analyse temps réel événement Excalidraw');
        
        // Cette méthode compléterait le polling avec détection temps réel
        // Implémentation simplifiée ici
    }
    
    // Métriques et monitoring
    
    updatePollingMetrics(processingTime, changeCount) {
        this.metrics.totalProcessingTime += processingTime;
        this.metrics.averageProcessingTime = this.metrics.totalProcessingTime / (this.metrics.totalChanges + 1);
        
        if (changeCount > 0) {
            this.metrics.totalChanges += changeCount;
        }
    }
    
    logChange(change) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            type: change.type,
            canvasId: change.canvasId,
            elementId: change.elementId,
            elementType: change.elementType
        };
        
        this.changeLog.push(logEntry);
        
        // Garder seulement les N dernières entrées
        if (this.changeLog.length > this.config.monitoring.maxLogEntries) {
            this.changeLog = this.changeLog.slice(-this.config.monitoring.maxLogEntries);
        }
        
        if (this.config.monitoring.enableLogging) {
            console.log(`🎯 [${change.type.toUpperCase()}] Canvas ${change.canvasId} - Élément ${change.elementId}`);
        }
    }
    
    logError(message, error) {
        const errorEntry = {
            timestamp: new Date().toISOString(),
            message: message,
            error: error.message,
            stack: error.stack
        };
        
        this.errorLog.push(errorEntry);
        this.metrics.errors++;
        
        console.error(`❌ CanvasWatcher: ${message}`, error);
    }
    
    startMetricsCollection() {
        this.metricsInterval = setInterval(() => {
            this.collectMetrics();
        }, this.config.monitoring.metricsInterval);
    }
    
    startMaintenanceIntervals() {
        this.cleanupInterval = setInterval(() => {
            this.performMaintenance();
        }, 120000); // Toutes les 2 minutes
    }
    
    collectMetrics() {
        this.emit('metricsUpdated', this.getMetrics());
    }
    
    performMaintenance() {
        // Nettoyage périodique des caches et timers
        this.cleanupExpiredTimers();
        this.cleanupExpiredCache();
        this.cleanupOldLogs();
    }
    
    cleanupExpiredTimers() {
        // Nettoyage des timers expirés
        const now = Date.now();
        for (const [key, timestamp] of this.lastTrigger.entries()) {
            if (now - timestamp > 7200000) { // 2 heures
                this.lastTrigger.delete(key);
            }
        }
    }
    
    cleanupOldLogs() {
        // Nettoyage des anciens logs
        const maxAge = 24 * 60 * 60 * 1000; // 24 heures
        const cutoff = Date.now() - maxAge;
        
        this.changeLog = this.changeLog.filter(entry => 
            new Date(entry.timestamp).getTime() > cutoff
        );
        
        this.errorLog = this.errorLog.filter(entry => 
            new Date(entry.timestamp).getTime() > cutoff
        );
    }
    
    /**
     * Arrête la surveillance de tous les canvas
     * @returns {Promise<void>}
     * @sideEffect Ferme polling, nettoie timers, arrête listeners
     */
    async stopWatching() {
        try {
            console.log('🛑 Arrêt surveillance canvas...');
            
            // Arrêter polling
            if (this.pollingInterval) {
                clearInterval(this.pollingInterval);
                this.pollingInterval = null;
            }
            
            // Nettoyer timers de debounce
            for (const timer of this.debounceTimers.values()) {
                clearTimeout(timer);
            }
            
            if (this.batchTimer) {
                clearTimeout(this.batchTimer);
            }
            
            // Arrêter intervalles
            if (this.metricsInterval) clearInterval(this.metricsInterval);
            if (this.cleanupInterval) clearInterval(this.cleanupInterval);
            
            // Réinitialiser état
            this.watchedCanvases.clear();
            this.debounceTimers.clear();
            this.changeBatch = [];
            this.isWatching = false;
            
            console.log('✅ Surveillance canvas arrêtée');
            this.emit('watchingStopped');
            
        } catch (error) {
            this.logError('Erreur arrêt surveillance canvas', error);
            throw error;
        }
    }
    
    /**
     * Obtient les métriques de surveillance canvas
     * @returns {Object} Métriques détaillées
     */
    getMetrics() {
        return {
            ...this.metrics,
            status: {
                isWatching: this.isWatching,
                canvasesWatched: this.watchedCanvases.size,
                activeTimers: this.debounceTimers.size,
                pendingBatch: this.changeBatch.length,
                syncInProgress: this.syncInProgress
            },
            cache: {
                canvasStateCacheSize: this.canvasStateCache.size,
                previousStatesSize: this.previousStates.size
            },
            logs: {
                changeLogSize: this.changeLog.length,
                errorLogSize: this.errorLog.length
            }
        };
    }
    
    /**
     * Obtient l'historique des changements récents
     * @param {number} limit - Nombre max de changements (défaut: 50)
     * @returns {Array} Historique des changements
     */
    getChangeHistory(limit = 50) {
        return this.changeLog.slice(-limit);
    }
    
    /**
     * Obtient l'historique des erreurs récentes
     * @param {number} limit - Nombre max d'erreurs (défaut: 20)
     * @returns {Array} Historique des erreurs
     */
    getErrorHistory(limit = 20) {
        return this.errorLog.slice(-limit);
    }
}

// Export ES6 par défaut
export { CanvasWatcher, CANVAS_WATCHER_CONFIG };

// Export browser pour utilisation dans Obsidian
if (typeof window !== 'undefined') {
    window.ProcessMetaLanguageCanvasWatcher = {
        CanvasWatcher,
        CANVAS_WATCHER_CONFIG
    };
}

// <!-- END OF FILE: canvas-watcher.js -->