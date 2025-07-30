// <!-- START OF FILE: template-manager.js -->
// FILENAME: template-manager.js
// Version: 1.0.0
// Date: 2025-07-30 10:00
// Author: Rolland MELET & Claude Code
// Description: Gestionnaire avancé de templates ProcessMetaLanguage - TASK-B005

/**
 * Module ProcessMetaLanguage - Template Manager
 * 
 * Système complet de gestion des templates avec:
 * - 3 modes de création: from scratch, duplication, héritage
 * - Système de versioning complet avec historique
 * - Validation et conformité EPCIS 2.0
 * - Gestion permissions et sécurité
 * - Interface avec UI existante (template-selector.js)
 * - Performance optimisée pour grandes bibliothèques
 */

import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';
import { v4 as uuidv4 } from 'uuid';
import { TemplateProcessor } from './template-processor.js';
import { EPCISValidator } from './epcis-validator.js';

/**
 * Configuration du Template Manager
 * @constant {Object}
 */
const MANAGER_CONFIG = {
    // Dossiers
    templatesBaseDir: path.join(__dirname, '..', 'templates'),
    userTemplatesDir: path.join(__dirname, '..', 'templates', 'user-templates'),
    versionsDir: path.join(__dirname, '..', 'templates', '.versions'),
    backupsDir: path.join(__dirname, '..', 'templates', '.backups'),
    
    // Versioning
    maxVersionsPerTemplate: 50,
    versionFormat: 'semver', // 'semver' ou 'timestamp'
    autoBackup: true,
    backupRetentionDays: 30,
    
    // Validation
    validateOnSave: true,
    validateEPCIS: true,
    
    // Permissions
    defaultPermissions: {
        read: true,
        write: true,
        delete: false,
        share: false
    },
    
    // Limites
    maxTemplateSize: 2 * 1024 * 1024, // 2MB
    maxTemplatesPerUser: 1000,
    maxNameLength: 255,
    
    // Métadonnées
    requiredMetadata: ['name', 'type', 'category', 'version', 'author'],
    templateTypes: ['object', 'state', 'action', 'workflow', 'custom'],
    templateCategories: ['epcis', 'custom', 'system', 'experimental']
};

/**
 * Classe principale du Template Manager
 * @class
 */
class TemplateManager {
    /**
     * Initialise le Template Manager
     * @param {Object} options - Options de configuration
     */
    constructor(options = {}) {
        this.config = { ...MANAGER_CONFIG, ...options };
        this.templateProcessor = new TemplateProcessor();
        this.epcisValidator = new EPCISValidator();
        this.templateRegistry = new Map();
        this.versionCache = new Map();
        this.lockedTemplates = new Set();
        this.userContext = {
            userId: 'default',
            permissions: this.config.defaultPermissions
        };
    }

    /**
     * Initialise le système de fichiers pour le manager
     * @returns {Promise<void>}
     * @sideEffect Crée les dossiers nécessaires
     */
    async initialize() {
        const dirs = [
            this.config.userTemplatesDir,
            this.config.versionsDir,
            this.config.backupsDir
        ];
        
        for (const dir of dirs) {
            await fs.mkdir(dir, { recursive: true });
        }
        
        // Charger registry des templates
        await this.loadTemplateRegistry();
        
        console.log('✅ Template Manager initialisé');
    }

    /**
     * MODE 1: Créer un template from scratch
     * @param {Object} templateData - Données du nouveau template
     * @returns {Promise<Object>} Template créé avec métadonnées
     * @sideEffect Crée fichier template et version initiale
     * @example
     * const newTemplate = await manager.createFromScratch({
     *   name: "Custom Process Template",
     *   type: "object",
     *   category: "custom",
     *   description: "Template personnalisé pour processus spécifique",
     *   frontmatter: {...},
     *   body: "# Template Content..."
     * });
     */
    async createFromScratch(templateData) {
        const startTime = performance.now();
        
        try {
            // Validation données entrée
            this.validateTemplateData(templateData);
            
            // Générer identifiant unique
            const templateId = this.generateTemplateId(templateData.name);
            const timestamp = new Date().toISOString();
            
            // Créer structure template complète
            const template = {
                id: templateId,
                name: templateData.name,
                type: templateData.type || 'custom',
                category: templateData.category || 'custom',
                description: templateData.description || '',
                version: '1.0.0',
                author: templateData.author || this.userContext.userId,
                created: timestamp,
                modified: timestamp,
                permissions: templateData.permissions || this.config.defaultPermissions,
                metadata: {
                    ...templateData.metadata,
                    templateId,
                    source: 'scratch',
                    parentTemplate: null,
                    tags: templateData.tags || [],
                    isSystem: false,
                    isLocked: false
                },
                frontmatter: this.prepareTemplateFrontmatter(templateData),
                body: templateData.body || this.getDefaultTemplateBody(templateData.type)
            };
            
            // Validation EPCIS si applicable
            if (this.config.validateEPCIS && template.category === 'epcis') {
                await this.validateEPCISCompliance(template);
            }
            
            // Créer contenu markdown complet
            const markdownContent = this.buildTemplateMarkdown(template);
            
            // Sauvegarder template
            const filePath = await this.saveTemplate(template, markdownContent);
            
            // Créer version initiale
            await this.createVersion(template, '1.0.0', 'Initial version');
            
            // Enregistrer dans registry
            this.templateRegistry.set(templateId, {
                ...template,
                filePath,
                versions: ['1.0.0']
            });
            
            // Sauvegarder registry
            await this.saveTemplateRegistry();
            
            const endTime = performance.now();
            console.log(`✅ Template créé from scratch: ${template.name} (${(endTime - startTime).toFixed(2)}ms)`);
            
            return {
                success: true,
                template,
                filePath,
                executionTime: `${(endTime - startTime).toFixed(2)}ms`
            };
            
        } catch (error) {
            console.error(`❌ Erreur création template from scratch:`, error.message);
            throw error;
        }
    }

