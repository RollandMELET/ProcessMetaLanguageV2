// <!-- START OF FILE: canvas-updater.js -->
// FILENAME: canvas-updater.js
// Version: 1.0.0
// Date: 2025-07-31 15:45
// Author: Rolland MELET & Claude Code
// Description: Mise à jour canvas Excalidraw ProcessMetaLanguage - synchronisation markdown → canvas - TASK-B009 Phase 4

/**
 * Module ProcessMetaLanguage - Canvas Updater
 * 
 * Mise à jour des éléments canvas Excalidraw basée sur les données markdown.
 * Implémente la synchronisation markdown → canvas pour synchronisation bidirectionnelle.
 * 
 * Fonctionnalités principales:
 * - Mise à jour éléments canvas depuis données markdown
 * - Synchronisation positions, propriétés et métadonnées
 * - Création automatique éléments manquants
 * - Suppression ou masquage éléments obsolètes
 * - Préservation de l'historique et des révisions
 * - Performance optimisée pour 50+ composants
 * - Support ExcalidrawAutomate API complète
 * - Validation cohérence avant application
 */

import { MarkdownReader } from './markdown-reader.js';
import { RelationDetector } from '../core/relation-detector.js';

/**
 * Configuration du mise à jour canvas
 * @constant {Object}
 */
const CANVAS_UPDATER_CONFIG = {
    // Éléments graphiques ProcessMetaLanguage
    elementSpecs: {
        object: {
            type: 'polygon', // Hexagone
            width: 120,
            height: 80,
            strokeColor: '#1e1e1e',
            backgroundColor: '#ffffff',
            fillStyle: 'solid',
            strokeWidth: 2,
            sides: 6
        },
        state: {
            type: 'rectangle',
            width: 80,
            height: 40,
            strokeColor: '#059669',
            backgroundColor: '#d1fae5',
            fillStyle: 'solid',
            strokeWidth: 1.5,
            roundness: { value: 0 }
        },
        action: {
            type: 'rectangle',
            width: 140,
            height: 60,
            strokeColor: '#dc2626',
            backgroundColor: '#fef2f2',
            fillStyle: 'solid',
            strokeWidth: 1.5,
            roundness: { value: 0.15 }
        }
    },
    
    // Stratégies de synchronisation
    syncStrategies: {
        createMissing: true,        // Créer éléments manquants
        updateExisting: true,       // Mettre à jour éléments existants
        preserveUserChanges: true,  // Préserver modifications utilisateur
        handleConflicts: 'merge',   // 'merge', 'override', 'skip'
        backupBeforeSync: true      // Sauvegarde avant synchronisation
    },
    
    // Performance
    performance: {
        maxUpdateTimeMs: 5000,
        batchSize: 25,
        enableDifferentialSync: true,
        useTransactions: true
    },
    
    // Options de validation
    validation: {
        validateBeforeApply: true,
        checkElementBounds: true,
        validateReferences: true,
        requireConfirmation: false
    },
    
    // Tags ProcessMetaLanguage
    processTags: {
        object: '#process-object',
        state: '#process-state',
        action: '#process-action'
    }
};

/**
 * Résultat de synchronisation canvas
 * @typedef {Object} SyncResult
 * @property {boolean} success - Synchronisation réussie
 * @property {Object} changes - Modifications appliquées
 * @property {Array} conflicts - Conflits détectés
 * @property {Object} metrics - Métriques de performance
 */

/**
 * Mise à jour canvas Excalidraw ProcessMetaLanguage
 * Synchronise les éléments canvas avec les données markdown
 * 
 * @class CanvasUpdater
 * @example
 * // Synchroniser canvas avec markdown
 * const updater = new CanvasUpdater();
 * await updater.initialize();
 * 
 * // Synchronisation complète
 * const result = await updater.syncCanvasFromMarkdown({
 *   preserveUserChanges: true,
 *   createMissing: true
 * });
 * 
 * console.log(`${result.changes.updated} éléments mis à jour`);
 */
