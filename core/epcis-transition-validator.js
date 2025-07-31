// <!-- START OF FILE: epcis-transition-validator.js -->
// FILENAME: epcis-transition-validator.js
// Version: 1.0.0
// Date: 2025-07-30 17:45
// Author: Rolland MELET & Claude Code
// Description: Validateur transitions EPCIS 2.0 ProcessMetaLanguage - TASK-B007 validation

/**
 * Validateur spécialisé pour transitions EPCIS 2.0 dans l'architecture État-Actions
 * Garantit la conformité complète des workflows ProcessMetaLanguage aux standards GS1
 * @module EPCISTransitionValidator
 * @requires EPCISValidator
 */

import { EPCISValidator } from './epcis-validator.js';

/**
 * Validateur avancé pour transitions d'état selon EPCIS 2.0 et CBV 2.0
 * Spécialisé dans la validation des workflows ProcessMetaLanguage
 * 
 * @class EPCISTransitionValidator
 * @example
 * // Créer validateur de transitions EPCIS
 * const validator = new EPCISTransitionValidator();
 * await validator.initialize();
 * 
 * // Valider transition complète
 * const validation = await validator.validateCompleteTransition({
 *   fromBusinessStep: 'receiving',
 *   fromDisposition: 'in_transit',
 *   toBusinessStep: 'inspecting',
 *   toDisposition: 'in_progress',
 *   actionData: { inspector: 'QC001', criteria: 'visual' }
 * });
 */
