// <!-- START OF FILE: epcis-validator.js -->
// FILENAME: epcis-validator.js
// Version: 1.0.0
// Date: 2025-07-28 13:00
// Author: Rolland MELET & Claude Code
// Description: Validateur conformité EPCIS 2.0 pour business steps ProcessMetaLanguage

/**
 * Validateur conformité EPCIS 2.0 pour les business steps ProcessMetaLanguage
 * Vérifie la conformité des templates YAML avec les standards GS1 EPCIS 2.0 et CBV 2.0
 * @class EPCISValidator
 */
class EPCISValidator {
    constructor() {
        this.epcisVersion = "2.0";
        this.cbvVersion = "2.0";
        this.gs1Compliance = true;
        
        // Champs obligatoires selon EPCIS 2.0
        this.mandatoryFields = [
            'business_step_id',
            'business_step_name', 
            'cbv_standard_version',
            'epcis_standard_version',
            'gs1_compliance',
            'description',
            'category',
            'typical_objects',
            'common_dispositions',
            'processmetalanguage_mapping',
            'api_generation',
            'examples',
            'epcis_event_type',
            'validation',
            'gs1_business_context'
        ];
        
        // Catégories autorisées
        this.validCategories = [
            'logistics',
            'manufacturing', 
            'retail',
            'pharmaceutical'
        ];
        
        // Types d'événements EPCIS 2.0
        this.validEventTypes = [
            'ObjectEvent',
            'AggregationEvent', 
            'TransformationEvent',
            'TransactionEvent',
            'AssociationEvent'
        ];
        
        // Actions EPCIS 2.0
        this.validActions = [
            'ADD',
            'OBSERVE',
            'DELETE'
        ];
    }
    
    /**
     * Valide un business step YAML contre les standards EPCIS 2.0
     * @param {Object} businessStep - Objet business step parsé depuis YAML
     * @returns {Object} Résultat validation avec errors et warnings
     * @sideEffect Aucun, validation en lecture seule
     * @example
     * const validator = new EPCISValidator();
     * const result = validator.validateBusinessStep(receivingStep);
     * // Returns: {valid: true, errors: [], warnings: []}
     */
    validateBusinessStep(businessStep) {
        const result = {
            valid: true,
            errors: [],
            warnings: [],
            businessStepId: businessStep.business_step_id || 'unknown'
        };
        
        // Validation champs obligatoires
        this.validateMandatoryFields(businessStep, result);
        
        // Validation versions standards
        this.validateStandardVersions(businessStep, result);
        
        // Validation catégorie
        this.validateCategory(businessStep, result);
        
        // Validation type événement EPCIS
        this.validateEventType(businessStep, result);
        
        // Validation mapping ProcessMetaLanguage
        this.validateProcessMetaLanguageMapping(businessStep, result);
        
        // Validation conformité GS1
        this.validateGS1Compliance(businessStep, result);
        
        result.valid = result.errors.length === 0;
        return result;
    }
    
    /**
     * Valide la présence des champs obligatoires
     * @param {Object} businessStep - Business step à valider
     * @param {Object} result - Objet résultat à modifier
     * @sideEffect Modifie result.errors pour ajouter erreurs détectées
     */
    validateMandatoryFields(businessStep, result) {
        this.mandatoryFields.forEach(field => {
            if (!businessStep[field]) {
                result.errors.push(`Champ obligatoire manquant: ${field}`);
            }
        });
    }
    
    /**
     * Valide les versions des standards EPCIS et CBV
     * @param {Object} businessStep - Business step à valider
     * @param {Object} result - Objet résultat à modifier
     * @sideEffect Modifie result.errors et result.warnings
     */
    validateStandardVersions(businessStep, result) {
        if (businessStep.epcis_standard_version !== this.epcisVersion) {
            result.errors.push(`Version EPCIS incorrecte: attendue ${this.epcisVersion}, trouvée ${businessStep.epcis_standard_version}`);
        }
        
        if (businessStep.cbv_standard_version !== this.cbvVersion) {
            result.errors.push(`Version CBV incorrecte: attendue ${this.cbvVersion}, trouvée ${businessStep.cbv_standard_version}`);
        }
        
        if (businessStep.gs1_compliance !== true) {
            result.warnings.push('Conformité GS1 non activée');
        }
    }
    
    /**
     * Valide la catégorie du business step
     * @param {Object} businessStep - Business step à valider
     * @param {Object} result - Objet résultat à modifier
     */
    validateCategory(businessStep, result) {
        if (!this.validCategories.includes(businessStep.category)) {
            result.errors.push(`Catégorie invalide: ${businessStep.category}. Autorisées: ${this.validCategories.join(', ')}`);
        }
    }
    
