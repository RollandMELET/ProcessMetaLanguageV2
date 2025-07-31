// <!-- START OF FILE: watchers-integration.js -->
// FILENAME: watchers-integration.js
// Version: 1.0.0
// Date: 2025-07-31 17:50
// Author: Rolland MELET & Claude Code
// Description: Exemples intégration watchers ProcessMetaLanguage - TASK-B011 Phase 4 surveillance unifiée

/**
 * Module ProcessMetaLanguage - Watchers Integration Examples
 * 
 * Exemples d'intégration des systèmes de surveillance ProcessMetaLanguage.
 * Montre comment utiliser FileWatcher et CanvasWatcher ensemble pour une surveillance unifiée.
 * 
 * Exemples fournis:
 * 1. Surveillance unifiée avec synchronisation automatique
 * 2. Mode temps réel avec détection instantanée
 * 3. Surveillance sélective par type de changement
 * 4. Intégration avec système de synchronisation bidirectionnelle
 * 5. Surveillance avec cache et optimisations
 * 6. Monitoring et métriques unifiées
 * 7. Gestion avancée des conflits et résolution
 */

import { FileWatcher } from '../watchers/file-watcher.js';
import { CanvasWatcher } from '../watchers/canvas-watcher.js';
import { BidirectionalSync } from '../sync/bidirectional-sync.js';

/**
 * Exemple 1: Surveillance unifiée avec synchronisation automatique
 * Démonstration de surveillance complète fichiers + canvas avec sync auto
 */
export async function example1_UnifiedWatchingWithAutoSync() {
    console.log('\n=== EXEMPLE 1: Surveillance Unifiée avec Synchronisation Automatique ===\n');
    
    try {
        // Initialiser les watchers
        const fileWatcher = new FileWatcher({
            debounceDelay: 500,
            autoSync: true,
            includePatterns: ['**/*.md', '**/*.excalidraw']
        });
        
        const canvasWatcher = new CanvasWatcher({
            pollingInterval: 1000,
            autoSync: true,
            debounceDelay: 800
        });
        
        // Initialiser synchronisation bidirectionnelle
        const bidirectionalSync = new BidirectionalSync({
            enableCache: true,
            conflictResolution: 'merge'
        });
        
        // Initialiser tous les composants
        await fileWatcher.initialize();
        await canvasWatcher.initialize();
        await bidirectionalSync.initialize();
        
        // Callback de synchronisation unifiée
        const unifiedSyncCallback = async (changes) => {
            console.log(`🔄 Synchronisation déclenchée par ${changes.length} changements`);
            
            try {
                // Déterminer type de changements
                const fileChanges = changes.filter(c => c.filePath);
                const canvasChanges = changes.filter(c => c.canvasId);
                
                let result = { success: true, results: [] };
                
                // Synchroniser changements fichiers
                if (fileChanges.length > 0) {
                    console.log(`📁 Synchronisation ${fileChanges.length} changements fichiers`);
                    const fileResult = await bidirectionalSync.syncMarkdownToCanvas({
                        files: fileChanges.map(c => c.filePath),
                        mode: 'incremental'
                    });
                    result.results.push({ type: 'file_to_canvas', ...fileResult });
                }
                
                // Synchroniser changements canvas
                if (canvasChanges.length > 0) {
                    console.log(`🎯 Synchronisation ${canvasChanges.length} changements canvas`);
                    const canvasResult = await bidirectionalSync.syncCanvasToMarkdown({
                        canvases: canvasChanges.map(c => c.canvasId),
                        mode: 'incremental'
                    });
                    result.results.push({ type: 'canvas_to_markdown', ...canvasResult });
                }
                
                console.log('✅ Synchronisation unifiée terminée avec succès');
                return result;
                
            } catch (error) {
                console.error('❌ Erreur synchronisation unifiée:', error);
                throw error;
            }
        };
        
        // Démarrer surveillance fichiers
        await fileWatcher.startWatching([
            './docs/generated',
            './templates',
            './examples'
        ], {
            syncCallback: unifiedSyncCallback
        });
        
        // Démarrer surveillance canvas
        await canvasWatcher.startWatching([
            'main-canvas',
            'draft-canvas'
        ], {
            syncCallback: unifiedSyncCallback
        });
        
        // Écouter événements unifiés
        fileWatcher.on('fileChanged', (event) => {
            console.log(`📁 Fichier modifié: ${event.filePath} (${event.type})`);
        });
        
        canvasWatcher.on('canvasChanged', (event) => {
            console.log(`🎯 Canvas modifié: ${event.canvasId} - ${event.type}`);
        });
        
        // Surveillance active
        console.log('🚀 Surveillance unifiée active - changements synchronisés automatiquement');
        
        // Simulation d'utilisation
        setTimeout(() => {
            console.log('\n📊 Métriques de surveillance:');
            console.log('Fichiers surveillés:', fileWatcher.getMetrics());
            console.log('Canvas surveillés:', canvasWatcher.getMetrics());
        }, 5000);
        
        return {
            fileWatcher,
            canvasWatcher,
            bidirectionalSync,
            stop: async () => {
                await fileWatcher.stopWatching();
                await canvasWatcher.stopWatching();
                console.log('✅ Surveillance unifiée arrêtée');
            }
        };
        
    } catch (error) {
        console.error('❌ Erreur exemple surveillance unifiée:', error);
        throw error;
    }
}