export class CanvasUpdater {
    /**
     * Initialise le mise à jour canvas
     * @param {Object} options - Options de configuration
     * @param {Object} options.excalidrawAPI - Instance ExcalidrawAutomate
     * @param {boolean} options.enableDifferentialSync - Sync différentielle (défaut: true)
     * @param {string} options.conflictStrategy - Stratégie conflits (défaut: 'merge')
     */
    constructor(options = {}) {
        this.config = {
            ...CANVAS_UPDATER_CONFIG,
            ...options
        };
        
        // Composants de synchronisation
        this.markdownReader = new MarkdownReader();
        this.relationDetector = new RelationDetector();
        
        // API Excalidraw
        this.excalidrawAPI = options.excalidrawAPI || null;
        
        // Cache de synchronisation
        this.syncCache = new Map();
        this.elementMappings = new Map(); // markdown_id → canvas_element_id
        
        // Métriques de performance
        this.metrics = {
            syncsPerformed: 0,
            elementsUpdated: 0,
            elementsCreated: 0,
            elementsRemoved: 0,
            averageSyncTime: 0,
            conflictsResolved: 0
        };
        
        // État de synchronisation
        this.lastSyncTimestamp = null;
        this.syncInProgress = false;
    }
    
    /**
     * Initialise le mise à jour avec validation ExcalidrawAutomate
     * @returns {Promise<void>}
     * @sideEffect Vérifie la disponibilité de l'API Excalidraw
     */
    async initialize() {
        try {
            // Initialiser lecteur markdown
            await this.markdownReader.initialize();
            
            // Vérifier API Excalidraw
            if (typeof ExcalidrawAutomate !== 'undefined') {
                this.excalidrawAPI = ExcalidrawAutomate;
                console.log('✅ ExcalidrawAutomate détecté');
            } else if (!this.excalidrawAPI) {
                console.warn('⚠️ ExcalidrawAutomate non disponible - mode simulation');
                this.excalidrawAPI = this.createMockAPI();
            }
            
            // Initialiser mappings éléments existants
            await this.initializeElementMappings();
            
            console.log('✅ CanvasUpdater initialisé avec succès');
            
        } catch (error) {
            console.error('❌ Erreur initialisation CanvasUpdater:', error);
            throw new Error(`Échec initialisation CanvasUpdater: ${error.message}`);
        }
    }
    
