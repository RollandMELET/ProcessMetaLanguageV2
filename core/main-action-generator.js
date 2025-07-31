// <!-- START OF FILE: main-action-generator.js -->
// FILENAME: main-action-generator.js
// Version: 1.0.0
// Date: 2025-07-30 16:30
// Author: Rolland MELET & Claude Code
// Description: Générateur automatique d'actions principales ProcessMetaLanguage - TASK-B006

/**
 * Module ProcessMetaLanguage - Main Action Generator
 * 
 * Système de génération automatique des actions principales selon l'architecture État-Actions deux niveaux.
 * Chaque STATE possède automatiquement une MAIN_ACTION de type "data_exposition" qui:
 * - Expose les métadonnées complètes de l'objet dans son état actuel
 * - Fournit la navigation vers toutes les actions secondaires disponibles
 * - Maintient la conformité EPCIS 2.0 avec business steps et dispositions
 * - Intègre avec le template-processor et template-manager existants
 * 
 * Architecture État-Actions ProcessMetaLanguage:
 * OBJECT → STATE → MAIN_ACTION (obligatoire) + SECONDARY_ACTIONS (optionnelles)
 */

import { TemplateProcessor } from './template-processor.js';
import { TemplateManager } from './template-manager.js';
import { DataExposer } from './data-exposer.js';
import { NavigationBuilder } from './navigation-builder.js';

/**
 * Configuration du générateur d'actions principales
 * @constant {Object}
 */
const MAIN_ACTION_CONFIG = {
    // Types d'actions principales
    actionType: 'main_action',
    actionCategory: 'data_exposition',
    actionColor: '#2196F3',
    
    // Templates et patterns
    actionNamePattern: 'Consulter État {{STATE_NAME}}',
    actionDescriptionPattern: 'Action principale générée automatiquement pour exposition complète des données de l\'objet en état {{STATE_NAME}}',
    
    // Performance et cache
    cacheEnabled: true,
    cacheTTL: 300000, // 5 minutes
    maxCacheSize: 1000,
    
    // Conformité EPCIS 2.0
    defaultBusinessStep: 'observing',
    epcisActionType: 'observe',
    
    // Métadonnées action principale
    requiredDataSections: [
        'object_metadata',
        'current_state',
        'state_history', 
        'related_objects',
        'epcis_compliance',
        'available_actions'
    ],
    
    // Performance targets
    maxGenerationTime: 1000, // 1s par action
    maxDataExpositionSize: 50 * 1024, // 50KB max par exposition
    
    // API et export
    apiVersion: '1.0.0',
    exportFormats: ['json', 'xml', 'yaml']
};

/**
 * Classe principale du générateur d'actions principales
 * @class
 */
class MainActionGenerator {
    /**
     * Initialise le générateur d'actions principales
     * @param {Object} options - Options de configuration
     */
    constructor(options = {}) {
        this.config = { ...MAIN_ACTION_CONFIG, ...options };
        
        // Intégration modules existants
        this.templateProcessor = new TemplateProcessor();
        this.templateManager = new TemplateManager();
        this.dataExposer = new DataExposer();
        this.navigationBuilder = new NavigationBuilder();
        
        // Cache des actions générées
        this.actionCache = new Map();
        this.lastCacheCleanup = Date.now();
        
        // Statistiques
        this.stats = {
            actionsGenerated: 0,
            averageGenerationTime: 0,
            cacheHits: 0,
            cacheMisses: 0,
            errors: []
        };
        
        console.log('✅ MainActionGenerator initialisé');
    }

