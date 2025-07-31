// <!-- START OF FILE: bidirectional-sync-integration.js -->
// FILENAME: bidirectional-sync-integration.js
// Version: 1.0.0
// Date: 2025-07-31 16:15
// Author: Rolland MELET & Claude Code
// Description: Exemples intégration synchronisation bidirectionnelle ProcessMetaLanguage - TASK-B009 Phase 4

/**
 * Exemples d'Intégration - Synchronisation Bidirectionnelle ProcessMetaLanguage
 * 
 * Ce fichier contient des exemples concrets d'utilisation de la synchronisation
 * bidirectionnelle pour différents cas d'usage ProcessMetaLanguage.
 * 
 * Exemples couverts:
 * 1. Synchronisation manuelle bidirectionnelle
 * 2. Synchronisation automatique avec détection changements
 * 3. Synchronisation temps réel
 * 4. Résolution de conflits
 * 5. Intégration dans workflows Obsidian
 * 6. Performance et monitoring
 */

import { BidirectionalSync } from '../sync/bidirectional-sync.js';

/**
 * Exemple 1: Synchronisation manuelle bidirectionnelle basique
 * Cas d'usage: Utilisateur modifie le canvas et veut synchroniser avec markdown
 */
export async function exemple1_SyncManuelleBasique() {
    console.log('📋 Exemple 1: Synchronisation manuelle bidirectionnelle');
    
    try {
        // Initialiser synchronisation
        const sync = new BidirectionalSync({
            syncMode: 'manual',
            conflictResolution: 'merge'
        });
        
        await sync.initialize();
        
        // Synchronisation canvas → markdown
        const result = await sync.syncBidirectional({
            canvasFile: './examples/process-shipping.excalidraw',
            direction: 'canvas_to_markdown'
        });
        
        console.log('✅ Résultat synchronisation:', {
            success: result.success,
            direction: result.direction,
            changesTotal: result.changes.total,
            syncTime: `${result.metrics.syncTime.toFixed(2)}ms`
        });
        
        // Obtenir métriques
        const metrics = sync.getMetrics();
        console.log('📊 Métriques:', {
            totalSyncs: metrics.totalSyncs,
            successRate: metrics.successRate,
            averageTime: `${metrics.averageSyncTime.toFixed(2)}ms`
        });
        
        return result;
        
    } catch (error) {
        console.error('❌ Erreur exemple 1:', error.message);
        throw error;
    }
}

/**
 * Exemple 2: Synchronisation automatique avec détection changements
 * Cas d'usage: Workflow où canvas et markdown peuvent changer indépendamment
 */
export async function exemple2_SyncAutomatique() {
    console.log('📋 Exemple 2: Synchronisation automatique');
    
    try {
        const sync = new BidirectionalSync({
            syncMode: 'automatic',
            conflictResolution: 'most_recent',
            changeDetection: {
                enableWatching: true,
                checksumValidation: true
            }
        });
        
        await sync.initialize();
        
        // Synchronisation avec détection automatique de direction
        const result = await sync.syncBidirectional({
            canvasFile: './examples/process-receiving.excalidraw',
            direction: 'auto', // Détection automatique
            forceSync: false   // Seulement si changements détectés
        });
        
        if (result.direction === 'no_changes') {
            console.log('ℹ️ Aucun changement détecté, synchronisation ignorée');
        } else {
            console.log('✅ Synchronisation automatique:', {
                direction: result.direction,
                elementsUpdated: result.changes.elementsUpdated || 0,
                filesGenerated: result.changes.filesGenerated || 0,
                conflictsResolved: result.conflicts.length
            });
        }
        
        return result;
        
    } catch (error) {
        console.error('❌ Erreur exemple 2:', error.message);
        throw error;
    }
}

/**
 * Exemple 3: Synchronisation temps réel
 * Cas d'usage: Collaboration en temps réel ou modifications fréquentes
 */
export async function exemple3_SyncTempsReel() {
    console.log('📋 Exemple 3: Synchronisation temps réel');
    
    try {
        const sync = new BidirectionalSync({
            syncMode: 'realtime',
            conflictResolution: 'merge',
            changeDetection: {
                watchInterval: 1000,    // Vérifier toutes les secondes
                debounceDelay: 300      // Attendre 300ms après changement
            }
        });
        
        await sync.initialize();
        
        // Activer mode temps réel
        const result = await sync.syncBidirectional({
            canvasFile: './examples/collaborative-process.excalidraw',
            enableRealtime: true,
            direction: 'auto'
        });
        
        console.log('✅ Mode temps réel activé:', {
            realtimeEnabled: sync.realtimeEnabled,
            syncResult: result.success,
            watchersActive: result.metadata.watchersActive || 'unknown'
        });
        
        // Simuler travail pendant 10 secondes puis désactiver
        console.log('⏳ Mode temps réel actif pendant 10 secondes...');
        setTimeout(async () => {
            await sync.disableRealtimeSync();
            console.log('⏹️ Mode temps réel désactivé');
            
            const finalMetrics = sync.getMetrics();
            console.log('📊 Métriques finales:', {
                realtimeSyncs: finalMetrics.realtimeSyncs,
                totalSyncs: finalMetrics.totalSyncs
            });
        }, 10000);
        
        return result;
        
    } catch (error) {
        console.error('❌ Erreur exemple 3:', error.message);
        throw error;
    }
}