/**
 * Exemple 2: Mode temps réel avec détection instantanée
 * Configuration optimisée pour réactivité maximale
 */
export async function example2_RealTimeMode() {
    console.log('\n=== EXEMPLE 2: Mode Temps Réel avec Détection Instantanée ===\n');
    
    try {
        // Configuration temps réel optimisée
        const fileWatcher = new FileWatcher({
            debounceDelay: 100,        // Debounce minimal
            batchSize: 1,              // Pas de batching
            autoSync: true
        });
        
        const canvasWatcher = new CanvasWatcher({
            pollingInterval: 250,      // Polling très fréquent
            debounceDelay: 150,        // Debounce minimal
            enableEventListening: true // Événements temps réel si disponible
        });
        
        await fileWatcher.initialize();
        await canvasWatcher.initialize();
        
        // Callback de sync temps réel
        const realtimeSyncCallback = async (changes) => {
            const startTime = Date.now();
            console.log(`⚡ SYNC TEMPS RÉEL: ${changes.length} changements`);
            
            // Synchronisation immédiate optimisée
            for (const change of changes) {
                if (change.filePath) {
                    console.log(`📁 Sync immédiate fichier: ${change.filePath}`);
                } else if (change.canvasId) {
                    console.log(`🎯 Sync immédiate canvas: ${change.canvasId}`);
                }
            }
            
            const duration = Date.now() - startTime;
            console.log(`✅ Sync temps réel terminée en ${duration}ms`);
            
            return { success: true, duration };
        };
        
        // Démarrer surveillance temps réel
        await fileWatcher.startWatching(['./live-docs'], {
            syncCallback: realtimeSyncCallback
        });
        
        await canvasWatcher.startWatching(['realtime-canvas'], {
            syncCallback: realtimeSyncCallback
        });
        
        // Listeners pour feedback immédiat
        fileWatcher.on('fileChanged', (event) => {
            console.log(`⚡ [${new Date().toLocaleTimeString()}] Fichier: ${event.filePath}`);
        });
        
        canvasWatcher.on('canvasChanged', (event) => {
            console.log(`⚡ [${new Date().toLocaleTimeString()}] Canvas: ${event.canvasId}`);
        });
        
        console.log('⚡ Mode temps réel activé - latence minimale');
        
        return { fileWatcher, canvasWatcher };
        
    } catch (error) {
        console.error('❌ Erreur mode temps réel:', error);
        throw error;
    }
}

