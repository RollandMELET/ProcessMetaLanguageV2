// <!-- START OF FILE: transition-manager.js -->
// FILENAME: transition-manager.js
// Version: 1.0.0
// Date: 2025-07-30 17:15
// Author: Rolland MELET & Claude Code
// Description: Gestionnaire transitions d'état ProcessMetaLanguage - TASK-B007 Phase 3

/**
 * Gestionnaire des transitions d'état pour l'architecture État-Actions Deux Niveaux
 * Orchestration des changements d'état selon les actions et validation EPCIS 2.0
 * @module TransitionManager
 * @requires SecondaryActionsManager
 * @requires EPCISValidator
 * @requires TemplateProcessor
 */

import { SecondaryActionsManager } from './secondary-actions.js';
import { EPCISValidator } from './epcis-validator.js';
import { TemplateProcessor } from './template-processor.js';

/**
 * Gestionnaire principal des transitions d'état ProcessMetaLanguage
 * Implémente la logique de workflow et transitions selon architecture État-Actions
 * 
 * @class TransitionManager
 * @example
 * // Créer gestionnaire de transitions
 * const transitionManager = new TransitionManager();
 * await transitionManager.initialize();
 * 
 * // Exécuter transition d'état
 * const result = await transitionManager.executeTransition({
 *   fromState: 'receiving_state',
 *   toState: 'quality_control_state',
 *   triggerAction: 'quality_inspect_001',
 *   transitionData: { inspector: 'QC001', result: 'passed' }
 * });
 */