    /**
     * MODE 2: Dupliquer un template existant
     * @param {string} sourceTemplateId - ID du template à dupliquer
     * @param {Object} modifications - Modifications à appliquer
     * @returns {Promise<Object>} Template dupliqué avec modifications
     * @sideEffect Crée nouveau fichier template avec version indépendante
     * @example
     * const duplicated = await manager.duplicateTemplate('tpl_receiving_001', {
     *   name: "Custom Receiving Process",
     *   description: "Version personnalisée du processus de réception",
     *   metadata: { customField: "value" }
     * });
     */
    async duplicateTemplate(sourceTemplateId, modifications = {}) {
        const startTime = performance.now();
        
        try {
            // Vérifier existence template source
            const sourceTemplate = await this.getTemplate(sourceTemplateId);
            if (!sourceTemplate) {
                throw new Error(`Template source '${sourceTemplateId}' introuvable`);
            }
            
            // Vérifier permissions duplication
            if (!sourceTemplate.permissions.read) {
                throw new Error(`Permissions insuffisantes pour dupliquer le template '${sourceTemplateId}'`);
            }
            
            // Générer nouvel ID et timestamp
            const newName = modifications.name || `${sourceTemplate.name} (Copy)`;
            const templateId = this.generateTemplateId(newName);
            const timestamp = new Date().toISOString();
            
            // Créer nouveau template basé sur source
            const duplicatedTemplate = {
                ...sourceTemplate,
                id: templateId,
                name: newName,
                description: modifications.description || `Copie de: ${sourceTemplate.description}`,
                version: '1.0.0',
                author: this.userContext.userId,
                created: timestamp,
                modified: timestamp,
                permissions: modifications.permissions || this.config.defaultPermissions,
                metadata: {
                    ...sourceTemplate.metadata,
                    ...modifications.metadata,
                    templateId,
                    source: 'duplication',
                    parentTemplate: sourceTemplateId,
                    originalTemplate: sourceTemplate.metadata.originalTemplate || sourceTemplateId,
                    duplicatedFrom: {
                        id: sourceTemplateId,
                        name: sourceTemplate.name,
                        version: sourceTemplate.version,
                        date: timestamp
                    },
                    isSystem: false,
                    isLocked: false
                },
                frontmatter: {
                    ...sourceTemplate.frontmatter,
                    ...modifications.frontmatter,
                    template_id: templateId,
                    template_name: newName,
                    template_version: '1.0.0'
                },
                body: modifications.body || sourceTemplate.body
            };
            
            // Appliquer autres modifications
            if (modifications.type) duplicatedTemplate.type = modifications.type;
            if (modifications.category) duplicatedTemplate.category = modifications.category;
            if (modifications.tags) duplicatedTemplate.metadata.tags = modifications.tags;
            
            // Validation EPCIS si applicable
            if (this.config.validateEPCIS && duplicatedTemplate.category === 'epcis') {
                await this.validateEPCISCompliance(duplicatedTemplate);
            }
            
            // Créer contenu markdown
            const markdownContent = this.buildTemplateMarkdown(duplicatedTemplate);
            
            // Sauvegarder nouveau template
            const filePath = await this.saveTemplate(duplicatedTemplate, markdownContent);
            
            // Créer version initiale
            await this.createVersion(duplicatedTemplate, '1.0.0', `Dupliqué depuis: ${sourceTemplate.name}`);
            
            // Enregistrer dans registry
            this.templateRegistry.set(templateId, {
                ...duplicatedTemplate,
                filePath,
                versions: ['1.0.0']
            });
            
            // Sauvegarder registry
            await this.saveTemplateRegistry();
            
            const endTime = performance.now();
            console.log(`✅ Template dupliqué: ${duplicatedTemplate.name} (${(endTime - startTime).toFixed(2)}ms)`);
            
            return {
                success: true,
                template: duplicatedTemplate,
                filePath,
                sourceTemplate: sourceTemplateId,
                executionTime: `${(endTime - startTime).toFixed(2)}ms`
            };
            
        } catch (error) {
            console.error(`❌ Erreur duplication template:`, error.message);
            throw error;
        }
    }