    /**
     * Valide le type d'événement EPCIS
     * @param {Object} businessStep - Business step à valider  
     * @param {Object} result - Objet résultat à modifier
     */
    validateEventType(businessStep, result) {
        if (!this.validEventTypes.includes(businessStep.epcis_event_type)) {
            result.errors.push(`Type événement EPCIS invalide: ${businessStep.epcis_event_type}`);
        }
        
        if (businessStep.epcis_action && !this.validActions.includes(businessStep.epcis_action)) {
            result.errors.push(`Action EPCIS invalide: ${businessStep.epcis_action}`);
        }
    }
    
    /**
     * Valide le mapping ProcessMetaLanguage
     * @param {Object} businessStep - Business step à valider
     * @param {Object} result - Objet résultat à modifier
     */
    validateProcessMetaLanguageMapping(businessStep, result) {
        const mapping = businessStep.processmetalanguage_mapping;
        if (!mapping) return;
        
        // Validation action_type
        const validActionTypes = ['primary', 'secondary'];
        if (!validActionTypes.includes(mapping.action_type)) {
            result.errors.push(`Action type ProcessMetaLanguage invalide: ${mapping.action_type}`);
        }
        
        // Validation color_code (format hex)
        if (mapping.color_code && !/^#[0-9A-F]{6}$/i.test(mapping.color_code)) {
            result.errors.push(`Code couleur invalide: ${mapping.color_code} (format #RRGGBB requis)`);
        }
        
        // Validation workflow_position
        const validPositions = ['entry', 'intermediate', 'control', 'exit'];
        if (!validPositions.includes(mapping.workflow_position)) {
            result.errors.push(`Position workflow invalide: ${mapping.workflow_position}`);
        }
    }
    
    /**
     * Valide la conformité GS1 Business Context
     * @param {Object} businessStep - Business step à valider
     * @param {Object} result - Objet résultat à modifier
     */
    validateGS1Compliance(businessStep, result) {
        const context = businessStep.gs1_business_context;
        if (!context) {
            result.warnings.push('Contexte business GS1 manquant');
            return;
        }
        
        // Types source/destination valides selon GS1
        const validTypes = ['location', 'possessing_party', 'owning_party'];
        
        if (context.source_types) {
            context.source_types.forEach(type => {
                if (!validTypes.includes(type)) {
                    result.warnings.push(`Type source GS1 non standard: ${type}`);
                }
            });
        }
        
        if (context.destination_types) {
            context.destination_types.forEach(type => {
                if (!validTypes.includes(type)) {
                    result.warnings.push(`Type destination GS1 non standard: ${type}`);
                }
            });
        }
    }
    
    /**
     * Génère un rapport de conformité pour tous les business steps
     * @param {Array} businessSteps - Array d'objets business step
     * @returns {Object} Rapport complet de conformité
     * @example
     * const report = validator.generateComplianceReport(allBusinessSteps);
     * console.log(`Conformité: ${report.overallCompliance}%`);
     */
    generateComplianceReport(businessSteps) {
        const report = {
            totalBusinessSteps: businessSteps.length,
            validBusinessSteps: 0,
            totalErrors: 0,
            totalWarnings: 0,
            detailedResults: [],
            overallCompliance: 0,
            categoryBreakdown: {},
            commonIssues: {}
        };
        
        businessSteps.forEach(step => {
            const validation = this.validateBusinessStep(step);
            report.detailedResults.push(validation);
            
            if (validation.valid) {
                report.validBusinessSteps++;
            }
            
            report.totalErrors += validation.errors.length;
            report.totalWarnings += validation.warnings.length;
            
            // Analyse par catégorie
            const category = step.category || 'unknown';
            if (!report.categoryBreakdown[category]) {
                report.categoryBreakdown[category] = { total: 0, valid: 0 };
            }
            report.categoryBreakdown[category].total++;
            if (validation.valid) {
                report.categoryBreakdown[category].valid++;
            }
            
            // Issues communes
            validation.errors.forEach(error => {
                report.commonIssues[error] = (report.commonIssues[error] || 0) + 1;
            });
        });
        
        report.overallCompliance = Math.round(
            (report.validBusinessSteps / report.totalBusinessSteps) * 100
        );
        
        return report;
    }
}

module.exports = EPCISValidator;

// <!-- END OF FILE: epcis-validator.js -->