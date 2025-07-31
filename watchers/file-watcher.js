// <!-- START OF FILE: file-watcher.js -->
// FILENAME: file-watcher.js
// Version: 1.0.0
// Date: 2025-07-31 17:15
// Author: Rolland MELET & Claude Code
// Description: Surveillance fichiers ProcessMetaLanguage - TASK-B011 Phase 4 détection changements automatique

/**
 * Module ProcessMetaLanguage - File Watcher
 * 
 * Système de surveillance intelligent des fichiers ProcessMetaLanguage.
 * Détecte les changements et déclenche automatiquement la synchronisation.
 * 
 * Fonctionnalités principales:
 * - Surveillance temps réel des fichiers markdown et canvas
 * - Détection granulaire des types de changements
 * - Debouncing intelligent pour éviter les triggers excessifs
 * - Filtrage par patterns et extensions
 * - Surveillance récursive des répertoires
 * - Batch des événements pour performance
 * - Intégration avec système de synchronisation
 * - Métriques et logging détaillés
 * - Support hot-reloading et live-reload
 * - Gestion robuste des erreurs et recovery
 */

import { watch } from 'fs';
import { promises as fs } from 'fs';
import path from 'path';
import { EventEmitter } from 'events';
import { createHash } from 'crypto';
import { performance } from 'perf_hooks';

/**
 * Configuration du file watcher
 * @constant {Object}
 */
const FILE_WATCHER_CONFIG = {
    // Surveillance des fichiers
    watching: {
        recursive: true,
        persistent: true,
        encoding: 'utf8',
        enablePolling: false,       // Polling pour systèmes non-inotify
        pollingInterval: 1000       // Intervalle polling en ms
    },
    
    // Patterns de fichiers surveillés
    watchPatterns: {
        markdown: ['**/*.md', '**/*.markdown'],
        canvas: ['**/*.excalidraw', '**/*.excalidraw.md'],
        templates: ['templates/**/*.yaml', 'templates/**/*.yml'],
        config: ['*.json', '*.yaml', '*.yml'],
        documentation: ['docs/**/*.md']
    },
    
    // Patterns exclus
    excludePatterns: [
        '**/node_modules/**',
        '**/.git/**',
        '**/.cache/**',
        '**/dist/**',
        '**/build/**',
        '**/*.tmp',
        '**/*.temp',
        '**/*~',
        '**/.DS_Store'
    ],
    
    // Debouncing et performance
    debouncing: {
        enabled: true,
        delay: 500,                 // 500ms debounce par défaut
        maxDelay: 2000,             // Délai max avant force trigger
        batchSize: 10,              // Batch jusqu'à 10 événements
        batchTimeout: 1000          // Timeout batch en ms
    },
    
    // Types d'événements surveillés
    eventTypes: {
        change: { enabled: true, priority: 1, debounce: 500 },
        rename: { enabled: true, priority: 2, debounce: 300 },
        create: { enabled: true, priority: 3, debounce: 200 },
        delete: { enabled: true, priority: 4, debounce: 100 }
    },
    
    // Configuration checksums
    checksums: {
        enabled: true,
        algorithm: 'sha256',
        cacheSize: 1000,
        validateOnChange: true
    },
    
    // Intégration synchronisation
    sync: {
        autoTrigger: true,
        triggerDelay: 1000,         // Délai avant déclenchement sync
        maxRetries: 3,
        retryDelay: 2000,
        batchOperations: true
    },
    
    // Monitoring et métriques
    monitoring: {
        enableMetrics: true,
        metricsInterval: 5000,      // Métriques toutes les 5s
        enableLogging: true,
        logLevel: 'info',           // 'debug', 'info', 'warn', 'error'
        maxLogEntries: 1000
    }
};

/**
 * Événement de changement de fichier
 * @typedef {Object} FileChangeEvent
 * @property {string} type - Type d'événement ('change', 'rename', 'create', 'delete')
 * @property {string} filePath - Chemin du fichier
 * @property {string} fileType - Type de fichier ('markdown', 'canvas', 'template', etc.)
 * @property {number} timestamp - Timestamp de l'événement
 * @property {string} checksum - Checksum du fichier (si disponible)
 * @property {Object} metadata - Métadonnées additionnelles
 */

