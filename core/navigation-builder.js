// <!-- START OF FILE: navigation-builder.js -->
// FILENAME: navigation-builder.js
// Version: 1.0.0
// Date: 2025-07-30 16:30
// Author: Rolland MELET & Claude Code
// Description: Constructeur navigation actions ProcessMetaLanguage - TASK-B006

/**
 * Module ProcessMetaLanguage - Navigation Builder
 * 
 * Système de construction dynamique de la navigation vers les actions secondaires
 * disponibles depuis un état donné. Gère les relations et transitions autorisées
 * selon l'architecture État-Actions deux niveaux avec conformité EPCIS 2.0.
 * 
 * Fonctionnalités principales:
 * - Construction navigation dynamique vers actions secondaires
 * - Validation transitions autorisées selon business rules
 * - Gestion permissions et contraintes utilisateur
 * - Support workflow conditionnels et parallèles
 * - Intégration API 360SmartConnect pour exécution actions
 * - Performance optimisée avec cache navigation intelligente
 * - Conformité business steps EPCIS 2.0 pour transitions
 */

/**
 * Configuration du constructeur de navigation
 * @constant {Object}
 */
const NAVIGATION_BUILDER_CONFIG = {
    // Types de navigation supportés
    navigationTypes: {
        sequential: 'Navigation séquentielle linéaire',
        conditional: 'Navigation conditionnelle avec embranchements',
        parallel: 'Navigation parallèle multi-chemins',
        workflow: 'Navigation workflow avec étapes définies',
        contextual: 'Navigation contextuelle selon état'
    },
    
    // Types d'actions dans la navigation
    actionTypes: {
        secondary_action: 'Action secondaire standard',
        workflow_action: 'Action de workflow',
        conditional_action: 'Action conditionnelle',
        api_action: 'Action API externe',
        validation_action: 'Action de validation',
        transformation_action: 'Action de transformation'
    },
    
    // Niveaux de permissions
    permissionLevels: {
        public: 'Accessible à tous',
        authenticated: 'Utilisateur authentifié requis',
        authorized: 'Autorisation spécifique requise',
        admin: 'Administrateur seulement',
        system: 'Système seulement'
    },
    
    // Performance et cache
    cacheEnabled: true,
    cacheTTL: 300000, // 5 minutes
    maxNavigationComplexity: 50, // Max 50 actions dans une navigation
    
    // Business rules
    maxTransitionDepth: 5,
    allowCyclicTransitions: false,
    validateBusinessSteps: true,
    
    // Interface utilisateur
    maxActionsPerGroup: 10,
    groupByType: true,
    sortByPriority: true,
    
    // Conformité EPCIS 2.0
    epcisTransitionValidation: true,
    cbvComplianceRequired: true,
    
    // 360SmartConnect intégration
    generateAPIEndpoints: true,
    webhookSupport: true,
    realTimeUpdates: true
};

/**
 * Classe principale du Navigation Builder
 * @class
 */
class NavigationBuilder {
    /**
     * Initialise le Navigation Builder
     * @param {Object} options - Options de configuration
     */
    constructor(options = {}) {
        this.config = { ...NAVIGATION_BUILDER_CONFIG, ...options };
        
        // Cache des navigations
        this.navigationCache = new Map();
        
        // Règles de transition business
        this.transitionRules = new Map();
        this.loadDefaultTransitionRules();
        
        // Statistiques
        this.stats = {
            navigationsBuilt: 0,
            averageBuildTime: 0,
            averageActionCount: 0,
            cacheHits: 0,
            cacheMisses: 0,
            totalComplexity: 0
        };
        
        console.log('✅ NavigationBuilder initialisé');
    }

