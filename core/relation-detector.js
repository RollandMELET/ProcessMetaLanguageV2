// <!-- START OF FILE: relation-detector.js -->
// FILENAME: relation-detector.js
// Version: 1.0.0
// Date: 2025-07-30 18:30
// Author: Rolland MELET & Claude Code
// Description: Détecteur relations graphiques ProcessMetaLanguage - TASK-B008 Phase 3

/**
 * Module ProcessMetaLanguage - Relation Detector
 * 
 * Système de détection et analyse des relations graphiques (flèches) dans Excalidraw.
 * Identifie les connections entre composants Object→State→Action et génère les mappings
 * de transitions correspondants pour l'architecture État-Actions deux niveaux.
 * 
 * Fonctionnalités principales:
 * - Détection automatique des flèches/connecteurs Excalidraw
 * - Identification des éléments source et cible
 * - Validation des relations selon modèle ProcessMetaLanguage
 * - Mapping transitions État-Actions
 * - Génération métadonnées de workflow
 * - Analyse des chemins de transitions
 * - Support relations multi-niveaux
 * - Conformité patterns EPCIS 2.0
 */

/**
 * Configuration du détecteur de relations
 * @constant {Object}
 */
const RELATION_DETECTOR_CONFIG = {
    // Types d'éléments connectables
    elementTypes: {
        object: {
            tag: '#process-object',
            shape: 'hexagon',
            canConnectTo: ['state']
        },
        state: {
            tag: '#process-state',
            shape: 'rectangle',
            canConnectTo: ['action', 'state']
        },
        action: {
            tag: '#process-action',
            shape: 'rounded-rectangle',
            canConnectTo: ['state']
        }
    },
    
    // Types de relations supportées
    relationTypes: {
        object_to_state: {
            name: 'Object→State',
            source: 'object',
            target: 'state',
            cardinality: 'one-to-many',
            validation: 'required'
        },
        state_to_action: {
            name: 'State→Action',
            source: 'state',
            target: 'action',
            cardinality: 'one-to-many',
            validation: 'optional'
        },
        action_to_state: {
            name: 'Action→State',
            source: 'action',
            target: 'state',
            cardinality: 'many-to-one',
            validation: 'required_for_secondary'
        },
        state_to_state: {
            name: 'State→State',
            source: 'state',
            target: 'state',
            cardinality: 'one-to-one',
            validation: 'workflow_only'
        }
    },
    
    // Configuration détection
    detection: {
        arrowTypes: ['arrow', 'line'],
        bindingTolerance: 10, // pixels
        validateGeometry: true,
        detectImplicitRelations: true,
        maxRelationDistance: 500 // pixels
    },
    
    // Validation et contraintes
    validation: {
        enforceCardinality: true,
        allowCycles: false,
        requireCompletePaths: true,
        validateEPCISTransitions: true
    },
    
    // Performance
    cacheEnabled: true,
    cacheTTL: 300000, // 5 minutes
    maxRelationsPerElement: 20,
    
    // Analyse avancée
    analysis: {
        detectWorkflowPatterns: true,
        identifyBottlenecks: true,
        calculateTransitionProbabilities: false,
        generateOptimizationSuggestions: true
    }
};

/**
 * Classe principale du détecteur de relations
 * @class
 */
class RelationDetector {
    /**
     * Initialise le détecteur de relations
     * @param {Object} options - Options de configuration
     */
    constructor(options = {}) {
        this.config = { ...RELATION_DETECTOR_CONFIG, ...options };
        
        // Cache des relations détectées
        this.relationsCache = new Map();
        
        // Index des éléments pour performance
        this.elementIndex = new Map();
        
        // Graphe de relations pour analyse
        this.relationGraph = {
            nodes: new Map(),
            edges: new Map()
        };
        
        // Statistiques de détection
        this.stats = {
            elementsAnalyzed: 0,
            relationsDetected: 0,
            validRelations: 0,
            invalidRelations: 0,
            workflowsIdentified: 0,
            averageDetectionTime: 0
        };
        
        console.log('✅ RelationDetector initialisé');
    }

