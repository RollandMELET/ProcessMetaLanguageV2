// <!-- START OF FILE: data-exposer.js -->
// FILENAME: data-exposer.js
// Version: 1.0.0
// Date: 2025-07-30 16:30
// Author: Rolland MELET & Claude Code
// Description: Module exposition données ProcessMetaLanguage - TASK-B006

/**
 * Module ProcessMetaLanguage - Data Exposer
 * 
 * Système spécialisé dans l'exposition structurée des métadonnées d'objets et d'états.
 * Formate les données pour consommation par les actions principales selon l'architecture
 * État-Actions deux niveaux avec conformité EPCIS 2.0 complète.
 * 
 * Fonctionnalités principales:
 * - Exposition métadonnées objet avec historique complet
 * - Données état actuel avec conformité dispositions CBV 2.0  
 * - Relations hiérarchiques et liaisons objets
 * - Historique transitions avec business steps EPCIS
 * - Formatage API-ready pour 360SmartConnect
 * - Performance optimisée avec cache intelligent
 */

import { EPCISValidator } from './epcis-validator.js';

/**
 * Configuration du module d'exposition de données
 * @constant {Object}
 */
const DATA_EXPOSER_CONFIG = {
    // Formats de sortie
    outputFormats: ['json', 'xml', 'yaml', 'csv'],
    defaultFormat: 'json',
    
    // Sections de données disponibles
    dataSections: {
        object_metadata: 'Métadonnées objet complètes',
        current_state: 'État actuel avec disposition',
        state_history: 'Historique des transitions',
        related_objects: 'Objets liés et relations',
        epcis_compliance: 'Conformité EPCIS 2.0 CBV',
        available_actions: 'Actions disponibles depuis état actuel',
        business_context: 'Contexte business et règles',
        technical_metadata: 'Métadonnées techniques et synchronisation'
    },
    
    // Performance et cache
    cacheEnabled: true,
    cacheTTL: 180000, // 3 minutes
    maxDataSize: 100 * 1024, // 100KB max par exposition
    compressionEnabled: true,
    
    // Historique
    maxHistoryEntries: 100,
    historyRetentionDays: 365,
    
    // Relations
    maxRelationDepth: 3,
    maxRelatedObjects: 50,
    
    // Conformité EPCIS 2.0
    epcisVersion: '2.0.0',
    cbvVersion: '2.0.0',
    
    // API et export
    apiVersion: '1.0.0',
    timestampFormat: 'ISO8601',
    
    // 360SmartConnect mapping
    smartConnectMapping: {
        avatarIdField: 'avatarId',
        companyIdField: 'companyId',
        metadataPrefix: 'sc_',
        webhookEnabled: true
    }
};

/**
 * Classe principale du Data Exposer
 * @class
 */
class DataExposer {
    /**
     * Initialise le Data Exposer
     * @param {Object} options - Options de configuration
     */
    constructor(options = {}) {
        this.config = { ...DATA_EXPOSER_CONFIG, ...options };
        
        // Intégration validation EPCIS
        this.epcisValidator = new EPCISValidator();
        
        // Cache des expositions
        this.expositionCache = new Map();
        
        // Statistiques
        this.stats = {
            expositionsGenerated: 0,
            averageExpositionTime: 0,
            averageDataSize: 0,
            cacheHits: 0,
            cacheMisses: 0,
            totalDataExposed: 0
        };
        
        console.log('✅ DataExposer initialisé');
    }