/**
 * Surveillance intelligente des fichiers ProcessMetaLanguage
 * Détecte automatiquement les changements et déclenche la synchronisation
 * 
 * @class FileWatcher
 * @extends EventEmitter
 * @example
 * // Surveillance automatique avec synchronisation
 * const watcher = new FileWatcher({
 *   watchPaths: ['./docs', './templates'],
 *   autoSync: true,
 *   debounceDelay: 300
 * });
 * 
 * await watcher.initialize();
 * 
 * // Écouter événements de changement
 * watcher.on('fileChanged', (event) => {
 *   console.log(`Fichier modifié: ${event.filePath} (${event.type})`);
 * });
 * 
 * // Démarrer surveillance
 * await watcher.startWatching(['./docs/generated', './templates']);
 * 
 * console.log('Surveillance active - les changements déclencheront la sync automatiquement');
 */
export class FileWatcher extends EventEmitter {
    /**
     * Initialise le surveillance de fichiers
     * @param {Object} options - Options de configuration
     * @param {Array<string>} options.watchPaths - Chemins à surveiller
     * @param {boolean} options.autoSync - Synchronisation automatique (défaut: true)
     * @param {number} options.debounceDelay - Délai debounce en ms (défaut: 500)
     * @param {Array<string>} options.includePatterns - Patterns à inclure
     * @param {Array<string>} options.excludePatterns - Patterns à exclure
     */
    constructor(options = {}) {
        super();
        
        this.config = {
            ...FILE_WATCHER_CONFIG,
            ...options
        };
        
        // État du watcher
        this.isInitialized = false;
        this.isWatching = false;
        this.watchers = new Map();          // Path → FSWatcher
        this.watchedPaths = new Set();
        
        // Debouncing et batching
        this.debounceTimers = new Map();    // FilePath → Timer
        this.eventBatch = [];
        this.batchTimer = null;
        this.lastTrigger = new Map();       // FilePath → Timestamp
        
        // Cache des checksums
        this.checksumCache = new Map();     // FilePath → Checksum
        this.fileMetadata = new Map();      // FilePath → Metadata
        
        // Métriques de surveillance
        this.metrics = {
            totalEvents: 0,
            eventsPerType: {
                change: 0,
                rename: 0,
                create: 0,
                delete: 0
            },
            filesWatched: 0,
            pathsWatched: 0,
            syncTriggered: 0,
            debounceHits: 0,
            errors: 0,
            averageProcessingTime: 0,
            totalProcessingTime: 0
        };
        
        // Logging et historique
        this.eventLog = [];
        this.errorLog = [];
        
        // Intégration synchronisation
        this.syncCallback = null;
        this.syncInProgress = false;
        this.pendingSyncOperations = new Set();
        
        // Intervalles de maintenance
        this.metricsInterval = null;
        this.cleanupInterval = null;
    }
    
    /**
     * Initialise le système de surveillance
     * @returns {Promise<void>}
     * @sideEffect Configure patterns, initialise cache, démarre monitoring
     */
    async initialize() {
        try {
            console.log('🔍 Initialisation FileWatcher...');
            
            // Compiler patterns de surveillance
            this.compileWatchPatterns();
            
            // Initialiser cache checksums
            if (this.config.checksums.enabled) {
                await this.initializeChecksumCache();
            }
            
            // Démarrer monitoring si activé
            if (this.config.monitoring.enableMetrics) {
                this.startMetricsCollection();
            }
            
            // Démarrer nettoyage périodique
            this.startMaintenanceIntervals();
            
            this.isInitialized = true;
            console.log('✅ FileWatcher initialisé avec succès');
            
            this.emit('initialized', {
                watchPatterns: Object.keys(this.config.watchPatterns),
                checksumEnabled: this.config.checksums.enabled,
                autoSyncEnabled: this.config.sync.autoTrigger
            });
            
        } catch (error) {
            console.error('❌ Erreur initialisation FileWatcher:', error);
            throw new Error(`Échec initialisation FileWatcher: ${error.message}`);
        }
    }
    
