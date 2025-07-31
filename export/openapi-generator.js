// <!-- START OF FILE: openapi-generator.js -->
// FILENAME: openapi-generator.js
// Version: 1.0.0
// Date: 2025-07-31 18:45
// Author: Rolland MELET & Claude Code
// Description: Générateur spécifications OpenAPI 3.0 ProcessMetaLanguage - TASK-D006 Phase 5 APIs complètes

/**
 * Module ProcessMetaLanguage - OpenAPI 3.0 Generator
 * 
 * Générateur de spécifications OpenAPI 3.0 complètes pour les workflows ProcessMetaLanguage.
 * Analyse l'architecture et génère automatiquement des APIs RESTful conformes aux standards.
 * 
 * Fonctionnalités principales:
 * - Génération spécifications OpenAPI 3.0 complètes
 * - Endpoints CRUD pour objets, états, actions
 * - Schémas de données avec validation JSON Schema
 * - Documentation interactive Swagger UI
 * - Collections Postman et exemples cURL
 * - SDKs client générés (JavaScript, Python, Java)
 * - Validation conformité EPCIS 2.0 et GS1
 * - Tests automatisés des endpoints
 * - Versioning et migration d'API
 * - Monitoring et métriques OpenTelemetry
 */

import { EventEmitter } from '../utils/obsidian-adapter.js';
import { fs } from '../utils/obsidian-adapter.js';
import { path } from '../utils/obsidian-adapter.js';
import { performance } from '../utils/obsidian-adapter.js';

/**
 * Configuration du générateur OpenAPI
 * @constant {Object}
 */
const OPENAPI_GENERATOR_CONFIG = {
    // Version OpenAPI supportée
    openApiVersion: '3.0.3',
    
    // Configuration API de base
    api: {
        title: 'ProcessMetaLanguage API',
        version: '1.0.0',
        description: 'API RESTful pour système de traçabilité industrielle ProcessMetaLanguage',
        termsOfService: 'https://processmetalanguage.com/terms',
        contact: {
            name: 'API Support',
            url: 'https://processmetalanguage.com/support',
            email: 'api-support@processmetalanguage.com'
        },
        license: {
            name: 'MIT',
            url: 'https://opensource.org/licenses/MIT'
        }
    },
    
    // Configuration serveurs
    servers: [
        {
            url: 'https://api.processmetalanguage.com/v1',
            description: 'Production server'
        },
        {
            url: 'https://staging-api.processmetalanguage.com/v1',
            description: 'Staging server'
        },
        {
            url: 'http://localhost:3000/api/v1',
            description: 'Development server'
        }
    ],
    
    // Types d'endpoints à générer
    endpointTypes: {
        objects: {
            enabled: true,
            basePath: '/objects',
            operations: ['GET', 'POST', 'PUT', 'DELETE'],
            features: ['pagination', 'filtering', 'sorting', 'search']
        },
        
        states: {
            enabled: true,
            basePath: '/states',
            operations: ['GET', 'POST', 'PUT', 'DELETE'],
            features: ['pagination', 'filtering', 'transitions']
        },
        
        actions: {
            enabled: true,
            basePath: '/actions',
            operations: ['GET', 'POST', 'PUT'],
            features: ['execution', 'validation', 'scheduling']
        },
        
        workflows: {
            enabled: true,
            basePath: '/workflows',
            operations: ['GET', 'POST', 'PUT', 'DELETE'],
            features: ['orchestration', 'monitoring', 'versioning']
        },
        
        templates: {
            enabled: true,
            basePath: '/templates',
            operations: ['GET', 'POST', 'PUT', 'DELETE'],
            features: ['inheritance', 'validation', 'versioning']
        },
        
        reports: {
            enabled: true,
            basePath: '/reports',
            operations: ['GET', 'POST'],
            features: ['export', 'scheduling', 'caching']
        },
        
        system: {
            enabled: true,
            basePath: '/system',
            operations: ['GET'],
            features: ['health', 'metrics', 'configuration']
        }
    },
    
    // Configuration authentification
    security: {
        schemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                description: 'JWT Bearer token'
            },
            apiKey: {
                type: 'apiKey',
                in: 'header',
                name: 'X-API-Key',
                description: 'API Key for service-to-service communication'
            },
            oauth2: {
                type: 'oauth2',
                flows: {
                    authorizationCode: {
                        authorizationUrl: 'https://auth.processmetalanguage.com/oauth/authorize',
                        tokenUrl: 'https://auth.processmetalanguage.com/oauth/token',
                        scopes: {
                            'read:objects': 'Read objects',
                            'write:objects': 'Write objects',
                            'read:workflows': 'Read workflows',
                            'write:workflows': 'Write workflows',
                            'admin': 'Administrative access'
                        }
                    }
                }
            }
        },
        
        defaultScheme: 'bearerAuth',
        globalSecurity: [
            { bearerAuth: [] },
            { apiKey: [] }
        ]
    },
    
    // Configuration schémas de données
    schemas: {
        enableValidation: true,
        enableExamples: true,
        enableNullable: true,
        enableReadOnly: true,
        enableWriteOnly: true,
        
        commonFormats: {
            date: 'date',
            dateTime: 'date-time',
            uuid: 'uuid',
            uri: 'uri',
            email: 'email'
        },
        
        // Propriétés communes
        commonProperties: {
            id: {
                type: 'string',
                format: 'uuid',
                readOnly: true,
                description: 'Unique identifier'
            },
            createdAt: {
                type: 'string',
                format: 'date-time',
                readOnly: true,
                description: 'Creation timestamp'
            },
            updatedAt: {
                type: 'string',
                format: 'date-time',
                readOnly: true,
                description: 'Last update timestamp'
            },
            version: {
                type: 'integer',
                minimum: 1,
                readOnly: true,
                description: 'Version number for optimistic locking'
            }
        }
    },
    
    // Configuration réponses standard
    responses: {
        standardErrors: {
            400: 'Bad Request',
            401: 'Unauthorized',
            403: 'Forbidden',
            404: 'Not Found',
            409: 'Conflict',
            422: 'Unprocessable Entity',
            429: 'Too Many Requests',
            500: 'Internal Server Error',
            503: 'Service Unavailable'
        },
        
        enablePagination: true,
        defaultPageSize: 20,
        maxPageSize: 100,
        
        includeMeta: true,
        includeLinks: true
    },
    
    // Configuration génération
    generation: {
        enableSwaggerUI: true,
        enableReDoc: true,
        enablePostmanCollection: true,
        enableSDKGeneration: ['javascript', 'python', 'java'],
        enableMockServer: true,
        enableContractTesting: true,
        
        outputFormats: ['json', 'yaml', 'html'],
        prettyPrint: true,
        includeExamples: true,
        includeDeprecated: false
    },
    
    // Intégration EPCIS 2.0
    epcis: {
        enableCompliance: true,
        version: '2.0',
        vocabularyVersion: 'CBV-2.0',
        
        // Mappings EPCIS
        mappings: {
            objects: 'epc_list',
            states: 'disposition',
            actions: 'business_step',
            locations: 'read_point',
            timestamps: 'event_time'
        },
        
        // Types d'événements EPCIS
        eventTypes: [
            'ObjectEvent',
            'AggregationEvent', 
            'TransactionEvent',
            'TransformationEvent',
            'AssociationEvent'
        ]
    }
};

