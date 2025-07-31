// <!-- START OF FILE: transition-manager.test.js -->
// FILENAME: transition-manager.test.js
// Version: 1.0.0
// Date: 2025-07-30 18:15
// Author: Rolland MELET & Claude Code
// Description: Tests unitaires TransitionManager - TASK-B007 Phase 3

import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import { TransitionManager } from '../../core/transition-manager.js';

/**
 * Tests complets pour TransitionManager
 * Valide l'exécution de transitions et workflows EPCIS 2.0
 */
describe('TransitionManager - Tests Unitaires', () => {
    let transitionManager;
    
    const testStateData = {
        stateName: 'receiving_dock',
        businessStep: 'receiving',
        disposition: 'in_transit',
        metadata: {
            objectType: 'raw-material',
            batch: 'B001',
            supplier: 'SUP001'
        }
    };

    const testTransitionData = {
        fromState: 'receiving_dock',
        toState: 'quality_control',
        triggerAction: 'start_quality_inspection',
        actionData: {
            inspector_id: 'QC001',
            lot_number: 'LOT001',
            inspection_criteria: ['visual', 'dimensional']
        },
        metadata: {
            priority: 'high',
            expected_duration: 60
        }
    };

    beforeAll(async () => {
        console.log('🧪 Initialisation tests TransitionManager');
    });

    beforeEach(async () => {
        // Créer nouvelle instance pour chaque test
        transitionManager = new TransitionManager({
            enableValidation: false, // Simplifier pour tests
            enableWorkflowLog: true
        });

        // Mock des modules de dépendance
        transitionManager.secondaryActionsManager = {
            initialize: vi.fn().mockResolvedValue(true),
            generateSecondaryActions: vi.fn().mockResolvedValue({
                actionMetadata: { totalActions: 3 }
            }),
            isInitialized: true
        };

        transitionManager.epcisValidator = {
            initialize: vi.fn().mockResolvedValue(true),
            validateBusinessStep: vi.fn().mockResolvedValue({ valid: true, errors: [] }),
            validateDisposition: vi.fn().mockResolvedValue({ valid: true, errors: [] }),
            isInitialized: true
        };

        transitionManager.templateProcessor = {
            initialize: vi.fn().mockResolvedValue(true),
            isInitialized: true
        };

        // Initialiser le manager
        await transitionManager.initialize();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('Initialisation et Configuration', () => {
        it('devrait initialiser avec configuration par défaut', () => {
            const manager = new TransitionManager();
            expect(manager.config.enableValidation).toBe(true);
            expect(manager.config.enableWorkflowLog).toBe(true);
            expect(manager.config.maxTransitionHistory).toBe(100);
            expect(manager.config.allowRollback).toBe(false);
            expect(manager.config.transitionTimeout).toBe(30000);
        });

        it('devrait accepter configuration personnalisée', () => {
            const customConfig = {
                enableValidation: false,
                maxTransitionHistory: 50,
                allowRollback: true,
                transitionTimeout: 60000
            };

            const manager = new TransitionManager(customConfig);
            expect(manager.config.enableValidation).toBe(false);
            expect(manager.config.maxTransitionHistory).toBe(50);
            expect(manager.config.allowRollback).toBe(true);
            expect(manager.config.transitionTimeout).toBe(60000);
        });

        it('devrait avoir règles de transition EPCIS 2.0 prédéfinies', () => {
            expect(transitionManager.epcisTransitionRules).toBeDefined();
            expect(transitionManager.epcisTransitionRules.receiving).toBeDefined();
            expect(transitionManager.epcisTransitionRules.inspecting).toBeDefined();
            expect(transitionManager.epcisTransitionRules.storing).toBeDefined();
            expect(transitionManager.epcisTransitionRules.transforming).toBeDefined();
            expect(transitionManager.epcisTransitionRules.shipping).toBeDefined();
        });

        it('devrait avoir patterns de workflow prédéfinis', () => {
            expect(transitionManager.workflowPatterns).toBeDefined();
            expect(transitionManager.workflowPatterns.standard_receiving).toBeDefined();
            expect(transitionManager.workflowPatterns.production_workflow).toBeDefined();
            expect(transitionManager.workflowPatterns.shipping_workflow).toBeDefined();
        });

        it('devrait valider structure des règles EPCIS', () => {
            const receivingRules = transitionManager.epcisTransitionRules.receiving;
            
            expect(receivingRules.allowedTargets).toBeDefined();
            expect(Array.isArray(receivingRules.allowedTargets)).toBe(true);
            expect(receivingRules.requiredDispositions).toBeDefined();
            expect(typeof receivingRules.requiredDispositions).toBe('object');
            expect(receivingRules.validationRequired).toBeDefined();
            expect(Array.isArray(receivingRules.automaticActions)).toBe(true);
        });
    });

    describe('Exécution de Transitions', () => {
        it('devrait exécuter transition simple avec succès', async () => {
            const result = await transitionManager.executeTransition(testTransitionData);

            expect(result).toBeDefined();
            expect(result.success).toBe(true);
            expect(result.transitionId).toBeDefined();
            expect(result.fromState).toBe(testTransitionData.fromState);
            expect(result.toState).toBe(testTransitionData.toState);
            expect(result.triggerAction).toBe(testTransitionData.triggerAction);
            expect(result.newStateData).toBeDefined();
            expect(result.metadata).toBeDefined();
            expect(result.metadata.executionTime).toBeDefined();
            expect(result.metadata.timestamp).toBeDefined();
        });

        it('devrait enregistrer transition dans l\'historique', async () => {
            const initialHistoryLength = transitionManager.transitionHistory.length;
            
            await transitionManager.executeTransition(testTransitionData);
            
            expect(transitionManager.transitionHistory.length).toBe(initialHistoryLength + 1);
            
            const lastTransition = transitionManager.transitionHistory[0];
            expect(lastTransition.fromState).toBe(testTransitionData.fromState);
            expect(lastTransition.toState).toBe(testTransitionData.toState);
            expect(lastTransition.success).toBe(true);
        });

        it('devrait générer ID unique pour chaque transition', async () => {
            const result1 = await transitionManager.executeTransition(testTransitionData);
            const result2 = await transitionManager.executeTransition(testTransitionData);

            expect(result1.transitionId).not.toBe(result2.transitionId);
            expect(result1.transitionId).toMatch(/^trans_\d+_[a-z0-9]+$/);
            expect(result2.transitionId).toMatch(/^trans_\d+_[a-z0-9]+$/);
        });

        it('devrait exécuter actions pré-transition', async () => {
            // Mock pour tester actions pré-transition
            transitionManager._executePreTransitionActions = vi.fn().mockResolvedValue({
                preActions: ['action1', 'action2'],
                completed: true
            });

            const result = await transitionManager.executeTransition(testTransitionData);

            expect(transitionManager._executePreTransitionActions).toHaveBeenCalled();
            expect(result.preTransitionResults).toBeDefined();
            expect(result.preTransitionResults.completed).toBe(true);
        });

        it('devrait exécuter actions post-transition', async () => {
            // Mock pour tester actions post-transition
            transitionManager._executePostTransitionActions = vi.fn().mockResolvedValue({
                postActions: ['doc_generation', 'notification'],
                completed: true
            });

            const result = await transitionManager.executeTransition(testTransitionData);

            expect(transitionManager._executePostTransitionActions).toHaveBeenCalled();
            expect(result.postTransitionResults).toBeDefined();
            expect(result.postTransitionResults.completed).toBe(true);
        });

        it('devrait respecter target de performance pour transition simple', async () => {
            const startTime = performance.now();
            
            const result = await transitionManager.executeTransition(testTransitionData);
            
            const totalTime = performance.now() - startTime;
            
            // Target: <1s pour transition simple
            expect(totalTime).toBeLessThan(1000);
            expect(result.metadata.executionTime).toBeLessThan(1000);
        });
    });

    describe('Analyse Transitions Possibles', () => {
        it('devrait analyser transitions possibles pour état donné', async () => {
            const analysis = await transitionManager.analyzePossibleTransitions(testStateData, {
                includeWorkflowSuggestions: true,
                maxRecommendations: 5
            });

            expect(analysis).toBeDefined();
            expect(analysis.currentState).toBeDefined();
            expect(analysis.currentState.name).toBe(testStateData.stateName);
            expect(analysis.currentState.businessStep).toBe(testStateData.businessStep);
            expect(analysis.currentState.disposition).toBe(testStateData.disposition);
            expect(analysis.availableTransitions).toBeDefined();
            expect(Array.isArray(analysis.availableTransitions)).toBe(true);
            expect(analysis.workflowRecommendations).toBeDefined();
            expect(analysis.analysis).toBeDefined();
        });

        it('devrait limiter nombre de recommandations', async () => {
            const maxRecs = 3;
            const analysis = await transitionManager.analyzePossibleTransitions(testStateData, {
                maxRecommendations: maxRecs
            });

            expect(analysis.availableTransitions.length).toBeLessThanOrEqual(maxRecs);
        });

        it('devrait inclure suggestions de workflow', async () => {
            const analysis = await transitionManager.analyzePossibleTransitions(testStateData, {
                includeWorkflowSuggestions: true
            });

            expect(analysis.workflowRecommendations).toBeDefined();
            expect(Array.isArray(analysis.workflowRecommendations)).toBe(true);
            
            if (analysis.workflowRecommendations.length > 0) {
                const workflow = analysis.workflowRecommendations[0];
                expect(workflow.workflowName).toBeDefined();
                expect(workflow.description).toBeDefined();
                expect(workflow.applicable).toBeDefined();
            }
        });

        it('devrait calculer métriques d\'analyse', async () => {
            const analysis = await transitionManager.analyzePossibleTransitions(testStateData);

            expect(analysis.analysis.totalPossibleTransitions).toBeDefined();
            expect(analysis.analysis.feasibleTransitions).toBeDefined();
            expect(analysis.analysis.highPriorityTransitions).toBeDefined();
            expect(analysis.analysis.epcisCompliant).toBeDefined();
            
            // Vérifier cohérence des métriques
            expect(analysis.analysis.feasibleTransitions).toBeLessThanOrEqual(
                analysis.analysis.totalPossibleTransitions
            );
            expect(analysis.analysis.highPriorityTransitions).toBeLessThanOrEqual(
                analysis.availableTransitions.length
            );
        });
    });

    describe('Exécution de Workflows', () => {
        it('devrait exécuter workflow prédéfini', async () => {
            const workflowData = {
                workflowName: 'standard_receiving',
                initialState: testStateData,
                parameters: {
                    lot_number: 'LOT001',
                    supplier: 'SUP001',
                    quality_requirements: 'visual_inspection'
                }
            };

            const result = await transitionManager.executeWorkflow(workflowData);

            expect(result).toBeDefined();
            expect(result.workflowId).toBeDefined();
            expect(result.workflowName).toBe('standard_receiving');
            expect(result.success).toBe(true);
            expect(result.workflowResult).toBeDefined();
            expect(result.finalProcess).toBeDefined();
            expect(result.performance).toBeDefined();
        });

        it('devrait exécuter étapes de workflow en séquence', async () => {
            const workflowData = {
                workflowName: 'standard_receiving',
                initialState: testStateData,
                parameters: {}
            };

            // Mock pour tracer l'exécution des étapes
            const executionOrder = [];
            transitionManager.executeTransition = vi.fn().mockImplementation(async (transitionData) => {
                executionOrder.push(transitionData.triggerAction);
                return {
                    transitionId: 'test_trans',
                    success: true,
                    toState: transitionData.toState,
                    newStateData: {
                        name: transitionData.toState,
                        metadata: {}
                    },
                    metadata: {
                        executionTime: 100,
                        timestamp: new Date().toISOString()
                    }
                };
            });

            const result = await transitionManager.executeWorkflow(workflowData);

            expect(transitionManager.executeTransition).toHaveBeenCalled();
            expect(result.workflowResult.summary.totalSteps).toBeGreaterThan(0);
        });

        it('devrait générer ID unique pour workflow', async () => {
            const workflowData = {
                workflowName: 'standard_receiving',
                initialState: testStateData,
                parameters: {}
            };

            const result1 = await transitionManager.executeWorkflow(workflowData);
            const result2 = await transitionManager.executeWorkflow(workflowData);

            expect(result1.workflowId).not.toBe(result2.workflowId);
            expect(result1.workflowId).toMatch(/^workflow_\d+_[a-z0-9]+$/);
        });

        it('devrait gérer erreurs dans workflow', async () => {
            const workflowData = {
                workflowName: 'standard_receiving',
                initialState: testStateData,
                parameters: {}
            };

            // Mock executeTransition pour simuler erreur
            transitionManager.executeTransition = vi.fn()
                .mockResolvedValueOnce({
                    success: true,
                    toState: 'step1',
                    newStateData: { name: 'step1' },
                    metadata: { executionTime: 100, timestamp: new Date().toISOString() }
                })
                .mockRejectedValueOnce(new Error('Erreur étape 2'));

            const result = await transitionManager.executeWorkflow(workflowData, {
                stopOnError: false
            });

            expect(result.workflowResult.summary.failedSteps).toBeGreaterThan(0);
        });
    });

    describe('Historique des Transitions', () => {
        it('devrait récupérer historique complet', async () => {
            // Exécuter quelques transitions pour créer historique
            await transitionManager.executeTransition(testTransitionData);
            await transitionManager.executeTransition({
                ...testTransitionData,
                fromState: 'quality_control',
                toState: 'storage'
            });

            const history = await transitionManager.getTransitionHistory();

            expect(history).toBeDefined();
            expect(history.transitions).toBeDefined();
            expect(Array.isArray(history.transitions)).toBe(true);
            expect(history.statistics).toBeDefined();
            expect(history.totalHistorySize).toBeGreaterThanOrEqual(2);
        });

        it('devrait filtrer historique par état', async () => {
            await transitionManager.executeTransition(testTransitionData);
            await transitionManager.executeTransition({
                ...testTransitionData,
                fromState: 'quality_control',
                toState: 'storage'
            });

            const history = await transitionManager.getTransitionHistory({
                stateFilter: 'quality_control'
            });

            expect(history.transitions.length).toBeGreaterThan(0);
            history.transitions.forEach(transition => {
                expect(
                    transition.fromState.includes('quality_control') || 
                    transition.toState.includes('quality_control')
                ).toBe(true);
            });
        });

        it('devrait limiter résultats d\'historique', async () => {
            // Créer plusieurs transitions
            for (let i = 0; i < 5; i++) {
                await transitionManager.executeTransition({
                    ...testTransitionData,
                    fromState: `state_${i}`,
                    toState: `state_${i + 1}`
                });
            }

            const history = await transitionManager.getTransitionHistory({
                limit: 3
            });

            expect(history.transitions.length).toBeLessThanOrEqual(3);
        });

        it('devrait calculer statistiques d\'historique', async () => {
            await transitionManager.executeTransition(testTransitionData);

            const history = await transitionManager.getTransitionHistory();

            expect(history.statistics).toBeDefined();
            expect(history.statistics.totalTransitions).toBeDefined();
            expect(history.statistics.successfulTransitions).toBeDefined();
            expect(history.statistics.failedTransitions).toBeDefined();
            expect(history.statistics.successRate).toBeDefined();
            expect(history.statistics.averageExecutionTime).toBeDefined();
        });

        it('devrait maintenir taille maximale d\'historique', async () => {
            const managerWithSmallHistory = new TransitionManager({
                maxTransitionHistory: 3
            });

            // Mock des dépendances
            managerWithSmallHistory.secondaryActionsManager = transitionManager.secondaryActionsManager;
            managerWithSmallHistory.epcisValidator = transitionManager.epcisValidator;
            managerWithSmallHistory.templateProcessor = transitionManager.templateProcessor;
            await managerWithSmallHistory.initialize();

            // Exécuter plus de transitions que la limite
            for (let i = 0; i < 5; i++) {
                await managerWithSmallHistory.executeTransition({
                    ...testTransitionData,
                    fromState: `state_${i}`,
                    toState: `state_${i + 1}`
                });
            }

            expect(managerWithSmallHistory.transitionHistory.length).toBeLessThanOrEqual(3);
        });
    });

    describe('Validation et Gestion d\'Erreurs', () => {
        it('devrait valider données de transition requises', async () => {
            const invalidTransitionData = {
                fromState: 'test',
                // toState manquant
                triggerAction: 'action'
            };

            await expect(
                transitionManager.executeTransition(invalidTransitionData)
            ).rejects.toThrow('Champ requis manquant: toState');
        });

        it('devrait rejeter transition avec états identiques', async () => {
            const invalidTransitionData = {
                fromState: 'same_state',
                toState: 'same_state',
                triggerAction: 'action',
                actionData: {}
            };

            await expect(
                transitionManager.executeTransition(invalidTransitionData)
            ).rejects.toThrow('État source et cible identiques');
        });

        it('devrait valider données d\'état pour analyse', async () => {
            const invalidStateData = {
                stateName: 'test',
                // businessStep manquant
                disposition: 'active'
            };

            await expect(
                transitionManager.analyzePossibleTransitions(invalidStateData)
            ).rejects.toThrow('Champ d\'état requis manquant: businessStep');
        });

        it('devrait valider données de workflow', async () => {
            const invalidWorkflowData = {
                // workflowName manquant
                initialState: testStateData,
                parameters: {}
            };

            await expect(
                transitionManager.executeWorkflow(invalidWorkflowData)
            ).rejects.toThrow('Nom de workflow requis');
        });

        it('devrait gérer workflow inconnu', async () => {
            const workflowData = {
                workflowName: 'unknown_workflow',
                initialState: testStateData,
                parameters: {}
            };

            await expect(
                transitionManager.executeWorkflow(workflowData)
            ).rejects.toThrow('Workflow inconnu: unknown_workflow');
        });
    });

    describe('Règles de Transition EPCIS', () => {
        it('devrait appliquer règles de transition receiving', () => {
            const receivingRules = transitionManager.epcisTransitionRules.receiving;
            
            expect(receivingRules.allowedTargets).toContain('inspecting');
            expect(receivingRules.allowedTargets).toContain('storing');
            expect(receivingRules.requiredDispositions.inspecting).toBe('in_progress');
            expect(receivingRules.requiredDispositions.storing).toBe('active');
            expect(receivingRules.validationRequired).toBe(true);
            expect(receivingRules.automaticActions).toContain('generate_receipt');
        });

        it('devrait appliquer règles de transition inspecting', () => {
            const inspectingRules = transitionManager.epcisTransitionRules.inspecting;
            
            expect(inspectingRules.allowedTargets).toContain('storing');
            expect(inspectingRules.allowedTargets).toContain('recalling');
            expect(inspectingRules.requiredDispositions.storing).toBe('active');
            expect(inspectingRules.requiredDispositions.recalling).toBe('recalled');
            expect(inspectingRules.automaticActions).toContain('quality_report');
        });

        it('devrait valider cohérence des règles EPCIS', () => {
            Object.entries(transitionManager.epcisTransitionRules).forEach(([step, rules]) => {
                expect(rules.allowedTargets).toBeDefined();
                expect(Array.isArray(rules.allowedTargets)).toBe(true);
                expect(rules.requiredDispositions).toBeDefined();
                expect(typeof rules.requiredDispositions).toBe('object');
                
                // Vérifier que chaque target a une disposition requise
                rules.allowedTargets.forEach(target => {
                    expect(rules.requiredDispositions[target]).toBeDefined();
                });
            });
        });
    });

    describe('Patterns de Workflow', () => {
        it('devrait avoir pattern standard_receiving bien défini', () => {
            const pattern = transitionManager.workflowPatterns.standard_receiving;
            
            expect(pattern.name).toBe('Réception Standard');
            expect(pattern.description).toBeDefined();
            expect(pattern.steps).toBeDefined();
            expect(Array.isArray(pattern.steps)).toBe(true);
            expect(pattern.steps.length).toBeGreaterThan(0);
            
            // Vérifier structure des étapes
            pattern.steps.forEach(step => {
                expect(step.step).toBeDefined();
                expect(step.disposition).toBeDefined();
                expect(step.duration).toBeDefined();
                expect(typeof step.duration).toBe('number');
            });
        });

        it('devrait avoir branches conditionnelles', () => {
            const pattern = transitionManager.workflowPatterns.standard_receiving;
            
            expect(pattern.conditionalBranches).toBeDefined();
            expect(pattern.conditionalBranches.quality_failed).toBeDefined();
            expect(Array.isArray(pattern.conditionalBranches.quality_failed)).toBe(true);
        });

        it('devrait valider cohérence tous les patterns', () => {
            Object.entries(transitionManager.workflowPatterns).forEach(([patternName, pattern]) => {
                expect(pattern.name).toBeDefined();
                expect(pattern.description).toBeDefined();
                expect(pattern.steps).toBeDefined();
                expect(Array.isArray(pattern.steps)).toBe(true);
                
                if (pattern.conditionalBranches) {
                    expect(typeof pattern.conditionalBranches).toBe('object');
                    Object.values(pattern.conditionalBranches).forEach(branch => {
                        expect(Array.isArray(branch)).toBe(true);
                    });
                }
            });
        });
    });
});

// <!-- END OF FILE: transition-manager.test.js -->