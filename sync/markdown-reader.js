// <!-- START OF FILE: markdown-reader.js -->
// FILENAME: markdown-reader.js
// Version: 1.0.0
// Date: 2025-07-31 15:30
// Author: Rolland MELET & Claude Code
// Description: Lecteur markdown ProcessMetaLanguage - synchronisation markdown → canvas - TASK-B009 Phase 4

/**
 * Module ProcessMetaLanguage - Markdown Reader
 * 
 * Lecteur de fichiers markdown ProcessMetaLanguage pour synchronisation bidirectionnelle.
 * Lit les métadonnées YAML et contenu markdown pour mise à jour des éléments canvas.
 * 
 * Fonctionnalités principales:
 * - Lecture métadonnées YAML frontmatter
 * - Parsing contenu markdown structuré
 * - Extraction données objects/states/actions
 * - Validation cohérence avec modèle ProcessMetaLanguage
 * - Support batch pour performance optimisée
 * - Cache intelligent pour éviter re-lectures
 * - Conformité architecture État-Actions deux niveaux
 */

import { fs } from '../utils/obsidian-adapter.js';
import { path } from '../utils/obsidian-adapter.js';
import yaml from 'js-yaml';

/**
 * Configuration du lecteur markdown
 * @constant {Object}
 */
const MARKDOWN_READER_CONFIG = {
    // Extensions de fichiers supportées
    supportedExtensions: ['.md', '.markdown'],
    
    // Répertoires de documentation
    documentationPaths: {
        objects: './docs/generated/objects',
        states: './docs/generated/states',
        actions: './docs/generated/actions',
        workflows: './docs/generated/workflows',
        userTemplates: './templates/user-templates'
    },
    
    // Patterns de nommage
    filePatterns: {
        object: /^obj_(.+)\.md$/,
        state: /^state_(.+)\.md$/,
        action: /^action_(.+)\.md$/,
        workflow: /^workflow_(.+)\.md$/
    },
    
    // Métadonnées YAML requises
    requiredYamlFields: {
        object: ['object_id', 'object_name', 'object_type', 'position', 'sync_status'],
        state: ['state_id', 'state_name', 'disposition', 'object_id', 'position', 'sync_status'],
        action: ['action_id', 'action_name', 'action_type', 'state_id', 'position', 'sync_status']
    },
    
    // Performance
    performance: {
        maxReadTimeMs: 3000,
        batchSize: 20,
        enableCaching: true,
        cacheTTL: 300000 // 5 minutes
    },
    
    // Validation
    validation: {
        strictMode: true,
        validateReferences: true,
        checkConsistency: true
    }
};

/**
 * Lecteur de documentation markdown ProcessMetaLanguage
 * Gère la lecture et parsing des fichiers markdown pour synchronisation canvas
 * 
 * @class MarkdownReader
 * @example
 * // Lire documentation markdown
 * const reader = new MarkdownReader();
 * await reader.initialize();
 * 
 * // Lecture batch de fichiers
 * const markdownData = await reader.readMarkdownBatch([
 *   './docs/generated/objects/obj_material_001.md',
 *   './docs/generated/states/state_receiving_001.md'
 * ]);
 * 
 * console.log(`${markdownData.objects.length} objets lus`);
 */
export class MarkdownReader {
    /**
     * Initialise le lecteur markdown
     * @param {Object} options - Options de configuration
     * @param {boolean} options.enableCaching - Activer le cache (défaut: true)
     * @param {boolean} options.strictMode - Mode validation stricte (défaut: true)
     * @param {number} options.batchSize - Taille des lots de lecture (défaut: 20)
     */
    constructor(options = {}) {
        this.config = {
            ...MARKDOWN_READER_CONFIG,
            ...options
        };
        
        // Cache de lecture
        this.readCache = new Map();
        this.metadataCache = new Map();
        
        // Métriques de performance
        this.metrics = {
            filesRead: 0,
            totalReadTime: 0,
            cacheHits: 0,
            parseErrors: 0,
            validationErrors: 0
        };
        
        // État d'initialisation
        this.initialized = false;
    }
    
