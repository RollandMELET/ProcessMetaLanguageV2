// <!-- START OF FILE: markdown-generator.js -->
// FILENAME: markdown-generator.js
// Version: 1.0.0
// Date: 2025-07-28 16:30
// Author: Rolland MELET & Claude Code
// Description: Générateur markdown ProcessMetaLanguage - synchronisation canvas → docs - TASK-B004

/**
 * Générateur de documentation markdown ProcessMetaLanguage
 * 
 * Transforme les données extraites du canvas en documentation markdown structurée :
 * - Génération fichiers individuels pour objects/states/actions
 * - Utilisation des templates existants (object-template, state-template, action-template)
 * - Génération batch optimisée <5s pour 50 composants
 * - Documentation workflow finale consolidée
 * 
 * @author Rolland MELET & Claude Code
 * @version 1.0.0
 */

import { fs } from '../utils/obsidian-adapter.js';
import { path } from '../utils/obsidian-adapter.js';
import { TemplateProcessor } from '../core/template-processor.js';

/**
 * Configuration par défaut du générateur markdown
 */
const DEFAULT_CONFIG = {
    // Répertoires de sortie
    outputDirs: {
        objects: './docs/generated/objects',
        states: './docs/generated/states', 
        actions: './docs/generated/actions',
        workflows: './docs/generated/workflows',
        consolidated: './docs/generated'
    },
    
    // Templates à utiliser
    templates: {
        object: 'object-template',
        state: 'state-template',
        action: 'action-template'
    },
    
    // Performance targets
    maxGenerationTimeMs: 5000,
    batchSize: 10,
    
    // Options de génération
    generateConsolidatedWorkflow: true,
    generateIndexFiles: true,
    generateStatistics: true,
    overwriteExisting: true
};

/**
 * Classe principale de génération markdown ProcessMetaLanguage
 */
export class MarkdownGenerator {
    /**
     * Initialise le générateur markdown
     * @param {Object} config - Configuration personnalisée
     * @param {string} config.templatesDir - Répertoire des templates
     * @param {Object} config.outputDirs - Répertoires de sortie personnalisés
     * @param {number} config.maxGenerationTimeMs - Temps max génération (défaut: 5000ms)
     * @param {boolean} config.generateConsolidatedWorkflow - Générer workflow consolidé (défaut: true)
     */
    constructor(config = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.templateProcessor = new TemplateProcessor({
            templatesDir: config.templatesDir || './templates',
            outputDir: config.outputDir || './docs/generated'
        });
        
        this.stats = {
            objectsGenerated: 0,
            statesGenerated: 0,
            actionsGenerated: 0,
            relationshipsProcessed: 0,
            totalGenerationTime: 0,
            consolidatedWorkflowGenerated: false,
            lastGenerationTimestamp: null
        };
        
        this.generatedFiles = [];
        this.errors = [];
    }

