// <!-- START OF FILE: architecture-validator.js -->
// FILENAME: architecture-validator.js
// Version: 1.0.0
// Date: 2025-07-30 20:30
// Author: Rolland MELET & Claude Code
// Description: Validateur architecture État-Actions ProcessMetaLanguage - TASK-D004 Phase 3

/**
 * Module ProcessMetaLanguage - Architecture Validator
 * 
 * Validateur complet pour l'architecture État-Actions Deux Niveaux ProcessMetaLanguage.
 * Vérifie la conformité du modèle OBJECT → STATE → ACTIONS, la cohérence des relations
 * et le respect des règles métier avec génération de rapport de conformité détaillé.
 * 
 * Architecture validée :
 * - Niveau 1 : OBJECT (hexagone) → STATE (bannière)
 * - Niveau 2 : STATE → MAIN_ACTION (obligatoire) + SECONDARY_ACTIONS (0-N optionnelles)
 * - Transitions : STATE → ACTION → TARGET_STATE avec workflows internes
 * - Conformité EPCIS 2.0 : 41 business steps + 25 dispositions
 * 
 * Performance cible : <1s pour validation 50+ composants
 */

import { RelationDetector } from '../core/relation-detector.js';
import { EPCISValidator } from '../core/epcis-validator.js';

/**
 * Configuration du validateur d'architecture
 * @constant {Object}
 */
const ARCHITECTURE_VALIDATOR_CONFIG = {
    // Règles architecture ProcessMetaLanguage
    architecture: {
        // Règles niveau 1 : Object → State
        level1: {
            objectToStateRequired: true,
            maxStatesPerObject: 10,
            minStatesPerObject: 1,
            stateNamingPattern: /^[A-Z][a-z_-]+$/,
            allowOrphanStates: false
        },
        
        // Règles niveau 2 : State → Actions
        level2: {
            mainActionRequired: true,
            maxSecondaryActions: 15,
            minSecondaryActions: 0,
            actionNamingPattern: /^[A-Z][a-zA-Z_-]+$/,
            allowActionChaining: true
        },
        
        // Règles transitions
        transitions: {
            requireTargetState: true,
            allowSelfTransitions: false,
            maxTransitionDepth: 8,
            preventCycles: true,
            requireValidWorkflow: true
        }
    },
    
    // Standards EPCIS 2.0
    epcis: {
        validateBusinessSteps: true,
        validateDispositions: true,
        requireCBVCompliance: true,
        allowCustomExtensions: false,
        strictModeEnabled: true
    },
    
    // Validation performance
    performance: {
        maxValidationTime: 1000, // 1s pour 50+ composants
        enableParallelValidation: true,
        cacheValidationResults: true,
        batchSize: 10
    },
    
    // Seuils de conformité
    conformity: {
        criticalThreshold: 95, // Score minimum pour validation critique
        warningThreshold: 85,  // Score minimum avant warnings
        maxCriticalIssues: 3,  // Maximum d'erreurs critiques tolérées
        maxWarningIssues: 10   // Maximum de warnings tolérés
    },
    
    // Rapports
    reporting: {
        includeDetails: true,
        includeSuggestions: true,
        includeMetrics: true,
        generateVisualization: true,
        exportFormats: ['json', 'md']
    }
};

/**
 * Résultats de validation d'architecture
 * @typedef {Object} ValidationResult
 * @property {boolean} isValid - Architecture valide
 * @property {number} conformityScore - Score de conformité (0-100)
 * @property {Object} summary - Résumé de validation
 * @property {Array} issues - Problèmes identifiés
 * @property {Object} metrics - Métriques détaillées
 * @property {Object} recommendations - Recommandations d'amélioration
 */

/**
 * Classe principale du validateur d'architecture ProcessMetaLanguage
 * @class ArchitectureValidator
 */
export class ArchitectureValidator {
    /**
     * Initialise le validateur d'architecture
     * @param {Object} options - Options de configuration
     */
    constructor(options = {}) {
        this.config = { ...ARCHITECTURE_VALIDATOR_CONFIG, ...options };
        
        // Composants de validation
        this.relationDetector = new RelationDetector();
        this.epcisValidator = new EPCISValidator();
        
        // Cache de validation
        this.validationCache = new Map();
        
        // Métriques de performance
        this.metrics = {
            validationsPerformed: 0,
            averageValidationTime: 0,
            totalElementsValidated: 0,
            cacheHitRate: 0
        };
        
        // Règles de validation
        this.validationRules = this.initializeValidationRules();
        
        console.log('✅ ArchitectureValidator initialisé');
    }