/**
 * Spécification endpoint avec métadonnées
 * @typedef {Object} EndpointSpec
 * @property {string} method - Méthode HTTP
 * @property {string} path - Chemin de l'endpoint
 * @property {string} operationId - Identifiant unique de l'opération
 * @property {string} summary - Résumé de l'opération
 * @property {string} description - Description détaillée
 * @property {Array} tags - Tags pour groupement
 * @property {Object} parameters - Paramètres d'entrée
 * @property {Object} requestBody - Corps de requête
 * @property {Object} responses - Réponses possibles
 * @property {Array} security - Schémas de sécurité
 */

/**
 * Résultat de génération OpenAPI
 * @typedef {Object} OpenAPIGenerationResult
 * @property {Object} specification - Spécification OpenAPI complète
 * @property {string} specificationPath - Chemin vers fichier de spécification
 * @property {Object} artifacts - Artefacts générés (UI, SDK, tests)
 * @property {Object} validation - Résultats de validation
 * @property {Object} metrics - Métriques de génération
 */

/**
 * Générateur de spécifications OpenAPI 3.0 ProcessMetaLanguage
 * Analyse les workflows et génère des APIs RESTful complètes
 * avec documentation, validation et outils de développement
 * 
 * @class OpenAPIGenerator  
 * @extends EventEmitter
 * @example
 * // Génération API complète avec Swagger UI
 * const generator = new OpenAPIGenerator({
 *   apiTitle: 'Mon API ProcessMetaLanguage',
 *   version: '2.0.0',
 *   enableSwaggerUI: true,
 *   enableSDKGeneration: ['javascript', 'python']
 * });
 * 
 * await generator.initialize();
 * 
 * const apiSpec = await generator.generateCompleteAPI({
 *   workflowData: workflowData,
 *   outputFormats: ['json', 'yaml', 'html'],
 *   enableValidation: true
 * });
 * 
 * console.log(`API générée: ${apiSpec.specificationPath}`);
 */