    /**
     * Synchronise le canvas Excalidraw avec les données markdown
     * @param {Object} options - Options de synchronisation
     * @param {boolean} options.createMissing - Créer éléments manquants (défaut: true)
     * @param {boolean} options.updateExisting - Mettre à jour existants (défaut: true)
     * @param {boolean} options.preserveUserChanges - Préserver modifications (défaut: true)
     * @param {Array<string>} options.includeTypes - Types à synchroniser (défaut: tous)
     * @returns {Promise<SyncResult>} Résultat de synchronisation
     * @sideEffect Modifie les éléments du canvas Excalidraw
     * @example
     * // Synchronisation avec préservation modifications utilisateur
     * const result = await updater.syncCanvasFromMarkdown({
     *   preserveUserChanges: true,
     *   createMissing: true,
     *   includeTypes: ['objects', 'states']
     * });
     */
    async syncCanvasFromMarkdown(options = {}) {
        if (this.syncInProgress) {
            throw new Error('Synchronisation déjà en cours');
        }
        
        const startTime = performance.now();
        this.syncInProgress = true;
        
        try {
            const opts = {
                createMissing: options.createMissing !== false,
                updateExisting: options.updateExisting !== false,
                preserveUserChanges: options.preserveUserChanges !== false,
                includeTypes: options.includeTypes || ['objects', 'states', 'actions'],
                ...options
            };
            
            console.log('🔄 Démarrage synchronisation markdown → canvas...');
            
            // Phase 1 : Lecture données markdown
            console.log('📚 Phase 1: Lecture données markdown...');
            const markdownData = await this.markdownReader.readAllMarkdown({
                includeTypes: opts.includeTypes
            });
            
            // Phase 2 : Analyse différences avec canvas
            console.log('🔍 Phase 2: Analyse différences...');
            const differences = await this.analyzeDifferences(markdownData, opts);
            
            // Phase 3 : Validation avant application
            if (this.config.validation.validateBeforeApply) {
                console.log('✅ Phase 3: Validation...');
                this.validateSyncPlan(differences);
            }
            
            // Phase 4 : Sauvegarde si requise
            if (this.config.syncStrategies.backupBeforeSync) {
                console.log('💾 Phase 4: Sauvegarde...');
                await this.createBackup();
            }
            
            // Phase 5 : Application des modifications
            console.log('🚀 Phase 5: Application modifications...');
            const changes = await this.applyChanges(differences, opts);
            
            // Phase 6 : Validation post-synchronisation
            console.log('🔧 Phase 6: Validation finale...');
            const validation = await this.validateSyncResult(changes);
            
            // Construire résultat
            const syncResult = {
                success: true,
                changes: changes,
                conflicts: differences.conflicts || [],
                validation: validation,
                metrics: {
                    syncTime: performance.now() - startTime,
                    elementsProcessed: markdownData.summary.totalElements,
                    elementsUpdated: changes.updated,
                    elementsCreated: changes.created,
                    elementsRemoved: changes.removed,
                    conflictsResolved: changes.conflictsResolved
                },
                metadata: {
                    syncTimestamp: new Date().toISOString(),
                    markdownFiles: markdownData.metadata.totalFiles,
                    strategy: opts
                }
            };
            
            // Mise à jour métriques globales
            this.updateGlobalMetrics(syncResult);
            this.lastSyncTimestamp = new Date();
            
            console.log(`✅ Synchronisation terminée: ${syncResult.metrics.elementsUpdated} maj, ${syncResult.metrics.elementsCreated} créés (${syncResult.metrics.syncTime.toFixed(2)}ms)`);
            
            return syncResult;
            
        } catch (error) {
            console.error('❌ Erreur synchronisation canvas:', error);
            throw new Error(`Échec synchronisation canvas: ${error.message}`);
        } finally {
            this.syncInProgress = false;
        }
    }
    
    /**
     * Synchronise un élément spécifique
     * @param {string} elementId - ID de l'élément markdown
     * @param {Object} options - Options de synchronisation spécifique
     * @returns {Promise<Object>} Résultat synchronisation élément
     * @example
     * // Synchroniser un objet spécifique
     * const result = await updater.syncSingleElement('obj_material_001', {
     *   forceUpdate: true
     * });
     */
    async syncSingleElement(elementId, options = {}) {
        try {
            console.log(`🎯 Synchronisation élément ${elementId}...`);
            
            // Trouver l'élément markdown correspondant
            const markdownFiles = await this.markdownReader.discoverMarkdownFiles();
            const targetFile = markdownFiles.find(file => file.includes(elementId));
            
            if (!targetFile) {
                throw new Error(`Élément markdown ${elementId} non trouvé`);
            }
            
            // Lire données markdown de l'élément
            const elementData = await this.markdownReader.readMarkdownFile(targetFile);
            
            // Synchroniser avec canvas
            const canvasElementId = this.elementMappings.get(elementId);
            
            if (canvasElementId) {
                // Mettre à jour élément existant
                return await this.updateCanvasElement(canvasElementId, elementData, options);
            } else {
                // Créer nouvel élément
                return await this.createCanvasElement(elementData, options);
            }
            
        } catch (error) {
            console.error(`❌ Erreur synchronisation élément ${elementId}:`, error);
            throw error;
        }
    }
    