    /**
     * Construit la navigation vers toutes les actions disponibles depuis un état
     * @param {Object} stateData - Données complètes de l'état actuel
     * @param {Object} objectData - Données de l'objet parent
     * @param {boolean} includeSecondaryActions - Inclure actions secondaires
     * @param {Object} options - Options de construction navigation
     * @returns {Promise<Object>} Navigation complète structurée
     * @sideEffect Met en cache la navigation pour performance
     * @example
     * const navigation = await builder.buildActionNavigation({
     *   stateId: 'state_production_001',
     *   stateName: 'En_Production',
     *   disposition: 'active',
     *   businessStep: 'transforming'
     * }, {
     *   objectId: 'obj_lot_001',
     *   objectName: 'Lot Acier A001',
     *   objectType: 'raw-material'
     * }, true);
     */
    async buildActionNavigation(stateData, objectData, includeSecondaryActions = true, options = {}) {
        const startTime = performance.now();
        
        try {
            // Vérifier cache si activé
            const cacheKey = this.generateNavigationCacheKey(stateData, objectData, includeSecondaryActions);
            if (this.config.cacheEnabled && this.navigationCache.has(cacheKey)) {
                const cached = this.navigationCache.get(cacheKey);
                if (Date.now() - cached.timestamp < this.config.cacheTTL) {
                    this.stats.cacheHits++;
                    console.log(`📦 Navigation récupérée du cache: ${stateData.stateName}`);
                    return cached.navigation;
                }
            }
            this.stats.cacheMisses++;
            
            // Construire navigation complète
            const navigation = {
                navigationMetadata: this.generateNavigationMetadata(stateData, objectData),
                mainAction: this.buildMainActionNavigation(stateData, objectData),
                secondaryActions: includeSecondaryActions ? 
                    await this.buildSecondaryActionsNavigation(stateData, objectData, options) : [],
                conditionalActions: await this.buildConditionalActionsNavigation(stateData, objectData, options),
                workflowActions: await this.buildWorkflowActionsNavigation(stateData, objectData, options),
                apiActions: await this.buildAPIActionsNavigation(stateData, objectData, options),
                navigationSummary: null // Sera calculé après construction
            };
            
            // Calculer résumé navigation
            navigation.navigationSummary = this.calculateNavigationSummary(navigation);
            
            // Validation et optimisation
            this.validateNavigation(navigation);
            this.optimizeNavigation(navigation, options);
            
            // Enrichissement avec contexte utilisateur
            if (options.userContext) {
                this.enrichWithUserContext(navigation, options.userContext);
            }
            
            // Mise en cache
            if (this.config.cacheEnabled) {
                this.cacheNavigation(cacheKey, navigation);
            }
            
            // Mise à jour statistiques
            const endTime = performance.now();
            this.updateNavigationStats(endTime - startTime, navigation);
            
            console.log(`✅ Navigation construite: ${navigation.navigationSummary.totalActions} actions (${(endTime - startTime).toFixed(2)}ms)`);
            
            return navigation;
            
        } catch (error) {
            console.error(`❌ Erreur construction navigation:`, error.message);
            throw error;
        }
    }

    /**
     * Génère les métadonnées de navigation
     * @param {Object} stateData - Données de l'état
     * @param {Object} objectData - Données de l'objet
     * @returns {Object} Métadonnées de navigation
     * @private
     */
    generateNavigationMetadata(stateData, objectData) {
        const timestamp = new Date().toISOString();
        
        return {
            navigationId: this.generateNavigationId(stateData, objectData),
            builtAt: timestamp,
            builtBy: 'NavigationBuilder',
            version: '1.0.0',
            
            sourceContext: {
                objectId: objectData.objectId || objectData.uniqueId,
                objectName: objectData.objectName,
                stateId: stateData.stateId || stateData.uniqueId,
                stateName: stateData.stateName,
                currentDisposition: stateData.disposition || 'active',
                businessStep: stateData.businessStep || 'observing'
            },
            
            navigationScope: {
                includesMainAction: true,
                includesSecondaryActions: true,
                includesConditionalActions: true,
                includesWorkflowActions: true,
                includesAPIActions: true,
                maxDepth: this.config.maxTransitionDepth
            },
            
            businessContext: {
                allowedTransitions: this.getAllowedTransitions(stateData),
                businessConstraints: this.getBusinessConstraints(stateData, objectData),
                epcisCompliance: this.config.epcisTransitionValidation,
                validationRequired: this.isValidationRequired(stateData)
            }
        };
    }

