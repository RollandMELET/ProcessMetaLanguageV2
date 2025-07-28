// <!-- START OF FILE: template-integration.js -->
// FILENAME: template-integration.js
// Version: 1.0.0
// Date: 2025-07-28 10:00
// Author: Rolland MELET & Claude Code
// Description: Exemple intégration TemplateProcessor avec ObjectCreator - TASK-B001

/**
 * Exemple d'intégration complète ProcessMetaLanguage
 * 
 * Démontre le workflow complet:
 * 1. Création objet graphique avec ObjectCreator
 * 2. Extraction métadonnées canvas
 * 3. Génération template markdown avec TemplateProcessor
 * 4. Synchronisation bidirectionnelle
 */

// Import modules ProcessMetaLanguage
const { ObjectCreator, getObjectMetadata } = require('../components/object-creator.js');
const { TemplateProcessor } = require('../core/template-processor.js');
const path = require('path');

/**
 * Classe d'intégration ProcessMetaLanguage complète
 * @class
 */
class ProcessMetaLanguageIntegration {
    /**
     * Initialise l'intégration avec templates et canvas
     * @param {Object} options - Options de configuration
     */
    constructor(options = {}) {
        this.templateProcessor = new TemplateProcessor(options.templateConfig);
        this.createdObjects = new Map();
        this.syncEnabled = options.syncEnabled !== false;
        
        console.log('🚀 ProcessMetaLanguage Integration initialisée');
    }

    /**
     * Workflow complet: Création objet → Template markdown
     * @param {string} objectName - Nom de l'objet ProcessMetaLanguage
     * @param {string} objectType - Type d'objet EPCIS
     * @param {Object} position - Position {x, y} dans canvas
     * @param {Object} userMetadata - Métadonnées utilisateur
     * @returns {Promise<Object>} Résultat avec IDs canvas et chemin template
     * @sideEffect Crée objet canvas ET fichier markdown
     * @example
     * const result = await integration.createObjectWithTemplate(
     *   "Lot-Acier-Premium-A001", 
     *   "raw-material", 
     *   {x: 200, y: 300},
     *   {supplier: "AcierCorp", grade: "A", batch: "B2024-001"}
     * );
     */
    async createObjectWithTemplate(objectName, objectType, position, userMetadata = {}) {
        const startTime = performance.now();
        
        try {
            console.log(`🔄 Début création objet avec template: ${objectName}`);
            
            // Étape 1: Créer objet graphique dans canvas
            console.log('📐 Création composant graphique...');
            const canvasObjectId = await this.createCanvasObject(objectName, objectType, position, userMetadata);
            
            // Étape 2: Extraire métadonnées canvas
            console.log('📊 Extraction métadonnées canvas...');
            const canvasMetadata = await this.extractCanvasMetadata(canvasObjectId);
            
            // Étape 3: Générer template markdown
            console.log('📝 Génération template markdown...');
            const templatePath = await this.generateObjectTemplate(canvasMetadata);
            
            // Étape 4: Enregistrer pour synchronisation
            if (this.syncEnabled) {
                this.registerForSync(canvasObjectId, templatePath, canvasMetadata);
            }
            
            const endTime = performance.now();
            const executionTime = endTime - startTime;
            
            const result = {
                success: true,
                canvasObjectId,
                templatePath,
                executionTime: `${executionTime.toFixed(2)}ms`,
                objectName,
                objectType,
                position,
                syncEnabled: this.syncEnabled
            };
            
            console.log(`✅ Objet ProcessMetaLanguage créé: ${objectName} (${executionTime.toFixed(2)}ms)`);
            console.log(`   Canvas ID: ${canvasObjectId}`);
            console.log(`   Template: ${path.basename(templatePath)}`);
            
            return result;
            
        } catch (error) {
            console.error(`❌ Erreur création objet '${objectName}':`, error.message);
            throw error;
        }
    }

    /**
     * Crée l'objet graphique dans le canvas Excalidraw
     * @param {string} objectName - Nom de l'objet
     * @param {string} objectType - Type d'objet EPCIS
     * @param {Object} position - Position canvas
     * @param {Object} userMetadata - Métadonnées utilisateur
     * @returns {Promise<string>} ID de l'objet canvas créé
     * @private
     */
    async createCanvasObject(objectName, objectType, position, userMetadata) {
        // Utilisation du module object-creator existant
        const { createObjectComponent } = require('../components/object-creator.js');
        
        // Enrichir métadonnées avec info système
        const enrichedMetadata = {
            ...userMetadata,
            createdBy: 'ProcessMetaLanguage Integration',
            integrationVersion: '1.0.0',
            templateEnabled: true,
            syncEnabled: this.syncEnabled
        };
        
        return await createObjectComponent(objectName, objectType, position, enrichedMetadata);
    }

