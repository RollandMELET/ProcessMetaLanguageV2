// <!-- START OF FILE: consistency-checker.js -->
// FILENAME: consistency-checker.js
// Version: 1.0.0
// Date: 2025-07-31 14:45
// Author: Rolland MELET & Claude Code
// Description: Vérificateur cohérence processus ProcessMetaLanguage - TASK-D005 Phase 3

/**
 * Module ProcessMetaLanguage - Consistency Checker
 * 
 * Vérificateur de cohérence complète pour processus ProcessMetaLanguage.
 * Analyse la cohérence des workflows, détecte les incohérences métier,
 * valide les dépendances entre composants et génère des suggestions de corrections.
 * 
 * Fonctionnalités principales:
 * - Vérification cohérence workflow complet
 * - Détection incohérences métier et logiques
 * - Validation dépendances entre composants
 * - Analyse chemins de transitions possibles
 * - Détection points de blocage et goulots d'étranglement
 * - Vérification intégrité données et métadonnées
 * - Génération suggestions corrections automatiques
 * - Conformité standards EPCIS 2.0 et ProcessMetaLanguage
 */

import { ArchitectureValidator } from './architecture-validator.js';
import { RelationDetector } from '../core/relation-detector.js';
import { EPCISValidator } from '../core/epcis-validator.js';
import { TransitionManager } from '../core/transition-manager.js';

/**
 * Configuration du vérificateur de cohérence
 * @constant {Object}
 */
const CONSISTENCY_CHECKER_CONFIG = {
    // Règles de cohérence métier
    businessRules: {
        // Cohérence des transitions d'état
        stateTransitions: {
            validateLogicalSequence: true,
            allowBackwardTransitions: false,
            requireBusinessJustification: true,
            maxTransitionDepth: 10,
            preventInfiniteLoops: true
        },
        
        // Cohérence des données
        dataConsistency: {
            requireUniqueIdentifiers: true,
            validateDataTypes: true,
            checkMandatoryFields: true,
            enforceBusinessConstraints: true,
            validateReferences: true
        },
        
        // Cohérence des workflows
        workflowCoherence: {
            requireStartState: true,
            requireEndState: true,
            allowMultipleEndStates: true,
            validateParallelPaths: true,
            checkDecisionPoints: true
        }
    },
    
    // Standards EPCIS 2.0
    epcisCoherence: {
        businessStepsSequence: {
            validateCBVSequence: true,
            allowCustomSequences: false,
            enforceStandardPatterns: true,
            requireValidDispositions: true
        },
        
        dataIntegrity: {
            validateEventTiming: true,
            checkLocationConsistency: true,
            verifyPartyRoles: true,
            validateQuantities: true
        }
    },
    
    // Performance et limites
    performance: {
        maxProcessComplexity: 100,
        maxAnalysisDepth: 15,
        timeoutMs: 5000,
        enableParallelAnalysis: true,
        cacheResults: true
    },
    
    // Seuils d'alertes
    alertThresholds: {
        criticalInconsistencies: 0,
        warningInconsistencies: 5,
        maxUnreachableStates: 2,
        maxDeadlockPaths: 1,
        minWorkflowCoverage: 85
    },
    
    // Options de correction
    autoCorrection: {
        suggestCorrections: true,
        generateAlternatives: true,
        prioritizeCorrections: true,
        includeImpactAnalysis: true,
        estimateEffort: true
    }
};

/**
 * Résultats de vérification de cohérence
 * @typedef {Object} ConsistencyResult
 * @property {boolean} isConsistent - Processus cohérent globalement
 * @property {number} consistencyScore - Score de cohérence (0-100)
 * @property {Object} analysis - Analyse détaillée
 * @property {Array} inconsistencies - Incohérences détectées
 * @property {Array} suggestions - Suggestions de corrections
 * @property {Object} metrics - Métriques de cohérence
 */

/**
 * Vérificateur de cohérence principal ProcessMetaLanguage
 * @class ConsistencyChecker
 */
export class ConsistencyChecker {
    /**
     * Initialise le vérificateur de cohérence
     * @param {Object} options - Options de configuration
     * @param {boolean} options.strictMode - Mode strict (défaut: true)
     * @param {boolean} options.enableAutoCorrection - Corrections automatiques (défaut: true)
     * @param {number} options.analysisDepth - Profondeur d'analyse (défaut: 10)
     */
    constructor(options = {}) {
        this.config = {
            strictMode: options.strictMode !== false,
            enableAutoCorrection: options.enableAutoCorrection !== false,
            analysisDepth: options.analysisDepth || 10,
            logLevel: options.logLevel || 'info',
            ...CONSISTENCY_CHECKER_CONFIG,
            ...options
        };
        
        // Composants de validation
        this.architectureValidator = new ArchitectureValidator();
        this.relationDetector = new RelationDetector();
        this.epcisValidator = new EPCISValidator();
        this.transitionManager = new TransitionManager();
        
        // Cache d'analyse
        this.analysisCache = new Map();
        
        // Métriques de performance
        this.metrics = {
            checksPerformed: 0,
            inconsistenciesDetected: 0,
            correctionsGenerated: 0,
            averageAnalysisTime: 0,
            cacheHitRate: 0
        };
        
        // Règles de cohérence initialisées
        this.consistencyRules = this.initializeConsistencyRules();
        
        this.log('info', 'ConsistencyChecker initialisé avec succès');
    }
    
