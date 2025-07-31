// <!-- START OF FILE: workflow-orchestrator.js -->
// FILENAME: workflow-orchestrator.js
// Version: 1.0.0
// Date: 2025-07-30 17:30
// Author: Rolland MELET & Claude Code
// Description: Orchestrateur workflow ProcessMetaLanguage - Intégration complète État-Actions - TASK-B007

/**
 * Orchestrateur central pour l'architecture État-Actions Deux Niveaux
 * Intègre MainActionGenerator, SecondaryActionsManager et TransitionManager
 * @module WorkflowOrchestrator
 * @requires MainActionGenerator
 * @requires SecondaryActionsManager
 * @requires TransitionManager
 * @requires DataExposer
 * @requires NavigationBuilder
 */

import { MainActionGenerator } from './main-action-generator.js';
import { SecondaryActionsManager } from './secondary-actions.js';
import { TransitionManager } from './transition-manager.js';
import { DataExposer } from './data-exposer.js';
import { NavigationBuilder } from './navigation-builder.js';

/**
 * Orchestrateur principal pour workflows ProcessMetaLanguage complets
 * Coordonne l'ensemble de l'architecture État-Actions Deux Niveaux
 * 
 * @class WorkflowOrchestrator
 * @example
 * // Créer orchestrateur workflow complet
 * const orchestrator = new WorkflowOrchestrator();
 * await orchestrator.initialize();
 * 
 * // Créer processus complet avec États-Actions
 * const process = await orchestrator.createCompleteProcess({
 *   objectData: { name: 'Lot-Acier-001', type: 'raw-material' },
 *   initialState: { businessStep: 'receiving', disposition: 'in_transit' },
 *   workflowPattern: 'standard_receiving'
 * });
 */
export class WorkflowOrchestrator {
    /**
     * Initialise l'orchestrateur de workflow
     * @param {Object} options - Options de configuration
     * @param {boolean} options.enableFullValidation - Validation complète EPCIS (défaut: true)
     * @param {boolean} options.enablePerformanceMonitoring - Monitoring performance (défaut: true)
     * @param {number} options.maxConcurrentProcesses - Processus max en parallèle (défaut: 10)
     */
    constructor(options = {}) {
        this.config = {
            enableFullValidation: options.enableFullValidation !== false,
            enablePerformanceMonitoring: options.enablePerformanceMonitoring !== false,
            maxConcurrentProcesses: options.maxConcurrentProcesses || 10,
            defaultTimeout: options.defaultTimeout || 30000,
            enableCaching: options.enableCaching !== false
        };

        // Modules de l'architecture État-Actions
        this.mainActionGenerator = null;
        this.secondaryActionsManager = null;
        this.transitionManager = null;
        this.dataExposer = null;
        this.navigationBuilder = null;

        // État de l'orchestrateur
        this.activeProcesses = new Map();
        this.processHistory = [];
        this.performanceMetrics = {
            processesCreated: 0,
            averageProcessTime: 0,
            successRate: 0,
            totalExecutionTime: 0
        };

        this.isInitialized = false;
    }

    /**
     * Initialise tous les modules de l'architecture
     * @returns {Promise<boolean>} Succès de l'initialisation complète
     * @sideEffect Initialise tous les modules État-Actions Deux Niveaux
     * @example
     * const orchestrator = new WorkflowOrchestrator();
     * await orchestrator.initialize();
     */
    async initialize() {
        try {
            console.log('Initialisation WorkflowOrchestrator...');

            // Initialiser tous les modules dans l'ordre correct
            this.mainActionGenerator = new MainActionGenerator();
            this.secondaryActionsManager = new SecondaryActionsManager();
            this.transitionManager = new TransitionManager();
            this.dataExposer = new DataExposer();
            this.navigationBuilder = new NavigationBuilder();

            // Initialisation en parallèle pour optimiser le temps
            await Promise.all([
                this.mainActionGenerator.initialize(),
                this.secondaryActionsManager.initialize(),
                this.transitionManager.initialize(),
                this.dataExposer.initialize(),
                this.navigationBuilder.initialize()
            ]);

            // Valider l'intégration entre modules
            await this._validateModuleIntegration();

            this.isInitialized = true;
            console.log('✅ WorkflowOrchestrator initialisé avec succès');
            
            return true;
        } catch (error) {
            console.error('❌ Erreur initialisation WorkflowOrchestrator:', error);
            throw new Error(`Échec initialisation WorkflowOrchestrator: ${error.message}`);
        }
    }

