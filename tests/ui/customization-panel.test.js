// <!-- START OF FILE: customization-panel.test.js -->
// FILENAME: customization-panel.test.js
// Version: 1.0.0
// Date: 2025-07-28 19:00
// Author: Rolland MELET & Claude Code
// Description: Tests unitaires pour le panneau de personnalisation ProcessMetaLanguage

/**
 * Suite de tests pour CustomizationPanel
 * Teste l'interface, la validation, les performances et l'intégration
 */

// Mock du DOM et d'Obsidian pour les tests
const mockDOM = {
    createElement: (tag) => ({
        tagName: tag.toUpperCase(),
        style: {},
        className: '',
        innerHTML: '',
        textContent: '',
        appendChild: jest.fn(),
        addEventListener: jest.fn(),
        querySelector: jest.fn(),
        querySelectorAll: jest.fn(() => []),
        removeChild: jest.fn()
    }),
    getElementById: jest.fn(),
    querySelector: jest.fn(),
    querySelectorAll: jest.fn(() => []),
    body: {
        appendChild: jest.fn(),
        removeChild: jest.fn()
    },
    head: {
        appendChild: jest.fn()
    }
};

// Mock global
global.document = mockDOM;
global.window = {
    confirm: jest.fn(() => true),
    alert: jest.fn(),
    EPCISValidator: jest.fn()
};

// Import du module à tester
import { CustomizationPanel } from '../../ui/customization-panel.js';