    /**
     * Construit la navigation pour l'action principale
     * @param {Object} stateData - Données de l'état
     * @param {Object} objectData - Données de l'objet
     * @returns {Object} Navigation action principale
     * @private
     */
    buildMainActionNavigation(stateData, objectData) {
        return {
            actionId: `main_action_${stateData.stateId}`,
            actionName: `Consulter État ${stateData.stateName}`,
            actionType: 'main_action',
            category: 'data_exposition',
            
            navigationInfo: {
                isAlwaysAvailable: true,
                requiresPermissions: ['read'],
                executionMethod: 'GET',
                responseTime: '< 500ms',
                
                apiEndpoint: {
                    method: 'GET',
                    url: `/api/v1/objects/${objectData.objectId}/states/${stateData.stateId}/main-action`,
                    authenticated: false,
                    rateLimited: true
                }
            },
            
            userInterface: {
                displayName: `📊 Consulter ${stateData.stateName}`,
                description: 'Action principale pour consultation des données complètes',
                icon: 'eye',
                color: '#2196F3',
                priority: 'highest',
                group: 'main',
                shortcut: 'Ctrl+I'
            },
            
            expectedOutput: {
                dataTypes: ['object_metadata', 'state_data', 'epcis_metadata', 'navigation'],
                responseFormat: 'json',
                estimatedSize: '< 50KB',
                cacheable: true
            }
        };
    }

    /**
     * Construit la navigation pour les actions secondaires
     * @param {Object} stateData - Données de l'état
     * @param {Object} objectData - Données de l'objet
     * @param {Object} options - Options de construction
     * @returns {Promise<Array>} Liste des actions secondaires avec navigation
     * @private
     */
    async buildSecondaryActionsNavigation(stateData, objectData, options) {
        const secondaryActions = [];
        
        // Récupérer actions secondaires configurées ou générées
        const configuredActions = stateData.secondaryActions || this.generateDefaultSecondaryActions(stateData, objectData);
        
        for (const actionConfig of configuredActions) {
            try {
                const actionNav = await this.buildSecondaryActionNavigation(actionConfig, stateData, objectData, options);
                if (actionNav && this.isActionAllowed(actionNav, stateData, options.userContext)) {
                    secondaryActions.push(actionNav);
                }
            } catch (error) {
                console.warn(`⚠️ Erreur construction navigation action secondaire ${actionConfig.name}: ${error.message}`);
            }
        }
        
        // Trier par priorité si activé
        if (this.config.sortByPriority) {
            secondaryActions.sort((a, b) => this.compareActionPriority(a, b));
        }
        
        // Grouper par type si activé
        if (this.config.groupByType) {
            return this.groupActionsByType(secondaryActions);
        }
        
        return secondaryActions;
    }