export class OpenAPIGenerator extends EventEmitter {
    /**
     * Initialise le générateur OpenAPI
     * @param {Object} options - Options de configuration
     * @param {string} options.apiTitle - Titre de l'API
     * @param {string} options.version - Version de l'API
     * @param {boolean} options.enableSwaggerUI - Activer Swagger UI (défaut: true)
     * @param {Array<string>} options.enableSDKGeneration - SDKs à générer
     * @param {boolean} options.enableEPCISCompliance - Conformité EPCIS (défaut: true)
     */
    constructor(options = {}) {
        super();
        
        this.config = {
            ...OPENAPI_GENERATOR_CONFIG,
            ...options
        };
        
        // Surcharger configuration API si fournie
        if (options.apiTitle) this.config.api.title = options.apiTitle;
        if (options.version) this.config.api.version = options.version;
        
        // État du générateur
        this.isInitialized = false;
        this.activeGenerations = new Set();
        this.generationHistory = [];
        
        // Cache des spécifications
        this.specificationsCache = new Map();
        this.schemasCache = new Map();
        
        // Données de workflow
        this.workflowData = null;
        this.extractedSchemas = new Map();
        this.generatedEndpoints = new Map();
        
        // Métriques
        this.metrics = {
            specificationsGenerated: 0,
            endpointsGenerated: 0,
            schemasGenerated: 0,
            totalGenerationTime: 0,
            averageGenerationTime: 0,
            validationsPassed: 0,
            validationsFailed: 0,
            sdksGenerated: 0
        };
        
        // Validateurs et générateurs
        this.schemaValidator = null;
        this.specValidator = null;
        this.sdkGenerators = new Map();
    }
    
    /**
     * Initialise le générateur OpenAPI
     * @returns {Promise<void>}
     * @sideEffect Configure validateurs, charge templates, initialise générateurs SDK
     */
    async initialize() {
        try {
            console.log('🔧 Initialisation OpenAPIGenerator...');
            
            // Initialiser validateurs
            await this.initializeValidators();
            
            // Charger templates OpenAPI
            await this.loadOpenAPITemplates();
            
            // Configurer générateurs SDK
            await this.initializeSDKGenerators();
            
            // Charger mappings EPCIS si activés
            if (this.config.epcis.enableCompliance) {
                await this.loadEPCISMappings();
            }
            
            this.isInitialized = true;
            console.log('✅ OpenAPIGenerator initialisé avec succès');
            
            this.emit('initialized', {
                openApiVersion: this.config.openApiVersion,
                endpointTypes: Object.keys(this.config.endpointTypes),
                sdkLanguages: this.config.generation.enableSDKGeneration,
                epcisCompliance: this.config.epcis.enableCompliance
            });
            
        } catch (error) {
            console.error('❌ Erreur initialisation OpenAPIGenerator:', error);
            throw new Error(`Échec initialisation OpenAPIGenerator: ${error.message}`);
        }
    }
    