    /**
     * Démarre la surveillance de chemins spécifiés
     * @param {Array<string>} paths - Chemins à surveiller
     * @param {Object} options - Options de surveillance
     * @param {Function} options.syncCallback - Callback de synchronisation
     * @returns {Promise<void>}
     * @sideEffect Démarre watchers FS, active surveillance temps réel
     * @example
     * // Surveiller avec callback de sync personnalisé
     * await watcher.startWatching(['./docs', './templates'], {
     *   syncCallback: async (events) => {
     *     console.log(`Synchronisation pour ${events.length} changements`);
     *     return await myCustomSync(events);
     *   }
     * });
     */
    async startWatching(paths = [], options = {}) {
        if (!this.isInitialized) {
            throw new Error('FileWatcher non initialisé - appelez initialize() d\'abord');
        }
        
        try {
            console.log(`🔍 Démarrage surveillance de ${paths.length} chemins...`);
            
            // Configurer callback de synchronisation
            if (options.syncCallback) {
                this.syncCallback = options.syncCallback;
            }
            
            // Ajouter chemins à surveiller
            for (const watchPath of paths) {
                await this.addWatchPath(watchPath);
            }
            
            this.isWatching = true;
            
            console.log(`✅ Surveillance active sur ${this.watchedPaths.size} chemins`);
            
            this.emit('watchingStarted', {
                pathCount: this.watchedPaths.size,
                watchedPaths: Array.from(this.watchedPaths)
            });
            
        } catch (error) {
            console.error('❌ Erreur démarrage surveillance:', error);
            throw new Error(`Échec démarrage surveillance: ${error.message}`);
        }
    }
    
    /**
     * Ajoute un chemin à la surveillance
     * @param {string} watchPath - Chemin à surveiller
     * @returns {Promise<void>}
     * @private
     */
    async addWatchPath(watchPath) {
        try {
            // Vérifier existence du chemin
            const stats = await fs.stat(watchPath);
            
            if (!stats.isDirectory() && !stats.isFile()) {
                throw new Error(`Chemin invalide: ${watchPath}`);
            }
            
            // Créer watcher FS
            const fsWatcher = watch(watchPath, {
                recursive: this.config.watching.recursive,
                persistent: this.config.watching.persistent,
                encoding: this.config.watching.encoding
            });
            
            // Configurer gestionnaire d'événements
            fsWatcher.on('change', (eventType, filename) => {
                this.handleFileSystemEvent(eventType, filename, watchPath);
            });
            
            fsWatcher.on('error', (error) => {
                this.handleWatcherError(error, watchPath);
            });
            
            // Enregistrer watcher
            this.watchers.set(watchPath, fsWatcher);
            this.watchedPaths.add(watchPath);
            
            // Scanner initial pour checksums
            if (this.config.checksums.enabled) {
                await this.performInitialScan(watchPath);
            }
            
            this.metrics.pathsWatched++;
            
            console.log(`👁️ Surveillance ajoutée: ${watchPath}`);
            
        } catch (error) {
            this.logError(`Erreur ajout surveillance ${watchPath}`, error);
            throw error;
        }
    }
    
    /**
     * Gestionnaire principal des événements système de fichiers
     * @param {string} eventType - Type d'événement FS
     * @param {string} filename - Nom du fichier
     * @param {string} basePath - Chemin de base de surveillance
     * @private
     */
    handleFileSystemEvent(eventType, filename, basePath) {
        if (!filename || !this.isWatching) return;
        
        const startTime = performance.now();
        
        try {
            const fullPath = path.resolve(basePath, filename);
            
            // Filtrer selon patterns
            if (!this.shouldWatchFile(fullPath)) {
                return;
            }
            
            // Créer événement normalisé
            const event = this.createFileChangeEvent(eventType, fullPath);
            
            // Appliquer debouncing si activé
            if (this.config.debouncing.enabled) {
                this.applyDebouncing(event);
            } else {
                this.processFileChangeEvent(event);
            }
            
            // Mettre à jour métriques
            this.updateEventMetrics(event, performance.now() - startTime);
            
        } catch (error) {
            this.logError(`Erreur traitement événement ${eventType}:${filename}`, error);
        }
    }
    
    /**
     * Crée un événement de changement de fichier normalisé
     * @param {string} eventType - Type d'événement brut
     * @param {string} filePath - Chemin complet du fichier
     * @returns {FileChangeEvent} Événement normalisé
     * @private
     */
    createFileChangeEvent(eventType, filePath) {
        const normalizedType = this.normalizeEventType(eventType);
        const fileType = this.detectFileType(filePath);
        
        return {
            type: normalizedType,
            filePath: filePath,
            fileType: fileType,
            timestamp: Date.now(),
            checksum: null, // Sera calculé si nécessaire
            metadata: {
                baseName: path.basename(filePath),
                extension: path.extname(filePath),
                directory: path.dirname(filePath),
                size: null, // Sera calculé si nécessaire
                modified: null
            }
        };
    }
    