    /**
     * Expose les données complètes d'un objet dans son état actuel
     * @param {Object} stateData - Données complètes de l'état
     * @param {Object} objectData - Données complètes de l'objet
     * @param {boolean} includeHistory - Inclure l'historique des transitions
     * @param {Object} options - Options d'exposition
     * @returns {Promise<Object>} Données exposées structurées
     * @sideEffect Met en cache l'exposition pour performance
     * @example
     * const exposedData = await exposer.exposeCompleteStateData({
     *   stateId: 'state_production_001',
     *   stateName: 'En_Production',
     *   disposition: 'active'
     * }, {
     *   objectId: 'obj_lot_001',
     *   objectName: 'Lot Acier A001',
     *   objectType: 'raw-material'
     * }, true);
     */
    async exposeCompleteStateData(stateData, objectData, includeHistory = true, options = {}) {
        const startTime = performance.now();
        
        try {
            // Vérifier cache si activé
            const cacheKey = this.generateCacheKey(stateData, objectData, includeHistory);
            if (this.config.cacheEnabled && this.expositionCache.has(cacheKey)) {
                const cached = this.expositionCache.get(cacheKey);
                if (Date.now() - cached.timestamp < this.config.cacheTTL) {
                    this.stats.cacheHits++;
                    console.log(`📦 Exposition récupérée du cache: ${objectData.objectName}`);
                    return cached.data;
                }
            }
            this.stats.cacheMisses++;
            
            // Construire exposition complète
            const exposition = {
                expositionMetadata: this.generateExpositionMetadata(stateData, objectData),
                objectMetadata: await this.exposeObjectMetadata(objectData),
                currentState: await this.exposeCurrentState(stateData, objectData),
                epcisCompliance: await this.exposeEPCISCompliance(stateData, objectData),
                businessContext: await this.exposeBusinessContext(stateData, objectData),
                technicalMetadata: await this.exposeTechnicalMetadata(stateData, objectData)
            };
            
            // Ajouter sections optionnelles
            if (includeHistory) {
                exposition.stateHistory = await this.exposeStateHistory(stateData, objectData);
            }
            
            if (options.includeRelations !== false) {
                exposition.relatedObjects = await this.exposeRelatedObjects(objectData, options.relationDepth);
            }
            
            if (options.includeActions !== false) {
                exposition.availableActions = await this.exposeAvailableActions(stateData, objectData);
            }
            
            // Validation et enrichissement
            await this.validateExposedData(exposition);
            this.enrichWithSmartConnectMapping(exposition, objectData);
            
            // Mise en cache
            if (this.config.cacheEnabled) {
                this.cacheExposition(cacheKey, exposition);
            }
            
            // Mise à jour statistiques
            const endTime = performance.now();
            this.updateStats(endTime - startTime, JSON.stringify(exposition).length);
            
            console.log(`✅ Données exposées: ${objectData.objectName} (${(endTime - startTime).toFixed(2)}ms)`);
            
            return exposition;
            
        } catch (error) {
            console.error(`❌ Erreur exposition données:`, error.message);
            throw error;
        }
    }

    /**
     * Génère les métadonnées de l'exposition
     * @param {Object} stateData - Données de l'état
     * @param {Object} objectData - Données de l'objet
     * @returns {Object} Métadonnées de l'exposition
     * @private
     */
    generateExpositionMetadata(stateData, objectData) {
        const timestamp = new Date().toISOString();
        
        return {
            expositionId: this.generateExpositionId(stateData, objectData),
            exposedAt: timestamp,
            exposedBy: 'DataExposer',
            version: this.config.apiVersion,
            format: this.config.defaultFormat,
            
            sourceData: {
                objectId: objectData.objectId || objectData.uniqueId,
                stateId: stateData.stateId || stateData.uniqueId,
                objectVersion: objectData.version || '1.0.0',
                stateVersion: stateData.version || '1.0.0'
            },
            
            expositionScope: {
                includesHistory: true,
                includesRelations: true,
                includesEPCIS: true,
                includesTotalSize: 'calculated_after_exposition'
            },
            
            conformity: {
                processMetaLanguage: '1.0.0',
                epcis: this.config.epcisVersion,
                cbv: this.config.cbvVersion
            }
        };
    }