    /**
     * Crée un processus ProcessMetaLanguage complet avec État-Actions Deux Niveaux
     * @param {Object} processData - Données du processus à créer
     * @param {Object} processData.objectData - Données de l'objet tracé
     * @param {Object} processData.initialState - État initial
     * @param {string} processData.workflowPattern - Pattern de workflow à utiliser
     * @param {Object} processData.metadata - Métadonnées additionnelles
     * @param {Object} options - Options de création
     * @param {boolean} options.generateFullWorkflow - Générer workflow complet (défaut: true)
     * @param {boolean} options.enableTransitions - Activer transitions automatiques (défaut: true)
     * @param {string[]} options.restrictedActions - Limiter aux types d'actions spécifiés
     * @returns {Promise<Object>} Processus complet avec États, Actions et Transitions
     * @sideEffect Crée et configure un processus complet, l'enregistre dans activeProcesses
     * @performance Target <3s pour processus simple, <10s pour processus complexe
     * @example
     * // Créer processus de réception avec workflow complet
     * const process = await orchestrator.createCompleteProcess({
     *   objectData: {
     *     name: 'Lot-Acier-A001',
     *     type: 'raw-material',
     *     company: '0000001',
     *     product: '000001',
     *     serial: '000001'
     *   },
     *   initialState: {
     *     stateName: 'reception_dock',
     *     businessStep: 'receiving',
     *     disposition: 'in_transit'
     *   },
     *   workflowPattern: 'standard_receiving',
     *   metadata: {
     *     priority: 'high',
     *     expected_completion: '2025-07-30T18:00:00Z'
     *   }
     * });
     */
    async createCompleteProcess(processData, options = {}) {
        const processId = this._generateProcessId();
        const startTime = performance.now();
        
        try {
            console.log(`Création processus complet ${processId}: ${processData.objectData.name}`);

            // Validation des données d'entrée
            this._validateProcessData(processData);

            // Enregistrer le processus comme actif
            this._registerProcessStart(processId, processData);

            // Étape 1: Créer l'objet principal avec ses métadonnées
            const objectResult = await this._createProcessObject(processData.objectData, processId);

            // Étape 2: Créer l'état initial avec action principale
            const initialStateResult = await this._createInitialState(
                processData.initialState,
                objectResult,
                processId
            );

            // Étape 3: Générer action principale pour l'état initial
            const mainActionResult = await this.mainActionGenerator.generateMainAction(
                initialStateResult.stateData,
                objectResult.objectData,
                {
                    includeNavigation: true,
                    includeDataExposition: true,
                    processId
                }
            );

            // Étape 4: Générer actions secondaires disponibles
            const secondaryActionsResult = await this.secondaryActionsManager.generateSecondaryActions(
                initialStateResult.stateData,
                {
                    actionTypes: options.restrictedActions || ['quality', 'logistics', 'transformation', 'compliance'],
                    includeCustomActions: true,
                    processId
                }
            );

            // Étape 5: Analyser transitions possibles
            const transitionsAnalysis = await this.transitionManager.analyzePossibleTransitions(
                initialStateResult.stateData,
                {
                    includeWorkflowSuggestions: true,
                    maxRecommendations: 10
                }
            );

            // Étape 6: Générer workflow complet si demandé
            let workflowPlan = null;
            if (options.generateFullWorkflow !== false && processData.workflowPattern) {
                workflowPlan = await this._generateWorkflowPlan(
                    processData.workflowPattern,
                    initialStateResult.stateData,
                    processData.metadata
                );
            }

            // Étape 7: Créer navigation complète entre composants
            const navigationStructure = await this.navigationBuilder.buildActionNavigation(
                initialStateResult.stateData,
                objectResult.objectData,
                true, // Inclure actions secondaires
                {
                    includeWorkflowNavigation: true,
                    includeTransitionPreviews: true,
                    processId
                }
            );

            // Étape 8: Assembler le processus complet
            const completeProcess = {
                processId,
                processName: `Process_${processData.objectData.name}`,
                objectData: objectResult.objectData,
                
                // Architecture État-Actions Deux Niveaux
                currentState: {
                    ...initialStateResult.stateData,
                    mainAction: mainActionResult.action,
                    secondaryActions: secondaryActionsResult.availableActions,
                    navigation: navigationStructure
                },
                
                // Workflow et transitions
                workflowPlan,
                availableTransitions: transitionsAnalysis.availableTransitions,
                
                // Métadonnées et gestion
                metadata: {
                    ...processData.metadata,
                    createdAt: new Date().toISOString(),
                    createdBy: 'ProcessMetaLanguage',
                    version: '1.0.0',
                    epcisCompliant: this._validateEPCISCompliance([
                        mainActionResult,
                        secondaryActionsResult,
                        transitionsAnalysis
                    ])
                },
                
                // Performance et monitoring
                performance: {
                    creationTime: performance.now() - startTime,
                    componentCounts: {
                        totalActions: 1 + secondaryActionsResult.actionMetadata.totalActions,
                        availableTransitions: transitionsAnalysis.availableTransitions.length,
                        workflowSteps: workflowPlan?.steps?.length || 0
                    }
                }
            };

            // Enregistrer le processus terminé
            this._registerProcessComplete(processId, completeProcess);

            // Mettre à jour les métriques de performance
            this._updatePerformanceMetrics(completeProcess.performance.creationTime);

            console.log(`✅ Processus ${processId} créé avec succès: ${completeProcess.performance.componentCounts.totalActions} actions, ${completeProcess.performance.componentCounts.availableTransitions} transitions`);
            
            return completeProcess;

        } catch (error) {
            console.error(`❌ Erreur création processus ${processId}:`, error);
            this._registerProcessError(processId, error);
            throw new Error(`Échec création processus: ${error.message}`);
        }
    }