    /**
     * Construit la navigation pour une action secondaire spécifique
     * @param {Object} actionConfig - Configuration de l'action
     * @param {Object} stateData - Données de l'état
     * @param {Object} objectData - Données de l'objet
     * @param {Object} options - Options de construction
     * @returns {Promise<Object>} Navigation action secondaire
     * @private
     */
    async buildSecondaryActionNavigation(actionConfig, stateData, objectData, options) {
        // Validation transition autorisée
        const transitionValidation = await this.validateTransition(
            stateData.stateName,
            actionConfig.targetState,
            stateData.businessStep,
            actionConfig.businessStep
        );
        
        if (!transitionValidation.isValid && this.config.epcisTransitionValidation) {
            throw new Error(`Transition non autorisée: ${transitionValidation.reason}`);
        }
        
        return {
            actionId: actionConfig.id || this.generateActionId(actionConfig.name),
            actionName: actionConfig.name,
            actionType: actionConfig.type || 'secondary_action',
            category: actionConfig.category || 'state_transition',
            
            transitionInfo: {
                sourceState: stateData.stateName,
                targetState: actionConfig.targetState,
                sourceDisposition: stateData.disposition,
                targetDisposition: actionConfig.targetDisposition || 'active',
                businessStepTransition: {
                    from: stateData.businessStep || 'observing',
                    to: actionConfig.businessStep || 'observing'
                },
                transitionValidation
            },
            
            navigationInfo: {
                isAvailable: this.isActionAvailable(actionConfig, stateData, options.userContext),
                requiresPermissions: actionConfig.permissions || ['execute'],
                requiresValidation: actionConfig.requiresValidation || false,
                executionMethod: actionConfig.method || 'POST',
                estimatedDuration: actionConfig.estimatedDuration || '< 5s',
                
                prerequisites: this.getActionPrerequisites(actionConfig, stateData),
                consequences: this.getActionConsequences(actionConfig, stateData),
                
                apiEndpoint: {
                    method: actionConfig.method || 'POST',
                    url: `/api/v1/objects/${objectData.objectId}/states/${stateData.stateId}/actions/${actionConfig.id}`,
                    authenticated: true,
                    parameters: actionConfig.parameters || {}
                }
            },
            
            userInterface: {
                displayName: this.formatActionDisplayName(actionConfig),
                description: actionConfig.description || `Transition vers ${actionConfig.targetState}`,
                icon: this.getActionIcon(actionConfig),
                color: this.getActionColor(actionConfig),
                priority: actionConfig.priority || 'normal',
                group: this.getActionGroup(actionConfig),
                shortcut: actionConfig.shortcut,
                confirmationRequired: actionConfig.requiresConfirmation || false
            },
            
            workflowInfo: {
                workflowSteps: actionConfig.workflowSteps || [],
                internalProcessing: actionConfig.internalProcessing || {},
                dataCapture: actionConfig.dataCapture || {},
                rollbackPossible: actionConfig.rollbackPossible !== false
            },
            
            epcisMetadata: {
                businessStep: actionConfig.businessStep || stateData.businessStep,
                targetDisposition: actionConfig.targetDisposition || 'active',
                eventType: 'ObjectEvent',
                action: 'OBSERVE',
                cbvCompliant: true
            }
        };
    }

    /**
     * Construit la navigation pour les actions conditionnelles
     * @param {Object} stateData - Données de l'état
     * @param {Object} objectData - Données de l'objet
     * @param {Object} options - Options de construction
     * @returns {Promise<Array>} Actions conditionnelles avec navigation
     * @private
     */
    async buildConditionalActionsNavigation(stateData, objectData, options) {
        const conditionalActions = [];
        
        // Actions conditionnelles basées sur l'état et le contexte
        const conditions = this.evaluateStateConditions(stateData, objectData, options.userContext);
        
        for (const condition of conditions) {
            if (condition.isMet) {
                const condAction = {
                    actionId: `conditional_${condition.id}`,
                    actionName: condition.actionName,
                    actionType: 'conditional_action',
                    category: 'conditional',
                    
                    conditionalInfo: {
                        conditionType: condition.type,
                        conditionDescription: condition.description,
                        conditionMet: condition.isMet,
                        evaluatedAt: new Date().toISOString(),
                        reevaluationRequired: condition.dynamic || false
                    },
                    
                    navigationInfo: {
                        isAvailable: condition.isMet,
                        requiresRevalidation: condition.dynamic,
                        executionMethod: 'POST',
                        estimatedDuration: condition.estimatedDuration || '< 3s'
                    },
                    
                    userInterface: {
                        displayName: `🔀 ${condition.actionName}`,
                        description: `Action conditionnelle: ${condition.description}`,
                        icon: 'branch',
                        color: '#FF9800',
                        priority: 'conditional',
                        group: 'conditional'
                    }
                };
                
                conditionalActions.push(condAction);
            }
        }
        
        return conditionalActions;
    }