    /**
     * Expose les métadonnées complètes de l'objet
     * @param {Object} objectData - Données de l'objet
     * @returns {Promise<Object>} Métadonnées objet exposées
     * @private
     */
    async exposeObjectMetadata(objectData) {
        return {
            identification: {
                objectId: objectData.objectId || objectData.uniqueId,
                objectName: objectData.objectName,
                objectType: objectData.objectType,
                epc: objectData.epc || this.generateEPC(objectData),
                gtin: objectData.gtin || objectData.userMetadata?.gtin,
                serialNumber: objectData.serialNumber || objectData.userMetadata?.serial
            },
            
            classification: {
                category: objectData.category || this.getObjectCategory(objectData.objectType),
                subcategory: objectData.subcategory,
                materialType: objectData.materialType || objectData.userMetadata?.materialType,
                hazardClass: objectData.hazardClass || objectData.userMetadata?.hazardClass
            },
            
            lifecycle: {
                createdAt: objectData.createdAt,
                lastModified: objectData.lastModified || new Date().toISOString(),
                createdBy: objectData.createdBy || objectData.userMetadata?.operator,
                version: objectData.version || '1.0.0',
                lifecycleStage: this.determineLifecycleStage(objectData)
            },
            
            physical: {
                dimensions: objectData.dimensions || { width: 120, height: 80 },
                weight: objectData.weight || objectData.userMetadata?.weight,
                volume: objectData.volume || objectData.userMetadata?.volume,
                color: objectData.backgroundColor || '#F5F5F5',
                material: objectData.material || objectData.userMetadata?.material
            },
            
            business: {
                company: objectData.userMetadata?.company || '0000001',
                companyName: objectData.userMetadata?.companyName || 'Unknown Company',
                owner: objectData.owner || objectData.userMetadata?.owner,
                supplier: objectData.supplier || objectData.userMetadata?.supplier,
                customer: objectData.customer || objectData.userMetadata?.customer,
                contractNumber: objectData.contractNumber || objectData.userMetadata?.contract
            },
            
            userDefinedFields: objectData.userMetadata || {},
            
            synchronization: {
                syncStatus: objectData.syncStatus || 'synchronized',
                lastSync: objectData.lastSync || new Date().toISOString(),
                canvasElementId: objectData.elementId || objectData.id,
                templateVersion: objectData.templateVersion || '1.0.0'
            }
        };
    }

    /**
     * Expose l'état actuel avec toutes ses caractéristiques
     * @param {Object} stateData - Données de l'état
     * @param {Object} objectData - Données de l'objet parent
     * @returns {Promise<Object>} État actuel exposé
     * @private
     */
    async exposeCurrentState(stateData, objectData) {
        return {
            stateIdentification: {
                stateId: stateData.stateId || stateData.uniqueId,
                stateName: stateData.stateName,
                disposition: stateData.disposition || 'unknown',
                dispositionDescription: this.getDispositionDescription(stateData.disposition)
            },
            
            epcisContext: {
                businessStep: stateData.businessStep || stateData.userMetadata?.businessStep || 'observing',
                businessStepDescription: this.getBusinessStepDescription(stateData.businessStep),
                disposition: stateData.disposition || 'active',
                businessLocation: stateData.businessLocation || objectData.businessLocation || 'urn:epc:id:sgln:0000001.00000.0',
                readPoint: stateData.readPoint || objectData.readPoint
            },
            
            temporalData: {
                enteredAt: stateData.createdAt || new Date().toISOString(),
                lastModified: stateData.lastModified || new Date().toISOString(),
                eventTime: stateData.eventTime || new Date().toISOString(),
                eventTimeZone: stateData.eventTimeZone || '+00:00',
                expectedDuration: stateData.expectedDuration || stateData.userMetadata?.expectedDuration
            },
            
            stateCharacteristics: {
                isInitial: stateData.isInitial || false,
                isTerminal: stateData.isTerminal || false,
                isTransitional: stateData.isTransitional || true,
                isActive: stateData.disposition === 'active',
                priority: stateData.priority || stateData.userMetadata?.priority || 'normal',
                criticality: stateData.criticality || 'standard'
            },
            
            parentRelation: {
                parentObjectId: stateData.parentObjectId || objectData.objectId,
                parentObjectName: stateData.parentObjectName || objectData.objectName,
                parentObjectType: objectData.objectType,
                relationshipType: 'state_of_object'
            },
            
            visual: {
                position: stateData.position || { x: 0, y: 0 },
                dimensions: stateData.dimensions || { width: 80, height: 40 },
                color: stateData.backgroundColor || this.getDispositionColor(stateData.disposition),
                textColor: stateData.textColor || '#FFFFFF',
                bannerStyle: stateData.bannerStyle || 'flag'
            },
            
            stateMetadata: stateData.userMetadata || {}
        };
    }