/**
 * Exemple 3: Surveillance sélective par type de changement
 * Réaction différenciée selon le type de changement détecté
 */
export async function example3_SelectiveWatching() {
    console.log('\n=== EXEMPLE 3: Surveillance Sélective par Type de Changement ===\n');
    
    try {
        const fileWatcher = new FileWatcher();
        const canvasWatcher = new CanvasWatcher();
        
        await fileWatcher.initialize();
        await canvasWatcher.initialize();
        
        // Handlers spécialisés par type de changement
        const selectiveSyncCallback = async (changes) => {
            const handlers = {
                'markdown': async (changes) => {
                    console.log(`📝 Traitement spécialisé ${changes.length} changements markdown`);
                    // Logique spécifique markdown
                },
                'canvas': async (changes) => {
                    console.log(`🎨 Traitement spécialisé ${changes.length} changements canvas`) ;
                    // Logique spécifique canvas
                },
                'template': async (changes) => {
                    console.log(`📋 Traitement spécialisé ${changes.length} changements template`);
                    // Logique spécifique templates
                }
            };
            
            // Grouper par type
            const groupedChanges = new Map();
            for (const change of changes) {
                const type = change.fileType || change.elementType || 'generic';
                if (!groupedChanges.has(type)) {
                    groupedChanges.set(type, []);
                }
                groupedChanges.get(type).push(change);
            }
            
            // Traiter chaque groupe avec handler spécialisé
            for (const [type, typeChanges] of groupedChanges.entries()) {
                const handler = handlers[type] || handlers.generic;
                if (handler) {
                    await handler(typeChanges);
                }
            }
            
            return { success: true, handledTypes: Array.from(groupedChanges.keys()) };
        };
        
        // Démarrer surveillance sélective
        await fileWatcher.startWatching([
            './docs',
            './templates'
        ], {
            syncCallback: selectiveSyncCallback
        });
        
        await canvasWatcher.startWatching(['selective-canvas'], {
            syncCallback: selectiveSyncCallback
        });
        
        // Écouters spécialisés
        fileWatcher.on('markdownChanged', (events) => {
            console.log(`📝 Changements markdown détectés: ${events.length}`);
        });
        
        fileWatcher.on('templateChanged', (events) => {
            console.log(`📋 Changements template détectés: ${events.length}`);
        });
        
        canvasWatcher.on('elementsAdded', (events) => {
            console.log(`➕ Éléments ajoutés: ${events.length}`);
        });
        
        canvasWatcher.on('elementsModified', (events) => {
            console.log(`✏️ Éléments modifiés: ${events.length}`);
        });
        
        canvasWatcher.on('relationsChanged', (events) => {
            console.log(`🔗 Relations modifiées: ${events.length}`);
        });
        
        console.log('🎯 Surveillance sélective active - handlers spécialisés par type');
        
        return { fileWatcher, canvasWatcher };
        
    } catch (error) {
        console.error('❌ Erreur surveillance sélective:', error);
        throw error;
    }
}

/**
 * Exemple 4: Intégration complète avec système de synchronisation bidirectionnelle
 * Intégration profonde avec tous les composants de synchronisation
 */
