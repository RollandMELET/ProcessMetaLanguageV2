// <!-- START OF FILE: template-processor.js -->
// FILENAME: template-processor.js
// Version: 1.0.0
// Date: 2025-07-28 09:30
// Author: Rolland MELET & Claude Code
// Description: Moteur de traitement templates markdown ProcessMetaLanguage - TASK-B001

/**
 * Module ProcessMetaLanguage - Template Processor
 * 
 * Système complet de traitement des templates markdown avec:
 * - Parsing YAML frontmatter avec validation
 * - Remplacement variables dynamiques {{VAR}}
 * - Génération fichiers markdown depuis canvas
 * - Synchronisation bidirectionnelle canvas ↔ documentation
 * - Support versioning et historique templates
 * - Performance optimisée <5s pour 50 templates
 */

import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';

/**
 * Configuration du template processor
 * @constant {Object}
 */
const TEMPLATE_CONFIG = {
    // Dossiers templates
    templatesDir: path.join(__dirname, '..', 'templates'),
    outputDir: path.join(__dirname, '..', 'docs', 'generated'),
    
    // Variables template (support 'this' pour boucles + variables majuscules)
    variablePattern: /\{\{(this|[A-Z_][A-Z0-9_]*)\}\}/g,
    conditionalPattern: /\{\{#if\s+([A-Z_][A-Z0-9_]*)\}\}([\s\S]*?)\{\{\/if\}\}/g,
    loopPattern: /\{\{#each\s+([A-Z_][A-Z0-9_]*)\}\}([\s\S]*?)\{\{\/each\}\}/g,
    
    // Performance
    maxTemplateSize: 1024 * 1024, // 1MB max par template
    batchSize: 10, // Traitement par lots pour performance
    
    // Validation
    requiredYamlFields: [
        'object_id', 'object_name', 'object_type', 
        'created_at', 'position', 'sync_status'
    ],
    
    // Versioning
    templateVersion: '1.0.0',
    supportedVersions: ['1.0.0']
};

/**
 * Classe principale du Template Processor
 * @class
 */
class TemplateProcessor {
    /**
     * Initialise le Template Processor
     * @param {Object} options - Options de configuration
     */
    constructor(options = {}) {
        this.config = { ...TEMPLATE_CONFIG, ...options };
        this.loadedTemplates = new Map();
        this.templateCache = new Map();
        this.generationStats = {
            templatesGenerated: 0,
            averageTime: 0,
            errors: []
        };
    }

    /**
     * Charge un template depuis le système de fichiers
     * @param {string} templateName - Nom du template (ex: 'object-template')
     * @returns {Promise<Object>} Template parsé avec frontmatter et contenu
     * @throws {Error} Si template introuvable ou invalide
     * @example
     * const template = await processor.loadTemplate('object-template');
     * console.log(template.frontmatter.template_version); // "1.0.0"
     */
    async loadTemplate(templateName) {
        const startTime = performance.now();
        
        try {
            // Vérifier cache
            if (this.templateCache.has(templateName)) {
                return this.templateCache.get(templateName);
            }
            
            const templatePath = path.join(this.config.templatesDir, `${templateName}.md`);
            
            // Vérifier existence fichier
            try {
                await fs.access(templatePath);
            } catch (error) {
                throw new Error(`Template '${templateName}' introuvable: ${templatePath}`);
            }
            
            // Lire contenu template
            const templateContent = await fs.readFile(templatePath, 'utf-8');
            
            // Validation taille
            if (templateContent.length > this.config.maxTemplateSize) {
                throw new Error(`Template '${templateName}' trop volumineux (${templateContent.length} bytes, max: ${this.config.maxTemplateSize})`);
            }
            
            // Parser frontmatter YAML
            const parsed = this.parseFrontmatter(templateContent);
            
            // Validation structure template
            this.validateTemplateStructure(parsed, templateName);
            
            // Mise en cache
            this.templateCache.set(templateName, parsed);
            
            const endTime = performance.now();
            console.log(`✅ Template '${templateName}' chargé en ${(endTime - startTime).toFixed(2)}ms`);
            
            return parsed;
            
        } catch (error) {
            console.error(`❌ Erreur chargement template '${templateName}':`, error.message);
            throw error;
        }
    }

    /**
     * Parse le frontmatter YAML d'un template markdown
     * @param {string} content - Contenu markdown brut
     * @returns {Object} Objet avec frontmatter et body séparés
     * @throws {Error} Si parsing YAML échoue
     * @example
     * const parsed = processor.parseFrontmatter("---\ntitle: Test\n---\n# Content");
     * // Returns: {frontmatter: {title: "Test"}, body: "# Content"}
     */
    parseFrontmatter(content) {
        // Regex pour séparer frontmatter YAML du corps markdown
        const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
        const match = content.match(frontmatterRegex);
        
        if (!match) {
            throw new Error("Format frontmatter YAML invalide - doit commencer par '---' et se terminer par '---'");
        }
        
        try {
            // Parser YAML frontmatter
            const frontmatter = yaml.load(match[1]);
            const body = match[2];
            
            return {
                frontmatter: frontmatter || {},
                body: body || '',
                raw: content
            };
            
        } catch (yamlError) {
            throw new Error(`Erreur parsing YAML frontmatter: ${yamlError.message}`);
        }
    }

    /**
     * Valide la structure d'un template selon les standards ProcessMetaLanguage
     * @param {Object} template - Template parsé
     * @param {string} templateName - Nom du template pour logs
     * @throws {Error} Si validation échoue
     * @sideEffect Affiche warnings console pour champs optionnels manquants
     */
    validateTemplateStructure(template, templateName) {
        const { frontmatter, body } = template;
        
        // Validation champs requis frontmatter
        for (const requiredField of this.config.requiredYamlFields) {
            if (!(requiredField in frontmatter)) {
                throw new Error(`Champ requis '${requiredField}' manquant dans frontmatter du template '${templateName}'`);
            }
        }
        
        // Validation version template
        if (frontmatter.template_version && !this.config.supportedVersions.includes(frontmatter.template_version)) {
            throw new Error(`Version template non supportée: ${frontmatter.template_version}. Versions supportées: ${this.config.supportedVersions.join(', ')}`);
        }
        
        // Validation présence variables dans body
        const bodyVariables = this.extractVariables(body);
        if (bodyVariables.length === 0) {
            console.warn(`⚠️ Aucune variable trouvée dans le corps du template '${templateName}'`);
        }
        
        // Validation sections markdown obligatoires
        const requiredSections = ['# Object:', '## Description', '## État Actuel', '## Actions Disponibles'];
        const missingSections = requiredSections.filter(section => !body.includes(section));
        if (missingSections.length > 0) {
            console.warn(`⚠️ Sections manquantes dans template '${templateName}': ${missingSections.join(', ')}`);
        }
    }

    /**
     * Extrait toutes les variables {{VAR}} d'un contenu template
     * @param {string} content - Contenu à analyser
     * @returns {Array<string>} Liste des variables trouvées
     * @example
     * const vars = processor.extractVariables("Hello {{NAME}}, your ID is {{USER_ID}}");
     * // Returns: ["NAME", "USER_ID"]
     */
    extractVariables(content) {
        const variables = [];
        let match;
        
        const regex = new RegExp(this.config.variablePattern);
        while ((match = regex.exec(content)) !== null) {
            const variable = match[1];
            if (!variables.includes(variable)) {
                variables.push(variable);
            }
        }
        
        return variables;
    }

    /**
     * Traite les variables dans un objet (pour frontmatter YAML)
     * @param {Object} obj - Objet à traiter
     * @param {Object} variables - Variables de remplacement
     * @returns {Object} Objet avec variables remplacées
     * @private
     */
    processObjectVariables(obj, variables) {
        if (typeof obj === 'string') {
            return this.replaceVariables(obj, variables);
        } else if (Array.isArray(obj)) {
            return obj.map(item => this.processObjectVariables(item, variables));
        } else if (obj && typeof obj === 'object') {
            const result = {};
            for (const [key, value] of Object.entries(obj)) {
                result[key] = this.processObjectVariables(value, variables);
            }
            return result;
        } else {
            return obj;
        }
    }

    /**
     * Remplace les variables dynamiques dans un template
     * @param {string} template - Contenu template avec variables {{VAR}}
     * @param {Object} variables - Objet avec valeurs des variables
     * @returns {string} Template avec variables remplacées
     * @example
     * const result = processor.replaceVariables("Hello {{NAME}}", {NAME: "Rolland"});
     * // Returns: "Hello Rolland"
     */
    replaceVariables(template, variables = {}) {
        let result = template;
        
        // Remplacement variables simples {{VAR}} et {{this}}
        result = result.replace(this.config.variablePattern, (match, variable) => {
            // Support spécial pour 'this' dans les boucles
            if (variable === 'this' && 'this' in variables) {
                const value = variables['this'];
                return value !== null && value !== undefined ? String(value) : '';
            } else if (variable in variables) {
                const value = variables[variable];
                // Conversion valeurs non-string en string
                return value !== null && value !== undefined ? String(value) : '';
            } else {
                console.warn(`⚠️ Variable '${variable}' non fournie, conservée telle quelle`);
                return match; // Conserver variable non résolue
            }
        });
        
        // Traitement conditions {{#if VAR}}...{{/if}}
        result = this.processConditionals(result, variables);
        
        // Traitement boucles {{#each ARRAY}}...{{/each}}
        result = this.processLoops(result, variables);
        
        return result;
    }

    /**
     * Traite les conditions {{#if}} dans les templates Handlebars-like
     * @param {string} content - Contenu avec conditions
     * @param {Object} variables - Variables de contexte
     * @returns {string} Contenu avec conditions résolues
     * @example
     * const result = processor.processConditionals(
     *   "{{#if SHOW_SECTION}}Visible{{/if}}", 
     *   {SHOW_SECTION: true}
     * );
     * // Returns: "Visible"
     */
    processConditionals(content, variables) {
        return content.replace(this.config.conditionalPattern, (match, variable, innerContent) => {
            const value = variables[variable];
            // Évaluer condition: true, chaîne non-vide, nombre non-zéro, array non-vide
            const isTrue = value && (
                value === true || 
                (typeof value === 'string' && value.length > 0) ||
                (typeof value === 'number' && value !== 0) ||
                (Array.isArray(value) && value.length > 0)
            );
            
            return isTrue ? this.replaceVariables(innerContent, variables) : '';
        });
    }

    /**
     * Traite les boucles {{#each}} dans les templates
     * @param {string} content - Contenu avec boucles
     * @param {Object} variables - Variables de contexte  
     * @returns {string} Contenu avec boucles résolues
     * @example
     * const result = processor.processLoops(
     *   "{{#each ITEMS}}Item: {{this}}{{/each}}", 
     *   {ITEMS: ["A", "B"]}
     * );
     * // Returns: "Item: AItem: B"
     */
    processLoops(content, variables) {
        return content.replace(this.config.loopPattern, (match, variable, innerContent) => {
            const array = variables[variable];
            if (Array.isArray(array)) {
                return array.map(item => {
                    // Créer contexte local avec 'this' pointant vers l'item
                    const loopVariables = { ...variables, this: item };
                    
                    // Si item est un objet, ajouter ses propriétés au contexte
                    if (typeof item === 'object' && item !== null) {
                        Object.assign(loopVariables, item);
                    }
                    
                    return this.replaceVariables(innerContent, loopVariables);
                }).join('');
            } else {
                console.warn(`⚠️ Variable '${variable}' n'est pas un tableau pour la boucle #each`);
                return '';
            }
        });
    }

    /**
     * Génère un fichier markdown depuis un template et des données canvas
     * @param {Object} canvasData - Données extraites du canvas Excalidraw
     * @param {string} templateName - Nom du template à utiliser
     * @param {string} outputPath - Chemin de sortie du fichier généré
     * @returns {Promise<Object>} Métadonnées de génération avec statistiques
     * @sideEffect Crée fichier markdown à l'emplacement spécifié
     * @example
     * const result = await processor.generateFromCanvas(
     *   {objectName: "Lot-A001", objectType: "raw-material"},
     *   'object-template',
     *   './docs/generated/lot-a001.md'
     * );
     */
    async generateFromCanvas(canvasData, templateName, outputPath) {
        const startTime = performance.now();
        
        try {
            // Charger template
            const template = await this.loadTemplate(templateName);
            
            // Préparer variables depuis données canvas
            const templateVariables = this.prepareTemplateVariables(canvasData);
            
            // Traiter frontmatter en remplaçant variables directement dans l'objet
            const processedFrontmatter = this.processObjectVariables(template.frontmatter, templateVariables);
            const processedFrontmatterYaml = yaml.dump(processedFrontmatter, { quotingType: '"' });
            
            // Remplacer variables dans body
            const processedBody = this.replaceVariables(template.body, templateVariables);
            
            // Reconstituer fichier markdown complet
            const finalMarkdown = `---\n${processedFrontmatterYaml}---\n${processedBody}`;
            
            // Créer dossier de sortie si nécessaire
            const outputDir = path.dirname(outputPath);
            await fs.mkdir(outputDir, { recursive: true });
            
            // Écrire fichier final
            await fs.writeFile(outputPath, finalMarkdown, 'utf-8');
            
            // Calculer statistiques
            const endTime = performance.now();
            const executionTime = endTime - startTime;
            
            // Mise à jour statistiques globales
            this.generationStats.templatesGenerated++;
            this.generationStats.averageTime = (
                (this.generationStats.averageTime * (this.generationStats.templatesGenerated - 1) + executionTime) /
                this.generationStats.templatesGenerated
            );
            
            const generationMetadata = {
                templateName,
                outputPath,
                executionTime: `${executionTime.toFixed(2)}ms`,
                fileSize: finalMarkdown.length,
                variablesResolved: Object.keys(templateVariables).length,
                generatedAt: new Date().toISOString(),
                success: true
            };
            
            console.log(`✅ Template généré: ${path.basename(outputPath)} (${executionTime.toFixed(2)}ms)`);
            
            return generationMetadata;
            
        } catch (error) {
            this.generationStats.errors.push({
                templateName,
                error: error.message,
                timestamp: new Date().toISOString()
            });
            
            console.error(`❌ Erreur génération template '${templateName}':`, error.message);
            throw error;
        }
    }

    /**
     * Prépare les variables template depuis les données canvas ProcessMetaLanguage
     * @param {Object} canvasData - Données objet depuis object-creator.js
     * @returns {Object} Variables formatées pour remplacement template
     * @example
     * const variables = processor.prepareTemplateVariables({
     *   objectName: "Lot-Acier-A001",
     *   objectType: "raw-material",
     *   position: {x: 100, y: 200}
     * });
     * // Returns: {OBJECT_NAME: "Lot-Acier-A001", OBJECT_TYPE: "raw-material", ...}
     */
    prepareTemplateVariables(canvasData) {
        const timestamp = new Date().toISOString();
        
        return {
            // Identifiants
            OBJECT_ID: canvasData.uniqueId || canvasData.objectId || 'unknown',
            OBJECT_NAME: canvasData.objectName || 'Unnamed Object',
            OBJECT_TYPE: canvasData.objectType || 'custom',
            OBJECT_TYPE_DESCRIPTION: this.getObjectTypeDescription(canvasData.objectType),
            
            // Horodatage
            TIMESTAMP: timestamp,
            CREATED_AT: canvasData.createdAt || timestamp,
            MODIFIED_AT: canvasData.lastModified || timestamp,
            GENERATION_TIMESTAMP: timestamp,
            VALIDATION_TIMESTAMP: timestamp,
            
            // Position et dimensions
            X_COORDINATE: canvasData.position?.x || 0,
            Y_COORDINATE: canvasData.position?.y || 0,
            DIMENSIONS_WIDTH: canvasData.dimensions?.width || 120,
            DIMENSIONS_HEIGHT: canvasData.dimensions?.height || 80,
            
            // EPCIS 2.0
            COMPANY: canvasData.userMetadata?.company || '0000001',
            PRODUCT: canvasData.userMetadata?.product || '000001',
            SERIAL: canvasData.userMetadata?.serial || '000001',
            EPC: `urn:epc:id:sgtin:${canvasData.userMetadata?.company || '0000001'}.${canvasData.userMetadata?.product || '000001'}.${canvasData.userMetadata?.serial || '000001'}`,
            BUSINESS_STEP: canvasData.userMetadata?.businessStep || 'receiving',
            DISPOSITION: canvasData.userMetadata?.disposition || 'active',
            
            // États et relations
            CURRENT_STATE: canvasData.currentState || 'Initial',
            INITIAL_STATE: canvasData.initialState || 'Created',
            PARENT_OBJECT_ID: canvasData.parentId || null,
            CHILD_IDS: canvasData.childIds || [],
            
            // Canvas
            CANVAS_ELEMENT_ID: canvasData.elementId || canvasData.id || 'unknown',
            BACKGROUND_COLOR: canvasData.backgroundColor || '#F5F5F5',
            STROKE_COLOR: canvasData.strokeColor || '#1e1e1e',
            STROKE_WIDTH: canvasData.strokeWidth || 2,
            FONT_SIZE: canvasData.fontSize || 16,
            FONT_FAMILY: canvasData.fontFamily || 'Cascadia Code',
            
            // Synchronisation
            SYNC_STATUS: canvasData.syncStatus || 'synchronized',
            TEMPLATE_VERSION: this.config.templateVersion,
            
            // 360SmartConnect
            AVATAR_ID: canvasData.userMetadata?.avatarId || 'avatar_001',
            COMPANY_ID: canvasData.userMetadata?.companyId || 'company_001',
            WEBHOOK_URL: canvasData.userMetadata?.webhookUrl || 'https://api.360smartconnect.com/webhook',
            
            // Métadonnées utilisateur
            USER_METADATA: canvasData.userMetadata || {},
            OBJECT_DESCRIPTION: canvasData.userMetadata?.description || `Objet ${canvasData.objectType || 'custom'} créé automatiquement`,
            
            // Actions disponibles (exemple structure)
            AVAILABLE_ACTIONS: canvasData.availableActions || [
                {
                    name: 'Modifier état',
                    description: 'Changer l\'état de l\'objet',
                    prerequisites: 'Objet actif',
                    target_state: 'modified'
                }
            ]
        };
    }

    /**
     * Obtient la description d'un type d'objet ProcessMetaLanguage
     * @param {string} objectType - Type d'objet
     * @returns {string} Description du type d'objet
     */
    getObjectTypeDescription(objectType) {
        const descriptions = {
            'raw-material': 'Matière première non transformée',
            'product': 'Produit fini ou semi-fini',
            'container': 'Contenant ou emballage',
            'equipment': 'Équipement ou machine',
            'document': 'Document ou certificat',
            'location': 'Lieu ou zone géographique',
            'batch': 'Lot de production',
            'custom': 'Type personnalisé'
        };
        
        return descriptions[objectType] || 'Type d\'objet personnalisé';
    }

    /**
     * Génère plusieurs templates en traitement par lots pour optimisation performance
     * @param {Array<Object>} canvasObjects - Liste objets canvas à traiter
     * @param {string} templateName - Template à utiliser
     * @param {string} outputDir - Dossier de sortie
     * @returns {Promise<Object>} Statistiques de génération batch
     * @sideEffect Crée plusieurs fichiers markdown dans outputDir
     * @example
     * const stats = await processor.generateBatch(objects, 'object-template', './output');
     * console.log(`${stats.successful} templates générés en ${stats.totalTime}ms`);
     */
    async generateBatch(canvasObjects, templateName, outputDir) {
        const startTime = performance.now();
        const results = [];
        let successful = 0;
        let failed = 0;
        
        console.log(`🔄 Début génération batch: ${canvasObjects.length} templates`);
        
        // Traitement par lots pour éviter surcharge mémoire
        for (let i = 0; i < canvasObjects.length; i += this.config.batchSize) {
            const batch = canvasObjects.slice(i, i + this.config.batchSize);
            
            const batchPromises = batch.map(async (canvasData, index) => {
                try {
                    const objectName = (canvasData.objectName || `object_${i + index}`).replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
                    const outputPath = path.join(outputDir, `${objectName}.md`);
                    
                    const result = await this.generateFromCanvas(canvasData, templateName, outputPath);
                    successful++;
                    return result;
                    
                } catch (error) {
                    failed++;
                    console.error(`❌ Erreur génération objet ${canvasData.objectName}:`, error.message);
                    return {
                        error: error.message,
                        objectName: canvasData.objectName,
                        success: false
                    };
                }
            });
            
            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults);
            
            // Log progression
            console.log(`📊 Batch ${Math.floor(i / this.config.batchSize) + 1}: ${successful} réussites, ${failed} échecs`);
        }
        
        const endTime = performance.now();
        const totalExecution = endTime - startTime;
        
        const batchStats = {
            totalObjects: canvasObjects.length,
            successful,
            failed,
            totalTime: `${totalExecution.toFixed(2)}ms`,
            averageTimePerTemplate: `${(totalExecution / canvasObjects.length).toFixed(2)}ms`,
            results,
            performanceTarget: totalExecution < 5000 ? '✅ <5s' : '❌ >5s'
        };
        
        console.log(`✅ Génération batch terminée: ${successful}/${canvasObjects.length} (${totalExecution.toFixed(2)}ms)`);
        
        return batchStats;
    }

    /**
     * Synchronise un objet canvas vers son fichier markdown template
     * @param {Object} canvasData - Données objet canvas mises à jour
     * @param {string} templateName - Template à utiliser
     * @returns {Promise<string>} Chemin du fichier synchronisé
     * @sideEffect Met à jour ou crée le fichier markdown correspondant
     */
    async syncCanvasToTemplate(canvasData, templateName = 'object-template') {
        try {
            const objectName = (canvasData.objectName || 'unnamed').replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
            const outputPath = path.join(this.config.outputDir, 'objects', `${objectName}.md`);
            
            await this.generateFromCanvas(canvasData, templateName, outputPath);
            
            console.log(`🔄 Synchronisation canvas → template: ${path.basename(outputPath)}`);
            return outputPath;
            
        } catch (error) {
            console.error(`❌ Erreur synchronisation canvas:`, error.message);
            throw error;
        }
    }

    /**
     * Obtient les statistiques de performance du template processor
     * @returns {Object} Statistiques détaillées avec métriques performance
     */
    getPerformanceStats() {
        return {
            ...this.generationStats,
            cacheSize: this.templateCache.size,
            loadedTemplates: Array.from(this.loadedTemplates.keys()),
            performanceTarget: this.generationStats.averageTime < 5000 ? '✅ <5s' : '❌ >5s',
            uptime: Date.now() - (this.startTime || Date.now())
        };
    }

    /**
     * Vide les caches du template processor
     * @sideEffect Remet à zéro les caches internes
     */
    clearCache() {
        this.templateCache.clear();
        this.loadedTemplates.clear();
        console.log('🗑️ Caches template processor vidés');
    }
}

// Export ES6 par défaut
export { TemplateProcessor, TEMPLATE_CONFIG };

// Export browser pour utilisation dans Obsidian
if (typeof window !== 'undefined') {
    window.ProcessMetaLanguageTemplateProcessor = {
        TemplateProcessor,
        TEMPLATE_CONFIG
    };
}

// <!-- END OF FILE: template-processor.js -->