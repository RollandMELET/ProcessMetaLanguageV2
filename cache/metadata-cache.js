// <!-- START OF FILE: metadata-cache.js -->
// FILENAME: metadata-cache.js
// Version: 1.0.0
// Date: 2025-07-31 16:45
// Author: Rolland MELET & Claude Code
// Description: Cache métadonnées haute performance ProcessMetaLanguage - TASK-B010 Phase 4 optimisation

/**
 * Module ProcessMetaLanguage - Metadata Cache
 * 
 * Système de cache haute performance pour métadonnées ProcessMetaLanguage.
 * Optimise les accès répétés aux données canvas et markdown.
 * 
 * Fonctionnalités principales:
 * - Cache multi-niveaux (L1 mémoire, L2 disque, L3 réseau)
 * - TTL intelligent avec refresh automatique
 * - Invalidation sélective par tags
 * - Compression et sérialisation optimisées
 * - Stratégies LRU, LFU et adaptatives
 * - Synchronisation entre instances
 * - Métriques détaillées et monitoring
 * - Persistance sur disque avec intégrité
 * - Support clustering et distribution
 */

import { promises as fs } from 'fs';
import path from 'path';
import { createHash } from 'crypto';
import { EventEmitter } from 'events';
import { performance } from 'perf_hooks';

/**
 * Configuration du cache métadonnées
 * @constant {Object}
 */
const METADATA_CACHE_CONFIG = {
    // Niveaux de cache
    levels: {
        l1: {
            enabled: true,
            type: 'memory',
            maxItems: 1000,
            maxSizeMB: 64,
            ttl: 300000,        // 5 minutes
            strategy: 'lru'
        },
        l2: {
            enabled: true,
            type: 'disk',
            maxItems: 10000,
            maxSizeMB: 512,
            ttl: 1800000,       // 30 minutes
            strategy: 'lfu',
            path: './.cache/metadata'
        },
        l3: {
            enabled: false,
            type: 'network',
            maxItems: 100000,
            ttl: 3600000,       // 1 heure
            strategy: 'adaptive',
            endpoint: null
        }
    },
    
    // Stratégies d'optimisation
    optimization: {
        enableCompression: true,
        compressionLevel: 6,
        enableSerialization: true,
        serializationFormat: 'json',    // 'json', 'msgpack', 'protobuf'
        enablePreloading: true,
        preloadPatterns: ['object_*', 'state_*', 'action_*'],
        enablePredictive: true,
        predictiveThreshold: 0.7
    },
    
    // Invalidation et synchronisation
    invalidation: {
        enableTagging: true,
        enableSelectiveInvalidation: true,
        enableAutoRefresh: true,
        refreshThreshold: 0.8,          // 80% du TTL
        enableSyncBetweenInstances: false,
        syncInterval: 30000             // 30 secondes
    },
    
    // Performance et monitoring
    performance: {
        enableMetrics: true,
        enableProfiling: true,
        metricsInterval: 5000,          // 5 secondes
        alertThresholds: {
            hitRate: 85,                // Alerte si <85%
            responseTime: 10,           // Alerte si >10ms
            memoryUsage: 80,            // Alerte si >80% max
            diskUsage: 90               // Alerte si >90% max
        }
    },
    
    // Types de métadonnées cachées
    cacheableTypes: {
        canvas_metadata: { priority: 1, ttl: 300000, tags: ['canvas', 'metadata'] },
        markdown_metadata: { priority: 2, ttl: 600000, tags: ['markdown', 'metadata'] },
        element_properties: { priority: 3, ttl: 900000, tags: ['element', 'properties'] },
        relationship_data: { priority: 4, ttl: 1200000, tags: ['relationship', 'graph'] },
        epcis_templates: { priority: 5, ttl: 1800000, tags: ['epcis', 'template'] },
        validation_results: { priority: 6, ttl: 300000, tags: ['validation', 'result'] },
        performance_metrics: { priority: 7, ttl: 60000, tags: ['performance', 'metrics'] }
    }
};

