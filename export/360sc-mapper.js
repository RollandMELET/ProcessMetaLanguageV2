// <!-- START OF FILE: 360sc-mapper.js -->
// FILENAME: 360sc-mapper.js
// Version: 1.0.0
// Date: 2025-07-31 19:00
// Author: Rolland MELET & Claude Code
// Description: Mappeur correspondances 360SmartConnect ProcessMetaLanguage - TASK-D007 Phase 5 intégration système

/**
 * Module ProcessMetaLanguage - 360SmartConnect Mapper
 * 
 * Mappeur de correspondances entre ProcessMetaLanguage et 360SmartConnect.
 * Transforme les workflows ProcessMetaLanguage en entités 360SmartConnect
 * avec préservation de la sémantique et des relations.
 * 
 * Fonctionnalités principales:
 * - Mapping Object ProcessMetaLanguage → Avatar 360SmartConnect
 * - Mapping State → Metadata.status avec historique
 * - Mapping Action → Workflow.action avec paramètres
 * - Mapping Relations → Avatar.relations bidirectionnelles
 * - Génération APIs 360SmartConnect compatibles
 * - Webhooks et notifications temps réel
 * - Synchronisation bidirectionnelle
 * - Validation des mappings et cohérence
 * - Export configuration déploiement
 * - Documentation intégration complète
 */

import { EventEmitter } from 'events';
import { promises as fs } from 'fs';
import path from 'path';
import { performance } from 'perf_hooks';

/**
 * Configuration du mappeur 360SmartConnect
 * @constant {Object}
 */