    /**
     * MODE 3: Créer un template par héritage
     * @param {string} parentTemplateId - ID du template parent
     * @param {Object} childData - Données du template enfant
     * @returns {Promise<Object>} Template enfant avec héritage
     * @sideEffect Crée template lié au parent avec propagation des mises à jour
     * @example
     * const child = await manager.inheritTemplate('tpl_base_process', {
     *   name: "Extended Process",
     *   description: "Extension du processus de base",
     *   extensions: {
     *     additionalSteps: [...],
     *     customValidations: [...]
     *   }
     * });
     */
    async inheritTemplate(parentTemplateId, childData) {
        const startTime = performance.now();
        
        try {
            // Vérifier existence template parent
            const parentTemplate = await this.getTemplate(parentTemplateId);
            if (!parentTemplate) {
                throw new Error(`Template parent '${parentTemplateId}' introuvable`);
            }
            
            // Vérifier que le parent permet l'héritage
            if (parentTemplate.metadata.noInheritance) {
                throw new Error(`Le template '${parentTemplateId}' ne permet pas l'héritage`);
            }
            
            // Générer identifiants
            const templateId = this.generateTemplateId(childData.name);
            const timestamp = new Date().toISOString();
            
            // Créer structure héritage
            const inheritedTemplate = {
                id: templateId,
                name: childData.name,
                type: childData.type || parentTemplate.type,
                category: childData.category || parentTemplate.category,
                description: childData.description || `Hérite de: ${parentTemplate.name}`,
                version: '1.0.0',
                author: this.userContext.userId,
                created: timestamp,
                modified: timestamp,
                permissions: childData.permissions || parentTemplate.permissions,
                metadata: {
                    ...parentTemplate.metadata,
                    ...childData.metadata,
                    templateId,
                    source: 'inheritance',
                    parentTemplate: parentTemplateId,
                    inheritance: {
                        parent: {
                            id: parentTemplateId,
                            name: parentTemplate.name,
                            version: parentTemplate.version
                        },
                        overrides: childData.overrides || {},
                        extensions: childData.extensions || {},
                        locked: childData.lockInheritance || false
                    },
                    isSystem: false,
                    isLocked: false
                },
                frontmatter: this.mergeInheritedFrontmatter(
                    parentTemplate.frontmatter,
                    childData.frontmatter || {}
                ),
                body: this.mergeInheritedBody(
                    parentTemplate.body,
                    childData.body || '',
                    childData.extensions || {}
                )
            };
            
            // Appliquer overrides spécifiques
            if (childData.overrides) {
                this.applyOverrides(inheritedTemplate, childData.overrides);
            }
            
            // Validation EPCIS si applicable
            if (this.config.validateEPCIS && inheritedTemplate.category === 'epcis') {
                await this.validateEPCISCompliance(inheritedTemplate);
            }
            
            // Créer contenu markdown avec marqueurs héritage
            const markdownContent = this.buildInheritedTemplateMarkdown(inheritedTemplate, parentTemplate);
            
            // Sauvegarder template
            const filePath = await this.saveTemplate(inheritedTemplate, markdownContent);
            
            // Créer version initiale
            await this.createVersion(
                inheritedTemplate, 
                '1.0.0', 
                `Hérite de: ${parentTemplate.name} v${parentTemplate.version}`
            );
            
            // Enregistrer relation parent-enfant
            await this.registerInheritanceRelation(parentTemplateId, templateId);
            
            // Enregistrer dans registry
            this.templateRegistry.set(templateId, {
                ...inheritedTemplate,
                filePath,
                versions: ['1.0.0'],
                parentId: parentTemplateId
            });
            
            // Sauvegarder registry
            await this.saveTemplateRegistry();
            
            const endTime = performance.now();
            console.log(`✅ Template créé par héritage: ${inheritedTemplate.name} (${(endTime - startTime).toFixed(2)}ms)`);
            
            return {
                success: true,
                template: inheritedTemplate,
                filePath,
                parentTemplate: parentTemplateId,
                inheritanceChain: await this.getInheritanceChain(templateId),
                executionTime: `${(endTime - startTime).toFixed(2)}ms`
            };
            
        } catch (error) {
            console.error(`❌ Erreur héritage template:`, error.message);
            throw error;
        }
    }

    /**
     * Système de versioning: Créer une nouvelle version
     * @param {Object} template - Template à versionner
     * @param {string} newVersion - Numéro de version (semver)
     * @param {string} changeLog - Description des changements
     * @returns {Promise<Object>} Informations de version créée
     * @sideEffect Crée fichier version et met à jour registry
     * @example
     * const version = await manager.createVersion(template, '1.1.0', 'Ajout validation personnalisée');
     */
    async createVersion(template, newVersion, changeLog) {
        try {
            // Valider format version
            if (!this.isValidVersion(newVersion)) {
                throw new Error(`Format de version invalide: ${newVersion}`);
            }
            
            // Vérifier que la version n'existe pas déjà
            const existingVersions = await this.getTemplateVersions(template.id);
            if (existingVersions.includes(newVersion)) {
                throw new Error(`La version ${newVersion} existe déjà pour ce template`);
            }
            
            // Créer snapshot version
            const versionData = {
                templateId: template.id,
                version: newVersion,
                created: new Date().toISOString(),
                author: this.userContext.userId,
                changeLog,
                checksum: this.calculateChecksum(template),
                snapshot: {
                    ...template,
                    version: newVersion
                }
            };
            
            // Sauvegarder fichier version
            const versionPath = path.join(
                this.config.versionsDir,
                template.id,
                `v${newVersion}.json`
            );
            
            await fs.mkdir(path.dirname(versionPath), { recursive: true });
            await fs.writeFile(versionPath, JSON.stringify(versionData, null, 2));
            
            // Mettre à jour cache versions
            if (!this.versionCache.has(template.id)) {
                this.versionCache.set(template.id, []);
            }
            this.versionCache.get(template.id).push(versionData);
            
            // Nettoyer anciennes versions si nécessaire
            await this.cleanOldVersions(template.id);
            
            console.log(`✅ Version ${newVersion} créée pour template: ${template.name}`);
            
            return {
                success: true,
                version: newVersion,
                versionPath,
                totalVersions: existingVersions.length + 1
            };
            
        } catch (error) {
            console.error(`❌ Erreur création version:`, error.message);
            throw error;
        }
    }

    /**
     * Restaurer une version spécifique d'un template
     * @param {string} templateId - ID du template
     * @param {string} version - Version à restaurer
     * @returns {Promise<Object>} Template restauré
     * @sideEffect Remplace le template actuel par la version spécifiée
     */
    async restoreVersion(templateId, version) {
        try {
            // Charger version spécifique
            const versionPath = path.join(
                this.config.versionsDir,
                templateId,
                `v${version}.json`
            );
            
            const versionData = JSON.parse(await fs.readFile(versionPath, 'utf-8'));
            const restoredTemplate = versionData.snapshot;
            
            // Créer backup de la version actuelle
            const currentTemplate = await this.getTemplate(templateId);
            if (currentTemplate) {
                await this.createBackup(currentTemplate, 'before_restore');
            }
            
            // Mettre à jour version
            restoredTemplate.version = version;
            restoredTemplate.modified = new Date().toISOString();
            restoredTemplate.metadata.restoredFrom = {
                version,
                date: new Date().toISOString(),
                by: this.userContext.userId
            };
            
            // Sauvegarder template restauré
            const markdownContent = this.buildTemplateMarkdown(restoredTemplate);
            await this.saveTemplate(restoredTemplate, markdownContent);
            
            // Mettre à jour registry
            this.templateRegistry.set(templateId, {
                ...restoredTemplate,
                filePath: this.getTemplatePath(restoredTemplate)
            });
            
            await this.saveTemplateRegistry();
            
            console.log(`✅ Template restauré à la version ${version}`);
            
            return {
                success: true,
                template: restoredTemplate,
                restoredVersion: version
            };
            
        } catch (error) {
            console.error(`❌ Erreur restauration version:`, error.message);
            throw error;
        }
    }