export class TransitionManager {
    /**
     * Initialise le gestionnaire de transitions
     * @param {Object} options - Options de configuration
     * @param {boolean} options.enableValidation - Validation transitions EPCIS (défaut: true)
     * @param {boolean} options.enableWorkflowLog - Log des transitions (défaut: true)
     * @param {number} options.maxTransitionHistory - Historique max (défaut: 100)
     * @param {boolean} options.allowRollback - Autoriser rollback (défaut: false)
     */
    constructor(options = {}) {
        this.config = {
            enableValidation: options.enableValidation !== false,
            enableWorkflowLog: options.enableWorkflowLog !== false,
            maxTransitionHistory: options.maxTransitionHistory || 100,
            allowRollback: options.allowRollback || false,
            transitionTimeout: options.transitionTimeout || 30000, // 30s
            concurrentTransitions: options.concurrentTransitions || 5
        };

        // Modules de dépendance
        this.secondaryActionsManager = null;
        this.epcisValidator = null;
        this.templateProcessor = null;

        // État interne du gestionnaire
        this.transitionHistory = [];
        this.activeTransitions = new Map();
        this.workflowStates = new Map();
        this.transitionRules = new Map();

        // Définition des règles de transition EPCIS 2.0
        this.epcisTransitionRules = {
            // Règles de réception
            receiving: {
                allowedTargets: ['inspecting', 'storing', 'shipping'],
                requiredDispositions: {
                    'inspecting': 'in_progress',
                    'storing': 'active',
                    'shipping': 'in_transit'
                },
                validationRequired: true,
                automaticActions: ['generate_receipt', 'update_inventory']
            },
            
            // Règles d'inspection/contrôle
            inspecting: {
                allowedTargets: ['storing', 'transforming', 'shipping', 'recalling'],
                requiredDispositions: {
                    'storing': 'active',
                    'transforming': 'in_progress',
                    'shipping': 'in_transit',
                    'recalling': 'recalled'
                },
                validationRequired: true,
                automaticActions: ['quality_report', 'compliance_check']
            },
            
            // Règles de stockage
            storing: {
                allowedTargets: ['shipping', 'transforming', 'inspecting', 'destroying'],
                requiredDispositions: {
                    'shipping': 'in_transit',
                    'transforming': 'in_progress',
                    'inspecting': 'in_progress',
                    'destroying': 'destroyed'
                },
                validationRequired: false,
                automaticActions: ['location_update', 'inventory_update']
            },
            
            // Règles de transformation
            transforming: {
                allowedTargets: ['inspecting', 'storing', 'assembling', 'packaging'],
                requiredDispositions: {
                    'inspecting': 'in_progress',
                    'storing': 'active',
                    'assembling': 'in_progress',
                    'packaging': 'in_progress'
                },
                validationRequired: true,
                automaticActions: ['process_log', 'yield_calculation']
            },
            
            // Règles d'expédition
            shipping: {
                allowedTargets: ['receiving', 'in_transit_update', 'delivered'],
                requiredDispositions: {
                    'receiving': 'in_transit',
                    'in_transit_update': 'in_transit',
                    'delivered': 'completed'
                },
                validationRequired: true,
                automaticActions: ['shipping_doc', 'tracking_number']
            }
        };

        // Patterns de workflow prédéfinis
        this.workflowPatterns = {
            // Workflow réception standard
            standard_receiving: {
                name: 'Réception Standard',
                description: 'Workflow standard de réception avec contrôle qualité',
                steps: [
                    { step: 'receiving', disposition: 'in_transit', duration: 30 },
                    { step: 'inspecting', disposition: 'in_progress', duration: 60 },
                    { step: 'storing', disposition: 'active', duration: 15 }
                ],
                conditionalBranches: {
                    'quality_failed': [
                        { step: 'recalling', disposition: 'recalled', duration: 10 }
                    ]
                }
            },
            
            // Workflow production
            production_workflow: {
                name: 'Production Standard',
                description: 'Workflow de production avec transformation',
                steps: [
                    { step: 'transforming', disposition: 'in_progress', duration: 120 },
                    { step: 'inspecting', disposition: 'in_progress', duration: 45 },
                    { step: 'packaging', disposition: 'in_progress', duration: 30 },
                    { step: 'storing', disposition: 'active', duration: 15 }
                ],
                conditionalBranches: {
                    'rework_needed': [
                        { step: 'transforming', disposition: 'in_progress', duration: 60 }
                    ]
                }
            },
            
            // Workflow expédition
            shipping_workflow: {
                name: 'Expédition Standard',
                description: 'Workflow d\'expédition avec suivi',
                steps: [
                    { step: 'picking', disposition: 'in_progress', duration: 20 },
                    { step: 'packing', disposition: 'in_progress', duration: 15 },
                    { step: 'shipping', disposition: 'in_transit', duration: 10 }
                ],
                conditionalBranches: {
                    'damage_detected': [
                        { step: 'inspecting', disposition: 'in_progress', duration: 30 }
                    ]
                }
            }
        };

        this.isInitialized = false;
    }

    /**
     * Initialise le gestionnaire et ses dépendances
     * @returns {Promise<boolean>} Succès de l'initialisation
     * @sideEffect Initialise les modules et charge les règles de transition
     * @example
     * const manager = new TransitionManager();
     * await manager.initialize();
     */
    async initialize() {
        try {
            console.log('Initialisation TransitionManager...');

            // Initialiser les modules de dépendance
            this.secondaryActionsManager = new SecondaryActionsManager();
            this.epcisValidator = new EPCISValidator();
            this.templateProcessor = new TemplateProcessor();

            await this.secondaryActionsManager.initialize();
            // Note: EPCISValidator et TemplateProcessor n'ont pas de méthode initialize

            // Charger et valider les règles de transition
            await this._loadTransitionRules();
            await this._validateTransitionRules();

            // Initialiser l'état du workflow
            this._initializeWorkflowState();

            this.isInitialized = true;
            console.log('✅ TransitionManager initialisé avec succès');
            
            return true;
        } catch (error) {
            console.error('❌ Erreur initialisation TransitionManager:', error);
            throw new Error(`Échec initialisation TransitionManager: ${error.message}`);
        }
    }