    /**
     * Génère la documentation markdown complète à partir des données canvas
     * @param {Object} canvasData - Données extraites du canvas par CanvasReader
     * @param {Object} options - Options de génération
     * @param {boolean} options.parallelGeneration - Génération parallèle (défaut: true)
     * @param {boolean} options.generateWorkflow - Générer workflow consolidé (défaut: true)
     * @returns {Promise<Object>} Résultat de génération avec statistiques
     * @throws {Error} Si génération impossible
     * @sideEffect Crée fichiers markdown, répertoires, logs erreurs
     * @example
     * const generator = new MarkdownGenerator({ templatesDir: './templates' });
     * const result = await generator.generateFromCanvas(canvasData);
     * // Returns: { filesGenerated: 15, totalTime: 2340, performanceTarget: true }
     */
    async generateFromCanvas(canvasData, options = {}) {
        const startTime = Date.now();
        this.errors = [];
        this.generatedFiles = [];

        try {
            console.log('🚀 Génération documentation ProcessMetaLanguage...');
            console.log(`📊 Données: ${canvasData.objects.length} objets, ${canvasData.states.length} états, ${canvasData.actions.length} actions`);

            // 1. Créer les répertoires de sortie
            await this._createOutputDirectories();

            // 2. Générer les fichiers individuels
            const generationPromises = [];

            if (options.parallelGeneration !== false) {
                // Génération parallèle optimisée
                generationPromises.push(
                    this._generateObjectsParallel(canvasData.objects),
                    this._generateStatesParallel(canvasData.states),
                    this._generateActionsParallel(canvasData.actions)
                );
            } else {
                // Génération séquentielle
                generationPromises.push(
                    this._generateObjectsSequential(canvasData.objects),
                    this._generateStatesSequential(canvasData.states),
                    this._generateActionsSequential(canvasData.actions)
                );
            }

            await Promise.all(generationPromises);

            // 3. Traiter les relations
            await this._processRelationships(canvasData.relationships);

            // 4. Générer workflow consolidé si demandé
            if (options.generateWorkflow !== false && this.config.generateConsolidatedWorkflow) {
                await this._generateConsolidatedWorkflow(canvasData);
            }

            // 5. Générer fichiers index
            if (this.config.generateIndexFiles) {
                await this._generateIndexFiles();
            }

            // 6. Générer statistiques
            if (this.config.generateStatistics) {
                await this._generateStatisticsReport(canvasData);
            }

            // 7. Mettre à jour statistiques
            const totalTime = Date.now() - startTime;
            this._updateStats(totalTime);

            console.log(`✅ Génération terminée: ${this.generatedFiles.length} fichiers en ${totalTime}ms`);

            return {
                success: true,
                metadata: {
                    sourceCanvas: canvasData.metadata.sourceFile,
                    generationTimestamp: new Date().toISOString(),
                    totalGenerationTime: totalTime,
                    performanceTarget: totalTime < this.config.maxGenerationTimeMs
                },
                filesGenerated: this.generatedFiles.length,
                objectsGenerated: this.stats.objectsGenerated,
                statesGenerated: this.stats.statesGenerated,
                actionsGenerated: this.stats.actionsGenerated,
                generatedFiles: [...this.generatedFiles],
                statistics: { ...this.stats },  
                errors: this.errors.filter(e => e.level === 'error'),
                warnings: this.errors.filter(e => e.level === 'warning')
            };

        } catch (error) {
            const totalTime = Date.now() - startTime;
            this._logError('critical', `Erreur génération markdown: ${error.message}`, { totalTime });
            throw new Error(`Impossible de générer la documentation: ${error.message}`);
        }
    }

    /**
     * Crée les répertoires de sortie nécessaires
     * @returns {Promise<void>}
     * @private
     */
    async _createOutputDirectories() {
        const dirs = Object.values(this.config.outputDirs);
        
        for (const dir of dirs) {
            try {
                await fs.mkdir(dir, { recursive: true });
            } catch (error) {
                this._logError('warning', `Impossible de créer le répertoire ${dir}`, { error: error.message });
            }
        }
    }

    /**
     * Génère les fichiers objects en parallèle
     * @param {Array} objects - Liste des objets à générer
     * @returns {Promise<void>}
     * @private
     */
    async _generateObjectsParallel(objects) {
        if (objects.length === 0) return;

        console.log(`📦 Génération ${objects.length} objets (parallèle)...`);

        const batches = this._createBatches(objects, this.config.batchSize);
        
        for (const batch of batches) {
            const batchPromises = batch.map(async (object) => {
                try {
                    const objectData = this._prepareObjectData(object);
                    const outputPath = await this.templateProcessor.syncObjectToTemplate(
                        objectData, 
                        this.config.templates.object
                    );
                    
                    this.generatedFiles.push(outputPath);
                    this.stats.objectsGenerated++;
                    
                } catch (error) {
                    this._logError('error', `Erreur génération objet ${object.name}`, { 
                        objectId: object.id, 
                        error: error.message 
                    });
                }
            });

            await Promise.all(batchPromises);
        }
    }

    /**
     * Génère les fichiers states en parallèle
     * @param {Array} states - Liste des états à générer
     * @returns {Promise<void>}
     * @private
     */
    async _generateStatesParallel(states) {
        if (states.length === 0) return;

        console.log(`🏃 Génération ${states.length} états (parallèle)...`);

        const batches = this._createBatches(states, this.config.batchSize);
        
        for (const batch of batches) {
            const batchPromises = batch.map(async (state) => {
                try {
                    const stateData = this._prepareStateData(state);
                    const outputPath = await this.templateProcessor.syncStateToTemplate(
                        stateData,
                        this.config.templates.state  
                    );
                    
                    this.generatedFiles.push(outputPath);
                    this.stats.statesGenerated++;
                    
                } catch (error) {
                    this._logError('error', `Erreur génération état ${state.name}`, {
                        stateId: state.id,
                        error: error.message
                    });
                }
            });

            await Promise.all(batchPromises);
        }
    }

