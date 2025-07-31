// <!-- START OF FILE: integration.test.js -->
// FILENAME: integration.test.js
// Version: 1.0.0
// Date: 2025-07-28 17:15
// Author: Rolland MELET & Claude Code
// Description: Tests intégration CanvasReader + MarkdownGenerator - workflow complet - TASK-B004

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import { CanvasReader } from '../../sync/canvas-reader.js';
import { MarkdownGenerator } from '../../sync/markdown-generator.js';
import { TemplateProcessor } from '../../core/template-processor.js';

// Mock dependencies
vi.mock('fs/promises');
vi.mock('../../core/template-processor.js');

describe('Integration Tests - Canvas → Markdown ProcessMetaLanguage', () => {
    let reader;
    let generator;
    let mockTemplateProcessor;
    
    // Canvas de test avec processus complet
    const mockCompleteCanvas = {
        elements: [
            // Objet principal
            {
                id: 'obj_lot_acier_001',
                type: 'rectangle',
                text: 'Lot Acier A001 #process-object',
                x: 100,
                y: 100,
                width: 120,
                height: 80,
                backgroundColor: '#4CAF50'
            },
            
            // États du processus
            {
                id: 'state_reception_001',
                type: 'text',
                text: 'Réception #process-state',
                x: 110,
                y: 80 // Superposé à l'objet
            },
            {
                id: 'state_production_001',
                type: 'text',
                text: 'En Production #process-state',
                x: 110,
                y: 120
            },
            {
                id: 'state_controle_001',
                type: 'text',
                text: 'Contrôle Qualité #process-state',
                x: 110,
                y: 160
            },
            
            // Actions secondaires
            {
                id: 'action_recevoir_001',
                type: 'rectangle',
                text: 'Recevoir Marchandise #process-action',
                x: 50,
                y: 75, // Proche de l'état réception
                width: 140,
                height: 60,
                backgroundColor: '#FF9800'
            },
            {
                id: 'action_transformer_001',
                type: 'rectangle',
                text: 'Transformer Matière #process-action',
                x: 50,
                y: 115,
                width: 140,
                height: 60,
                backgroundColor: '#FF9800'
            },
            {
                id: 'action_valider_001',
                type: 'rectangle',
                text: 'Valider Qualité #process-action',
                x: 50,
                y: 155,
                width: 140,
                height: 60,
                backgroundColor: '#F44336'
            },
            
            // Flèches de workflow (relations)
            {
                id: 'arrow_001',
                type: 'arrow',
                x: 110,
                y: 100,
                width: 0,
                height: 40 // Réception → Production
            },
            {
                id: 'arrow_002',
                type: 'arrow',
                x: 110,
                y: 140,
                width: 0,
                height: 40 // Production → Contrôle
            },
            
            // Élément normal (ne devrait pas être détecté)
            {
                id: 'normal_text_001',
                type: 'text',
                text: 'Note: Processus validé le 15/01/2024'
            }
        ]
    };
    
    beforeEach(() => {
        reader = new CanvasReader({
            maxProcessingTimeMs: 3000
        });
        
        // Mock TemplateProcessor
        mockTemplateProcessor = {
            syncObjectToTemplate: vi.fn(),
            syncStateToTemplate: vi.fn(),  
            syncActionToTemplate: vi.fn(),
            clearCache: vi.fn()
        };
        
        vi.mocked(TemplateProcessor).mockImplementation(() => mockTemplateProcessor);
        
        generator = new MarkdownGenerator({
            maxGenerationTimeMs: 3000,
            generateConsolidatedWorkflow: true,
            generateIndexFiles: true
        });
        
        // Reset mocks
        vi.clearAllMocks();
    });
    
    afterEach(() => {
        reader.clearCache();
        generator.clearCache();
    });
    
    describe('Complete Workflow Integration', () => {
        it('should process complete canvas through full pipeline', async () => {
            // 1. Mock file system pour CanvasReader
            vi.mocked(fs.access).mockResolvedValue(undefined);
            vi.mocked(fs.stat).mockResolvedValue({
                isFile: () => true,
                size: 5 * 1024 // 5KB
            });
            vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockCompleteCanvas));
            
            // 2. Mock file system pour MarkdownGenerator
            vi.mocked(fs.mkdir).mockResolvedValue(undefined);
            vi.mocked(fs.writeFile).mockResolvedValue(undefined);
            
            // 3. Mock template generation
            mockTemplateProcessor.syncObjectToTemplate
                .mockResolvedValue('./docs/generated/objects/lot-acier-a001.md');
            mockTemplateProcessor.syncStateToTemplate
                .mockResolvedValueOnce('./docs/generated/states/reception.md')
                .mockResolvedValueOnce('./docs/generated/states/en-production.md')
                .mockResolvedValueOnce('./docs/generated/states/controle-qualite.md');
            mockTemplateProcessor.syncActionToTemplate
                .mockResolvedValueOnce('./docs/generated/actions/recevoir-marchandise.md')
                .mockResolvedValueOnce('./docs/generated/actions/transformer-matiere.md')
                .mockResolvedValueOnce('./docs/generated/actions/valider-qualite.md');
            
            // 4. Étape 1: Lecture canvas
            const canvasData = await reader.readCanvas('processus-complet.excalidraw');
            
            // Vérifier extraction correcte
            expect(canvasData.objects).toHaveLength(1);
            expect(canvasData.states).toHaveLength(3);
            expect(canvasData.actions).toHaveLength(3);
            expect(canvasData.relationships.length).toBeGreaterThan(0);
            
            // Vérifier données objets
            const lotAcier = canvasData.objects[0];
            expect(lotAcier.name).toBe('Lot Acier A001');
            expect(lotAcier.objectType).toBe('raw-material');
            expect(lotAcier.position).toEqual({ x: 100, y: 100 });
            
            // Vérifier données états
            const states = canvasData.states;
            expect(states[0].name).toBe('Réception');
            expect(states[1].name).toBe('En Production');
            expect(states[2].name).toBe('Contrôle Qualité');
            
            // Vérifier relations spatiales
            const stateRelations = canvasData.relationships.filter(r => 
                r.type === 'state_belongs_to_object'
            );
            expect(stateRelations).toHaveLength(3); // Tous les états appartiennent à l'objet
            
            const actionRelations = canvasData.relationships.filter(r => 
                r.type === 'action_belongs_to_state'
            );
            expect(actionRelations).toHaveLength(3); // Toutes les actions appartiennent aux états
            
            // 5. Étape 2: Génération markdown
            const generationResult = await generator.generateFromCanvas(canvasData);
            
            // Vérifier résultat génération
            expect(generationResult.success).toBe(true);
            expect(generationResult.objectsGenerated).toBe(1);
            expect(generationResult.statesGenerated).toBe(3);
            expect(generationResult.actionsGenerated).toBe(3);
            expect(generationResult.filesGenerated).toBeGreaterThanOrEqual(7); // 1+3+3 + workflow + index
            
            // Vérifier performance targets
            expect(canvasData.metadata.processingTimeMs).toBeLessThan(3000);
            expect(generationResult.metadata.totalGenerationTime).toBeLessThan(3000);
            expect(generationResult.metadata.performanceTarget).toBe(true);
            
            // 6. Vérifier appels templates
            expect(mockTemplateProcessor.syncObjectToTemplate).toHaveBeenCalledTimes(1);
            expect(mockTemplateProcessor.syncStateToTemplate).toHaveBeenCalledTimes(3);  
            expect(mockTemplateProcessor.syncActionToTemplate).toHaveBeenCalledTimes(3);
            
            // 7. Vérifier données passées aux templates
            const objectTemplateCall = mockTemplateProcessor.syncObjectToTemplate.mock.calls[0][0];
            expect(objectTemplateCall.objectName).toBe('Lot Acier A001');
            expect(objectTemplateCall.objectType).toBe('raw-material');
            
            const stateTemplateCalls = mockTemplateProcessor.syncStateToTemplate.mock.calls;
            expect(stateTemplateCalls[0][0].stateName).toBe('Réception');
            expect(stateTemplateCalls[0][0].mainAction.automaticallyGenerated).toBe(true);
            
            const actionTemplateCalls = mockTemplateProcessor.syncActionToTemplate.mock.calls;
            expect(actionTemplateCalls[0][0].actionName).toBe('Recevoir Marchandise');
            expect(actionTemplateCalls[0][0].businessStep).toBe('receiving');
            
            console.log('✅ Workflow intégration complet validé avec succès');
        });
        
        it('should handle complex process with multiple objects', async () => {
            const multiObjectCanvas = {
                elements: [
                    // Premier objet
                    {
                        id: 'obj_001',
                        type: 'rectangle',
                        text: 'Matière Première #process-object',
                        x: 50,
                        y: 50
                    },
                    {
                        id: 'state_001',
                        type: 'text',
                        text: 'Stocké #process-state',
                        x: 55,
                        y: 60
                    },
                    
                    // Deuxième objet
                    {
                        id: 'obj_002',
                        type: 'rectangle',
                        text: 'Produit Fini #process-object',
                        x: 200,
                        y: 50
                    },
                    {
                        id: 'state_002',
                        type: 'text',
                        text: 'Emballé #process-state',
                        x: 205,
                        y: 60
                    },
                    
                    // Action de transformation entre objets
                    {
                        id: 'action_transform',
                        type: 'rectangle',
                        text: 'Transformer #process-action',
                        x: 125,
                        y: 45
                    }
                ]
            };
            
            // Mocks
            vi.mocked(fs.access).mockResolvedValue(undefined);
            vi.mocked(fs.stat).mockResolvedValue({ isFile: () => true, size: 1024 });
            vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(multiObjectCanvas));
            vi.mocked(fs.mkdir).mockResolvedValue(undefined);
            vi.mocked(fs.writeFile).mockResolvedValue(undefined);
            
            mockTemplateProcessor.syncObjectToTemplate
                .mockResolvedValueOnce('./objects/matiere-premiere.md')
                .mockResolvedValueOnce('./objects/produit-fini.md');
            mockTemplateProcessor.syncStateToTemplate
                .mockResolvedValueOnce('./states/stocke.md')
                .mockResolvedValueOnce('./states/emballe.md');
            mockTemplateProcessor.syncActionToTemplate
                .mockResolvedValueOnce('./actions/transformer.md');
            
            // Workflow complet
            const canvasData = await reader.readCanvas('multi-objets.excalidraw');
            const result = await generator.generateFromCanvas(canvasData);
            
            expect(canvasData.objects).toHaveLength(2);
            expect(canvasData.states).toHaveLength(2);
            expect(canvasData.actions).toHaveLength(1);
            
            expect(result.objectsGenerated).toBe(2);
            expect(result.statesGenerated).toBe(2);
            expect(result.actionsGenerated).toBe(1);
        });
    });
    
    describe('Performance Integration Tests', () => {
        it('should meet performance targets for large canvas (50 elements)', async () => {
            // Générer canvas avec 50 éléments ProcessMetaLanguage
            const largeCanvas = {
                elements: []
            };
            
            // Ajouter 16 objets + 17 états + 17 actions = 50 éléments
            for (let i = 1; i <= 16; i++) {
                largeCanvas.elements.push({
                    id: `obj_${i}`,
                    type: 'rectangle',
                    text: `Objet ${i} #process-object`,
                    x: (i % 4) * 200,
                    y: Math.floor(i / 4) * 150
                });
            }
            
            for (let i = 1; i <= 17; i++) {
                largeCanvas.elements.push({
                    id: `state_${i}`,
                    type: 'text',
                    text: `État ${i} #process-state`,
                    x: (i % 4) * 200 + 10,
                    y: Math.floor(i / 4) * 150 + 20
                });
            }
            
            for (let i = 1; i <= 17; i++) {
                largeCanvas.elements.push({
                    id: `action_${i}`,
                    type: 'rectangle',
                    text: `Action ${i} #process-action`,
                    x: (i % 4) * 200 + 50,
                    y: Math.floor(i / 4) * 150 + 80
                });
            }
            
            // Mocks pour performance
            vi.mocked(fs.access).mockResolvedValue(undefined);
            vi.mocked(fs.stat).mockResolvedValue({ isFile: () => true, size: 20 * 1024 });
            vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(largeCanvas));
            vi.mocked(fs.mkdir).mockResolvedValue(undefined);
            vi.mocked(fs.writeFile).mockResolvedValue(undefined);
            
            // Mock génération rapide (10ms par template)
            mockTemplateProcessor.syncObjectToTemplate.mockImplementation(() => 
                new Promise(resolve => setTimeout(() => resolve('./output.md'), 10))
            );
            mockTemplateProcessor.syncStateToTemplate.mockImplementation(() =>
                new Promise(resolve => setTimeout(() => resolve('./output.md'), 10))
            );
            mockTemplateProcessor.syncActionToTemplate.mockImplementation(() =>
                new Promise(resolve => setTimeout(() => resolve('./output.md'), 10))
            );
            
            const startTime = Date.now();
            
            // Workflow complet
            const canvasData = await reader.readCanvas('large-canvas.excalidraw');
            const result = await generator.generateFromCanvas(canvasData);
            
            const totalTime = Date.now() - startTime;
            
            // Vérifier résultats
            expect(canvasData.objects).toHaveLength(16);
            expect(canvasData.states).toHaveLength(17);
            expect(canvasData.actions).toHaveLength(17);
            
            expect(result.objectsGenerated).toBe(16);
            expect(result.statesGenerated).toBe(17);
            expect(result.actionsGenerated).toBe(17);
            
            // Performance target: <5s pour 50 composants
            expect(totalTime).toBeLessThan(5000);
            expect(result.metadata.performanceTarget).toBe(true);
            
            console.log(`📊 Performance test: 50 éléments traités en ${totalTime}ms`);
        });
        
        it('should handle performance degradation gracefully', async () => {
            const smallCanvas = {
                elements: [
                    {
                        id: 'obj_slow',
                        type: 'rectangle',
                        text: 'Objet Test #process-object',
                        x: 100,
                        y: 100
                    }
                ]
            };
            
            vi.mocked(fs.access).mockResolvedValue(undefined);
            vi.mocked(fs.stat).mockResolvedValue({ isFile: () => true, size: 1024 });
            vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(smallCanvas));
            vi.mocked(fs.mkdir).mockResolvedValue(undefined);
            vi.mocked(fs.writeFile).mockResolvedValue(undefined);
            
            // Simuler génération lente (6s)
            mockTemplateProcessor.syncObjectToTemplate.mockImplementation(() =>
                new Promise(resolve => setTimeout(() => resolve('./output.md'), 6000))
            );
            
            const result = await generator.generateFromCanvas(await reader.readCanvas('slow.excalidraw'));
            
            expect(result.success).toBe(true);
            expect(result.metadata.performanceTarget).toBe(false); // Objectif non atteint
            expect(result.metadata.totalGenerationTime).toBeGreaterThan(5000);
        });
    });
    
    describe('Error Handling Integration', () => {
        it('should handle canvas reading errors and continue generation', async () => {
            const partialCanvas = {
                elements: [
                    {
                        id: 'obj_good',
                        type: 'rectangle',
                        text: 'Objet Valide #process-object',
                        x: 100,
                        y: 100
                    },
                    {
                        id: 'obj_bad',
                        type: 'rectangle',
                        // text manquant - devrait être ignoré
                        x: 200,
                        y: 200
                    },
                    {
                        id: 'state_good',
                        type: 'text',
                        text: 'État Valide #process-state',
                        x: 110,
                        y: 110
                    }
                ]
            };
            
            vi.mocked(fs.access).mockResolvedValue(undefined);
            vi.mocked(fs.stat).mockResolvedValue({ isFile: () => true, size: 1024 });
            vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(partialCanvas));
            vi.mocked(fs.mkdir).mockResolvedValue(undefined);
            vi.mocked(fs.writeFile).mockResolvedValue(undefined);
            
            mockTemplateProcessor.syncObjectToTemplate
                .mockResolvedValue('./objects/objet-valide.md');
            mockTemplateProcessor.syncStateToTemplate
                .mockResolvedValue('./states/etat-valide.md');
            
            const canvasData = await reader.readCanvas('partial.excalidraw');
            const result = await generator.generateFromCanvas(canvasData);
            
            // Seuls les éléments valides doivent être traités
            expect(canvasData.objects).toHaveLength(1);
            expect(canvasData.states).toHaveLength(1);
            expect(canvasData.objects[0].name).toBe('Objet Valide');
            
            expect(result.success).toBe(true);
            expect(result.objectsGenerated).toBe(1);
            expect(result.statesGenerated).toBe(1);
        });
        
        it('should handle template generation errors and report them', async () => {
            const simpleCanvas = {
                elements: [
                    {
                        id: 'obj_error',
                        type: 'rectangle',
                        text: 'Objet Problème #process-object',
                        x: 100,
                        y: 100
                    }
                ]
            };
            
            vi.mocked(fs.access).mockResolvedValue(undefined);
            vi.mocked(fs.stat).mockResolvedValue({ isFile: () => true, size: 1024 });
            vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(simpleCanvas));
            vi.mocked(fs.mkdir).mockResolvedValue(undefined);
            vi.mocked(fs.writeFile).mockResolvedValue(undefined);
            
            // Simuler erreur de template
            mockTemplateProcessor.syncObjectToTemplate
                .mockRejectedValue(new Error('Template corruption'));
            
            const canvasData = await reader.readCanvas('error.excalidraw');
            const result = await generator.generateFromCanvas(canvasData);
            
            expect(result.success).toBe(true); // Continue malgré l'erreur
            expect(result.objectsGenerated).toBe(0); // Mais aucun objet généré
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0].message).toContain('Objet Problème');
        });
    });
    
    describe('Data Flow Validation', () => {
        it('should preserve data integrity through complete pipeline', async () => {
            const testCanvas = {
                elements: [
                    {
                        id: 'obj_integrity_001',
                        type: 'rectangle',
                        text: 'Lot-Spécial-001 Matière Premium #process-object',
                        x: 150,
                        y: 250,
                        width: 120,
                        height: 80,
                        backgroundColor: '#4CAF50'
                    },
                    {
                        id: 'state_integrity_001',
                        type: 'text',
                        text: 'Contrôle Premium Actif #process-state',
                        x: 155,
                        y: 260,
                        backgroundColor: '#2196F3'
                    },
                    {
                        id: 'action_integrity_001',
                        type: 'rectangle',
                        text: 'Validation Premium #process-action',
                        x: 200,
                        y: 270,
                        width: 140,
                        height: 60,
                        backgroundColor: '#F44336'
                    }
                ]
            };
            
            vi.mocked(fs.access).mockResolvedValue(undefined);
            vi.mocked(fs.stat).mockResolvedValue({ isFile: () => true, size: 1024 });
            vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(testCanvas));
            vi.mocked(fs.mkdir).mockResolvedValue(undefined);
            vi.mocked(fs.writeFile).mockResolvedValue(undefined);
            
            mockTemplateProcessor.syncObjectToTemplate.mockResolvedValue('./output.md');
            mockTemplateProcessor.syncStateToTemplate.mockResolvedValue('./output.md');
            mockTemplateProcessor.syncActionToTemplate.mockResolvedValue('./output.md');
            
            // Pipeline complet
            const canvasData = await reader.readCanvas('integrity.excalidraw');
            await generator.generateFromCanvas(canvasData);
            
            // Vérifier intégrité des données objets
            const objectData = mockTemplateProcessor.syncObjectToTemplate.mock.calls[0][0];
            expect(objectData.objectName).toBe('Lot-Spécial-001 Matière Premium');
            expect(objectData.objectType).toBe('raw-material');
            expect(objectData.tracedEntity).toBe('Lot-Spécial-001 Matière Premium');
            expect(objectData.position).toEqual({ x: 150, y: 250 });
            expect(objectData.dimensions).toEqual({ width: 120, height: 80 });
            expect(objectData.backgroundColor).toBe('#4CAF50');
            
            // Vérifier intégrité des données états
            const stateData = mockTemplateProcessor.syncStateToTemplate.mock.calls[0][0];
            expect(stateData.stateName).toBe('Contrôle Premium Actif');
            expect(stateData.disposition).toBe('active');
            expect(stateData.mainAction.actionName).toBe('Consulter_Contrôle_Premium_Actif');
            expect(stateData.mainAction.automaticallyGenerated).toBe(true);
            
            // Vérifier intégrité des données actions
            const actionData = mockTemplateProcessor.syncActionToTemplate.mock.calls[0][0];
            expect(actionData.actionName).toBe('Validation Premium');
            expect(actionData.actionType).toBe('validation_action');
            expect(actionData.actionCategory).toBe('validation');
            expect(actionData.backgroundColor).toBe('#F44336');
            expect(actionData.businessStep).toBe('inspecting');
            expect(actionData.workflowInternal.rollback.supported).toBe(true);
        });
    });
    
    describe('Architecture Two-Level Validation', () => {
        it('should correctly implement État-Actions two-level architecture', async () => {
            const architectureCanvas = {
                elements: [
                    {
                        id: 'obj_arch',
                        type: 'rectangle',
                        text: 'Lot Production #process-object',
                        x: 100,
                        y: 100
                    },
                    {
                        id: 'state_arch',
                        type: 'text',
                        text: 'En Cours Production #process-state',
                        x: 110,
                        y: 120
                    },
                    {
                        id: 'action_main',
                        type: 'rectangle',
                        text: 'Consulter État Principal #process-action',
                        x: 150,
                        y: 140
                    },
                    {
                        id: 'action_sec1',
                        type: 'rectangle',
                        text: 'Avancer Phase Secondaire #process-action',
                        x: 150,
                        y: 180
                    },
                    {
                        id: 'action_sec2',
                        type: 'rectangle',
                        text: 'Contrôler Qualité Secondaire #process-action',
                        x: 150,
                        y: 220
                    }
                ]
            };
            
            vi.mocked(fs.access).mockResolvedValue(undefined);
            vi.mocked(fs.stat).mockResolvedValue({ isFile: () => true, size: 1024 });
            vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(architectureCanvas));
            vi.mocked(fs.mkdir).mockResolvedValue(undefined);
            vi.mocked(fs.writeFile).mockResolvedValue(undefined);
            
            mockTemplateProcessor.syncObjectToTemplate.mockResolvedValue('./output.md');
            mockTemplateProcessor.syncStateToTemplate.mockResolvedValue('./output.md');
            mockTemplateProcessor.syncActionToTemplate
                .mockResolvedValueOnce('./output1.md')
                .mockResolvedValueOnce('./output2.md')
                .mockResolvedValueOnce('./output3.md');
            
            const canvasData = await reader.readCanvas('architecture.excalidraw');
            await generator.generateFromCanvas(canvasData);
            
            // Vérifier structure deux niveaux
            expect(canvasData.objects).toHaveLength(1);
            expect(canvasData.states).toHaveLength(1);
            expect(canvasData.actions).toHaveLength(3);
            
            // Vérifier que l'état a une action principale automatique
            const stateData = mockTemplateProcessor.syncStateToTemplate.mock.calls[0][0];
            expect(stateData.mainAction).toBeDefined();
            expect(stateData.mainAction.actionType).toBe('main_action');
            expect(stateData.mainAction.automaticallyGenerated).toBe(true);
            expect(stateData.mainAction.description).toContain('Consultation des données');
            
            // Vérifier que les actions secondaires sont correctement typées
            const actionCalls = mockTemplateProcessor.syncActionToTemplate.mock.calls;
            
            const mainAction = actionCalls.find(call => 
                call[0].actionName.includes('Principal')
            )?.[0];
            const secActions = actionCalls.filter(call => 
                call[0].actionName.includes('Secondaire')
            );
            
            if (mainAction) {
                expect(mainAction.actionCategory).toBe('data_exposition');
            }
            
            secActions.forEach(([actionData]) => {
                expect(['state_transition', 'validation'].includes(actionData.actionCategory)).toBe(true);
            });
        });
    });
});

// <!-- END OF FILE: integration.test.js -->