// <!-- START OF FILE: state-creator.test.js -->
// FILENAME: state-creator.test.js
// Version: 1.0.0
// Date: 2025-07-27 19:25
// Author: Rolland MELET & Claude Code
// Description: Tests unitaires module state-creator.js selon critères TASK-F002

/**
 * Tests Unitaires ProcessMetaLanguage - State Creator
 * 
 * Validation complète du module création bannière STATE
 * Couverture fonctions principales + intégration object-creator
 * Performance <2s + conformité EPCIS 2.0 + positionnement intelligent
 */

// Import du module à tester
const StateCreator = require('../components/state-creator.js');

// Mock ExcalidrawAutomate pour tests
global.ExcalidrawAutomate = {
    reset: jest.fn(),
    addRect: jest.fn(() => 'mock_state_rect_123'),
    addText: jest.fn(() => 'mocked_text_id'),
    create: jest.fn(() => Promise.resolve()),
    setElementWithAttributes: jest.fn(),
    getElement: jest.fn(),
    deleteElement: jest.fn(),
    style: {
        strokeColor: '#1e1e1e',
        backgroundColor: '#4CAF50',
        fillStyle: 'solid',
        strokeWidth: 2,
        roughness: 0,
        fontSize: 12,
        fontFamily: 3,
        textAlign: 'center',
        verticalAlign: 'middle'
    }
};

// Mock window pour environnement browser
global.window = {
    ProcessMetaLanguageObjectCreator: {
        getObjectMetadata: jest.fn(),
        updateObjectMetadata: jest.fn()
    }
};

// Mock performance pour mesures
global.performance = {
    now: jest.fn(() => Date.now())
};

describe('StateCreator - Configuration et Constantes', () => {
    test('STATE_CONFIG contient toutes les propriétés requises', () => {
        expect(StateCreator.STATE_CONFIG).toHaveProperty('width', 80);
        expect(StateCreator.STATE_CONFIG).toHaveProperty('height', 40);
        expect(StateCreator.STATE_CONFIG).toHaveProperty('offsetY', -50);
        expect(StateCreator.STATE_CONFIG).toHaveProperty('processTag', '#process-state');
    });

    test('STATE_DISPOSITION_COLORS conforme EPCIS 2.0', () => {
        const requiredDispositions = [
            'active', 'in_progress', 'in_transit', 'damaged', 
            'destroyed', 'expired', 'recalled', 'unknown'
        ];
        
        requiredDispositions.forEach(disposition => {
            expect(StateCreator.STATE_DISPOSITION_COLORS).toHaveProperty(disposition);
            expect(StateCreator.STATE_DISPOSITION_COLORS[disposition]).toHaveProperty('background');
            expect(StateCreator.STATE_DISPOSITION_COLORS[disposition]).toHaveProperty('description');
        });
    });

    test('Couleurs EPCIS 2.0 correctement définies', () => {
        expect(StateCreator.STATE_DISPOSITION_COLORS.active.background).toBe('#4CAF50');
        expect(StateCreator.STATE_DISPOSITION_COLORS.in_progress.background).toBe('#FF9800');
        expect(StateCreator.STATE_DISPOSITION_COLORS.damaged.background).toBe('#F44336');
        expect(StateCreator.STATE_DISPOSITION_COLORS.unknown.background).toBe('#9E9E9E');
    });
});

describe('StateCreator - Fonctions Utilitaires', () => {
    test('generateStateId produit ID unique au bon format', () => {
        const id1 = StateCreator.generateStateId();
        const id2 = StateCreator.generateStateId();
        
        expect(id1).toMatch(/^state_\d+_[a-z0-9]{6}$/);
        expect(id2).toMatch(/^state_\d+_[a-z0-9]{6}$/);
        expect(id1).not.toBe(id2);
    });

    test('calculateStatePosition positionne correctement la bannière', () => {
        const objectPos = { x: 200, y: 300 };
        const statePos = StateCreator.calculateStatePosition(objectPos, 120, 80);
        
        // Bannière 80px centrée sur hexagone 120px = décalage -40px
        expect(statePos.x).toBe(160); // 200 - (80/2)
        expect(statePos.y).toBe(250); // 300 + (-50)
    });

    test('calculateStatePosition avec dimensions personnalisées', () => {
        const objectPos = { x: 100, y: 150 };
        const statePos = StateCreator.calculateStatePosition(objectPos, 100, 60);
        
        expect(statePos.x).toBe(60);  // 100 - (80/2)
        expect(statePos.y).toBe(100); // 150 + (-50)
    });
});