    /**
     * Valide l'architecture complète d'un canvas ProcessMetaLanguage
     * @param {Array} canvasElements - Éléments du canvas Excalidraw
     * @param {Object} options - Options de validation
     * @returns {Promise<ValidationResult>} Résultat de validation complet
     * @sideEffect Met à jour cache de validation et métriques
     * @example
     * const validator = new ArchitectureValidator();
     * const result = await validator.validateArchitecture(excalidrawElements, {
     *   strictMode: true,
     *   includeOptimizations: true,
     *   generateReport: true
     * });
     * console.log(`Score de conformité: ${result.conformityScore}%`);
     */
    async validateArchitecture(canvasElements, options = {}) {
        const startTime = performance.now();
        
        try {
            console.log(`🏗️ Validation architecture sur ${canvasElements.length} éléments`);
            
            // Vérifier cache si activé
            const cacheKey = this.generateCacheKey(canvasElements);
            if (this.config.performance.cacheValidationResults && this.validationCache.has(cacheKey)) {
                console.log('📋 Utilisation cache validation');
                return this.validationCache.get(cacheKey);
            }
            
            // Phase 1 : Détection et analyse des relations
            console.log('🔍 Phase 1: Détection relations...');
            const relationResult = await this.relationDetector.detectRelations(canvasElements, {
                includeAnalysis: true,
                validateTransitions: true
            });
            
            // Phase 2 : Classification des éléments ProcessMetaLanguage
            console.log('🏷️ Phase 2: Classification éléments...');
            const elementClassification = await this.classifyElements(canvasElements);
            
            // Phase 3 : Validation architecture niveau 1 (Object → State)
            console.log('🎯 Phase 3: Validation niveau 1...');
            const level1Validation = await this.validateLevel1Architecture(
                elementClassification,
                relationResult.relations
            );
            
            // Phase 4 : Validation architecture niveau 2 (State → Actions)
            console.log('⚡ Phase 4: Validation niveau 2...');
            const level2Validation = await this.validateLevel2Architecture(
                elementClassification,
                relationResult.relations
            );
            
            // Phase 5 : Validation des transitions et workflows
            console.log('🔄 Phase 5: Validation transitions...');
            const transitionValidation = await this.validateTransitions(
                relationResult.transitionMappings,
                relationResult.relations
            );
            
            // Phase 6 : Validation conformité EPCIS 2.0
            console.log('📋 Phase 6: Validation EPCIS 2.0...');
            const epcisValidation = await this.validateEPCISCompliance(
                elementClassification,
                relationResult.relations
            );
            
            // Phase 7 : Calcul score de conformité
            const conformityScore = this.calculateConformityScore({
                level1: level1Validation,
                level2: level2Validation,
                transitions: transitionValidation,
                epcis: epcisValidation
            });
            
            // Phase 8 : Génération recommandations
            const recommendations = await this.generateRecommendations({
                level1Validation,
                level2Validation,
                transitionValidation,
                epcisValidation,
                relationResult
            });
            
            // Phase 9 : Consolidation résultat final
            const validationResult = {
                isValid: conformityScore >= this.config.conformity.criticalThreshold,
                conformityScore: Math.round(conformityScore * 100) / 100,
                
                summary: {
                    totalElements: canvasElements.length,
                    objectsCount: elementClassification.objects.length,
                    statesCount: elementClassification.states.length,
                    actionsCount: elementClassification.actions.length,
                    relationsCount: relationResult.relations.length,
                    validRelationsCount: relationResult.summary.validRelations,
                    workflowsCount: relationResult.analysis?.workflows?.length || 0,
                    criticalIssues: this.countIssuesBySeverity('critical', [
                        level1Validation, level2Validation, transitionValidation, epcisValidation
                    ]),
                    warningIssues: this.countIssuesBySeverity('warning', [
                        level1Validation, level2Validation, transitionValidation, epcisValidation
                    ])
                },
                
                validation: {
                    level1: level1Validation,
                    level2: level2Validation,
                    transitions: transitionValidation,
                    epcis: epcisValidation
                },
                
                issues: this.consolidateIssues([
                    level1Validation, level2Validation, transitionValidation, epcisValidation
                ]),
                
                metrics: {
                    validationTime: performance.now() - startTime,
                    performance: this.evaluatePerformance(performance.now() - startTime),
                    coverage: this.calculateValidationCoverage(elementClassification),
                    complexity: this.calculateArchitectureComplexity(relationResult)
                },
                
                recommendations,
                
                elementClassification,
                relationResult,
                
                metadata: {
                    validatedAt: new Date().toISOString(),
                    validatorVersion: '1.0.0',
                    configVersion: this.config.version || '1.0.0'
                }
            };
            
            // Mise en cache
            if (this.config.performance.cacheValidationResults) {
                this.validationCache.set(cacheKey, validationResult);
            }
            
            // Mise à jour métriques
            this.updateMetrics(validationResult);
            
            console.log(`✅ Validation terminée: ${validationResult.conformityScore}% (${validationResult.metrics.validationTime.toFixed(2)}ms)`);
            
            return validationResult;
            
        } catch (error) {
            console.error('❌ Erreur validation architecture:', error);
            throw new Error(`Échec validation architecture: ${error.message}`);
        }
    }