const SMARTCONNECT_MAPPER_CONFIG = {
    // Configuration 360SmartConnect
    smartConnect: {
        apiVersion: '2.1.0',
        baseUrl: 'https://api.360smartconnect.com/v2',
        authentication: {
            type: 'bearer',
            tokenEndpoint: '/auth/token',
            scopes: ['avatars:read', 'avatars:write', 'workflows:execute', 'relations:manage']
        },
        
        // Limites système
        limits: {
            maxAvatarsPerBatch: 100,
            maxRelationsPerAvatar: 500,
            maxMetadataSize: 32768,  // 32KB
            maxWorkflowSteps: 100,
            requestRateLimit: 1000   // requests/minute
        }
    },
    
    // Mappings de base
    coreMappings: {
        // Object ProcessMetaLanguage → Avatar 360SmartConnect
        object: {
            target: 'Avatar',
            mapping: {
                'id': 'entity.uuid',
                'name': 'entity.name',
                'type': 'entity.type',
                'description': 'entity.description',
                'metadata': 'metadata.properties',
                'createdAt': 'metadata.system.created',
                'updatedAt': 'metadata.system.updated',
                'version': 'metadata.system.version'
            },
            
            // Types d'objets supportés
            typeMapping: {
                'raw-material': 'material.raw',
                'product': 'product.finished',
                'container': 'packaging.container',
                'location': 'location.physical',
                'equipment': 'equipment.industrial'
            }
        },
        
        // State ProcessMetaLanguage → Metadata.status
        state: {
            target: 'Avatar.metadata.status',
            mapping: {
                'name': 'current.state',
                'disposition': 'current.disposition',
                'description': 'current.description',
                'timestamp': 'current.timestamp',
                'actions': 'available.actions'
            },
            
            // Historique des états
            history: {
                enabled: true,
                target: 'metadata.history.states',
                maxEntries: 1000,
                compression: true
            }
        },
        
        // Action ProcessMetaLanguage → Workflow.action
        action: {
            target: 'Workflow.action',
            mapping: {
                'id': 'action.uuid',
                'name': 'action.name',
                'businessStep': 'action.businessStep',
                'type': 'action.type',
                'parameters': 'action.parameters',
                'targetState': 'action.result.targetState'
            },
            
            // Exécution d'actions
            execution: {
                async: true,
                timeout: 30000,
                retryPolicy: {
                    maxRetries: 3,
                    backoffMultiplier: 2,
                    initialDelay: 1000
                }
            }
        },
        
        // Relations ProcessMetaLanguage → Avatar.relations
        relation: {
            target: 'Avatar.relations',
            mapping: {
                'source': 'relation.from.uuid',
                'target': 'relation.to.uuid',
                'type': 'relation.type',
                'strength': 'relation.weight',
                'metadata': 'relation.properties'
            },
            
            // Types de relations supportées
            relationTypes: {
                'contains': 'physical.contains',
                'part_of': 'logical.partOf',
                'depends_on': 'process.dependsOn',
                'transforms_into': 'process.transformsInto',
                'located_at': 'spatial.locatedAt'
            },
            
            // Bidirectionnalité
            bidirectional: true,
            autoSync: true
        }
    },
    
    // Configuration API génération
    apiGeneration: {
        enabled: true,
        
        // Endpoints à générer
        endpoints: {
            avatars: {
                path: '/avatars',
                methods: ['GET', 'POST', 'PUT', 'DELETE'],
                features: ['filtering', 'pagination', 'relationships']
            },
            
            workflows: {
                path: '/workflows',
                methods: ['GET', 'POST'],
                features: ['execution', 'monitoring', 'history']
            },
            
            relations: {
                path: '/relations',
                methods: ['GET', 'POST', 'PUT', 'DELETE'],
                features: ['bidirectional', 'bulk_operations']
            },
            
            sync: {
                path: '/sync',
                methods: ['POST'],
                features: ['batch_processing', 'conflict_resolution']
            }
        },
        
        // Documentation
        documentation: {
            includeExamples: true,
            includeSDK: true,
            languages: ['javascript', 'python', 'curl'],
            includePostman: true
        }
    },
    
    // Configuration webhooks
    webhooks: {
        enabled: true,
        
        events: {
            'avatar.created': 'object.created',
            'avatar.updated': 'object.updated',
            'avatar.deleted': 'object.deleted',
            'workflow.started': 'action.started',
            'workflow.completed': 'action.completed',
            'workflow.failed': 'action.failed',
            'relation.created': 'relation.created',
            'relation.updated': 'relation.updated'
        },
        
        delivery: {
            timeout: 30000,
            retryPolicy: {
                maxRetries: 5,
                exponentialBackoff: true
            },
            
            security: {
                signatureHeader: 'X-360SC-Signature',
                algorithm: 'sha256'
            }
        }
    },
    
    // Configuration synchronisation
    synchronization: {
        mode: 'bidirectional',  // 'push', 'pull', 'bidirectional'
        
        strategies: {
            conflictResolution: 'last_modified_wins',  // 'manual', 'source_wins', 'target_wins'
            batchSize: 50,
            intervalMs: 5000,
            enableRealtime: true
        },
        
        validation: {
            enableSchemaValidation: true,
            enableBusinessRuleValidation: true,
            enableReferentialIntegrity: true,
            failOnValidationError: false
        }
    },
    
    // Configuration export
    export: {
        formats: ['json', 'yaml', 'sql', 'terraform'],
        
        deployment: {
            includeInfrastructure: true,
            includeConfiguration: true,
            includeSecrets: false,  // Utiliser gestionnaire de secrets externe
            includeMigrations: true
        },
        
        documentation: {
            includeArchitecture: true,
            includeAPIReference: true,
            includeDeploymentGuide: true,
            includeTroubleshooting: true
        }
    }
};

/**
 * Résultat de mapping ProcessMetaLanguage → 360SmartConnect
 * @typedef {Object} MappingResult
 * @property {Object} avatars - Avatars 360SmartConnect générés
 * @property {Array} workflows - Workflows d'actions générés
 * @property {Array} relations - Relations entre avatars
 * @property {Object} configuration - Configuration 360SmartConnect
 * @property {Object} apis - APIs générées
 * @property {Array} webhooks - Configuration webhooks
 * @property {Object} validation - Résultats de validation
 */

/**
 * Mappeur de correspondances 360SmartConnect ProcessMetaLanguage
 * Transforme les workflows ProcessMetaLanguage en architecture 360SmartConnect
 * compatible avec préservation de la sémantique métier
 * 
 * @class SmartConnectMapper
 * @extends EventEmitter
 * @example
 * // Mapping complet vers 360SmartConnect
 * const mapper = new SmartConnectMapper({
 *   apiBaseUrl: 'https://my-instance.360smartconnect.com',
 *   enableWebhooks: true,
 *   syncMode: 'bidirectional'
 * });
 * 
 * await mapper.initialize();
 * 
 * const mapping = await mapper.generateCompleteMapping({
 *   workflowData: processData,
 *   outputFormats: ['json', 'yaml', 'terraform'],
 *   includeAPIs: true,
 *   enableValidation: true
 * });
 * 
 * console.log(`Mapping généré: ${mapping.configurationPath}`);
 */