    /**
     * Génère les fichiers actions en parallèle
     * @param {Array} actions - Liste des actions à générer
     * @returns {Promise<void>}
     * @private
     */
    async _generateActionsParallel(actions) {
        if (actions.length === 0) return;

        console.log(`⚡ Génération ${actions.length} actions (parallèle)...`);

        const batches = this._createBatches(actions, this.config.batchSize);
        
        for (const batch of batches) {
            const batchPromises = batch.map(async (action) => {
                try {
                    const actionData = this._prepareActionData(action);
                    const outputPath = await this.templateProcessor.syncActionToTemplate(
                        actionData,
                        this.config.templates.action
                    );
                    
                    this.generatedFiles.push(outputPath);
                    this.stats.actionsGenerated++;
                    
                } catch (error) {
                    this._logError('error', `Erreur génération action ${action.name}`, {
                        actionId: action.id,
                        error: error.message
                    });
                }
            });

            await Promise.all(batchPromises);
        }
    }

    /**
     * Crée des batches pour traitement parallèle optimisé
     * @param {Array} items - Éléments à traiter
     * @param {number} batchSize - Taille des batches
     * @returns {Array<Array>} Batches d'éléments
     * @private
     */
    _createBatches(items, batchSize) {
        const batches = [];
        for (let i = 0; i < items.length; i += batchSize) {
            batches.push(items.slice(i, i + batchSize));
        }
        return batches;
    }

    /**
     * Prépare les données d'un objet pour le template
     * @param {Object} object - Objet ProcessMetaLanguage du canvas
     * @returns {Object} Données formatées pour le template
     * @private
     */
    _prepareObjectData(object) {
        return {
            // Données de base
            uniqueId: object.id,
            objectName: object.name,
            objectType: object.objectType || 'generic-object',
            tracedEntity: object.tracedEntity || object.name,
            
            // Position et dimensions
            position: object.position || { x: 0, y: 0 },
            dimensions: object.dimensions || { width: 120, height: 80 },
            
            // Propriétés visuelles
            backgroundColor: object.properties?.backgroundColor || '#4CAF50',
            strokeColor: object.properties?.strokeColor || '#2E7D32',
            
            // Métadonnées
            createdAt: new Date().toISOString(),
            lastModified: new Date().toISOString(),
            
            // Canvas
            canvasElementId: object.id,
            elementId: object.id,
            
            // EPCIS (valeurs par défaut)
            businessLocation: `urn:epc:id:sgln:0614141.00888.${object.objectType}`,
            epcisEventType: 'object_event',
            
            // Horodatage
            eventTime: new Date().toISOString(),
            eventTimeZone: '+01:00',
            
            // Utilisateur
            userMetadata: {
                operator: 'System',
                extractedFromCanvas: true,
                originalPosition: object.position
            }
        };
    }

    /**
     * Prépare les données d'un état pour le template
     * @param {Object} state - État ProcessMetaLanguage du canvas
     * @returns {Object} Données formatées pour le template
     * @private
     */
    _prepareStateData(state) {
        return {
            // Données de base
            uniqueId: state.id,
            stateName: state.stateName || state.name,
            parentObjectId: state.parentObjectId || 'unknown',
            
            // Disposition EPCIS
            disposition: state.disposition || 'active',
            
            // Position et dimensions
            position: state.position || { x: 0, y: 0 },
            dimensions: state.dimensions || { width: 80, height: 40 },
            
            // Propriétés visuelles
            backgroundColor: state.properties?.backgroundColor || '#2196F3',
            strokeColor: state.properties?.strokeColor || '#1976D2',
            
            // Action principale automatique (données par défaut)
            mainAction: {
                actionName: `Consulter_${state.stateName?.replace(/\s+/g, '_') || 'Etat'}`,
                actionType: 'main_action',
                description: `Consultation des données de l'état ${state.stateName || state.name}`,
                automaticallyGenerated: true
            },
            
            // Actions secondaires (vides par défaut, seront complétées par les relations)
            secondaryActions: [],
            
            // Métadonnées
            createdAt: new Date().toISOString(),
            lastModified: new Date().toISOString(),
            
            // Canvas
            canvasElementId: state.id,
            elementId: state.id,
            
            // EPCIS
            businessStep: 'observing',
            businessLocation: `urn:epc:id:sgln:0614141.00888.state_${state.id}`,
            eventTime: new Date().toISOString(),
            eventTimeZone: '+01:00',
            
            // Utilisateur
            userMetadata: {
                operator: 'System',
                extractedFromCanvas: true,
                originalPosition: state.position
            }
        };
    }