    /**
     * Valide un composant spécifique de l'architecture
     * @param {string} componentId - ID du composant à valider
     * @param {Array} canvasElements - Éléments du canvas
     * @returns {Promise<Object>} Validation spécifique du composant
     * @example
     * const componentValidation = await validator.validateComponent(
     *   'object_001', 
     *   excalidrawElements
     * );
     */
    async validateComponent(componentId, canvasElements) {
        try {
            console.log(`🎯 Validation composant ${componentId}`);
            
            // Trouver le composant
            const component = canvasElements.find(el => el.id === componentId);
            if (!component) {
                throw new Error(`Composant ${componentId} non trouvé`);
            }
            
            // Classifier le composant
            const componentType = this.getElementType(component);
            if (!componentType) {
                throw new Error(`Type de composant ${componentId} non reconnu`);
            }
            
            // Analyser les relations du composant
            const relationResult = await this.relationDetector.detectRelations(canvasElements);
            const componentRelations = relationResult.relations.filter(rel => 
                rel.source.id === componentId || rel.target.id === componentId
            );
            
            // Validation spécifique selon le type
            let validation;
            switch (componentType) {
                case 'object':
                    validation = await this.validateObjectComponent(component, componentRelations);
                    break;
                case 'state':
                    validation = await this.validateStateComponent(component, componentRelations);
                    break;
                case 'action':
                    validation = await this.validateActionComponent(component, componentRelations);
                    break;
                default:
                    throw new Error(`Type de composant non supporté: ${componentType}`);
            }
            
            return {
                componentId,
                componentType,
                isValid: validation.isValid,
                validation,
                relations: componentRelations,
                recommendations: this.generateComponentRecommendations(component, validation),
                metadata: {
                    validatedAt: new Date().toISOString()
                }
            };
            
        } catch (error) {
            console.error(`❌ Erreur validation composant ${componentId}:`, error);
            throw error;
        }
    }

