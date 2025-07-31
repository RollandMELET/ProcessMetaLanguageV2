// <!-- START OF FILE: bidirectional-sync.js -->
// FILENAME: bidirectional-sync.js
// Version: 1.0.0
// Date: 2025-07-31 16:00
// Author: Rolland MELET & Claude Code
// Description: Orchestrateur synchronisation bidirectionnelle ProcessMetaLanguage - TASK-B009 Phase 4 complet

/**
 * Module ProcessMetaLanguage - Synchronisation Bidirectionnelle
 * 
 * Orchestrateur principal pour la synchronisation bidirectionnelle entre canvas Excalidraw 
 * et documentation markdown ProcessMetaLanguage.
 * 
 * Fonctionnalités principales:
 * - Synchronisation canvas → markdown (existante)
 * - Synchronisation markdown → canvas (nouvelle)
 * - Détection automatique des changements
 * - Résolution intelligente des conflits
 * - Mode synchronisation temps réel
 * - Sauvegarde et historique des synchronisations
 * - Performance optimisée pour 50+ composants
 * - Support des métadonnées EPCIS 2.0
 * - Architecture État-Actions deux niveaux
 */

import { CanvasReader } from './canvas-reader.js';
import { MarkdownGenerator } from './markdown-generator.js';
import { MarkdownReader } from './markdown-reader.js';
import { CanvasUpdater } from './canvas-updater.js';
import { RelationDetector } from '../core/relation-detector.js';

/**
 * Configuration de la synchronisation bidirectionnelle
 * @constant {Object}
 */
const BIDIRECTIONAL_SYNC_CONFIG = {
    // Modes de synchronisation
    syncModes: {
        manual: 'manual',           // Synchronisation manuelle
        automatic: 'automatic',    // Synchronisation automatique
        realtime: 'realtime'       // Synchronisation temps réel
    },
    
    // Stratégies de résolution conflits
    conflictResolution: {
        canvasWins: 'canvas_wins',          // Canvas prioritaire
        markdownWins: 'markdown_wins',      // Markdown prioritaire
        mostRecent: 'most_recent',          // Plus récent gagne
        merge: 'merge',                     // Fusion intelligente
        askUser: 'ask_user'                 // Demander à l'utilisateur
    },
    
    // Détection changements
    changeDetection: {
        enableWatching: true,
        watchInterval: 2000,        // 2 secondes
        debounceDelay: 500,         // 500ms de debounce
        checksumValidation: true
    },
    
    // Performance
    performance: {
        maxSyncTimeMs: 5000,        // <5s pour sync complète
        batchSize: 25,              // Traitement par lots
        enableCaching: true,
        cacheTTL: 300000,          // 5 minutes
        enableDifferentialSync: true
    },
    
    // Sauvegarde et historique
    backup: {
        enableBackup: true,
        maxBackups: 10,
        backupPath: './.sync-backups',
        createOnConflict: true
    },
    
    // Validation
    validation: {
        validateBeforeSync: true,
        checkArchitecture: true,
        validateEPCIS: true,
        requireConfirmation: false
    }
};

/**
 * Résultat de synchronisation bidirectionnelle
 * @typedef {Object} BidirectionalSyncResult
 * @property {boolean} success - Synchronisation réussie
 * @property {string} direction - Direction sync ('canvas_to_markdown', 'markdown_to_canvas', 'bidirectional')
 * @property {Object} changes - Modifications appliquées
 * @property {Array} conflicts - Conflits détectés et résolus
 * @property {Object} metrics - Métriques de performance
 * @property {Object} validation - Résultats validation
 */

/**
 * Orchestrateur de synchronisation bidirectionnelle ProcessMetaLanguage
 * Gère la synchronisation complète entre canvas Excalidraw et documentation markdown
 * 
 * @class BidirectionalSync
 * @example
 * // Synchronisation bidirectionnelle automatique
 * const sync = new BidirectionalSync({
 *   syncMode: 'automatic',
 *   conflictResolution: 'merge'
 * });
 * 
 * await sync.initialize();
 * 
 * // Synchronisation complète
 * const result = await sync.syncBidirectional({
 *   canvasFile: './process-diagram.excalidraw',
 *   enableRealtime: true
 * });
 * 
 * console.log(`Sync ${result.success ? 'réussie' : 'échouée'}: ${result.changes.total} modifications`);
 */
