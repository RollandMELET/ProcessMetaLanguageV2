// <!-- START OF FILE: markdown-generator.test.js -->
// FILENAME: markdown-generator.test.js
// Version: 1.0.0
// Date: 2025-07-28 17:00
// Author: Rolland MELET & Claude Code
// Description: Tests unitaires MarkdownGenerator - génération documentation ProcessMetaLanguage - TASK-B004

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import { MarkdownGenerator, generateMarkdownFromCanvas } from '../../sync/markdown-generator.js';
import { TemplateProcessor } from '../../core/template-processor.js';

// Mock fs/promises et TemplateProcessor
vi.mock('fs/promises');
vi.mock('../../core/template-processor.js');

describe('MarkdownGenerator - Génération Documentation ProcessMetaLanguage', () => {
    let generator;
    let mockTemplateProcessor;
    
    beforeEach(() => {
        // Mock TemplateProcessor
        mockTemplateProcessor = {
            syncObjectToTemplate: vi.fn(),
            syncStateToTemplate: vi.fn(),
            syncActionToTemplate: vi.fn(),
            clearCache: vi.fn()
        };
        
        vi.mocked(TemplateProcessor).mockImplementation(() => mockTemplateProcessor);
        
        generator = new MarkdownGenerator({
            templatesDir: './templates',
            outputDir: './docs/generated',
            maxGenerationTimeMs: 3000
        });
        
        // Reset tous les mocks
        vi.clearAllMocks();
    });
    
    afterEach(() => {
        generator.clearCache();
    });
    
    describe('Constructor et Configuration', () => {
        it('should initialize with default configuration', () => {
            const defaultGenerator = new MarkdownGenerator();
            
            expect(defaultGenerator.config.outputDirs.objects).toBe('./docs/generated/objects');
            expect(defaultGenerator.config.templates.object).toBe('object-template');
            expect(defaultGenerator.config.maxGenerationTimeMs).toBe(5000);
            expect(defaultGenerator.stats.objectsGenerated).toBe(0);
        });
        
        it('should merge custom configuration', () => {
            const customConfig = {
                outputDirs: {
                    objects: './custom/objects',
                    states: './custom/states'
                },
                maxGenerationTimeMs: 8000,
                generateConsolidatedWorkflow: false
            };
            
            const customGenerator = new MarkdownGenerator(customConfig);
            
            expect(customGenerator.config.outputDirs.objects).toBe('./custom/objects');
            expect(customGenerator.config.maxGenerationTimeMs).toBe(8000);
            expect(customGenerator.config.generateConsolidatedWorkflow).toBe(false);
        });
    });
    
    describe('Output Directory Creation', () => {
        it('should create all required output directories', async () => {
            vi.mocked(fs.mkdir).mockResolvedValue(undefined);
            
            await generator._createOutputDirectories();
            
            expect(fs.mkdir).toHaveBeenCalledWith('./docs/generated/objects', { recursive: true });
            expect(fs.mkdir).toHaveBeenCalledWith('./docs/generated/states', { recursive: true });
            expect(fs.mkdir).toHaveBeenCalledWith('./docs/generated/actions', { recursive: true });
            expect(fs.mkdir).toHaveBeenCalledWith('./docs/generated/workflows', { recursive: true });
            expect(fs.mkdir).toHaveBeenCalledWith('./docs/generated', { recursive: true });
        });
        
        it('should handle directory creation errors gracefully', async () => {
            vi.mocked(fs.mkdir).mockRejectedValueOnce(new Error('Permission denied'));
            
            await generator._createOutputDirectories();
            
            expect(generator.errors).toHaveLength(1);
            expect(generator.errors[0].level).toBe('warning');
        });
    });
    
    describe('Object Data Preparation', () => {
        it('should prepare complete object data for template', () => {
            const canvasObject = {
                id: 'obj_001',
                name: 'Lot Acier A001',
                objectType: 'raw-material',
                tracedEntity: 'Lot-Acier-A001',
                position: { x: 100, y: 200 },
                dimensions: { width: 120, height: 80 },
                properties: {
                    backgroundColor: '#4CAF50',
                    strokeColor: '#2E7D32'
                }
            };
            
            const result = generator._prepareObjectData(canvasObject);
            
            expect(result).toMatchObject({
                uniqueId: 'obj_001',
                objectName: 'Lot Acier A001',
                objectType: 'raw-material',
                tracedEntity: 'Lot-Acier-A001',
                position: { x: 100, y: 200 },
                dimensions: { width: 120, height: 80 },
                backgroundColor: '#4CAF50',
                strokeColor: '#2E7D32',
                canvasElementId: 'obj_001'
            });
            
            expect(result.businessLocation).toContain('raw-material');
            expect(result.createdAt).toBeDefined();
            expect(result.userMetadata.extractedFromCanvas).toBe(true);
        });
        
        it('should provide defaults for missing object properties', () => {
            const minimalObject = {
                id: 'obj_min',
                name: 'Objet Minimal'
            };
            
            const result = generator._prepareObjectData(minimalObject);
            
            expect(result.objectType).toBe('generic-object');
            expect(result.position).toEqual({ x: 0, y: 0 });
            expect(result.dimensions).toEqual({ width: 120, height: 80 });
            expect(result.backgroundColor).toBe('#4CAF50');
            expect(result.userMetadata.operator).toBe('System');
        });
    });
    
    describe('State Data Preparation', () => {
        it('should prepare complete state data with main action', () => {
            const canvasState = {
                id: 'state_001',
                name: 'En Production',
                stateName: 'Production_Phase_1',
                parentObjectId: 'obj_001',
                disposition: 'active',
                position: { x: 150, y: 220 },
                properties: {
                    backgroundColor: '#2196F3'
                }
            };
            
            const result = generator._prepareStateData(canvasState);
            
            expect(result).toMatchObject({
                uniqueId: 'state_001',
                stateName: 'Production_Phase_1',
                parentObjectId: 'obj_001',
                disposition: 'active',
                position: { x: 150, y: 220 },
                backgroundColor: '#2196F3'
            });
            
            // Vérifier action principale automatique
            expect(result.mainAction).toMatchObject({
                actionName: 'Consulter_Production_Phase_1',
                actionType: 'main_action',
                automaticallyGenerated: true
            });
            
            expect(result.businessStep).toBe('observing');
            expect(result.secondaryActions).toEqual([]);
        });
        
        it('should handle state without specific name', () => {
            const genericState = {
                id: 'state_gen',
                name: 'État Générique',
                parentObjectId: 'obj_001'
            };
            
            const result = generator._prepareStateData(genericState);
            
            expect(result.stateName).toBe('État Générique');
            expect(result.mainAction.actionName).toBe('Consulter_État_Générique');
            expect(result.disposition).toBe('active');
        });
    });
    
    describe('Action Data Preparation', () => {
        it('should prepare complete action data with workflow', () => {
            const canvasAction = {
                id: 'action_001',
                name: 'Contrôler Qualité',
                actionName: 'Valider_Qualite_Lot',
                actionType: 'validation_action',
                parentStateId: 'state_001',
                position: { x: 200, y: 300 },
                properties: {
                    strokeColor: '#666666'
                }
            };
            
            const result = generator._prepareActionData(canvasAction);
            
            expect(result).toMatchObject({
                uniqueId: 'action_001',
                actionName: 'Valider_Qualite_Lot',
                actionType: 'validation_action',
                actionCategory: 'validation',
                parentStateId: 'state_001',
                position: { x: 200, y: 300 },
                backgroundColor: '#F44336' // Couleur validation_action
            });
            
            // Vérifier workflow par défaut
            expect(result.workflowInternal.steps).toHaveLength(1);
            expect(result.workflowInternal.steps[0].name).toBe('Exécution action');
            expect(result.workflowInternal.rollback.supported).toBe(true);
            
            // Vérifier paramètres par défaut
            expect(result.inputParameters.required).toEqual([]);
            expect(result.outputParameters.success).toHaveLength(1);
            expect(result.outputParameters.success[0].name).toBe('execution_result');
        });
        
        it('should infer business step from action name', () => {
            const actions = [
                { name: 'Recevoir Marchandise', expected: 'receiving' },
                { name: 'Expedier Colis', expected: 'shipping' },
                { name: 'Stocker Produit', expected: 'storing' },
                { name: 'Transformer Matière', expected: 'transforming' },
                { name: 'Contrôler Qualité', expected: 'inspecting' },
                { name: 'Emballer Commande', expected: 'packing' },
                { name: 'Action Standard', expected: 'observing' }
            ];
            
            actions.forEach(({ name, expected }) => {
                const result = generator._prepareActionData({ id: 'test', name });
                expect(result.businessStep).toBe(expected);
            });
        });
        
        it('should get correct action colors by type', () => {
            const actionTypes = [
                { type: 'main_action', color: '#2196F3' },
                { type: 'secondary_action', color: '#FF9800' },
                { type: 'workflow_action', color: '#4CAF50' },
                { type: 'api_action', color: '#9C27B0' },
                { type: 'validation_action', color: '#F44336' },
                { type: 'transformation_action', color: '#607D8B' }
            ];
            
            actionTypes.forEach(({ type, color }) => {
                const result = generator._prepareActionData({ 
                    id: 'test',
                    name: 'Test Action',
                    actionType: type 
                });
                expect(result.backgroundColor).toBe(color);
            });
        });
    });
    
    describe('Batch Creation', () => {
        it('should create correct batches for parallel processing', () => {
            const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
            const batches = generator._createBatches(items, 4);
            
            expect(batches).toHaveLength(3);
            expect(batches[0]).toEqual([1, 2, 3, 4]);
            expect(batches[1]).toEqual([5, 6, 7, 8]);
            expect(batches[2]).toEqual([9, 10, 11]);
        });
        
        it('should handle empty array', () => {
            const batches = generator._createBatches([], 5);
            expect(batches).toEqual([]);
        });
        
        it('should handle single item', () => {
            const batches = generator._createBatches(['item'], 10);
            expect(batches).toEqual([['item']]);
        });
    });
    
    describe('Parallel Generation', () => {
        it('should generate objects in parallel batches', async () => {
            const objects = [
                { id: 'obj1', name: 'Object 1' },
                { id: 'obj2', name: 'Object 2' },
                { id: 'obj3', name: 'Object 3' }
            ];
            
            mockTemplateProcessor.syncObjectToTemplate
                .mockResolvedValueOnce('./docs/generated/objects/object-1.md')
                .mockResolvedValueOnce('./docs/generated/objects/object-2.md')
                .mockResolvedValueOnce('./docs/generated/objects/object-3.md');
            
            await generator._generateObjectsParallel(objects);
            
            expect(mockTemplateProcessor.syncObjectToTemplate).toHaveBeenCalledTimes(3);
            expect(generator.stats.objectsGenerated).toBe(3);
            expect(generator.generatedFiles).toHaveLength(3);
        });
        
        it('should handle generation errors gracefully', async () => {
            const objects = [
                { id: 'obj1', name: 'Object 1' },
                { id: 'obj2', name: 'Object 2' }
            ];
            
            mockTemplateProcessor.syncObjectToTemplate
                .mockResolvedValueOnce('./docs/generated/objects/object-1.md')
                .mockRejectedValueOnce(new Error('Template error'));
            
            await generator._generateObjectsParallel(objects);
            
            expect(generator.stats.objectsGenerated).toBe(1);
            expect(generator.errors).toHaveLength(1);
            expect(generator.errors[0].level).toBe('error');
        });
        
        it('should generate states with proper data', async () => {
            const states = [
                { 
                    id: 'state1', 
                    name: 'Production',
                    parentObjectId: 'obj1' 
                }
            ];
            
            mockTemplateProcessor.syncStateToTemplate
                .mockResolvedValueOnce('./docs/generated/states/production.md');
            
            await generator._generateStatesParallel(states);
            
            expect(mockTemplateProcessor.syncStateToTemplate).toHaveBeenCalledTimes(1);
            
            const stateData = mockTemplateProcessor.syncStateToTemplate.mock.calls[0][0];
            expect(stateData.stateName).toBe('Production');
            expect(stateData.mainAction.automaticallyGenerated).toBe(true);
        });
        
        it('should generate actions with workflow', async () => {
            const actions = [
                {
                    id: 'action1',
                    name: 'Contrôler',
                    actionType: 'validation_action'
                }
            ];
            
            mockTemplateProcessor.syncActionToTemplate
                .mockResolvedValueOnce('./docs/generated/actions/controler.md');
            
            await generator._generateActionsParallel(actions);
            
            expect(mockTemplateProcessor.syncActionToTemplate).toHaveBeenCalledTimes(1);
            
            const actionData = mockTemplateProcessor.syncActionToTemplate.mock.calls[0][0];
            expect(actionData.actionCategory).toBe('validation');
            expect(actionData.workflowInternal.rollback.supported).toBe(true);
        });
    });
    
    describe('Consolidated Workflow Generation', () => {
        it('should generate consolidated workflow document', async () => {
            const canvasData = {
                metadata: {
                    sourceFile: 'test-canvas.excalidraw',
                    processingTimeMs: 1500
                },
                objects: [
                    { id: 'obj1', name: 'Lot Acier', objectType: 'raw-material', position: { x: 100, y: 100 } }
                ],
                states: [
                    { id: 'state1', name: 'Production', parentObjectId: 'obj1', position: { x: 110, y: 120 } }
                ],
                actions: [
                    { id: 'action1', name: 'Contrôler', parentStateId: 'state1', position: { x: 150, y: 140 } }
                ],
                relationships: [
                    { type: 'state_belongs_to_object', source: { id: 'state1' }, target: { id: 'obj1' } }
                ]
            };
            
            vi.mocked(fs.writeFile).mockResolvedValue(undefined);
            
            await generator._generateConsolidatedWorkflow(canvasData);
            
            expect(fs.writeFile).toHaveBeenCalledTimes(1);
            
            const [filePath, content] = fs.writeFile.mock.calls[0];
            expect(filePath).toContain('workflow-consolidé.md');
            expect(content).toContain('# Workflow ProcessMetaLanguage Consolidé');
            expect(content).toContain('test-canvas.excalidraw');
            expect(content).toContain('Lot Acier');
            expect(content).toContain('Production');
            expect(content).toContain('state_belongs_to_object');
            
            expect(generator.stats.consolidatedWorkflowGenerated).toBe(true);
        });
    });
    
    describe('Index Files Generation', () => {
        it('should generate main index file', async () => {
            generator.stats.objectsGenerated = 5;
            generator.stats.statesGenerated = 8;
            generator.stats.actionsGenerated = 12;
            generator.stats.totalGenerationTime = 2500;
            generator.generatedFiles = ['file1.md', 'file2.md', 'file3.md'];
            
            vi.mocked(fs.writeFile).mockResolvedValue(undefined);
            
            await generator._generateIndexFiles();
            
            expect(fs.writeFile).toHaveBeenCalledTimes(1);
            
            const [filePath, content] = fs.writeFile.mock.calls[0];
            expect(filePath).toContain('README.md');
            expect(content).toContain('# ProcessMetaLanguage - Documentation Générée');
            expect(content).toContain('**Objets générés:** 5');
            expect(content).toContain('**États générés:** 8');
            expect(content).toContain('**Actions générées:** 12');
            expect(content).toContain('**Performance:** 2500ms');
        });
    });
    
    describe('Full Generation Integration', () => {
        it('should generate complete documentation from canvas data', async () => {
            const canvasData = {
                metadata: {
                    sourceFile: 'test-canvas.excalidraw',
                    processingTimeMs: 1200
                },
                objects: [
                    { id: 'obj1', name: 'Lot Test', objectType: 'batch' }
                ],
                states: [
                    { id: 'state1', name: 'État Test', parentObjectId: 'obj1' }
                ],
                actions: [
                    { id: 'action1', name: 'Action Test', parentStateId: 'state1' }
                ],
                relationships: []
            };
            
            // Mock tous les appels nécessaires
            vi.mocked(fs.mkdir).mockResolvedValue(undefined);
            vi.mocked(fs.writeFile).mockResolvedValue(undefined);
            
            mockTemplateProcessor.syncObjectToTemplate
                .mockResolvedValue('./docs/generated/objects/lot-test.md');
            mockTemplateProcessor.syncStateToTemplate
                .mockResolvedValue('./docs/generated/states/etat-test.md');
            mockTemplateProcessor.syncActionToTemplate
                .mockResolvedValue('./docs/generated/actions/action-test.md');
            
            const result = await generator.generateFromCanvas(canvasData, {
                parallelGeneration: true,
                generateWorkflow: true
            });
            
            expect(result.success).toBe(true);
            expect(result.objectsGenerated).toBe(1);
            expect(result.statesGenerated).toBe(1);
            expect(result.actionsGenerated).toBe(1);
            expect(result.filesGenerated).toBeGreaterThanOrEqual(3); // objects + states + actions + workflow + index
            expect(result.metadata.performanceTarget).toBe(true);
            
            // Vérifier que tous les templates ont été appelés
            expect(mockTemplateProcessor.syncObjectToTemplate).toHaveBeenCalledTimes(1);
            expect(mockTemplateProcessor.syncStateToTemplate).toHaveBeenCalledTimes(1);
            expect(mockTemplateProcessor.syncActionToTemplate).toHaveBeenCalledTimes(1);
        });
        
        it('should handle empty canvas data', async () => {
            const emptyCanvasData = {
                metadata: {
                    sourceFile: 'empty-canvas.excalidraw',
                    processingTimeMs: 100
                },
                objects: [],
                states: [],
                actions: [],
                relationships: []
            };
            
            vi.mocked(fs.mkdir).mockResolvedValue(undefined);
            vi.mocked(fs.writeFile).mockResolvedValue(undefined);
            
            const result = await generator.generateFromCanvas(emptyCanvasData);
            
            expect(result.success).toBe(true);
            expect(result.objectsGenerated).toBe(0);
            expect(result.statesGenerated).toBe(0);
            expect(result.actionsGenerated).toBe(0);
            expect(result.filesGenerated).toBeGreaterThanOrEqual(1); // Au moins index + workflow
        });
        
        it('should respect performance targets', async () => {
            const canvasData = {
                metadata: {
                    sourceFile: 'performance-test.excalidraw',
                    processingTimeMs: 500
                },
                objects: Array.from({ length: 10 }, (_, i) => ({ 
                    id: `obj${i}`, 
                    name: `Object ${i}` 
                })),
                states: [],
                actions: [],
                relationships: []
            };
            
            vi.mocked(fs.mkdir).mockResolvedValue(undefined);
            vi.mocked(fs.writeFile).mockResolvedValue(undefined);
            
            // Simuler génération rapide
            mockTemplateProcessor.syncObjectToTemplate.mockImplementation(() => 
                new Promise(resolve => setTimeout(() => resolve('./output.md'), 10))
            );
            
            const result = await generator.generateFromCanvas(canvasData);
            
            expect(result.metadata.totalGenerationTime).toBeLessThan(3000); // Config test
            expect(result.metadata.performanceTarget).toBe(true);
        });
    });
    
    describe('Error Handling', () => {
        it('should handle template generation errors', async () => {
            const canvasData = {
                metadata: { sourceFile: 'error-test.excalidraw' },
                objects: [{ id: 'obj1', name: 'Test Object' }],
                states: [],
                actions: [],
                relationships: []
            };
            
            vi.mocked(fs.mkdir).mockResolvedValue(undefined);
            mockTemplateProcessor.syncObjectToTemplate.mockRejectedValue(new Error('Template error'));
            
            const result = await generator.generateFromCanvas(canvasData);
            
            expect(result.success).toBe(true); // Continue malgré les erreurs
            expect(result.objectsGenerated).toBe(0);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0].message).toContain('Test Object');
        });
        
        it('should handle critical generation failure', async () => {
            const canvasData = {
                metadata: { sourceFile: 'critical-error.excalidraw' },
                objects: [],
                states: [],
                actions: [],
                relationships: []
            };
            
            vi.mocked(fs.mkdir).mockRejectedValue(new Error('Critical filesystem error'));
            
            await expect(generator.generateFromCanvas(canvasData))
                .rejects.toThrow('Impossible de générer la documentation');
        });
    });
    
    describe('Performance Stats', () => {
        it('should track detailed performance statistics', () => {
            generator.stats.objectsGenerated = 10;
            generator.stats.totalGenerationTime = 2500;
            generator.errors.push({ level: 'warning' });
            generator.generatedFiles.push('file1.md');
            
            const stats = generator.getPerformanceStats();
            
            expect(stats).toMatchObject({
                objectsGenerated: 10,
                totalGenerationTime: 2500,
                performanceTarget: true, // < 3000ms config test
                errorsTotal: 1,
                warningsTotal: 1,
                filesGeneratedTotal: 1
            });
        });
        
        it('should clear cache and reset all stats', () => {
            generator.stats.objectsGenerated = 5;
            generator.errors.push({ level: 'error' });
            generator.generatedFiles.push('test.md');
            
            generator.clearCache();
            
            expect(generator.stats.objectsGenerated).toBe(0);
            expect(generator.errors).toHaveLength(0);
            expect(generator.generatedFiles).toHaveLength(0);
            expect(mockTemplateProcessor.clearCache).toHaveBeenCalledTimes(1);
        });
    });
    
    describe('Utility Function', () => {
        it('should work with generateMarkdownFromCanvas utility function', async () => {
            const canvasData = {
                metadata: { sourceFile: 'utility-test.excalidraw' },
                objects: [{ id: 'obj1', name: 'Test Object' }],
                states: [],
                actions: [],
                relationships: []
            };
            
            vi.mocked(fs.mkdir).mockResolvedValue(undefined);
            vi.mocked(fs.writeFile).mockResolvedValue(undefined);
            mockTemplateProcessor.syncObjectToTemplate
                .mockResolvedValue('./docs/generated/objects/test-object.md');
            
            const result = await generateMarkdownFromCanvas(canvasData, {
                templatesDir: './custom-templates'
            });
            
            expect(result.success).toBe(true);
            expect(result.objectsGenerated).toBe(1);
        });
    });
});

// <!-- END OF FILE: markdown-generator.test.js -->