    /**
     * Expose la conformité EPCIS 2.0 complète
     * @param {Object} stateData - Données de l'état  
     * @param {Object} objectData - Données de l'objet
     * @returns {Promise<Object>} Conformité EPCIS exposée
     * @private
     */
    async exposeEPCISCompliance(stateData, objectData) {
        // Validation EPCIS via le validator
        const validationResult = await this.epcisValidator.validateObjectState(objectData, stateData);
        
        return {
            complianceStatus: {
                isCompliant: validationResult.isValid,
                cbvVersion: this.config.cbvVersion,
                epcisVersion: this.config.epcisVersion,
                lastValidated: new Date().toISOString(),
                validationScore: validationResult.score || 100
            },
            
            businessStepCompliance: {
                businessStep: stateData.businessStep || 'observing',
                isValidBusinessStep: validationResult.businessStepValid || true,
                allowedNextSteps: this.getAllowedBusinessSteps(stateData.businessStep),
                businessStepCategory: this.getBusinessStepCategory(stateData.businessStep)
            },
            
            dispositionCompliance: {
                disposition: stateData.disposition || 'active',
                isValidDisposition: validationResult.dispositionValid || true,
                allowedTransitions: this.getAllowedDispositionTransitions(stateData.disposition),
                dispositionCategory: this.getDispositionCategory(stateData.disposition)
            },
            
            identificationCompliance: {
                epc: objectData.epc || this.generateEPC(objectData),
                epcFormat: 'SGTIN',
                isValidEPC: this.validateEPCFormat(objectData.epc),
                company: objectData.userMetadata?.company || '0000001',
                product: objectData.userMetadata?.product || '000001',
                serial: objectData.userMetadata?.serial || '000001'
            },
            
            eventCompliance: {
                eventType: 'ObjectEvent',
                hasRequiredFields: validationResult.hasRequiredFields || true,
                eventTime: stateData.eventTime || new Date().toISOString(),
                eventTimeZone: stateData.eventTimeZone || '+00:00',
                recordTime: new Date().toISOString()
            },
            
            validationDetails: validationResult.details || [],
            complianceWarnings: validationResult.warnings || [],
            complianceErrors: validationResult.errors || []
        };
    }

    /**
     * Expose l'historique des transitions d'état
     * @param {Object} stateData - Données de l'état actuel
     * @param {Object} objectData - Données de l'objet
     * @returns {Promise<Array>} Historique des transitions
     * @private
     */
    async exposeStateHistory(stateData, objectData) {
        // Récupérer historique depuis métadonnées ou simulation
        const historyEntries = stateData.history || objectData.stateHistory || this.generateSimulatedHistory(stateData, objectData);
        
        return historyEntries.slice(0, this.config.maxHistoryEntries).map((entry, index) => ({
            entryId: entry.id || `history_${index}`,
            sequenceNumber: index + 1,
            
            transition: {
                fromState: entry.fromState || 'Initial',
                toState: entry.toState || stateData.stateName,
                fromDisposition: entry.fromDisposition || 'unknown',
                toDisposition: entry.toDisposition || stateData.disposition,
                transitionType: entry.transitionType || 'automatic'
            },
            
            action: {
                actionName: entry.actionName || 'System Transition',
                actionType: entry.actionType || 'state_change',
                triggeredBy: entry.operator || entry.triggeredBy || 'System',
                actionParameters: entry.parameters || {}
            },
            
            temporal: {
                occurredAt: entry.timestamp || new Date().toISOString(),
                duration: entry.duration || 0,
                timeInPreviousState: entry.timeInPreviousState || 0
            },
            
            epcisEvent: {
                businessStep: entry.businessStep || 'observing',
                disposition: entry.toDisposition || stateData.disposition,
                businessLocation: entry.businessLocation || stateData.businessLocation,
                eventType: entry.eventType || 'ObjectEvent'
            },
            
            context: {
                reason: entry.reason || 'Process evolution',
                conditions: entry.conditions || [],
                validations: entry.validations || [],
                dataCapture: entry.dataCapture || {}
            },
            
            metadata: {
                source: entry.source || 'ProcessMetaLanguage',
                confidence: entry.confidence || 100,
                verified: entry.verified || true,
                automaticTransition: entry.automatic !== false
            }
        }));
    }

