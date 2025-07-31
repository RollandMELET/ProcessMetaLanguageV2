// <!-- START OF FILE: export-validation.test.js -->
// FILENAME: export-validation.test.js
// Version: 1.0.0
// Date: 2025-07-31 19:15
// Author: Rolland MELET & Claude Code
// Description: Tests validation export complet ProcessMetaLanguage - TASK-T009 Phase 5 validation qualité

/**
 * Module ProcessMetaLanguage - Export Validation Tests
 * 
 * Suite de tests complète pour valider tous les exports ProcessMetaLanguage.
 * Tests de qualité, conformité, performance et implémentabilité.
 * 
 * Tests couverts:
 * - Validation WorkflowCompiler (documentation finale)
 * - Validation MatrixGenerator (visualisations et analytics)
 * - Validation OpenAPIGenerator (spécifications API)
 * - Validation 360SmartConnect Mapper (correspondances système)
 * - Tests intégration bout-en-bout
 * - Tests performance et scalabilité
 * - Tests conformité EPCIS 2.0 et GS1
 * - Tests qualité documentation
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { WorkflowCompiler } from '../../export/workflow-compiler.js';
import { MatrixGenerator } from '../../export/matrix-generator.js';
import { OpenAPIGenerator } from '../../export/openapi-generator.js';
import { SmartConnectMapper } from '../../export/360sc-mapper.js';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * Données de test simulées ProcessMetaLanguage
 */
const MOCK_WORKFLOW_DATA = {
    objects: [
        {
            id: 'obj_raw_material_001',
            name: 'Acier Grade A',
            type: 'raw-material',
            description: 'Acier haute qualité pour construction',
            metadata: {
                supplier: 'Acier France',
                grade: 'A',
                certification: 'CE'
            },
            states: [
                {
                    id: 'state_received',
                    name: 'Reçu',
                    disposition: 'active',
                    description: 'Matériau reçu en stock',
                    actions: [
                        {
                            id: 'action_inspect',
                            name: 'Contrôle Qualité',
                            businessStep: 'inspecting',
                            type: 'main',
                            parameters: {
                                checkList: ['dimension', 'surface', 'composition'],
                                inspector: 'required'
                            },
                            targetState: 'state_inspected'
                        },
                        {
                            id: 'action_store',
                            name: 'Stockage',
                            businessStep: 'storing',
                            type: 'secondary',
                            parameters: {
                                location: 'warehouse_A',
                                temperature: 'ambient'
                            },
                            targetState: 'state_stored'
                        }
                    ]
                },
                {
                    id: 'state_inspected',
                    name: 'Contrôlé',
                    disposition: 'sellable_accessible',
                    description: 'Matériau contrôlé et validé',
                    actions: [
                        {
                            id: 'action_release',
                            name: 'Mise à Disposition',
                            businessStep: 'staging_outbound',
                            type: 'main',
                            parameters: {
                                destination: 'production_line',
                                priority: 'normal'
                            },
                            targetState: 'state_available'
                        }
                    ]
                }
            ]
        },
        {
            id: 'obj_product_001',
            name: 'Poutre IPN 200',
            type: 'product',
            description: 'Poutre IPN 200mm pour structure',
            metadata: {
                dimensions: '200x100x5.6mm',
                weight: '22.4kg/m',
                standard: 'NF EN 10025'
            },
            states: [
                {
                    id: 'state_manufacturing',
                    name: 'En Production',
                    disposition: 'in_progress',
                    description: 'Produit en cours de fabrication',
                    actions: [
                        {
                            id: 'action_complete',
                            name: 'Finaliser Production',
                            businessStep: 'assembling',
                            type: 'main',
                            parameters: {
                                qualityCheck: true,
                                packaging: 'bundle'
                            },
                            targetState: 'state_finished'
                        }
                    ]
                }
            ]
        }
    ],
    
    relations: [
        {
            id: 'rel_001',
            source: 'obj_raw_material_001',
            target: 'obj_product_001',
            type: 'transforms_into',
            weight: 1,
            metadata: {
                transformationProcess: 'laminage',
                efficiency: 0.95
            }
        }
    ],
    
    workflows: [
        {
            id: 'wf_steel_processing',
            name: 'Traitement Acier',
            description: 'Workflow complet du traitement acier',
            steps: [
                { object: 'obj_raw_material_001', state: 'state_received', action: 'action_inspect' },
                { object: 'obj_raw_material_001', state: 'state_inspected', action: 'action_release' },
                { object: 'obj_product_001', state: 'state_manufacturing', action: 'action_complete' }
            ]
        }
    ]
};