    /**
     * Exécute une action (principale ou secondaire) dans le contexte d'un processus
     * @param {Object} actionExecution - Données d'exécution de l'action
     * @param {string} actionExecution.processId - ID du processus
     * @param {string} actionExecution.actionId - ID de l'action à exécuter
     * @param {string} actionExecution.actionType - Type d'action (main|secondary)
     * @param {Object} actionExecution.inputData - Données d'entrée pour l'action
     * @param {Object} options - Options d'exécution
     * @param {boolean} options.autoTransition - Transition automatique après action (défaut: true)
     * @param {boolean} options.validateInputs - Valider les données d'entrée (défaut: true)
     * @returns {Promise<Object>} Résultat de l'exécution avec nouvel état du processus
     * @sideEffect Modifie l'état du processus, peut déclencher transitions automatiques
     * @performance Target <1s pour action simple, <5s pour action complexe avec transition
     * @example
     * // Exécuter action de contrôle qualité
     * const result = await orchestrator.executeAction({
     *   processId: 'process_123',
     *   actionId: 'quality_inspect_001',
     *   actionType: 'secondary',
     *   inputData: {
     *     inspector_id: 'QC001',
     *     quality_criteria: 'visual_inspection',
     *     inspection_result: 'passed',
     *     notes: 'Aucun défaut détecté'
     *   }
     * });
     */
    async executeAction(actionExecution, options = {}) {
        const executionId = this._generateExecutionId();
        const startTime = performance.now();
        
        try {
            console.log(`Exécution action ${executionId}: ${actionExecution.actionId} dans processus ${actionExecution.processId}`);

            // Validation des paramètres
            this._validateActionExecution(actionExecution);

            // Récupérer le processus actif
            const process = this.activeProcesses.get(actionExecution.processId);
            if (!process) {
                throw new Error(`Processus non trouvé: ${actionExecution.processId}`);
            }

            let actionResult = null;

            // Exécuter selon le type d'action
            if (actionExecution.actionType === 'main') {
                // Exécution d'action principale
                actionResult = await this._executeMainAction(
                    actionExecution,
                    process,
                    options
                );
            } else if (actionExecution.actionType === 'secondary') {
                // Exécution d'action secondaire
                actionResult = await this._executeSecondaryAction(
                    actionExecution,
                    process,
                    options
                );
            } else {
                throw new Error(`Type d'action non supporté: ${actionExecution.actionType}`);
            }

            // Mettre à jour l'état du processus
            const updatedProcess = await this._updateProcessState(
                actionExecution.processId,
                actionResult,
                actionExecution
            );

            // Gestion des transitions automatiques si activé
            let transitionResult = null;
            if (options.autoTransition !== false && actionResult.transitionData) {
                transitionResult = await this._handleAutoTransition(
                    updatedProcess,
                    actionResult.transitionData
                );
            }

            // Préparer le résultat final
            const executionResult = {
                executionId,
                processId: actionExecution.processId,
                actionId: actionExecution.actionId,
                actionType: actionExecution.actionType,
                success: true,
                actionResult,
                transitionResult,
                updatedProcess: transitionResult ? transitionResult.updatedProcess : updatedProcess,
                performance: {
                    executionTime: performance.now() - startTime,
                    timestamp: new Date().toISOString()
                }
            };

            console.log(`✅ Action ${executionId} exécutée avec succès en ${executionResult.performance.executionTime.toFixed(1)}ms`);
            return executionResult;

        } catch (error) {
            console.error(`❌ Erreur exécution action ${executionId}:`, error);
            throw new Error(`Échec exécution action: ${error.message}`);
        }
    }