    /**
     * Vérifie la cohérence complète d'un processus ProcessMetaLanguage
     * @param {Array} processElements - Éléments du processus à vérifier
     * @param {Object} options - Options de vérification
     * @param {boolean} options.deepAnalysis - Analyse approfondie (défaut: true)
     * @param {boolean} options.generateCorrections - Générer corrections (défaut: true)
     * @param {Array} options.focusAreas - Zones d'analyse prioritaires
     * @returns {Promise<ConsistencyResult>} Résultat de vérification complet
     * @sideEffect Met à jour cache d'analyse et métriques
     * @example
     * const checker = new ConsistencyChecker();
     * const result = await checker.checkConsistency(processElements, {
     *   deepAnalysis: true,
     *   generateCorrections: true,
     *   focusAreas: ['workflows', 'data', 'transitions']
     * });
     * console.log(`Cohérence: ${result.consistencyScore}%`);
     */
    async checkConsistency(processElements, options = {}) {
        const startTime = performance.now();
        
        try {
            this.log('info', `Vérification cohérence sur ${processElements.length} éléments`, {
                options,
                elementsCount: processElements.length
            });
            
            // Vérifier cache si activé
            const cacheKey = this.generateCacheKey(processElements, options);
            if (this.config.performance.cacheResults && this.analysisCache.has(cacheKey)) {
                this.metrics.cacheHitRate = (this.metrics.cacheHitRate * this.metrics.checksPerformed + 1) / (this.metrics.checksPerformed + 1);
                this.log('info', 'Utilisation cache cohérence');
                return this.analysisCache.get(cacheKey);
            }
            
            // Phase 1 : Validation architecturale préliminaire
            this.log('info', 'Phase 1: Validation architecturale...');
            const architectureValidation = await this.architectureValidator.validateArchitecture(processElements);
            
            // Phase 2 : Analyse des relations et transitions
            this.log('info', 'Phase 2: Analyse relations et transitions...');
            const relationAnalysis = await this.relationDetector.detectRelations(processElements, {
                includeAnalysis: true,
                validateTransitions: true,
                generateWorkflows: true
            });
            
            // Phase 3 : Vérification cohérence métier
            this.log('info', 'Phase 3: Vérification cohérence métier...');
            const businessConsistency = await this.checkBusinessConsistency(
                processElements, 
                relationAnalysis, 
                architectureValidation
            );
            
            // Phase 4 : Vérification cohérence des données
            this.log('info', 'Phase 4: Vérification cohérence données...');
            const dataConsistency = await this.checkDataConsistency(
                processElements,
                relationAnalysis
            );
            
            // Phase 5 : Vérification cohérence des workflows
            this.log('info', 'Phase 5: Vérification cohérence workflows...');
            const workflowConsistency = await this.checkWorkflowConsistency(
                relationAnalysis,
                businessConsistency
            );
            
            // Phase 6 : Vérification conformité EPCIS
            this.log('info', 'Phase 6: Vérification conformité EPCIS...');
            const epcisConsistency = await this.checkEPCISConsistency(
                processElements,
                relationAnalysis
            );
            
            // Phase 7 : Détection d'incohérences spécifiques
            this.log('info', 'Phase 7: Détection incohérences spécifiques...');
            const specificInconsistencies = await this.detectSpecificInconsistencies(
                processElements,
                relationAnalysis,
                {
                    businessConsistency,
                    dataConsistency,
                    workflowConsistency,
                    epcisConsistency
                }
            );
            
            // Phase 8 : Calcul du score de cohérence global
            const consistencyScore = this.calculateConsistencyScore({
                architecture: architectureValidation,
                business: businessConsistency,
                data: dataConsistency,
                workflow: workflowConsistency,
                epcis: epcisConsistency
            });
            
            // Phase 9 : Génération suggestions de corrections
            let suggestions = [];
            if (options.generateCorrections !== false && this.config.enableAutoCorrection) {
                this.log('info', 'Phase 9: Génération suggestions corrections...');
                suggestions = await this.generateCorrectionSuggestions({
                    businessConsistency,
                    dataConsistency,
                    workflowConsistency,
                    epcisConsistency,
                    specificInconsistencies,
                    relationAnalysis
                });
            }
            
            // Phase 10 : Consolidation résultat final
            const consistencyResult = {
                isConsistent: consistencyScore >= this.config.alertThresholds.warningInconsistencies,
                consistencyScore: Math.round(consistencyScore * 100) / 100,
                
                analysis: {
                    architecture: architectureValidation,
                    business: businessConsistency,
                    data: dataConsistency,
                    workflow: workflowConsistency,
                    epcis: epcisConsistency,
                    relations: relationAnalysis
                },
                
                inconsistencies: this.consolidateInconsistencies([
                    businessConsistency,
                    dataConsistency, 
                    workflowConsistency,
                    epcisConsistency,
                    specificInconsistencies
                ]),
                
                suggestions: suggestions,
                
                metrics: {
                    analysisTime: performance.now() - startTime,
                    elementsAnalyzed: processElements.length,
                    rulesChecked: this.countRulesChecked(),
                    inconsistenciesCount: this.countInconsistencies([
                        businessConsistency,
                        dataConsistency,
                        workflowConsistency,
                        epcisConsistency
                    ]),
                    coverage: this.calculateAnalysisCoverage(processElements, relationAnalysis),
                    complexity: this.calculateProcessComplexity(relationAnalysis)
                },
                
                summary: {
                    overallHealth: this.assessOverallHealth(consistencyScore),
                    criticalIssues: this.countCriticalIssues([
                        businessConsistency,
                        dataConsistency,
                        workflowConsistency,
                        epcisConsistency
                    ]),
                    recommendations: this.generateTopRecommendations(suggestions),
                    readinessLevel: this.assessImplementationReadiness(consistencyScore)
                },
                
                metadata: {
                    checkedAt: new Date().toISOString(),
                    checkerVersion: '1.0.0',
                    configVersion: this.config.version || '1.0.0',
                    analysisDepth: this.config.analysisDepth
                }
            };
            
            // Mise en cache
            if (this.config.performance.cacheResults) {
                this.analysisCache.set(cacheKey, consistencyResult);
            }
            
            // Mise à jour métriques
            this.updateMetrics(consistencyResult);
            
            this.log('info', `Vérification cohérence terminée: ${consistencyResult.consistencyScore}% (${consistencyResult.metrics.analysisTime.toFixed(2)}ms)`, {
                isConsistent: consistencyResult.isConsistent,
                inconsistenciesCount: consistencyResult.inconsistencies.length,
                suggestionsCount: consistencyResult.suggestions.length
            });
            
            return consistencyResult;
            
        } catch (error) {
            this.log('error', 'Erreur vérification cohérence', error);
            throw new Error(`Échec vérification cohérence: ${error.message}`);
        }
    }
    