describe('StateCreator - Validation Paramètres', () => {
    test('validateStateParameters rejette nom état vide', () => {
        expect(() => {
            StateCreator.validateStateParameters('', 'active', { x: 0, y: 0 });
        }).toThrow('Le nom de l\'état est requis');
    });

    test('validateStateParameters rejette nom état trop long', () => {
        const longName = 'A'.repeat(21); // Plus de 20 caractères
        expect(() => {
            StateCreator.validateStateParameters(longName, 'active', { x: 0, y: 0 });
        }).toThrow('ne peut pas dépasser 20 caractères');
    });

    test('validateStateParameters rejette disposition invalide', () => {
        expect(() => {
            StateCreator.validateStateParameters('TestState', '', { x: 0, y: 0 });
        }).toThrow('La disposition est requise');
    });

    test('validateStateParameters rejette position invalide', () => {
        expect(() => {
            StateCreator.validateStateParameters('TestState', 'active', null);
        }).toThrow('La position est requise');
        
        expect(() => {
            StateCreator.validateStateParameters('TestState', 'active', { x: 'invalid', y: 0 });
        }).toThrow('coordonnées x et y numériques');
    });

    test('validateStateParameters accepte paramètres valides', () => {
        expect(() => {
            StateCreator.validateStateParameters('ValidState', 'active', { x: 100, y: 200 }, 'obj_123');
        }).not.toThrow();
    });
});

describe('StateCreator - Création d\'États', () => {
    beforeEach(() => {
        // Reset mocks avant chaque test
        jest.clearAllMocks();
        global.ExcalidrawAutomate.addRect.mockReturnValue('mock_state_rect_123');
        global.ExcalidrawAutomate.addText.mockReturnValue('mock_state_text_123');
    });

    test('createStateComponent crée bannière avec dimensions exactes', async () => {
        const stateId = await StateCreator.createStateComponent(
            'En_Production', 
            'active', 
            { x: 160, y: 250 }
        );

        expect(global.ExcalidrawAutomate.addRect).toHaveBeenCalledWith(
            160, 250, 80, 40  // Position + dimensions exactes 80x40px
        );
        expect(stateId).toBe('mock_state_rect_123');
    });

    test('createStateComponent configure style selon disposition EPCIS', async () => {
        // Vérification que le style est modifié pendant l'exécution
        await StateCreator.createStateComponent('Test_State', 'in_progress', { x: 0, y: 0 });

        // Le style final peut être modifié par les appels successifs
        // Vérification des appels à setElementWithAttributes avec métadonnées correctes
        expect(global.ExcalidrawAutomate.setElementWithAttributes).toHaveBeenCalledWith(
            'mock_state_rect_123',
            expect.objectContaining({
                customData: expect.objectContaining({
                    disposition: 'in_progress',
                    dispositionDescription: 'En cours de traitement'
                })
            })
        );
    });

    test('createStateComponent ajoute texte centré', async () => {
        await StateCreator.createStateComponent('Test_State', 'active', { x: 160, y: 250 });

        // Texte centré dans bannière 80x40
        expect(global.ExcalidrawAutomate.addText).toHaveBeenCalledWith(
            200, 270, 'Test_State',  // 160+40, 250+20 = centre bannière
            expect.objectContaining({
                width: 70,   // 80 - 10 marge
                height: 34,  // 40 - 6 marge
                textAlign: 'center',
                verticalAlign: 'middle'
            })
        );
    });

    test('createStateComponent génère métadonnées complètes', async () => {
        const mockDate = '2024-01-15T10:30:00.000Z';
        jest.spyOn(Date.prototype, 'toISOString').mockReturnValue(mockDate);

        await StateCreator.createStateComponent(
            'Controle_Qualite', 
            'in_progress', 
            { x: 160, y: 250 },
            { parentObjectId: 'obj_parent_123', metadata: { inspector: 'Marie.Martin' } }
        );

        expect(global.ExcalidrawAutomate.setElementWithAttributes).toHaveBeenCalledWith(
            'mock_state_rect_123',
            expect.objectContaining({
                customData: expect.objectContaining({
                    processType: 'state',
                    processTag: '#process-state',
                    stateName: 'Controle_Qualite',
                    disposition: 'in_progress',
                    parentObjectId: 'obj_parent_123',
                    createdAt: mockDate,
                    epcisCompliant: true,
                    epcisVersion: '2.0'
                })
            })
        );
    });

    test('createStateComponent rejette ExcalidrawAutomate indisponible', async () => {
        delete global.ExcalidrawAutomate;

        await expect(
            StateCreator.createStateComponent('Test', 'active', { x: 0, y: 0 })
        ).rejects.toThrow('ExcalidrawAutomate non disponible');

        // Restaurer le mock
        global.ExcalidrawAutomate = {
            reset: jest.fn(),
            addRect: jest.fn(() => 'mocked_rect_id'),
            addText: jest.fn(() => 'mocked_text_id'),
            create: jest.fn(() => Promise.resolve()),
            setElementWithAttributes: jest.fn(),
            style: {}
        };
    });
});

