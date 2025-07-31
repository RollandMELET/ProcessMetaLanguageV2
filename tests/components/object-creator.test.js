// <!-- START OF FILE: object-creator.test.js -->
// FILENAME: object-creator.test.js
// Version: 1.0.0
// Date: 2025-07-28 17:45
// Author: Rolland MELET & Claude Code
// Description: Tests unitaires object-creator.js - TASK-T001 - Validation hexagone OBJECT

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createObjectComponent, getObjectColor, validateObjectData } from '../../components/object-creator.js';

describe('Object Creator - Tests Unitaires Composants Graphiques', () => {
    let mockEA; // Mock ExcalidrawAutomate
    
    beforeEach(() => {
        // Mock complet ExcalidrawAutomate API
        mockEA = {
            // Création et gestion formes
            addRect: vi.fn().mockReturnValue('rect_123'),
            addEllipse: vi.fn().mockReturnValue('ellipse_123'),
            addText: vi.fn().mockReturnValue('text_123'),
            
            // Propriétés visuelles
            style: {
                strokeColor: '#000000',
                backgroundColor: '#ffffff',
                fillStyle: 'solid',
                strokeWidth: 2,
                roughness: 1,
                opacity: 100
            },
            
            // Gestion éléments
            getElements: vi.fn().mockReturnValue([]),
            targetView: vi.fn(),
            addToGroup: vi.fn(),
            
            // Canvas state
            canvas: {
                viewBackgroundColor: '#ffffff'
            },
            
            // Mock methods pour chaining
            setStyle: vi.fn().mockReturnThis(),
            selectElementsInView: vi.fn().mockReturnThis()
        };
        
        // Mock global ExcalidrawAutomate si pas disponible
        if (typeof globalThis.ExcalidrawAutomate === 'undefined') {
            globalThis.ExcalidrawAutomate = mockEA;
        }
    });
    
    afterEach(() => {
        vi.clearAllMocks();
    });
    
    describe('Création Hexagone OBJECT - Critère TASK-T001', () => {
        it('should create hexagon with correct dimensions 120x80px', async () => {
            const objectData = {
                objectName: 'Lot Acier A001',
                objectType: 'raw-material',
                position: { x: 100, y: 200 },
                backgroundColor: '#4CAF50'
            };
            
            const result = await createObjectComponent(objectData, mockEA);
            
            // Vérifier création rectangle (base hexagone)
            expect(mockEA.addRect).toHaveBeenCalledWith(
                objectData.position.x,
                objectData.position.y,
                120, // Width standard
                80   // Height standard
            );
            
            // Vérifier retour ID élément
            expect(result.elementId).toBe('rect_123');
            expect(result.objectType).toBe('raw-material');
            expect(result.dimensions).toEqual({ width: 120, height: 80 });
        });
        
        it('should apply correct colors for different object types', async () => {
            const objectTypes = [
                { type: 'raw-material', expectedColor: '#4CAF50' },
                { type: 'product', expectedColor: '#2196F3' },
                { type: 'batch', expectedColor: '#FF9800' },
                { type: 'component', expectedColor: '#9C27B0' },
                { type: 'equipment', expectedColor: '#607D8B' },
                { type: 'location', expectedColor: '#795548' }
            ];
            
            for (const { type, expectedColor } of objectTypes) {
                const objectData = {
                    objectName: `Test ${type}`,
                    objectType: type,
                    position: { x: 0, y: 0 }
                };
                
                const result = await createObjectComponent(objectData, mockEA);
                
                expect(result.backgroundColor).toBe(expectedColor);
                
                // Vérifier que la couleur est appliquée via style
                expect(mockEA.style.backgroundColor).toBe(expectedColor);
            }
        });
        
        it('should generate unique IDs for multiple objects', async () => {
            const objects = [
                { objectName: 'Object 1', objectType: 'batch' },
                { objectName: 'Object 2', objectType: 'product' },
                { objectName: 'Object 3', objectType: 'raw-material' }
            ];
            
            const results = [];
            
            for (const objData of objects) {
                const result = await createObjectComponent({
                    ...objData,
                    position: { x: 100, y: 100 }
                }, mockEA);
                results.push(result);
            }
            
            // Vérifier que tous les IDs sont uniques
            const uniqueIds = new Set(results.map(r => r.uniqueId));
            expect(uniqueIds.size).toBe(objects.length);
            
            // Vérifier format ID unique
            results.forEach(result => {
                expect(result.uniqueId).toMatch(/^obj_[a-zA-Z0-9_]+_\d{13}$/);
            });
        });
        
        it('should add process-object tag automatically', async () => {
            const objectData = {
                objectName: 'Tagged Object',
                objectType: 'generic-object',
                position: { x: 50, y: 75 }
            };
            
            const result = await createObjectComponent(objectData, mockEA);
            
            // Vérifier que le tag est ajouté au nom affiché
            expect(mockEA.addText).toHaveBeenCalledWith(
                expect.any(Number),
                expect.any(Number),
                'Tagged Object #process-object',
                expect.any(Object)
            );
            
            expect(result.processTag).toBe('#process-object');
        });
        
        it('should handle position and dimensions correctly', async () => {
            const objectData = {
                objectName: 'Positioned Object',
                objectType: 'batch',
                position: { x: 250, y: 300 },
                dimensions: { width: 140, height: 90 } // Custom dimensions
            };
            
            const result = await createObjectComponent(objectData, mockEA);
            
            // Vérifier position
            expect(mockEA.addRect).toHaveBeenCalledWith(250, 300, 140, 90);
            
            // Vérifier que les dimensions custom sont respectées
            expect(result.dimensions).toEqual({ width: 140, height: 90 });
            expect(result.position).toEqual({ x: 250, y: 300 });
        });
    });
    
    describe('Métadonnées OBJECT - Critère TASK-T001', () => {
        it('should generate complete metadata automatically', async () => {
            const objectData = {
                objectName: 'Lot Production LP001',
                objectType: 'batch',
                tracedEntity: 'Lot-LP-001',
                position: { x: 100, y: 200 }
            };
            
            const result = await createObjectComponent(objectData, mockEA);
            
            // Vérifier métadonnées obligatoires
            expect(result.metadata).toBeDefined();
            expect(result.metadata.objectName).toBe('Lot Production LP001');
            expect(result.metadata.objectType).toBe('batch');
            expect(result.metadata.tracedEntity).toBe('Lot-LP-001');
            expect(result.metadata.createdAt).toBeDefined();
            expect(result.metadata.processTag).toBe('#process-object');
            
            // Vérifier format timestamp
            expect(new Date(result.metadata.createdAt)).toBeInstanceOf(Date);
            
            // Vérifier EPCIS data
            expect(result.metadata.epcisData).toBeDefined();
            expect(result.metadata.epcisData.businessLocation).toContain('batch');
            expect(result.metadata.epcisData.eventType).toBe('object_event');
        });
        
        it('should handle missing optional metadata gracefully', async () => {
            const minimalData = {
                objectName: 'Minimal Object',
                objectType: 'generic-object'
                // Position manquante, autres propriétés par défaut
            };
            
            const result = await createObjectComponent(minimalData, mockEA);
            
            // Vérifier valeurs par défaut
            expect(result.position).toEqual({ x: 0, y: 0 });
            expect(result.dimensions).toEqual({ width: 120, height: 80 });
            expect(result.backgroundColor).toBe('#9E9E9E'); // Couleur generic-object
            expect(result.metadata.tracedEntity).toBe('Minimal Object'); // Défaut au nom
        });
        
        it('should validate object data before creation', async () => {
            const invalidData = {
                // objectName manquant (requis)
                objectType: 'batch',
                position: { x: 100, y: 100 }
            };
            
            // Devrait lever une erreur pour données invalides
            await expect(createObjectComponent(invalidData, mockEA))
                .rejects.toThrow('objectName est requis');
        });
        
        it('should generate EPCIS-compliant metadata', async () => {
            const objectData = {
                objectName: 'EPCIS Test Object',
                objectType: 'product',
                tracedEntity: 'PROD-001',
                position: { x: 150, y: 250 }
            };
            
            const result = await createObjectComponent(objectData, mockEA);
            
            const epcisData = result.metadata.epcisData;
            
            // Vérifier conformité EPCIS 2.0
            expect(epcisData.businessLocation).toMatch(/^urn:epc:id:sgln:/);
            expect(epcisData.eventType).toBe('object_event');
            expect(epcisData.eventTime).toBeDefined();
            expect(epcisData.eventTimeZoneOffset).toBeDefined();
            expect(epcisData.action).toBe('add'); // Création objet
            
            // Vérifier format timestamp EPCIS
            expect(epcisData.eventTime).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
        });
    });
    
    describe('Integration avec ExcalidrawAutomate', () => {
        it('should handle ExcalidrawAutomate API correctly', async () => {
            const objectData = {
                objectName: 'API Test Object',
                objectType: 'raw-material',
                position: { x: 300, y: 400 },
                backgroundColor: '#FF5722'
            };
            
            const result = await createObjectComponent(objectData, mockEA);
            
            // Vérifier séquence d'appels ExcalidrawAutomate
            expect(mockEA.addRect).toHaveBeenCalledTimes(1);
            expect(mockEA.addText).toHaveBeenCalledTimes(1);
            
            // Vérifier que les éléments sont ajoutés avec les bonnes propriétés
            const rectCall = mockEA.addRect.mock.calls[0];
            expect(rectCall).toEqual([300, 400, 120, 80]);
            
            const textCall = mockEA.addText.mock.calls[0];
            expect(textCall[2]).toBe('API Test Object #process-object');
        });
        
        it('should handle ExcalidrawAutomate errors gracefully', async () => {
            // Simuler erreur ExcalidrawAutomate
            mockEA.addRect.mockImplementation(() => {
                throw new Error('ExcalidrawAutomate error');
            });
            
            const objectData = {
                objectName: 'Error Test',
                objectType: 'batch',
                position: { x: 0, y: 0 }
            };
            
            await expect(createObjectComponent(objectData, mockEA))
                .rejects.toThrow('Erreur création composant objet');
        });
    });
    
    describe('Utility Functions', () => {
        it('should get correct colors for object types', () => {
            expect(getObjectColor('raw-material')).toBe('#4CAF50');
            expect(getObjectColor('product')).toBe('#2196F3');
            expect(getObjectColor('batch')).toBe('#FF9800');
            expect(getObjectColor('component')).toBe('#9C27B0');
            expect(getObjectColor('equipment')).toBe('#607D8B');
            expect(getObjectColor('location')).toBe('#795548');
            expect(getObjectColor('container')).toBe('#00BCD4');
            expect(getObjectColor('document')).toBe('#FFC107');
            expect(getObjectColor('unknown_type')).toBe('#9E9E9E'); // Default
        });
        
        it('should validate object data correctly', () => {
            // Données valides
            const validData = {
                objectName: 'Valid Object',
                objectType: 'batch',
                position: { x: 100, y: 100 }
            };
            
            expect(() => validateObjectData(validData)).not.toThrow();
            
            // Données invalides - nom manquant
            const invalidName = {
                objectType: 'batch',
                position: { x: 100, y: 100 }
            };
            
            expect(() => validateObjectData(invalidName))
                .toThrow('objectName est requis');
            
            // Données invalides - type manquant
            const invalidType = {
                objectName: 'Test Object',
                position: { x: 100, y: 100 }
            };
            
            expect(() => validateObjectData(invalidType))
                .toThrow('objectType est requis');
            
            // Position invalide
            const invalidPosition = {
                objectName: 'Test Object',
                objectType: 'batch',
                position: { x: 'invalid', y: 100 }
            };
            
            expect(() => validateObjectData(invalidPosition))
                .toThrow('Position x doit être un nombre');
        });
    });
    
    describe('Performance et Memory', () => {
        it('should create objects within performance limits', async () => {
            const objectData = {
                objectName: 'Performance Test',
                objectType: 'batch',
                position: { x: 100, y: 100 }
            };
            
            const startTime = Date.now();
            
            // Créer 10 objets pour tester performance
            const promises = [];
            for (let i = 0; i < 10; i++) {
                promises.push(createObjectComponent({
                    ...objectData,
                    objectName: `Performance Test ${i}`
                }, mockEA));
            }
            
            const results = await Promise.all(promises);
            const totalTime = Date.now() - startTime;
            
            // Vérifier que tous les objets ont été créés
            expect(results).toHaveLength(10);
            results.forEach(result => {
                expect(result.elementId).toBeDefined();
                expect(result.metadata).toBeDefined();
            });
            
            // Vérifier performance (< 1s pour 10 objets)
            expect(totalTime).toBeLessThan(1000);
            
            console.log(`⚡ Performance: 10 objets créés en ${totalTime}ms`);
        });
        
        it('should handle memory cleanup correctly', async () => {
            const objectData = {
                objectName: 'Memory Test',
                objectType: 'batch',
                position: { x: 100, y: 100 }
            };
            
            // Créer et vérifier plusieurs objets
            for (let i = 0; i < 5; i++) {
                const result = await createObjectComponent({
                    ...objectData,
                    objectName: `Memory Test ${i}`
                }, mockEA);
                
                // Vérifier que chaque objet a des références uniques
                expect(result.uniqueId).toBeDefined();
                expect(result.metadata.createdAt).toBeDefined();
            }
            
            // Les mocks devraient avoir été appelés 5 fois
            expect(mockEA.addRect).toHaveBeenCalledTimes(5);
            expect(mockEA.addText).toHaveBeenCalledTimes(5);
        });
    });
    
    describe('Edge Cases et Error Handling', () => {
        it('should handle extreme position values', async () => {
            const extremeData = {
                objectName: 'Extreme Position',
                objectType: 'batch',
                position: { x: -1000, y: 5000 } // Positions extrêmes
            };
            
            const result = await createObjectComponent(extremeData, mockEA);
            
            expect(result.position).toEqual({ x: -1000, y: 5000 });
            expect(mockEA.addRect).toHaveBeenCalledWith(-1000, 5000, 120, 80);
        });
        
        it('should handle special characters in object names', async () => {
            const specialCharsData = {
                objectName: 'Objet Spécial #123 & Co. @Test',
                objectType: 'batch',
                position: { x: 100, y: 100 }
            };
            
            const result = await createObjectComponent(specialCharsData, mockEA);
            
            expect(result.objectName).toBe('Objet Spécial #123 & Co. @Test');
            expect(mockEA.addText).toHaveBeenCalledWith(
                expect.any(Number),
                expect.any(Number),
                'Objet Spécial #123 & Co. @Test #process-object',
                expect.any(Object)
            );
        });
        
        it('should handle null/undefined ExcalidrawAutomate', async () => {
            const objectData = {
                objectName: 'Null EA Test',
                objectType: 'batch',
                position: { x: 100, y: 100 }
            };
            
            await expect(createObjectComponent(objectData, null))
                .rejects.toThrow('ExcalidrawAutomate instance requise');
            
            await expect(createObjectComponent(objectData, undefined))
                .rejects.toThrow('ExcalidrawAutomate instance requise');
        });
    });
});

// <!-- END OF FILE: object-creator.test.js -->