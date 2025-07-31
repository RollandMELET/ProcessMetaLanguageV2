// <!-- START OF FILE: workflow-compiler-integration.js -->
// FILENAME: workflow-compiler-integration.js
// Version: 1.0.0
// Date: 2025-07-31 18:20
// Author: Rolland MELET & Claude Code
// Description: Exemples intégration compilateur workflow ProcessMetaLanguage - TASK-B012 Phase 5 génération documentation finale

/**
 * Module ProcessMetaLanguage - Workflow Compiler Integration Examples
 * 
 * Exemples d'utilisation du compilateur de workflow ProcessMetaLanguage.
 * Montre comment compiler une architecture complète en documentation finale.
 * 
 * Exemples fournis:
 * 1. Compilation workflow simple avec documentation markdown
 * 2. Compilation avec spécifications OpenAPI 3.0 intégrées
 * 3. Compilation avec mappings système (EPCIS, SAP, Odoo)
 * 4. Compilation avec validations et optimisations
 * 5. Export multi-format (Markdown, JSON, YAML, HTML)
 * 6. Compilation incrémentale avec cache
 * 7. Compilation avec métriques et audit qualité
 */

import { WorkflowCompiler } from '../export/workflow-compiler.js';
import { TemplateManager } from '../core/template-manager.js';
import { CanvasReader } from '../sync/canvas-reader.js';

/**
 * Exemple 1: Compilation workflow simple avec documentation markdown
 * Démonstration de compilation basique vers documentation markdown
 */
export async function example1_SimpleWorkflowCompilation() {
    console.log('\n=== EXEMPLE 1: Compilation Workflow Simple avec Documentation Markdown ===\n');
    
    try {
        // Initialiser le compilateur
        const compiler = new WorkflowCompiler({
            outputFormat: 'markdown',
            enableValidation: true,
            includeMetrics: true
        });
        
        await compiler.initialize();
        
        // Configuration de compilation simple
        const compilationConfig = {
            projectName: 'Processus Logistique Simple',
            projectDescription: 'Workflow de réception et expédition de marchandises',
            
            // Sources à compiler
            sources: {
                canvasFiles: [
                    './examples/simple-workflow.excalidraw'
                ],
                markdownFiles: [
                    './docs/generated/process-*.md'
                ],
                templateFiles: [
                    './templates/epcis/business-steps/receiving.yaml',
                    './templates/epcis/business-steps/shipping.yaml'
                ]
            },
            
            // Configuration de sortie
            output: {
                directory: './docs/compiled',
                filename: 'simple-workflow-documentation.md',
                includeTableOfContents: true,
                includeDiagrams: true,
                includeMetadata: true
            }
        };
        
        console.log('🔧 Compilation workflow simple...');
        
        // Compiler le workflow
        const compilationResult = await compiler.compileWorkflow(compilationConfig);
        
        console.log('✅ Compilation terminée avec succès');
        console.log(`📄 Documentation générée: ${compilationResult.outputPath}`);
        console.log(`📊 Éléments compilés: ${compilationResult.elementsProcessed}`);
        console.log(`⏱️ Temps de compilation: ${compilationResult.compilationTime}ms`);
        
        // Validation automatique
        if (compilationResult.validation.isValid) {
            console.log('✅ Validation réussie - documentation conforme');
        } else {
            console.log('⚠️ Issues de validation détectées:');
            compilationResult.validation.issues.forEach(issue => {
                console.log(`  - ${issue.type}: ${issue.message}`);
            });
        }
        
        // Afficher résumé de la compilation
        console.log('\n📋 Résumé de compilation:');
        console.log(`- Objects traités: ${compilationResult.summary.objects}`);
        console.log(`- States traités: ${compilationResult.summary.states}`);
        console.log(`- Actions traitées: ${compilationResult.summary.actions}`);
        console.log(`- Templates utilisés: ${compilationResult.summary.templates}`);
        
        return compilationResult;
        
    } catch (error) {
        console.error('❌ Erreur compilation simple:', error);
        throw error;
    }
}

/**
 * Exemple 2: Compilation avec spécifications OpenAPI 3.0 intégrées
 * Génération de documentation avec spécifications API complètes
 */
