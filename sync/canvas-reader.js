// <!-- START OF FILE: canvas-reader.js -->
// FILENAME: canvas-reader.js
// Version: 1.0.0
// Date: 2025-07-28 16:15
// Author: Rolland MELET & Claude Code
// Description: Moteur lecture canvas Excalidraw - détection éléments taggés ProcessMetaLanguage - TASK-B004

/**
 * Lecteur de canvas Excalidraw pour ProcessMetaLanguage
 * 
 * Détecte et extrait les éléments graphiques taggés dans un canvas Excalidraw :
 * - #process-object (hexagones OBJECT)
 * - #process-state (bannières STATE)
 * - #process-action (rectangles ACTION)
 * 
 * @author Rolland MELET & Claude Code
 * @version 1.0.0
 */

import { fs } from '../utils/obsidian-adapter.js';
import { path } from '../utils/obsidian-adapter.js';

/**
 * Configuration par défaut du lecteur de canvas
 */
const DEFAULT_CONFIG = {
    // Tags ProcessMetaLanguage à détecter
    processTags: {
        object: '#process-object',
        state: '#process-state', 
        action: '#process-action'
    },
    
    // Types d'éléments Excalidraw supportés
    supportedElementTypes: ['rectangle', 'ellipse', 'text', 'freedraw'],
    
    // Timeout de lecture (ms)
    readTimeout: 30000,
    
    // Performance targets
    maxElementsPerRead: 200,
    maxProcessingTimeMs: 5000
};

/**
 * Classe principale de lecture de canvas ProcessMetaLanguage
 */
export class CanvasReader {
    /**
     * Initialise le lecteur de canvas
     * @param {Object} config - Configuration personnalisée
     * @param {string} config.obsidianVaultPath - Chemin vers le vault Obsidian
     * @param {string} config.excalidrawDataPath - Chemin relatif vers les données Excalidraw
     * @param {Object} config.processTags - Tags ProcessMetaLanguage personnalisés
     * @param {number} config.maxProcessingTimeMs - Temps max traitement (défaut: 5000ms)
     */
    constructor(config = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.stats = {
            elementsProcessed: 0,
            objectsDetected: 0,
            statesDetected: 0,
            actionsDetected: 0,
            relationshipsDetected: 0,
            processingTime: 0,
            lastReadTimestamp: null
        };
        this.cache = new Map();
        this.errors = [];
    }

    /**
     * Lit un fichier canvas Excalidraw et extrait les éléments ProcessMetaLanguage
     * @param {string} canvasFilePath - Chemin vers le fichier .excalidraw
     * @returns {Promise<Object>} Données extraites du canvas
     * @throws {Error} Si lecture impossible ou format invalide
     * @sideEffect Lit fichier système, met à jour cache interne, logs erreurs
     * @example
     * const reader = new CanvasReader({ obsidianVaultPath: '/path/to/vault' });
     * const canvasData = await reader.readCanvas('./Mon_Processus.excalidraw');
     * // Returns: { objects: [...], states: [...], actions: [...], relationships: [...] }
     */
    async readCanvas(canvasFilePath) {
        const startTime = Date.now();
        this.errors = [];
        
        try {
            console.log(`🔍 Lecture canvas: ${canvasFilePath}`);
            
            // 1. Vérifier l'existence du fichier
            await this._validateCanvasFile(canvasFilePath);
            
            // 2. Lire et parser le fichier JSON Excalidraw
            const rawCanvasData = await this._loadCanvasFile(canvasFilePath);
            
            // 3. Extraire les éléments ProcessMetaLanguage
            const processElements = await this._extractProcessElements(rawCanvasData);
            
            // 4. Détecter les relations entre éléments
            const relationships = await this._detectRelationships(processElements, rawCanvasData);
            
            // 5. Valider la cohérence du modèle
            const validatedData = await this._validateProcessModel(processElements, relationships);
            
            // 6. Mettre à jour statistiques
            this._updateStats(validatedData, Date.now() - startTime);
            
            console.log(`✅ Canvas lu avec succès: ${this.stats.objectsDetected} objets, ${this.stats.statesDetected} états, ${this.stats.actionsDetected} actions`);
            
            return {
                metadata: {
                    sourceFile: canvasFilePath,
                    readTimestamp: new Date().toISOString(),
                    processingTimeMs: Date.now() - startTime,
                    version: this.constructor.version || '1.0.0'
                },
                objects: validatedData.objects,
                states: validatedData.states,
                actions: validatedData.actions,
                relationships: validatedData.relationships,
                statistics: { ...this.stats },
                warnings: this.errors.filter(e => e.level === 'warning'),
                errors: this.errors.filter(e => e.level === 'error')
            };
            
        } catch (error) {
            const processingTime = Date.now() - startTime;
            this._logError('critical', `Erreur lecture canvas: ${error.message}`, { canvasFilePath, processingTime });
            throw new Error(`Impossible de lire le canvas ${canvasFilePath}: ${error.message}`);
        }
    }