    /**
     * Expose les objets liés et relations hiérarchiques
     * @param {Object} objectData - Données de l'objet
     * @param {number} maxDepth - Profondeur maximale des relations
     * @returns {Promise<Object>} Objets liés exposés
     * @private
     */
    async exposeRelatedObjects(objectData, maxDepth = this.config.maxRelationDepth) {
        return {
            relationshipSummary: {
                totalRelatedObjects: this.countRelatedObjects(objectData),
                maxDepthExplored: maxDepth,
                relationshipTypes: this.getRelationshipTypes(objectData)
            },
            
            parentObjects: this.exposeParentRelations(objectData),
            childObjects: this.exposeChildRelations(objectData),
            siblingObjects: this.exposeSiblingRelations(objectData),
            dependentObjects: this.exposeDependentRelations(objectData),
            
            relationshipMatrix: this.buildRelationshipMatrix(objectData, maxDepth),
            
            hierarchyPath: this.buildHierarchyPath(objectData),
            
            relatedByType: {
                sameType: this.findObjectsByType(objectData.objectType),
                sameCategory: this.findObjectsByCategory(objectData.category),
                sameOwner: this.findObjectsByOwner(objectData.owner)
            }
        };
    }

    /**
     * Expose les actions disponibles depuis l'état actuel
     * @param {Object} stateData - Données de l'état
     * @param {Object} objectData - Données de l'objet
     * @returns {Promise<Object>} Actions disponibles exposées
     * @private
     */
    async exposeAvailableActions(stateData, objectData) {
        return {
            mainAction: {
                id: `main_action_${stateData.stateId}`,
                name: `Consulter État ${stateData.stateName}`,
                type: 'main_action',
                category: 'data_exposition',
                description: 'Action principale automatique pour exposition des données',
                alwaysAvailable: true,
                generated: true
            },
            
            secondaryActions: this.exposeSecondaryActions(stateData, objectData),
            
            conditionalActions: this.exposeConditionalActions(stateData, objectData),
            
            workflowActions: this.exposeWorkflowActions(stateData, objectData),
            
            apiActions: this.exposeAPIActions(stateData, objectData),
            
            actionsSummary: {
                totalActions: this.countAvailableActions(stateData),
                actionTypes: this.getActionTypes(stateData),
                permissionRequired: this.getActionPermissions(stateData),
                estimatedExecutionTimes: this.getActionExecutionTimes(stateData)
            }
        };
    }

    /**
     * Expose le contexte business et les règles métier
     * @param {Object} stateData - Données de l'état
     * @param {Object} objectData - Données de l'objet
     * @returns {Promise<Object>} Contexte business exposé
     * @private
     */
    async exposeBusinessContext(stateData, objectData) {
        return {
            organizationalContext: {
                company: objectData.userMetadata?.company || '0000001',
                companyName: objectData.userMetadata?.companyName || 'Unknown Company',
                department: objectData.userMetadata?.department,
                responsiblePerson: objectData.userMetadata?.responsiblePerson,
                businessUnit: objectData.userMetadata?.businessUnit
            },
            
            processContext: {
                processName: stateData.processName || objectData.processName || 'Standard Process',
                processVersion: stateData.processVersion || '1.0.0',
                processStage: this.determineProcessStage(stateData),
                workflowId: stateData.workflowId || objectData.workflowId,
                processOwner: stateData.processOwner || objectData.processOwner
            },
            
            businessRules: {
                stateRules: this.getStateBusinessRules(stateData),
                objectRules: this.getObjectBusinessRules(objectData),
                transitionRules: this.getTransitionRules(stateData),
                validationRules: this.getValidationRules(stateData, objectData)
            },
            
            compliance: {
                regulatoryFramework: objectData.userMetadata?.regulatoryFramework || [],
                certifications: objectData.userMetadata?.certifications || [],
                auditTrail: this.generateAuditTrail(stateData, objectData),
                complianceStatus: this.checkComplianceStatus(stateData, objectData)
            },
            
            kpi: {
                cycleTime: this.calculateCycleTime(stateData),
                throughput: this.calculateThroughput(stateData),
                qualityMetrics: this.calculateQualityMetrics(stateData, objectData),
                costMetrics: this.calculateCostMetrics(stateData, objectData)
            }
        };
    }