    /**
     * Construit la navigation pour les actions de workflow
     * @param {Object} stateData - Données de l'état
     * @param {Object} objectData - Données de l'objet
     * @param {Object} options - Options de construction
     * @returns {Promise<Array>} Actions workflow avec navigation
     * @private
     */
    async buildWorkflowActionsNavigation(stateData, objectData, options) {
        const workflowActions = [];
        
        // Identifier workflows applicables
        const applicableWorkflows = this.getApplicableWorkflows(stateData, objectData);
        
        for (const workflow of applicableWorkflows) {
            const workflowAction = {
                actionId: `workflow_${workflow.id}`,
                actionName: workflow.name,
                actionType: 'workflow_action',
                category: 'workflow',
                
                workflowInfo: {
                    workflowId: workflow.id,
                    workflowName: workflow.name,
                    workflowVersion: workflow.version || '1.0.0',
                    currentStep: workflow.currentStep || 1,
                    totalSteps: workflow.steps?.length || 0,
                    estimatedCompletion: workflow.estimatedCompletion || 'variable'
                },
                
                navigationInfo: {
                    isAvailable: this.isWorkflowAvailable(workflow, stateData),
                    requiresPermissions: workflow.permissions || ['execute_workflow'],
                    executionMethod: 'POST',
                    estimatedDuration: workflow.estimatedDuration || '< 30s'
                },
                
                userInterface: {
                    displayName: `⚙️ ${workflow.name}`,
                    description: workflow.description || `Workflow: ${workflow.name}`,
                    icon: 'workflow',
                    color: '#4CAF50',
                    priority: 'workflow',
                    group: 'workflow'
                }
            };
            
            workflowActions.push(workflowAction);
        }
        
        return workflowActions;
    }

    /**
     * Construit la navigation pour les actions API
     * @param {Object} stateData - Données de l'état
     * @param {Object} objectData - Données de l'objet
     * @param {Object} options - Options de construction
     * @returns {Promise<Array>} Actions API avec navigation
     * @private
     */
    async buildAPIActionsNavigation(stateData, objectData, options) {
        const apiActions = [];
        
        if (!this.config.generateAPIEndpoints) {
            return apiActions;
        }
        
        // API 360SmartConnect
        if (objectData.userMetadata?.avatarId) {
            const smartConnectAction = {
                actionId: `api_360sc_${objectData.userMetadata.avatarId}`,
                actionName: 'Synchroniser 360SmartConnect',
                actionType: 'api_action',
                category: 'integration',
                
                apiInfo: {
                    provider: '360SmartConnect',
                    endpoint: `/api/avatars/${objectData.userMetadata.avatarId}/sync`,
                    method: 'POST',
                    authentication: 'bearer_token',
                    rateLimit: '100/hour'
                },
                
                navigationInfo: {
                    isAvailable: true,
                    requiresPermissions: ['api_access'],
                    executionMethod: 'POST',
                    estimatedDuration: '< 2s'
                },
                
                userInterface: {
                    displayName: '🔄 Sync 360SmartConnect',
                    description: 'Synchroniser données avec 360SmartConnect',
                    icon: 'sync',
                    color: '#9C27B0',
                    priority: 'integration',
                    group: 'api'
                }
            };
            
            apiActions.push(smartConnectAction);
        }
        
        // Autres API externes configurées
        const externalAPIs = this.getConfiguredExternalAPIs(stateData, objectData);
        for (const api of externalAPIs) {
            const apiAction = this.buildExternalAPIAction(api, stateData, objectData);
            apiActions.push(apiAction);
        }
        
        return apiActions;
    }