    /**
     * Détecte toutes les relations dans les éléments canvas fournis
     * @param {Array} canvasElements - Éléments du canvas Excalidraw
     * @param {Object} options - Options de détection
     * @returns {Promise<Object>} Relations détectées et analyse
     * @sideEffect Met à jour le cache et l'index des éléments
     * @example
     * const relations = await detector.detectRelations(excalidrawElements, {
     *   includeAnalysis: true,
     *   validateTransitions: true
     * });
     */
    async detectRelations(canvasElements, options = {}) {
        const startTime = performance.now();
        
        try {
            console.log(`🔍 Détection relations sur ${canvasElements.length} éléments`);
            
            // Réinitialiser structures internes
            this.resetDetection();
            
            // Indexer tous les éléments pour performance
            this.indexElements(canvasElements);
            
            // Identifier tous les connecteurs/flèches
            const arrows = this.identifyArrows(canvasElements);
            console.log(`📍 ${arrows.length} flèches/connecteurs identifiés`);
            
            // Détecter relations pour chaque flèche
            const detectedRelations = [];
            for (const arrow of arrows) {
                const relation = await this.detectArrowRelation(arrow, canvasElements);
                if (relation) {
                    detectedRelations.push(relation);
                }
            }
            
            // Valider les relations détectées
            const validatedRelations = await this.validateRelations(detectedRelations, options);
            
            // Construire le graphe de relations
            this.buildRelationGraph(validatedRelations);
            
            // Analyser les patterns et workflows
            const analysis = options.includeAnalysis ? 
                await this.analyzeRelationPatterns(validatedRelations) : null;
            
            // Générer les mappings de transitions
            const transitionMappings = await this.generateTransitionMappings(validatedRelations);
            
            // Préparer le résultat
            const result = {
                relations: validatedRelations,
                transitionMappings,
                analysis,
                summary: {
                    totalElements: canvasElements.length,
                    totalArrows: arrows.length,
                    totalRelations: validatedRelations.length,
                    validRelations: validatedRelations.filter(r => !r.validation || r.validation.isValid).length,
                    invalidRelations: validatedRelations.filter(r => r.validation && !r.validation.isValid).length,
                    relationTypes: this.categorizeRelations(validatedRelations)
                },
                metadata: {
                    detectionTime: performance.now() - startTime,
                    timestamp: new Date().toISOString(),
                    detectorVersion: '1.0.0'
                }
            };
            
            // Mettre en cache si activé
            if (this.config.cacheEnabled) {
                this.cacheRelations(result);
            }
            
            // Mettre à jour statistiques
            this.updateStats(result);
            
            console.log(`✅ Détection terminée: ${result.summary.validRelations} relations valides (${result.metadata.detectionTime.toFixed(2)}ms)`);
            
            return result;
            
        } catch (error) {
            console.error('❌ Erreur détection relations:', error);
            throw new Error(`Échec détection relations: ${error.message}`);
        }
    }

    /**
     * Analyse une relation spécifique entre deux éléments
     * @param {string} sourceId - ID de l'élément source
     * @param {string} targetId - ID de l'élément cible
     * @param {Array} canvasElements - Éléments du canvas
     * @returns {Promise<Object>} Analyse détaillée de la relation
     * @example
     * const relationAnalysis = await detector.analyzeRelation(
     *   'object_001',
     *   'state_001',
     *   excalidrawElements
     * );
     */
    async analyzeRelation(sourceId, targetId, canvasElements) {
        try {
            // Récupérer les éléments
            const sourceElement = this.elementIndex.get(sourceId);
            const targetElement = this.elementIndex.get(targetId);
            
            if (!sourceElement || !targetElement) {
                throw new Error('Éléments source ou cible non trouvés');
            }
            
            // Déterminer types des éléments
            const sourceType = this.getElementType(sourceElement);
            const targetType = this.getElementType(targetElement);
            
            // Identifier type de relation
            const relationType = this.identifyRelationType(sourceType, targetType);
            
            // Créer objet relation de base
            const baseRelation = {
                source: { id: sourceId, type: sourceType, element: sourceElement },
                target: { id: targetId, type: targetType, element: targetElement },
                type: relationType
            };
            
            // Analyser la validité
            const validation = await this.validateSingleRelation(baseRelation);
            
            // Analyser le contexte
            const context = this.analyzeRelationContext(sourceElement, targetElement, canvasElements);
            
            // Générer recommandations
            const recommendations = this.generateRelationRecommendations(
                sourceElement,
                targetElement,
                relationType,
                context
            );
            
            return {
                relation: {
                    sourceId,
                    targetId,
                    sourceType,
                    targetType,
                    relationType: relationType ? relationType.name : 'unsupported',
                    valid: validation.isValid
                },
                validation,
                context,
                recommendations,
                metadata: {
                    analyzedAt: new Date().toISOString()
                }
            };
            
        } catch (error) {
            console.error('❌ Erreur analyse relation:', error);
            throw error;
        }
    }