export async function example2_CompilationWithOpenAPI() {
    console.log('\n=== EXEMPLE 2: Compilation avec Spécifications OpenAPI 3.0 ===\n');
    
    try {
        const compiler = new WorkflowCompiler({
            outputFormat: 'multi',
            enableOpenAPIGeneration: true,
            apiVersion: '3.0.3'
        });
        
        await compiler.initialize();
        
        const compilationConfig = {
            projectName: 'API Traçabilité Avancée',
            projectDescription: 'Système de traçabilité industrielle avec API REST complète',
            
            sources: {
                canvasFiles: [
                    './examples/advanced-traceability.excalidraw'
                ],
                markdownFiles: [
                    './docs/generated/traceability-*.md'
                ],
                templateFiles: [
                    './templates/epcis/**/*.yaml'
                ]
            },
            
            // Configuration API
            apiConfiguration: {
                baseUrl: 'https://api.360smartconnect.com/v1',
                title: 'ProcessMetaLanguage Traceability API',
                description: 'API RESTful pour système de traçabilité industrielle',
                version: '1.0.0',
                
                // Authentification
                authentication: {
                    type: 'bearer',
                    description: 'JWT Bearer token required'
                },
                
                // Endpoints à générer
                generateEndpoints: {
                    objects: true,      // CRUD objects
                    states: true,       // Gestion états
                    actions: true,      // Exécution actions
                    workflows: true,    // Orchestration workflows
                    reports: true       // Rapports et métriques
                },
                
                // Modèles de données
                includeSchemas: true,
                validateSchemas: true
            },
            
            output: {
                directory: './docs/api-docs',
                formats: ['markdown', 'openapi-json', 'openapi-yaml', 'html'],
                includePostmanCollection: true,
                includeSDKExamples: ['javascript', 'python', 'curl']
            }
        };
        
        console.log('🔧 Compilation avec génération OpenAPI...');
        
        const compilationResult = await compiler.compileWorkflow(compilationConfig);
        
        console.log('✅ Compilation API terminée');
        console.log(`📄 Documentation: ${compilationResult.outputs.markdown}`);
        console.log(`🔗 Spec OpenAPI JSON: ${compilationResult.outputs.openapi}`);
        console.log(`📧 Collection Postman: ${compilationResult.outputs.postman}`);
        
        // Afficher endpoints générés
        console.log('\n🔗 Endpoints API générés:');
        compilationResult.apiSpec.endpoints.forEach(endpoint => {
            console.log(`  ${endpoint.method.toUpperCase()} ${endpoint.path} - ${endpoint.description}`);
        });
        
        // Afficher schémas de données
        console.log('\n📊 Schémas de données:');
        Object.keys(compilationResult.apiSpec.schemas).forEach(schema => {
            console.log(`  - ${schema}: ${compilationResult.apiSpec.schemas[schema].properties.length} propriétés`);
        });
        
        return compilationResult;
        
    } catch (error) {
        console.error('❌ Erreur compilation OpenAPI:', error);
        throw error;
    }
}

/**
 * Exemple 3: Compilation avec mappings système (EPCIS, SAP, Odoo)
 * Génération de correspondances vers systèmes externes
 */
