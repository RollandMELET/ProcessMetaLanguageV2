// <!-- START OF FILE: template-processor-action.test.js -->
// FILENAME: template-processor-action.test.js
// Version: 1.0.0
// Date: 2025-07-28 15:45
// Author: Rolland MELET & Claude Code
// Description: Tests unitaires pour le système de templates ACTION - TASK-B003

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import { TemplateProcessor } from '../../core/template-processor.js';

// Mock fs/promises
vi.mock('fs/promises');

describe('TemplateProcessor - Action Templates', () => {
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
    
    describe('getActionCategory', () => {
        it('should return correct categories for action types', () => {
            expect(processor.getActionCategory('main_action')).toBe('data_exposition');
            expect(processor.getActionCategory('secondary_action')).toBe('state_transition');
            expect(processor.getActionCategory('workflow_action')).toBe('transformation');
            expect(processor.getActionCategory('api_action')).toBe('data_capture');
            expect(processor.getActionCategory('validation_action')).toBe('validation');
        });
        
        it('should default to data_capture for unknown action types', () => {
            expect(processor.getActionCategory('unknown_action')).toBe('data_capture');
            expect(processor.getActionCategory('')).toBe('data_capture');
        });
    });
    
    describe('prepareActionVariables', () => {
        it('should prepare complete action variables with all required fields', () => {
            const actionData = {
                uniqueId: 'action_123_abc',
                actionName: 'Valider_Qualite',
                actionType: 'secondary_action',
                actionCategory: 'validation',
                parentStateId: 'state_456',
                parentStateName: 'En_Production',
                parentObjectId: 'obj_789',
                sourceState: 'En_Production',
                targetState: 'Qualite_Validee',
                targetDisposition: 'active',
                position: { x: 200, y: 100 },
                createdAt: '2024-01-15T10:00:00Z',
                businessStep: 'inspecting',
                inputParameters: {
                    required: [
                        {
                            name: 'inspector_id',
                            type: 'string',
                            description: 'ID de l\'inspecteur qualité',
                            validation: 'pattern: ^[A-Z][a-z]+\\.[A-Z][a-z]+$',
                            example: 'Jean.Dupont'
                        }
                    ],
                    optional: [
                        {
                            name: 'notes',
                            type: 'string',
                            description: 'Notes optionnelles',
                            default: '',
                            example: 'Contrôle standard'
                        }
                    ]
                },
                outputParameters: {
                    success: [
                        {
                            name: 'quality_score',
                            type: 'number',
                            description: 'Score qualité calculé',
                            condition: 'always',
                            format: '0-100'
                        }
                    ],
                    metadata: [
                        { name: 'validation_timestamp', description: 'Horodatage validation' }
                    ]
                },
                workflowInternal: {
                    steps: [
                        {
                            name: 'Vérification prérequis',
                            action: 'validate_prerequisites',
                            description: 'Vérifier que l\'objet est prêt',
                            condition: 'object.status === "ready"',
                            timeout: 30,
                            error_handling: 'rollback'
                        }
                    ],
                    initial_state: 'En_Production',
                    final_state: 'Qualite_Validee',
                    intermediate_states: [
                        { name: 'Validation_En_Cours', duration: 120 }
                    ],
                    rollback: {
                        supported: true,
                        strategy: 'compensating_actions',
                        compensation_actions: ['reset_validation_state']
                    }
                },
                userMetadata: {
                    operator: 'Marie.Martin',
                    avatarId: 'avatar_test_123'
                }
            };
            
            const variables = processor.prepareActionVariables(actionData);
            
            // Vérifier identifiants action
            expect(variables.ACTION_ID).toBe('action_123_abc');
            expect(variables.ACTION_NAME).toBe('Valider_Qualite');
            expect(variables.ACTION_TYPE).toBe('secondary_action');
            expect(variables.ACTION_CATEGORY).toBe('validation');
            expect(variables.ACTION_COLOR).toBe('#FF9800');
            
            // Vérifier relations
            expect(variables.PARENT_STATE_ID).toBe('state_456');
            expect(variables.PARENT_STATE_NAME).toBe('En_Production');
            expect(variables.PARENT_OBJECT_ID).toBe('obj_789');
            
            // Vérifier transitions
            expect(variables.SOURCE_STATE).toBe('En_Production');
            expect(variables.TARGET_STATE).toBe('Qualite_Validee');
            expect(variables.TARGET_DISPOSITION).toBe('active');
            
            // Vérifier position
            expect(variables.X_COORDINATE).toBe(200);
            expect(variables.Y_COORDINATE).toBe(100);
            expect(variables.DIMENSIONS_WIDTH).toBe(140);
            expect(variables.DIMENSIONS_HEIGHT).toBe(60);
            
            // Vérifier EPCIS
            expect(variables.BUSINESS_STEP).toBe('inspecting');
            expect(variables.BUSINESS_LOCATION).toContain('urn:epc:id:sgln:');
            expect(variables.EPCIS_ACTION_TYPE).toBe('observe');
            
            // Vérifier paramètres (JSON serialisés)
            const inputParams = JSON.parse(variables.INPUT_PARAMETERS);
            expect(inputParams.required).toHaveLength(1);
            expect(inputParams.required[0].name).toBe('inspector_id');
            expect(inputParams.optional).toHaveLength(1);
            expect(inputParams.optional[0].name).toBe('notes');
            
            const outputParams = JSON.parse(variables.OUTPUT_PARAMETERS);
            expect(outputParams.success).toHaveLength(1);
            expect(outputParams.success[0].name).toBe('quality_score');
            
            const workflow = JSON.parse(variables.WORKFLOW_INTERNAL);
            expect(workflow.steps).toHaveLength(1);
            expect(workflow.steps[0].name).toBe('Vérification prérequis');
            expect(workflow.rollback.supported).toBe(true);
            
            // Vérifier 360SmartConnect
            expect(variables.AVATAR_ID).toBe('avatar_test_123');
            expect(variables.OPERATOR).toBe('Marie.Martin');
        });
        
        it('should handle missing optional fields with defaults', () => {
            const minimalActionData = {
                actionName: 'Action_Test',
                actionType: 'workflow_action'
            };
            
            const variables = processor.prepareActionVariables(minimalActionData);
            
            expect(variables.ACTION_ID).toBe('unknown');
            expect(variables.ACTION_NAME).toBe('Action_Test');
            expect(variables.ACTION_TYPE).toBe('workflow_action');
            expect(variables.ACTION_CATEGORY).toBe('transformation');
            expect(variables.ACTION_COLOR).toBe('#4CAF50');
            expect(variables.PARENT_STATE_ID).toBeNull();
            expect(variables.SOURCE_STATE).toBe('Current State');
            expect(variables.TARGET_STATE).toBe('Next State');
            expect(variables.X_COORDINATE).toBe(0);
            expect(variables.Y_COORDINATE).toBe(0);
            expect(variables.BUSINESS_STEP).toBe('observing');
            expect(variables.OPERATOR).toBe('System');
            
            // Vérifier structures par défaut
            const inputParams = JSON.parse(variables.INPUT_PARAMETERS);
            expect(inputParams.required).toEqual([]);
            expect(inputParams.optional).toEqual([]);
            
            const workflow = JSON.parse(variables.WORKFLOW_INTERNAL);
            expect(workflow.steps).toEqual([]);
            expect(workflow.initial_state).toBe('current');
            expect(workflow.final_state).toBe('next');
        });
        
        it('should handle all action types with correct colors', () => {
            const actionTypes = [
                { type: 'main_action', color: '#2196F3' },
                { type: 'secondary_action', color: '#FF9800' },
                { type: 'workflow_action', color: '#4CAF50' },
                { type: 'api_action', color: '#9C27B0' },
                { type: 'validation_action', color: '#F44336' },
                { type: 'transformation_action', color: '#607D8B' }
            ];
            
            actionTypes.forEach(({ type, color }) => {
                const vars = processor.prepareActionVariables({ actionType: type });
                expect(vars.ACTION_COLOR).toBe(color);
            });
        });
    });
    
    describe('syncActionToTemplate', () => {
        const mockActionTemplateContent = `---
# ProcessMetaLanguage Action Template
action_id: "{{ACTION_ID}}"
action_name: "{{ACTION_NAME}}"
action_type: "{{ACTION_TYPE}}"
created_at: "{{TIMESTAMP}}"
position:
  x: {{X_COORDINATE}}
  y: {{Y_COORDINATE}}
sync_status: "synchronized"
template_version: "1.0.0"
---

# Action: {{ACTION_NAME}}

## Description Action
**Nom:** {{ACTION_NAME}}  
**Type:** {{ACTION_TYPE}} ({{ACTION_CATEGORY}})  

## Paramètres d'Entrée
{{INPUT_PARAMETERS}}

## Workflow Interne  
{{WORKFLOW_INTERNAL}}`;

        beforeEach(() => {
            // Mock fs.access pour indiquer que le template existe
            vi.mocked(fs.access).mockResolvedValue(undefined);
            
            // Mock fs.readFile pour retourner le contenu du template
            vi.mocked(fs.readFile).mockResolvedValue(mockActionTemplateContent);
            
            // Mock fs.mkdir pour création dossier
            vi.mocked(fs.mkdir).mockResolvedValue(undefined);
            
            // Mock fs.writeFile pour écriture fichier final
            vi.mocked(fs.writeFile).mockResolvedValue(undefined);
        });
        
        it('should synchronize action data to markdown template', async () => {
            const actionData = {
                uniqueId: 'action_456_xyz',
                actionName: 'Expedier_Colis',
                actionType: 'secondary_action',
                position: { x: 300, y: 200 },
                sourceState: 'Pret_Expedition',
                targetState: 'Expedie',
                businessStep: 'shipping',
                inputParameters: {
                    required: [
                        {
                            name: 'destination',
                            type: 'string',
                            description: 'Adresse de livraison'
                        }
                    ]
                },
                userMetadata: {
                    transporter: 'DHL',
                    priority: 'standard'
                }
            };
            
            const outputPath = await processor.syncActionToTemplate(actionData);
            
            // Vérifier le chemin de sortie
            expect(outputPath).toBe(path.join(mockOutputDir, 'actions', 'expedier-colis.md'));
            
            // Vérifier création dossier
            expect(fs.mkdir).toHaveBeenCalledWith(
                path.join(mockOutputDir, 'actions'),
                { recursive: true }
            );
            
            // Vérifier écriture fichier
            expect(fs.writeFile).toHaveBeenCalled();
            const [writePath, content] = vi.mocked(fs.writeFile).mock.calls[0];
            expect(writePath).toBe(outputPath);
            expect(content).toContain('action_id: action_456_xyz');
            expect(content).toContain('action_name: Expedier_Colis');
            expect(content).toContain('action_type: secondary_action');
            expect(content).toContain('# Action: Expedier_Colis');
        });
        
        it('should handle action names with special characters', async () => {
            const actionData = {
                actionName: 'Contrôle Qualité! (Phase #1)',
                actionType: 'validation_action'
            };
            
            const outputPath = await processor.syncActionToTemplate(actionData);
            
            expect(outputPath).toBe(path.join(mockOutputDir, 'actions', 'controle-qualite-phase-1.md'));
        });
        
        it('should use default template name if not specified', async () => {
            const actionData = {
                actionName: 'Test_Action',
                actionType: 'workflow_action'
            };
            
            await processor.syncActionToTemplate(actionData);
            
            // Vérifier que le template 'action-template' a été chargé
            expect(fs.readFile).toHaveBeenCalledWith(
                path.join(mockTemplatesDir, 'action-template.md'),
                'utf-8'
            );
        });
        
        it('should handle complex workflow parameters', async () => {
            const actionData = {
                actionName: 'Complex_Workflow',
                actionType: 'workflow_action',
                workflowInternal: {
                    steps: [
                        {
                            name: 'Step 1',
                            action: 'validate',
                            timeout: 30
                        },
                        {
                            name: 'Step 2', 
                            action: 'process',
                            timeout: 60
                        }
                    ],
                    rollback: {
                        supported: true,
                        strategy: 'compensating_actions'
                    }
                }
            };
            
            await processor.syncActionToTemplate(actionData);
            
            const [, content] = vi.mocked(fs.writeFile).mock.calls[0];
            expect(content).toContain('"steps"');
            expect(content).toContain('"rollback"');
            expect(content).toContain('Step 1');
            expect(content).toContain('Step 2');
        });
    });
    
    describe('Template validation for actions', () => {
        it('should validate action template required fields', () => {
            const actionTemplate = {
                frontmatter: {
                    action_id: '{{ACTION_ID}}',
                    action_name: '{{ACTION_NAME}}',
                    action_type: '{{ACTION_TYPE}}',
                    created_at: '{{TIMESTAMP}}',
                    position: { x: 0, y: 0 },
                    sync_status: 'synchronized'
                },
                body: '# Action: {{ACTION_NAME}}\n## Description Action\n## Paramètres d\'Entrée\n## Workflow Interne'
            };
            
            // Ne devrait pas lever d'erreur
            expect(() => {
                processor.validateTemplateStructure(actionTemplate, 'action-template');
            }).not.toThrow();
        });
        
        it('should throw error for missing required action fields', () => {
            const invalidTemplate = {
                frontmatter: {
                    action_name: '{{ACTION_NAME}}',
                    // action_id manquant
                    action_type: '{{ACTION_TYPE}}'
                },
                body: '# Action: {{ACTION_NAME}}'
            };
            
            expect(() => {
                processor.validateTemplateStructure(invalidTemplate, 'action-template');
            }).toThrow("Champ requis 'action_id' manquant");
        });
        
        it('should warn about missing action template sections', () => {
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            
            const template = {
                frontmatter: {
                    action_id: '{{ACTION_ID}}',
                    action_name: '{{ACTION_NAME}}',
                    action_type: '{{ACTION_TYPE}}',
                    created_at: '{{TIMESTAMP}}',
                    position: { x: 0, y: 0 },
                    sync_status: 'synchronized'
                },
                body: '# Action: {{ACTION_NAME}}\n## Description Action' // Sections manquantes
            };
            
            processor.validateTemplateStructure(template, 'action-template');
            
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Sections manquantes dans template')
            );
            
            consoleSpy.mockRestore();
        });
    });
    
    describe('prepareTemplateVariables with action type', () => {
        it('should merge common and action-specific variables', () => {
            const actionData = {
                uniqueId: 'action_789',
                actionName: 'Process_Data',
                actionType: 'workflow_action',
                position: { x: 150, y: 250 },
                sourceState: 'Ready',
                targetState: 'Processed',
                userMetadata: {
                    company: 'TestCorp',
                    avatarId: 'avatar_456'
                }
            };
            
            const variables = processor.prepareTemplateVariables(actionData, 'action');
            
            // Vérifier variables communes (depuis commonVariables)
            expect(variables.TIMESTAMP).toBeDefined();
            expect(variables.X_COORDINATE).toBe(150);
            expect(variables.Y_COORDINATE).toBe(250);
            
            // Vérifier variables spécifiques action
            expect(variables.ACTION_ID).toBe('action_789');
            expect(variables.ACTION_NAME).toBe('Process_Data');
            expect(variables.ACTION_TYPE).toBe('workflow_action');
            expect(variables.SOURCE_STATE).toBe('Ready');
            expect(variables.TARGET_STATE).toBe('Processed');
            expect(variables.INPUT_PARAMETERS).toBeDefined();
            expect(variables.WORKFLOW_INTERNAL).toBeDefined();
        });
    });
    
    describe('Error handling', () => {
        it('should handle file system errors gracefully', async () => {
            vi.mocked(fs.readFile).mockRejectedValue(new Error('File not found'));
            
            const actionData = {
                actionName: 'Test_Action',
                actionType: 'secondary_action'
            };
            
            await expect(processor.syncActionToTemplate(actionData)).rejects.toThrow();
        });
        
        it('should handle invalid JSON in workflow parameters', () => {
            const actionData = {
                actionName: 'Invalid_Workflow',
                workflowInternal: 'invalid-json-string'
            };
            
            // Devrait gérer gracieusement les données invalides
            const variables = processor.prepareActionVariables(actionData);
            expect(variables.WORKFLOW_INTERNAL).toBeDefined();
        });
    });
});

// <!-- END OF FILE: template-processor-action.test.js -->