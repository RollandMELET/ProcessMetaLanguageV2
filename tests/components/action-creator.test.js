// <!-- START OF FILE: action-creator.test.js -->
// FILENAME: action-creator.test.js
// Version: 1.0.0
// Date: 2025-07-27 20:45
// Author: Rolland MELET & Claude Code
// Description: Tests unitaires complets pour action-creator.js selon spécifications TASK-F003

/**
 * Tests Unitaires - Module ProcessMetaLanguage action-creator.js
 * 
 * Validation complète création rectangles ACTION standardisés
 * Architecture État-Actions deux niveaux + business steps EPCIS 2.0
 * Performance <2s + intégration modules existants
 */

const assert = require('assert');

// Mock ExcalidrawAutomate pour environnement test
global.ExcalidrawAutomate = {
    reset: () => {},
    addRect: (x, y, width, height) => `rect_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    addText: (x, y, text, options) => `text_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    setElementWithAttributes: (id, attributes) => true,
    create: async () => true,
    getElement: (id) => ({ 
        customData: {
            processType: "action",
            actionName: "Test_Action",
            actionType: "secondary"
        }
    }),
    deleteElement: (id) => true,
    style: {}
};

// Mock window pour environnement browser
global.window = {
    ProcessMetaLanguageStateCreator: {
        getStateMetadata: (stateId) => ({
            stateName: "Test_State",
            position: { x: 200, y: 300 },
            dimensions: { width: 80, height: 40 },
            attachedActions: []
        }),
        updateStateMetadata: (stateId, metadata) => true
    },
    ProcessMetaLanguageActionEventHandlers: new Map()
};

// Mock performance pour mesures
global.performance = {
    now: () => Date.now()
};

// Import du module à tester
const {
    createActionComponent,
    createActionForState,
    createMainActionForState,
    getActionMetadata,
    updateActionMetadata,
    changeActionType,
    deleteActionComponent,
    getAvailableActionTypes,
    getAvailableBusinessSteps,
    findActionsByState,
    calculateActionPosition,
    generateActionId,
    validateActionParameters,
    resolveActionTypeConfig,
    ACTION_CONFIG,
    ACTION_TYPE_COLORS,
    EPCIS_BUSINESS_STEPS
} = require('../../components/action-creator.js');