    /**
     * Prépare les données d'une action pour le template
     * @param {Object} action - Action ProcessMetaLanguage du canvas
     * @returns {Object} Données formatées pour le template
     * @private
     */
    _prepareActionData(action) {
        return {
            // Données de base
            uniqueId: action.id,
            actionName: action.actionName || action.name,
            actionType: action.actionType || 'secondary_action',
            actionCategory: this._inferActionCategory(action.actionType),
            
            // Relations
            parentStateId: action.parentStateId || 'unknown',
            parentStateName: 'État_Parent',
            parentObjectId: 'unknown',
            
            // Transitions (valeurs par défaut)
            sourceState: 'État_Actuel',
            targetState: 'État_Suivant',
            targetDisposition: 'active',
            
            // Position et dimensions
            position: action.position || { x: 0, y: 0 },
            dimensions: action.dimensions || { width: 140, height: 60 },
            
            // Propriétés visuelles
            backgroundColor: this._getActionColor(action.actionType),
            strokeColor: action.properties?.strokeColor || '#666666',
            
            // Paramètres par défaut
            inputParameters: {
                required: [],
                optional: []
            },
            outputParameters: {
                success: [
                    {
                        name: 'execution_result',
                        type: 'object',
                        description: 'Résultat de l\'exécution de l\'action',
                        condition: 'always',
                        format: 'JSON object'
                    }
                ],
                metadata: [
                    { name: 'execution_timestamp', description: 'Horodatage d\'exécution' },
                    { name: 'operator_id', description: 'Identifiant de l\'opérateur' }
                ]
            },
            
            // Workflow par défaut
            workflowInternal: {
                steps: [
                    {
                        name: 'Exécution action',
                        action: 'execute_action',
                        description: `Exécuter l'action ${action.actionName || action.name}`,
                        condition: 'action_enabled === true',
                        timeout: 30,
                        error_handling: 'rollback'
                    }
                ],
                initial_state: 'État_Actuel',
                final_state: 'État_Suivant',
                intermediate_states: [],
                rollback: {
                    supported: true,
                    strategy: 'compensating_actions',
                    compensation_actions: ['restore_previous_state']
                }
            },
            
            // Métadonnées
            createdAt: new Date().toISOString(),
            lastModified: new Date().toISOString(),
            
            // Canvas
            canvasElementId: action.id,
            elementId: action.id,
            
            // EPCIS
            businessStep: this._inferBusinessStep(action.actionName),
            businessLocation: `urn:epc:id:sgln:0614141.00888.action_${action.id}`,
            epcisActionType: 'observe',
            eventTime: new Date().toISOString(),
            eventTimeZone: '+01:00',
            
            // Utilisateur
            userMetadata: {
                operator: 'System',
                extractedFromCanvas: true,
                originalPosition: action.position
            }
        };
    }

    /**
     * Infère la catégorie d'action à partir du type
     * @param {string} actionType - Type d'action
     * @returns {string} Catégorie d'action
     * @private
     */
    _inferActionCategory(actionType) {
        const categoryMap = {
            'main_action': 'data_exposition',
            'secondary_action': 'state_transition',
            'workflow_action': 'transformation',
            'api_action': 'data_capture',
            'validation_action': 'validation',
            'transformation_action': 'transformation'
        };
        
        return categoryMap[actionType] || 'data_capture';
    }

    /**
     * Obtient la couleur d'une action selon son type
     * @param {string} actionType - Type d'action
     * @returns {string} Code couleur hex
     * @private
     */
    _getActionColor(actionType) {
        const colorMap = {
            'main_action': '#2196F3',
            'secondary_action': '#FF9800',
            'workflow_action': '#4CAF50',
            'api_action': '#9C27B0',
            'validation_action': '#F44336',
            'transformation_action': '#607D8B'
        };
        
        return colorMap[actionType] || '#FF9800';
    }