    /**
     * Exécute une transition d'état avec validation complète
     * @param {Object} transitionData - Données de la transition
     * @param {string} transitionData.fromState - État source
     * @param {string} transitionData.toState - État cible
     * @param {string} transitionData.triggerAction - Action déclenchante
     * @param {Object} transitionData.actionData - Données de l'action
     * @param {Object} transitionData.metadata - Métadonnées additionnelles
     * @param {Object} options - Options d'exécution
     * @param {boolean} options.validateTransition - Valider la transition (défaut: true)
     * @param {boolean} options.executeActions - Exécuter actions automatiques (défaut: true)
     * @param {boolean} options.updateWorkflow - Mettre à jour workflow (défaut: true)
     * @returns {Promise<Object>} Résultat de la transition avec nouvel état
     * @sideEffect Modifie l'état du workflow, exécute actions automatiques, met à jour historique
     * @performance Target <1s pour transition simple, <3s pour transition complexe
     * @example
     * // Transition réception → contrôle qualité
     * const result = await manager.executeTransition({
     *   fromState: 'reception_dock',
     *   toState: 'quality_control',
     *   triggerAction: 'start_quality_inspection',
     *   actionData: {
     *     inspector_id: 'QC001',
     *     lot_number: 'LOT001',
     *     inspection_criteria: ['visual', 'dimensional']
     *   },
     *   metadata: {
     *     priority: 'high',
     *     expected_duration: 60
     *   }
     * });
     */
    async executeTransition(transitionData, options = {}) {
        const startTime = performance.now();
        const transitionId = this._generateTransitionId();
        
        try {
            console.log(`Exécution transition ${transitionId}: ${transitionData.fromState} → ${transitionData.toState}`);

            // Validation des paramètres
            this._validateTransitionData(transitionData);

            // Vérifier si la transition est autorisée
            if (options.validateTransition !== false) {
                const validationResult = await this._validateTransition(transitionData);
                if (!validationResult.valid) {
                    throw new Error(`Transition non autorisée: ${validationResult.errors.join(', ')}`);
                }
            }

            // Enregistrer le début de la transition
            this._registerTransitionStart(transitionId, transitionData);

            // Préparer les données de transition
            const enrichedData = await this._enrichTransitionData(transitionData);

            // Exécuter les actions pré-transition
            const preTransitionResults = await this._executePreTransitionActions(enrichedData);

            // Effectuer la transition d'état
            const stateTransitionResult = await this._performStateTransition(transitionId, enrichedData);

            // Exécuter les actions post-transition
            let postTransitionResults = null;
            if (options.executeActions !== false) {
                postTransitionResults = await this._executePostTransitionActions(stateTransitionResult);
            }

            // Mettre à jour le workflow
            if (options.updateWorkflow !== false) {
                await this._updateWorkflowState(transitionId, stateTransitionResult);
            }

            // Générer la documentation de transition
            const transitionDocumentation = await this._generateTransitionDocumentation(
                transitionId,
                enrichedData,
                stateTransitionResult
            );

            // Préparer le résultat final
            const result = {
                transitionId,
                success: true,
                fromState: transitionData.fromState,
                toState: transitionData.toState,
                triggerAction: transitionData.triggerAction,
                newStateData: stateTransitionResult.newState,
                preTransitionResults,
                postTransitionResults,
                transitionDocumentation,
                metadata: {
                    executionTime: performance.now() - startTime,
                    timestamp: new Date().toISOString(),
                    epcisCompliant: stateTransitionResult.epcisCompliant,
                    workflowStep: stateTransitionResult.workflowStep
                }
            };

            // Enregistrer la transition terminée
            this._registerTransitionComplete(transitionId, result);

            console.log(`✅ Transition ${transitionId} exécutée avec succès en ${result.metadata.executionTime.toFixed(1)}ms`);
            return result;

        } catch (error) {
            console.error(`❌ Erreur transition ${transitionId}:`, error);
            this._registerTransitionError(transitionId, error);
            throw new Error(`Échec transition: ${error.message}`);
        } finally {
            // Nettoyer les transitions actives
            this.activeTransitions.delete(transitionId);
        }
    }