export class EPCISTransitionValidator {
    /**
     * Initialise le validateur de transitions EPCIS
     * @param {Object} options - Options de configuration
     * @param {boolean} options.strictValidation - Validation stricte CBV 2.0 (défaut: true)
     * @param {boolean} options.allowCustomExtensions - Extensions personnalisées (défaut: false)
     * @param {string} options.epcisVersion - Version EPCIS (défaut: '2.0')
     */
    constructor(options = {}) {
        this.config = {
            strictValidation: options.strictValidation !== false,
            allowCustomExtensions: options.allowCustomExtensions || false,
            epcisVersion: options.epcisVersion || '2.0',
            cbvVersion: options.cbvVersion || '2.0',
            validateJsonLD: options.validateJsonLD !== false
        };

        // Module de validation EPCIS de base
        this.epcisValidator = null;

        // Matrices de validation des transitions EPCIS 2.0
        this.transitionMatrices = {
            // Matrice Business Steps → Business Steps autorisés
            businessStepTransitions: {
                'receiving': ['inspecting', 'storing', 'unpacking', 'observing'],
                'inspecting': ['storing', 'transforming', 'shipping', 'recalling', 'destroying'],
                'storing': ['retrieving', 'shipping', 'transforming', 'observing', 'destroying'],
                'transforming': ['inspecting', 'packing', 'storing', 'assembling'],
                'packing': ['inspecting', 'storing', 'shipping', 'labeling'],
                'shipping': ['transporting', 'loading', 'observing'],
                'transporting': ['unloading', 'observing', 'receiving'],
                'loading': ['transporting', 'shipping'],
                'unloading': ['receiving', 'inspecting', 'storing'],
                'assembling': ['inspecting', 'packing', 'storing'],
                'disassembling': ['inspecting', 'transforming', 'storing'],
                'commissioning': ['storing', 'shipping', 'observing'],
                'decommissioning': ['storing', 'destroying', 'observing'],
                'installing': ['commissioning', 'observing'],
                'removing': ['decommissioning', 'storing'],
                'repairing': ['inspecting', 'storing', 'commissioning'],
                'replacing': ['removing', 'installing'],
                'testing': ['inspecting', 'storing', 'shipping'],
                'sampling': ['testing', 'inspecting'],
                'dispensing': ['observing', 'consuming'],
                'consuming': [], // État terminal
                'destroying': [], // État terminal
                'recalling': ['inspecting', 'destroying', 'storing'],
                'observing': [], // Peut aller vers n'importe quel step selon contexte
                'labeling': ['storing', 'shipping', 'observing'],
                'encoding': ['labeling', 'storing', 'shipping']
            },

            // Matrice Dispositions → Dispositions autorisées
            dispositionTransitions: {
                'active': ['in_progress', 'in_transit', 'inactive', 'damaged', 'recalled'],
                'in_progress': ['active', 'completed', 'damaged', 'non_sellable'],
                'in_transit': ['active', 'received', 'damaged', 'lost'],
                'inactive': ['active', 'destroyed', 'disposed'],
                'disposed': [], // État terminal
                'destroyed': [], // État terminal
                'expired': ['disposed', 'destroyed', 'recalled'],
                'recalled': ['destroyed', 'non_sellable', 'in_progress'],
                'damaged': ['recalled', 'non_sellable', 'in_progress', 'destroyed'],
                'non_sellable': ['in_progress', 'destroyed', 'recalled'],
                'sellable_accessible': ['retail_sold', 'in_transit', 'recalled'],
                'sellable_not_accessible': ['sellable_accessible', 'in_transit'],
                'retail_sold': ['consumed', 'returned'],
                'dispensed': ['consumed'],
                'consumed': [], // État terminal
                'returned': ['in_progress', 'non_sellable', 'sellable_accessible'],
                'completed': ['active', 'in_transit'],
                'received': ['active', 'in_progress'],
                'lost': ['received', 'destroyed'], // Si retrouvé
                'stolen': ['received', 'destroyed'], // Si récupéré
                'reserved': ['active', 'in_transit'],
                'container_closed': ['in_transit', 'container_open'],
                'container_open': ['container_closed', 'active']
            },

            // Compatibilités Business Step ↔ Disposition
            businessStepDispositionCompatibility: {
                'receiving': ['in_transit', 'received', 'active'],
                'inspecting': ['in_progress', 'active', 'damaged', 'non_sellable'],
                'storing': ['active', 'inactive', 'sellable_accessible', 'sellable_not_accessible'],
                'transforming': ['in_progress', 'active'],
                'packing': ['in_progress', 'active', 'completed'],
                'shipping': ['in_transit', 'active'],
                'transporting': ['in_transit'],
                'loading': ['in_progress', 'in_transit'],
                'unloading': ['in_progress', 'received'],
                'assembling': ['in_progress', 'active'],
                'disassembling': ['in_progress', 'active'],
                'commissioning': ['active', 'completed'],
                'decommissioning': ['inactive', 'disposed'],
                'installing': ['in_progress', 'active'],
                'removing': ['in_progress', 'inactive'],
                'repairing': ['in_progress', 'active'],
                'replacing': ['in_progress', 'active'],
                'testing': ['in_progress', 'active', 'damaged'],
                'sampling': ['in_progress', 'active'],
                'dispensing': ['dispensed', 'active'],
                'consuming': ['consumed'],
                'destroying': ['destroyed'],
                'recalling': ['recalled', 'in_progress'],
                'observing': ['active', 'in_progress', 'inactive'], // Flexible
                'labeling': ['in_progress', 'active'],
                'encoding': ['in_progress', 'active']
            }
        };

        // Règles de validation spécifiques EPCIS 2.0
        this.validationRules = {
            // Règles temporelles
            temporal: {
                // Certaines transitions nécessitent un délai minimum
                minimumDelays: {
                    'receiving_to_inspecting': 0, // Immédiat possible
                    'inspecting_to_storing': 300, // 5 min minimum pour inspection
                    'storing_to_shipping': 0, // Immédiat possible
                    'transforming_to_inspecting': 600 // 10 min minimum pour transformation
                },
                // Certaines transitions ne peuvent pas être inversées rapidement
                reversalRestrictions: {
                    'shipping_to_receiving': 3600, // 1h minimum
                    'destroying_reversal': Infinity, // Irréversible
                    'consuming_reversal': Infinity // Irréversible
                }
            },

            // Règles contextuelles
            contextual: {
                // Certaines transitions nécessitent des données spécifiques
                requiredDataFields: {
                    'receiving': ['receiptDate', 'supplier'],
                    'inspecting': ['inspector', 'inspectionCriteria'],
                    'transforming': ['processParameters', 'operator'],
                    'shipping': ['destination', 'carrier'],
                    'recalling': ['recallReason', 'authority']
                },
                
                // Validations selon le type d'objet
                objectTypeRestrictions: {
                    'raw-material': {
                        allowedBusinessSteps: ['receiving', 'inspecting', 'storing', 'transforming'],
                        forbiddenBusinessSteps: ['retail_selling', 'dispensing']
                    },
                    'finished-product': {
                        allowedBusinessSteps: ['packing', 'storing', 'shipping', 'retail_selling'],
                        forbiddenBusinessSteps: ['transforming'] // Sauf remanufacturing
                    },
                    'intermediate-product': {
                        allowedBusinessSteps: ['transforming', 'assembling', 'inspecting', 'storing'],
                        forbiddenBusinessSteps: ['retail_selling', 'consuming']
                    }
                }
            },

            // Règles de conformité réglementaire
            regulatory: {
                // Transitions nécessitant une traçabilité complète
                traceabilityRequired: [
                    'receiving', 'transforming', 'shipping', 'recalling', 'destroying'
                ],
                
                // Business steps nécessitant approbation
                approvalRequired: [
                    'recalling', 'destroying', 'decommissioning'
                ],
                
                // Dispositions nécessitant documentation
                documentationRequired: [
                    'recalled', 'destroyed', 'expired', 'damaged'
                ]
            }
        };

        this.isInitialized = false;
    }

