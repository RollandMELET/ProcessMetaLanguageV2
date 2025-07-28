#!/usr/bin/env node
// <!-- START OF FILE: test-ui.js -->
// FILENAME: test-ui.js
// Version: 1.0.0
// Date: 2025-07-28 16:30
// Author: Rolland MELET & Claude Code
// Description: Script d'automatisation des tests UI pour ProcessMetaLanguage

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

/**
 * Configuration des tests UI
 */
const UI_TEST_CONFIG = {
    // Tests unitaires avec Vitest
    unitTests: {
        command: 'npx vitest run tests/ui/',
        description: 'Tests unitaires de la palette',
        timeout: 30000
    },
    
    // Tests E2E avec Playwright
    e2eTests: {
        command: 'npx playwright test tests/ui-e2e/',
        description: 'Tests end-to-end de l\'interface',
        timeout: 60000,
        browsers: ['chromium', 'firefox', 'webkit']
    },
    
    // Tests de performance
    performanceTests: {
        command: 'node scripts/test-performance.js',
        description: 'Tests de performance de l\'interface',
        timeout: 20000,
        metrics: {
            maxCreationTime: 100, // ms
            maxRenderTime: 16,    // ms (60 FPS)
            maxMemoryUsage: 10    // MB
        }
    },
    
    // Tests d'accessibilité
    a11yTests: {
        command: 'npx axe-core tests/ui/test-palette.html',
        description: 'Tests d\'accessibilité WCAG',
        timeout: 15000
    }
};

/**
 * Couleurs pour l'affichage console
 */
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    bold: '\x1b[1m'
};

/**
 * Affiche un message coloré dans la console
 * @param {string} message - Message à afficher
 * @param {string} color - Couleur du message
 */