    /**
     * Exécute un workflow complet avec orchestration des transitions
     * @param {Object} workflowExecution - Données d'exécution du workflow
     * @param {string} workflowExecution.processId - ID du processus
     * @param {string} workflowExecution.workflowName - Nom du workflow à exécuter
     * @param {Object} workflowExecution.parameters - Paramètres du workflow
     * @param {Object} options - Options d'exécution
     * @param {boolean} options.stopOnError - Arrêter sur erreur (défaut: false)
     * @param {boolean} options.enableParallelActions - Actions parallèles (défaut: true)
     * @returns {Promise<Object>} Résultat complet de l'exécution du workflow
     * @sideEffect Orchestre série de transitions et actions, modifie état processus
     * @performance Target <30s pour workflow standard, <120s pour workflow complexe
     * @example
     * // Exécuter workflow de réception complet
     * const result = await orchestrator.executeWorkflow({
     *   processId: 'process_123',
     *   workflowName: 'standard_receiving',
     *   parameters: {
     *     quality_requirements: 'full_inspection',
     *     storage_location: 'ZONE_A',
     *     priority: 'high'
     *   }
     * });
     */
    async executeWorkflow(workflowExecution, options = {}) {
        const workflowId = this._generateWorkflowExecutionId();
        const startTime = performance.now();
        
        try {
            console.log(`Exécution workflow ${workflowId}: ${workflowExecution.workflowName} pour processus ${workflowExecution.processId}`);

            // Récupérer le processus
            const process = this.activeProcesses.get(workflowExecution.processId);
            if (!process) {
                throw new Error(`Processus non trouvé: ${workflowExecution.processId}`);
            }

            // Exécuter le workflow via le TransitionManager
            const workflowResult = await this.transitionManager.executeWorkflow({
                workflowName: workflowExecution.workflowName,
                initialState: process.currentState,
                parameters: workflowExecution.parameters
            }, {
                stopOnError: options.stopOnError,
                enableBranching: true
            });

            // Mettre à jour le processus avec le résultat final du workflow
            const finalProcess = await this._updateProcessWithWorkflowResult(
                workflowExecution.processId,
                workflowResult
            );

            const result = {
                workflowId,
                processId: workflowExecution.processId,
                workflowName: workflowExecution.workflowName,
                success: workflowResult.success,
                workflowResult,
                finalProcess,
                performance: {
                    totalExecutionTime: performance.now() - startTime,
                    workflowSteps: workflowResult.summary.totalSteps,
                    successfulSteps: workflowResult.summary.successfulSteps,
                    completedAt: new Date().toISOString()
                }
            };

            console.log(`✅ Workflow ${workflowId} terminé: ${result.performance.successfulSteps}/${result.performance.workflowSteps} étapes réussies`);
            return result;

        } catch (error) {
            console.error(`❌ Erreur workflow ${workflowId}:`, error);
            throw new Error(`Échec exécution workflow: ${error.message}`);
        }
    }