    /**
     * Calcule le résumé de navigation
     * @param {Object} navigation - Navigation construite
     * @returns {Object} Résumé de navigation
     * @private
     */
    calculateNavigationSummary(navigation) {
        const totalActions = 1 + // main action
            navigation.secondaryActions.length +
            navigation.conditionalActions.length +
            navigation.workflowActions.length +
            navigation.apiActions.length;
        
        return {
            totalActions,
            actionBreakdown: {
                mainActions: 1,
                secondaryActions: navigation.secondaryActions.length,
                conditionalActions: navigation.conditionalActions.length,
                workflowActions: navigation.workflowActions.length,
                apiActions: navigation.apiActions.length
            },
            
            complexity: this.calculateNavigationComplexity(navigation),
            
            availabilityStats: {
                alwaysAvailable: 1, // main action
                conditionallyAvailable: navigation.conditionalActions.length,
                permissionRequired: this.countPermissionRequiredActions(navigation),
                validationRequired: this.countValidationRequiredActions(navigation)
            },
            
            responseTimeEstimate: this.calculateTotalResponseTime(navigation),
            navigationOptimized: true,
            cacheRecommended: totalActions > 10
        };
    }

    /**
     * Valide la navigation construite
     * @param {Object} navigation - Navigation à valider
     * @throws {Error} Si validation échoue
     * @private
     */
    validateNavigation(navigation) {
        // Validation structure
        if (!navigation.mainAction) {
            throw new Error('Action principale manquante dans navigation');
        }
        
        // Validation complexité
        const complexity = this.calculateNavigationComplexity(navigation);
        if (complexity > this.config.maxNavigationComplexity) {
            throw new Error(`Navigation trop complexe: ${complexity}, max: ${this.config.maxNavigationComplexity}`);
        }
        
        // Validation EPCIS des transitions
        if (this.config.epcisTransitionValidation) {
            this.validateEPCISTransitions(navigation);
        }
        
        // Validation permissions cohérentes
        this.validatePermissionConsistency(navigation);
    }

    /**
     * Optimise la navigation pour performance
     * @param {Object} navigation - Navigation à optimiser
     * @param {Object} options - Options d'optimisation
     * @private
     */
    optimizeNavigation(navigation, options) {
        // Optimisation tri actions par priorité
        if (this.config.sortByPriority) {
            this.sortActionsByPriority(navigation);
        }
        
        // Optimisation groupement actions
        if (this.config.groupByType && navigation.secondaryActions.length > this.config.maxActionsPerGroup) {
            navigation.secondaryActions = this.groupActionsByType(navigation.secondaryActions);
        }
        
        // Optimisation cache suggestions
        if (navigation.navigationSummary?.totalActions > 10) {
            navigation.cacheRecommendation = {
                recommended: true,
                ttl: this.config.cacheTTL,
                priority: 'high'
            };
        }
        
        // Optimisation API endpoints
        if (this.config.generateAPIEndpoints) {
            this.optimizeAPIEndpoints(navigation);
        }
    }

    // === MÉTHODES UTILITAIRES ET HELPERS ===

    /**
     * Charge les règles de transition par défaut
     * @private
     */
    loadDefaultTransitionRules() {
        // Règles de transition EPCIS 2.0 standard
        const defaultRules = [
            {
                from: 'receiving',
                to: ['inspecting', 'storing', 'transforming'],
                conditions: ['quality_check_passed']
            },
            {
                from: 'inspecting',
                to: ['storing', 'packing', 'destroyed'],
                conditions: ['inspection_completed']
            },
            {
                from: 'storing',
                to: ['retrieving', 'shipping', 'transforming'],
                conditions: ['inventory_available']
            },
            {
                from: 'transforming',
                to: ['inspecting', 'packing', 'storing'],
                conditions: ['transformation_completed']
            }
        ];
        
        defaultRules.forEach(rule => {
            this.transitionRules.set(rule.from, rule);
        });
    }