    /**
     * Infère le business step EPCIS à partir du nom d'action
     * @param {string} actionName - Nom de l'action
     * @returns {string} Business step EPCIS
     * @private
     */
    _inferBusinessStep(actionName) {
        if (!actionName) return 'observing';
        
        const actionLower = actionName.toLowerCase();
        
        if (actionLower.includes('recevoir') || actionLower.includes('receive')) return 'receiving';
        if (actionLower.includes('expédier') || actionLower.includes('ship')) return 'shipping';
        if (actionLower.includes('stocker') || actionLower.includes('store')) return 'storing';
        if (actionLower.includes('transformer') || actionLower.includes('transform')) return 'transforming';
        if (actionLower.includes('contrôler') || actionLower.includes('inspect')) return 'inspecting';
        if (actionLower.includes('emballer') || actionLower.includes('pack')) return 'packing';
        if (actionLower.includes('déballer') || actionLower.includes('unpack')) return 'unpacking';
        
        return 'observing';
    }

    /**
     * Traite les relations entre éléments pour enrichir la documentation
     * @param {Array} relationships - Relations détectées par CanvasReader
     * @returns {Promise<void>}
     * @private
     */
    async _processRelationships(relationships) {
        if (!relationships || relationships.length === 0) return;

        console.log(`🔗 Traitement ${relationships.length} relations...`);

        for (const relation of relationships) {
            try {
                await this._processRelation(relation);
                this.stats.relationshipsProcessed++;
            } catch (error) {
                this._logError('warning', `Erreur traitement relation ${relation.type}`, {
                    source: relation.source?.id,
                    target: relation.target?.id,
                    error: error.message
                });
            }
        }
    }

    /**
     * Traite une relation individuelle
     * @param {Object} relation - Relation à traiter
     * @returns {Promise<void>}
     * @private
     */
    async _processRelation(relation) {
        // Les relations seront utilisées pour enrichir les templates
        // Cette logique peut être étendue selon les besoins
        
        if (relation.type === 'state_belongs_to_object') {
            // La relation state→object est déjà gérée par parentObjectId
            return;
        }
        
        if (relation.type === 'action_belongs_to_state') {
            // La relation action→state est déjà gérée par parentStateId
            return;
        }
        
        if (relation.type === 'workflow_transition') {
            // Les transitions workflow pourraient enrichir les templates
            // À implémenter selon les besoins spécifiques
            return;
        }
    }

    /**
     * Génère un workflow consolidé combinant tous les éléments
     * @param {Object} canvasData - Données complètes du canvas
     * @returns {Promise<void>}
     * @private
     */
    async _generateConsolidatedWorkflow(canvasData) {
        console.log('📋 Génération workflow consolidé...');
        
        const workflowContent = this._buildConsolidatedWorkflow(canvasData);
        const outputPath = path.join(this.config.outputDirs.consolidated, 'workflow-consolidé.md');
        
        try {
            await fs.writeFile(outputPath, workflowContent, 'utf-8');
            this.generatedFiles.push(outputPath);
            this.stats.consolidatedWorkflowGenerated = true;
            
            console.log(`✅ Workflow consolidé généré: ${outputPath}`);
            
        } catch (error) {
            this._logError('error', 'Erreur génération workflow consolidé', { error: error.message });
        }
    }

