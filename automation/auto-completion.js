// <!-- START OF FILE: auto-completion.js -->
// FILENAME: auto-completion.js
// Version: 1.0.0
// Date: 2025-07-31 22:00
// Author: Rolland MELET & Claude Code
// Description: Système auto-complétion ProcessMetaLanguage - TASK-F009 Phase 6

/**
 * Module ProcessMetaLanguage - Système Auto-complétion
 * 
 * Fournit auto-complétion intelligente pour accélérer la saisie et réduire les erreurs
 * lors de la création et configuration des composants ProcessMetaLanguage.
 * 
 * Fonctionnalités:
 * - Auto-complétion noms composants
 * - Suggestions propriétés EPCIS 2.0
 * - Validation temps réel
 * - Correction automatique erreurs
 * - Templates prédéfinis
 * - Historique et favoris
 */

/**
 * Gestionnaire auto-complétion ProcessMetaLanguage
 * @class
 */
export class AutoCompletion {
    /**
     * Initialise le système d'auto-complétion
     * @param {Object} app - Instance Obsidian App
     * @param {Object} options - Configuration auto-complétion
     * @param {boolean} [options.enabled=true] - Auto-complétion activée
     * @param {number} [options.minLength=2] - Longueur minimum pour déclencher
     * @param {number} [options.maxSuggestions=10] - Nombre max suggestions
     * @param {boolean} [options.fuzzySearch=true] - Recherche floue activée
     * @param {Array} [options.customDictionary] - Dictionnaire personnalisé
     */
    constructor(app, options = {}) {
        this.app = app;
        
        // Configuration
        this.config = {
            enabled: options.enabled !== false,
            minLength: options.minLength || 2,
            maxSuggestions: options.maxSuggestions || 10,
            fuzzySearch: options.fuzzySearch !== false,
            caseSensitive: options.caseSensitive || false,
            autoApply: options.autoApply || false,
            showTooltips: options.showTooltips !== false
        };
        
        // Dictionnaires de suggestions
        this.dictionaries = {
            businessSteps: new Map(),
            dispositions: new Map(),
            objectTypes: new Map(),
            industries: new Map(),
            customTerms: new Map()
        };
        
        // État auto-complétion
        this.currentContext = null;
        this.activeSuggestions = [];
        this.selectedIndex = -1;
        
        // UI auto-complétion
        this.suggestionPanel = null;
        this.activeInput = null;
        
        // Historique et statistiques
        this.usageHistory = new Map();
        this.statistics = {
            suggestionsShown: 0,
            suggestionsAccepted: 0,
            charactersTyped: 0,
            charactersSaved: 0
        };
        
        // Cache et performance
        this.searchCache = new Map();
        this.cacheTimeout = 300000; // 5 minutes
        
        console.log('⚡ AutoCompletion initialisé');
    }
    
    /**
     * Initialise le système d'auto-complétion
     * @returns {Promise<void>}
     * @sideEffect Charge dictionnaires, configure UI, événements
     */
    async initialize() {
        try {
            console.log('🚀 Initialisation AutoCompletion...');
            
            // Charger dictionnaires
            await this.loadDictionaries();
            
            // Créer UI
            this.createSuggestionPanel();
            
            // Configurer événements globaux
            this.setupGlobalEvents();
            
            // Charger historique
            this.loadUsageHistory();
            
            console.log('✅ AutoCompletion initialisé avec succès');
            
        } catch (error) {
            console.error('❌ Erreur initialisation AutoCompletion:', error);
            throw error;
        }
    }
    