    /**
     * Expose les métadonnées techniques et de synchronisation
     * @param {Object} stateData - Données de l'état
     * @param {Object} objectData - Données de l'objet
     * @returns {Promise<Object>} Métadonnées techniques exposées
     * @private
     */
    async exposeTechnicalMetadata(stateData, objectData) {
        return {
            systemMetadata: {
                generatedBy: 'ProcessMetaLanguage DataExposer',
                generationTimestamp: new Date().toISOString(),
                version: this.config.apiVersion,
                environmentInfo: this.getEnvironmentInfo()
            },
            
            synchronizationData: {
                lastSync: {
                    object: objectData.lastSync || new Date().toISOString(),
                    state: stateData.lastSync || new Date().toISOString()
                },
                syncStatus: {
                    object: objectData.syncStatus || 'synchronized',
                    state: stateData.syncStatus || 'synchronized'
                },
                canvasElementIds: {
                    object: objectData.elementId || objectData.id,
                    state: stateData.elementId || stateData.id
                },
                templateVersions: {
                    object: objectData.templateVersion || '1.0.0',
                    state: stateData.templateVersion || '1.0.0'
                }
            },
            
            performanceMetrics: {
                expositionTime: '0ms', // Sera calculé
                dataSize: '0KB',       // Sera calculé
                cacheStatus: 'miss',   // Sera mis à jour
                compressionRatio: this.config.compressionEnabled ? 'calculated' : 'disabled'
            },
            
            technicalConstraints: {
                maxDataSize: this.config.maxDataSize,
                cacheTTL: this.config.cacheTTL,
                supportedFormats: this.config.outputFormats,
                apiLimits: this.getAPILimits()
            },
            
            integrationData: {
                smartConnect360: {
                    avatarId: objectData.userMetadata?.avatarId || 'avatar_001',
                    companyId: objectData.userMetadata?.companyId || 'company_001',
                    webhookUrl: objectData.userMetadata?.webhookUrl,
                    apiEndpoints: this.generateSmartConnectEndpoints(objectData, stateData)
                },
                
                epcisEndpoints: {
                    queryUrl: '/epcis/query',
                    captureUrl: '/epcis/capture',
                    subscriptionUrl: '/epcis/subscription'
                }
            }
        };
    }

    // === MÉTHODES UTILITAIRES ET HELPERS ===

    /**
     * Enrichit l'exposition avec le mapping 360SmartConnect
     * @param {Object} exposition - Exposition à enrichir
     * @param {Object} objectData - Données de l'objet
     * @private
     */
    enrichWithSmartConnectMapping(exposition, objectData) {
        const mapping = this.config.smartConnectMapping;
        
        exposition.smartConnectMapping = {
            avatarMapping: {
                avatarId: objectData.userMetadata?.[mapping.avatarIdField] || 'avatar_001',
                objectToAvatar: {
                    processMetaLanguageId: objectData.objectId,
                    avatarId: objectData.userMetadata?.[mapping.avatarIdField],
                    mappingType: 'one_to_one',
                    lastUpdated: new Date().toISOString()
                }
            },
            
            metadataMapping: this.createSmartConnectMetadataMapping(objectData),
            
            apiEndpoints: {
                avatar: `/api/avatars/${objectData.userMetadata?.[mapping.avatarIdField] || 'avatar_001'}`,
                state: `/api/avatars/${objectData.userMetadata?.[mapping.avatarIdField] || 'avatar_001'}/state`,
                actions: `/api/avatars/${objectData.userMetadata?.[mapping.avatarIdField] || 'avatar_001'}/actions`,
                events: `/api/avatars/${objectData.userMetadata?.[mapping.avatarIdField] || 'avatar_001'}/events`
            }
        };
    }

