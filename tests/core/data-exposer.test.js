// <!-- START OF FILE: data-exposer.test.js -->
// FILENAME: data-exposer.test.js
// Version: 1.0.0
// Date: 2025-07-30 16:30
// Author: Rolland MELET & Claude Code
// Description: Tests unitaires DataExposer - TASK-B006

/**
 * Tests unitaires pour le module DataExposer
 * Validation complète de l'exposition des métadonnées objet et état
 * selon standards EPCIS 2.0 et conformité ProcessMetaLanguage
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DataExposer, DATA_EXPOSER_CONFIG } from '../../core/data-exposer.js';

describe('DataExposer', () => {
    let exposer;
    let mockStateData;
    let mockObjectData;

    beforeEach(() => {
        exposer = new DataExposer();
        
        mockStateData = {
            stateId: 'state_test_001',
            stateName: 'En_Production',
            disposition: 'active',
            businessStep: 'transforming',
            position: { x: 100, y: 200 },
            dimensions: { width: 80, height: 40 },
            createdAt: '2025-07-30T16:30:00.000Z',
            lastModified: '2025-07-30T16:35:00.000Z',
            eventTime: '2025-07-30T16:30:00.000Z',
            eventTimeZone: '+00:00',
            businessLocation: 'urn:epc:id:sgln:0000001.00001.0',
            userMetadata: {
                businessStep: 'transforming',
                operator: 'Jean Dupont',
                department: 'Production'
            }
        };

        mockObjectData = {
            objectId: 'obj_test_001',
            objectName: 'Lot Acier A001',
            objectType: 'raw-material',
            epc: 'urn:epc:id:sgtin:0000001.000001.000001',
            position: { x: 50, y: 150 },
            dimensions: { width: 120, height: 80 },
            createdAt: '2025-07-30T16:00:00.000Z',
            lastModified: '2025-07-30T16:35:00.000Z',
            backgroundColor: '#F5F5F5',
            userMetadata: {
                company: '0000001',
                companyName: 'ACME Industries',
                product: '000001',
                serial: '000001',
                avatarId: 'avatar_test_001',
                weight: '1000kg',
                material: 'Acier inoxydable',
                owner: 'ACME Industries'
            }
        };
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('Configuration et initialisation', () => {
        it('devrait initialiser avec configuration par défaut', () => {
            expect(exposer.config.outputFormats).toContain('json');
            expect(exposer.config.defaultFormat).toBe('json');
            expect(exposer.config.cacheEnabled).toBe(true);
            expect(exposer.config.epcisVersion).toBe('2.0.0');
        });

        it('devrait permettre configuration personnalisée', () => {
            const customExposer = new DataExposer({
                cacheEnabled: false,
                maxDataSize: 200 * 1024,
                defaultFormat: 'xml'
            });
            
            expect(customExposer.config.cacheEnabled).toBe(false);
            expect(customExposer.config.maxDataSize).toBe(200 * 1024);
            expect(customExposer.config.defaultFormat).toBe('xml');
        });

        it('devrait initialiser statistiques à zéro', () => {
            expect(exposer.stats.expositionsGenerated).toBe(0);
            expect(exposer.stats.averageExpositionTime).toBe(0);
            expect(exposer.stats.totalDataExposed).toBe(0);
        });
    });

    describe('exposeCompleteStateData()', () => {
        it('devrait exposer structure complète données', async () => {
            const exposition = await exposer.exposeCompleteStateData(
                mockStateData, 
                mockObjectData, 
                true
            );

            // Validation sections principales
            expect(exposition).toHaveProperty('expositionMetadata');
            expect(exposition).toHaveProperty('objectMetadata');
            expect(exposition).toHaveProperty('currentState');
            expect(exposition).toHaveProperty('epcisCompliance');
            expect(exposition).toHaveProperty('businessContext');
            expect(exposition).toHaveProperty('technicalMetadata');
        });

        it('devrait inclure historique quand demandé', async () => {
            const exposition = await exposer.exposeCompleteStateData(
                mockStateData, 
                mockObjectData, 
                true // includeHistory
            );

            expect(exposition).toHaveProperty('stateHistory');
            expect(Array.isArray(exposition.stateHistory)).toBe(true);
        });

        it('devrait exclure historique quand non demandé', async () => {
            const exposition = await exposer.exposeCompleteStateData(
                mockStateData, 
                mockObjectData, 
                false // includeHistory
            );

            expect(exposition).not.toHaveProperty('stateHistory');
        });

        it('devrait générer métadonnées exposition valides', async () => {
            const exposition = await exposer.exposeCompleteStateData(
                mockStateData, 
                mockObjectData
            );

            const metadata = exposition.expositionMetadata;
            expect(metadata).toHaveProperty('expositionId');
            expect(metadata).toHaveProperty('exposedAt');
            expect(metadata).toHaveProperty('exposedBy', 'DataExposer');
            expect(metadata).toHaveProperty('version');
            expect(metadata.sourceData.objectId).toBe(mockObjectData.objectId);
            expect(metadata.sourceData.stateId).toBe(mockStateData.stateId);
        });

        it('devrait respecter limite taille données', async () => {
            const smallExposer = new DataExposer({ maxDataSize: 1024 }); // 1KB seulement
            
            await expect(
                smallExposer.exposeCompleteStateData(mockStateData, mockObjectData)
            ).rejects.toThrow('Taille exposition trop importante');
        });
    });

    describe('exposeObjectMetadata()', () => {
        it('devrait exposer métadonnées objet complètes', async () => {
            const objectMetadata = await exposer.exposeObjectMetadata(mockObjectData);

            expect(objectMetadata).toHaveProperty('identification');
            expect(objectMetadata).toHaveProperty('classification');
            expect(objectMetadata).toHaveProperty('lifecycle');
            expect(objectMetadata).toHaveProperty('physical');
            expect(objectMetadata).toHaveProperty('business');
            expect(objectMetadata).toHaveProperty('synchronization');
        });

        it('devrait inclure identifiants EPCIS corrects', async () => {
            const objectMetadata = await exposer.exposeObjectMetadata(mockObjectData);
            
            const identification = objectMetadata.identification;
            expect(identification.objectId).toBe(mockObjectData.objectId);
            expect(identification.objectName).toBe(mockObjectData.objectName);
            expect(identification.objectType).toBe(mockObjectData.objectType);
            expect(identification.epc).toBe(mockObjectData.epc);
        });

        it('devrait générer EPC si manquant', async () => {
            const objectWithoutEPC = { ...mockObjectData };
            delete objectWithoutEPC.epc;
            
            const objectMetadata = await exposer.exposeObjectMetadata(objectWithoutEPC);
            
            expect(objectMetadata.identification.epc).toMatch(/^urn:epc:id:sgtin:/);
            expect(objectMetadata.identification.epc).toContain('0000001.000001.000001');
        });

        it('devrait exposer métadonnées business complètes', async () => {
            const objectMetadata = await exposer.exposeObjectMetadata(mockObjectData);
            
            const business = objectMetadata.business;
            expect(business.company).toBe('0000001');
            expect(business.companyName).toBe('ACME Industries');
            expect(business.owner).toBe('ACME Industries');
        });
    });

    describe('exposeCurrentState()', () => {
        it('devrait exposer état actuel complet', async () => {
            const currentState = await exposer.exposeCurrentState(mockStateData, mockObjectData);

            expect(currentState).toHaveProperty('stateIdentification');
            expect(currentState).toHaveProperty('epcisContext');
            expect(currentState).toHaveProperty('temporalData');
            expect(currentState).toHaveProperty('stateCharacteristics');
            expect(currentState).toHaveProperty('parentRelation');
            expect(currentState).toHaveProperty('visual');
        });

        it('devrait inclure identifiants état corrects', async () => {
            const currentState = await exposer.exposeCurrentState(mockStateData, mockObjectData);
            
            const identification = currentState.stateIdentification;
            expect(identification.stateId).toBe(mockStateData.stateId);
            expect(identification.stateName).toBe(mockStateData.stateName);
            expect(identification.disposition).toBe(mockStateData.disposition);
        });

        it('devrait exposer contexte EPCIS conforme', async () => {
            const currentState = await exposer.exposeCurrentState(mockStateData, mockObjectData);
            
            const epcisContext = currentState.epcisContext;
            expect(epcisContext.businessStep).toBe(mockStateData.businessStep);
            expect(epcisContext.disposition).toBe(mockStateData.disposition);
            expect(epcisContext.businessLocation).toBe(mockStateData.businessLocation);
        });

        it('devrait calculer caractéristiques état', async () => {
            const currentState = await exposer.exposeCurrentState(mockStateData, mockObjectData);
            
            const characteristics = currentState.stateCharacteristics;
            expect(characteristics).toHaveProperty('isActive');
            expect(characteristics).toHaveProperty('isTransitional');
            expect(characteristics.isActive).toBe(mockStateData.disposition === 'active');
        });
    });

    describe('exposeEPCISCompliance()', () => {
        it('devrait exposer conformité EPCIS 2.0 complète', async () => {
            const epcisCompliance = await exposer.exposeEPCISCompliance(mockStateData, mockObjectData);

            expect(epcisCompliance).toHaveProperty('complianceStatus');
            expect(epcisCompliance).toHaveProperty('businessStepCompliance');
            expect(epcisCompliance).toHaveProperty('dispositionCompliance');
            expect(epcisCompliance).toHaveProperty('identificationCompliance');
            expect(epcisCompliance).toHaveProperty('eventCompliance');
        });

        it('devrait valider business step EPCIS', async () => {
            const epcisCompliance = await exposer.exposeEPCISCompliance(mockStateData, mockObjectData);
            
            const businessStepCompliance = epcisCompliance.businessStepCompliance;
            expect(businessStepCompliance.businessStep).toBe(mockStateData.businessStep);
            expect(businessStepCompliance.isValidBusinessStep).toBe(true);
            expect(Array.isArray(businessStepCompliance.allowedNextSteps)).toBe(true);
        });

        it('devrait valider disposition EPCIS', async () => {
            const epcisCompliance = await exposer.exposeEPCISCompliance(mockStateData, mockObjectData);
            
            const dispositionCompliance = epcisCompliance.dispositionCompliance;
            expect(dispositionCompliance.disposition).toBe(mockStateData.disposition);
            expect(dispositionCompliance.isValidDisposition).toBe(true);
            expect(Array.isArray(dispositionCompliance.allowedTransitions)).toBe(true);
        });

        it('devrait valider format EPC', async () => {
            const epcisCompliance = await exposer.exposeEPCISCompliance(mockStateData, mockObjectData);
            
            const identificationCompliance = epcisCompliance.identificationCompliance;
            expect(identificationCompliance.epc).toBe(mockObjectData.epc);
            expect(identificationCompliance.epcFormat).toBe('SGTIN');
            expect(identificationCompliance.isValidEPC).toBe(true);
        });

        it('devrait exposer conformité CBV 2.0', async () => {
            const epcisCompliance = await exposer.exposeEPCISCompliance(mockStateData, mockObjectData);
            
            const complianceStatus = epcisCompliance.complianceStatus;
            expect(complianceStatus.isCompliant).toBe(true);
            expect(complianceStatus.cbvVersion).toBe('2.0.0');
            expect(complianceStatus.epcisVersion).toBe('2.0.0');
        });
    });

    describe('Cache et performance', () => {
        it('devrait utiliser cache pour expositions identiques', async () => {
            // Première exposition
            const exposition1 = await exposer.exposeCompleteStateData(mockStateData, mockObjectData);
            expect(exposer.stats.cacheMisses).toBe(1);
            expect(exposer.stats.cacheHits).toBe(0);

            // Deuxième exposition identique - doit utiliser cache
            const exposition2 = await exposer.exposeCompleteStateData(mockStateData, mockObjectData);
            expect(exposer.stats.cacheHits).toBe(1);
            
            // Vérifier que les données sont identiques
            expect(exposition1.expositionMetadata.expositionId).toBe(exposition2.expositionMetadata.expositionId);
        });

        it('devrait expirer cache après TTL', async () => {
            const fastExposer = new DataExposer({ cacheTTL: 10 }); // 10ms TTL
            
            await fastExposer.exposeCompleteStateData(mockStateData, mockObjectData);
            expect(fastExposer.stats.cacheMisses).toBe(1);
            
            // Attendre expiration cache
            await new Promise(resolve => setTimeout(resolve, 15));
            
            await fastExposer.exposeCompleteStateData(mockStateData, mockObjectData);
            expect(fastExposer.stats.cacheMisses).toBe(2); // Cache expiré
        });

        it('devrait respecter target temps exposition < 500ms', async () => {
            const startTime = performance.now();
            await exposer.exposeCompleteStateData(mockStateData, mockObjectData);
            const executionTime = performance.now() - startTime;
            
            expect(executionTime).toBeLessThan(500);
        });

        it('devrait mettre à jour statistiques performance', async () => {
            const initialStats = { ...exposer.stats };
            
            await exposer.exposeCompleteStateData(mockStateData, mockObjectData);
            
            expect(exposer.stats.expositionsGenerated).toBe(initialStats.expositionsGenerated + 1);
            expect(exposer.stats.averageExpositionTime).toBeGreaterThan(0);
            expect(exposer.stats.totalDataExposed).toBeGreaterThan(0);
        });
    });

    describe('enrichWithSmartConnectMapping()', () => {
        it('devrait enrichir avec mapping 360SmartConnect', async () => {
            const exposition = await exposer.exposeCompleteStateData(mockStateData, mockObjectData);
            
            expect(exposition).toHaveProperty('smartConnectMapping');
            expect(exposition.smartConnectMapping).toHaveProperty('avatarMapping');
            expect(exposition.smartConnectMapping).toHaveProperty('metadataMapping');
            expect(exposition.smartConnectMapping).toHaveProperty('apiEndpoints');
        });

        it('devrait mapper avatarId correctement', async () => {
            const exposition = await exposer.exposeCompleteStateData(mockStateData, mockObjectData);
            
            const avatarMapping = exposition.smartConnectMapping.avatarMapping;
            expect(avatarMapping.avatarId).toBe(mockObjectData.userMetadata.avatarId);
            expect(avatarMapping.objectToAvatar.processMetaLanguageId).toBe(mockObjectData.objectId);
            expect(avatarMapping.objectToAvatar.mappingType).toBe('one_to_one');
        });

        it('devrait générer endpoints API 360SmartConnect', async () => {
            const exposition = await exposer.exposeCompleteStateData(mockStateData, mockObjectData);
            
            const apiEndpoints = exposition.smartConnectMapping.apiEndpoints;
            expect(apiEndpoints.avatar).toContain(mockObjectData.userMetadata.avatarId);
            expect(apiEndpoints.state).toContain('/state');
            expect(apiEndpoints.actions).toContain('/actions');
            expect(apiEndpoints.events).toContain('/events');
        });
    });

    describe('Validation données exposées', () => {
        it('devrait valider sections requises présentes', async () => {
            const exposition = await exposer.exposeCompleteStateData(mockStateData, mockObjectData);
            
            // Sections requises
            const requiredSections = ['expositionMetadata', 'objectMetadata', 'currentState', 'epcisCompliance'];
            requiredSections.forEach(section => {
                expect(exposition).toHaveProperty(section);
                expect(exposition[section]).not.toBeNull();
                expect(exposition[section]).not.toBeUndefined();
            });
        });

        it('devrait calculer taille exposition', async () => {
            const exposition = await exposer.exposeCompleteStateData(mockStateData, mockObjectData);
            const dataSize = JSON.stringify(exposition).length;
            
            expect(dataSize).toBeGreaterThan(0);
            expect(dataSize).toBeLessThan(exposer.config.maxDataSize);
        });

        it('devrait valider conformité EPCIS dans exposition', async () => {
            const exposition = await exposer.exposeCompleteStateData(mockStateData, mockObjectData);
            
            expect(exposition.epcisCompliance.complianceStatus.isCompliant).toBe(true);
        });
    });

    describe('exposeBusinessContext()', () => {
        it('devrait exposer contexte organisationnel', async () => {
            const businessContext = await exposer.exposeBusinessContext(mockStateData, mockObjectData);
            
            expect(businessContext).toHaveProperty('organizationalContext');
            expect(businessContext.organizationalContext.company).toBe(mockObjectData.userMetadata.company);
            expect(businessContext.organizationalContext.companyName).toBe(mockObjectData.userMetadata.companyName);
        });

        it('devrait exposer contexte processus', async () => {
            const businessContext = await exposer.exposeBusinessContext(mockStateData, mockObjectData);
            
            expect(businessContext).toHaveProperty('processContext');
            expect(businessContext.processContext).toHaveProperty('processName');
            expect(businessContext.processContext).toHaveProperty('processVersion');
        });

        it('devrait exposer règles business', async () => {
            const businessContext = await exposer.exposeBusinessContext(mockStateData, mockObjectData);
            
            expect(businessContext).toHaveProperty('businessRules');
            expect(businessContext.businessRules).toHaveProperty('stateRules');
            expect(businessContext.businessRules).toHaveProperty('objectRules');
            expect(businessContext.businessRules).toHaveProperty('transitionRules');
        });
    });

    describe('exposeTechnicalMetadata()', () => {
        it('devrait exposer métadonnées système', async () => {
            const technicalMetadata = await exposer.exposeTechnicalMetadata(mockStateData, mockObjectData);
            
            expect(technicalMetadata).toHaveProperty('systemMetadata');
            expect(technicalMetadata.systemMetadata.generatedBy).toBe('ProcessMetaLanguage DataExposer');
            expect(technicalMetadata.systemMetadata.version).toBe(exposer.config.apiVersion);
        });

        it('devrait exposer données synchronisation', async () => {
            const technicalMetadata = await exposer.exposeTechnicalMetadata(mockStateData, mockObjectData);
            
            expect(technicalMetadata).toHaveProperty('synchronizationData');
            expect(technicalMetadata.synchronizationData).toHaveProperty('lastSync');
            expect(technicalMetadata.synchronizationData).toHaveProperty('syncStatus');
            expect(technicalMetadata.synchronizationData).toHaveProperty('canvasElementIds');
        });

        it('devrait exposer contraintes techniques', async () => {
            const technicalMetadata = await exposer.exposeTechnicalMetadata(mockStateData, mockObjectData);
            
            expect(technicalMetadata).toHaveProperty('technicalConstraints');
            expect(technicalMetadata.technicalConstraints.maxDataSize).toBe(exposer.config.maxDataSize);
            expect(technicalMetadata.technicalConstraints.cacheTTL).toBe(exposer.config.cacheTTL);
        });
    });

    describe('getPerformanceStats()', () => {
        it('devrait retourner statistiques complètes', async () => {
            await exposer.exposeCompleteStateData(mockStateData, mockObjectData);
            
            const stats = exposer.getPerformanceStats();
            
            expect(stats).toHaveProperty('expositionsGenerated', 1);
            expect(stats).toHaveProperty('averageExpositionTime');
            expect(stats).toHaveProperty('averageDataSize');
            expect(stats).toHaveProperty('cacheStats');
            expect(stats).toHaveProperty('performanceTarget');
        });

        it('devrait calculer ratios cache', async () => {
            // Générer pour cache miss
            await exposer.exposeCompleteStateData(mockStateData, mockObjectData);
            // Générer pour cache hit
            await exposer.exposeCompleteStateData(mockStateData, mockObjectData);
            
            const stats = exposer.getPerformanceStats();
            
            expect(stats.cacheStats.hits).toBe(1);
            expect(stats.cacheStats.misses).toBe(1);
            expect(stats.cacheStats.hitRatio).toBe(50);
        });

        it('devrait indiquer performance target', async () => {
            await exposer.exposeCompleteStateData(mockStateData, mockObjectData);
            
            const stats = exposer.getPerformanceStats();
            
            expect(stats.performanceTarget).toContain('✅'); // Doit être < 500ms
        });
    });

    describe('Gestion erreurs', () => {
        it('devrait gérer données état invalides', async () => {
            await expect(
                exposer.exposeCompleteStateData(null, mockObjectData)
            ).rejects.toThrow();
        });

        it('devrait gérer données objet invalides', async () => {
            await expect(
                exposer.exposeCompleteStateData(mockStateData, null)
            ).rejects.toThrow();
        });

        it('devrait gérer dépassement limite taille', async () => {
            const tinyExposer = new DataExposer({ maxDataSize: 100 }); // Très petit
            
            await expect(
                tinyExposer.exposeCompleteStateData(mockStateData, mockObjectData)
            ).rejects.toThrow('Taille exposition trop importante');
        });
    });

    describe('Helpers utilitaires', () => {
        it('devrait générer ID exposition unique', async () => {
            const exposition1 = await exposer.exposeCompleteStateData(mockStateData, mockObjectData);
            const exposition2 = await exposer.exposeCompleteStateData(
                { ...mockStateData, stateId: 'state_different' }, 
                mockObjectData
            );
            
            expect(exposition1.expositionMetadata.expositionId).not.toBe(
                exposition2.expositionMetadata.expositionId
            );
        });

        it('devrait générer clé cache cohérente', () => {
            const key1 = exposer.generateCacheKey(mockStateData, mockObjectData, true);
            const key2 = exposer.generateCacheKey(mockStateData, mockObjectData, true);
            const key3 = exposer.generateCacheKey(mockStateData, mockObjectData, false);
            
            expect(key1).toBe(key2); // Même données = même clé
            expect(key1).not.toBe(key3); // Options différentes = clé différente
        });

        it('devrait nettoyer cache automatiquement', async () => {
            // Remplir cache
            for (let i = 0; i < 105; i++) {
                await exposer.exposeCompleteStateData(
                    { ...mockStateData, stateId: `state_${i}` },
                    mockObjectData
                );
            }
            
            // Cache ne doit pas dépasser 100 entrées
            expect(exposer.expositionCache.size).toBeLessThanOrEqual(100);
        });
    });
});

// <!-- END OF FILE: data-exposer.test.js -->