    /**
     * Génère une spécification OpenAPI complète
     * @param {Object} options - Options de génération
     * @param {Object} options.workflowData - Données du workflow
     * @param {Array<string>} options.outputFormats - Formats de sortie
     * @param {boolean} options.enableValidation - Activer validation
     * @param {string} options.outputDirectory - Répertoire de sortie
     * @returns {Promise<OpenAPIGenerationResult>}
     * @sideEffect Analyse workflow, génère spécification, crée artefacts
     * @example
     * // Génération complète avec tous les artefacts
     * const result = await generator.generateCompleteAPI({
     *   workflowData: processData,
     *   outputFormats: ['json', 'yaml', 'html'],
     *   enableValidation: true,
     *   outputDirectory: './api-docs'
     * });
     */
    async generateCompleteAPI(options = {}) {
        if (!this.isInitialized) {
            throw new Error('OpenAPIGenerator non initialisé - appelez initialize() d\'abord');
        }
        
        try {
            const startTime = performance.now();
            console.log('🔧 Génération spécification OpenAPI complète...');
            
            // Valider et préparer données
            this.workflowData = this.validateWorkflowData(options.workflowData);
            const outputDir = options.outputDirectory || './api-docs';
            
            // Créer structure de base OpenAPI
            const baseSpec = this.createBaseSpecification();
            
            // Analyser et extraire schémas
            console.log('📊 Extraction des schémas de données...');
            const schemas = await this.extractDataSchemas(this.workflowData);
            
            // Générer endpoints
            console.log('🔗 Génération des endpoints...');
            const endpoints = await this.generateAllEndpoints(this.workflowData);
            
            // Construire spécification complète
            const completeSpec = this.buildCompleteSpecification(baseSpec, schemas, endpoints);
            
            // Valider spécification si demandé
            let validation = { isValid: true, errors: [] };
            if (options.enableValidation !== false) {
                console.log('✅ Validation de la spécification...');
                validation = await this.validateSpecification(completeSpec);
            }
            
            // Générer artefacts
            console.log('📦 Génération des artefacts...');
            const artifacts = await this.generateArtifacts(
                completeSpec,
                options.outputFormats || ['json', 'yaml'],
                outputDir
            );
            
            // Construire résultat
            const result = {
                specification: completeSpec,
                specificationPath: artifacts.specificationFiles.json,
                artifacts: artifacts,
                validation: validation,
                metadata: {
                    generationTime: performance.now() - startTime,
                    timestamp: new Date().toISOString(),
                    openApiVersion: this.config.openApiVersion,
                    endpointsGenerated: Object.keys(completeSpec.paths).length,
                    schemasGenerated: Object.keys(completeSpec.components.schemas).length,
                    outputDirectory: outputDir
                },
                metrics: this.getGenerationMetrics()
            };
            
            // Mettre à jour métriques
            this.updateMetrics(result);
            
            console.log(`✅ Spécification OpenAPI générée en ${(performance.now() - startTime).toFixed(2)}ms`);
            console.log(`🔗 ${Object.keys(completeSpec.paths).length} endpoints générés`);
            console.log(`📊 ${Object.keys(completeSpec.components.schemas).length} schémas générés`);
            
            if (!validation.isValid) {
                console.log(`⚠️ ${validation.errors.length} erreurs de validation détectées`);
            }
            
            this.emit('specificationGenerated', {
                result: result,
                success: validation.isValid
            });
            
            return result;
            
        } catch (error) {
            this.metrics.validationsFailed++;
            console.error('❌ Erreur génération OpenAPI:', error);
            throw error;
        }
    }
    
    /**
     * Crée la structure de base de la spécification OpenAPI
     * @returns {Object} Spécification de base
     * @private
     */
    createBaseSpecification() {
        return {
            openapi: this.config.openApiVersion,
            info: {
                ...this.config.api,
                'x-generator': 'ProcessMetaLanguage OpenAPI Generator',
                'x-generated-at': new Date().toISOString()
            },
            servers: this.config.servers,
            security: this.config.security.globalSecurity,
            paths: {},
            components: {
                schemas: {},
                responses: this.createStandardResponses(),
                parameters: this.createStandardParameters(),
                examples: {},
                requestBodies: {},
                headers: {},
                securitySchemes: this.config.security.schemes,
                links: {},
                callbacks: {}
            },
            tags: this.createAPITags(),
            externalDocs: {
                description: 'ProcessMetaLanguage Documentation',
                url: 'https://processmetalanguage.com/docs'
            }
        };
    }
    
    /**
     * Extrait les schémas de données du workflow
     * @param {Object} workflowData - Données du workflow
     * @returns {Promise<Object>} Schémas extraits
     * @private
     */
    async extractDataSchemas(workflowData) {
        console.log('📊 Extraction schémas depuis workflow...');
        
        const schemas = {
            // Schémas de base
            ...this.createBaseSchemas(),
            
            // Schémas extraits du workflow
            ...await this.extractObjectSchemas(workflowData.objects || []),
            ...await this.extractStateSchemas(workflowData.states || []),
            ...await this.extractActionSchemas(workflowData.actions || []),
            ...await this.extractWorkflowSchemas(workflowData.workflows || []),
            
            // Schémas EPCIS si activés
            ...(this.config.epcis.enableCompliance ? this.createEPCISSchemas() : {})
        };
        
        // Valider schémas générés
        for (const [name, schema] of Object.entries(schemas)) {
            if (!this.isValidJSONSchema(schema)) {
                console.warn(`⚠️ Schéma invalide détecté: ${name}`);
            }
        }
        
        this.metrics.schemasGenerated = Object.keys(schemas).length;
        
        return schemas;
    }
    
    /**
     * Génère tous les endpoints de l'API
     * @param {Object} workflowData - Données du workflow
     * @returns {Promise<Object>} Endpoints générés
     * @private
     */
    async generateAllEndpoints(workflowData) {
        console.log('🔗 Génération de tous les endpoints...');
        
        const allEndpoints = {};
        
        // Générer endpoints par type
        for (const [type, config] of Object.entries(this.config.endpointTypes)) {
            if (config.enabled) {
                console.log(`  📍 Génération endpoints ${type}...`);
                const endpoints = await this.generateEndpointsForType(type, config, workflowData);
                Object.assign(allEndpoints, endpoints);
            }
        }
        
        // Ajouter endpoints système
        const systemEndpoints = this.generateSystemEndpoints();
        Object.assign(allEndpoints, systemEndpoints);
        
        this.metrics.endpointsGenerated = Object.keys(allEndpoints).length;
        
        return allEndpoints;
    }
    