export class SmartConnectMapper extends EventEmitter {
    /**
     * Initialise le mappeur 360SmartConnect
     * @param {Object} options - Options de configuration
     * @param {string} options.apiBaseUrl - URL de base API 360SmartConnect
     * @param {boolean} options.enableWebhooks - Activer webhooks (défaut: true)
     * @param {string} options.syncMode - Mode synchronisation ('push', 'pull', 'bidirectional')
     * @param {boolean} options.enableValidation - Activer validation (défaut: true)
     */
    constructor(options = {}) {
        super();
        
        this.config = {
            ...SMARTCONNECT_MAPPER_CONFIG,
            ...options
        };
        
        // Surcharger URL API si fournie
        if (options.apiBaseUrl) {
            this.config.smartConnect.baseUrl = options.apiBaseUrl;
        }
        
        // Configuration synchronisation
        if (options.syncMode) {
            this.config.synchronization.mode = options.syncMode;
        }
        
        // État du mappeur
        this.isInitialized = false;
        this.activeMappings = new Set();
        this.mappingHistory = [];
        
        // Cache des mappings
        this.avatarsCache = new Map();
        this.workflowsCache = new Map();
        this.relationsCache = new Map();
        
        // Données ProcessMetaLanguage
        this.workflowData = null;
        this.extractedEntities = new Map();
        this.generatedMappings = new Map();
        
        // Métriques
        this.metrics = {
            mappingsGenerated: 0,
            avatarsCreated: 0,
            workflowsGenerated: 0,
            relationsCreated: 0,
            totalMappingTime: 0,
            averageMappingTime: 0,
            validationsPassed: 0,
            validationsFailed: 0,
            syncOperations: 0
        };
        
        // Validateurs et transformeurs
        this.schemaValidator = null;
        this.businessRuleValidator = null;
        this.dataTransformer = null;
    }
    
    /**
     * Initialise le mappeur 360SmartConnect
     * @returns {Promise<void>}
     * @sideEffect Configure validateurs, charge schémas, initialise connexions
     */
    async initialize() {
        try {
            console.log('🔧 Initialisation SmartConnectMapper...');
            
            // Initialiser validateurs
            await this.initializeValidators();
            
            // Charger schémas 360SmartConnect
            await this.loadSmartConnectSchemas();
            
            // Configurer transformateur de données
            await this.initializeDataTransformer();
            
            // Test connexion API 360SmartConnect
            if (this.config.smartConnect.baseUrl.startsWith('http')) {
                await this.testAPIConnection();
            }
            
            this.isInitialized = true;
            console.log('✅ SmartConnectMapper initialisé avec succès');
            
            this.emit('initialized', {
                apiVersion: this.config.smartConnect.apiVersion,
                syncMode: this.config.synchronization.mode,
                webhooksEnabled: this.config.webhooks.enabled,
                validationEnabled: this.config.synchronization.validation.enableSchemaValidation
            });
            
        } catch (error) {
            console.error('❌ Erreur initialisation SmartConnectMapper:', error);
            throw new Error(`Échec initialisation SmartConnectMapper: ${error.message}`);
        }
    }
    
