// <!-- START OF FILE: secondary-actions.js -->
// FILENAME: secondary-actions.js
// Version: 1.0.0
// Date: 2025-07-30 17:00
// Author: Rolland MELET & Claude Code
// Description: Gestionnaire actions secondaires ProcessMetaLanguage - TASK-B007 Phase 3

/**
 * Gestionnaire des actions secondaires pour l'architecture État-Actions Deux Niveaux
 * Gère les actions optionnelles, capture de données et préparation des transitions
 * @module SecondaryActions
 * @requires TemplateProcessor
 * @requires EPCISValidator
 * @requires DataExposer
 */

import { TemplateProcessor } from './template-processor.js';
import { EPCISValidator } from './epcis-validator.js';
import { DataExposer } from './data-exposer.js';

/**
 * Gestionnaire principal des actions secondaires ProcessMetaLanguage
 * Implémente la logique d'actions optionnelles selon architecture État-Actions Deux Niveaux
 * 
 * @class SecondaryActionsManager
 * @example
 * // Créer gestionnaire actions secondaires
 * const secondaryManager = new SecondaryActionsManager();
 * await secondaryManager.initialize();
 * 
 * // Générer actions secondaires pour un état
 * const actions = await secondaryManager.generateSecondaryActions(stateData, {
 *   includeQualityActions: true,
 *   includeLogisticsActions: true,
 *   targetStates: ['active', 'in_progress']
 * });
 */
export class SecondaryActionsManager {
    /**
     * Initialise le gestionnaire d'actions secondaires
     * @param {Object} options - Options de configuration
     * @param {boolean} options.enableCaching - Activer le cache (défaut: true)
     * @param {number} options.cacheTTL - Durée de vie cache en ms (défaut: 300000)
     * @param {boolean} options.strictEPCISValidation - Validation EPCIS stricte (défaut: true)
     */
    constructor(options = {}) {
        this.config = {
            enableCaching: options.enableCaching !== false,
            cacheTTL: options.cacheTTL || 300000, // 5 minutes
            strictEPCISValidation: options.strictEPCISValidation !== false,
            maxSecondaryActions: options.maxSecondaryActions || 10,
            defaultTimeout: options.defaultTimeout || 5000
        };

        // Cache pour optimiser les performances
        this.cache = new Map();
        this.cacheTimestamps = new Map();

        // Modules de dépendance
        this.templateProcessor = null;
        this.epcisValidator = null;
        this.dataExposer = null;

        // Registre des types d'actions secondaires EPCIS 2.0
        this.actionTypes = {
            quality: {
                name: 'Quality Control',
                description: 'Actions de contrôle qualité',
                businessSteps: ['inspecting', 'testing', 'sampling'],
                targetDispositions: ['active', 'damaged', 'recalled'],
                requiredFields: ['quality_criteria', 'inspector_id'],
                color: '#ff6b6b'
            },
            logistics: {
                name: 'Logistics Operations',
                description: 'Actions logistiques et transport',
                businessSteps: ['loading', 'unloading', 'transporting', 'storing'],
                targetDispositions: ['in_transit', 'active', 'stored'],
                requiredFields: ['location', 'carrier_id'],
                color: '#4ecdc4'
            },
            transformation: {
                name: 'Transformation Process',
                description: 'Actions de transformation et production',
                businessSteps: ['transforming', 'assembling', 'disassembling'],
                targetDispositions: ['in_progress', 'active', 'completed'],
                requiredFields: ['process_parameters', 'operator_id'],
                color: '#45b7d1'
            },
            documentation: {
                name: 'Documentation & Tracking',
                description: 'Actions de documentation et traçabilité',
                businessSteps: ['observing', 'recording', 'labeling'],
                targetDispositions: ['active', 'documented'],
                requiredFields: ['document_type', 'reference_number'],
                color: '#96ceb4'
            },
            compliance: {
                name: 'Compliance & Regulatory',
                description: 'Actions de conformité réglementaire',
                businessSteps: ['certifying', 'validating', 'approving'],
                targetDispositions: ['certified', 'validated', 'approved'],
                requiredFields: ['regulation_reference', 'authority_id'],
                color: '#feca57'
            }
        };

        // Patterns de transition EPCIS 2.0
        this.transitionPatterns = {
            // Réception → Contrôle
            'receiving_to_inspection': {
                fromBusinessStep: 'receiving',
                fromDisposition: 'in_transit',
                toBusinessStep: 'inspecting',
                toDisposition: 'in_progress',
                actionType: 'quality',
                requiredData: ['reception_date', 'batch_number']
            },
            // Contrôle → Stockage
            'inspection_to_storage': {
                fromBusinessStep: 'inspecting',
                fromDisposition: 'in_progress',
                toBusinessStep: 'storing',
                toDisposition: 'active',
                actionType: 'logistics',
                requiredData: ['quality_status', 'storage_location']
            },
            // Stockage → Expédition
            'storage_to_shipping': {
                fromBusinessStep: 'storing',
                fromDisposition: 'active',
                toBusinessStep: 'shipping',
                toDisposition: 'in_transit',
                actionType: 'logistics',
                requiredData: ['destination', 'carrier_info']
            },
            // Production → Assemblage
            'production_to_assembly': {
                fromBusinessStep: 'transforming',
                fromDisposition: 'in_progress',
                toBusinessStep: 'assembling',
                toDisposition: 'in_progress',
                actionType: 'transformation',
                requiredData: ['assembly_instructions', 'component_list']
            }
        };

        this.isInitialized = false;
    }