    /**
     * Initialise le validateur et charge les règles EPCIS
     * @returns {Promise<boolean>} Succès de l'initialisation
     * @sideEffect Initialise EPCISValidator de base et valide les matrices
     * @example
     * const validator = new EPCISTransitionValidator();
     * await validator.initialize();
     */
    async initialize() {
        try {
            console.log('Initialisation EPCISTransitionValidator...');

            // Initialiser le validateur EPCIS de base
            this.epcisValidator = new EPCISValidator();
            await this.epcisValidator.initialize();

            // Valider la cohérence des matrices de transition
            await this._validateTransitionMatrices();

            // Valider les règles de validation
            await this._validateValidationRules();

            this.isInitialized = true;
            console.log('✅ EPCISTransitionValidator initialisé avec succès');
            
            return true;
        } catch (error) {
            console.error('❌ Erreur initialisation EPCISTransitionValidator:', error);
            throw new Error(`Échec initialisation EPCISTransitionValidator: ${error.message}`);
        }
    }

    /**
     * Valide une transition complète selon EPCIS 2.0
     * @param {Object} transitionData - Données de la transition à valider
     * @param {string} transitionData.fromBusinessStep - Business step source
     * @param {string} transitionData.fromDisposition - Disposition source
     * @param {string} transitionData.toBusinessStep - Business step cible
     * @param {string} transitionData.toDisposition - Disposition cible
     * @param {Object} transitionData.actionData - Données de l'action
     * @param {Object} transitionData.context - Contexte de la transition
     * @param {Object} options - Options de validation
     * @param {boolean} options.validateTemporal - Valider règles temporelles (défaut: true)
     * @param {boolean} options.validateContextual - Valider règles contextuelles (défaut: true)
     * @param {boolean} options.validateRegulatory - Valider règles réglementaires (défaut: true)
     * @returns {Promise<Object>} Résultat de validation avec détails des erreurs
     * @sideEffect Aucun - validation pure sans modification
     * @performance Target <50ms pour validation simple, <200ms pour validation complète
     * @example
     * // Valider transition réception → inspection
     * const validation = await validator.validateCompleteTransition({
     *   fromBusinessStep: 'receiving',
     *   fromDisposition: 'in_transit',
     *   toBusinessStep: 'inspecting',
     *   toDisposition: 'in_progress',
     *   actionData: {
     *     inspector: 'QC001',
     *     inspectionCriteria: 'visual_inspection',
     *     receiptDate: '2025-07-30T10:00:00Z'
     *   },
     *   context: {
     *     objectType: 'raw-material',
     *     previousTransition: 'shipping_to_receiving',
     *     transitionTime: '2025-07-30T10:30:00Z'
     *   }
     * });
     */
    async validateCompleteTransition(transitionData, options = {}) {
        const startTime = performance.now();
        
        try {
            console.log(`Validation transition EPCIS: ${transitionData.fromBusinessStep}→${transitionData.toBusinessStep}`);

            // Validation des paramètres d'entrée
            this._validateTransitionData(transitionData);

            const validationResult = {
                isValid: true,
                errors: [],
                warnings: [],
                validationDetails: {
                    businessStepTransition: null,
                    dispositionTransition: null,
                    compatibility: null,
                    temporal: null,
                    contextual: null,
                    regulatory: null
                },
                epcisCompliance: {
                    version: this.config.epcisVersion,
                    cbvVersion: this.config.cbvVersion,
                    validatedAt: new Date().toISOString()
                },
                performance: {
                    validationTime: 0
                }
            };

            // 1. Validation transition business step
            const businessStepValidation = await this._validateBusinessStepTransition(
                transitionData.fromBusinessStep,
                transitionData.toBusinessStep
            );
            validationResult.validationDetails.businessStepTransition = businessStepValidation;
            
            if (!businessStepValidation.valid) {
                validationResult.isValid = false;
                validationResult.errors.push(...businessStepValidation.errors);
            }

            // 2. Validation transition disposition
            const dispositionValidation = await this._validateDispositionTransition(
                transitionData.fromDisposition,
                transitionData.toDisposition
            );
            validationResult.validationDetails.dispositionTransition = dispositionValidation;
            
            if (!dispositionValidation.valid) {
                validationResult.isValid = false;
                validationResult.errors.push(...dispositionValidation.errors);
            }

            // 3. Validation compatibilité business step ↔ disposition
            const compatibilityValidation = await this._validateBusinessStepDispositionCompatibility(
                transitionData.toBusinessStep,
                transitionData.toDisposition
            );
            validationResult.validationDetails.compatibility = compatibilityValidation;
            
            if (!compatibilityValidation.valid) {
                validationResult.isValid = false;
                validationResult.errors.push(...compatibilityValidation.errors);
            }

            // 4. Validation règles temporelles (si activée)
            if (options.validateTemporal !== false) {
                const temporalValidation = await this._validateTemporalRules(transitionData);
                validationResult.validationDetails.temporal = temporalValidation;
                
                if (!temporalValidation.valid) {
                    validationResult.isValid = false;
                    validationResult.errors.push(...temporalValidation.errors);
                }
                
                // Ajouter warnings pour délais recommandés
                validationResult.warnings.push(...(temporalValidation.warnings || []));
            }

            // 5. Validation règles contextuelles (si activée)
            if (options.validateContextual !== false) {
                const contextualValidation = await this._validateContextualRules(transitionData);
                validationResult.validationDetails.contextual = contextualValidation;
                
                if (!contextualValidation.valid) {
                    validationResult.isValid = false;
                    validationResult.errors.push(...contextualValidation.errors);
                }
                
                validationResult.warnings.push(...(contextualValidation.warnings || []));
            }

            // 6. Validation règles réglementaires (si activée)
            if (options.validateRegulatory !== false) {
                const regulatoryValidation = await this._validateRegulatoryRules(transitionData);
                validationResult.validationDetails.regulatory = regulatoryValidation;
                
                if (!regulatoryValidation.valid) {
                    validationResult.isValid = false;
                    validationResult.errors.push(...regulatoryValidation.errors);
                }
                
                validationResult.warnings.push(...(regulatoryValidation.warnings || []));
            }

            // Finaliser les métriques
            validationResult.performance.validationTime = performance.now() - startTime;

            const status = validationResult.isValid ? '✅' : '❌';
            console.log(`${status} Validation transition terminée: ${validationResult.errors.length} erreurs, ${validationResult.warnings.length} warnings`);
            
            return validationResult;

        } catch (error) {
            console.error('❌ Erreur validation transition EPCIS:', error);
            throw new Error(`Échec validation transition: ${error.message}`);
        }
    }