    /**
     * Génère un mapping complet ProcessMetaLanguage → 360SmartConnect
     * @param {Object} options - Options de mapping
     * @param {Object} options.workflowData - Données ProcessMetaLanguage
     * @param {Array<string>} options.outputFormats - Formats de sortie
     * @param {boolean} options.includeAPIs - Inclure génération APIs
     * @param {boolean} options.enableValidation - Activer validation
     * @param {string} options.outputDirectory - Répertoire de sortie
     * @returns {Promise<MappingResult>}
     * @sideEffect Analyse workflow, génère mappings, crée configuration
     * @example
     * // Mapping complet avec APIs et validation
     * const result = await mapper.generateCompleteMapping({
     *   workflowData: processData,
     *   outputFormats: ['json', 'terraform'],
     *   includeAPIs: true,
     *   enableValidation: true,
     *   outputDirectory: './360sc-deployment'
     * });
     */
    async generateCompleteMapping(options = {}) {
        if (!this.isInitialized) {
            throw new Error('SmartConnectMapper non initialisé - appelez initialize() d\'abord');
        }
        
        try {
            const startTime = performance.now();
            console.log('🔧 Génération mapping 360SmartConnect complet...');
            
            // Valider et préparer données
            this.workflowData = this.validateWorkflowData(options.workflowData);
            const outputDir = options.outputDirectory || './360sc-mapping';
            
            // Phase 1: Analyser et extraire entités ProcessMetaLanguage
            console.log('📊 Analyse des entités ProcessMetaLanguage...');
            const entities = await this.extractProcessMetaLanguageEntities(this.workflowData);
            
            // Phase 2: Mapper vers 360SmartConnect
            console.log('🗺️ Mapping vers 360SmartConnect...');
            const avatars = await this.mapToAvatars(entities.objects);
            const workflows = await this.mapToWorkflows(entities.actions, avatars);
            const relations = await this.mapToRelations(entities.relations, avatars);
            
            // Phase 3: Générer configuration 360SmartConnect
            console.log('⚙️ Génération configuration...');
            const configuration = await this.generateSmartConnectConfiguration(avatars, workflows, relations);
            
            // Phase 4: Générer APIs si demandé
            let apis = {};
            if (options.includeAPIs !== false) {
                console.log('🔗 Génération APIs...');
                apis = await this.generateSmartConnectAPIs(avatars, workflows, relations);
            }
            
            // Phase 5: Configurer webhooks
            console.log('🔔 Configuration webhooks...');
            const webhooks = await this.generateWebhooksConfiguration(entities);
            
            // Phase 6: Valider mapping si demandé
            let validation = { isValid: true, errors: [], warnings: [] };
            if (options.enableValidation !== false) {
                console.log('✅ Validation du mapping...');
                validation = await this.validateCompleteMapping({
                    avatars, workflows, relations, configuration
                });
            }
            
            // Phase 7: Exporter configuration
            console.log('📦 Export configuration...');
            const exportResult = await this.exportConfiguration({
                avatars,
                workflows, 
                relations,
                configuration,
                apis,
                webhooks
            }, options.outputFormats || ['json'], outputDir);
            
            // Construire résultat
            const result = {
                avatars: avatars,
                workflows: workflows,
                relations: relations,
                configuration: configuration,
                apis: apis,
                webhooks: webhooks,
                validation: validation,
                export: exportResult,
                metadata: {
                    mappingTime: performance.now() - startTime,
                    timestamp: new Date().toISOString(),
                    sourceElements: {
                        objects: entities.objects.length,
                        states: entities.states.length,
                        actions: entities.actions.length,
                        relations: entities.relations.length
                    },
                    targetElements: {
                        avatars: Object.keys(avatars).length,
                        workflows: workflows.length,
                        relations: relations.length
                    },
                    outputDirectory: outputDir
                },
                metrics: this.getMetrics()
            };
            
            // Mettre à jour métriques
            this.updateMetrics(result);
            
            console.log(`✅ Mapping 360SmartConnect généré en ${(performance.now() - startTime).toFixed(2)}ms`);
            console.log(`👥 ${Object.keys(avatars).length} avatars créés`);
            console.log(`⚡ ${workflows.length} workflows générés`);
            console.log(`🔗 ${relations.length} relations créées`);
            
            if (!validation.isValid) {
                console.log(`⚠️ ${validation.errors.length} erreurs de validation`);
                console.log(`💡 ${validation.warnings.length} avertissements`);
            }
            
            this.emit('mappingGenerated', {
                result: result,
                success: validation.isValid
            });
            
            return result;
            
        } catch (error) {
            this.metrics.validationsFailed++;
            console.error('❌ Erreur génération mapping 360SmartConnect:', error);
            throw error;
        }
    }
    