    /**
     * Obtenir l'historique des versions d'un template
     * @param {string} templateId - ID du template
     * @returns {Promise<Array>} Liste des versions avec métadonnées
     */
    async getVersionHistory(templateId) {
        try {
            const versionsDir = path.join(this.config.versionsDir, templateId);
            
            try {
                const files = await fs.readdir(versionsDir);
                const versions = [];
                
                for (const file of files) {
                    if (file.endsWith('.json')) {
                        const versionData = JSON.parse(
                            await fs.readFile(path.join(versionsDir, file), 'utf-8')
                        );
                        versions.push({
                            version: versionData.version,
                            created: versionData.created,
                            author: versionData.author,
                            changeLog: versionData.changeLog,
                            checksum: versionData.checksum
                        });
                    }
                }
                
                // Trier par version décroissante
                versions.sort((a, b) => this.compareVersions(b.version, a.version));
                
                return versions;
                
            } catch (error) {
                // Pas de versions trouvées
                return [];
            }
            
        } catch (error) {
            console.error(`❌ Erreur récupération historique versions:`, error.message);
            throw error;
        }
    }

    /**
     * Comparer deux versions d'un template
     * @param {string} templateId - ID du template
     * @param {string} version1 - Première version
     * @param {string} version2 - Deuxième version
     * @returns {Promise<Object>} Différences entre les versions
     */
    async compareVersions(templateId, version1, version2) {
        try {
            // Charger les deux versions
            const v1Path = path.join(this.config.versionsDir, templateId, `v${version1}.json`);
            const v2Path = path.join(this.config.versionsDir, templateId, `v${version2}.json`);
            
            const v1Data = JSON.parse(await fs.readFile(v1Path, 'utf-8'));
            const v2Data = JSON.parse(await fs.readFile(v2Path, 'utf-8'));
            
            // Calculer différences
            const differences = {
                metadata: this.diffObjects(v1Data.snapshot.metadata, v2Data.snapshot.metadata),
                frontmatter: this.diffObjects(v1Data.snapshot.frontmatter, v2Data.snapshot.frontmatter),
                body: this.diffStrings(v1Data.snapshot.body, v2Data.snapshot.body),
                summary: {
                    version1: version1,
                    version2: version2,
                    date1: v1Data.created,
                    date2: v2Data.created,
                    author1: v1Data.author,
                    author2: v2Data.author
                }
            };
            
            return differences;
            
        } catch (error) {
            console.error(`❌ Erreur comparaison versions:`, error.message);
            throw error;
        }
    }

    /**
     * Mettre à jour un template existant
     * @param {string} templateId - ID du template à mettre à jour
     * @param {Object} updates - Modifications à appliquer
     * @param {string} changeLog - Description des changements
     * @returns {Promise<Object>} Template mis à jour
     * @sideEffect Met à jour fichier template et crée nouvelle version
     */
    async updateTemplate(templateId, updates, changeLog) {
        try {
            // Vérifier verrouillage
            if (this.lockedTemplates.has(templateId)) {
                throw new Error(`Template '${templateId}' est verrouillé`);
            }
            
            // Verrouiller template pendant mise à jour
            this.lockedTemplates.add(templateId);
            
            try {
                // Charger template actuel
                const currentTemplate = await this.getTemplate(templateId);
                if (!currentTemplate) {
                    throw new Error(`Template '${templateId}' introuvable`);
                }
                
                // Vérifier permissions
                if (!currentTemplate.permissions.write) {
                    throw new Error(`Permissions insuffisantes pour modifier le template`);
                }
                
                // Calculer nouvelle version
                const newVersion = this.incrementVersion(currentTemplate.version);
                
                // Appliquer modifications
                const updatedTemplate = {
                    ...currentTemplate,
                    ...updates,
                    version: newVersion,
                    modified: new Date().toISOString(),
                    metadata: {
                        ...currentTemplate.metadata,
                        ...updates.metadata,
                        lastModifiedBy: this.userContext.userId
                    }
                };
                
                // Si modifications du frontmatter
                if (updates.frontmatter) {
                    updatedTemplate.frontmatter = {
                        ...currentTemplate.frontmatter,
                        ...updates.frontmatter
                    };
                }
                
                // Si modifications du body
                if (updates.body !== undefined) {
                    updatedTemplate.body = updates.body;
                }
                
                // Validation
                if (this.config.validateOnSave) {
                    this.validateTemplateData(updatedTemplate);
                }
                
                if (this.config.validateEPCIS && updatedTemplate.category === 'epcis') {
                    await this.validateEPCISCompliance(updatedTemplate);
                }
                
                // Créer version avant modification
                await this.createVersion(currentTemplate, currentTemplate.version, 'Before update');
                
                // Sauvegarder template mis à jour
                const markdownContent = this.buildTemplateMarkdown(updatedTemplate);
                await this.saveTemplate(updatedTemplate, markdownContent);
                
                // Créer nouvelle version
                await this.createVersion(updatedTemplate, newVersion, changeLog);
                
                // Mettre à jour registry
                this.templateRegistry.set(templateId, {
                    ...updatedTemplate,
                    filePath: this.getTemplatePath(updatedTemplate)
                });
                
                await this.saveTemplateRegistry();
                
                // Propager changements aux templates enfants si héritage
                await this.propagateInheritanceChanges(templateId, updatedTemplate);
                
                console.log(`✅ Template mis à jour: ${updatedTemplate.name} v${newVersion}`);
                
                return {
                    success: true,
                    template: updatedTemplate,
                    previousVersion: currentTemplate.version,
                    newVersion
                };
                
            } finally {
                // Déverrouiller template
                this.lockedTemplates.delete(templateId);
            }
            
        } catch (error) {
            console.error(`❌ Erreur mise à jour template:`, error.message);
            throw error;
        }
    }

