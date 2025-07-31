// <!-- START OF FILE: canvas-sync-integration.test.js -->
// FILENAME: canvas-sync-integration.test.js
// Version: 1.0.0
// Date: 2025-07-31 23:15
// Author: Rolland MELET & Claude Code
// Description: Tests intégration synchronisation Canvas-Templates - TASK-T013

/**
 * Tests d'intégration pour la synchronisation Canvas ↔ Templates
 * 
 * Valide la synchronisation bidirectionnelle entre :
 * - Canvas Excalidraw (visuel)
 * - Templates YAML (données)
 * - Documentation Markdown (texte)
 * 
 * @module CanvasSyncIntegration
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';

// Modules synchronisation
import { CanvasSync } from '../../sync/canvas-sync.js';
import { TemplateSync } from '../../sync/template-sync.js';
import { MarkdownSync } from '../../sync/markdown-sync.js';
import { FileWatcher } from '../../sync/file-watcher.js';

// Modules core nécessaires
import { CanvasReader } from '../../sync/canvas-reader.js';
import { MarkdownGenerator } from '../../sync/markdown-generator.js';
import { TemplateProcessor } from '../../core/template-processor.js';

// Utils
import { setupMockEnvironment, createMockFile } from '../test-utils.js';

describe('Tests Intégration Synchronisation Canvas-Templates', () => {
    let mockApp, mockEA;
    let canvasSync, templateSync, markdownSync;
    let fileWatcher;
    let testDir;
    
    beforeEach(async () => {
        // Setup environnement
        const env = setupMockEnvironment();
        mockApp = env.app;
        mockEA = env.excalidrawAPI;
        
        // Créer répertoire test temporaire
        testDir = path.join(process.cwd(), 'temp-test-sync');
        await fs.mkdir(testDir, { recursive: true });
        
        // Initialiser modules sync
        canvasSync = new CanvasSync(mockApp, mockEA);
        templateSync = new TemplateSync(mockApp, mockEA);
        markdownSync = new MarkdownSync(mockApp);
        fileWatcher = new FileWatcher(mockApp);
        
        await Promise.all([
            canvasSync.initialize(),
            templateSync.initialize(),
            markdownSync.initialize()
        ]);
    });
    
    afterEach(async () => {
        // Cleanup
        await fileWatcher.stop();
        await fs.rm(testDir, { recursive: true, force: true });
    });
    
    /**
     * TEST 1 : Synchronisation Canvas → Templates
     */
    describe('Canvas vers Templates', () => {
        
        it('1.1 Création composants canvas → génération templates', async () => {
            // Simuler création sur canvas
            const canvasElements = [
                {
                    id: 'obj_1',
                    type: 'hexagon',
                    x: 100,
                    y: 100,
                    text: 'Order-2024-001',
                    customData: {
                        componentType: 'object',
                        objectType: 'order',
                        metadata: {
                            customer: 'ACME Corp',
                            amount: 1500
                        }
                    }
                },
                {
                    id: 'state_1',
                    type: 'rectangle',
                    x: 100,
                    y: 130,
                    text: 'pending',
                    customData: {
                        componentType: 'state',
                        disposition: 'pending',
                        parentObject: 'obj_1'
                    }
                },
                {
                    id: 'action_1',
                    type: 'rectangle',
                    x: 250,
                    y: 130,
                    text: 'order_received',
                    customData: {
                        componentType: 'action',
                        businessStep: 'order_received',
                        parentState: 'state_1',
                        isMainAction: true
                    }
                }
            ];
            
            mockEA.getElements.mockReturnValue(canvasElements);
            
            // Déclencher synchronisation
            const syncResult = await canvasSync.syncToTemplates();
            
            expect(syncResult.success).toBe(true);
            expect(syncResult.synced).toMatchObject({
                objects: 1,
                states: 1,
                actions: 1
            });
            
            // Vérifier templates générés
            const templates = await templateSync.getGeneratedTemplates();
            
            expect(templates.objects).toHaveLength(1);
            expect(templates.objects[0]).toMatchObject({
                id: 'obj_1',
                name: 'Order-2024-001',
                type: 'order',
                metadata: {
                    customer: 'ACME Corp',
                    amount: 1500
                }
            });
            
            expect(templates.states).toHaveLength(1);
            expect(templates.states[0]).toMatchObject({
                id: 'state_1',
                disposition: 'pending',
                parentObject: 'obj_1'
            });
            
            expect(templates.actions).toHaveLength(1);
            expect(templates.actions[0]).toMatchObject({
                id: 'action_1',
                businessStep: 'order_received',
                isMainAction: true
            });
        });
        
        it('1.2 Mise à jour canvas → propagation templates', async () => {
            // État initial
            await setupInitialCanvasState();
            await canvasSync.syncToTemplates();
            
            const initialTemplates = await templateSync.getGeneratedTemplates();
            expect(initialTemplates.objects[0].metadata.status).toBe('draft');
            
            // Modifier sur canvas
            const updatedElements = mockEA.getElements();
            updatedElements[0].customData.metadata.status = 'confirmed';
            updatedElements[0].customData.metadata.priority = 'high';
            
            // Ajouter nouvel état
            updatedElements.push({
                id: 'state_2',
                type: 'rectangle',
                x: 100,
                y: 200,
                text: 'processing',
                customData: {
                    componentType: 'state',
                    disposition: 'in_progress',
                    parentObject: 'obj_1'
                }
            });
            
            mockEA.getElements.mockReturnValue(updatedElements);
            
            // Re-synchroniser
            const updateResult = await canvasSync.syncToTemplates();
            
            expect(updateResult.success).toBe(true);
            expect(updateResult.changes).toMatchObject({
                updated: ['obj_1'],
                added: ['state_2']
            });
            
            // Vérifier propagation
            const updatedTemplates = await templateSync.getGeneratedTemplates();
            expect(updatedTemplates.objects[0].metadata.status).toBe('confirmed');
            expect(updatedTemplates.objects[0].metadata.priority).toBe('high');
            expect(updatedTemplates.states).toHaveLength(2);
        });
        
        it('1.3 Suppression canvas → nettoyage templates', async () => {
            // Setup avec plusieurs éléments
            await setupComplexCanvasState();
            await canvasSync.syncToTemplates();
            
            const initial = await templateSync.getGeneratedTemplates();
            expect(initial.objects).toHaveLength(3);
            expect(initial.states).toHaveLength(6);
            
            // Supprimer un objet complet
            const remainingElements = mockEA.getElements()
                .filter(el => !el.id.includes('obj_2'));
            
            mockEA.getElements.mockReturnValue(remainingElements);
            mockEA.deleteElement.mockImplementation(id => {
                console.log(`Deleted: ${id}`);
            });
            
            // Synchroniser suppression
            const deleteResult = await canvasSync.syncToTemplates();
            
            expect(deleteResult.success).toBe(true);
            expect(deleteResult.changes.deleted).toContain('obj_2');
            
            // Vérifier nettoyage cascade
            const final = await templateSync.getGeneratedTemplates();
            expect(final.objects).toHaveLength(2);
            expect(final.states).toHaveLength(4); // États liés supprimés aussi
        });
    });
    
    /**
     * TEST 2 : Synchronisation Templates → Canvas
     */
    describe('Templates vers Canvas', () => {
        
        it('2.1 Import template YAML → création canvas', async () => {
            // Template YAML à importer
            const yamlTemplate = `
name: Coffee Supply Chain
objects:
  - id: lot_coffee_001
    name: Lot-Coffee-Brazil-001
    type: raw_material
    metadata:
      origin: Brazil
      variety: Arabica
      quantity: 500kg
states:
  - id: state_harvested
    object: lot_coffee_001
    disposition: harvested
    location: Farm Santos
  - id: state_dried
    object: lot_coffee_001
    disposition: dried
    location: Drying Station
actions:
  - id: action_harvest
    state: state_harvested
    businessStep: harvesting
    isMainAction: true
  - id: action_dry
    state: state_dried
    businessStep: drying
    isMainAction: false
`;
            
            // Créer fichier template
            const templatePath = path.join(testDir, 'coffee-process.yaml');
            await fs.writeFile(templatePath, yamlTemplate);
            
            // Importer template
            const importResult = await templateSync.importFromFile(templatePath);
            
            expect(importResult.success).toBe(true);
            expect(importResult.created).toMatchObject({
                objects: 1,
                states: 2,
                actions: 2
            });
            
            // Vérifier création canvas
            expect(mockEA.create).toHaveBeenCalledTimes(5); // 1 objet + 2 états + 2 actions
            
            // Vérifier positionnement intelligent
            const createdElements = mockEA.create.mock.calls.map(call => call[0]);
            
            // Objet centré
            expect(createdElements[0].x).toBe(400);
            expect(createdElements[0].y).toBe(300);
            
            // États alignés verticalement
            expect(createdElements[1].y).toBe(createdElements[0].y + 30);
            expect(createdElements[2].y).toBe(createdElements[1].y + 100);
            
            // Actions à droite des états
            expect(createdElements[3].x).toBeGreaterThan(createdElements[1].x);
            expect(createdElements[4].x).toBeGreaterThan(createdElements[2].x);
        });
        
        it('2.2 Modification template → mise à jour canvas', async () => {
            // Setup initial
            const templatePath = await createTestTemplate();
            await templateSync.importFromFile(templatePath);
            
            // Modifier template
            const template = await fs.readFile(templatePath, 'utf8');
            const modifiedTemplate = template
                .replace('quantity: 500kg', 'quantity: 750kg')
                .replace('location: Farm Santos', 'location: Farm Rio');
            
            await fs.writeFile(templatePath, modifiedTemplate);
            
            // Déclencher mise à jour
            await fileWatcher.handleFileChange(templatePath);
            
            // Vérifier propagation canvas
            expect(mockEA.updateElement).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: 'lot_coffee_001',
                    customData: expect.objectContaining({
                        metadata: expect.objectContaining({
                            quantity: '750kg'
                        })
                    })
                })
            );
            
            expect(mockEA.updateElement).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: 'state_harvested',
                    customData: expect.objectContaining({
                        location: 'Farm Rio'
                    })
                })
            );
        });
    });
    
    /**
     * TEST 3 : Synchronisation Markdown
     */
    describe('Synchronisation Documentation Markdown', () => {
        
        it('3.1 Canvas → Markdown automatique', async () => {
            // Setup processus complet
            await setupCompleteProcess();
            await canvasSync.syncToTemplates();
            
            // Générer markdown
            const mdResult = await markdownSync.generateFromCanvas();
            
            expect(mdResult.success).toBe(true);
            expect(mdResult.files).toHaveLength(1);
            
            // Vérifier contenu markdown
            const mdContent = mdResult.content;
            
            // Structure attendue
            expect(mdContent).toContain('# Processus: Order Fulfillment');
            expect(mdContent).toContain('## Objets');
            expect(mdContent).toContain('### Order-2024-001');
            expect(mdContent).toContain('## États et Transitions');
            expect(mdContent).toContain('### pending → processing');
            expect(mdContent).toContain('## Business Steps');
            expect(mdContent).toContain('- **order_received**');
            expect(mdContent).toContain('- **picking**');
            
            // Métadonnées
            expect(mdContent).toContain('**Customer**: ACME Corp');
            expect(mdContent).toContain('**Amount**: $1,500');
            
            // Diagrammes mermaid
            expect(mdContent).toContain('```mermaid');
            expect(mdContent).toContain('graph LR');
        });
        
        it('3.2 Markdown → Canvas reverse sync', async () => {
            // Créer markdown avec modifications
            const mdPath = path.join(testDir, 'process.md');
            const mdContent = `
# Processus: Coffee Traceability

## Objets

### Lot-Coffee-001
- **Type**: raw_material
- **Origin**: Colombia  
- **Quantity**: 1000kg

## États

1. **harvested** - À la ferme
2. **washed** - Station de lavage
3. **dried** - Séchage solaire

## Actions

- **harvesting** (Principal)
- **washing** (Secondaire)
- **drying** (Secondaire)
`;
            
            await fs.writeFile(mdPath, mdContent);
            
            // Parser et synchroniser
            const parseResult = await markdownSync.parseAndSync(mdPath);
            
            expect(parseResult.success).toBe(true);
            expect(parseResult.created).toMatchObject({
                objects: 1,
                states: 3,
                actions: 3
            });
            
            // Vérifier création éléments canvas
            const createdObjects = mockEA.create.mock.calls
                .filter(call => call[0].customData.componentType === 'object');
            
            expect(createdObjects).toHaveLength(1);
            expect(createdObjects[0][0].customData.metadata).toMatchObject({
                origin: 'Colombia',
                quantity: '1000kg'
            });
        });
    });
    
    /**
     * TEST 4 : Synchronisation Temps Réel
     */
    describe('Synchronisation Temps Réel avec File Watcher', () => {
        
        it('4.1 Détection changements multiples', async () => {
            // Setup watchers
            const watchPaths = [
                path.join(testDir, 'canvas.excalidraw'),
                path.join(testDir, 'templates'),
                path.join(testDir, 'docs')
            ];
            
            await fileWatcher.watch(watchPaths);
            
            // Simuler changements rapides
            const changes = [];
            
            // Change 1: Canvas
            await fs.writeFile(watchPaths[0], JSON.stringify({ elements: [] }));
            changes.push({ file: 'canvas', time: Date.now() });
            
            // Change 2: Template (après 100ms)
            await new Promise(r => setTimeout(r, 100));
            await fs.mkdir(watchPaths[1], { recursive: true });
            await fs.writeFile(path.join(watchPaths[1], 'test.yaml'), 'test: true');
            changes.push({ file: 'template', time: Date.now() });
            
            // Change 3: Documentation (après 200ms)
            await new Promise(r => setTimeout(r, 100));
            await fs.mkdir(watchPaths[2], { recursive: true });
            await fs.writeFile(path.join(watchPaths[2], 'readme.md'), '# Test');
            changes.push({ file: 'doc', time: Date.now() });
            
            // Attendre traitement
            await new Promise(r => setTimeout(r, 500));
            
            // Vérifier debouncing efficace
            const syncCalls = canvasSync.sync.mock?.calls?.length || 0;
            expect(syncCalls).toBeLessThanOrEqual(changes.length);
            
            // Vérifier ordre traitement
            const processedChanges = fileWatcher.getProcessedChanges();
            expect(processedChanges).toHaveLength(3);
            expect(processedChanges[0].type).toBe('canvas');
        });
        
        it('4.2 Gestion conflits synchronisation', async () => {
            // Setup état initial identique partout
            const initialState = await createConsistentState();
            
            // Modification simultanée canvas ET template
            const canvasChange = async () => {
                const elements = mockEA.getElements();
                elements[0].customData.metadata.version = 2;
                mockEA.getElements.mockReturnValue(elements);
                await canvasSync.syncToTemplates();
            };
            
            const templateChange = async () => {
                const template = await templateSync.getGeneratedTemplates();
                template.objects[0].metadata.version = 3;
                await templateSync.updateTemplates(template);
            };
            
            // Exécuter en parallèle
            const [canvasResult, templateResult] = await Promise.all([
                canvasChange(),
                templateChange()
            ]);
            
            // Vérifier résolution conflit
            const resolution = await canvasSync.resolveConflicts();
            expect(resolution.hasConflicts).toBe(true);
            expect(resolution.resolved).toBe(true);
            
            // Stratégie : dernière modification gagne
            const finalState = await templateSync.getGeneratedTemplates();
            expect(finalState.objects[0].metadata.version).toBe(3);
            
            // Canvas mis à jour pour cohérence
            expect(mockEA.updateElement).toHaveBeenCalledWith(
                expect.objectContaining({
                    customData: expect.objectContaining({
                        metadata: expect.objectContaining({
                            version: 3
                        })
                    })
                })
            );
        });
    });
    
    /**
     * TEST 5 : Performance Synchronisation
     */
    describe('Performance et Optimisations', () => {
        
        it('5.1 Sync incrémentale grandes modifications', async () => {
            // Créer processus avec 100 composants
            const largeProcess = await createLargeProcess(100);
            
            // Sync initiale
            const initialStart = performance.now();
            await canvasSync.syncToTemplates();
            const initialTime = performance.now() - initialStart;
            
            expect(initialTime).toBeLessThan(2000); // < 2s pour 100 composants
            
            // Modification partielle (10%)
            const elements = mockEA.getElements();
            for (let i = 0; i < 10; i++) {
                elements[i].customData.metadata.updated = true;
            }
            mockEA.getElements.mockReturnValue(elements);
            
            // Sync incrémentale
            const incrementalStart = performance.now();
            const result = await canvasSync.syncToTemplates({ incremental: true });
            const incrementalTime = performance.now() - incrementalStart;
            
            expect(result.mode).toBe('incremental');
            expect(result.processed).toBe(10); // Seulement modifiés
            expect(incrementalTime).toBeLessThan(initialTime * 0.2); // 80% plus rapide
        });
        
        it('5.2 Batch operations optimization', async () => {
            // Préparer batch de changements
            const batchOperations = [];
            
            for (let i = 0; i < 50; i++) {
                batchOperations.push({
                    type: 'create',
                    element: {
                        id: `batch_${i}`,
                        type: 'hexagon',
                        customData: {
                            componentType: 'object',
                            name: `Batch-${i}`
                        }
                    }
                });
            }
            
            // Exécuter en batch
            const batchStart = performance.now();
            const batchResult = await canvasSync.executeBatch(batchOperations);
            const batchTime = performance.now() - batchStart;
            
            expect(batchResult.success).toBe(true);
            expect(batchResult.processed).toBe(50);
            expect(batchTime).toBeLessThan(1000); // < 1s pour 50 ops
            
            // Comparer avec exécution séquentielle
            const sequentialStart = performance.now();
            for (const op of batchOperations.slice(0, 10)) {
                await canvasSync.executeOperation(op);
            }
            const sequentialTime = performance.now() - sequentialStart;
            
            // Batch doit être significativement plus rapide
            const timePerOpBatch = batchTime / 50;
            const timePerOpSeq = sequentialTime / 10;
            expect(timePerOpBatch).toBeLessThan(timePerOpSeq * 0.3);
        });
    });
});