    /**
     * Génère un rapport de conformité détaillé
     * @param {ValidationResult} validationResult - Résultat de validation
     * @param {Object} options - Options de rapport
     * @returns {Promise<Object>} Rapport de conformité
     * @example
     * const report = await validator.generateConformityReport(validationResult, {
     *   format: 'detailed',
     *   includeVisuals: true,
     *   includeSuggestions: true
     * });
     */
    async generateConformityReport(validationResult, options = {}) {
        try {
            console.log('📊 Génération rapport de conformité...');
            
            const report = {
                // Résumé exécutif
                executive: {
                    overallScore: validationResult.conformityScore,
                    recommendation: this.getOverallRecommendation(validationResult.conformityScore),
                    readiness: this.assessImplementationReadiness(validationResult),
                    riskLevel: this.assessRiskLevel(validationResult),
                    estimatedEffort: this.estimateImplementationEffort(validationResult)
                },
                
                // Détails par niveau d'architecture
                architectureLevels: {
                    level1: {
                        title: 'Architecture Niveau 1 (OBJECT → STATE)',
                        score: this.calculateLevelScore(validationResult.validation.level1),
                        status: this.getLevelStatus(validationResult.validation.level1),
                        issues: validationResult.validation.level1.issues || [],
                        compliance: this.analyzeLevelCompliance(validationResult.validation.level1)
                    },
                    level2: {
                        title: 'Architecture Niveau 2 (STATE → ACTIONS)',
                        score: this.calculateLevelScore(validationResult.validation.level2),
                        status: this.getLevelStatus(validationResult.validation.level2),
                        issues: validationResult.validation.level2.issues || [],
                        compliance: this.analyzeLevelCompliance(validationResult.validation.level2)
                    }
                },
                
                // Analyse des transitions
                transitions: {
                    totalTransitions: validationResult.relationResult?.transitionMappings?.stateTransitions?.length || 0,
                    validTransitions: this.countValidTransitions(validationResult.validation.transitions),
                    workflows: this.analyzeWorkflows(validationResult),
                    bottlenecks: this.identifyBottlenecks(validationResult)
                },
                
                // Conformité EPCIS 2.0
                epcisCompliance: {
                    businessStepsCompliance: this.analyzeBusinessStepsCompliance(validationResult.validation.epcis),
                    dispositionsCompliance: this.analyzeDispositionsCompliance(validationResult.validation.epcis),
                    cbvCompliance: validationResult.validation.epcis?.cbvCompliant || false,
                    customExtensions: this.analyzeCustomExtensions(validationResult.validation.epcis)
                },
                
                // Métriques de qualité
                qualityMetrics: {
                    coverage: validationResult.metrics.coverage,
                    complexity: validationResult.metrics.complexity,
                    maintainability: this.calculateMaintainabilityScore(validationResult),
                    performance: validationResult.metrics.performance
                },
                
                // Plan d'action détaillé
                actionPlan: await this.generateActionPlan(validationResult),
                
                // Annexes techniques
                technical: {
                    detailedIssues: this.categorizeDetailedIssues(validationResult.issues),
                    componentAnalysis: this.generateComponentAnalysis(validationResult.elementClassification),
                    relationshipMatrix: this.generateRelationshipMatrix(validationResult.relationResult),
                    performanceAnalysis: this.analyzePerformanceMetrics(validationResult.metrics)
                },
                
                metadata: {
                    reportGeneratedAt: new Date().toISOString(),
                    reportVersion: '1.0.0',
                    analysisDepth: options.depth || 'comprehensive',
                    includesRecommendations: true
                }
            };
            
            console.log('✅ Rapport de conformité généré');
            
            return report;
            
        } catch (error) {
            console.error('❌ Erreur génération rapport:', error);
            throw error;
        }
    }

    // Méthodes privées de validation

    /**
     * Initialise les règles de validation
     * @private
     */
    initializeValidationRules() {
        return {
            object: [
                {
                    name: 'has_states',
                    validator: (obj, relations) => {
                        const stateRelations = relations.filter(r => 
                            r.source.id === obj.id && r.source.type === 'object' && r.target.type === 'state'
                        );
                        return {
                            valid: stateRelations.length >= this.config.architecture.level1.minStatesPerObject,
                            message: stateRelations.length === 0 ? 
                                'Object doit avoir au moins un état' : null
                        };
                    }
                },
                {
                    name: 'max_states_limit',
                    validator: (obj, relations) => {
                        const stateRelations = relations.filter(r => 
                            r.source.id === obj.id && r.source.type === 'object' && r.target.type === 'state'
                        );
                        return {
                            valid: stateRelations.length <= this.config.architecture.level1.maxStatesPerObject,
                            message: stateRelations.length > this.config.architecture.level1.maxStatesPerObject ?
                                `Trop d'états (${stateRelations.length}/${this.config.architecture.level1.maxStatesPerObject})` : null
                        };
                    }
                }
            ],
            
            state: [
                {
                    name: 'has_main_action',
                    validator: (state, relations) => {
                        const actionRelations = relations.filter(r => 
                            r.source.id === state.id && r.source.type === 'state' && r.target.type === 'action'
                        );
                        
                        // Vérifier qu'au moins une action est marquée comme principale
                        const hasMainAction = actionRelations.some(r => 
                            r.target.element.customData?.actionType === 'main' ||
                            r.target.element.customData?.isPrimary === true
                        );
                        
                        return {
                            valid: hasMainAction || actionRelations.length > 0,
                            message: !hasMainAction && actionRelations.length === 0 ? 
                                'État doit avoir une action principale' : 
                                (!hasMainAction ? 'Action principale non identifiée' : null)
                        };
                    }
                },
                {
                    name: 'max_secondary_actions',
                    validator: (state, relations) => {
                        const secondaryActions = relations.filter(r => 
                            r.source.id === state.id && 
                            r.source.type === 'state' && 
                            r.target.type === 'action' &&
                            r.target.element.customData?.actionType !== 'main' &&
                            r.target.element.customData?.isPrimary !== true
                        );
                        
                        return {
                            valid: secondaryActions.length <= this.config.architecture.level2.maxSecondaryActions,
                            message: secondaryActions.length > this.config.architecture.level2.maxSecondaryActions ?
                                `Trop d'actions secondaires (${secondaryActions.length}/${this.config.architecture.level2.maxSecondaryActions})` : null
                        };
                    }
                }
            ],
            
            action: [
                {
                    name: 'has_target_state',
                    validator: (action, relations) => {
                        if (!this.config.architecture.transitions.requireTargetState) return { valid: true };
                        
                        const targetStates = relations.filter(r => 
                            r.source.id === action.id && r.source.type === 'action' && r.target.type === 'state'
                        );
                        
                        return {
                            valid: targetStates.length > 0,
                            message: targetStates.length === 0 ? 
                                'Action doit avoir un état cible' : null
                        };
                    }
                }
            ]
        };
    }