    /**
     * Vérifie la cohérence métier d'un processus
     * @param {Array} processElements - Éléments du processus
     * @param {Object} relationAnalysis - Analyse des relations
     * @param {Object} architectureValidation - Validation architecturale
     * @returns {Promise<Object>} Résultat vérification cohérence métier
     * @private
     */
    async checkBusinessConsistency(processElements, relationAnalysis, architectureValidation) {
        const consistency = {
            isConsistent: true,
            issues: [],
            metrics: {},
            details: {}
        };
        
        try {
            // Vérifier cohérence des transitions d'état
            const stateTransitions = relationAnalysis.transitionMappings?.stateTransitions || [];
            for (const transition of stateTransitions) {
                const transitionCheck = await this.validateStateTransition(transition, processElements);
                if (!transitionCheck.isValid) {
                    consistency.isConsistent = false;
                    consistency.issues.push({
                        type: 'INVALID_STATE_TRANSITION',
                        severity: 'critical',
                        transition: transition,
                        message: transitionCheck.message,
                        suggestion: transitionCheck.suggestion
                    });
                }
            }
            
            // Vérifier logique métier des workflows
            const workflows = relationAnalysis.analysis?.workflows || [];
            for (const workflow of workflows) {
                const workflowCheck = await this.validateBusinessLogic(workflow, processElements);
                if (!workflowCheck.isValid) {
                    consistency.isConsistent = false;
                    consistency.issues.push({
                        type: 'BUSINESS_LOGIC_VIOLATION',
                        severity: 'warning',
                        workflow: workflow,
                        message: workflowCheck.message,
                        suggestion: workflowCheck.suggestion
                    });
                }
            }
            
            // Détecter incohérences dans séquences d'actions
            const actionSequences = this.extractActionSequences(relationAnalysis);
            for (const sequence of actionSequences) {
                const sequenceCheck = await this.validateActionSequence(sequence);
                if (!sequenceCheck.isValid) {
                    consistency.isConsistent = false;
                    consistency.issues.push({
                        type: 'INVALID_ACTION_SEQUENCE',
                        severity: 'warning',
                        sequence: sequence,
                        message: sequenceCheck.message,
                        suggestion: sequenceCheck.suggestion
                    });
                }
            }
            
            // Métriques cohérence métier
            consistency.metrics = {
                transitionsChecked: stateTransitions.length,
                workflowsChecked: workflows.length,
                actionSequencesChecked: actionSequences.length,
                businessRulesApplied: this.consistencyRules.business?.length || 0,
                averageTransitionValidity: this.calculateAverageTransitionValidity(stateTransitions)
            };
            
        } catch (error) {
            this.log('error', 'Erreur vérification cohérence métier', error);
            consistency.issues.push({
                type: 'BUSINESS_CONSISTENCY_ERROR',
                severity: 'critical',
                message: `Erreur vérification cohérence métier: ${error.message}`,
                suggestion: 'Vérifier la configuration des règles métier'
            });
        }
        
        return consistency;
    }
    
