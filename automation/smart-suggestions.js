// <!-- START OF FILE: smart-suggestions.js -->
// FILENAME: smart-suggestions.js
// Version: 1.0.0
// Date: 2025-07-31 21:45
// Author: Rolland MELET & Claude Code
// Description: Système suggestions intelligentes ProcessMetaLanguage - TASK-F009 Phase 6

/**
 * Module ProcessMetaLanguage - Système Suggestions Intelligentes
 * 
 * Analyse le contexte du processus en cours de création et propose des suggestions
 * intelligentes pour accélérer le workflow de conception.
 * 
 * Fonctionnalités:
 * - Analyse contexte workflow temps réel
 * - Suggestions templates EPCIS pertinents
 * - Auto-détection patterns industrie
 * - Recommandations optimisation processus
 * - Apprentissage basé sur l'usage
 * - Intégration intelligence artificielle
 */

import { TemplateSelector } from '../ui/template-selector.js';

/**
 * Moteur de suggestions intelligentes ProcessMetaLanguage
 * @class
 */
export class SmartSuggestions {
    /**
     * Initialise le système de suggestions
     * @param {Object} app - Instance Obsidian App
     * @param {Object} excalidrawAPI - API ExcalidrawAutomate
     * @param {Object} options - Configuration suggestions
     * @param {boolean} [options.enabled=true] - Suggestions activées
     * @param {string} [options.mode='adaptive'] - Mode suggestions (adaptive, aggressive, minimal)
     * @param {Array} [options.industries] - Industries ciblées pour suggestions
     * @param {boolean} [options.aiEnabled=true] - IA activée pour suggestions avancées
     */
    constructor(app, excalidrawAPI, options = {}) {
        this.app = app;
        this.ea = excalidrawAPI;
        
        // Configuration
        this.config = {
            enabled: options.enabled !== false,
            mode: options.mode || 'adaptive',
            industries: options.industries || ['manufacturing', 'logistics', 'retail'],
            aiEnabled: options.aiEnabled !== false,
            maxSuggestions: options.maxSuggestions || 5,
            contextDepth: options.contextDepth || 3
        };
        
        // État suggestions
        this.currentContext = null;
        this.suggestionHistory = [];
        this.userPreferences = new Map();
        this.industryPatterns = new Map();
        this.learningData = new Map();
        
        // Cache suggestions
        this.suggestionsCache = new Map();
        this.lastAnalysis = null;
        this.cacheTimeout = 30000; // 30s
        
        // Templates et patterns
        this.templateSelector = null;
        this.epcisPatterns = new Map();
        this.workflowPatterns = new Map();
        
        // Métriques
        this.metrics = {
            suggestionsGenerated: 0,
            suggestionsAccepted: 0,
            analysisTime: [],
            userSatisfaction: []
        };
        
        console.log('🧠 SmartSuggestions initialisé');
    }
    
    /**
     * Initialise le système de suggestions
     * @returns {Promise<void>}
     * @sideEffect Charge patterns, initialise IA, configure apprentissage
     */
    async initialize() {
        try {
            console.log('🚀 Initialisation SmartSuggestions...');
            
            // Initialiser composants
            await this.initializeComponents();
            
            // Charger patterns industrie
            await this.loadIndustryPatterns();
            
            // Charger patterns EPCIS
            await this.loadEPCISPatterns();
            
            // Initialiser apprentissage
            this.initializeLearning();
            
            // Configurer surveillance canvas
            this.setupCanvasWatcher();
            
            console.log('✅ SmartSuggestions initialisé avec succès');
            
        } catch (error) {
            console.error('❌ Erreur initialisation SmartSuggestions:', error);
            throw error;
        }
    }
    
    /**
     * Initialise les composants nécessaires
     * @private
     */
    async initializeComponents() {
        // Initialiser sélecteur templates
        this.templateSelector = new TemplateSelector(this.app, this.ea);
        await this.templateSelector.initialize();
        
        console.log('🧩 Composants SmartSuggestions initialisés');
    }
    
    /**
     * Charge les patterns d'industrie
     * @private
     */
    async loadIndustryPatterns() {
        // Patterns Manufacturing
        this.industryPatterns.set('manufacturing', {
            commonFlows: ['receiving', 'inspecting', 'storing', 'assembling', 'packing', 'shipping'],
            stateTransitions: [
                { from: 'raw_material', to: 'in_progress', via: 'receiving' },
                { from: 'in_progress', to: 'quality_check', via: 'inspecting' },
                { from: 'quality_check', to: 'active', via: 'accepting' },
                { from: 'active', to: 'finished_goods', via: 'completing' }
            ],
            suggestedComponents: {
                objects: ['Raw Material Batch', 'Work Order', 'Finished Product'],
                states: ['Received', 'In Production', 'Quality Control', 'Ready to Ship'],
                actions: ['Material Receiving', 'Production Planning', 'Quality Inspection']
            }
        });
        
        // Patterns Logistics
        this.industryPatterns.set('logistics', {
            commonFlows: ['receiving', 'storing', 'picking', 'packing', 'shipping', 'delivering'],
            stateTransitions: [
                { from: 'inbound', to: 'in_transit', via: 'receiving' },
                { from: 'in_transit', to: 'stored', via: 'storing' },
                { from: 'stored', to: 'picked', via: 'picking' },
                { from: 'picked', to: 'shipped', via: 'shipping' }
            ],
            suggestedComponents: {
                objects: ['Shipment', 'Package', 'Pallet', 'Container'],
                states: ['In Transit', 'At Warehouse', 'Being Processed', 'Delivered'],
                actions: ['Receive Shipment', 'Warehouse Storage', 'Order Picking']
            }
        });
        
        // Patterns Retail
        this.industryPatterns.set('retail', {
            commonFlows: ['receiving', 'stocking', 'selling', 'returning', 'restocking'],
            stateTransitions: [
                { from: 'received', to: 'available', via: 'stocking' },
                { from: 'available', to: 'sold', via: 'selling' },
                { from: 'sold', to: 'returned', via: 'returning' },
                { from: 'returned', to: 'restocked', via: 'restocking' }
            ],
            suggestedComponents: {
                objects: ['Product SKU', 'Inventory Lot', 'Customer Order'],
                states: ['In Stock', 'On Display', 'Sold', 'Returned', 'Damaged'],
                actions: ['Stock Replenishment', 'Sale Transaction', 'Return Processing']
            }
        });
        
        console.log(`📊 ${this.industryPatterns.size} patterns industrie chargés`);
    }
    
