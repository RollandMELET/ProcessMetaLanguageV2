// <!-- START OF FILE: canvas-reader.test.js -->
// FILENAME: canvas-reader.test.js
// Version: 1.0.0
// Date: 2025-07-28 16:45
// Author: Rolland MELET & Claude Code
// Description: Tests unitaires CanvasReader - détection éléments ProcessMetaLanguage - TASK-B004

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs/promises';
import { CanvasReader, readProcessCanvas } from '../../sync/canvas-reader.js';

// Mock fs/promises
vi.mock('fs/promises');

describe('CanvasReader - Lecture Canvas ProcessMetaLanguage', () => {
    let reader;
    
    beforeEach(() => {
        reader = new CanvasReader({
            maxProcessingTimeMs: 3000,
            maxElementsPerRead: 100
        });
        
        // Reset tous les mocks
        vi.clearAllMocks();
    });
    
    afterEach(() => {
        reader.clearCache();
    });
    
    describe('Constructor et Configuration', () => {
        it('should initialize with default configuration', () => {
            const defaultReader = new CanvasReader();
            
            expect(defaultReader.config.processTags.object).toBe('#process-object');
            expect(defaultReader.config.processTags.state).toBe('#process-state');
            expect(defaultReader.config.processTags.action).toBe('#process-action');
            expect(defaultReader.config.maxProcessingTimeMs).toBe(5000);
            expect(defaultReader.stats.elementsProcessed).toBe(0);
        });
        
        it('should merge custom configuration', () => {
            const customConfig = {
                processTags: {
                    object: '#custom-object',
                    state: '#custom-state',
                    action: '#custom-action'
                },
                maxProcessingTimeMs: 8000
            };
            
            const customReader = new CanvasReader(customConfig);
            
            expect(customReader.config.processTags.object).toBe('#custom-object');
            expect(customReader.config.maxProcessingTimeMs).toBe(8000);
        });
    });
    
    describe('File Validation', () => {
        it('should validate existing excalidraw file', async () => {
            // Mock file exists et stats
            vi.mocked(fs.access).mockResolvedValue(undefined);
            vi.mocked(fs.stat).mockResolvedValue({
                isFile: () => true,
                size: 1024 * 100 // 100KB
            });
            
            await expect(reader._validateCanvasFile('test.excalidraw')).resolves.not.toThrow();
            
            expect(fs.access).toHaveBeenCalledWith('test.excalidraw');
            expect(fs.stat).toHaveBeenCalledWith('test.excalidraw');
        });
        
        it('should reject non-existent file', async () => {
            vi.mocked(fs.access).mockRejectedValue(new Error('File not found'));
            
            await expect(reader._validateCanvasFile('non-existent.excalidraw'))
                .rejects.toThrow('Fichier canvas invalide');
        });
        
        it('should reject oversized file', async () => {
            vi.mocked(fs.access).mockResolvedValue(undefined);
            vi.mocked(fs.stat).mockResolvedValue({
                isFile: () => true,
                size: 60 * 1024 * 1024 // 60MB
            });
            
            await expect(reader._validateCanvasFile('huge.excalidraw'))
                .rejects.toThrow('Fichier canvas trop volumineux');
        });
        
        it('should warn about non-standard extension', async () => {
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            
            vi.mocked(fs.access).mockResolvedValue(undefined);
            vi.mocked(fs.stat).mockResolvedValue({
                isFile: () => true,
                size: 1024
            });
            
            await reader._validateCanvasFile('test.json');
            
            expect(reader.errors).toHaveLength(1);
            expect(reader.errors[0].level).toBe('warning');
            expect(reader.errors[0].message).toContain('Extension de fichier non standard');
            
            consoleSpy.mockRestore();
        });
    });
    
    describe('Canvas File Loading', () => {
        it('should load and parse valid canvas file', async () => {
            const mockCanvasData = {
                elements: [
                    { id: 'elem1', type: 'rectangle', x: 0, y: 0 },
                    { id: 'elem2', type: 'text', text: 'Test #process-object' }
                ],
                appState: {}
            };
            
            vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockCanvasData));
            
            const result = await reader._loadCanvasFile('test.excalidraw');
            
            expect(result).toEqual(mockCanvasData);
            expect(result.elements).toHaveLength(2);
        });
        
        it('should reject empty file', async () => {
            vi.mocked(fs.readFile).mockResolvedValue('');
            
            await expect(reader._loadCanvasFile('empty.excalidraw'))
                .rejects.toThrow('Fichier canvas vide');
        });
        
        it('should reject invalid JSON', async () => {
            vi.mocked(fs.readFile).mockResolvedValue('{ invalid json');
            
            await expect(reader._loadCanvasFile('invalid.excalidraw'))
                .rejects.toThrow('Format JSON invalide');
        });
        
        it('should reject missing elements property', async () => {
            vi.mocked(fs.readFile).mockResolvedValue('{"appState": {}}');
            
            await expect(reader._loadCanvasFile('no-elements.excalidraw'))
                .rejects.toThrow('Structure Excalidraw invalide');
        });
    });
    
    describe('Element Text Extraction', () => {
        it('should extract text from text element', () => {
            const textElement = {
                type: 'text',
                text: 'Mon Objet #process-object'
            };
            
            const result = reader._extractElementText(textElement);
            expect(result).toBe('Mon Objet #process-object');
        });
        
        it('should extract rawText from shape element', () => {
            const shapeElement = {
                type: 'rectangle',
                rawText: 'État Production #process-state'
            };
            
            const result = reader._extractElementText(shapeElement);
            expect(result).toBe('État Production #process-state');
        });
        
        it('should extract text from customData', () => {
            const customElement = {
                type: 'ellipse',
                customData: {
                    text: 'Action Contrôle #process-action'
                }
            };
            
            const result = reader._extractElementText(customElement);
            expect(result).toBe('Action Contrôle #process-action');
        });
        
        it('should return empty string for no text', () => {
            const noTextElement = {
                type: 'rectangle',
                x: 100,
                y: 200
            };
            
            const result = reader._extractElementText(noTextElement);
            expect(result).toBe('');
        });
    });
    
    describe('Process Tag Detection', () => {
        it('should detect object tag', () => {
            const text = 'Lot Matière Première #process-object';
            const result = reader._detectProcessTag(text);
            
            expect(result).toEqual({
                type: 'object',
                tag: '#process-object'
            });
        });
        
        it('should detect state tag', () => {
            const text = 'En Production #process-state';
            const result = reader._detectProcessTag(text);
            
            expect(result).toEqual({
                type: 'state',
                tag: '#process-state'
            });
        });
        
        it('should detect action tag', () => {
            const text = 'Valider Qualité #process-action';
            const result = reader._detectProcessTag(text);
            
            expect(result).toEqual({
                type: 'action',
                tag: '#process-action'
            });
        });
        
        it('should return null for no process tag', () => {
            const text = 'Texte normal sans tag';
            const result = reader._detectProcessTag(text);
            
            expect(result).toBeNull();
        });
        
        it('should detect first tag when multiple present', () => {
            const text = 'Element #process-object #process-state';
            const result = reader._detectProcessTag(text);
            
            expect(result.type).toBe('object');
        });
    });
    
    describe('Element Name Extraction', () => {
        it('should extract clean element name', () => {
            const text = 'Lot Acier A001 #process-object';
            const result = reader._extractElementName(text, '#process-object');
            
            expect(result).toBe('Lot Acier A001');
        });
        
        it('should normalize whitespace and newlines', () => {
            const text = '  Objet  Test  \n\n  #process-object  ';
            const result = reader._extractElementName(text, '#process-object');
            
            expect(result).toBe('Objet Test');
        });
        
        it('should provide default name for empty result', () => {
            const text = '#process-object';
            const result = reader._extractElementName(text, '#process-object');
            
            expect(result).toBe('Élément_Sans_Nom');
        });
    });
    
    describe('Type Inference', () => {
        it('should infer object types correctly', () => {
            expect(reader._inferObjectType('Lot-001 matière première')).toBe('raw-material');
            expect(reader._inferObjectType('Produit fini ABC')).toBe('product');
            expect(reader._inferObjectType('Batch de production')).toBe('batch');
            expect(reader._inferObjectType('Composant électronique')).toBe('component');
            expect(reader._inferObjectType('Équipement four')).toBe('equipment');
            expect(reader._inferObjectType('Location A1')).toBe('location');
            expect(reader._inferObjectType('Autre chose')).toBe('generic-object');
        });
        
        it('should infer dispositions correctly', () => {
            expect(reader._inferDisposition('État actif production')).toBe('active');
            expect(reader._inferDisposition('En transit vers client')).toBe('in_transit');
            expect(reader._inferDisposition('Stocké magasin')).toBe('stored');
            expect(reader._inferDisposition('Matière consommé')).toBe('consumed');
            expect(reader._inferDisposition('Produit détruit')).toBe('destroyed');
            expect(reader._inferDisposition('Pièce endommagé')).toBe('damaged');
            expect(reader._inferDisposition('État normal')).toBe('active');
        });
        
        it('should infer action types correctly', () => {
            expect(reader._inferActionType('Action principal données')).toBe('main_action');
            expect(reader._inferActionType('Transition secondaire')).toBe('secondary_action');
            expect(reader._inferActionType('Workflow processus')).toBe('workflow_action');
            expect(reader._inferActionType('Service API')).toBe('api_action');
            expect(reader._inferActionType('Contrôle validation')).toBe('validation_action');
            expect(reader._inferActionType('Action normale')).toBe('secondary_action');
        });
    });
    
    describe('Element Analysis', () => {
        it('should analyze process object element', async () => {
            const element = {
                id: 'obj_001',
                type: 'rectangle',
                x: 100,
                y: 200,
                width: 120,
                height: 80,
                text: 'Lot Acier A001 #process-object',
                backgroundColor: '#4CAF50'
            };
            
            // Mock text extraction
            vi.spyOn(reader, '_extractElementText').mockReturnValue('Lot Acier A001 #process-object');
            
            const result = await reader._analyzeElement(element);
            
            expect(result).toMatchObject({
                type: 'object',
                id: 'obj_001',
                name: 'Lot Acier A001',
                position: { x: 100, y: 200 },
                dimensions: { width: 120, height: 80 },
                objectType: 'raw-material',
                tracedEntity: 'Lot Acier A001'
            });
            
            expect(result.metadata.detectedTag).toBe('#process-object');
        });
        
        it('should analyze process state element', async () => {
            const element = {
                id: 'state_001',
                type: 'text',
                text: 'En Production #process-state',
                x: 150,
                y: 220,
                backgroundColor: '#2196F3'
            };
            
            vi.spyOn(reader, '_extractElementText').mockReturnValue('En Production #process-state');
            
            const result = await reader._analyzeElement(element);
            
            expect(result).toMatchObject({
                type: 'state',
                id: 'state_001',
                name: 'En Production',
                stateName: 'En Production',
                disposition: 'active'
            });
        });
        
        it('should analyze process action element', async () => {
            const element = {
                id: 'action_001',
                type: 'rectangle',
                text: 'Contrôler Qualité #process-action',
                x: 200,
                y: 300,
                width: 140,
                height: 60
            };
            
            vi.spyOn(reader, '_extractElementText').mockReturnValue('Contrôler Qualité #process-action');
            
            const result = await reader._analyzeElement(element);
            
            expect(result).toMatchObject({
                type: 'action',
                id: 'action_001',
                name: 'Contrôler Qualité',
                actionName: 'Contrôler Qualité',
                actionType: 'validation_action'
            });
        });
        
        it('should return null for non-process element', async () => {
            const element = {
                id: 'normal_001',
                type: 'rectangle',
                text: 'Élément normal sans tag'
            };
            
            vi.spyOn(reader, '_extractElementText').mockReturnValue('Élément normal sans tag');
            
            const result = await reader._analyzeElement(element);
            
            expect(result).toBeNull();
        });
    });
    
    describe('Spatial Relationships', () => {
        it('should detect state belonging to object by proximity', () => {
            const processElements = {
                objects: [
                    { id: 'obj1', position: { x: 100, y: 100 } }
                ],
                states: [
                    { id: 'state1', position: { x: 110, y: 110 } } // Très proche
                ],
                actions: []
            };
            
            const relationships = reader._detectSpatialRelationships(processElements);
            
            expect(relationships).toHaveLength(1);
            expect(relationships[0]).toMatchObject({
                type: 'state_belongs_to_object',
                source: { id: 'state1' },
                target: { id: 'obj1' },
                relationship: 'parent_child',
                method: 'spatial_proximity'
            });
            
            // Vérifier que parentObjectId a été mis à jour
            expect(processElements.states[0].parentObjectId).toBe('obj1');
        });
        
        it('should detect action belonging to state by proximity', () => {
            const processElements = {
                objects: [],
                states: [
                    { id: 'state1', position: { x: 200, y: 200 } }
                ],
                actions: [
                    { id: 'action1', position: { x: 250, y: 220 } } // Proche
                ]
            };
            
            const relationships = reader._detectSpatialRelationships(processElements);
            
            expect(relationships).toHaveLength(1);
            expect(relationships[0]).toMatchObject({
                type: 'action_belongs_to_state',
                source: { id: 'action1' },
                target: { id: 'state1' },
                method: 'spatial_proximity'
            });
            
            expect(processElements.actions[0].parentStateId).toBe('state1');
        });
        
        it('should not detect relationships for distant elements', () => {
            const processElements = {
                objects: [
                    { id: 'obj1', position: { x: 0, y: 0 } }
                ],
                states: [
                    { id: 'state1', position: { x: 500, y: 500 } } // Très loin
                ],
                actions: []
            };
            
            const relationships = reader._detectSpatialRelationships(processElements);
            
            expect(relationships).toHaveLength(0);
        });
    });
    
    describe('Distance Calculation', () => {
        it('should calculate correct euclidean distance', () => {
            const pos1 = { x: 0, y: 0 };
            const pos2 = { x: 3, y: 4 };
            
            const distance = reader._calculateDistance(pos1, pos2);
            
            expect(distance).toBe(5); // 3-4-5 triangle
        });
        
        it('should handle same position', () => {
            const pos1 = { x: 100, y: 200 };
            const pos2 = { x: 100, y: 200 };
            
            const distance = reader._calculateDistance(pos1, pos2);
            
            expect(distance).toBe(0);
        });
    });
    
    describe('Full Canvas Reading Integration', () => {
        it('should read complete canvas with all element types', async () => {
            const mockCanvasData = {
                elements: [
                    {
                        id: 'obj1',
                        type: 'rectangle',
                        text: 'Lot Acier #process-object',
                        x: 100,
                        y: 100,
                        width: 120,
                        height: 80
                    },
                    {
                        id: 'state1',
                        type: 'text',
                        text: 'En Production #process-state',
                        x: 110,
                        y: 120
                    },
                    {
                        id: 'action1',
                        type: 'rectangle',
                        text: 'Contrôler #process-action',
                        x: 150,
                        y: 140,
                        width: 140,
                        height: 60
                    },
                    {
                        id: 'normal1',
                        type: 'ellipse',
                        text: 'Élément normal'
                    }
                ]
            };
            
            // Mocks pour validation et lecture fichier
            vi.mocked(fs.access).mockResolvedValue(undefined);
            vi.mocked(fs.stat).mockResolvedValue({
                isFile: () => true,
                size: 1024
            });
            vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockCanvasData));
            
            const result = await reader.readCanvas('test.excalidraw');
            
            expect(result.objects).toHaveLength(1);
            expect(result.states).toHaveLength(1);
            expect(result.actions).toHaveLength(1);
            expect(result.relationships).toHaveLength(2); // state→object + action→state
            
            expect(result.metadata.sourceFile).toBe('test.excalidraw');
            expect(result.metadata.processingTimeMs).toBeGreaterThan(0);
            expect(result.statistics.objectsDetected).toBe(1);
            expect(result.statistics.statesDetected).toBe(1);
            expect(result.statistics.actionsDetected).toBe(1);
        });
        
        it('should handle performance limits', async () => {
            const largeCanvasData = {
                elements: Array.from({ length: 150 }, (_, i) => ({
                    id: `elem${i}`,
                    type: 'text',
                    text: `Element ${i} #process-object`
                }))
            };
            
            vi.mocked(fs.access).mockResolvedValue(undefined);
            vi.mocked(fs.stat).mockResolvedValue({
                isFile: () => true,
                size: 1024
            });
            vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(largeCanvasData));
            
            const result = await reader.readCanvas('large.excalidraw');
            
            // Devrait être limité à maxElementsPerRead (100)
            expect(result.statistics.elementsProcessed).toBeLessThanOrEqual(100);
            expect(result.warnings).toContainEqual(
                expect.objectContaining({
                    level: 'warning',
                    message: expect.stringContaining('Limite d\'éléments atteinte')
                })
            );
        });
    });
    
    describe('Performance and Stats', () => {
        it('should track performance statistics', () => {
            const stats = reader.getPerformanceStats();
            
            expect(stats).toMatchObject({
                elementsProcessed: 0,
                objectsDetected: 0,
                statesDetected: 0,
                actionsDetected: 0,
                relationshipsDetected: 0,
                processingTime: 0,
                performanceTarget: true,
                cacheSize: 0,
                errorsTotal: 0,
                warningsTotal: 0
            });
        });
        
        it('should clear cache and reset stats', () => {
            // Ajouter quelques données pour tester le clear
            reader.errors.push({ level: 'warning', message: 'test' });
            reader.stats.objectsDetected = 5;
            reader.cache.set('test', 'data');
            
            reader.clearCache();
            
            expect(reader.errors).toHaveLength(0);
            expect(reader.stats.objectsDetected).toBe(0);
            expect(reader.cache.size).toBe(0);
        });
    });
    
    describe('Utility Function', () => {
        it('should work with readProcessCanvas utility function', async () => {
            const mockCanvasData = {
                elements: [
                    {
                        id: 'obj1',
                        type: 'text',
                        text: 'Test Object #process-object'
                    }
                ]
            };
            
            vi.mocked(fs.access).mockResolvedValue(undefined);
            vi.mocked(fs.stat).mockResolvedValue({
                isFile: () => true,
                size: 1024
            });
            vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockCanvasData));
            
            const result = await readProcessCanvas('test.excalidraw');
            
            expect(result.objects).toHaveLength(1);
            expect(result.objects[0].name).toBe('Test Object');
        });
    });
});

// <!-- END OF FILE: canvas-reader.test.js -->