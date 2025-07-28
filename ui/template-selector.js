// <!-- START OF FILE: template-selector.js -->
// FILENAME: template-selector.js
// Version: 1.0.0
// Date: 2025-07-28 17:00
// Author: Rolland MELET & Claude Code
// Description: Interface de sélection avancée des templates EPCIS 2.0 avec search, filters et preview

/**
 * Interface modale avancée pour sélectionner des templates EPCIS 2.0
 * Supporte recherche textuelle, filtres par catégorie/type et preview avec métadonnées
 * @class
 */
export class TemplateSelector {
    /**
     * Crée une instance du sélecteur de templates
     * @param {Object} app - Instance de l'application Obsidian
     * @param {Object} options - Options de configuration
     * @param {string} options.templatesPath - Chemin vers les templates EPCIS
     * @param {Function} options.onSelect - Callback lors de la sélection de templates
     * @param {boolean} options.multiSelect - Autoriser la sélection multiple
     * @example
     * const selector = new TemplateSelector(this.app, {
     *   templatesPath: './templates/epcis/',
     *   onSelect: (templates) => this.applyTemplates(templates),
     *   multiSelect: true
     * });
     * selector.show();
     */
    constructor(app, options = {}) {
        this.app = app;
        this.options = {
            templatesPath: options.templatesPath || './templates/epcis/',
            onSelect: options.onSelect || (() => {}),
            multiSelect: options.multiSelect !== false,
            position: options.position || 'center',
            width: options.width || 800,
            height: options.height || 600
        };

        // État interne
        this.isVisible = false;
        this.templates = new Map();
        this.filteredTemplates = new Map();
        this.selectedTemplates = new Set();
        this.searchQuery = '';
        this.activeFilters = {
            category: 'all',
            type: 'all',
            compatibility: 'all',
            actionType: 'all'
        };
        this.currentPreview = null;
        
        // Éléments DOM
        this.modal = null;
        this.searchInput = null;
        this.filtersContainer = null;
        this.templatesGrid = null;
        this.previewPanel = null;
        this.selectionPanel = null;
        this.statusBar = null;

        // Données EPCIS chargées
        this.epcisIndex = null;
        this.businessStepsIndex = null;
        this.dispositionsIndex = null;

        // Performance et UX
        this.searchDebounceTimer = null;
        this.loadingState = false;
        this.favoriteTemplates = new Set();
        this.recentSelections = [];

        // Bind methods
        this.handleKeyboard = this.handleKeyboard.bind(this);
        this.handleSearchInput = this.handleSearchInput.bind(this);
        this.handleFilterChange = this.handleFilterChange.bind(this);
    }

    /**
     * Affiche le sélecteur de templates et charge les données EPCIS
     * @sideEffect Crée la modal, charge l'index EPCIS et attache les listeners
     * @returns {Promise<void>}
     * @example
     * // Afficher le sélecteur pour choisir des templates
     * await selector.show();
     */
    async show() {
        if (this.isVisible) return;

        this.isVisible = true;
        this.loadingState = true;

        try {
            // Charger l'index EPCIS unifié
            await this.loadEPCISIndex();
            
            // Créer l'interface modale
            this.createModal();
            
            // Charger et afficher les templates
            await this.loadTemplates();
            this.renderTemplates();
            
            // Attacher les événements
            this.attachEventListeners();
            
            // Focus sur la recherche
            setTimeout(() => {
                if (this.searchInput) {
                    this.searchInput.focus();
                }
            }, 100);

        } catch (error) {
            console.error('Erreur lors du chargement du sélecteur:', error);
            this.updateStatus('Erreur chargement templates EPCIS 2.0', 'error');
        } finally {
            this.loadingState = false;
        }
    }

    /**
     * Masque le sélecteur et nettoie les ressources
     * @sideEffect Retire la modal du DOM et nettoie les listeners
     * @example
     * // Fermer le sélecteur
     * selector.hide();
     */
    hide() {
        if (!this.isVisible) return;

        this.isVisible = false;
        this.detachEventListeners();
        
        if (this.modal && this.modal.parentNode) {
            this.modal.parentNode.removeChild(this.modal);
        }
        
        this.selectedTemplates.clear();
        this.currentPreview = null;
    }

    /**
     * Charge l'index EPCIS unifié et les index spécialisés
     * @private
     * @sideEffect Charge les données JSON en mémoire
     * @returns {Promise<void>}
     */
    async loadEPCISIndex() {
        try {
            // Charger l'index unifié
            const unifiedResponse = await fetch(`${this.options.templatesPath}epcis-unified-index.json`);
            this.epcisIndex = await unifiedResponse.json();

            // Charger l'index des business steps
            const businessResponse = await fetch(`${this.options.templatesPath}business-steps-index.json`);
            this.businessStepsIndex = await businessResponse.json();

            // Charger l'index des dispositions
            const dispositionsResponse = await fetch(`${this.options.templatesPath}dispositions-index.json`);
            this.dispositionsIndex = await dispositionsResponse.json();

            console.log('Index EPCIS chargés:', {
                unified: this.epcisIndex?.epcis_unified_index?.metadata?.total_elements,
                businessSteps: this.businessStepsIndex?.index_metadata?.total_business_steps,
                dispositions: this.dispositionsIndex?.dispositions_index?.metadata?.total_dispositions
            });

        } catch (error) {
            console.error('Erreur chargement index EPCIS:', error);
            throw new Error('Impossible de charger les templates EPCIS 2.0');
        }
    }