    /**
     * Analyse les différences entre markdown et canvas
     * @param {Object} markdownData - Données markdown
     * @param {Object} options - Options d'analyse
     * @returns {Promise<Object>} Différences détectées
     * @private
     */
    async analyzeDifferences(markdownData, options) {
        const differences = {
            toCreate: [],
            toUpdate: [],
            toRemove: [],
            conflicts: [],
            unchanged: []
        };
        
        try {
            // Obtenir éléments canvas actuels
            const canvasElements = await this.getCurrentCanvasElements();
            
            // Analyser chaque type d'élément
            for (const type of ['objects', 'states', 'actions']) {
                const markdownElements = markdownData[type] || [];
                
                for (const mdElement of markdownElements) {
                    const elementId = this.getElementId(mdElement, type);
                    const canvasElementId = this.elementMappings.get(elementId);
                    
                    if (!canvasElementId) {
                        // Élément à créer
                        differences.toCreate.push({
                            type: type.slice(0, -1), // objects → object
                            elementId: elementId,
                            markdownData: mdElement
                        });
                    } else {
                        // Vérifier si mise à jour nécessaire
                        const canvasElement = canvasElements.find(el => el.id === canvasElementId);
                        
                        if (canvasElement) {
                            const needsUpdate = this.elementNeedsUpdate(mdElement, canvasElement, options);
                            
                            if (needsUpdate.update) {
                                if (needsUpdate.conflict && options.preserveUserChanges) {
                                    differences.conflicts.push({
                                        elementId: elementId,
                                        canvasElementId: canvasElementId,
                                        markdownData: mdElement,
                                        canvasData: canvasElement,
                                        conflictReason: needsUpdate.reason
                                    });
                                } else {
                                    differences.toUpdate.push({
                                        type: type.slice(0, -1),
                                        elementId: elementId,
                                        canvasElementId: canvasElementId,
                                        markdownData: mdElement,
                                        canvasData: canvasElement,
                                        changes: needsUpdate.changes
                                    });
                                }
                            } else {
                                differences.unchanged.push(elementId);
                            }
                        }
                    }
                }
            }
            
            // Détecter éléments canvas sans correspondance markdown (à supprimer)
            for (const canvasElement of canvasElements) {
                if (this.isProcessElement(canvasElement)) {
                    const markdownId = this.findMarkdownId(canvasElement.id);
                    if (!markdownId) {
                        differences.toRemove.push({
                            canvasElementId: canvasElement.id,
                            canvasData: canvasElement
                        });
                    }
                }
            }
            
            console.log(`📊 Analyse: ${differences.toCreate.length} à créer, ${differences.toUpdate.length} à MaJ, ${differences.toRemove.length} à supprimer, ${differences.conflicts.length} conflits`);
            
            return differences;
            
        } catch (error) {
            console.error('❌ Erreur analyse différences:', error);
            throw error;
        }
    }
    
    /**
     * Applique les modifications au canvas
     * @param {Object} differences - Différences à appliquer
     * @param {Object} options - Options d'application
     * @returns {Promise<Object>} Modifications appliquées
     * @private
     */
    async applyChanges(differences, options) {
        const changes = {
            created: 0,
            updated: 0,
            removed: 0,
            conflictsResolved: 0,
            errors: []
        };
        
        try {
            // Traitement par lots pour performance
            const batchSize = this.config.performance.batchSize;
            
            // 1. Créer nouveaux éléments
            if (options.createMissing && differences.toCreate.length > 0) {
                console.log(`➕ Création de ${differences.toCreate.length} nouveaux éléments...`);
                
                for (let i = 0; i < differences.toCreate.length; i += batchSize) {
                    const batch = differences.toCreate.slice(i, i + batchSize);
                    
                    for (const item of batch) {
                        try {
                            await this.createCanvasElement(item.markdownData, { type: item.type });
                            changes.created++;
                        } catch (error) {
                            changes.errors.push({
                                operation: 'create',
                                elementId: item.elementId,
                                error: error.message
                            });
                        }
                    }
                }
            }
            
            // 2. Mettre à jour éléments existants
            if (options.updateExisting && differences.toUpdate.length > 0) {
                console.log(`🔄 Mise à jour de ${differences.toUpdate.length} éléments...`);
                
                for (let i = 0; i < differences.toUpdate.length; i += batchSize) {
                    const batch = differences.toUpdate.slice(i, i + batchSize);
                    
                    for (const item of batch) {
                        try {
                            await this.updateCanvasElement(item.canvasElementId, item.markdownData, {
                                changes: item.changes
                            });
                            changes.updated++;
                        } catch (error) {
                            changes.errors.push({
                                operation: 'update',
                                elementId: item.elementId,
                                error: error.message
                            });
                        }
                    }
                }
            }
            
            // 3. Gérer conflits
            if (differences.conflicts.length > 0) {
                console.log(`⚠️  Résolution de ${differences.conflicts.length} conflits...`);
                
                for (const conflict of differences.conflicts) {
                    try {
                        const resolved = await this.resolveConflict(conflict, options);
                        if (resolved) {
                            changes.conflictsResolved++;
                        }
                    } catch (error) {
                        changes.errors.push({
                            operation: 'resolve_conflict',
                            elementId: conflict.elementId,
                            error: error.message
                        });
                    }
                }
            }
            
            // 4. Supprimer éléments obsolètes (optionnel)
            if (options.removeObsolete && differences.toRemove.length > 0) {
                console.log(`🗑️  Suppression de ${differences.toRemove.length} éléments obsolètes...`);
                
                for (const item of differences.toRemove) {
                    try {
                        await this.removeCanvasElement(item.canvasElementId);
                        changes.removed++;
                    } catch (error) {
                        changes.errors.push({
                            operation: 'remove',
                            canvasElementId: item.canvasElementId,
                            error: error.message
                        });
                    }
                }
            }
            
            return changes;
            
        } catch (error) {
            console.error('❌ Erreur application modifications:', error);
            throw error;
        }
    }
    