    /**
     * Initialise les modules de dépendance et valide la configuration
     * @returns {Promise<boolean>} Succès de l'initialisation
     * @sideEffect Initialise les modules TemplateProcessor, EPCISValidator, DataExposer
     * @example
     * const manager = new SecondaryActionsManager();
     * const initialized = await manager.initialize();
     * console.log('Manager initialized:', initialized);
     */
    async initialize() {
        try {
            console.log('Initialisation SecondaryActionsManager...');

            // Initialiser les modules de dépendance
            this.templateProcessor = new TemplateProcessor();
            this.epcisValidator = new EPCISValidator();
            this.dataExposer = new DataExposer();

            // Note: Ces modules n'ont pas de méthode initialize, ils sont prêts à l'utilisation

            // Valider la configuration
            await this._validateConfiguration();

            this.isInitialized = true;
            console.log('✅ SecondaryActionsManager initialisé avec succès');
            
            return true;
        } catch (error) {
            console.error('❌ Erreur initialisation SecondaryActionsManager:', error);
            throw new Error(`Échec initialisation SecondaryActionsManager: ${error.message}`);
        }
    }

    /**
     * Génère les actions secondaires disponibles pour un état donné
     * @param {Object} stateData - Données de l'état
     * @param {string} stateData.stateName - Nom de l'état
     * @param {string} stateData.businessStep - Business step EPCIS actuel
     * @param {string} stateData.disposition - Disposition EPCIS actuelle
     * @param {Object} stateData.metadata - Métadonnées de l'état
     * @param {Object} options - Options de génération
     * @param {string[]} options.actionTypes - Types d'actions à inclure
     * @param {string[]} options.targetStates - États cibles autorisés
     * @param {boolean} options.includeCustomActions - Inclure actions personnalisées
     * @param {Object} options.customConstraints - Contraintes personnalisées
     * @returns {Promise<Object>} Actions secondaires générées avec métadonnées
     * @sideEffect Peut mettre en cache les résultats si cache activé
     * @performance Target <200ms pour génération actions d'un état
     * @example
     * // Générer actions pour état "contrôle qualité"
     * const actions = await manager.generateSecondaryActions({
     *   stateName: 'quality_control',
     *   businessStep: 'inspecting',
     *   disposition: 'in_progress',
     *   metadata: { product_type: 'steel', batch: 'B001' }
     * }, {
     *   actionTypes: ['quality', 'logistics'],
     *   targetStates: ['active', 'damaged'],
     *   includeCustomActions: true
     * });
     */
    async generateSecondaryActions(stateData, options = {}) {
        const startTime = performance.now();
        
        try {
            // Validation des paramètres
            this._validateStateData(stateData);
            
            // Vérifier cache si activé
            const cacheKey = this._generateCacheKey('secondary_actions', stateData, options);
            if (this.config.enableCaching) {
                const cached = this._getFromCache(cacheKey);
                if (cached) {
                    return cached;
                }
            }

            console.log(`Génération actions secondaires pour état: ${stateData.stateName}`);

            // Analyser le contexte EPCIS de l'état
            const epcisContext = await this._analyzeEPCISContext(stateData);
            
            // Générer actions par type
            const availableActions = {};
            const requestedTypes = options.actionTypes || Object.keys(this.actionTypes);
            
            for (const actionType of requestedTypes) {
                if (this.actionTypes[actionType]) {
                    const typeActions = await this._generateActionsForType(
                        actionType, 
                        stateData, 
                        epcisContext, 
                        options
                    );
                    
                    if (typeActions.length > 0) {
                        availableActions[actionType] = typeActions;
                    }
                }
            }

            // Ajouter actions personnalisées si demandé
            if (options.includeCustomActions) {
                const customActions = await this._generateCustomActions(stateData, options);
                if (customActions.length > 0) {
                    availableActions.custom = customActions;
                }
            }

            // Calculer priorités et recommandations
            const prioritizedActions = await this._prioritizeActions(availableActions, epcisContext);

            // Générer transitions possibles
            const possibleTransitions = await this._generatePossibleTransitions(
                stateData, 
                prioritizedActions, 
                options.targetStates
            );

            const result = {
                stateId: stateData.stateName,
                currentBusinessStep: stateData.businessStep,
                currentDisposition: stateData.disposition,
                availableActions: prioritizedActions,
                possibleTransitions,
                actionMetadata: {
                    totalActions: this._countTotalActions(prioritizedActions),
                    recommendedActions: this._getRecommendedActions(prioritizedActions),
                    epcisCompliant: epcisContext.compliant,
                    generationTime: performance.now() - startTime
                },
                timestamp: new Date().toISOString()
            };

            // Mise en cache si activé
            if (this.config.enableCaching) {
                this._setCache(cacheKey, result);
            }

            console.log(`✅ Actions secondaires générées: ${result.actionMetadata.totalActions} actions`);
            return result;

        } catch (error) {
            console.error('❌ Erreur génération actions secondaires:', error);
            throw new Error(`Échec génération actions secondaires: ${error.message}`);
        }
    }