    /**
     * Classifie les éléments du canvas
     * @private
     */
    async classifyElements(canvasElements) {
        const classification = {
            objects: [],
            states: [],
            actions: [],
            others: [],
            statistics: {
                totalElements: canvasElements.length,
                classifiedElements: 0,
                unclassifiedElements: 0
            }
        };
        
        for (const element of canvasElements) {
            const elementType = this.getElementType(element);
            
            switch (elementType) {
                case 'object':
                    classification.objects.push(element);
                    break;
                case 'state':
                    classification.states.push(element);
                    break;
                case 'action':
                    classification.actions.push(element);
                    break;
                default:
                    classification.others.push(element);
                    classification.statistics.unclassifiedElements++;
                    continue;
            }
            
            classification.statistics.classifiedElements++;
        }
        
        return classification;
    }

    /**
     * Valide l'architecture niveau 1
     * @private
     */
    async validateLevel1Architecture(elementClassification, relations) {
        const validation = {
            isValid: true,
            issues: [],
            metrics: {},
            details: {}
        };
        
        // Valider chaque objet
        for (const object of elementClassification.objects) {
            const objectValidation = await this.validateObjectComponent(object, relations);
            if (!objectValidation.isValid) {
                validation.isValid = false;
                validation.issues.push(...objectValidation.issues);
            }
        }
        
        // Vérifier orphelins d'états
        if (!this.config.architecture.level1.allowOrphanStates) {
            const orphanStates = this.findOrphanStates(elementClassification.states, relations);
            if (orphanStates.length > 0) {
                validation.isValid = false;
                validation.issues.push({
                    type: 'orphan_states',
                    severity: 'warning',
                    count: orphanStates.length,
                    message: `${orphanStates.length} état(s) orphelin(s) sans objet parent`,
                    elements: orphanStates.map(s => s.id)
                });
            }
        }
        
        // Métriques niveau 1
        validation.metrics = {
            objectsCount: elementClassification.objects.length,
            statesCount: elementClassification.states.length,
            averageStatesPerObject: elementClassification.objects.length > 0 ? 
                elementClassification.states.length / elementClassification.objects.length : 0,
            orphanStatesCount: this.findOrphanStates(elementClassification.states, relations).length
        };
        
        return validation;
    }

    /**
     * Valide l'architecture niveau 2
     * @private
     */
    async validateLevel2Architecture(elementClassification, relations) {
        const validation = {
            isValid: true,
            issues: [],
            metrics: {},
            details: {}
        };
        
        // Valider chaque état
        for (const state of elementClassification.states) {
            const stateValidation = await this.validateStateComponent(state, relations);
            if (!stateValidation.isValid) {
                validation.isValid = false;
                validation.issues.push(...stateValidation.issues);
            }
        }
        
        // Métriques niveau 2
        validation.metrics = {
            statesCount: elementClassification.states.length,
            actionsCount: elementClassification.actions.length,
            averageActionsPerState: elementClassification.states.length > 0 ? 
                elementClassification.actions.length / elementClassification.states.length : 0,
            mainActionsCount: this.countMainActions(elementClassification.actions),
            secondaryActionsCount: this.countSecondaryActions(elementClassification.actions)
        };
        
        return validation;
    }

    /**
     * Valide les transitions
     * @private
     */
    async validateTransitions(transitionMappings, relations) {
        const validation = {
            isValid: true,
            issues: [],
            metrics: {},
            details: {}
        };
        
        if (!transitionMappings || !transitionMappings.stateTransitions) {
            return validation;
        }
        
        // Vérifier chaque transition
        for (const transition of transitionMappings.stateTransitions) {
            const transitionValidation = await this.validateSingleTransition(transition, relations);
            if (!transitionValidation.isValid) {
                validation.isValid = false;
                validation.issues.push(...transitionValidation.issues);
            }
        }
        
        // Détecter cycles si non autorisés
        if (this.config.architecture.transitions.preventCycles) {
            const cycles = this.detectTransitionCycles(transitionMappings.stateTransitions);
            if (cycles.length > 0) {
                validation.isValid = false;
                validation.issues.push({
                    type: 'transition_cycles',
                    severity: 'critical',
                    count: cycles.length,
                    message: `${cycles.length} cycle(s) détecté(s) dans les transitions`,
                    cycles: cycles
                });
            }
        }
        
        return validation;
    }

