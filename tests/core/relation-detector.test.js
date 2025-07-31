// <!-- START OF FILE: relation-detector.test.js -->
// FILENAME: relation-detector.test.js
// Version: 1.0.0
// Date: 2025-07-30 18:45
// Author: Rolland MELET & Claude Code
// Description: Tests unitaires RelationDetector - TASK-B008 Phase 3

import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import { RelationDetector } from '../../core/relation-detector.js';

/**
 * Tests complets pour RelationDetector
 * Valide la détection des relations graphiques et mapping transitions
 */
describe('RelationDetector - Tests Unitaires', () => {
    let relationDetector;
    
    // Éléments de test simulant un canvas Excalidraw
    const testElements = [
        // Object hexagon
        {
            id: 'obj_001',
            type: 'polygon',
            x: 100,
            y: 100,
            width: 120,
            height: 80,
            customData: {
                tags: ['#process-object'],
                name: 'Lot Matière A001'
            }
        },
        // State rectangle
        {
            id: 'state_001',
            type: 'rectangle',
            x: 300,
            y: 120,
            width: 80,
            height: 40,
            roundness: null,
            customData: {
                tags: ['#process-state'],
                name: 'En_Réception'
            }
        },
        // Action rounded rectangle
        {
            id: 'action_001',
            type: 'rectangle',
            x: 500,
            y: 110,
            width: 140,
            height: 60,
            roundness: { type: 1 },
            customData: {
                tags: ['#process-action'],
                name: 'Contrôler_Qualité'
            }
        },
        // Arrow Object → State
        {
            id: 'arrow_001',
            type: 'arrow',
            x: 220,
            y: 140,
            points: [[0, 0], [80, 0]],
            startBinding: { elementId: 'obj_001', focus: 0, gap: 0 },
            endBinding: { elementId: 'state_001', focus: 0, gap: 0 },
            startArrowhead: 'none',
            endArrowhead: 'arrow'
        },
        // Arrow State → Action
        {
            id: 'arrow_002',
            type: 'arrow',
            x: 380,
            y: 140,
            points: [[0, 0], [120, 0]],
            startBinding: { elementId: 'state_001', focus: 0, gap: 0 },
            endBinding: { elementId: 'action_001', focus: 0, gap: 0 },
            startArrowhead: 'none',
            endArrowhead: 'arrow'
        },
        // Second state
        {
            id: 'state_002',
            type: 'rectangle',
            x: 700,
            y: 120,
            width: 80,
            height: 40,
            roundness: null,
            customData: {
                tags: ['#process-state'],
                name: 'Qualité_Validée'
            }
        },
        // Arrow Action → State
        {
            id: 'arrow_003',
            type: 'arrow',
            x: 640,
            y: 140,
            points: [[0, 0], [60, 0]],
            startBinding: { elementId: 'action_001', focus: 0, gap: 0 },
            endBinding: { elementId: 'state_002', focus: 0, gap: 0 },
            startArrowhead: 'none',
            endArrowhead: 'arrow'
        }
    ];

    beforeAll(() => {
        console.log('🧪 Initialisation tests RelationDetector');
    });

    beforeEach(() => {
        relationDetector = new RelationDetector({
            cacheEnabled: false // Désactiver cache pour tests
        });
    });

    afterEach(() => {
        relationDetector.reset();
        vi.clearAllMocks();
    });

    describe('Initialisation et Configuration', () => {
        it('devrait initialiser avec configuration par défaut', () => {
            const detector = new RelationDetector();
            
            expect(detector.config).toBeDefined();
            expect(detector.config.elementTypes).toBeDefined();
            expect(detector.config.relationTypes).toBeDefined();
            expect(detector.config.detection).toBeDefined();
            expect(detector.config.validation).toBeDefined();
            expect(detector.config.cacheEnabled).toBe(true);
        });

        it('devrait accepter configuration personnalisée', () => {
            const customConfig = {
                cacheEnabled: false,
                validation: {
                    allowCycles: true,
                    enforceCardinality: false
                }
            };

            const detector = new RelationDetector(customConfig);
            
            expect(detector.config.cacheEnabled).toBe(false);
            expect(detector.config.validation.allowCycles).toBe(true);
            expect(detector.config.validation.enforceCardinality).toBe(false);
        });

        it('devrait avoir types d\'éléments ProcessMetaLanguage corrects', () => {
            expect(relationDetector.config.elementTypes.object.tag).toBe('#process-object');
            expect(relationDetector.config.elementTypes.state.tag).toBe('#process-state');
            expect(relationDetector.config.elementTypes.action.tag).toBe('#process-action');
        });

        it('devrait avoir types de relations corrects', () => {
            const relationTypes = relationDetector.config.relationTypes;
            
            expect(relationTypes.object_to_state).toBeDefined();
            expect(relationTypes.state_to_action).toBeDefined();
            expect(relationTypes.action_to_state).toBeDefined();
            expect(relationTypes.state_to_state).toBeDefined();
        });
    });

    describe('Détection de Relations', () => {
        it('devrait détecter toutes les relations dans le canvas', async () => {
            const result = await relationDetector.detectRelations(testElements);
            
            expect(result).toBeDefined();
            expect(result.relations).toBeDefined();
            expect(Array.isArray(result.relations)).toBe(true);
            expect(result.relations.length).toBe(3); // 3 flèches = 3 relations
            
            expect(result.summary).toBeDefined();
            expect(result.summary.totalElements).toBe(testElements.length);
            expect(result.summary.totalArrows).toBe(3);
            expect(result.summary.validRelations).toBe(3);
        });

        it('devrait identifier correctement les types de relations', async () => {
            const result = await relationDetector.detectRelations(testElements);
            
            const relations = result.relations;
            
            // Vérifier Object → State
            const objToState = relations.find(r => r.source.id === 'obj_001');
            expect(objToState).toBeDefined();
            expect(objToState.type.name).toBe('Object→State');
            expect(objToState.source.type).toBe('object');
            expect(objToState.target.type).toBe('state');
            
            // Vérifier State → Action
            const stateToAction = relations.find(r => 
                r.source.id === 'state_001' && r.target.id === 'action_001'
            );
            expect(stateToAction).toBeDefined();
            expect(stateToAction.type.name).toBe('State→Action');
            
            // Vérifier Action → State
            const actionToState = relations.find(r => r.source.id === 'action_001');
            expect(actionToState).toBeDefined();
            expect(actionToState.type.name).toBe('Action→State');
        });

        it('devrait extraire les noms des éléments', async () => {
            const result = await relationDetector.detectRelations(testElements);
            
            const firstRelation = result.relations[0];
            expect(firstRelation.source.name).toBe('Lot Matière A001');
            expect(firstRelation.target.name).toBe('En_Réception');
        });

        it('devrait gérer éléments sans bindings explicites', async () => {
            const elementsWithoutBindings = [
                ...testElements.slice(0, 3), // Objects sans flèches
                {
                    id: 'arrow_no_binding',
                    type: 'arrow',
                    x: 220,
                    y: 140,
                    points: [[0, 0], [80, 0]],
                    startArrowhead: 'none',
                    endArrowhead: 'arrow'
                    // Pas de startBinding/endBinding
                }
            ];
            
            const result = await relationDetector.detectRelations(elementsWithoutBindings);
            
            expect(result.relations).toBeDefined();
            // La flèche sans binding ne devrait pas créer de relation
            expect(result.relations.length).toBe(0);
        });

        it('devrait respecter le target de performance', async () => {
            const startTime = performance.now();
            
            await relationDetector.detectRelations(testElements);
            
            const executionTime = performance.now() - startTime;
            
            // Target: détection < 100ms pour petit canvas
            expect(executionTime).toBeLessThan(100);
        });
    });

    describe('Analyse de Relations Spécifiques', () => {
        it('devrait analyser une relation entre deux éléments', async () => {
            // D'abord détecter pour indexer les éléments
            await relationDetector.detectRelations(testElements);
            
            const analysis = await relationDetector.analyzeRelation(
                'obj_001',
                'state_001',
                testElements
            );
            
            expect(analysis).toBeDefined();
            expect(analysis.relation).toBeDefined();
            expect(analysis.relation.sourceId).toBe('obj_001');
            expect(analysis.relation.targetId).toBe('state_001');
            expect(analysis.relation.relationType).toBe('Object→State');
            expect(analysis.relation.valid).toBe(true);
            
            expect(analysis.validation).toBeDefined();
            expect(analysis.context).toBeDefined();
            expect(analysis.recommendations).toBeDefined();
        });

        it('devrait rejeter relation non autorisée', async () => {
            await relationDetector.detectRelations(testElements);
            
            // Essayer Object → Action (non autorisé)
            const analysis = await relationDetector.analyzeRelation(
                'obj_001',
                'action_001',
                testElements
            );
            
            expect(analysis.relation.valid).toBe(false);
            expect(analysis.validation.errors.length).toBeGreaterThan(0);
        });

        it('devrait gérer éléments non trouvés', async () => {
            await relationDetector.detectRelations(testElements);
            
            await expect(
                relationDetector.analyzeRelation('invalid_id', 'state_001', testElements)
            ).rejects.toThrow('Éléments source ou cible non trouvés');
        });
    });

    describe('Génération de Mappings de Transitions', () => {
        it('devrait générer mappings état-actions corrects', async () => {
            const result = await relationDetector.detectRelations(testElements);
            
            expect(result.transitionMappings).toBeDefined();
            expect(result.transitionMappings.stateTransitions).toBeDefined();
            expect(result.transitionMappings.actionTriggers).toBeDefined();
            expect(result.transitionMappings.workflowPaths).toBeDefined();
            
            // Vérifier transition état vers état via action
            const stateTransitions = result.transitionMappings.stateTransitions;
            expect(stateTransitions.length).toBeGreaterThan(0);
            
            const transition = stateTransitions[0];
            expect(transition.fromState).toBe('state_001');
            expect(transition.toState).toBe('state_002');
            expect(transition.viaAction).toBe('action_001');
            expect(transition.actionName).toBe('Contrôler_Qualité');
        });

        it('devrait mapper déclencheurs d\'actions', async () => {
            const result = await relationDetector.detectRelations(testElements);
            
            const actionTriggers = result.transitionMappings.actionTriggers;
            expect(actionTriggers.length).toBeGreaterThan(0);
            
            const trigger = actionTriggers.find(t => t.actionId === 'action_001');
            expect(trigger).toBeDefined();
            expect(trigger.stateId).toBe('state_001');
            expect(trigger.stateName).toBe('En_Réception');
            expect(trigger.actionName).toBe('Contrôler_Qualité');
        });
    });

    describe('Validation de Relations', () => {
        it('devrait valider relations selon règles métier', async () => {
            const result = await relationDetector.detectRelations(testElements, {
                strictValidation: true,
                validateTransitions: true
            });
            
            // Toutes les relations de test devraient être valides
            result.relations.forEach(relation => {
                expect(relation.validation).toBeDefined();
                expect(relation.validation.isValid).toBe(true);
                expect(relation.validation.errors.length).toBe(0);
            });
        });

        it('devrait détecter relations invalides', async () => {
            const invalidElements = [
                ...testElements.slice(0, 3),
                // Flèche Object → Action (non autorisée)
                {
                    id: 'arrow_invalid',
                    type: 'arrow',
                    x: 240,
                    y: 140,
                    points: [[0, 0], [400, 0]],
                    startBinding: { elementId: 'obj_001' },
                    endBinding: { elementId: 'action_001' },
                    endArrowhead: 'arrow'
                }
            ];
            
            const result = await relationDetector.detectRelations(invalidElements, {
                strictValidation: false // Inclure relations invalides
            });
            
            const invalidRelation = result.relations.find(r => 
                r.source.id === 'obj_001' && r.target.id === 'action_001'
            );
            
            expect(invalidRelation).toBeDefined();
            expect(invalidRelation.validation.isValid).toBe(false);
            expect(result.summary.invalidRelations).toBeGreaterThan(0);
        });
    });

    describe('Rapport de Validation', () => {
        it('devrait générer rapport de validation complet', async () => {
            const report = await relationDetector.generateValidationReport(testElements);
            
            expect(report).toBeDefined();
            expect(report.summary).toBeDefined();
            expect(report.summary.validationScore).toBeDefined();
            expect(parseFloat(report.summary.validationScore)).toBe(100); // Toutes valides
            
            expect(report.validationIssues).toBeDefined();
            expect(report.architectureValidation).toBeDefined();
            expect(report.epcisValidation).toBeDefined();
            expect(report.optimizations).toBeDefined();
            
            expect(report.detailedRelations).toBeDefined();
            expect(Array.isArray(report.detailedRelations)).toBe(true);
        });

        it('devrait identifier problèmes de validation', async () => {
            const problemElements = [
                ...testElements,
                // Ajouter une flèche créant un cycle
                {
                    id: 'arrow_cycle',
                    type: 'arrow',
                    x: 780,
                    y: 140,
                    points: [[0, 0], [-480, 0]],
                    startBinding: { elementId: 'state_002' },
                    endBinding: { elementId: 'state_001' },
                    endArrowhead: 'arrow'
                }
            ];
            
            const detector = new RelationDetector({
                validation: { allowCycles: false }
            });
            
            const report = await detector.generateValidationReport(problemElements);
            
            expect(report.validationIssues.critical.length).toBeGreaterThan(0);
        });
    });

    describe('Analyse de Patterns', () => {
        it('devrait détecter patterns de workflow', async () => {
            const result = await relationDetector.detectRelations(testElements, {
                includeAnalysis: true
            });
            
            expect(result.analysis).toBeDefined();
            expect(result.analysis.workflows).toBeDefined();
            expect(Array.isArray(result.analysis.workflows)).toBe(true);
            
            expect(result.analysis.metrics).toBeDefined();
            expect(result.analysis.metrics.averageConnectivity).toBeDefined();
            expect(result.analysis.metrics.complexityScore).toBeDefined();
        });

        it('devrait identifier bottlenecks', async () => {
            // Créer structure avec bottleneck
            const bottleneckElements = [
                ...testElements,
                // Ajouter plusieurs connexions vers un même état
                {
                    id: 'action_002',
                    type: 'rectangle',
                    x: 500,
                    y: 200,
                    width: 140,
                    height: 60,
                    roundness: { type: 1 },
                    customData: {
                        tags: ['#process-action'],
                        name: 'Action_2'
                    }
                },
                {
                    id: 'arrow_bottleneck_1',
                    type: 'arrow',
                    x: 640,
                    y: 230,
                    points: [[0, 0], [60, -90]],
                    startBinding: { elementId: 'action_002' },
                    endBinding: { elementId: 'state_002' },
                    endArrowhead: 'arrow'
                }
            ];
            
            const result = await relationDetector.detectRelations(bottleneckElements, {
                includeAnalysis: true
            });
            
            expect(result.analysis.bottlenecks).toBeDefined();
            expect(Array.isArray(result.analysis.bottlenecks)).toBe(true);
        });
    });

    describe('Performance et Cache', () => {
        it('devrait utiliser cache si activé', async () => {
            const detector = new RelationDetector({ cacheEnabled: true });
            
            // Première détection
            const result1 = await detector.detectRelations(testElements);
            const stats1 = detector.getPerformanceStats();
            
            // Deuxième détection (depuis cache)
            const result2 = await detector.detectRelations(testElements);
            const stats2 = detector.getPerformanceStats();
            
            expect(stats2.cacheSize).toBeGreaterThan(0);
            expect(result1.relations.length).toBe(result2.relations.length);
        });

        it('devrait calculer statistiques de performance', async () => {
            await relationDetector.detectRelations(testElements);
            
            const stats = relationDetector.getPerformanceStats();
            
            expect(stats.elementsAnalyzed).toBe(testElements.length);
            expect(stats.relationsDetected).toBeGreaterThan(0);
            expect(stats.validRelations).toBeGreaterThan(0);
            expect(stats.averageDetectionTime).toBeGreaterThan(0);
            expect(stats.detectionEfficiency).toBeGreaterThan(0);
        });
    });

    describe('Gestion des Erreurs', () => {
        it('devrait gérer canvas vide', async () => {
            const result = await relationDetector.detectRelations([]);
            
            expect(result.relations).toEqual([]);
            expect(result.summary.totalElements).toBe(0);
            expect(result.summary.totalRelations).toBe(0);
        });

        it('devrait gérer éléments malformés', async () => {
            const malformedElements = [
                { id: 'bad_1' }, // Pas de type
                { id: 'bad_2', type: 'arrow' }, // Pas de points
                { id: 'bad_3', type: 'rectangle' } // Pas de dimensions
            ];
            
            const result = await relationDetector.detectRelations(malformedElements);
            
            expect(result.relations).toEqual([]);
            expect(result.summary.invalidRelations).toBe(0);
        });
    });

    describe('Utilitaires et Helpers', () => {
        it('devrait calculer distance entre points', () => {
            const p1 = { x: 0, y: 0 };
            const p2 = { x: 3, y: 4 };
            
            const distance = relationDetector.calculateDistance(p1, p2);
            
            expect(distance).toBe(5); // 3-4-5 triangle
        });

        it('devrait calculer centre d\'élément', () => {
            const element = {
                x: 100,
                y: 100,
                width: 50,
                height: 50
            };
            
            const center = relationDetector.getElementCenter(element);
            
            expect(center).toEqual({ x: 125, y: 125 });
        });

        it('devrait réinitialiser correctement', () => {
            // Ajouter des données
            relationDetector.detectRelations(testElements);
            
            // Réinitialiser
            relationDetector.reset();
            
            const stats = relationDetector.getPerformanceStats();
            expect(stats.elementsAnalyzed).toBe(0);
            expect(stats.relationsDetected).toBe(0);
            expect(stats.cacheSize).toBe(0);
        });
    });
});

// <!-- END OF FILE: relation-detector.test.js -->