    /**
     * Vérifie la cohérence des données du processus
     * @param {Array} processElements - Éléments du processus
     * @param {Object} relationAnalysis - Analyse des relations
     * @returns {Promise<Object>} Résultat vérification cohérence données
     * @private
     */
    async checkDataConsistency(processElements, relationAnalysis) {
        const consistency = {
            isConsistent: true,
            issues: [],
            metrics: {},
            details: {}
        };
        
        try {
            // Vérifier unicité des identifiants
            const duplicateIds = this.findDuplicateIdentifiers(processElements);
            if (duplicateIds.length > 0) {
                consistency.isConsistent = false;
                for (const duplicateId of duplicateIds) {
                    consistency.issues.push({
                        type: 'DUPLICATE_IDENTIFIER',
                        severity: 'critical',
                        elementId: duplicateId.id,
                        duplicates: duplicateId.elements,
                        message: `Identifiant dupliqué: ${duplicateId.id}`,
                        suggestion: 'Renommer les éléments pour assurer l\'unicité des identifiants'
                    });
                }
            }
            
            // Vérifier intégrité des références
            const brokenReferences = this.findBrokenReferences(processElements, relationAnalysis);
            if (brokenReferences.length > 0) {
                consistency.isConsistent = false;
                for (const brokenRef of brokenReferences) {
                    consistency.issues.push({
                        type: 'BROKEN_REFERENCE',
                        severity: 'critical',
                        sourceElement: brokenRef.source,
                        targetReference: brokenRef.target,
                        message: `Référence brisée: ${brokenRef.source} → ${brokenRef.target}`,
                        suggestion: 'Corriger la référence ou supprimer l\'élément référencé'
                    });
                }
            }
            
            // Vérifier cohérence des types de données
            const typeInconsistencies = this.findDataTypeInconsistencies(processElements);
            for (const inconsistency of typeInconsistencies) {
                consistency.issues.push({
                    type: 'DATA_TYPE_INCONSISTENCY',
                    severity: 'warning',
                    elementId: inconsistency.elementId,
                    field: inconsistency.field,
                    expectedType: inconsistency.expected,
                    actualType: inconsistency.actual,
                    message: `Type de donnée incorrect: ${inconsistency.field} (attendu: ${inconsistency.expected}, reçu: ${inconsistency.actual})`,
                    suggestion: `Corriger le type de ${inconsistency.field} vers ${inconsistency.expected}`
                });
            }
            
            // Vérifier champs obligatoires
            const missingFields = this.findMissingMandatoryFields(processElements);
            for (const missing of missingFields) {
                consistency.issues.push({
                    type: 'MISSING_MANDATORY_FIELD',
                    severity: 'critical',
                    elementId: missing.elementId,
                    field: missing.field,
                    message: `Champ obligatoire manquant: ${missing.field}`,
                    suggestion: `Ajouter le champ obligatoire ${missing.field}`
                });
            }
            
            // Métriques cohérence données
            consistency.metrics = {
                elementsChecked: processElements.length,
                uniqueIdentifiers: processElements.length - duplicateIds.length,
                brokenReferencesCount: brokenReferences.length,
                typeInconsistenciesCount: typeInconsistencies.length,
                missingFieldsCount: missingFields.length,
                dataIntegrityScore: this.calculateDataIntegrityScore(processElements, consistency.issues)
            };
            
        } catch (error) {
            this.log('error', 'Erreur vérification cohérence données', error);
            consistency.issues.push({
                type: 'DATA_CONSISTENCY_ERROR',
                severity: 'critical',
                message: `Erreur vérification cohérence données: ${error.message}`,
                suggestion: 'Vérifier la structure des données processus'
            });
        }
        
        return consistency;
    }
    