export async function example3_CompilationWithSystemMappings() {
    console.log('\n=== EXEMPLE 3: Compilation avec Mappings Système ===\n');
    
    try {
        const compiler = new WorkflowCompiler({
            outputFormat: 'multi',
            enableSystemMappings: true,
            includeImplementationGuides: true
        });
        
        await compiler.initialize();
        
        const compilationConfig = {
            projectName: 'Intégration Système Complète',
            projectDescription: 'Workflow avec mappings vers EPCIS, SAP et Odoo',
            
            sources: {
                canvasFiles: ['./examples/enterprise-workflow.excalidraw'],
                markdownFiles: ['./docs/generated/enterprise-*.md'],
                templateFiles: ['./templates/epcis/**/*.yaml']
            },
            
            // Configuration mappings système
            systemMappings: {
                epcis: {
                    enabled: true,
                    version: '2.0',
                    compliance: ['CBV-2.0', 'GS1-Digital-Link'],
                    
                    mappings: {
                        objects: 'epc_list',
                        states: 'disposition',
                        actions: 'business_step',
                        locations: 'read_point',
                        timestamps: 'event_time'
                    },
                    
                    generateValidation: true,
                    includeExamples: true
                },
                
                sap: {
                    enabled: true,
                    modules: ['MM', 'WM', 'PP'],
                    
                    mappings: {
                        objects: 'MARA.MATNR',
                        states: 'MCHB.SOBKZ',  
                        actions: 'BAPI_functions',
                        locations: 'T001L.LGORT'
                    },
                    
                    generateABAP: true,
                    includeIDocs: true
                },
                
                odoo: {
                    enabled: true,
                    version: '16.0',
                    modules: ['stock', 'mrp', 'purchase', 'sale'],
                    
                    mappings: {
                        objects: 'product.product',
                        states: 'stock.quant',
                        actions: 'stock.move',
                        locations: 'stock.location'
                    },
                    
                    generatePython: true,
                    includeXMLViews: true
                },
                
                // Système 360SmartConnect  
                smartconnect: {
                    enabled: true,
                    
                    mappings: {
                        objects: 'Avatar.entity',
                        states: 'Avatar.metadata.status',
                        actions: 'Workflow.action',
                        relations: 'Avatar.relations'
                    },
                    
                    generateAPI: true,
                    includeWebhooks: true
                }
            },
            
            output: {
                directory: './docs/system-mappings',
                generateImplementationGuides: true,
                includeTestData: true,
                includeValidationRules: true
            }
        };
        
        console.log('🔧 Compilation avec mappings système...');
        
        const compilationResult = await compiler.compileWorkflow(compilationConfig);
        
        console.log('✅ Compilation mappings terminée');
        
        // Afficher mappings générés
        console.log('\n🗺️ Mappings système générés:');
        for (const [system, mapping] of Object.entries(compilationResult.mappings)) {
            console.log(`\n📋 ${system.toUpperCase()}:`);
            console.log(`  - Guide implémentation: ${mapping.implementationGuide}`);
            console.log(`  - Exemples de code: ${mapping.codeExamples.length} fichiers`);
            console.log(`  - Règles de validation: ${mapping.validationRules.length} règles`);
            
            if (mapping.testData) {
                console.log(`  - Données de test: ${mapping.testData.length} échantillons`);
            }
        }
        
        // Afficher métriques de compatibilité
        console.log('\n📊 Métriques de compatibilité:');
        console.log(`- Couverture EPCIS: ${compilationResult.compatibility.epcis.coverage}%`);
        console.log(`- Conformité GS1: ${compilationResult.compatibility.epcis.gs1Compliant ? '✅' : '❌'}`);
        console.log(`- Modules SAP couverts: ${compilationResult.compatibility.sap.modulesCovered}/3`);
        console.log(`- APIs Odoo utilisées: ${compilationResult.compatibility.odoo.apisUsed.length}`);
        
        return compilationResult;
        
    } catch (error) {
        console.error('❌ Erreur compilation mappings:', error);
        throw error;
    }
}

/**
 * Exemple 4: Compilation avec validations et optimisations
 * Compilation avec validation complète et optimisations de performance
 */