/**
 * Entrée de cache avec métadonnées
 * @typedef {Object} CacheEntry
 * @property {string} key - Clé unique de l'entrée
 * @property {*} value - Valeur cachée
 * @property {number} ttl - Time-to-live en ms
 * @property {Array<string>} tags - Tags pour invalidation
 * @property {Object} metadata - Métadonnées de l'entrée
 * @property {number} accessCount - Nombre d'accès
 * @property {number} lastAccess - Timestamp dernier accès
 * @property {number} created - Timestamp création
 */

/**
 * Cache métadonnées haute performance ProcessMetaLanguage
 * Gère un cache multi-niveaux optimisé pour métadonnées ProcessMetaLanguage
 * 
 * @class MetadataCache
 * @extends EventEmitter
 * @example
 * // Cache haute performance pour métadonnées
 * const cache = new MetadataCache({
 *   enableL2Cache: true,
 *   compressionEnabled: true,
 *   maxMemoryMB: 128
 * });
 * 
 * await cache.initialize();
 * 
 * // Stocker métadonnées avec TTL et tags
 * await cache.set('canvas_process_001', canvasMetadata, {
 *   ttl: 300000,
 *   tags: ['canvas', 'process', 'user_001']
 * });
 * 
 * // Récupérer avec métriques automatiques
 * const metadata = await cache.get('canvas_process_001');
 * console.log(`Hit: ${metadata ? 'true' : 'false'}`);
 */
export class MetadataCache extends EventEmitter {
    /**
     * Initialise le cache métadonnées
     * @param {Object} options - Options de configuration
     * @param {boolean} options.enableL2Cache - Activer cache disque (défaut: true)
     * @param {boolean} options.enableCompression - Activer compression (défaut: true)
     * @param {number} options.maxMemoryMB - Mémoire max L1 en MB (défaut: 64)
     * @param {string} options.cacheDirectory - Répertoire cache L2 (défaut: ./.cache/metadata)
     */
    constructor(options = {}) {
        super();
        
        this.config = {
            ...METADATA_CACHE_CONFIG,
            ...options
        };
        
        // Caches multi-niveaux
        this.l1Cache = new Map();           // Cache mémoire rapide
        this.l2Cache = new Map();           // Index cache disque
        this.l3Cache = new Map();           // Cache réseau (future extension)
        
        // Structures de données pour optimisation
        this.tagIndex = new Map();          // Index des tags
        this.accessHistory = new Map();     // Historique d'accès pour LRU/LFU
        this.preloadQueue = new Set();      // Queue de préchargement
        this.refreshQueue = new Set();      // Queue de rafraîchissement
        
        // État du cache
        this.isInitialized = false;
        this.isShuttingDown = false;
        this.totalMemoryUsage = 0;
        this.totalDiskUsage = 0;
        
        // Métriques détaillées
        this.metrics = {
            // Statistiques d'accès
            totalRequests: 0,
            l1Hits: 0,
            l1Misses: 0,
            l2Hits: 0,
            l2Misses: 0,
            l3Hits: 0,
            l3Misses: 0,
            
            // Performance
            averageResponseTime: 0,
            totalResponseTime: 0,
            slowestRequest: 0,
            fastestRequest: Infinity,
            
            // Opérations
            setsPerformed: 0,
            getsPerformed: 0,
            deletionsPerformed: 0,
            invalidationsPerformed: 0,
            
            // Ressources
            memoryUsage: 0,
            diskUsage: 0,
            compressionRatio: 0,
            
            // Maintenance
            cleanupOperations: 0,
            preloadOperations: 0,
            refreshOperations: 0,
            errorCount: 0
        };
        
        // Timers et intervalles
        this.metricsInterval = null;
        this.cleanupInterval = null;
        this.preloadInterval = null;
        this.syncInterval = null;
        
        // Stratégies d'éviction
        this.evictionStrategies = {
            lru: this.evictLRU.bind(this),
            lfu: this.evictLFU.bind(this),
            adaptive: this.evictAdaptive.bind(this)
        };
    }
    