export async function example4_FullBidirectionalIntegration() {
    console.log('\n=== EXEMPLE 4: Intégration Complète Synchronisation Bidirectionnelle ===\n');
    
    try {
        // Composants complets
        const fileWatcher = new FileWatcher({
            enableCache: true,
            debounceDelay: 600
        });
        
        const canvasWatcher = new CanvasWatcher({
            enableDeepAnalysis: true,
            pollingInterval: 800
        });
        
        const bidirectionalSync = new BidirectionalSync({
            enablePerformanceOptimization: true,
            enableConflictResolution: true,
            enableValidation: true
        });
        
        // Initialisation complète
        await fileWatcher.initialize();
        await canvasWatcher.initialize();
        await bidirectionalSync.initialize();
        
        // Intégration profonde avec callback sophistiqué
        const fullIntegrationCallback = async (changes) => {
            console.log(`🔄 Synchronisation bidirectionnelle complète: ${changes.length} changements`);
            
            try {
                // Phase 1: Analyse des changements
                const analysis = await bidirectionalSync.analyzeChanges(changes);
                console.log(`📊 Analyse: ${analysis.conflictsDetected} conflits, ${analysis.optimizationsAvailable} optimisations`);
                
                // Phase 2: Résolution des conflits si nécessaire
                if (analysis.conflictsDetected > 0) {
                    console.log('🔧 Résolution des conflits...');
                    await bidirectionalSync.resolveConflicts(analysis.conflicts);
                }
                
                // Phase 3: Synchronisation optimisée
                const syncResult = await bidirectionalSync.syncBidirectional({
                    changes: changes,
                    enableOptimizations: true,
                    enableValidation: true
                });
                
                // Phase 4: Validation post-sync
                if (syncResult.success) {
                    console.log(`✅ Sync réussie: ${syncResult.itemsSynced} items synchronisés`);
                    
                    // Validation automatique
                    const validation = await bidirectionalSync.validateSyncResult(syncResult);
                    if (!validation.isValid) {
                        console.warn('⚠️ Validation post-sync échouée:', validation.issues);
                    }
                } else {
                    console.error('❌ Échec synchronisation:', syncResult.errors);
                }
                
                return syncResult;
                
            } catch (error) {
                console.error('❌ Erreur intégration bidirectionnelle:', error);
                throw error;
            }
        };
        
        // Démarrer surveillance intégrée
        await fileWatcher.startWatching([
            './docs/generated',
            './templates/user-templates'
        ], {
            syncCallback: fullIntegrationCallback
        });
        
        await canvasWatcher.startWatching([
            'main-process-canvas',
            'template-canvas'
        ], {
            syncCallback: fullIntegrationCallback
        });
        
        // Monitoring intégré
        const monitoringInterval = setInterval(() => {
            const fileMetrics = fileWatcher.getMetrics();
            const canvasMetrics = canvasWatcher.getMetrics();
            const syncMetrics = bidirectionalSync.getMetrics();
            
            console.log('\n📊 Métriques Intégration Complète:');
            console.log(`- Fichiers surveillés: ${fileMetrics.status.pathsWatched}`);
            console.log(`- Canvas surveillés: ${canvasMetrics.status.canvasesWatched}`);
            console.log(`- Syncs réussies: ${syncMetrics.successfulSyncs}/${syncMetrics.totalSyncs}`);
            console.log(`- Performance moyenne: ${syncMetrics.averageTime}ms`);
        }, 10000);
        
        console.log('🚀 Intégration bidirectionnelle complète active');
        
        return {
            fileWatcher,
            canvasWatcher,
            bidirectionalSync,
            stopMonitoring: () => clearInterval(monitoringInterval)
        };
        
    } catch (error) {
        console.error('❌ Erreur intégration complète:', error);
        throw error;
    }
}

/**
 * Exemple 5: Surveillance avec cache et optimisations avancées
 * Configuration haute performance avec cache multi-niveaux
 */