    /**
     * Extrait les métadonnées complètes d'un objet canvas
     * @param {string} canvasObjectId - ID objet dans canvas
     * @returns {Promise<Object>} Métadonnées enrichies pour template
     * @private
     */
    async extractCanvasMetadata(canvasObjectId) {
        // Récupération métadonnées via object-creator
        const baseMetadata = getObjectMetadata(canvasObjectId);
        
        if (!baseMetadata) {
            throw new Error(`Impossible de récupérer métadonnées pour objet ${canvasObjectId}`);
        }
        
        // Enrichissement avec données système
        return {
            ...baseMetadata,
            extractedAt: new Date().toISOString(),
            canvasElementId: canvasObjectId,
            
            // Statuts pour template
            syncStatus: 'synchronized',
            templateGenerated: true,
            validationStatus: 'pending'
        };
    }

    /**
     * Génère le template markdown depuis les métadonnées canvas
     * @param {Object} canvasMetadata - Métadonnées objet canvas
     * @returns {Promise<string>} Chemin du fichier template généré
     * @private
     */
    async generateObjectTemplate(canvasMetadata) {
        // Nom fichier depuis nom objet (sanitisé)
        const sanitizedName = (canvasMetadata.objectName || 'unnamed')
            .replace(/[^a-zA-Z0-9]/g, '-')
            .toLowerCase();
        
        const templatePath = path.join(
            this.templateProcessor.config.outputDir,
            'objects',
            `${sanitizedName}.md`
        );
        
        // Génération template avec TemplateProcessor
        const generationResult = await this.templateProcessor.generateFromCanvas(
            canvasMetadata,
            'object-template',
            templatePath
        );
        
        if (!generationResult.success) {
            throw new Error(`Échec génération template: ${generationResult.error}`);
        }
        
        return templatePath;
    }

    /**
     * Enregistre un objet pour synchronisation automatique
     * @param {string} canvasObjectId - ID objet canvas
     * @param {string} templatePath - Chemin template markdown
     * @param {Object} metadata - Métadonnées objet
     * @sideEffect Ajoute objet à la Map de suivi synchronisation
     * @private
     */
    registerForSync(canvasObjectId, templatePath, metadata) {
        this.createdObjects.set(canvasObjectId, {
            templatePath,
            metadata,
            lastSync: new Date().toISOString(),
            syncCount: 0
        });
        
        console.log(`🔗 Objet enregistré pour sync: ${metadata.objectName}`);
    }

    /**
     * Synchronise tous les objets enregistrés
     * @returns {Promise<Object>} Statistiques de synchronisation
     * @sideEffect Met à jour tous les templates markdown depuis canvas
     */
    async syncAllObjects() {
        const startTime = performance.now();
        let successful = 0;
        let failed = 0;
        const results = [];
        
        console.log(`🔄 Début synchronisation: ${this.createdObjects.size} objets`);
        
        for (const [canvasObjectId, syncData] of this.createdObjects) {
            try {
                // Récupérer métadonnées actuelles canvas
                const currentMetadata = getObjectMetadata(canvasObjectId);
                
                if (!currentMetadata) {
                    throw new Error(`Objet ${canvasObjectId} non trouvé dans canvas`);
                }
                
                // Régénérer template avec données actuelles
                await this.templateProcessor.generateFromCanvas(
                    currentMetadata,
                    'object-template',
                    syncData.templatePath
                );
                
                // Mettre à jour données sync
                syncData.lastSync = new Date().toISOString();
                syncData.syncCount++;
                
                successful++;
                results.push({
                    canvasObjectId,
                    objectName: currentMetadata.objectName,
                    templatePath: syncData.templatePath,
                    success: true
                });
                
                console.log(`✅ Synchronisé: ${currentMetadata.objectName}`);
                
            } catch (error) {
                failed++;
                results.push({
                    canvasObjectId,
                    error: error.message,
                    success: false
                });
                
                console.error(`❌ Erreur sync ${canvasObjectId}:`, error.message);
            }
        }
        
        const endTime = performance.now();
        const totalTime = endTime - startTime;
        
        const syncStats = {
            totalObjects: this.createdObjects.size,
            successful,
            failed,
            executionTime: `${totalTime.toFixed(2)}ms`,
            results
        };
        
        console.log(`✅ Synchronisation terminée: ${successful}/${this.createdObjects.size} (${totalTime.toFixed(2)}ms)`);
        
        return syncStats;
    }

    /**
     * Crée un processus complet avec plusieurs objets liés
     * @param {string} processName - Nom du processus
     * @param {Array<Object>} objectsConfig - Configuration des objets à créer
     * @returns {Promise<Object>} Résultat création processus avec tous objets
     * @example
     * const process = await integration.createProcess("Réception-Matières", [
     *   {name: "Lot-Acier-A001", type: "raw-material", position: {x: 100, y: 200}},
     *   {name: "Conteneur-C001", type: "container", position: {x: 300, y: 200}}
     * ]);
     */
    async createProcess(processName, objectsConfig) {
        const startTime = performance.now();
        const createdObjects = [];
        
        console.log(`🏭 Création processus '${processName}' avec ${objectsConfig.length} objets`);
        
        try {
            for (const [index, objConfig] of objectsConfig.entries()) {
                const objectName = objConfig.name || `${processName}-Object-${index + 1}`;
                
                const result = await this.createObjectWithTemplate(
                    objectName,
                    objConfig.type,
                    objConfig.position,
                    {
                        ...objConfig.metadata,
                        processName,
                        processIndex: index,
                        totalObjects: objectsConfig.length
                    }
                );
                
                createdObjects.push(result);
            }
            
            const endTime = performance.now();
            const totalTime = endTime - startTime;
            
            const processResult = {
                processName,
                success: true,
                objectsCreated: createdObjects.length,
                executionTime: `${totalTime.toFixed(2)}ms`,
                createdObjects,
                performanceTarget: totalTime < 5000 ? '✅ <5s' : '❌ >5s'
            };
            
            console.log(`✅ Processus '${processName}' créé: ${createdObjects.length} objets (${totalTime.toFixed(2)}ms)`);
            
            return processResult;
            
        } catch (error) {
            console.error(`❌ Erreur création processus '${processName}':`, error.message);
            throw error;
        }
    }