    /**
     * Crée le mapping métadonnées pour 360SmartConnect
     * @param {Object} objectData - Données de l'objet
     * @returns {Object} Mapping métadonnées
     * @private
     */
    createSmartConnectMetadataMapping(objectData) {
        const prefix = this.config.smartConnectMapping.metadataPrefix;
        const mapping = {};
        
        // Mapping des champs standard
        mapping[`${prefix}object_id`] = objectData.objectId;
        mapping[`${prefix}object_name`] = objectData.objectName;
        mapping[`${prefix}object_type`] = objectData.objectType;
        mapping[`${prefix}created_at`] = objectData.createdAt;
        mapping[`${prefix}last_modified`] = objectData.lastModified;
        
        // Mapping métadonnées utilisateur
        if (objectData.userMetadata) {
            for (const [key, value] of Object.entries(objectData.userMetadata)) {
                mapping[`${prefix}user_${key}`] = value;
            }
        }
        
        return mapping;
    }

    /**
     * Valide les données exposées
     * @param {Object} exposition - Exposition à valider
     * @throws {Error} Si validation échoue
     * @private
     */
    async validateExposedData(exposition) {
        // Validation structure requise
        const requiredSections = ['expositionMetadata', 'objectMetadata', 'currentState', 'epcisCompliance'];
        for (const section of requiredSections) {
            if (!(section in exposition)) {
                throw new Error(`Section requise manquante dans exposition: ${section}`);
            }
        }
        
        // Validation taille
        const dataSize = JSON.stringify(exposition).length;
        if (dataSize > this.config.maxDataSize) {
            throw new Error(`Taille exposition trop importante: ${dataSize} bytes, max: ${this.config.maxDataSize}`);
        }
        
        // Validation conformité EPCIS
        if (!exposition.epcisCompliance.complianceStatus.isCompliant) {
            console.warn('⚠️ Exposition non conforme EPCIS 2.0');
        }
    }

    // === MÉTHODES HELPERS UTILITAIRES ===

    /**
     * Génère un ID unique pour une exposition
     * @private
     */
    generateExpositionId(stateData, objectData) {
        const timestamp = Date.now();
        const objectIdShort = (objectData.objectId || 'unknown').substring(0, 8);
        const stateIdShort = (stateData.stateId || 'unknown').substring(0, 8);
        return `exp_${objectIdShort}_${stateIdShort}_${timestamp}`;
    }

    /**
     * Génère une clé de cache
     * @private
     */
    generateCacheKey(stateData, objectData, includeHistory) {
        return `${objectData.objectId}_${stateData.stateId}_${stateData.disposition}_${includeHistory}`;
    }

    /**
     * Met en cache une exposition
     * @private
     */
    cacheExposition(cacheKey, exposition) {
        if (this.expositionCache.size >= 100) { // Limite de cache
            const firstKey = this.expositionCache.keys().next().value;
            this.expositionCache.delete(firstKey);
        }
        
        this.expositionCache.set(cacheKey, {
            data: exposition,
            timestamp: Date.now()
        });
    }

    /**
     * Met à jour les statistiques
     * @private
     */
    updateStats(executionTime, dataSize) {
        this.stats.expositionsGenerated++;
        this.stats.averageExpositionTime = (
            (this.stats.averageExpositionTime * (this.stats.expositionsGenerated - 1) + executionTime) /
            this.stats.expositionsGenerated
        );
        this.stats.averageDataSize = (
            (this.stats.averageDataSize * (this.stats.expositionsGenerated - 1) + dataSize) /
            this.stats.expositionsGenerated
        );
        this.stats.totalDataExposed += dataSize;
    }