    /**
     * Supprimer un template
     * @param {string} templateId - ID du template à supprimer
     * @param {boolean} force - Forcer suppression même si templates enfants
     * @returns {Promise<Object>} Confirmation de suppression
     * @sideEffect Supprime fichier template et versions associées
     */
    async deleteTemplate(templateId, force = false) {
        try {
            // Charger template
            const template = await this.getTemplate(templateId);
            if (!template) {
                throw new Error(`Template '${templateId}' introuvable`);
            }
            
            // Vérifier permissions
            if (!template.permissions.delete && !force) {
                throw new Error(`Permissions insuffisantes pour supprimer le template`);
            }
            
            // Vérifier templates enfants
            const children = await this.getChildTemplates(templateId);
            if (children.length > 0 && !force) {
                throw new Error(`Le template a ${children.length} templates enfants. Utilisez force=true pour supprimer`);
            }
            
            // Créer backup avant suppression
            await this.createBackup(template, 'before_deletion');
            
            // Supprimer fichier template
            const filePath = this.getTemplatePath(template);
            await fs.unlink(filePath);
            
            // Supprimer versions
            const versionsDir = path.join(this.config.versionsDir, templateId);
            try {
                await fs.rm(versionsDir, { recursive: true });
            } catch (error) {
                // Pas de versions, ignorer
            }
            
            // Retirer du registry
            this.templateRegistry.delete(templateId);
            await this.saveTemplateRegistry();
            
            // Nettoyer cache
            this.versionCache.delete(templateId);
            
            console.log(`✅ Template supprimé: ${template.name}`);
            
            return {
                success: true,
                deletedTemplate: {
                    id: templateId,
                    name: template.name,
                    backupCreated: true
                }
            };
            
        } catch (error) {
            console.error(`❌ Erreur suppression template:`, error.message);
            throw error;
        }
    }

    /**
     * Rechercher des templates selon critères
     * @param {Object} criteria - Critères de recherche
     * @returns {Promise<Array>} Templates correspondants
     */
    async searchTemplates(criteria = {}) {
        try {
            let results = Array.from(this.templateRegistry.values());
            
            // Filtrer par type
            if (criteria.type) {
                results = results.filter(t => t.type === criteria.type);
            }
            
            // Filtrer par catégorie
            if (criteria.category) {
                results = results.filter(t => t.category === criteria.category);
            }
            
            // Filtrer par auteur
            if (criteria.author) {
                results = results.filter(t => t.author === criteria.author);
            }
            
            // Recherche textuelle
            if (criteria.search) {
                const searchLower = criteria.search.toLowerCase();
                results = results.filter(t => 
                    t.name.toLowerCase().includes(searchLower) ||
                    t.description.toLowerCase().includes(searchLower) ||
                    (t.metadata.tags && t.metadata.tags.some(tag => 
                        tag.toLowerCase().includes(searchLower)
                    ))
                );
            }
            
            // Filtrer par tags
            if (criteria.tags && criteria.tags.length > 0) {
                results = results.filter(t => 
                    t.metadata.tags && criteria.tags.every(tag => 
                        t.metadata.tags.includes(tag)
                    )
                );
            }
            
            // Filtrer par source
            if (criteria.source) {
                results = results.filter(t => t.metadata.source === criteria.source);
            }
            
            // Trier résultats
            if (criteria.sortBy) {
                results.sort((a, b) => {
                    switch (criteria.sortBy) {
                        case 'name':
                            return a.name.localeCompare(b.name);
                        case 'created':
                            return new Date(b.created) - new Date(a.created);
                        case 'modified':
                            return new Date(b.modified) - new Date(a.modified);
                        case 'version':
                            return this.compareVersions(b.version, a.version);
                        default:
                            return 0;
                    }
                });
            }
            
            // Pagination
            if (criteria.limit) {
                const offset = criteria.offset || 0;
                results = results.slice(offset, offset + criteria.limit);
            }
            
            return results;
            
        } catch (error) {
            console.error(`❌ Erreur recherche templates:`, error.message);
            throw error;
        }
    }

    /**
     * Exporter un template avec toutes ses versions
     * @param {string} templateId - ID du template à exporter
     * @param {string} format - Format d'export ('json', 'zip')
     * @returns {Promise<Object>} Données exportées ou chemin du fichier
     */
    async exportTemplate(templateId, format = 'json') {
        try {
            const template = await this.getTemplate(templateId);
            if (!template) {
                throw new Error(`Template '${templateId}' introuvable`);
            }
            
            // Collecter toutes les données
            const exportData = {
                template,
                versions: await this.getVersionHistory(templateId),
                metadata: {
                    exportDate: new Date().toISOString(),
                    exportedBy: this.userContext.userId,
                    format
                }
            };
            
            if (format === 'json') {
                return exportData;
            } else if (format === 'zip') {
                // TODO: Implémenter export ZIP avec versions
                throw new Error('Export ZIP non encore implémenté');
            }
            
            throw new Error(`Format d'export non supporté: ${format}`);
            
        } catch (error) {
            console.error(`❌ Erreur export template:`, error.message);
            throw error;
        }
    }

    /**
     * Importer un template depuis données externes
     * @param {Object} importData - Données à importer
     * @param {Object} options - Options d'import
     * @returns {Promise<Object>} Template importé
     */
    async importTemplate(importData, options = {}) {
        try {
            // Valider données import
            if (!importData.template) {
                throw new Error('Données template manquantes dans l\'import');
            }
            
            const template = importData.template;
            
            // Vérifier si template existe déjà
            const existingId = this.findTemplateByName(template.name);
            if (existingId && !options.overwrite) {
                throw new Error(`Un template nommé '${template.name}' existe déjà`);
            }
            
            // Générer nouvel ID si nécessaire
            if (!options.keepId || existingId) {
                template.id = this.generateTemplateId(template.name);
            }
            
            // Réinitialiser métadonnées
            template.created = new Date().toISOString();
            template.modified = new Date().toISOString();
            template.author = this.userContext.userId;
            template.metadata.imported = {
                date: new Date().toISOString(),
                by: this.userContext.userId,
                originalId: importData.template.id
            };
            
            // Sauvegarder template
            const markdownContent = this.buildTemplateMarkdown(template);
            const filePath = await this.saveTemplate(template, markdownContent);
            
            // Importer versions si présentes
            if (importData.versions && options.importVersions) {
                for (const version of importData.versions) {
                    await this.createVersion(template, version.version, version.changeLog);
                }
            }
            
            // Enregistrer dans registry
            this.templateRegistry.set(template.id, {
                ...template,
                filePath
            });
            
            await this.saveTemplateRegistry();
            
            console.log(`✅ Template importé: ${template.name}`);
            
            return {
                success: true,
                template,
                imported: {
                    versions: importData.versions ? importData.versions.length : 0
                }
            };
            
        } catch (error) {
            console.error(`❌ Erreur import template:`, error.message);
            throw error;
        }
    }

