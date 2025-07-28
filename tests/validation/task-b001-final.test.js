// <!-- START OF FILE: task-b001-final.test.js -->
// FILENAME: task-b001-final.test.js
// Version: 1.0.0
// Date: 2025-07-28 10:45
// Author: Rolland MELET & Claude Code
// Description: Test validation finale TASK-B001 - Système templates markdown OBJECT

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TemplateProcessor } from '../../core/template-processor.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

describe('TASK-B001 - Validation Finale Système Templates', () => {
    let processor;
    let tempDir;
    let templatesDir;
    let outputDir;
    
    beforeEach(async () => {
        tempDir = path.join(os.tmpdir(), `task-b001-final-${Date.now()}`);
        templatesDir = path.join(tempDir, 'templates');
        outputDir = path.join(tempDir, 'output');
        
        await fs.mkdir(templatesDir, { recursive: true });
        await fs.mkdir(outputDir, { recursive: true });
        
        processor = new TemplateProcessor({
            templatesDir,
            outputDir
        });
        
        // Copier template réel
        await copyRealTemplate();
    });
    
    afterEach(async () => {
        try {
            await fs.rm(tempDir, { recursive: true, force: true });
        } catch (error) {
            console.warn('Nettoyage:', error.message);
        }
    });
    
    async function copyRealTemplate() {
        const realTemplatePath = path.join(process.cwd(), 'templates', 'object-template.md');
        const testTemplatePath = path.join(templatesDir, 'object-template.md');
        
        try {
            const content = await fs.readFile(realTemplatePath, 'utf-8');
            await fs.writeFile(testTemplatePath, content);
        } catch (error) {
            console.warn('Template réel non trouvé, création template minimal');
            
            const minimalTemplate = `---
object_id: "{{OBJECT_ID}}"
object_name: "{{OBJECT_NAME}}"
object_type: "{{OBJECT_TYPE}}"
created_at: "{{CREATED_AT}}"
position:
  x: {{X_COORDINATE}}
  y: {{Y_COORDINATE}}
sync_status: "{{SYNC_STATUS}}"
template_version: "1.0.0"
---

# Object: {{OBJECT_NAME}}

## Description
Type: {{OBJECT_TYPE}}

## État Actuel
État: {{CURRENT_STATE}}

## Actions Disponibles
Actions: Consultation et modification
`;
            
            await fs.writeFile(testTemplatePath, minimalTemplate);
        }
    }
    
    describe('Critères TASK-B001 Validés', () => {
        it('✅ Template object-template.md avec frontmatter YAML standardisé', async () => {
            const template = await processor.loadTemplate('object-template');
            
            expect(template.frontmatter).toBeDefined();
            expect(template.body).toBeDefined();
            expect(template.frontmatter.object_id).toBeDefined();
            expect(template.frontmatter.template_version).toBeDefined();
        });
        
        it('✅ Variables dynamiques intégrées et fonctionnelles', async () => {
            const variables = processor.extractVariables('{{OBJECT_NAME}} et {{OBJECT_TYPE}}');
            expect(variables).toContain('OBJECT_NAME');
            expect(variables).toContain('OBJECT_TYPE');
            
            const result = processor.replaceVariables('{{OBJECT_NAME}}', { OBJECT_NAME: 'Test' });
            expect(result).toBe('Test');
        });
        
        it('✅ Synchronisation avec composants graphiques', async () => {
            const canvasData = {
                uniqueId: 'obj_final_test',
                objectName: 'Final-Test-Object',
                objectType: 'raw-material',
                position: { x: 100, y: 200 },
                userMetadata: { test: 'TASK-B001' }
            };
            
            const outputPath = path.join(outputDir, 'final-test.md');
            
            const result = await processor.generateFromCanvas(
                canvasData, 
                'object-template', 
                outputPath
            );
            
            expect(result.success).toBe(true);
            expect(result.templateName).toBe('object-template');
            
            const content = await fs.readFile(outputPath, 'utf-8');
            expect(content).toContain('Final-Test-Object');
            expect(content).toContain('raw-material');
        });
        
        it('✅ Support métadonnées EPCIS 2.0', async () => {
            const canvasData = {
                uniqueId: 'obj_epcis_test',
                objectName: 'EPCIS-Test',
                objectType: 'product',
                userMetadata: {
                    company: '0012345',
                    product: '001234',
                    serial: '000001',
                    businessStep: 'receiving',
                    disposition: 'active'
                }
            };
            
            const variables = processor.prepareTemplateVariables(canvasData);
            
            expect(variables.EPC).toBe('urn:epc:id:sgtin:0012345.001234.000001');
            expect(variables.BUSINESS_STEP).toBe('receiving');
            expect(variables.DISPOSITION).toBe('active');
            expect(variables.COMPANY).toBe('0012345');
        });
        
        it('✅ Performance <5s pour traitement batch', async () => {
            const batchSize = 30; // Test avec 30 objets
            const canvasObjects = Array.from({ length: batchSize }, (_, i) => ({
                uniqueId: `obj_perf_${i}`,
                objectName: `Performance-Object-${i}`,
                objectType: 'raw-material',
                position: { x: i * 10, y: i * 5 },
                userMetadata: { index: i }
            }));
            
            const startTime = performance.now();
            
            const batchResult = await processor.generateBatch(
                canvasObjects,
                'object-template',
                outputDir
            );
            
            const endTime = performance.now();
            const executionTime = endTime - startTime;
            
            expect(batchResult.successful).toBe(batchSize);
            expect(executionTime).toBeLessThan(5000); // <5s critère
            
            console.log(`✅ Performance: ${batchSize} templates en ${executionTime.toFixed(2)}ms`);
        });
        
        it('✅ Structure standardisée conforme', async () => {
            const canvasData = {
                uniqueId: 'obj_structure_test',
                objectName: 'Structure-Test',
                objectType: 'container'
            };
            
            const outputPath = path.join(outputDir, 'structure-test.md');
            await processor.generateFromCanvas(canvasData, 'object-template', outputPath);
            
            const content = await fs.readFile(outputPath, 'utf-8');
            
            // Vérifier structure frontmatter
            expect(content).toMatch(/^---\n/);
            expect(content).toMatch(/\n---\n/);
            
            // Vérifier sections markdown
            expect(content).toContain('# Object:');
            expect(content).toContain('## Description');
        });
        
        it('✅ Gestion erreurs et validation', async () => {
            // Test template inexistant
            await expect(
                processor.loadTemplate('template-inexistant')
            ).rejects.toThrow('Template \'template-inexistant\' introuvable');
            
            // Test données invalides
            await expect(
                processor.generateFromCanvas(null, 'object-template', '/tmp/test.md')
            ).rejects.toThrow();
        });
        
        it('✅ Cache et optimisation fonctionnels', async () => {
            // Premier chargement
            await processor.loadTemplate('object-template');
            expect(processor.templateCache.size).toBe(1);
            
            // Deuxième chargement (depuis cache)
            await processor.loadTemplate('object-template');
            expect(processor.templateCache.size).toBe(1);
            
            // Vider cache
            processor.clearCache();
            expect(processor.templateCache.size).toBe(0);
        });
        
        it('✅ Statistiques et métriques de performance', async () => {
            const canvasData = {
                uniqueId: 'obj_stats_test',
                objectName: 'Stats-Test',
                objectType: 'product'
            };
            
            await processor.generateFromCanvas(
                canvasData, 
                'object-template', 
                path.join(outputDir, 'stats-test.md')
            );
            
            const stats = processor.getPerformanceStats();
            
            expect(stats.templatesGenerated).toBeGreaterThan(0);
            expect(stats.averageTime).toBeGreaterThan(0);
            expect(stats.cacheSize).toBeGreaterThan(0);
            expect(Array.isArray(stats.errors)).toBe(true);
        });
    });
    
    describe('Intégration avec Composants Existants', () => {
        it('✅ Variables compatibles object-creator.js', () => {
            // Simulation métadonnées object-creator
            const objectCreatorData = {
                uniqueId: 'obj_creator_123',
                objectName: 'Created-Object',
                objectType: 'raw-material',
                position: { x: 150, y: 250 },
                dimensions: { width: 120, height: 80 },
                createdAt: '2024-01-15T10:30:00.000Z',
                processTag: '#process-object',
                userMetadata: {
                    supplier: 'TestCorp',
                    batch: 'B2024-001'
                }
            };
            
            const variables = processor.prepareTemplateVariables(objectCreatorData);
            
            expect(variables.OBJECT_ID).toBe('obj_creator_123');
            expect(variables.OBJECT_NAME).toBe('Created-Object');
            expect(variables.X_COORDINATE).toBe(150);
            expect(variables.Y_COORDINATE).toBe(250);
            expect(variables.USER_METADATA.supplier).toBe('TestCorp');
        });
        
        it('✅ Prêt pour state-creator.js et action-creator.js', () => {
            // Test avec données enrichies pour futurs composants
            const enrichedData = {
                uniqueId: 'obj_enriched_123',
                objectName: 'Enriched-Object',
                objectType: 'product',
                currentState: 'InProcess',
                availableActions: [
                    { name: 'Complete', target: 'Completed' },
                    { name: 'Cancel', target: 'Cancelled' }
                ],
                stateHistory: [
                    { state: 'Created', timestamp: '2024-01-15T10:00:00Z' },
                    { state: 'InProcess', timestamp: '2024-01-15T10:30:00Z' }
                ]
            };
            
            const variables = processor.prepareTemplateVariables(enrichedData);
            
            expect(variables.CURRENT_STATE).toBe('InProcess');
            expect(variables.AVAILABLE_ACTIONS).toBeDefined();
            expect(Array.isArray(variables.AVAILABLE_ACTIONS)).toBe(true);
        });
    });
    
    describe('Conformité Standards ProcessMetaLanguage', () => {
        it('✅ Architecture État-Actions deux niveaux supportée', () => {
            const architectureData = {
                // Niveau OBJECT
                uniqueId: 'obj_architecture_test',
                objectName: 'Architecture-Test-Object',
                objectType: 'raw-material',
                
                // Niveau STATE
                currentState: 'Received',
                stateMetadata: {
                    entryTime: '2024-01-15T10:00:00Z',
                    mainAction: 'Inspect',
                    secondaryActions: ['Move', 'Label', 'Sample']
                },
                
                // Actions disponibles
                availableActions: [
                    {
                        name: 'Inspect',
                        type: 'main',
                        description: 'Inspection qualité obligatoire'
                    },
                    {
                        name: 'Move',
                        type: 'secondary',
                        description: 'Déplacer vers zone suivante'
                    }
                ]
            };
            
            const variables = processor.prepareTemplateVariables(architectureData);
            
            // Vérifier support données architecturales
            expect(variables.CURRENT_STATE).toBe('Received');
            expect(variables.AVAILABLE_ACTIONS).toBeDefined();
            expect(variables.OBJECT_TYPE).toBe('raw-material');
        });
        
        it('✅ Correspondances 360SmartConnect préparées', () => {
            const smartConnectData = {
                uniqueId: 'obj_360sc_test',
                objectName: '360SC-Integration-Test',
                objectType: 'product',
                userMetadata: {
                    avatarId: 'avatar_prod_001',
                    companyId: 'company_360sc',
                    webhookUrl: 'https://api.360smartconnect.com/webhook/test'
                }
            };
            
            const variables = processor.prepareTemplateVariables(smartConnectData);
            
            expect(variables.AVATAR_ID).toBe('avatar_prod_001');
            expect(variables.COMPANY_ID).toBe('company_360sc');
            expect(variables.WEBHOOK_URL).toBe('https://api.360smartconnect.com/webhook/test');
        });
    });
});

// <!-- END OF FILE: task-b001-final.test.js -->