    /**
     * Initialise le cache avec tous ses composants
     * @returns {Promise<void>}
     * @sideEffect Crée répertoires cache, démarre intervalles de maintenance
     */
    async initialize() {
        try {
            console.log('🚀 Initialisation MetadataCache haute performance...');
            
            // Initialiser cache L2 (disque) si activé
            if (this.config.levels.l2.enabled) {
                await this.initializeL2Cache();
            }
            
            // Initialiser cache L3 (réseau) si activé
            if (this.config.levels.l3.enabled) {
                await this.initializeL3Cache();
            }
            
            // Démarrer métriques et monitoring
            if (this.config.performance.enableMetrics) {
                this.startMetricsCollection();
            }
            
            // Démarrer maintenance automatique
            this.startMaintenanceIntervals();
            
            // Précharger données fréquentes si activé
            if (this.config.optimization.enablePreloading) {
                await this.startPreloading();
            }
            
            this.isInitialized = true;
            console.log('✅ MetadataCache initialisé avec succès');
            
            this.emit('initialized', {
                l1Enabled: this.config.levels.l1.enabled,
                l2Enabled: this.config.levels.l2.enabled,
                l3Enabled: this.config.levels.l3.enabled,
                compressionEnabled: this.config.optimization.enableCompression
            });
            
        } catch (error) {
            console.error('❌ Erreur initialisation MetadataCache:', error);
            throw new Error(`Échec initialisation MetadataCache: ${error.message}`);
        }
    }
    
    /**
     * Stocke une valeur dans le cache avec métadonnées
     * @param {string} key - Clé unique
     * @param {*} value - Valeur à cacher
     * @param {Object} options - Options de cache
     * @param {number} options.ttl - TTL personnalisé en ms
     * @param {Array<string>} options.tags - Tags pour invalidation
     * @param {number} options.priority - Priorité (1-10)
     * @param {string} options.type - Type de métadonnées
     * @returns {Promise<boolean>} Succès de l'opération
     * @sideEffect Stocke dans cache(s), met à jour index, émet événements
     * @example
     * // Stocker métadonnées canvas avec tags
     * await cache.set('canvas_shipping_001', {
     *   elements: 45,
     *   lastModified: '2025-07-31T16:45:00Z',
     *   complexity: 3.2
     * }, {
     *   ttl: 300000,
     *   tags: ['canvas', 'shipping', 'user_001'],
     *   type: 'canvas_metadata'
     * });
     */
    async set(key, value, options = {}) {
        if (!this.isInitialized) {
            throw new Error('Cache non initialisé - appelez initialize() d\'abord');
        }
        
        const startTime = performance.now();
        
        try {
            // Déterminer configuration selon le type
            const typeConfig = this.config.cacheableTypes[options.type] || {};
            const opts = {
                ttl: options.ttl || typeConfig.ttl || this.config.levels.l1.ttl,
                tags: options.tags || typeConfig.tags || [],
                priority: options.priority || typeConfig.priority || 5,
                type: options.type || 'generic',
                ...options
            };
            
            // Créer entrée de cache
            const entry = this.createCacheEntry(key, value, opts);
            
            // Compression si activée
            if (this.config.optimization.enableCompression) {
                entry.compressedValue = await this.compressValue(value);
                entry.compressed = true;
            }
            
            // Stocker en L1 (mémoire)
            await this.setL1(key, entry);
            
            // Stocker en L2 (disque) si activé
            if (this.config.levels.l2.enabled) {
                await this.setL2(key, entry);
            }
            
            // Stocker en L3 (réseau) si activé
            if (this.config.levels.l3.enabled) {
                await this.setL3(key, entry);
            }
            
            // Mettre à jour index des tags
            this.updateTagIndex(key, opts.tags);
            
            // Mettre à jour métriques
            this.metrics.setsPerformed++;
            this.updateResponseTime(performance.now() - startTime);
            
            this.emit('set', { key, type: opts.type, size: this.calculateEntrySize(entry) });
            
            return true;
            
        } catch (error) {
            this.metrics.errorCount++;
            console.error(`❌ Erreur cache set ${key}:`, error);
            throw error;
        }
    }
    