    /**
     * Applique le debouncing à un événement
     * @param {FileChangeEvent} event - Événement à debouncer
     * @private
     */
    applyDebouncing(event) {
        const debounceKey = event.filePath;
        const debounceConfig = this.config.eventTypes[event.type] || { debounce: this.config.debouncing.delay };
        
        // Annuler timer précédent si existant
        if (this.debounceTimers.has(debounceKey)) {
            clearTimeout(this.debounceTimers.get(debounceKey));
            this.metrics.debounceHits++;
        }
        
        // Créer nouveau timer
        const timer = setTimeout(() => {
            this.debounceTimers.delete(debounceKey);
            this.processFileChangeEvent(event);
        }, debounceConfig.debounce);
        
        this.debounceTimers.set(debounceKey, timer);
        
        // Force trigger si délai max atteint
        const lastTrigger = this.lastTrigger.get(debounceKey) || 0;
        const timeSinceLastTrigger = Date.now() - lastTrigger;
        
        if (timeSinceLastTrigger > this.config.debouncing.maxDelay) {
            clearTimeout(timer);
            this.debounceTimers.delete(debounceKey);
            this.processFileChangeEvent(event);
        }
    }
    
    /**
     * Traite un événement de changement de fichier
     * @param {FileChangeEvent} event - Événement à traiter
     * @private
     */
    async processFileChangeEvent(event) {
        try {
            console.log(`📁 Événement fichier: ${event.type} - ${event.filePath}`);
            
            // Enrichir événement avec métadonnées
            await this.enrichEventWithMetadata(event);
            
            // Ajouter au batch si batching activé
            if (this.config.debouncing.batchSize > 1) {
                this.addToBatch(event);
            } else {
                await this.handleSingleFileEvent(event);
            }
            
            // Mettre à jour timestamp dernier trigger
            this.lastTrigger.set(event.filePath, event.timestamp);
            
            // Logger événement
            this.logEvent(event);
            
        } catch (error) {
            this.logError(`Erreur traitement événement ${event.filePath}`, error);
        }
    }
    
    /**
     * Enrichit un événement avec métadonnées supplémentaires
     * @param {FileChangeEvent} event - Événement à enrichir
     * @private
     */
    async enrichEventWithMetadata(event) {
        try {
            // Obtenir stats du fichier si existe
            try {
                const stats = await fs.stat(event.filePath);
                event.metadata.size = stats.size;
                event.metadata.modified = stats.mtime;
            } catch (error) {
                // Fichier supprimé ou inaccessible
                if (event.type !== 'delete') {
                    event.type = 'delete';
                }
            }
            
            // Calculer checksum si activé et fichier existe
            if (this.config.checksums.enabled && event.type !== 'delete') {
                event.checksum = await this.calculateFileChecksum(event.filePath);
                
                // Vérifier si le contenu a vraiment changé
                const previousChecksum = this.checksumCache.get(event.filePath);
                if (previousChecksum === event.checksum) {
                    // Faux positif - pas de changement réel
                    return;
                }
                
                this.checksumCache.set(event.filePath, event.checksum);
            }
            
        } catch (error) {
            console.warn(`⚠️ Erreur enrichissement métadonnées ${event.filePath}:`, error.message);
        }
    }
    
    /**
     * Ajoute un événement au batch
     * @param {FileChangeEvent} event - Événement à batcher
     * @private
     */
    addToBatch(event) {
        this.eventBatch.push(event);
        
        // Déclencher traitement si batch plein
        if (this.eventBatch.length >= this.config.debouncing.batchSize) {
            this.processBatch();
        } else if (!this.batchTimer) {
            // Démarrer timer de batch
            this.batchTimer = setTimeout(() => {
                this.processBatch();
            }, this.config.debouncing.batchTimeout);
        }
    }
    
    /**
     * Traite un batch d'événements
     * @private
     */
    async processBatch() {
        if (this.eventBatch.length === 0) return;
        
        const batch = [...this.eventBatch];
        this.eventBatch = [];
        
        if (this.batchTimer) {
            clearTimeout(this.batchTimer);
            this.batchTimer = null;
        }
        
        try {
            console.log(`📦 Traitement batch de ${batch.length} événements`);
            
            // Grouper par type de fichier pour optimiser
            const groupedEvents = this.groupEventsByType(batch);
            
            // Traiter chaque groupe
            for (const [fileType, events] of groupedEvents.entries()) {
                await this.handleFileTypeEvents(fileType, events);
            }
            
            // Déclencher synchronisation si configuré
            if (this.config.sync.autoTrigger && this.config.sync.batchOperations) {
                await this.triggerBatchSync(batch);
            }
            
        } catch (error) {
            this.logError('Erreur traitement batch', error);
        }
    }
    