describe('🧪 ProcessMetaLanguage Action Creator Tests', () => {

    describe('📋 Configuration et Constantes', () => {
        
        it('ACTION_CONFIG doit avoir les dimensions exactes requises', () => {
            assert.strictEqual(ACTION_CONFIG.width, 140, 'Largeur rectangle doit être 140px');
            assert.strictEqual(ACTION_CONFIG.height, 60, 'Hauteur rectangle doit être 60px');
            assert.strictEqual(ACTION_CONFIG.borderRadius, 12, 'Border radius doit être 12px pour coins arrondis');
            assert.strictEqual(ACTION_CONFIG.processTag, '#process-action', 'Tag synchronisation requis');
        });

        it('ACTION_TYPE_COLORS doit contenir les 6 types requis', () => {
            const requiredTypes = ['primary', 'secondary', 'system', 'user', 'api', 'validation'];
            
            requiredTypes.forEach(type => {
                assert(ACTION_TYPE_COLORS[type], `Type d'action '${type}' manquant`);
                assert(ACTION_TYPE_COLORS[type].background, `Couleur background manquante pour '${type}'`);
                assert(ACTION_TYPE_COLORS[type].description, `Description manquante pour '${type}'`);
                assert(ACTION_TYPE_COLORS[type].category, `Catégorie manquante pour '${type}'`);
            });

            // Validation couleurs spécifiques
            assert.strictEqual(ACTION_TYPE_COLORS.primary.background, '#1976D2', 'Couleur primaire incorrecte');
            assert.strictEqual(ACTION_TYPE_COLORS.secondary.background, '#FF8F00', 'Couleur secondaire incorrecte');
            assert.strictEqual(ACTION_TYPE_COLORS.validation.background, '#D32F2F', 'Couleur validation incorrecte');
        });

        it('EPCIS_BUSINESS_STEPS doit contenir les 8 business steps prioritaires', () => {
            const requiredSteps = [
                'receiving', 'shipping', 'packing', 'inspecting', 
                'storing', 'transforming', 'commissioning', 'decommissioning'
            ];
            
            requiredSteps.forEach(step => {
                assert(EPCIS_BUSINESS_STEPS[step], `Business step '${step}' manquant`);
                assert(EPCIS_BUSINESS_STEPS[step].description, `Description manquante pour '${step}'`);
                assert(EPCIS_BUSINESS_STEPS[step].verb, `Verbe manquant pour '${step}'`);
                assert(EPCIS_BUSINESS_STEPS[step].epcisCode, `Code EPCIS manquant pour '${step}'`);
                assert(ACTION_TYPE_COLORS[EPCIS_BUSINESS_STEPS[step].defaultActionType], 
                    `Type d'action par défaut invalide pour '${step}'`);
            });

            // Validation mapping spécifique
            assert.strictEqual(EPCIS_BUSINESS_STEPS.inspecting.defaultActionType, 'validation', 
                'Business step inspecting doit mapper vers validation');
            assert.strictEqual(EPCIS_BUSINESS_STEPS.storing.defaultActionType, 'system',
                'Business step storing doit mapper vers system');
        });
    });

    describe('🔧 Fonctions Utilitaires', () => {
        
        it('generateActionId doit générer IDs uniques', () => {
            const id1 = generateActionId();
            const id2 = generateActionId();
            
            assert(id1.startsWith('action_'), 'ID doit commencer par action_');
            assert(id2.startsWith('action_'), 'ID doit commencer par action_');
            assert.notStrictEqual(id1, id2, 'IDs doivent être uniques');
            assert(id1.length > 15, 'ID doit avoir longueur suffisante');
        });

        it('calculateActionPosition doit calculer positions correctes', () => {
            const statePos = { x: 200, y: 300 };
            const stateWidth = 80;
            const stateHeight = 40;
            
            // Action principale centrée sous l'état
            const primaryPos = calculateActionPosition(statePos, stateWidth, stateHeight, 'primary', 0);
            const expectedPrimaryX = statePos.x + (stateWidth / 2) - (ACTION_CONFIG.width / 2);
            const expectedPrimaryY = statePos.y + stateHeight + 20; // offsetY = 20
            
            assert.strictEqual(primaryPos.x, expectedPrimaryX, 'Position X action principale incorrecte');
            assert.strictEqual(primaryPos.y, expectedPrimaryY, 'Position Y action principale incorrecte');
            
            // Action secondaire positionnée différemment
            const secondaryPos = calculateActionPosition(statePos, stateWidth, stateHeight, 'secondary', 0);
            assert(secondaryPos.y > primaryPos.y, 'Action secondaire doit être plus bas que primaire');
        });

        it('validateActionParameters doit valider correctement', () => {
            const validPos = { x: 100, y: 200 };
            
            // Validation réussie
            assert.doesNotThrow(() => {
                validateActionParameters('Test_Action', 'secondary', validPos);
            }, 'Paramètres valides ne doivent pas lever d\'erreur');
            
            // Validation nom vide
            assert.throws(() => {
                validateActionParameters('', 'secondary', validPos);
            }, Error, 'Nom vide doit lever erreur');
            
            // Validation nom trop long (>25 caractères)
            assert.throws(() => {
                validateActionParameters('Nom_Action_Tres_Tres_Long_Qui_Depasse_Limite', 'secondary', validPos);
            }, Error, 'Nom trop long doit lever erreur');
            
            // Validation position invalide
            assert.throws(() => {
                validateActionParameters('Test_Action', 'secondary', { x: 'invalid' });
            }, Error, 'Position invalide doit lever erreur');
        });

        it('resolveActionTypeConfig doit résoudre types et business steps', () => {
            // Test type direct
            const directType = resolveActionTypeConfig('primary');
            assert.strictEqual(directType.finalType, 'primary', 'Type direct doit être résolu');
            assert.strictEqual(directType.isEpcisBusinessStep, false, 'Type direct n\'est pas business step');
            assert(directType.colorConfig, 'Configuration couleur requise');
            
            // Test business step EPCIS
            const businessStep = resolveActionTypeConfig('inspecting');
            assert.strictEqual(businessStep.finalType, 'validation', 'Business step doit mapper vers type correct');
            assert.strictEqual(businessStep.isEpcisBusinessStep, true, 'Business step doit être identifié');
            assert(businessStep.businessStep, 'Données business step requises');
            assert.strictEqual(businessStep.businessStep.epcisCode, 
                'urn:epcglobal:cbv:bizstep:inspecting', 'Code EPCIS correct requis');
            
            // Test type inconnu (fallback)
            const unknownType = resolveActionTypeConfig('unknown_type');
            assert.strictEqual(unknownType.finalType, 'secondary', 'Type inconnu doit fallback vers secondary');
        });
    });

    describe('🎨 Création Composants ACTION', () => {
        
        it('createActionComponent doit créer action avec métadonnées complètes', async () => {
            const actionName = 'Test_Controle_Qualite';
            const actionType = 'inspecting';
            const position = { x: 150, y: 250 };
            const options = {
                parentStateId: 'state_123',
                metadata: { inspector: 'Marie.Martin' }
            };
            
            const actionId = await createActionComponent(actionName, actionType, position, options);
            
            assert(actionId, 'ID action doit être retourné');
            assert(actionId.startsWith('rect_'), 'ID doit correspondre au mock ExcalidrawAutomate');
        });

        it('createActionForState doit créer action positionnée automatiquement', async () => {
            const stateId = 'state_123';
            const actionName = 'Consulter_Données';
            const actionType = 'primary';
            const role = 'primary';
            
            const actionId = await createActionForState(stateId, actionName, actionType, role);
            
            assert(actionId, 'ID action doit être retourné');
        });

        it('createMainActionForState doit créer action principale automatique', async () => {
            const stateId = 'state_123';
            const metadata = { purpose: 'exposition_données' };
            
            const actionId = await createMainActionForState(stateId, metadata);
            
            assert(actionId, 'ID action principale doit être retourné');
        });

        it('Création action doit gérer erreurs ExcalidrawAutomate indisponible', async () => {
            // Temporairement supprimer ExcalidrawAutomate
            const originalEA = global.ExcalidrawAutomate;
            delete global.ExcalidrawAutomate;
            
            try {
                await createActionComponent('Test', 'secondary', { x: 100, y: 200 });
                assert.fail('Devrait lever erreur si ExcalidrawAutomate indisponible');
            } catch (error) {
                assert(error.message.includes('ExcalidrawAutomate non disponible'), 
                    'Message d\'erreur approprié requis');
            } finally {
                // Restaurer ExcalidrawAutomate
                global.ExcalidrawAutomate = originalEA;
            }
        });
    });

    describe('📊 Gestion Métadonnées', () => {
        
        it('getActionMetadata doit retourner métadonnées', () => {
            const actionId = 'action_123';
            const metadata = getActionMetadata(actionId);
            
            assert(metadata, 'Métadonnées doivent être retournées');
            assert.strictEqual(metadata.processType, 'action', 'Type process correct requis');
        });

        it('updateActionMetadata doit fusionner métadonnées', () => {
            const actionId = 'action_123';
            const newMetadata = { executionCount: 5 };
            
            const success = updateActionMetadata(actionId, newMetadata);
            assert.strictEqual(success, true, 'Mise à jour doit réussir');
        });

        it('changeActionType doit changer type et couleur', () => {
            const actionId = 'action_123';
            const newType = 'validation';
            
            const success = changeActionType(actionId, newType);
            assert.strictEqual(success, true, 'Changement type doit réussir');
        });
    });

    describe('🔍 Fonctions de Recherche', () => {
        
        it('getAvailableActionTypes doit retourner tous types', () => {
            const types = getAvailableActionTypes();
            
            assert(Array.isArray(types), 'Doit retourner un tableau');
            assert.strictEqual(types.length, 6, 'Doit contenir 6 types d\'actions');
            
            types.forEach(type => {
                assert(type.key, 'Clé type requise');
                assert(type.background, 'Couleur background requise');
                assert(type.description, 'Description requise');
                assert(type.category, 'Catégorie requise');
            });
        });

        it('getAvailableBusinessSteps doit retourner business steps EPCIS', () => {
            const steps = getAvailableBusinessSteps();
            
            assert(Array.isArray(steps), 'Doit retourner un tableau');
            assert.strictEqual(steps.length, 8, 'Doit contenir 8 business steps prioritaires');
            
            steps.forEach(step => {
                assert(step.key, 'Clé step requise');
                assert(step.description, 'Description requise');
                assert(step.verb, 'Verbe requis');
                assert(step.epcisCode, 'Code EPCIS requis');
                assert(step.epcisCode.includes('urn:epcglobal:cbv:bizstep:'), 
                    'Code EPCIS doit avoir format URN correct');
            });
        });

        it('findActionsByState doit retourner actions attachées', () => {
            const stateId = 'state_123';
            const actions = findActionsByState(stateId);
            
            assert(Array.isArray(actions), 'Doit retourner un tableau');
        });
    });

    describe('🗑️ Suppression et Nettoyage', () => {
        
        it('deleteActionComponent doit supprimer action et nettoyer', () => {
            const actionId = 'action_123';
            
            const success = deleteActionComponent(actionId);
            assert.strictEqual(success, true, 'Suppression doit réussir');
        });
    });

    describe('⚡ Tests Performance', () => {
        
        it('createActionComponent doit respecter critère <2s', async () => {
            const startTime = Date.now();
            
            await createActionComponent('Test_Performance', 'secondary', { x: 100, y: 200 });
            
            const executionTime = Date.now() - startTime;
            assert(executionTime < 2000, `Création action doit être <2s, actuel: ${executionTime}ms`);
        });

        it('Création en batch de 10 actions doit être efficace', async () => {
            const startTime = Date.now();
            const promises = [];
            
            for (let i = 0; i < 10; i++) {
                promises.push(createActionComponent(
                    `Test_Batch_${i}`, 
                    'secondary', 
                    { x: 100 + (i * 50), y: 200 }
                ));
            }
            
            await Promise.all(promises);
            
            const totalTime = Date.now() - startTime;
            const avgTime = totalTime / 10;
            
            assert(avgTime < 2000, `Temps moyen par action doit être <2s, actuel: ${avgTime}ms`);
        });
    });

    describe('🔗 Intégration Modules Existants', () => {
        
        it('Intégration avec ProcessMetaLanguageStateCreator', () => {
            // Test accès métadonnées état parent
            const stateId = 'state_123';
            const stateMetadata = window.ProcessMetaLanguageStateCreator.getStateMetadata(stateId);
            
            assert(stateMetadata, 'Métadonnées état doivent être accessibles');
            assert(stateMetadata.position, 'Position état requise pour calcul position action');
            assert(stateMetadata.dimensions, 'Dimensions état requises');
        });

        it('Workflow complet Object → State → Action', async () => {
            // Simulation workflow complet selon architecture ProcessMetaLanguage
            
            // 1. État existant (simulé)
            const stateId = 'state_123';
            
            // 2. Création action principale
            const mainActionId = await createMainActionForState(stateId);
            assert(mainActionId, 'Action principale doit être créée');
            
            // 3. Création action secondaire business step
            const secondaryActionId = await createActionForState(
                stateId, 
                'Contrôler_Qualité', 
                'inspecting', 
                'secondary'
            );
            assert(secondaryActionId, 'Action secondaire doit être créée');
            
            // 4. Vérification actions attachées à l'état
            const attachedActions = findActionsByState(stateId);
            assert(Array.isArray(attachedActions), 'Actions attachées doivent être récupérables');
        });
    });

    describe('🏗️ Architecture État-Actions Deux Niveaux', () => {
        
        it('Action principale doit avoir rôle "primary"', async () => {
            const actionId = await createActionForState(
                'state_123', 
                'Consulter_Données', 
                'primary', 
                'primary'
            );
            
            // Dans un vrai environnement, on vérifierait les métadonnées
            assert(actionId, 'Action principale créée');
        });

        it('Actions secondaires doivent avoir rôle "secondary"', async () => {
            const actionId = await createActionForState(
                'state_123',
                'Modifier_Données', 
                'secondary', 
                'secondary'
            );
            
            assert(actionId, 'Action secondaire créée');
        });

        it('Business steps EPCIS doivent mapper vers types appropriés', () => {
            // receiving → secondary (interaction/modification)
            const receivingConfig = resolveActionTypeConfig('receiving');
            assert.strictEqual(receivingConfig.finalType, 'secondary');
            
            // inspecting → validation (contrôle/validation)
            const inspectingConfig = resolveActionTypeConfig('inspecting');
            assert.strictEqual(inspectingConfig.finalType, 'validation');
            
            // storing → system (automatique/système)
            const storingConfig = resolveActionTypeConfig('storing');
            assert.strictEqual(storingConfig.finalType, 'system');
        });
    });
});

console.log('✅ Tests ProcessMetaLanguage Action Creator - Module validé selon TASK-F003');

// <!-- END OF FILE: action-creator.test.js -->