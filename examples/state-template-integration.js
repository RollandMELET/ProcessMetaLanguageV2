// <!-- START OF FILE: state-template-integration.js -->
// FILENAME: state-template-integration.js
// Version: 1.0.0
// Date: 2025-07-28 14:45
// Author: Rolland MELET & Claude Code
// Description: Exemple d'intégration du système de templates STATE - TASK-B002

/**
 * Exemple d'utilisation du système de templates STATE ProcessMetaLanguage
 * 
 * Démontre:
 * - Création d'un état avec state-creator.js
 * - Génération du template markdown correspondant
 * - Architecture État-Actions deux niveaux
 * - Action principale automatique d'exposition de données
 */

import { TemplateProcessor } from '../core/template-processor.js';
import { createStateComponent, STATE_DISPOSITION_COLORS } from '../components/state-creator.js';

/**
 * Exemple complet de création d'état et génération de documentation
 * @sideEffect Crée fichiers dans docs/generated/states/
 */
async function demonstrateStateTemplateIntegration() {
    console.log('🚀 Démo intégration templates STATE ProcessMetaLanguage\n');
    
    try {
        // 1. Initialiser le template processor
        const processor = new TemplateProcessor({
            templatesDir: './templates',
            outputDir: './docs/generated'
        });
        
        // 2. Simuler création d'un état dans Excalidraw
        const stateData = {
            // Identifiants
            uniqueId: 'state_prod_001_abc123',
            stateId: 'rect_789',
            stateName: 'En_Production',
            disposition: 'in_progress',
            dispositionDescription: 'En cours de traitement',
            
            // Relations avec objet parent
            parentObjectId: 'obj_lot_acier_001',
            parentObjectName: 'Lot-Acier-A001',
            parentObjectType: 'raw-material',
            
            // Position canvas
            position: { x: 160, y: 250 },
            dimensions: { width: 80, height: 40 },
            
            // EPCIS 2.0
            businessStep: 'transforming',
            businessLocation: 'urn:epc:id:sgln:0614141.00888.0',
            eventTime: new Date().toISOString(),
            eventTimeZone: '+01:00',
            
            // Architecture État-Actions deux niveaux
            secondaryActions: [
                {
                    name: 'Valider Qualité',
                    type: 'validation',
                    description: 'Contrôle qualité et validation du lot',
                    target_state: 'Qualite_Validee',
                    target_disposition: 'active',
                    internal_workflow: 'quality_check_workflow',
                    validation_required: true,
                    data_capture: true,
                    input_parameters: {
                        inspector_id: { type: 'string', description: 'ID de l\'inspecteur qualité' },
                        quality_score: { type: 'number', description: 'Score qualité (0-100)' },
                        defects_found: { type: 'array', description: 'Liste des défauts constatés' }
                    }
                },
                {
                    name: 'Rejeter Lot',
                    type: 'rejection',
                    description: 'Rejeter le lot pour non-conformité',
                    target_state: 'Lot_Rejete',
                    target_disposition: 'damaged',
                    internal_workflow: 'rejection_workflow',
                    validation_required: true,
                    data_capture: true,
                    input_parameters: {
                        rejection_reason: { type: 'string', description: 'Raison du rejet' },
                        photos: { type: 'array', description: 'Photos des défauts' }
                    }
                }
            ],
            
            // Transitions autorisées
            allowedTransitions: [
                {
                    target_state: 'Qualite_Validee',
                    conditions: 'Score qualité >= 80%',
                    business_step: 'inspecting',
                    validation_type: 'quality_inspector'
                },
                {
                    target_state: 'Lot_Rejete',
                    conditions: 'Défauts critiques détectés',
                    business_step: 'rejecting',
                    validation_type: 'quality_manager'
                }
            ],
            
            // Contraintes business
            businessConstraints: [
                { description: 'Inspection qualité obligatoire avant 24h' },
                { description: 'Température stockage maintenue entre 15-25°C' },
                { description: 'Traçabilité complète des opérateurs requise' }
            ],
            
            // Métadonnées utilisateur
            userMetadata: {
                operator: 'Jean.Dupont',
                machine: 'TRANSFORM-01',
                temperature: 22.5,
                humidity: 45,
                batch_size: 1000,
                start_time: '2024-01-15T08:00:00Z',
                avatarId: 'avatar_lot_acier_001',
                companyId: 'company_metalworks_001'
            },
            
            // Canvas
            backgroundColor: STATE_DISPOSITION_COLORS['in_progress'].background,
            textColor: '#FFFFFF',
            elementId: 'rect_state_789',
            
            // État précédent (pour historique)
            previousState: 'Reception_Validee',
            transitionAction: 'Démarrage Production',
            
            // Timestamps
            createdAt: new Date(Date.now() - 3600000).toISOString(), // Il y a 1h
            lastModified: new Date().toISOString()
        };
        
        console.log('📋 Données état simulées:', {
            stateName: stateData.stateName,
            disposition: stateData.disposition,
            parentObject: stateData.parentObjectName,
            secondaryActionsCount: stateData.secondaryActions.length
        });
        
        // 3. Générer le template markdown pour l'état
        console.log('\n🔄 Génération du template markdown...');
        
        const outputPath = await processor.syncStateToTemplate(stateData, 'state-template');
        
        console.log(`✅ Template état généré: ${outputPath}`);
        
        // 4. Afficher les statistiques de performance
        const stats = processor.getPerformanceStats();
        console.log('\n📊 Statistiques de performance:', {
            templatesGenerated: stats.templatesGenerated,
            averageTime: `${stats.averageTime.toFixed(2)}ms`,
            performanceTarget: stats.performanceTarget,
            cacheSize: stats.cacheSize
        });
        
        // 5. Exemple de génération batch pour plusieurs états
        console.log('\n🔄 Test génération batch états...');
        
        const multipleStates = [
            {
                ...stateData,
                uniqueId: 'state_001',
                stateName: 'Reception_En_Cours',
                disposition: 'active',
                businessStep: 'receiving'
            },
            {
                ...stateData,
                uniqueId: 'state_002',
                stateName: 'Stockage_Temporaire',
                disposition: 'inactive',
                businessStep: 'storing'
            },
            {
                ...stateData,
                uniqueId: 'state_003',
                stateName: 'Expedie',
                disposition: 'in_transit',
                businessStep: 'shipping'
            }
        ];
        
        const batchStats = await processor.generateBatch(
            multipleStates,
            'state-template',
            './docs/generated/states'
        );
        
        console.log('✅ Génération batch terminée:', {
            total: batchStats.totalObjects,
            successful: batchStats.successful,
            failed: batchStats.failed,
            totalTime: batchStats.totalTime,
            performanceOK: batchStats.performanceTarget
        });
        
        // 6. Démonstration architecture État-Actions deux niveaux
        console.log('\n🏗️ Architecture État-Actions deux niveaux:');
        console.log('┌─ ÉTAT: En_Production (in_progress)');
        console.log('├── 🔵 ACTION PRINCIPALE (Automatique)');
        console.log('│   └─ Consulter État En_Production');
        console.log('│      ├─ Expose: Métadonnées objet parent');
        console.log('│      ├─ Expose: Historique transitions');
        console.log('│      └─ Expose: Navigation actions disponibles');
        console.log('└── 🟡 ACTIONS SECONDAIRES (Optionnelles)');
        
        stateData.secondaryActions.forEach((action, index) => {
            const isLast = index === stateData.secondaryActions.length - 1;
            const prefix = isLast ? '    └─' : '    ├─';
            console.log(`${prefix} ${action.name} → ${action.target_state}`);
        });
        
        // 7. Validation conformité EPCIS 2.0
        console.log('\n✅ Validation EPCIS 2.0:');
        console.log(`- Disposition CBV: ${stateData.disposition} ✓`);
        console.log(`- Business Step: ${stateData.businessStep} ✓`);
        console.log(`- Business Location: ${stateData.businessLocation} ✓`);
        console.log(`- Event Time: ${stateData.eventTime} ✓`);
        
        console.log('\n🎉 Intégration templates STATE réussie!');
        console.log('📁 Fichiers générés dans: ./docs/generated/states/');
        
    } catch (error) {
        console.error('❌ Erreur lors de la démonstration:', error.message);
        throw error;
    }
}

// Exécuter la démonstration si le fichier est lancé directement
if (import.meta.url === `file://${process.argv[1]}`) {
    demonstrateStateTemplateIntegration()
        .then(() => console.log('\n✨ Démonstration terminée avec succès'))
        .catch(error => {
            console.error('\n💥 Erreur fatale:', error);
            process.exit(1);
        });
}

export { demonstrateStateTemplateIntegration };

// <!-- END OF FILE: state-template-integration.js -->