export async function example5_CachedWatchingWithOptimizations() {
    console.log('\n=== EXEMPLE 5: Surveillance avec Cache et Optimisations Avancées ===\n');
    
    try {
        // Configuration optimisée avec cache
        const fileWatcher = new FileWatcher({
            enableCache: true,
            cacheSize: 1000,
            compressionEnabled: true,
            debounceDelay: 400
        });
        
        const canvasWatcher = new CanvasWatcher({
            enableCache: true,
            maxStates: 100,
            compressionEnabled: true,
            pollingInterval: 1200
        });
        
        await fileWatcher.initialize();
        await canvasWatcher.initialize();
        
        // Callback avec optimisations cache
        const cachedSyncCallback = async (changes) => {
            const startTime = Date.now();
            console.log(`⚡ Sync avec cache: ${changes.length} changements`);
            
            // Vérifier cache avant sync
            const cacheHits = changes.filter(change => {
                // Logique de vérification cache simplifiée
                return Math.random() > 0.7; // 30% cache hit simulé
            });
            
            const actualChanges = changes.filter(change => !cacheHits.includes(change));
            
            console.log(`💾 Cache: ${cacheHits.length} hits, ${actualChanges.length} à synchroniser`);
            
            // Synchroniser seulement les changements non cachés
            if (actualChanges.length > 0) {
                // Simulation sync optimisée
                await new Promise(resolve => setTimeout(resolve, actualChanges.length * 10));
                console.log(`✅ Sync optimisée terminée: ${actualChanges.length} items`);
            }
            
            const duration = Date.now() - startTime;
            const savings = cacheHits.length * 50; // Économie estimée en ms
            
            console.log(`⚡ Optimisation: ${duration}ms (économie: ${savings}ms grâce au cache)`);
            
            return {
                success: true,
                itemsSynced: actualChanges.length,
                cacheHits: cacheHits.length,
                timeSaved: savings
            };
        };
        
        // Démarrer surveillance optimisée
        await fileWatcher.startWatching(['./cached-docs'], {
            syncCallback: cachedSyncCallback
        });
        
        await canvasWatcher.startWatching(['cached-canvas'], {
            syncCallback: cachedSyncCallback
        });
        
        // Monitoring des performances cache
        let totalTimeSaved = 0;
        let totalCacheHits = 0;
        
        fileWatcher.on('syncTriggered', (result) => {
            if (result.result.timeSaved) {
                totalTimeSaved += result.result.timeSaved;
                totalCacheHits += result.result.cacheHits;
            }
        });
        
        canvasWatcher.on('syncTriggered', (result) => {
            if (result.result.timeSaved) {
                totalTimeSaved += result.result.timeSaved;
                totalCacheHits += result.result.cacheHits;
            }
        });
        
        // Rapport périodique des optimisations
        const optimizationInterval = setInterval(() => {
            console.log(`\n⚡ Rapport Optimisations Cache:`);
            console.log(`- Total cache hits: ${totalCacheHits}`);
            console.log(`- Temps économisé: ${totalTimeSaved}ms`);
            console.log(`- Efficacité cache: ${((totalCacheHits / (totalCacheHits + 10)) * 100).toFixed(1)}%`);
        }, 15000);
        
        console.log('💾 Surveillance avec cache multi-niveaux active');
        
        return {
            fileWatcher,
            canvasWatcher,
            stopOptimizationReports: () => clearInterval(optimizationInterval)
        };
        
    } catch (error) {
        console.error('❌ Erreur surveillance avec cache:', error);
        throw error;
    }
}

/**
 * Exemple 6: Monitoring et métriques unifiées
 * Surveillance avec collecte de métriques détaillées
 */