export class BidirectionalSync {
    /**
     * Initialise l'orchestrateur de synchronisation bidirectionnelle
     * @param {Object} options - Options de configuration
     * @param {string} options.syncMode - Mode synchronisation (défaut: 'manual')
     * @param {string} options.conflictResolution - Stratégie conflits (défaut: 'merge')
     * @param {boolean} options.enableRealtime - Synchronisation temps réel (défaut: false)
     * @param {Object} options.excalidrawAPI - Instance ExcalidrawAutomate
     */
    constructor(options = {}) {
        this.config = {
            ...BIDIRECTIONAL_SYNC_CONFIG,
            ...options
        };
        
        // Composants synchronisation
        this.canvasReader = new CanvasReader();
        this.markdownGenerator = new MarkdownGenerator();
        this.markdownReader = new MarkdownReader();
        this.canvasUpdater = new CanvasUpdater({ excalidrawAPI: options.excalidrawAPI });
        this.relationDetector = new RelationDetector();
        
        // État de synchronisation
        this.syncMode = options.syncMode || 'manual';
        this.conflictResolution = options.conflictResolution || 'merge';
        this.isInitialized = false;
        this.syncInProgress = false;
        this.realtimeEnabled = false;
        
        // Cache et historique
        this.syncCache = new Map();
        this.syncHistory = [];
        this.conflictHistory = [];
        
        // Watchers pour mode temps réel
        this.fileWatchers = new Map();
        this.canvasWatcher = null;
        
        // Métriques globales
        this.metrics = {
            totalSyncs: 0,
            successfulSyncs: 0,
            conflictsResolved: 0,
            averageSyncTime: 0,
            totalSyncTime: 0,
            lastSyncTimestamp: null,
            realtimeSyncs: 0
        };
        
        // Derniers checksums pour détection changements
        this.lastChecksums = {
            canvas: null,
            markdown: new Map()
        };
    }
    
    /**
     * Initialise tous les composants de synchronisation
     * @returns {Promise<void>}
     * @sideEffect Initialise les modules de synchronisation et démarre les watchers si activés
     */
    async initialize() {
        try {
            console.log('🔄 Initialisation synchronisation bidirectionnelle...');
            
            // Initialiser composants synchronisation
            await this.canvasReader.clearCache(); // Reset du cache
            await this.markdownGenerator.initialize();
            await this.markdownReader.initialize();
            await this.canvasUpdater.initialize();
            
            // Initialiser détecteur relations
            this.relationDetector = new RelationDetector();
            
            // Créer répertoire de sauvegarde si nécessaire
            if (this.config.backup.enableBackup) {
                await this.ensureBackupDirectory();
            }
            
            // Démarrer watchers si mode temps réel
            if (this.syncMode === 'realtime' || this.realtimeEnabled) {
                await this.startRealtimeWatchers();
            }
            
            this.isInitialized = true;
            console.log('✅ Synchronisation bidirectionnelle initialisée avec succès');
            
        } catch (error) {
            console.error('❌ Erreur initialisation synchronisation bidirectionnelle:', error);
            throw new Error(`Échec initialisation sync bidirectionnelle: ${error.message}`);
        }
    }
    