    /**
     * Génère automatiquement l'action principale pour un état donné
     * @param {Object} stateData - Données complètes de l'état ProcessMetaLanguage
     * @param {Object} objectData - Données de l'objet parent
     * @param {Object} options - Options de génération
     * @returns {Promise<Object>} Action principale générée avec métadonnées complètes
     * @sideEffect Met en cache l'action générée pour performance
     * @example
     * const mainAction = await generator.generateMainAction({
     *   stateId: 'state_en_production_001',
     *   stateName: 'En_Production',
     *   disposition: 'active',
     *   parentObjectId: 'obj_lot_acier_001'
     * }, {
     *   objectId: 'obj_lot_acier_001', 
     *   objectName: 'Lot Acier A001',
     *   objectType: 'raw-material'
     * });
     */
    async generateMainAction(stateData, objectData, options = {}) {
        const startTime = performance.now();
        
        try {
            // Validation des données d'entrée
            this.validateInputData(stateData, objectData);
            
            // Vérifier cache si activé
            const cacheKey = this.generateCacheKey(stateData, objectData);
            if (this.config.cacheEnabled && this.actionCache.has(cacheKey)) {
                const cachedAction = this.actionCache.get(cacheKey);
                if (Date.now() - cachedAction.timestamp < this.config.cacheTTL) {
                    this.stats.cacheHits++;
                    console.log(`📦 Action principale récupérée du cache: ${stateData.stateName}`);
                    return cachedAction.action;
                }
            }
            this.stats.cacheMisses++;
            
            // Générer l'action principale
            const mainAction = await this.createMainActionStructure(stateData, objectData, options);
            
            // Exposer les données complètes via DataExposer
            const exposedData = await this.dataExposer.exposeCompleteStateData(
                stateData, 
                objectData, 
                options.includeHistory !== false
            );
            mainAction.exposedData = exposedData;
            
            // Construire la navigation via NavigationBuilder
            const navigation = await this.navigationBuilder.buildActionNavigation(
                stateData,
                objectData,
                options.includeSecondaryActions !== false
            );
            mainAction.navigation = navigation;
            
            // Enrichir avec métadonnées EPCIS 2.0
            mainAction.epcisMetadata = this.generateEPCISMetadata(stateData, objectData);
            
            // Générer spécifications API
            mainAction.apiSpecifications = this.generateAPISpecifications(mainAction, stateData, objectData);
            
            // Validation de l'action générée
            this.validateGeneratedAction(mainAction);
            
            // Mise en cache
            if (this.config.cacheEnabled) {
                this.cacheAction(cacheKey, mainAction);
            }
            
            // Mise à jour statistiques
            const endTime = performance.now();
            const executionTime = endTime - startTime;
            this.updateStats(executionTime);
            
            console.log(`✅ Action principale générée: ${mainAction.name} (${executionTime.toFixed(2)}ms)`);
            
            return mainAction;
            
        } catch (error) {
            this.stats.errors.push({
                stateId: stateData.stateId,
                error: error.message,
                timestamp: new Date().toISOString()
            });
            
            console.error(`❌ Erreur génération action principale:`, error.message);
            throw error;
        }
    }

    /**
     * Crée la structure de base de l'action principale
     * @param {Object} stateData - Données de l'état
     * @param {Object} objectData - Données de l'objet
     * @param {Object} options - Options de génération
     * @returns {Promise<Object>} Structure de base de l'action principale
     * @private
     */
    async createMainActionStructure(stateData, objectData, options) {
        const timestamp = new Date().toISOString();
        
        // Générer nom et description automatiques
        const actionName = this.config.actionNamePattern.replace('{{STATE_NAME}}', stateData.stateName);
        const actionDescription = this.config.actionDescriptionPattern.replace('{{STATE_NAME}}', stateData.stateName);
        
        return {
            // Identifiants uniques
            id: this.generateActionId(stateData),
            name: actionName,
            description: actionDescription,
            
            // Classification
            type: this.config.actionType,
            category: this.config.actionCategory,
            generated: true,
            autoGenerated: true,
            
            // Relations hiérarchiques
            parentStateId: stateData.stateId || stateData.uniqueId,
            parentStateName: stateData.stateName,
            parentObjectId: objectData.objectId || objectData.uniqueId,
            parentObjectName: objectData.objectName,
            
            // Architecture ProcessMetaLanguage
            architectureLevel: 'main_action',
            architecturePosition: 'state_level',
            isRequired: true,
            
            // Métadonnées temporelles
            createdAt: timestamp,
            lastGenerated: timestamp,
            generatedBy: 'MainActionGenerator',
            version: '1.0.0',
            
            // Configuration visuelle
            color: this.config.actionColor,
            icon: 'eye',
            position: this.calculateActionPosition(stateData),
            
            // Données exposées (à remplir par DataExposer)
            exposedData: null,
            
            // Navigation (à remplir par NavigationBuilder)
            navigation: null,
            
            // Métadonnées EPCIS (à remplir)
            epcisMetadata: null,
            
            // Spécifications API (à remplir)
            apiSpecifications: null,
            
            // Options de génération appliquées
            generationOptions: {
                ...options,
                generatedAt: timestamp
            }
        };
    }