export async function example4_CompilationWithValidationAndOptimization() {
    console.log('\n=== EXEMPLE 4: Compilation avec Validations et Optimisations ===\n');
    
    try {
        const compiler = new WorkflowCompiler({
            outputFormat: 'optimized',
            enableAdvancedValidation: true,
            enablePerformanceOptimization: true,
            enableQualityMetrics: true
        });
        
        await compiler.initialize();
        
        const compilationConfig = {
            projectName: 'Workflow Optimisé et Validé',
            projectDescription: 'Processus avec validation complète et optimisations',
            
            sources: {
                canvasFiles: ['./examples/complex-workflow.excalidraw'],
                markdownFiles: ['./docs/generated/complex-*.md'],
                templateFiles: ['./templates/**/*.yaml']
            },
            
            // Configuration validation
            validation: {
                enableArchitectureValidation: true,
                enableEPCISCompliance: true,
                enablePerformanceAnalysis: true,
                enableSecurityAudit: true,
                
                rules: {
                    maxWorkflowDepth: 5,
                    maxActionsPerState: 10,
                    requireMainAction: true,
                    validateStateTransitions: true,
                    checkCircularDependencies: true
                },
                
                qualityThresholds: {
                    minDocumentationCoverage: 80,
                    maxComplexityScore: 15,
                    minTestCoverage: 70
                }
            },
            
            // Configuration optimisations
            optimization: {
                enableWorkflowOptimization: true,
                enableCaching: true,
                enableCompression: true,
                
                strategies: {
                    removeRedundantStates: true,
                    mergeCompatibleActions: true,
                    optimizeTransitionPaths: true,
                    generateOptimalSequences: true
                },
                
                performance: {
                    targetResponseTime: 500,     // ms
                    maxMemoryUsage: 256,         // MB
                    enableParallelization: true
                }
            },
            
            output: {
                directory: './docs/optimized',
                includeValidationReport: true,
                includeOptimizationReport: true,
                includeQualityMetrics: true,
                generateRecommendations: true
            }
        };
        
        console.log('🔧 Compilation avec validations et optimisations...');
        
        const compilationResult = await compiler.compileWorkflow(compilationConfig);
        
        console.log('✅ Compilation optimisée terminée');
        
        // Afficher résultats validation
        console.log('\n✅ Résultats de validation:');
        const validation = compilationResult.validation;
        console.log(`- Architecture: ${validation.architecture.isValid ? '✅' : '❌'} (${validation.architecture.score}/100)`);
        console.log(`- Conformité EPCIS: ${validation.epcis.isCompliant ? '✅' : '❌'} (${validation.epcis.complianceLevel}%)`);
        console.log(`- Performance: ${validation.performance.meetsTargets ? '✅' : '❌'} (${validation.performance.projectedResponseTime}ms)`);
        console.log(`- Sécurité: ${validation.security.isSecure ? '✅' : '❌'} (${validation.security.riskLevel})`);
        
        if (validation.issues.length > 0) {
            console.log('\n⚠️ Issues identifiées:');
            validation.issues.forEach(issue => {
                console.log(`  - ${issue.severity.toUpperCase()}: ${issue.description}`);
                if (issue.recommendation) {
                    console.log(`    💡 Recommandation: ${issue.recommendation}`);
                }
            });
        }
        
        // Afficher optimisations appliquées
        console.log('\n⚡ Optimisations appliquées:');
        const optimization = compilationResult.optimization;
        console.log(`- États supprimés: ${optimization.removedStates}`);
        console.log(`- Actions fusionnées: ${optimization.mergedActions}`);
        console.log(`- Chemins optimisés: ${optimization.optimizedPaths}`);
        console.log(`- Gain performance estimé: ${optimization.performanceGain}%`);
        console.log(`- Économie mémoire: ${optimization.memorySavings}MB`);
        
        // Afficher métriques qualité
        console.log('\n📊 Métriques de qualité:');
        const quality = compilationResult.quality;
        console.log(`- Score global: ${quality.overallScore}/100`);
        console.log(`- Couverture documentation: ${quality.documentationCoverage}%`);
        console.log(`- Complexité moyenne: ${quality.averageComplexity}/20`);
        console.log(`- Maintenabilité: ${quality.maintainabilityIndex}/100`);
        
        return compilationResult;
        
    } catch (error) {
        console.error('❌ Erreur compilation optimisée:', error);
        throw error;
    }
}

/**
 * Exemple 5: Export multi-format (Markdown, JSON, YAML, HTML)
 * Génération de documentation dans plusieurs formats
 */