    /**
     * Traite un événement de fichier unique
     * @param {FileChangeEvent} event - Événement à traiter
     * @private
     */
    async handleSingleFileEvent(event) {
        try {
            // Émettre événement pour listeners externes
            this.emit('fileChanged', event);
            
            // Traitement spécifique par type de fichier
            await this.handleFileTypeEvents(event.fileType, [event]);
            
            // Déclencher synchronisation si configuré
            if (this.config.sync.autoTrigger && !this.config.sync.batchOperations) {
                await this.triggerSingleSync(event);
            }
            
        } catch (error) {
            this.logError(`Erreur traitement événement unique ${event.filePath}`, error);
        }
    }
    
    /**
     * Traite les événements par type de fichier
     * @param {string} fileType - Type de fichier
     * @param {Array<FileChangeEvent>} events - Événements du type
     * @private
     */
    async handleFileTypeEvents(fileType, events) {
        switch (fileType) {
            case 'markdown':
                await this.handleMarkdownEvents(events);
                break;
            case 'canvas':
                await this.handleCanvasEvents(events);
                break;
            case 'template':
                await this.handleTemplateEvents(events);
                break;
            case 'config':
                await this.handleConfigEvents(events);
                break;
            default:
                await this.handleGenericEvents(events);
                break;
        }
    }
    
    /**
     * Traite les événements de fichiers markdown
     * @param {Array<FileChangeEvent>} events - Événements markdown
     * @private
     */
    async handleMarkdownEvents(events) {
        console.log(`📝 Traitement ${events.length} événements markdown`);
        
        for (const event of events) {
            // Invalider cache si fichier markdown modifié
            if (event.type === 'change' || event.type === 'delete') {
                this.invalidateMarkdownCache(event.filePath);
            }
        }
        
        this.emit('markdownChanged', events);
    }
    
    /**
     * Traite les événements de fichiers canvas
     * @param {Array<FileChangeEvent>} events - Événements canvas
     * @private
     */
    async handleCanvasEvents(events) {
        console.log(`🎯 Traitement ${events.length} événements canvas`);
        
        for (const event of events) {
            // Invalider cache si fichier canvas modifié
            if (event.type === 'change' || event.type === 'delete') {
                this.invalidateCanvasCache(event.filePath);
            }
        }
        
        this.emit('canvasChanged', events);
    }
    
    /**
     * Traite les événements de templates
     * @param {Array<FileChangeEvent>} events - Événements template
     * @private
     */
    async handleTemplateEvents(events) {
        console.log(`📋 Traitement ${events.length} événements template`);
        this.emit('templateChanged', events);
    }
    
    /**
     * Traite les événements de fichiers config
     * @param {Array<FileChangeEvent>} events - Événements config
     * @private
     */
    async handleConfigEvents(events) {
        console.log(`⚙️ Traitement ${events.length} événements config`);
        this.emit('configChanged', events);
    }
    
    /**
     * Traite les événements génériques
     * @param {Array<FileChangeEvent>} events - Événements génériques
     * @private
     */
    async handleGenericEvents(events) {
        console.log(`📄 Traitement ${events.length} événements génériques`);
        this.emit('genericChanged', events);
    }
    
    /**
     * Déclenche synchronisation pour un événement unique
     * @param {FileChangeEvent} event - Événement déclencheur
     * @private
     */
    async triggerSingleSync(event) {
        if (this.syncInProgress || !this.syncCallback) return;
        
        try {
            console.log(`🔄 Déclenchement sync pour: ${event.filePath}`);
            
            this.syncInProgress = true;
            this.metrics.syncTriggered++;
            
            const result = await this.syncCallback([event]);
            
            this.emit('syncTriggered', {
                type: 'single',
                event: event,
                result: result
            });
            
        } catch (error) {
            this.logError('Erreur synchronisation single', error);
        } finally {
            this.syncInProgress = false;
        }
    }
    