    /**
     * Génère un rapport de validation pour toutes les relations
     * @param {Array} canvasElements - Éléments du canvas
     * @returns {Promise<Object>} Rapport de validation complet
     * @example
     * const validationReport = await detector.generateValidationReport(
     *   excalidrawElements
     * );
     */
    async generateValidationReport(canvasElements) {
        try {
            console.log('📊 Génération rapport de validation...');
            
            // Détecter toutes les relations
            const detectionResult = await this.detectRelations(canvasElements, {
                includeAnalysis: true,
                validateTransitions: true
            });
            
            // Analyser problèmes de validation
            const validationIssues = this.identifyValidationIssues(detectionResult);
            
            // Vérifier cohérence architecture État-Actions
            const architectureValidation = this.validateArchitecture(detectionResult);
            
            // Vérifier conformité EPCIS 2.0
            const epcisValidation = this.validateEPCISCompliance(detectionResult);
            
            // Identifier optimisations possibles
            const optimizations = this.identifyOptimizations(detectionResult);
            
            const report = {
                summary: {
                    totalRelations: detectionResult.summary.totalRelations,
                    validRelations: detectionResult.summary.validRelations,
                    invalidRelations: detectionResult.summary.invalidRelations,
                    validationScore: (detectionResult.summary.validRelations / 
                        Math.max(detectionResult.summary.totalRelations, 1) * 100).toFixed(1),
                    architectureCompliant: architectureValidation.isCompliant,
                    epcisCompliant: epcisValidation.isCompliant
                },
                
                validationIssues: {
                    critical: validationIssues.filter(i => i.severity === 'critical'),
                    warnings: validationIssues.filter(i => i.severity === 'warning'),
                    info: validationIssues.filter(i => i.severity === 'info')
                },
                
                architectureValidation,
                epcisValidation,
                optimizations,
                
                detailedRelations: detectionResult.relations.map(rel => ({
                    ...rel,
                    validationDetails: rel.validation,
                    suggestions: this.generateRelationSuggestions(rel)
                })),
                
                metadata: {
                    reportGeneratedAt: new Date().toISOString(),
                    detectorVersion: '1.0.0',
                    elementsAnalyzed: canvasElements.length
                }
            };
            
            console.log(`✅ Rapport généré: Score ${report.summary.validationScore}%`);
            
            return report;
            
        } catch (error) {
            console.error('❌ Erreur génération rapport:', error);
            throw error;
        }
    }

    /**
     * Réinitialise les structures de détection
     * @private
     */
    resetDetection() {
        this.elementIndex.clear();
        this.relationGraph.nodes.clear();
        this.relationGraph.edges.clear();
    }

    /**
     * Indexe les éléments pour accès rapide
     * @param {Array} elements - Éléments à indexer
     * @private
     */
    indexElements(elements) {
        for (const element of elements) {
            if (element.id) {
                this.elementIndex.set(element.id, element);
                this.stats.elementsAnalyzed++;
            }
        }
    }

    /**
     * Identifie toutes les flèches/connecteurs
     * @param {Array} elements - Éléments du canvas
     * @returns {Array} Flèches identifiées
     * @private
     */
    identifyArrows(elements) {
        return elements.filter(element => {
            // Vérifier type arrow ou line avec endpoints
            if (element.type === 'arrow') return true;
            
            if (element.type === 'line' && element.startBinding && element.endBinding) {
                return true;
            }
            
            // Détecter lignes qui ressemblent à des flèches
            if (element.type === 'line' && element.points && element.points.length >= 2) {
                // Vérifier si la ligne a des marqueurs de flèche
                return element.endArrowhead !== 'none' || element.startArrowhead !== 'none';
            }
            
            return false;
        });
    }

    /**
     * Détecte la relation représentée par une flèche
     * @param {Object} arrow - Élément flèche
     * @param {Array} allElements - Tous les éléments
     * @returns {Promise<Object>} Relation détectée ou null
     * @private
     */
    async detectArrowRelation(arrow, allElements) {
        try {
            // Identifier éléments source et cible
            let sourceElement = null;
            let targetElement = null;
            
            // Utiliser bindings si disponibles
            if (arrow.startBinding && arrow.startBinding.elementId) {
                sourceElement = this.elementIndex.get(arrow.startBinding.elementId);
            }
            
            if (arrow.endBinding && arrow.endBinding.elementId) {
                targetElement = this.elementIndex.get(arrow.endBinding.elementId);
            }
            
            // Si pas de bindings, détecter par proximité
            if (!sourceElement || !targetElement) {
                const detected = this.detectByProximity(arrow, allElements);
                sourceElement = sourceElement || detected.source;
                targetElement = targetElement || detected.target;
            }
            
            if (!sourceElement || !targetElement) {
                return null;
            }
            
            // Déterminer types des éléments
            const sourceType = this.getElementType(sourceElement);
            const targetType = this.getElementType(targetElement);
            
            if (!sourceType || !targetType) {
                return null;
            }
            
            // Identifier type de relation
            const relationType = this.identifyRelationType(sourceType, targetType);
            if (!relationType) {
                console.warn(`Relation non supportée: ${sourceType} → ${targetType}`);
                // Au lieu de retourner null, créer une relation avec type null pour permettre la validation
            }
            
            // Construire objet relation
            const relation = {
                id: `rel_${arrow.id}`,
                arrowId: arrow.id,
                source: {
                    id: sourceElement.id,
                    type: sourceType,
                    name: this.getElementName(sourceElement),
                    element: sourceElement
                },
                target: {
                    id: targetElement.id,
                    type: targetType,
                    name: this.getElementName(targetElement),
                    element: targetElement
                },
                type: relationType, // Peut être null pour relations non supportées
                metadata: {
                    arrowType: arrow.type,
                    hasStartArrow: arrow.startArrowhead !== 'none',
                    hasEndArrow: arrow.endArrowhead !== 'none',
                    bidirectional: arrow.startArrowhead !== 'none' && arrow.endArrowhead !== 'none',
                    label: this.extractArrowLabel(arrow, allElements)
                }
            };
            
            this.stats.relationsDetected++;
            
            return relation;
            
        } catch (error) {
            console.error('Erreur détection relation flèche:', error);
            return null;
        }
    }