    /**
     * Récupère l'état actuel d'un processus avec toutes ses composantes
     * @param {string} processId - ID du processus
     * @param {Object} options - Options de récupération
     * @param {boolean} options.includeHistory - Inclure historique (défaut: true)
     * @param {boolean} options.includeMetrics - Inclure métriques (défaut: true)
     * @returns {Promise<Object>} État complet du processus
     * @sideEffect Aucun - lecture seule
     * @example
     * const processState = await orchestrator.getProcessState('process_123');
     */
    async getProcessState(processId, options = {}) {
        try {
            const process = this.activeProcesses.get(processId);
            if (!process) {
                throw new Error(`Processus non trouvé: ${processId}`);
            }

            // Enrichir avec données temps réel
            const enrichedState = await this._enrichProcessState(process, options);

            return enrichedState;

        } catch (error) {
            console.error(`❌ Erreur récupération état processus ${processId}:`, error);
            throw new Error(`Échec récupération état: ${error.message}`);
        }
    }

    /**
     * Méthodes privées pour la gestion interne
     * @private
     */
    
    async _validateModuleIntegration() {
        // Vérifier que tous les modules sont correctement initialisés
        const modules = [
            this.mainActionGenerator,
            this.secondaryActionsManager,
            this.transitionManager,
            this.dataExposer,
            this.navigationBuilder
        ];

        for (const module of modules) {
            if (!module || !module.isInitialized) {
                throw new Error('Module non initialisé détecté');
            }
        }

        // Test d'intégration simple
        try {
            // Test création action principale
            const testStateData = {
                stateName: 'test_state',
                businessStep: 'storing',
                disposition: 'active',
                metadata: { test: true }
            };

            const testObjectData = {
                objectName: 'test_object',
                objectType: 'test',
                metadata: { test: true }
            };

            const mainAction = await this.mainActionGenerator.generateMainAction(
                testStateData,
                testObjectData,
                { test: true }
            );

            if (!mainAction || !mainAction.action) {
                throw new Error('Test intégration MainActionGenerator échoué');
            }

            console.log('✅ Test intégration modules réussi');
        } catch (error) {
            throw new Error(`Test intégration échoué: ${error.message}`);
        }
    }

    _validateProcessData(processData) {
        if (!processData.objectData || !processData.initialState) {
            throw new Error('objectData et initialState requis');
        }

        if (!processData.objectData.name || !processData.objectData.type) {
            throw new Error('objectData.name et objectData.type requis');
        }

        if (!processData.initialState.businessStep || !processData.initialState.disposition) {
            throw new Error('initialState.businessStep et initialState.disposition requis');
        }
    }

    _validateActionExecution(actionExecution) {
        const required = ['processId', 'actionId', 'actionType'];
        for (const field of required) {
            if (!actionExecution[field]) {
                throw new Error(`Champ requis manquant: ${field}`);
            }
        }

        if (!['main', 'secondary'].includes(actionExecution.actionType)) {
            throw new Error(`Type d'action invalide: ${actionExecution.actionType}`);
        }
    }