    /**
     * Valide une transition d'état selon les règles business
     * @param {string} fromState - État source
     * @param {string} toState - État cible
     * @param {string} fromBusinessStep - Business step source
     * @param {string} toBusinessStep - Business step cible
     * @returns {Promise<Object>} Résultat de validation
     * @private
     */
    async validateTransition(fromState, toState, fromBusinessStep, toBusinessStep) {
        try {
            // Validation règles de transition
            const rule = this.transitionRules.get(fromBusinessStep);
            if (rule && !rule.to.includes(toBusinessStep)) {
                return {
                    isValid: false,
                    reason: `Transition non autorisée de ${fromBusinessStep} vers ${toBusinessStep}`,
                    allowedTransitions: rule.to
                };
            }
            
            // Validation cyclique si désactivée
            if (!this.config.allowCyclicTransitions && fromState === toState) {
                return {
                    isValid: false,
                    reason: 'Transitions cycliques non autorisées',
                    allowedTransitions: []
                };
            }
            
            return {
                isValid: true,
                reason: 'Transition autorisée',
                validatedAt: new Date().toISOString()
            };
            
        } catch (error) {
            return {
                isValid: false,
                reason: `Erreur validation: ${error.message}`,
                error: error.message
            };
        }
    }

    /**
     * Enrichit la navigation avec le contexte utilisateur
     * @param {Object} navigation - Navigation à enrichir
     * @param {Object} userContext - Contexte utilisateur
     * @private
     */
    enrichWithUserContext(navigation, userContext) {
        if (!userContext) return;
        
        navigation.userContext = {
            userId: userContext.userId,
            roles: userContext.roles || [],
            permissions: userContext.permissions || [],
            preferences: userContext.preferences || {},
            filteredActions: this.filterActionsByUserPermissions(navigation, userContext)
        };
        
        // Ajuster navigation selon permissions utilisateur
        this.adjustNavigationForUser(navigation, userContext);
    }

    /**
     * Filtre les actions selon les permissions utilisateur
     * @param {Object} navigation - Navigation complète
     * @param {Object} userContext - Contexte utilisateur
     * @returns {Object} Navigation filtrée
     * @private
     */
    filterActionsByUserPermissions(navigation, userContext) {
        const userPermissions = userContext.permissions || [];
        
        return {
            availableSecondaryActions: navigation.secondaryActions.filter(action => 
                this.hasRequiredPermissions(action.navigationInfo.requiresPermissions, userPermissions)
            ),
            availableWorkflowActions: navigation.workflowActions.filter(action =>
                this.hasRequiredPermissions(action.navigationInfo.requiresPermissions, userPermissions)
            ),
            availableAPIActions: navigation.apiActions.filter(action =>
                this.hasRequiredPermissions(action.navigationInfo.requiresPermissions, userPermissions)
            )
        };
    }

    /**
     * Vérifie si l'utilisateur a les permissions requises
     * @param {Array} requiredPermissions - Permissions requises
     * @param {Array} userPermissions - Permissions utilisateur
     * @returns {boolean} True si permissions suffisantes
     * @private
     */
    hasRequiredPermissions(requiredPermissions, userPermissions) {
        if (!requiredPermissions || requiredPermissions.length === 0) return true;
        return requiredPermissions.every(perm => userPermissions.includes(perm));
    }

    // Méthodes helpers (implémentations simplifiées pour l'exemple)
    generateNavigationId(stateData, objectData) {
        return `nav_${objectData.objectId}_${stateData.stateId}_${Date.now()}`;
    }
    
    generateNavigationCacheKey(stateData, objectData, includeSecondaryActions) {
        return `nav_${objectData.objectId}_${stateData.stateId}_${stateData.disposition}_${includeSecondaryActions}`;
    }
    
    cacheNavigation(cacheKey, navigation) {
        if (this.navigationCache.size >= 100) {
            const firstKey = this.navigationCache.keys().next().value;
            this.navigationCache.delete(firstKey);
        }
        this.navigationCache.set(cacheKey, { navigation, timestamp: Date.now() });
    }
    