    /**
     * Exécute une action secondaire avec capture de données et préparation transition
     * @param {Object} actionData - Données de l'action à exécuter
     * @param {string} actionData.actionId - ID unique de l'action
     * @param {string} actionData.actionType - Type d'action (quality, logistics, etc.)
     * @param {string} actionData.targetState - État cible de la transition
     * @param {Object} actionData.inputData - Données saisies par l'utilisateur
     * @param {Object} stateData - Données de l'état source
     * @param {Object} options - Options d'exécution
     * @param {boolean} options.validateInputs - Valider les données d'entrée
     * @param {boolean} options.prepareTransition - Préparer la transition d'état
     * @param {boolean} options.generateDocumentation - Générer documentation
     * @returns {Promise<Object>} Résultat de l'exécution avec données capturées
     * @sideEffect Capture et stocke les données, prépare la transition d'état
     * @performance Target <500ms pour exécution d'une action
     * @example
     * // Exécuter action de contrôle qualité
     * const result = await manager.executeSecondaryAction({
     *   actionId: 'quality_inspect_001',
     *   actionType: 'quality',
     *   targetState: 'quality_approved',
     *   inputData: {
     *     quality_criteria: 'visual_inspection',
     *     inspector_id: 'QC001',
     *     inspection_result: 'passed',
     *     notes: 'Aucun défaut visible'
     *   }
     * }, stateData, {
     *   validateInputs: true,
     *   prepareTransition: true
     * });
     */
    async executeSecondaryAction(actionData, stateData, options = {}) {
        const startTime = performance.now();
        
        try {
            console.log(`Exécution action secondaire: ${actionData.actionId}`);

            // Validation des données d'action
            this._validateActionData(actionData);
            
            // Validation des données d'entrée si demandé
            if (options.validateInputs !== false) {
                await this._validateActionInputs(actionData);
            }

            // Vérifier compatibilité EPCIS 2.0
            const epcisValidation = await this._validateEPCISCompatibility(actionData, stateData);
            if (!epcisValidation.valid) {
                throw new Error(`Action non conforme EPCIS 2.0: ${epcisValidation.errors.join(', ')}`);
            }

            // Capturer et enrichir les données
            const enrichedData = await this._captureAndEnrichData(actionData, stateData);

            // Générer métadonnées d'exécution
            const executionMetadata = await this._generateExecutionMetadata(actionData, stateData, enrichedData);

            // Préparer transition si demandé
            let transitionData = null;
            if (options.prepareTransition !== false) {
                transitionData = await this._prepareStateTransition(actionData, stateData, enrichedData);
            }

            // Générer documentation si demandé
            let documentationData = null;
            if (options.generateDocumentation) {
                documentationData = await this._generateActionDocumentation(actionData, enrichedData);
            }

            const result = {
                actionId: actionData.actionId,
                actionType: actionData.actionType,
                executionStatus: 'completed',
                capturedData: enrichedData,
                executionMetadata,
                transitionData,
                documentationData,
                performance: {
                    executionTime: performance.now() - startTime,
                    timestamp: new Date().toISOString()
                },
                epcisCompliance: epcisValidation
            };

            console.log(`✅ Action secondaire exécutée avec succès: ${actionData.actionId}`);
            return result;

        } catch (error) {
            console.error(`❌ Erreur exécution action ${actionData.actionId}:`, error);
            throw new Error(`Échec exécution action secondaire: ${error.message}`);
        }
    }