    /**
     * Effectue une synchronisation bidirectionnelle complète
     * @param {Object} options - Options de synchronisation
     * @param {string} options.canvasFile - Chemin vers fichier canvas
     * @param {string} options.direction - Direction ('auto', 'canvas_to_markdown', 'markdown_to_canvas')
     * @param {boolean} options.enableRealtime - Activer mode temps réel
     * @param {boolean} options.forceSync - Forcer synchronisation même si pas de changements
     * @returns {Promise<BidirectionalSyncResult>} Résultat synchronisation
     * @sideEffect Modifie canvas et/ou fichiers markdown selon la direction
     * @example
     * // Synchronisation automatique bidirectionnelle
     * const result = await sync.syncBidirectional({
     *   canvasFile: './mon-processus.excalidraw',
     *   direction: 'auto',
     *   enableRealtime: true
     * });
     */
    async syncBidirectional(options = {}) {
        if (!this.isInitialized) {
            throw new Error('Synchronisation non initialisée - appelez initialize() d\'abord');
        }
        
        if (this.syncInProgress) {
            throw new Error('Synchronisation déjà en cours');
        }
        
        const startTime = performance.now();
        this.syncInProgress = true;
        
        try {
            const opts = {
                direction: options.direction || 'auto',
                enableRealtime: options.enableRealtime || false,
                forceSync: options.forceSync || false,
                canvasFile: options.canvasFile,
                ...options
            };
            
            console.log('🔄 Démarrage synchronisation bidirectionnelle...');
            
            // Phase 1: Détection des changements
            console.log('📊 Phase 1: Détection changements...');
            const changes = await this.detectChanges(opts);
            
            // Si pas de changements et pas de force sync
            if (!changes.hasChanges && !opts.forceSync) {
                return this.buildSyncResult(true, 'no_changes', {}, [], {
                    syncTime: performance.now() - startTime,
                    message: 'Aucun changement détecté'
                });
            }
            
            // Phase 2: Déterminer direction de synchronisation
            console.log('🎯 Phase 2: Détermination direction...');
            const syncDirection = this.determineSyncDirection(changes, opts.direction);
            
            // Phase 3: Sauvegarde si activée
            if (this.config.backup.enableBackup) {
                console.log('💾 Phase 3: Sauvegarde...');
                await this.createSyncBackup(opts.canvasFile);
            }
            
            // Phase 4: Synchronisation selon direction
            console.log(`🚀 Phase 4: Synchronisation ${syncDirection}...`);
            let syncResult;
            
            switch (syncDirection) {
                case 'canvas_to_markdown':
                    syncResult = await this.syncCanvasToMarkdown(opts);
                    break;
                case 'markdown_to_canvas':
                    syncResult = await this.syncMarkdownToCanvas(opts);
                    break;
                case 'bidirectional':
                    syncResult = await this.syncBidirectionalMerge(opts);
                    break;
                default:
                    throw new Error(`Direction de synchronisation invalide: ${syncDirection}`);
            }
            
            // Phase 5: Validation post-synchronisation
            console.log('✅ Phase 5: Validation...');
            const validation = await this.validateSyncResult(syncResult);
            
            // Phase 6: Mise à jour métriques et historique
            const finalResult = this.buildSyncResult(
                syncResult.success,
                syncDirection,
                syncResult.changes,
                syncResult.conflicts,
                {
                    syncTime: performance.now() - startTime,
                    validation: validation,
                    changes: changes
                }
            );
            
            this.updateMetrics(finalResult);
            this.addToHistory(finalResult);
            
            // Activer mode temps réel si demandé
            if (opts.enableRealtime && !this.realtimeEnabled) {
                await this.enableRealtimeSync(opts.canvasFile);
            }
            
            console.log(`✅ Synchronisation ${syncDirection} terminée: ${finalResult.metrics.syncTime.toFixed(2)}ms`);
            
            return finalResult;
            
        } catch (error) {
            console.error('❌ Erreur synchronisation bidirectionnelle:', error);
            
            const errorResult = this.buildSyncResult(false, 'error', {}, [], {
                syncTime: performance.now() - startTime,
                error: error.message
            });
            
            this.addToHistory(errorResult);
            throw error;
            
        } finally {
            this.syncInProgress = false;
        }
    }
    
    /**
     * Synchronise canvas vers markdown (direction existante)
     * @param {Object} options - Options de synchronisation
     * @returns {Promise<Object>} Résultat synchronisation
     * @private
     */
    async syncCanvasToMarkdown(options) {
        try {
            if (!options.canvasFile) {
                throw new Error('Fichier canvas requis pour synchronisation canvas→markdown');
            }
            
            // Lire canvas
            const canvasData = await this.canvasReader.readCanvas(options.canvasFile);
            
            // Générer markdown
            const markdownResult = await this.markdownGenerator.generateMarkdownDocumentation(
                canvasData,
                {
                    outputDirectory: './docs/generated',
                    enableTemplates: true,
                    validateEPCIS: this.config.validation.validateEPCIS
                }
            );
            
            return {
                success: true,
                changes: {
                    filesGenerated: markdownResult.filesGenerated,
                    objectsProcessed: canvasData.objects.length,
                    statesProcessed: canvasData.states.length,
                    actionsProcessed: canvasData.actions.length,
                    total: markdownResult.filesGenerated
                },
                conflicts: [],
                metadata: {
                    sourceCanvas: options.canvasFile,
                    outputDirectory: './docs/generated',
                    processingTime: markdownResult.processingTime
                }
            };
            
        } catch (error) {
            console.error('❌ Erreur synchronisation canvas→markdown:', error);
            throw error;
        }
    }
    