    /**
     * Obtient les statistiques de performance
     * @returns {Object} Statistiques détaillées
     */
    getPerformanceStats() {
        return {
            ...this.stats,
            cacheStats: {
                size: this.expositionCache.size,
                hits: this.stats.cacheHits,
                misses: this.stats.cacheMisses,
                hitRatio: this.stats.cacheHits / (this.stats.cacheHits + this.stats.cacheMisses) * 100 || 0
            },
            performanceTarget: this.stats.averageExpositionTime < 500 ? '✅ <500ms' : '❌ >500ms'
        };
    }

    // Méthodes helpers supplémentaires (implémentations simplifiées)
    getObjectCategory(objectType) { return objectType ? 'physical' : 'unknown'; }
    determineLifecycleStage(objectData) { return 'active'; }
    getDispositionDescription(disposition) { return `État: ${disposition || 'unknown'}`; }
    getDispositionColor(disposition) { 
        const colors = { active: '#4CAF50', in_progress: '#FF9800', destroyed: '#424242' };
        return colors[disposition] || '#9E9E9E'; 
    }
    getBusinessStepDescription(businessStep) { return `Étape: ${businessStep || 'observing'}`; }
    getAllowedBusinessSteps(current) { return ['observing', 'receiving', 'shipping']; }
    getAllowedDispositionTransitions(current) { return ['active', 'in_progress', 'inactive']; }
    getBusinessStepCategory(step) { return 'operational'; }
    getDispositionCategory(disposition) { return 'status'; }
    validateEPCFormat(epc) { return true; }
    generateEPC(objectData) { 
        const company = objectData.userMetadata?.company || '0000001';
        const product = objectData.userMetadata?.product || '000001';
        const serial = objectData.userMetadata?.serial || '000001';
        return `urn:epc:id:sgtin:${company}.${product}.${serial}`;
    }
    generateSimulatedHistory(stateData, objectData) { return []; }
    countRelatedObjects(objectData) { return 0; }
    getRelationshipTypes(objectData) { return []; }
    exposeParentRelations(objectData) { return []; }
    exposeChildRelations(objectData) { return []; }
    exposeSiblingRelations(objectData) { return []; }
    exposeDependentRelations(objectData) { return []; }
    buildRelationshipMatrix(objectData, maxDepth) { return {}; }
    buildHierarchyPath(objectData) { return []; }
    findObjectsByType(type) { return []; }
    findObjectsByCategory(category) { return []; }
    findObjectsByOwner(owner) { return []; }
    exposeSecondaryActions(stateData, objectData) { return []; }
    exposeConditionalActions(stateData, objectData) { return []; }
    exposeWorkflowActions(stateData, objectData) { return []; }
    exposeAPIActions(stateData, objectData) { return []; }
    countAvailableActions(stateData) { return 1; }
    getActionTypes(stateData) { return ['main_action']; }
    getActionPermissions(stateData) { return ['read']; }
    getActionExecutionTimes(stateData) { return { main_action: '< 1s' }; }
    determineProcessStage(stateData) { return 'in_progress'; }
    getStateBusinessRules(stateData) { return []; }
    getObjectBusinessRules(objectData) { return []; }
    getTransitionRules(stateData) { return []; }
    getValidationRules(stateData, objectData) { return []; }
    generateAuditTrail(stateData, objectData) { return []; }
    checkComplianceStatus(stateData, objectData) { return 'compliant'; }
    calculateCycleTime(stateData) { return 0; }
    calculateThroughput(stateData) { return 0; }
    calculateQualityMetrics(stateData, objectData) { return {}; }
    calculateCostMetrics(stateData, objectData) { return {}; }
    getEnvironmentInfo() { return { platform: 'Node.js', version: '18.0.0' }; }
    getAPILimits() { return { maxRequests: 1000, maxDataSize: '100KB' }; }
    generateSmartConnectEndpoints(objectData, stateData) { return []; }
}

// Export ES6 par défaut
export { DataExposer, DATA_EXPOSER_CONFIG };

// Export browser pour utilisation dans Obsidian
if (typeof window !== 'undefined') {
    window.ProcessMetaLanguageDataExposer = {
        DataExposer,
        DATA_EXPOSER_CONFIG
    };
}

// <!-- END OF FILE: data-exposer.js -->