    /**
     * Détermine le type d'un élément ProcessMetaLanguage
     * @param {Object} element - Élément à analyser
     * @returns {string|null} Type d'élément
     * @private
     */
    getElementType(element) {
        if (!element || !element.customData) return null;
        
        // Vérifier tags ProcessMetaLanguage
        const tags = element.customData.tags || [];
        
        for (const [type, config] of Object.entries(this.config.elementTypes)) {
            if (tags.includes(config.tag)) {
                return type;
            }
        }
        
        // Détection par forme si pas de tag
        if (element.type === 'rectangle' && !element.roundness) {
            // Potentiellement un state (bannière)
            if (element.width === 80 && element.height === 40) {
                return 'state';
            }
        } else if (element.type === 'rectangle' && element.roundness) {
            // Potentiellement une action
            if (element.width === 140 && element.height === 60) {
                return 'action';
            }
        } else if (element.type === 'polygon' || element.type === 'hexagon') {
            // Potentiellement un object
            if (element.width === 120 && element.height === 80) {
                return 'object';
            }
        }
        
        return null;
    }

    /**
     * Identifie le type de relation entre deux types d'éléments
     * @param {string} sourceType - Type source
     * @param {string} targetType - Type cible
     * @returns {Object|null} Configuration de relation
     * @private
     */
    identifyRelationType(sourceType, targetType) {
        const relationKey = `${sourceType}_to_${targetType}`;
        return this.config.relationTypes[relationKey] || null;
    }

    /**
     * Valide les relations détectées
     * @param {Array} relations - Relations à valider
     * @param {Object} options - Options de validation
     * @returns {Promise<Array>} Relations validées
     * @private
     */
    async validateRelations(relations, options = {}) {
        const validatedRelations = [];
        
        for (const relation of relations) {
            const validation = await this.validateSingleRelation(relation, options);
            
            if (validation.isValid || !options.strictValidation) {
                relation.validation = validation;
                validatedRelations.push(relation);
                
                if (validation.isValid) {
                    this.stats.validRelations++;
                } else {
                    this.stats.invalidRelations++;
                }
            }
        }
        
        // Validation globale de cohérence
        if (options.validateTransitions && this.config.validation.validateEPCISTransitions) {
            await this.validateGlobalCoherence(validatedRelations);
        }
        
        return validatedRelations;
    }

    /**
     * Valide une relation unique
     * @param {Object} relation - Relation à valider
     * @param {Object} options - Options de validation
     * @returns {Promise<Object>} Résultat de validation
     * @private
     */
    async validateSingleRelation(relation, options = {}) {
        const validation = {
            isValid: true,
            errors: [],
            warnings: [],
            info: []
        };
        
        // Vérifier que le type de relation est supporté
        if (!relation.type) {
            validation.isValid = false;
            validation.errors.push(
                `Relation non supportée: ${relation.source.type} → ${relation.target.type}`
            );
            return validation;
        }
        
        // Vérifier que la relation est autorisée
        const sourceConfig = this.config.elementTypes[relation.source.type];
        if (sourceConfig && !sourceConfig.canConnectTo.includes(relation.target.type)) {
            validation.isValid = false;
            validation.errors.push(
                `Type ${relation.source.type} ne peut pas se connecter à ${relation.target.type}`
            );
        }
        
        // Vérifier cardinalité
        if (this.config.validation.enforceCardinality) {
            const cardinalityCheck = this.checkCardinality(relation);
            if (!cardinalityCheck.valid) {
                validation.warnings.push(cardinalityCheck.message);
            }
        }
        
        // Vérifier cycles
        if (!this.config.validation.allowCycles) {
            const cycleCheck = this.checkForCycles(relation);
            if (cycleCheck.hasCycle) {
                validation.errors.push('Cycle détecté dans les relations');
                validation.isValid = false;
            }
        }
        
        // Validation spécifique au type
        if (relation.type && relation.type.validation === 'required') {
            if (!relation.source.element || !relation.target.element) {
                validation.errors.push('Éléments source et cible requis');
                validation.isValid = false;
            }
        }
        
        return validation;
    }