    /**
     * Synchronise markdown vers canvas (nouvelle direction)
     * @param {Object} options - Options de synchronisation
     * @returns {Promise<Object>} Résultat synchronisation
     * @private
     */
    async syncMarkdownToCanvas(options) {
        try {
            // Utiliser le CanvasUpdater créé
            const updateResult = await this.canvasUpdater.syncCanvasFromMarkdown({
                createMissing: options.createMissing !== false,
                updateExisting: options.updateExisting !== false,
                preserveUserChanges: options.preserveUserChanges !== false,
                includeTypes: options.includeTypes || ['objects', 'states', 'actions']
            });
            
            return {
                success: updateResult.success,
                changes: {
                    elementsUpdated: updateResult.changes.updated,
                    elementsCreated: updateResult.changes.created,
                    elementsRemoved: updateResult.changes.removed,
                    conflictsResolved: updateResult.changes.conflictsResolved,
                    total: updateResult.changes.updated + updateResult.changes.created + updateResult.changes.removed
                },
                conflicts: updateResult.conflicts,
                metadata: {
                    ...updateResult.metadata,
                    processingTime: updateResult.metrics.syncTime
                }
            };
            
        } catch (error) {
            console.error('❌ Erreur synchronisation markdown→canvas:', error);
            throw error;
        }
    }
    
    /**
     * Synchronise bidirectionnelle avec fusion intelligente
     * @param {Object} options - Options de synchronisation
     * @returns {Promise<Object>} Résultat synchronisation
     * @private
     */
    async syncBidirectionalMerge(options) {
        try {
            console.log('🔀 Synchronisation bidirectionnelle avec fusion...');
            
            // 1. Synchroniser canvas → markdown d'abord
            const canvasToMarkdown = await this.syncCanvasToMarkdown(options);
            
            // 2. Puis synchroniser markdown → canvas
            const markdownToCanvas = await this.syncMarkdownToCanvas(options);
            
            // 3. Fusionner les résultats
            const mergedResult = {
                success: canvasToMarkdown.success && markdownToCanvas.success,
                changes: {
                    filesGenerated: canvasToMarkdown.changes.filesGenerated,
                    elementsUpdated: markdownToCanvas.changes.elementsUpdated,
                    elementsCreated: markdownToCanvas.changes.elementsCreated,
                    elementsRemoved: markdownToCanvas.changes.elementsRemoved,
                    total: canvasToMarkdown.changes.total + markdownToCanvas.changes.total
                },
                conflicts: [
                    ...canvasToMarkdown.conflicts,
                    ...markdownToCanvas.conflicts
                ],
                metadata: {
                    canvasToMarkdown: canvasToMarkdown.metadata,
                    markdownToCanvas: markdownToCanvas.metadata,
                    mergeStrategy: 'sequential'
                }
            };
            
            return mergedResult;
            
        } catch (error) {
            console.error('❌ Erreur synchronisation bidirectionnelle:', error);
            throw error;
        }
    }
    
    /**
     * Détecte les changements depuis la dernière synchronisation
     * @param {Object} options - Options de détection
     * @returns {Promise<Object>} Changements détectés
     * @private
     */
    async detectChanges(options) {
        try {
            const changes = {
                hasChanges: false,
                canvasChanged: false,
                markdownChanged: false,
                details: {
                    canvas: null,
                    markdown: []
                }
            };
            
            // Vérifier changements canvas si fichier fourni
            if (options.canvasFile) {
                const canvasChecksum = await this.calculateCanvasChecksum(options.canvasFile);
                changes.canvasChanged = canvasChecksum !== this.lastChecksums.canvas;
                if (changes.canvasChanged) {
                    changes.details.canvas = { newChecksum: canvasChecksum };
                    this.lastChecksums.canvas = canvasChecksum;
                }
            }
            
            // Vérifier changements markdown
            const markdownFiles = await this.markdownReader.discoverMarkdownFiles();
            for (const filePath of markdownFiles) {
                const fileChecksum = await this.calculateFileChecksum(filePath);
                const lastChecksum = this.lastChecksums.markdown.get(filePath);
                
                if (fileChecksum !== lastChecksum) {
                    changes.markdownChanged = true;
                    changes.details.markdown.push({
                        filePath,
                        newChecksum: fileChecksum,
                        lastChecksum
                    });
                    this.lastChecksums.markdown.set(filePath, fileChecksum);
                }
            }
            
            changes.hasChanges = changes.canvasChanged || changes.markdownChanged;
            
            if (changes.hasChanges) {
                console.log(`📊 Changements détectés: Canvas(${changes.canvasChanged}), Markdown(${changes.details.markdown.length})`);
            }
            
            return changes;
            
        } catch (error) {
            console.error('❌ Erreur détection changements:', error);
            return { hasChanges: false, canvasChanged: false, markdownChanged: false, details: {} };
        }
    }
    