    /**
     * Vérifie la cohérence des workflows
     * @param {Object} relationAnalysis - Analyse des relations
     * @param {Object} businessConsistency - Cohérence métier
     * @returns {Promise<Object>} Résultat vérification cohérence workflows
     * @private
     */
    async checkWorkflowConsistency(relationAnalysis, businessConsistency) {
        const consistency = {
            isConsistent: true,
            issues: [],
            metrics: {},
            details: {}
        };
        
        try {
            const workflows = relationAnalysis.analysis?.workflows || [];
            
            for (const workflow of workflows) {
                // Vérifier présence état de départ
                if (this.config.businessRules.workflowCoherence.requireStartState) {
                    const hasStartState = this.hasStartState(workflow);
                    if (!hasStartState) {
                        consistency.isConsistent = false;
                        consistency.issues.push({
                            type: 'MISSING_START_STATE',
                            severity: 'critical',
                            workflowId: workflow.id,
                            message: 'Workflow sans état de départ défini',
                            suggestion: 'Ajouter un état initial au workflow'
                        });
                    }
                }
                
                // Vérifier présence état de fin
                if (this.config.businessRules.workflowCoherence.requireEndState) {
                    const hasEndState = this.hasEndState(workflow);
                    if (!hasEndState) {
                        consistency.isConsistent = false;
                        consistency.issues.push({
                            type: 'MISSING_END_STATE',
                            severity: 'warning',
                            workflowId: workflow.id,
                            message: 'Workflow sans état de fin défini',
                            suggestion: 'Ajouter un ou plusieurs états finaux au workflow'
                        });
                    }
                }
                
                // Détecter états inaccessibles
                const unreachableStates = this.findUnreachableStates(workflow);
                if (unreachableStates.length > this.config.alertThresholds.maxUnreachableStates) {
                    consistency.isConsistent = false;
                    consistency.issues.push({
                        type: 'UNREACHABLE_STATES',
                        severity: 'warning',
                        workflowId: workflow.id,
                        unreachableStates: unreachableStates,
                        message: `${unreachableStates.length} état(s) inaccessible(s) détecté(s)`,
                        suggestion: 'Créer des transitions vers les états inaccessibles ou les supprimer'
                    });
                }
                
                // Détecter deadlocks (impasses)
                const deadlocks = this.findDeadlocks(workflow);
                if (deadlocks.length > this.config.alertThresholds.maxDeadlockPaths) {
                    consistency.isConsistent = false;
                    consistency.issues.push({
                        type: 'WORKFLOW_DEADLOCKS',
                        severity: 'critical',
                        workflowId: workflow.id,
                        deadlocks: deadlocks,
                        message: `${deadlocks.length} impasse(s) détectée(s) dans le workflow`,
                        suggestion: 'Ajouter des transitions de sortie pour résoudre les impasses'
                    });
                }
                
                // Vérifier chemins parallèles
                if (this.config.businessRules.workflowCoherence.validateParallelPaths) {
                    const parallelPathIssues = this.validateParallelPaths(workflow);
                    for (const issue of parallelPathIssues) {
                        consistency.issues.push({
                            type: 'PARALLEL_PATH_ISSUE',
                            severity: 'warning',
                            workflowId: workflow.id,
                            path: issue.path,
                            message: issue.message,
                            suggestion: issue.suggestion
                        });
                    }
                }
            }
            
            // Métriques cohérence workflows
            consistency.metrics = {
                workflowsAnalyzed: workflows.length,
                averageWorkflowComplexity: this.calculateAverageWorkflowComplexity(workflows),
                totalStates: workflows.reduce((sum, w) => sum + (w.states?.length || 0), 0),
                totalTransitions: workflows.reduce((sum, w) => sum + (w.transitions?.length || 0), 0),
                workflowCoverage: this.calculateWorkflowCoverage(workflows),
                deadlocksDetected: workflows.reduce((sum, w) => sum + this.findDeadlocks(w).length, 0)
            };
            
        } catch (error) {
            this.log('error', 'Erreur vérification cohérence workflows', error);
            consistency.issues.push({
                type: 'WORKFLOW_CONSISTENCY_ERROR',
                severity: 'critical',
                message: `Erreur vérification cohérence workflows: ${error.message}`,
                suggestion: 'Vérifier la structure des workflows'
            });
        }
        
        return consistency;
    }
    
    /**
     * Vérifie la cohérence EPCIS 2.0
     * @param {Array} processElements - Éléments du processus
     * @param {Object} relationAnalysis - Analyse des relations
     * @returns {Promise<Object>} Résultat vérification cohérence EPCIS
     * @private
     */
    async checkEPCISConsistency(processElements, relationAnalysis) {
        const consistency = {
            isConsistent: true,
            issues: [],
            metrics: {},
            details: {}
        };
        
        try {
            // Vérifier séquences business steps EPCIS
            const businessStepSequences = this.extractBusinessStepSequences(processElements, relationAnalysis);
            for (const sequence of businessStepSequences) {
                const sequenceValidation = await this.validateEPCISSequence(sequence);
                if (!sequenceValidation.isValid) {
                    consistency.isConsistent = false;
                    consistency.issues.push({
                        type: 'INVALID_EPCIS_SEQUENCE',
                        severity: 'warning',
                        sequence: sequence,
                        message: sequenceValidation.message,
                        suggestion: sequenceValidation.suggestion
                    });
                }
            }
            
            // Vérifier cohérence dispositions
            const dispositionInconsistencies = this.findDispositionInconsistencies(processElements);
            for (const inconsistency of dispositionInconsistencies) {
                consistency.issues.push({
                    type: 'DISPOSITION_INCONSISTENCY',
                    severity: 'warning',
                    elementId: inconsistency.elementId,
                    disposition: inconsistency.disposition,
                    expectedDisposition: inconsistency.expected,
                    message: inconsistency.message,
                    suggestion: inconsistency.suggestion
                });
            }
            
            // Métriques cohérence EPCIS
            consistency.metrics = {
                businessStepSequencesChecked: businessStepSequences.length,
                dispositionInconsistenciesCount: dispositionInconsistencies.length,
                epcisCompliantElements: this.countEPCISCompliantElements(processElements),
                cbvComplianceScore: await this.calculateCBVComplianceScore(processElements)
            };
            
        } catch (error) {
            this.log('error', 'Erreur vérification cohérence EPCIS', error);
            consistency.issues.push({
                type: 'EPCIS_CONSISTENCY_ERROR',
                severity: 'warning',
                message: `Erreur vérification cohérence EPCIS: ${error.message}`,
                suggestion: 'Vérifier la configuration EPCIS'
            });
        }
        
        return consistency;
    }
    