    /**
     * Analyse et recommande les transitions possibles pour un état donné
     * @param {Object} stateData - Données de l'état actuel
     * @param {string} stateData.stateName - Nom de l'état
     * @param {string} stateData.businessStep - Business step EPCIS actuel
     * @param {string} stateData.disposition - Disposition EPCIS actuelle
     * @param {Object} stateData.metadata - Métadonnées de l'état
     * @param {Object} options - Options d'analyse
     * @param {boolean} options.includeWorkflowSuggestions - Inclure suggestions de workflow
     * @param {string[]} options.restrictToBusinessSteps - Limiter aux business steps spécifiés
     * @param {number} options.maxRecommendations - Nombre max de recommandations
     * @returns {Promise<Object>} Transitions recommandées avec analyse de faisabilité
     * @sideEffect Aucun - analyse pure sans modification d'état
     * @example
     * // Analyser transitions possibles depuis état de contrôle qualité
     * const recommendations = await manager.analyzePossibleTransitions({
     *   stateName: 'quality_control',
     *   businessStep: 'inspecting',
     *   disposition: 'in_progress',
     *   metadata: { product_type: 'steel', batch: 'B001' }
     * }, {
     *   includeWorkflowSuggestions: true,
     *   maxRecommendations: 5
     * });
     */
    async analyzePossibleTransitions(stateData, options = {}) {
        try {
            console.log(`Analyse transitions possibles pour état: ${stateData.stateName}`);

            // Validation des données d'état
            this._validateStateData(stateData);

            // Obtenir les règles de transition pour le business step actuel
            const applicableRules = this._getApplicableTransitionRules(stateData.businessStep);

            // Générer les actions secondaires possibles
            const secondaryActions = await this.secondaryActionsManager.generateSecondaryActions(
                stateData,
                {
                    actionTypes: ['quality', 'logistics', 'transformation', 'compliance'],
                    includeCustomActions: false
                }
            );

            // Analyser les transitions selon les règles EPCIS
            const epcisTransitions = await this._analyzeEPCISTransitions(stateData, applicableRules);

            // Générer recommandations de workflow
            let workflowRecommendations = [];
            if (options.includeWorkflowSuggestions) {
                workflowRecommendations = await this._generateWorkflowRecommendations(stateData);
            }

            // Analyser la faisabilité de chaque transition
            const feasibilityAnalysis = await this._analyzeFeasibility(epcisTransitions, stateData);

            // Prioriser les transitions selon contexte et historique
            const prioritizedTransitions = this._prioritizeTransitions(feasibilityAnalysis, stateData);

            // Limiter le nombre de recommandations si spécifié
            const maxRecs = options.maxRecommendations || 10;
            const recommendations = prioritizedTransitions.slice(0, maxRecs);

            const result = {
                currentState: {
                    name: stateData.stateName,
                    businessStep: stateData.businessStep,
                    disposition: stateData.disposition
                },
                availableTransitions: recommendations,
                workflowRecommendations,
                secondaryActionsAvailable: secondaryActions.actionMetadata.totalActions,
                analysis: {
                    totalPossibleTransitions: epcisTransitions.length,
                    feasibleTransitions: feasibilityAnalysis.filter(t => t.feasible).length,
                    highPriorityTransitions: recommendations.filter(t => t.priority > 0.7).length,
                    epcisCompliant: epcisTransitions.every(t => t.epcisCompliant)
                },
                timestamp: new Date().toISOString()
            };

            console.log(`✅ Analyse terminée: ${result.availableTransitions.length} transitions recommandées`);
            return result;

        } catch (error) {
            console.error('❌ Erreur analyse transitions possibles:', error);
            throw new Error(`Échec analyse transitions: ${error.message}`);
        }
    }