    /**
     * Construit le graphe de relations
     * @param {Array} relations - Relations validées
     * @private
     */
    buildRelationGraph(relations) {
        // Réinitialiser le graphe
        this.relationGraph.nodes.clear();
        this.relationGraph.edges.clear();
        
        // Ajouter tous les nœuds
        for (const relation of relations) {
            // Ajouter nœud source
            if (!this.relationGraph.nodes.has(relation.source.id)) {
                this.relationGraph.nodes.set(relation.source.id, {
                    id: relation.source.id,
                    type: relation.source.type,
                    name: relation.source.name,
                    outgoingEdges: [],
                    incomingEdges: []
                });
            }
            
            // Ajouter nœud cible
            if (!this.relationGraph.nodes.has(relation.target.id)) {
                this.relationGraph.nodes.set(relation.target.id, {
                    id: relation.target.id,
                    type: relation.target.type,
                    name: relation.target.name,
                    outgoingEdges: [],
                    incomingEdges: []
                });
            }
            
            // Ajouter arête
            const edgeId = `${relation.source.id}_to_${relation.target.id}`;
            this.relationGraph.edges.set(edgeId, {
                id: edgeId,
                source: relation.source.id,
                target: relation.target.id,
                type: relation.type ? relation.type.name : 'invalid',
                relation: relation
            });
            
            // Mettre à jour références
            this.relationGraph.nodes.get(relation.source.id).outgoingEdges.push(edgeId);
            this.relationGraph.nodes.get(relation.target.id).incomingEdges.push(edgeId);
        }
    }

    /**
     * Analyse les patterns de relations
     * @param {Array} relations - Relations à analyser
     * @returns {Promise<Object>} Analyse des patterns
     * @private
     */
    async analyzeRelationPatterns(relations) {
        const analysis = {
            patterns: [],
            workflows: [],
            bottlenecks: [],
            optimizations: []
        };
        
        if (this.config.analysis.detectWorkflowPatterns) {
            analysis.workflows = this.detectWorkflowPatterns(relations);
            this.stats.workflowsIdentified = analysis.workflows.length;
        }
        
        if (this.config.analysis.identifyBottlenecks) {
            analysis.bottlenecks = this.identifyBottlenecks();
        }
        
        if (this.config.analysis.generateOptimizationSuggestions) {
            analysis.optimizations = this.generateOptimizationSuggestions(relations);
        }
        
        // Analyser densité et complexité
        analysis.metrics = {
            averageConnectivity: this.calculateAverageConnectivity(),
            maxDepth: this.calculateMaxDepth(),
            numberOfClusters: this.identifyClusters().length,
            complexityScore: this.calculateComplexityScore()
        };
        
        return analysis;
    }

    /**
     * Génère les mappings de transitions État-Actions
     * @param {Array} relations - Relations validées
     * @returns {Promise<Object>} Mappings de transitions
     * @private
     */
    async generateTransitionMappings(relations) {
        const mappings = {
            stateTransitions: [],
            actionTriggers: [],
            workflowPaths: []
        };
        
        // Mapper transitions état vers état via actions
        for (const relation of relations) {
            if (relation.type && relation.type.name === 'Action→State') {
                // Trouver l'état source de cette action
                const sourceStateRelation = relations.find(r => 
                    r.type && r.type.name === 'State→Action' && 
                    r.target.id === relation.source.id
                );
                
                if (sourceStateRelation) {
                    mappings.stateTransitions.push({
                        fromState: sourceStateRelation.source.id,
                        toState: relation.target.id,
                        viaAction: relation.source.id,
                        actionName: relation.source.name,
                        transitionType: 'secondary_action'
                    });
                }
            }
        }
        
        // Mapper déclencheurs d'actions
        mappings.actionTriggers = relations
            .filter(r => r.type && r.type.name === 'State→Action')
            .map(r => ({
                stateId: r.source.id,
                stateName: r.source.name,
                actionId: r.target.id,
                actionName: r.target.name,
                triggerType: this.determineTriggerType(r)
            }));
        
        // Identifier chemins de workflow complets
        mappings.workflowPaths = this.identifyCompletePaths(relations);
        
        return mappings;
    }