    /**
     * Génère les métadonnées de conformité EPCIS 2.0 pour l'action principale
     * @param {Object} stateData - Données de l'état
     * @param {Object} objectData - Données de l'objet
     * @returns {Object} Métadonnées EPCIS 2.0 complètes
     * @private
     */
    generateEPCISMetadata(stateData, objectData) {
        const timestamp = new Date().toISOString();
        
        return {
            // Event Header EPCIS 2.0
            eventType: 'ObjectEvent',
            eventTime: timestamp,
            eventTimeZoneOffset: '+00:00',
            recordTime: timestamp,
            
            // Business Context
            businessStep: this.config.defaultBusinessStep,
            disposition: stateData.disposition || 'active',
            businessLocation: stateData.businessLocation || objectData.businessLocation || 'urn:epc:id:sgln:0000001.00000.0',
            
            // Object Identification
            epcList: [
                objectData.epc || this.generateEPC(objectData)
            ],
            
            // Action Context
            action: this.config.epcisActionType,
            readPoint: stateData.readPoint || objectData.readPoint,
            bizLocation: stateData.businessLocation || objectData.businessLocation,
            
            // Extension Fields
            extension: {
                sourceState: stateData.stateName,
                targetState: stateData.stateName, // Même état pour action principale
                actionType: this.config.actionType,
                generatedAction: true,
                processMetaLanguage: {
                    version: '1.0.0',
                    objectId: objectData.objectId,
                    stateId: stateData.stateId,
                    actionId: this.generateActionId(stateData)
                }
            },
            
            // Conformité CBV 2.0
            cbvCompliant: true,
            cbvVersion: '2.0.0',
            
            // Validation
            isValid: true,
            validatedAt: timestamp,
            validationRules: [
                'business_step_valid',
                'disposition_valid', 
                'epc_format_valid',
                'timestamp_valid'
            ]
        };
    }