    /**
     * Charge les patterns EPCIS
     * @private
     */
    async loadEPCISPatterns() {
        // Patterns business steps fréquents
        const frequentPatterns = [
            {
                sequence: ['receiving', 'inspecting', 'accepting'],
                context: 'Quality Control Flow',
                industry: 'manufacturing',
                probability: 0.85
            },
            {
                sequence: ['picking', 'packing', 'shipping'],
                context: 'Order Fulfillment',
                industry: 'logistics',
                probability: 0.90
            },
            {
                sequence: ['receiving', 'storing', 'picking'],
                context: 'Warehouse Operations',
                industry: 'logistics',
                probability: 0.88
            },
            {
                sequence: ['transforming', 'assembling', 'inspecting'],
                context: 'Production Line',
                industry: 'manufacturing',
                probability: 0.82
            }
        ];
        
        frequentPatterns.forEach(pattern => {
            const key = pattern.sequence.join('→');
            this.epcisPatterns.set(key, pattern);
        });
        
        // Patterns dispositions
        const dispositionPatterns = new Map([
            ['active', ['in_progress', 'available', 'sellable_accessible']],
            ['in_transit', ['active', 'damaged', 'destroyed']],
            ['in_progress', ['active', 'non_sellable_other', 'damaged']],
            ['damaged', ['destroyed', 'in_progress', 'active']]
        ]);
        
        this.dispositionPatterns = dispositionPatterns;
        
        console.log(`🏷️ ${this.epcisPatterns.size} patterns EPCIS chargés`);
    }
    