/**
 * Fonctions Helper
 */

async function setupInitialCanvasState() {
    const elements = [
        {
            id: 'obj_1',
            type: 'hexagon',
            text: 'Order-001',
            customData: {
                componentType: 'object',
                metadata: { status: 'draft' }
            }
        }
    ];
    
    mockEA.getElements.mockReturnValue(elements);
    return elements;
}

async function setupComplexCanvasState() {
    const elements = [];
    
    // 3 objets avec 2 états chacun
    for (let i = 1; i <= 3; i++) {
        const objId = `obj_${i}`;
        elements.push({
            id: objId,
            type: 'hexagon',
            text: `Object-${i}`,
            customData: { componentType: 'object' }
        });
        
        for (let j = 1; j <= 2; j++) {
            elements.push({
                id: `state_${i}_${j}`,
                type: 'rectangle',
                text: `State ${j}`,
                customData: {
                    componentType: 'state',
                    parentObject: objId
                }
            });
        }
    }
    
    mockEA.getElements.mockReturnValue(elements);
    return elements;
}

async function createTestTemplate() {
    const template = `
name: Test Process
objects:
  - id: lot_coffee_001
    name: Lot-Coffee-Brazil-001
    type: raw_material
    metadata:
      quantity: 500kg
states:
  - id: state_harvested
    object: lot_coffee_001
    disposition: harvested
    location: Farm Santos
`;
    
    const templatePath = path.join(testDir, 'test-template.yaml');
    await fs.writeFile(templatePath, template);
    return templatePath;
}