function colorLog(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Affiche le header du script
 */
function displayHeader() {
    console.clear();
    colorLog('━'.repeat(80), 'cyan');
    colorLog('🧪 PROCESSMETALANGUAGE UI TEST SUITE', 'bold');
    colorLog('━'.repeat(80), 'cyan');
    colorLog('📅 Date: ' + new Date().toLocaleString(), 'blue');
    colorLog('🎯 Objectif: Validation complète de l\'interface utilisateur', 'blue');
    colorLog('━'.repeat(80), 'cyan');
    console.log();
}

/**
 * Vérifie les prérequis pour les tests
 * @returns {Promise<boolean>} True si tous les prérequis sont satisfaits
 */
async function checkPrerequisites() {
    colorLog('🔍 Vérification des prérequis...', 'yellow');
    
    const checks = [
        {
            name: 'Node.js version',
            command: 'node --version',
            validate: (output) => {
                const version = parseInt(output.match(/v(\d+)/)[1]);
                return version >= 16;
            }
        },
        {
            name: 'npm packages',
            command: 'npm list --depth=0',
            validate: (output) => output.includes('@vitest/ui')
        },
        {
            name: 'Fichiers UI présents',
            check: async () => {
                const requiredFiles = [
                    'ui/components-palette.js',
                    'ui/components-palette.css',
                    'ui/palette-plugin-integration.js',
                    'tests/ui/components-palette.test.js'
                ];
                
                for (const file of requiredFiles) {
                    try {
                        await fs.access(file);
                    } catch {
                        throw new Error(`Fichier manquant: ${file}`);
                    }
                }
                return true;
            }
        }
    ];
    
    for (const check of checks) {
        try {
            if (check.command) {
                const { stdout } = await execAsync(check.command);
                if (!check.validate(stdout)) {
                    throw new Error(`Validation échouée: ${check.name}`);
                }
            } else if (check.check) {
                await check.check();
            }
            colorLog(`  ✅ ${check.name}`, 'green');
        } catch (error) {
            colorLog(`  ❌ ${check.name}: ${error.message}`, 'red');
            return false;
        }
    }
    
    console.log();
    return true;
}

/**
 * Exécute les tests unitaires
 * @returns {Promise<{success: boolean, results: Object}>}
 */
async function runUnitTests() {
    colorLog('🔬 Exécution des tests unitaires...', 'yellow');
    
    try {
        const { stdout, stderr } = await execAsync(
            UI_TEST_CONFIG.unitTests.command,
            { timeout: UI_TEST_CONFIG.unitTests.timeout }
        );
        
        // Parser les résultats Vitest
        const testResults = parseVitestResults(stdout);
        
        if (testResults.failed === 0) {
            colorLog(`  ✅ ${testResults.passed} tests passés`, 'green');
            return { success: true, results: testResults };
        } else {
            colorLog(`  ❌ ${testResults.failed} tests échoués sur ${testResults.total}`, 'red');
            console.log(stderr);
            return { success: false, results: testResults };
        }
        
    } catch (error) {
        colorLog(`  ❌ Erreur lors des tests unitaires: ${error.message}`, 'red');
        return { success: false, results: null };
    }
}

/**
 * Parse les résultats de Vitest
 * @param {string} output - Sortie de Vitest
 * @returns {Object} Résultats parsés
 */
function parseVitestResults(output) {
    const passedMatch = output.match(/(\d+) passed/);
    const failedMatch = output.match(/(\d+) failed/);
    const totalMatch = output.match(/Tests\s+(\d+)/);
    
    return {
        passed: passedMatch ? parseInt(passedMatch[1]) : 0,
        failed: failedMatch ? parseInt(failedMatch[1]) : 0,
        total: totalMatch ? parseInt(totalMatch[1]) : 0
    };
}

/**
 * Exécute les tests de performance
 * @returns {Promise<{success: boolean, metrics: Object}>}
 */
async function runPerformanceTests() {
    colorLog('⚡ Tests de performance...', 'yellow');
    
    try {
        // Créer le script de test de performance
        await createPerformanceTestScript();
        
        const { stdout } = await execAsync(
            UI_TEST_CONFIG.performanceTests.command,
            { timeout: UI_TEST_CONFIG.performanceTests.timeout }
        );
        
        const metrics = JSON.parse(stdout);
        const config = UI_TEST_CONFIG.performanceTests.metrics;
        
        const checks = [
            {
                name: 'Temps de création',
                value: metrics.creationTime,
                limit: config.maxCreationTime,
                unit: 'ms'
            },
            {
                name: 'Temps de rendu',
                value: metrics.renderTime,
                limit: config.maxRenderTime,
                unit: 'ms'
            },
            {
                name: 'Utilisation mémoire',
                value: metrics.memoryUsage,
                limit: config.maxMemoryUsage,
                unit: 'MB'
            }
        ];
        
        let allPassed = true;
        for (const check of checks) {
            if (check.value <= check.limit) {
                colorLog(`  ✅ ${check.name}: ${check.value}${check.unit} (limite: ${check.limit}${check.unit})`, 'green');
            } else {
                colorLog(`  ❌ ${check.name}: ${check.value}${check.unit} > ${check.limit}${check.unit}`, 'red');
                allPassed = false;
            }
        }
        
        return { success: allPassed, metrics };
        
    } catch (error) {
        colorLog(`  ❌ Erreur lors des tests de performance: ${error.message}`, 'red');
        return { success: false, metrics: null };
    }
}

/**
 * Crée le script de test de performance
 */
async function createPerformanceTestScript() {
    const performanceScript = `
// Script de test de performance pour la palette UI

import { performance } from 'perf_hooks';
import { ComponentsPalette } from '../ui/components-palette.js';

// Mock minimal
const mockApp = { workspace: { getActiveViewOfType: () => true } };
const mockEA = {
    createElement: () => ({ id: 'test' }),
    addElementTags: () => {},
    getExcalidrawAPI: () => ({
        getAppState: () => ({ width: 1200, height: 800, scrollX: 0, scrollY: 0 })
    })
};

// Configuration DOM minimal
if (typeof document === 'undefined') {
    global.document = {
        createElement: () => ({
            style: {},
            addEventListener: () => {},
            appendChild: () => {},
            remove: () => {},
            querySelector: () => null
        }),
        head: { appendChild: () => {} },
        body: { appendChild: () => {} },
        addEventListener: () => {},
        removeEventListener: () => {}
    };
}

async function measurePerformance() {
    const metrics = {};
    
    // Test création de palette
    const start1 = performance.now();
    const palette = new ComponentsPalette(mockApp, mockEA);
    palette.mount();
    const end1 = performance.now();
    metrics.creationTime = end1 - start1;
    
    // Test temps de rendu (simulation)
    const start2 = performance.now();
    for (let i = 0; i < 100; i++) {
        palette.drawPreview(document.createElement('canvas'), 'object', '#4A90E2');
    }
    const end2 = performance.now();
    metrics.renderTime = (end2 - start2) / 100;
    
    // Test utilisation mémoire (approximation)
    if (process.memoryUsage) {
        const memBefore = process.memoryUsage().heapUsed;
        // Créer plusieurs instances
        const palettes = [];
        for (let i = 0; i < 10; i++) {
            palettes.push(new ComponentsPalette(mockApp, mockEA));
        }
        const memAfter = process.memoryUsage().heapUsed;
        metrics.memoryUsage = (memAfter - memBefore) / (1024 * 1024); // MB
    } else {
        metrics.memoryUsage = 2; // Estimation
    }
    
    palette.unmount();
    
    console.log(JSON.stringify(metrics));
}

measurePerformance().catch(console.error);
`;

    await fs.writeFile('scripts/test-performance.js', performanceScript);
}

/**
 * Exécute les tests d'accessibilité
 * @returns {Promise<{success: boolean, issues: Array}>}
 */
async function runAccessibilityTests() {
    colorLog('♿ Tests d\'accessibilité...', 'yellow');
    
    try {
        // Vérifications manuelles d'accessibilité
        const a11yChecks = await performManualA11yChecks();
        
        let allPassed = true;
        const issues = [];
        
        for (const check of a11yChecks) {
            if (check.passed) {
                colorLog(`  ✅ ${check.name}`, 'green');
            } else {
                colorLog(`  ❌ ${check.name}: ${check.message}`, 'red');
                issues.push(check);
                allPassed = false;
            }
        }
        
        return { success: allPassed, issues };
        
    } catch (error) {
        colorLog(`  ❌ Erreur lors des tests d'accessibilité: ${error.message}`, 'red');
        return { success: false, issues: [] };
    }
}

/**
 * Effectue des vérifications manuelles d'accessibilité
 * @returns {Promise<Array>} Liste des vérifications
 */
async function performManualA11yChecks() {
    const checks = [];
    
    try {
        // Vérifier que les fichiers CSS contiennent les règles d'accessibilité
        const cssContent = await fs.readFile('ui/components-palette.css', 'utf8');
        
        checks.push({
            name: 'Support contraste élevé',
            passed: cssContent.includes('prefers-contrast: high'),
            message: 'Media query pour contraste élevé manquante'
        });
        
        checks.push({
            name: 'Réduction des animations',
            passed: cssContent.includes('prefers-reduced-motion'),
            message: 'Support pour réduction des mouvements manquant'
        });
        
        checks.push({
            name: 'Focus visible',
            passed: cssContent.includes(':focus') && cssContent.includes('outline'),
            message: 'Styles de focus manquants'
        });
        
        // Vérifier le code JavaScript pour l'accessibilité
        const jsContent = await fs.readFile('ui/components-palette.js', 'utf8');
        
        checks.push({
            name: 'Gestion clavier',
            passed: jsContent.includes('keydown') && jsContent.includes('Escape'),
            message: 'Navigation clavier incomplète'
        });
        
        checks.push({
            name: 'Attributs ARIA',
            passed: jsContent.includes('aria-') || jsContent.includes('role='),
            message: 'Attributs ARIA recommandés pour l\'accessibilité'
        });
        
    } catch (error) {
        checks.push({
            name: 'Lecture des fichiers',
            passed: false,
            message: `Erreur: ${error.message}`
        });
    }
    
    return checks;
}

/**
 * Génère un rapport de test complet
 * @param {Object} results - Résultats de tous les tests
 */
async function generateReport(results) {
    colorLog('📊 Génération du rapport...', 'yellow');
    
    const report = {
        timestamp: new Date().toISOString(),
        summary: {
            totalTests: 0,
            passed: 0,
            failed: 0,
            success: true
        },
        details: results
    };
    
    // Calculer le résumé
    if (results.unitTests && results.unitTests.results) {
        report.summary.totalTests += results.unitTests.results.total;
        report.summary.passed += results.unitTests.results.passed;
        report.summary.failed += results.unitTests.results.failed;
    }
    
    if (results.performance && !results.performance.success) {
        report.summary.failed++;
        report.summary.success = false;
    } else if (results.performance) {
        report.summary.passed++;
    }
    
    if (results.accessibility && !results.accessibility.success) {
        report.summary.failed += results.accessibility.issues.length;
        report.summary.success = false;
    } else if (results.accessibility) {
        report.summary.passed++;
    }
    
    // Sauvegarder le rapport
    const reportPath = `reports/ui-test-report-${Date.now()}.json`;
    await fs.mkdir('reports', { recursive: true });
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    colorLog(`  📄 Rapport sauvegardé: ${reportPath}`, 'blue');
    
    return report;
}

/**
 * Affiche le résumé final
 * @param {Object} report - Rapport de test
 */
function displaySummary(report) {
    console.log();
    colorLog('━'.repeat(80), 'cyan');
    colorLog('📋 RÉSUMÉ DES TESTS UI', 'bold');
    colorLog('━'.repeat(80), 'cyan');
    
    const status = report.summary.success ? '✅ SUCCÈS' : '❌ ÉCHEC';
    const statusColor = report.summary.success ? 'green' : 'red';
    
    colorLog(`Statut général: ${status}`, statusColor);
    colorLog(`Tests réussis: ${report.summary.passed}`, 'green');
    colorLog(`Tests échoués: ${report.summary.failed}`, report.summary.failed > 0 ? 'red' : 'green');
    colorLog(`Total tests: ${report.summary.totalTests}`, 'blue');
    
    console.log();
    
    if (report.details.performance && report.details.performance.metrics) {
        colorLog('Métriques de performance:', 'yellow');
        const metrics = report.details.performance.metrics;
        colorLog(`  • Temps création: ${metrics.creationTime?.toFixed(2)}ms`, 'blue');
        colorLog(`  • Temps rendu: ${metrics.renderTime?.toFixed(2)}ms`, 'blue');
        colorLog(`  • Mémoire: ${metrics.memoryUsage?.toFixed(2)}MB`, 'blue');
    }
    
    if (report.details.accessibility && report.details.accessibility.issues.length > 0) {
        colorLog('Issues d\'accessibilité:', 'yellow');
        report.details.accessibility.issues.forEach(issue => {
            colorLog(`  • ${issue.name}: ${issue.message}`, 'red');
        });
    }
    
    colorLog('━'.repeat(80), 'cyan');
    
    if (!report.summary.success) {
        process.exit(1);
    }
}

/**
 * Fonction principale
 */
async function main() {
    displayHeader();
    
    // Vérification des prérequis
    const prerequisitesOk = await checkPrerequisites();
    if (!prerequisitesOk) {
        colorLog('❌ Prérequis non satisfaits. Arrêt des tests.', 'red');
        process.exit(1);
    }
    
    const results = {};
    
    // Tests unitaires
    results.unitTests = await runUnitTests();
    
    // Tests de performance
    results.performance = await runPerformanceTests();
    
    // Tests d'accessibilité
    results.accessibility = await runAccessibilityTests();
    
    // Génération du rapport
    const report = await generateReport(results);
    
    // Affichage du résumé
    displaySummary(report);
}

// Exécution du script
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch((error) => {
        colorLog(`❌ Erreur fatale: ${error.message}`, 'red');
        console.error(error);
        process.exit(1);
    });
}

export { main, runUnitTests, runPerformanceTests, runAccessibilityTests };

// <!-- END OF FILE: test-ui.js -->