    /**
     * Charge tous les templates EPCIS depuis les index
     * @private
     * @sideEffect Remplit la Map des templates
     * @returns {Promise<void>}
     */
    async loadTemplates() {
        this.templates.clear();

        // Charger les business steps
        if (this.businessStepsIndex?.business_steps) {
            Object.entries(this.businessStepsIndex.business_steps).forEach(([id, template]) => {
                this.templates.set(id, {
                    id,
                    name: id,
                    type: 'business_step',
                    category: template.category,
                    description: template.description,
                    actionType: template.action_type,
                    workflowPosition: template.workflow_position,
                    commonObjects: template.common_objects || [],
                    typicalTransitions: template.typical_transitions || [],
                    file: template.file,
                    color: this.getCategoryColor(template.category, 'business_step'),
                    icon: this.getCategoryIcon(template.category),
                    compatibility: this.getCompatibility(id, 'business_step'),
                    searchableText: `${id} ${template.category} ${template.description} ${template.common_objects?.join(' ') || ''}`.toLowerCase()
                });
            });
        }

        // Charger les dispositions
        if (this.dispositionsIndex?.dispositions_index?.dispositions) {
            Object.entries(this.dispositionsIndex.dispositions_index.dispositions).forEach(([id, template]) => {
                this.templates.set(id, {
                    id,
                    name: id,
                    type: 'disposition',
                    category: template.category,
                    description: template.description,
                    dispositionType: template.type,
                    isSellable: template.is_sellable,
                    requiresAction: template.requires_action,
                    compatibleBusinessSteps: template.compatible_business_steps || [],
                    file: template.file,
                    color: template.color || this.getCategoryColor(template.category, 'disposition'),
                    icon: this.getDispositionIcon(template.type),
                    compatibility: this.getCompatibility(id, 'disposition'),
                    searchableText: `${id} ${template.category} ${template.description} ${template.type}`.toLowerCase()
                });
            });
        }

        console.log(`Templates chargés: ${this.templates.size} (Business Steps + Dispositions)`);
    }

    /**
     * Crée l'interface modale complète
     * @private
     * @sideEffect Crée et ajoute des éléments DOM
     */
    createModal() {
        // Container principal
        this.modal = document.createElement('div');
        this.modal.className = 'template-selector-modal';
        this.modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(4px);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.2s ease-out;
        `;

        // Dialog principal
        const dialog = document.createElement('div');
        dialog.className = 'template-selector-dialog';
        dialog.style.cssText = `
            width: ${this.options.width}px;
            height: ${this.options.height}px;
            max-width: 95vw;
            max-height: 95vh;
            background: var(--background-primary);
            border: 1px solid var(--background-modifier-border);
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            animation: slideInUp 0.3s ease-out;
        `;

        // Header avec titre et fermeture
        const header = this.createHeader();
        dialog.appendChild(header);

        // Barre de recherche et filtres
        const searchAndFilters = this.createSearchAndFilters();
        dialog.appendChild(searchAndFilters);

        // Contenu principal (grid + preview)
        const mainContent = this.createMainContent();
        dialog.appendChild(mainContent);

        // Panel de sélection et actions
        const selectionPanel = this.createSelectionPanel();
        dialog.appendChild(selectionPanel);

        this.modal.appendChild(dialog);
        document.body.appendChild(this.modal);

        // CSS animations
        this.injectCSS();
    }

    /**
     * Crée le header avec titre et bouton fermeture
     * @private
     * @returns {HTMLElement} Element header
     */
    createHeader() {
        const header = document.createElement('div');
        header.className = 'template-selector-header';
        header.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px 20px;
            border-bottom: 1px solid var(--background-modifier-border);
            background: var(--background-secondary);
        `;

        const title = document.createElement('h2');
        title.textContent = 'Sélection Templates EPCIS 2.0';
        title.style.cssText = `
            margin: 0;
            font-size: 18px;
            font-weight: 600;
            color: var(--text-normal);
            display: flex;
            align-items: center;
            gap: 8px;
        `;

        const icon = document.createElement('span');
        icon.innerHTML = '🏷️';
        icon.style.fontSize = '20px';
        title.insertBefore(icon, title.firstChild);

        const subtitle = document.createElement('div');
        subtitle.textContent = '41 Business Steps + 25 Dispositions • Conformité GS1 EPCIS 2.0';
        subtitle.style.cssText = `
            font-size: 12px;
            color: var(--text-muted);
            margin-top: 4px;
        `;

        const titleContainer = document.createElement('div');
        titleContainer.appendChild(title);
        titleContainer.appendChild(subtitle);

        const closeButton = document.createElement('button');
        closeButton.innerHTML = '×';
        closeButton.className = 'template-selector-close';
        closeButton.style.cssText = `
            background: none;
            border: none;
            font-size: 24px;
            color: var(--text-muted);
            cursor: pointer;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 6px;
            transition: all 0.2s;
        `;
        closeButton.addEventListener('click', () => this.hide());
        closeButton.addEventListener('mouseenter', () => {
            closeButton.style.background = 'var(--background-modifier-hover)';
            closeButton.style.color = 'var(--text-normal)';
        });
        closeButton.addEventListener('mouseleave', () => {
            closeButton.style.background = 'none';
            closeButton.style.color = 'var(--text-muted)';
        });

        header.appendChild(titleContainer);
        header.appendChild(closeButton);

        return header;
    }