    /**
     * Valide l'existence et le format d'un fichier canvas
     * @param {string} filePath - Chemin vers le fichier
     * @returns {Promise<void>}
     * @throws {Error} Si fichier inexistant ou format invalide
     * @private
     */
    async _validateCanvasFile(filePath) {
        try {
            await fs.access(filePath);
            
            const stats = await fs.stat(filePath);
            if (!stats.isFile()) {
                throw new Error('Le chemin spécifié ne pointe pas vers un fichier');
            }
            
            if (!filePath.endsWith('.excalidraw')) {
                this._logError('warning', 'Extension de fichier non standard', { filePath });
            }
            
            // Vérifier taille raisonnable (< 50MB)
            if (stats.size > 50 * 1024 * 1024) {
                throw new Error('Fichier canvas trop volumineux (> 50MB)');
            }
            
        } catch (error) {
            throw new Error(`Fichier canvas invalide: ${error.message}`);
        }
    }

    /**
     * Charge et parse un fichier canvas Excalidraw
     * @param {string} filePath - Chemin vers le fichier
     * @returns {Promise<Object>} Données JSON parsées
     * @throws {Error} Si parsing JSON impossible
     * @private
     */
    async _loadCanvasFile(filePath) {
        try {
            const fileContent = await fs.readFile(filePath, 'utf-8');
            
            if (fileContent.trim().length === 0) {
                throw new Error('Fichier canvas vide');
            }
            
            const canvasData = JSON.parse(fileContent);
            
            // Valider structure Excalidraw basique
            if (!canvasData.elements || !Array.isArray(canvasData.elements)) {
                throw new Error('Structure Excalidraw invalide: propriété "elements" manquante');
            }
            
            console.log(`📊 Canvas chargé: ${canvasData.elements.length} éléments détectés`);
            
            return canvasData;
            
        } catch (error) {
            if (error.name === 'SyntaxError') {
                throw new Error(`Format JSON invalide: ${error.message}`);
            }
            throw error;
        }
    }

    /**
     * Extrait les éléments ProcessMetaLanguage du canvas
     * @param {Object} canvasData - Données du canvas Excalidraw
     * @returns {Promise<Object>} Éléments extraits par type
     * @private
     */
    async _extractProcessElements(canvasData) {
        const elements = {
            objects: [],
            states: [],
            actions: []
        };
        
        let processedCount = 0;
        
        for (const element of canvasData.elements) {
            if (processedCount >= this.config.maxElementsPerRead) {
                this._logError('warning', 'Limite d\'éléments atteinte', { 
                    limit: this.config.maxElementsPerRead,
                    totalElements: canvasData.elements.length 
                });
                break;
            }
            
            try {
                const processElement = await this._analyzeElement(element);
                if (processElement) {
                    elements[processElement.type + 's'].push(processElement);
                    processedCount++;
                }
            } catch (error) {
                this._logError('warning', `Erreur analyse élément ${element.id}`, { error: error.message });
            }
        }
        
        this.stats.elementsProcessed = processedCount;
        return elements;
    }