    /**
     * Charge les dictionnaires de suggestions
     * @private
     */
    async loadDictionaries() {
        // Business Steps EPCIS 2.0
        const businessSteps = [
            'accepting', 'aggregating', 'arriving', 'assembling', 'collecting',
            'commissioning', 'consuming', 'creating_class_instance', 'cycle_counting',
            'decommissioning', 'departing', 'destroying', 'disaggregating', 'disassembling',
            'dispensing', 'encoding', 'entering_exiting', 'holding', 'inspecting',
            'installing', 'killing', 'loading', 'other', 'packing', 'picking',
            'receiving', 'removing', 'repackaging', 'repairing', 'replacing',
            'reserving', 'retail_selling', 'sensor_reporting', 'shipping',
            'stage_outbound', 'stock_taking', 'stocking', 'storing', 'transporting',
            'uninstalling', 'unloading', 'unpacking', 'void_shipping'
        ];
        
        businessSteps.forEach(step => {
            this.dictionaries.businessSteps.set(step, {
                term: step,
                category: 'epcis_business_step',
                description: this.getBusinessStepDescription(step),
                frequency: 0,
                lastUsed: null
            });
        });
        
        // Dispositions EPCIS 2.0
        const dispositions = [
            'active', 'container_closed', 'damaged', 'destroyed', 'dispensed',
            'encoded', 'expired', 'in_progress', 'in_transit', 'inactive',
            'mismatch_instance', 'mismatch_class', 'mismatch_quantity',
            'no_pedigree_match', 'non_sellable_other', 'partially_dispensed',
            'recalled', 'reserved', 'retail_sold', 'returned', 'sellable_accessible',
            'sellable_not_accessible', 'stolen', 'unknown', 'unavailable'
        ];
        
        dispositions.forEach(disp => {
            this.dictionaries.dispositions.set(disp, {
                term: disp,
                category: 'epcis_disposition',
                description: this.getDispositionDescription(disp),
                frequency: 0,
                lastUsed: null
            });
        });
        
        // Types d'objets courants
        const objectTypes = [
            'raw_material', 'component', 'sub_assembly', 'finished_product',
            'package', 'pallet', 'container', 'batch', 'lot', 'shipment',
            'order', 'invoice', 'document', 'asset', 'tool', 'equipment'
        ];
        
        objectTypes.forEach(type => {
            this.dictionaries.objectTypes.set(type, {
                term: type,
                category: 'object_type',
                description: this.getObjectTypeDescription(type),
                frequency: 0,
                lastUsed: null
            });
        });
        
        // Industries
        const industries = [
            'manufacturing', 'logistics', 'retail', 'healthcare', 'food_beverage',
            'automotive', 'aerospace', 'pharmaceuticals', 'textiles', 'electronics',
            'construction', 'agriculture', 'mining', 'chemical', 'energy'
        ];
        
        industries.forEach(industry => {
            this.dictionaries.industries.set(industry, {
                term: industry,
                category: 'industry',
                description: this.getIndustryDescription(industry),
                frequency: 0,
                lastUsed: null
            });
        });
        
        console.log(`📚 ${this.getTotalDictionarySize()} termes chargés dans dictionnaires`);
    }
    
    /**
     * Obtient la description d'un business step
     * @param {string} step - Business step
     * @returns {string} Description
     * @private
     */
    getBusinessStepDescription(step) {
        const descriptions = {
            'receiving': 'Réception de marchandises ou matériaux',
            'inspecting': 'Contrôle qualité et inspection',
            'storing': 'Stockage en entrepôt ou zone dédiée',
            'picking': 'Prélèvement pour préparation commande',
            'packing': 'Emballage et conditionnement',
            'shipping': 'Expédition vers destination finale',
            'assembling': 'Assemblage de composants',
            'transforming': 'Transformation ou traitement',
            'accepting': 'Acceptation après contrôle',
            'commissioning': 'Mise en service ou activation'
        };
        
        return descriptions[step] || `Business step: ${step}`;
    }
    
    /**
     * Obtient la description d'une disposition
     * @param {string} disposition - Disposition
     * @returns {string} Description
     * @private
     */
    getDispositionDescription(disposition) {
        const descriptions = {
            'active': 'Actif et disponible pour utilisation',
            'in_progress': 'En cours de traitement',
            'in_transit': 'En transit vers destination',
            'damaged': 'Endommagé, nécessite réparation',
            'destroyed': 'Détruit, non récupérable',
            'expired': 'Expiré, hors limite utilisation',
            'recalled': 'Rappelé pour problème qualité',
            'returned': 'Retourné par client ou processus'
        };
        
        return descriptions[disposition] || `Disposition: ${disposition}`;
    }
    
    /**
     * Obtient la description d'un type d'objet
     * @param {string} type - Type d'objet
     * @returns {string} Description
     * @private
     */
    getObjectTypeDescription(type) {
        const descriptions = {
            'raw_material': 'Matière première non transformée',
            'component': 'Composant ou pièce détachée',
            'finished_product': 'Produit fini prêt à la vente',
            'package': 'Emballage ou conditionnement',
            'batch': 'Lot de production avec traçabilité',
            'shipment': 'Expédition groupée de produits'
        };
        
        return descriptions[type] || `Type d'objet: ${type}`;
    }
    