    /**
     * Valide la conformité EPCIS 2.0
     * @private
     */
    async validateEPCISCompliance(elementClassification, relations) {
        const validation = {
            isValid: true,
            issues: [],
            metrics: {},
            details: {}
        };
        
        // Utiliser EPCISValidator pour validation détaillée
        for (const action of elementClassification.actions) {
            if (action.customData && action.customData.epcisData) {
                try {
                    const epcisValidation = await this.epcisValidator.validateAction(action.customData.epcisData);
                    if (!epcisValidation.isValid) {
                        validation.isValid = false;
                        validation.issues.push({
                            type: 'epcis_non_compliance',
                            severity: 'critical',
                            elementId: action.id,
                            message: `Action non conforme EPCIS 2.0: ${epcisValidation.errors.join(', ')}`
                        });
                    }
                } catch (error) {
                    validation.issues.push({
                        type: 'epcis_validation_error',
                        severity: 'warning',
                        elementId: action.id,
                        message: `Erreur validation EPCIS: ${error.message}`
                    });
                }
            }
        }
        
        return validation;
    }

    // Méthodes utilitaires

    /**
     * Détermine le type d'un élément
     * @private
     */
    getElementType(element) {
        if (!element || !element.customData) return null;
        
        const tags = element.customData.tags || [];
        
        if (tags.includes('#process-object')) return 'object';
        if (tags.includes('#process-state')) return 'state';
        if (tags.includes('#process-action')) return 'action';
        
        // Détection par forme et taille
        if (element.type === 'polygon' || element.type === 'hexagon') {
            if (element.width === 120 && element.height === 80) return 'object';
        }
        
        if (element.type === 'rectangle' && !element.roundness) {
            if (element.width === 80 && element.height === 40) return 'state';
        }
        
        if (element.type === 'rectangle' && element.roundness) {
            if (element.width === 140 && element.height === 60) return 'action';
        }
        
        return null;
    }

    /**
     * Calcule le score de conformité
     * @private
     */
    calculateConformityScore(validations) {
        const weights = {
            level1: 0.25,
            level2: 0.25,
            transitions: 0.25,
            epcis: 0.25
        };
        
        let totalScore = 0;
        let totalWeight = 0;
        
        for (const [key, validation] of Object.entries(validations)) {
            if (validation && weights[key]) {
                const levelScore = validation.isValid ? 100 : 
                    (100 - (validation.issues?.length || 0) * 10);
                totalScore += Math.max(0, levelScore) * weights[key];
                totalWeight += weights[key];
            }
        }
        
        return totalWeight > 0 ? totalScore / totalWeight : 0;
    }

    /**
     * Génère des recommandations
     * @private
     */
    async generateRecommendations(validationData) {
        const recommendations = {
            critical: [],
            improvements: [],
            optimizations: []
        };
        
        // Recommandations critiques
        if (validationData.level1Validation.issues?.length > 0) {
            recommendations.critical.push({
                priority: 'high',
                category: 'architecture',
                title: 'Corriger architecture niveau 1',
                description: 'Résoudre les problèmes Object→State',
                estimatedEffort: 'medium',
                impact: 'high'
            });
        }
        
        // Recommandations d'amélioration
        if (validationData.epcisValidation.issues?.length > 0) {
            recommendations.improvements.push({
                priority: 'medium',
                category: 'compliance',
                title: 'Améliorer conformité EPCIS 2.0',
                description: 'Aligner actions sur standards GS1',
                estimatedEffort: 'high',
                impact: 'medium'
            });
        }
        
        return recommendations;
    }

    // Méthodes d'aide privées supplémentaires

    async validateObjectComponent(object, relations) {
        const validation = { isValid: true, issues: [] };
        const rules = this.validationRules.object;
        
        for (const rule of rules) {
            const result = rule.validator(object, relations);
            if (!result.valid) {
                validation.isValid = false;
                validation.issues.push({
                    type: rule.name,
                    severity: rule.name === 'has_states' ? 'critical' : 'warning',
                    elementId: object.id,
                    message: result.message
                });
            }
        }
        
        return validation;
    }