    /**
     * Valide un workflow complet selon les règles EPCIS 2.0
     * @param {Object} workflowData - Données du workflow à valider
     * @param {Object[]} workflowData.steps - Étapes du workflow
     * @param {Object} workflowData.initialState - État initial
     * @param {Object} workflowData.context - Contexte du workflow
     * @param {Object} options - Options de validation
     * @returns {Promise<Object>} Résultat de validation du workflow complet
     * @sideEffect Aucun - validation pure sans modification
     * @example
     * // Valider workflow de réception complet
     * const validation = await validator.validateWorkflow({
     *   steps: [
     *     { businessStep: 'receiving', disposition: 'in_transit' },
     *     { businessStep: 'inspecting', disposition: 'in_progress' },
     *     { businessStep: 'storing', disposition: 'active' }
     *   ],
     *   initialState: { businessStep: 'shipping', disposition: 'in_transit' },
     *   context: { objectType: 'raw-material', workflowType: 'standard_receiving' }
     * });
     */
    async validateWorkflow(workflowData, options = {}) {
        try {
            console.log(`Validation workflow EPCIS: ${workflowData.steps?.length} étapes`);

            const workflowValidation = {
                isValid: true,
                errors: [],
                warnings: [],
                stepValidations: [],
                workflowAnalysis: {
                    totalSteps: workflowData.steps?.length || 0,
                    validSteps: 0,
                    invalidSteps: 0,
                    criticalErrors: [],
                    suggestions: []
                }
            };

            if (!workflowData.steps || workflowData.steps.length === 0) {
                workflowValidation.isValid = false;
                workflowValidation.errors.push('Workflow vide - aucune étape définie');
                return workflowValidation;
            }

            // Valider chaque transition dans le workflow
            let currentState = workflowData.initialState;

            for (let i = 0; i < workflowData.steps.length; i++) {
                const step = workflowData.steps[i];
                
                const transitionData = {
                    fromBusinessStep: currentState.businessStep,
                    fromDisposition: currentState.disposition,
                    toBusinessStep: step.businessStep,
                    toDisposition: step.disposition,
                    actionData: step.actionData || {},
                    context: {
                        ...workflowData.context,
                        stepIndex: i,
                        stepName: step.name || `Step_${i + 1}`
                    }
                };

                const stepValidation = await this.validateCompleteTransition(transitionData, options);
                stepValidation.stepIndex = i;
                stepValidation.stepName = transitionData.context.stepName;
                
                workflowValidation.stepValidations.push(stepValidation);

                if (stepValidation.isValid) {
                    workflowValidation.workflowAnalysis.validSteps++;
                } else {
                    workflowValidation.workflowAnalysis.invalidSteps++;
                    workflowValidation.isValid = false;
                    workflowValidation.errors.push(
                        `Étape ${i + 1} (${stepValidation.stepName}): ${stepValidation.errors.join(', ')}`
                    );

                    // Identifier erreurs critiques qui bloquent le workflow
                    if (stepValidation.errors.some(err => err.includes('transition interdite'))) {
                        workflowValidation.workflowAnalysis.criticalErrors.push({
                            stepIndex: i,
                            error: 'Transition interdite par EPCIS 2.0',
                            suggestion: 'Revoir la séquence du workflow'
                        });
                    }
                }

                // Ajouter warnings du niveau workflow
                workflowValidation.warnings.push(...stepValidation.warnings);

                // Mettre à jour l'état actuel pour la prochaine transition
                currentState = {
                    businessStep: step.businessStep,
                    disposition: step.disposition
                };
            }

            // Analyser la cohérence globale du workflow
            const coherenceAnalysis = this._analyzeWorkflowCoherence(workflowValidation.stepValidations);
            workflowValidation.workflowAnalysis.suggestions = coherenceAnalysis.suggestions;

            console.log(`✅ Validation workflow terminée: ${workflowValidation.workflowAnalysis.validSteps}/${workflowValidation.workflowAnalysis.totalSteps} étapes valides`);
            
            return workflowValidation;

        } catch (error) {
            console.error('❌ Erreur validation workflow EPCIS:', error);
            throw new Error(`Échec validation workflow: ${error.message}`);
        }
    }