    /**
     * Analyse les dépendances entre actions secondaires pour optimiser l'ordre d'exécution
     * @param {Object[]} actions - Liste des actions à analyser
     * @param {Object} stateData - Données de l'état actuel
     * @param {Object} options - Options d'analyse
     * @returns {Promise<Object>} Analyse des dépendances avec ordre recommandé
     * @sideEffect Aucun - analyse pure sans modification
     * @example
     * const dependencies = await manager.analyzeActionDependencies(actions, stateData);
     * console.log('Ordre recommandé:', dependencies.recommendedOrder);
     */
    async analyzeActionDependencies(actions, stateData, options = {}) {
        try {
            console.log(`Analyse dépendances pour ${actions.length} actions`);

            const dependencyGraph = new Map();
            const actionPriorities = new Map();

            // Construire graphe de dépendances
            for (let i = 0; i < actions.length; i++) {
                const action = actions[i];
                dependencyGraph.set(action.actionId, {
                    action,
                    dependencies: [],
                    dependents: [],
                    priority: this._calculateActionPriority(action, stateData)
                });
                actionPriorities.set(action.actionId, dependencyGraph.get(action.actionId).priority);
            }

            // Analyser dépendances logiques
            for (const [actionId, actionNode] of dependencyGraph) {
                const dependencies = await this._findActionDependencies(actionNode.action, actions);
                actionNode.dependencies = dependencies;

                // Mettre à jour les dépendants
                dependencies.forEach(depId => {
                    if (dependencyGraph.has(depId)) {
                        dependencyGraph.get(depId).dependents.push(actionId);
                    }
                });
            }

            // Générer ordre topologique recommandé
            const recommendedOrder = this._generateTopologicalOrder(dependencyGraph);

            // Identifier groupes parallèles
            const parallelGroups = this._identifyParallelGroups(dependencyGraph, recommendedOrder);

            // Calculer impact et risques
            const impactAnalysis = await this._analyzeActionImpacts(dependencyGraph, stateData);

            return {
                dependencyGraph: Object.fromEntries(dependencyGraph),
                recommendedOrder,
                parallelGroups,
                impactAnalysis,
                optimization: {
                    totalActions: actions.length,
                    parallelizableActions: parallelGroups.reduce((sum, group) => sum + group.length, 0),
                    estimatedExecutionTime: this._estimateExecutionTime(recommendedOrder, parallelGroups)
                }
            };

        } catch (error) {
            console.error('❌ Erreur analyse dépendances actions:', error);
            throw new Error(`Échec analyse dépendances: ${error.message}`);
        }
    }