    /**
     * Initialise le lecteur avec vérification des répertoires
     * @returns {Promise<void>}
     * @sideEffect Vérifie l'existence des répertoires de documentation
     */
    async initialize() {
        try {
            // Vérifier répertoires de documentation
            for (const [key, dirPath] of Object.entries(this.config.documentationPaths)) {
                try {
                    await fs.access(dirPath);
                } catch (error) {
                    console.warn(`⚠️ Répertoire ${key} non trouvé: ${dirPath}`);
                }
            }
            
            this.initialized = true;
            console.log('✅ MarkdownReader initialisé avec succès');
            
        } catch (error) {
            console.error('❌ Erreur initialisation MarkdownReader:', error);
            throw new Error(`Échec initialisation MarkdownReader: ${error.message}`);
        }
    }
    
    /**
     * Lit et parse un fichier markdown ProcessMetaLanguage
     * @param {string} filePath - Chemin vers le fichier markdown
     * @param {Object} options - Options de lecture
     * @param {boolean} options.useCache - Utiliser le cache (défaut: true)
     * @param {boolean} options.validate - Valider le contenu (défaut: true)
     * @returns {Promise<Object>} Données markdown parsées
     * @example
     * // Lire un fichier objet
     * const objectData = await reader.readMarkdownFile('./docs/generated/objects/obj_material_001.md');
     * console.log(`Objet: ${objectData.metadata.object_name}`);
     */
    async readMarkdownFile(filePath, options = {}) {
        const startTime = performance.now();
        const opts = {
            useCache: options.useCache !== false,
            validate: options.validate !== false,
            ...options
        };
        
        try {
            // Vérifier cache si activé
            const cacheKey = this.generateCacheKey(filePath);
            if (opts.useCache && this.readCache.has(cacheKey)) {
                this.metrics.cacheHits++;
                return this.readCache.get(cacheKey);
            }
            
            // Lire le fichier
            const fileContent = await fs.readFile(filePath, 'utf8');
            
            // Parser le contenu markdown avec frontmatter YAML
            const parsedContent = this.parseMarkdownContent(fileContent, filePath);
            
            // Identifier le type d'élément
            const elementType = this.identifyElementType(filePath, parsedContent.metadata);
            parsedContent.elementType = elementType;
            
            // Validation si activée
            if (opts.validate) {
                this.validateMarkdownContent(parsedContent, elementType);
            }
            
            // Enrichir avec métadonnées de fichier
            const fileStat = await fs.stat(filePath);
            parsedContent.fileInfo = {
                path: filePath,
                size: fileStat.size,
                modified: fileStat.mtime,
                accessed: fileStat.atime
            };
            
            // Mise en cache
            if (opts.useCache) {
                this.readCache.set(cacheKey, parsedContent);
                
                // Nettoyage cache TTL
                setTimeout(() => {
                    this.readCache.delete(cacheKey);
                }, this.config.performance.cacheTTL);
            }
            
            // Mise à jour métriques
            this.metrics.filesRead++;
            this.metrics.totalReadTime += performance.now() - startTime;
            
            return parsedContent;
            
        } catch (error) {
            this.metrics.parseErrors++;
            console.error(`❌ Erreur lecture markdown ${filePath}:`, error);
            throw new Error(`Échec lecture markdown: ${error.message}`);
        }
    }
    