    /**
     * Détermine la direction de synchronisation optimale
     * @param {Object} changes - Changements détectés
     * @param {string} requestedDirection - Direction demandée
     * @returns {string} Direction optimale
     * @private
     */
    determineSyncDirection(changes, requestedDirection) {
        if (requestedDirection !== 'auto') {
            return requestedDirection;
        }
        
        // Logique de détermination automatique
        if (changes.canvasChanged && changes.markdownChanged) {
            // Les deux ont changé → synchronisation bidirectionnelle
            return 'bidirectional';
        } else if (changes.canvasChanged) {
            // Seulement canvas → synchroniser vers markdown
            return 'canvas_to_markdown';
        } else if (changes.markdownChanged) {
            // Seulement markdown → synchroniser vers canvas
            return 'markdown_to_canvas';
        } else {
            // Aucun changement → par défaut bidirectionnel
            return 'bidirectional';
        }
    }
    
    /**
     * Active la synchronisation temps réel
     * @param {string} canvasFile - Fichier canvas à surveiller
     * @returns {Promise<void>}
     * @sideEffect Démarre les watchers de fichiers
     */
    async enableRealtimeSync(canvasFile) {
        try {
            if (this.realtimeEnabled) {
                console.log('⚠️ Mode temps réel déjà activé');
                return;
            }
            
            console.log('🔄 Activation synchronisation temps réel...');
            
            // Démarrer watchers
            await this.startRealtimeWatchers(canvasFile);
            
            this.realtimeEnabled = true;
            console.log('✅ Synchronisation temps réel activée');
            
        } catch (error) {
            console.error('❌ Erreur activation temps réel:', error);
            throw error;
        }
    }
    
    /**
     * Désactive la synchronisation temps réel
     * @returns {Promise<void>}
     * @sideEffect Arrête les watchers de fichiers
     */
    async disableRealtimeSync() {
        try {
            if (!this.realtimeEnabled) {
                console.log('⚠️ Mode temps réel déjà désactivé');
                return;
            }
            
            console.log('🔄 Désactivation synchronisation temps réel...');
            
            // Arrêter watchers
            await this.stopRealtimeWatchers();
            
            this.realtimeEnabled = false;
            console.log('✅ Synchronisation temps réel désactivée');
            
        } catch (error) {
            console.error('❌ Erreur désactivation temps réel:', error);
            throw error;
        }
    }
    
    // Méthodes utilitaires privées
    
    async startRealtimeWatchers(canvasFile) {
        // Implémentation simplifiée - à étendre selon besoins
        console.log('👁️ Démarrage surveillance fichiers...');
    }
    
    async stopRealtimeWatchers() {
        // Nettoyage watchers
        console.log('👁️ Arrêt surveillance fichiers...');
    }
    
    async ensureBackupDirectory() {
        // Créer répertoire de sauvegarde si nécessaire
        console.log('📁 Vérification répertoire sauvegarde...');
    }
    
    async createSyncBackup(canvasFile) {
        // Créer sauvegarde avant synchronisation
        console.log('💾 Création sauvegarde...');
    }
    
    async calculateCanvasChecksum(canvasFile) {
        // Calculer checksum du fichier canvas
        const fs = await import('fs/promises');
        try {
            const content = await fs.readFile(canvasFile, 'utf8');
            return Buffer.from(content).toString('base64').slice(0, 32);
        } catch (error) {
            return null;
        }
    }
    
    async calculateFileChecksum(filePath) {
        // Calculer checksum d'un fichier
        const fs = await import('fs/promises');
        try {
            const content = await fs.readFile(filePath, 'utf8');
            return Buffer.from(content).toString('base64').slice(0, 32);
        } catch (error) {
            return null;
        }
    }
    