    /**
     * Valide la configuration du gestionnaire
     * @private
     * @returns {Promise<void>}
     * @sideEffect Valide les paramètres de configuration
     */
    async _validateConfiguration() {
        // Valider les paramètres de configuration
        if (this.config.cacheTTL < 0) {
            throw new Error('cacheTTL doit être positif');
        }
        
        if (this.config.maxSecondaryActions < 1) {
            throw new Error('maxSecondaryActions doit être au moins 1');
        }

        // Valider les types d'actions
        for (const [type, config] of Object.entries(this.actionTypes)) {
            if (!config.businessSteps || !Array.isArray(config.businessSteps)) {
                throw new Error(`Type d'action ${type}: businessSteps invalide`);
            }
            if (!config.targetDispositions || !Array.isArray(config.targetDispositions)) {
                throw new Error(`Type d'action ${type}: targetDispositions invalide`);
            }
        }
    }

    /**
     * Valide les données d'état fournies
     * @private
     * @param {Object} stateData - Données à valider
     * @throws {Error} Si les données sont invalides
     */
    _validateStateData(stateData) {
        if (!stateData || typeof stateData !== 'object') {
            throw new Error('stateData doit être un objet');
        }

        const required = ['stateName', 'businessStep', 'disposition'];
        for (const field of required) {
            if (!stateData[field]) {
                throw new Error(`Champ requis manquant: ${field}`);
            }
        }

        if (typeof stateData.stateName !== 'string') {
            throw new Error('stateName doit être une chaîne de caractères');
        }
    }

    /**
     * Valide les données d'action
     * @private
     * @param {Object} actionData - Données d'action à valider
     * @throws {Error} Si les données sont invalides
     */
    _validateActionData(actionData) {
        const required = ['actionId', 'actionType', 'targetState'];
        for (const field of required) {
            if (!actionData[field]) {
                throw new Error(`Champ d'action requis manquant: ${field}`);
            }
        }

        if (!this.actionTypes[actionData.actionType]) {
            throw new Error(`Type d'action inconnu: ${actionData.actionType}`);
        }
    }

    /**
     * Analyse le contexte EPCIS d'un état
     * @private
     * @param {Object} stateData - Données de l'état
     * @returns {Promise<Object>} Contexte EPCIS analysé
     */
    async _analyzeEPCISContext(stateData) {
        try {
            const validation = await this.epcisValidator.validateBusinessStep(stateData.businessStep);
            const dispositionValidation = await this.epcisValidator.validateDisposition(stateData.disposition);

            return {
                compliant: validation.valid && dispositionValidation.valid,
                businessStepValid: validation.valid,
                dispositionValid: dispositionValidation.valid,
                compatibleBusinessSteps: validation.compatibleSteps || [],
                compatibleDispositions: dispositionValidation.compatibleDispositions || [],
                errors: [...(validation.errors || []), ...(dispositionValidation.errors || [])]
            };
        } catch (error) {
            return {
                compliant: false,
                businessStepValid: false,
                dispositionValid: false,
                compatibleBusinessSteps: [],
                compatibleDispositions: [],
                errors: [error.message]
            };
        }
    }

    /**
     * Génère les actions pour un type spécifique
     * @private
     * @param {string} actionType - Type d'action
     * @param {Object} stateData - Données de l'état
     * @param {Object} epcisContext - Contexte EPCIS
     * @param {Object} options - Options
     * @returns {Promise<Array>} Actions générées pour ce type
     */
    async _generateActionsForType(actionType, stateData, epcisContext, options) {
        const typeConfig = this.actionTypes[actionType];
        const actions = [];

        // Vérifier compatibilité avec l'état actuel
        const isCompatible = typeConfig.businessSteps.some(step => 
            epcisContext.compatibleBusinessSteps.includes(step)
        );

        if (!isCompatible) {
            return actions;
        }

        // Générer actions selon les business steps compatibles
        for (const businessStep of typeConfig.businessSteps) {
            if (epcisContext.compatibleBusinessSteps.includes(businessStep)) {
                for (const targetDisposition of typeConfig.targetDispositions) {
                    if (!options.targetStates || options.targetStates.includes(targetDisposition)) {
                        const action = await this._createAction(
                            actionType,
                            businessStep,
                            targetDisposition,
                            stateData,
                            typeConfig
                        );
                        actions.push(action);
                    }
                }
            }
        }

        return actions.slice(0, this.config.maxSecondaryActions);
    }