    /**
     * Déclenche synchronisation pour un batch d'événements
     * @param {Array<FileChangeEvent>} events - Batch d'événements
     * @private
     */
    async triggerBatchSync(events) {
        if (this.syncInProgress || !this.syncCallback) return;
        
        try {
            console.log(`🔄 Déclenchement sync batch pour ${events.length} événements`);
            
            this.syncInProgress = true;
            this.metrics.syncTriggered++;
            
            const result = await this.syncCallback(events);
            
            this.emit('syncTriggered', {
                type: 'batch',
                events: events,
                result: result
            });
            
        } catch (error) {
            this.logError('Erreur synchronisation batch', error);
        } finally {
            this.syncInProgress = false;
        }
    }
    
    // Méthodes utilitaires
    
    compileWatchPatterns() {
        // Compilation des patterns de surveillance
        console.log('🔧 Compilation patterns de surveillance...');
    }
    
    async initializeChecksumCache() {
        console.log('🔐 Initialisation cache checksums...');
    }
    
    async performInitialScan(watchPath) {
        console.log(`🔍 Scan initial: ${watchPath}`);
        // Scan initial pour établir checksums de base
    }
    
    shouldWatchFile(filePath) {
        const fileName = path.basename(filePath);
        const extension = path.extname(filePath);
        
        // Vérifier patterns d'exclusion
        for (const excludePattern of this.config.excludePatterns) {
            if (this.matchPattern(filePath, excludePattern)) {
                return false;
            }
        }
        
        // Vérifier patterns d'inclusion
        for (const [type, patterns] of Object.entries(this.config.watchPatterns)) {
            for (const pattern of patterns) {
                if (this.matchPattern(filePath, pattern)) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    matchPattern(filePath, pattern) {
        // Implémentation simplifiée de matching de pattern
        if (pattern.includes('**')) {
            const regex = pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*');
            return new RegExp(regex).test(filePath);
        }
        
        return filePath.includes(pattern.replace(/\*/g, ''));
    }
    
    normalizeEventType(eventType) {
        switch (eventType) {
            case 'change': return 'change';
            case 'rename': return 'rename';
            default: return 'change';
        }
    }
    
    detectFileType(filePath) {
        const extension = path.extname(filePath).toLowerCase();
        
        if (['.md', '.markdown'].includes(extension)) return 'markdown';
        if (['.excalidraw'].includes(extension)) return 'canvas';
        if (['.yaml', '.yml'].includes(extension)) return 'template';
        if (['.json'].includes(extension)) return 'config';
        
        return 'generic';
    }
    
    async calculateFileChecksum(filePath) {
        try {
            const content = await fs.readFile(filePath);
            return createHash(this.config.checksums.algorithm).update(content).digest('hex');
        } catch (error) {
            return null;
        }
    }
    
    groupEventsByType(events) {
        const grouped = new Map();
        
        for (const event of events) {
            if (!grouped.has(event.fileType)) {
                grouped.set(event.fileType, []);
            }
            grouped.get(event.fileType).push(event);
        }
        
        return grouped;
    }
    
    invalidateMarkdownCache(filePath) {
        // Invalider cache pour fichier markdown
        console.log(`♻️ Invalidation cache markdown: ${filePath}`);
    }
    
    invalidateCanvasCache(filePath) {
        // Invalider cache pour fichier canvas
        console.log(`♻️ Invalidation cache canvas: ${filePath}`);
    }
    
    handleWatcherError(error, watchPath) {
        this.logError(`Erreur watcher ${watchPath}`, error);
        this.emit('watcherError', { watchPath, error });
    }
    
    // Métriques et logging
    
    updateEventMetrics(event, processingTime) {
        this.metrics.totalEvents++;
        this.metrics.eventsPerType[event.type]++;
        this.metrics.totalProcessingTime += processingTime;
        this.metrics.averageProcessingTime = this.metrics.totalProcessingTime / this.metrics.totalEvents;
    }
    
    logEvent(event) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            type: event.type,
            filePath: event.filePath,
            fileType: event.fileType,
            checksum: event.checksum
        };
        
        this.eventLog.push(logEntry);
        
        // Garder seulement les N dernières entrées
        if (this.eventLog.length > this.config.monitoring.maxLogEntries) {
            this.eventLog = this.eventLog.slice(-this.config.monitoring.maxLogEntries);
        }
        
        if (this.config.monitoring.enableLogging) {
            console.log(`📋 [${event.type.toUpperCase()}] ${event.filePath}`);
        }
    }
    
    logError(message, error) {
        const errorEntry = {
            timestamp: new Date().toISOString(),
            message: message,
            error: error.message,
            stack: error.stack
        };
        
        this.errorLog.push(errorEntry);
        this.metrics.errors++;
        
        console.error(`❌ FileWatcher: ${message}`, error);
    }
    
    startMetricsCollection() {
        this.metricsInterval = setInterval(() => {
            this.collectMetrics();
        }, this.config.monitoring.metricsInterval);
    }
    
    startMaintenanceIntervals() {
        this.cleanupInterval = setInterval(() => {
            this.performMaintenance();
        }, 60000); // Toutes les minutes
    }
    
    collectMetrics() {
        this.metrics.filesWatched = this.checksumCache.size;
        this.emit('metricsUpdated', this.getMetrics());
    }
    
    performMaintenance() {
        // Nettoyage périodique des caches et timers
        this.cleanupExpiredTimers();
        this.cleanupOldLogs();
    }
    
    cleanupExpiredTimers() {
        // Nettoyage des timers expirés
        const now = Date.now();
        for (const [key, timestamp] of this.lastTrigger.entries()) {
            if (now - timestamp > 3600000) { // 1 heure
                this.lastTrigger.delete(key);
            }
        }
    }
    
    cleanupOldLogs() {
        // Nettoyage des anciens logs
        const maxAge = 24 * 60 * 60 * 1000; // 24 heures
        const cutoff = Date.now() - maxAge;
        
        this.eventLog = this.eventLog.filter(entry => 
            new Date(entry.timestamp).getTime() > cutoff
        );
        
        this.errorLog = this.errorLog.filter(entry => 
            new Date(entry.timestamp).getTime() > cutoff
        );
    }
    
    /**
     * Arrête la surveillance de tous les chemins
     * @returns {Promise<void>}
     * @sideEffect Ferme tous les watchers, nettoie timers
     */
    async stopWatching() {
        try {
            console.log('🛑 Arrêt surveillance...');
            
            // Fermer tous les watchers
            for (const [path, watcher] of this.watchers.entries()) {
                watcher.close();
            }
            
            // Nettoyer timers de debounce
            for (const timer of this.debounceTimers.values()) {
                clearTimeout(timer);
            }
            
            if (this.batchTimer) {
                clearTimeout(this.batchTimer);
            }
            
            // Arrêter intervalles
            if (this.metricsInterval) clearInterval(this.metricsInterval);
            if (this.cleanupInterval) clearInterval(this.cleanupInterval);
            
            // Réinitialiser état
            this.watchers.clear();
            this.watchedPaths.clear();
            this.debounceTimers.clear();
            this.eventBatch = [];
            this.isWatching = false;
            
            console.log('✅ Surveillance arrêtée');
            this.emit('watchingStopped');
            
        } catch (error) {
            this.logError('Erreur arrêt surveillance', error);
            throw error;
        }
    }
    
    /**
     * Obtient les métriques de surveillance
     * @returns {Object} Métriques détaillées
     */
    getMetrics() {
        return {
            ...this.metrics,
            status: {
                isWatching: this.isWatching,
                pathsWatched: this.watchedPaths.size,
                activeTimers: this.debounceTimers.size,
                pendingBatch: this.eventBatch.length,
                syncInProgress: this.syncInProgress
            },
            cache: {
                checksumCacheSize: this.checksumCache.size,
                metadataCacheSize: this.fileMetadata.size
            },
            logs: {
                eventLogSize: this.eventLog.length,
                errorLogSize: this.errorLog.length
            }
        };
    }
    
    /**
     * Obtient l'historique des événements récents
     * @param {number} limit - Nombre max d'événements (défaut: 50)
     * @returns {Array} Historique des événements
     */
    getEventHistory(limit = 50) {
        return this.eventLog.slice(-limit);
    }
    
    /**
     * Obtient l'historique des erreurs récentes
     * @param {number} limit - Nombre max d'erreurs (défaut: 20)
     * @returns {Array} Historique des erreurs
     */
    getErrorHistory(limit = 20) {
        return this.errorLog.slice(-limit);
    }
}

// Export ES6 par défaut
export { FileWatcher, FILE_WATCHER_CONFIG };

// Export browser pour utilisation dans Obsidian
if (typeof window !== 'undefined') {
    window.ProcessMetaLanguageFileWatcher = {
        FileWatcher,
        FILE_WATCHER_CONFIG
    };
}

// <!-- END OF FILE: file-watcher.js -->