    /**
     * Construit le contenu du workflow consolidé
     * @param {Object} canvasData - Données du canvas
     * @returns {string} Contenu markdown du workflow
     * @private
     */
    _buildConsolidatedWorkflow(canvasData) {
        const timestamp = new Date().toISOString();
        
        return `---
# ProcessMetaLanguage - Workflow Consolidé
source_canvas: "${canvasData.metadata.sourceFile}"
generated_at: "${timestamp}"
template_version: "1.0.0"
sync_status: "synchronized"
---

# Workflow ProcessMetaLanguage Consolidé

## Métadonnées Générales
- **Source Canvas:** ${canvasData.metadata.sourceFile}
- **Date Génération:** ${timestamp}
- **Éléments Traités:** ${canvasData.objects.length} objets, ${canvasData.states.length} états, ${canvasData.actions.length} actions
- **Relations Détectées:** ${canvasData.relationships.length}

## Vue d'Ensemble des Objets

${canvasData.objects.map(obj => `### ${obj.name}
- **Type:** ${obj.objectType || 'generic-object'}
- **Entité tracée:** ${obj.tracedEntity || obj.name}
- **Position:** (${obj.position.x}, ${obj.position.y})
- **ID Canvas:** ${obj.id}
`).join('\n')}

## Architecture États-Actions

${canvasData.objects.map(obj => {
    const objectStates = canvasData.states.filter(state => state.parentObjectId === obj.id);
    
    return `### Objet: ${obj.name}

${objectStates.map(state => {
    const stateActions = canvasData.actions.filter(action => action.parentStateId === state.id);
    
    return `#### État: ${state.stateName || state.name}
- **Disposition:** ${state.disposition || 'active'}
- **Position:** (${state.position.x}, ${state.position.y})

##### Action Principale (automatique)
- **Consultation:** Exposition des données de l'état ${state.stateName || state.name}

${stateActions.length > 0 ? `##### Actions Secondaires
${stateActions.map(action => `- **${action.actionName || action.name}** (${action.actionType || 'secondary_action'})
  - Position: (${action.position.x}, ${action.position.y})
  - Catégorie: ${this._inferActionCategory(action.actionType)}`).join('\n')}` : ''}
`;
}).join('\n')}
`;
}).join('\n')}

## Relations Workflow

${canvasData.relationships.map(rel => `- **${rel.type}:** ${rel.source?.name || rel.source?.id} → ${rel.target?.name || rel.target?.id}
  - Confiance: ${rel.confidence}
  - Méthode: ${rel.method}
`).join('\n')}

## Statistiques Génération

- **Temps Traitement Canvas:** ${canvasData.metadata.processingTimeMs}ms
- **Fichiers Générés:** ${this.generatedFiles.length}
- **Performance:** ${canvasData.metadata.processingTimeMs < 5000 ? '✅ Objectif <5s atteint' : '⚠️ Objectif <5s non atteint'}

## Correspondances 360SmartConnect

### Objets → Avatars
${canvasData.objects.map(obj => `- **${obj.name}** → Avatar ID: avatar_${obj.id}
  - Endpoint: \`/api/avatars/avatar_${obj.id}\`
  - Type: ${obj.objectType}`).join('\n')}

### États → Métadonnées
${canvasData.states.map(state => `- **${state.stateName || state.name}** → Disposition: ${state.disposition || 'active'}
  - Endpoint: \`/api/avatars/avatar_${state.parentObjectId}/states/${state.id}\``).join('\n')}

### Actions → API Endpoints
${canvasData.actions.map(action => `- **${action.actionName || action.name}** → POST \`/api/avatars/avatar_${action.parentStateId}/actions/${action.id}/execute\`
  - Type: ${action.actionType || 'secondary_action'}
  - Business Step: ${this._inferBusinessStep(action.actionName)}`).join('\n')}

---

*Workflow généré automatiquement par ProcessMetaLanguage v1.0.0*  
*Basé sur canvas: ${canvasData.metadata.sourceFile}*  
*Généré le: ${timestamp}*
`;
    }

    /**
     * Génère les fichiers index pour navigation
     * @returns {Promise<void>}
     * @private
     */
    async _generateIndexFiles() {
        console.log('📑 Génération fichiers index...');
        
        // Index général
        const mainIndexPath = path.join(this.config.outputDirs.consolidated, 'README.md');
        const mainIndexContent = this._buildMainIndex();
        
        try {
            await fs.writeFile(mainIndexPath, mainIndexContent, 'utf-8');
            this.generatedFiles.push(mainIndexPath);
        } catch (error) {
            this._logError('warning', 'Erreur génération index principal', { error: error.message });
        }
    }

    /**
     * Construit l'index principal
     * @returns {string} Contenu de l'index
     * @private
     */
    _buildMainIndex() {
        const timestamp = new Date().toISOString();
        
        return `# ProcessMetaLanguage - Documentation Générée

## Vue d'Ensemble

Documentation générée automatiquement le ${timestamp} par ProcessMetaLanguage.

### Statistiques
- **Objets générés:** ${this.stats.objectsGenerated}
- **États générés:** ${this.stats.statesGenerated}  
- **Actions générées:** ${this.stats.actionsGenerated}
- **Fichiers totaux:** ${this.generatedFiles.length}
- **Performance:** ${this.stats.totalGenerationTime}ms