/**
 * Exemple 4: Gestion avancée des conflits
 * Cas d'usage: Modifications simultanées canvas et markdown
 */
export async function exemple4_GestionConflits() {
    console.log('📋 Exemple 4: Gestion des conflits');
    
    try {
        const sync = new BidirectionalSync({
            syncMode: 'manual',
            conflictResolution: 'merge', // Fusion intelligente
            backup: {
                enableBackup: true,
                createOnConflict: true
            }
        });
        
        await sync.initialize();
        
        // Synchronisation bidirectionnelle avec fusion
        const result = await sync.syncBidirectional({
            canvasFile: './examples/conflicted-process.excalidraw',
            direction: 'bidirectional', // Force la bidirectionnelle
            preserveUserChanges: true   // Préserver modifications utilisateur
        });
        
        console.log('✅ Synchronisation avec gestion conflits:', {
            success: result.success,
            conflicts: result.conflicts.length,
            conflictsResolved: result.changes.conflictsResolved || 0
        });
        
        // Analyser conflits s'il y en a
        if (result.conflicts.length > 0) {
            console.log('⚠️ Conflits détectés:');
            result.conflicts.forEach((conflict, index) => {
                console.log(`  ${index + 1}. ${conflict.elementId}: ${conflict.conflictReason}`);
            });
        }
        
        // Historique des conflits
        const conflictHistory = sync.getConflictHistory(5);
        console.log('📜 Historique conflits récents:', conflictHistory.length);
        
        return result;
        
    } catch (error) {
        console.error('❌ Erreur exemple 4:', error.message);
        throw error;
    }
}

/**
 * Exemple 5: Intégration dans workflow Obsidian
 * Cas d'usage: Plugin Obsidian utilisant ProcessMetaLanguage
 */
export async function exemple5_IntegrationObsidian() {
    console.log('📋 Exemple 5: Intégration workflow Obsidian');
    
    try {
        // Simuler environnement Obsidian
        const obsidianContext = {
            vault: { path: '/path/to/vault' },
            workspace: { activeLeaf: null },
            app: { metadataCache: null }
        };
        
        const sync = new BidirectionalSync({
            syncMode: 'automatic',
            conflictResolution: 'ask_user', // Dans Obsidian, demander à l'utilisateur
            obsidianIntegration: {
                enabled: true,
                context: obsidianContext
            }
        });
        
        await sync.initialize();
        
        // Workflow typique Obsidian:
        // 1. Utilisateur ouvre fichier Excalidraw
        // 2. Modifie le diagramme
        // 3. Synchronisation automatique se déclenche
        
        const result = await sync.syncBidirectional({
            canvasFile: `${obsidianContext.vault.path}/Processes/MonProcessus.excalidraw`,
            direction: 'auto',
            obsidianMode: true
        });
        
        console.log('✅ Intégration Obsidian:', {
            vaultPath: obsidianContext.vault.path,
            syncSuccess: result.success,
            filesAffected: result.changes.total,
            userNotificationRequired: result.conflicts.length > 0
        });
        
        // Dans un vrai plugin Obsidian, on notifierait l'utilisateur
        if (result.conflicts.length > 0) {
            console.log('🔔 Notification utilisateur requise pour conflits');
        }
        
        return result;
        
    } catch (error) {
        console.error('❌ Erreur exemple 5:', error.message);
        throw error;
    }
}

/**
 * Exemple 6: Monitoring et performance
 * Cas d'usage: Analyse performance pour gros processus (50+ composants)
 */
export async function exemple6_MonitoringPerformance() {
    console.log('📋 Exemple 6: Monitoring et performance');
    
    try {
        const sync = new BidirectionalSync({
            syncMode: 'manual',
            performance: {
                maxSyncTimeMs: 5000,    // Objectif <5s
                batchSize: 25,          // Traitement par lots
                enableCaching: true,
                enableDifferentialSync: true
            }
        });
        
        await sync.initialize();
        
        // Test performance avec processus complexe
        const startTime = performance.now();
        
        const result = await sync.syncBidirectional({
            canvasFile: './examples/large-manufacturing-process.excalidraw',
            direction: 'bidirectional',
            forceSync: true // Forcer pour test performance
        });
        
        const totalTime = performance.now() - startTime;
        
        // Analyse performance
        const metrics = sync.getMetrics();
        const performanceReport = {
            totalSyncTime: `${totalTime.toFixed(2)}ms`,
            targetMet: totalTime < 5000,
            averageSyncTime: `${metrics.averageSyncTime.toFixed(2)}ms`,
            successRate: metrics.successRate,
            componentsProcessed: result.changes.total,
            performanceScore: Math.max(0, 100 - (totalTime / 50)) // Score sur 100
        };
        
        console.log('📊 Rapport performance:', performanceReport);
        
        // Alertes performance
        if (performanceReport.totalSyncTime > 5000) {
            console.warn('⚠️ Performance dégradée: synchronisation > 5s');
        }
        
        if (performanceReport.performanceScore < 80) {
            console.warn('⚠️ Score performance faible:', performanceReport.performanceScore);
        } else {
            console.log('✅ Performance satisfaisante');
        }
        
        return {
            result,
            performanceReport
        };
        
    } catch (error) {
        console.error('❌ Erreur exemple 6:', error.message);
        throw error;
    }
}