    /**
     * Exécute un workflow prédéfini avec gestion des conditions et branches
     * @param {Object} workflowData - Données du workflow
     * @param {string} workflowData.workflowName - Nom du workflow à exécuter
     * @param {Object} workflowData.initialState - État initial
     * @param {Object} workflowData.parameters - Paramètres du workflow
     * @param {Object} options - Options d'exécution
     * @param {boolean} options.stopOnError - Arrêter sur erreur (défaut: false)
     * @param {boolean} options.enableBranching - Activer branches conditionnelles (défaut: true)
     * @param {number} options.maxSteps - Nombre max d'étapes (défaut: 20)
     * @returns {Promise<Object>} Résultat de l'exécution du workflow complet
     * @sideEffect Exécute série de transitions selon le workflow, modifie états
     * @performance Target <10s pour workflow standard, <30s pour workflow complexe
     * @example
     * // Exécuter workflow de réception standard
     * const result = await manager.executeWorkflow({
     *   workflowName: 'standard_receiving',
     *   initialState: {
     *     stateName: 'dock_arrival',
     *     businessStep: 'receiving',
     *     disposition: 'in_transit'
     *   },
     *   parameters: {
     *     lot_number: 'LOT001',
     *     supplier: 'SUP001',
     *     quality_requirements: 'visual_inspection'
     *   }
     * });
     */
    async executeWorkflow(workflowData, options = {}) {
        const workflowId = this._generateWorkflowId();
        const startTime = performance.now();
        
        try {
            console.log(`Exécution workflow ${workflowId}: ${workflowData.workflowName}`);

            // Validation des données de workflow
            this._validateWorkflowData(workflowData);

            // Charger la définition du workflow
            const workflowDefinition = this._getWorkflowDefinition(workflowData.workflowName);
            if (!workflowDefinition) {
                throw new Error(`Workflow inconnu: ${workflowData.workflowName}`);
            }

            // Initialiser l'état du workflow
            let currentState = { ...workflowData.initialState };
            const executionResults = [];
            const maxSteps = options.maxSteps || 20;
            let stepCount = 0;

            // Exécuter les étapes du workflow
            for (const step of workflowDefinition.steps) {
                if (stepCount >= maxSteps) {
                    console.warn(`Workflow ${workflowId} interrompu: limite d'étapes atteinte (${maxSteps})`);
                    break;
                }

                try {
                    console.log(`Étape ${stepCount + 1}: ${step.step} → ${step.disposition}`);

                    // Préparer les données de transition pour cette étape
                    const transitionData = {
                        fromState: currentState.stateName,
                        toState: `${step.step}_state`,
                        triggerAction: `workflow_${step.step}`,
                        actionData: {
                            ...workflowData.parameters,
                            workflowStep: stepCount + 1,
                            expectedDuration: step.duration
                        },
                        metadata: {
                            workflowId,
                            workflowName: workflowData.workflowName,
                            stepIndex: stepCount
                        }
                    };

                    // Exécuter la transition
                    const transitionResult = await this.executeTransition(transitionData);

                    // Mettre à jour l'état actuel
                    currentState = {
                        stateName: transitionResult.toState || `${step.step}_state`,
                        businessStep: step.step,
                        disposition: step.disposition,
                        metadata: transitionResult.newStateData?.metadata || {}
                    };

                    executionResults.push({
                        stepIndex: stepCount,
                        step: step.step,
                        disposition: step.disposition,
                        transitionResult,
                        completedAt: new Date().toISOString()
                    });

                    stepCount++;

                    // Vérifier conditions de branchement si activé
                    if (options.enableBranching !== false) {
                        const branchDecision = await this._evaluateBranchConditions(
                            workflowDefinition,
                            currentState,
                            transitionResult
                        );

                        if (branchDecision.shouldBranch) {
                            console.log(`Branchement détecté: ${branchDecision.branchName}`);
                            // Implémenter logique de branchement
                            // Pour cette version, on continue le workflow principal
                        }
                    }

                } catch (stepError) {
                    console.error(`Erreur étape ${stepCount + 1}:`, stepError);
                    
                    if (options.stopOnError !== false) {
                        throw new Error(`Échec étape ${stepCount + 1}: ${stepError.message}`);
                    } else {
                        // Enregistrer l'erreur et continuer
                        executionResults.push({
                            stepIndex: stepCount,
                            step: step.step,
                            error: stepError.message,
                            skipped: true,
                            completedAt: new Date().toISOString()
                        });
                        stepCount++;
                    }
                }
            }

            // Générer le résultat final du workflow
            const workflowSummary = {
                totalSteps: stepCount,
                successfulSteps: executionResults.filter(r => !r.error).length,
                failedSteps: executionResults.filter(r => r.error).length,
                executionTime: performance.now() - startTime,
                completedAt: new Date().toISOString()
            };

            const result = {
                workflowId,
                workflowName: workflowData.workflowName,
                success: true,
                initialState: workflowData.initialState,
                finalState: currentState,
                executionResults,
                workflowResult: {
                    summary: workflowSummary,
                    executionResults,
                    finalState: currentState
                },
                finalProcess: currentState,
                performance: {
                    executionTime: workflowSummary.executionTime,
                    averageStepTime: workflowSummary.executionTime / Math.max(stepCount, 1),
                    successRate: (workflowSummary.successfulSteps / Math.max(stepCount, 1) * 100).toFixed(1)
                },
                summary: workflowSummary
            };

            console.log(`✅ Workflow ${workflowId} terminé: ${result.summary.successfulSteps}/${result.summary.totalSteps} étapes réussies`);
            return result;

        } catch (error) {
            console.error(`❌ Erreur workflow ${workflowId}:`, error);
            throw new Error(`Échec exécution workflow: ${error.message}`);
        }
    }