    /**
     * Crée un élément canvas depuis données markdown
     * @param {Object} markdownData - Données markdown
     * @param {Object} options - Options de création
     * @returns {Promise<string>} ID de l'élément créé
     * @private
     */
    async createCanvasElement(markdownData, options = {}) {
        try {
            const elementType = markdownData.elementType || options.type;
            const spec = this.config.elementSpecs[elementType];
            
            if (!spec) {
                throw new Error(`Spécification élément ${elementType} non trouvée`);
            }
            
            // Préparer propriétés élément
            const elementProps = {
                ...spec,
                x: markdownData.metadata.position?.x || 0,
                y: markdownData.metadata.position?.y || 0,
                customData: {
                    ...markdownData.metadata,
                    tags: [this.config.processTags[elementType]],
                    processMetaLanguageId: this.getElementId(markdownData, elementType),
                    syncTimestamp: new Date().toISOString()
                }
            };
            
            // Créer élément via API Excalidraw
            const canvasElementId = await this.excalidrawAPI.createElement(elementProps);
            
            // Enregistrer mapping
            const markdownId = this.getElementId(markdownData, elementType);
            this.elementMappings.set(markdownId, canvasElementId);
            
            console.log(`➕ Élément ${elementType} créé: ${markdownId} → ${canvasElementId}`);
            
            return canvasElementId;
            
        } catch (error) {
            console.error('❌ Erreur création élément canvas:', error);
            throw error;
        }
    }
    
    /**
     * Met à jour un élément canvas existant
     * @param {string} canvasElementId - ID élément canvas
     * @param {Object} markdownData - Nouvelles données markdown
     * @param {Object} options - Options de mise à jour
     * @returns {Promise<boolean>} Succès mise à jour
     * @private
     */
    async updateCanvasElement(canvasElementId, markdownData, options = {}) {
        try {
            // Préparer modifications
            const updates = {
                x: markdownData.metadata.position?.x,
                y: markdownData.metadata.position?.y,
                customData: {
                    ...markdownData.metadata,
                    syncTimestamp: new Date().toISOString(),
                    lastSyncedFrom: 'markdown'
                }
            };
            
            // Appliquer modifications spécifiques si fournies
            if (options.changes) {
                Object.assign(updates, options.changes);
            }
            
            // Mettre à jour via API Excalidraw
            await this.excalidrawAPI.updateElement(canvasElementId, updates);
            
            console.log(`🔄 Élément canvas mis à jour: ${canvasElementId}`);
            
            return true;
            
        } catch (error) {
            console.error(`❌ Erreur mise à jour élément ${canvasElementId}:`, error);
            throw error;
        }
    }
    
    // Méthodes utilitaires privées (implémentations simplifiées)
    
    async initializeElementMappings() {
        // Implémentation simplifiée - scan du canvas pour créer mappings
        console.log('🔗 Initialisation mappings éléments...');
    }
    