    /**
     * Obtient la description d'une industrie
     * @param {string} industry - Industrie
     * @returns {string} Description
     * @private
     */
    getIndustryDescription(industry) {
        const descriptions = {
            'manufacturing': 'Secteur manufacturier et production',
            'logistics': 'Logistique et chaîne d\'approvisionnement',
            'retail': 'Commerce de détail et distribution',
            'healthcare': 'Santé et dispositifs médicaux',
            'food_beverage': 'Industrie agroalimentaire',
            'automotive': 'Industrie automobile'
        };
        
        return descriptions[industry] || `Industrie: ${industry}`;
    }
    
    /**
     * Obtient la taille totale des dictionnaires
     * @returns {number} Nombre total de termes
     * @private
     */
    getTotalDictionarySize() {
        return Object.values(this.dictionaries)
            .reduce((total, dict) => total + dict.size, 0);
    }
    
    /**
     * Crée le panneau de suggestions UI
     * @private
     */
    createSuggestionPanel() {
        this.suggestionPanel = document.createElement('div');
        this.suggestionPanel.className = 'pml-autocomplete-panel';
        this.suggestionPanel.style.display = 'none';
        
        // Styles inline pour éviter dépendances CSS
        Object.assign(this.suggestionPanel.style, {
            position: 'absolute',
            background: 'var(--background-primary)',
            border: '1px solid var(--background-modifier-border)',
            borderRadius: '6px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            maxHeight: '200px',
            overflowY: 'auto',
            zIndex: '2000',
            fontFamily: 'var(--font-interface)',
            fontSize: '13px'
        });
        
        // Ajouter au DOM
        document.body.appendChild(this.suggestionPanel);
        
        console.log('🎨 Panneau suggestions créé');
    }
    
    /**
     * Configure les événements globaux
     * @private
     */
    setupGlobalEvents() {
        // Événements clavier globaux
        document.addEventListener('keydown', (e) => {
            if (this.suggestionPanel.style.display !== 'none') {
                this.handleKeyboardNavigation(e);
            }
        });
        
        // Clic externe pour fermer suggestions
        document.addEventListener('click', (e) => {
            if (!this.suggestionPanel.contains(e.target) && e.target !== this.activeInput) {
                this.hideSuggestions();
            }
        });
        
        // Écoute des inputs dynamiques (délégation)
        document.addEventListener('input', (e) => {
            if (this.shouldTriggerAutoComplete(e.target)) {
                this.handleInput(e);
            }
        });
        
        document.addEventListener('focus', (e) => {
            if (this.shouldTriggerAutoComplete(e.target)) {
                this.activeInput = e.target;
            }
        }, true);
        
        console.log('👂 Événements globaux configurés');
    }
    
    /**
     * Vérifie si un élément doit déclencher l'auto-complétion
     * @param {HTMLElement} element - Élément à vérifier
     * @returns {boolean} True si doit déclencher
     * @private
     */
    shouldTriggerAutoComplete(element) {
        if (!element || !this.config.enabled) return false;
        
        // Types d'éléments supportés
        const supportedTypes = ['input', 'textarea'];
        if (!supportedTypes.includes(element.tagName.toLowerCase())) return false;
        
        // Classes ou attributs spécifiques
        const triggerClasses = [
            'pml-autocomplete',
            'process-name-input',
            'epcis-input',
            'business-step-input',
            'disposition-input'
        ];
        
        return triggerClasses.some(cls => element.classList.contains(cls)) ||
               element.dataset.pmlAutocomplete === 'true';
    }
    
    /**
     * Gère les événements d'input
     * @param {Event} event - Événement input
     * @private
     */
    async handleInput(event) {
        const input = event.target;
        const value = input.value;
        const cursorPos = input.selectionStart;
        
        // Mettre à jour statistiques
        this.statistics.charactersTyped++;
        
        // Vérifier longueur minimum
        if (value.length < this.config.minLength) {
            this.hideSuggestions();
            return;
        }
        
        // Extraire contexte de saisie
        const context = this.extractInputContext(input, value, cursorPos);
        
        // Générer suggestions
        const suggestions = await this.generateSuggestions(context);
        
        if (suggestions.length > 0) {
            this.showSuggestions(suggestions, input);
        } else {
            this.hideSuggestions();
        }
    }
    
