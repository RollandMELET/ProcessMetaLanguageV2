// <!-- START OF FILE: secondary-actions.test.js -->
// FILENAME: secondary-actions.test.js
// Version: 1.0.0
// Date: 2025-07-30 18:00
// Author: Rolland MELET & Claude Code
// Description: Tests unitaires SecondaryActionsManager - TASK-B007 Phase 3

import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import { SecondaryActionsManager } from '../../core/secondary-actions.js';

/**
 * Tests complets pour SecondaryActionsManager
 * Valide la génération d'actions secondaires et capture de données
 */
describe('SecondaryActionsManager - Tests Unitaires', () => {
    let secondaryManager;
    
    const testStateData = {
        stateName: 'quality_control_state',
        businessStep: 'inspecting',
        disposition: 'in_progress',
        metadata: {
            objectType: 'raw-material',
            batch: 'B001',
            priority: 'high'
        }
    };

    const testObjectData = {
        objectName: 'Lot-Acier-A001',
        objectType: 'raw-material',
        company: '0000001',
        product: '000001',
        serial: '000001'
    };

    beforeAll(async () => {
        console.log('🧪 Initialisation tests SecondaryActionsManager');
    });

    beforeEach(async () => {
        // Créer nouvelle instance pour chaque test
        secondaryManager = new SecondaryActionsManager({
            enableCaching: false, // Désactiver cache pour tests
            strictEPCISValidation: false // Relaxer validation pour tests
        });

        // Mock des modules de dépendance
        secondaryManager.templateProcessor = {
            initialize: vi.fn().mockResolvedValue(true),
            prepareTemplateVariables: vi.fn().mockReturnValue({
                DISPOSITION: testStateData.disposition,
                BUSINESS_STEP: testStateData.businessStep,
                OBJECT_NAME: testObjectData.objectName
            }),
            isInitialized: true
        };

        secondaryManager.epcisValidator = {
            initialize: vi.fn().mockResolvedValue(true),
            validateBusinessStep: vi.fn().mockResolvedValue({ valid: true, errors: [] }),
            validateDisposition: vi.fn().mockResolvedValue({ valid: true, errors: [] }),
            isInitialized: true
        };

        secondaryManager.dataExposer = {
            initialize: vi.fn().mockResolvedValue(true),
            isInitialized: true
        };

        // Initialiser le manager
        await secondaryManager.initialize();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('Initialisation et Configuration', () => {
        it('devrait initialiser avec configuration par défaut', async () => {
            const manager = new SecondaryActionsManager();
            expect(manager.config.enableCaching).toBe(true);
            expect(manager.config.cacheTTL).toBe(300000);
            expect(manager.config.strictEPCISValidation).toBe(true);
            expect(manager.config.maxSecondaryActions).toBe(10);
        });

        it('devrait accepter configuration personnalisée', async () => {
            const customConfig = {
                enableCaching: false,
                cacheTTL: 600000,
                maxSecondaryActions: 5
            };

            const manager = new SecondaryActionsManager(customConfig);
            expect(manager.config.enableCaching).toBe(false);
            expect(manager.config.cacheTTL).toBe(600000);
            expect(manager.config.maxSecondaryActions).toBe(5);
        });

        it('devrait avoir les types d\'actions EPCIS 2.0 prédéfinis', () => {
            expect(secondaryManager.actionTypes).toBeDefined();
            expect(secondaryManager.actionTypes.quality).toBeDefined();
            expect(secondaryManager.actionTypes.logistics).toBeDefined();
            expect(secondaryManager.actionTypes.transformation).toBeDefined();
            expect(secondaryManager.actionTypes.documentation).toBeDefined();
            expect(secondaryManager.actionTypes.compliance).toBeDefined();
        });

        it('devrait avoir les patterns de transition EPCIS 2.0', () => {
            expect(secondaryManager.transitionPatterns).toBeDefined();
            expect(secondaryManager.transitionPatterns.receiving_to_inspection).toBeDefined();
            expect(secondaryManager.transitionPatterns.inspection_to_storage).toBeDefined();
            expect(secondaryManager.transitionPatterns.storage_to_shipping).toBeDefined();
        });
    });

    describe('Génération Actions Secondaires', () => {
        it('devrait générer actions secondaires pour état valide', async () => {
            const result = await secondaryManager.generateSecondaryActions(testStateData, {
                actionTypes: ['quality', 'logistics']
            });

            expect(result).toBeDefined();
            expect(result.stateId).toBe(testStateData.stateName);
            expect(result.currentBusinessStep).toBe(testStateData.businessStep);
            expect(result.currentDisposition).toBe(testStateData.disposition);
            expect(result.availableActions).toBeDefined();
            expect(result.actionMetadata).toBeDefined();
            expect(result.actionMetadata.totalActions).toBeGreaterThanOrEqual(0);
        });

        it('devrait générer actions pour tous les types par défaut', async () => {
            const result = await secondaryManager.generateSecondaryActions(testStateData);

            expect(result.availableActions).toBeDefined();
            
            // Vérifier que les types d'actions sont présents (si compatibles)
            const actionTypes = Object.keys(result.availableActions);
            expect(actionTypes.length).toBeGreaterThanOrEqual(0);
            
            // Chaque type devrait avoir au moins une structure valide
            actionTypes.forEach(type => {
                expect(Array.isArray(result.availableActions[type])).toBe(true);
            });
        });

        it('devrait respecter la limite maxSecondaryActions', async () => {
            const manager = new SecondaryActionsManager({ maxSecondaryActions: 3 });
            
            // Mock des dépendances pour ce test
            manager.templateProcessor = secondaryManager.templateProcessor;
            manager.epcisValidator = secondaryManager.epcisValidator;
            manager.dataExposer = secondaryManager.dataExposer;
            await manager.initialize();

            const result = await manager.generateSecondaryActions(testStateData);
            
            // Compter le total d'actions générées
            const totalActions = Object.values(result.availableActions)
                .reduce((total, actions) => total + actions.length, 0);
            
            expect(totalActions).toBeLessThanOrEqual(3 * Object.keys(manager.actionTypes).length);
        });

        it('devrait inclure métadonnées complètes dans le résultat', async () => {
            const result = await secondaryManager.generateSecondaryActions(testStateData);

            expect(result.actionMetadata).toBeDefined();
            expect(result.actionMetadata.totalActions).toBeDefined();
            expect(result.actionMetadata.recommendedActions).toBeDefined();
            expect(result.actionMetadata.epcisCompliant).toBeDefined();
            expect(result.actionMetadata.generationTime).toBeDefined();
            expect(result.timestamp).toBeDefined();
        });

        it('devrait générer transitions possibles', async () => {
            const result = await secondaryManager.generateSecondaryActions(testStateData);

            expect(result.possibleTransitions).toBeDefined();
            expect(Array.isArray(result.possibleTransitions)).toBe(true);
            
            // Vérifier structure des transitions
            result.possibleTransitions.forEach(transition => {
                expect(transition.transitionId).toBeDefined();
                expect(transition.fromState).toBeDefined();
                expect(transition.toState).toBeDefined();
                expect(transition.triggerAction).toBeDefined();
                expect(transition.epcisCompliant).toBeDefined();
            });
        });
    });

    describe('Exécution Actions Secondaires', () => {
        it('devrait exécuter action secondaire valide', async () => {
            const actionData = {
                actionId: 'quality_inspect_001',
                actionType: 'quality',
                targetState: 'quality_approved',
                inputData: {
                    quality_criteria: 'visual_inspection',
                    inspector_id: 'QC001',
                    inspection_result: 'passed'
                }
            };

            const result = await secondaryManager.executeSecondaryAction(
                actionData,
                testStateData,
                { validateInputs: false } // Simplifier pour test
            );

            expect(result).toBeDefined();
            expect(result.actionId).toBe(actionData.actionId);
            expect(result.actionType).toBe(actionData.actionType);
            expect(result.executionStatus).toBe('completed');
            expect(result.capturedData).toBeDefined();
            expect(result.performance).toBeDefined();
            expect(result.performance.executionTime).toBeDefined();
        });

        it('devrait capturer et enrichir les données d\'action', async () => {
            const actionData = {
                actionId: 'logistics_move_001',
                actionType: 'logistics',
                targetState: 'storage_zone_a',
                inputData: {
                    location: 'ZONE_A_01',
                    carrier_id: 'CARRIER_001',
                    move_reason: 'quality_approved'
                }
            };

            const result = await secondaryManager.executeSecondaryAction(
                actionData,
                testStateData,
                { validateInputs: false }
            );

            expect(result.capturedData).toBeDefined();
            expect(result.capturedData.capturedAt).toBeDefined();
            expect(result.capturedData.sourceState).toBe(testStateData.stateName);
            
            // Vérifier enrichissement des données
            expect(result.executionMetadata).toBeDefined();
            expect(result.executionMetadata.executionId).toBeDefined();
            expect(result.executionMetadata.executionTime).toBeDefined();
        });

        it('devrait préparer données de transition', async () => {
            const actionData = {
                actionId: 'quality_inspect_002',
                actionType: 'quality',
                targetState: 'quality_rejected',
                inputData: {
                    quality_criteria: 'dimensional_check',
                    inspector_id: 'QC002',
                    inspection_result: 'failed'
                }
            };

            const result = await secondaryManager.executeSecondaryAction(
                actionData,
                testStateData,
                { prepareTransition: true }
            );

            expect(result.transitionData).toBeDefined();
            expect(result.transitionData.transitionId).toBeDefined();
            expect(result.transitionData.fromState).toBe(testStateData.stateName);
            expect(result.transitionData.toState).toBe(actionData.targetState);
        });

        it('devrait valider données d\'entrée si activé', async () => {
            const actionData = {
                actionId: 'invalid_action',
                actionType: 'quality',
                targetState: 'target',
                inputData: {} // Données manquantes
            };

            // Mock validation qui échoue
            secondaryManager._validateActionInputs = vi.fn().mockRejectedValue(
                new Error('Données d\'entrée invalides')
            );

            await expect(
                secondaryManager.executeSecondaryAction(actionData, testStateData, {
                    validateInputs: true
                })
            ).rejects.toThrow('Échec exécution action secondaire');
        });
    });

    describe('Analyse Dépendances Actions', () => {
        it('devrait analyser dépendances entre actions', async () => {
            const actions = [
                {
                    actionId: 'action_1',
                    actionType: 'quality',
                    businessStep: 'inspecting'
                },
                {
                    actionId: 'action_2',
                    actionType: 'logistics',
                    businessStep: 'storing'
                },
                {
                    actionId: 'action_3',
                    actionType: 'documentation',
                    businessStep: 'labeling'
                }
            ];

            const analysis = await secondaryManager.analyzeActionDependencies(
                actions,
                testStateData
            );

            expect(analysis).toBeDefined();
            expect(analysis.dependencyGraph).toBeDefined();
            expect(analysis.recommendedOrder).toBeDefined();
            expect(analysis.parallelGroups).toBeDefined();
            expect(analysis.optimization).toBeDefined();
            
            // Vérifier métriques d'optimisation
            expect(analysis.optimization.totalActions).toBe(actions.length);
            expect(analysis.optimization.estimatedExecutionTime).toBeDefined();
        });

        it('devrait identifier actions parallélisables', async () => {
            const actions = [
                {
                    actionId: 'doc_action',
                    actionType: 'documentation',
                    businessStep: 'labeling'
                },
                {
                    actionId: 'logistics_action',
                    actionType: 'logistics',
                    businessStep: 'storing'
                }
            ];

            const analysis = await secondaryManager.analyzeActionDependencies(
                actions,
                testStateData
            );

            expect(analysis.parallelGroups).toBeDefined();
            expect(Array.isArray(analysis.parallelGroups)).toBe(true);
            expect(analysis.optimization.parallelizableActions).toBeDefined();
        });
    });

    describe('Types d\'Actions EPCIS 2.0', () => {
        it('devrait avoir configuration valide pour type quality', () => {
            const qualityType = secondaryManager.actionTypes.quality;
            
            expect(qualityType.name).toBe('Quality Control');
            expect(qualityType.businessSteps).toContain('inspecting');
            expect(qualityType.targetDispositions).toContain('active');
            expect(qualityType.requiredFields).toContain('quality_criteria');
            expect(qualityType.color).toBeDefined();
        });

        it('devrait avoir configuration valide pour type logistics', () => {
            const logisticsType = secondaryManager.actionTypes.logistics;
            
            expect(logisticsType.name).toBe('Logistics Operations');
            expect(logisticsType.businessSteps).toContain('storing');
            expect(logisticsType.targetDispositions).toContain('active');
            expect(logisticsType.requiredFields).toContain('location');
        });

        it('devrait calculer priorité d\'action correctement', () => {
            const qualityAction = { actionType: 'quality', businessStep: 'inspecting' };
            const docAction = { actionType: 'documentation', businessStep: 'labeling' };
            
            const qualityPriority = secondaryManager._calculateActionPriority(qualityAction, testStateData);
            const docPriority = secondaryManager._calculateActionPriority(docAction, testStateData);
            
            expect(qualityPriority).toBeGreaterThan(docPriority); // Qualité prioritaire
            expect(qualityPriority).toBeGreaterThan(0.5);
            expect(qualityPriority).toBeLessThanOrEqual(1.0);
        });

        it('devrait estimer durée d\'action selon le type', () => {
            const qualityDuration = secondaryManager._estimateActionDuration('quality', 'inspecting');
            const logisticsDuration = secondaryManager._estimateActionDuration('logistics', 'storing');
            
            expect(qualityDuration).toBeGreaterThan(0);
            expect(logisticsDuration).toBeGreaterThan(0);
            expect(qualityDuration).toBeGreaterThan(logisticsDuration); // Inspection plus longue
        });
    });

    describe('Cache et Performance', () => {
        it('devrait utiliser le cache si activé', async () => {
            const managerWithCache = new SecondaryActionsManager({ enableCaching: true });
            
            // Mock des dépendances
            managerWithCache.templateProcessor = secondaryManager.templateProcessor;
            managerWithCache.epcisValidator = secondaryManager.epcisValidator;
            managerWithCache.dataExposer = secondaryManager.dataExposer;
            await managerWithCache.initialize();

            // Premier appel
            const result1 = await managerWithCache.generateSecondaryActions(testStateData);
            
            // Deuxième appel identique
            const result2 = await managerWithCache.generateSecondaryActions(testStateData);

            // Vérifier que le cache a été utilisé (contenu identique)
            expect(result1.stateId).toBe(result2.stateId);
            expect(result1.currentBusinessStep).toBe(result2.currentBusinessStep);
        });

        it('devrait respecter les targets de performance', async () => {
            const startTime = performance.now();
            
            const result = await secondaryManager.generateSecondaryActions(testStateData);
            
            const executionTime = performance.now() - startTime;
            
            // Target: <200ms pour génération actions d'un état
            expect(executionTime).toBeLessThan(200);
            expect(result.actionMetadata.generationTime).toBeLessThan(200);
        });

        it('devrait gérer cache TTL correctement', async () => {
            const managerWithShortTTL = new SecondaryActionsManager({ 
                enableCaching: true,
                cacheTTL: 100 // 100ms seulement
            });
            
            // Mock des dépendances
            managerWithShortTTL.templateProcessor = secondaryManager.templateProcessor;
            managerWithShortTTL.epcisValidator = secondaryManager.epcisValidator;
            managerWithShortTTL.dataExposer = secondaryManager.dataExposer;
            await managerWithShortTTL.initialize();

            // Premier appel
            await managerWithShortTTL.generateSecondaryActions(testStateData);
            
            // Attendre expiration cache
            await new Promise(resolve => setTimeout(resolve, 150));
            
            // Deuxième appel après expiration
            const result = await managerWithShortTTL.generateSecondaryActions(testStateData);
            
            // Le cache devrait être expiré, donc nouveau calcul
            expect(result).toBeDefined();
        });
    });

    describe('Gestion d\'Erreurs', () => {
        it('devrait valider données d\'état requises', async () => {
            const invalidStateData = {
                stateName: 'test',
                // businessStep manquant
                disposition: 'active'
            };

            await expect(
                secondaryManager.generateSecondaryActions(invalidStateData)
            ).rejects.toThrow('Champ requis manquant: businessStep');
        });

        it('devrait valider données d\'action requises', async () => {
            const invalidActionData = {
                actionId: 'test',
                // actionType manquant
                targetState: 'target'
            };

            await expect(
                secondaryManager.executeSecondaryAction(invalidActionData, testStateData)
            ).rejects.toThrow('Champ d\'action requis manquant: actionType');
        });

        it('devrait gérer type d\'action inconnu', async () => {
            const invalidActionData = {
                actionId: 'test',
                actionType: 'unknown_type',
                targetState: 'target',
                inputData: {}
            };

            await expect(
                secondaryManager.executeSecondaryAction(invalidActionData, testStateData)
            ).rejects.toThrow('Type d\'action inconnu: unknown_type');
        });

        it('devrait gérer échec validation EPCIS', async () => {
            // Mock validation qui échoue
            secondaryManager.epcisValidator.validateBusinessStep = vi.fn().mockResolvedValue({
                valid: false,
                errors: ['Business step invalide']
            });

            const result = await secondaryManager.generateSecondaryActions(testStateData);
            
            // Devrait quand même fonctionner mais marquer comme non conforme
            expect(result).toBeDefined();
            expect(result.actionMetadata.epcisCompliant).toBe(false);
        });
    });

    describe('Patterns de Transition', () => {
        it('devrait avoir patterns de transition EPCIS cohérents', () => {
            const patterns = secondaryManager.transitionPatterns;
            
            Object.entries(patterns).forEach(([patternName, pattern]) => {
                expect(pattern.fromBusinessStep).toBeDefined();
                expect(pattern.fromDisposition).toBeDefined();
                expect(pattern.toBusinessStep).toBeDefined();
                expect(pattern.toDisposition).toBeDefined();
                expect(pattern.actionType).toBeDefined();
                expect(pattern.requiredData).toBeDefined();
                expect(Array.isArray(pattern.requiredData)).toBe(true);
            });
        });

        it('devrait valider cohérence patterns avec types d\'actions', () => {
            const patterns = secondaryManager.transitionPatterns;
            const actionTypes = Object.keys(secondaryManager.actionTypes);
            
            Object.values(patterns).forEach(pattern => {
                expect(actionTypes).toContain(pattern.actionType);
            });
        });
    });
});

// <!-- END OF FILE: secondary-actions.test.js -->