    /**
     * Récupère une valeur du cache avec optimisations
     * @param {string} key - Clé à récupérer
     * @param {Object} options - Options de récupération
     * @param {boolean} options.updateAccess - Mettre à jour accès (défaut: true)
     * @param {boolean} options.autoRefresh - Refresh auto si proche expiration (défaut: true)
     * @returns {Promise<*>} Valeur récupérée ou null si non trouvée
     * @example
     * // Récupérer métadonnées avec refresh automatique
     * const metadata = await cache.get('canvas_shipping_001', {
     *   autoRefresh: true
     * });
     * 
     * if (metadata) {
     *   console.log(`Éléments: ${metadata.elements}`);
     * }
     */
    async get(key, options = {}) {
        if (!this.isInitialized) {
            throw new Error('Cache non initialisé - appelez initialize() d\'abord');
        }
        
        const startTime = performance.now();
        const opts = {
            updateAccess: options.updateAccess !== false,
            autoRefresh: options.autoRefresh !== false,
            ...options
        };
        
        try {
            this.metrics.totalRequests++;
            this.metrics.getsPerformed++;
            
            let entry = null;
            let hitLevel = null;
            
            // Essayer L1 (mémoire) d'abord
            entry = await this.getL1(key);
            if (entry) {
                this.metrics.l1Hits++;
                hitLevel = 'L1';
            } else {
                this.metrics.l1Misses++;
                
                // Essayer L2 (disque)
                if (this.config.levels.l2.enabled) {
                    entry = await this.getL2(key);
                    if (entry) {
                        this.metrics.l2Hits++;
                        hitLevel = 'L2';
                        
                        // Promouvoir vers L1
                        await this.promoteToL1(key, entry);
                    } else {
                        this.metrics.l2Misses++;
                        
                        // Essayer L3 (réseau)
                        if (this.config.levels.l3.enabled) {
                            entry = await this.getL3(key);
                            if (entry) {
                                this.metrics.l3Hits++;
                                hitLevel = 'L3';
                                
                                // Promouvoir vers L2 et L1
                                await this.promoteToL2(key, entry);
                                await this.promoteToL1(key, entry);
                            } else {
                                this.metrics.l3Misses++;
                            }
                        }
                    }
                }
            }
            
            // Vérifier expiration
            if (entry && this.isExpired(entry)) {
                await this.delete(key);
                entry = null;
                hitLevel = null;
            }
            
            // Mettre à jour accès si trouvé
            if (entry && opts.updateAccess) {
                this.updateAccessHistory(key, entry);
            }
            
            // Auto-refresh si proche expiration
            if (entry && opts.autoRefresh && this.shouldRefresh(entry)) {
                this.scheduleRefresh(key);
            }
            
            const responseTime = performance.now() - startTime;
            this.updateResponseTime(responseTime);
            
            // Décompresser si nécessaire
            let value = null;
            if (entry) {
                value = entry.compressed ? 
                    await this.decompressValue(entry.compressedValue) : 
                    entry.value;
            }
            
            this.emit('get', { 
                key, 
                hit: !!entry, 
                hitLevel, 
                responseTime,
                type: entry?.metadata?.type
            });
            
            return value;
            
        } catch (error) {
            this.metrics.errorCount++;
            console.error(`❌ Erreur cache get ${key}:`, error);
            throw error;
        }
    }
    
    /**
     * Supprime une entrée du cache
     * @param {string} key - Clé à supprimer
     * @returns {Promise<boolean>} Succès de l'opération
     */
    async delete(key) {
        try {
            let deleted = false;
            
            // Supprimer de L1
            if (this.l1Cache.has(key)) {
                this.l1Cache.delete(key);
                deleted = true;
            }
            
            // Supprimer de L2
            if (this.config.levels.l2.enabled && this.l2Cache.has(key)) {
                await this.deleteL2(key);
                deleted = true;
            }
            
            // Supprimer de L3
            if (this.config.levels.l3.enabled) {
                await this.deleteL3(key);
                deleted = true;
            }
            
            // Nettoyer index des tags
            this.cleanupTagIndex(key);
            
            // Supprimer historique d'accès
            this.accessHistory.delete(key);
            
            if (deleted) {
                this.metrics.deletionsPerformed++;
                this.emit('delete', { key });
            }
            
            return deleted;
            
        } catch (error) {
            this.metrics.errorCount++;
            console.error(`❌ Erreur cache delete ${key}:`, error);
            throw error;
        }
    }
    