    /**
     * Recommande des transitions conformes EPCIS 2.0 pour un état donné
     * @param {Object} currentState - État actuel
     * @param {string} currentState.businessStep - Business step actuel
     * @param {string} currentState.disposition - Disposition actuelle
     * @param {Object} context - Contexte pour les recommandations
     * @param {Object} options - Options de recommandation
     * @returns {Promise<Object>} Transitions recommandées avec analyse de conformité
     * @sideEffect Aucun - analyse pure sans modification
     * @example
     * // Obtenir recommandations depuis état inspection
     * const recommendations = await validator.recommendCompliantTransitions({
     *   businessStep: 'inspecting',
     *   disposition: 'in_progress'
     * }, {
     *   objectType: 'raw-material',
     *   businessContext: 'quality_control'
     * });
     */
    async recommendCompliantTransitions(currentState, context = {}, options = {}) {
        try {
            console.log(`Recommandations transitions EPCIS depuis: ${currentState.businessStep}/${currentState.disposition}`);

            const recommendations = {
                currentState,
                recommendedTransitions: [],
                analysis: {
                    totalPossibleTransitions: 0,
                    compliantTransitions: 0,
                    recommendedTransitions: 0
                },
                context
            };

            // Obtenir transitions possibles pour le business step actuel
            const possibleBusinessSteps = this.transitionMatrices.businessStepTransitions[currentState.businessStep] || [];
            
            // Obtenir dispositions possibles pour la disposition actuelle
            const possibleDispositions = this.transitionMatrices.dispositionTransitions[currentState.disposition] || [];

            // Générer toutes les combinaisons possibles
            for (const toBusinessStep of possibleBusinessSteps) {
                for (const toDisposition of possibleDispositions) {
                    recommendations.analysis.totalPossibleTransitions++;

                    // Vérifier compatibilité business step ↔ disposition
                    const compatibility = await this._validateBusinessStepDispositionCompatibility(
                        toBusinessStep,
                        toDisposition
                    );

                    if (compatibility.valid) {
                        recommendations.analysis.compliantTransitions++;

                        // Créer données de transition pour validation complète
                        const transitionData = {
                            fromBusinessStep: currentState.businessStep,
                            fromDisposition: currentState.disposition,
                            toBusinessStep,
                            toDisposition,
                            actionData: {},
                            context
                        };

                        // Validation complète pour déterminer la recommandation
                        const fullValidation = await this.validateCompleteTransition(transitionData, {
                            validateTemporal: false, // Skip pour les recommandations
                            validateContextual: true,
                            validateRegulatory: true
                        });

                        if (fullValidation.isValid || fullValidation.errors.length === 0) {
                            recommendations.analysis.recommendedTransitions++;

                            const recommendation = {
                                toBusinessStep,
                                toDisposition,
                                confidence: this._calculateTransitionConfidence(transitionData, fullValidation),
                                reasoning: this._generateTransitionReasoning(transitionData, fullValidation),
                                requiredData: this._getRequiredDataForTransition(toBusinessStep),
                                estimatedDuration: this._estimateTransitionDuration(currentState.businessStep, toBusinessStep),
                                warnings: fullValidation.warnings,
                                epcisCompliant: true
                            };

                            recommendations.recommendedTransitions.push(recommendation);
                        }
                    }
                }
            }

            // Trier par confidence décroissante
            recommendations.recommendedTransitions.sort((a, b) => b.confidence - a.confidence);

            // Limiter aux meilleures recommandations si spécifié
            if (options.maxRecommendations) {
                recommendations.recommendedTransitions = recommendations.recommendedTransitions
                    .slice(0, options.maxRecommendations);
            }

            console.log(`✅ ${recommendations.recommendedTransitions.length} transitions conformes recommandées`);
            
            return recommendations;

        } catch (error) {
            console.error('❌ Erreur recommandations transitions EPCIS:', error);
            throw new Error(`Échec recommandations transitions: ${error.message}`);
        }
    }