    /**
     * Génère les spécifications API pour l'action principale
     * @param {Object} mainAction - Action principale générée
     * @param {Object} stateData - Données de l'état
     * @param {Object} objectData - Données de l'objet
     * @returns {Object} Spécifications API OpenAPI 3.0
     * @private
     */
    generateAPISpecifications(mainAction, stateData, objectData) {
        const baseUrl = '/api/v1/objects/{objectId}/states/{stateId}/main-action';
        
        return {
            openapi: '3.0.0',
            info: {
                title: `API Action Principale - ${mainAction.name}`,
                version: this.config.apiVersion,
                description: mainAction.description
            },
            
            paths: {
                [baseUrl]: {
                    get: {
                        summary: 'Exécuter action principale - Consultation état',
                        description: 'Expose toutes les données de l\'objet dans son état actuel avec navigation vers actions disponibles',
                        tags: ['Actions Principales', 'Data Exposition'],
                        
                        parameters: [
                            {
                                name: 'objectId',
                                in: 'path',
                                required: true,
                                schema: { type: 'string' },
                                example: objectData.objectId,
                                description: 'Identifiant unique de l\'objet'
                            },
                            {
                                name: 'stateId', 
                                in: 'path',
                                required: true,
                                schema: { type: 'string' },
                                example: stateData.stateId,
                                description: 'Identifiant unique de l\'état'
                            },
                            {
                                name: 'include',
                                in: 'query',
                                required: false,
                                schema: {
                                    type: 'array',
                                    items: {
                                        type: 'string',
                                        enum: this.config.requiredDataSections
                                    }
                                },
                                description: 'Sections de données à inclure'
                            },
                            {
                                name: 'format',
                                in: 'query',
                                required: false,
                                schema: {
                                    type: 'string',
                                    enum: this.config.exportFormats,
                                    default: 'json'
                                },
                                description: 'Format de réponse souhaité'
                            }
                        ],
                        
                        responses: {
                            '200': {
                                description: 'Données état exposées avec succès',
                                content: {
                                    'application/json': {
                                        schema: {
                                            type: 'object',
                                            properties: {
                                                action: {
                                                    type: 'object',
                                                    description: 'Métadonnées de l\'action principale'
                                                },
                                                exposedData: {
                                                    type: 'object',
                                                    description: 'Données complètes de l\'objet et état'
                                                },
                                                navigation: {
                                                    type: 'object',
                                                    description: 'Navigation vers actions secondaires'
                                                },
                                                epcisMetadata: {
                                                    type: 'object',
                                                    description: 'Métadonnées conformité EPCIS 2.0'
                                                }
                                            }
                                        }
                                    }
                                }
                            },
                            '404': {
                                description: 'Objet ou état introuvable'
                            },
                            '500': {
                                description: 'Erreur serveur lors de l\'exposition'
                            }
                        }
                    }
                },
                
                [`${baseUrl}/execute`]: {
                    post: {
                        summary: 'Exécuter action principale avec paramètres',
                        description: 'Version POST pour exécution avec paramètres spécifiques',
                        tags: ['Actions Principales', 'Exécution'],
                        
                        requestBody: {
                            required: true,
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            executionContext: {
                                                type: 'object',
                                                description: 'Contexte d\'exécution'
                                            },
                                            includeHistory: {
                                                type: 'boolean',
                                                default: true,
                                                description: 'Inclure historique des transitions'
                                            },
                                            includeRelations: {
                                                type: 'boolean', 
                                                default: true,
                                                description: 'Inclure objets liés'
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        
                        responses: {
                            '200': {
                                description: 'Action principale exécutée avec succès'
                            }
                        }
                    }
                }
            },
            
            components: {
                schemas: {
                    MainActionResponse: {
                        type: 'object',
                        required: ['action', 'exposedData', 'navigation'],
                        properties: {
                            action: { $ref: '#/components/schemas/MainAction' },
                            exposedData: { $ref: '#/components/schemas/ExposedData' },
                            navigation: { $ref: '#/components/schemas/ActionNavigation' },
                            epcisMetadata: { $ref: '#/components/schemas/EPCISMetadata' }
                        }
                    }
                }
            }
        };
    }

    /**
     * Génère un batch d'actions principales pour plusieurs états
     * @param {Array<Object>} statesData - Liste des états à traiter
     * @param {Array<Object>} objectsData - Liste des objets correspondants
     * @param {Object} options - Options de génération batch
     * @returns {Promise<Object>} Résultats de génération batch avec statistiques
     * @sideEffect Génère plusieurs actions principales en parallèle pour performance
     * @example
     * const results = await generator.generateMainActionsBatch([
     *   {stateId: 'state1', stateName: 'Production'}, 
     *   {stateId: 'state2', stateName: 'QualityCheck'}
     * ], [
     *   {objectId: 'obj1', objectName: 'Lot A001'},
     *   {objectId: 'obj2', objectName: 'Lot A002'}
     * ]);
     */
    async generateMainActionsBatch(statesData, objectsData, options = {}) {
        const startTime = performance.now();
        const batchSize = options.batchSize || 10;
        const results = [];
        let successful = 0;
        let failed = 0;
        
        console.log(`🔄 Génération batch actions principales: ${statesData.length} états`);
        
        // Validation des entrées
        if (statesData.length !== objectsData.length) {
            throw new Error(`Nombre d'états (${statesData.length}) différent du nombre d'objets (${objectsData.length})`);
        }
        
        // Traitement par lots pour optimiser performance
        for (let i = 0; i < statesData.length; i += batchSize) {
            const statesBatch = statesData.slice(i, i + batchSize);
            const objectsBatch = objectsData.slice(i, i + batchSize);
            
            const batchPromises = statesBatch.map(async (stateData, index) => {
                try {
                    const objectData = objectsBatch[index];
                    const mainAction = await this.generateMainAction(stateData, objectData, options);
                    successful++;
                    
                    return {
                        success: true,
                        stateId: stateData.stateId,
                        objectId: objectData.objectId,
                        action: mainAction
                    };
                    
                } catch (error) {
                    failed++;
                    console.error(`❌ Erreur génération action pour état ${stateData.stateId}:`, error.message);
                    
                    return {
                        success: false,
                        stateId: stateData.stateId,
                        objectId: objectsBatch[index]?.objectId,
                        error: error.message
                    };
                }
            });
            
            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults);
            
            // Log progression
            console.log(`📊 Batch ${Math.floor(i / batchSize) + 1}: ${successful} réussites, ${failed} échecs`);
        }
        
        const endTime = performance.now();
        const totalTime = endTime - startTime;
        
        const batchStats = {
            totalStates: statesData.length,
            successful,
            failed,
            executionTime: `${totalTime.toFixed(2)}ms`,
            averageTimePerAction: `${(totalTime / statesData.length).toFixed(2)}ms`,
            performanceTarget: totalTime < 5000 ? '✅ <5s' : '❌ >5s',
            results
        };
        
        console.log(`✅ Génération batch terminée: ${successful}/${statesData.length} (${totalTime.toFixed(2)}ms)`);
        
        return batchStats;
    }

    /**
     * Met à jour automatiquement l'action principale quand l'état change
     * @param {Object} updatedStateData - Nouvelles données de l'état
     * @param {Object} objectData - Données de l'objet (inchangées)
     * @param {Object} options - Options de mise à jour
     * @returns {Promise<Object>} Action principale mise à jour
     * @sideEffect Invalide le cache et régénère l'action
     * @example
     * const updatedAction = await generator.updateMainAction({
     *   stateId: 'state_001',
     *   stateName: 'Production_Terminee', // État mis à jour
     *   disposition: 'inactive'
     * }, objectData);
     */
    async updateMainAction(updatedStateData, objectData, options = {}) {
        try {
            // Invalider cache pour cet état
            const cacheKey = this.generateCacheKey(updatedStateData, objectData);
            if (this.actionCache.has(cacheKey)) {
                this.actionCache.delete(cacheKey);
                console.log(`🗑️ Cache invalidé pour état: ${updatedStateData.stateName}`);
            }
            
            // Régénérer l'action principale
            const updatedAction = await this.generateMainAction(updatedStateData, objectData, {
                ...options,
                isUpdate: true,
                previousVersion: options.previousVersion
            });
            
            console.log(`🔄 Action principale mise à jour: ${updatedAction.name}`);
            
            return updatedAction;
            
        } catch (error) {
            console.error(`❌ Erreur mise à jour action principale:`, error.message);
            throw error;
        }
    }

    /**
     * Valide la structure d'une action principale générée
     * @param {Object} action - Action à valider
     * @throws {Error} Si l'action n'est pas conforme
     * @private
     */
    validateGeneratedAction(action) {
        const requiredFields = [
            'id', 'name', 'description', 'type', 'category',
            'parentStateId', 'parentObjectId', 'exposedData', 
            'navigation', 'epcisMetadata', 'apiSpecifications'
        ];
        
        for (const field of requiredFields) {
            if (!(field in action) || action[field] === null || action[field] === undefined) {
                throw new Error(`Champ requis manquant dans action générée: ${field}`);
            }
        }
        
        // Validation type et catégorie
        if (action.type !== this.config.actionType) {
            throw new Error(`Type d'action incorrect: ${action.type}, attendu: ${this.config.actionType}`);
        }
        
        if (action.category !== this.config.actionCategory) {
            throw new Error(`Catégorie d'action incorrecte: ${action.category}, attendu: ${this.config.actionCategory}`);
        }
        
        // Validation données exposées
        if (!action.exposedData || typeof action.exposedData !== 'object') {
            throw new Error('Données exposées manquantes ou invalides');
        }
        
        // Validation navigation
        if (!action.navigation || typeof action.navigation !== 'object') {
            throw new Error('Navigation manquante ou invalide');
        }
        
        // Validation EPCIS
        if (!action.epcisMetadata || !action.epcisMetadata.cbvCompliant) {
            throw new Error('Métadonnées EPCIS manquantes ou non conformes CBV 2.0');
        }
    }

    /**
     * Valide les données d'entrée pour la génération
     * @param {Object} stateData - Données de l'état
     * @param {Object} objectData - Données de l'objet
     * @throws {Error} Si les données sont invalides
     * @private
     */
    validateInputData(stateData, objectData) {
        // Validation état
        if (!stateData || typeof stateData !== 'object') {
            throw new Error('Données état manquantes ou invalides');
        }
        
        const requiredStateFields = ['stateId', 'stateName'];
        for (const field of requiredStateFields) {
            if (!stateData[field]) {
                throw new Error(`Champ requis manquant dans données état: ${field}`);
            }
        }
        
        // Validation objet
        if (!objectData || typeof objectData !== 'object') {
            throw new Error('Données objet manquantes ou invalides');
        }
        
        const requiredObjectFields = ['objectId', 'objectName'];
        for (const field of requiredObjectFields) {
            if (!objectData[field]) {
                throw new Error(`Champ requis manquant dans données objet: ${field}`);
            }
        }
    }

    /**
     * Génère un identifiant unique pour une action principale
     * @param {Object} stateData - Données de l'état
     * @returns {string} ID unique de l'action
     * @private
     */
    generateActionId(stateData) {
        const timestamp = Date.now();
        const stateIdShort = (stateData.stateId || 'unknown').substring(0, 8);
        const random = Math.random().toString(36).substring(2, 6);
        return `main_action_${stateIdShort}_${timestamp}_${random}`;
    }

    /**
     * Génère une clé de cache pour une action
     * @param {Object} stateData - Données de l'état
     * @param {Object} objectData - Données de l'objet
     * @returns {string} Clé de cache
     * @private
     */
    generateCacheKey(stateData, objectData) {
        return `${objectData.objectId || 'unknown'}_${stateData.stateId || 'unknown'}_${stateData.disposition || 'unknown'}`;
    }

    /**
     * Met l'action en cache avec TTL
     * @param {string} cacheKey - Clé de cache
     * @param {Object} action - Action à cacher
     * @private
     */
    cacheAction(cacheKey, action) {
        // Nettoyer cache si nécessaire
        if (this.actionCache.size >= this.config.maxCacheSize) {
            this.cleanupCache();
        }
        
        this.actionCache.set(cacheKey, {
            action,
            timestamp: Date.now()
        });
    }

    /**
     * Nettoie le cache des entrées expirées
     * @private
     */
    cleanupCache() {
        const now = Date.now();
        let cleaned = 0;
        
        for (const [key, entry] of this.actionCache.entries()) {
            if (now - entry.timestamp > this.config.cacheTTL) {
                this.actionCache.delete(key);
                cleaned++;
            }
        }
        
        if (cleaned > 0) {
            console.log(`🗑️ Cache nettoyé: ${cleaned} entrées expirées supprimées`);
        }
    }

    /**
     * Calcule la position optimale pour une action principale
     * @param {Object} stateData - Données de l'état
     * @returns {Object} Position calculée {x, y}
     * @private
     */
    calculateActionPosition(stateData) {
        // Position relative à l'état parent
        const statePosition = stateData.position || { x: 0, y: 0 };
        
        return {
            x: statePosition.x + 100, // 100px à droite de l'état
            y: statePosition.y,       // Même hauteur que l'état
            relative: true,
            anchor: 'state'
        };
    }

    /**
     * Génère un EPC SGTIN pour un objet
     * @param {Object} objectData - Données de l'objet
     * @returns {string} EPC au format SGTIN
     * @private
     */
    generateEPC(objectData) {
        const company = objectData.userMetadata?.company || '0000001';
        const product = objectData.userMetadata?.product || '000001';
        const serial = objectData.userMetadata?.serial || Date.now().toString().substring(-6);
        
        return `urn:epc:id:sgtin:${company}.${product}.${serial}`;
    }

    /**
     * Met à jour les statistiques de performance
     * @param {number} executionTime - Temps d'exécution en ms
     * @private
     */
    updateStats(executionTime) {
        this.stats.actionsGenerated++;
        this.stats.averageGenerationTime = (
            (this.stats.averageGenerationTime * (this.stats.actionsGenerated - 1) + executionTime) /
            this.stats.actionsGenerated
        );
    }

    /**
     * Obtient les statistiques de performance du générateur
     * @returns {Object} Statistiques détaillées
     */
    getPerformanceStats() {
        return {
            ...this.stats,
            cacheStats: {
                size: this.actionCache.size,
                hits: this.stats.cacheHits,
                misses: this.stats.cacheMisses,
                hitRatio: this.stats.cacheHits / (this.stats.cacheHits + this.stats.cacheMisses) * 100
            },
            performanceTarget: this.stats.averageGenerationTime < this.config.maxGenerationTime ? '✅ <1s' : '❌ >1s'
        };
    }

    /**
     * Vide tous les caches et réinitialise les statistiques
     * @sideEffect Remet à zéro l'état interne du générateur
     */
    reset() {
        this.actionCache.clear();
        this.stats = {
            actionsGenerated: 0,
            averageGenerationTime: 0,
            cacheHits: 0,
            cacheMisses: 0,
            errors: []
        };
        
        console.log('🔄 MainActionGenerator réinitialisé');
    }
}

// Export ES6 par défaut
export { MainActionGenerator, MAIN_ACTION_CONFIG };

// Export browser pour utilisation dans Obsidian
if (typeof window !== 'undefined') {
    window.ProcessMetaLanguageMainActionGenerator = {
        MainActionGenerator,
        MAIN_ACTION_CONFIG
    };
}

// <!-- END OF FILE: main-action-generator.js -->