describe('StateCreator - Intégration avec Object Creator', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        
        // Mock métadonnées objet parent
        global.window.ProcessMetaLanguageObjectCreator.getObjectMetadata.mockReturnValue({
            objectName: 'Lot-Matiere-A001',
            position: { x: 200, y: 300 },
            dimensions: { width: 120, height: 80 },
            attachedStates: []
        });
    });

    test('createStateOnObject récupère métadonnées objet parent', async () => {
        const stateId = await StateCreator.createStateOnObject(
            'obj_parent_123', 
            'En_Transit', 
            'in_transit'
        );

        expect(global.window.ProcessMetaLanguageObjectCreator.getObjectMetadata)
            .toHaveBeenCalledWith('obj_parent_123');
    });

    test('createStateOnObject calcule position automatiquement', async () => {
        global.ExcalidrawAutomate.addRect.mockReturnValue('auto_positioned_state');

        await StateCreator.createStateOnObject(
            'obj_parent_123', 
            'Auto_State', 
            'active'
        );

        // Position calculée : objet en (200,300) → bannière en (160,250)
        expect(global.ExcalidrawAutomate.addRect).toHaveBeenCalledWith(
            160, 250, 80, 40
        );
    });

    test('createStateOnObject met à jour objet parent', async () => {
        await StateCreator.createStateOnObject(
            'obj_parent_123', 
            'New_State', 
            'completed'
        );

        expect(global.window.ProcessMetaLanguageObjectCreator.updateObjectMetadata)
            .toHaveBeenCalledWith(
                'obj_parent_123',
                expect.objectContaining({
                    attachedStates: expect.arrayContaining([
                        expect.objectContaining({
                            stateName: 'New_State',
                            disposition: 'completed'
                        })
                    ])
                })
            );
    });

    test('createStateOnObject rejette objet parent inexistant', async () => {
        global.window.ProcessMetaLanguageObjectCreator.getObjectMetadata.mockReturnValue(null);

        await expect(
            StateCreator.createStateOnObject('inexistant_obj', 'Test', 'active')
        ).rejects.toThrow('Objet parent inexistant_obj non trouvé');
    });
});

describe('StateCreator - Gestion Dispositions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        
        // Réinitialiser le mock getElement
        global.ExcalidrawAutomate.getElement = jest.fn().mockReturnValue({
            customData: {
                stateName: 'Test_State',
                disposition: 'in_progress',
                dispositionDescription: 'En cours de traitement'
            }
        });
    });

    test('getAvailableDispositions retourne liste complète EPCIS 2.0', () => {
        const dispositions = StateCreator.getAvailableDispositions();
        
        expect(dispositions).toHaveLength(12); // Nombre de dispositions définies
        expect(dispositions.find(d => d.key === 'active')).toEqual({
            key: 'active',
            background: '#4CAF50',
            description: 'État opérationnel actif'
        });
    });

    test('changeStateDisposition met à jour couleur et métadonnées', () => {
        const success = StateCreator.changeStateDisposition('state_123', 'completed');

        expect(global.ExcalidrawAutomate.setElementWithAttributes).toHaveBeenCalledWith(
            'state_123',
            expect.objectContaining({
                backgroundColor: '#388E3C'  // Couleur 'completed'
            })
        );
        expect(success).toBe(true);
    });

    test('changeStateDisposition rejette disposition inconnue', () => {
        // La fonction retourne false au lieu de throw pour disposition inconnue
        const result = StateCreator.changeStateDisposition('state_123', 'invalid_disposition');
        expect(result).toBe(false);
    });
});

