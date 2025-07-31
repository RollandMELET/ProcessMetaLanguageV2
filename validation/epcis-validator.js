// <!-- START OF FILE: epcis-validator.js -->
// FILENAME: epcis-validator.js
// Version: 1.0.0
// Date: 2025-08-01 15:35
// Author: Rolland MELET & Claude Code
// Description: EPCIS 2.0 validation module

/**
 * EPCIS 2.0 Validator
 * Validates compliance with GS1 EPCIS 2.0 standards
 * @module EPCISValidator
 */

export class EPCISValidator {
    constructor(settings = {}) {
        this.settings = settings;
        this.businessSteps = this.loadBusinessSteps();
        this.dispositions = this.loadDispositions();
    }
    
    /**
     * Load EPCIS business steps
     * @private
     */
    loadBusinessSteps() {
        return [
            'accepting', 'arriving', 'assembling', 'collecting',
            'commissioning', 'consigning', 'creating_class_instance',
            'cycle_counting', 'decommissioning', 'departing',
            'destroying', 'disassembling', 'dispensing', 'encoding',
            'entering_exiting', 'holding', 'inspecting', 'installing',
            'killing', 'loading', 'other', 'packing', 'picking',
            'placing', 'receiving', 'removing', 'repackaging',
            'repairing', 'replacing', 'reserving', 'retail_selling',
            'sampling', 'sensor_reporting', 'shipping', 'staging_outbound',
            'stock_taking', 'stocking', 'storing', 'transporting',
            'unloading', 'unpacking', 'void_shipping'
        ];
    }
    
    /**
     * Load EPCIS dispositions
     * @private
     */
    loadDispositions() {
        return [
            'active', 'available', 'completeness_inferred',
            'completeness_verified', 'condemned', 'container_closed',
            'container_empty', 'container_open', 'damaged', 'destroyed',
            'dispensed', 'disposed', 'encoded', 'expired',
            'in_progress', 'in_transit', 'inactive', 'mismatch_instance',
            'mismatch_class', 'mismatch_quantity', 'needs_replacement',
            'no_pedigree_match', 'non_conformant', 'non_sellable_other',
            'partially_dispensed', 'recalled', 'reserved', 'retail_sold',
            'returned', 'sellable_accessible', 'sellable_not_accessible',
            'stolen', 'suspect', 'undergoing_analysis', 'unknown',
            'unspecified', 'unsellable_damaged', 'unsellable_expired',
            'unsellable_recalled', 'unsellable_other'
        ];
    }
    
    /**
     * Validate business step
     * @param {string} step - Business step to validate
     * @returns {Object} Validation result
     */
    validateBusinessStep(step) {
        const isValid = this.businessSteps.includes(step);
        return {
            valid: isValid,
            step: step,
            message: isValid ? 'Valid EPCIS business step' : `Invalid business step: ${step}`
        };
    }
    
    /**
     * Validate disposition
     * @param {string} disposition - Disposition to validate
     * @returns {Object} Validation result
     */
    validateDisposition(disposition) {
        const isValid = this.dispositions.includes(disposition);
        return {
            valid: isValid,
            disposition: disposition,
            message: isValid ? 'Valid EPCIS disposition' : `Invalid disposition: ${disposition}`
        };
    }
    
    /**
     * Validate complete process
     * @param {Object} process - Process to validate
     * @returns {Object} Validation result
     */
    validateProcess(process) {
        const errors = [];
        const warnings = [];
        
        // Validate all business steps
        if (process.businessSteps) {
            process.businessSteps.forEach(step => {
                const result = this.validateBusinessStep(step);
                if (!result.valid) {
                    errors.push(result.message);
                }
            });
        }
        
        // Validate all dispositions
        if (process.dispositions) {
            process.dispositions.forEach(disp => {
                const result = this.validateDisposition(disp);
                if (!result.valid) {
                    errors.push(result.message);
                }
            });
        }
        
        return {
            valid: errors.length === 0,
            errors,
            warnings,
            compliance: errors.length === 0 ? 'EPCIS 2.0 Compliant' : 'Non-Compliant'
        };
    }
}

// <!-- END OF FILE: epcis-validator.js -->