    /**
     * Crée une action secondaire spécifique
     * @private
     * @param {string} actionType - Type d'action
     * @param {string} businessStep - Business step cible
     * @param {string} targetDisposition - Disposition cible
     * @param {Object} stateData - Données de l'état source
     * @param {Object} typeConfig - Configuration du type d'action
     * @returns {Promise<Object>} Action créée
     */
    async _createAction(actionType, businessStep, targetDisposition, stateData, typeConfig) {
        const actionId = `${actionType}_${businessStep}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        return {
            actionId,
            actionType,
            name: `${typeConfig.name}: ${businessStep}`,
            description: `${typeConfig.description} - Transition vers ${targetDisposition}`,
            businessStep,
            targetDisposition,
            sourceState: stateData.stateName,
            sourceBusinessStep: stateData.businessStep,
            sourceDisposition: stateData.disposition,
            requiredFields: [...typeConfig.requiredFields],
            optionalFields: await this._generateOptionalFields(actionType, businessStep),
            estimatedDuration: this._estimateActionDuration(actionType, businessStep),
            priority: this._calculateActionPriority({ actionType, businessStep, targetDisposition }, stateData),
            color: typeConfig.color,
            epcisCompliant: true,
            metadata: {
                canExecuteInParallel: this._canExecuteInParallel(actionType),
                requiresApproval: this._requiresApproval(actionType, businessStep),
                automationPossible: this._isAutomationPossible(actionType, businessStep)
            }
        };
    }

    /**
     * Génère des actions personnalisées selon les contraintes
     * @private
     * @param {Object} stateData - Données de l'état
     * @param {Object} options - Options avec contraintes personnalisées
     * @returns {Promise<Array>} Actions personnalisées
     */
    async _generateCustomActions(stateData, options) {
        const customActions = [];
        
        if (options.customConstraints) {
            // Implémenter logique d'actions personnalisées selon les contraintes
            const constraints = options.customConstraints;
            
            if (constraints.allowCustomTransitions) {
                const customTransition = await this._createCustomTransitionAction(stateData, constraints);
                if (customTransition) {
                    customActions.push(customTransition);
                }
            }
        }

        return customActions;
    }

    /**
     * Priorise les actions selon leur importance et contexte
     * @private
     * @param {Object} availableActions - Actions disponibles par type
     * @param {Object} epcisContext - Contexte EPCIS
     * @returns {Promise<Object>} Actions priorisées
     */
    async _prioritizeActions(availableActions, epcisContext) {
        const prioritized = {};

        for (const [type, actions] of Object.entries(availableActions)) {
            prioritized[type] = actions.sort((a, b) => b.priority - a.priority);
        }

        return prioritized;
    }

    /**
     * Génère les transitions possibles selon les actions
     * @private
     * @param {Object} stateData - Données de l'état actuel
     * @param {Object} actions - Actions disponibles
     * @param {string[]} targetStates - États cibles autorisés
     * @returns {Promise<Array>} Transitions possibles
     */
    async _generatePossibleTransitions(stateData, actions, targetStates) {
        const transitions = [];

        for (const [type, typeActions] of Object.entries(actions)) {
            for (const action of typeActions) {
                if (!targetStates || targetStates.includes(action.targetDisposition)) {
                    const transition = {
                        transitionId: `transition_${action.actionId}`,
                        fromState: stateData.stateName,
                        toState: action.targetDisposition,
                        triggerAction: action.actionId,
                        actionType: action.actionType,
                        businessStepChange: `${stateData.businessStep} → ${action.businessStep}`,
                        dispositionChange: `${stateData.disposition} → ${action.targetDisposition}`,
                        estimatedDuration: action.estimatedDuration,
                        requiresData: action.requiredFields,
                        epcisCompliant: action.epcisCompliant
                    };
                    transitions.push(transition);
                }
            }
        }

        return transitions;
    }

    /**
     * Compte le nombre total d'actions
     * @private
     * @param {Object} actions - Actions par type
     * @returns {number} Nombre total d'actions
     */
    _countTotalActions(actions) {
        return Object.values(actions).reduce((total, typeActions) => total + typeActions.length, 0);
    }

    /**
     * Récupère les actions recommandées (priorité élevée)
     * @private
     * @param {Object} actions - Actions par type
     * @returns {Array} Actions recommandées
     */
    _getRecommendedActions(actions) {
        const recommended = [];
        
        for (const typeActions of Object.values(actions)) {
            const highPriority = typeActions.filter(action => action.priority > 0.7);
            recommended.push(...highPriority);
        }

        return recommended.sort((a, b) => b.priority - a.priority);
    }

    /**
     * Calcule la priorité d'une action
     * @private
     * @param {Object} action - Action à évaluer
     * @param {Object} stateData - Données de l'état
     * @returns {number} Priorité entre 0 et 1
     */
    _calculateActionPriority(action, stateData) {
        let priority = 0.5; // Base

        // Priorité selon le type d'action
        const typePriorities = {
            quality: 0.9,      // Qualité prioritaire
            compliance: 0.85,  // Conformité importante
            logistics: 0.7,    // Logistique standard
            transformation: 0.6, // Production
            documentation: 0.5  // Documentation
        };

        priority = typePriorities[action.actionType] || 0.5;

        // Ajuster selon l'urgence du business step
        const urgentSteps = ['inspecting', 'certifying', 'recalling'];
        if (urgentSteps.includes(action.businessStep)) {
            priority += 0.1;
        }

        return Math.min(1.0, priority);
    }

    /**
     * Estime la durée d'exécution d'une action
     * @private
     * @param {string} actionType - Type d'action
     * @param {string} businessStep - Business step
     * @returns {number} Durée estimée en minutes
     */
    _estimateActionDuration(actionType, businessStep) {
        const baseDurations = {
            quality: 30,        // 30 min pour contrôle qualité
            logistics: 15,      // 15 min pour opérations logistiques
            transformation: 60, // 1h pour transformation
            documentation: 10,  // 10 min pour documentation
            compliance: 45      // 45 min pour conformité
        };

        const stepMultipliers = {
            inspecting: 1.5,    // Inspection plus longue
            certifying: 2.0,    // Certification complexe
            transforming: 1.8,  // Transformation complexe
            recording: 0.5      // Documentation rapide
        };

        const baseDuration = baseDurations[actionType] || 20;
        const multiplier = stepMultipliers[businessStep] || 1.0;

        return Math.round(baseDuration * multiplier);
    }

    /**
     * Génère les champs optionnels pour une action
     * @private
     * @param {string} actionType - Type d'action
     * @param {string} businessStep - Business step
     * @returns {Promise<Array>} Champs optionnels
     */
    async _generateOptionalFields(actionType, businessStep) {
        const commonOptional = ['notes', 'attachments', 'reference_documents'];
        
        const typeSpecific = {
            quality: ['test_equipment', 'sampling_method', 'acceptance_criteria'],
            logistics: ['transport_conditions', 'handling_instructions', 'delivery_schedule'],
            transformation: ['process_variations', 'yield_expectations', 'quality_parameters'],
            documentation: ['document_format', 'distribution_list', 'retention_period'],
            compliance: ['audit_trail', 'witness_signatures', 'regulatory_references']
        };

        return [...commonOptional, ...(typeSpecific[actionType] || [])];
    }

    /**
     * Vérifie si une action peut s'exécuter en parallèle
     * @private
     * @param {string} actionType - Type d'action
     * @returns {boolean} Possibilité d'exécution parallèle
     */
    _canExecuteInParallel(actionType) {
        const parallelTypes = ['documentation', 'logistics'];
        return parallelTypes.includes(actionType);
    }

    /**
     * Vérifie si une action nécessite une approbation
     * @private
     * @param {string} actionType - Type d'action
     * @param {string} businessStep - Business step
     * @returns {boolean} Nécessité d'approbation
     */
    _requiresApproval(actionType, businessStep) {
        const approvalRequired = {
            quality: ['certifying', 'approving'],
            compliance: ['certifying', 'validating', 'approving'],
            transformation: ['transforming'] // Transformation majeure
        };

        return approvalRequired[actionType]?.includes(businessStep) || false;
    }

    /**
     * Vérifie si l'automation est possible pour une action
     * @private
     * @param {string} actionType - Type d'action
     * @param {string} businessStep - Business step
     * @returns {boolean} Possibilité d'automation
     */
    _isAutomationPossible(actionType, businessStep) {
        const automatable = {
            documentation: ['recording', 'labeling'],
            logistics: ['loading', 'unloading'], // Si systèmes automatisés
            quality: ['testing'] // Si équipements automatisés
        };

        return automatable[actionType]?.includes(businessStep) || false;
    }

    /**
     * Gestion du cache avec TTL
     * @private
     */
    _generateCacheKey(type, ...args) {
        return `${type}_${JSON.stringify(args)}`;
    }

    _getFromCache(key) {
        if (!this.cache.has(key)) return null;
        
        const timestamp = this.cacheTimestamps.get(key);
        if (Date.now() - timestamp > this.config.cacheTTL) {
            this.cache.delete(key);
            this.cacheTimestamps.delete(key);
            return null;
        }
        
        return this.cache.get(key);
    }

    _setCache(key, value) {
        this.cache.set(key, value);
        this.cacheTimestamps.set(key, Date.now());
    }

    /**
     * Méthodes pour l'analyse des dépendances (implémentation simplifiée)
     * @private
     */
    async _findActionDependencies(action, allActions) {
        // Logique simplifiée - à étendre selon les besoins
        return [];
    }

    _generateTopologicalOrder(dependencyGraph) {
        // Tri topologique simple
        const visited = new Set();
        const order = [];
        
        const visit = (nodeId) => {
            if (visited.has(nodeId)) return;
            visited.add(nodeId);
            
            const node = dependencyGraph.get(nodeId);
            if (node) {
                node.dependencies.forEach(depId => visit(depId));
                order.push(nodeId);
            }
        };
        
        for (const nodeId of dependencyGraph.keys()) {
            visit(nodeId);
        }
        
        return order;
    }

    _identifyParallelGroups(dependencyGraph, order) {
        // Identification simple des groupes parallèles
        return [order]; // Simplification - tous en séquence
    }

    async _analyzeActionImpacts(dependencyGraph, stateData) {
        return {
            highImpact: [],
            mediumImpact: [],
            lowImpact: []
        };
    }

    _estimateExecutionTime(order, parallelGroups) {
        return order.length * 20; // 20 min par action en moyenne
    }

    // Méthodes pour l'exécution d'actions (stubs pour maintenir l'interface)
    async _validateActionInputs(actionData) {
        // Validation des données d'entrée
        return true;
    }

    async _validateEPCISCompatibility(actionData, stateData) {
        return { valid: true, errors: [] };
    }

    async _captureAndEnrichData(actionData, stateData) {
        return {
            ...actionData.inputData,
            capturedAt: new Date().toISOString(),
            sourceState: stateData.stateName
        };
    }

    async _generateExecutionMetadata(actionData, stateData, enrichedData) {
        return {
            executionId: `exec_${actionData.actionId}_${Date.now()}`,
            executor: 'system',
            executionTime: new Date().toISOString()
        };
    }

    async _prepareStateTransition(actionData, stateData, enrichedData) {
        return {
            transitionId: `trans_${Date.now()}`,
            fromState: stateData.stateName,
            toState: actionData.targetState,
            transitionData: enrichedData
        };
    }

    async _generateActionDocumentation(actionData, enrichedData) {
        return {
            documentType: 'action_execution',
            content: `Action ${actionData.actionId} executed successfully`,
            data: enrichedData
        };
    }

    async _createCustomTransitionAction(stateData, constraints) {
        // Création d'action personnalisée selon contraintes
        return null; // Placeholder
    }
}

// Classe utilitaire pour la gestion des patterns de transition
export class TransitionPatternMatcher {
    constructor(patterns) {
        this.patterns = patterns;
    }

    findMatchingPattern(fromState, toState, actionType) {
        for (const [patternName, pattern] of Object.entries(this.patterns)) {
            if (pattern.fromBusinessStep === fromState.businessStep &&
                pattern.fromDisposition === fromState.disposition &&
                pattern.actionType === actionType) {
                return { patternName, pattern };
            }
        }
        return null;
    }
}

// Exportation par défaut
export default SecondaryActionsManager;

// <!-- END OF FILE: secondary-actions.js -->