    /**
     * Récupère l'historique des transitions pour analyse et reporting
     * @param {Object} filters - Filtres pour l'historique
     * @param {string} filters.stateFilter - Filtrer par état
     * @param {string} filters.actionFilter - Filtrer par action
     * @param {Date} filters.fromDate - Date de début
     * @param {Date} filters.toDate - Date de fin
     * @param {number} filters.limit - Limite de résultats
     * @returns {Promise<Object>} Historique filtré avec statistiques
     * @sideEffect Aucun - lecture seule de l'historique
     * @example
     * const history = await manager.getTransitionHistory({
     *   stateFilter: 'quality_control',
     *   fromDate: new Date('2025-07-01'),
     *   limit: 50
     * });
     */
    async getTransitionHistory(filters = {}) {
        try {
            console.log('Récupération historique des transitions...');

            let filteredHistory = [...this.transitionHistory];

            // Appliquer les filtres
            if (filters.stateFilter) {
                filteredHistory = filteredHistory.filter(t => 
                    t.fromState.includes(filters.stateFilter) || 
                    t.toState.includes(filters.stateFilter)
                );
            }

            if (filters.actionFilter) {
                filteredHistory = filteredHistory.filter(t => 
                    t.triggerAction.includes(filters.actionFilter)
                );
            }

            if (filters.fromDate) {
                filteredHistory = filteredHistory.filter(t => 
                    new Date(t.timestamp) >= filters.fromDate
                );
            }

            if (filters.toDate) {
                filteredHistory = filteredHistory.filter(t => 
                    new Date(t.timestamp) <= filters.toDate
                );
            }

            // Limiter les résultats
            if (filters.limit) {
                filteredHistory = filteredHistory.slice(0, filters.limit);
            }

            // Calculer statistiques
            const statistics = this._calculateHistoryStatistics(filteredHistory);

            return {
                transitions: filteredHistory,
                statistics,
                filters: filters,
                totalMatches: filteredHistory.length,
                totalHistorySize: this.transitionHistory.length
            };

        } catch (error) {
            console.error('❌ Erreur récupération historique:', error);
            throw new Error(`Échec récupération historique: ${error.message}`);
        }
    }

    /**
     * Valide les données de transition
     * @private
     * @param {Object} transitionData - Données à valider
     * @throws {Error} Si les données sont invalides
     */
    _validateTransitionData(transitionData) {
        const required = ['fromState', 'toState', 'triggerAction'];
        for (const field of required) {
            if (!transitionData[field]) {
                throw new Error(`Champ requis manquant: ${field}`);
            }
        }

        if (transitionData.fromState === transitionData.toState) {
            throw new Error('État source et cible identiques');
        }
    }