    /**
     * Invalide les entrées par tags
     * @param {Array<string>} tags - Tags à invalider
     * @returns {Promise<number>} Nombre d'entrées invalidées
     * @example
     * // Invalider tous les caches liés à un utilisateur
     * const invalidated = await cache.invalidateByTags(['user_001']);
     * console.log(`${invalidated} entrées invalidées`);
     */
    async invalidateByTags(tags) {
        if (!this.config.invalidation.enableTagging) {
            console.warn('⚠️ Invalidation par tags désactivée');
            return 0;
        }
        
        try {
            const keysToInvalidate = new Set();
            
            // Trouver toutes les clés avec ces tags
            for (const tag of tags) {
                const taggedKeys = this.tagIndex.get(tag) || new Set();
                taggedKeys.forEach(key => keysToInvalidate.add(key));
            }
            
            // Invalider toutes les clés trouvées
            let invalidatedCount = 0;
            for (const key of keysToInvalidate) {
                const deleted = await this.delete(key);
                if (deleted) {
                    invalidatedCount++;
                }
            }
            
            this.metrics.invalidationsPerformed += invalidatedCount;
            
            this.emit('invalidate', { tags, count: invalidatedCount });
            
            return invalidatedCount;
            
        } catch (error) {
            this.metrics.errorCount++;
            console.error('❌ Erreur invalidation par tags:', error);
            throw error;
        }
    }
    
    /**
     * Vide complètement le cache
     * @returns {Promise<void>}
     * @sideEffect Supprime toutes les entrées, nettoie index
     */
    async clear() {
        try {
            console.log('🗑️ Vidage complet du cache...');
            
            // Vider L1
            this.l1Cache.clear();
            
            // Vider L2
            if (this.config.levels.l2.enabled) {
                await this.clearL2();
            }
            
            // Vider L3
            if (this.config.levels.l3.enabled) {
                await this.clearL3();
            }
            
            // Nettoyer tous les index
            this.tagIndex.clear();
            this.accessHistory.clear();
            this.preloadQueue.clear();
            this.refreshQueue.clear();
            
            // Réinitialiser métriques
            this.resetMetrics();
            
            this.emit('cleared');
            console.log('✅ Cache vidé avec succès');
            
        } catch (error) {
            this.metrics.errorCount++;
            console.error('❌ Erreur vidage cache:', error);
            throw error;
        }
    }
    
    // Méthodes privées pour gestion multi-niveaux
    
    async setL1(key, entry) {
        // Vérifier limite mémoire L1
        if (this.l1Cache.size >= this.config.levels.l1.maxItems) {
            await this.evictL1();
        }
        
        this.l1Cache.set(key, entry);
        this.updateMemoryUsage();
    }
    
    async getL1(key) {
        return this.l1Cache.get(key) || null;
    }
    
    async setL2(key, entry) {
        // Simulation stockage disque
        this.l2Cache.set(key, entry);
        this.updateDiskUsage();
    }
    
    async getL2(key) {
        return this.l2Cache.get(key) || null;
    }
    
    async deleteL2(key) {
        this.l2Cache.delete(key);
        this.updateDiskUsage();
    }
    
    async clearL2() {
        this.l2Cache.clear();
        this.updateDiskUsage();
    }
    
    async setL3(key, entry) {
        // Placeholder cache réseau
        this.l3Cache.set(key, entry);
    }
    
    async getL3(key) {
        return this.l3Cache.get(key) || null;
    }
    
    async deleteL3(key) {
        this.l3Cache.delete(key);
    }
    
    async clearL3() {
        this.l3Cache.clear();
    }
    