    /**
     * Extrait le contexte de saisie
     * @param {HTMLElement} input - Élément input
     * @param {string} value - Valeur actuelle
     * @param {number} cursorPos - Position curseur
     * @returns {Object} Contexte extrait
     * @private
     */
    extractInputContext(input, value, cursorPos) {
        // Extraire terme courant (mot sous le curseur)
        const beforeCursor = value.substring(0, cursorPos);
        const afterCursor = value.substring(cursorPos);
        
        // Trouver début et fin du mot courant
        const wordStart = Math.max(
            beforeCursor.lastIndexOf(' '),
            beforeCursor.lastIndexOf('\n'),
            beforeCursor.lastIndexOf('\t')
        ) + 1;
        
        const wordEnd = Math.min(
            afterCursor.search(/[\s\n\t]/),
            afterCursor.length
        );
        
        const currentTerm = beforeCursor.substring(wordStart) + 
                           (wordEnd > 0 ? afterCursor.substring(0, wordEnd) : afterCursor);
        
        // Identifier type de contexte
        const contextType = this.identifyContextType(input, beforeCursor);
        
        return {
            input,
            value,
            cursorPos,
            currentTerm: currentTerm.trim(),
            wordStart,
            wordEnd: cursorPos + (wordEnd > 0 ? wordEnd : afterCursor.length),
            contextType,
            beforeCursor,
            afterCursor
        };
    }
    
    /**
     * Identifie le type de contexte de saisie
     * @param {HTMLElement} input - Élément input
     * @param {string} beforeCursor - Texte avant curseur
     * @returns {string} Type de contexte
     * @private
     */
    identifyContextType(input, beforeCursor) {
        // Vérifier classes spécifiques
        if (input.classList.contains('business-step-input')) return 'business_step';
        if (input.classList.contains('disposition-input')) return 'disposition';
        if (input.classList.contains('object-type-input')) return 'object_type';
        if (input.classList.contains('industry-input')) return 'industry';
        
        // Vérifier attributs data
        if (input.dataset.contextType) return input.dataset.contextType;
        
        // Analyse contextuelle basée sur texte précédent
        const lowerBefore = beforeCursor.toLowerCase();
        
        if (lowerBefore.includes('business step') || lowerBefore.includes('action')) {
            return 'business_step';
        }
        
        if (lowerBefore.includes('disposition') || lowerBefore.includes('état')) {
            return 'disposition';
        }
        
        if (lowerBefore.includes('object') || lowerBefore.includes('objet')) {
            return 'object_type';
        }
        
        if (lowerBefore.includes('industry') || lowerBefore.includes('industrie')) {
            return 'industry';
        }
        
        return 'general';
    }
    
    /**
     * Génère des suggestions basées sur le contexte
     * @param {Object} context - Contexte de saisie
     * @returns {Promise<Array>} Suggestions générées
     * @private
     */
    async generateSuggestions(context) {
        const { currentTerm, contextType } = context;
        
        if (!currentTerm) return [];
        
        // Vérifier cache
        const cacheKey = `${contextType}_${currentTerm}`;
        if (this.searchCache.has(cacheKey)) {
            const cached = this.searchCache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                return cached.suggestions;
            }
        }
        
        let suggestions = [];
        
        // Rechercher dans dictionnaires appropriés
        switch (contextType) {
            case 'business_step':
                suggestions = this.searchInDictionary(this.dictionaries.businessSteps, currentTerm);
                break;
                
            case 'disposition':
                suggestions = this.searchInDictionary(this.dictionaries.dispositions, currentTerm);
                break;
                
            case 'object_type':
                suggestions = this.searchInDictionary(this.dictionaries.objectTypes, currentTerm);
                break;
                
            case 'industry':
                suggestions = this.searchInDictionary(this.dictionaries.industries, currentTerm);
                break;
                
            default:
                // Recherche générale dans tous les dictionnaires
                suggestions = this.searchInAllDictionaries(currentTerm);
                break;
        }
        
        // Ajouter suggestions historique
        const historySuggestions = this.getHistorySuggestions(currentTerm, contextType);
        suggestions = [...suggestions, ...historySuggestions];
        
        // Éliminer doublons et trier
        suggestions = this.deduplicateAndSort(suggestions);
        
        // Limiter nombre
        suggestions = suggestions.slice(0, this.config.maxSuggestions);
        
        // Mettre en cache
        this.searchCache.set(cacheKey, {
            suggestions,
            timestamp: Date.now()
        });
        