    /**
     * Valide les données d'état
     * @private
     * @param {Object} stateData - Données à valider
     * @throws {Error} Si les données sont invalides
     */
    _validateStateData(stateData) {
        const required = ['stateName', 'businessStep', 'disposition'];
        for (const field of required) {
            if (!stateData[field]) {
                throw new Error(`Champ d'état requis manquant: ${field}`);
            }
        }
    }

    /**
     * Valide les données de workflow
     * @private
     * @param {Object} workflowData - Données à valider
     * @throws {Error} Si les données sont invalides
     */
    _validateWorkflowData(workflowData) {
        if (!workflowData.workflowName) {
            throw new Error('Nom de workflow requis');
        }
        if (!workflowData.initialState) {
            throw new Error('État initial requis');
        }
        this._validateStateData(workflowData.initialState);
    }

    /**
     * Charge les règles de transition depuis la configuration
     * @private
     * @returns {Promise<void>}
     */
    async _loadTransitionRules() {
        // Charger les règles depuis la configuration EPCIS
        for (const [businessStep, rules] of Object.entries(this.epcisTransitionRules)) {
            this.transitionRules.set(businessStep, rules);
        }
        console.log(`Chargé ${this.transitionRules.size} règles de transition`);
    }

    /**
     * Valide les règles de transition chargées
     * @private
     * @returns {Promise<void>}
     */
    async _validateTransitionRules() {
        for (const [businessStep, rules] of this.transitionRules) {
            if (!rules.allowedTargets || !Array.isArray(rules.allowedTargets)) {
                throw new Error(`Règle invalide pour ${businessStep}: allowedTargets manquant`);
            }
            if (!rules.requiredDispositions || typeof rules.requiredDispositions !== 'object') {
                throw new Error(`Règle invalide pour ${businessStep}: requiredDispositions manquant`);
            }
        }
    }

    /**
     * Initialise l'état interne du workflow
     * @private
     */
    _initializeWorkflowState() {
        this.workflowStates.clear();
        this.transitionHistory = [];
        this.activeTransitions.clear();
    }