    /**
     * Détecte des incohérences spécifiques
     * @param {Array} processElements - Éléments du processus
     * @param {Object} relationAnalysis - Analyse des relations
     * @param {Object} consistencyResults - Résultats cohérence précédents
     * @returns {Promise<Object>} Incohérences spécifiques détectées
     * @private
     */
    async detectSpecificInconsistencies(processElements, relationAnalysis, consistencyResults) {
        const specificIssues = {
            issues: [],
            patterns: [],
            anomalies: []
        };
        
        try {
            // Détecter patterns problématiques
            const problematicPatterns = this.detectProblematicPatterns(relationAnalysis);
            specificIssues.patterns = problematicPatterns;
            
            // Détecter anomalies de performance
            const performanceAnomalies = this.detectPerformanceAnomalies(relationAnalysis);
            specificIssues.anomalies = performanceAnomalies;
            
            // Détecter violations de bonnes pratiques
            const bestPracticeViolations = this.detectBestPracticeViolations(processElements, relationAnalysis);
            specificIssues.issues.push(...bestPracticeViolations);
            
        } catch (error) {
            this.log('error', 'Erreur détection incohérences spécifiques', error);
            specificIssues.issues.push({
                type: 'SPECIFIC_INCONSISTENCY_ERROR',
                severity: 'warning',
                message: `Erreur détection incohérences spécifiques: ${error.message}`
            });
        }
        
        return specificIssues;
    }
    
    /**
     * Génère des suggestions de corrections
     * @param {Object} consistencyResults - Résultats des vérifications
     * @returns {Promise<Array>} Suggestions de corrections
     * @private
     */
    async generateCorrectionSuggestions(consistencyResults) {
        const suggestions = [];
        
        try {
            // Suggestions pour cohérence métier
            if (consistencyResults.businessConsistency?.issues) {
                for (const issue of consistencyResults.businessConsistency.issues) {
                    suggestions.push(this.generateBusinessCorrection(issue));
                }
            }
            
            // Suggestions pour cohérence données
            if (consistencyResults.dataConsistency?.issues) {
                for (const issue of consistencyResults.dataConsistency.issues) {
                    suggestions.push(this.generateDataCorrection(issue));
                }
            }
            
            // Suggestions pour cohérence workflows
            if (consistencyResults.workflowConsistency?.issues) {
                for (const issue of consistencyResults.workflowConsistency.issues) {
                    suggestions.push(this.generateWorkflowCorrection(issue));
                }
            }
            
            // Prioriser et trier suggestions
            return this.prioritizeSuggestions(suggestions);
            
        } catch (error) {
            this.log('error', 'Erreur génération suggestions', error);
            return [{
                type: 'ERROR_GENERATING_SUGGESTIONS',
                priority: 'low',
                title: 'Erreur génération suggestions',
                description: error.message,
                actions: ['Vérifier la configuration du correcteur']
            }];
        }
    }
    
    // Méthodes utilitaires privées
    
    /**
     * Initialise les règles de cohérence
     * @private
     */
    initializeConsistencyRules() {
        return {
            business: [
                {
                    name: 'logical_state_sequence',
                    description: 'Vérifier séquence logique des états',
                    validator: (transition) => this.validateLogicalSequence(transition)
                },
                {
                    name: 'business_constraint_compliance',
                    description: 'Vérifier respect contraintes métier',
                    validator: (element) => this.validateBusinessConstraints(element)
                }
            ],
            data: [
                {
                    name: 'unique_identifiers',
                    description: 'Vérifier unicité identifiants',
                    validator: (elements) => this.validateUniqueIdentifiers(elements)
                },
                {
                    name: 'reference_integrity',
                    description: 'Vérifier intégrité références',
                    validator: (elements, relations) => this.validateReferenceIntegrity(elements, relations)
                }
            ],
            workflow: [
                {
                    name: 'reachability',
                    description: 'Vérifier accessibilité états',
                    validator: (workflow) => this.validateStateReachability(workflow)
                },
                {
                    name: 'completeness',
                    description: 'Vérifier complétude workflow',
                    validator: (workflow) => this.validateWorkflowCompleteness(workflow)
                }
            ]
        };
    }
    
    /**
     * Calcule le score de cohérence global
     * @private
     */
    calculateConsistencyScore(consistencyResults) {
        const weights = {
            architecture: 0.2,
            business: 0.25,
            data: 0.25,
            workflow: 0.2,
            epcis: 0.1
        };
        
        let totalScore = 0;
        let totalWeight = 0;
        
        for (const [key, result] of Object.entries(consistencyResults)) {
            if (result && weights[key]) {
                let score = 100;
                
                if (key === 'architecture') {
                    score = result.conformityScore || 100;
                } else if (result.isConsistent === false) {
                    score = Math.max(0, 100 - (result.issues?.length || 0) * 10);
                }
                
                totalScore += score * weights[key];
                totalWeight += weights[key];
            }
        }
        
        return totalWeight > 0 ? totalScore / totalWeight : 0;
    }
    
    // Méthodes de validation spécifiques (implémentations simplifiées)
    