    // === MÉTHODES UTILITAIRES PRIVÉES ===

    /**
     * Valide les données d'un template
     * @private
     */
    validateTemplateData(templateData) {
        // Validation nom
        if (!templateData.name || templateData.name.length > this.config.maxNameLength) {
            throw new Error(`Nom de template invalide ou trop long (max ${this.config.maxNameLength} caractères)`);
        }
        
        // Validation type
        if (templateData.type && !this.config.templateTypes.includes(templateData.type)) {
            throw new Error(`Type de template invalide: ${templateData.type}`);
        }
        
        // Validation catégorie
        if (templateData.category && !this.config.templateCategories.includes(templateData.category)) {
            throw new Error(`Catégorie de template invalide: ${templateData.category}`);
        }
        
        // Validation métadonnées requises
        for (const field of this.config.requiredMetadata) {
            if (!(field in templateData) && field !== 'version') {
                throw new Error(`Champ requis manquant: ${field}`);
            }
        }
    }

    /**
     * Génère un ID unique pour un template
     * @private
     */
    generateTemplateId(name) {
        const sanitized = name
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-zA-Z0-9]+/g, '_')
            .toLowerCase();
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        return `tpl_${sanitized}_${timestamp}_${random}`;
    }

    /**
     * Obtient le chemin fichier d'un template
     * @private
     */
    getTemplatePath(template) {
        const category = template.category === 'epcis' ? 'epcis' : 'user-templates';
        const type = template.type || 'custom';
        const filename = `${template.id}.md`;
        
        return path.join(
            this.config.templatesBaseDir,
            category,
            type,
            filename
        );
    }

    /**
     * Construit le contenu markdown d'un template
     * @private
     */
    buildTemplateMarkdown(template) {
        const frontmatter = yaml.dump({
            ...template.frontmatter,
            template_id: template.id,
            template_name: template.name,
            template_version: template.version,
            template_type: template.type,
            template_category: template.category,
            author: template.author,
            created: template.created,
            modified: template.modified
        });
        
        return `---\n${frontmatter}---\n${template.body}`;
    }

    /**
     * Construit le contenu markdown d'un template hérité
     * @private
     */
    buildInheritedTemplateMarkdown(childTemplate, parentTemplate) {
        const inheritanceMarker = `<!-- INHERITANCE FROM: ${parentTemplate.id} v${parentTemplate.version} -->\n`;
        const overridesMarker = childTemplate.metadata.inheritance.overrides ? 
            `<!-- OVERRIDES: ${JSON.stringify(childTemplate.metadata.inheritance.overrides)} -->\n` : '';
        
        return inheritanceMarker + overridesMarker + this.buildTemplateMarkdown(childTemplate);
    }

    /**
     * Fusionne le frontmatter hérité
     * @private
     */
    mergeInheritedFrontmatter(parentFrontmatter, childFrontmatter) {
        return {
            ...parentFrontmatter,
            ...childFrontmatter,
            _inherited_from: parentFrontmatter
        };
    }

    /**
     * Fusionne le body hérité avec extensions
     * @private
     */
    mergeInheritedBody(parentBody, childBody, extensions) {
        if (!childBody) {
            return parentBody;
        }
        
        // Si le child body contient des marqueurs d'extension
        if (childBody.includes('{{PARENT_CONTENT}}')) {
            return childBody.replace('{{PARENT_CONTENT}}', parentBody);
        }
        
        // Sinon, ajouter le contenu enfant après le parent
        return parentBody + '\n\n<!-- CHILD EXTENSIONS -->\n' + childBody;
    }

    /**
     * Applique les overrides à un template hérité
     * @private
     */
    applyOverrides(template, overrides) {
        for (const [key, value] of Object.entries(overrides)) {
            if (key === 'frontmatter') {
                template.frontmatter = { ...template.frontmatter, ...value };
            } else if (key === 'metadata') {
                template.metadata = { ...template.metadata, ...value };
            } else if (key === 'body' && value.sections) {
                // Remplacer sections spécifiques du body
                for (const [section, content] of Object.entries(value.sections)) {
                    const sectionRegex = new RegExp(`(## ${section}[\\s\\S]*?)(?=##|$)`, 'g');
                    template.body = template.body.replace(sectionRegex, `## ${section}\n${content}\n`);
                }
            }
        }
    }

    /**
     * Sauvegarde un template sur le système de fichiers
     * @private
     */
    async saveTemplate(template, content) {
        const filePath = this.getTemplatePath(template);
        
        // Créer dossiers si nécessaire
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        
        // Sauvegarder fichier
        await fs.writeFile(filePath, content, 'utf-8');
        
        // Créer backup si activé
        if (this.config.autoBackup) {
            await this.createBackup(template, 'auto_save');
        }
        
        return filePath;
    }

    /**
     * Charge un template depuis le registry
     * @private
     */
    async getTemplate(templateId) {
        if (this.templateRegistry.has(templateId)) {
            return this.templateRegistry.get(templateId);
        }
        
        // Tenter de charger depuis le système de fichiers
        await this.loadTemplateRegistry();
        return this.templateRegistry.get(templateId) || null;
    }

    /**
     * Charge le registry des templates
     * @private
     */
    async loadTemplateRegistry() {
        try {
            const registryPath = path.join(this.config.templatesBaseDir, '.registry.json');
            const registryData = JSON.parse(await fs.readFile(registryPath, 'utf-8'));
            
            this.templateRegistry.clear();
            for (const [id, template] of Object.entries(registryData)) {
                this.templateRegistry.set(id, template);
            }
            
        } catch (error) {
            // Registry n'existe pas encore, créer vide
            this.templateRegistry.clear();
        }
    }

    /**
     * Sauvegarde le registry des templates
     * @private
     */
    async saveTemplateRegistry() {
        const registryPath = path.join(this.config.templatesBaseDir, '.registry.json');
        const registryData = Object.fromEntries(this.templateRegistry);
        
        await fs.writeFile(registryPath, JSON.stringify(registryData, null, 2));
    }

    /**
     * Prépare le frontmatter par défaut pour un nouveau template
     * @private
     */
    prepareTemplateFrontmatter(templateData) {
        const timestamp = new Date().toISOString();
        
        return {
            template_id: templateData.id || 'new_template',
            template_name: templateData.name,
            template_version: '1.0.0',
            template_type: templateData.type || 'custom',
            template_category: templateData.category || 'custom',
            description: templateData.description || '',
            author: templateData.author || this.userContext.userId,
            created_at: timestamp,
            last_modified: timestamp,
            sync_status: 'draft',
            position: { x: 0, y: 0 },
            ...templateData.frontmatter
        };
    }

    /**
     * Obtient le body par défaut selon le type de template
     * @private
     */
    getDefaultTemplateBody(type) {
        const bodies = {
            object: `# Object: {{OBJECT_NAME}}

## Description
{{OBJECT_DESCRIPTION}}

## État Actuel
- **État**: {{CURRENT_STATE}}
- **Disposition**: {{DISPOSITION}}
- **Dernière mise à jour**: {{TIMESTAMP}}

## Actions Disponibles
{{#each AVAILABLE_ACTIONS}}
- **{{this.name}}**: {{this.description}}
{{/each}}

## Métadonnées Techniques
\`\`\`yaml
object_id: {{OBJECT_ID}}
object_type: {{OBJECT_TYPE}}
epc: {{EPC}}
\`\`\``,

            state: `# État: {{STATE_NAME}}

## Description État
{{STATE_DESCRIPTION}}

## Architecture État-Actions
### Action Principale (Automatique)
- **Type**: Exposition de données
- **Nom**: {{MAIN_ACTION.name}}

### Actions Secondaires
{{#each SECONDARY_ACTIONS}}
- **{{this.name}}** → État cible: {{this.target_state}}
{{/each}}

## Métadonnées Techniques
\`\`\`yaml
state_id: {{STATE_ID}}
disposition: {{DISPOSITION}}
business_step: {{BUSINESS_STEP}}
\`\`\``,

            action: `# Action: {{ACTION_NAME}}

## Description Action
{{ACTION_DESCRIPTION}}

## Paramètres d'Entrée
{{INPUT_PARAMETERS}}

## Workflow Interne
{{WORKFLOW_INTERNAL}}

## Paramètres de Sortie
{{OUTPUT_PARAMETERS}}

## Spécifications API
{{API_SPECIFICATIONS}}`
        };
        
        return bodies[type] || bodies.object;
    }

    /**
     * Valide la conformité EPCIS d'un template
     * @private
     */
    async validateEPCISCompliance(template) {
        const validationResult = await this.epcisValidator.validateTemplate({
            type: template.type,
            category: template.category,
            metadata: template.metadata,
            frontmatter: template.frontmatter
        });
        
        if (!validationResult.isValid) {
            throw new Error(`Template non conforme EPCIS 2.0: ${validationResult.errors.join(', ')}`);
        }
    }

    /**
     * Vérifie si une version est valide (semver)
     * @private
     */
    isValidVersion(version) {
        const semverRegex = /^\d+\.\d+\.\d+(-[\w\d.]+)?(\+[\w\d.]+)?$/;
        return semverRegex.test(version);
    }

    /**
     * Compare deux versions semver
     * @private
     */
    compareVersions(v1, v2) {
        const parts1 = v1.split('.').map(Number);
        const parts2 = v2.split('.').map(Number);
        
        for (let i = 0; i < 3; i++) {
            if (parts1[i] > parts2[i]) return 1;
            if (parts1[i] < parts2[i]) return -1;
        }
        
        return 0;
    }

    /**
     * Incrémente automatiquement une version
     * @private
     */
    incrementVersion(version, type = 'patch') {
        const parts = version.split('.').map(Number);
        
        switch (type) {
            case 'major':
                parts[0]++;
                parts[1] = 0;
                parts[2] = 0;
                break;
            case 'minor':
                parts[1]++;
                parts[2] = 0;
                break;
            case 'patch':
            default:
                parts[2]++;
        }
        
        return parts.join('.');
    }

    /**
     * Calcule le checksum d'un template
     * @private
     */
    calculateChecksum(template) {
        const crypto = require('crypto');
        const content = JSON.stringify({
            frontmatter: template.frontmatter,
            body: template.body
        });
        return crypto.createHash('sha256').update(content).digest('hex');
    }

    /**
     * Crée un backup d'un template
     * @private
     */
    async createBackup(template, reason) {
        const timestamp = new Date().toISOString().replace(/:/g, '-');
        const backupName = `${template.id}_${timestamp}_${reason}.json`;
        const backupPath = path.join(this.config.backupsDir, backupName);
        
        await fs.writeFile(backupPath, JSON.stringify(template, null, 2));
        
        // Nettoyer vieux backups
        await this.cleanOldBackups();
    }

    /**
     * Nettoie les anciennes versions
     * @private
     */
    async cleanOldVersions(templateId) {
        const versions = await this.getTemplateVersions(templateId);
        
        if (versions.length > this.config.maxVersionsPerTemplate) {
            // Conserver les N versions les plus récentes
            const toKeep = versions
                .sort((a, b) => this.compareVersions(b, a))
                .slice(0, this.config.maxVersionsPerTemplate);
            
            const versionsDir = path.join(this.config.versionsDir, templateId);
            const files = await fs.readdir(versionsDir);
            
            for (const file of files) {
                const version = file.replace('v', '').replace('.json', '');
                if (!toKeep.includes(version)) {
                    await fs.unlink(path.join(versionsDir, file));
                }
            }
        }
    }

    /**
     * Nettoie les vieux backups
     * @private
     */
    async cleanOldBackups() {
        const backups = await fs.readdir(this.config.backupsDir);
        const now = Date.now();
        const maxAge = this.config.backupRetentionDays * 24 * 60 * 60 * 1000;
        
        for (const backup of backups) {
            const backupPath = path.join(this.config.backupsDir, backup);
            const stats = await fs.stat(backupPath);
            
            if (now - stats.mtime.getTime() > maxAge) {
                await fs.unlink(backupPath);
            }
        }
    }

    /**
     * Obtient les versions d'un template
     * @private
     */
    async getTemplateVersions(templateId) {
        if (this.versionCache.has(templateId)) {
            return this.versionCache.get(templateId).map(v => v.version);
        }
        
        const versionsDir = path.join(this.config.versionsDir, templateId);
        
        try {
            const files = await fs.readdir(versionsDir);
            return files
                .filter(f => f.endsWith('.json'))
                .map(f => f.replace('v', '').replace('.json', ''));
        } catch (error) {
            return [];
        }
    }

    /**
     * Trouve un template par son nom
     * @private
     */
    findTemplateByName(name) {
        for (const [id, template] of this.templateRegistry) {
            if (template.name === name) {
                return id;
            }
        }
        return null;
    }

    /**
     * Enregistre une relation d'héritage
     * @private
     */
    async registerInheritanceRelation(parentId, childId) {
        const relationsPath = path.join(this.config.templatesBaseDir, '.inheritance.json');
        let relations = {};
        
        try {
            relations = JSON.parse(await fs.readFile(relationsPath, 'utf-8'));
        } catch (error) {
            // Fichier n'existe pas encore
        }
        
        if (!relations[parentId]) {
            relations[parentId] = [];
        }
        
        if (!relations[parentId].includes(childId)) {
            relations[parentId].push(childId);
        }
        
        await fs.writeFile(relationsPath, JSON.stringify(relations, null, 2));
    }

    /**
     * Obtient les templates enfants d'un template
     * @private
     */
    async getChildTemplates(parentId) {
        const relationsPath = path.join(this.config.templatesBaseDir, '.inheritance.json');
        
        try {
            const relations = JSON.parse(await fs.readFile(relationsPath, 'utf-8'));
            return relations[parentId] || [];
        } catch (error) {
            return [];
        }
    }

    /**
     * Obtient la chaîne d'héritage complète d'un template
     * @private
     */
    async getInheritanceChain(templateId) {
        const chain = [];
        let currentId = templateId;
        
        while (currentId) {
            const template = await this.getTemplate(currentId);
            if (!template) break;
            
            chain.push({
                id: currentId,
                name: template.name,
                version: template.version
            });
            
            currentId = template.metadata.inheritance?.parent?.id || 
                       template.metadata.parentTemplate;
        }
        
        return chain.reverse();
    }

    /**
     * Propage les changements d'un parent vers ses enfants
     * @private
     */
    async propagateInheritanceChanges(parentId, parentTemplate) {
        const children = await this.getChildTemplates(parentId);
        
        for (const childId of children) {
            const child = await this.getTemplate(childId);
            if (!child || child.metadata.inheritance?.locked) {
                continue;
            }
            
            // Appliquer changements hérités
            const updates = {
                metadata: {
                    ...child.metadata,
                    inheritance: {
                        ...child.metadata.inheritance,
                        parent: {
                            id: parentId,
                            name: parentTemplate.name,
                            version: parentTemplate.version
                        }
                    }
                }
            };
            
            // Ne propager que les changements non overridés
            const overrides = child.metadata.inheritance?.overrides || {};
            
            if (!overrides.frontmatter) {
                updates.frontmatter = this.mergeInheritedFrontmatter(
                    parentTemplate.frontmatter,
                    child.frontmatter
                );
            }
            
            if (!overrides.body) {
                updates.body = this.mergeInheritedBody(
                    parentTemplate.body,
                    child.body,
                    child.metadata.inheritance?.extensions || {}
                );
            }
            
            await this.updateTemplate(
                childId, 
                updates, 
                `Héritage mis à jour depuis parent ${parentTemplate.name} v${parentTemplate.version}`
            );
        }
    }

    /**
     * Calcule les différences entre deux objets
     * @private
     */
    diffObjects(obj1, obj2) {
        const diff = {
            added: {},
            removed: {},
            modified: {}
        };
        
        // Éléments ajoutés ou modifiés
        for (const [key, value] of Object.entries(obj2)) {
            if (!(key in obj1)) {
                diff.added[key] = value;
            } else if (JSON.stringify(obj1[key]) !== JSON.stringify(value)) {
                diff.modified[key] = {
                    old: obj1[key],
                    new: value
                };
            }
        }
        
        // Éléments supprimés
        for (const key of Object.keys(obj1)) {
            if (!(key in obj2)) {
                diff.removed[key] = obj1[key];
            }
        }
        
        return diff;
    }

    /**
     * Calcule les différences entre deux strings
     * @private
     */
    diffStrings(str1, str2) {
        // Implémentation simple - peut être améliorée avec un vrai diff algorithm
        const lines1 = str1.split('\n');
        const lines2 = str2.split('\n');
        
        return {
            linesAdded: lines2.length - lines1.length,
            charactersChanged: Math.abs(str2.length - str1.length),
            identical: str1 === str2
        };
    }
}

// Export ES6 par défaut
export { TemplateManager, MANAGER_CONFIG };

// Export browser pour utilisation dans Obsidian
if (typeof window !== 'undefined') {
    window.ProcessMetaLanguageTemplateManager = {
        TemplateManager,
        MANAGER_CONFIG
    };
}

// <!-- END OF FILE: template-manager.js -->