    /**
     * Crée la barre de recherche et les filtres
     * @private
     * @returns {HTMLElement} Element search and filters
     */
    createSearchAndFilters() {
        const container = document.createElement('div');
        container.className = 'template-selector-search-filters';
        container.style.cssText = `
            padding: 16px 20px;
            border-bottom: 1px solid var(--background-modifier-border);
            background: var(--background-primary);
        `;

        // Barre de recherche
        const searchContainer = document.createElement('div');
        searchContainer.style.cssText = `
            position: relative;
            margin-bottom: 12px;
        `;

        this.searchInput = document.createElement('input');
        this.searchInput.type = 'text';
        this.searchInput.placeholder = 'Rechercher templates... (ex: "receiving", "quality", "logistics")';
        this.searchInput.className = 'template-search-input';
        this.searchInput.style.cssText = `
            width: 100%;
            padding: 10px 16px 10px 40px;
            border: 1px solid var(--background-modifier-border);
            border-radius: 8px;
            background: var(--background-secondary);
            color: var(--text-normal);
            font-size: 14px;
            transition: all 0.2s;
        `;

        const searchIcon = document.createElement('span');
        searchIcon.innerHTML = '🔍';
        searchIcon.style.cssText = `
            position: absolute;
            left: 12px;
            top: 50%;
            transform: translateY(-50%);
            font-size: 16px;
            pointer-events: none;
        `;

        searchContainer.appendChild(searchIcon);
        searchContainer.appendChild(this.searchInput);

        // Filtres
        const filtersRow = document.createElement('div');
        filtersRow.style.cssText = `
            display: flex;
            gap: 12px;
            align-items: center;
            flex-wrap: wrap;
        `;

        // Filtres de catégorie
        const categoryFilter = this.createFilter('Catégorie', 'category', [
            { value: 'all', label: 'Toutes' },
            { value: 'logistics', label: 'Logistics 🚛' },
            { value: 'manufacturing', label: 'Manufacturing ⚙️' },
            { value: 'retail', label: 'Retail 🛒' },
            { value: 'pharmaceutical', label: 'Pharmaceutical 💊' },
            { value: 'operational', label: 'Operational' },
            { value: 'quality', label: 'Quality' },
            { value: 'lifecycle', label: 'Lifecycle' }
        ]);

        // Filtres de type
        const typeFilter = this.createFilter('Type', 'type', [
            { value: 'all', label: 'Tous' },
            { value: 'business_step', label: 'Business Steps' },
            { value: 'disposition', label: 'Dispositions' }
        ]);

        // Filtres par type d'action
        const actionTypeFilter = this.createFilter('Action', 'actionType', [
            { value: 'all', label: 'Toutes' },
            { value: 'primary', label: 'Primary' },
            { value: 'secondary', label: 'Secondary' }
        ]);

        // Bouton reset
        const resetButton = document.createElement('button');
        resetButton.textContent = 'Reset';
        resetButton.className = 'template-filter-reset';
        resetButton.style.cssText = `
            padding: 6px 12px;
            background: var(--background-modifier-hover);
            border: 1px solid var(--background-modifier-border);
            border-radius: 6px;
            color: var(--text-normal);
            font-size: 12px;
            cursor: pointer;
            transition: all 0.2s;
        `;
        resetButton.addEventListener('click', () => this.resetFilters());

        filtersRow.appendChild(categoryFilter);
        filtersRow.appendChild(typeFilter);
        filtersRow.appendChild(actionTypeFilter);
        filtersRow.appendChild(resetButton);

        container.appendChild(searchContainer);
        container.appendChild(filtersRow);

        return container;
    }

    /**
     * Crée un filtre dropdown
     * @private
     * @param {string} label - Label du filtre
     * @param {string} filterKey - Clé du filtre dans activeFilters
     * @param {Array} options - Options du filtre
     * @returns {HTMLElement} Element select
     */
    createFilter(label, filterKey, options) {
        const container = document.createElement('div');
        container.style.cssText = `
            display: flex;
            align-items: center;
            gap: 6px;
        `;

        const labelEl = document.createElement('label');
        labelEl.textContent = label + ':';
        labelEl.style.cssText = `
            font-size: 12px;
            font-weight: 500;
            color: var(--text-muted);
            white-space: nowrap;
        `;

        const select = document.createElement('select');
        select.className = `template-filter-${filterKey}`;
        select.style.cssText = `
            padding: 4px 8px;
            border: 1px solid var(--background-modifier-border);
            border-radius: 4px;
            background: var(--background-secondary);
            color: var(--text-normal);
            font-size: 12px;
            cursor: pointer;
        `;

        options.forEach(option => {
            const optionEl = document.createElement('option');
            optionEl.value = option.value;
            optionEl.textContent = option.label;
            select.appendChild(optionEl);
        });

        select.addEventListener('change', () => {
            this.activeFilters[filterKey] = select.value;
            this.applyFilters();
        });

        container.appendChild(labelEl);
        container.appendChild(select);

        return container;
    }

    /**
     * Crée le contenu principal avec grid et preview
     * @private
     * @returns {HTMLElement} Element main content
     */
    createMainContent() {
        const mainContent = document.createElement('div');
        mainContent.className = 'template-selector-main';
        mainContent.style.cssText = `
            flex: 1;
            display: flex;
            overflow: hidden;
        `;

        // Grid des templates
        const leftPanel = document.createElement('div');
        leftPanel.style.cssText = `
            flex: 0 0 65%;
            display: flex;
            flex-direction: column;
            border-right: 1px solid var(--background-modifier-border);
        `;

        // Header grid avec stats
        const gridHeader = document.createElement('div');
        gridHeader.className = 'templates-grid-header';
        gridHeader.style.cssText = `
            padding: 12px 16px;
            background: var(--background-secondary);
            border-bottom: 1px solid var(--background-modifier-border);
            font-size: 12px;
            color: var(--text-muted);
            display: flex;
            justify-content: space-between;
            align-items: center;
        `;

        const statsEl = document.createElement('span');
        statsEl.id = 'templates-stats';
        statsEl.textContent = 'Chargement...';

        const viewToggle = document.createElement('div');
        viewToggle.style.cssText = `
            display: flex;
            gap: 4px;
        `;

        ['grid', 'list'].forEach(view => {
            const button = document.createElement('button');
            button.textContent = view === 'grid' ? '⊞' : '☰';
            button.className = `view-toggle-${view}`;
            button.style.cssText = `
                padding: 4px 8px;
                background: ${view === 'grid' ? 'var(--interactive-accent)' : 'var(--background-primary)'};
                color: ${view === 'grid' ? 'white' : 'var(--text-normal)'};
                border: 1px solid var(--background-modifier-border);
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
            `;
            viewToggle.appendChild(button);
        });

        gridHeader.appendChild(statsEl);
        gridHeader.appendChild(viewToggle);

        // Container scrollable pour templates
        const scrollContainer = document.createElement('div');
        scrollContainer.style.cssText = `
            flex: 1;
            overflow-y: auto;
            padding: 16px;
        `;

        this.templatesGrid = document.createElement('div');
        this.templatesGrid.className = 'templates-grid';
        this.templatesGrid.style.cssText = `
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 12px;
        `;

        scrollContainer.appendChild(this.templatesGrid);
        leftPanel.appendChild(gridHeader);
        leftPanel.appendChild(scrollContainer);

        // Panel de preview
        this.previewPanel = document.createElement('div');
        this.previewPanel.className = 'template-preview-panel';
        this.previewPanel.style.cssText = `
            flex: 0 0 35%;
            background: var(--background-secondary);
            display: flex;
            flex-direction: column;
            overflow: hidden;
        `;

        const previewHeader = document.createElement('div');
        previewHeader.style.cssText = `
            padding: 12px 16px;
            border-bottom: 1px solid var(--background-modifier-border);
            font-weight: 500;
            color: var(--text-normal);
        `;
        previewHeader.textContent = 'Preview Template';

        const previewContent = document.createElement('div');
        previewContent.id = 'template-preview-content';
        previewContent.style.cssText = `
            flex: 1;
            padding: 16px;
            overflow-y: auto;
            color: var(--text-muted);
            text-align: center;
        `;
        previewContent.innerHTML = `
            <div style="margin-top: 40px;">
                <div style="font-size: 48px; margin-bottom: 12px;">🏷️</div>
                <div>Sélectionnez un template pour voir le preview</div>
                <div style="font-size: 12px; margin-top: 8px;">
                    Métadonnées • Compatibilité • Exemples
                </div>
            </div>
        `;

        this.previewPanel.appendChild(previewHeader);
        this.previewPanel.appendChild(previewContent);

        mainContent.appendChild(leftPanel);
        mainContent.appendChild(this.previewPanel);

        return mainContent;
    }

