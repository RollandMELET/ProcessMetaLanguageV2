// <!-- START OF FILE: state-creator.test.js -->
// FILENAME: state-creator.test.js
// Version: 1.0.0
// Date: 2025-07-28 18:15
// Author: Rolland MELET & Claude Code
// Description: Tests unitaires state-creator - création bannières États ProcessMetaLanguage - TASK-T001

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { StateCreator } from '../../components/state-creator.js';

// Mock ExcalidrawAutomate
const mockExcalidrawAutomate = {
    create: vi.fn(),
    clear: vi.fn(),
    canvas: {
        theme: 'light',
        viewBackgroundColor: '#ffffff'
    },
    addText: vi.fn(),
    addRect: vi.fn(),
    style: {
        strokeColor: '#000000',
        backgroundColor: '#ffffff',
        fillStyle: 'solid',
        strokeWidth: 2,
        roughness: 1,
        fontSize: 16,
        fontFamily: 1,
        textAlign: 'center',
        verticalAlign: 'middle'
    },
    targetView: vi.fn(),
    addElementsToView: vi.fn(),
    getElements: vi.fn().mockReturnValue([]),
    refresh: vi.fn()
};

global.ExcalidrawAutomate = mockExcalidrawAutomate;

describe('StateCreator - Création Bannières États ProcessMetaLanguage', () => {
    let stateCreator;
    
    beforeEach(() => {
        stateCreator = new StateCreator({
            defaultPosition: { x: 100, y: 100 },
            defaultDimensions: { width: 80, height: 40 }
        });
        
        // Reset tous les mocks
        vi.clearAllMocks();
        
        // Mock IDs uniques
        let mockIdCounter = 1;
        vi.spyOn(stateCreator, '_generateUniqueId').mockImplementation(() => `state_${mockIdCounter++}`);
    });
    
    afterEach(() => {
        stateCreator.clearCache();
    });
    
    describe('Constructor et Configuration', () => {
        it('should initialize with default configuration', () => {
            const defaultCreator = new StateCreator();
            
            expect(defaultCreator.config.defaultDimensions).toEqual({ width: 80, height: 40 });
            expect(defaultCreator.config.defaultPosition).toEqual({ x: 0, y: 0 });
            expect(defaultCreator.config.defaultDisposition).toBe('active');
            expect(defaultCreator.stats.statesCreated).toBe(0);
        });
        
        it('should merge custom configuration', () => {
            const customConfig = {
                defaultDimensions: { width: 100, height: 50 },
                defaultPosition: { x: 200, y: 300 },
                defaultDisposition: 'stored'
            };
            
            const customCreator = new StateCreator(customConfig);
            
            expect(customCreator.config.defaultDimensions).toEqual({ width: 100, height: 50 });
            expect(customCreator.config.defaultPosition).toEqual({ x: 200, y: 300 });
            expect(customCreator.config.defaultDisposition).toBe('stored');
        });
    });
    
    describe('État Banner Creation', () => {
        it('should create state banner with correct dimensions (80x40px)', async () => {
            const stateData = {
                stateName: 'En Production',
                disposition: 'active',
                position: { x: 150, y: 200 }
            };
            
            mockExcalidrawAutomate.addText.mockResolvedValue('text_state_1');
            mockExcalidrawAutomate.addRect.mockResolvedValue('rect_state_1');
            
            const result = await stateCreator.createState(stateData);
            
            // Vérifier dimensions exactes
            expect(result.dimensions).toEqual({ width: 80, height: 40 });
            
            // Vérifier création du rectangle de fond
            expect(mockExcalidrawAutomate.addRect).toHaveBeenCalledWith(
                expect.objectContaining({
                    topX: 150,
                    topY: 200,
                    width: 80,
                    height: 40
                })
            );
            
            // Vérifier création du texte
            expect(mockExcalidrawAutomate.addText).toHaveBeenCalledWith(
                expect.objectContaining({
                    topX: 150,
                    topY: 200,
                    text: 'En Production #process-state',
                    width: 80,
                    height: 40
                })
            );
        });
        
        it('should apply correct colors by disposition', async () => {
            const dispositions = [
                { disposition: 'active', expectedColor: '#4CAF50' },
                { disposition: 'in_transit', expectedColor: '#FF9800' },
                { disposition: 'stored', expectedColor: '#2196F3' },
                { disposition: 'consumed', expectedColor: '#9E9E9E' },
                { disposition: 'destroyed', expectedColor: '#F44336' },
                { disposition: 'damaged', expectedColor: '#FF5722' },
                { disposition: 'expired', expectedColor: '#795548' },
                { disposition: 'recalled', expectedColor: '#E91E63' }
            ];
            
            mockExcalidrawAutomate.addText.mockResolvedValue('text_id');
            mockExcalidrawAutomate.addRect.mockResolvedValue('rect_id');
            
            for (const { disposition, expectedColor } of dispositions) {
                vi.clearAllMocks();
                
                await stateCreator.createState({
                    stateName: `État ${disposition}`,
                    disposition: disposition
                });
                
                expect(mockExcalidrawAutomate.addRect).toHaveBeenCalledWith(
                    expect.objectContaining({
                        options: expect.objectContaining({
                            backgroundColor: expectedColor
                        })
                    })
                );
            }
        });
        
        it('should generate unique IDs for each state', async () => {
            mockExcalidrawAutomate.addText.mockResolvedValueOnce('text_1').mockResolvedValueOnce('text_2');
            mockExcalidrawAutomate.addRect.mockResolvedValueOnce('rect_1').mockResolvedValueOnce('rect_2');
            
            const result1 = await stateCreator.createState({ stateName: 'État 1' });
            const result2 = await stateCreator.createState({ stateName: 'État 2' });
            
            expect(result1.uniqueId).toBe('state_1');
            expect(result2.uniqueId).toBe('state_2');
            expect(result1.uniqueId).not.toBe(result2.uniqueId);
        });
        
        it('should generate correct metadata', async () => {
            const stateData = {
                stateName: 'Contrôle Qualité',
                disposition: 'active',
                parentObjectId: 'obj_123',
                position: { x: 300, y: 400 }
            };
            
            mockExcalidrawAutomate.addText.mockResolvedValue('text_id');
            mockExcalidrawAutomate.addRect.mockResolvedValue('rect_id');
            
            const result = await stateCreator.createState(stateData);
            
            expect(result.metadata).toMatchObject({
                elementType: 'process-state',
                createdAt: expect.any(String),
                stateType: 'banner',
                disposition: 'active',
                parentObjectId: 'obj_123',
                epcisCompliant: true,
                canvasElementIds: ['rect_id', 'text_id']
            });
            
            expect(result.metadata.businessStep).toBe('observing');
            expect(result.metadata.isTemporaryState).toBe(false);
        });
    });
    
    describe('EPCIS 2.0 Compliance', () => {
        it('should validate all 25 EPCIS dispositions', () => {
            const epcisDispositions = [
                'active', 'container_closed', 'damaged', 'destroyed', 'dispensed',
                'encoded', 'expired', 'in_progress', 'in_transit', 'inactive',
                'non_conformant', 'partially_dispensed', 'recalled', 'reserved',
                'retail_sold', 'returned', 'sellable_accessible', 'sellable_not_accessible',
                'stolen', 'unavailable', 'unknown', 'consumed', 'stored', 'quality_hold', 'quarantined'
            ];
            
            epcisDispositions.forEach(disposition => {
                const isValid = stateCreator._validateEPCISCompliance(disposition);
                expect(isValid).toBe(true);
            });
        });
        
        it('should reject non-EPCIS dispositions', () => {
            const invalidDispositions = ['invalid', 'custom_state', 'not_epcis'];
            
            invalidDispositions.forEach(disposition => {
                const isValid = stateCreator._validateEPCISCompliance(disposition);
                expect(isValid).toBe(false);
            });
        });
        
        it('should map disposition to business step correctly', async () => {
            const mappings = [
                { disposition: 'active', expectedStep: 'observing' },
                { disposition: 'in_transit', expectedStep: 'shipping' },
                { disposition: 'stored', expectedStep: 'storing' },
                { disposition: 'consumed', expectedStep: 'consuming' },
                { disposition: 'destroyed', expectedStep: 'destroying' },
                { disposition: 'expired', expectedStep: 'observing' }
            ];
            
            mockExcalidrawAutomate.addText.mockResolvedValue('text_id');
            mockExcalidrawAutomate.addRect.mockResolvedValue('rect_id');
            
            for (const { disposition, expectedStep } of mappings) {
                vi.clearAllMocks();
                
                const result = await stateCreator.createState({
                    stateName: 'Test State',
                    disposition: disposition
                });
                
                expect(result.metadata.businessStep).toBe(expectedStep);
            }
        });
    });
    
    describe('Superposition et Positionnement', () => {
        it('should create banner superposed on parent object', async () => {
            const parentObject = {
                position: { x: 200, y: 300 },
                dimensions: { width: 120, height: 80 }
            };
            
            const stateData = {
                stateName: 'État Superposé',
                parentObjectId: 'obj_parent',
                superpositionOffset: { x: 10, y: -20 }
            };
            
            mockExcalidrawAutomate.addText.mockResolvedValue('text_id');
            mockExcalidrawAutomate.addRect.mockResolvedValue('rect_id');
            
            const result = await stateCreator.createState(stateData, parentObject);
            
            // Position calculée: parent + offset
            expect(result.position).toEqual({ x: 210, y: 280 });
            
            expect(mockExcalidrawAutomate.addRect).toHaveBeenCalledWith(
                expect.objectContaining({
                    topX: 210,
                    topY: 280
                })
            );
        });
        
        it('should handle default superposition without parent object', async () => {
            const stateData = {
                stateName: 'État Autonome',
                position: { x: 100, y: 200 }
            };
            
            mockExcalidrawAutomate.addText.mockResolvedValue('text_id');
            mockExcalidrawAutomate.addRect.mockResolvedValue('rect_id');
            
            const result = await stateCreator.createState(stateData);
            
            expect(result.position).toEqual({ x: 100, y: 200 });
        });
    });
    
    describe('Main Action Generation', () => {
        it('should generate automatic main action for each state', async () => {
            const stateData = {
                stateName: 'Production Phase 1',
                disposition: 'active'
            };
            
            mockExcalidrawAutomate.addText.mockResolvedValue('text_id');
            mockExcalidrawAutomate.addRect.mockResolvedValue('rect_id');
            
            const result = await stateCreator.createState(stateData);
            
            expect(result.mainAction).toMatchObject({
                actionName: 'Consulter_Production_Phase_1',
                actionType: 'main_action',
                automaticallyGenerated: true,
                description: expect.stringContaining('Consultation des données'),
                functionType: 'data_exposition'
            });
            
            expect(result.mainAction.navigationTargets).toContain('available_actions');
            expect(result.mainAction.exposedData).toContain('state_metadata');
        });
        
        it('should sanitize state name for main action', async () => {
            const stateData = {
                stateName: 'État en Cours - Phase 2!',
                disposition: 'active'
            };
            
            mockExcalidrawAutomate.addText.mockResolvedValue('text_id');
            mockExcalidrawAutomate.addRect.mockResolvedValue('rect_id');
            
            const result = await stateCreator.createState(stateData);
            
            expect(result.mainAction.actionName).toBe('Consulter_État_en_Cours_Phase_2');
        });
    });
    
    describe('Tag Processing', () => {
        it('should add process-state tag automatically', async () => {
            const stateData = {
                stateName: 'Test État',
                disposition: 'active'
            };
            
            mockExcalidrawAutomate.addText.mockResolvedValue('text_id');
            mockExcalidrawAutomate.addRect.mockResolvedValue('rect_id');
            
            await stateCreator.createState(stateData);
            
            expect(mockExcalidrawAutomate.addText).toHaveBeenCalledWith(
                expect.objectContaining({
                    text: 'Test État #process-state'
                })
            );
        });
        
        it('should not duplicate existing process tag', async () => {
            const stateData = {
                stateName: 'État avec Tag #process-state',
                disposition: 'active'
            };
            
            mockExcalidrawAutomate.addText.mockResolvedValue('text_id');
            mockExcalidrawAutomate.addRect.mockResolvedValue('rect_id');
            
            await stateCreator.createState(stateData);
            
            expect(mockExcalidrawAutomate.addText).toHaveBeenCalledWith(
                expect.objectContaining({
                    text: 'État avec Tag #process-state'
                })
            );
        });
    });
    
    describe('Performance Tests', () => {
        it('should create 10 states in less than 1 second', async () => {
            mockExcalidrawAutomate.addText.mockResolvedValue('text_id');
            mockExcalidrawAutomate.addRect.mockResolvedValue('rect_id');
            
            const startTime = Date.now();
            
            const promises = [];
            for (let i = 1; i <= 10; i++) {
                promises.push(stateCreator.createState({
                    stateName: `État ${i}`,
                    disposition: 'active',
                    position: { x: i * 100, y: i * 50 }
                }));
            }
            
            await Promise.all(promises);
            
            const duration = Date.now() - startTime;
            expect(duration).toBeLessThan(1000);
            expect(stateCreator.stats.statesCreated).toBe(10);
        });
        
        it('should track creation statistics', async () => {
            mockExcalidrawAutomate.addText.mockResolvedValue('text_id');
            mockExcalidrawAutomate.addRect.mockResolvedValue('rect_id');
            
            await stateCreator.createState({ stateName: 'État 1' });
            await stateCreator.createState({ stateName: 'État 2' });
            
            const stats = stateCreator.getStats();
            
            expect(stats).toMatchObject({
                statesCreated: 2,
                totalCreationTime: expect.any(Number),
                averageCreationTime: expect.any(Number),
                performance: {
                    target: true, // < 1s pour 10 états
                    creationsPerSecond: expect.any(Number)
                }
            });
        });
    });
    
    describe('Error Handling', () => {
        it('should handle missing ExcalidrawAutomate gracefully', async () => {
            const originalEA = global.ExcalidrawAutomate;
            global.ExcalidrawAutomate = undefined;
            
            const errorCreator = new StateCreator();
            
            await expect(errorCreator.createState({ stateName: 'Test' }))
                .rejects.toThrow('ExcalidrawAutomate non disponible');
            
            global.ExcalidrawAutomate = originalEA;
        });
        
        it('should handle ExcalidrawAutomate failures', async () => {
            mockExcalidrawAutomate.addRect.mockRejectedValue(new Error('Canvas error'));
            
            await expect(stateCreator.createState({ stateName: 'Test' }))
                .rejects.toThrow('Erreur création bannière état');
        });
        
        it('should validate required parameters', async () => {
            await expect(stateCreator.createState({}))
                .rejects.toThrow('stateName requis');
            
            await expect(stateCreator.createState({ stateName: '' }))
                .rejects.toThrow('stateName ne peut pas être vide');
        });
    });
    
    describe('Edge Cases', () => {
        it('should handle very long state names', async () => {
            const longName = 'État avec un nom extrêmement long qui dépasse largement la largeur standard de la bannière';
            
            mockExcalidrawAutomate.addText.mockResolvedValue('text_id');
            mockExcalidrawAutomate.addRect.mockResolvedValue('rect_id');
            
            const result = await stateCreator.createState({ stateName: longName });
            
            expect(result.stateName).toBe(longName);
            expect(mockExcalidrawAutomate.addText).toHaveBeenCalledWith(
                expect.objectContaining({
                    options: expect.objectContaining({
                        wrapAt: 70 // Limite de caractères pour la bannière
                    })
                })
            );
        });
        
        it('should handle special characters in state names', async () => {
            const specialName = 'État-éèê_à@#$%^&*()';
            
            mockExcalidrawAutomate.addText.mockResolvedValue('text_id');
            mockExcalidrawAutomate.addRect.mockResolvedValue('rect_id');
            
            const result = await stateCreator.createState({ stateName: specialName });
            
            expect(result.stateName).toBe(specialName);
            expect(result.mainAction.actionName).toBe('Consulter_État_éèê_à');
        });
        
        it('should handle zero dimensions', async () => {
            mockExcalidrawAutomate.addText.mockResolvedValue('text_id');
            mockExcalidrawAutomate.addRect.mockResolvedValue('rect_id');
            
            const result = await stateCreator.createState({
                stateName: 'Test',
                customDimensions: { width: 0, height: 0 }
            });
            
            // Devrait utiliser les dimensions par défaut
            expect(result.dimensions).toEqual({ width: 80, height: 40 });
        });
    });
    
    describe('Memory and Cache Management', () => {
        it('should cache creation data efficiently', async () => {
            mockExcalidrawAutomate.addText.mockResolvedValue('text_id');
            mockExcalidrawAutomate.addRect.mockResolvedValue('rect_id');
            
            await stateCreator.createState({ stateName: 'État Caché' });
            
            expect(stateCreator.cache.size).toBe(1);
            
            const cacheData = stateCreator.cache.get('state_1');
            expect(cacheData).toMatchObject({
                stateName: 'État Caché',
                uniqueId: 'state_1'
            });
        });
        
        it('should clear cache and reset stats', () => {
            stateCreator.cache.set('test', 'data');
            stateCreator.stats.statesCreated = 5;
            
            stateCreator.clearCache();
            
            expect(stateCreator.cache.size).toBe(0);
            expect(stateCreator.stats.statesCreated).toBe(0);
        });
    });
});

// <!-- END OF FILE: state-creator.test.js -->