export async function example6_UnifiedMonitoring() {
    console.log('\n=== EXEMPLE 6: Monitoring et Métriques Unifiées ===\n');
    
    try {
        const fileWatcher = new FileWatcher({
            enableMetrics: true,
            metricsInterval: 2000
        });
        
        const canvasWatcher = new CanvasWatcher({
            enableMetrics: true,
            metricsInterval: 2000
        });
        
        await fileWatcher.initialize();
        await canvasWatcher.initialize();
        
        // Collecteur de métriques unifié
        class UnifiedMetricsCollector {
            constructor() {
                this.metrics = {
                    totalChanges: 0,
                    changesByType: new Map(),
                    averageResponseTime: 0,
                    totalResponseTime: 0,
                    errorRate: 0,
                    errors: 0,
                    uptime: Date.now()
                };
            }
            
            recordChange(change, responseTime) {
                this.metrics.totalChanges++;
                
                const type = change.fileType || change.elementType || 'unknown';
                this.metrics.changesByType.set(
                    type,
                    (this.metrics.changesByType.get(type) || 0) + 1
                );
                
                this.metrics.totalResponseTime += responseTime;
                this.metrics.averageResponseTime = 
                    this.metrics.totalResponseTime / this.metrics.totalChanges;
            }
            
            recordError(error) {
                this.metrics.errors++;
                this.metrics.errorRate = 
                    (this.metrics.errors / Math.max(1, this.metrics.totalChanges)) * 100;
            }
            
            getReport() {
                return {
                    ...this.metrics,
                    uptimeMinutes: Math.floor((Date.now() - this.metrics.uptime) / 60000),
                    changesPerMinute: this.metrics.totalChanges / 
                        Math.max(1, (Date.now() - this.metrics.uptime) / 60000)
                };
            }
        }
        
        const metricsCollector = new UnifiedMetricsCollector();
        
        // Callback avec collecte de métriques
        const monitoredSyncCallback = async (changes) => {
            const startTime = Date.now();
            
            try {
                console.log(`📊 Sync monitorée: ${changes.length} changements`);
                
                // Simulation sync
                await new Promise(resolve => setTimeout(resolve, changes.length * 20));
                
                const responseTime = Date.now() - startTime;
                
                // Enregistrer métriques pour chaque changement
                for (const change of changes) {
                    metricsCollector.recordChange(change, responseTime / changes.length);
                }
                
                console.log(`✅ Sync terminée en ${responseTime}ms`);
                
                return { success: true, responseTime };
                
            } catch (error) {
                metricsCollector.recordError(error);
                throw error;
            }
        };
        
        // Démarrer surveillance monitorée
        await fileWatcher.startWatching(['./monitored-docs'], {
            syncCallback: monitoredSyncCallback
        });
        
        await canvasWatcher.startWatching(['monitored-canvas'], {
            syncCallback: monitoredSyncCallback
        });
        
        // Rapport détaillé périodique
        const reportInterval = setInterval(() => {
            const fileMetrics = fileWatcher.getMetrics();
            const canvasMetrics = canvasWatcher.getMetrics();
            const unifiedMetrics = metricsCollector.getReport();
            
            console.log('\n📊 RAPPORT MÉTRIQUES UNIFIÉES:');
            console.log('════════════════════════════════');
            console.log(`Uptime: ${unifiedMetrics.uptimeMinutes} minutes`);
            console.log(`Changements totaux: ${unifiedMetrics.totalChanges}`);
            console.log(`Fréquence: ${unifiedMetrics.changesPerMinute.toFixed(2)} changements/min`);
            console.log(`Temps réponse moyen: ${unifiedMetrics.averageResponseTime.toFixed(2)}ms`);
            console.log(`Taux d'erreur: ${unifiedMetrics.errorRate.toFixed(2)}%`);
            
            console.log('\nDétail par composant:');
            console.log(`- FileWatcher: ${fileMetrics.totalEvents} événements`);
            console.log(`- CanvasWatcher: ${canvasMetrics.totalChanges} changements`);
            
            console.log('\nRépartition par type:');
            for (const [type, count] of unifiedMetrics.changesByType.entries()) {
                console.log(`- ${type}: ${count} changements`);
            }
            console.log('════════════════════════════════\n');
        }, 20000);
        
        console.log('📊 Monitoring unifié activé - rapports détaillés toutes les 20s');
        
        return {
            fileWatcher,
            canvasWatcher,
            metricsCollector,
            stopReports: () => clearInterval(reportInterval)
        };
        
    } catch (error) {
        console.error('❌ Erreur monitoring unifié:', error);
        throw error;
    }
}

/**
 * Exemple 7: Gestion avancée des conflits et résolution
 * Surveillance avec détection et résolution automatique des conflits
 */