    /**
     * Analyse un élément pour déterminer s'il est ProcessMetaLanguage
     * @param {Object} element - Élément Excalidraw à analyser
     * @returns {Promise<Object|null>} Élément ProcessMetaLanguage transformé ou null
     * @private
     */
    async _analyzeElement(element) {
        // Vérifier que l'élément a les propriétés de base
        if (!element.id || !element.type) {
            return null;
        }
        
        // Rechercher tags ProcessMetaLanguage dans le texte
        const elementText = this._extractElementText(element);
        const detectedTag = this._detectProcessTag(elementText);
        
        if (!detectedTag) {
            return null;
        }
        
        // Construire l'élément ProcessMetaLanguage
        const processElement = {
            type: detectedTag.type, // 'object', 'state', 'action'
            id: element.id,
            canvasElementType: element.type,
            name: this._extractElementName(elementText, detectedTag.tag),
            position: {
                x: element.x || 0,
                y: element.y || 0
            },
            dimensions: {
                width: element.width || 0,
                height: element.height || 0
            },
            properties: {
                backgroundColor: element.backgroundColor || '#ffffff',
                strokeColor: element.strokeColor || '#000000',
                fillStyle: element.fillStyle || 'solid',
                strokeWidth: element.strokeWidth || 1,
                opacity: element.opacity || 100
            },
            metadata: {
                originalElement: element,
                detectedTag: detectedTag.tag,
                extractedAt: new Date().toISOString()
            }
        };
        
        // Ajouter propriétés spécifiques selon le type
        switch (detectedTag.type) {
            case 'object':
                processElement.objectType = this._inferObjectType(elementText);
                processElement.tracedEntity = this._extractTracedEntity(elementText);
                break;
                
            case 'state':
                processElement.stateName = this._extractStateName(elementText);
                processElement.disposition = this._inferDisposition(elementText);
                processElement.parentObjectId = this._findParentObjectId(element, processElement);
                break;
                
            case 'action':
                processElement.actionName = this._extractActionName(elementText);
                processElement.actionType = this._inferActionType(elementText);
                processElement.parentStateId = this._findParentStateId(element, processElement);
                break;
        }
        
        return processElement;
    }

    /**
     * Extrait le texte d'un élément Excalidraw
     * @param {Object} element - Élément Excalidraw
     * @returns {string} Texte extrait
     * @private
     */
    _extractElementText(element) {
        if (element.type === 'text') {
            return element.text || '';
        }
        
        // Pour les formes avec texte intégré
        if (element.rawText) {
            return element.rawText;
        }
        
        // Rechercher texte dans les propriétés personnalisées
        if (element.customData && element.customData.text) {
            return element.customData.text;
        }
        
        return '';
    }

    /**
     * Détecte si un texte contient un tag ProcessMetaLanguage
     * @param {string} text - Texte à analyser
     * @returns {Object|null} Tag détecté avec type
     * @private
     */
    _detectProcessTag(text) {
        const tags = this.config.processTags;
        
        for (const [type, tag] of Object.entries(tags)) {
            if (text.includes(tag)) {
                return { type, tag };
            }
        }
        
        return null;
    }

    /**
     * Extrait le nom d'un élément en retirant le tag
     * @param {string} text - Texte complet
     * @param {string} tag - Tag à retirer
     * @returns {string} Nom nettoyé
     * @private
     */
    _extractElementName(text, tag) {
        return text
            .replace(tag, '')
            .replace(/^\s+|\s+$/g, '') // Trim
            .replace(/\n+/g, ' ') // Remplacer retours à la ligne
            .replace(/\s+/g, ' ') // Normaliser espaces
            || 'Élément_Sans_Nom';
    }

    /**
     * Infère le type d'objet à partir du texte
     * @param {string} text - Texte de l'élément
     * @returns {string} Type d'objet inféré
     * @private
     */
    _inferObjectType(text) {
        const textLower = text.toLowerCase();
        
        if (textLower.includes('lot') || textLower.includes('batch')) return 'batch';
        if (textLower.includes('produit') || textLower.includes('product')) return 'product';
        if (textLower.includes('matière') || textLower.includes('material')) return 'raw-material';
        if (textLower.includes('composant') || textLower.includes('component')) return 'component';
        if (textLower.includes('équipement') || textLower.includes('equipment')) return 'equipment';
        if (textLower.includes('location') || textLower.includes('lieu')) return 'location';
        
        return 'generic-object';
    }