    /**
     * Initialise le système d'apprentissage
     * @private
     */
    initializeLearning() {
        // Charger données apprentissage existantes
        const saved = localStorage.getItem('pml-learning-data');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.learningData = new Map(data.learningData || []);
                this.userPreferences = new Map(data.userPreferences || []);
                console.log('📚 Données apprentissage chargées');
            } catch (error) {
                console.warn('⚠️ Erreur chargement données apprentissage:', error);
            }
        }
        
        // Sauvegarder périodiquement
        setInterval(() => {
            this.saveLearningData();
        }, 60000); // 1 minute
    }
    
    /**
     * Configure la surveillance du canvas
     * @private
     */
    setupCanvasWatcher() {
        // Observer changements canvas (si disponible)
        if (this.ea && this.ea.onDrawingChange) {
            this.ea.onDrawingChange(() => {
                this.scheduleAnalysis();
            });
        }
        
        // Observer sélection éléments
        if (this.ea && this.ea.onSelectionChange) {
            this.ea.onSelectionChange((selection) => {
                this.analyzeSelection(selection);
            });
        }
        
        console.log('👁️ Surveillance canvas configurée');
    }
    
    /**
     * Planifie une analyse différée du canvas
     * @private
     */
    scheduleAnalysis() {
        // Debounce analysis pour éviter trop d'appels
        clearTimeout(this.analysisTimer);
        this.analysisTimer = setTimeout(() => {
            this.analyzeCanvas();
        }, 1000);
    }
    
    /**
     * Analyse le canvas actuel et génère des suggestions
     * @returns {Promise<Array>} Suggestions générées
     */
    async analyzeCanvas() {
        if (!this.config.enabled) {
            return [];
        }
        
        try {
            const startTime = Date.now();
            
            // Vérifier cache
            const cacheKey = this.getCanvasCacheKey();
            if (this.suggestionsCache.has(cacheKey)) {
                const cached = this.suggestionsCache.get(cacheKey);
                if (Date.now() - cached.timestamp < this.cacheTimeout) {
                    return cached.suggestions;
                }
            }
            
            // Analyser contexte actuel
            const context = await this.extractCanvasContext();
            this.currentContext = context;
            
            // Générer suggestions
            const suggestions = await this.generateSuggestions(context);
            
            // Mettre en cache
            this.suggestionsCache.set(cacheKey, {
                suggestions,
                timestamp: Date.now(),
                context
            });
            
            // Métriques
            const analysisTime = Date.now() - startTime;
            this.metrics.analysisTime.push(analysisTime);
            this.metrics.suggestionsGenerated += suggestions.length;
            
            console.log(`🔍 Analyse terminée: ${suggestions.length} suggestions en ${analysisTime}ms`);
            
            return suggestions;
            
        } catch (error) {
            console.error('❌ Erreur analyse canvas:', error);
            return [];
        }
    }
    
    /**
     * Extrait le contexte du canvas actuel
     * @returns {Promise<Object>} Contexte canvas
     * @private
     */
    async extractCanvasContext() {
        const context = {
            elements: [],
            relationships: [],
            industry: null,
            workflow: null,
            patterns: [],
            completeness: 0
        };
        
        try {
            // Obtenir éléments canvas via ExcalidrawAutomate
            if (this.ea && this.ea.getViewElements) {
                const elements = this.ea.getViewElements();
                
                // Analyser chaque élément
                elements.forEach(element => {
                    const analyzed = this.analyzeElement(element);
                    if (analyzed) {
                        context.elements.push(analyzed);
                    }
                });
            }
            
            // Détecter relations spatiales
            context.relationships = this.detectRelationships(context.elements);
            
            // Identifier industrie probable
            context.industry = this.detectIndustry(context.elements);
            
            // Identifier workflow actuel
            context.workflow = this.identifyWorkflow(context.elements, context.relationships);
            
            // Analyser patterns existants
            context.patterns = this.identifyPatterns(context.workflow);
            
            // Calculer complétude
            context.completeness = this.calculateCompleteness(context);
            
        } catch (error) {
            console.warn('⚠️ Erreur extraction contexte:', error);
        }
        
        return context;
    }
    
    /**
     * Analyse un élément canvas
     * @param {Object} element - Élément Excalidraw
     * @returns {Object|null} Élément analysé
     * @private
     */
    analyzeElement(element) {
        if (!element || !element.customData) {
            return null;
        }
        
        const customData = element.customData;
        
        // Identifier type ProcessMetaLanguage
        let type = null;
        if (customData.tags?.includes('#process-object')) type = 'object';
        else if (customData.tags?.includes('#process-state')) type = 'state';
        else if (customData.tags?.includes('#process-action')) type = 'action';
        
        if (!type) return null;
        
        return {
            id: element.id,
            type,
            name: customData.name || 'Unnamed',
            position: { x: element.x, y: element.y },
            properties: customData.properties || {},
            metadata: customData.metadata || {}
        };
    }
    
    /**
     * Détecte les relations entre éléments
     * @param {Array} elements - Éléments analysés
     * @returns {Array} Relations détectées
     * @private
     */
    detectRelationships(elements) {
        const relationships = [];
        
        // Analyser proximité spatiale
        for (let i = 0; i < elements.length; i++) {
            for (let j = i + 1; j < elements.length; j++) {
                const rel = this.analyzeProximity(elements[i], elements[j]);
                if (rel) {
                    relationships.push(rel);
                }
            }
        }
        
        return relationships;
    }
    
    /**
     * Analyse la proximité entre deux éléments
     * @param {Object} elem1 - Premier élément
     * @param {Object} elem2 - Deuxième élément
     * @returns {Object|null} Relation détectée
     * @private
     */
    analyzeProximity(elem1, elem2) {
        const distance = Math.sqrt(
            Math.pow(elem1.position.x - elem2.position.x, 2) +
            Math.pow(elem1.position.y - elem2.position.y, 2)
        );
        
        // Seuil proximité (à ajuster selon canvas)
        const proximityThreshold = 200;
        
        if (distance <= proximityThreshold) {
            return {
                from: elem1.id,
                to: elem2.id,
                type: 'proximity',
                distance,
                strength: 1 - (distance / proximityThreshold)
            };
        }
        
        return null;
    }
    
    /**
     * Détecte l'industrie probable
     * @param {Array} elements - Éléments canvas
     * @returns {string|null} Industrie détectée
     * @private
     */
    detectIndustry(elements) {
        const industryScores = new Map();
        
        // Analyser noms/propriétés pour indices industrie
        elements.forEach(element => {
            const text = (element.name + ' ' + JSON.stringify(element.properties)).toLowerCase();
            
            this.industryPatterns.forEach((pattern, industry) => {
                let score = 0;
                
                // Vérifier termes caractéristiques
                pattern.commonFlows.forEach(flow => {
                    if (text.includes(flow)) score += 2;
                });
                
                pattern.suggestedComponents.objects.forEach(obj => {
                    if (text.includes(obj.toLowerCase())) score += 3;
                });
                
                if (score > 0) {
                    industryScores.set(industry, (industryScores.get(industry) || 0) + score);
                }
            });
        });
        
        // Retourner industrie avec meilleur score
        let bestIndustry = null;
        let bestScore = 0;
        
        industryScores.forEach((score, industry) => {
            if (score > bestScore) {
                bestScore = score;
                bestIndustry = industry;
            }
        });
        
        return bestIndustry;
    }
    
    /**
     * Identifie le workflow actuel
     * @param {Array} elements - Éléments canvas
     * @param {Array} relationships - Relations détectées
     * @returns {Object} Workflow identifié
     * @private
     */
    identifyWorkflow(elements, relationships) {
        const workflow = {
            objects: elements.filter(e => e.type === 'object'),
            states: elements.filter(e => e.type === 'state'),
            actions: elements.filter(e => e.type === 'action'),
            flow: []
        };
        
        // Construire flux logique basé sur relations
        const flow = this.buildFlowFromRelationships(workflow, relationships);
        workflow.flow = flow;
        
        return workflow;
    }
    
    /**
     * Construit le flux logique depuis les relations
     * @param {Object} workflow - Workflow actuel
     * @param {Array} relationships - Relations
     * @returns {Array} Flux logique
     * @private
     */
    buildFlowFromRelationships(workflow, relationships) {
        // Algorithme simple de construction de flux
        // (peut être amélioré avec analyse plus sophistiquée)
        
        const flow = [];
        const visited = new Set();
        
        // Commencer par objets (racines probables)
        workflow.objects.forEach(obj => {
            if (!visited.has(obj.id)) {
                const sequence = this.traceFlowFrom(obj, workflow, relationships, visited);
                if (sequence.length > 1) {
                    flow.push(sequence);
                }
            }
        });
        
        return flow;
    }
    
    /**
     * Trace le flux depuis un élément
     * @param {Object} startElement - Élément de départ
     * @param {Object} workflow - Workflow
     * @param {Array} relationships - Relations
     * @param {Set} visited - Éléments visités
     * @returns {Array} Séquence d'éléments
     * @private
     */
    traceFlowFrom(startElement, workflow, relationships, visited) {
        const sequence = [startElement];
        visited.add(startElement.id);
        
        // Trouver élément suivant le plus proche
        const nextRel = relationships.find(rel => 
            rel.from === startElement.id && !visited.has(rel.to)
        );
        
        if (nextRel) {
            const nextElement = workflow.objects
                .concat(workflow.states)
                .concat(workflow.actions)
                .find(e => e.id === nextRel.to);
                
            if (nextElement) {
                const nextSequence = this.traceFlowFrom(nextElement, workflow, relationships, visited);
                sequence.push(...nextSequence.slice(1)); // Éviter duplication
            }
        }
        
        return sequence;
    }
    
    /**
     * Identifie les patterns dans le workflow
     * @param {Object} workflow - Workflow analysé
     * @returns {Array} Patterns identifiés
     * @private
     */
    identifyPatterns(workflow) {
        const patterns = [];
        
        // Analyser séquences actions
        workflow.flow.forEach(sequence => {
            const actionSequence = sequence
                .filter(elem => elem.type === 'action')
                .map(elem => elem.properties?.businessStep || elem.name.toLowerCase());
                
            if (actionSequence.length >= 2) {
                const sequenceKey = actionSequence.join('→');
                
                // Vérifier patterns EPCIS connus
                this.epcisPatterns.forEach((pattern, key) => {
                    if (key.includes(sequenceKey) || sequenceKey.includes(key)) {
                        patterns.push({
                            type: 'epcis_pattern',
                            sequence: actionSequence,
                            match: pattern,
                            confidence: pattern.probability
                        });
                    }
                });
            }
        });
        
        return patterns;
    }
    
    /**
     * Calcule la complétude du workflow
     * @param {Object} context - Contexte analysé
     * @returns {number} Score complétude (0-1)
     * @private
     */
    calculateCompleteness(context) {
        let score = 0;
        const maxScore = 10;
        
        // Présence objets
        if (context.elements.some(e => e.type === 'object')) score += 2;
        
        // Présence états
        if (context.elements.some(e => e.type === 'state')) score += 2;
        
        // Présence actions
        if (context.elements.some(e => e.type === 'action')) score += 2;
        
        // Relations détectées
        if (context.relationships.length > 0) score += 2;
        
        // Workflow cohérent
        if (context.workflow && context.workflow.flow.length > 0) score += 1;
        
        // Patterns identifiés
        if (context.patterns.length > 0) score += 1;
        
        return Math.min(score / maxScore, 1);
    }
    
    /**
     * Génère des suggestions basées sur le contexte
     * @param {Object} context - Contexte analysé
     * @returns {Promise<Array>} Suggestions générées
     * @private
     */
    async generateSuggestions(context) {
        const suggestions = [];
        
        try {
            // Suggestions basées sur complétude
            if (context.completeness < 0.3) {
                suggestions.push(...this.generateBasicSuggestions(context));
            }
            
            // Suggestions basiques industrie
            if (context.industry) {
                suggestions.push(...this.generateIndustrySuggestions(context));
            }
            
            // Suggestions patterns EPCIS
            suggestions.push(...this.generateEPCISSuggestions(context));
            
            // Suggestions optimisation
            if (context.completeness > 0.5) {
                suggestions.push(...this.generateOptimizationSuggestions(context));
            }
            
            // Suggestions apprentissage
            suggestions.push(...this.generateLearningSuggestions(context));
            
            // Limiter nombre et trier par pertinence
            const sortedSuggestions = suggestions
                .sort((a, b) => b.confidence - a.confidence)
                .slice(0, this.config.maxSuggestions);
                
            return sortedSuggestions;
            
        } catch (error) {
            console.error('❌ Erreur génération suggestions:', error);
            return [];
        }
    }
    
    /**
     * Génère des suggestions de base
     * @param {Object} context - Contexte
     * @returns {Array} Suggestions de base
     * @private
     */
    generateBasicSuggestions(context) {
        const suggestions = [];
        
        // Manque objets
        if (!context.elements.some(e => e.type === 'object')) {
            suggestions.push({
                id: `basic_object_${Date.now()}`,
                type: 'create_component',
                category: 'basic',
                title: 'Créer un Objet Processus',
                description: 'Commencez par définir l\'entité principale de votre processus',
                action: {
                    type: 'create',
                    component: 'object',
                    template: 'basic_object'
                },
                confidence: 0.9,
                priority: 'high'
            });
        }
        
        // Manque états
        if (!context.elements.some(e => e.type === 'state')) {
            suggestions.push({
                id: `basic_state_${Date.now()}`,
                type: 'create_component',
                category: 'basic',
                title: 'Ajouter un État',
                description: 'Définissez les conditions possibles de votre objet',
                action: {
                    type: 'create',
                    component: 'state',
                    template: 'basic_state'
                },
                confidence: 0.85,
                priority: 'high'
            });
        }
        
        // Manque actions
        if (!context.elements.some(e => e.type === 'action')) {
            suggestions.push({
                id: `basic_action_${Date.now()}`,
                type: 'create_component',
                category: 'basic',
                title: 'Ajouter une Action',
                description: 'Créez l\'action qui transforme ou manipule votre objet',
                action: {
                    type: 'create',
                    component: 'action',
                    template: 'basic_action'
                },
                confidence: 0.8,
                priority: 'medium'
            });
        }
        
        return suggestions;
    }
    
    /**
     * Génère des suggestions basées sur l'industrie
     * @param {Object} context - Contexte
     * @returns {Array} Suggestions industrie
     * @private
     */
    generateIndustrySuggestions(context) {
        const suggestions = [];
        const industryPattern = this.industryPatterns.get(context.industry);
        
        if (!industryPattern) return suggestions;
        
        // Suggérer composants manquants typiques de l'industrie
        const existingNames = context.elements.map(e => e.name.toLowerCase());
        
        industryPattern.suggestedComponents.objects.forEach(objName => {
            if (!existingNames.some(name => name.includes(objName.toLowerCase()))) {
                suggestions.push({
                    id: `industry_object_${objName.replace(/\s+/g, '_')}`,
                    type: 'create_component',
                    category: 'industry',
                    title: `Ajouter "${objName}"`,
                    description: `Objet typique dans l'industrie ${context.industry}`,
                    action: {
                        type: 'create',
                        component: 'object',
                        template: 'industry_object',
                        properties: { name: objName, industry: context.industry }
                    },
                    confidence: 0.75,
                    priority: 'medium'
                });
            }
        });
        
        // Suggérer flux typiques
        const existingFlow = context.workflow.flow.flat().map(e => 
            e.properties?.businessStep || e.name.toLowerCase()
        );
        
        const missingSteps = industryPattern.commonFlows.filter(step => 
            !existingFlow.includes(step)
        );
        
        if (missingSteps.length > 0) {
            suggestions.push({
                id: `industry_flow_${context.industry}`,
                type: 'add_workflow',
                category: 'industry',
                title: `Compléter le flux ${context.industry}`,
                description: `Ajouter les étapes manquantes: ${missingSteps.join(', ')}`,
                action: {
                    type: 'add_flow',
                    steps: missingSteps,
                    industry: context.industry
                },
                confidence: 0.7,
                priority: 'medium'
            });
        }
        
        return suggestions;
    }
    
    /**
     * Génère des suggestions EPCIS
     * @param {Object} context - Contexte
     * @returns {Array} Suggestions EPCIS
     * @private
     */
    generateEPCISSuggestions(context) {
        const suggestions = [];
        
        // Analyser patterns partiels
        const partialPatterns = [];
        
        this.epcisPatterns.forEach((pattern, key) => {
            const steps = key.split('→');
            const existingSteps = context.elements
                .filter(e => e.type === 'action')
                .map(e => e.properties?.businessStep || e.name.toLowerCase());
                
            // Vérifier si pattern partiellement présent
            const matchingSteps = steps.filter(step => existingSteps.includes(step));
            
            if (matchingSteps.length > 0 && matchingSteps.length < steps.length) {
                const missingSteps = steps.filter(step => !existingSteps.includes(step));
                
                partialPatterns.push({
                    pattern,
                    missing: missingSteps,
                    existing: matchingSteps,
                    completion: matchingSteps.length / steps.length
                });
            }
        });
        
        // Créer suggestions pour compléter patterns
        partialPatterns
            .sort((a, b) => b.completion - a.completion)
            .slice(0, 3)
            .forEach(partial => {
                suggestions.push({
                    id: `epcis_complete_${partial.pattern.context.replace(/\s+/g, '_')}`,
                    type: 'complete_pattern',
                    category: 'epcis',
                    title: `Compléter "${partial.pattern.context}"`,
                    description: `Ajouter: ${partial.missing.join(', ')} (${Math.round(partial.pattern.probability * 100)}% de probabilité)`,
                    action: {
                        type: 'add_epcis_steps',
                        steps: partial.missing,
                        pattern: partial.pattern
                    },
                    confidence: partial.pattern.probability * partial.completion,
                    priority: partial.completion > 0.5 ? 'high' : 'medium'
                });
            });
        
        return suggestions;
    }
    
    /**
     * Génère des suggestions d'optimisation
     * @param {Object} context - Contexte
     * @returns {Array} Suggestions optimisation
     * @private
     */
    generateOptimizationSuggestions(context) {
        const suggestions = [];
        
        // Analyser densité éléments
        const elementsByArea = this.calculateElementDensity(context.elements);
        if (elementsByArea > 0.8) {
            suggestions.push({
                id: 'optimize_layout',
                type: 'optimization',
                category: 'layout',
                title: 'Optimiser la Disposition',
                description: 'Les éléments semblent trop rapprochés. Réorganiser pour plus de clarté?',
                action: {
                    type: 'optimize_layout',
                    method: 'spread_elements'
                },
                confidence: 0.6,
                priority: 'low'
            });
        }
        
        // Vérifier cohérence nommage
        const namingIssues = this.checkNamingConsistency(context.elements);
        if (namingIssues.length > 0) {
            suggestions.push({
                id: 'fix_naming',
                type: 'optimization',
                category: 'naming',
                title: 'Harmoniser le Nommage',
                description: `${namingIssues.length} incohérences détectées dans les noms`,
                action: {
                    type: 'fix_naming',
                    issues: namingIssues
                },
                confidence: 0.7,
                priority: 'medium'
            });
        }
        
        return suggestions;
    }
    
    /**
     * Génère des suggestions basées sur l'apprentissage
     * @param {Object} context - Contexte
     * @returns {Array} Suggestions apprentissage
     * @private
     */
    generateLearningSuggestions(context) {
        const suggestions = [];
        
        // Analyser préférences utilisateur
        this.userPreferences.forEach((usage, component) => {
            if (usage.count > 5 && usage.successRate > 0.7) {
                // Suggérer composants fréquemment utilisés avec succès
                const similar = this.findSimilarContext(context, usage.contexts);
                if (similar > 0.5) {
                    suggestions.push({
                        id: `learning_${component}`,
                        type: 'learning',
                        category: 'preference',
                        title: `Ajouter "${component}"`,
                        description: `Composant souvent utilisé avec succès dans des contextes similaires`,
                        action: {
                            type: 'create_preferred',
                            component: component,
                            properties: usage.commonProperties
                        },
                        confidence: usage.successRate * similar,
                        priority: 'medium'
                    });
                }
            }
        });
        
        return suggestions;
    }
    
    /**
     * Calcule la densité d'éléments
     * @param {Array} elements - Éléments canvas
     * @returns {number} Densité (0-1)
     * @private
     */
    calculateElementDensity(elements) {
        if (elements.length < 2) return 0;
        
        // Calculer bounding box
        const minX = Math.min(...elements.map(e => e.position.x));
        const maxX = Math.max(...elements.map(e => e.position.x));
        const minY = Math.min(...elements.map(e => e.position.y));
        const maxY = Math.max(...elements.map(e => e.position.y));
        
        const area = (maxX - minX) * (maxY - minY);
        const avgElementSize = 120 * 80; // Taille moyenne composant
        const totalElementArea = elements.length * avgElementSize;
        
        return area > 0 ? Math.min(totalElementArea / area, 1) : 0;
    }
    
    /**
     * Vérifie la cohérence du nommage
     * @param {Array} elements - Éléments
     * @returns {Array} Issues détectées
     * @private
     */
    checkNamingConsistency(elements) {
        const issues = [];
        
        // Vérifier conventions nommage
        elements.forEach(element => {
            const name = element.name;
            
            // Noms trop courts
            if (name.length < 3) {
                issues.push({
                    element: element.id,
                    type: 'too_short',
                    current: name
                });
            }
            
            // Noms génériques
            const genericNames = ['object', 'state', 'action', 'unnamed', 'item'];
            if (genericNames.includes(name.toLowerCase())) {
                issues.push({
                    element: element.id,
                    type: 'generic',
                    current: name
                });
            }
        });
        
        return issues;
    }
    
    /**
     * Trouve la similitude avec contextes précédents
     * @param {Object} currentContext - Contexte actuel
     * @param {Array} previousContexts - Contextes précédents
     * @returns {number} Score similarité (0-1)
     * @private
     */
    findSimilarContext(currentContext, previousContexts) {
        if (!previousContexts || previousContexts.length === 0) return 0;
        
        let maxSimilarity = 0;
        
        previousContexts.forEach(prevContext => {
            let similarity = 0;
            
            // Comparer industrie
            if (currentContext.industry === prevContext.industry) {
                similarity += 0.3;
            }
            
            // Comparer types éléments
            const currentTypes = currentContext.elements.map(e => e.type);
            const prevTypes = prevContext.elements?.map(e => e.type) || [];
            
            const commonTypes = currentTypes.filter(t => prevTypes.includes(t));
            if (currentTypes.length > 0) {
                similarity += 0.4 * (commonTypes.length / currentTypes.length);
            }
            
            // Comparer complétude
            const completenessMatch = 1 - Math.abs(currentContext.completeness - (prevContext.completeness || 0));
            similarity += 0.3 * completenessMatch;
            
            maxSimilarity = Math.max(maxSimilarity, similarity);
        });
        
        return maxSimilarity;
    }
    
    /**
     * Analyse une sélection d'éléments
     * @param {Array} selection - Éléments sélectionnés
     */
    async analyzeSelection(selection) {
        if (!selection || selection.length === 0) return;
        
        // Analyser contexte sélection
        const selectionContext = {
            elements: selection.map(elem => this.analyzeElement(elem)).filter(Boolean),
            timestamp: Date.now()
        };
        
        // Générer suggestions contextuelles
        const suggestions = await this.generateSelectionSuggestions(selectionContext);
        
        if (suggestions.length > 0) {
            this.showSuggestions(suggestions, 'selection');
        }
    }
    
    /**
     * Génère des suggestions pour une sélection
     * @param {Object} selectionContext - Contexte sélection
     * @returns {Promise<Array>} Suggestions
     * @private
     */
    async generateSelectionSuggestions(selectionContext) {
        const suggestions = [];
        const elements = selectionContext.elements;
        
        if (elements.length === 1) {
            const element = elements[0];
            
            // Suggestions pour élément unique
            if (element.type === 'object') {
                suggestions.push({
                    id: 'add_state_to_object',
                    type: 'contextual',
                    title: 'Ajouter un État',
                    description: `Définir l'état de "${element.name}"`,
                    action: {
                        type: 'create_related',
                        component: 'state',
                        parent: element.id
                    },
                    confidence: 0.8,
                    priority: 'high'
                });
            }
            
            if (element.type === 'state') {
                suggestions.push({
                    id: 'add_action_to_state',
                    type: 'contextual',
                    title: 'Ajouter une Action',
                    description: `Créer l'action principale pour "${element.name}"`,
                    action: {
                        type: 'create_related',
                        component: 'action',
                        parent: element.id
                    },
                    confidence: 0.85,
                    priority: 'high'
                });
            }
        }
        
        return suggestions;
    }
    
    /**
     * Affiche les suggestions à l'utilisateur
     * @param {Array} suggestions - Suggestions à afficher
     * @param {string} context - Contexte affichage
     */
    showSuggestions(suggestions, context = 'general') {
        if (suggestions.length === 0) return;
        
        // TODO: Implémenter UI suggestions
        // Pour l'instant, log dans console
        console.log(`💡 ${suggestions.length} suggestions (${context}):`);
        suggestions.forEach((suggestion, index) => {
            console.log(`  ${index + 1}. ${suggestion.title} (${Math.round(suggestion.confidence * 100)}%)`);
        });
        
        // Enregistrer historique
        this.suggestionHistory.push({
            suggestions,
            context,
            timestamp: Date.now(),
            shown: true
        });
    }
    
    /**
     * Applique une suggestion acceptée
     * @param {string} suggestionId - ID suggestion
     * @returns {Promise<boolean>} Succès application
     */
    async applySuggestion(suggestionId) {
        try {
            // Trouver suggestion dans historique
            const history = this.suggestionHistory.find(h => 
                h.suggestions.some(s => s.id === suggestionId)
            );
            
            if (!history) {
                console.warn('⚠️ Suggestion non trouvée:', suggestionId);
                return false;
            }
            
            const suggestion = history.suggestions.find(s => s.id === suggestionId);
            
            // Appliquer action
            const success = await this.executeSuggestionAction(suggestion.action);
            
            // Enregistrer pour apprentissage
            if (success) {
                this.recordSuggestionSuccess(suggestion);
                this.metrics.suggestionsAccepted++;
            }
            
            return success;
            
        } catch (error) {
            console.error('❌ Erreur application suggestion:', error);
            return false;
        }
    }
    
    /**
     * Exécute l'action d'une suggestion
     * @param {Object} action - Action à exécuter
     * @returns {Promise<boolean>} Succès exécution
     * @private
     */
    async executeSuggestionAction(action) {
        switch (action.type) {
            case 'create':
                return await this.createComponent(action.component, action.template, action.properties);
                
            case 'create_related':
                return await this.createRelatedComponent(action.component, action.parent);
                
            case 'add_flow':
                return await this.addWorkflowSteps(action.steps, action.industry);
                
            case 'add_epcis_steps':
                return await this.addEPCISSteps(action.steps, action.pattern);
                
            default:
                console.warn('⚠️ Type action non supporté:', action.type);
                return false;
        }
    }
    
    /**
     * Crée un composant suggéré
     * @param {string} type - Type composant
     * @param {string} template - Template à utiliser
     * @param {Object} properties - Propriétés
     * @returns {Promise<boolean>} Succès création
     * @private
     */
    async createComponent(type, template, properties = {}) {
        try {
            // TODO: Intégrer avec créateurs de composants
            console.log(`🔧 Création composant ${type} avec template ${template}`);
            return true;
        } catch (error) {
            console.error('❌ Erreur création composant:', error);
            return false;
        }
    }
    
    /**
     * Crée un composant lié à un autre
     * @param {string} type - Type composant
     * @param {string} parentId - ID parent
     * @returns {Promise<boolean>} Succès création
     * @private
     */
    async createRelatedComponent(type, parentId) {
        try {
            // TODO: Implémenter création avec relation
            console.log(`🔗 Création composant ${type} lié à ${parentId}`);
            return true;
        } catch (error) {
            console.error('❌ Erreur création composant lié:', error);
            return false;
        }
    }
    
    /**
     * Ajoute des étapes workflow
     * @param {Array} steps - Étapes à ajouter
     * @param {string} industry - Industrie
     * @returns {Promise<boolean>} Succès ajout
     * @private
     */
    async addWorkflowSteps(steps, industry) {
        try {
            // TODO: Implémenter ajout étapes workflow
            console.log(`📋 Ajout étapes workflow: ${steps.join(', ')} (${industry})`);
            return true;
        } catch (error) {
            console.error('❌ Erreur ajout workflow:', error);
            return false;
        }
    }
    
    /**
     * Ajoute des étapes EPCIS
     * @param {Array} steps - Étapes EPCIS
     * @param {Object} pattern - Pattern EPCIS
     * @returns {Promise<boolean>} Succès ajout
     * @private
     */
    async addEPCISSteps(steps, pattern) {
        try {
            // TODO: Implémenter ajout étapes EPCIS
            console.log(`🏷️ Ajout étapes EPCIS: ${steps.join(', ')} (${pattern.context})`);
            return true;
        } catch (error) {
            console.error('❌ Erreur ajout EPCIS:', error);
            return false;
        }
    }
    
    /**
     * Enregistre le succès d'une suggestion pour apprentissage
     * @param {Object} suggestion - Suggestion appliquée
     * @private
     */
    recordSuggestionSuccess(suggestion) {
        const key = `${suggestion.type}_${suggestion.category}`;
        
        if (!this.learningData.has(key)) {
            this.learningData.set(key, {
                count: 0,
                successes: 0,
                contexts: []
            });
        }
        
        const data = this.learningData.get(key);
        data.count++;
        data.successes++;
        data.contexts.push(this.currentContext);
        
        // Limiter historique contextes
        if (data.contexts.length > 10) {
            data.contexts = data.contexts.slice(-10);
        }
        
        console.log(`📚 Apprentissage enregistré: ${key} (${data.successes}/${data.count})`);
    }
    
    /**
     * Obtient une clé cache pour le canvas actuel
     * @returns {string} Clé cache
     * @private
     */
    getCanvasCacheKey() {
        // Simple hash basée sur éléments visibles
        try {
            if (this.ea && this.ea.getViewElements) {
                const elements = this.ea.getViewElements();
                const signature = elements
                    .map(e => `${e.type}-${e.x}-${e.y}`)
                    .sort()
                    .join('|');
                return `canvas_${signature.length}_${Date.now() - (Date.now() % 60000)}`; // Cache 1min
            }
        } catch (error) {
            // Fallback
        }
        
        return `canvas_fallback_${Date.now() - (Date.now() % 60000)}`;
    }
    
    /**
     * Sauvegarde les données d'apprentissage
     * @private
     */
    saveLearningData() {
        try {
            const data = {
                learningData: Array.from(this.learningData.entries()),
                userPreferences: Array.from(this.userPreferences.entries()),
                version: '1.0.0'
            };
            
            localStorage.setItem('pml-learning-data', JSON.stringify(data));
            
        } catch (error) {
            console.warn('⚠️ Erreur sauvegarde apprentissage:', error);
        }
    }
    
    /**
     * Obtient les métriques du système
     * @returns {Object} Métriques suggestions
     */
    getMetrics() {
        const avgAnalysisTime = this.metrics.analysisTime.length > 0 
            ? this.metrics.analysisTime.reduce((a, b) => a + b, 0) / this.metrics.analysisTime.length
            : 0;
            
        const acceptanceRate = this.metrics.suggestionsGenerated > 0
            ? this.metrics.suggestionsAccepted / this.metrics.suggestionsGenerated
            : 0;
            
        return {
            suggestionsGenerated: this.metrics.suggestionsGenerated,
            suggestionsAccepted: this.metrics.suggestionsAccepted,
            acceptanceRate: Math.round(acceptanceRate * 100),
            avgAnalysisTime: Math.round(avgAnalysisTime),
            cacheHitRate: this.calculateCacheHitRate(),
            learningDataSize: this.learningData.size
        };
    }
    
    /**
     * Calcule le taux de hit du cache
     * @returns {number} Taux cache hit (%)
     * @private
     */
    calculateCacheHitRate() {
        // Estimation basée sur taille cache vs analyses
        const cacheSize = this.suggestionsCache.size;
        const totalAnalyses = this.metrics.analysisTime.length;
        
        return totalAnalyses > 0 ? Math.round((cacheSize / totalAnalyses) * 100) : 0;
    }
    
    /**
     * Active/désactive les suggestions
     * @param {boolean} enabled - État activé
     */
    setEnabled(enabled) {
        this.config.enabled = enabled;
        console.log(`${enabled ? '✅' : '⏸️'} Suggestions ${enabled ? 'activées' : 'désactivées'}`);
    }
    
    /**
     * Nettoie et détruit le système de suggestions
     * @sideEffect Sauvegarde données, nettoie ressources, détache événements
     */
    destroy() {
        console.log('🔄 Destruction SmartSuggestions...');
        
        // Sauvegarder données apprentissage
        this.saveLearningData();
        
        // Nettoyer timers
        if (this.analysisTimer) {
            clearTimeout(this.analysisTimer);
        }
        
        // Nettoyer cache
        this.suggestionsCache.clear();
        
        // Nettoyer composants
        if (this.templateSelector) {
            this.templateSelector.destroy?.();
        }
        
        console.log('✅ SmartSuggestions détruit');
    }
}

// <!-- END OF FILE: smart-suggestions.js -->