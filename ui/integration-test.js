// <!-- START OF FILE: integration-test.js -->
// FILENAME: integration-test.js
// Version: 1.0.0
// Date: 2025-07-28 17:45
// Author: Rolland MELET & Claude Code
// Description: Tests d'intégration pour Template Selector avec Components Palette

import { ComponentsPalette } from './components-palette.js';
import { TemplateSelector } from './template-selector.js';

/**
 * Suite de tests d'intégration pour le Template Selector EPCIS 2.0
 * Valide le fonctionnement complet avec la Components Palette
 * @class
 */
export class IntegrationTestSuite {
    /**
     * Crée une instance des tests d'intégration
     * @param {Object} testConfig - Configuration des tests
     * @param {boolean} testConfig.autoRun - Lancer automatiquement les tests
     * @param {boolean} testConfig.verbose - Logging détaillé
     * @param {number} testConfig.timeout - Timeout des tests en ms
     * @example
     * const tests = new IntegrationTestSuite({
     *   autoRun: true,
     *   verbose: true,
     *   timeout: 10000
     * });
     */
    constructor(testConfig = {}) {
        this.config = {
            autoRun: testConfig.autoRun || false,
            verbose: testConfig.verbose || true,
            timeout: testConfig.timeout || 10000,
            retries: testConfig.retries || 2
        };
        
        this.results = {
            passed: 0,
            failed: 0,
            skipped: 0,
            errors: [],
            startTime: null,
            endTime: null
        };
        
        this.testInstances = {
            palette: null,
            selector: null,
            mockApp: null,
            mockExcalidrawAPI: null
        };
        
        // Auto-run si configuré
        if (this.config.autoRun) {
            this.runAllTests();
        }
    }
    
    /**
     * Lance tous les tests d'intégration
     * @sideEffect Exécute la suite complète et affiche les résultats
     * @returns {Promise<Object>} Résultats des tests
     * @example
     * const results = await tests.runAllTests();
     * console.log(`Tests passés: ${results.passed}/${results.total}`);
     */
    async runAllTests() {
        this.log('🧪 Démarrage des tests d\'intégration Template Selector', 'info');
        this.results.startTime = Date.now();
        
        try {
            // Setup des mocks
            await this.setupMocks();
            
            // Tests de base
            await this.testTemplateLoading();
            await this.testSearchFunctionality();
            await this.testFilteringSystem();
            await this.testTemplateSelection();
            await this.testPreviewSystem();
            
            // Tests d'intégration
            await this.testPaletteIntegration();
            await this.testTemplateApplication();
            await this.testPerformanceMetrics();
            
            // Tests d'erreur
            await this.testErrorHandling();
            await this.testEdgeCases();
            
        } catch (error) {
            this.log(`❌ Erreur critique dans les tests: ${error.message}`, 'error');
            this.results.errors.push({
                test: 'global',
                error: error.message,
                stack: error.stack
            });
        } finally {
            await this.cleanup();
            this.results.endTime = Date.now();
            this.displayResults();
        }
        
        return this.results;
    }
    
