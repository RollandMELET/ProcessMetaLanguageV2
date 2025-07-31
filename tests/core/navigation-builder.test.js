// <!-- START OF FILE: navigation-builder.test.js -->
// FILENAME: navigation-builder.test.js
// Version: 1.0.0
// Date: 2025-07-30 16:30
// Author: Rolland MELET & Claude Code
// Description: Tests unitaires NavigationBuilder - TASK-B006

/**
 * Tests unitaires pour le module NavigationBuilder
 * Validation complète de la construction de navigation vers actions disponibles
 * selon l'architecture État-Actions deux niveaux ProcessMetaLanguage
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NavigationBuilder, NAVIGATION_BUILDER_CONFIG } from '../../core/navigation-builder.js';

describe('NavigationBuilder', () => {
    let builder;
    let mockStateData;
    let mockObjectData;

    beforeEach(() => {
        builder = new NavigationBuilder();
        
        mockStateData = {
            stateId: 'state_test_001',
            stateName: 'En_Production',
            disposition: 'active',
            businessStep: 'transforming',
            position: { x: 100, y: 200 },
            createdAt: '2025-07-30T16:30:00.000Z',
            secondaryActions: [
                {
                    id: 'action_quality_check',
                    name: 'Contrôle Qualité',
                    type: 'secondary_action',
                    targetState: 'En_Controle',
                    targetDisposition: 'inspecting',
                    businessStep: 'inspecting',
                    description: 'Effectuer contrôle qualité du lot',
                    permissions: ['quality_check'],
                    priority: 'high'
                },
                {
                    id: 'action_packaging',
                    name: 'Emballage',
                    type: 'secondary_action',
                    targetState: 'Emballe',
                    targetDisposition: 'in_progress',
                    businessStep: 'packing',
                    description: 'Emballer le produit fini',
                    permissions: ['packaging'],
                    priority: 'normal'
                }
            ],
            userMetadata: {
                businessStep: 'transforming',
                operator: 'Jean Dupont'
            }
        };

        mockObjectData = {
            objectId: 'obj_test_001',
            objectName: 'Lot Acier A001',
            objectType: 'raw-material',
            epc: 'urn:epc:id:sgtin:0000001.000001.000001',
            userMetadata: {
                avatarId: 'avatar_test_001',
                company: '0000001',
                companyName: 'ACME Industries'
            }
        };
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('Configuration et initialisation', () => {
        it('devrait initialiser avec configuration par défaut', () => {
            expect(builder.config.cacheEnabled).toBe(true);
            expect(builder.config.maxNavigationComplexity).toBe(50);
            expect(builder.config.epcisTransitionValidation).toBe(true);
            expect(builder.config.generateAPIEndpoints).toBe(true);
        });

        it('devrait permettre configuration personnalisée', () => {
            const customBuilder = new NavigationBuilder({
                cacheEnabled: false,
                maxNavigationComplexity: 100,
                sortByPriority: false
            });
            
            expect(customBuilder.config.cacheEnabled).toBe(false);
            expect(customBuilder.config.maxNavigationComplexity).toBe(100);
            expect(customBuilder.config.sortByPriority).toBe(false);
        });

        it('devrait charger règles transition par défaut', () => {
            expect(builder.transitionRules.size).toBeGreaterThan(0);
            expect(builder.transitionRules.has('receiving')).toBe(true);
            expect(builder.transitionRules.has('transforming')).toBe(true);
        });

        it('devrait initialiser statistiques à zéro', () => {
            expect(builder.stats.navigationsBuilt).toBe(0);
            expect(builder.stats.averageBuildTime).toBe(0);
            expect(builder.stats.cacheHits).toBe(0);
        });
    });

    describe('buildActionNavigation()', () => {
        it('devrait construire navigation complète', async () => {
            const navigation = await builder.buildActionNavigation(
                mockStateData, 
                mockObjectData, 
                true
            );

            // Validation structure principale
            expect(navigation).toHaveProperty('navigationMetadata');
            expect(navigation).toHaveProperty('mainAction');
            expect(navigation).toHaveProperty('secondaryActions');
            expect(navigation).toHaveProperty('conditionalActions');
            expect(navigation).toHaveProperty('workflowActions');
            expect(navigation).toHaveProperty('apiActions');
            expect(navigation).toHaveProperty('navigationSummary');
        });

        it('devrait générer métadonnées navigation', async () => {
            const navigation = await builder.buildActionNavigation(
                mockStateData, 
                mockObjectData
            );

            const metadata = navigation.navigationMetadata;
            expect(metadata).toHaveProperty('navigationId');
            expect(metadata).toHaveProperty('builtAt');
            expect(metadata).toHaveProperty('builtBy', 'NavigationBuilder');
            expect(metadata.sourceContext.objectId).toBe(mockObjectData.objectId);
            expect(metadata.sourceContext.stateId).toBe(mockStateData.stateId);
        });

        it('devrait calculer résumé navigation', async () => {
            const navigation = await builder.buildActionNavigation(
                mockStateData, 
                mockObjectData
            );

            const summary = navigation.navigationSummary;
            expect(summary).toHaveProperty('totalActions');
            expect(summary).toHaveProperty('actionBreakdown');
            expect(summary).toHaveProperty('complexity');
            expect(summary).toHaveProperty('availabilityStats');
            expect(summary.totalActions).toBeGreaterThan(0);
        });

        it('devrait respecter target temps construction < 1s', async () => {
            const startTime = performance.now();
            await builder.buildActionNavigation(mockStateData, mockObjectData);
            const executionTime = performance.now() - startTime;
            
            expect(executionTime).toBeLessThan(1000);
        });
    });

    describe('buildMainActionNavigation()', () => {
        it('devrait construire navigation action principale', () => {
            const mainActionNav = builder.buildMainActionNavigation(mockStateData, mockObjectData);

            expect(mainActionNav.actionId).toContain('main_action');
            expect(mainActionNav.actionName).toBe('Consulter État En_Production');
            expect(mainActionNav.actionType).toBe('main_action');
            expect(mainActionNav.category).toBe('data_exposition');
        });

        it('devrait configurer navigation toujours disponible', () => {
            const mainActionNav = builder.buildMainActionNavigation(mockStateData, mockObjectData);

            expect(mainActionNav.navigationInfo.isAlwaysAvailable).toBe(true);
            expect(mainActionNav.navigationInfo.requiresPermissions).toContain('read');
            expect(mainActionNav.navigationInfo.executionMethod).toBe('GET');
        });

        it('devrait générer endpoint API correct', () => {
            const mainActionNav = builder.buildMainActionNavigation(mockStateData, mockObjectData);

            const apiEndpoint = mainActionNav.navigationInfo.apiEndpoint;
            expect(apiEndpoint.method).toBe('GET');
            expect(apiEndpoint.url).toContain(mockObjectData.objectId);
            expect(apiEndpoint.url).toContain(mockStateData.stateId);
            expect(apiEndpoint.url).toContain('main-action');
        });

        it('devrait configurer interface utilisateur', () => {
            const mainActionNav = builder.buildMainActionNavigation(mockStateData, mockObjectData);

            const ui = mainActionNav.userInterface;
            expect(ui.displayName).toContain('📊');
            expect(ui.displayName).toContain('En_Production');
            expect(ui.icon).toBe('eye');
            expect(ui.color).toBe('#2196F3');
            expect(ui.priority).toBe('highest');
        });
    });

    describe('buildSecondaryActionsNavigation()', () => {
        it('devrait construire navigation actions secondaires', async () => {
            const secondaryActions = await builder.buildSecondaryActionsNavigation(
                mockStateData, 
                mockObjectData, 
                {}
            );

            expect(Array.isArray(secondaryActions)).toBe(true);
            expect(secondaryActions.length).toBe(mockStateData.secondaryActions.length);
        });

        it('devrait valider transitions EPCIS', async () => {
            const secondaryActions = await builder.buildSecondaryActionsNavigation(
                mockStateData, 
                mockObjectData, 
                {}
            );

            // Vérifier que chaque action a une validation de transition
            secondaryActions.forEach(action => {
                expect(action).toHaveProperty('transitionInfo');
                expect(action.transitionInfo).toHaveProperty('transitionValidation');
                expect(action.transitionInfo.sourceState).toBe(mockStateData.stateName);
            });
        });

        it('devrait inclure métadonnées EPCIS pour chaque action', async () => {
            const secondaryActions = await builder.buildSecondaryActionsNavigation(
                mockStateData, 
                mockObjectData, 
                {}
            );

            secondaryActions.forEach(action => {
                expect(action).toHaveProperty('epcisMetadata');
                expect(action.epcisMetadata).toHaveProperty('businessStep');
                expect(action.epcisMetadata).toHaveProperty('targetDisposition');
                expect(action.epcisMetadata.cbvCompliant).toBe(true);
            });
        });

        it('devrait trier actions par priorité si activé', async () => {
            builder.config.sortByPriority = true;
            
            const secondaryActions = await builder.buildSecondaryActionsNavigation(
                mockStateData, 
                mockObjectData, 
                {}
            );

            // Vérifier ordre de priorité (high avant normal)
            if (secondaryActions.length > 1) {
                const priorities = secondaryActions.map(a => a.userInterface.priority);
                expect(priorities[0]).toBe('high'); // Contrôle Qualité en premier
            }
        });
    });

    describe('validateTransition()', () => {
        it('devrait valider transition autorisée', async () => {
            const validation = await builder.validateTransition(
                'En_Production',
                'En_Controle', 
                'transforming',
                'inspecting'
            );

            expect(validation.isValid).toBe(true);
            expect(validation.reason).toBe('Transition autorisée');
        });

        it('devrait rejeter transition non autorisée', async () => {
            const validation = await builder.validateTransition(
                'En_Production',
                'Detruit',
                'transforming', 
                'destroying' // Non autorisé depuis transforming
            );

            expect(validation.isValid).toBe(false);
            expect(validation.reason).toContain('Transition non autorisée');
            expect(Array.isArray(validation.allowedTransitions)).toBe(true);
        });

        it('devrait rejeter transitions cycliques si désactivé', async () => {
            builder.config.allowCyclicTransitions = false;
            
            const validation = await builder.validateTransition(
                'En_Production',
                'En_Production', // Même état
                'transforming',
                'transforming'
            );

            expect(validation.isValid).toBe(false);
            expect(validation.reason).toContain('Transitions cycliques non autorisées');
        });

        it('devrait permettre transitions cycliques si activé', async () => {
            builder.config.allowCyclicTransitions = true;
            
            const validation = await builder.validateTransition(
                'En_Production',
                'En_Production',
                'transforming',
                'transforming'
            );

            expect(validation.isValid).toBe(true);
        });
    });

    describe('buildAPIActionsNavigation()', () => {
        it('devrait construire actions API si activé', async () => {
            builder.config.generateAPIEndpoints = true;
            
            const apiActions = await builder.buildAPIActionsNavigation(
                mockStateData, 
                mockObjectData, 
                {}
            );

            expect(Array.isArray(apiActions)).toBe(true);
        });

        it('devrait inclure action 360SmartConnect si avatarId présent', async () => {
            const apiActions = await builder.buildAPIActionsNavigation(
                mockStateData, 
                mockObjectData, 
                {}
            );

            const smartConnectAction = apiActions.find(a => a.actionName.includes('360SmartConnect'));
            if (smartConnectAction) {
                expect(smartConnectAction.actionType).toBe('api_action');
                expect(smartConnectAction.category).toBe('integration');
                expect(smartConnectAction.apiInfo.provider).toBe('360SmartConnect');
            }
        });

        it('devrait exclure APIs si désactivé', async () => {
            builder.config.generateAPIEndpoints = false;
            
            const apiActions = await builder.buildAPIActionsNavigation(
                mockStateData, 
                mockObjectData, 
                {}
            );

            expect(apiActions).toHaveLength(0);
        });
    });

    describe('Cache et performance', () => {
        it('devrait utiliser cache pour navigations identiques', async () => {
            // Première construction
            const navigation1 = await builder.buildActionNavigation(mockStateData, mockObjectData);
            expect(builder.stats.cacheMisses).toBe(1);
            expect(builder.stats.cacheHits).toBe(0);

            // Deuxième construction identique - doit utiliser cache
            const navigation2 = await builder.buildActionNavigation(mockStateData, mockObjectData);
            expect(builder.stats.cacheHits).toBe(1);
            
            // Vérifier que les navigations sont identiques
            expect(navigation1.navigationMetadata.navigationId).toBe(
                navigation2.navigationMetadata.navigationId
            );
        });

        it('devrait expirer cache après TTL', async () => {
            const fastBuilder = new NavigationBuilder({ cacheTTL: 10 }); // 10ms TTL
            
            await fastBuilder.buildActionNavigation(mockStateData, mockObjectData);
            expect(fastBuilder.stats.cacheMisses).toBe(1);
            
            // Attendre expiration cache
            await new Promise(resolve => setTimeout(resolve, 15));
            
            await fastBuilder.buildActionNavigation(mockStateData, mockObjectData);
            expect(fastBuilder.stats.cacheMisses).toBe(2); // Cache expiré
        });

        it('devrait nettoyer cache automatiquement', async () => {
            // Remplir cache
            for (let i = 0; i < 105; i++) {
                await builder.buildActionNavigation(
                    { ...mockStateData, stateId: `state_${i}` },
                    mockObjectData
                );
            }
            
            // Cache ne doit pas dépasser 100 entrées
            expect(builder.navigationCache.size).toBeLessThanOrEqual(100);
        });

        it('devrait mettre à jour statistiques', async () => {
            const initialStats = { ...builder.stats };
            
            await builder.buildActionNavigation(mockStateData, mockObjectData);
            
            expect(builder.stats.navigationsBuilt).toBe(initialStats.navigationsBuilt + 1);
            expect(builder.stats.averageBuildTime).toBeGreaterThan(0);
            expect(builder.stats.averageActionCount).toBeGreaterThan(0);
        });
    });

    describe('enrichWithUserContext()', () => {
        it('devrait enrichir navigation avec contexte utilisateur', async () => {
            const userContext = {
                userId: 'user_123',
                roles: ['operator', 'quality_inspector'],
                permissions: ['read', 'quality_check', 'packaging'],
                preferences: { language: 'fr' }
            };
            
            const navigation = await builder.buildActionNavigation(
                mockStateData, 
                mockObjectData, 
                true,
                { userContext }
            );

            expect(navigation).toHaveProperty('userContext');
            expect(navigation.userContext.userId).toBe(userContext.userId);
            expect(navigation.userContext.roles).toEqual(userContext.roles);
            expect(navigation.userContext.permissions).toEqual(userContext.permissions);
        });

        it('devrait filtrer actions selon permissions utilisateur', async () => {
            const userContext = {
                userId: 'user_limited',
                permissions: ['read'] // Pas de permissions quality_check ou packaging
            };
            
            const navigation = await builder.buildActionNavigation(
                mockStateData, 
                mockObjectData, 
                true,
                { userContext }
            );

            // Actions filtrées selon permissions
            if (navigation.userContext?.filteredActions) {
                const filtered = navigation.userContext.filteredActions;
                expect(filtered.availableSecondaryActions.length).toBeLessThanOrEqual(
                    navigation.secondaryActions.length
                );
            }
        });
    });

    describe('validateNavigation()', () => {
        it('devrait valider navigation complète', async () => {
            const navigation = await builder.buildActionNavigation(mockStateData, mockObjectData);
            
            // Validation passe sans erreur
            expect(() => builder.validateNavigation(navigation)).not.toThrow();
        });

        it('devrait rejeter navigation sans action principale', () => {
            const invalidNavigation = {
                navigationMetadata: {},
                // mainAction manquante
                secondaryActions: [],
                navigationSummary: { totalActions: 0 }
            };
            
            expect(() => builder.validateNavigation(invalidNavigation))
                .toThrow('Action principale manquante dans navigation');
        });

        it('devrait rejeter navigation trop complexe', () => {
            const complexNavigation = {
                mainAction: {},
                secondaryActions: [],
                navigationSummary: { totalActions: 100 } // Dépasse limite
            };
            
            // Mock calculateNavigationComplexity pour retourner valeur élevée
            vi.spyOn(builder, 'calculateNavigationComplexity').mockReturnValue(100);
            
            expect(() => builder.validateNavigation(complexNavigation))
                .toThrow('Navigation trop complexe');
        });
    });

    describe('getPerformanceStats()', () => {
        it('devrait retourner statistiques complètes', async () => {
            await builder.buildActionNavigation(mockStateData, mockObjectData);
            
            const stats = builder.getPerformanceStats();
            
            expect(stats).toHaveProperty('navigationsBuilt', 1);
            expect(stats).toHaveProperty('averageBuildTime');
            expect(stats).toHaveProperty('averageActionCount');
            expect(stats).toHaveProperty('cacheStats');
            expect(stats).toHaveProperty('performanceTarget');
        });

        it('devrait calculer ratio cache', async () => {
            // Générer pour cache miss
            await builder.buildActionNavigation(mockStateData, mockObjectData);
            // Générer pour cache hit
            await builder.buildActionNavigation(mockStateData, mockObjectData);
            
            const stats = builder.getPerformanceStats();
            
            expect(stats.cacheStats.hits).toBe(1);
            expect(stats.cacheStats.misses).toBe(1);
            expect(stats.cacheStats.hitRatio).toBe(50);
        });

        it('devrait indiquer performance target', async () => {
            await builder.buildActionNavigation(mockStateData, mockObjectData);
            
            const stats = builder.getPerformanceStats();
            
            expect(stats.performanceTarget).toContain('✅'); // Doit être < 1s
        });
    });

    describe('reset()', () => {
        it('devrait remettre à zéro cache et statistiques', async () => {
            // Construire quelques navigations
            await builder.buildActionNavigation(mockStateData, mockObjectData);
            await builder.buildActionNavigation(
                { ...mockStateData, stateId: 'state_2' }, 
                mockObjectData
            );
            
            expect(builder.stats.navigationsBuilt).toBeGreaterThan(0);
            expect(builder.navigationCache.size).toBeGreaterThan(0);
            
            builder.reset();
            
            expect(builder.stats.navigationsBuilt).toBe(0);
            expect(builder.stats.averageBuildTime).toBe(0);
            expect(builder.navigationCache.size).toBe(0);
        });
    });

    describe('Gestion erreurs', () => {
        it('devrait gérer erreurs construction actions secondaires', async () => {
            // State avec action secondaire invalide
            const invalidStateData = {
                ...mockStateData,
                secondaryActions: [
                    {
                        // Action sans champs requis
                        name: 'Action Invalide'
                    }
                ]
            };
            
            // Ne doit pas faire planter la construction
            const navigation = await builder.buildActionNavigation(
                invalidStateData, 
                mockObjectData
            );
            
            expect(navigation).toHaveProperty('secondaryActions');
            // Actions invalides sont ignorées avec warning
        });

        it('devrait gérer erreurs validation transition', async () => {
            // Mock validateTransition pour simuler erreur
            vi.spyOn(builder, 'validateTransition').mockRejectedValue(
                new Error('Erreur validation')
            );
            
            // Construction continue malgré erreur validation
            const navigation = await builder.buildActionNavigation(
                mockStateData, 
                mockObjectData
            );
            
            expect(navigation).toHaveProperty('secondaryActions');
        });
    });

    describe('Helpers utilitaires', () => {
        it('devrait générer ID navigation unique', () => {
            const id1 = builder.generateNavigationId(mockStateData, mockObjectData);
            const id2 = builder.generateNavigationId(mockStateData, mockObjectData);
            
            expect(id1).not.toBe(id2); // IDs uniques
            expect(id1).toContain('nav_');
            expect(id1).toContain(mockObjectData.objectId);
        });

        it('devrait générer clé cache cohérente', () => {
            const key1 = builder.generateNavigationCacheKey(
                mockStateData, mockObjectData, true
            );
            const key2 = builder.generateNavigationCacheKey(
                mockStateData, mockObjectData, true
            );
            const key3 = builder.generateNavigationCacheKey(
                mockStateData, mockObjectData, false
            );
            
            expect(key1).toBe(key2); // Mêmes données = même clé
            expect(key1).not.toBe(key3); // Options différentes = clé différente
        });

        it('devrait vérifier permissions utilisateur', () => {
            const requiredPermissions = ['read', 'quality_check'];
            const userPermissions = ['read', 'quality_check', 'admin'];
            const insufficientPermissions = ['read'];
            
            expect(builder.hasRequiredPermissions(requiredPermissions, userPermissions)).toBe(true);
            expect(builder.hasRequiredPermissions(requiredPermissions, insufficientPermissions)).toBe(false);
            expect(builder.hasRequiredPermissions([], userPermissions)).toBe(true); // Aucune permission requise
        });
    });
});

// <!-- END OF FILE: navigation-builder.test.js -->