    /**
     * Lit plusieurs fichiers markdown en batch
     * @param {Array<string>} filePaths - Liste des chemins de fichiers
     * @param {Object} options - Options de lecture batch
     * @param {number} options.batchSize - Taille des lots (défaut: config.batchSize)
     * @param {boolean} options.failFast - Arrêter au premier échec (défaut: false)
     * @returns {Promise<Object>} Données markdown groupées par type
     * @example
     * // Lecture batch de documentation
     * const data = await reader.readMarkdownBatch([
     *   './docs/objects/obj_001.md',
     *   './docs/states/state_001.md'
     * ]);
     * console.log(`${data.objects.length} objets, ${data.states.length} états`);
     */
    async readMarkdownBatch(filePaths, options = {}) {
        const startTime = performance.now();
        const opts = {
            batchSize: options.batchSize || this.config.performance.batchSize,
            failFast: options.failFast || false,
            ...options
        };
        
        try {
            console.log(`📚 Lecture batch de ${filePaths.length} fichiers markdown...`);
            
            // Initialiser résultat groupé
            const result = {
                objects: [],
                states: [],
                actions: [],
                workflows: [],
                errors: [],
                metadata: {
                    totalFiles: filePaths.length,
                    processedFiles: 0,
                    processingTime: 0,
                    errors: 0
                }
            };
            
            // Traitement par lots pour performance
            for (let i = 0; i < filePaths.length; i += opts.batchSize) {
                const batch = filePaths.slice(i, i + opts.batchSize);
                
                // Traitement parallèle du lot
                const batchPromises = batch.map(async (filePath) => {
                    try {
                        const markdownData = await this.readMarkdownFile(filePath, options);
                        return { success: true, data: markdownData };
                    } catch (error) {
                        return { success: false, error, filePath };
                    }
                });
                
                const batchResults = await Promise.all(batchPromises);
                
                // Consolidation des résultats
                for (const batchResult of batchResults) {
                    if (batchResult.success) {
                        const data = batchResult.data;
                        
                        // Grouper par type d'élément
                        switch (data.elementType) {
                            case 'object':
                                result.objects.push(data);
                                break;
                            case 'state':
                                result.states.push(data);
                                break;
                            case 'action':
                                result.actions.push(data);
                                break;
                            case 'workflow':
                                result.workflows.push(data);
                                break;
                        }
                        
                        result.metadata.processedFiles++;
                    } else {
                        result.errors.push({
                            filePath: batchResult.filePath,
                            error: batchResult.error.message
                        });
                        result.metadata.errors++;
                        
                        if (opts.failFast) {
                            throw new Error(`Échec lecture batch: ${batchResult.error.message}`);
                        }
                    }
                }
            }
            
            result.metadata.processingTime = performance.now() - startTime;
            
            console.log(`✅ Batch terminé: ${result.metadata.processedFiles}/${result.metadata.totalFiles} fichiers (${result.metadata.processingTime.toFixed(2)}ms)`);
            
            return result;
            
        } catch (error) {
            console.error('❌ Erreur lecture batch markdown:', error);
            throw new Error(`Échec lecture batch markdown: ${error.message}`);
        }
    }
    
    /**
     * Découvre automatiquement les fichiers markdown dans les répertoires
     * @param {Object} options - Options de découverte
     * @param {Array<string>} options.includeTypes - Types à inclure (défaut: tous)
     * @param {boolean} options.recursive - Recherche récursive (défaut: true)
     * @returns {Promise<Array<string>>} Liste des chemins de fichiers trouvés
     * @example
     * // Découvrir tous les fichiers markdown
     * const files = await reader.discoverMarkdownFiles();
     * console.log(`${files.length} fichiers trouvés`);
     */
    async discoverMarkdownFiles(options = {}) {
        const opts = {
            includeTypes: options.includeTypes || ['objects', 'states', 'actions', 'workflows'],
            recursive: options.recursive !== false,
            ...options
        };
        
        try {
            const discoveredFiles = [];
            
            for (const type of opts.includeTypes) {
                const dirPath = this.config.documentationPaths[type];
                if (!dirPath) continue;
                
                try {
                    const files = await this.scanDirectory(dirPath, opts.recursive);
                    const markdownFiles = files.filter(file => 
                        this.config.supportedExtensions.some(ext => file.endsWith(ext))
                    );
                    
                    discoveredFiles.push(...markdownFiles);
                } catch (error) {
                    console.warn(`⚠️ Impossible de scanner ${type}: ${error.message}`);
                }
            }
            
            console.log(`🔍 Découverte: ${discoveredFiles.length} fichiers markdown trouvés`);
            return discoveredFiles;
            
        } catch (error) {
            console.error('❌ Erreur découverte fichiers markdown:', error);
            throw new Error(`Échec découverte markdown: ${error.message}`);
        }
    }
    