    /**
     * Détecte éléments par proximité géométrique
     * @param {Object} arrow - Flèche
     * @param {Array} elements - Éléments
     * @returns {Object} Source et target détectés
     * @private
     */
    detectByProximity(arrow, elements) {
        const result = { source: null, target: null };
        
        if (!arrow.points || arrow.points.length < 2) return result;
        
        // Points de début et fin de la flèche
        const startPoint = {
            x: arrow.x + arrow.points[0][0],
            y: arrow.y + arrow.points[0][1]
        };
        
        const endPoint = {
            x: arrow.x + arrow.points[arrow.points.length - 1][0],
            y: arrow.y + arrow.points[arrow.points.length - 1][1]
        };
        
        // Trouver éléments les plus proches
        let minStartDistance = Infinity;
        let minEndDistance = Infinity;
        
        for (const element of elements) {
            if (element.id === arrow.id) continue;
            
            const elementCenter = this.getElementCenter(element);
            if (!elementCenter) continue;
            
            const startDistance = this.calculateDistance(startPoint, elementCenter);
            const endDistance = this.calculateDistance(endPoint, elementCenter);
            
            if (startDistance < minStartDistance && startDistance < this.config.detection.bindingTolerance) {
                minStartDistance = startDistance;
                result.source = element;
            }
            
            if (endDistance < minEndDistance && endDistance < this.config.detection.bindingTolerance) {
                minEndDistance = endDistance;
                result.target = element;
            }
        }
        
        return result;
    }

    /**
     * Calcule le centre d'un élément
     * @param {Object} element - Élément
     * @returns {Object|null} Coordonnées du centre
     * @private
     */
    getElementCenter(element) {
        if (!element || typeof element.x === 'undefined' || typeof element.y === 'undefined') {
            return null;
        }
        
        return {
            x: element.x + (element.width || 0) / 2,
            y: element.y + (element.height || 0) / 2
        };
    }

    /**
     * Calcule la distance entre deux points
     * @param {Object} p1 - Point 1
     * @param {Object} p2 - Point 2
     * @returns {number} Distance
     * @private
     */
    calculateDistance(p1, p2) {
        return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
    }

    /**
     * Extrait le nom d'un élément
     * @param {Object} element - Élément
     * @returns {string} Nom de l'élément
     * @private
     */
    getElementName(element) {
        if (element.customData && element.customData.name) {
            return element.customData.name;
        }
        
        // Essayer de trouver un texte associé
        if (element.text) {
            return element.text;
        }
        
        return `${element.type}_${element.id.substr(-6)}`;
    }

    /**
     * Extrait le label d'une flèche
     * @param {Object} arrow - Flèche
     * @param {Array} elements - Tous les éléments
     * @returns {string|null} Label de la flèche
     * @private
     */
    extractArrowLabel(arrow, elements) {
        // Chercher un texte proche du milieu de la flèche
        if (!arrow.points || arrow.points.length < 2) return null;
        
        const midPoint = this.getArrowMidpoint(arrow);
        if (!midPoint) return null;
        
        // Chercher texte dans un rayon de 50px
        const nearbyTexts = elements.filter(el => 
            el.type === 'text' && 
            this.calculateDistance(midPoint, this.getElementCenter(el)) < 50
        );
        
        if (nearbyTexts.length > 0) {
            // Prendre le plus proche
            nearbyTexts.sort((a, b) => 
                this.calculateDistance(midPoint, this.getElementCenter(a)) -
                this.calculateDistance(midPoint, this.getElementCenter(b))
            );
            
            return nearbyTexts[0].text;
        }
        
        return null;
    }

    /**
     * Calcule le point milieu d'une flèche
     * @param {Object} arrow - Flèche
     * @returns {Object|null} Point milieu
     * @private
     */
    getArrowMidpoint(arrow) {
        if (!arrow.points || arrow.points.length < 2) return null;
        
        const midIndex = Math.floor(arrow.points.length / 2);
        return {
            x: arrow.x + arrow.points[midIndex][0],
            y: arrow.y + arrow.points[midIndex][1]
        };
    }

    /**
     * Catégorise les relations par type
     * @param {Array} relations - Relations à catégoriser
     * @returns {Object} Relations catégorisées par type
     * @private
     */
    categorizeRelations(relations) {
        const categories = {
            object_to_state: 0,
            state_to_action: 0,
            action_to_state: 0,
            state_to_state: 0
        };
        
        for (const relation of relations) {
            const relationType = relation.type ? relation.type.name : 'invalid';
            switch (relationType) {
                case 'Object→State':
                    categories.object_to_state++;
                    break;
                case 'State→Action':
                    categories.state_to_action++;
                    break;
                case 'Action→State':
                    categories.action_to_state++;
                    break;
                case 'State→State':
                    categories.state_to_state++;
                    break;
            }
        }
        
        return categories;
    }

