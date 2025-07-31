// <!-- START OF FILE: architecture-validator.test.js -->
// FILENAME: architecture-validator.test.js
// Version: 1.0.0
// Date: 2025-07-30 20:30
// Author: Rolland MELET & Claude Code
// Description: Tests unitaires validateur architecture ProcessMetaLanguage - TASK-D004 Phase 3

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ArchitectureValidator, ARCHITECTURE_VALIDATOR_CONFIG } from '../../validation/architecture-validator.js';

/**
 * Suite de tests pour le validateur d'architecture ProcessMetaLanguage
 * Teste la validation complète de l'architecture État-Actions Deux Niveaux
 */
describe('ArchitectureValidator', () => {
    let validator;
    let mockCanvasElements;
    let mockValidElements;
    let mockInvalidElements;

    beforeEach(() => {
        validator = new ArchitectureValidator();
        
        // Mock des éléments canvas valides
        mockValidElements = [
            // Object valide
            {
                id: 'obj_001',
                type: 'polygon',
                width: 120,
                height: 80,
                x: 100,
                y: 100,
                customData: {
                    tags: ['#process-object'],
                    name: 'Material_Lot_001',
                    objectType: 'raw_material'
                }
            },
            // State valide
            {
                id: 'state_001',
                type: 'rectangle',
                width: 80,
                height: 40,
                x: 150,
                y: 200,
                roundness: null,
                customData: {
                    tags: ['#process-state'],
                    name: 'Received',
                    stateType: 'initial'
                }
            },
            // Action principale valide
            {
                id: 'action_main_001',
                type: 'rectangle',
                width: 140,
                height: 60,
                x: 200,
                y: 300,
                roundness: 0.1,
                customData: {
                    tags: ['#process-action'],
                    name: 'Expose_Data',
                    actionType: 'main',
                    isPrimary: true
                }
            },
            // Action secondaire valide
            {
                id: 'action_sec_001',
                type: 'rectangle',
                width: 140,
                height: 60,
                x: 300,
                y: 300,
                roundness: 0.1,
                customData: {
                    tags: ['#process-action'],
                    name: 'Quality_Check',
                    actionType: 'secondary'
                }
            },
            // État cible
            {
                id: 'state_002',
                type: 'rectangle',
                width: 80,
                height: 40,
                x: 400,
                y: 200,
                roundness: null,
                customData: {
                    tags: ['#process-state'],
                    name: 'Active',
                    stateType: 'intermediate'
                }
            }
        ];

        // Mock des éléments invalides
        mockInvalidElements = [
            // Object sans états
            {
                id: 'obj_invalid_001',
                type: 'polygon',
                width: 120,
                height: 80,
                x: 500,
                y: 100,
                customData: {
                    tags: ['#process-object'],
                    name: 'Orphan_Object'
                }
            },
            // État sans action principale
            {
                id: 'state_invalid_001',
                type: 'rectangle',
                width: 80,
                height: 40,
                x: 550,
                y: 200,
                roundness: null,
                customData: {
                    tags: ['#process-state'],
                    name: 'No_Main_Action'
                }
            }
        ];
        
        mockCanvasElements = [...mockValidElements, ...mockInvalidElements];
    });

    describe('Initialisation', () => {
        it('devrait initialiser avec configuration par défaut', () => {
            const newValidator = new ArchitectureValidator();
            
            expect(newValidator.config).toBeDefined();
            expect(newValidator.relationDetector).toBeDefined();
            expect(newValidator.epcisValidator).toBeDefined();
            expect(newValidator.validationCache).toBeDefined();
            expect(newValidator.validationRules).toBeDefined();
        });

        it('devrait accepter options personnalisées', () => {
            const customOptions = {
                performance: { maxValidationTime: 2000 },
                conformity: { criticalThreshold: 90 }
            };
            
            const customValidator = new ArchitectureValidator(customOptions);
            
            expect(customValidator.config.performance.maxValidationTime).toBe(2000);
            expect(customValidator.config.conformity.criticalThreshold).toBe(90);
        });

        it('devrait initialiser métriques à zéro', () => {
            expect(validator.metrics.validationsPerformed).toBe(0);
            expect(validator.metrics.averageValidationTime).toBe(0);
            expect(validator.metrics.totalElementsValidated).toBe(0);
        });
    });

    describe('Classification des éléments', () => {
        it('devrait classifier éléments par type correctement', async () => {
            const classification = await validator.classifyElements(mockValidElements);
            
            expect(classification.objects).toHaveLength(1);
            expect(classification.states).toHaveLength(2);
            expect(classification.actions).toHaveLength(2);
            expect(classification.statistics.classifiedElements).toBe(5);
        });

        it('devrait identifier éléments non classifiés', async () => {
            const unclassifiedElements = [
                ...mockValidElements,
                {
                    id: 'unknown_001',
                    type: 'text',
                    text: 'Some text'
                }
            ];
            
            const classification = await validator.classifyElements(unclassifiedElements);
            
            expect(classification.others).toHaveLength(1);
            expect(classification.statistics.unclassifiedElements).toBe(1);
        });

        it('devrait gérer éléments sans customData', async () => {
            const elementsWithoutData = [
                {
                    id: 'bare_001',
                    type: 'rectangle',
                    width: 100,
                    height: 50
                }
            ];
            
            const classification = await validator.classifyElements(elementsWithoutData);
            
            expect(classification.others).toHaveLength(1);
        });
    });

    describe('Détection type élément', () => {
        it('devrait identifier objects par tag', () => {
            const objectElement = mockValidElements[0];
            const type = validator.getElementType(objectElement);
            
            expect(type).toBe('object');
        });

        it('devrait identifier states par tag', () => {
            const stateElement = mockValidElements[1];
            const type = validator.getElementType(stateElement);
            
            expect(type).toBe('state');
        });

        it('devrait identifier actions par tag', () => {
            const actionElement = mockValidElements[2];
            const type = validator.getElementType(actionElement);
            
            expect(type).toBe('action');
        });

        it('devrait identifier par forme si pas de tag', () => {
            const hexagonElement = {
                id: 'hex_001',
                type: 'polygon',
                width: 120,
                height: 80,
                customData: {} // Pas de tags
            };
            
            const type = validator.getElementType(hexagonElement);
            expect(type).toBe('object');
        });

        it('devrait retourner null pour éléments inconnus', () => {
            const unknownElement = {
                id: 'unknown_001',
                type: 'ellipse',
                customData: {}
            };
            
            const type = validator.getElementType(unknownElement);
            expect(type).toBeNull();
        });
    });

    describe('Validation architecture complète', () => {
        it('devrait valider architecture valide', async () => {
            // Mock relation detector pour retourner relations valides
            validator.relationDetector.detectRelations = vi.fn().mockResolvedValue({
                relations: [
                    {
                        id: 'rel_001',
                        source: { id: 'obj_001', type: 'object' },
                        target: { id: 'state_001', type: 'state' },
                        type: { name: 'Object→State' }
                    },
                    {
                        id: 'rel_002',
                        source: { id: 'state_001', type: 'state' },
                        target: { id: 'action_main_001', type: 'action' },
                        type: { name: 'State→Action' }
                    }
                ],
                summary: { validRelations: 2, totalRelations: 2 },
                transitionMappings: { stateTransitions: [] },
                analysis: { workflows: [] }
            });
            
            const result = await validator.validateArchitecture(mockValidElements);
            
            expect(result).toBeDefined();
            expect(result.conformityScore).toBeGreaterThan(80);
            expect(result.summary.totalElements).toBe(mockValidElements.length);
        });

        it('devrait détecter architecture invalide', async () => {
            // Mock relation detector pour relation invalide
            validator.relationDetector.detectRelations = vi.fn().mockResolvedValue({
                relations: [],
                summary: { validRelations: 0, totalRelations: 0 },
                transitionMappings: { stateTransitions: [] },
                analysis: { workflows: [] }
            });
            
            const result = await validator.validateArchitecture(mockInvalidElements);
            
            expect(result.conformityScore).toBeLessThan(60);
            expect(result.issues.length).toBeGreaterThan(0);
        });

        it('devrait respecter limite temps validation', async () => {
            const startTime = performance.now();
            
            validator.relationDetector.detectRelations = vi.fn().mockResolvedValue({
                relations: [],
                summary: { validRelations: 0, totalRelations: 0 },
                transitionMappings: { stateTransitions: [] },
                analysis: { workflows: [] }
            });
            
            const result = await validator.validateArchitecture(mockCanvasElements);
            
            const validationTime = performance.now() - startTime;
            expect(validationTime).toBeLessThan(validator.config.performance.maxValidationTime * 2);
            expect(result.metrics.validationTime).toBeDefined();
        });

        it('devrait utiliser cache si activé', async () => {
            validator.relationDetector.detectRelations = vi.fn().mockResolvedValue({
                relations: [],
                summary: { validRelations: 0, totalRelations: 0 },
                transitionMappings: { stateTransitions: [] },
                analysis: { workflows: [] }
            });
            
            // Première validation
            await validator.validateArchitecture(mockValidElements);
            
            // Deuxième validation (devrait utiliser cache)
            await validator.validateArchitecture(mockValidElements);
            
            // DetectRelations ne devrait être appelé qu'une fois
            expect(validator.relationDetector.detectRelations).toHaveBeenCalledTimes(1);
        });
    });

    describe('Validation niveau 1 (Object → State)', () => {
        it('devrait valider objects avec états', async () => {
            const classification = await validator.classifyElements(mockValidElements);
            const relations = [
                {
                    source: { id: 'obj_001', type: 'object' },
                    target: { id: 'state_001', type: 'state' }
                }
            ];
            
            const validation = await validator.validateLevel1Architecture(classification, relations);
            
            expect(validation.isValid).toBe(true);
            expect(validation.metrics.objectsCount).toBe(1);
            expect(validation.metrics.statesCount).toBe(2);
        });

        it('devrait détecter objects sans états', async () => {
            const classification = await validator.classifyElements(mockInvalidElements);
            const relations = []; // Pas de relations
            
            const validation = await validator.validateLevel1Architecture(classification, relations);
            
            expect(validation.isValid).toBe(false);
            expect(validation.issues.some(issue => issue.type === 'has_states')).toBe(true);
        });

        it('devrait détecter états orphelins', async () => {
            const classification = {
                objects: [],
                states: [mockValidElements[1]], // État sans objet parent
                actions: [],
                statistics: { totalElements: 1, classifiedElements: 1, unclassifiedElements: 0 }
            };
            
            const validation = await validator.validateLevel1Architecture(classification, []);
            
            expect(validation.isValid).toBe(false);
            expect(validation.issues.some(issue => issue.type === 'orphan_states')).toBe(true);
        });

        it('devrait calculer métriques niveau 1', async () => {
            const classification = await validator.classifyElements(mockValidElements);
            const relations = [
                {
                    source: { id: 'obj_001', type: 'object' },
                    target: { id: 'state_001', type: 'state' }
                }
            ];
            
            const validation = await validator.validateLevel1Architecture(classification, relations);
            
            expect(validation.metrics.objectsCount).toBe(1);
            expect(validation.metrics.statesCount).toBe(2);
            expect(validation.metrics.averageStatesPerObject).toBe(2);
        });
    });

    describe('Validation niveau 2 (State → Actions)', () => {
        it('devrait valider états avec action principale', async () => {
            const classification = await validator.classifyElements(mockValidElements);
            const relations = [
                {
                    source: { id: 'state_001', type: 'state' },
                    target: { 
                        id: 'action_main_001', 
                        type: 'action',
                        element: mockValidElements[2] // Action principale
                    }
                }
            ];
            
            const validation = await validator.validateLevel2Architecture(classification, relations);
            
            expect(validation.isValid).toBe(true);
            expect(validation.metrics.actionsCount).toBe(2);
        });

        it('devrait détecter états sans action principale', async () => {
            const classification = await validator.classifyElements([
                mockValidElements[1], // État
                mockValidElements[3]  // Action secondaire seulement
            ]);
            const relations = [
                {
                    source: { id: 'state_001', type: 'state' },
                    target: { 
                        id: 'action_sec_001', 
                        type: 'action',
                        element: mockValidElements[3] // Action secondaire
                    }
                }
            ];
            
            const validation = await validator.validateLevel2Architecture(classification, relations);
            
            expect(validation.isValid).toBe(false);
            expect(validation.issues.some(issue => issue.type === 'has_main_action')).toBe(true);
        });

        it('devrait limiter nombre actions secondaires', async () => {
            // Créer état avec trop d'actions secondaires
            const manySecondaryActions = Array.from({ length: 20 }, (_, i) => ({
                id: `action_sec_${i}`,
                type: 'rectangle',
                width: 140,
                height: 60,
                customData: {
                    tags: ['#process-action'],
                    name: `Secondary_Action_${i}`,
                    actionType: 'secondary'
                }
            }));
            
            const classification = {
                objects: [],
                states: [mockValidElements[1]],
                actions: manySecondaryActions,
                statistics: { totalElements: 21, classifiedElements: 21, unclassifiedElements: 0 }
            };
            
            const relations = manySecondaryActions.map(action => ({
                source: { id: 'state_001', type: 'state' },
                target: { id: action.id, type: 'action', element: action }
            }));
            
            const validation = await validator.validateLevel2Architecture(classification, relations);
            
            expect(validation.isValid).toBe(false);
            expect(validation.issues.some(issue => issue.type === 'max_secondary_actions')).toBe(true);
        });
    });

    describe('Validation des transitions', () => {
        it('devrait valider transitions valides', async () => {
            const transitionMappings = {
                stateTransitions: [
                    {
                        fromState: 'state_001',
                        toState: 'state_002',
                        viaAction: 'action_sec_001',
                        transitionType: 'secondary_action'
                    }
                ]
            };
            
            const validation = await validator.validateTransitions(transitionMappings, []);
            
            expect(validation.isValid).toBe(true);
        });

        it('devrait détecter cycles dans transitions', async () => {
            const transitionMappings = {
                stateTransitions: [
                    {
                        fromState: 'state_001',
                        toState: 'state_002',
                        viaAction: 'action_001'
                    },
                    {
                        fromState: 'state_002',
                        toState: 'state_001',
                        viaAction: 'action_002'
                    }
                ]
            };
            
            const validation = await validator.validateTransitions(transitionMappings, []);
            
            expect(validation.isValid).toBe(false);
            expect(validation.issues.some(issue => issue.type === 'transition_cycles')).toBe(true);
        });

        it('devrait gérer transitions vides', async () => {
            const validation = await validator.validateTransitions(null, []);
            
            expect(validation.isValid).toBe(true);
            expect(validation.issues).toHaveLength(0);
        });
    });

    describe('Validation EPCIS 2.0', () => {
        it('devrait valider actions conformes EPCIS', async () => {
            const classification = {
                objects: [],
                states: [],
                actions: [
                    {
                        id: 'action_001',
                        customData: {
                            tags: ['#process-action'],
                            epcisData: {
                                businessStep: 'receiving',
                                disposition: 'active'
                            }
                        }
                    }
                ],
                statistics: { totalElements: 1, classifiedElements: 1, unclassifiedElements: 0 }
            };
            
            // Mock EPCISValidator
            validator.epcisValidator.validateAction = vi.fn().mockResolvedValue({
                isValid: true,
                errors: []
            });
            
            const validation = await validator.validateEPCISCompliance(classification, []);
            
            expect(validation.isValid).toBe(true);
            expect(validator.epcisValidator.validateAction).toHaveBeenCalledWith(
                classification.actions[0].customData.epcisData
            );
        });

        it('devrait détecter actions non conformes EPCIS', async () => {
            const classification = {
                objects: [],
                states: [],
                actions: [
                    {
                        id: 'action_001',
                        customData: {
                            epcisData: {
                                businessStep: 'invalid_step'
                            }
                        }
                    }
                ],
                statistics: { totalElements: 1, classifiedElements: 1, unclassifiedElements: 0 }
            };
            
            validator.epcisValidator.validateAction = vi.fn().mockResolvedValue({
                isValid: false,
                errors: ['Business step non valide']
            });
            
            const validation = await validator.validateEPCISCompliance(classification, []);
            
            expect(validation.isValid).toBe(false);
            expect(validation.issues.some(issue => issue.type === 'epcis_non_compliance')).toBe(true);
        });

        it('devrait gérer erreurs validation EPCIS', async () => {
            const classification = {
                objects: [],
                states: [],
                actions: [
                    {
                        id: 'action_001',
                        customData: {
                            epcisData: { invalid: 'data' }
                        }
                    }
                ],
                statistics: { totalElements: 1, classifiedElements: 1, unclassifiedElements: 0 }
            };
            
            validator.epcisValidator.validateAction = vi.fn().mockRejectedValue(
                new Error('Erreur validation')
            );
            
            const validation = await validator.validateEPCISCompliance(classification, []);
            
            expect(validation.issues.some(issue => issue.type === 'epcis_validation_error')).toBe(true);
        });
    });

    describe('Calcul score de conformité', () => {
        it('devrait calculer score parfait pour architecture valide', () => {
            const validations = {
                level1: { isValid: true, issues: [] },
                level2: { isValid: true, issues: [] },
                transitions: { isValid: true, issues: [] },
                epcis: { isValid: true, issues: [] }
            };
            
            const score = validator.calculateConformityScore(validations);
            
            expect(score).toBe(100);
        });

        it('devrait pénaliser selon nombre d\'issues', () => {
            const validations = {
                level1: { isValid: false, issues: [{ type: 'error1' }, { type: 'error2' }] },
                level2: { isValid: true, issues: [] },
                transitions: { isValid: true, issues: [] },
                epcis: { isValid: true, issues: [] }
            };
            
            const score = validator.calculateConformityScore(validations);
            
            expect(score).toBeLessThan(100);
            expect(score).toBeGreaterThan(50);
        });

        it('devrait gérer validations manquantes', () => {
            const validations = {
                level1: { isValid: true, issues: [] },
                level2: null,
                transitions: undefined,
                epcis: { isValid: true, issues: [] }
            };
            
            const score = validator.calculateConformityScore(validations);
            
            expect(score).toBeGreaterThan(0);
            expect(score).toBeLessThan(100);
        });
    });

    describe('Validation composant spécifique', () => {
        it('devrait valider composant object existant', async () => {
            validator.relationDetector.detectRelations = vi.fn().mockResolvedValue({
                relations: [
                    {
                        source: { id: 'obj_001', type: 'object' },
                        target: { id: 'state_001', type: 'state' }
                    }
                ]
            });
            
            const result = await validator.validateComponent('obj_001', mockValidElements);
            
            expect(result).toBeDefined();
            expect(result.componentId).toBe('obj_001');
            expect(result.componentType).toBe('object');
        });

        it('devrait lever erreur pour composant inexistant', async () => {
            await expect(
                validator.validateComponent('nonexistent', mockValidElements)
            ).rejects.toThrow('Composant nonexistent non trouvé');
        });

        it('devrait lever erreur pour composant non reconnu', async () => {
            const unknownElement = {
                id: 'unknown_001',
                type: 'ellipse',
                customData: {}
            };
            const elements = [...mockValidElements, unknownElement];
            
            await expect(
                validator.validateComponent('unknown_001', elements)
            ).rejects.toThrow('Type de composant unknown_001 non reconnu');
        });
    });

    describe('Génération rapport de conformité', () => {
        it('devrait générer rapport complet', async () => {
            const mockValidationResult = {
                conformityScore: 85,
                summary: {
                    totalElements: 5,
                    criticalIssues: 1,
                    warningIssues: 3
                },
                validation: {
                    level1: { isValid: true, issues: [] },
                    level2: { isValid: false, issues: [{ type: 'test' }] },
                    transitions: { isValid: true, issues: [] },
                    epcis: { isValid: true, issues: [] }
                },
                issues: [],
                metrics: {
                    coverage: 90,
                    complexity: { score: 45 },
                    performance: { status: 'good' }
                },
                elementClassification: {
                    objects: [],
                    states: [],
                    actions: []
                },
                relationResult: {
                    transitionMappings: { stateTransitions: [] }
                }
            };
            
            const report = await validator.generateConformityReport(mockValidationResult);
            
            expect(report).toBeDefined();
            expect(report.executive).toBeDefined();
            expect(report.architectureLevels).toBeDefined();
            expect(report.qualityMetrics).toBeDefined();
            expect(report.actionPlan).toBeDefined();
        });

        it('devrait évaluer niveau de risque correctement', () => {
            expect(validator.assessRiskLevel({ conformityScore: 95 })).toBe('low');
            expect(validator.assessRiskLevel({ conformityScore: 75 })).toBe('medium');
            expect(validator.assessRiskLevel({ conformityScore: 65 })).toBe('high');
        });

        it('devrait estimer effort d\'implémentation', () => {
            expect(validator.estimateImplementationEffort({
                summary: { criticalIssues: 2, warningIssues: 3 }
            })).toBe('low');
            
            expect(validator.estimateImplementationEffort({
                summary: { criticalIssues: 5, warningIssues: 8 }
            })).toBe('medium');
            
            expect(validator.estimateImplementationEffort({
                summary: { criticalIssues: 10, warningIssues: 20 }
            })).toBe('high');
        });
    });

    describe('Performance et cache', () => {
        it('devrait mettre à jour métriques après validation', async () => {
            validator.relationDetector.detectRelations = vi.fn().mockResolvedValue({
                relations: [],
                summary: { validRelations: 0, totalRelations: 0 },
                transitionMappings: { stateTransitions: [] },
                analysis: { workflows: [] }
            });
            
            const initialCount = validator.metrics.validationsPerformed;
            
            await validator.validateArchitecture(mockValidElements);
            
            expect(validator.metrics.validationsPerformed).toBe(initialCount + 1);
            expect(validator.metrics.averageValidationTime).toBeGreaterThan(0);
        });

        it('devrait gérer cache correctement', () => {
            const elements = [mockValidElements[0]];
            const cacheKey1 = validator.generateCacheKey(elements);
            const cacheKey2 = validator.generateCacheKey(elements);
            const cacheKey3 = validator.generateCacheKey([mockValidElements[1]]);
            
            expect(cacheKey1).toBe(cacheKey2);
            expect(cacheKey1).not.toBe(cacheKey3);
        });

        it('devrait fournir métriques de performance', () => {
            const metrics = validator.getPerformanceMetrics();
            
            expect(metrics).toBeDefined();
            expect(metrics.validationsPerformed).toBeDefined();
            expect(metrics.cacheSize).toBeDefined();
        });

        it('devrait réinitialiser correctement', () => {
            validator.metrics.validationsPerformed = 10;
            validator.validationCache.set('test', 'data');
            
            validator.reset();
            
            expect(validator.metrics.validationsPerformed).toBe(0);
            expect(validator.validationCache.size).toBe(0);
        });
    });

    describe('Règles de validation', () => {
        it('devrait valider objet avec états suffisants', () => {
            const object = mockValidElements[0];
            const relations = [
                {
                    source: { id: 'obj_001', type: 'object' },
                    target: { id: 'state_001', type: 'state' }
                }
            ];
            
            const hasStatesRule = validator.validationRules.object[0];
            const result = hasStatesRule.validator(object, relations);
            
            expect(result.valid).toBe(true);
        });

        it('devrait détecter objet sans états', () => {
            const object = mockValidElements[0];
            const relations = []; // Pas de relations
            
            const hasStatesRule = validator.validationRules.object[0];
            const result = hasStatesRule.validator(object, relations);
            
            expect(result.valid).toBe(false);
            expect(result.message).toContain('au moins un état');
        });

        it('devrait valider limite maximale d\'états', () => {
            const object = mockValidElements[0];
            const tooManyStateRelations = Array.from({ length: 15 }, (_, i) => ({
                source: { id: 'obj_001', type: 'object' },
                target: { id: `state_${i}`, type: 'state' }
            }));
            
            const maxStatesRule = validator.validationRules.object[1];
            const result = maxStatesRule.validator(object, tooManyStateRelations);
            
            expect(result.valid).toBe(false);
            expect(result.message).toContain('Trop d\'états');
        });
    });

    describe('Gestion d\'erreurs', () => {
        it('devrait gérer erreur du RelationDetector', async () => {
            validator.relationDetector.detectRelations = vi.fn().mockRejectedValue(
                new Error('Erreur détection relations')
            );
            
            await expect(
                validator.validateArchitecture(mockValidElements)
            ).rejects.toThrow('Échec validation architecture');
        });

        it('devrait gérer éléments canvas vides', async () => {
            validator.relationDetector.detectRelations = vi.fn().mockResolvedValue({
                relations: [],
                summary: { validRelations: 0, totalRelations: 0 },
                transitionMappings: { stateTransitions: [] },
                analysis: { workflows: [] }
            });
            
            const result = await validator.validateArchitecture([]);
            
            expect(result).toBeDefined();
            expect(result.summary.totalElements).toBe(0);
        });

        it('devrait gérer éléments malformés', async () => {
            const malformedElements = [
                { id: 'bad_001' }, // Pas de type
                { type: 'rectangle' }, // Pas d'ID
                null, // Élément null
                undefined // Élément undefined
            ].filter(Boolean);
            
            const classification = await validator.classifyElements(malformedElements);
            
            expect(classification.statistics.totalElements).toBe(malformedElements.length);
        });
    });
});

// <!-- END OF FILE: architecture-validator.test.js -->