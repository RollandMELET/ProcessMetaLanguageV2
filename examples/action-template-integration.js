// <!-- START OF FILE: action-template-integration.js -->
// FILENAME: action-template-integration.js
// Version: 1.0.0
// Date: 2025-07-28 16:00
// Author: Rolland MELET & Claude Code
// Description: Exemple d'intégration du système de templates ACTION - TASK-B003

/**
 * Exemple d'utilisation du système de templates ACTION ProcessMetaLanguage
 * 
 * Démontre:
 * - Création d'actions avec action-creator.js
 * - Génération du template markdown correspondant  
 * - Paramètres d'entrée/sortie complexes
 * - Workflow interne avec étapes et rollback
 * - Spécifications API complètes
 */

import { TemplateProcessor } from '../core/template-processor.js';
import { createActionComponent } from '../components/action-creator.js';

/**
 * Exemple complet de création d'action et génération de documentation
 * @sideEffect Crée fichiers dans docs/generated/actions/
 */
async function demonstrateActionTemplateIntegration() {
    console.log('🚀 Démo intégration templates ACTION ProcessMetaLanguage\n');
    
    try {
        // 1. Initialiser le template processor
        const processor = new TemplateProcessor({
            templatesDir: './templates',
            outputDir: './docs/generated'
        });
        
        // 2. Simuler création d'une action secondaire complexe
        const complexActionData = {
            // Identifiants
            uniqueId: 'action_quality_validation_001',
            actionId: 'rect_action_456',
            actionName: 'Valider_Qualite_Lot',
            actionType: 'secondary_action',
            actionCategory: 'validation',
            
            // Relations
            parentStateId: 'state_production_001',
            parentStateName: 'En_Production',
            parentObjectId: 'obj_lot_acier_001',
            
            // Transitions
            sourceState: 'En_Production',
            targetState: 'Qualite_Validee',
            targetDisposition: 'active',
            
            // Position canvas
            position: { x: 200, y: 150 },
            dimensions: { width: 140, height: 60 },
            
            // EPCIS 2.0
            businessStep: 'inspecting',
            businessLocation: 'urn:epc:id:sgln:0614141.00888.inspection',
            epcisActionType: 'observe',
            eventTime: new Date().toISOString(),
            eventTimeZone: '+01:00',
            
            // Paramètres d'entrée complexes
            inputParameters: {
                required: [
                    {
                        name: 'inspector_id',
                        type: 'string',
                        description: 'Identifiant unique de l\'inspecteur qualité',
                        validation: 'pattern: ^[A-Z][a-z]+\\.[A-Z][a-z]+$',
                        example: 'Marie.Martin'
                    },
                    {
                        name: 'quality_criteria',
                        type: 'object',
                        description: 'Critères de qualité à vérifier',
                        validation: 'required_fields: [dimensions, surface, composition]',
                        example: '{"dimensions": {"tolerance": 0.1}, "surface": {"roughness": "Ra < 3.2"}}'
                    },
                    {
                        name: 'measurement_tools',
                        type: 'array',
                        description: 'Outils de mesure utilisés',
                        validation: 'min_length: 1, allowed_values: [pied_coulisse, micrometre, rugosimetre]',
                        example: '["pied_coulisse", "rugosimetre"]'
                    }
                ],
                optional: [
                    {
                        name: 'notes_inspection',
                        type: 'string',
                        description: 'Notes libres de l\'inspecteur',
                        default: '',
                        example: 'Contrôle standard - Lot conforme aux spécifications'
                    },
                    {
                        name: 'photos_defauts',
                        type: 'array',
                        description: 'Photos des éventuels défauts constatés',
                        default: '[]',
                        example: '["photo_defaut_001.jpg", "photo_surface_002.jpg"]'
                    },
                    {
                        name: 'temperature_ambiante',
                        type: 'number',
                        description: 'Température ambiante lors du contrôle',
                        default: 20,
                        example: '22.5'
                    }
                ]
            },
            
            // Paramètres de sortie
            outputParameters: {
                success: [
                    {
                        name: 'quality_score',
                        type: 'number',
                        description: 'Score qualité global (0-100)',
                        condition: 'always',
                        format: 'float, 1 decimal'
                    },
                    {
                        name: 'validation_result',
                        type: 'object',
                        description: 'Résultat détaillé de la validation',
                        condition: 'inspection_completed',
                        format: '{"status": "pass|fail|warning", "details": {...}}'
                    },
                    {
                        name: 'certification_level',
                        type: 'string',
                        description: 'Niveau de certification obtenu',
                        condition: 'quality_score >= 80',
                        format: 'enum: [A+, A, B+, B, C, REJECTED]'
                    }
                ],
                metadata: [
                    { name: 'validation_timestamp', description: 'Horodatage précis de la validation' },
                    { name: 'inspector_signature', description: 'Signature électronique de l\'inspecteur' },
                    { name: 'measurement_precision', description: 'Précision des mesures effectuées' },
                    { name: 'environmental_conditions', description: 'Conditions environnementales lors du contrôle' }
                ]
            },
            
            // Workflow interne détaillé
            workflowInternal: {
                steps: [
                    {
                        name: 'Vérification prérequis',
                        action: 'validate_prerequisites',
                        description: 'Vérifier que l\'objet est dans l\'état correct et les outils disponibles',
                        condition: 'object.state === "En_Production" && tools.available === true',
                        timeout: 30,
                        error_handling: 'abort_with_message'
                    },
                    {
                        name: 'Initialisation mesures',
                        action: 'initialize_measurements',
                        description: 'Calibrer les outils et préparer l\'environnement de mesure',
                        condition: 'prerequisites_validated === true',
                        timeout: 60,
                        error_handling: 'retry_once'
                    },
                    {
                        name: 'Contrôles dimensionnels',
                        action: 'perform_dimensional_checks',
                        description: 'Effectuer les mesures dimensionnelles selon les critères',
                        condition: 'measurements_initialized === true',
                        timeout: 300,
                        error_handling: 'save_partial_results'
                    },
                    {
                        name: 'Analyse surface',
                        action: 'analyze_surface_quality',
                        description: 'Analyser la qualité de surface et détecter les défauts',
                        condition: 'dimensional_checks_completed === true',
                        timeout: 180,
                        error_handling: 'rollback_to_measurements'
                    },
                    {
                        name: 'Calcul score qualité',
                        action: 'calculate_quality_score',
                        description: 'Calculer le score qualité global basé sur tous les critères',
                        condition: 'all_analyses_completed === true',
                        timeout: 15,
                        error_handling: 'use_default_scoring'
                    },
                    {
                        name: 'Génération rapport',
                        action: 'generate_quality_report',
                        description: 'Générer le rapport de validation avec photos et mesures',
                        condition: 'quality_score_calculated === true',
                        timeout: 45,
                        error_handling: 'manual_report_required'
                    }
                ],
                initial_state: 'En_Production',
                final_state: 'Qualite_Validee',
                intermediate_states: [
                    { name: 'Preparation_Controle', duration: 90 },
                    { name: 'Mesures_En_Cours', duration: 300 },
                    { name: 'Analyse_Resultats', duration: 120 },
                    { name: 'Finalisation_Rapport', duration: 60 }
                ],
                rollback: {
                    supported: true,
                    strategy: 'compensating_actions',
                    compensation_actions: [
                        'reset_measurement_tools',
                        'clear_intermediate_results',
                        'restore_object_state',
                        'notify_quality_manager'
                    ]
                }
            },
            
            // Règles de validation
            validationRules: {
                pre_execution: [
                    {
                        name: 'Inspecteur autorisé',
                        description: 'Vérifier que l\'inspecteur a les certifications requises',
                        rule: 'inspector.certifications.includes("quality_level_2")',
                        error_message: 'Inspecteur non certifié pour ce type de contrôle',
                        severity: 'critical'
                    },
                    {
                        name: 'Outils étalonnés',
                        description: 'Vérifier que tous les outils sont étalonnés et valides',
                        rule: 'tools.every(tool => tool.calibration_date > now - 6_months)',
                        error_message: 'Un ou plusieurs outils nécessitent un étalonnage',
                        severity: 'critical'
                    },
                    {
                        name: 'Conditions environnementales',
                        description: 'Vérifier température et hygrométrie dans les tolérances',
                        rule: 'environment.temperature >= 18 && environment.temperature <= 25 && environment.humidity <= 65',
                        error_message: 'Conditions environnementales hors spécifications',
                        severity: 'warning'
                    }
                ],
                post_execution: [
                    {
                        name: 'Score cohérent',
                        description: 'Vérifier que le score calculé est cohérent avec les mesures',
                        rule: 'quality_score >= 0 && quality_score <= 100 && score_matches_measurements()',
                        failure_action: 'flag_for_manual_review'
                    },
                    {
                        name: 'Rapport complet',
                        description: 'Vérifier que le rapport contient toutes les sections requises',
                        rule: 'report.sections.length >= 5 && report.photos.length >= 2',
                        failure_action: 'request_report_completion'
                    }
                ],
                business_constraints: [
                    { description: 'Contrôle qualité obligatoire avant expédition', type: 'mandatory' },
                    { description: 'Double contrôle requis pour les lots > 500kg', type: 'conditional' },
                    { description: 'Traçabilité complète des mesures pendant 7 ans', type: 'audit' }
                ]
            },
            
            // Spécifications API complètes
            apiSpecifications: {
                method: 'POST',
                endpoint: '/api/avatars/{avatar_id}/actions/validate-quality',
                auth_type: 'Bearer Token',
                auth_scope: 'quality:validate',
                rate_limit: 10,
                request_schema: JSON.stringify({
                    inspector_id: { type: 'string', required: true },
                    quality_criteria: { type: 'object', required: true },
                    measurement_tools: { type: 'array', required: true },
                    notes_inspection: { type: 'string', required: false },
                    photos_defauts: { type: 'array', required: false }
                }, null, 2),
                response_success_schema: JSON.stringify({
                    success: true,
                    data: {
                        quality_score: { type: 'number' },
                        validation_result: { type: 'object' },
                        certification_level: { type: 'string' }
                    },
                    metadata: {
                        validation_timestamp: { type: 'string' },
                        inspector_signature: { type: 'string' }
                    }
                }, null, 2),
                response_error_schema: JSON.stringify({
                    success: false,
                    error: {
                        code: { type: 'string' },
                        message: { type: 'string' },
                        details: { type: 'object' }
                    }
                }, null, 2),
                response_codes: [
                    { code: '200', description: 'Validation réussie' },
                    { code: '400', description: 'Paramètres invalides' },
                    { code: '401', description: 'Authentification requise' },
                    { code: '403', description: 'Permissions insuffisantes' },
                    { code: '409', description: 'Objet dans un état incompatible' },
                    { code: '422', description: 'Données de validation incohérentes' },
                    { code: '500', description: 'Erreur interne du serveur' }
                ]
            },
            
            // Métadonnées utilisateur
            userMetadata: {
                operator: 'Marie.Martin',
                department: 'Quality Control',
                certification_level: 'quality_level_2',
                experience_years: 8,
                last_training: '2024-01-10T09:00:00Z',
                avatarId: 'avatar_lot_acier_001',
                companyId: 'company_metalworks_001'
            },
            
            // Métriques de performance
            metrics: {
                averageExecutionTime: 420000, // 7 minutes
                successRate: 94.5,
                rollbackCount: 3,
                lastOptimization: '2024-01-10T14:30:00Z'
            },
            
            // Canvas
            backgroundColor: '#FF9800', // Orange pour secondary_action
            textColor: '#FFFFFF',
            elementId: 'rect_action_quality_456',
            borderRadius: 8,
            
            // Horodatage
            createdAt: new Date(Date.now() - 7200000).toISOString(), // Il y a 2h
            lastModified: new Date().toISOString(),
            
            // Sécurité
            securityRules: {
                permissions: [
                    {
                        name: 'quality_inspector',
                        description: 'Permission d\'effectuer des contrôles qualité',
                        scope: 'quality:validate',
                        level: 'standard'
                    },
                    {
                        name: 'measurement_tools_access',
                        description: 'Accès aux outils de mesure calibrés',
                        scope: 'tools:use',
                        level: 'certified'
                    }
                ],
                audit_enabled: true,
                logged_data: 'all_parameters,results,execution_time,user_actions',
                log_retention: 2555 // 7 ans en jours
            },
            
            // Tests
            unitTests: [
                {
                    name: 'test_parameter_validation',
                    description: 'Validation des paramètres d\'entrée',
                    status: 'passed',
                    coverage: 98
                },
                {
                    name: 'test_workflow_execution',
                    description: 'Exécution complète du workflow',
                    status: 'passed',
                    coverage: 85
                }
            ],
            integrationTests: [
                {
                    name: 'test_api_integration',
                    description: 'Intégration avec l\'API 360SmartConnect',
                    environment: 'staging',
                    last_result: 'passed'
                }
            ]
        };
        
        console.log('📋 Données action complexe simulées:', {
            actionName: complexActionData.actionName,
            actionType: complexActionData.actionType,
            inputParametersCount: complexActionData.inputParameters.required.length + complexActionData.inputParameters.optional.length,
            workflowStepsCount: complexActionData.workflowInternal.steps.length,
            hasAPI: !!complexActionData.apiSpecifications
        });
        
        // 3. Générer le template markdown pour l'action
        console.log('\n🔄 Génération du template markdown action...');
        
        const outputPath = await processor.syncActionToTemplate(complexActionData, 'action-template');
        
        console.log(`✅ Template action généré: ${outputPath}`);
        
        // 4. Exemple d'action principale (exposition de données)
        console.log('\n🔄 Génération template action principale...');
        
        const mainActionData = {
            uniqueId: 'action_main_data_exposition_001',
            actionName: 'Consulter_Etat_Production',
            actionType: 'main_action',
            actionCategory: 'data_exposition',
            parentStateId: 'state_production_001',
            sourceState: 'En_Production',
            targetState: 'En_Production', // Pas de changement d'état
            inputParameters: {
                required: [],
                optional: [
                    {
                        name: 'detail_level',
                        type: 'string',
                        description: 'Niveau de détail souhaité',
                        default: 'standard',
                        example: 'detailed'
                    }
                ]
            },
            outputParameters: {
                success: [
                    {
                        name: 'object_metadata',
                        type: 'object',
                        description: 'Métadonnées complètes de l\'objet',
                        condition: 'always',
                        format: 'JSON object with full object data'
                    },
                    {
                        name: 'available_actions',
                        type: 'array',
                        description: 'Liste des actions disponibles depuis cet état',
                        condition: 'always',
                        format: 'Array of action objects'
                    }
                ]
            },
            workflowInternal: {
                steps: [
                    {
                        name: 'Récupération données',
                        action: 'fetch_object_data',
                        description: 'Récupérer toutes les données de l\'objet',
                        timeout: 5,
                        error_handling: 'return_cached_data'
                    }
                ],
                initial_state: 'En_Production',
                final_state: 'En_Production'
            },
            userMetadata: {
                automatically_generated: true,
                operator: 'System'
            }
        };
        
        const mainActionPath = await processor.syncActionToTemplate(mainActionData, 'action-template');
        console.log(`✅ Template action principale généré: ${mainActionPath}`);
        
        // 5. Test génération batch pour plusieurs actions
        console.log('\n🔄 Test génération batch actions...');
        
        const multipleActions = [
            {
                ...complexActionData,
                uniqueId: 'action_001',
                actionName: 'Recevoir_Marchandise',
                actionType: 'secondary_action',
                businessStep: 'receiving'
            },
            {
                ...complexActionData,
                uniqueId: 'action_002',
                actionName: 'Stocker_Produit',
                actionType: 'workflow_action',
                businessStep: 'storing'
            },
            {
                ...complexActionData,
                uniqueId: 'action_003',
                actionName: 'Expedier_Commande',
                actionType: 'secondary_action',
                businessStep: 'shipping'
            }
        ];
        
        const batchStats = await processor.generateBatch(
            multipleActions,
            'action-template',
            './docs/generated/actions'
        );
        
        console.log('✅ Génération batch actions terminée:', {
            total: batchStats.totalObjects,
            successful: batchStats.successful,
            failed: batchStats.failed,
            totalTime: batchStats.totalTime,
            performanceOK: batchStats.performanceTarget
        });
        
        // 6. Afficher les statistiques de performance
        const stats = processor.getPerformanceStats();
        console.log('\n📊 Statistiques de performance:', {
            templatesGenerated: stats.templatesGenerated,
            averageTime: `${stats.averageTime.toFixed(2)}ms`,
            performanceTarget: stats.performanceTarget,
            cacheSize: stats.cacheSize
        });
        
        // 7. Démonstration structure ACTION complète
        console.log('\n🏗️ Structure ACTION ProcessMetaLanguage:');
        console.log('┌─ ACTION: Valider_Qualite_Lot (secondary_action)');
        console.log('├── 📥 PARAMÈTRES D\'ENTRÉE');
        console.log('│   ├─ Requis: inspector_id, quality_criteria, measurement_tools');
        console.log('│   └─ Optionnels: notes_inspection, photos_defauts, temperature_ambiante');
        console.log('├── 📤 PARAMÈTRES DE SORTIE');
        console.log('│   ├─ Données: quality_score, validation_result, certification_level');
        console.log('│   └─ Métadonnées: validation_timestamp, inspector_signature');
        console.log('├── ⚙️ WORKFLOW INTERNE');
        console.log('│   ├─ 6 étapes séquentielles avec timeouts');
        console.log('│   ├─ 4 états intermédiaires');
        console.log('│   └─ Support rollback avec actions de compensation');
        console.log('├── ✅ RÈGLES DE VALIDATION');
        console.log('│   ├─ Pré-exécution: inspecteur, outils, environnement');
        console.log('│   ├─ Post-exécution: score, rapport');
        console.log('│   └─ Contraintes business: obligatoire, traçabilité');
        console.log('└── 🌐 SPÉCIFICATIONS API');
        console.log('    ├─ Endpoint: POST /api/avatars/{id}/actions/validate-quality');
        console.log('    ├─ Auth: Bearer Token (scope: quality:validate)');
        console.log('    └─ 7 codes de réponse documentés');
        
        // 8. Validation conformité
        console.log('\n✅ Validation ACTION complète:');
        console.log(`- Paramètres entrée: ${complexActionData.inputParameters.required.length} requis, ${complexActionData.inputParameters.optional.length} optionnels ✓`);
        console.log(`- Workflow: ${complexActionData.workflowInternal.steps.length} étapes avec rollback ✓`);
        console.log(`- API: ${complexActionData.apiSpecifications.response_codes.length} codes réponse ✓`);
        console.log(`- Sécurité: ${complexActionData.securityRules.permissions.length} permissions définies ✓`);
        console.log(`- Tests: ${complexActionData.unitTests.length} tests unitaires ✓`);
        
        console.log('\n🎉 Intégration templates ACTION réussie!');
        console.log('📁 Fichiers générés dans: ./docs/generated/actions/');
        
    } catch (error) {
        console.error('❌ Erreur lors de la démonstration:', error.message);
        throw error;
    }
}

// Exécuter la démonstration si le fichier est lancé directement
if (import.meta.url === `file://${process.argv[1]}`) {
    demonstrateActionTemplateIntegration()
        .then(() => console.log('\n✨ Démonstration terminée avec succès'))
        .catch(error => {
            console.error('\n💥 Erreur fatale:', error);
            process.exit(1);
        });
}

export { demonstrateActionTemplateIntegration };

// <!-- END OF FILE: action-template-integration.js -->