    /**
     * Méthodes privées de validation
     * @private
     */

    _validateTransitionData(transitionData) {
        const required = ['fromBusinessStep', 'fromDisposition', 'toBusinessStep', 'toDisposition'];
        for (const field of required) {
            if (!transitionData[field]) {
                throw new Error(`Champ de transition requis manquant: ${field}`);
            }
        }
    }

    async _validateTransitionMatrices() {
        // Valider cohérence des matrices de transition
        const businessSteps = Object.keys(this.transitionMatrices.businessStepTransitions);
        const dispositions = Object.keys(this.transitionMatrices.dispositionTransitions);

        // Vérifier que toutes les références existent
        for (const [step, targets] of Object.entries(this.transitionMatrices.businessStepTransitions)) {
            for (const target of targets) {
                if (!businessSteps.includes(target)) {
                    throw new Error(`Business step référencé inconnu: ${target} dans ${step}`);
                }
            }
        }

        console.log(`Matrices de transition validées: ${businessSteps.length} business steps, ${dispositions.length} dispositions`);
    }

    async _validateValidationRules() {
        // Valider la cohérence des règles de validation
        const requiredFields = this.validationRules.contextual.requiredDataFields;
        const businessSteps = Object.keys(this.transitionMatrices.businessStepTransitions);

        for (const step of Object.keys(requiredFields)) {
            if (!businessSteps.includes(step)) {
                throw new Error(`Business step dans requiredDataFields inconnu: ${step}`);
            }
        }

        console.log('Règles de validation cohérentes');
    }