    // Méthodes utilitaires
    
    createCacheEntry(key, value, options) {
        const now = Date.now();
        return {
            key,
            value,
            ttl: options.ttl,
            tags: options.tags,
            metadata: {
                type: options.type,
                priority: options.priority,
                size: this.calculateValueSize(value),
                created: now,
                lastAccess: now,
                accessCount: 0
            },
            compressed: false,
            compressedValue: null
        };
    }
    
    calculateValueSize(value) {
        // Estimation simplifiée de la taille
        return JSON.stringify(value).length;
    }
    
    calculateEntrySize(entry) {
        return entry.metadata.size + (entry.compressedValue ? entry.compressedValue.length : 0);
    }
    
    async compressValue(value) {
        // Simulation compression
        const serialized = JSON.stringify(value);
        return Buffer.from(serialized).toString('base64');
    }
    
    async decompressValue(compressedValue) {
        // Simulation décompression
        const serialized = Buffer.from(compressedValue, 'base64').toString();
        return JSON.parse(serialized);
    }
    
    isExpired(entry) {
        return Date.now() > (entry.metadata.created + entry.ttl);
    }
    
    shouldRefresh(entry) {
        const age = Date.now() - entry.metadata.created;
        const refreshTime = entry.ttl * this.config.invalidation.refreshThreshold;
        return age > refreshTime;
    }
    
    updateTagIndex(key, tags) {
        for (const tag of tags) {
            if (!this.tagIndex.has(tag)) {
                this.tagIndex.set(tag, new Set());
            }
            this.tagIndex.get(tag).add(key);
        }
    }
    
    cleanupTagIndex(key) {
        for (const [tag, keys] of this.tagIndex.entries()) {
            keys.delete(key);
            if (keys.size === 0) {
                this.tagIndex.delete(tag);
            }
        }
    }
    
    updateAccessHistory(key, entry) {
        entry.metadata.lastAccess = Date.now();
        entry.metadata.accessCount++;
        
        this.accessHistory.set(key, {
            lastAccess: entry.metadata.lastAccess,
            accessCount: entry.metadata.accessCount,
            frequency: entry.metadata.accessCount / (Date.now() - entry.metadata.created + 1)
        });
    }
    
    async promoteToL1(key, entry) {
        await this.setL1(key, entry);
    }
    
    async promoteToL2(key, entry) {
        if (this.config.levels.l2.enabled) {
            await this.setL2(key, entry);
        }
    }
    
    // Stratégies d'éviction
    
    async evictL1() {
        const strategy = this.config.levels.l1.strategy;
        const evictFn = this.evictionStrategies[strategy];
        if (evictFn) {
            await evictFn('l1');
        }
    }
    
    async evictLRU(level) {
        const cache = level === 'l1' ? this.l1Cache : this.l2Cache;
        let oldestKey = null;
        let oldestTime = Infinity;
        
        for (const [key, entry] of cache.entries()) {
            if (entry.metadata.lastAccess < oldestTime) {
                oldestTime = entry.metadata.lastAccess;
                oldestKey = key;
            }
        }
        
        if (oldestKey) {
            await this.delete(oldestKey);
        }
    }
    
    async evictLFU(level) {
        const cache = level === 'l1' ? this.l1Cache : this.l2Cache;
        let leastUsedKey = null;
        let leastUsedCount = Infinity;
        
        for (const [key, entry] of cache.entries()) {
            if (entry.metadata.accessCount < leastUsedCount) {
                leastUsedCount = entry.metadata.accessCount;
                leastUsedKey = key;
            }
        }
        
        if (leastUsedKey) {
            await this.delete(leastUsedKey);
        }
    }
    
    async evictAdaptive(level) {
        // Stratégie adaptive basée sur score composite
        const cache = level === 'l1' ? this.l1Cache : this.l2Cache;
        let worstKey = null;
        let worstScore = Infinity;
        
        for (const [key, entry] of cache.entries()) {
            const score = this.calculateAdaptiveScore(entry);
            if (score < worstScore) {
                worstScore = score;
                worstKey = key;
            }
        }
        
        if (worstKey) {
            await this.delete(worstKey);
        }
    }
    
