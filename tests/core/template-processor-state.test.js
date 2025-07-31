// <!-- START OF FILE: template-processor-state.test.js -->
// FILENAME: template-processor-state.test.js
// Version: 1.0.0
// Date: 2025-07-28 14:30
// Author: Rolland MELET & Claude Code
// Description: Tests unitaires pour le système de templates STATE - TASK-B002

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import { TemplateProcessor } from '../../core/template-processor.js';

// Mock fs/promises
vi.mock('fs/promises');

describe('TemplateProcessor - State Templates', () => {
    let processor;
    const mockTemplatesDir = '/mock/templates';
    const mockOutputDir = '/mock/output';
    
    beforeEach(() => {
        processor = new TemplateProcessor({
            templatesDir: mockTemplatesDir,
            outputDir: mockOutputDir
        });
        
        // Reset tous les mocks
        vi.clearAllMocks();
    });
    
    afterEach(() => {
        processor.clearCache();
    });
    
    describe('getTemplateType', () => {
        it('should identify state templates correctly', () => {
            expect(processor.getTemplateType('state-template')).toBe('state');
            expect(processor.getTemplateType('custom-state-template')).toBe('state');
            expect(processor.getTemplateType('state_processing')).toBe('state');
        });
        
        it('should identify object templates correctly', () => {
            expect(processor.getTemplateType('object-template')).toBe('object');
            expect(processor.getTemplateType('custom-object')).toBe('object');
        });
        
        it('should identify action templates correctly', () => {
            expect(processor.getTemplateType('action-template')).toBe('action');
            expect(processor.getTemplateType('custom-action')).toBe('action');
        });
        
        it('should default to object for unknown templates', () => {
            expect(processor.getTemplateType('unknown')).toBe('object');
            expect(processor.getTemplateType('custom')).toBe('object');
        });
    });
    
    describe('prepareStateVariables', () => {
        it('should prepare complete state variables with all required fields', () => {
            const stateData = {
                uniqueId: 'state_123_abc',
                stateName: 'En_Production',
                disposition: 'active',
                dispositionDescription: 'État opérationnel actif',
                parentObjectId: 'obj_456',
                parentObjectName: 'Lot-Acier-A001',
                parentObjectType: 'raw-material',
                position: { x: 160, y: 250 },
                createdAt: '2024-01-15T10:00:00Z',
                businessStep: 'receiving',
                userMetadata: {
                    operator: 'Jean.Dupont',
                    avatarId: 'avatar_789'
                }
            };
            
            const variables = processor.prepareStateVariables(stateData);
            
            // Vérifier identifiants état
            expect(variables.STATE_ID).toBe('state_123_abc');
            expect(variables.STATE_NAME).toBe('En_Production');
            expect(variables.DISPOSITION).toBe('active');
            expect(variables.DISPOSITION_DESCRIPTION).toBe('État opérationnel actif');
            expect(variables.DISPOSITION_COLOR).toBe('#4CAF50');
            
            // Vérifier relations parent
            expect(variables.PARENT_OBJECT_ID).toBe('obj_456');
            expect(variables.PARENT_OBJECT_NAME).toBe('Lot-Acier-A001');
            expect(variables.PARENT_OBJECT_TYPE).toBe('raw-material');
            
            // Vérifier position
            expect(variables.X_COORDINATE).toBe(160);
            expect(variables.Y_COORDINATE).toBe(250);
            expect(variables.DIMENSIONS_WIDTH).toBe(80);
            expect(variables.DIMENSIONS_HEIGHT).toBe(40);
            
            // Vérifier EPCIS
            expect(variables.BUSINESS_STEP).toBe('receiving');
            expect(variables.BUSINESS_LOCATION).toContain('urn:epc:id:sgln:');
            
            // Vérifier architecture État-Actions
            expect(variables.MAIN_ACTION).toEqual({
                generated: true,
                type: 'data_exposition',
                name: 'Consulter État En_Production'
            });
            
            // Vérifier 360SmartConnect
            expect(variables.AVATAR_ID).toBe('avatar_789');
            expect(variables.OPERATOR).toBe('Jean.Dupont');
        });
        
        it('should handle missing optional fields with defaults', () => {
            const minimalStateData = {
                stateName: 'État_Test',
                disposition: 'unknown'
            };
            
            const variables = processor.prepareStateVariables(minimalStateData);
            
            expect(variables.STATE_ID).toBe('unknown');
            expect(variables.STATE_NAME).toBe('État_Test');
            expect(variables.DISPOSITION).toBe('unknown');
            expect(variables.DISPOSITION_COLOR).toBe('#9E9E9E');
            expect(variables.PARENT_OBJECT_ID).toBeNull();
            expect(variables.PARENT_OBJECT_NAME).toBe('Unknown Object');
            expect(variables.X_COORDINATE).toBe(0);
            expect(variables.Y_COORDINATE).toBe(0);
            expect(variables.BUSINESS_STEP).toBe('observing');
            expect(variables.OPERATOR).toBe('System');
        });
        
        it('should handle all EPCIS 2.0 dispositions with correct colors', () => {
            const dispositions = [
                { code: 'active', color: '#4CAF50' },
                { code: 'in_progress', color: '#FF9800' },
                { code: 'in_transit', color: '#2196F3' },
                { code: 'destroyed', color: '#424242' },
                { code: 'damaged', color: '#F44336' },
                { code: 'expired', color: '#9C27B0' },
                { code: 'inactive', color: '#757575' }
            ];
            
            dispositions.forEach(({ code, color }) => {
                const vars = processor.prepareStateVariables({ disposition: code });
                expect(vars.DISPOSITION_COLOR).toBe(color);
            });
        });
    });
    
    describe('getDispositionDescription', () => {
        it('should return correct descriptions for all EPCIS dispositions', () => {
            expect(processor.getDispositionDescription('active')).toBe('État opérationnel actif');
            expect(processor.getDispositionDescription('in_progress')).toBe('En cours de traitement');
            expect(processor.getDispositionDescription('destroyed')).toBe('Détruit définitivement');
            expect(processor.getDispositionDescription('damaged')).toBe('Défaillant ou endommagé');
        });
        
        it('should handle unknown dispositions', () => {
            expect(processor.getDispositionDescription('custom_state')).toBe('État non défini dans EPCIS 2.0');
            expect(processor.getDispositionDescription('')).toBe('État non défini dans EPCIS 2.0');
        });
    });
    
    describe('syncStateToTemplate', () => {
        const mockStateTemplateContent = `---
# ProcessMetaLanguage State Template
state_id: "{{STATE_ID}}"
state_name: "{{STATE_NAME}}"
disposition: "{{DISPOSITION}}"
created_at: "{{TIMESTAMP}}"
position:
  x: {{X_COORDINATE}}
  y: {{Y_COORDINATE}}
sync_status: "synchronized"
template_version: "1.0.0"
---

# État: {{STATE_NAME}}

## Description État
**État actuel:** {{STATE_NAME}}  
**Disposition EPCIS 2.0:** {{DISPOSITION}}  

## Architecture État-Actions Deux Niveaux

### 🔵 Action Principale (Automatique)
**Type:** Exposition de données  
**Nom:** {{MAIN_ACTION.name}}`;

        beforeEach(() => {
            // Mock fs.access pour indiquer que le template existe
            vi.mocked(fs.access).mockResolvedValue(undefined);
            
            // Mock fs.readFile pour retourner le contenu du template
            vi.mocked(fs.readFile).mockResolvedValue(mockStateTemplateContent);
            
            // Mock fs.mkdir pour création dossier
            vi.mocked(fs.mkdir).mockResolvedValue(undefined);
            
            // Mock fs.writeFile pour écriture fichier final
            vi.mocked(fs.writeFile).mockResolvedValue(undefined);
        });
        
        it('should synchronize state data to markdown template', async () => {
            const stateData = {
                uniqueId: 'state_789_xyz',
                stateName: 'Controle_Qualite',
                disposition: 'in_progress',
                position: { x: 200, y: 150 },
                parentObjectId: 'obj_123',
                parentObjectName: 'Lot-001',
                businessStep: 'inspecting',
                userMetadata: {
                    inspector: 'Marie.Martin',
                    checkDate: '2024-01-15'
                }
            };
            
            const outputPath = await processor.syncStateToTemplate(stateData);
            
            // Vérifier le chemin de sortie
            expect(outputPath).toBe(path.join(mockOutputDir, 'states', 'controle-qualite.md'));
            
            // Vérifier création dossier
            expect(fs.mkdir).toHaveBeenCalledWith(
                path.join(mockOutputDir, 'states'),
                { recursive: true }
            );
            
            // Vérifier écriture fichier
            expect(fs.writeFile).toHaveBeenCalled();
            const [writePath, content] = vi.mocked(fs.writeFile).mock.calls[0];
            expect(writePath).toBe(outputPath);
            expect(content).toContain('state_id: state_789_xyz');
            expect(content).toContain('state_name: Controle_Qualite');
            expect(content).toContain('disposition: in_progress');
            expect(content).toContain('# État: Controle_Qualite');
        });
        
        it('should handle state names with special characters', async () => {
            const stateData = {
                stateName: 'État en cours! (Phase #2)',
                disposition: 'active'
            };
            
            const outputPath = await processor.syncStateToTemplate(stateData);
            
            expect(outputPath).toBe(path.join(mockOutputDir, 'states', 'etat-en-cours-phase-2.md'));
        });
        
        it('should use default template name if not specified', async () => {
            const stateData = {
                stateName: 'Test_State',
                disposition: 'active'
            };
            
            await processor.syncStateToTemplate(stateData);
            
            // Vérifier que le template 'state-template' a été chargé
            expect(fs.readFile).toHaveBeenCalledWith(
                path.join(mockTemplatesDir, 'state-template.md'),
                'utf-8'
            );
        });
    });
    
    describe('Template validation for states', () => {
        it('should validate state template required fields', () => {
            const stateTemplate = {
                frontmatter: {
                    state_id: '{{STATE_ID}}',
                    state_name: '{{STATE_NAME}}',
                    disposition: '{{DISPOSITION}}',
                    created_at: '{{TIMESTAMP}}',
                    position: { x: 0, y: 0 },
                    sync_status: 'synchronized'
                },
                body: '# État: {{STATE_NAME}}\n## Description État\n## Architecture État-Actions\n## Métadonnées Techniques'
            };
            
            // Ne devrait pas lever d'erreur
            expect(() => {
                processor.validateTemplateStructure(stateTemplate, 'state-template');
            }).not.toThrow();
        });
        
        it('should throw error for missing required state fields', () => {
            const invalidTemplate = {
                frontmatter: {
                    state_name: '{{STATE_NAME}}',
                    // state_id manquant
                    disposition: '{{DISPOSITION}}'
                },
                body: '# État: {{STATE_NAME}}'
            };
            
            expect(() => {
                processor.validateTemplateStructure(invalidTemplate, 'state-template');
            }).toThrow("Champ requis 'state_id' manquant");
        });
        
        it('should warn about missing state template sections', () => {
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            
            const template = {
                frontmatter: {
                    state_id: '{{STATE_ID}}',
                    state_name: '{{STATE_NAME}}',
                    disposition: '{{DISPOSITION}}',
                    created_at: '{{TIMESTAMP}}',
                    position: { x: 0, y: 0 },
                    sync_status: 'synchronized'
                },
                body: '# État: {{STATE_NAME}}\n## Description État' // Sections manquantes
            };
            
            processor.validateTemplateStructure(template, 'state-template');
            
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Sections manquantes dans template')
            );
            
            consoleSpy.mockRestore();
        });
    });
    
    describe('prepareTemplateVariables with state type', () => {
        it('should merge common and state-specific variables', () => {
            const stateData = {
                uniqueId: 'state_456',
                stateName: 'Production',
                disposition: 'active',
                position: { x: 100, y: 200 },
                parentObjectId: 'obj_789',
                userMetadata: {
                    company: 'TestCorp',
                    avatarId: 'avatar_123'
                }
            };
            
            const variables = processor.prepareTemplateVariables(stateData, 'state');
            
            // Vérifier variables communes (depuis commonVariables)
            expect(variables.TIMESTAMP).toBeDefined();
            expect(variables.X_COORDINATE).toBe(100);
            expect(variables.Y_COORDINATE).toBe(200);
            
            // Vérifier variables spécifiques état
            expect(variables.STATE_ID).toBe('state_456');
            expect(variables.STATE_NAME).toBe('Production');
            expect(variables.DISPOSITION).toBe('active');
            expect(variables.MAIN_ACTION).toBeDefined();
            expect(variables.MAIN_ACTION.type).toBe('data_exposition');
        });
    });
});

// <!-- END OF FILE: template-processor-state.test.js -->