    /**
     * Crée le panel de sélection et les boutons d'action
     * @private
     * @returns {HTMLElement} Element selection panel
     */
    createSelectionPanel() {
        this.selectionPanel = document.createElement('div');
        this.selectionPanel.className = 'template-selection-panel';
        this.selectionPanel.style.cssText = `
            padding: 16px 20px;
            border-top: 1px solid var(--background-modifier-border);
            background: var(--background-secondary);
            display: flex;
            justify-content: space-between;
            align-items: center;
        `;

        // Sélection actuelle
        const selectionInfo = document.createElement('div');
        selectionInfo.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 4px;
        `;

        const selectionCount = document.createElement('div');
        selectionCount.id = 'selection-count';
        selectionCount.style.cssText = `
            font-size: 14px;
            font-weight: 500;
            color: var(--text-normal);
        `;
        selectionCount.textContent = 'Aucun template sélectionné';

        const selectionMultiple = document.createElement('label');
        selectionMultiple.style.cssText = `
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 12px;
            color: var(--text-muted);
            cursor: pointer;
        `;

        const multiSelectCheckbox = document.createElement('input');
        multiSelectCheckbox.type = 'checkbox';
        multiSelectCheckbox.checked = this.options.multiSelect;
        multiSelectCheckbox.addEventListener('change', (e) => {
            this.options.multiSelect = e.target.checked;
            if (!this.options.multiSelect && this.selectedTemplates.size > 1) {
                // Garder seulement le dernier sélectionné
                const lastSelected = Array.from(this.selectedTemplates).pop();
                this.selectedTemplates.clear();
                this.selectedTemplates.add(lastSelected);
                this.updateSelectionUI();
            }
        });

        selectionMultiple.appendChild(multiSelectCheckbox);
        selectionMultiple.appendChild(document.createTextNode('Sélection multiple'));

        selectionInfo.appendChild(selectionCount);
        selectionInfo.appendChild(selectionMultiple);

        // Status bar
        this.statusBar = document.createElement('div');
        this.statusBar.id = 'template-status-bar';
        this.statusBar.style.cssText = `
            font-size: 12px;
            color: var(--text-muted);
            text-align: center;
            min-width: 200px;
        `;

        // Boutons d'action
        const actionsContainer = document.createElement('div');
        actionsContainer.style.cssText = `
            display: flex;
            gap: 8px;
        `;

        const cancelButton = document.createElement('button');
        cancelButton.textContent = 'Annuler';
        cancelButton.className = 'template-action-cancel';
        cancelButton.style.cssText = `
            padding: 8px 16px;
            background: var(--background-primary);
            border: 1px solid var(--background-modifier-border);
            border-radius: 6px;
            color: var(--text-normal);
            cursor: pointer;
            transition: all 0.2s;
        `;
        cancelButton.addEventListener('click', () => this.hide());

        const applyButton = document.createElement('button');
        applyButton.textContent = 'Appliquer';
        applyButton.id = 'template-apply-button';
        applyButton.className = 'template-action-apply';
        applyButton.disabled = true;
        applyButton.style.cssText = `
            padding: 8px 16px;
            background: var(--interactive-accent);
            border: 1px solid var(--interactive-accent);
            border-radius: 6px;
            color: white;
            cursor: pointer;
            transition: all 0.2s;
            opacity: 0.5;
        `;
        applyButton.addEventListener('click', () => this.applySelection());

        actionsContainer.appendChild(cancelButton);
        actionsContainer.appendChild(applyButton);

        this.selectionPanel.appendChild(selectionInfo);
        this.selectionPanel.appendChild(this.statusBar);
        this.selectionPanel.appendChild(actionsContainer);

        return this.selectionPanel;
    }

    /**
     * Attache tous les listeners d'événements
     * @private
     * @sideEffect Ajoute des listeners globaux
     */
    attachEventListeners() {
        // Recherche avec debounce
        this.searchInput.addEventListener('input', this.handleSearchInput);
        
        // Fermeture avec Escape
        document.addEventListener('keydown', this.handleKeyboard);
        
        // Fermeture en cliquant en dehors
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.hide();
            }
        });
    }

    /**
     * Détache tous les listeners d'événements
     * @private
     * @sideEffect Retire les listeners globaux
     */
    detachEventListeners() {
        document.removeEventListener('keydown', this.handleKeyboard);
        if (this.searchDebounceTimer) {
            clearTimeout(this.searchDebounceTimer);
        }
    }

    /**
     * Gère les événements clavier
     * @private
     * @param {KeyboardEvent} e - Événement clavier
     */
    handleKeyboard(e) {
        if (e.key === 'Escape') {
            this.hide();
        }
    }

    /**
     * Gère la saisie dans la recherche avec debounce
     * @private
     */
    handleSearchInput() {
        clearTimeout(this.searchDebounceTimer);
        this.searchDebounceTimer = setTimeout(() => {
            this.searchQuery = this.searchInput.value.toLowerCase().trim();
            this.applyFilters();
        }, 300);
    }

    /**
     * Applique les filtres et recherche aux templates
     * @private
     * @sideEffect Met à jour filteredTemplates et re-render
     */
    applyFilters() {
        this.filteredTemplates.clear();

        this.templates.forEach((template, id) => {
            let matches = true;

            // Filtre de recherche textuelle
            if (this.searchQuery) {
                matches = matches && template.searchableText.includes(this.searchQuery);
            }

            // Filtre de catégorie
            if (this.activeFilters.category !== 'all') {
                matches = matches && template.category === this.activeFilters.category;
            }

            // Filtre de type
            if (this.activeFilters.type !== 'all') {
                matches = matches && template.type === this.activeFilters.type;
            }

            // Filtre d'action type (seulement pour business steps)
            if (this.activeFilters.actionType !== 'all' && template.type === 'business_step') {
                matches = matches && template.actionType === this.activeFilters.actionType;
            }

            if (matches) {
                this.filteredTemplates.set(id, template);
            }
        });

        this.renderTemplates();
        this.updateStats();
    }

    /**
     * Rend les templates dans la grid
     * @private
     * @sideEffect Modifie le contenu de templatesGrid
     */
    renderTemplates() {
        if (!this.templatesGrid) return;

        this.templatesGrid.innerHTML = '';

        if (this.filteredTemplates.size === 0) {
            const emptyState = this.createEmptyState();
            this.templatesGrid.appendChild(emptyState);
            return;
        }

        // Trier les templates par catégorie puis nom
        const sortedTemplates = Array.from(this.filteredTemplates.values()).sort((a, b) => {
            if (a.category !== b.category) {
                return a.category.localeCompare(b.category);
            }
            return a.name.localeCompare(b.name);
        });

        sortedTemplates.forEach(template => {
            const templateCard = this.createTemplateCard(template);
            this.templatesGrid.appendChild(templateCard);
        });
    }

    /**
     * Crée une carte template
     * @private
     * @param {Object} template - Données du template
     * @returns {HTMLElement} Element carte template
     */
    createTemplateCard(template) {
        const card = document.createElement('div');
        card.className = 'template-card';
        card.dataset.templateId = template.id;
        card.style.cssText = `
            background: var(--background-primary);
            border: 1px solid var(--background-modifier-border);
            border-radius: 8px;
            padding: 12px;
            cursor: pointer;
            transition: all 0.2s;
            position: relative;
            min-height: 120px;
            display: flex;
            flex-direction: column;
        `;

        // Header avec icône et type
        const header = document.createElement('div');
        header.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 8px;
        `;

        const iconType = document.createElement('div');
        iconType.style.cssText = `
            display: flex;
            align-items: center;
            gap: 6px;
        `;

        const icon = document.createElement('span');
        icon.textContent = template.icon;
        icon.style.fontSize = '18px';

        const typeBadge = document.createElement('span');
        typeBadge.textContent = template.type === 'business_step' ? 'BS' : 'DISP';
        typeBadge.style.cssText = `
            background: ${template.color};
            color: white;
            font-size: 10px;
            font-weight: 600;
            padding: 2px 6px;
            border-radius: 10px;
        `;

        iconType.appendChild(icon);
        iconType.appendChild(typeBadge);

        // Checkbox de sélection
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = this.selectedTemplates.has(template.id);
        checkbox.addEventListener('change', (e) => {
            e.stopPropagation();
            this.toggleTemplateSelection(template.id);
        });

        header.appendChild(iconType);
        header.appendChild(checkbox);

        // Nom du template
        const name = document.createElement('div');
        name.textContent = template.name;
        name.style.cssText = `
            font-weight: 500;
            color: var(--text-normal);
            margin-bottom: 4px;
            font-size: 14px;
        `;

        // Catégorie
        const category = document.createElement('div');
        category.textContent = template.category;
        category.style.cssText = `
            font-size: 11px;
            color: ${template.color};
            font-weight: 500;
            text-transform: capitalize;
            margin-bottom: 6px;
        `;

        // Description
        const description = document.createElement('div');
        description.textContent = template.description;
        description.style.cssText = `
            font-size: 12px;
            color: var(--text-muted);
            line-height: 1.4;
            flex: 1;
        `;

        // Footer avec indicateurs
        const footer = document.createElement('div');
        footer.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 8px;
            font-size: 10px;
            color: var(--text-muted);
        `;

        const indicators = document.createElement('div');
        indicators.style.cssText = 'display: flex; gap: 4px;';

        if (template.type === 'business_step' && template.actionType === 'primary') {
            const primaryBadge = document.createElement('span');
            primaryBadge.textContent = 'PRIMARY';
            primaryBadge.style.cssText = `
                background: #4CAF50;
                color: white;
                padding: 1px 4px;
                border-radius: 2px;
                font-size: 9px;
            `;
            indicators.appendChild(primaryBadge);
        }

        if (template.type === 'disposition' && template.requiresAction) {
            const actionBadge = document.createElement('span');
            actionBadge.textContent = 'ACTION';
            actionBadge.style.cssText = `
                background: #FF9800;
                color: white;
                padding: 1px 4px;
                border-radius: 2px;
                font-size: 9px;
            `;
            indicators.appendChild(actionBadge);
        }

        const compatibilityCount = document.createElement('span');
        const compatCount = template.type === 'business_step' 
            ? template.compatibility?.dispositions?.length || 0
            : template.compatibleBusinessSteps?.length || 0;
        compatibilityCount.textContent = `${compatCount} compat.`;

        footer.appendChild(indicators);
        footer.appendChild(compatibilityCount);

        // Assemblage
        card.appendChild(header);
        card.appendChild(name);
        card.appendChild(category);
        card.appendChild(description);
        card.appendChild(footer);

        // Events
        card.addEventListener('click', () => this.selectTemplate(template));
        card.addEventListener('mouseenter', () => this.previewTemplate(template));
        
        // Mise à jour style si sélectionné
        this.updateCardStyle(card, this.selectedTemplates.has(template.id));

        return card;
    }

    /**
     * Crée l'état vide quand aucun template ne correspond
     * @private
     * @returns {HTMLElement} Element empty state
     */
    createEmptyState() {
        const emptyState = document.createElement('div');
        emptyState.style.cssText = `
            grid-column: 1 / -1;
            text-align: center;
            padding: 40px 20px;
            color: var(--text-muted);
        `;

        emptyState.innerHTML = `
            <div style="font-size: 48px; margin-bottom: 12px;">🔍</div>
            <div style="font-size: 16px; margin-bottom: 8px;">Aucun template trouvé</div>
            <div style="font-size: 12px;">
                Essayez de modifier vos critères de recherche ou filtres
            </div>
        `;

        return emptyState;
    }

    /**
     * Sélectionne ou désélectionne un template
     * @private
     * @param {string} templateId - ID du template
     */
    toggleTemplateSelection(templateId) {
        if (this.selectedTemplates.has(templateId)) {
            this.selectedTemplates.delete(templateId);
        } else {
            if (!this.options.multiSelect) {
                this.selectedTemplates.clear();
            }
            this.selectedTemplates.add(templateId);
        }

        this.updateSelectionUI();
    }

    /**
     * Sélectionne un template et affiche son preview
     * @private
     * @param {Object} template - Données du template
     */
    selectTemplate(template) {
        if (!this.options.multiSelect) {
            this.selectedTemplates.clear();
        }
        
        if (this.selectedTemplates.has(template.id)) {
            this.selectedTemplates.delete(template.id);
        } else {
            this.selectedTemplates.add(template.id);
        }

        this.updateSelectionUI();
        this.previewTemplate(template);
    }

    /**
     * Affiche le preview d'un template
     * @private
     * @param {Object} template - Template à prévisualiser
     * @sideEffect Modifie le contenu du preview panel
     */
    previewTemplate(template) {
        this.currentPreview = template;
        
        const previewContent = document.getElementById('template-preview-content');
        if (!previewContent) return;

        previewContent.innerHTML = `
            <div class="template-preview">
                <div class="preview-header" style="text-align: center; margin-bottom: 20px;">
                    <div style="font-size: 36px; margin-bottom: 8px;">${template.icon}</div>
                    <h3 style="margin: 0; color: var(--text-normal); font-size: 18px;">${template.name}</h3>
                    <div style="font-size: 12px; color: ${template.color}; font-weight: 500; text-transform: capitalize; margin-top: 4px;">
                        ${template.category} • ${template.type === 'business_step' ? 'Business Step' : 'Disposition'}
                    </div>
                </div>

                <div class="preview-section" style="margin-bottom: 16px;">
                    <h4 style="color: var(--text-normal); font-size: 14px; margin-bottom: 8px;">Description</h4>
                    <p style="color: var(--text-muted); font-size: 12px; line-height: 1.4; margin: 0;">
                        ${template.description}
                    </p>
                </div>

                ${this.renderTemplateSpecificInfo(template)}

                <div class="preview-section" style="margin-bottom: 16px;">
                    <h4 style="color: var(--text-normal); font-size: 14px; margin-bottom: 8px;">Métadonnées</h4>
                    <div style="font-size: 11px; color: var(--text-muted);">
                        <div><strong>Fichier:</strong> ${template.file}</div>
                        <div><strong>Couleur:</strong> <span style="display: inline-block; width: 12px; height: 12px; background: ${template.color}; border-radius: 2px; margin-left: 4px;"></span> ${template.color}</div>
                        ${template.type === 'business_step' ? `<div><strong>Position:</strong> ${template.workflowPosition}</div>` : ''}
                        ${template.type === 'disposition' ? `<div><strong>Vendable:</strong> ${template.isSellable ? 'Oui' : 'Non'}</div>` : ''}
                    </div>
                </div>

                ${this.renderCompatibilityInfo(template)}

                <div class="preview-actions" style="margin-top: 20px; text-align: center;">
                    <button onclick="window.templateSelector?.toggleTemplateSelection('${template.id}')" 
                            style="padding: 6px 12px; background: ${this.selectedTemplates.has(template.id) ? 'var(--interactive-accent)' : 'var(--background-primary)'}; 
                                   color: ${this.selectedTemplates.has(template.id) ? 'white' : 'var(--text-normal)'}; 
                                   border: 1px solid var(--background-modifier-border); border-radius: 4px; cursor: pointer; font-size: 12px;">
                        ${this.selectedTemplates.has(template.id) ? '✓ Sélectionné' : 'Sélectionner'}
                    </button>
                </div>
            </div>
        `;

        // Faire référence globale pour les boutons
        window.templateSelector = this;
    }

    /**
     * Rend les informations spécifiques au type de template
     * @private
     * @param {Object} template - Template data
     * @returns {string} HTML content
     */
    renderTemplateSpecificInfo(template) {
        if (template.type === 'business_step') {
            return `
                <div class="preview-section" style="margin-bottom: 16px;">
                    <h4 style="color: var(--text-normal); font-size: 14px; margin-bottom: 8px;">Business Step</h4>
                    <div style="font-size: 12px; color: var(--text-muted);">
                        <div><strong>Type Action:</strong> ${template.actionType}</div>
                        <div><strong>Objets Communs:</strong> ${template.commonObjects.join(', ')}</div>
                        <div><strong>Transitions Typiques:</strong> ${template.typicalTransitions.join(', ')}</div>
                    </div>
                </div>
            `;
        } else {
            return `
                <div class="preview-section" style="margin-bottom: 16px;">
                    <h4 style="color: var(--text-normal); font-size: 14px; margin-bottom: 8px;">Disposition</h4>
                    <div style="font-size: 12px; color: var(--text-muted);">
                        <div><strong>Type:</strong> ${template.dispositionType}</div>
                        <div><strong>Nécessite Action:</strong> ${template.requiresAction ? 'Oui' : 'Non'}</div>
                        <div><strong>Business Steps Compatibles:</strong> ${template.compatibleBusinessSteps.slice(0, 5).join(', ')}${template.compatibleBusinessSteps.length > 5 ? '...' : ''}</div>
                    </div>
                </div>
            `;
        }
    }

    /**
     * Rend les informations de compatibilité
     * @private
     * @param {Object} template - Template data
     * @returns {string} HTML content
     */
    renderCompatibilityInfo(template) {
        const compatibility = template.compatibility;
        if (!compatibility) return '';

        if (template.type === 'business_step') {
            const dispositions = compatibility.dispositions || [];
            return `
                <div class="preview-section">
                    <h4 style="color: var(--text-normal); font-size: 14px; margin-bottom: 8px;">Dispositions Compatibles</h4>
                    <div style="display: flex; flex-wrap: wrap; gap: 4px;">
                        ${dispositions.slice(0, 10).map(disp => 
                            `<span style="background: var(--background-modifier-hover); 
                                          color: var(--text-normal); 
                                          padding: 2px 6px; 
                                          border-radius: 4px; 
                                          font-size: 10px;">
                                ${disp}
                            </span>`
                        ).join('')}
                        ${dispositions.length > 10 ? `<span style="color: var(--text-muted); font-size: 10px;">+${dispositions.length - 10} autres</span>` : ''}
                    </div>
                </div>
            `;
        } else {
            return `
                <div class="preview-section">
                    <h4 style="color: var(--text-normal); font-size: 14px; margin-bottom: 8px;">Workflows Suggérés</h4>
                    <div style="font-size: 11px; color: var(--text-muted);">
                        ${this.getSuggestedWorkflows(template.id).map(workflow => 
                            `<div style="margin-bottom: 4px;">• ${workflow}</div>`
                        ).join('')}
                    </div>
                </div>
            `;
        }
    }

    /**
     * Met à jour l'interface de sélection
     * @private
     * @sideEffect Met à jour les compteurs et boutons
     */
    updateSelectionUI() {
        // Mettre à jour le compteur
        const countEl = document.getElementById('selection-count');
        if (countEl) {
            const count = this.selectedTemplates.size;
            countEl.textContent = count === 0 
                ? 'Aucun template sélectionné'
                : `${count} template${count > 1 ? 's' : ''} sélectionné${count > 1 ? 's' : ''}`;
        }

        // Mettre à jour le bouton Apply
        const applyButton = document.getElementById('template-apply-button');
        if (applyButton) {
            applyButton.disabled = this.selectedTemplates.size === 0;
            applyButton.style.opacity = this.selectedTemplates.size === 0 ? '0.5' : '1';
        }

        // Mettre à jour les cartes
        this.templatesGrid.querySelectorAll('.template-card').forEach(card => {
            const templateId = card.dataset.templateId;
            const checkbox = card.querySelector('input[type="checkbox"]');
            const isSelected = this.selectedTemplates.has(templateId);
            
            if (checkbox) {
                checkbox.checked = isSelected;
            }
            
            this.updateCardStyle(card, isSelected);
        });
    }

    /**
     * Met à jour le style d'une carte selon son état de sélection
     * @private
     * @param {HTMLElement} card - Carte template
     * @param {boolean} isSelected - État de sélection
     */
    updateCardStyle(card, isSelected) {
        if (isSelected) {
            card.style.borderColor = 'var(--interactive-accent)';
            card.style.background = 'var(--background-modifier-hover)';
            card.style.transform = 'translateY(-2px)';
            card.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        } else {
            card.style.borderColor = 'var(--background-modifier-border)';
            card.style.background = 'var(--background-primary)';
            card.style.transform = 'translateY(0)';
            card.style.boxShadow = 'none';
        }
    }

    /**
     * Met à jour les statistiques affichées
     * @private
     * @sideEffect Met à jour le texte des stats
     */
    updateStats() {
        const statsEl = document.getElementById('templates-stats');
        if (statsEl) {
            const total = this.templates.size;
            const filtered = this.filteredTemplates.size;
            const businessSteps = Array.from(this.filteredTemplates.values()).filter(t => t.type === 'business_step').length;
            const dispositions = filtered - businessSteps;
            
            statsEl.textContent = `${filtered}/${total} templates • ${businessSteps} Business Steps • ${dispositions} Dispositions`;
        }
    }

    /**
     * Remet à zéro tous les filtres
     * @sideEffect Réinitialise les filtres et la recherche
     */
    resetFilters() {
        this.searchQuery = '';
        this.searchInput.value = '';
        
        this.activeFilters = {
            category: 'all',
            type: 'all',
            compatibility: 'all',
            actionType: 'all'
        };

        // Reset des selects
        this.modal.querySelectorAll('select').forEach(select => {
            select.value = 'all';
        });

        this.applyFilters();
    }

    /**
     * Applique les templates sélectionnés
     * @sideEffect Déclenche le callback onSelect et ferme la modal
     */
    applySelection() {
        if (this.selectedTemplates.size === 0) return;

        // Récupérer les données complètes des templates sélectionnés
        const selectedData = Array.from(this.selectedTemplates).map(id => {
            return this.templates.get(id);
        }).filter(Boolean);

        console.log('Templates sélectionnés:', selectedData);

        // Sauvegarder dans les récents
        this.saveToRecentSelections(selectedData);

        // Déclencher le callback
        try {
            this.options.onSelect(selectedData);
            this.updateStatus('Templates appliqués avec succès', 'success');
            
            // Fermer après un court délai
            setTimeout(() => {
                this.hide();
            }, 500);
            
        } catch (error) {
            console.error('Erreur lors de l\'application des templates:', error);
            this.updateStatus('Erreur lors de l\'application', 'error');
        }
    }

    /**
     * Met à jour le message de statut
     * @private
     * @param {string} message - Message à afficher
     * @param {string} type - Type de message ('info', 'success', 'error')
     * @sideEffect Modifie le contenu de la status bar
     */
    updateStatus(message, type = 'info') {
        if (this.statusBar) {
            this.statusBar.textContent = message;
            this.statusBar.style.color = {
                'info': 'var(--text-muted)',
                'success': '#4CAF50',
                'error': '#F44336'
            }[type] || 'var(--text-muted)';
            
            // Reset après délai
            if (type !== 'info') {
                setTimeout(() => {
                    this.updateStatus('Prêt pour sélection');
                }, 3000);
            }
        }
    }

    /**
     * Sauvegarde les sélections récentes
     * @private
     * @param {Array} templates - Templates sélectionnés
     */
    saveToRecentSelections(templates) {
        // Ajouter au début et limiter à 10 entrées
        this.recentSelections.unshift({
            timestamp: Date.now(),
            templates: templates.map(t => ({ id: t.id, name: t.name, type: t.type }))
        });
        this.recentSelections = this.recentSelections.slice(0, 10);
    }

    /**
     * Obtient la couleur pour une catégorie
     * @private
     * @param {string} category - Catégorie
     * @param {string} type - Type (business_step ou disposition)
     * @returns {string} Code couleur hex
     */
    getCategoryColor(category, type) {
        if (type === 'business_step') {
            const colors = {
                'logistics': '#2196F3',
                'manufacturing': '#FF9800',
                'retail': '#4CAF50',
                'pharmaceutical': '#9C27B0'
            };
            return colors[category] || '#757575';
        } else {
            const colors = {
                'operational': '#4CAF50',
                'logistical': '#2196F3',
                'quality': '#F44336',
                'lifecycle': '#9C27B0'
            };
            return colors[category] || '#757575';
        }
    }

    /**
     * Obtient l'icône pour une catégorie
     * @private
     * @param {string} category - Catégorie
     * @returns {string} Emoji icon
     */
    getCategoryIcon(category) {
        const icons = {
            'logistics': '🚛',
            'manufacturing': '⚙️',
            'retail': '🛒',
            'pharmaceutical': '💊',
            'operational': '🔧',
            'quality': '🔍',
            'lifecycle': '♻️'
        };
        return icons[category] || '🏷️';
    }

    /**
     * Obtient l'icône pour un type de disposition
     * @private
     * @param {string} dispositionType - Type de disposition
     * @returns {string} Emoji icon
     */
    getDispositionIcon(dispositionType) {
        const icons = {
            'positive': '✅',
            'negative': '❌',
            'neutral': '⚪',
            'transitional': '🔄'
        };
        return icons[dispositionType] || '🏷️';
    }

    /**
     * Obtient les données de compatibilité pour un template
     * @private
     * @param {string} templateId - ID du template
     * @param {string} type - Type du template
     * @returns {Object} Données de compatibilité
     */
    getCompatibility(templateId, type) {
        if (!this.epcisIndex?.epcis_unified_index?.workflow_mappings) {
            return { dispositions: [], businessSteps: [] };
        }

        const mappings = this.epcisIndex.epcis_unified_index.workflow_mappings;
        
        if (type === 'business_step') {
            return {
                dispositions: mappings.business_step_to_disposition[templateId] || [],
                businessSteps: []
            };
        } else {
            return {
                dispositions: [],
                businessSteps: mappings.disposition_to_business_step[templateId] || []
            };
        }
    }

    /**
     * Obtient les workflows suggérés pour une disposition
     * @private
     * @param {string} dispositionId - ID de la disposition
     * @returns {Array<string>} Liste des workflows suggérés
     */
    getSuggestedWorkflows(dispositionId) {
        if (!this.epcisIndex?.epcis_unified_index?.integration_patterns?.typical_workflows) {
            return [];
        }

        const workflows = this.epcisIndex.epcis_unified_index.integration_patterns.typical_workflows;
        return workflows
            .filter(workflow => workflow.sequence.includes(dispositionId))
            .map(workflow => workflow.name)
            .slice(0, 3);
    }

    /**
     * Injecte les styles CSS nécessaires
     * @private
     * @sideEffect Ajoute une balise style au document
     */
    injectCSS() {
        if (document.getElementById('template-selector-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'template-selector-styles';
        styles.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            @keyframes slideInUp {
                from { 
                    opacity: 0; 
                    transform: translateY(30px) scale(0.95); 
                }
                to { 
                    opacity: 1; 
                    transform: translateY(0) scale(1); 
                }
            }
            
            .template-selector-modal * {
                box-sizing: border-box;
            }
            
            .template-search-input:focus {
                outline: none;
                border-color: var(--interactive-accent);
                box-shadow: 0 0 0 2px var(--interactive-accent-hover);
            }
            
            .template-card:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                border-color: var(--interactive-accent);
            }
            
            .template-filter-reset:hover {
                background: var(--interactive-accent);
                color: white;
                border-color: var(--interactive-accent);
            }
            
            .template-action-cancel:hover {
                background: var(--background-modifier-hover);
            }
            
            .template-action-apply:hover:not(:disabled) {
                background: var(--interactive-accent-hover);
                transform: translateY(-1px);
            }
            
            .template-preview-content {
                scrollbar-width: thin;
                scrollbar-color: var(--background-modifier-border) transparent;
            }
            
            .template-preview-content::-webkit-scrollbar {
                width: 6px;
            }
            
            .template-preview-content::-webkit-scrollbar-track {
                background: transparent;
            }
            
            .template-preview-content::-webkit-scrollbar-thumb {
                background: var(--background-modifier-border);
                border-radius: 3px;
            }
        `;
        
        document.head.appendChild(styles);
    }

    /**
     * Nettoie les ressources et détruit l'instance
     * @sideEffect Retire les styles et nettoie la mémoire
     */
    destroy() {
        this.hide();
        
        // Nettoyer les styles
        const styles = document.getElementById('template-selector-styles');
        if (styles) {
            styles.remove();
        }
        
        // Nettoyer les références globales
        if (window.templateSelector === this) {
            delete window.templateSelector;
        }
        
        // Vider les données
        this.templates.clear();
        this.filteredTemplates.clear();
        this.selectedTemplates.clear();
    }
}

// Export pour utilisation
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TemplateSelector };
}

// <!-- END OF FILE: template-selector.js -->