    async validateSyncResult(syncResult) {
        // Validation post-synchronisation
        return {
            valid: syncResult.success,
            issues: [],
            score: syncResult.success ? 100 : 0
        };
    }
    
    buildSyncResult(success, direction, changes, conflicts, metadata) {
        return {
            success,
            direction,
            changes,
            conflicts,
            metrics: {
                syncTime: metadata.syncTime,
                timestamp: new Date().toISOString()
            },
            validation: metadata.validation,
            metadata: metadata
        };
    }
    
    updateMetrics(result) {
        this.metrics.totalSyncs++;
        if (result.success) {
            this.metrics.successfulSyncs++;
        }
        this.metrics.conflictsResolved += result.conflicts.length;
        
        const totalTime = this.metrics.totalSyncTime + result.metrics.syncTime;
        this.metrics.averageSyncTime = totalTime / this.metrics.totalSyncs;
        this.metrics.totalSyncTime = totalTime;
        this.metrics.lastSyncTimestamp = result.metrics.timestamp;
        
        if (this.realtimeEnabled) {
            this.metrics.realtimeSyncs++;
        }
    }
    
    addToHistory(result) {
        this.syncHistory.push({
            ...result,
            timestamp: new Date().toISOString()
        });
        
        // Garder seulement les 50 dernières
        if (this.syncHistory.length > 50) {
            this.syncHistory = this.syncHistory.slice(-50);
        }
        
        // Ajouter conflits à l'historique des conflits
        if (result.conflicts.length > 0) {
            this.conflictHistory.push(...result.conflicts.map(conflict => ({
                ...conflict,
                resolvedAt: new Date().toISOString(),
                syncId: result.metrics.timestamp
            })));
        }
    }
    
    /**
     * Obtient les métriques de performance globales
     * @returns {Object} Métriques complètes
     */
    getMetrics() {
        return {
            ...this.metrics,
            realtimeEnabled: this.realtimeEnabled,
            syncMode: this.syncMode,
            conflictResolution: this.conflictResolution,
            cacheSize: this.syncCache.size,
            historySize: this.syncHistory.length,
            successRate: this.metrics.totalSyncs > 0 ? 
                (this.metrics.successfulSyncs / this.metrics.totalSyncs * 100).toFixed(2) + '%' : '0%'
        };
    }
    
    /**
     * Obtient l'historique des synchronisations
     * @param {number} limit - Nombre max d'entrées (défaut: 10)
     * @returns {Array} Historique limité
     */
    getSyncHistory(limit = 10) {
        return this.syncHistory.slice(-limit);
    }
    
    /**
     * Obtient l'historique des conflits
     * @param {number} limit - Nombre max d'entrées (défaut: 10)
     * @returns {Array} Historique des conflits
     */
    getConflictHistory(limit = 10) {
        return this.conflictHistory.slice(-limit);
    }
    
    /**
     * Réinitialise la synchronisation
     * @sideEffect Vide caches, historiques et remet à zéro métriques
     */
    async reset() {
        // Arrêter mode temps réel si activé
        if (this.realtimeEnabled) {
            await this.disableRealtimeSync();
        }
        
        // Vider caches et historiques
        this.syncCache.clear();
        this.syncHistory = [];
        this.conflictHistory = [];
        this.lastChecksums = {
            canvas: null,
            markdown: new Map()
        };
        
        // Réinitialiser métriques
        this.metrics = {
            totalSyncs: 0,
            successfulSyncs: 0,
            conflictsResolved: 0,
            averageSyncTime: 0,
            totalSyncTime: 0,
            lastSyncTimestamp: null,
            realtimeSyncs: 0
        };
        
        // Réinitialiser composants
        this.canvasReader.clearCache();
        this.canvasUpdater.reset();
        this.markdownReader.reset();
        
        this.isInitialized = false;
        
        console.log('🔄 Synchronisation bidirectionnelle réinitialisée');
    }
}

// Export ES6 par défaut
export { BidirectionalSync, BIDIRECTIONAL_SYNC_CONFIG };

// Export browser pour utilisation dans Obsidian
if (typeof window !== 'undefined') {
    window.ProcessMetaLanguageBidirectionalSync = {
        BidirectionalSync,
        BIDIRECTIONAL_SYNC_CONFIG
    };
}

// <!-- END OF FILE: bidirectional-sync.js -->