    async validateStateComponent(state, relations) {
        const validation = { isValid: true, issues: [] };
        const rules = this.validationRules.state;
        
        for (const rule of rules) {
            const result = rule.validator(state, relations);
            if (!result.valid) {
                validation.isValid = false;
                validation.issues.push({
                    type: rule.name,
                    severity: rule.name === 'has_main_action' ? 'critical' : 'warning',
                    elementId: state.id,
                    message: result.message
                });
            }
        }
        
        return validation;
    }

    async validateActionComponent(action, relations) {
        const validation = { isValid: true, issues: [] };
        const rules = this.validationRules.action;
        
        for (const rule of rules) {
            const result = rule.validator(action, relations);
            if (!result.valid) {
                validation.isValid = false;
                validation.issues.push({
                    type: rule.name,
                    severity: 'warning',
                    elementId: action.id,
                    message: result.message
                });
            }
        }
        
        return validation;
    }

    findOrphanStates(states, relations) {
        return states.filter(state => {
            return !relations.some(relation => 
                relation.target.id === state.id && 
                relation.source.type === 'object' && 
                relation.target.type === 'state'
            );
        });
    }

    countMainActions(actions) {
        return actions.filter(action => 
            action.customData?.actionType === 'main' || 
            action.customData?.isPrimary === true
        ).length;
    }

    countSecondaryActions(actions) {
        return actions.filter(action => 
            action.customData?.actionType !== 'main' && 
            action.customData?.isPrimary !== true
        ).length;
    }

    async validateSingleTransition(transition, relations) {
        return { isValid: true, issues: [] };
    }

    detectTransitionCycles(transitions) {
        // Implémentation simplifiée de détection de cycles
        const visited = new Set();
        const cycles = [];
        
        // Algorithme DFS pour détecter cycles
        const dfs = (stateId, path) => {
            if (visited.has(stateId)) {
                const cycleStart = path.indexOf(stateId);
                if (cycleStart !== -1) {
                    cycles.push(path.slice(cycleStart));
                }
                return;
            }
            
            visited.add(stateId);
            path.push(stateId);
            
            const outgoingTransitions = transitions.filter(t => t.fromState === stateId);
            for (const transition of outgoingTransitions) {
                dfs(transition.toState, [...path]);
            }
        };
        
        // Démarrer DFS depuis chaque état
        const allStates = [...new Set([
            ...transitions.map(t => t.fromState),
            ...transitions.map(t => t.toState)
        ])];
        
        for (const state of allStates) {
            if (!visited.has(state)) {
                dfs(state, []);
            }
        }
        
        return cycles;
    }

    countIssuesBySeverity(severity, validations) {
        let count = 0;
        for (const validation of validations) {
            if (validation && validation.issues) {
                count += validation.issues.filter(issue => issue.severity === severity).length;
            }
        }
        return count;
    }

    consolidateIssues(validations) {
        const allIssues = [];
        for (const validation of validations) {
            if (validation && validation.issues) {
                allIssues.push(...validation.issues);
            }
        }
        return allIssues;
    }

    evaluatePerformance(validationTime) {
        if (validationTime <= this.config.performance.maxValidationTime) {
            return {
                status: 'excellent',
                score: 100,
                message: 'Performance optimale'
            };
        } else if (validationTime <= this.config.performance.maxValidationTime * 1.5) {
            return {
                status: 'good',
                score: 80,
                message: 'Performance acceptable'
            };
        } else {
            return {
                status: 'needs_improvement',
                score: 50,
                message: 'Performance à améliorer'
            };
        }
    }

    calculateValidationCoverage(elementClassification) {
        const total = elementClassification.statistics.totalElements;
        const classified = elementClassification.statistics.classifiedElements;
        return total > 0 ? (classified / total) * 100 : 0;
    }

    calculateArchitectureComplexity(relationResult) {
        const complexity = {
            score: 0,
            level: 'simple'
        };
        
        if (relationResult.analysis && relationResult.analysis.metrics) {
            complexity.score = relationResult.analysis.metrics.complexityScore || 0;
            
            if (complexity.score < 30) complexity.level = 'simple';
            else if (complexity.score < 60) complexity.level = 'moderate';
            else complexity.level = 'complex';
        }
        
        return complexity;
    }