### Structure Documentation

#### 📦 Objets (${this.stats.objectsGenerated})
- Répertoire: \`./objects/\`
- Templates utilisés: object-template.md

#### 🏃 États (${this.stats.statesGenerated})
- Répertoire: \`./states/\`
- Templates utilisés: state-template.md
- Architecture deux niveaux: Action principale + Actions secondaires

#### ⚡ Actions (${this.stats.actionsGenerated})
- Répertoire: \`./actions/\`
- Templates utilisés: action-template.md
- Types: main_action, secondary_action, workflow_action, etc.

#### 📋 Workflows
- Répertoire: \`./workflows/\`
- Workflow consolidé: \`workflow-consolidé.md\`

### Navigation

- [Workflow Consolidé](./workflow-consolidé.md) - Vue d'ensemble complète
- [Objets](./objects/) - Entités tracées
- [États](./states/) - États des objets avec actions
- [Actions](./actions/) - Actions et transitions

### Outils ProcessMetaLanguage

Cette documentation a été générée par:
- **CanvasReader:** Extraction éléments canvas Excalidraw
- **MarkdownGenerator:** Génération templates markdown
- **TemplateProcessor:** Traitement variables et synchronisation

---

*Généré par ProcessMetaLanguage v1.0.0*  
*${timestamp}*
`;
    }

    /**
     * Génère un rapport de statistiques détaillé
     * @param {Object} canvasData - Données du canvas
     * @returns {Promise<void>}
     * @private
     */
    async _generateStatisticsReport(canvasData) {
        console.log('📊 Génération rapport statistiques...');
        
        const reportContent = this._buildStatisticsReport(canvasData);
        const reportPath = path.join(this.config.outputDirs.consolidated, 'statistiques-génération.md');
        
        try {
            await fs.writeFile(reportContent, reportPath, 'utf-8');
            this.generatedFiles.push(reportPath);
        } catch (error) {
            this._logError('warning', 'Erreur génération rapport statistiques', { error: error.message });
        }
    }

    /**
     * Construit le rapport de statistiques
     * @param {Object} canvasData - Données du canvas
     * @returns {string} Contenu du rapport
     * @private
     */
    _buildStatisticsReport(canvasData) {
        const timestamp = new Date().toISOString();
        
        return `# Rapport Statistiques ProcessMetaLanguage

**Généré le:** ${timestamp}

## Performance Génération

| Métrique | Valeur | Objectif | Statut |
|----------|--------|----------|--------|
| Temps lecture canvas | ${canvasData.metadata.processingTimeMs}ms | <5000ms | ${canvasData.metadata.processingTimeMs < 5000 ? '✅' : '❌'} |
| Temps génération total | ${this.stats.totalGenerationTime}ms | <5000ms | ${this.stats.totalGenerationTime < 5000 ? '✅' : '❌'} |
| Fichiers générés | ${this.generatedFiles.length} | N/A | ✅ |
| Éléments traités | ${this.stats.objectsGenerated + this.stats.statesGenerated + this.stats.actionsGenerated} | N/A | ✅ |

## Répartition Éléments

- **Objets:** ${this.stats.objectsGenerated}
- **États:** ${this.stats.statesGenerated}
- **Actions:** ${this.stats.actionsGenerated}
- **Relations:** ${this.stats.relationshipsProcessed}

## Qualité Données

- **Erreurs:** ${this.errors.filter(e => e.level === 'error').length}
- **Avertissements:** ${this.errors.filter(e => e.level === 'warning').length}
- **Validation OK:** ${this.errors.length === 0 ? '✅' : '⚠️'}

---

*Rapport généré par ProcessMetaLanguage v1.0.0*
`;
    }

    /**
     * Met à jour les statistiques de génération
     * @param {number} totalTime - Temps total de génération
     * @private
     */
    _updateStats(totalTime) {
        this.stats.totalGenerationTime = totalTime;
        this.stats.lastGenerationTimestamp = new Date().toISOString();
    }

    /**
     * Enregistre une erreur avec contexte
     * @param {string} level - Niveau d'erreur (warning, error, critical)
     * @param {string} message - Message d'erreur
     * @param {Object} context - Contexte additionnel
     * @private
     */
    _logError(level, message, context = {}) {
        const error = {
            level,
            message,
            context,
            timestamp: new Date().toISOString()
        };
        
        this.errors.push(error);
        
        if (level === 'critical') {
            console.error(`❌ [${level.toUpperCase()}] ${message}`, context);
        } else if (level === 'error') {
            console.error(`⚠️ [${level.toUpperCase()}] ${message}`, context);
        } else {
            console.warn(`⚠️ [${level.toUpperCase()}] ${message}`, context);
        }
    }

    /**
     * Génère les objets en mode séquentiel (fallback)
     * @param {Array} objects - Liste des objets
     * @returns {Promise<void>}
     * @private
     */
    async _generateObjectsSequential(objects) {
        for (const object of objects) {
            try {
                const objectData = this._prepareObjectData(object);
                const outputPath = await this.templateProcessor.syncObjectToTemplate(
                    objectData,
                    this.config.templates.object
                );
                this.generatedFiles.push(outputPath);
                this.stats.objectsGenerated++;
            } catch (error) {
                this._logError('error', `Erreur génération objet ${object.name}`, {
                    objectId: object.id,
                    error: error.message
                });
            }
        }
    }

    /**
     * Génère les états en mode séquentiel (fallback)
     * @param {Array} states - Liste des états
     * @returns {Promise<void>}
     * @private
     */
    async _generateStatesSequential(states) {
        for (const state of states) {
            try {
                const stateData = this._prepareStateData(state);
                const outputPath = await this.templateProcessor.syncStateToTemplate(
                    stateData,
                    this.config.templates.state
                );
                this.generatedFiles.push(outputPath);
                this.stats.statesGenerated++;
            } catch (error) {
                this._logError('error', `Erreur génération état ${state.name}`, {
                    stateId: state.id,
                    error: error.message
                });
            }
        }
    }

    /**
     * Génère les actions en mode séquentiel (fallback)
     * @param {Array} actions - Liste des actions
     * @returns {Promise<void>}
     * @private
     */
    async _generateActionsSequential(actions) {
        for (const action of actions) {
            try {
                const actionData = this._prepareActionData(action);
                const outputPath = await this.templateProcessor.syncActionToTemplate(
                    actionData,
                    this.config.templates.action
                );
                this.generatedFiles.push(outputPath);
                this.stats.actionsGenerated++;
            } catch (error) {
                this._logError('error', `Erreur génération action ${action.name}`, {
                    actionId: action.id,
                    error: error.message
                });
            }
        }
    }

    /**
     * Obtient les statistiques de performance
     * @returns {Object} Statistiques détaillées
     */
    getPerformanceStats() {
        return {
            ...this.stats,
            performanceTarget: this.stats.totalGenerationTime < this.config.maxGenerationTimeMs,
            errorsTotal: this.errors.length,
            warningsTotal: this.errors.filter(e => e.level === 'warning').length,
            filesGeneratedTotal: this.generatedFiles.length
        };
    }

    /**
     * Vide le cache et remet à zéro les statistiques
     * @sideEffect Vide cache, remet compteurs à zéro, clear erreurs
     */
    clearCache() {
        this.templateProcessor.clearCache();
        this.generatedFiles = [];
        this.errors = [];
        this.stats = {
            objectsGenerated: 0,
            statesGenerated: 0,
            actionsGenerated: 0,
            relationshipsProcessed: 0,
            totalGenerationTime: 0,
            consolidatedWorkflowGenerated: false,
            lastGenerationTimestamp: null
        };
    }
}

// Fonction utilitaire pour usage direct
/**
 * Génère la documentation markdown à partir de données canvas
 * @param {Object} canvasData - Données extraites du canvas par CanvasReader
 * @param {Object} config - Configuration optionnelle
 * @returns {Promise<Object>} Résultat de génération
 * @example
 * const result = await generateMarkdownFromCanvas(canvasData, { templatesDir: './templates' });
 * console.log(`${result.filesGenerated} fichiers générés en ${result.metadata.totalGenerationTime}ms`);
 */
export async function generateMarkdownFromCanvas(canvasData, config = {}) {
    const generator = new MarkdownGenerator(config);
    return await generator.generateFromCanvas(canvasData);
}

export default MarkdownGenerator;

// <!-- END OF FILE: markdown-generator.js -->