async function setupCompleteProcess() {
    const elements = [
        {
            id: 'order_001',
            type: 'hexagon',
            text: 'Order-2024-001',
            customData: {
                componentType: 'object',
                objectType: 'order',
                metadata: {
                    customer: 'ACME Corp',
                    amount: 1500
                }
            }
        },
        {
            id: 'state_pending',
            type: 'rectangle',
            text: 'pending',
            customData: {
                componentType: 'state',
                disposition: 'pending',
                parentObject: 'order_001'
            }
        },
        {
            id: 'state_processing',
            type: 'rectangle',
            text: 'processing',
            customData: {
                componentType: 'state',
                disposition: 'in_progress',
                parentObject: 'order_001'
            }
        },
        {
            id: 'action_received',
            type: 'rectangle',
            text: 'order_received',
            customData: {
                componentType: 'action',
                businessStep: 'order_received',
                parentState: 'state_pending'
            }
        },
        {
            id: 'action_picking',
            type: 'rectangle',
            text: 'picking',
            customData: {
                componentType: 'action',
                businessStep: 'picking',
                parentState: 'state_processing'
            }
        }
    ];
    
    mockEA.getElements.mockReturnValue(elements);
    return elements;
}

async function createConsistentState() {
    const state = {
        objects: [{
            id: 'obj_1',
            name: 'Test Object',
            metadata: { version: 1 }
        }],
        states: [],
        actions: []
    };
    
    // Sync partout
    await templateSync.updateTemplates(state);
    mockEA.getElements.mockReturnValue([{
        id: 'obj_1',
        customData: {
            componentType: 'object',
            metadata: { version: 1 }
        }
    }]);
    
    return state;
}

async function createLargeProcess(size) {
    const elements = [];
    
    for (let i = 0; i < size; i++) {
        elements.push({
            id: `obj_${i}`,
            type: 'hexagon',
            text: `Object-${i}`,
            customData: {
                componentType: 'object',
                metadata: { index: i }
            }
        });
    }
    
    mockEA.getElements.mockReturnValue(elements);
    return elements;
}

// <!-- END OF FILE: canvas-sync-integration.test.js -->