/**
 * Configuration de test
 */
const TEST_CONFIG = {
    outputDirectory: './tests/export/output',
    tempDirectory: './tests/export/temp',
    maxTestDuration: 30000,  // 30 secondes max par test
    
    validation: {
        enablePerformanceTests: true,
        enableQualityTests: true,
        enableConformityTests: true,
        enableIntegrationTests: true
    }
};

describe('Export Validation Tests', () => {
    let testOutputDir;
    let testTempDir;
    
    beforeAll(async () => {
        // Créer répertoires de test
        testOutputDir = TEST_CONFIG.outputDirectory;
        testTempDir = TEST_CONFIG.tempDirectory;
        
        await fs.mkdir(testOutputDir, { recursive: true });
        await fs.mkdir(testTempDir, { recursive: true });
        
        console.log('🧪 Suite de tests export validation initialisée');
    });
    
    afterAll(async () => {
        // Nettoyer répertoires de test (optionnel - garder pour inspection)
        // await fs.rm(testOutputDir, { recursive: true, force: true });
        // await fs.rm(testTempDir, { recursive: true, force: true });
        
        console.log('🧹 Nettoyage tests terminé');
    });
    
    describe('WorkflowCompiler Validation', () => {
        let compiler;
        
        beforeEach(async () => {
            compiler = new WorkflowCompiler({
                outputFormat: 'comprehensive',
                enableValidation: true,
                enableOptimizations: true
            });
            
            await compiler.initialize();
        });
        
        test('should generate valid workflow documentation', async () => {
            const result = await compiler.compileWorkflow({
                projectName: 'Test Steel Processing',
                projectDescription: 'Test workflow pour validation',
                sources: {
                    workflowData: MOCK_WORKFLOW_DATA
                },
                output: {
                    directory: path.join(testOutputDir, 'workflow-compiler'),
                    filename: 'test-workflow-documentation.md'
                }
            });
            
            // Vérifications de base
            expect(result).toBeDefined();
            expect(result.success).toBe(true);
            expect(result.outputPath).toBeDefined();
            
            // Vérifier fichier généré
            const outputExists = await fs.access(result.outputPath).then(() => true).catch(() => false);
            expect(outputExists).toBe(true);
            
            // Vérifier contenu
            const content = await fs.readFile(result.outputPath, 'utf8');
            expect(content).toContain('# Test Steel Processing');
            expect(content).toContain('Acier Grade A');
            expect(content).toContain('inspecting');
            expect(content.length).toBeGreaterThan(1000);
            
            // Vérifier métadonnées
            expect(result.metadata).toBeDefined();
            expect(result.metadata.elementsProcessed).toBeGreaterThan(0);
            expect(result.metadata.compilationTime).toBeLessThan(10000); // < 10s
            
            // Vérifier validation
            expect(result.validation).toBeDefined();
            expect(result.validation.isValid).toBe(true);
        }, TEST_CONFIG.maxTestDuration);
        
        test('should generate complete API specifications', async () => {
            const result = await compiler.compileWorkflow({
                projectName: 'Test API Generation',
                sources: { workflowData: MOCK_WORKFLOW_DATA },
                apiConfiguration: {
                    baseUrl: 'https://test-api.example.com/v1',
                    generateEndpoints: {
                        objects: true,
                        states: true,
                        actions: true
                    }
                },
                output: {
                    directory: path.join(testOutputDir, 'api-specs'),
                    formats: ['markdown', 'openapi-json']
                }
            });
            
            expect(result.success).toBe(true);
            expect(result.apiSpec).toBeDefined();
            expect(result.apiSpec.endpoints).toBeDefined();
            expect(result.apiSpec.endpoints.length).toBeGreaterThan(0);
            
            // Vérifier endpoints générés
            const endpoints = result.apiSpec.endpoints;
            const objectEndpoints = endpoints.filter(e => e.path.includes('/objects'));
            const stateEndpoints = endpoints.filter(e => e.path.includes('/states'));
            const actionEndpoints = endpoints.filter(e => e.path.includes('/actions'));
            
            expect(objectEndpoints.length).toBeGreaterThan(0);
            expect(stateEndpoints.length).toBeGreaterThan(0);
            expect(actionEndpoints.length).toBeGreaterThan(0);
        });
        
        test('should validate EPCIS 2.0 compliance', async () => {
            const result = await compiler.compileWorkflow({
                projectName: 'EPCIS Compliance Test',
                sources: { workflowData: MOCK_WORKFLOW_DATA },
                validation: {
                    enableEPCISCompliance: true,
                    epcisVersion: '2.0'
                },
                output: {
                    directory: path.join(testOutputDir, 'epcis-compliance')
                }
            });
            
            expect(result.validation.epcis).toBeDefined();
            expect(result.validation.epcis.isCompliant).toBe(true);
            expect(result.validation.epcis.complianceLevel).toBeGreaterThan(90);
            
            // Vérifier business steps EPCIS
            const businessSteps = ['inspecting', 'storing', 'staging_outbound', 'assembling'];
            businessSteps.forEach(step => {
                expect(result.validation.epcis.validBusinessSteps).toContain(step);
            });
            
            // Vérifier dispositions EPCIS
            const dispositions = ['active', 'sellable_accessible', 'in_progress'];
            dispositions.forEach(disposition => {
                expect(result.validation.epcis.validDispositions).toContain(disposition);
            });
        });
    });
    
    describe('MatrixGenerator Validation', () => {
        let generator;
        
        beforeEach(async () => {
            generator = new MatrixGenerator({
                analysisDepth: 'comprehensive',
                includeMetrics: true,
                enableOptimizations: true
            });
            
            await generator.initialize();
        });
        
        test('should generate valid state transition matrix', async () => {
            const result = await generator.generateStateTransitionMatrix({
                workflowData: MOCK_WORKFLOW_DATA,
                visualization: 'heatmap',
                exportFormats: ['html', 'json'],
                outputDirectory: path.join(testOutputDir, 'matrices')
            });
            
            expect(result).toBeDefined();
            expect(result.type).toBe('stateTransition');
            expect(result.matrix).toBeDefined();
            expect(result.rowLabels).toBeDefined();
            expect(result.columnLabels).toBeDefined();
            
            // Vérifier matrice
            expect(Array.isArray(result.matrix)).toBe(true);
            expect(result.matrix.length).toBeGreaterThan(0);
            expect(result.rowLabels.length).toBe(result.matrix.length);
            expect(result.columnLabels.length).toBe(result.matrix[0].length);
            
            // Vérifier analytics
            expect(result.analytics).toBeDefined();
            expect(result.analytics.totalTransitions).toBeGreaterThan(0);
            expect(result.analytics.matrixDensity).toBeGreaterThan(0);
            expect(result.analytics.stateMetrics).toBeDefined();
            
            // Vérifier visualisations
            expect(result.visualizations).toBeDefined();
            expect(result.visualizations.html).toBeDefined();
            expect(result.visualizations.json).toBeDefined();
        });
        
        test('should generate comprehensive matrices suite', async () => {
            const result = await generator.generateAllMatrices({
                workflowData: MOCK_WORKFLOW_DATA,
                exportFormats: ['html'],
                outputDirectory: path.join(testOutputDir, 'all-matrices')
            });
            
            expect(result.matrices).toBeDefined();
            expect(result.matrices.stateTransition).toBeDefined();
            expect(result.matrices.actionFlow).toBeDefined();
            expect(result.matrices.systemMapping).toBeDefined();
            expect(result.matrices.dependency).toBeDefined();
            expect(result.matrices.timeSequence).toBeDefined();
            
            // Vérifier rapport consolidé
            expect(result.consolidatedReport).toBeDefined();
            expect(result.dashboard).toBeDefined();
            
            // Vérifier métadonnées
            expect(result.metadata.matricesGenerated).toBe(5);
            expect(result.metadata.totalGenerationTime).toBeGreaterThan(0);
        });
        
        test('should provide optimization recommendations', async () => {
            const result = await generator.generateStateTransitionMatrix({
                workflowData: MOCK_WORKFLOW_DATA,
                includeAnalytics: true
            });
            
            expect(result.analytics.recommendations).toBeDefined();
            expect(Array.isArray(result.analytics.recommendations)).toBe(true);
            
            // Vérifier structure des recommandations
            if (result.analytics.recommendations.length > 0) {
                const recommendation = result.analytics.recommendations[0];
                expect(recommendation.type).toBeDefined();
                expect(recommendation.priority).toBeDefined();
                expect(recommendation.recommendation).toBeDefined();
                expect(recommendation.expectedImpact).toBeDefined();
            }
        });
    });
    
    describe('OpenAPIGenerator Validation', () => {
        let generator;
        
        beforeEach(async () => {
            generator = new OpenAPIGenerator({
                apiTitle: 'Test ProcessMetaLanguage API',
                version: '1.0.0-test',
                enableSwaggerUI: true,
                enableEPCISCompliance: true
            });
            
            await generator.initialize();
        });
        
        test('should generate valid OpenAPI 3.0 specification', async () => {
            const result = await generator.generateCompleteAPI({
                workflowData: MOCK_WORKFLOW_DATA,
                outputFormats: ['json', 'yaml'],
                enableValidation: true,
                outputDirectory: path.join(testOutputDir, 'openapi')
            });
            
            expect(result).toBeDefined();
            expect(result.specification).toBeDefined();
            expect(result.validation.isValid).toBe(true);
            
            // Vérifier structure OpenAPI
            const spec = result.specification;
            expect(spec.openapi).toBe('3.0.3');
            expect(spec.info).toBeDefined();
            expect(spec.info.title).toBe('Test ProcessMetaLanguage API');
            expect(spec.paths).toBeDefined();
            expect(spec.components).toBeDefined();
            expect(spec.components.schemas).toBeDefined();
            
            // Vérifier schémas générés
            const schemas = spec.components.schemas;
            expect(schemas.Object).toBeDefined();
            expect(schemas.State).toBeDefined();
            expect(schemas.Action).toBeDefined();
            expect(schemas.Error).toBeDefined();
            
            // Vérifier endpoints
            const paths = Object.keys(spec.paths);
            expect(paths.some(p => p.includes('/objects'))).toBe(true);
            expect(paths.some(p => p.includes('/states'))).toBe(true);
            expect(paths.some(p => p.includes('/actions'))).toBe(true);
            
            // Vérifier fichiers générés
            expect(result.artifacts.specificationFiles.json).toBeDefined();
            expect(result.artifacts.specificationFiles.yaml).toBeDefined();
            
            const jsonExists = await fs.access(result.artifacts.specificationFiles.json).then(() => true).catch(() => false);
            expect(jsonExists).toBe(true);
        });
        
        test('should generate EPCIS-compliant schemas', async () => {
            const result = await generator.generateCompleteAPI({
                workflowData: MOCK_WORKFLOW_DATA,
                enableEPCISCompliance: true
            });
            
            const schemas = result.specification.components.schemas;
            
            // Vérifier schéma Action avec business steps EPCIS
            expect(schemas.Action).toBeDefined();
            expect(schemas.Action.properties.businessStep).toBeDefined();
            expect(schemas.Action.properties.businessStep.enum).toBeDefined();
            expect(schemas.Action.properties.businessStep.enum).toContain('inspecting');
            expect(schemas.Action.properties.businessStep.enum).toContain('storing');
            
            // Vérifier schéma State avec dispositions EPCIS
            expect(schemas.State).toBeDefined();
            expect(schemas.State.properties.disposition).toBeDefined();
            expect(schemas.State.properties.disposition.enum).toBeDefined();
            expect(schemas.State.properties.disposition.enum).toContain('active');
            expect(schemas.State.properties.disposition.enum).toContain('sellable_accessible');
        });
        
        test('should generate valid API endpoints with proper methods', async () => {
            const result = await generator.generateCompleteAPI({
                workflowData: MOCK_WORKFLOW_DATA
            });
            
            const paths = result.specification.paths;
            
            // Vérifier endpoints objects
            expect(paths['/objects']).toBeDefined();
            expect(paths['/objects'].get).toBeDefined(); // Liste
            expect(paths['/objects'].post).toBeDefined(); // Création
            
            expect(paths['/objects/{id}']).toBeDefined();
            expect(paths['/objects/{id}'].get).toBeDefined(); // Détail
            expect(paths['/objects/{id}'].put).toBeDefined(); // Mise à jour
            expect(paths['/objects/{id}'].delete).toBeDefined(); // Suppression
            
            // Vérifier endpoints actions avec exécution
            expect(paths['/actions/{id}/execute']).toBeDefined();
            expect(paths['/actions/{id}/execute'].post).toBeDefined();
            
            // Vérifier paramètres et réponses
            const getObjects = paths['/objects'].get;
            expect(getObjects.parameters).toBeDefined();
            expect(getObjects.responses).toBeDefined();
            expect(getObjects.responses['200']).toBeDefined();
            expect(getObjects.responses['400']).toBeDefined();
            expect(getObjects.responses['500']).toBeDefined();
        });
    });
    
    describe('360SmartConnect Mapper Validation', () => {
        let mapper;
        
        beforeEach(async () => {
            mapper = new SmartConnectMapper({
                apiBaseUrl: 'https://test.360smartconnect.com',
                enableWebhooks: true,
                syncMode: 'bidirectional',
                enableValidation: true
            });
            
            await mapper.initialize();
        });
        
        test('should generate valid 360SmartConnect mapping', async () => {
            const result = await mapper.generateCompleteMapping({
                workflowData: MOCK_WORKFLOW_DATA,
                outputFormats: ['json', 'yaml'],
                includeAPIs: true,
                enableValidation: true,
                outputDirectory: path.join(testOutputDir, '360sc-mapping')
            });
            
            expect(result).toBeDefined();
            expect(result.validation.isValid).toBe(true);
            
            // Vérifier avatars générés
            expect(result.avatars).toBeDefined();
            const avatarIds = Object.keys(result.avatars);
            expect(avatarIds.length).toBe(2); // 2 objets dans les données de test
            
            const avatar1 = result.avatars[avatarIds[0]];
            expect(avatar1.entity).toBeDefined();
            expect(avatar1.entity.uuid).toBeDefined();
            expect(avatar1.entity.name).toBeDefined();
            expect(avatar1.entity.type).toBeDefined();
            expect(avatar1.metadata).toBeDefined();
            expect(avatar1.metadata.status).toBeDefined();
            
            // Vérifier workflows générés
            expect(result.workflows).toBeDefined();
            expect(Array.isArray(result.workflows)).toBe(true);
            expect(result.workflows.length).toBeGreaterThan(0);
            
            const workflow = result.workflows[0];
            expect(workflow.action).toBeDefined();
            expect(workflow.action.uuid).toBeDefined();
            expect(workflow.action.name).toBeDefined();
            expect(workflow.action.businessStep).toBeDefined();
            expect(workflow.target).toBeDefined();
            expect(workflow.steps).toBeDefined();
            expect(Array.isArray(workflow.steps)).toBe(true);
            
            // Vérifier relations
            expect(result.relations).toBeDefined();
            expect(Array.isArray(result.relations)).toBe(true);
            expect(result.relations.length).toBeGreaterThan(0);
            
            // Vérifier configuration
            expect(result.configuration).toBeDefined();
            expect(result.configuration.version).toBe('2.1.0');
            expect(result.configuration.deployment).toBeDefined();
            expect(result.configuration.api).toBeDefined();
        });
        
        test('should preserve ProcessMetaLanguage semantics', async () => {
            const result = await mapper.generateCompleteMapping({
                workflowData: MOCK_WORKFLOW_DATA
            });
            
            // Vérifier préservation des types d'objets
            const avatars = Object.values(result.avatars);
            const rawMaterialAvatar = avatars.find(a => a.entity.name === 'Acier Grade A');
            const productAvatar = avatars.find(a => a.entity.name === 'Poutre IPN 200');
            
            expect(rawMaterialAvatar).toBeDefined();
            expect(rawMaterialAvatar.entity.type).toBe('material.raw');
            
            expect(productAvatar).toBeDefined();
            expect(productAvatar.entity.type).toBe('product.finished');
            
            // Vérifier préservation des business steps
            const workflows = result.workflows;
            const inspectWorkflow = workflows.find(w => w.action.name === 'Contrôle Qualité');
            const storeWorkflow = workflows.find(w => w.action.name === 'Stockage');
            
            expect(inspectWorkflow).toBeDefined();
            expect(inspectWorkflow.action.businessStep).toBe('inspecting');
            
            expect(storeWorkflow).toBeDefined();
            expect(storeWorkflow.action.businessStep).toBe('storing');
            
            // Vérifier préservation des relations
            const relations = result.relations;
            const transformsRelation = relations.find(r => 
                r.relation.type === 'process.transformsInto'
            );
            
            expect(transformsRelation).toBeDefined();
            expect(transformsRelation.relation.weight).toBe(1);
        });
        
        test('should generate bidirectional relations', async () => {
            const result = await mapper.generateCompleteMapping({
                workflowData: MOCK_WORKFLOW_DATA
            });
            
            const relations = result.relations;
            
            // Vérifier qu'il y a des relations directes et inverses
            expect(relations.length).toBeGreaterThan(1); // Au moins 1 relation + son inverse
            
            // Trouver relation directe et inverse
            const directRelation = relations.find(r => !r.metadata.inverse);
            const inverseRelation = relations.find(r => r.metadata.inverse);
            
            expect(directRelation).toBeDefined();
            expect(inverseRelation).toBeDefined();
            
            // Vérifier bidirectionnalité
            expect(directRelation.relation.from.uuid).toBe(inverseRelation.relation.to.uuid);
            expect(directRelation.relation.to.uuid).toBe(inverseRelation.relation.from.uuid);
        });
    });
    
    describe('Integration Tests', () => {
        test('should integrate all export modules together', async () => {
            // Test d'intégration bout-en-bout
            const workflowCompiler = new WorkflowCompiler();
            const matrixGenerator = new MatrixGenerator();
            const openApiGenerator = new OpenAPIGenerator();
            const scMapper = new SmartConnectMapper();
            
            await Promise.all([
                workflowCompiler.initialize(),
                matrixGenerator.initialize(),
                openApiGenerator.initialize(),
                scMapper.initialize()
            ]);
            
            // Compilation workflow complète
            const workflowResult = await workflowCompiler.compileWorkflow({
                projectName: 'Integration Test',
                sources: { workflowData: MOCK_WORKFLOW_DATA },
                output: { directory: path.join(testOutputDir, 'integration') }
            });
            
            // Génération matrices
            const matrixResult = await matrixGenerator.generateStateTransitionMatrix({
                workflowData: MOCK_WORKFLOW_DATA
            });
            
            // Génération API
            const apiResult = await openApiGenerator.generateCompleteAPI({
                workflowData: MOCK_WORKFLOW_DATA
            });
            
            // Mapping 360SmartConnect
            const mappingResult = await scMapper.generateCompleteMapping({
                workflowData: MOCK_WORKFLOW_DATA
            });
            
            // Vérifier que tous les modules fonctionnent ensemble
            expect(workflowResult.success).toBe(true);
            expect(matrixResult.type).toBe('stateTransition');
            expect(apiResult.validation.isValid).toBe(true);
            expect(mappingResult.validation.isValid).toBe(true);
            
            // Vérifier cohérence des données entre modules
            const workflowObjects = workflowResult.elementsProcessed?.objects || 0;
            const matrixStates = matrixResult.metadata.uniqueStates || 0;
            const apiEndpoints = Object.keys(apiResult.specification.paths).length;
            const avatarsCount = Object.keys(mappingResult.avatars).length;
            
            expect(workflowObjects).toBeGreaterThan(0);
            expect(matrixStates).toBeGreaterThan(0);
            expect(apiEndpoints).toBeGreaterThan(0);
            expect(avatarsCount).toBeGreaterThan(0);
        }, 60000); // Test plus long
    });
    
    describe('Performance Tests', () => {
        test('should handle large workflow data efficiently', async () => {
            // Créer données de test volumineuses
            const largeWorkflowData = generateLargeWorkflowData(100); // 100 objets
            
            const compiler = new WorkflowCompiler();
            await compiler.initialize();
            
            const startTime = Date.now();
            
            const result = await compiler.compileWorkflow({
                projectName: 'Performance Test',
                sources: { workflowData: largeWorkflowData },
                output: { directory: path.join(testOutputDir, 'performance') }
            });
            
            const duration = Date.now() - startTime;
            
            expect(result.success).toBe(true);
            expect(duration).toBeLessThan(30000); // < 30 secondes
            expect(result.metadata.compilationTime).toBeLessThan(30000);
            
            console.log(`🚀 Performance test: ${largeWorkflowData.objects.length} objets compilés en ${duration}ms`);
        }, 45000);
        
        test('should generate matrices for large datasets efficiently', async () => {
            const largeWorkflowData = generateLargeWorkflowData(50);
            
            const generator = new MatrixGenerator();
            await generator.initialize();
            
            const startTime = Date.now();
            
            const result = await generator.generateStateTransitionMatrix({
                workflowData: largeWorkflowData
            });
            
            const duration = Date.now() - startTime;
            
            expect(result.matrix).toBeDefined();
            expect(duration).toBeLessThan(15000); // < 15 secondes
            
            console.log(`📊 Matrix performance: ${result.rowLabels.length}x${result.columnLabels.length} matrice générée en ${duration}ms`);
        });
    });
    
    describe('Quality Assurance Tests', () => {
        test('should generate documentation with high quality score', async () => {
            const compiler = new WorkflowCompiler({
                enableQualityMetrics: true
            });
            await compiler.initialize();
            
            const result = await compiler.compileWorkflow({
                projectName: 'Quality Test',
                sources: { workflowData: MOCK_WORKFLOW_DATA },
                validation: {
                    enableAdvancedValidation: true,
                    qualityThresholds: {
                        minDocumentationCoverage: 80,
                        maxComplexityScore: 15
                    }
                }
            });
            
            expect(result.validation.isValid).toBe(true);
            
            if (result.quality) {
                expect(result.quality.overallScore).toBeGreaterThan(70);
                expect(result.quality.documentationCoverage).toBeGreaterThan(60);
            }
        });
        
        test('should validate all generated artifacts', async () => {
            const generator = new OpenAPIGenerator();
            await generator.initialize();
            
            const result = await generator.generateCompleteAPI({
                workflowData: MOCK_WORKFLOW_DATA,
                enableValidation: true
            });
            
            expect(result.validation.isValid).toBe(true);
            expect(result.validation.errors.length).toBe(0);
            
            // Vérifier que tous les schémas sont valides
            const schemas = result.specification.components.schemas;
            for (const [name, schema] of Object.entries(schemas)) {
                expect(schema.type).toBeDefined();
                expect(typeof schema).toBe('object');
            }
        });
    });
});