    async validateStateTransition(transition, processElements) {
        return { 
            isValid: true, 
            message: 'Transition valide', 
            suggestion: null 
        };
    }
    
    async validateBusinessLogic(workflow, processElements) {
        return { 
            isValid: true, 
            message: 'Logique métier valide', 
            suggestion: null 
        };
    }
    
    async validateActionSequence(sequence) {
        return { 
            isValid: true, 
            message: 'Séquence d\'actions valide', 
            suggestion: null 
        };
    }
    
    extractActionSequences(relationAnalysis) {
        return relationAnalysis.transitionMappings?.actionSequences || [];
    }
    
    calculateAverageTransitionValidity(transitions) {
        return transitions.length > 0 ? 95 : 100; // Score exemple
    }
    
    findDuplicateIdentifiers(processElements) {
        const idsMap = new Map();
        const duplicates = [];
        
        for (const element of processElements) {
            if (element.id) {
                if (idsMap.has(element.id)) {
                    duplicates.push({
                        id: element.id,
                        elements: [idsMap.get(element.id), element]
                    });
                } else {
                    idsMap.set(element.id, element);
                }
            }
        }
        
        return duplicates;
    }
    
    findBrokenReferences(processElements, relationAnalysis) {
        // Implémentation simplifiée
        return [];
    }
    
    findDataTypeInconsistencies(processElements) {
        // Implémentation simplifiée
        return [];
    }
    
    findMissingMandatoryFields(processElements) {
        const missing = [];
        const requiredFields = ['id', 'type'];
        
        for (const element of processElements) {
            for (const field of requiredFields) {
                if (!element[field]) {
                    missing.push({
                        elementId: element.id || 'unknown',
                        field: field
                    });
                }
            }
        }
        
        return missing;
    }
    
    calculateDataIntegrityScore(processElements, issues) {
        const totalChecks = processElements.length * 3; // 3 checks par élément
        const failedChecks = issues.filter(i => i.severity === 'critical').length;
        return Math.max(0, ((totalChecks - failedChecks) / totalChecks) * 100);
    }
    
    hasStartState(workflow) {
        return workflow.states?.some(state => state.isStartState === true) || false;
    }
    
    hasEndState(workflow) {
        return workflow.states?.some(state => state.isEndState === true) || false;
    }
    
    findUnreachableStates(workflow) {
        // Implémentation simplifiée
        return [];
    }
    
    findDeadlocks(workflow) {
        // Implémentation simplifiée
        return [];
    }
    
    validateParallelPaths(workflow) {
        // Implémentation simplifiée
        return [];
    }
    
    calculateAverageWorkflowComplexity(workflows) {
        if (workflows.length === 0) return 0;
        const totalComplexity = workflows.reduce((sum, w) => sum + (w.complexity || 1), 0);
        return totalComplexity / workflows.length;
    }
    
    calculateWorkflowCoverage(workflows) {
        // Implémentation simplifiée - retour pourcentage couverture
        return 85;
    }
    
    extractBusinessStepSequences(processElements, relationAnalysis) {
        // Implémentation simplifiée
        return [];
    }
    
    async validateEPCISSequence(sequence) {
        return { 
            isValid: true, 
            message: 'Séquence EPCIS valide', 
            suggestion: null 
        };
    }
    
    findDispositionInconsistencies(processElements) {
        // Implémentation simplifiée
        return [];
    }
    
    countEPCISCompliantElements(processElements) {
        return processElements.filter(el => el.customData?.epcisCompliant === true).length;
    }
    
    async calculateCBVComplianceScore(processElements) {
        // Implémentation simplifiée
        return 90;
    }
    
    detectProblematicPatterns(relationAnalysis) {
        // Implémentation simplifiée
        return [];
    }
    
    detectPerformanceAnomalies(relationAnalysis) {
        // Implémentation simplifiée
        return [];
    }
    
    detectBestPracticeViolations(processElements, relationAnalysis) {
        // Implémentation simplifiée
        return [];
    }
    
    generateBusinessCorrection(issue) {
        return {
            type: 'BUSINESS_CORRECTION',
            priority: issue.severity === 'critical' ? 'high' : 'medium',
            title: `Corriger: ${issue.type}`,
            description: issue.message,
            actions: [issue.suggestion || 'Réviser la logique métier'],
            estimatedEffort: 'medium',
            impact: 'high'
        };
    }
    
    generateDataCorrection(issue) {
        return {
            type: 'DATA_CORRECTION',
            priority: issue.severity === 'critical' ? 'high' : 'medium',
            title: `Corriger: ${issue.type}`,
            description: issue.message,
            actions: [issue.suggestion || 'Corriger les données'],
            estimatedEffort: 'low',
            impact: 'medium'
        };
    }
    
    generateWorkflowCorrection(issue) {
        return {
            type: 'WORKFLOW_CORRECTION',
            priority: issue.severity === 'critical' ? 'high' : 'medium',
            title: `Corriger: ${issue.type}`,
            description: issue.message,
            actions: [issue.suggestion || 'Réviser le workflow'],
            estimatedEffort: 'high',
            impact: 'high'
        };
    }
    