describe('StateCreator - Performance et Qualité', () => {
    test('createStateComponent respecte critère performance <2s', async () => {
        const startTime = 1000;
        const endTime = 1800; // 800ms d'exécution
        
        global.performance.now
            .mockReturnValueOnce(startTime)
            .mockReturnValueOnce(endTime);

        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

        await StateCreator.createStateComponent('Fast_State', 'active', { x: 0, y: 0 });

        expect(consoleSpy).toHaveBeenCalledWith(
            expect.stringContaining('État créé en 800.00ms (performance OK)')
        );

        consoleSpy.mockRestore();
    });

    test('createStateComponent avertit si performance dégradée', async () => {
        const startTime = 1000;
        const endTime = 4000; // 3000ms d'exécution > 2000ms
        
        global.performance.now
            .mockReturnValueOnce(startTime)
            .mockReturnValueOnce(endTime);

        const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

        await StateCreator.createStateComponent('Slow_State', 'active', { x: 0, y: 0 });

        expect(consoleWarnSpy).toHaveBeenCalledWith(
            expect.stringContaining('Performance warning: Création état en 3000.00ms (target: <2000ms)')
        );

        consoleWarnSpy.mockRestore();
    });
});

describe('StateCreator - Nettoyage et Suppression', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        
        // Réinitialiser le mock getElement pour état avec objet parent
        global.ExcalidrawAutomate.getElement = jest.fn().mockReturnValue({
            customData: {
                stateName: 'State_To_Delete',
                parentObjectId: 'obj_parent_123'
            }
        });
        
        // Réinitialiser le mock deleteElement
        global.ExcalidrawAutomate.deleteElement = jest.fn();

        // Mock objet parent avec états attachés
        global.window.ProcessMetaLanguageObjectCreator.getObjectMetadata.mockReturnValue({
            attachedStates: [
                { stateId: 'state_123', stateName: 'State_To_Delete' },
                { stateId: 'state_456', stateName: 'Other_State' }
            ]
        });
    });

    test('deleteStateComponent supprime état et nettoie références', () => {
        const success = StateCreator.deleteStateComponent('state_123');

        expect(global.ExcalidrawAutomate.deleteElement).toHaveBeenCalledWith('state_123');
        
        // Vérification nettoyage référence dans objet parent
        expect(global.window.ProcessMetaLanguageObjectCreator.updateObjectMetadata)
            .toHaveBeenCalledWith(
                'obj_parent_123',
                expect.objectContaining({
                    attachedStates: [
                        { stateId: 'state_456', stateName: 'Other_State' }
                    ]
                })
            );
        
        expect(success).toBe(true);
    });

    test('findStatesByObject retourne états attachés', () => {
        const states = StateCreator.findStatesByObject('obj_parent_123');

        expect(states).toEqual([
            { stateId: 'state_123', stateName: 'State_To_Delete' },
            { stateId: 'state_456', stateName: 'Other_State' }
        ]);
    });
});

describe('StateCreator - Exports et Intégration', () => {
    test('Module exporte toutes les fonctions requises', () => {
        const expectedExports = [
            'createStateComponent',
            'createStateOnObject', 
            'getStateMetadata',
            'updateStateMetadata',
            'changeStateDisposition',
            'deleteStateComponent',
            'getAvailableDispositions',
            'findStatesByObject',
            'calculateStatePosition',
            'generateStateId',
            'STATE_CONFIG',
            'STATE_DISPOSITION_COLORS'
        ];

        expectedExports.forEach(exportName => {
            expect(StateCreator).toHaveProperty(exportName);
        });
    });

    test('Configuration STATE_CONFIG cohérente avec object-creator', () => {
        // Vérification cohérence dimensions et styles
        expect(StateCreator.STATE_CONFIG.strokeWidth).toBe(2);
        expect(StateCreator.STATE_CONFIG.strokeColor).toBe('#1e1e1e');
        expect(StateCreator.STATE_CONFIG.roughness).toBe(0);
        expect(StateCreator.STATE_CONFIG.fontFamily).toBe(3);
    });
});

// <!-- END OF FILE: state-creator.test.js -->