/**
 * Génère des données de workflow volumineuses pour tests de performance
 * @param {number} objectCount - Nombre d'objets à générer
 * @returns {Object} Données de workflow volumineuses
 */
function generateLargeWorkflowData(objectCount) {
    const objects = [];
    const relations = [];
    
    for (let i = 0; i < objectCount; i++) {
        const objectId = `obj_test_${i.toString().padStart(3, '0')}`;
        
        objects.push({
            id: objectId,
            name: `Objet Test ${i}`,
            type: i % 2 === 0 ? 'raw-material' : 'product',
            description: `Objet de test numéro ${i}`,
            metadata: {
                testIndex: i,
                category: `cat_${Math.floor(i / 10)}`
            },
            states: [
                {
                    id: `state_${objectId}_initial`,
                    name: 'État Initial',
                    disposition: 'active',
                    description: `État initial de l'objet ${i}`,
                    actions: [
                        {
                            id: `action_${objectId}_process`,
                            name: 'Traiter',
                            businessStep: 'assembling',
                            type: 'main',
                            parameters: { processType: 'standard' },
                            targetState: `state_${objectId}_processed`
                        }
                    ]
                },
                {
                    id: `state_${objectId}_processed`,
                    name: 'Traité',
                    disposition: 'sellable_accessible',
                    description: `État traité de l'objet ${i}`,
                    actions: []
                }
            ]
        });
        
        // Créer quelques relations
        if (i > 0 && i % 5 === 0) {
            relations.push({
                id: `rel_${i}`,
                source: `obj_test_${(i-1).toString().padStart(3, '0')}`,
                target: objectId,
                type: 'depends_on',
                weight: 1,
                metadata: { testRelation: true }
            });
        }
    }
    
    return {
        objects: objects,
        relations: relations,
        workflows: [
            {
                id: 'wf_large_test',
                name: 'Workflow Test Volumineux',
                description: `Workflow de test avec ${objectCount} objets`,
                steps: objects.slice(0, 10).map(obj => ({
                    object: obj.id,
                    state: obj.states[0].id,
                    action: obj.states[0].actions[0].id
                }))
            }
        ]
    };
}

// <!-- END OF FILE: export-validation.test.js -->