    /**
     * Lit toute la documentation markdown disponible
     * @param {Object} options - Options de lecture complète
     * @returns {Promise<Object>} Toutes les données markdown organisées
     * @example
     * // Lire toute la documentation
     * const allData = await reader.readAllMarkdown();
     * console.log(`Total: ${allData.summary.totalElements} éléments`);
     */
    async readAllMarkdown(options = {}) {
        try {
            console.log('📖 Lecture complète documentation markdown...');
            
            // Découvrir tous les fichiers
            const allFiles = await this.discoverMarkdownFiles(options);
            
            if (allFiles.length === 0) {
                console.warn('⚠️ Aucun fichier markdown trouvé');
                return {
                    objects: [],
                    states: [],
                    actions: [],
                    workflows: [],
                    summary: { totalElements: 0, totalFiles: 0 }
                };
            }
            
            // Lecture batch de tous les fichiers
            const allData = await this.readMarkdownBatch(allFiles, options);
            
            // Enrichir avec résumé
            allData.summary = {
                totalElements: allData.objects.length + allData.states.length + 
                              allData.actions.length + allData.workflows.length,
                totalFiles: allData.metadata.totalFiles,
                processingTime: allData.metadata.processingTime,
                errorRate: allData.metadata.errors / allData.metadata.totalFiles
            };
            
            return allData;
            
        } catch (error) {
            console.error('❌ Erreur lecture complète markdown:', error);
            throw new Error(`Échec lecture complète markdown: ${error.message}`);
        }
    }
    
    /**
     * Parse le contenu markdown avec frontmatter YAML
     * @param {string} content - Contenu du fichier
     * @param {string} filePath - Chemin du fichier pour contexte
     * @returns {Object} Contenu parsé avec métadonnées et corps
     * @private
     */
    parseMarkdownContent(content, filePath) {
        try {
            // Séparer frontmatter YAML et contenu markdown
            const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
            const match = content.match(frontmatterRegex);
            
            if (!match) {
                throw new Error('Frontmatter YAML manquant ou mal formaté');
            }
            
            const [, yamlContent, markdownContent] = match;
            
            // Parser YAML
            const metadata = yaml.load(yamlContent);
            
            // Parser sections markdown
            const sections = this.parseMarkdownSections(markdownContent);
            
            return {
                metadata: metadata || {},
                content: markdownContent.trim(),
                sections: sections,
                raw: content
            };
            
        } catch (error) {
            throw new Error(`Erreur parsing markdown ${filePath}: ${error.message}`);
        }
    }
    
    /**
     * Parse les sections markdown
     * @param {string} markdownContent - Contenu markdown
     * @returns {Object} Sections parsées
     * @private
     */
    parseMarkdownSections(markdownContent) {
        const sections = {};
        const lines = markdownContent.split('\n');
        let currentSection = null;
        let currentContent = [];
        
        for (const line of lines) {
            // Détecter en-têtes de section
            const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
            
            if (headerMatch) {
                // Sauvegarder section précédente
                if (currentSection) {
                    sections[currentSection] = currentContent.join('\n').trim();
                }
                
                // Nouvelle section
                const [, hashes, title] = headerMatch;
                currentSection = title.toLowerCase().replace(/[^a-z0-9]/g, '_');
                currentContent = [];
            } else if (currentSection) {
                currentContent.push(line);
            }
        }
        
        // Sauvegarder dernière section
        if (currentSection) {
            sections[currentSection] = currentContent.join('\n').trim();
        }
        
        return sections;
    }
    
    /**
     * Identifie le type d'élément ProcessMetaLanguage
     * @param {string} filePath - Chemin du fichier
     * @param {Object} metadata - Métadonnées YAML
     * @returns {string} Type d'élément (object, state, action, workflow)
     * @private
     */
    identifyElementType(filePath, metadata) {
        const fileName = path.basename(filePath);
        
        // Identification par pattern de nom de fichier
        for (const [type, pattern] of Object.entries(this.config.filePatterns)) {
            if (pattern.test(fileName)) {
                return type;
            }
        }
        
        // Identification par métadonnées
        if (metadata.object_id && metadata.object_type) return 'object';
        if (metadata.state_id && metadata.disposition) return 'state';
        if (metadata.action_id && metadata.action_type) return 'action';
        if (metadata.workflow_id) return 'workflow';
        
        // Identification par chemin
        if (filePath.includes('/objects/')) return 'object';
        if (filePath.includes('/states/')) return 'state';
        if (filePath.includes('/actions/')) return 'action';
        if (filePath.includes('/workflows/')) return 'workflow';
        
        return 'unknown';
    }
    