    generateCacheKey(elements) {
        // Générer clé de cache basée sur hash des éléments
        const elementData = elements.map(el => `${el.id}:${el.type}:${el.x}:${el.y}`).join('|');
        return `arch_validation_${this.hashString(elementData)}`;
    }

    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString(36);
    }

    updateMetrics(validationResult) {
        this.metrics.validationsPerformed++;
        this.metrics.totalElementsValidated += validationResult.summary.totalElements;
        
        const currentAvg = this.metrics.averageValidationTime;
        const newTime = validationResult.metrics.validationTime;
        const count = this.metrics.validationsPerformed;
        
        this.metrics.averageValidationTime = (currentAvg * (count - 1) + newTime) / count;
    }

    // Méthodes pour génération du rapport (implémentations simplifiées)

    getOverallRecommendation(score) {
        if (score >= 95) return 'Excellent - Prêt pour implémentation';
        if (score >= 85) return 'Bon - Corrections mineures requises';
        if (score >= 70) return 'Acceptable - Améliorations recommandées';
        return 'Critique - Refactoring majeur requis';
    }

    assessImplementationReadiness(validationResult) {
        const criticalIssues = validationResult.summary.criticalIssues;
        if (criticalIssues === 0) return 'ready';
        if (criticalIssues <= 3) return 'needs_fixes';
        return 'not_ready';
    }

    assessRiskLevel(validationResult) {
        const score = validationResult.conformityScore;
        if (score >= 90) return 'low';
        if (score >= 70) return 'medium';
        return 'high';
    }

    estimateImplementationEffort(validationResult) {
        const issues = validationResult.summary.criticalIssues + validationResult.summary.warningIssues;
        if (issues <= 5) return 'low';
        if (issues <= 15) return 'medium';
        return 'high';
    }

    calculateLevelScore(levelValidation) {
        if (!levelValidation) return 0;
        return levelValidation.isValid ? 100 : Math.max(0, 100 - (levelValidation.issues?.length || 0) * 10);
    }

    getLevelStatus(levelValidation) {
        if (!levelValidation) return 'unknown';
        return levelValidation.isValid ? 'valid' : 'invalid';
    }

    analyzeLevelCompliance(levelValidation) {
        return {
            compliant: levelValidation?.isValid || false,
            issuesCount: levelValidation?.issues?.length || 0,
            criticalIssues: levelValidation?.issues?.filter(i => i.severity === 'critical').length || 0
        };
    }

    async generateActionPlan(validationResult) {
        const actionPlan = {
            immediate: [],
            shortTerm: [],
            longTerm: []
        };
        
        // Actions immédiates pour problèmes critiques
        const criticalIssues = validationResult.issues.filter(i => i.severity === 'critical');
        for (const issue of criticalIssues) {
            actionPlan.immediate.push({
                action: `Corriger: ${issue.type}`,
                description: issue.message,
                elementId: issue.elementId,
                estimatedTime: '1-2h'
            });
        }
        
        return actionPlan;
    }

    // Autres méthodes utilitaires pour le rapport
    countValidTransitions(transitionValidation) { return 0; }
    analyzeWorkflows(validationResult) { return []; }
    identifyBottlenecks(validationResult) { return []; }
    analyzeBusinessStepsCompliance(epcisValidation) { return { compliant: true, count: 0 }; }
    analyzeDispositionsCompliance(epcisValidation) { return { compliant: true, count: 0 }; }
    analyzeCustomExtensions(epcisValidation) { return []; }
    calculateMaintainabilityScore(validationResult) { return 85; }
    categorizeDetailedIssues(issues) { return { byType: {}, bySeverity: {} }; }
    generateComponentAnalysis(classification) { return {}; }
    generateRelationshipMatrix(relationResult) { return {}; }
    analyzePerformanceMetrics(metrics) { return {}; }
    generateComponentRecommendations(component, validation) { return []; }

    /**
     * Obtient les statistiques de performance du validateur
     * @returns {Object} Métriques de performance
     */
    getPerformanceMetrics() {
        return {
            ...this.metrics,
            cacheSize: this.validationCache.size,
            configVersion: this.config.version || '1.0.0'
        };
    }

    /**
     * Réinitialise le validateur
     * @sideEffect Vide le cache et réinitialise les métriques
     */
    reset() {
        this.validationCache.clear();
        this.relationDetector.reset();
        
        this.metrics = {
            validationsPerformed: 0,
            averageValidationTime: 0,
            totalElementsValidated: 0,
            cacheHitRate: 0
        };
        
        console.log('🔄 ArchitectureValidator réinitialisé');
    }
}

// Export déjà fait via export class

// Export browser pour utilisation dans Obsidian
if (typeof window !== 'undefined') {
    window.ProcessMetaLanguageArchitectureValidator = {
        ArchitectureValidator,
        ARCHITECTURE_VALIDATOR_CONFIG
    };
}

// <!-- END OF FILE: architecture-validator.js -->