    /**
     * Obtient les statistiques globales de l'intégration
     * @returns {Object} Statistiques complètes performance et utilisation
     */
    getIntegrationStats() {
        const templateStats = this.templateProcessor.getPerformanceStats();
        
        return {
            // Statistiques objets
            totalObjectsCreated: this.createdObjects.size,
            syncEnabled: this.syncEnabled,
            
            // Statistiques templates
            templatesGenerated: templateStats.templatesGenerated,
            averageTemplateTime: templateStats.averageTime,
            templateErrors: templateStats.errors.length,
            
            // Performance globale
            cacheSize: templateStats.cacheSize,
            performanceTargetMet: templateStats.averageTime < 5000,
            
            // Objets enregistrés
            registeredObjects: Array.from(this.createdObjects.keys()),
            
            // Statut système
            status: 'operational',
            version: '1.0.0'
        };
    }
}

// Export pour utilisation
module.exports = {
    ProcessMetaLanguageIntegration
};

// Export ES6
if (typeof exports !== 'undefined') {
    exports.ProcessMetaLanguageIntegration = ProcessMetaLanguageIntegration;
}

// Exemple d'utilisation pour test manuel
async function demonstrateIntegration() {
    console.log('🎯 Démonstration ProcessMetaLanguage Integration\n');
    
    try {
        // Initialiser intégration
        const integration = new ProcessMetaLanguageIntegration({
            syncEnabled: true,
            templateConfig: {
                outputDir: path.join(__dirname, '..', 'docs', 'generated')
            }
        });
        
        // Créer objets exemple
        console.log('1. Création objets individuels...');
        
        const rawMaterial = await integration.createObjectWithTemplate(
            'Lot-Acier-Premium-A001',
            'raw-material',
            { x: 100, y: 200 },
            {
                supplier: 'AcierCorp France',
                grade: 'Premium A',
                batch: 'B2024-001',
                weight: '500kg'
            }
        );
        
        const container = await integration.createObjectWithTemplate(
            'Conteneur-Transport-C001',
            'container',
            { x: 300, y: 200 },
            {
                capacity: '1000kg',
                material: 'Steel',
                certification: 'ISO-9001'
            }
        );
        
        // Créer processus complet
        console.log('\n2. Création processus complet...');
        
        const processResult = await integration.createProcess('Processus-Réception-Matières', [
            {
                name: 'Matière-Première-001',
                type: 'raw-material',
                position: { x: 150, y: 100 },
                metadata: { origin: 'France', quality: 'A+' }
            },
            {
                name: 'Contrôle-Qualité-001',
                type: 'equipment',
                position: { x: 350, y: 100 },
                metadata: { type: 'Scanner', model: 'QC-2024' }
            },
            {
                name: 'Zone-Stockage-001',
                type: 'location',
                position: { x: 550, y: 100 },
                metadata: { zone: 'A1', capacity: '10000kg' }
            }
        ]);
        
        // Synchronisation
        console.log('\n3. Synchronisation globale...');
        const syncResult = await integration.syncAllObjects();
        
        // Statistiques finales
        console.log('\n4. Statistiques finales...');
        const stats = integration.getIntegrationStats();
        
        console.log('\n📊 RÉSULTATS DÉMONSTRATION:');
        console.log(`   Objets créés: ${stats.totalObjectsCreated}`);
        console.log(`   Templates générés: ${stats.templatesGenerated}`);
        console.log(`   Performance moyenne: ${stats.averageTemplateTime}ms`);
        console.log(`   Synchronisation: ${syncResult.successful}/${syncResult.totalObjects} réussies`);
        console.log(`   Cible performance: ${stats.performanceTargetMet ? '✅ Atteinte' : '❌ Non atteinte'}`);
        
        return {
            integration,
            rawMaterial,
            container,
            processResult,
            syncResult,
            stats
        };
        
    } catch (error) {
        console.error('❌ Erreur démonstration:', error.message);
        throw error;
    }
}

// Lancer démonstration si module appelé directement
if (require.main === module) {
    demonstrateIntegration()
        .then(() => console.log('\n✅ Démonstration terminée avec succès'))
        .catch(error => console.error('\n❌ Échec démonstration:', error.message));
}

// <!-- END OF FILE: template-integration.js -->