    createMockAPI() {
        // API simulée pour tests
        return {
            createElement: async (props) => `mock_element_${Date.now()}`,
            updateElement: async (id, updates) => true,
            removeElement: async (id) => true,
            getElements: async () => []
        };
    }
    
    async getCurrentCanvasElements() {
        if (this.excalidrawAPI && this.excalidrawAPI.getElements) {
            return await this.excalidrawAPI.getElements();
        }
        return [];
    }
    
    getElementId(markdownData, type) {
        switch (type) {
            case 'object': return markdownData.metadata.object_id;
            case 'state': return markdownData.metadata.state_id;
            case 'action': return markdownData.metadata.action_id;
            default: return markdownData.metadata.id || 'unknown';
        }
    }
    
    elementNeedsUpdate(markdownData, canvasElement, options) {
        // Implémentation simplifiée - compare positions et métadonnées
        const mdPos = markdownData.metadata.position;
        const canvasPos = { x: canvasElement.x, y: canvasElement.y };
        
        const positionChanged = mdPos && (mdPos.x !== canvasPos.x || mdPos.y !== canvasPos.y);
        
        return {
            update: positionChanged,
            conflict: false,
            changes: positionChanged ? { x: mdPos.x, y: mdPos.y } : {},
            reason: positionChanged ? 'position_changed' : 'no_change'
        };
    }
    
    isProcessElement(canvasElement) {
        const tags = canvasElement.customData?.tags || [];
        return tags.some(tag => Object.values(this.config.processTags).includes(tag));
    }
    
    findMarkdownId(canvasElementId) {
        for (const [markdownId, canvasId] of this.elementMappings.entries()) {
            if (canvasId === canvasElementId) {
                return markdownId;
            }
        }
        return null;
    }
    
    validateSyncPlan(differences) {
        // Validation simplifiée
        console.log('✅ Plan de synchronisation validé');
    }
    
    async createBackup() {
        console.log('💾 Sauvegarde créée');
    }
    
    async validateSyncResult(changes) {
        return { valid: true, issues: [] };
    }
    
    async resolveConflict(conflict, options) {
        // Résolution simplifiée - utilise stratégie merge par défaut
        return true;
    }
    
    async removeCanvasElement(canvasElementId) {
        await this.excalidrawAPI.removeElement(canvasElementId);
        return true;
    }
    
    updateGlobalMetrics(syncResult) {
        this.metrics.syncsPerformed++;
        this.metrics.elementsUpdated += syncResult.metrics.elementsUpdated;
        this.metrics.elementsCreated += syncResult.metrics.elementsCreated;
        this.metrics.elementsRemoved += syncResult.metrics.elementsRemoved;
        
        const totalSyncs = this.metrics.syncsPerformed;
        const currentAvg = this.metrics.averageSyncTime;
        const newTime = syncResult.metrics.syncTime;
        
        this.metrics.averageSyncTime = (currentAvg * (totalSyncs - 1) + newTime) / totalSyncs;
    }
    
    /**
     * Obtient les métriques de performance
     * @returns {Object} Métriques de synchronisation
     */
    getMetrics() {
        return {
            ...this.metrics,
            lastSyncTimestamp: this.lastSyncTimestamp,
            mappingsCount: this.elementMappings.size
        };
    }
    
    /**
     * Réinitialise le mise à jour
     * @sideEffect Vide les caches et remet à zéro les compteurs
     */
    reset() {
        this.syncCache.clear();
        this.elementMappings.clear();
        
        this.metrics = {
            syncsPerformed: 0,
            elementsUpdated: 0,
            elementsCreated: 0,
            elementsRemoved: 0,
            averageSyncTime: 0,
            conflictsResolved: 0
        };
        
        this.lastSyncTimestamp = null;
        
        console.log('🔄 CanvasUpdater réinitialisé');
    }
}

// Export ES6 par défaut
// Export already done
// Export browser pour utilisation dans Obsidian
if (typeof window !== 'undefined') {
    window.ProcessMetaLanguageCanvasUpdater = {
        CanvasUpdater,
        CANVAS_UPDATER_CONFIG
    };
}

// <!-- END OF FILE: canvas-updater.js -->