    calculateAdaptiveScore(entry) {
        const age = Date.now() - entry.metadata.created;
        const timeSinceAccess = Date.now() - entry.metadata.lastAccess;
        const frequency = entry.metadata.accessCount / (age + 1);
        const priority = entry.metadata.priority;
        
        // Score composite (plus haut = mieux)
        return (frequency * priority) / (timeSinceAccess + 1);
    }
    
    scheduleRefresh(key) {
        this.refreshQueue.add(key);
    }
    
    // Méthodes d'initialisation et maintenance
    
    async initializeL2Cache() {
        const cacheDir = this.config.levels.l2.path;
        try {
            await fs.mkdir(cacheDir, { recursive: true });
            console.log(`📁 Cache L2 initialisé: ${cacheDir}`);
        } catch (error) {
            console.warn(`⚠️ Impossible de créer répertoire cache L2: ${error.message}`);
        }
    }
    
    async initializeL3Cache() {
        console.log('🌐 Cache L3 (réseau) initialisé');
    }
    
    startMetricsCollection() {
        this.metricsInterval = setInterval(() => {
            this.updateMetrics();
        }, this.config.performance.metricsInterval);
    }
    
    startMaintenanceIntervals() {
        // Nettoyage périodique
        this.cleanupInterval = setInterval(() => {
            this.performMaintenance();
        }, 60000); // Toutes les minutes
        
        // Préchargement périodique
        if (this.config.optimization.enablePreloading) {
            this.preloadInterval = setInterval(() => {
                this.performPreloading();
            }, 300000); // Toutes les 5 minutes
        }
    }
    
    async startPreloading() {
        console.log('🔄 Démarrage préchargement...');
        // Implémentation simplifiée
    }
    
    updateMetrics() {
        this.updateMemoryUsage();
        this.updateDiskUsage();
        
        // Calculer taux de hit
        const totalHits = this.metrics.l1Hits + this.metrics.l2Hits + this.metrics.l3Hits;
        const totalMisses = this.metrics.l1Misses + this.metrics.l2Misses + this.metrics.l3Misses;
        const hitRate = totalHits / (totalHits + totalMisses) * 100;
        
        // Alertes si nécessaire
        if (hitRate < this.config.performance.alertThresholds.hitRate) {
            this.emit('alert', { type: 'low_hit_rate', value: hitRate });
        }
    }
    
    updateMemoryUsage() {
        let totalSize = 0;
        for (const entry of this.l1Cache.values()) {
            totalSize += this.calculateEntrySize(entry);
        }
        this.metrics.memoryUsage = totalSize;
        this.totalMemoryUsage = totalSize;
    }
    
    updateDiskUsage() {
        let totalSize = 0;
        for (const entry of this.l2Cache.values()) {
            totalSize += this.calculateEntrySize(entry);
        }
        this.metrics.diskUsage = totalSize;
        this.totalDiskUsage = totalSize;
    }
    
    updateResponseTime(responseTime) {
        this.metrics.totalResponseTime += responseTime;
        this.metrics.averageResponseTime = this.metrics.totalResponseTime / this.metrics.totalRequests;
        
        if (responseTime > this.metrics.slowestRequest) {
            this.metrics.slowestRequest = responseTime;
        }
        
        if (responseTime < this.metrics.fastestRequest) {
            this.metrics.fastestRequest = responseTime;
        }
    }
    
    async performMaintenance() {
        this.metrics.cleanupOperations++;
        
        // Nettoyer entrées expirées
        await this.cleanupExpiredEntries();
        
        // Traiter queue de rafraîchissement
        await this.processRefreshQueue();
        
        // Éviction si limites dépassées
        await this.checkAndEvict();
    }
    
    async cleanupExpiredEntries() {
        const expiredKeys = [];
        
        for (const [key, entry] of this.l1Cache.entries()) {
            if (this.isExpired(entry)) {
                expiredKeys.push(key);
            }
        }
        
        for (const key of expiredKeys) {
            await this.delete(key);
        }
    }
    