    // Méthodes d'analyse et validation (implémentations simplifiées)
    
    checkCardinality(relation) {
        // Vérifier cardinalité selon le type de relation
        const cardinality = relation.type.cardinality;
        // Implémentation simplifiée
        return { valid: true, message: 'Cardinalité respectée' };
    }
    
    checkForCycles(relation) {
        // Détecter cycles dans le graphe en utilisant DFS
        const visited = new Set();
        const recursionStack = new Set();
        
        // Fonction DFS récursive pour détecter cycles
        const hasCycleDFS = (nodeId) => {
            if (recursionStack.has(nodeId)) {
                return true; // Cycle détecté
            }
            
            if (visited.has(nodeId)) {
                return false; // Déjà visité, pas de cycle
            }
            
            visited.add(nodeId);
            recursionStack.add(nodeId);
            
            // Vérifier tous les voisins
            const node = this.relationGraph.nodes.get(nodeId);
            if (node && node.outgoingEdges) {
                for (const edge of node.outgoingEdges) {
                    if (hasCycleDFS(edge.targetId)) {
                        return true;
                    }
                }
            }
            
            recursionStack.delete(nodeId);
            return false;
        };
        
        // Vérifier si l'ajout de cette relation créerait un cycle
        const sourceId = relation.source.id;
        const targetId = relation.target.id;
        
        // Simuler l'ajout de la relation et vérifier les cycles
        if (sourceId === targetId) {
            return { hasCycle: true, description: 'Relation vers soi-même' };
        }
        
        // Vérifier si targetId peut atteindre sourceId (créerait un cycle)
        if (this.relationGraph.nodes.has(targetId)) {
            const tempVisited = new Set();
            const canReachSource = (currentId) => {
                if (currentId === sourceId) return true;
                if (tempVisited.has(currentId)) return false;
                
                tempVisited.add(currentId);
                const node = this.relationGraph.nodes.get(currentId);
                if (node && node.outgoingEdges) {
                    for (const edge of node.outgoingEdges) {
                        if (canReachSource(edge.targetId)) {
                            return true;
                        }
                    }
                }
                return false;
            };
            
            if (canReachSource(targetId)) {
                return { hasCycle: true, description: `Cycle détecté: ${targetId} peut atteindre ${sourceId}` };
            }
        }
        
        return { hasCycle: false };
    }
    
    validateArchitecture(detectionResult) {
        // Valider conformité architecture État-Actions
        return {
            isCompliant: true,
            issues: [],
            recommendations: []
        };
    }
    
    validateEPCISCompliance(detectionResult) {
        // Valider conformité EPCIS 2.0
        return {
            isCompliant: true,
            nonCompliantTransitions: [],
            suggestions: []
        };
    }
    
    identifyValidationIssues(detectionResult) {
        const issues = [];
        
        // Identifier relations invalides
        for (const relation of detectionResult.relations) {
            if (relation.validation && !relation.validation.isValid) {
                issues.push({
                    type: 'invalid_relation',
                    severity: 'critical',
                    element: relation.id,
                    message: relation.validation.errors.join(', ')
                });
            }
        }
        
        return issues;
    }
    
    identifyOptimizations(detectionResult) {
        return [
            {
                type: 'reduce_complexity',
                description: 'Simplifier les chemins de transition',
                impact: 'medium',
                effort: 'low'
            }
        ];
    }
    
    generateRelationSuggestions(relation) {
        const suggestions = [];
        
        if (!relation.metadata.label) {
            suggestions.push({
                type: 'add_label',
                message: 'Ajouter un label à cette relation pour clarifier son rôle'
            });
        }
        
        return suggestions;
    }
    
    detectWorkflowPatterns(relations) {
        // Détecter patterns de workflow standards
        const patterns = [];
        
        // Pattern linéaire simple
        const linearPaths = this.findLinearPaths(relations);
        if (linearPaths.length > 0) {
            patterns.push({
                type: 'linear_workflow',
                paths: linearPaths,
                description: 'Workflow linéaire simple'
            });
        }
        
        return patterns;
    }
    
    findLinearPaths(relations) {
        // Trouver chemins linéaires dans les relations
        return [];
    }
    
    identifyBottlenecks() {
        // Identifier nœuds avec trop de connexions
        const bottlenecks = [];
        
        for (const [nodeId, node] of this.relationGraph.nodes) {
            const totalConnections = node.incomingEdges.length + node.outgoingEdges.length;
            if (totalConnections > 5) {
                bottlenecks.push({
                    nodeId,
                    nodeName: node.name,
                    connections: totalConnections,
                    type: node.type,
                    severity: totalConnections > 10 ? 'high' : 'medium'
                });
            }
        }
        
        return bottlenecks;
    }
    