    async _validateBusinessStepTransition(fromStep, toStep) {
        const allowedTransitions = this.transitionMatrices.businessStepTransitions[fromStep] || [];
        
        if (!allowedTransitions.includes(toStep)) {
            return {
                valid: false,
                errors: [`Transition business step interdite: ${fromStep} → ${toStep}`],
                allowedTargets: allowedTransitions
            };
        }

        return {
            valid: true,
            errors: [],
            allowedTargets: allowedTransitions
        };
    }

    async _validateDispositionTransition(fromDisposition, toDisposition) {
        const allowedTransitions = this.transitionMatrices.dispositionTransitions[fromDisposition] || [];
        
        if (!allowedTransitions.includes(toDisposition)) {
            return {
                valid: false,
                errors: [`Transition disposition interdite: ${fromDisposition} → ${toDisposition}`],
                allowedTargets: allowedTransitions
            };
        }

        return {
            valid: true,
            errors: [],
            allowedTargets: allowedTransitions
        };
    }

    async _validateBusinessStepDispositionCompatibility(businessStep, disposition) {
        const compatibleDispositions = this.transitionMatrices.businessStepDispositionCompatibility[businessStep] || [];
        
        if (!compatibleDispositions.includes(disposition)) {
            return {
                valid: false,
                errors: [`Incompatibilité business step/disposition: ${businessStep} incompatible avec ${disposition}`],
                compatibleDispositions
            };
        }

        return {
            valid: true,
            errors: [],
            compatibleDispositions
        };
    }

    async _validateTemporalRules(transitionData) {
        const validation = { valid: true, errors: [], warnings: [] };

        // Vérifier délais minimums si données temporelles disponibles
        if (transitionData.context?.previousTransitionTime && transitionData.context?.transitionTime) {
            const transitionKey = `${transitionData.fromBusinessStep}_to_${transitionData.toBusinessStep}`;
            const minimumDelay = this.validationRules.temporal.minimumDelays[transitionKey];

            if (minimumDelay !== undefined) {
                const timeDiff = new Date(transitionData.context.transitionTime) - new Date(transitionData.context.previousTransitionTime);
                
                if (timeDiff < minimumDelay * 1000) {
                    validation.valid = false;
                    validation.errors.push(`Délai minimum non respecté pour ${transitionKey}: ${timeDiff/1000}s < ${minimumDelay}s`);
                }
            }
        }

        return validation;
    }