    updateNavigationStats(executionTime, navigation) {
        this.stats.navigationsBuilt++;
        this.stats.averageBuildTime = ((this.stats.averageBuildTime * (this.stats.navigationsBuilt - 1) + executionTime) / this.stats.navigationsBuilt);
        this.stats.averageActionCount = ((this.stats.averageActionCount * (this.stats.navigationsBuilt - 1) + navigation.navigationSummary.totalActions) / this.stats.navigationsBuilt);
        this.stats.totalComplexity += this.calculateNavigationComplexity(navigation);
    }
    
    getAllowedTransitions(stateData) { return []; }
    getBusinessConstraints(stateData, objectData) { return []; }
    isValidationRequired(stateData) { return false; }
    generateDefaultSecondaryActions(stateData, objectData) { return []; }
    isActionAllowed(actionNav, stateData, userContext) { return true; }
    compareActionPriority(a, b) { return 0; }
    groupActionsByType(actions) { return actions; }
    generateActionId(name) { return `action_${Date.now()}`; }
    isActionAvailable(actionConfig, stateData, userContext) { return true; }
    getActionPrerequisites(actionConfig, stateData) { return []; }
    getActionConsequences(actionConfig, stateData) { return []; }
    formatActionDisplayName(actionConfig) { return actionConfig.name; }
    getActionIcon(actionConfig) { return 'action'; }
    getActionColor(actionConfig) { return '#FF9800'; }
    getActionGroup(actionConfig) { return 'secondary'; }
    evaluateStateConditions(stateData, objectData, userContext) { return []; }
    getApplicableWorkflows(stateData, objectData) { return []; }
    isWorkflowAvailable(workflow, stateData) { return true; }
    getConfiguredExternalAPIs(stateData, objectData) { return []; }
    buildExternalAPIAction(api, stateData, objectData) { return {}; }
    calculateNavigationComplexity(navigation) { return navigation.navigationSummary?.totalActions || 0; }
    countPermissionRequiredActions(navigation) { return 0; }
    countValidationRequiredActions(navigation) { return 0; }
    calculateTotalResponseTime(navigation) { return '< 5s'; }
    validateEPCISTransitions(navigation) { return true; }
    validatePermissionConsistency(navigation) { return true; }
    sortActionsByPriority(navigation) { /* implementation */ }
    optimizeAPIEndpoints(navigation) { /* implementation */ }
    adjustNavigationForUser(navigation, userContext) { /* implementation */ }

    /**
     * Obtient les statistiques de performance du navigateur
     * @returns {Object} Statistiques détaillées
     */
    getPerformanceStats() {
        return {
            ...this.stats,
            cacheStats: {
                size: this.navigationCache.size,
                hits: this.stats.cacheHits,
                misses: this.stats.cacheMisses,
                hitRatio: this.stats.cacheHits / (this.stats.cacheHits + this.stats.cacheMisses) * 100 || 0
            },
            averageComplexity: this.stats.navigationsBuilt > 0 ? this.stats.totalComplexity / this.stats.navigationsBuilt : 0,
            performanceTarget: this.stats.averageBuildTime < 1000 ? '✅ <1s' : '❌ >1s'
        };
    }

    /**
     * Remet à zéro les caches et statistiques
     * @sideEffect Vide tous les caches internes
     */
    reset() {
        this.navigationCache.clear();
        this.stats = {
            navigationsBuilt: 0,
            averageBuildTime: 0,
            averageActionCount: 0,
            cacheHits: 0,
            cacheMisses: 0,
            totalComplexity: 0
        };
        console.log('🔄 NavigationBuilder réinitialisé');
    }
}

// Export ES6 par défaut
export { NavigationBuilder, NAVIGATION_BUILDER_CONFIG };

// Export browser pour utilisation dans Obsidian
if (typeof window !== 'undefined') {
    window.ProcessMetaLanguageNavigationBuilder = {
        NavigationBuilder,
        NAVIGATION_BUILDER_CONFIG
    };
}

// <!-- END OF FILE: navigation-builder.js -->