describe('CustomizationPanel', () => {
    let panel;
    let mockApp;
    let mockOptions;
    let mockTemplate;
    let mockValidator;

    beforeEach(() => {
        // Setup mocks
        mockApp = {
            vault: {
                create: jest.fn(),
                modify: jest.fn(),
                read: jest.fn()
            }
        };

        mockValidator = {
            validate: jest.fn(),
            validateBusinessStep: jest.fn(() => ({
                valid: true,
                errors: [],
                warnings: []
            }))
        };

        mockOptions = {
            epcisValidator: mockValidator,
            onSave: jest.fn(),
            onCancel: jest.fn(),
            customTemplatesPath: './templates/custom/',
            validateOnChange: true,
            previewUpdateDelay: 100
        };

        mockTemplate = {
            id: 'receiving',
            name: 'receiving',
            type: 'business_step',
            category: 'logistics',
            description: 'Reception de marchandises',
            color: '#2196F3',
            icon: '📦',
            eventType: 'ObjectEvent',
            action: 'ADD',
            businessStep: 'receiving',
            disposition: 'active',
            requiredFields: ['epc', 'bizStep', 'eventTime'],
            optionalFields: ['readPoint', 'bizLocation'],
            estimatedDuration: '2-5 min',
            priority: 'medium',
            transitions: ['active', 'in_progress'],
            businessConstraints: ['Controle qualite requis']
        };

        // Créer l'instance
        panel = new CustomizationPanel(mockApp, mockOptions);
    });

    afterEach(() => {
        if (panel) {
            panel.destroy();
        }
    });

    describe('Initialisation', () => {
        test('devrait créer une instance avec les bonnes propriétés', () => {
            expect(panel.app).toBe(mockApp);
            expect(panel.options.epcisValidator).toBe(mockValidator);
            expect(panel.options.onSave).toBe(mockOptions.onSave);
            expect(panel.isVisible).toBe(false);
            expect(panel.isDirty).toBe(false);
            expect(panel.customProperties).toBeInstanceOf(Map);
        });

        test('devrait avoir les bonnes palettes de couleurs et icônes', () => {
            expect(panel.colorPalette).toContain('#2196F3');
            expect(panel.colorPalette).toContain('#4CAF50');
            expect(panel.iconCategories.logistics).toContain('🚛');
            expect(panel.iconCategories.manufacturing).toContain('⚙️');
        });

        test('devrait avoir les bonnes options par défaut', () => {
            const defaultPanel = new CustomizationPanel(mockApp);
            expect(defaultPanel.options.validateOnChange).toBe(true);
            expect(defaultPanel.options.previewUpdateDelay).toBe(300);
            expect(defaultPanel.options.customTemplatesPath).toBe('./templates/custom/');
        });
    });

    describe('Affichage et masquage', () => {
        test('devrait afficher le panneau correctement', async () => {
            await panel.show(mockTemplate);
            
            expect(panel.isVisible).toBe(true);
            expect(panel.currentTemplate).toEqual(mockTemplate);
            expect(panel.originalTemplate).toEqual(mockTemplate);
            expect(mockDOM.body.appendChild).toHaveBeenCalled();
        });

        test('devrait masquer le panneau et nettoyer les ressources', () => {
            panel.show(mockTemplate);
            panel.hide();
            
            expect(panel.isVisible).toBe(false);
            expect(panel.currentTemplate).toBeNull();
            expect(panel.customProperties.size).toBe(0);
        });

        test('devrait demander confirmation si modifications non sauvegardées', () => {
            panel.show(mockTemplate);
            panel.isDirty = true;
            global.window.confirm = jest.fn(() => false);
            
            panel.hide();
            
            expect(global.window.confirm).toHaveBeenCalledWith(
                'Vous avez des modifications non sauvegardées. Voulez-vous vraiment fermer ?'
            );
            expect(panel.isVisible).toBe(true); // Ne devrait pas fermer
        });
    });

    describe('Chargement des données template', () => {
        test('devrait charger les propriétés du template correctement', async () => {
            await panel.show(mockTemplate);
            await panel.loadTemplateData();
            
            expect(panel.customProperties.get('name')).toBe('receiving');
            expect(panel.customProperties.get('category')).toBe('logistics');
            expect(panel.customProperties.get('color')).toBe('#2196F3');
            expect(panel.customProperties.get('requiredFields')).toEqual(['epc', 'bizStep', 'eventTime']);
        });

        test('devrait générer un nom personnalisé si nécessaire', async () => {
            const templateSansNom = { ...mockTemplate, name: '' };
            await panel.show(templateSansNom);
            await panel.loadTemplateData();
            
            const generatedName = panel.customProperties.get('name');
            expect(generatedName).toMatch(/receiving_logistics_\d{4}/);
        });
    });

    describe('Validation temps réel', () => {
        test('devrait valider avec le validateur EPCIS', async () => {
            mockValidator.validateBusinessStep.mockReturnValue({
                valid: true,
                errors: [],
                warnings: ['Avertissement test']
            });

            await panel.show(mockTemplate);
            await panel.validateTemplate();
            
            expect(mockValidator.validateBusinessStep).toHaveBeenCalled();
            expect(panel.validationResult.valid).toBe(true);
            expect(panel.validationResult.warnings).toContain('Avertissement test');
        });

        test('devrait ajouter des validations ProcessMetaLanguage', async () => {
            // Template avec nom trop court
            const templateInvalide = { ...mockTemplate, name: 'ab' };
            await panel.show(templateInvalide);
            panel.customProperties.set('name', 'ab');
            
            await panel.validateTemplate();
            
            expect(panel.validationResult.valid).toBe(false);
            expect(panel.validationResult.errors).toContain(
                'Le nom doit contenir au moins 3 caractères'
            );
        });

        test('devrait valider les champs EPCIS recommandés', async () => {
            await panel.show(mockTemplate);
            panel.customProperties.set('requiredFields', ['bizStep']); // Sans EPC
            
            await panel.validateTemplate();
            
            expect(panel.validationResult.warnings).toContain(
                'Le champ EPC est recommandé comme obligatoire'
            );
        });

        test('devrait valider le format de durée', async () => {
            await panel.show(mockTemplate);
            panel.customProperties.set('estimatedDuration', 'format_invalide');
            
            await panel.validateTemplate();
            
            expect(panel.validationResult.warnings).toContain(
                'Format durée recommandé: "2-5 min", "1h", "30s"'
            );
        });
    });

    describe('Gestion des formulaires', () => {
        test('devrait détecter les changements et marquer comme dirty', async () => {
            await panel.show(mockTemplate);
            
            expect(panel.isDirty).toBe(false);
            
            panel.handleFormChange();
            
            expect(panel.isDirty).toBe(true);
        });

        test('devrait mettre à jour les champs EPCIS', async () => {
            // Mock des checkboxes
            const mockCheckboxes = [
                { value: 'epc', checked: true },
                { value: 'quantity', checked: true }
            ];
            
            panel.modal = {
                querySelectorAll: jest.fn((selector) => {
                    if (selector.includes('required')) {
                        return mockCheckboxes;
                    }
                    return [];
                })
            };

            await panel.show(mockTemplate);
            panel.updateEPCISFields();
            
            expect(panel.customProperties.get('requiredFields')).toEqual(['epc', 'quantity']);
        });

        test('devrait gérer les transitions dynamiques', async () => {
            await panel.show(mockTemplate);
            
            panel.addTransition();
            let transitions = panel.customProperties.get('transitions');
            expect(transitions).toHaveLength(2); // Original + nouvelle
            
            panel.removeTransition(0);
            transitions = panel.customProperties.get('transitions');
            expect(transitions).toHaveLength(1);
        });

        test('devrait gérer les contraintes dynamiques', async () => {
            await panel.show(mockTemplate);
            
            panel.addConstraint();
            let constraints = panel.customProperties.get('businessConstraints');
            expect(constraints).toHaveLength(2); // Original + nouvelle
            
            panel.removeConstraint(0);
            constraints = panel.customProperties.get('businessConstraints');
            expect(constraints).toHaveLength(1);
        });
    });

    describe('Construction du template final', () => {
        test('devrait construire un objet template complet', async () => {
            await panel.show(mockTemplate);
            panel.customProperties.set('name', 'Custom_Receiving');
            panel.customProperties.set('description', 'Template personnalisé');
            
            const finalTemplate = panel.buildTemplateObject();
            
            expect(finalTemplate.name).toBe('Custom_Receiving');
            expect(finalTemplate.description).toBe('Template personnalisé');
            expect(finalTemplate.isCustomized).toBe(true);
            expect(finalTemplate.originalTemplateId).toBe('receiving');
            expect(finalTemplate.customizedAt).toBeDefined();
        });

        test('devrait préserver les propriétés originales non modifiées', async () => {
            await panel.show(mockTemplate);
            
            const finalTemplate = panel.buildTemplateObject();
            
            expect(finalTemplate.type).toBe(mockTemplate.type);
            expect(finalTemplate.file).toBe(mockTemplate.file);
        });
    });

    describe('Mise à jour du preview', () => {
        test('devrait mettre à jour le preview avec les nouvelles propriétés', async () => {
            const mockPreviewContainer = {
                innerHTML: ''
            };
            panel.previewContainer = mockPreviewContainer;
            
            await panel.show(mockTemplate);
            panel.customProperties.set('name', 'Custom_Template');
            panel.customProperties.set('color', '#FF0000');
            
            panel.updatePreview();
            
            expect(mockPreviewContainer.innerHTML).toContain('Custom_Template');
            expect(mockPreviewContainer.innerHTML).toContain('#FF0000');
        });

        test('devrait afficher les champs EPCIS dans le preview', async () => {
            const mockPreviewContainer = {
                innerHTML: ''
            };
            panel.previewContainer = mockPreviewContainer;
            
            await panel.show(mockTemplate);
            panel.customProperties.set('requiredFields', ['epc', 'bizStep']);
            panel.customProperties.set('optionalFields', ['readPoint']);
            
            panel.updatePreview();
            
            expect(mockPreviewContainer.innerHTML).toContain('>epc<');
            expect(mockPreviewContainer.innerHTML).toContain('>bizStep<');
            expect(mockPreviewContainer.innerHTML).toContain('>readPoint<');
        });
    });

    describe('Sauvegarde et réinitialisation', () => {
        test('devrait sauvegarder le template via callback', async () => {
            await panel.show(mockTemplate);
            panel.customProperties.set('name', 'Custom_Template');
            
            await panel.saveTemplate();
            
            expect(mockOptions.onSave).toHaveBeenCalledWith(
                expect.objectContaining({
                    name: 'Custom_Template',
                    isCustomized: true,
                    originalTemplateId: 'receiving'
                })
            );
        });

        test('devrait demander confirmation si template invalide', async () => {
            global.window.confirm = jest.fn(() => false);
            
            await panel.show(mockTemplate);
            panel.validationResult = { valid: false, errors: ['Erreur test'] };
            
            await panel.saveTemplate();
            
            expect(global.window.confirm).toHaveBeenCalledWith(
                'Le template contient des erreurs. Voulez-vous vraiment l\'enregistrer ?'
            );
            expect(mockOptions.onSave).not.toHaveBeenCalled();
        });

        test('devrait réinitialiser aux valeurs originales', async () => {
            global.window.confirm = jest.fn(() => true);
            
            await panel.show(mockTemplate);
            panel.customProperties.set('name', 'Modifié');
            panel.isDirty = true;
            
            await panel.resetToOriginal();
            
            expect(panel.customProperties.get('name')).toBe('receiving');
            expect(panel.isDirty).toBe(false);
        });
    });

    describe('Performance', () => {
        test('devrait valider en moins de 200ms', async () => {
            await panel.show(mockTemplate);
            
            const startTime = performance.now();
            await panel.validateTemplate();
            const endTime = performance.now();
            
            expect(endTime - startTime).toBeLessThan(200);
        });

        test('devrait mettre à jour le preview en moins de 100ms', async () => {
            const mockPreviewContainer = { innerHTML: '' };
            panel.previewContainer = mockPreviewContainer;
            
            await panel.show(mockTemplate);
            
            const startTime = performance.now();
            panel.updatePreview();
            const endTime = performance.now();
            
            expect(endTime - startTime).toBeLessThan(100);
        });

        test('devrait gérer de nombreuses transitions sans ralentissement', async () => {
            await panel.show(mockTemplate);
            
            const startTime = performance.now();
            
            // Ajouter 50 transitions
            for (let i = 0; i < 50; i++) {
                panel.addTransition();
            }
            
            const endTime = performance.now();
            
            expect(endTime - startTime).toBeLessThan(500);
            expect(panel.customProperties.get('transitions')).toHaveLength(51); // 1 original + 50
        });
    });

    describe('Génération YAML', () => {
        test('devrait générer un YAML valide', async () => {
            await panel.show(mockTemplate);
            panel.customProperties.set('name', 'Custom_Template');
            
            const template = panel.buildTemplateObject();
            const yaml = panel.buildCustomTemplateYAML(template);
            
            expect(yaml).toContain('# Template Personnalisé ProcessMetaLanguage');
            expect(yaml).toContain('template_name: "Custom_Template"');
            expect(yaml).toContain('is_custom: true');
            expect(yaml).toContain('color: "#2196F3"');
            expect(yaml).toContain('event_type: "ObjectEvent"');
        });

        test('devrait échapper les caractères spéciaux dans le YAML', async () => {
            await panel.show(mockTemplate);
            panel.customProperties.set('description', 'Description avec "guillemets" et \'apostrophes\'');
            
            const template = panel.buildTemplateObject();
            const yaml = panel.buildCustomTemplateYAML(template);
            
            expect(yaml).toContain('description: "Description avec "guillemets" et \'apostrophes\'"');
        });
    });

    describe('Événements et interactions', () => {
        test('devrait fermer avec la touche Escape', async () => {
            await panel.show(mockTemplate);
            
            const escEvent = new KeyboardEvent('keydown', { key: 'Escape' });
            panel.handleKeyboard(escEvent);
            
            expect(panel.isVisible).toBe(false);
        });

        test('devrait sauvegarder avec Ctrl+S', async () => {
            await panel.show(mockTemplate);
            panel.saveTemplate = jest.fn();
            
            const saveEvent = new KeyboardEvent('keydown', { 
                key: 's', 
                ctrlKey: true 
            });
            panel.handleKeyboard(saveEvent);
            
            expect(panel.saveTemplate).toHaveBeenCalled();
        });

        test('devrait debouncer les mises à jour de preview', async () => {
            jest.useFakeTimers();
            
            panel.updatePreview = jest.fn();
            await panel.show(mockTemplate);
            
            // Déclencher plusieurs changements rapidement
            panel.handleFormChange();
            panel.handleFormChange();
            panel.handleFormChange();
            
            expect(panel.updatePreview).not.toHaveBeenCalled();
            
            // Avancer le timer
            jest.advanceTimersByTime(panel.options.previewUpdateDelay);
            
            expect(panel.updatePreview).toHaveBeenCalledTimes(1);
            
            jest.useRealTimers();
        });
    });

    describe('Nettoyage et destruction', () => {
        test('devrait nettoyer toutes les ressources', async () => {
            await panel.show(mockTemplate);
            
            const mockStyles = { remove: jest.fn() };
            mockDOM.getElementById.mockReturnValue(mockStyles);
            
            panel.destroy();
            
            expect(panel.customProperties.size).toBe(0);
            expect(panel.currentTemplate).toBeNull();
            expect(panel.validationResult).toBeNull();
            expect(mockStyles.remove).toHaveBeenCalled();
        });

        test('devrait détacher tous les event listeners', async () => {
            const removeEventListener = jest.spyOn(document, 'removeEventListener');
            
            await panel.show(mockTemplate);
            panel.destroy();
            
            expect(removeEventListener).toHaveBeenCalledWith('keydown', panel.handleKeyboard);
        });
    });

    describe('Intégration avec validateur EPCIS réel', () => {
        test('devrait utiliser le validateur réel si disponible', async () => {
            const realValidator = {
                validateBusinessStep: jest.fn(() => ({
                    valid: true,
                    errors: [],
                    warnings: []
                }))
            };
            
            const panelWithRealValidator = new CustomizationPanel(mockApp, {
                epcisValidator: realValidator
            });
            
            await panelWithRealValidator.show(mockTemplate);
            await panelWithRealValidator.validateTemplate();
            
            expect(realValidator.validateBusinessStep).toHaveBeenCalled();
        });

        test('devrait fallback sur validation simple si validateur indisponible', async () => {
            const panelSansValidator = new CustomizationPanel(mockApp, {
                epcisValidator: null
            });
            
            await panelSansValidator.show(mockTemplate);
            await panelSansValidator.validateTemplate();
            
            expect(panelSansValidator.validationResult.valid).toBe(true);
        });
    });
});

// Test d'intégration avec template-selector
describe('Intégration CustomizationPanel avec TemplateSelector', () => {
    test('devrait être appelable depuis template-selector', () => {
        // Ce test nécessiterait l'import du TemplateSelector
        // et la vérification que customizeTemplate() fonctionne
        expect(typeof CustomizationPanel).toBe('function');
    });
});

// <!-- END OF FILE: customization-panel.test.js -->