    async _validateContextualRules(transitionData) {
        const validation = { valid: true, errors: [], warnings: [] };

        // Vérifier champs requis pour le business step cible
        const requiredFields = this.validationRules.contextual.requiredDataFields[transitionData.toBusinessStep] || [];
        
        for (const field of requiredFields) {
            if (!transitionData.actionData[field]) {
                validation.valid = false;
                validation.errors.push(`Champ requis manquant pour ${transitionData.toBusinessStep}: ${field}`);
            }
        }

        // Vérifier restrictions par type d'objet
        if (transitionData.context?.objectType) {
            const restrictions = this.validationRules.contextual.objectTypeRestrictions[transitionData.context.objectType];
            
            if (restrictions) {
                if (restrictions.forbiddenBusinessSteps?.includes(transitionData.toBusinessStep)) {
                    validation.valid = false;
                    validation.errors.push(`Business step interdit pour type ${transitionData.context.objectType}: ${transitionData.toBusinessStep}`);
                }
                
                if (restrictions.allowedBusinessSteps && !restrictions.allowedBusinessSteps.includes(transitionData.toBusinessStep)) {
                    validation.warnings.push(`Business step non standard pour type ${transitionData.context.objectType}: ${transitionData.toBusinessStep}`);
                }
            }
        }

        return validation;
    }

    async _validateRegulatoryRules(transitionData) {
        const validation = { valid: true, errors: [], warnings: [] };

        // Vérifier exigences de traçabilité
        if (this.validationRules.regulatory.traceabilityRequired.includes(transitionData.toBusinessStep)) {
            if (!transitionData.actionData.traceabilityData) {
                validation.warnings.push(`Traçabilité recommandée pour ${transitionData.toBusinessStep}`);
            }
        }

        // Vérifier exigences d'approbation
        if (this.validationRules.regulatory.approvalRequired.includes(transitionData.toBusinessStep)) {
            if (!transitionData.actionData.approvalData) {
                validation.valid = false;
                validation.errors.push(`Approbation requise pour ${transitionData.toBusinessStep}`);
            }
        }

        // Vérifier exigences de documentation
        if (this.validationRules.regulatory.documentationRequired.includes(transitionData.toDisposition)) {
            if (!transitionData.actionData.documentationData) {
                validation.warnings.push(`Documentation recommandée pour disposition ${transitionData.toDisposition}`);
            }
        }

        return validation;
    }

    _analyzeWorkflowCoherence(stepValidations) {
        const suggestions = [];

        // Analyser patterns d'erreurs
        const errorPatterns = {};
        stepValidations.forEach(validation => {
            validation.errors.forEach(error => {
                errorPatterns[error] = (errorPatterns[error] || 0) + 1;
            });
        });

        // Suggérer améliorations
        if (errorPatterns['Transition business step interdite']) {
            suggestions.push('Revoir la séquence des business steps selon la matrice EPCIS 2.0');
        }

        if (errorPatterns['Incompatibilité business step/disposition']) {
            suggestions.push('Vérifier la cohérence entre business steps et dispositions');
        }

        return { suggestions };
    }

    _calculateTransitionConfidence(transitionData, validation) {
        let confidence = 0.7; // Base

        // Augmenter pour transitions standard
        const standardTransitions = ['receiving_to_inspecting', 'inspecting_to_storing', 'storing_to_shipping'];
        const transitionKey = `${transitionData.fromBusinessStep}_to_${transitionData.toBusinessStep}`;
        
        if (standardTransitions.includes(transitionKey)) {
            confidence += 0.2;
        }

        // Diminuer pour warnings
        confidence -= validation.warnings.length * 0.05;

        return Math.min(1.0, Math.max(0.0, confidence));
    }

    _generateTransitionReasoning(transitionData, validation) {
        const reasons = [];

        if (validation.isValid) {
            reasons.push('Transition conforme EPCIS 2.0');
        }

        if (validation.warnings.length === 0) {
            reasons.push('Aucun warning détecté');
        }

        return reasons.join(', ') || 'Transition valide';
    }

    _getRequiredDataForTransition(businessStep) {
        return this.validationRules.contextual.requiredDataFields[businessStep] || [];
    }

    _estimateTransitionDuration(fromStep, toStep) {
        // Estimations basées sur les standards industriels
        const durations = {
            'receiving': 30,
            'inspecting': 60,
            'storing': 15,
            'transforming': 120,
            'shipping': 20
        };

        return durations[toStep] || 30; // 30 min par défaut
    }
}

// Exportation par défaut
export default EPCISTransitionValidator;

// <!-- END OF FILE: epcis-transition-validator.js -->