    /**
     * Extrait l'entité tracée d'un objet
     * @param {string} text - Texte de l'élément
     * @returns {string} Entité tracée
     * @private
     */
    _extractTracedEntity(text) {
        // Rechercher patterns comme "Lot-XXX", "Produit-YYY", etc.
        const patterns = [
            /(?:Lot|Batch)[-_]([A-Za-z0-9]+)/i,
            /(?:Produit|Product)[-_]([A-Za-z0-9]+)/i,
            /(?:Série|Serial)[-_]([A-Za-z0-9]+)/i
        ];
        
        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match) {
                return match[0];
            }
        }
        
        return this._extractElementName(text, this.config.processTags.object);
    }

    /**
     * Détecte les relations entre éléments ProcessMetaLanguage
     * @param {Object} processElements - Éléments ProcessMetaLanguage extraits
     * @param {Object} canvasData - Données complètes du canvas
     * @returns {Promise<Array>} Liste des relations détectées
     * @private
     */
    async _detectRelationships(processElements, canvasData) {
        const relationships = [];
        
        // 1. Relations spatiales (proximité)
        const spatialRelations = this._detectSpatialRelationships(processElements);
        relationships.push(...spatialRelations);
        
        // 2. Relations via flèches/lignes
        const arrowRelations = this._detectArrowRelationships(processElements, canvasData);
        relationships.push(...arrowRelations);
        
        // 3. Relations textuelles (références dans le texte)
        const textualRelations = this._detectTextualRelationships(processElements);
        relationships.push(...textualRelations);
        
        this.stats.relationshipsDetected = relationships.length;
        console.log(`🔗 ${relationships.length} relations détectées`);
        
        return relationships;
    }

    /**
     * Détecte les relations spatiales entre éléments
     * @param {Object} processElements - Éléments ProcessMetaLanguage
     * @returns {Array} Relations spatiales
     * @private
     */
    _detectSpatialRelationships(processElements) {
        const relationships = [];
        const allElements = [
            ...processElements.objects,
            ...processElements.states, 
            ...processElements.actions
        ];
        
        // Rechercher states proches d'objects (superposition/proximité)
        for (const state of processElements.states) {
            for (const object of processElements.objects) {
                const distance = this._calculateDistance(state.position, object.position);
                
                // Si state très proche d'object (superposition)
                if (distance < 50) {
                    relationships.push({
                        type: 'state_belongs_to_object',
                        source: state,
                        target: object,
                        relationship: 'parent_child',
                        confidence: 0.9,
                        method: 'spatial_proximity',
                        distance: distance
                    });
                    
                    // Mettre à jour parentObjectId
                    state.parentObjectId = object.id;
                }
            }
        }
        
        // Rechercher actions proches de states
        for (const action of processElements.actions) {
            for (const state of processElements.states) {
                const distance = this._calculateDistance(action.position, state.position);
                
                // Si action proche de state
                if (distance < 100) {
                    relationships.push({
                        type: 'action_belongs_to_state',
                        source: action,
                        target: state,
                        relationship: 'parent_child',
                        confidence: 0.8,
                        method: 'spatial_proximity',
                        distance: distance
                    });
                    
                    // Mettre à jour parentStateId
                    action.parentStateId = state.id;
                }
            }
        }
        
        return relationships;
    }

    /**
     * Calcule la distance euclidienne entre deux positions
     * @param {Object} pos1 - Position 1 {x, y}
     * @param {Object} pos2 - Position 2 {x, y}
     * @returns {number} Distance en pixels
     * @private
     */
    _calculateDistance(pos1, pos2) {
        const dx = pos1.x - pos2.x;
        const dy = pos1.y - pos2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Détecte les relations via flèches dans le canvas
     * @param {Object} processElements - Éléments ProcessMetaLanguage
     * @param {Object} canvasData - Données canvas complètes
     * @returns {Array} Relations via flèches
     * @private
     */
    _detectArrowRelationships(processElements, canvasData) {
        const relationships = [];
        const allProcessElements = [
            ...processElements.objects,
            ...processElements.states,
            ...processElements.actions
        ];
        
        // Rechercher éléments arrow/line dans le canvas
        const arrows = canvasData.elements.filter(el => 
            el.type === 'arrow' || el.type === 'line'
        );
        
        for (const arrow of arrows) {
            try {
                const sourceElement = this._findElementAtPosition(
                    allProcessElements, 
                    { x: arrow.x, y: arrow.y }
                );
                
                const targetElement = this._findElementAtPosition(
                    allProcessElements,
                    { x: arrow.x + (arrow.width || 0), y: arrow.y + (arrow.height || 0) }
                );
                
                if (sourceElement && targetElement && sourceElement.id !== targetElement.id) {
                    relationships.push({
                        type: 'workflow_transition',
                        source: sourceElement,
                        target: targetElement,
                        relationship: 'transition',
                        confidence: 0.7,
                        method: 'arrow_detection',
                        arrowElement: arrow
                    });
                }
            } catch (error) {
                this._logError('warning', `Erreur analyse flèche ${arrow.id}`, { error: error.message });
            }
        }
        
        return relationships;
    }

    /**
     * Trouve l'élément ProcessMetaLanguage le plus proche d'une position
     * @param {Array} elements - Liste des éléments ProcessMetaLanguage
     * @param {Object} position - Position {x, y}
     * @returns {Object|null} Élément le plus proche
     * @private
     */
    _findElementAtPosition(elements, position) {
        let closestElement = null;
        let minDistance = Infinity;
        
        for (const element of elements) {
            const distance = this._calculateDistance(element.position, position);
            if (distance < minDistance && distance < 100) { // Tolérance 100px
                minDistance = distance;
                closestElement = element;
            }
        }
        
        return closestElement;
    }

    /**
     * Détecte les relations textuelles (références dans le texte)
     * @param {Object} processElements - Éléments ProcessMetaLanguage
     * @returns {Array} Relations textuelles
     * @private
     */
    _detectTextualRelationships(processElements) {
        const relationships = [];
        // À implémenter selon les besoins spécifiques
        return relationships;
    }

    /**
     * Valide la cohérence du modèle ProcessMetaLanguage extrait
     * @param {Object} processElements - Éléments extraits
     * @param {Array} relationships - Relations détectées
     * @returns {Promise<Object>} Données validées
     * @private
     */
    async _validateProcessModel(processElements, relationships) {
        const validationResults = {
            objects: processElements.objects,
            states: processElements.states,
            actions: processElements.actions,
            relationships: relationships,
            validationWarnings: []
        };
        
        // 1. Vérifier que chaque state a au moins un parent object
        for (const state of processElements.states) {
            if (!state.parentObjectId) {
                this._logError('warning', `État ${state.name} sans objet parent`, { stateId: state.id });
                validationResults.validationWarnings.push({
                    type: 'orphan_state',
                    element: state,
                    message: 'État sans objet parent détecté'
                });
            }
        }
        
        // 2. Vérifier que chaque action a un parent state
        for (const action of processElements.actions) {
            if (!action.parentStateId) {
                this._logError('warning', `Action ${action.name} sans état parent`, { actionId: action.id });
                validationResults.validationWarnings.push({
                    type: 'orphan_action',
                    element: action,
                    message: 'Action sans état parent détectée'
                });
            }
        }
        
        // 3. Vérifier la cohérence des relations
        const invalidRelations = relationships.filter(rel => 
            !rel.source || !rel.target || rel.source.id === rel.target.id
        );
        
        if (invalidRelations.length > 0) {
            this._logError('warning', `${invalidRelations.length} relations invalides détectées`);
        }
        
        return validationResults;
    }

    /**
     * Met à jour les statistiques de lecture
     * @param {Object} validatedData - Données validées
     * @param {number} processingTime - Temps de traitement en ms
     * @private
     */
    _updateStats(validatedData, processingTime) {
        this.stats.objectsDetected = validatedData.objects.length;
        this.stats.statesDetected = validatedData.states.length;
        this.stats.actionsDetected = validatedData.actions.length;
        this.stats.relationshipsDetected = validatedData.relationships.length;
        this.stats.processingTime = processingTime;
        this.stats.lastReadTimestamp = new Date().toISOString();
    }

    /**
     * Enregistre une erreur avec contexte
     * @param {string} level - Niveau d'erreur (warning, error, critical)
     * @param {string} message - Message d'erreur
     * @param {Object} context - Contexte additionnel
     * @private
     */
    _logError(level, message, context = {}) {
        const error = {
            level,
            message,
            context,
            timestamp: new Date().toISOString()
        };
        
        this.errors.push(error);
        
        if (level === 'critical') {
            console.error(`❌ [${level.toUpperCase()}] ${message}`, context);
        } else if (level === 'error') {
            console.error(`⚠️ [${level.toUpperCase()}] ${message}`, context);
        } else {
            console.warn(`⚠️ [${level.toUpperCase()}] ${message}`, context);
        }
    }

    /**
     * Obtient les statistiques de performance
     * @returns {Object} Statistiques détaillées
     */
    getPerformanceStats() {
        return {
            ...this.stats,
            performanceTarget: this.stats.processingTime < this.config.maxProcessingTimeMs,
            cacheSize: this.cache.size,
            errorsTotal: this.errors.length,
            warningsTotal: this.errors.filter(e => e.level === 'warning').length
        };
    }

    /**
     * Vide le cache et remet à zéro les statistiques
     * @sideEffect Vide cache interne, remet compteurs à zéro
     */
    clearCache() {
        this.cache.clear();
        this.errors = [];
        this.stats = {
            elementsProcessed: 0,
            objectsDetected: 0,
            statesDetected: 0,
            actionsDetected: 0,
            relationshipsDetected: 0,
            processingTime: 0,
            lastReadTimestamp: null
        };
    }

    /**
     * Extrait le nom d'état à partir du texte
     * @param {string} text - Texte de l'élément state
     * @returns {string} Nom de l'état
     * @private
     */
    _extractStateName(text) {
        return this._extractElementName(text, this.config.processTags.state);
    }

    /**
     * Infère la disposition EPCIS à partir du texte
     * @param {string} text - Texte de l'élément
     * @returns {string} Disposition inférée
     * @private
     */
    _inferDisposition(text) {
        const textLower = text.toLowerCase();
        
        if (textLower.includes('actif') || textLower.includes('active')) return 'active';
        if (textLower.includes('transit') || textLower.includes('transport')) return 'in_transit';
        if (textLower.includes('stocké') || textLower.includes('stored')) return 'stored';
        if (textLower.includes('consommé') || textLower.includes('consumed')) return 'consumed';
        if (textLower.includes('détruit') || textLower.includes('destroyed')) return 'destroyed';
        if (textLower.includes('endommagé') || textLower.includes('damaged')) return 'damaged';
        
        return 'active';
    }

    /**
     * Trouve l'ID de l'objet parent pour un état
     * @param {Object} element - Élément Excalidraw original
     * @param {Object} processElement - Élément ProcessMetaLanguage
     * @returns {string|null} ID de l'objet parent
     * @private
     */
    _findParentObjectId(element, processElement) {
        // Sera défini par la détection spatiale
        return null;
    }

    /**
     * Extrait le nom d'action à partir du texte
     * @param {string} text - Texte de l'élément action
     * @returns {string} Nom de l'action
     * @private
     */
    _extractActionName(text) {
        return this._extractElementName(text, this.config.processTags.action);
    }

    /**
     * Infère le type d'action à partir du texte
     * @param {string} text - Texte de l'élément
     * @returns {string} Type d'action inféré
     * @private
     */
    _inferActionType(text) {
        const textLower = text.toLowerCase();
        
        if (textLower.includes('principal') || textLower.includes('main')) return 'main_action';
        if (textLower.includes('secondaire') || textLower.includes('secondary')) return 'secondary_action';
        if (textLower.includes('workflow') || textLower.includes('processus')) return 'workflow_action';
        if (textLower.includes('api') || textLower.includes('service')) return 'api_action';
        if (textLower.includes('validation') || textLower.includes('contrôle')) return 'validation_action';
        
        return 'secondary_action';
    }

    /**
     * Trouve l'ID de l'état parent pour une action
     * @param {Object} element - Élément Excalidraw original
     * @param {Object} processElement - Élément ProcessMetaLanguage
     * @returns {string|null} ID de l'état parent
     * @private
     */
    _findParentStateId(element, processElement) {
        // Sera défini par la détection spatiale
        return null;
    }
}

// Fonction utilitaire pour usage direct
/**
 * Lit un canvas Excalidraw et extrait les éléments ProcessMetaLanguage
 * @param {string} canvasFilePath - Chemin vers le fichier .excalidraw
 * @param {Object} config - Configuration optionnelle
 * @returns {Promise<Object>} Données extraites du canvas
 * @example
 * const data = await readProcessCanvas('./Mon_Processus.excalidraw');
 * console.log(`Trouvé: ${data.objects.length} objets, ${data.states.length} états`);
 */
export async function readProcessCanvas(canvasFilePath, config = {}) {
    const reader = new CanvasReader(config);
    return await reader.readCanvas(canvasFilePath);
}

export default CanvasReader;

// <!-- END OF FILE: canvas-reader.js -->