    /**
     * Valide le contenu markdown
     * @param {Object} parsedContent - Contenu parsé
     * @param {string} elementType - Type d'élément
     * @private
     */
    validateMarkdownContent(parsedContent, elementType) {
        try {
            const requiredFields = this.config.requiredYamlFields[elementType];
            if (!requiredFields) return;
            
            // Vérifier champs requis
            for (const field of requiredFields) {
                if (!(field in parsedContent.metadata)) {
                    throw new Error(`Champ requis manquant: ${field}`);
                }
            }
            
            // Validations spécifiques par type
            switch (elementType) {
                case 'object':
                    this.validateObjectMetadata(parsedContent.metadata);
                    break;
                case 'state':
                    this.validateStateMetadata(parsedContent.metadata);
                    break;
                case 'action':
                    this.validateActionMetadata(parsedContent.metadata);
                    break;
            }
            
        } catch (error) {
            this.metrics.validationErrors++;
            throw new Error(`Validation échouée: ${error.message}`);
        }
    }
    
    /**
     * Valide les métadonnées d'objet
     * @private
     */
    validateObjectMetadata(metadata) {
        const validTypes = ['raw-material', 'product', 'batch', 'lot', 'equipment', 'location'];
        if (!validTypes.includes(metadata.object_type)) {
            throw new Error(`Type d'objet invalide: ${metadata.object_type}`);
        }
        
        if (!metadata.position || typeof metadata.position.x !== 'number' || typeof metadata.position.y !== 'number') {
            throw new Error('Position objet invalide');
        }
    }
    
    /**
     * Valide les métadonnées d'état
     * @private
     */
    validateStateMetadata(metadata) {
        if (!metadata.object_id) {
            throw new Error('object_id requis pour état');
        }
        
        if (!metadata.disposition) {
            throw new Error('disposition requise pour état');
        }
    }
    
    /**
     * Valide les métadonnées d'action
     * @private
     */
    validateActionMetadata(metadata) {
        const validTypes = ['main', 'secondary'];
        if (!validTypes.includes(metadata.action_type)) {
            throw new Error(`Type d'action invalide: ${metadata.action_type}`);
        }
        
        if (!metadata.state_id) {
            throw new Error('state_id requis pour action');
        }
    }
    
    /**
     * Scanne un répertoire
     * @private
     */
    async scanDirectory(dirPath, recursive = true) {
        const files = [];
        
        try {
            const entries = await fs.readdir(dirPath, { withFileTypes: true });
            
            for (const entry of entries) {
                const fullPath = path.join(dirPath, entry.name);
                
                if (entry.isDirectory() && recursive) {
                    const subFiles = await this.scanDirectory(fullPath, recursive);
                    files.push(...subFiles);
                } else if (entry.isFile()) {
                    files.push(fullPath);
                }
            }
        } catch (error) {
            // Répertoire inaccessible ou inexistant
            console.warn(`⚠️ Impossible de scanner ${dirPath}: ${error.message}`);
        }
        
        return files;
    }
    
    /**
     * Génère une clé de cache
     * @private
     */
    generateCacheKey(filePath) {
        return `markdown_${Buffer.from(filePath).toString('base64')}`;
    }
    
    /**
     * Obtient les métriques de performance
     * @returns {Object} Métriques de lecture
     */
    getMetrics() {
        return {
            ...this.metrics,
            cacheSize: this.readCache.size,
            averageReadTime: this.metrics.filesRead > 0 ? 
                this.metrics.totalReadTime / this.metrics.filesRead : 0
        };
    }
    
    /**
     * Réinitialise le cache et les métriques
     * @sideEffect Vide les caches et remet à zéro les compteurs
     */
    reset() {
        this.readCache.clear();
        this.metadataCache.clear();
        
        this.metrics = {
            filesRead: 0,
            totalReadTime: 0,
            cacheHits: 0,
            parseErrors: 0,
            validationErrors: 0
        };
        
        console.log('🔄 MarkdownReader réinitialisé');
    }
}

// Export ES6 par défaut
// Export already done
// Export browser pour utilisation dans Obsidian
if (typeof window !== 'undefined') {
    window.ProcessMetaLanguageMarkdownReader = {
        MarkdownReader,
        MARKDOWN_READER_CONFIG
    };
}

// <!-- END OF FILE: markdown-reader.js -->