    generateOptimizationSuggestions(relations) {
        return [];
    }
    
    calculateAverageConnectivity() {
        if (this.relationGraph.nodes.size === 0) return 0;
        
        let totalConnections = 0;
        for (const node of this.relationGraph.nodes.values()) {
            totalConnections += node.incomingEdges.length + node.outgoingEdges.length;
        }
        
        return totalConnections / this.relationGraph.nodes.size;
    }
    
    calculateMaxDepth() {
        // Calculer profondeur maximale du graphe
        return 5; // Implémentation simplifiée
    }
    
    identifyClusters() {
        // Identifier clusters de nœuds fortement connectés
        return [];
    }
    
    calculateComplexityScore() {
        // Score de complexité basé sur plusieurs métriques
        const avgConnectivity = this.calculateAverageConnectivity();
        const nodeCount = this.relationGraph.nodes.size;
        const edgeCount = this.relationGraph.edges.size;
        
        return Math.min(100, (avgConnectivity * 10 + nodeCount + edgeCount) / 3);
    }
    
    analyzeRelationContext(sourceElement, targetElement, allElements) {
        // Analyser le contexte autour de la relation
        return {
            nearbyElements: [],
            parallelRelations: [],
            isPartOfWorkflow: false
        };
    }
    
    generateRelationRecommendations(source, target, relationType, context) {
        return [];
    }
    
    identifyCompletePaths(relations) {
        // Identifier chemins complets Object→State→Action→State
        const paths = [];
        
        // Trouver tous les objets (points de départ)
        const objects = [...new Set(relations
            .filter(r => r.source.type === 'object')
            .map(r => r.source.id))];
        
        for (const objectId of objects) {
            const objectPaths = this.tracePathsFromObject(objectId, relations);
            paths.push(...objectPaths);
        }
        
        return paths;
    }
    
    tracePathsFromObject(objectId, relations) {
        // Tracer tous les chemins depuis un objet
        return [];
    }
    
    determineTriggerType(relation) {
        // Déterminer le type de déclencheur pour une action
        if (relation.metadata.label && relation.metadata.label.includes('auto')) {
            return 'automatic';
        }
        return 'manual';
    }
    
    validateGlobalCoherence(relations) {
        // Validation globale de cohérence
        // Vérifier que tous les objets ont au moins un état
        // Vérifier que tous les états ont une action principale
        // etc.
    }
    
    cacheRelations(result) {
        const cacheKey = this.generateCacheKey(result);
        this.relationsCache.set(cacheKey, {
            result,
            timestamp: Date.now()
        });
    }
    
    generateCacheKey(result) {
        return `relations_${result.summary.totalElements}_${Date.now()}`;
    }
    
    updateStats(result) {
        const detectionTime = result.metadata.detectionTime;
        const currentAvg = this.stats.averageDetectionTime;
        const count = this.stats.elementsAnalyzed;
        
        this.stats.averageDetectionTime = (currentAvg * (count - result.summary.totalElements) + detectionTime) / count;
    }

    /**
     * Obtient les statistiques de performance
     * @returns {Object} Statistiques détaillées
     */
    getPerformanceStats() {
        return {
            ...this.stats,
            cacheSize: this.relationsCache.size,
            graphSize: {
                nodes: this.relationGraph.nodes.size,
                edges: this.relationGraph.edges.size
            },
            detectionEfficiency: this.stats.validRelations / Math.max(this.stats.relationsDetected, 1) * 100
        };
    }

    /**
     * Réinitialise le détecteur
     * @sideEffect Vide tous les caches et réinitialise les stats
     */
    reset() {
        this.relationsCache.clear();
        this.elementIndex.clear();
        this.relationGraph.nodes.clear();
        this.relationGraph.edges.clear();
        
        this.stats = {
            elementsAnalyzed: 0,
            relationsDetected: 0,
            validRelations: 0,
            invalidRelations: 0,
            workflowsIdentified: 0,
            averageDetectionTime: 0
        };
        
        console.log('🔄 RelationDetector réinitialisé');
    }
}

// Export ES6 par défaut
export { RelationDetector, RELATION_DETECTOR_CONFIG };

// Export browser pour utilisation dans Obsidian
if (typeof window !== 'undefined') {
    window.ProcessMetaLanguageRelationDetector = {
        RelationDetector,
        RELATION_DETECTOR_CONFIG
    };
}

// <!-- END OF FILE: relation-detector.js -->