    /**
     * Extrait les entités ProcessMetaLanguage
     * @param {Object} workflowData - Données ProcessMetaLanguage
     * @returns {Promise<Object>} Entités extraites
     * @private
     */
    async extractProcessMetaLanguageEntities(workflowData) {
        console.log('🔍 Extraction entités ProcessMetaLanguage...');
        
        const entities = {
            objects: [],
            states: [],
            actions: [],
            relations: [],
            workflows: []
        };
        
        // Extraire objets et leurs états/actions
        for (const object of workflowData.objects || []) {
            entities.objects.push({
                id: object.id,
                name: object.name,
                type: object.type,
                description: object.description,
                metadata: object.metadata || {},
                createdAt: object.createdAt || new Date().toISOString(),
                updatedAt: object.updatedAt || new Date().toISOString()
            });
            
            // Extraire états de l'objet
            for (const state of object.states || []) {
                entities.states.push({
                    id: state.id,
                    objectId: object.id,
                    name: state.name,
                    disposition: state.disposition,
                    description: state.description,
                    metadata: state.metadata || {}
                });
                
                // Extraire actions de l'état
                for (const action of state.actions || []) {
                    entities.actions.push({
                        id: action.id,
                        objectId: object.id,
                        stateId: state.id,
                        name: action.name,
                        businessStep: action.businessStep,
                        type: action.type || 'secondary',
                        parameters: action.parameters || {},
                        targetState: action.targetState
                    });
                }
            }
        }
        
        // Extraire relations (flèches entre éléments)
        if (workflowData.relations) {
            entities.relations = workflowData.relations.map(relation => ({
                id: relation.id || `rel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                source: relation.source,
                target: relation.target,
                type: relation.type || 'depends_on',
                weight: relation.weight || 1,
                metadata: relation.metadata || {}
            }));
        }
        
        // Extraire workflows globaux
        if (workflowData.workflows) {
            entities.workflows = workflowData.workflows;
        }
        
        console.log(`📊 Entités extraites: ${entities.objects.length} objets, ${entities.states.length} états, ${entities.actions.length} actions, ${entities.relations.length} relations`);
        
        return entities;
    }
    
    /**
     * Mappe les objets ProcessMetaLanguage vers avatars 360SmartConnect
     * @param {Array} objects - Objets ProcessMetaLanguage
     * @returns {Promise<Object>} Avatars 360SmartConnect
     * @private
     */
    async mapToAvatars(objects) {
        console.log('👥 Mapping objets → avatars...');
        
        const avatars = {};
        const mapping = this.config.coreMappings.object;
        
        for (const object of objects) {
            const avatarId = object.id;
            
            // Créer avatar de base
            const avatar = {
                entity: {
                    uuid: this.getValueFromMapping(object, 'id', mapping.mapping),
                    name: this.getValueFromMapping(object, 'name', mapping.mapping),
                    type: this.mapObjectType(object.type),
                    description: this.getValueFromMapping(object, 'description', mapping.mapping) || ''
                },
                
                metadata: {
                    properties: this.getValueFromMapping(object, 'metadata', mapping.mapping) || {},
                    
                    system: {
                        created: this.getValueFromMapping(object, 'createdAt', mapping.mapping),
                        updated: this.getValueFromMapping(object, 'updatedAt', mapping.mapping),
                        version: this.getValueFromMapping(object, 'version', mapping.mapping) || 1,
                        source: 'ProcessMetaLanguage',
                        mappingVersion: '1.0.0'
                    },
                    
                    status: {
                        current: {
                            state: null,
                            disposition: null,
                            description: null,
                            timestamp: new Date().toISOString()
                        },
                        
                        available: {
                            actions: []
                        },
                        
                        history: {
                            states: [],
                            maxEntries: 1000,
                            compressed: true
                        }
                    },
                    
                    // Métriques et analytics
                    analytics: {
                        stateTransitions: 0,
                        actionsExecuted: 0,
                        lastActivity: new Date().toISOString(),
                        performanceMetrics: {}
                    }
                },
                
                relations: [],
                
                // Configuration 360SmartConnect
                configuration: {
                    visibility: 'internal',
                    permissions: {
                        read: ['user', 'system'],
                        write: ['user', 'system'],
                        execute: ['user', 'system']
                    },
                    
                    features: {
                        trackingEnabled: true,
                        notificationsEnabled: true,
                        auditEnabled: true,
                        metricsEnabled: true
                    }
                }
            };
            
            avatars[avatarId] = avatar;
            this.avatarsCache.set(avatarId, avatar);
        }
        
        this.metrics.avatarsCreated = Object.keys(avatars).length;
        console.log(`👥 ${Object.keys(avatars).length} avatars créés`);
        
        return avatars;
    }
    
    /**
     * Mappe les actions ProcessMetaLanguage vers workflows 360SmartConnect
     * @param {Array} actions - Actions ProcessMetaLanguage
     * @param {Object} avatars - Avatars 360SmartConnect
     * @returns {Promise<Array>} Workflows 360SmartConnect
     * @private
     */
    async mapToWorkflows(actions, avatars) {
        console.log('⚡ Mapping actions → workflows...');
        
        const workflows = [];
        const mapping = this.config.coreMappings.action;
        
        for (const action of actions) {
            const workflow = {
                action: {
                    uuid: this.getValueFromMapping(action, 'id', mapping.mapping),
                    name: this.getValueFromMapping(action, 'name', mapping.mapping),
                    businessStep: this.getValueFromMapping(action, 'businessStep', mapping.mapping),
                    type: this.getValueFromMapping(action, 'type', mapping.mapping),
                    parameters: this.getValueFromMapping(action, 'parameters', mapping.mapping) || {}
                },
                
                target: {
                    avatarId: action.objectId,
                    currentState: action.stateId,
                    targetState: action.targetState
                },
                
                execution: {
                    async: mapping.execution.async,
                    timeout: mapping.execution.timeout,
                    retry: mapping.execution.retryPolicy
                },
                
                // Workflow steps
                steps: [
                    {
                        id: 'validate',
                        name: 'Validate Prerequisites',
                        type: 'validation',
                        parameters: {
                            checkState: true,
                            checkPermissions: true,
                            checkConstraints: true
                        }
                    },
                    {
                        id: 'execute',
                        name: 'Execute Action',
                        type: 'action',
                        parameters: action.parameters || {}
                    },
                    {
                        id: 'update',
                        name: 'Update Avatar State',
                        type: 'state_update',
                        parameters: {
                            newState: action.targetState,
                            updateHistory: true,
                            notifySubscribers: true
                        }
                    }
                ],
                
                // Configuration
                configuration: {
                    priority: action.type === 'main' ? 'high' : 'normal',
                    retryable: true,
                    auditable: true,
                    
                    triggers: {
                        manual: true,
                        api: true,
                        webhook: false,
                        scheduled: false
                    },
                    
                    notifications: {
                        onStart: false,
                        onComplete: true,
                        onError: true
                    }
                },
                
                metadata: {
                    source: 'ProcessMetaLanguage',
                    sourceActionId: action.id,
                    sourceObjectId: action.objectId,
                    sourceStateId: action.stateId,
                    createdAt: new Date().toISOString()
                }
            };
            
            workflows.push(workflow);
            this.workflowsCache.set(action.id, workflow);
        }
        
        this.metrics.workflowsGenerated = workflows.length;
        console.log(`⚡ ${workflows.length} workflows générés`);
        
        return workflows;
    }
    
    /**
     * Mappe les relations ProcessMetaLanguage vers relations 360SmartConnect
     * @param {Array} relations - Relations ProcessMetaLanguage
     * @param {Object} avatars - Avatars 360SmartConnect
     * @returns {Promise<Array>} Relations 360SmartConnect
     * @private
     */
    async mapToRelations(relations, avatars) {
        console.log('🔗 Mapping relations...');
        
        const smartConnectRelations = [];
        const mapping = this.config.coreMappings.relation;
        
        for (const relation of relations) {
            // Créer relation directe
            const directRelation = {
                relation: {
                    from: {
                        uuid: relation.source,
                        type: 'avatar'
                    },
                    to: {
                        uuid: relation.target,
                        type: 'avatar'
                    },
                    type: this.mapRelationType(relation.type),
                    weight: relation.weight || 1,
                    properties: relation.metadata || {}
                },
                
                metadata: {
                    source: 'ProcessMetaLanguage',
                    sourceRelationId: relation.id,
                    createdAt: new Date().toISOString(),
                    bidirectional: mapping.bidirectional,
                    autoSync: mapping.autoSync
                },
                
                configuration: {
                    visibility: 'internal',
                    trackingEnabled: true,
                    notificationsEnabled: false,
                    
                    constraints: {
                        maxWeight: 10,
                        requiredProperties: [],
                        validationRules: []
                    }
                }
            };
            
            smartConnectRelations.push(directRelation);
            
            // Créer relation inverse si bidirectionnelle
            if (mapping.bidirectional) {
                const inverseRelation = {
                    ...directRelation,
                    relation: {
                        ...directRelation.relation,
                        from: directRelation.relation.to,
                        to: directRelation.relation.from,
                        type: this.getInverseRelationType(directRelation.relation.type)
                    },
                    metadata: {
                        ...directRelation.metadata,
                        inverse: true,
                        originalRelationId: relation.id
                    }
                };
                
                smartConnectRelations.push(inverseRelation);
            }
            
            // Ajouter relation aux avatars concernés
            if (avatars[relation.source]) {
                avatars[relation.source].relations.push({
                    targetAvatarId: relation.target,
                    type: directRelation.relation.type,
                    weight: directRelation.relation.weight
                });
            }
            
            if (avatars[relation.target] && mapping.bidirectional) {
                avatars[relation.target].relations.push({
                    targetAvatarId: relation.source,
                    type: this.getInverseRelationType(directRelation.relation.type),
                    weight: directRelation.relation.weight
                });
            }
        }
        
        this.metrics.relationsCreated = smartConnectRelations.length;
        console.log(`🔗 ${smartConnectRelations.length} relations créées (${relations.length} source + inverses)`);
        
        return smartConnectRelations;
    }
    
    /**
     * Génère la configuration 360SmartConnect
     * @param {Object} avatars - Avatars
     * @param {Array} workflows - Workflows
     * @param {Array} relations - Relations
     * @returns {Promise<Object>} Configuration complète
     * @private
     */
    async generateSmartConnectConfiguration(avatars, workflows, relations) {
        console.log('⚙️ Génération configuration 360SmartConnect...');
        
        return {
            version: '2.1.0',
            
            deployment: {
                name: 'ProcessMetaLanguage Integration',
                description: 'Configuration 360SmartConnect générée depuis ProcessMetaLanguage',
                version: '1.0.0',
                environment: 'production',
                
                resources: {
                    avatars: Object.keys(avatars).length,
                    workflows: workflows.length,
                    relations: relations.length,
                    
                    limits: this.config.smartConnect.limits
                }
            },
            
            database: {
                avatars: {
                    tableName: 'pml_avatars',
                    indexes: ['entity.uuid', 'entity.type', 'metadata.system.created'],
                    constraints: {
                        uniqueFields: ['entity.uuid'],
                        requiredFields: ['entity.name', 'entity.type']
                    }
                },
                
                workflows: {
                    tableName: 'pml_workflows',
                    indexes: ['action.uuid', 'target.avatarId', 'metadata.createdAt'],
                    constraints: {
                        foreignKeys: [
                            { field: 'target.avatarId', references: 'pml_avatars.entity.uuid' }
                        ]
                    }
                },
                
                relations: {
                    tableName: 'pml_relations',
                    indexes: ['relation.from.uuid', 'relation.to.uuid', 'relation.type'],
                    constraints: {
                        foreignKeys: [
                            { field: 'relation.from.uuid', references: 'pml_avatars.entity.uuid' },
                            { field: 'relation.to.uuid', references: 'pml_avatars.entity.uuid' }
                        ]
                    }
                }
            },
            
            api: {
                baseUrl: this.config.smartConnect.baseUrl,
                version: this.config.smartConnect.apiVersion,
                authentication: this.config.smartConnect.authentication,
                
                rateLimit: {
                    global: this.config.smartConnect.limits.requestRateLimit,
                    perEndpoint: {
                        '/avatars': 500,
                        '/workflows': 200,
                        '/relations': 300
                    }
                }
            },
            
            features: {
                realTimeSync: this.config.synchronization.enableRealtime,
                webhooks: this.config.webhooks.enabled,
                validation: this.config.synchronization.validation.enableSchemaValidation,
                
                monitoring: {
                    metrics: true,
                    logging: true,
                    tracing: true,
                    alerting: true
                }
            },
            
            security: {
                authentication: {
                    required: true,
                    schemes: ['bearer', 'apiKey'],
                    tokenExpiry: 3600
                },
                
                authorization: {
                    rbac: true,
                    permissions: ['read', 'write', 'execute', 'admin']
                },
                
                encryption: {
                    inTransit: true,
                    atRest: true,
                    algorithm: 'AES-256-GCM'
                }
            }
        };
    }
    
    // Méthodes utilitaires
    
    validateWorkflowData(workflowData) {
        if (!workflowData) {
            throw new Error('Données de workflow requises');
        }
        
        if (!workflowData.objects && !workflowData.actions) {
            throw new Error('Données de workflow invalides - objets ou actions requis');
        }
        
        return workflowData;
    }
    
    getValueFromMapping(source, sourceField, mappingConfig) {
        if (!mappingConfig[sourceField]) {
            return source[sourceField];
        }
        
        const targetPath = mappingConfig[sourceField];
        return this.getNestedValue(source, sourceField) || source[sourceField];
    }
    
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current && current[key], obj);
    }
    
    mapObjectType(processMetaLanguageType) {
        return this.config.coreMappings.object.typeMapping[processMetaLanguageType] || processMetaLanguageType;
    }
    
    mapRelationType(processMetaLanguageType) {
        return this.config.coreMappings.relation.relationTypes[processMetaLanguageType] || processMetaLanguageType;
    }
    
    getInverseRelationType(relationType) {
        const inverseMap = {
            'physical.contains': 'physical.containedBy',
            'logical.partOf': 'logical.hasPart',
            'process.dependsOn': 'process.dependedBy',
            'process.transformsInto': 'process.transformedFrom',
            'spatial.locatedAt': 'spatial.hosts'
        };
        
        return inverseMap[relationType] || `inverse.${relationType}`;
    }
    
    updateMetrics(result) {
        this.metrics.mappingsGenerated++;
        this.metrics.totalMappingTime += result.metadata.mappingTime;
        this.metrics.averageMappingTime = this.metrics.totalMappingTime / this.metrics.mappingsGenerated;
        
        if (result.validation.isValid) {
            this.metrics.validationsPassed++;
        } else {
            this.metrics.validationsFailed++;
        }
    }
    
    getMetrics() {
        return { ...this.metrics };
    }
    
    // Stubs pour méthodes non encore implémentées
    async initializeValidators() { console.log('🔧 Initialisation validateurs...'); }
    async loadSmartConnectSchemas() { console.log('📋 Chargement schémas 360SmartConnect...'); }
    async initializeDataTransformer() { console.log('🔄 Initialisation transformateur...'); }
    async testAPIConnection() { console.log('🔗 Test connexion API...'); }
    
    async generateSmartConnectAPIs(avatars, workflows, relations) {
        return {
            endpoints: [],
            documentation: {},
            sdk: {}
        };
    }
    
    async generateWebhooksConfiguration(entities) {
        return {
            endpoints: [],
            events: [],
            security: {}
        };
    }
    
    async validateCompleteMapping(mapping) {
        return {
            isValid: true,
            errors: [],
            warnings: []
        };
    }
    
    async exportConfiguration(data, formats, outputDir) {
        await fs.mkdir(outputDir, { recursive: true });
        
        const exports = {};
        
        for (const format of formats) {
            const filename = `360sc-configuration.${format}`;
            const filepath = path.join(outputDir, filename);
            
            let content;
            switch (format) {
                case 'json':
                    content = JSON.stringify(data, null, 2);
                    break;
                case 'yaml':
                    content = this.convertToYAML(data);
                    break;
                case 'terraform':
                    content = this.generateTerraformConfig(data);
                    break;
                default:
                    content = JSON.stringify(data, null, 2);
            }
            
            await fs.writeFile(filepath, content, 'utf8');
            exports[format] = filepath;
        }
        
        return exports;
    }
    
    convertToYAML(obj) {
        return JSON.stringify(obj, null, 2); // Simplification
    }
    
    generateTerraformConfig(data) {
        return `# Terraform configuration for 360SmartConnect\n# Generated from ProcessMetaLanguage\n\n# Configuration placeholder\n`;
    }
}

// Export ES6 par défaut
export { SmartConnectMapper, SMARTCONNECT_MAPPER_CONFIG };

// Export browser pour utilisation dans Obsidian
if (typeof window !== 'undefined') {
    window.ProcessMetaLanguageSmartConnectMapper = {
        SmartConnectMapper,
        SMARTCONNECT_MAPPER_CONFIG
    };
}

// <!-- END OF FILE: 360sc-mapper.js -->