    /**
     * Setup des objets mocks pour les tests
     * @private
     * @sideEffect Initialise les instances mockées
     */
    async setupMocks() {
        this.log('🔧 Setup des mocks...', 'info');
        
        // Mock Obsidian App
        this.testInstances.mockApp = {
            vault: {
                adapter: {
                    fs: {
                        readFile: async (path) => {
                            // Simuler lecture fichiers EPCIS
                            if (path.includes('epcis-unified-index.json')) {
                                return JSON.stringify({
                                    epcis_unified_index: {
                                        metadata: {
                                            total_elements: 66,
                                            total_business_steps: 41,
                                            total_dispositions: 25
                                        }
                                    }
                                });
                            }
                            return '{}';
                        }
                    }
                }
            }
        };
        
        // Mock ExcalidrawAutomate API
        this.testInstances.mockExcalidrawAPI = {
            createElement: (config) => ({
                id: `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                type: config.type,
                x: config.x || 0,
                y: config.y || 0,
                ...config
            }),
            addElementTags: (id, tags) => {
                this.log(`Tags ajoutés à ${id}: ${tags.join(', ')}`, 'debug');
            },
            getExcalidrawAPI: () => ({
                getAppState: () => ({
                    width: 800,
                    height: 600,
                    scrollX: 0,
                    scrollY: 0
                })
            })
        };
        
        this.log('✅ Mocks initialisés', 'success');
    }
    
    /**
     * Test du chargement des templates EPCIS
     * @private
     * @returns {Promise<void>}
     */
    async testTemplateLoading() {
        const testName = 'Template Loading';
        this.log(`🧪 Test: ${testName}`, 'info');
        
        try {
            const selector = new TemplateSelector(this.testInstances.mockApp, {
                templatesPath: './templates/epcis/',
                onSelect: () => {},
                multiSelect: true
            });
            
            // Mock du fetch pour les index
            const originalFetch = global.fetch;
            global.fetch = async (url) => {
                if (url.includes('epcis-unified-index.json')) {
                    return {
                        ok: true,
                        json: async () => ({
                            epcis_unified_index: {
                                metadata: { total_elements: 66 }
                            }
                        })
                    };
                }
                if (url.includes('business-steps-index.json')) {
                    return {
                        ok: true,
                        json: async () => ({
                            business_steps: {
                                receiving: {
                                    category: 'logistics',
                                    description: 'Test receiving',
                                    action_type: 'secondary'
                                }
                            }
                        })
                    };
                }
                return { ok: false };
            };
            
            await selector.loadEPCISIndex();
            await selector.loadTemplates();
            
            global.fetch = originalFetch;
            
            this.assert(selector.templates.size > 0, 'Templates chargés correctement');
            this.assert(selector.epcisIndex !== null, 'Index EPCIS chargé');
            
            this.testPassed(testName);
            
        } catch (error) {
            this.testFailed(testName, error);
        }
    }
    
    /**
     * Test des fonctionnalités de recherche
     * @private
     * @returns {Promise<void>}
     */
    async testSearchFunctionality() {
        const testName = 'Search Functionality';
        this.log(`🔍 Test: ${testName}`, 'info');
        
        try {
            const selector = new TemplateSelector(this.testInstances.mockApp);
            
            // Ajouter des templates de test
            selector.templates.set('receiving', {
                id: 'receiving',
                name: 'receiving',
                type: 'business_step',
                category: 'logistics',
                description: 'Receiving goods from supplier',
                searchableText: 'receiving logistics goods supplier'
            });
            
            selector.templates.set('active', {
                id: 'active',
                name: 'active',
                type: 'disposition',
                category: 'operational',
                description: 'Active operational state',
                searchableText: 'active operational state'
            });
            
            // Test recherche par nom
            selector.searchQuery = 'receiving';
            selector.applyFilters();
            this.assert(selector.filteredTemplates.has('receiving'), 'Recherche par nom fonctionne');
            
            // Test recherche par catégorie
            selector.searchQuery = 'logistics';
            selector.applyFilters();
            this.assert(selector.filteredTemplates.has('receiving'), 'Recherche par catégorie fonctionne');
            
            // Test recherche sans résultat
            selector.searchQuery = 'nonexistent';
            selector.applyFilters();
            this.assert(selector.filteredTemplates.size === 0, 'Recherche sans résultat gérée');
            
            this.testPassed(testName);
            
        } catch (error) {
            this.testFailed(testName, error);
        }
    }
    
    /**
     * Test du système de filtres
     * @private
     * @returns {Promise<void>}
     */
    async testFilteringSystem() {
        const testName = 'Filtering System';
        this.log(`🔧 Test: ${testName}`, 'info');
        
        try {
            const selector = new TemplateSelector(this.testInstances.mockApp);
            
            // Templates de test
            selector.templates.set('receiving', {
                id: 'receiving',
                type: 'business_step',
                category: 'logistics',
                actionType: 'secondary',
                searchableText: 'receiving logistics'
            });
            
            selector.templates.set('active', {
                id: 'active',
                type: 'disposition',
                category: 'operational',
                searchableText: 'active operational'
            });
            
            // Test filtre par type
            selector.activeFilters.type = 'business_step';
            selector.applyFilters();
            this.assert(selector.filteredTemplates.has('receiving') && !selector.filteredTemplates.has('active'), 
                       'Filtre par type fonctionne');
            
            // Test filtre par catégorie
            selector.activeFilters = { category: 'logistics', type: 'all', actionType: 'all' };
            selector.applyFilters();
            this.assert(selector.filteredTemplates.has('receiving'), 'Filtre par catégorie fonctionne');
            
            // Test reset filtres
            selector.resetFilters();
            this.assert(selector.activeFilters.category === 'all', 'Reset filtres fonctionne');
            
            this.testPassed(testName);
            
        } catch (error) {
            this.testFailed(testName, error);
        }
    }
    
    /**
     * Test de la sélection de templates
     * @private
     * @returns {Promise<void>}
     */
    async testTemplateSelection() {
        const testName = 'Template Selection';
        this.log(`✅ Test: ${testName}`, 'info');
        
        try {
            let selectedTemplates = [];
            const selector = new TemplateSelector(this.testInstances.mockApp, {
                onSelect: (templates) => { selectedTemplates = templates; },
                multiSelect: true
            });
            
            // Test sélection simple
            selector.toggleTemplateSelection('receiving');
            this.assert(selector.selectedTemplates.has('receiving'), 'Sélection simple fonctionne');
            
            // Test sélection multiple
            selector.toggleTemplateSelection('active');
            this.assert(selector.selectedTemplates.size === 2, 'Sélection multiple fonctionne');
            
            // Test désélection
            selector.toggleTemplateSelection('receiving');
            this.assert(!selector.selectedTemplates.has('receiving'), 'Désélection fonctionne');
            
            // Test mode single select
            selector.options.multiSelect = false;
            selector.toggleTemplateSelection('receiving');
            selector.toggleTemplateSelection('active');
            this.assert(selector.selectedTemplates.size === 1, 'Mode single select fonctionne');
            
            this.testPassed(testName);
            
        } catch (error) {
            this.testFailed(testName, error);
        }
    }
    
    /**
     * Test du système de preview
     * @private
     * @returns {Promise<void>}
     */
    async testPreviewSystem() {
        const testName = 'Preview System';
        this.log(`👁️ Test: ${testName}`, 'info');
        
        try {
            const selector = new TemplateSelector(this.testInstances.mockApp);
            
            // Créer DOM mock
            document.body.innerHTML = '<div id="template-preview-content"></div>';
            
            const template = {
                id: 'receiving',
                name: 'receiving',
                type: 'business_step',
                category: 'logistics',
                description: 'Test template',
                icon: '🚛',
                color: '#2196F3',
                file: 'receiving.yaml'
            };
            
            selector.previewTemplate(template);
            
            const previewContent = document.getElementById('template-preview-content');
            this.assert(previewContent && previewContent.innerHTML.includes('receiving'), 
                       'Preview génère du contenu');
            this.assert(previewContent.innerHTML.includes('logistics'), 
                       'Preview affiche les métadonnées');
            
            this.testPassed(testName);
            
        } catch (error) {
            this.testFailed(testName, error);
        }
    }
    
    /**
     * Test de l'intégration avec Components Palette
     * @private
     * @returns {Promise<void>}
     */
    async testPaletteIntegration() {
        const testName = 'Palette Integration';
        this.log(`🎨 Test: ${testName}`, 'info');
        
        try {
            const palette = new ComponentsPalette(
                this.testInstances.mockApp,
                this.testInstances.mockExcalidrawAPI,
                { position: 'right', top: 100 }
            );
            
            this.assert(palette.templateSelector instanceof TemplateSelector, 
                       'TemplateSelector intégré dans palette');
            this.assert(typeof palette.showTemplateSelector === 'function', 
                       'Méthode showTemplateSelector disponible');
            this.assert(typeof palette.applyTemplates === 'function', 
                       'Méthode applyTemplates disponible');
            
            // Test raccourci clavier
            this.assert(palette.shortcuts['mod+4'] !== undefined, 
                       'Raccourci Ctrl+4 configuré');
            
            this.testPassed(testName);
            
        } catch (error) {
            this.testFailed(testName, error);
        }
    }
    
    /**
     * Test de l'application des templates
     * @private
     * @returns {Promise<void>}
     */
    async testTemplateApplication() {
        const testName = 'Template Application';
        this.log(`⚡ Test: ${testName}`, 'info');
        
        try {
            const palette = new ComponentsPalette(
                this.testInstances.mockApp,
                this.testInstances.mockExcalidrawAPI
            );
            
            // Mock des créateurs
            let actionCreated = false;
            let stateCreated = false;
            
            palette.actionCreator = {
                createAction: async () => {
                    actionCreated = true;
                    return 'mock_action_id';
                }
            };
            
            palette.stateCreator = {
                createState: async () => {
                    stateCreated = true;
                    return 'mock_state_id';
                }
            };
            
            const templates = [
                { id: 'receiving', type: 'business_step', actionType: 'secondary' },
                { id: 'active', type: 'disposition', isSellable: true }
            ];
            
            await palette.applyTemplates(templates);
            
            this.assert(actionCreated, 'Business step appliqué comme action');
            this.assert(stateCreated, 'Disposition appliquée comme state');
            
            this.testPassed(testName);
            
        } catch (error) {
            this.testFailed(testName, error);
        }
    }
    
    /**
     * Test des métriques de performance
     * @private
     * @returns {Promise<void>}
     */
    async testPerformanceMetrics() {
        const testName = 'Performance Metrics';
        this.log(`⚡ Test: ${testName}`, 'info');
        
        try {
            const startTime = Date.now();
            
            const selector = new TemplateSelector(this.testInstances.mockApp);
            
            // Simuler 66 templates
            for (let i = 0; i < 66; i++) {
                selector.templates.set(`template_${i}`, {
                    id: `template_${i}`,
                    name: `template_${i}`,
                    type: i % 2 === 0 ? 'business_step' : 'disposition',
                    category: 'logistics',
                    searchableText: `template_${i} logistics test`
                });
            }
            
            // Test performance recherche
            const searchStart = Date.now();
            selector.searchQuery = 'logistics';
            selector.applyFilters();
            const searchTime = Date.now() - searchStart;
            
            this.assert(searchTime < 100, `Recherche rapide: ${searchTime}ms < 100ms`);
            this.assert(selector.filteredTemplates.size === 66, 'Tous les templates trouvés');
            
            const totalTime = Date.now() - startTime;
            this.assert(totalTime < 500, `Temps total acceptable: ${totalTime}ms < 500ms`);
            
            this.testPassed(testName);
            
        } catch (error) {
            this.testFailed(testName, error);
        }
    }
    
    /**
     * Test de la gestion d'erreurs
     * @private
     * @returns {Promise<void>}
     */
    async testErrorHandling() {
        const testName = 'Error Handling';
        this.log(`🚨 Test: ${testName}`, 'info');
        
        try {
            // Test avec path invalide
            const selector = new TemplateSelector(this.testInstances.mockApp, {
                templatesPath: './invalid/path/',
                onSelect: () => {}
            });
            
            // Mock fetch qui échoue
            const originalFetch = global.fetch;
            global.fetch = async () => {
                throw new Error('Network error');
            };
            
            let errorCaught = false;
            try {
                await selector.loadEPCISIndex();
            } catch (error) {
                errorCaught = true;
            }
            
            global.fetch = originalFetch;
            
            this.assert(errorCaught, 'Erreur réseau gérée correctement');
            
            // Test application templates vides
            const palette = new ComponentsPalette(
                this.testInstances.mockApp,
                this.testInstances.mockExcalidrawAPI
            );
            
            await palette.applyTemplates([]);
            await palette.applyTemplates(null);
            
            this.testPassed(testName);
            
        } catch (error) {
            this.testFailed(testName, error);
        }
    }
    
    /**
     * Test des cas limites
     * @private
     * @returns {Promise<void>}
     */
    async testEdgeCases() {
        const testName = 'Edge Cases';
        this.log(`🔍 Test: ${testName}`, 'info');
        
        try {
            const selector = new TemplateSelector(this.testInstances.mockApp);
            
            // Test recherche avec caractères spéciaux
            selector.searchQuery = 'test-_.*+?^${}()|[]\\';
            selector.applyFilters();
            
            // Test sélection template inexistant
            selector.toggleTemplateSelection('nonexistent_template');
            
            // Test double show/hide
            selector.isVisible = false;
            await selector.show();
            await selector.show(); // Double show
            selector.hide();
            selector.hide(); // Double hide
            
            // Test destruction
            selector.destroy();
            selector.destroy(); // Double destroy
            
            this.testPassed(testName);
            
        } catch (error) {
            this.testFailed(testName, error);
        }
    }
    
    /**
     * Nettoie les ressources après les tests
     * @private
     * @sideEffect Nettoie les instances et le DOM
     */
    async cleanup() {
        this.log('🧹 Nettoyage des ressources de test...', 'info');
        
        // Nettoyer les instances
        if (this.testInstances.selector) {
            this.testInstances.selector.destroy();
        }
        
        // Nettoyer le DOM
        document.body.innerHTML = '';
        
        // Nettoyer les styles injectés
        const styles = document.getElementById('template-selector-styles');
        if (styles) {
            styles.remove();
        }
        
        this.log('✅ Nettoyage terminé', 'success');
    }
    
    /**
     * Affiche les résultats finaux des tests
     * @private
     * @sideEffect Affiche un rapport détaillé dans la console
     */
    displayResults() {
        const total = this.results.passed + this.results.failed + this.results.skipped;
        const duration = this.results.endTime - this.results.startTime;
        const successRate = total > 0 ? (this.results.passed / total * 100).toFixed(1) : 0;
        
        console.log('\n' + '='.repeat(60));
        console.log('🧪 RAPPORT DE TESTS - TEMPLATE SELECTOR EPCIS 2.0');
        console.log('='.repeat(60));
        console.log(`📊 Résultats: ${this.results.passed}/${total} tests passés (${successRate}%)`);
        console.log(`⏱️  Durée: ${duration}ms`);
        console.log(`✅ Succès: ${this.results.passed}`);
        console.log(`❌ Échecs: ${this.results.failed}`);
        console.log(`⏭️  Ignorés: ${this.results.skipped}`);
        
        if (this.results.errors.length > 0) {
            console.log('\n❌ ERREURS DÉTECTÉES:');
            this.results.errors.forEach((error, index) => {
                console.log(`${index + 1}. ${error.test}: ${error.error}`);
            });
        }
        
        console.log('\n' + (this.results.failed === 0 ? '🎉 TOUS LES TESTS PASSÉS!' : '⚠️  DES TESTS ONT ÉCHOUÉ'));
        console.log('='.repeat(60) + '\n');
    }
    
    /**
     * Utilitaire d'assertion pour les tests
     * @private
     * @param {boolean} condition - Condition à vérifier
     * @param {string} message - Message descriptif
     */
    assert(condition, message) {
        if (!condition) {
            throw new Error(`Assertion failed: ${message}`);
        }
        this.log(`  ✓ ${message}`, 'debug');
    }
    
    /**
     * Marque un test comme réussi
     * @private
     * @param {string} testName - Nom du test
     */
    testPassed(testName) {
        this.results.passed++;
        this.log(`✅ ${testName} - PASSÉ`, 'success');
    }
    
    /**
     * Marque un test comme échoué
     * @private
     * @param {string} testName - Nom du test
     * @param {Error} error - Erreur rencontrée
     */
    testFailed(testName, error) {
        this.results.failed++;
        this.results.errors.push({
            test: testName,
            error: error.message,
            stack: error.stack
        });
        this.log(`❌ ${testName} - ÉCHOUÉ: ${error.message}`, 'error');
    }
    
    /**
     * Utilitaire de logging avec niveaux
     * @private
     * @param {string} message - Message à logger
     * @param {string} level - Niveau de log
     */
    log(message, level = 'info') {
        if (!this.config.verbose && level === 'debug') return;
        
        const timestamp = new Date().toLocaleTimeString();
        const prefix = {
            'info': 'ℹ️',
            'success': '✅',
            'error': '❌',
            'warn': '⚠️',
            'debug': '🔍'
        }[level] || 'ℹ️';
        
        console.log(`[${timestamp}] ${prefix} ${message}`);
    }
}

// Export pour utilisation directe
if (typeof window !== 'undefined') {
    window.IntegrationTestSuite = IntegrationTestSuite;
}

// Auto-run en mode développement
if (typeof window !== 'undefined' && window.location?.search?.includes('auto-test')) {
    window.addEventListener('load', () => {
        const tests = new IntegrationTestSuite({ autoRun: true });
    });
}

// <!-- END OF FILE: integration-test.js -->