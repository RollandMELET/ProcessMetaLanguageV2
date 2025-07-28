// <!-- START OF FILE: canvas-template-sync.test.js -->
// FILENAME: canvas-template-sync.test.js
// Version: 1.0.0
// Date: 2025-07-28 10:30
// Author: Rolland MELET & Claude Code
// Description: Tests d'intégration synchronisation canvas ↔ template - TASK-B001

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TemplateProcessor } from '../../core/template-processor.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

describe('Intégration Canvas ↔ Template Synchronisation', () => {
    let processor;
    let tempDir;
    let testTemplatesDir;
    let outputDir;
    
    beforeEach(async () => {
        // Setup environnement temporaire
        tempDir = path.join(os.tmpdir(), `integration-test-${Date.now()}`);
        testTemplatesDir = path.join(tempDir, 'templates');
        outputDir = path.join(tempDir, 'output');
        
        await fs.mkdir(testTemplatesDir, { recursive: true });
        await fs.mkdir(outputDir, { recursive: true });
        
        // Initialiser processor
        processor = new TemplateProcessor({
            templatesDir: testTemplatesDir,
            outputDir: outputDir
        });
        
        // Créer template réaliste
        await createRealisticTemplate();
    });
    
    afterEach(async () => {
        try {
            await fs.rm(tempDir, { recursive: true, force: true });
        } catch (error) {
            console.warn('Nettoyage test:', error.message);
        }
    });
    
    /**
     * Crée un template réaliste pour tests d'intégration
     */
    async function createRealisticTemplate() {
        const template = `---
object_id: "{{OBJECT_ID}}"
object_name: "{{OBJECT_NAME}}"
object_type: "{{OBJECT_TYPE}}"
created_at: "{{CREATED_AT}}"
modified_at: "{{MODIFIED_AT}}"
position: 
  x: {{X_COORDINATE}}
  y: {{Y_COORDINATE}}
dimensions:
  width: 120
  height: 80
epcis_mapping:
  epc: "{{EPC}}"
  business_step: "{{BUSINESS_STEP}}"
  disposition: "{{DISPOSITION}}"
process_tags:
  - "#process-object"
  - "#object-{{OBJECT_TYPE}}"
  - "#object-{{OBJECT_NAME}}"
sync_status: "{{SYNC_STATUS}}"
template_version: "1.0.0"
---

# Object: {{OBJECT_NAME}}

## Description
**Type:** {{OBJECT_TYPE}}  
**Description:** {{OBJECT_TYPE_DESCRIPTION}}

## État Actuel
**État:** {{CURRENT_STATE}}  
**Business Step:** {{BUSINESS_STEP}}  
**Disposition:** {{DISPOSITION}}

## Position Canvas
- **X:** {{X_COORDINATE}}px
- **Y:** {{Y_COORDINATE}}px
- **Largeur:** {{DIMENSIONS_WIDTH}}px
- **Hauteur:** {{DIMENSIONS_HEIGHT}}px

## EPCIS 2.0
- **EPC:** {{EPC}}
- **Société:** {{COMPANY}}
- **Produit:** {{PRODUCT}}
- **Série:** {{SERIAL}}

{{#if USER_METADATA}}
## Métadonnées Utilisateur
{{#each USER_METADATA}}
- **{{@key}}:** {{this}}
{{/each}}
{{/if}}

## Correspondances 360SmartConnect
- **Avatar ID:** {{AVATAR_ID}}
- **API Endpoint:** \`/api/avatars/{{AVATAR_ID}}\`

---
*Généré le {{GENERATION_TIMESTAMP}}*
`;
        
        await fs.writeFile(path.join(testTemplatesDir, 'object-template.md'), template);
    }
    
    /**
     * Simule des données canvas réalistes ProcessMetaLanguage
     */
    function createRealisticCanvasData(overrides = {}) {
        return {
            uniqueId: 'obj_123456789_abc123',
            objectName: 'Lot-Acier-Premium-A001',
            objectType: 'raw-material',
            position: { x: 150, y: 250 },
            dimensions: { width: 120, height: 80 },
            createdAt: '2024-01-15T10:30:00.000Z',
            lastModified: '2024-01-15T10:30:00.000Z',
            currentState: 'Received',
            elementId: 'excalidraw_element_789',
            userMetadata: {
                supplier: 'AcierCorp France',
                grade: 'Premium A',
                batch: 'B2024-001',
                weight: '500kg',
                company: '0012345',
                product: '001234',
                serial: '000001',
                businessStep: 'receiving',
                disposition: 'active',
                avatarId: 'avatar_acier_001',
                description: 'Matière première acier haute qualité pour production'
            },
            ...overrides
        };
    }
    
    describe('Génération Template depuis Canvas', () => {
        it('devrait générer template complet depuis données canvas', async () => {
            const canvasData = createRealisticCanvasData();
            const outputPath = path.join(outputDir, 'lot-acier-a001.md');
            
            const result = await processor.generateFromCanvas(
                canvasData, 
                'object-template', 
                outputPath
            );
            
            expect(result.success).toBe(true);
            expect(result.templateName).toBe('object-template');
            expect(result.outputPath).toBe(outputPath);
            
            // Vérifier fichier créé
            const generatedContent = await fs.readFile(outputPath, 'utf-8');
            
            // Vérifier frontmatter YAML
            expect(generatedContent).toContain('object_id: "obj_123456789_abc123"');
            expect(generatedContent).toContain('object_name: "Lot-Acier-Premium-A001"');
            expect(generatedContent).toContain('object_type: "raw-material"');
            expect(generatedContent).toContain('x: 150');
            expect(generatedContent).toContain('y: 250');
            
            // Vérifier corps markdown
            expect(generatedContent).toContain('# Object: Lot-Acier-Premium-A001');
            expect(generatedContent).toContain('**Type:** raw-material');
            expect(generatedContent).toContain('**X:** 150px');
            expect(generatedContent).toContain('**Y:** 250px');
            expect(generatedContent).toContain('**EPC:** urn:epc:id:sgtin:0012345.001234.000001');
            
            // Vérifier métadonnées utilisateur
            expect(generatedContent).toContain('**supplier:** AcierCorp France');
            expect(generatedContent).toContain('**grade:** Premium A');
            expect(generatedContent).toContain('**weight:** 500kg');
        });
        
        it('devrait gérer objets avec données partielles', async () => {
            const canvasData = {
                uniqueId: 'obj_minimal',
                objectName: 'Test-Minimal',
                objectType: 'custom'
                // Pas de position, métadonnées, etc.
            };
            
            const outputPath = path.join(outputDir, 'test-minimal.md');
            
            const result = await processor.generateFromCanvas(
                canvasData,
                'object-template',
                outputPath
            );
            
            expect(result.success).toBe(true);
            
            const content = await fs.readFile(outputPath, 'utf-8');
            expect(content).toContain('# Object: Test-Minimal');
            expect(content).toContain('object_type: "custom"');
            expect(content).toContain('x: 0'); // Valeurs par défaut
            expect(content).toContain('y: 0');
        });
    });
    
    describe('Synchronisation Bidirectionnelle', () => {
        it('devrait synchroniser objet canvas vers template', async () => {
            const canvasData = createRealisticCanvasData({
                objectName: 'Lot-Sync-Test',
                userMetadata: {
                    ...createRealisticCanvasData().userMetadata,
                    syncTest: true,
                    lastUpdate: 'sync-test'
                }
            });
            
            const syncedPath = await processor.syncCanvasToTemplate(canvasData);
            
            expect(syncedPath).toContain('lot-sync-test.md');
            
            const syncedContent = await fs.readFile(syncedPath, 'utf-8');
            expect(syncedContent).toContain('# Object: Lot-Sync-Test');
            expect(syncedContent).toContain('**syncTest:** true');
            expect(syncedContent).toContain('**lastUpdate:** sync-test');
        });
        
        it('devrait créer dossier de sortie automatiquement', async () => {
            const canvasData = createRealisticCanvasData();
            
            // Supprimer dossier objects pour test
            const objectsDir = path.join(outputDir, 'objects');
            try {
                await fs.rm(objectsDir, { recursive: true });
            } catch {} // Ignorer si n'existe pas
            
            const syncedPath = await processor.syncCanvasToTemplate(canvasData);
            
            // Vérifier que le dossier a été créé
            const dirExists = await fs.access(path.dirname(syncedPath))
                .then(() => true)
                .catch(() => false);
            
            expect(dirExists).toBe(true);
            
            // Vérifier fichier créé
            const fileExists = await fs.access(syncedPath)
                .then(() => true)
                .catch(() => false);
            
            expect(fileExists).toBe(true);
        });
    });
    
    describe('Performance Batch', () => {
        it('devrait traiter plusieurs objets rapidement', async () => {
            const batchSize = 20;
            const canvasObjects = Array.from({ length: batchSize }, (_, i) => 
                createRealisticCanvasData({
                    uniqueId: `obj_batch_${i}`,
                    objectName: `Batch-Object-${i.toString().padStart(3, '0')}`,
                    objectType: i % 2 === 0 ? 'raw-material' : 'product',
                    position: { x: (i % 5) * 100, y: Math.floor(i / 5) * 100 },
                    userMetadata: {
                        batchIndex: i,
                        batchTotal: batchSize,
                        testType: 'performance-test'
                    }
                })
            );
            
            const startTime = performance.now();
            
            const batchResult = await processor.generateBatch(
                canvasObjects,
                'object-template',
                outputDir
            );
            
            const endTime = performance.now();
            const executionTime = endTime - startTime;
            
            expect(batchResult.totalObjects).toBe(batchSize);
            expect(batchResult.successful).toBe(batchSize);
            expect(batchResult.failed).toBe(0);
            expect(executionTime).toBeLessThan(5000); // <5s critère TASK-B001
            
            // Vérifier quelques fichiers générés
            for (let i = 0; i < 3; i++) {
                const filePath = path.join(outputDir, `batch-object-${i.toString().padStart(3, '0')}.md`);
                const exists = await fs.access(filePath).then(() => true).catch(() => false);
                expect(exists).toBe(true);
                
                const content = await fs.readFile(filePath, 'utf-8');
                expect(content).toContain(`# Object: Batch-Object-${i.toString().padStart(3, '0')}`);
                expect(content).toContain('**batchIndex:** ' + i);
            }
        });
        
        it('devrait respecter critères performance pour 50 objets', async () => {
            const batchSize = 50;
            const canvasObjects = Array.from({ length: batchSize }, (_, i) => 
                createRealisticCanvasData({
                    uniqueId: `obj_perf_${i}`,
                    objectName: `Performance-Test-${i}`,
                    objectType: ['raw-material', 'product', 'container', 'equipment'][i % 4],
                    position: { x: i * 20, y: (i % 10) * 30 }
                })
            );
            
            const startTime = performance.now();
            
            const result = await processor.generateBatch(
                canvasObjects,
                'object-template',
                path.join(outputDir, 'performance-test')
            );
            
            const endTime = performance.now();
            const totalTime = endTime - startTime;
            
            expect(result.successful).toBe(50);
            expect(totalTime).toBeLessThan(5000); // Critère TASK-B001: <5s pour 50 templates
            
            console.log(`✅ Performance test: 50 templates en ${totalTime.toFixed(2)}ms`);
            
            expect(result.performanceTarget).toBe('✅ <5s');
        });
    });
    
    describe('Gestion Erreurs', () => {
        it('devrait gérer données canvas invalides', async () => {
            const invalidData = null;
            
            await expect(
                processor.generateFromCanvas(invalidData, 'object-template', '/tmp/invalid.md')
            ).rejects.toThrow();
        });
        
        it('devrait gérer template inexistant', async () => {
            const canvasData = createRealisticCanvasData();
            
            await expect(
                processor.generateFromCanvas(canvasData, 'nonexistent-template', '/tmp/test.md')
            ).rejects.toThrow('Template \'nonexistent-template\' introuvable');
        });
    });
    
    describe('Types d\'Objets EPCIS', () => {
        const epcisTypes = [
            'raw-material',
            'product', 
            'container',
            'equipment',
            'document',
            'location',
            'batch'
        ];
        
        it.each(epcisTypes)('devrait traiter type %s correctement', async (objectType) => {
            const canvasData = createRealisticCanvasData({
                objectType,
                objectName: `Test-${objectType.charAt(0).toUpperCase() + objectType.slice(1)}`,
                userMetadata: {
                    type: objectType,
                    compliance: 'EPCIS-2.0'
                }
            });
            
            const outputPath = path.join(outputDir, `test-${objectType}.md`);
            
            const result = await processor.generateFromCanvas(
                canvasData,
                'object-template',
                outputPath
            );
            
            expect(result.success).toBe(true);
            
            const content = await fs.readFile(outputPath, 'utf-8');
            expect(content).toContain(`object_type: "${objectType}"`);
            expect(content).toContain(`**Type:** ${objectType}`);
        });
    });
    
    describe('Cache et Optimisation', () => {
        it('devrait utiliser cache pour templates répétés', async () => {
            const canvasData1 = createRealisticCanvasData({ objectName: 'Cache-Test-1' });
            const canvasData2 = createRealisticCanvasData({ objectName: 'Cache-Test-2' });
            
            // Premier appel - chargement template
            const startTime1 = performance.now();
            await processor.generateFromCanvas(canvasData1, 'object-template', path.join(outputDir, 'cache1.md'));
            const time1 = performance.now() - startTime1;
            
            // Deuxième appel - template en cache
            const startTime2 = performance.now();
            await processor.generateFromCanvas(canvasData2, 'object-template', path.join(outputDir, 'cache2.md'));
            const time2 = performance.now() - startTime2;
            
            // Le deuxième devrait être plus rapide (cache)
            expect(time2).toBeLessThan(time1);
            expect(processor.templateCache.size).toBe(1);
        });
    });
});

// <!-- END OF FILE: canvas-template-sync.test.js -->