export async function example7_ConflictResolution() {
    console.log('\n=== EXEMPLE 7: Gestion Avancée des Conflits et Résolution ===\n');
    
    try {
        const fileWatcher = new FileWatcher({
            enableConflictDetection: true
        });
        
        const canvasWatcher = new CanvasWatcher({
            enableConflictDetection: true
        });
        
        await fileWatcher.initialize();
        await canvasWatcher.initialize();
        
        // Gestionnaire de conflits
        class ConflictResolver {
            constructor() {
                this.conflictsDetected = 0;
                this.conflictsResolved = 0;
                this.strategies = {
                    'timestamp': this.resolveByTimestamp.bind(this),
                    'priority': this.resolveByPriority.bind(this),
                    'merge': this.resolveByMerge.bind(this),
                    'user': this.resolveByUser.bind(this)
                };
            }
            
            async detectConflicts(changes) {
                const conflicts = [];
                
                // Simuler détection de conflits
                const fileChanges = changes.filter(c => c.filePath);
                const canvasChanges = changes.filter(c => c.canvasId);
                
                // Conflit potentiel si changements simultanés
                if (fileChanges.length > 0 && canvasChanges.length > 0) {
                    conflicts.push({
                        type: 'bidirectional_conflict',
                        fileChanges: fileChanges,
                        canvasChanges: canvasChanges,
                        timestamp: Date.now()
                    });
                }
                
                this.conflictsDetected += conflicts.length;
                return conflicts;
            }
            
            async resolveConflicts(conflicts, strategy = 'timestamp') {
                console.log(`🔧 Résolution ${conflicts.length} conflits avec stratégie: ${strategy}`);
                
                const resolver = this.strategies[strategy];
                if (!resolver) {
                    throw new Error(`Stratégie de résolution inconnue: ${strategy}`);
                }
                
                const resolutions = [];
                for (const conflict of conflicts) {
                    const resolution = await resolver(conflict);
                    resolutions.push(resolution);
                }
                
                this.conflictsResolved += resolutions.length;
                return resolutions;
            }
            
            async resolveByTimestamp(conflict) {
                console.log('⏰ Résolution par timestamp - dernier changement prioritaire');
                return {
                    strategy: 'timestamp',
                    winner: 'latest',
                    resolved: true
                };
            }
            
            async resolveByPriority(conflict) {
                console.log('🎯 Résolution par priorité - canvas prioritaire');
                return {
                    strategy: 'priority', 
                    winner: 'canvas',
                    resolved: true
                };
            }
            
            async resolveByMerge(conflict) {
                console.log('🔄 Résolution par merge - fusion intelligente');
                return {
                    strategy: 'merge',
                    winner: 'merged',
                    resolved: true
                };
            }
            
            async resolveByUser(conflict) {
                console.log('👤 Résolution manuelle requise');
                return {
                    strategy: 'user',
                    winner: 'pending',
                    resolved: false,
                    requiresUserInput: true
                };
            }
            
            getStats() {
                return {
                    conflictsDetected: this.conflictsDetected,
                    conflictsResolved: this.conflictsResolved,
                    resolutionRate: this.conflictsDetected > 0 ? 
                        (this.conflictsResolved / this.conflictsDetected * 100).toFixed(2) + '%' : '0%'
                };
            }
        }
        
        const conflictResolver = new ConflictResolver();
        
        // Callback avec gestion de conflits
        const conflictAwareSyncCallback = async (changes) => {
            console.log(`🔍 Sync avec détection conflits: ${changes.length} changements`);
            
            try {
                // Phase 1: Détecter conflits
                const conflicts = await conflictResolver.detectConflicts(changes);
                
                if (conflicts.length > 0) {
                    console.log(`⚠️ ${conflicts.length} conflits détectés`);
                    
                    // Phase 2: Résoudre conflits
                    const resolutions = await conflictResolver.resolveConflicts(conflicts, 'merge');
                    
                    // Phase 3: Appliquer résolutions
                    for (const resolution of resolutions) {
                        if (resolution.resolved) {
                            console.log(`✅ Conflit résolu: ${resolution.strategy} → ${resolution.winner}`);
                        } else {
                            console.log(`⏸️ Conflit nécessite intervention: ${resolution.strategy}`);
                        }
                    }
                }
                
                // Phase 4: Synchronisation normale
                await new Promise(resolve => setTimeout(resolve, changes.length * 15));
                
                console.log('✅ Synchronisation avec résolution conflits terminée');
                
                return {
                    success: true,
                    conflictsDetected: conflicts.length,
                    conflictsResolved: conflicts.filter(c => c.resolved).length
                };
                
            } catch (error) {
                console.error('❌ Erreur gestion conflits:', error);
                throw error;
            }
        };
        
        // Démarrer surveillance avec gestion conflits
        await fileWatcher.startWatching(['./conflict-docs'], {
            syncCallback: conflictAwareSyncCallback
        });
        
        await canvasWatcher.startWatching(['conflict-canvas'], {
            syncCallback: conflictAwareSyncCallback
        });
        
        // Rapport conflits périodique
        const conflictReportInterval = setInterval(() => {
            const stats = conflictResolver.getStats();
            console.log('\n🔧 RAPPORT GESTION CONFLITS:');
            console.log('═══════════════════════════');
            console.log(`Conflits détectés: ${stats.conflictsDetected}`);
            console.log(`Conflits résolus: ${stats.conflictsResolved}`);
            console.log(`Taux résolution: ${stats.resolutionRate}`);
            console.log('═══════════════════════════\n');
        }, 25000);
        
        console.log('🔧 Surveillance avec gestion de conflits activée');
        
        return {
            fileWatcher,
            canvasWatcher,
            conflictResolver,
            stopConflictReports: () => clearInterval(conflictReportInterval)
        };
        
    } catch (error) {
        console.error('❌ Erreur gestion conflits:', error);
        throw error;
    }
}

