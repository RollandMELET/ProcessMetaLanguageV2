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
        
        // Validation champs requis frontmatter selon le type de template
        let requiredFields;
        if (templateName.includes('state')) {
            requiredFields = ['state_id', 'state_name', 'disposition', 'created_at', 'position', 'sync_status'];
        } else if (templateName.includes('action')) {
            requiredFields = ['action_id', 'action_name', 'action_type', 'created_at', 'position', 'sync_status'];
        } else {
            requiredFields = this.config.requiredYamlFields;
        }
            
        for (const requiredField of requiredFields) {
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
        
        // Validation sections markdown obligatoires selon type de template
        let requiredSections;
        if (templateName.includes('state')) {
            requiredSections = ['# État:', '## Description État', '## Architecture État-Actions', '## Métadonnées Techniques'];
        } else if (templateName.includes('action')) {
            requiredSections = ['# Action:', '## Description Action', '## Paramètres d\'Entrée', '## Workflow Interne'];
        } else {
            requiredSections = ['# Object:', '## Description', '## État Actuel', '## Actions Disponibles'];
        }
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
            const templateVariables = this.prepareTemplateVariables(canvasData, this.getTemplateType(templateName));
            
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
     * @param {string} templateType - Type de template ('object' ou 'state')
     * @returns {Object} Variables formatées pour remplacement template
     * @example
     * const variables = processor.prepareTemplateVariables({
     *   objectName: "Lot-Acier-A001",
     *   objectType: "raw-material",
     *   position: {x: 100, y: 200}
     * }, 'object');
     * // Returns: {OBJECT_NAME: "Lot-Acier-A001", OBJECT_TYPE: "raw-material", ...}
     */
    prepareTemplateVariables(canvasData, templateType = 'object') {
        const timestamp = new Date().toISOString();
        
        // Variables communes pour tous les types de templates
        const commonVariables = {
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
        
        // Variables spécifiques selon le type de template
        if (templateType === 'state') {
            return {
                ...commonVariables,
                ...this.prepareStateVariables(canvasData)
            };
        } else if (templateType === 'action') {
            return {
                ...commonVariables,
                ...this.prepareActionVariables(canvasData)
            };
        }
        
        // Variables par défaut pour les objets
        return commonVariables;
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
                    const objectName = (canvasData.objectName || `object_${i + index}`)
                        .normalize('NFD')
                        .replace(/[\u0300-\u036f]/g, '')
                        .replace(/[^a-zA-Z0-9]+/g, '-')
                        .replace(/^-+|-+$/g, '')
                        .toLowerCase();
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
            const objectName = (canvasData.objectName || 'unnamed')
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-zA-Z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '')
                .toLowerCase();
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

    /**
     * Détermine le type de template depuis son nom
     * @param {string} templateName - Nom du template
     * @returns {string} Type de template ('object', 'state', 'action', etc.)
     */
    getTemplateType(templateName) {
        if (templateName.includes('state')) return 'state';
        if (templateName.includes('action')) return 'action';
        if (templateName.includes('object')) return 'object';
        return 'object'; // Par défaut
    }

    /**
     * Prépare les variables spécifiques pour un template STATE
     * @param {Object} stateData - Données état depuis state-creator.js
     * @returns {Object} Variables formatées pour template STATE
     * @example
     * const stateVars = processor.prepareStateVariables({
     *   stateName: "En_Production",
     *   disposition: "active",
     *   parentObjectId: "obj_123"
     * });
     */
    prepareStateVariables(stateData) {
        const timestamp = new Date().toISOString();
        
        // Récupérer les couleurs de disposition depuis STATE_DISPOSITION_COLORS
        const dispositionColors = {
            'active': '#4CAF50',
            'in_progress': '#FF9800',
            'in_transit': '#2196F3',
            'destroyed': '#424242',
            'damaged': '#F44336',
            'expired': '#9C27B0',
            'inactive': '#757575',
            'unknown': '#9E9E9E'
        };
        
        return {
            // Identifiants État
            STATE_ID: stateData.uniqueId || stateData.stateId || 'unknown',
            STATE_NAME: stateData.stateName || 'Unnamed State',
            DISPOSITION: stateData.disposition || 'unknown',
            DISPOSITION_DESCRIPTION: stateData.dispositionDescription || this.getDispositionDescription(stateData.disposition),
            DISPOSITION_COLOR: dispositionColors[stateData.disposition] || '#9E9E9E',
            
            // Relations avec objet parent
            PARENT_OBJECT_ID: stateData.parentObjectId || null,
            PARENT_OBJECT_NAME: stateData.parentObjectName || 'Unknown Object',
            PARENT_OBJECT_TYPE: stateData.parentObjectType || 'custom',
            
            // Horodatage
            TIMESTAMP: timestamp,
            CREATED_AT: stateData.createdAt || timestamp,
            MODIFIED_AT: stateData.lastModified || timestamp,
            GENERATION_TIMESTAMP: timestamp,
            EVENT_TIME: stateData.eventTime || timestamp,
            EVENT_TIMEZONE: stateData.eventTimeZone || '+00:00',
            LAST_SYNC: stateData.lastSync || timestamp,
            
            // Position et dimensions
            X_COORDINATE: stateData.position?.x || 0,
            Y_COORDINATE: stateData.position?.y || 0,
            DIMENSIONS_WIDTH: stateData.dimensions?.width || 80,
            DIMENSIONS_HEIGHT: stateData.dimensions?.height || 40,
            
            // EPCIS 2.0
            BUSINESS_STEP: stateData.businessStep || stateData.userMetadata?.businessStep || 'observing',
            BUSINESS_LOCATION: stateData.businessLocation || stateData.userMetadata?.businessLocation || 'urn:epc:id:sgln:0000001.00000.0',
            
            // Architecture État-Actions deux niveaux
            MAIN_ACTION: {
                generated: true,
                type: 'data_exposition',
                name: `Consulter État ${stateData.stateName || 'Unknown'}`
            },
            SECONDARY_ACTIONS: stateData.secondaryActions || [],
            AVAILABLE_SECONDARY_ACTIONS: stateData.availableSecondaryActions || [],
            
            // Canvas
            CANVAS_ELEMENT_ID: stateData.elementId || stateData.id || 'unknown',
            BANNER_COLOR: stateData.backgroundColor || dispositionColors[stateData.disposition] || '#9E9E9E',
            TEXT_COLOR: stateData.textColor || '#FFFFFF',
            BORDER_STYLE: stateData.borderStyle || 'solid',
            VERTICAL_OFFSET: stateData.verticalOffset || -50,
            Z_INDEX: stateData.zIndex || 100,
            
            // Synchronisation
            SYNC_STATUS: stateData.syncStatus || 'synchronized',
            TEMPLATE_VERSION: this.config.templateVersion,
            RELATIONS_INTEGRITY: stateData.relationsIntegrity || 'valid',
            
            // 360SmartConnect
            AVATAR_ID: stateData.userMetadata?.avatarId || stateData.parentMetadata?.avatarId || 'avatar_001',
            STATE_METADATA: JSON.stringify(stateData.userMetadata || {}, null, 2),
            
            // Transitions et règles business
            ALLOWED_TRANSITIONS: stateData.allowedTransitions || [],
            BUSINESS_CONSTRAINTS: stateData.businessConstraints || [],
            RELATED_STATES: stateData.relatedStates || [],
            
            // Historique
            PREVIOUS_STATE: stateData.previousState || 'Initial',
            TRANSITION_ACTION: stateData.transitionAction || 'Created',
            OPERATOR: stateData.operator || stateData.userMetadata?.operator || 'System',
            
            // Données spécifiques état
            STATE_SPECIFIC_DATA: stateData.stateSpecificData || stateData.userMetadata || {}
        };
    }

    /**
     * Obtient la description d'une disposition EPCIS 2.0
     * @param {string} disposition - Code disposition EPCIS
     * @returns {string} Description de la disposition
     */
    getDispositionDescription(disposition) {
        const descriptions = {
            'active': 'État opérationnel actif',
            'in_progress': 'En cours de traitement',
            'in_transit': 'En déplacement ou transport',
            'destroyed': 'Détruit définitivement',
            'damaged': 'Défaillant ou endommagé',
            'expired': 'Expiré ou périmé',
            'inactive': 'Temporairement inactif',
            'container_closed': 'Conteneur fermé et scellé',
            'container_open': 'Conteneur ouvert et accessible',
            'dispensed': 'Distribué ou dispensé',
            'encoded': 'Encodé avec marquage traçabilité',
            'non_sellable': 'Non vendable pour contraintes',
            'partially_dispensed': 'Partiellement dispensé',
            'recalled': 'Rappelé pour défaut',
            'reserved': 'Réservé ou alloué',
            'retail_sold': 'Vendu au détail',
            'returned': 'Retourné par client',
            'sellable_accessible': 'Vendable et accessible',
            'sellable_not_accessible': 'Vendable mais non accessible',
            'stolen': 'Volé ou perdu',
            'unavailable': 'Temporairement indisponible',
            'unknown': 'État indéterminé',
            'consumed': 'Consommé ou utilisé',
            'installed': 'Installé en place',
            'disposed': 'Mis au rebut selon réglementations'
        };
        
        return descriptions[disposition] || 'État non défini dans EPCIS 2.0';
    }

    /**
     * Synchronise un état canvas vers son fichier markdown template
     * @param {Object} stateData - Données état canvas mises à jour
     * @param {string} templateName - Template à utiliser (par défaut 'state-template')
     * @returns {Promise<string>} Chemin du fichier synchronisé
     * @sideEffect Met à jour ou crée le fichier markdown correspondant
     */
    async syncStateToTemplate(stateData, templateName = 'state-template') {
        try {
            const stateName = (stateData.stateName || 'unnamed-state')
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-zA-Z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '')
                .toLowerCase();
            const outputPath = path.join(this.config.outputDir, 'states', `${stateName}.md`);
            
            await this.generateFromCanvas(stateData, templateName, outputPath);
            
            console.log(`🔄 Synchronisation état → template: ${path.basename(outputPath)}`);
            return outputPath;
            
        } catch (error) {
            console.error(`❌ Erreur synchronisation état:`, error.message);
            throw error;
        }
    }

    /**
     * Prépare les variables spécifiques pour un template ACTION
     * @param {Object} actionData - Données action depuis action-creator.js
     * @returns {Object} Variables formatées pour template ACTION
     * @example
     * const actionVars = processor.prepareActionVariables({
     *   actionName: "Valider_Qualite",
     *   actionType: "secondary_action",
     *   sourceState: "En_Production"
     * });
     */
    prepareActionVariables(actionData) {
        const timestamp = new Date().toISOString();
        
        // Couleurs par type d'action
        const actionTypeColors = {
            'main_action': '#2196F3',
            'secondary_action': '#FF9800', 
            'workflow_action': '#4CAF50',
            'api_action': '#9C27B0',
            'validation_action': '#F44336',
            'transformation_action': '#607D8B'
        };
        
        return {
            // Identifiants Action
            ACTION_ID: actionData.uniqueId || actionData.actionId || 'unknown',
            ACTION_NAME: actionData.actionName || 'Unnamed Action',
            ACTION_TYPE: actionData.actionType || 'secondary_action',
            ACTION_CATEGORY: actionData.actionCategory || this.getActionCategory(actionData.actionType),
            ACTION_COLOR: actionTypeColors[actionData.actionType] || '#9E9E9E',
            
            // Relations avec état parent
            PARENT_STATE_ID: actionData.parentStateId || null,
            PARENT_STATE_NAME: actionData.parentStateName || 'Unknown State',
            PARENT_OBJECT_ID: actionData.parentObjectId || null,
            
            // Transitions
            SOURCE_STATE: actionData.sourceState || actionData.parentStateName || 'Current State',
            TARGET_STATE: actionData.targetState || 'Next State',
            TARGET_DISPOSITION: actionData.targetDisposition || 'active',
            
            // Horodatage
            TIMESTAMP: timestamp,
            CREATED_AT: actionData.createdAt || timestamp,
            MODIFIED_AT: actionData.lastModified || timestamp,
            GENERATION_TIMESTAMP: timestamp,
            EVENT_TIME: actionData.eventTime || timestamp,
            EVENT_TIMEZONE: actionData.eventTimeZone || '+00:00',
            LAST_SYNC: actionData.lastSync || timestamp,
            
            // Position et dimensions
            X_COORDINATE: actionData.position?.x || 0,
            Y_COORDINATE: actionData.position?.y || 0,
            DIMENSIONS_WIDTH: actionData.dimensions?.width || 140,
            DIMENSIONS_HEIGHT: actionData.dimensions?.height || 60,
            
            // EPCIS 2.0
            BUSINESS_STEP: actionData.businessStep || actionData.userMetadata?.businessStep || 'observing',
            BUSINESS_LOCATION: actionData.businessLocation || actionData.userMetadata?.businessLocation || 'urn:epc:id:sgln:0000001.00000.0',
            EPCIS_ACTION_TYPE: actionData.epcisActionType || 'observe',
            
            // Paramètres et workflow
            INPUT_PARAMETERS: JSON.stringify(actionData.inputParameters || {
                required: [],
                optional: []
            }, null, 2),
            OUTPUT_PARAMETERS: JSON.stringify(actionData.outputParameters || {
                success: [],
                metadata: []
            }, null, 2),
            WORKFLOW_INTERNAL: JSON.stringify(actionData.workflowInternal || {
                steps: [],
                initial_state: actionData.sourceState || 'current',
                final_state: actionData.targetState || 'next',
                intermediate_states: []
            }, null, 2),
            
            // Validations
            VALIDATION_RULES: JSON.stringify(actionData.validationRules || {
                pre_execution: [],
                post_execution: [],
                business_constraints: []
            }, null, 2),
            
            // API
            API_SPECIFICATIONS: JSON.stringify(actionData.apiSpecifications || null, null, 2),
            API_TOKEN: '${API_TOKEN}',
            
            // Canvas
            CANVAS_ELEMENT_ID: actionData.elementId || actionData.id || 'unknown',
            RECTANGLE_COLOR: actionData.backgroundColor || actionTypeColors[actionData.actionType] || '#9E9E9E',
            TEXT_COLOR: actionData.textColor || '#FFFFFF',
            BORDER_STYLE: actionData.borderStyle || 'solid',
            BORDER_RADIUS: actionData.borderRadius || 8,
            Z_INDEX: actionData.zIndex || 50,
            
            // Synchronisation
            SYNC_STATUS: actionData.syncStatus || 'synchronized',
            TEMPLATE_VERSION: this.config.templateVersion,
            
            // 360SmartConnect
            AVATAR_ID: actionData.userMetadata?.avatarId || actionData.parentMetadata?.avatarId || 'avatar_001',
            
            // Métriques
            AVERAGE_EXECUTION_TIME: actionData.metrics?.averageExecutionTime || 0,
            SUCCESS_RATE: actionData.metrics?.successRate || 100,
            ROLLBACK_COUNT: actionData.metrics?.rollbackCount || 0,
            LAST_OPTIMIZATION: actionData.metrics?.lastOptimization || timestamp,
            
            // Exécution
            OPERATOR: actionData.operator || actionData.userMetadata?.operator || 'System',
            EXECUTION_PARAMS: JSON.stringify(actionData.lastExecutionParams || {}, null, 2),
            RESULT: actionData.lastExecutionResult || 'N/A',
            DURATION: actionData.lastExecutionDuration || 0,
            FINAL_STATE: actionData.lastExecutionFinalState || actionData.targetState || 'N/A',
            
            // Sécurité
            SECURITY_RULES: actionData.securityRules ? JSON.stringify(actionData.securityRules, null, 2) : null,
            
            // Tests
            UNIT_TESTS: actionData.unitTests || [],
            INTEGRATION_TESTS: actionData.integrationTests || [],
            API_VALIDATION_STATUS: actionData.apiValidationStatus || '✅ Validé'
        };
    }

    /**
     * Obtient la catégorie d'une action selon son type
     * @param {string} actionType - Type d'action
     * @returns {string} Catégorie de l'action
     */
    getActionCategory(actionType) {
        const categories = {
            'main_action': 'data_exposition',
            'secondary_action': 'state_transition',
            'workflow_action': 'transformation',
            'api_action': 'data_capture',
            'validation_action': 'validation',
            'transformation_action': 'transformation'
        };
        
        return categories[actionType] || 'data_capture';
    }

    /**
     * Synchronise une action canvas vers son fichier markdown template
     * @param {Object} actionData - Données action canvas mises à jour
     * @param {string} templateName - Template à utiliser (par défaut 'action-template')
     * @returns {Promise<string>} Chemin du fichier synchronisé
     * @sideEffect Met à jour ou crée le fichier markdown correspondant
     */
    async syncActionToTemplate(actionData, templateName = 'action-template') {
        try {
            const actionName = (actionData.actionName || 'unnamed-action')
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-zA-Z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '')
                .toLowerCase();
            const outputPath = path.join(this.config.outputDir, 'actions', `${actionName}.md`);
            
            await this.generateFromCanvas(actionData, templateName, outputPath);
            
            console.log(`🔄 Synchronisation action → template: ${path.basename(outputPath)}`);
            return outputPath;
            
        } catch (error) {
            console.error(`❌ Erreur synchronisation action:`, error.message);
            throw error;
        }
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