/**
 * Exemple 7: Workflow complet de développement
 * Cas d'usage: Cycle de développement processus complet
 */
export async function exemple7_WorkflowComplet() {
    console.log('📋 Exemple 7: Workflow complet de développement');
    
    try {
        const sync = new BidirectionalSync({
            syncMode: 'automatic',
            conflictResolution: 'merge'
        });
        
        await sync.initialize();
        
        console.log('🏗️ Phase 1: Création processus canvas...');
        // Simuler création éléments dans canvas
        
        console.log('🔄 Phase 2: Synchronisation initiale...');
        const initialSync = await sync.syncBidirectional({
            canvasFile: './examples/development-process.excalidraw',
            direction: 'canvas_to_markdown'
        });
        
        console.log('📝 Phase 3: Modification documentation...');
        // Simuler modifications markdown
        
        console.log('🔄 Phase 4: Synchronisation retour...');
        const returnSync = await sync.syncBidirectional({
            canvasFile: './examples/development-process.excalidraw',
            direction: 'markdown_to_canvas'
        });
        
        console.log('🔄 Phase 5: Synchronisation finale...');
        const finalSync = await sync.syncBidirectional({
            canvasFile: './examples/development-process.excalidraw',
            direction: 'bidirectional'
        });
        
        // Rapport final
        const metrics = sync.getMetrics();
        const history = sync.getSyncHistory();
        
        console.log('✅ Workflow complet terminé:', {
            phases: 3,
            totalSyncs: metrics.totalSyncs,
            successRate: metrics.successRate,
            finalResult: finalSync.success,
            historySize: history.length
        });
        
        return {
            initialSync,
            returnSync,
            finalSync,
            metrics,
            history
        };
        
    } catch (error) {
        console.error('❌ Erreur exemple 7:', error.message);
        throw error;
    }
}

/**
 * Fonction principale pour exécuter tous les exemples
 */
export async function executerTousLesExemples() {
    console.log('🚀 Exécution de tous les exemples de synchronisation bidirectionnelle');
    console.log('=' * 80);
    
    const exemples = [
        { nom: 'Synchronisation manuelle', fonction: exemple1_SyncManuelleBasique },
        { nom: 'Synchronisation automatique', fonction: exemple2_SyncAutomatique },
        { nom: 'Synchronisation temps réel', fonction: exemple3_SyncTempsReel },
        { nom: 'Gestion des conflits', fonction: exemple4_GestionConflits },
        { nom: 'Intégration Obsidian', fonction: exemple5_IntegrationObsidian },
        { nom: 'Monitoring performance', fonction: exemple6_MonitoringPerformance },
        { nom: 'Workflow complet', fonction: exemple7_WorkflowComplet }
    ];
    
    const resultats = [];
    
    for (const exemple of exemples) {
        try {
            console.log(`\n🎯 Exécution: ${exemple.nom}`);
            console.log('-'.repeat(50));
            
            const resultat = await exemple.fonction();
            resultats.push({
                nom: exemple.nom,
                success: true,
                resultat
            });
            
            console.log(`✅ ${exemple.nom} terminé avec succès`);
            
        } catch (error) {
            console.error(`❌ Échec ${exemple.nom}:`, error.message);
            resultats.push({
                nom: exemple.nom,
                success: false,
                error: error.message
            });
        }
        
        // Pause entre exemples
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Rapport final
    console.log('\n📊 RAPPORT FINAL DES EXEMPLES');
    console.log('=' * 80);
    
    const reussites = resultats.filter(r => r.success).length;
    const echecs = resultats.filter(r => !r.success).length;
    
    console.log(`✅ Exemples réussis: ${reussites}/${resultats.length}`);
    console.log(`❌ Exemples échoués: ${echecs}/${resultats.length}`);
    console.log(`📈 Taux de réussite: ${(reussites / resultats.length * 100).toFixed(1)}%`);
    
    if (echecs > 0) {
        console.log('\n❌ Échecs détaillés:');
        resultats.filter(r => !r.success).forEach(r => {
            console.log(`  - ${r.nom}: ${r.error}`);
        });
    }
    
    return {
        total: resultats.length,
        reussites,
        echecs,
        tauxReussite: reussites / resultats.length * 100,
        resultats
    };
}

// Export pour utilisation en module
export default {
    exemple1_SyncManuelleBasique,
    exemple2_SyncAutomatique,
    exemple3_SyncTempsReel,
    exemple4_GestionConflits,
    exemple5_IntegrationObsidian,
    exemple6_MonitoringPerformance,
    exemple7_WorkflowComplet,
    executerTousLesExemples
};

// <!-- END OF FILE: bidirectional-sync-integration.js -->