        return suggestions;
    }
    
    /**
     * Recherche dans un dictionnaire spécifique
     * @param {Map} dictionary - Dictionnaire à parcourir
     * @param {string} term - Terme recherché
     * @returns {Array} Suggestions trouvées
     * @private
     */
    searchInDictionary(dictionary, term) {
        const suggestions = [];
        const lowerTerm = term.toLowerCase();
        
        dictionary.forEach((entry, key) => {
            const lowerKey = key.toLowerCase();
            
            // Correspondance exacte au début
            if (lowerKey.startsWith(lowerTerm)) {
                suggestions.push({
                    ...entry,
                    matchType: 'prefix',
                    score: 100 - (key.length - term.length)
                });
            }
            // Correspondance dans le terme
            else if (lowerKey.includes(lowerTerm)) {
                suggestions.push({
                    ...entry,
                    matchType: 'contains',
                    score: 50 - (key.length - term.length)
                });
            }
            // Correspondance floue (si activée)
            else if (this.config.fuzzySearch) {
                const fuzzyScore = this.calculateFuzzyScore(lowerTerm, lowerKey);
                if (fuzzyScore > 0.6) {
                    suggestions.push({
                        ...entry,
                        matchType: 'fuzzy',
                        score: Math.round(fuzzyScore * 30)
                    });
                }
            }
        });
        
        return suggestions;
    }
    
    /**
     * Recherche dans tous les dictionnaires
     * @param {string} term - Terme recherché
     * @returns {Array} Suggestions trouvées
     * @private
     */
    searchInAllDictionaries(term) {
        const allSuggestions = [];
        
        Object.values(this.dictionaries).forEach(dictionary => {
            const dictSuggestions = this.searchInDictionary(dictionary, term);
            allSuggestions.push(...dictSuggestions);
        });
        
        return allSuggestions;
    }
    
    /**
     * Calcule un score de correspondance floue
     * @param {string} term - Terme recherché
     * @param {string} target - Terme cible
     * @returns {number} Score (0-1)
     * @private
     */
    calculateFuzzyScore(term, target) {
        // Algorithme simple de distance de Levenshtein normalisée
        const matrix = [];
        const termLen = term.length;
        const targetLen = target.length;
        
        // Initialiser matrice
        for (let i = 0; i <= targetLen; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= termLen; j++) {
            matrix[0][j] = j;
        }
        
        // Calculer distances
        for (let i = 1; i <= targetLen; i++) {
            for (let j = 1; j <= termLen; j++) {
                if (target.charAt(i - 1) === term.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1, // substitution
                        matrix[i][j - 1] + 1,     // insertion
                        matrix[i - 1][j] + 1      // deletion
                    );
                }
            }
        }
        
        const distance = matrix[targetLen][termLen];
        const maxLength = Math.max(termLen, targetLen);
        
        return maxLength > 0 ? 1 - (distance / maxLength) : 0;
    }
    
    /**
     * Obtient des suggestions basées sur l'historique
     * @param {string} term - Terme recherché
     * @param {string} contextType - Type de contexte
     * @returns {Array} Suggestions historique
     * @private
     */
    getHistorySuggestions(term, contextType) {
        const suggestions = [];
        const lowerTerm = term.toLowerCase();
        
        this.usageHistory.forEach((usage, key) => {
            const lowerKey = key.toLowerCase();
            
            if (lowerKey.startsWith(lowerTerm) && usage.contextType === contextType) {
                suggestions.push({
                    term: key,
                    category: 'history',
                    description: `Utilisé récemment (${usage.count} fois)`,
                    frequency: usage.count,
                    lastUsed: usage.lastUsed,
                    matchType: 'history',
                    score: 80 + Math.min(usage.count, 20) // Boost selon fréquence
                });
            }
        });
        
        return suggestions;
    }
    
    /**
     * Élimine les doublons et trie les suggestions
     * @param {Array} suggestions - Suggestions à traiter
     * @returns {Array} Suggestions traitées
     * @private
     */
    deduplicateAndSort(suggestions) {
        // Éliminer doublons par terme
        const uniqueMap = new Map();
        
        suggestions.forEach(suggestion => {
            const key = suggestion.term;
            if (!uniqueMap.has(key) || uniqueMap.get(key).score < suggestion.score) {
                uniqueMap.set(key, suggestion);
            }
        });
        
        // Convertir en array et trier
        return Array.from(uniqueMap.values())
            .sort((a, b) => {
                // Trier par score décroissant
                if (b.score !== a.score) return b.score - a.score;
                
                // Puis par fréquence d'usage
                const freqA = a.frequency || 0;
                const freqB = b.frequency || 0;
                if (freqB !== freqA) return freqB - freqA;
                
                // Puis alphabétique
                return a.term.localeCompare(b.term);
            });
    }
    
    /**
     * Affiche le panneau de suggestions
     * @param {Array} suggestions - Suggestions à afficher
     * @param {HTMLElement} input - Élément input associé
     * @private
     */
    showSuggestions(suggestions, input) {
        if (!suggestions.length) return;
        
        this.activeSuggestions = suggestions;
        this.selectedIndex = -1;
        
        // Nettoyer panneau
        this.suggestionPanel.innerHTML = '';
        
        // Créer éléments suggestions
        suggestions.forEach((suggestion, index) => {
            const item = this.createSuggestionItem(suggestion, index);
            this.suggestionPanel.appendChild(item);
        });
        
        // Positionner panneau
        this.positionSuggestionPanel(input);
        
        // Afficher panneau
        this.suggestionPanel.style.display = 'block';
        
        // Statistiques
        this.statistics.suggestionsShown++;
        
        console.log(`💡 ${suggestions.length} suggestions affichées`);
    }
    
    /**
     * Crée un élément suggestion
     * @param {Object} suggestion - Suggestion
     * @param {number} index - Index suggestion
     * @returns {HTMLElement} Élément suggestion
     * @private
     */
    createSuggestionItem(suggestion, index) {
        const item = document.createElement('div');
        item.className = 'pml-suggestion-item';
        item.dataset.index = index;
        
        // Styles inline
        Object.assign(item.style, {
            padding: '8px 12px',
            cursor: 'pointer',
            borderBottom: '1px solid var(--background-modifier-border)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
        });
        
        // Icône catégorie
        const icon = document.createElement('span');
        icon.className = 'suggestion-icon';
        icon.textContent = this.getCategoryIcon(suggestion.category);
        icon.style.fontSize = '14px';
        
        // Contenu principal
        const content = document.createElement('div');
        content.className = 'suggestion-content';
        content.style.flex = '1';
        
        // Terme principal
        const term = document.createElement('div');
        term.className = 'suggestion-term';
        term.textContent = suggestion.term;
        term.style.fontWeight = '500';
        term.style.color = 'var(--text-normal)';
        
        // Description
        const desc = document.createElement('div');
        desc.className = 'suggestion-description';
        desc.textContent = suggestion.description;
        desc.style.fontSize = '11px';
        desc.style.color = 'var(--text-muted)';
        desc.style.marginTop = '2px';
        
        content.appendChild(term);
        if (suggestion.description) {
            content.appendChild(desc);
        }
        
        // Score/fréquence (si mode debug)
        if (this.config.showDebug) {
            const score = document.createElement('span');
            score.textContent = suggestion.score;
            score.style.fontSize = '10px';
            score.style.color = 'var(--text-faint)';
            content.appendChild(score);
        }
        
        item.appendChild(icon);
        item.appendChild(content);
        
        // Événements
        item.addEventListener('click', () => {
            this.applySuggestion(suggestion);
        });
        
        item.addEventListener('mouseenter', () => {
            this.highlightSuggestion(index);
        });
        
        return item;
    }
    
    /**
     * Obtient l'icône pour une catégorie
     * @param {string} category - Catégorie
     * @returns {string} Icône
     * @private
     */
    getCategoryIcon(category) {
        const icons = {
            'epcis_business_step': '🔧',
            'epcis_disposition': '🏷️',
            'object_type': '⬡',
            'industry': '🏭',
            'history': '📚',
            'custom': '⚙️'
        };
        
        return icons[category] || '💡';
    }
    
    /**
     * Positionne le panneau de suggestions
     * @param {HTMLElement} input - Élément input de référence
     * @private
     */
    positionSuggestionPanel(input) {
        const inputRect = input.getBoundingClientRect();
        const panelHeight = Math.min(200, this.activeSuggestions.length * 40);
        
        // Position par défaut : sous l'input
        let top = inputRect.bottom + window.scrollY + 2;
        let left = inputRect.left + window.scrollX;
        
        // Vérifier si dépasse en bas
        if (top + panelHeight > window.innerHeight + window.scrollY) {
            // Afficher au-dessus
            top = inputRect.top + window.scrollY - panelHeight - 2;
        }
        
        // Vérifier si dépasse à droite
        const panelWidth = Math.min(300, input.offsetWidth);
        if (left + panelWidth > window.innerWidth + window.scrollX) {
            left = window.innerWidth + window.scrollX - panelWidth - 10;
        }
        
        // Appliquer position
        Object.assign(this.suggestionPanel.style, {
            top: `${top}px`,
            left: `${left}px`,
            width: `${panelWidth}px`,
            maxHeight: `${panelHeight}px`
        });
    }
    
    /**
     * Masque le panneau de suggestions
     * @private
     */
    hideSuggestions() {
        this.suggestionPanel.style.display = 'none';
        this.activeSuggestions = [];
        this.selectedIndex = -1;
        this.activeInput = null;
    }
    
    /**
     * Gère la navigation clavier
     * @param {KeyboardEvent} event - Événement clavier
     * @private
     */
    handleKeyboardNavigation(event) {
        if (!this.activeSuggestions.length) return;
        
        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                this.selectedIndex = Math.min(this.selectedIndex + 1, this.activeSuggestions.length - 1);
                this.highlightSuggestion(this.selectedIndex);
                break;
                
            case 'ArrowUp':
                event.preventDefault();
                this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
                this.highlightSuggestion(this.selectedIndex);
                break;
                
            case 'Enter':
            case 'Tab':
                event.preventDefault();
                if (this.selectedIndex >= 0) {
                    this.applySuggestion(this.activeSuggestions[this.selectedIndex]);
                } else if (this.activeSuggestions.length > 0) {
                    // Appliquer première suggestion
                    this.applySuggestion(this.activeSuggestions[0]);
                }
                break;
                
            case 'Escape':
                event.preventDefault();
                this.hideSuggestions();
                break;
        }
    }
    
    /**
     * Surligne une suggestion
     * @param {number} index - Index à surligner
     * @private
     */
    highlightSuggestion(index) {
        // Retirer surbrillance précédente
        const items = this.suggestionPanel.querySelectorAll('.pml-suggestion-item');
        items.forEach(item => {
            item.style.backgroundColor = '';
        });
        
        // Ajouter surbrillance
        if (index >= 0 && index < items.length) {
            items[index].style.backgroundColor = 'var(--background-modifier-hover)';
            
            // Scroller si nécessaire
            items[index].scrollIntoView({
                block: 'nearest',
                behavior: 'smooth'
            });
        }
        
        this.selectedIndex = index;
    }
    
    /**
     * Applique une suggestion sélectionnée
     * @param {Object} suggestion - Suggestion à appliquer
     * @private
     */
    applySuggestion(suggestion) {
        if (!this.activeInput || !suggestion) return;
        
        try {
            const input = this.activeInput;
            const currentValue = input.value;
            const cursorPos = input.selectionStart;
            
            // Extraire contexte actuel
            const context = this.extractInputContext(input, currentValue, cursorPos);
            
            // Remplacer terme courant
            const beforeTerm = currentValue.substring(0, context.wordStart);
            const afterTerm = currentValue.substring(context.wordEnd);
            const newValue = beforeTerm + suggestion.term + afterTerm;
            
            // Appliquer nouvelle valeur
            input.value = newValue;
            
            // Positionner curseur
            const newCursorPos = context.wordStart + suggestion.term.length;
            input.setSelectionRange(newCursorPos, newCursorPos);
            
            // Déclencher événements
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
            
            // Statistiques
            this.statistics.suggestionsAccepted++;
            this.statistics.charactersSaved += Math.max(0, suggestion.term.length - context.currentTerm.length);
            
            // Enregistrer usage
            this.recordUsage(suggestion, context.contextType);
            
            // Masquer suggestions
            this.hideSuggestions();
            
            console.log(`✅ Suggestion appliquée: "${suggestion.term}"`);
            
        } catch (error) {
            console.error('❌ Erreur application suggestion:', error);
        }
    }
    
    /**
     * Enregistre l'usage d'une suggestion
     * @param {Object} suggestion - Suggestion utilisée
     * @param {string} contextType - Type de contexte
     * @private
     */
    recordUsage(suggestion, contextType) {
        const key = suggestion.term;
        
        if (!this.usageHistory.has(key)) {
            this.usageHistory.set(key, {
                count: 0,
                contextType,
                firstUsed: Date.now(),
                lastUsed: null
            });
        }
        
        const usage = this.usageHistory.get(key);
        usage.count++;
        usage.lastUsed = Date.now();
        
        // Mettre à jour dictionnaire si applicable
        Object.values(this.dictionaries).forEach(dict => {
            if (dict.has(key)) {
                const entry = dict.get(key);
                entry.frequency++;
                entry.lastUsed = Date.now();
            }
        });
        
        // Sauvegarder historique
        this.saveUsageHistory();
    }
    
    /**
     * Charge l'historique d'usage
     * @private
     */
    loadUsageHistory() {
        try {
            const saved = localStorage.getItem('pml-autocomplete-history');
            if (saved) {
                const data = JSON.parse(saved);
                this.usageHistory = new Map(data.history || []);
                this.statistics = { ...this.statistics, ...data.statistics };
                console.log(`📚 Historique chargé: ${this.usageHistory.size} entrées`);
            }
        } catch (error) {
            console.warn('⚠️ Erreur chargement historique:', error);
        }
    }
    
    /**
     * Sauvegarde l'historique d'usage
     * @private
     */
    saveUsageHistory() {
        try {
            const data = {
                history: Array.from(this.usageHistory.entries()),
                statistics: this.statistics,
                version: '1.0.0',
                timestamp: Date.now()
            };
            
            localStorage.setItem('pml-autocomplete-history', JSON.stringify(data));
            
        } catch (error) {
            console.warn('⚠️ Erreur sauvegarde historique:', error);
        }
    }
    
    /**
     * Ajoute un terme personnalisé au dictionnaire
     * @param {string} term - Terme à ajouter
     * @param {string} category - Catégorie
     * @param {string} description - Description
     */
    addCustomTerm(term, category = 'custom', description = '') {
        this.dictionaries.customTerms.set(term, {
            term,
            category,
            description: description || `Terme personnalisé: ${term}`,
            frequency: 0,
            lastUsed: null,
            custom: true
        });
        
        console.log(`➕ Terme personnalisé ajouté: "${term}"`);
    }
    
    /**
     * Supprime un terme personnalisé
     * @param {string} term - Terme à supprimer
     */
    removeCustomTerm(term) {
        if (this.dictionaries.customTerms.delete(term)) {
            console.log(`➖ Terme personnalisé supprimé: "${term}"`);
        }
    }
    
    /**
     * Active un input pour l'auto-complétion
     * @param {HTMLElement} input - Élément input
     * @param {Object} options - Options spécifiques
     */
    enableForInput(input, options = {}) {
        if (!input) return;
        
        // Ajouter classe de déclenchement
        input.classList.add('pml-autocomplete');
        
        // Appliquer options spécifiques
        if (options.contextType) {
            input.dataset.contextType = options.contextType;
        }
        
        if (options.placeholder) {
            input.placeholder = options.placeholder;
        }
        
        console.log(`⚡ Auto-complétion activée pour input: ${input.id || 'unnamed'}`);
    }
    
    /**
     * Désactive l'auto-complétion pour un input
     * @param {HTMLElement} input - Élément input
     */
    disableForInput(input) {
        if (!input) return;
        
        input.classList.remove('pml-autocomplete');
        delete input.dataset.contextType;
        
        if (this.activeInput === input) {
            this.hideSuggestions();
        }
    }
    
    /**
     * Obtient les statistiques d'usage
     * @returns {Object} Statistiques détaillées
     */
    getStatistics() {
        const timeSaved = this.statistics.charactersSaved * 0.1; // ~100ms par caractère
        const acceptanceRate = this.statistics.suggestionsShown > 0 
            ? Math.round((this.statistics.suggestionsAccepted / this.statistics.suggestionsShown) * 100)
            : 0;
            
        return {
            ...this.statistics,
            timeSavedSeconds: Math.round(timeSaved),
            acceptanceRate,
            dictionarySize: this.getTotalDictionarySize(),
            historySize: this.usageHistory.size,
            cacheSize: this.searchCache.size
        };
    }
    
    /**
     * Nettoie le cache expiré
     */
    cleanCache() {
        const now = Date.now();
        let cleaned = 0;
        
        this.searchCache.forEach((entry, key) => {
            if (now - entry.timestamp > this.cacheTimeout) {
                this.searchCache.delete(key);
                cleaned++;
            }
        });
        
        if (cleaned > 0) {
            console.log(`🧹 Cache nettoyé: ${cleaned} entrées supprimées`);
        }
    }
    
    /**
     * Active/désactive l'auto-complétion
     * @param {boolean} enabled - État activé
     */
    setEnabled(enabled) {
        this.config.enabled = enabled;
        
        if (!enabled) {
            this.hideSuggestions();
        }
        
        console.log(`${enabled ? '✅' : '⏸️'} Auto-complétion ${enabled ? 'activée' : 'désactivée'}`);
    }
    
    /**
     * Nettoie et détruit le système d'auto-complétion
     * @sideEffect Retire UI, sauvegarde données, détache événements
     */
    destroy() {
        console.log('🔄 Destruction AutoCompletion...');
        
        // Sauvegarder historique
        this.saveUsageHistory();
        
        // Masquer et retirer panneau
        this.hideSuggestions();
        if (this.suggestionPanel && this.suggestionPanel.parentNode) {
            this.suggestionPanel.parentNode.removeChild(this.suggestionPanel);
        }
        
        // Nettoyer cache
        this.searchCache.clear();
        
        // Réinitialiser état
        this.activeSuggestions = [];
        this.activeInput = null;
        
        console.log('✅ AutoCompletion détruit');
    }
}

// <!-- END OF FILE: auto-completion.js -->