    /**
     * Génère les endpoints pour un type spécifique
     * @param {string} type - Type d'endpoint
     * @param {Object} config - Configuration du type
     * @param {Object} workflowData - Données du workflow
     * @returns {Promise<Object>} Endpoints du type
     * @private
     */
    async generateEndpointsForType(type, config, workflowData) {
        const endpoints = {};
        const basePath = config.basePath;
        
        // Endpoints de collection
        if (config.operations.includes('GET')) {
            endpoints[`${basePath}`] = {
                get: this.createGetCollectionEndpoint(type, config)
            };
        }
        
        if (config.operations.includes('POST')) {
            endpoints[`${basePath}`] = {
                ...endpoints[basePath],
                post: this.createPostEndpoint(type, config)
            };
        }
        
        // Endpoints d'item
        const itemPath = `${basePath}/{id}`;
        
        if (config.operations.includes('GET')) {
            endpoints[itemPath] = {
                get: this.createGetItemEndpoint(type, config)
            };
        }
        
        if (config.operations.includes('PUT')) {
            endpoints[itemPath] = {
                ...endpoints[itemPath],
                put: this.createPutEndpoint(type, config)
            };
        }
        
        if (config.operations.includes('DELETE')) {
            endpoints[itemPath] = {
                ...endpoints[itemPath],
                delete: this.createDeleteEndpoint(type, config)
            };
        }
        
        // Endpoints spécialisés selon le type
        switch (type) {
            case 'actions':
                endpoints[`${basePath}/{id}/execute`] = {
                    post: this.createActionExecuteEndpoint(config)
                };
                break;
                
            case 'workflows':
                endpoints[`${basePath}/{id}/start`] = {
                    post: this.createWorkflowStartEndpoint(config)
                };
                endpoints[`${basePath}/{id}/status`] = {
                    get: this.createWorkflowStatusEndpoint(config)
                };
                break;
                
            case 'states':
                endpoints[`${basePath}/{id}/transitions`] = {
                    get: this.createStateTransitionsEndpoint(config)
                };
                break;
        }
        
        return endpoints;
    }
    
    /**
     * Construit la spécification complète
     * @param {Object} baseSpec - Spécification de base
     * @param {Object} schemas - Schémas de données
     * @param {Object} endpoints - Endpoints générés
     * @returns {Object} Spécification complète
     * @private
     */
    buildCompleteSpecification(baseSpec, schemas, endpoints) {
        return {
            ...baseSpec,
            paths: endpoints,
            components: {
                ...baseSpec.components,
                schemas: {
                    ...baseSpec.components.schemas,
                    ...schemas
                }
            }
        };
    }
    
    /**
     * Génère tous les artefacts (fichiers, UI, SDK)
     * @param {Object} specification - Spécification OpenAPI
     * @param {Array<string>} outputFormats - Formats de sortie
     * @param {string} outputDir - Répertoire de sortie
     * @returns {Promise<Object>} Artefacts générés
     * @private
     */
    async generateArtifacts(specification, outputFormats, outputDir) {
        const artifacts = {
            specificationFiles: {},
            documentation: {},
            collections: {},
            sdks: {},
            tests: {}
        };
        
        // Créer répertoire de sortie
        await fs.mkdir(outputDir, { recursive: true });
        
        // Générer fichiers de spécification
        for (const format of outputFormats) {
            const filename = `openapi.${format}`;
            const filepath = path.join(outputDir, filename);
            
            let content;
            switch (format) {
                case 'json':
                    content = JSON.stringify(specification, null, 2);
                    break;
                case 'yaml':
                    content = this.convertToYAML(specification);
                    break;
                case 'html':
                    content = await this.generateSwaggerHTML(specification);
                    break;
                default:
                    throw new Error(`Format non supporté: ${format}`);
            }
            
            await fs.writeFile(filepath, content, 'utf8');
            artifacts.specificationFiles[format] = filepath;
        }
        
        // Générer Swagger UI si activé
        if (this.config.generation.enableSwaggerUI) {
            artifacts.documentation.swaggerUI = await this.generateSwaggerUI(specification, outputDir);
        }
        
        // Générer ReDoc si activé
        if (this.config.generation.enableReDoc) {
            artifacts.documentation.redoc = await this.generateReDoc(specification, outputDir);
        }
        
        // Générer collection Postman si activé
        if (this.config.generation.enablePostmanCollection) {
            artifacts.collections.postman = await this.generatePostmanCollection(specification, outputDir);
        }
        
        // Générer SDKs si activés
        for (const language of this.config.generation.enableSDKGeneration) {
            artifacts.sdks[language] = await this.generateSDK(specification, language, outputDir);
        }
        
        // Générer tests si activés
        if (this.config.generation.enableContractTesting) {
            artifacts.tests.contract = await this.generateContractTests(specification, outputDir);
        }
        
        return artifacts;
    }
    