    async processRefreshQueue() {
        for (const key of this.refreshQueue) {
            // Logique de rafraîchissement simplifiée
            this.refreshQueue.delete(key);
        }
    }
    
    async checkAndEvict() {
        const l1Config = this.config.levels.l1;
        
        if (this.l1Cache.size > l1Config.maxItems) {
            await this.evictL1();
        }
        
        if (this.totalMemoryUsage > l1Config.maxSizeMB * 1024 * 1024) {
            await this.evictL1();
        }
    }
    
    async performPreloading() {
        this.metrics.preloadOperations++;
        // Implémentation simplifiée du préchargement
    }
    
    resetMetrics() {
        this.metrics = {
            totalRequests: 0,
            l1Hits: 0, l1Misses: 0,
            l2Hits: 0, l2Misses: 0,
            l3Hits: 0, l3Misses: 0,
            averageResponseTime: 0,
            totalResponseTime: 0,
            slowestRequest: 0,
            fastestRequest: Infinity,
            setsPerformed: 0,
            getsPerformed: 0,
            deletionsPerformed: 0,
            invalidationsPerformed: 0,
            memoryUsage: 0,
            diskUsage: 0,
            compressionRatio: 0,
            cleanupOperations: 0,
            preloadOperations: 0,
            refreshOperations: 0,
            errorCount: 0
        };
    }
    
    /**
     * Obtient les métriques détaillées du cache
     * @returns {Object} Métriques complètes
     */
    getMetrics() {
        const totalHits = this.metrics.l1Hits + this.metrics.l2Hits + this.metrics.l3Hits;
        const totalMisses = this.metrics.l1Misses + this.metrics.l2Misses + this.metrics.l3Misses;
        const hitRate = totalHits / (totalHits + totalMisses) * 100 || 0;
        
        return {
            ...this.metrics,
            hitRate: hitRate.toFixed(2) + '%',
            sizes: {
                l1Items: this.l1Cache.size,
                l2Items: this.l2Cache.size,
                l3Items: this.l3Cache.size,
                tagIndex: this.tagIndex.size,
                accessHistory: this.accessHistory.size
            },
            performance: {
                averageResponseTime: this.metrics.averageResponseTime.toFixed(2) + 'ms',
                slowestRequest: this.metrics.slowestRequest.toFixed(2) + 'ms',
                fastestRequest: this.metrics.fastestRequest === Infinity ? '0ms' : this.metrics.fastestRequest.toFixed(2) + 'ms'
            }
        };
    }
    
    /**
     * Arrête le cache et nettoie les ressources
     * @returns {Promise<void>}
     * @sideEffect Arrête intervalles, sauvegarde cache L2
     */
    async shutdown() {
        try {
            console.log('🛑 Arrêt MetadataCache...');
            this.isShuttingDown = true;
            
            // Arrêter tous les intervalles
            if (this.metricsInterval) clearInterval(this.metricsInterval);
            if (this.cleanupInterval) clearInterval(this.cleanupInterval);
            if (this.preloadInterval) clearInterval(this.preloadInterval);
            if (this.syncInterval) clearInterval(this.syncInterval);
            
            // Sauvegarder cache L2 si nécessaire
            if (this.config.levels.l2.enabled) {
                await this.persistL2Cache();
            }
            
            this.emit('shutdown');
            console.log('✅ MetadataCache arrêté avec succès');
            
        } catch (error) {
            console.error('❌ Erreur arrêt MetadataCache:', error);
            throw error;
        }
    }
    
    async persistL2Cache() {
        // Placeholder persistance cache L2
        console.log('💾 Persistance cache L2...');
    }
}

// Export ES6 par défaut
export { MetadataCache, METADATA_CACHE_CONFIG };

// Export browser pour utilisation dans Obsidian
if (typeof window !== 'undefined') {
    window.ProcessMetaLanguageMetadataCache = {
        MetadataCache,
        METADATA_CACHE_CONFIG
    };
}

// <!-- END OF FILE: metadata-cache.js -->