/**
 * Fonction utilitaire pour exécuter tous les exemples
 */
export async function runAllExamples() {
    console.log('\n🚀 EXÉCUTION DE TOUS LES EXEMPLES WATCHERS INTEGRATION');
    console.log('====================================================\n');
    
    const examples = [
        example1_UnifiedWatchingWithAutoSync,
        example2_RealTimeMode,
        example3_SelectiveWatching,
        example4_FullBidirectionalIntegration,
        example5_CachedWatchingWithOptimizations,
        example6_UnifiedMonitoring,
        example7_ConflictResolution
    ];
    
    for (let i = 0; i < examples.length; i++) {
        try {
            console.log(`\n--- Exemple ${i + 1}/${examples.length} ---`);
            const result = await examples[i]();
            console.log(`✅ Exemple ${i + 1} exécuté avec succès`);
            
            // Attendre un peu avant exemple suivant
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Nettoyer si méthodes disponibles
            if (result && typeof result.stop === 'function') {
                await result.stop();
            }
            
        } catch (error) {
            console.error(`❌ Erreur exemple ${i + 1}:`, error.message);
        }
    }
    
    console.log('\n🎉 Tous les exemples ont été exécutés !');
}

// Export ES6 par défaut
export {
    example1_UnifiedWatchingWithAutoSync,
    example2_RealTimeMode, 
    example3_SelectiveWatching,
    example4_FullBidirectionalIntegration,
    example5_CachedWatchingWithOptimizations,
    example6_UnifiedMonitoring,
    example7_ConflictResolution,
    runAllExamples
};

// Export browser pour utilisation dans Obsidian
if (typeof window !== 'undefined') {
    window.ProcessMetaLanguageWatchersIntegration = {
        example1_UnifiedWatchingWithAutoSync,
        example2_RealTimeMode,
        example3_SelectiveWatching,
        example4_FullBidirectionalIntegration,
        example5_CachedWatchingWithOptimizations,
        example6_UnifiedMonitoring,
        example7_ConflictResolution,
        runAllExamples
    };
}

// <!-- END OF FILE: watchers-integration.js -->