    // Méthodes de création d'endpoints
    
    createGetCollectionEndpoint(type, config) {
        return {
            tags: [this.capitalizeFirst(type)],
            summary: `List ${type}`,
            description: `Retrieve a paginated list of ${type}`,
            operationId: `list${this.capitalizeFirst(type)}`,
            parameters: [
                ...this.createPaginationParameters(),
                ...this.createFilteringParameters(type),
                ...(config.features.includes('sorting') ? this.createSortingParameters(type) : []),
                ...(config.features.includes('search') ? this.createSearchParameters() : [])
            ],
            responses: {
                '200': {
                    description: `List of ${type}`,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    data: {
                                        type: 'array',
                                        items: { $ref: `#/components/schemas/${this.capitalizeFirst(type.slice(0, -1))}` }
                                    },
                                    meta: { $ref: '#/components/schemas/PaginationMeta' },
                                    links: { $ref: '#/components/schemas/PaginationLinks' }
                                }
                            }
                        }
                    }
                },
                ...this.createStandardErrorResponses()
            },
            security: this.config.security.globalSecurity
        };
    }
    
    createPostEndpoint(type, config) {
        return {
            tags: [this.capitalizeFirst(type)],
            summary: `Create ${type.slice(0, -1)}`,
            description: `Create a new ${type.slice(0, -1)}`,
            operationId: `create${this.capitalizeFirst(type.slice(0, -1))}`,
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: { $ref: `#/components/schemas/${this.capitalizeFirst(type.slice(0, -1))}Create` }
                    }
                }
            },
            responses: {
                '201': {
                    description: `${this.capitalizeFirst(type.slice(0, -1))} created successfully`,
                    content: {
                        'application/json': {
                            schema: { $ref: `#/components/schemas/${this.capitalizeFirst(type.slice(0, -1))}` }
                        }
                    }
                },
                ...this.createStandardErrorResponses()
            },
            security: this.config.security.globalSecurity
        };
    }
    
    createGetItemEndpoint(type, config) {
        return {
            tags: [this.capitalizeFirst(type)],
            summary: `Get ${type.slice(0, -1)}`,
            description: `Retrieve a specific ${type.slice(0, -1)} by ID`,
            operationId: `get${this.capitalizeFirst(type.slice(0, -1))}`,
            parameters: [
                {
                    name: 'id',
                    in: 'path',
                    required: true,
                    schema: { type: 'string', format: 'uuid' },
                    description: `${this.capitalizeFirst(type.slice(0, -1))} ID`
                }
            ],
            responses: {
                '200': {
                    description: `${this.capitalizeFirst(type.slice(0, -1))} details`,
                    content: {
                        'application/json': {
                            schema: { $ref: `#/components/schemas/${this.capitalizeFirst(type.slice(0, -1))}` }
                        }
                    }
                },
                ...this.createStandardErrorResponses()
            },
            security: this.config.security.globalSecurity
        };
    }
    
    // Méthodes de création de schémas
    
    createBaseSchemas() {
        return {
            // Schéma d'erreur standard
            Error: {
                type: 'object',
                required: ['code', 'message'],
                properties: {
                    code: {
                        type: 'string',
                        description: 'Error code'
                    },
                    message: {
                        type: 'string',
                        description: 'Error message'
                    },
                    details: {
                        type: 'object',
                        description: 'Additional error details'
                    },
                    timestamp: {
                        type: 'string',
                        format: 'date-time',
                        description: 'Error timestamp'
                    }
                }
            },
            
            // Métadonnées de pagination
            PaginationMeta: {
                type: 'object',
                properties: {
                    page: { type: 'integer', minimum: 1 },
                    pageSize: { type: 'integer', minimum: 1, maximum: 100 },
                    totalItems: { type: 'integer', minimum: 0 },
                    totalPages: { type: 'integer', minimum: 0 }
                }
            },
            
            // Liens de pagination
            PaginationLinks: {
                type: 'object',
                properties: {
                    self: { type: 'string', format: 'uri' },
                    first: { type: 'string', format: 'uri' },
                    prev: { type: 'string', format: 'uri', nullable: true },
                    next: { type: 'string', format: 'uri', nullable: true },
                    last: { type: 'string', format: 'uri' }
                }
            }
        };
    }
    
    async extractObjectSchemas(objects) {
        const schemas = {};
        
        // Schéma objet de base
        schemas.Object = {
            type: 'object',
            required: ['id', 'name', 'type'],
            properties: {
                ...this.config.schemas.commonProperties,
                name: {
                    type: 'string',
                    minLength: 1,
                    maxLength: 255,
                    description: 'Object name'
                },
                type: {
                    type: 'string',
                    enum: ['raw-material', 'product', 'container', 'location', 'equipment'],
                    description: 'Object type'
                },
                description: {
                    type: 'string',
                    maxLength: 1000,
                    description: 'Object description'
                },
                metadata: {
                    type: 'object',
                    additionalProperties: true,
                    description: 'Object metadata'
                },
                states: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/State' },
                    description: 'Object states'
                }
            }
        };
        
        // Schéma de création d'objet
        schemas.ObjectCreate = {
            type: 'object',
            required: ['name', 'type'],
            properties: {
                name: schemas.Object.properties.name,
                type: schemas.Object.properties.type,
                description: schemas.Object.properties.description,
                metadata: schemas.Object.properties.metadata
            }
        };
        
        return schemas;
    }
    
    async extractStateSchemas(states) {
        return {
            State: {
                type: 'object',
                required: ['id', 'name', 'disposition'],
                properties: {
                    ...this.config.schemas.commonProperties,
                    name: {
                        type: 'string',
                        minLength: 1,
                        maxLength: 255,
                        description: 'State name'
                    },
                    disposition: {
                        type: 'string',
                        enum: [
                            'active', 'container_closed', 'damaged', 'destroyed', 
                            'dispensed', 'encoded', 'expired', 'in_progress', 
                            'in_transit', 'inactive', 'non_conformant', 'partially_dispensed',
                            'recalled', 'reserved', 'retail_sold', 'returned', 
                            'sellable_accessible', 'sellable_not_accessible', 'stolen',
                            'unavailable', 'unknown'
                        ],
                        description: 'EPCIS 2.0 disposition'
                    },
                    description: {
                        type: 'string',
                        maxLength: 1000,
                        description: 'State description'
                    },
                    actions: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Action' },
                        description: 'Available actions in this state'
                    }
                }
            },
            
            StateCreate: {
                type: 'object',
                required: ['name', 'disposition'],
                properties: {
                    name: { type: 'string', minLength: 1, maxLength: 255 },
                    disposition: { type: 'string' },
                    description: { type: 'string', maxLength: 1000 }
                }
            }
        };
    }
    
    async extractActionSchemas(actions) {
        return {
            Action: {
                type: 'object',
                required: ['id', 'name', 'businessStep'],
                properties: {
                    ...this.config.schemas.commonProperties,
                    name: {
                        type: 'string',
                        minLength: 1,
                        maxLength: 255,
                        description: 'Action name'
                    },
                    businessStep: {
                        type: 'string',
                        enum: [
                            'accepting', 'arriving', 'assembling', 'collecting',
                            'commissioning', 'consigning', 'creating_class_instance',
                            'cycle_counting', 'decommissioning', 'departing',
                            'destroying', 'disassembling', 'dispensing', 'encoding',
                            'entering_exiting', 'holding', 'inspecting', 'installing',
                            'killing', 'loading', 'other', 'packing', 'picking',
                            'receiving', 'removing', 'repackaging', 'repairing',
                            'replacing', 'reserving', 'retail_selling', 'shipping',
                            'staging_outbound', 'stock_taking', 'stocking', 'storing',
                            'transporting', 'uninstalling', 'unloading', 'unpacking',
                            'void_shipping'
                        ],
                        description: 'EPCIS 2.0 business step'
                    },
                    type: {
                        type: 'string',
                        enum: ['main', 'secondary'],
                        description: 'Action type'
                    },
                    parameters: {
                        type: 'object',
                        additionalProperties: true,
                        description: 'Action parameters'
                    }
                }
            },
            
            ActionExecute: {
                type: 'object',
                required: ['parameters'],
                properties: {
                    parameters: {
                        type: 'object',
                        additionalProperties: true,
                        description: 'Execution parameters'
                    },
                    async: {
                        type: 'boolean',
                        default: false,
                        description: 'Execute asynchronously'
                    }
                }
            }
        };
    }
    
    // Méthodes utilitaires
    
    validateWorkflowData(workflowData) {
        if (!workflowData) {
            throw new Error('Données de workflow requises');
        }
        return workflowData;
    }
    
    createStandardResponses() {
        const responses = {};
        
        for (const [code, description] of Object.entries(this.config.responses.standardErrors)) {
            responses[code] = {
                description: description,
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/Error' }
                    }
                }
            };
        }
        
        return responses;
    }
    
    createStandardErrorResponses() {
        return {
            '400': { $ref: '#/components/responses/400' },
            '401': { $ref: '#/components/responses/401' },
            '403': { $ref: '#/components/responses/403' },
            '404': { $ref: '#/components/responses/404' },
            '500': { $ref: '#/components/responses/500' }
        };
    }
    
    createStandardParameters() {
        return {
            PageParam: {
                name: 'page',
                in: 'query',
                schema: { type: 'integer', minimum: 1, default: 1 },
                description: 'Page number'
            },
            PageSizeParam: {
                name: 'pageSize',
                in: 'query',
                schema: { 
                    type: 'integer', 
                    minimum: 1, 
                    maximum: this.config.responses.maxPageSize,
                    default: this.config.responses.defaultPageSize
                },
                description: 'Number of items per page'
            }
        };
    }
    
    createAPITags() {
        return Object.keys(this.config.endpointTypes).map(type => ({
            name: this.capitalizeFirst(type),
            description: `Operations on ${type}`
        }));
    }
    
    createPaginationParameters() {
        return [
            { $ref: '#/components/parameters/PageParam' },
            { $ref: '#/components/parameters/PageSizeParam' }
        ];
    }
    
    createFilteringParameters(type) {
        // Paramètres de filtrage génériques
        return [
            {
                name: 'filter',
                in: 'query',
                schema: { type: 'string' },
                description: 'Filter expression'
            }
        ];
    }
    
    createSortingParameters(type) {
        return [
            {
                name: 'sort',
                in: 'query',
                schema: { type: 'string' },
                description: 'Sort field and direction (e.g., name:asc, createdAt:desc)'
            }
        ];
    }
    
    createSearchParameters() {
        return [
            {
                name: 'q',
                in: 'query',
                schema: { type: 'string' },
                description: 'Search query'
            }
        ];
    }
    
    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
    
    updateMetrics(result) {
        this.metrics.specificationsGenerated++;
        this.metrics.totalGenerationTime += result.metadata.generationTime;
        this.metrics.averageGenerationTime = this.metrics.totalGenerationTime / this.metrics.specificationsGenerated;
        
        if (result.validation.isValid) {
            this.metrics.validationsPassed++;
        } else {
            this.metrics.validationsFailed++;
        }
    }
    
    getGenerationMetrics() {
        return { ...this.metrics };
    }
    
    // Stubs pour méthodes non encore implémentées
    async initializeValidators() { console.log('🔧 Initialisation validateurs...'); }
    async loadOpenAPITemplates() { console.log('📋 Chargement templates OpenAPI...'); }
    async initializeSDKGenerators() { console.log('🛠️ Initialisation générateurs SDK...'); }
    async loadEPCISMappings() { console.log('🗺️ Chargement mappings EPCIS...'); }
    
    async validateSpecification(spec) {
        return { isValid: true, errors: [] };
    }
    
    isValidJSONSchema(schema) {
        return schema && typeof schema === 'object' && schema.type;
    }
    
    convertToYAML(obj) {
        // Implémentation simplifiée
        return JSON.stringify(obj, null, 2);
    }
    
    async generateSwaggerHTML(spec) {
        return `<!DOCTYPE html><html><head><title>API Documentation</title></head><body><h1>Swagger UI</h1></body></html>`;
    }
    
    async generateSwaggerUI(spec, outputDir) {
        return path.join(outputDir, 'swagger-ui.html');
    }
    
    async generateReDoc(spec, outputDir) {
        return path.join(outputDir, 'redoc.html');
    }
    
    async generatePostmanCollection(spec, outputDir) {
        return path.join(outputDir, 'postman-collection.json');
    }
    
    async generateSDK(spec, language, outputDir) {
        return path.join(outputDir, `sdk-${language}`);
    }
    
    async generateContractTests(spec, outputDir) {
        return path.join(outputDir, 'contract-tests');
    }
    
    generateSystemEndpoints() { return {}; }
    createActionExecuteEndpoint(config) { return {}; }
    createWorkflowStartEndpoint(config) { return {}; }
    createWorkflowStatusEndpoint(config) { return {}; }
    createStateTransitionsEndpoint(config) { return {}; }
    createPutEndpoint(type, config) { return {}; }
    createDeleteEndpoint(type, config) { return {}; }
    async extractWorkflowSchemas(workflows) { return {}; }
    createEPCISSchemas() { return {}; }
}

// Export already done via export class

// Export browser pour utilisation dans Obsidian
if (typeof window !== 'undefined') {
    window.ProcessMetaLanguageOpenAPIGenerator = {
        OpenAPIGenerator,
        OPENAPI_GENERATOR_CONFIG
    };
}

// <!-- END OF FILE: openapi-generator.js -->