export async function example5_MultiFormatExport() {
    console.log('\n=== EXEMPLE 5: Export Multi-Format ===\n');
    
    try {
        const compiler = new WorkflowCompiler({
            outputFormat: 'all',
            enableMultiFormatExport: true,
            enableCustomTemplates: true
        });
        
        await compiler.initialize();
        
        const compilationConfig = {
            projectName: 'Documentation Multi-Format',
            projectDescription: 'Export complet vers tous les formats supportés',
            
            sources: {
                canvasFiles: ['./examples/complete-workflow.excalidraw'],
                markdownFiles: ['./docs/generated/*.md'],
                templateFiles: ['./templates/**/*.yaml']
            },
            
            // Configuration export multi-format
            exportFormats: {
                markdown: {
                    enabled: true,
                    template: 'detailed',
                    includeTableOfContents: true,
                    includeDiagrams: true,
                    generatePDF: true
                },
                
                json: {
                    enabled: true,
                    pretty: true,
                    includeMetadata: true,
                    validateSchema: true
                },
                
                yaml: {
                    enabled: true,
                    includeComments: true,
                    multiDocument: true
                },
                
                html: {
                    enabled: true,
                    template: 'bootstrap',
                    includeCSS: true,
                    includeJavaScript: true,
                    enableInteractivity: true,
                    
                    features: {
                        searchEnabled: true,
                        navigationMenu: true,
                        printOptimized: true,
                        mobileResponsive: true
                    }
                },
                
                xml: {
                    enabled: true,
                    includeXSD: true,
                    validateAgainstSchema: true
                },
                
                excel: {
                    enabled: true,
                    includeWorksheets: ['Objects', 'States', 'Actions', 'Mappings'],
                    includeCharts: true,
                    enableFormulas: true
                },
                
                visio: {
                    enabled: true,
                    includeShapes: true,
                    enableLayers: true
                }
            },
            
            // Templates personnalisés
            customTemplates: {
                markdown: './templates/export/detailed-markdown.hbs',
                html: './templates/export/interactive-html.hbs',
                
                // Template pour rapports exécutifs
                executive: {
                    format: 'html',
                    template: './templates/export/executive-summary.hbs',
                    includeCharts: true,
                    includeMetrics: true
                }
            },
            
            output: {
                directory: './docs/multi-format',
                createSubdirectories: true,
                includeAssets: true,
                generateIndex: true
            }
        };
        
        console.log('🔧 Export multi-format en cours...');
        
        const compilationResult = await compiler.compileWorkflow(compilationConfig);
        
        console.log('✅ Export multi-format terminé');
        
        // Afficher fichiers générés par format
        console.log('\n📁 Fichiers générés par format:');
        for (const [format, files] of Object.entries(compilationResult.outputs)) {
            console.log(`\n📄 ${format.toUpperCase()}:`);
            if (Array.isArray(files)) {
                files.forEach(file => console.log(`  - ${file}`));
            } else {
                console.log(`  - ${files}`);
            }
        }
        
        // Afficher statistiques de génération
        console.log('\n📊 Statistiques de génération:');
        const stats = compilationResult.statistics;
        console.log(`- Formats générés: ${Object.keys(stats.formats).length}`);
        console.log(`- Fichiers totaux: ${stats.totalFiles}`);
        console.log(`- Taille totale: ${(stats.totalSize / 1024 / 1024).toFixed(2)} MB`);
        console.log(`- Temps de génération: ${stats.generationTime}ms`);
        
        // Afficher détails par format
        for (const [format, formatStats] of Object.entries(stats.formats)) {
            console.log(`  • ${format}: ${formatStats.files} fichiers, ${(formatStats.size / 1024).toFixed(2)} KB`);
        }
        
        return compilationResult;
        
    } catch (error) {
        console.error('❌ Erreur export multi-format:', error);
        throw error;
    }
}

/**
 * Exemple 6: Compilation incrémentale avec cache
 * Compilation optimisée pour projets volumineux avec cache intelligent
 */