    _generateProcessId() {
        return `process_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    _generateExecutionId() {
        return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    _generateWorkflowExecutionId() {
        return `workflow_exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    _registerProcessStart(processId, processData) {
        this.activeProcesses.set(processId, {
            ...processData,
            status: 'creating',
            startTime: Date.now()
        });
    }

    _registerProcessComplete(processId, completeProcess) {
        this.activeProcesses.set(processId, {
            ...completeProcess,
            status: 'active'
        });

        // Ajouter à l'historique
        this.processHistory.unshift({
            processId,
            processName: completeProcess.processName,
            createdAt: completeProcess.metadata.createdAt,
            creationTime: completeProcess.performance.creationTime
        });

        this.performanceMetrics.processesCreated++;
    }

    _registerProcessError(processId, error) {
        const process = this.activeProcesses.get(processId);
        if (process) {
            process.status = 'error';
            process.error = error.message;
        }
    }

    _updatePerformanceMetrics(creationTime) {
        const totalTime = this.performanceMetrics.totalExecutionTime + creationTime;
        this.performanceMetrics.totalExecutionTime = totalTime;
        this.performanceMetrics.averageProcessTime = totalTime / this.performanceMetrics.processesCreated;
        
        const successfulProcesses = this.processHistory.filter(p => !p.error).length;
        this.performanceMetrics.successRate = (successfulProcesses / this.processHistory.length) * 100;
    }

    _validateEPCISCompliance(results) {
        // Validation simplifiée - tous les modules intégrés supportent EPCIS 2.0
        return results.every(result => result.epcisCompliant !== false);
    }

    // Méthodes de traitement (implémentation simplifiée pour cette version)
    async _createProcessObject(objectData, processId) {
        return {
            objectData: {
                ...objectData,
                objectId: `obj_${processId}`,
                createdAt: new Date().toISOString()
            }
        };
    }

    async _createInitialState(initialState, objectResult, processId) {
        return {
            stateData: {
                ...initialState,
                stateId: `state_${processId}_initial`,
                parentObjectId: objectResult.objectData.objectId,
                createdAt: new Date().toISOString()
            }
        };
    }

    async _generateWorkflowPlan(workflowPattern, stateData, metadata) {
        // Utiliser le TransitionManager pour générer le plan
        const transitions = await this.transitionManager.analyzePossibleTransitions(stateData, {
            includeWorkflowSuggestions: true
        });

        return {
            pattern: workflowPattern,
            steps: transitions.workflowRecommendations,
            estimatedDuration: transitions.workflowRecommendations.reduce(
                (total, wf) => total + (wf.estimatedDuration || 0), 0
            )
        };
    }

    async _executeMainAction(actionExecution, process, options) {
        // Simulation d'exécution d'action principale
        return {
            actionId: actionExecution.actionId,
            success: true,
            result: 'main action executed',
            transitionData: null
        };
    }

    async _executeSecondaryAction(actionExecution, process, options) {
        // Utiliser le SecondaryActionsManager
        return await this.secondaryActionsManager.executeSecondaryAction(
            {
                actionId: actionExecution.actionId,
                actionType: 'quality', // Exemple
                targetState: 'next_state',
                inputData: actionExecution.inputData
            },
            process.currentState,
            options
        );
    }

    async _updateProcessState(processId, actionResult, actionExecution) {
        const process = this.activeProcesses.get(processId);
        
        // Mettre à jour avec le résultat de l'action
        const updatedProcess = {
            ...process,
            lastActionResult: actionResult,
            lastUpdated: new Date().toISOString()
        };

        this.activeProcesses.set(processId, updatedProcess);
        return updatedProcess;
    }

    async _handleAutoTransition(process, transitionData) {
        // Déléguer au TransitionManager
        return await this.transitionManager.executeTransition(transitionData);
    }

    async _updateProcessWithWorkflowResult(processId, workflowResult) {
        const process = this.activeProcesses.get(processId);
        
        const updatedProcess = {
            ...process,
            currentState: workflowResult.finalState,
            workflowResult,
            lastUpdated: new Date().toISOString()
        };

        this.activeProcesses.set(processId, updatedProcess);
        return updatedProcess;
    }

    async _enrichProcessState(process, options) {
        // Enrichir avec données temps réel
        return {
            ...process,
            enrichedAt: new Date().toISOString(),
            runtime: {
                uptime: Date.now() - new Date(process.metadata.createdAt).getTime(),
                status: process.status || 'active'
            }
        };
    }
}

// Exportation par défaut
export default WorkflowOrchestrator;

// <!-- END OF FILE: workflow-orchestrator.js -->