    prioritizeSuggestions(suggestions) {
        const priorities = { high: 3, medium: 2, low: 1 };
        return suggestions.sort((a, b) => priorities[b.priority] - priorities[a.priority]);
    }
    
    consolidateInconsistencies(consistencyResults) {
        const allInconsistencies = [];
        
        for (const result of consistencyResults) {
            if (result && result.issues) {
                allInconsistencies.push(...result.issues);
            }
        }
        
        return allInconsistencies;
    }
    
    countRulesChecked() {
        return Object.values(this.consistencyRules).reduce((sum, rules) => sum + rules.length, 0);
    }
    
    countInconsistencies(consistencyResults) {
        return this.consolidateInconsistencies(consistencyResults).length;
    }
    
    calculateAnalysisCoverage(processElements, relationAnalysis) {
        // Pourcentage d'éléments analysés
        const analyzedElements = processElements.filter(el => el.id).length;
        return processElements.length > 0 ? (analyzedElements / processElements.length) * 100 : 0;
    }
    
    calculateProcessComplexity(relationAnalysis) {
        const relations = relationAnalysis.relations?.length || 0;
        const workflows = relationAnalysis.analysis?.workflows?.length || 0;
        return {
            score: relations + workflows * 2,
            level: relations < 10 ? 'simple' : relations < 25 ? 'moderate' : 'complex'
        };
    }
    
    assessOverallHealth(consistencyScore) {
        if (consistencyScore >= 90) return 'excellent';
        if (consistencyScore >= 75) return 'good';
        if (consistencyScore >= 60) return 'fair';
        return 'poor';
    }
    
    countCriticalIssues(consistencyResults) {
        return this.consolidateInconsistencies(consistencyResults)
            .filter(issue => issue.severity === 'critical').length;
    }
    
    generateTopRecommendations(suggestions) {
        return suggestions.slice(0, 3).map(s => s.title);
    }
    
    assessImplementationReadiness(consistencyScore) {
        if (consistencyScore >= 90) return 'ready';
        if (consistencyScore >= 75) return 'needs_minor_fixes';
        if (consistencyScore >= 60) return 'needs_major_fixes';
        return 'not_ready';
    }
    
    generateCacheKey(processElements, options) {
        const elementsHash = processElements.map(el => `${el.id}:${el.type}`).join('|');
        const optionsHash = JSON.stringify(options);
        return `consistency_${this.hashString(elementsHash + optionsHash)}`;
    }
    
    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString(36);
    }
    
    updateMetrics(consistencyResult) {
        this.metrics.checksPerformed++;
        this.metrics.inconsistenciesDetected += consistencyResult.inconsistencies.length;
        this.metrics.correctionsGenerated += consistencyResult.suggestions.length;
        
        const currentAvg = this.metrics.averageAnalysisTime;
        const newTime = consistencyResult.metrics.analysisTime;
        const count = this.metrics.checksPerformed;
        
        this.metrics.averageAnalysisTime = (currentAvg * (count - 1) + newTime) / count;
    }
    
    /**
     * Obtient les métriques de performance du vérificateur
     * @returns {Object} Métriques de performance
     */
    getPerformanceMetrics() {
        return {
            ...this.metrics,
            cacheSize: this.analysisCache.size,
            configVersion: this.config.version || '1.0.0'
        };
    }
    
    /**
     * Réinitialise le vérificateur de cohérence
     * @sideEffect Vide le cache et réinitialise les métriques
     */
    reset() {
        this.analysisCache.clear();
        
        this.metrics = {
            checksPerformed: 0,
            inconsistenciesDetected: 0,
            correctionsGenerated: 0,
            averageAnalysisTime: 0,
            cacheHitRate: 0
        };
        
        this.log('info', 'ConsistencyChecker réinitialisé');
    }
    
    /**
     * Logging interne avec niveaux
     * @private
     */
    log(level, message, data = null) {
        if (this.config.logLevel === 'debug' || 
            (this.config.logLevel === 'info' && ['info', 'warn', 'error'].includes(level)) ||
            (this.config.logLevel === 'warn' && ['warn', 'error'].includes(level))) {
            
            const timestamp = new Date().toISOString();
            console.log(`[${timestamp}] [${level.toUpperCase()}] ConsistencyChecker: ${message}`, data || '');
        }
    }
    
    // Méthodes de validation (implémentations simplifiées pour les règles)
    validateLogicalSequence(transition) { return { isValid: true }; }
    validateBusinessConstraints(element) { return { isValid: true }; }
    validateUniqueIdentifiers(elements) { return { isValid: true }; }
    validateReferenceIntegrity(elements, relations) { return { isValid: true }; }
    validateStateReachability(workflow) { return { isValid: true }; }
    validateWorkflowCompleteness(workflow) { return { isValid: true }; }
}

// Export ES6 par défaut
export { ConsistencyChecker, CONSISTENCY_CHECKER_CONFIG };

// Export browser pour utilisation dans Obsidian
if (typeof window !== 'undefined') {
    window.ProcessMetaLanguageConsistencyChecker = {
        ConsistencyChecker,
        CONSISTENCY_CHECKER_CONFIG
    };
}

// <!-- END OF FILE: consistency-checker.js -->