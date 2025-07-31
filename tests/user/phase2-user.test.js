// <!-- START OF FILE: phase2-test.js -->
// FILENAME: phase2-test.js
// Version: 1.0.0
// Date: 2025-07-30 12:15
// Author: Rolland MELET & Claude Code
// Description: Script test utilisateur Phase 2 - ProcessMetaLanguage EPCIS 2.0 - TASK-T004

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { chromium } from 'playwright';

/**
 * Tests utilisateur Phase 2 - Validation ergonomie ProcessMetaLanguage
 * Processus EPCIS 2.0 complet : "receiving" → "in_progress" → templates
 * 
 * Simule l'expérience utilisateur réelle avec Obsidian + Excalidraw
 * pour créer un processus de traçabilité industrielle complet
 */
describe('Phase 2 - Test Utilisateur ProcessMetaLanguage EPCIS 2.0', () => {
    let browser;
    let context;
    let page;
    
    // Configuration du test utilisateur
    const testConfig = {
        // Simulation environnement Obsidian
        viewport: { width: 1920, height: 1080 },
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        
        // Données test processus EPCIS
        testProcess: {
            objectName: 'Lot-Acier-A001',
            objectType: 'raw-material',
            company: '0000001',
            product: '000001', 
            serial: '000001',
            businessSteps: ['receiving', 'inspecting', 'storing'],
            dispositions: ['in_transit', 'in_progress', 'active'],
            workflow: [
                { step: 'receiving', disposition: 'in_transit', description: 'Réception matière première' },
                { step: 'inspecting', disposition: 'in_progress', description: 'Contrôle qualité' },
                { step: 'storing', disposition: 'active', description: 'Stockage confirmé' }
            ]
        },
        
        // Critères validation ergonomie
        performanceTargets: {
            maxComponentCreationTime: 2000, // < 2s création composant
            maxTemplateSyncTime: 5000,      // < 5s synchronisation
            maxInterfaceResponseTime: 1000   // < 1s réponse interface
        }
    };
    
    beforeAll(async () => {
        console.log('🚀 Initialisation environnement test utilisateur Phase 2');
        
        // Lancer navigateur en mode utilisateur réel
        browser = await chromium.launch({
            headless: false, // Mode visuel pour observation utilisateur
            slowMo: 500,     // Ralentir pour observation
            devtools: true   // DevTools disponibles
        });
        
        context = await browser.newContext({
            viewport: testConfig.viewport,
            userAgent: testConfig.userAgent
        });
        
        page = await context.newPage();
        
        // Simulation page Obsidian avec Excalidraw
        await page.setContent(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Obsidian - ProcessMetaLanguage Test</title>
                <style>
                    body { 
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui;
                        margin: 0; padding: 20px; background: #202020; color: #dcddde;
                    }
                    .canvas-container { 
                        width: 100%; height: 800px; 
                        border: 2px solid #484848; 
                        border-radius: 8px; 
                        position: relative;
                        background: #2f3136;
                    }
                    .component { 
                        position: absolute; 
                        border: 2px solid #1e1e1e; 
                        border-radius: 4px;
                        display: flex; align-items: center; justify-content: center;
                        font-size: 12px; font-weight: 500; color: white;
                        cursor: pointer; transition: all 0.2s;
                    }
                    .component:hover { transform: scale(1.05); box-shadow: 0 4px 12px rgba(0,0,0,0.3); }
                    .object { width: 120px; height: 80px; background: #5865f2; }
                    .state { width: 80px; height: 40px; background: #57f287; }
                    .action { width: 140px; height: 60px; background: #ffa500; border-radius: 8px; }
                    .toolbar { 
                        position: fixed; top: 20px; right: 20px; 
                        display: flex; gap: 10px; z-index: 1000;
                    }
                    .btn { 
                        padding: 8px 16px; background: #5865f2; color: white; 
                        border: none; border-radius: 4px; cursor: pointer;
                    }
                    .btn:hover { background: #4752c4; }
                    .template-panel {
                        position: fixed; right: 20px; top: 100px; width: 300px;
                        background: #36393f; border-radius: 8px; padding: 16px;
                        border: 1px solid #484848; max-height: 600px; overflow-y: auto;
                    }
                    .epcis-info { 
                        background: #2f3136; padding: 12px; border-radius: 4px; 
                        margin: 8px 0; border-left: 4px solid #57f287;
                    }
                    .process-flow {
                        display: flex; align-items: center; gap: 10px; margin: 10px 0;
                        padding: 8px; background: rgba(87, 242, 135, 0.1); border-radius: 4px;
                    }
                    .arrow { color: #ffa500; font-size: 20px; }
                </style>
            </head>
            <body>
                <h1>ProcessMetaLanguage - Test Phase 2 EPCIS 2.0</h1>
                
                <div class="toolbar">
                    <button class="btn" id="createObject">Créer Objet</button>
                    <button class="btn" id="createState">Créer État</button>
                    <button class="btn" id="createAction">Créer Action</button>
                    <button class="btn" id="syncTemplates">Synchroniser</button>
                </div>
                
                <div class="canvas-container" id="canvas">
                    <div class="process-flow" style="top: 20px; left: 20px; position: absolute;">
                        <span>Processus EPCIS 2.0:</span>
                        <span>📦 Objet</span>
                        <span class="arrow">→</span>
                        <span>🏷️ État</span>
                        <span class="arrow">→</span>
                        <span>⚡ Action</span>
                    </div>
                </div>
                
                <div class="template-panel">
                    <h3>Templates EPCIS 2.0</h3>
                    <div class="epcis-info">
                        <strong>Business Step:</strong> <span id="currentBusinessStep">receiving</span><br>
                        <strong>Disposition:</strong> <span id="currentDisposition">in_transit</span><br>
                        <strong>EPC:</strong> <span id="currentEPC">urn:epc:id:sgtin:0000001.000001.000001</span>
                    </div>
                    
                    <h4>Workflow Test:</h4>
                    <div id="workflowSteps"></div>
                    
                    <h4>Métadonnées Générées:</h4>
                    <pre id="templateOutput" style="background: #2f3136; padding: 8px; border-radius: 4px; font-size: 11px; max-height: 200px; overflow-y: auto;"></pre>
                    
                    <h4>Performance:</h4>
                    <div id="performanceMetrics" style="font-size: 12px;"></div>
                </div>
                
                <script>
                    let componentCounter = 0;
                    let performanceData = {
                        componentCreations: [],
                        templateSyncs: [],
                        interfaceResponses: []
                    };
                    
                    const canvas = document.getElementById('canvas');
                    const workflowContainer = document.getElementById('workflowSteps');
                    const templateOutput = document.getElementById('templateOutput');
                    const performanceMetrics = document.getElementById('performanceMetrics');
                    
                    // Workflow test données
                    const testWorkflow = ${JSON.stringify(testConfig.testProcess.workflow)};
                    let currentWorkflowStep = 0;
                    
                    // Initialiser affichage workflow
                    function initWorkflow() {
                        workflowContainer.innerHTML = testWorkflow.map((step, index) => 
                            '<div style="padding: 8px; background: ' + (index === currentWorkflowStep ? '#5865f2' : '#2f3136') + '; margin: 4px 0; border-radius: 4px;">' +
                            '<strong>' + step.step + '</strong> → ' + step.disposition + '<br>' +
                            '<small>' + step.description + '</small>' +
                            '</div>'
                        ).join('');
                    }
                    
                    // Créer composant avec animation
                    function createComponent(type, x, y) {
                        const startTime = performance.now();
                        
                        const component = document.createElement('div');
                        component.className = 'component ' + type;
                        component.style.left = x + 'px';
                        component.style.top = y + 'px';
                        component.id = type + '_' + (++componentCounter);
                        
                        // Contenu selon type et workflow actuel
                        const currentStep = testWorkflow[currentWorkflowStep] || testWorkflow[0];
                        if (type === 'object') {
                            component.textContent = '${testConfig.testProcess.objectName}';
                        } else if (type === 'state') {
                            component.textContent = currentStep.disposition;
                            document.getElementById('currentDisposition').textContent = currentStep.disposition;
                        } else if (type === 'action') {
                            component.textContent = currentStep.step;
                            document.getElementById('currentBusinessStep').textContent = currentStep.step;
                        }
                        
                        canvas.appendChild(component);
                        
                        // Animation d'apparition
                        component.style.transform = 'scale(0)';
                        component.style.opacity = '0';
                        setTimeout(() => {
                            component.style.transform = 'scale(1)';
                            component.style.opacity = '1';
                        }, 50);
                        
                        const endTime = performance.now();
                        const duration = endTime - startTime;
                        performanceData.componentCreations.push(duration);
                        
                        // Avancer workflow si action créée
                        if (type === 'action') {
                            currentWorkflowStep = Math.min(currentWorkflowStep + 1, testWorkflow.length - 1);
                            initWorkflow();
                        }
                        
                        updatePerformanceDisplay();
                        generateTemplatePreview(type, currentStep);
                        
                        return component;
                    }
                    
                    // Générer aperçu template
                    function generateTemplatePreview(type, stepData) {
                        const templateData = {
                            object_name: '${testConfig.testProcess.objectName}',
                            object_type: '${testConfig.testProcess.objectType}',
                            business_step: stepData.step,
                            disposition: stepData.disposition,
                            epc: document.getElementById('currentEPC').textContent,
                            created_at: new Date().toISOString(),
                            company: '${testConfig.testProcess.company}',
                            product: '${testConfig.testProcess.product}',
                            serial: '${testConfig.testProcess.serial}'
                        };
                        
                        templateOutput.textContent = JSON.stringify(templateData, null, 2);
                    }
                    
                    // Mettre à jour affichage performance
                    function updatePerformanceDisplay() {
                        const avgCreation = performanceData.componentCreations.length > 0 ? 
                            (performanceData.componentCreations.reduce((a,b) => a+b, 0) / performanceData.componentCreations.length).toFixed(1) : 0;
                        const avgSync = performanceData.templateSyncs.length > 0 ? 
                            (performanceData.templateSyncs.reduce((a,b) => a+b, 0) / performanceData.templateSyncs.length).toFixed(1) : 0;
                        
                        performanceMetrics.innerHTML = 
                            'Création composants: ' + avgCreation + 'ms (cible: <2000ms)<br>' +
                            'Sync templates: ' + avgSync + 'ms (cible: <5000ms)<br>' +
                            'Composants créés: ' + componentCounter;
                    }
                    
                    // Simulation synchronisation templates
                    function syncTemplates() {
                        const startTime = performance.now();
                        
                        // Simulation traitement
                        setTimeout(() => {
                            const endTime = performance.now();
                            const duration = endTime - startTime + Math.random() * 1000; // Simulation délai
                            performanceData.templateSyncs.push(duration);
                            updatePerformanceDisplay();
                            
                            // Feedback visuel
                            document.getElementById('syncTemplates').textContent = '✅ Synchronisé';
                            setTimeout(() => {
                                document.getElementById('syncTemplates').textContent = 'Synchroniser';
                            }, 2000);
                        }, 500 + Math.random() * 1000);
                    }
                    
                    // Event listeners
                    document.getElementById('createObject').onclick = () => createComponent('object', 100 + Math.random() * 200, 100 + Math.random() * 200);
                    document.getElementById('createState').onclick = () => createComponent('state', 300 + Math.random() * 200, 100 + Math.random() * 200);
                    document.getElementById('createAction').onclick = () => createComponent('action', 500 + Math.random() * 200, 100 + Math.random() * 200);
                    document.getElementById('syncTemplates').onclick = syncTemplates;
                    
                    // Initialisation
                    initWorkflow();
                    generateTemplatePreview('object', testWorkflow[0]);
                    
                    // Exposer données pour tests
                    window.testData = {
                        performanceData,
                        componentCounter,
                        currentWorkflowStep,
                        testWorkflow
                    };
                </script>
            </body>
            </html>
        `);
        
        console.log('✅ Environnement simulation Obsidian initialisé');
    });
    
    afterAll(async () => {
        if (browser) {
            await browser.close();
        }
        console.log('🔄 Nettoyage environnement test terminé');
    });
    
    beforeEach(async () => {
        // Reset compteurs pour chaque test
        await page.evaluate(() => {
            componentCounter = 0;
            currentWorkflowStep = 0;
            performanceData = {
                componentCreations: [],
                templateSyncs: [],
                interfaceResponses: []
            };
        });
    });
    
    describe('Workflow EPCIS 2.0 : receiving → in_progress', () => {
        it('devrait créer un processus complet de réception', async () => {
            console.log('📦 Test création processus réception EPCIS 2.0');
            
            // Étape 1: Créer objet matière première
            await page.click('#createObject');
            await page.waitForTimeout(500);
            
            // Vérifier création objet
            const objectElement = await page.$('.object');
            expect(objectElement).toBeTruthy();
            
            const objectText = await objectElement.textContent();
            expect(objectText).toBe(testConfig.testProcess.objectName);
            
            // Étape 2: Créer état "in_transit" (réception en cours)
            await page.click('#createState');
            await page.waitForTimeout(500);
            
            // Vérifier état créé avec bonne disposition
            const stateElement = await page.$('.state');
            expect(stateElement).toBeTruthy();
            
            const currentDisposition = await page.textContent('#currentDisposition');
            expect(currentDisposition).toBe('in_transit');
            
            // Étape 3: Créer action "receiving"
            await page.click('#createAction');
            await page.waitForTimeout(500);
            
            // Vérifier action créée
            const actionElement = await page.$('.action');
            expect(actionElement).toBeTruthy();
            
            const currentBusinessStep = await page.textContent('#currentBusinessStep');
            expect(currentBusinessStep).toBe('receiving');
            
            console.log('✅ Processus réception créé avec succès');
        });
        
        it('devrait progresser vers état "in_progress" avec inspection', async () => {
            console.log('🔍 Test progression vers inspection');
            
            // Créer séquence complète
            await page.click('#createObject');
            await page.waitForTimeout(300);
            await page.click('#createState');
            await page.waitForTimeout(300);
            await page.click('#createAction'); // receiving
            await page.waitForTimeout(300);
            
            // Créer deuxième état (in_progress)
            await page.click('#createState');
            await page.waitForTimeout(300);
            
            // Vérifier progression workflow
            const currentDisposition = await page.textContent('#currentDisposition');
            expect(currentDisposition).toBe('in_progress');
            
            // Créer action inspection
            await page.click('#createAction');
            await page.waitForTimeout(300);
            
            const currentBusinessStep = await page.textContent('#currentBusinessStep');
            expect(currentBusinessStep).toBe('inspecting');
            
            console.log('✅ Progression vers inspection validée');
        });
        
        it('devrait générer templates EPCIS 2.0 conformes', async () => {
            console.log('📋 Test génération templates EPCIS 2.0');
            
            // Créer processus complet
            await page.click('#createObject');
            await page.click('#createState');
            await page.click('#createAction');
            await page.waitForTimeout(500);
            
            // Vérifier contenu template généré
            const templateContent = await page.textContent('#templateOutput');
            const templateData = JSON.parse(templateContent);
            
            // Validation structure EPCIS 2.0
            expect(templateData.object_name).toBe(testConfig.testProcess.objectName);
            expect(templateData.object_type).toBe(testConfig.testProcess.objectType);
            expect(templateData.business_step).toBe('receiving');
            expect(templateData.disposition).toBe('in_transit');
            expect(templateData.epc).toMatch(/^urn:epc:id:sgtin:/);
            expect(templateData.company).toBe(testConfig.testProcess.company);
            expect(templateData.product).toBe(testConfig.testProcess.product);
            expect(templateData.serial).toBe(testConfig.testProcess.serial);
            expect(templateData.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
            
            console.log('✅ Templates EPCIS 2.0 conformes générés');
        });
    });
    
    describe('Performance et Ergonomie', () => {
        it('devrait respecter les critères de performance', async () => {
            console.log('⚡ Test performance interface utilisateur');
            
            // Créer plusieurs composants pour tester performance
            for (let i = 0; i < 5; i++) {
                await page.click('#createObject');
                await page.waitForTimeout(100);
                await page.click('#createState');
                await page.waitForTimeout(100);
                await page.click('#createAction');
                await page.waitForTimeout(100);
            }
            
            // Récupérer métriques performance
            const performanceData = await page.evaluate(() => window.testData.performanceData);
            
            // Validation critères performance
            const avgCreationTime = performanceData.componentCreations.reduce((a, b) => a + b, 0) / performanceData.componentCreations.length;
            expect(avgCreationTime).toBeLessThan(testConfig.performanceTargets.maxComponentCreationTime);
            
            console.log(`✅ Performance validée: ${avgCreationTime.toFixed(1)}ms < ${testConfig.performanceTargets.maxComponentCreationTime}ms`);
        });
        
        it('devrait synchroniser les templates efficacement', async () => {
            console.log('🔄 Test performance synchronisation');
            
            // Créer composants
            await page.click('#createObject');
            await page.click('#createState');
            await page.click('#createAction');
            
            // Test synchronisation
            const startTime = Date.now();
            await page.click('#syncTemplates');
            
            // Attendre fin synchronisation
            await page.waitForFunction(() => 
                document.getElementById('syncTemplates').textContent === '✅ Synchronisé'
            );
            
            const syncDuration = Date.now() - startTime;
            expect(syncDuration).toBeLessThan(testConfig.performanceTargets.maxTemplateSyncTime);
            
            console.log(`✅ Synchronisation validée: ${syncDuration}ms < ${testConfig.performanceTargets.maxTemplateSyncTime}ms`);
        });
        
        it('devrait avoir une interface responsive', async () => {
            console.log('🖱️ Test réactivité interface');
            
            // Test réactivité boutons
            const buttons = ['#createObject', '#createState', '#createAction'];
            
            for (const buttonSelector of buttons) {
                const startTime = Date.now();
                await page.click(buttonSelector);
                
                // Attendre création composant
                await page.waitForTimeout(50);
                
                const responseTime = Date.now() - startTime;
                expect(responseTime).toBeLessThan(testConfig.performanceTargets.maxInterfaceResponseTime);
            }
            
            console.log('✅ Interface responsive validée');
        });
    });
    
    describe('Validation Workflow Complet', () => {
        it('devrait exécuter le workflow EPCIS 2.0 de bout en bout', async () => {
            console.log('🔄 Test workflow complet EPCIS 2.0');
            
            const expectedSteps = testConfig.testProcess.workflow;
            
            // Créer objet initial
            await page.click('#createObject');
            await page.waitForTimeout(200);
            
            // Exécuter chaque étape du workflow
            for (let i = 0; i < expectedSteps.length; i++) {
                const step = expectedSteps[i];
                
                // Créer état correspondant
                await page.click('#createState');
                await page.waitForTimeout(200);
                
                // Vérifier disposition
                const currentDisposition = await page.textContent('#currentDisposition');
                expect(currentDisposition).toBe(step.disposition);
                
                // Créer action correspondante
                await page.click('#createAction');
                await page.waitForTimeout(200);
                
                // Vérifier business step
                const currentBusinessStep = await page.textContent('#currentBusinessStep');
                expect(currentBusinessStep).toBe(step.step);
                
                console.log(`✅ Étape ${i + 1}/${expectedSteps.length}: ${step.step} → ${step.disposition}`);
            }
            
            // Vérifier nombre total de composants
            const componentCount = await page.evaluate(() => window.testData.componentCounter);
            expect(componentCount).toBe(1 + (expectedSteps.length * 2)); // 1 objet + (états + actions)
            
            console.log('✅ Workflow EPCIS 2.0 complet validé');
        });
        
        it('devrait maintenir la cohérence des métadonnées EPCIS', async () => {
            console.log('📊 Test cohérence métadonnées EPCIS');
            
            // Créer processus
            await page.click('#createObject');
            await page.click('#createState');
            await page.click('#createAction');
            
            // Vérifier EPC généré
            const epcValue = await page.textContent('#currentEPC');
            expect(epcValue).toMatch(/^urn:epc:id:sgtin:0000001\.000001\.000001$/);
            
            // Vérifier cohérence business step / disposition
            const businessStep = await page.textContent('#currentBusinessStep');
            const disposition = await page.textContent('#currentDisposition');
            
            // Logique métier : receiving → in_transit
            if (businessStep === 'receiving') {
                expect(disposition).toBe('in_transit');
            }
            
            console.log('✅ Cohérence métadonnées EPCIS validée');
        });
    });
    
    describe('Tests Ergonomie Avancés', () => {
        it('devrait guider l\'utilisateur dans le workflow', async () => {
            console.log('👤 Test guidance utilisateur');
            
            // Vérifier présence éléments guidance
            const processFlow = await page.$('.process-flow');
            expect(processFlow).toBeTruthy();
            
            const workflowSteps = await page.$('#workflowSteps');
            expect(workflowSteps).toBeTruthy();
            
            // Vérifier mise en évidence étape courante
            await page.click('#createObject');
            await page.click('#createState');
            
            const activeStep = await page.$eval('#workflowSteps div[style*="5865f2"]', el => el.textContent);
            expect(activeStep).toContain('receiving');
            
            console.log('✅ Guidance utilisateur validée');
        });
        
        it('devrait fournir un feedback visuel approprié', async () => {
            console.log('👁️ Test feedback visuel');
            
            // Test animation création composant
            await page.click('#createObject');
            
            // Vérifier animation (composant doit apparaître)
            const objectVisible = await page.isVisible('.object');
            expect(objectVisible).toBe(true);
            
            // Test feedback synchronisation
            await page.click('#syncTemplates');
            
            // Attendre feedback
            await page.waitForFunction(() => 
                document.getElementById('syncTemplates').textContent === '✅ Synchronisé'
            );
            
            const syncButtonText = await page.textContent('#syncTemplates');
            expect(syncButtonText).toBe('✅ Synchronisé');
            
            console.log('✅ Feedback visuel validé');
        });
    });
});

// <!-- END OF FILE: phase2-test.js -->