export async function example6_IncrementalCompilationWithCache() {
    console.log('\n=== EXEMPLE 6: Compilation Incrémentale avec Cache ===\n');
    
    try {
        const compiler = new WorkflowCompiler({
            outputFormat: 'markdown',
            enableIncrementalCompilation: true,
            enableIntelligentCaching: true,
            cacheStrategy: 'hybrid'
        });
        
        await compiler.initialize();
        
        const compilationConfig = {
            projectName: 'Workflow Volumineux avec Cache',
            projectDescription: 'Compilation incrémentale pour gros projets',
            
            sources: {
                canvasFiles: ['./examples/large-workflow.excalidraw'],
                markdownFiles: ['./docs/generated/**/*.md'],
                templateFiles: ['./templates/**/*.yaml']
            },
            
            // Configuration cache
            cache: {
                enabled: true,
                strategy: 'hybrid',           // memory + disk
                maxMemorySize: '256MB',
                maxDiskSize: '1GB',
                
                // Critères d'invalidation
                invalidationRules: {
                    onSourceChange: true,
                    onTemplateChange: true,
                    onConfigChange: true,
                    maxAge: 24 * 60 * 60 * 1000  // 24 heures
                },
                
                // Optimisations cache
                compression: true,
                checksumValidation: true,
                backgroundPreload: true
            },
            
            // Configuration compilation incrémentale  
            incremental: {
                enabled: true,
                
                // Détection changements
                changeDetection: {
                    useFileTimestamps: true,
                    useContentHashing: true,
                    useDependencyTracking: true
                },
                
                // Stratégies de rebuild
                rebuildStrategies: {
                    modifiedOnly: true,        // Recompiler seulement modifiés
                    dependentCascade: true,    // Cascade sur dépendants
                    smartBatching: true        // Batch changements liés
                },
                
                // Parallélisation
                parallelization: {
                    enabled: true,
                    maxWorkers: 4,
                    workloadDistribution: 'balanced'
                }
            },
            
            output: {
                directory: './docs/incremental',
                preserveCache: true,
                generateBuildManifest: true,
                includeChangeLog: true
            }
        };
        
        console.log('🔧 Première compilation (full build)...');
        
        // Première compilation complète
        const startTime = Date.now();
        const initialResult = await compiler.compileWorkflow(compilationConfig);
        const initialTime = Date.now() - startTime;
        
        console.log(`✅ Compilation initiale terminée en ${initialTime}ms`);
        console.log(`💾 Cache initialisé avec ${initialResult.cache.entriesCreated} entrées`);
        
        // Simuler modification de fichiers
        console.log('\n🔄 Simulation modification de fichiers...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Seconde compilation (incrémentale)
        console.log('🔧 Compilation incrémentale...');
        const incrementalStartTime = Date.now();
        const incrementalResult = await compiler.compileWorkflow({
            ...compilationConfig,
            incremental: { ...compilationConfig.incremental, forceIncremental: true }
        });
        const incrementalTime = Date.now() - incrementalStartTime;
        
        console.log(`✅ Compilation incrémentale terminée en ${incrementalTime}ms`);
        
        // Afficher gains de performance
        const speedup = (initialTime / incrementalTime).toFixed(2);
        const cacheHitRate = ((incrementalResult.cache.hits / incrementalResult.cache.total) * 100).toFixed(1);
        
        console.log('\n⚡ Gains de performance:');
        console.log(`- Temps initial: ${initialTime}ms`);
        console.log(`- Temps incrémental: ${incrementalTime}ms`);
        console.log(`- Accélération: ${speedup}x`);
        console.log(`- Taux cache hit: ${cacheHitRate}%`);
        console.log(`- Fichiers recompilés: ${incrementalResult.incremental.filesRecompiled}/${incrementalResult.incremental.totalFiles}`);
        
        // Afficher détails du cache
        console.log('\n💾 Détails du cache:');
        const cacheStats = incrementalResult.cache;
        console.log(`- Entrées en mémoire: ${cacheStats.memoryEntries}`);
        console.log(`- Entrées sur disque: ${cacheStats.diskEntries}`);
        console.log(`- Taille mémoire: ${(cacheStats.memorySize / 1024 / 1024).toFixed(2)} MB`);
        console.log(`- Taille disque: ${(cacheStats.diskSize / 1024 / 1024).toFixed(2)} MB`);
        console.log(`- Ratio compression: ${cacheStats.compressionRatio.toFixed(2)}`);
        
        return { initialResult, incrementalResult, performanceGains: { speedup, cacheHitRate } };
        
    } catch (error) {
        console.error('❌ Erreur compilation incrémentale:', error);
        throw error;
    }
}

/**
 * Exemple 7: Compilation avec métriques et audit qualité
 * Compilation avec analyse complète de qualité et métriques détaillées
 */
export async function example7_CompilationWithQualityAudit() {
    console.log('\n=== EXEMPLE 7: Compilation avec Métriques et Audit Qualité ===\n');
    
    try {
        const compiler = new WorkflowCompiler({
            outputFormat: 'comprehensive',
            enableQualityAudit: true,
            enableDetailedMetrics: true,
            enableRecommendations: true
        });
        
        await compiler.initialize();
        
        const compilationConfig = {
            projectName: 'Audit Qualité Complet',
            projectDescription: 'Workflow avec analyse qualité approfondie',
            
            sources: {
                canvasFiles: ['./examples/quality-audit-workflow.excalidraw'],
                markdownFiles: ['./docs/generated/quality-*.md'],
                templateFiles: ['./templates/**/*.yaml']
            },
            
            // Configuration audit qualité
            qualityAudit: {
                enabled: true,
                
                // Métriques à analyser
                metrics: {
                    complexity: true,           // Complexité cyclomatique
                    maintainability: true,     // Index de maintenabilité
                    documentation: true,       // Couverture documentation
                    consistency: true,         // Cohérence architecture
                    performance: true,         // Métriques performance
                    security: true,            // Audit sécurité
                    compliance: true           // Conformité standards
                },
                
                // Seuils de qualité
                thresholds: {
                    complexityMax: 15,
                    maintainabilityMin: 70,
                    documentationMin: 80,
                    performanceMax: 1000,      // ms
                    securityScoreMin: 85,
                    complianceMin: 90
                },
                
                // Règles d'audit
                auditRules: [
                    'no-orphaned-states',
                    'require-main-actions',
                    'validate-transitions',
                    'check-naming-conventions',
                    'verify-documentation',
                    'validate-epcis-compliance'
                ]
            },
            
            // Configuration métriques détaillées
            detailedMetrics: {
                enabled: true,
                
                categories: {
                    architecture: {
                        depthAnalysis: true,
                        complexityMetrics: true,
                        dependencyAnalysis: true,
                        cohesionMetrics: true
                    },
                    
                    performance: {
                        estimatedExecutionTime: true,
                        memoryUsageProjection: true,
                        scalabilityAnalysis: true,
                        bottleneckDetection: true
                    },
                    
                    quality: {
                        codeQualityScore: true,
                        documentationQuality: true,
                        testCoverage: true,
                        maintainabilityIndex: true
                    },
                    
                    business: {
                        businessValueScore: true,
                        riskAssessment: true,
                        complianceLevel: true,
                        implementationComplexity: true
                    }
                },
                
                // Génération de rapports
                generateReports: {
                    executiveSummary: true,
                    technicalDetails: true,
                    recommendations: true,
                    actionPlan: true
                }
            },
            
            output: {
                directory: './docs/quality-audit',
                generateDashboard: true,
                includeInteractiveReports: true,
                exportMetricsData: true
            }
        };
        
        console.log('🔧 Compilation avec audit qualité...');
        
        const compilationResult = await compiler.compileWorkflow(compilationConfig);
        
        console.log('✅ Audit qualité terminé');
        
        // Afficher score global de qualité
        const qualityScore = compilationResult.quality.overallScore;
        const qualityGrade = qualityScore >= 90 ? 'A' : qualityScore >= 80 ? 'B' : qualityScore >= 70 ? 'C' : qualityScore >= 60 ? 'D' : 'F';
        
        console.log('\n🏆 Score Global de Qualité:');
        console.log(`Score: ${qualityScore}/100 (Grade: ${qualityGrade})`);
        
        // Afficher métriques par catégorie
        console.log('\n📊 Métriques par Catégorie:');
        const categories = compilationResult.metrics.categories;
        
        console.log('\n🏗️ Architecture:');  
        console.log(`  - Complexité: ${categories.architecture.complexity}/20`);
        console.log(`  - Profondeur max: ${categories.architecture.maxDepth} niveaux`);
        console.log(`  - Cohésion: ${categories.architecture.cohesion}%`);
        console.log(`  - Couplage: ${categories.architecture.coupling} (${categories.architecture.coupling < 5 ? 'Faible' : 'Élevé'})`);
        
        console.log('\n⚡ Performance:');
        console.log(`  - Temps exécution estimé: ${categories.performance.estimatedTime}ms`);
        console.log(`  - Utilisation mémoire: ${categories.performance.memoryUsage}MB`);
        console.log(`  - Scalabilité: ${categories.performance.scalabilityScore}/100`);
        console.log(`  - Goulots identifiés: ${categories.performance.bottlenecks.length}`);
        
        console.log('\n📋 Qualité:');
        console.log(`  - Couverture doc: ${categories.quality.documentationCoverage}%`);
        console.log(`  - Index maintenabilité: ${categories.quality.maintainabilityIndex}/100`);
        console.log(`  - Qualité code: ${categories.quality.codeQuality}/100`);
        
        console.log('\n💼 Business:');
        console.log(`  - Valeur métier: ${categories.business.businessValue}/100`);
        console.log(`  - Niveau risque: ${categories.business.riskLevel}`);
        console.log(`  - Conformité: ${categories.business.compliance}%`);
        console.log(`  - Complexité implémentation: ${categories.business.implementationComplexity}/10`);
        
        // Afficher issues et recommandations
        if (compilationResult.audit.issues.length > 0) {
            console.log('\n⚠️ Issues Identifiées:');
            compilationResult.audit.issues.forEach(issue => {
                const icon = issue.severity === 'critical' ? '🔴' : issue.severity === 'major' ? '🟡' : '🔵';
                console.log(`  ${icon} ${issue.severity.toUpperCase()}: ${issue.description}`);
                if (issue.location) {
                    console.log(`     📍 Location: ${issue.location}`);
                }
            });
        }
        
        if (compilationResult.recommendations.length > 0) {
            console.log('\n💡 Recommandations:');
            compilationResult.recommendations.forEach((rec, index) => {
                const priority = rec.priority === 'high' ? '🔥' : rec.priority === 'medium' ? '⚡' : '💡';
                console.log(`  ${priority} ${rec.title}`);
                console.log(`     ${rec.description}`);
                if (rec.estimatedEffort) {
                    console.log(`     ⏱️ Effort estimé: ${rec.estimatedEffort}`);
                }
                if (rec.expectedImpact) {
                    console.log(`     📈 Impact attendu: ${rec.expectedImpact}`);
                }
            });
        }
        
        // Afficher plan d'action
        if (compilationResult.actionPlan) {
            console.log('\n📋 Plan d\'Action Recommandé:');
            compilationResult.actionPlan.phases.forEach((phase, index) => {
                console.log(`\n  Phase ${index + 1}: ${phase.name}`);
                console.log(`  ⏱️ Durée: ${phase.duration}`);
                console.log(`  🎯 Objectif: ${phase.objective}`);
                phase.tasks.forEach(task => {
                    console.log(`    • ${task.name} (${task.effort})`);
                });
            });
        }
        
        return compilationResult;
        
    } catch (error) {
        console.error('❌ Erreur audit qualité:', error);
        throw error;
    }
}

/**
 * Fonction utilitaire pour exécuter tous les exemples
 */
export async function runAllWorkflowCompilerExamples() {
    console.log('\n🚀 EXÉCUTION DE TOUS LES EXEMPLES WORKFLOW COMPILER');
    console.log('===================================================\n');
    
    const examples = [
        example1_SimpleWorkflowCompilation,
        example2_CompilationWithOpenAPI,
        example3_CompilationWithSystemMappings,
        example4_CompilationWithValidationAndOptimization,
        example5_MultiFormatExport,
        example6_IncrementalCompilationWithCache,
        example7_CompilationWithQualityAudit
    ];
    
    const results = [];
    
    for (let i = 0; i < examples.length; i++) {
        try {
            console.log(`\n--- Exemple ${i + 1}/${examples.length} ---`);
            const result = await examples[i]();
            results.push({ example: i + 1, status: 'success', result });
            console.log(`✅ Exemple ${i + 1} exécuté avec succès`);
            
            // Attendre un peu avant exemple suivant
            await new Promise(resolve => setTimeout(resolve, 1000));
            
        } catch (error) {
            results.push({ example: i + 1, status: 'error', error: error.message });
            console.error(`❌ Erreur exemple ${i + 1}:`, error.message);
        }
    }
    
    // Résumé final
    console.log('\n📊 RÉSUMÉ D\'EXÉCUTION:');
    console.log('======================');
    const successful = results.filter(r => r.status === 'success').length;
    const failed = results.filter(r => r.status === 'error').length;
    
    console.log(`✅ Réussis: ${successful}/${examples.length}`);
    console.log(`❌ Échoués: ${failed}/${examples.length}`);
    
    if (failed > 0) {
        console.log('\n❌ Erreurs rencontrées:');
        results.filter(r => r.status === 'error').forEach(r => {
            console.log(`  - Exemple ${r.example}: ${r.error}`);
        });
    }
    
    console.log('\n🎉 Tous les exemples ont été traités !');
    
    return results;
}

// Export ES6 par défaut
export {
    example1_SimpleWorkflowCompilation,
    example2_CompilationWithOpenAPI,
    example3_CompilationWithSystemMappings,
    example4_CompilationWithValidationAndOptimization,
    example5_MultiFormatExport,
    example6_IncrementalCompilationWithCache,
    example7_CompilationWithQualityAudit,
    runAllWorkflowCompilerExamples
};

// Export browser pour utilisation dans Obsidian
if (typeof window !== 'undefined') {
    window.ProcessMetaLanguageWorkflowCompilerIntegration = {
        example1_SimpleWorkflowCompilation,
        example2_CompilationWithOpenAPI,
        example3_CompilationWithSystemMappings,
        example4_CompilationWithValidationAndOptimization,
        example5_MultiFormatExport,
        example6_IncrementalCompilationWithCache,
        example7_CompilationWithQualityAudit,
        runAllWorkflowCompilerExamples
    };
}

// <!-- END OF FILE: workflow-compiler-integration.js -->