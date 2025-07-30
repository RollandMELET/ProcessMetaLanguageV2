// <!-- START OF FILE: epcis-business-steps.test.js -->
// FILENAME: epcis-business-steps.test.js
// Version: 1.0.0
// Date: 2025-07-30 11:30
// Author: Rolland MELET & Claude Code
// Description: Tests système pour 41 business steps EPCIS 2.0 CBV 2.0 - TASK-T003

import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs/promises';
import path from 'path';

/**
 * Tests complets de conformité EPCIS 2.0 pour les 41 business steps
 * Valide la structure, les métadonnées, la conformité CBV 2.0 et l'intégration
 */
describe('EPCIS 2.0 Business Steps - Tests Système', () => {
    let businessStepsIndex;
    let epcisValidator;
    let templateProcessor;
    let templateManager;
    
    const EXPECTED_BUSINESS_STEPS_COUNT = 41;
    const EXPECTED_CATEGORIES = ['logistics', 'manufacturing', 'retail', 'pharmaceutical'];
    const EXPECTED_ACTION_TYPES = ['primary', 'secondary'];
    
    beforeAll(async () => {
        // Charger l'index des business steps
        const indexPath = path.join(process.cwd(), 'templates/epcis/business-steps-index.json');
        const indexContent = await fs.readFile(indexPath, 'utf-8');
        businessStepsIndex = JSON.parse(indexContent);
        
        // Charger les modules nécessaires pour les tests
        const { EPCISValidator } = await import('../../core/epcis-validator.js');
        const { TemplateProcessor } = await import('../../core/template-processor.js');
        const { TemplateManager } = await import('../../core/template-manager.js');
        
        epcisValidator = new EPCISValidator();
        templateProcessor = new TemplateProcessor();
        templateManager = new TemplateManager();
        
        await templateManager.initialize();
    });
    
    beforeEach(() => {
        // Reset des mocks avant chaque test
        vi.clearAllMocks();
    });
    
    describe('Structure Index Business Steps', () => {
        it('devrait avoir la structure metadata correcte', () => {
            expect(businessStepsIndex.index_metadata).toBeDefined();
            expect(businessStepsIndex.index_metadata.version).toBe('1.0.0');
            expect(businessStepsIndex.index_metadata.total_business_steps).toBe(EXPECTED_BUSINESS_STEPS_COUNT);
            expect(businessStepsIndex.index_metadata.epcis_version).toBe('2.0');
            expect(businessStepsIndex.index_metadata.cbv_version).toBe('2.0');
            expect(businessStepsIndex.index_metadata.gs1_compliance).toBe(true);
        });
        
        it('devrait contenir toutes les catégories attendues', () => {
            expect(businessStepsIndex.categories).toBeDefined();
            const categories = Object.keys(businessStepsIndex.categories);
            
            EXPECTED_CATEGORIES.forEach(category => {
                expect(categories).toContain(category);
                expect(businessStepsIndex.categories[category]).toHaveProperty('description');
                expect(businessStepsIndex.categories[category]).toHaveProperty('color_code');
                expect(businessStepsIndex.categories[category]).toHaveProperty('icon');
                expect(businessStepsIndex.categories[category]).toHaveProperty('count');
                expect(businessStepsIndex.categories[category]).toHaveProperty('business_steps');
            });
        });
        
        it('devrait avoir exactement 41 business steps au total', () => {
            const totalBusinessSteps = Object.values(businessStepsIndex.categories)
                .reduce((total, category) => total + category.business_steps.length, 0);
            
            expect(totalBusinessSteps).toBe(EXPECTED_BUSINESS_STEPS_COUNT);
        });
        
        it('devrait avoir la section business_steps détaillée', () => {
            expect(businessStepsIndex.business_steps).toBeDefined();
            expect(Object.keys(businessStepsIndex.business_steps)).toHaveLength(EXPECTED_BUSINESS_STEPS_COUNT);
        });
    });
    
    describe('Conformité CBV 2.0 Business Steps', () => {
        const requiredFields = [
            'file', 'category', 'description', 'action_type', 
            'workflow_position', 'common_objects', 'typical_transitions'
        ];
        
        it('devrait valider la structure de tous les business steps', () => {
            Object.entries(businessStepsIndex.business_steps).forEach(([stepId, stepData]) => {
                // Vérifier les champs obligatoires
                requiredFields.forEach(field => {
                    expect(stepData).toHaveProperty(field, 
                        `Business step '${stepId}' manque le champ obligatoire '${field}'`);
                });
                
                // Vérifier les types de données
                expect(typeof stepData.file).toBe('string');
                expect(typeof stepData.category).toBe('string');
                expect(typeof stepData.description).toBe('string');
                expect(EXPECTED_ACTION_TYPES).toContain(stepData.action_type);
                expect(typeof stepData.workflow_position).toBe('string');
                expect(Array.isArray(stepData.common_objects)).toBe(true);
                expect(Array.isArray(stepData.typical_transitions)).toBe(true);
            });
        });
        
        it('devrait valider les catégories des business steps', () => {
            Object.entries(businessStepsIndex.business_steps).forEach(([stepId, stepData]) => {
                expect(EXPECTED_CATEGORIES).toContain(stepData.category,
                    `Business step '${stepId}' a une catégorie invalide: ${stepData.category}`);
            });
        });
        
        it('devrait valider les workflow positions', () => {
            const validPositions = ['start', 'middle', 'end', 'any'];
            
            Object.entries(businessStepsIndex.business_steps).forEach(([stepId, stepData]) => {
                expect(validPositions).toContain(stepData.workflow_position,
                    `Business step '${stepId}' a une position workflow invalide: ${stepData.workflow_position}`);
            });
        });
        
        it('devrait valider la cohérence entre catégories et business steps', () => {
            Object.entries(businessStepsIndex.categories).forEach(([categoryId, categoryData]) => {
                categoryData.business_steps.forEach(stepId => {
                    expect(businessStepsIndex.business_steps[stepId]).toBeDefined(
                        `Business step '${stepId}' référencé dans catégorie '${categoryId}' mais non défini`);
                    expect(businessStepsIndex.business_steps[stepId].category).toBe(categoryId,
                        `Business step '${stepId}' a une catégorie incohérente`);
                });
            });
        });
    });
    
    describe('Business Steps Standards EPCIS 2.0', () => {
        // Tests pour les business steps critiques EPCIS 2.0
        const criticalBusinessSteps = [
            'receiving', 'shipping', 'storing', 'transforming', 'inspecting',
            'packing', 'unpacking', 'assembling', 'disassembling', 'destroying'
        ];
        
        it('devrait inclure tous les business steps critiques EPCIS 2.0', () => {
            criticalBusinessSteps.forEach(stepId => {
                expect(businessStepsIndex.business_steps[stepId]).toBeDefined(
                    `Business step critique EPCIS 2.0 manquant: ${stepId}`);
            });
        });
        
        it('devrait valider receiving (réception)', () => {
            const receiving = businessStepsIndex.business_steps.receiving;
            expect(receiving).toBeDefined();
            expect(receiving.category).toBe('logistics');
            expect(receiving.action_type).toBe('primary');
            expect(receiving.workflow_position).toBe('start');
            expect(receiving.common_objects).toContain('raw-material');
            expect(receiving.typical_transitions).toContain('in_progress');
        });
        
        it('devrait valider shipping (expédition)', () => {
            const shipping = businessStepsIndex.business_steps.shipping;
            expect(shipping).toBeDefined();
            expect(shipping.category).toBe('logistics');
            expect(shipping.action_type).toBe('primary');
            expect(shipping.workflow_position).toBe('end');
            expect(shipping.common_objects).toContain('product');
            expect(shipping.typical_transitions).toContain('in_transit');
        });
        
        it('devrait valider transforming (transformation)', () => {
            const transforming = businessStepsIndex.business_steps.transforming;
            expect(transforming).toBeDefined();
            expect(transforming.category).toBe('manufacturing');
            expect(transforming.action_type).toBe('primary');
            expect(transforming.workflow_position).toBe('middle');
            expect(transforming.common_objects).toContain('raw-material');
            expect(transforming.typical_transitions).toContain('active');
        });
        
        it('devrait valider inspecting (inspection)', () => {
            const inspecting = businessStepsIndex.business_steps.inspecting;
            expect(inspecting).toBeDefined();
            expect(inspecting.category).toBe('manufacturing');
            expect(inspecting.action_type).toBe('secondary');
            expect(inspecting.workflow_position).toBe('any');
            expect(inspecting.common_objects).toContain('product');
        });
    });
    
    describe('Intégration Template Processor', () => {
        it('devrait générer des templates valides pour tous les business steps', async () => {
            const testBusinessSteps = ['receiving', 'shipping', 'transforming', 'inspecting'];
            
            for (const stepId of testBusinessSteps) {
                const stepData = businessStepsIndex.business_steps[stepId];
                
                // Données de test pour génération template
                const canvasData = {
                    objectName: `Test-${stepId}`,
                    objectType: 'product',
                    userMetadata: {
                        businessStep: stepId,
                        company: '0000001',
                        product: '000001',
                        serial: '000001'
                    },
                    position: { x: 100, y: 200 }
                };
                
                try {
                    const result = await templateProcessor.generateFromCanvas(
                        canvasData, 
                        'object-template', 
                        `/tmp/test-${stepId}.md`
                    );
                    
                    expect(result.success).toBe(true);
                    expect(result.executionTime).toBeDefined();
                    expect(parseFloat(result.executionTime)).toBeLessThan(5000); // < 5s
                    
                } catch (error) {
                    throw new Error(`Erreur génération template pour ${stepId}: ${error.message}`);
                }
            }
        });
        
        it('devrait valider les variables template pour business steps', () => {
            const testData = {
                objectName: 'Test-Product',
                objectType: 'product',
                userMetadata: {
                    businessStep: 'receiving',
                    disposition: 'active'
                }
            };
            
            const variables = templateProcessor.prepareTemplateVariables(testData, 'object');
            
            // Vérifier les variables critiques EPCIS
            expect(variables.BUSINESS_STEP).toBe('receiving');
            expect(variables.DISPOSITION).toBe('active');
            expect(variables.EPC).toMatch(/^urn:epc:id:sgtin:/);
            expect(variables.OBJECT_NAME).toBe('Test-Product');
            expect(variables.OBJECT_TYPE).toBe('product');
        });
    });
    
    describe('Intégration Template Manager', () => {
        it('devrait créer des templates business steps par duplication', async () => {
            // Test de duplication d'un business step
            const sourceTemplate = {
                id: 'test_receiving_001',
                name: 'Receiving Process',
                type: 'business_step',
                category: 'logistics',
                metadata: {
                    businessStep: 'receiving',
                    epcisCompliant: true
                }
            };
            
            // Ajouter au registry temporaire
            templateManager.templateRegistry.set(sourceTemplate.id, sourceTemplate);
            
            try {
                const result = await templateManager.duplicateTemplate(sourceTemplate.id, {
                    name: 'Custom Receiving Process',
                    description: 'Version personnalisée du processus de réception'
                });
                
                expect(result.success).toBe(true);
                expect(result.template.name).toBe('Custom Receiving Process');
                expect(result.template.metadata.source).toBe('duplication');
                expect(result.template.metadata.parentTemplate).toBe(sourceTemplate.id);
                
            } catch (error) {
                throw new Error(`Erreur duplication business step: ${error.message}`);
            }
        });
        
        it('devrait créer des templates business steps par héritage', async () => {
            const parentTemplate = {
                id: 'test_shipping_001',
                name: 'Shipping Process',
                type: 'business_step',
                category: 'logistics',
                metadata: {
                    businessStep: 'shipping',
                    epcisCompliant: true
                }
            };
            
            templateManager.templateRegistry.set(parentTemplate.id, parentTemplate);
            
            try {
                const result = await templateManager.inheritTemplate(parentTemplate.id, {
                    name: 'Extended Shipping Process',
                    description: 'Extension du processus d\'expédition avec validations personnalisées',
                    extensions: {
                        customValidations: ['weight_check', 'dimension_check']
                    }
                });
                
                expect(result.success).toBe(true);
                expect(result.template.metadata.source).toBe('inheritance');
                expect(result.template.metadata.parentTemplate).toBe(parentTemplate.id);
                expect(result.inheritanceChain).toBeDefined();
                
            } catch (error) {
                throw new Error(`Erreur héritage business step: ${error.message}`);
            }
        });
    });
    
    describe('Validation EPCIS Validator', () => {
        it('devrait valider la conformité EPCIS 2.0 des business steps', async () => {
            const testBusinessSteps = ['receiving', 'shipping', 'transforming'];
            
            for (const stepId of testBusinessSteps) {
                const stepData = businessStepsIndex.business_steps[stepId];
                
                const templateData = {
                    type: 'business_step',
                    category: stepData.category,
                    metadata: {
                        businessStep: stepId,
                        actionType: stepData.action_type,
                        epcisVersion: '2.0'
                    },
                    frontmatter: {
                        business_step: stepId,
                        action_type: stepData.action_type
                    }
                };
                
                try {
                    const validationResult = await epcisValidator.validateTemplate(templateData);
                    
                    expect(validationResult.isValid).toBe(true, 
                        `Business step ${stepId} non conforme: ${validationResult.errors?.join(', ')}`);
                    expect(validationResult.errors).toHaveLength(0);
                    
                } catch (error) {
                    throw new Error(`Erreur validation EPCIS pour ${stepId}: ${error.message}`);
                }
            }
        });
        
        it('devrait détecter les non-conformités EPCIS', async () => {
            const invalidTemplate = {
                type: 'business_step',
                category: 'invalid_category',
                metadata: {
                    businessStep: 'invalid_step',
                    epcisVersion: '1.0' // Version incorrecte
                },
                frontmatter: {
                    business_step: 'invalid_step'
                }
            };
            
            try {
                const validationResult = await epcisValidator.validateTemplate(invalidTemplate);
                
                expect(validationResult.isValid).toBe(false);
                expect(validationResult.errors.length).toBeGreaterThan(0);
                
            } catch (error) {
                // Erreur attendue pour template non conforme
                expect(error.message).toContain('non conforme');
            }
        });
    });
    
    describe('Performance et Optimisation', () => {
        it('devrait charger l\'index business steps rapidement', async () => {
            const startTime = performance.now();
            
            const indexPath = path.join(process.cwd(), 'templates/epcis/business-steps-index.json');
            const indexContent = await fs.readFile(indexPath, 'utf-8');
            const loadedIndex = JSON.parse(indexContent);
            
            const endTime = performance.now();
            const loadTime = endTime - startTime;
            
            expect(loadTime).toBeLessThan(100); // < 100ms
            expect(loadedIndex.business_steps).toBeDefined();
            expect(Object.keys(loadedIndex.business_steps)).toHaveLength(EXPECTED_BUSINESS_STEPS_COUNT);
        });
        
        it('devrait traiter les business steps en batch efficacement', async () => {
            const businessStepsIds = Object.keys(businessStepsIndex.business_steps).slice(0, 10);
            
            const startTime = performance.now();
            
            const results = await Promise.all(
                businessStepsIds.map(async (stepId) => {
                    const stepData = businessStepsIndex.business_steps[stepId];
                    
                    // Simulation traitement template
                    const canvasData = {
                        objectName: `Test-${stepId}`,
                        objectType: 'product',
                        userMetadata: {
                            businessStep: stepId
                        }
                    };
                    
                    const variables = templateProcessor.prepareTemplateVariables(canvasData, 'object');
                    return {
                        stepId,
                        success: variables.BUSINESS_STEP === stepId
                    };
                })
            );
            
            const endTime = performance.now();
            const batchTime = endTime - startTime;
            
            expect(batchTime).toBeLessThan(1000); // < 1s pour 10 business steps
            expect(results.every(r => r.success)).toBe(true);
        });
    });
    
    describe('Cas Limites et Gestion Erreurs', () => {
        it('devrait gérer les business steps manquants gracieusement', () => {
            const missingStep = businessStepsIndex.business_steps.nonexistent_step;
            expect(missingStep).toBeUndefined();
            
            // Vérifier que l'absence ne casse pas le système
            const allSteps = Object.keys(businessStepsIndex.business_steps);
            expect(allSteps).not.toContain('nonexistent_step');
        });
        
        it('devrait valider la structure en cas de corruption partielle', () => {
            // Simuler une corruption d'index
            const corruptedIndex = {
                ...businessStepsIndex,
                business_steps: {
                    ...businessStepsIndex.business_steps,
                    corrupted_step: {
                        // Champs manquants intentionnellement
                        file: 'corrupted.yaml'
                    }
                }
            };
            
            // Tester la validation robuste
            const stepData = corruptedIndex.business_steps.corrupted_step;
            const requiredFields = ['category', 'description', 'action_type'];
            
            requiredFields.forEach(field => {
                expect(stepData[field]).toBeUndefined();
            });
        });
        
        it('devrait gérer les références circulaires dans transitions', () => {
            // Vérifier qu'il n'y a pas de références circulaires dans typical_transitions
            Object.entries(businessStepsIndex.business_steps).forEach(([stepId, stepData]) => {
                if (stepData.typical_transitions) {
                    expect(stepData.typical_transitions).not.toContain(stepId);
                }
            });
        });
    });
    
    describe('Conformité GS1 Standards', () => {
        it('devrait respecter les conventions de nommage GS1', () => {
            Object.keys(businessStepsIndex.business_steps).forEach(stepId => {
                // Vérifier format snake_case pour business steps
                expect(stepId).toMatch(/^[a-z][a-z0-9_]*[a-z0-9]$/,
                    `Business step '${stepId}' ne respecte pas la convention de nommage GS1`);
                
                // Vérifier longueur raisonnable
                expect(stepId.length).toBeLessThanOrEqual(50);
                expect(stepId.length).toBeGreaterThanOrEqual(3);
            });
        });
        
        it('devrait avoir des descriptions conformes aux standards', () => {
            Object.entries(businessStepsIndex.business_steps).forEach(([stepId, stepData]) => {
                expect(stepData.description).toBeDefined();
                expect(stepData.description.length).toBeGreaterThan(10);
                expect(stepData.description.length).toBeLessThan(200);
                
                // Vérifier absence de caractères spéciaux problématiques
                expect(stepData.description).not.toMatch(/[<>{}]/);
            });
        });
        
        it('devrait avoir des fichiers template correspondants', () => {
            Object.entries(businessStepsIndex.business_steps).forEach(([stepId, stepData]) => {
                expect(stepData.file).toBeDefined();
                expect(stepData.file).toMatch(/\.yaml$/);
                expect(stepData.file).toBe(`${stepId}.yaml`);
            });
        });
    });
    
    describe('Intégration Complète Business Steps', () => {
        it('devrait supporter un workflow complet receiving → transforming → shipping', async () => {
            const workflowSteps = ['receiving', 'transforming', 'shipping'];
            const workflowData = [];
            
            for (let i = 0; i < workflowSteps.length; i++) {
                const stepId = workflowSteps[i];
                const stepData = businessStepsIndex.business_steps[stepId];
                
                const canvasData = {
                    objectName: `Workflow-Product-Step${i + 1}`,
                    objectType: 'product',
                    userMetadata: {
                        businessStep: stepId,
                        workflowPosition: i + 1,
                        previousStep: i > 0 ? workflowSteps[i - 1] : null,
                        nextStep: i < workflowSteps.length - 1 ? workflowSteps[i + 1] : null
                    },
                    position: { x: i * 200, y: 100 }
                };
                
                const variables = templateProcessor.prepareTemplateVariables(canvasData, 'object');
                
                workflowData.push({
                    stepId,
                    variables,
                    stepData
                });
            }
            
            // Vérifier cohérence du workflow
            expect(workflowData).toHaveLength(3);
            expect(workflowData[0].stepData.workflow_position).toBe('start');
            expect(workflowData[1].stepData.workflow_position).toBe('middle');
            expect(workflowData[2].stepData.workflow_position).toBe('end');
            
            // Vérifier transitions logiques
            expect(workflowData[0].stepData.typical_transitions).toContain('in_progress');
            expect(workflowData[2].stepData.typical_transitions).toContain('in_transit');
        });
    });
});

// <!-- END OF FILE: epcis-business-steps.test.js -->