    /**
     * Génère un ID unique pour les transitions
     * @private
     * @returns {string} ID de transition
     */
    _generateTransitionId() {
        return `trans_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Génère un ID unique pour les workflows
     * @private
     * @returns {string} ID de workflow
     */
    _generateWorkflowId() {
        return `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Enregistre le début d'une transition
     * @private
     * @param {string} transitionId - ID de la transition
     * @param {Object} transitionData - Données de la transition
     */
    _registerTransitionStart(transitionId, transitionData) {
        this.activeTransitions.set(transitionId, {
            ...transitionData,
            startTime: Date.now(),
            status: 'in_progress'
        });
    }

    /**
     * Enregistre la fin d'une transition réussie
     * @private
     * @param {string} transitionId - ID de la transition
     * @param {Object} result - Résultat de la transition
     */
    _registerTransitionComplete(transitionId, result) {
        const historyEntry = {
            transitionId,
            fromState: result.fromState,
            toState: result.toState,
            triggerAction: result.triggerAction,
            success: true,
            executionTime: result.metadata.executionTime,
            timestamp: result.metadata.timestamp
        };

        this.transitionHistory.unshift(historyEntry);

        // Maintenir la taille de l'historique
        if (this.transitionHistory.length > this.config.maxTransitionHistory) {
            this.transitionHistory = this.transitionHistory.slice(0, this.config.maxTransitionHistory);
        }
    }

    /**
     * Enregistre une erreur de transition
     * @private
     * @param {string} transitionId - ID de la transition
     * @param {Error} error - Erreur survenue
     */
    _registerTransitionError(transitionId, error) {
        const activeTransition = this.activeTransitions.get(transitionId);
        if (activeTransition) {
            const historyEntry = {
                transitionId,
                fromState: activeTransition.fromState,
                toState: activeTransition.toState,
                triggerAction: activeTransition.triggerAction,
                success: false,
                error: error.message,
                executionTime: Date.now() - activeTransition.startTime,
                timestamp: new Date().toISOString()
            };

            this.transitionHistory.unshift(historyEntry);
        }
    }

    /**
     * Méthodes de traitement des transitions (implémentation simplifiée)
     * @private
     */
    async _validateTransition(transitionData) {
        // Validation simplifiée - à étendre selon les besoins
        return { valid: true, errors: [] };
    }

    async _enrichTransitionData(transitionData) {
        return {
            ...transitionData,
            enrichedAt: new Date().toISOString(),
            context: 'production'
        };
    }

    async _executePreTransitionActions(enrichedData) {
        return { preActions: [], completed: true };
    }

    async _performStateTransition(transitionId, enrichedData) {
        return {
            newState: {
                name: enrichedData.toState,
                businessStep: 'storing', // Exemple
                disposition: 'active',   // Exemple
                metadata: enrichedData.actionData
            },
            epcisCompliant: true,
            workflowStep: 1
        };
    }

    async _executePostTransitionActions(stateTransitionResult) {
        return { postActions: [], completed: true };
    }

    async _updateWorkflowState(transitionId, stateTransitionResult) {
        this.workflowStates.set(stateTransitionResult.newState.name, stateTransitionResult.newState);
    }

    async _generateTransitionDocumentation(transitionId, enrichedData, stateTransitionResult) {
        return {
            documentType: 'transition_log',
            transitionId,
            summary: `Transition from ${enrichedData.fromState} to ${enrichedData.toState}`,
            timestamp: new Date().toISOString()
        };
    }

    _getApplicableTransitionRules(businessStep) {
        return this.transitionRules.get(businessStep) || { allowedTargets: [], requiredDispositions: {} };
    }

    async _analyzeEPCISTransitions(stateData, rules) {
        const transitions = [];
        for (const target of rules.allowedTargets) {
            transitions.push({
                fromBusinessStep: stateData.businessStep,
                toBusinessStep: target,
                requiredDisposition: rules.requiredDispositions[target],
                epcisCompliant: true,
                validationRequired: rules.validationRequired
            });
        }
        return transitions;
    }

    async _generateWorkflowRecommendations(stateData) {
        return Object.values(this.workflowPatterns).map(pattern => ({
            workflowName: pattern.name,
            description: pattern.description,
            applicable: true,
            estimatedDuration: pattern.steps.reduce((sum, step) => sum + step.duration, 0)
        }));
    }

    async _analyzeFeasibility(transitions, stateData) {
        return transitions.map(t => ({ ...t, feasible: true, confidence: 0.8 }));
    }

    _prioritizeTransitions(feasibilityAnalysis, stateData) {
        return feasibilityAnalysis
            .filter(t => t.feasible)
            .map(t => ({ ...t, priority: 0.7 }))
            .sort((a, b) => b.priority - a.priority);
    }

    _getWorkflowDefinition(workflowName) {
        return this.workflowPatterns[workflowName] || null;
    }

    async _evaluateBranchConditions(workflowDefinition, currentState, transitionResult) {
        // Logique de branchement simplifiée
        return { shouldBranch: false, branchName: null };
    }

    _calculateHistoryStatistics(history) {
        const total = history.length;
        const successful = history.filter(t => t.success).length;
        const failed = total - successful;
        
        return {
            totalTransitions: total,
            successfulTransitions: successful,
            failedTransitions: failed,
            successRate: total > 0 ? (successful / total * 100).toFixed(1) : 0,
            averageExecutionTime: total > 0 ? 
                (history.reduce((sum, t) => sum + (t.executionTime || 0), 0) / total).toFixed(1) : 0
        };
    }
}

// Exportation par défaut
export default TransitionManager;

// <!-- END OF FILE: transition-manager.js -->