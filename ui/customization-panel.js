// <!-- START OF FILE: customization-panel.js -->
// FILENAME: customization-panel.js
// Version: 1.0.0
// Date: 2025-07-28 18:30
// Author: Rolland MELET & Claude Code
// Description: Panneau personnalisation templates EPCIS 2.0 avec validation temps réel et preview live

/**
 * Panneau de personnalisation avancée des templates EPCIS 2.0
 * Édition propriétés, validation temps réel, preview live et sauvegarde templates personnalisés
 * @class
 */
export class CustomizationPanel {
    /**
     * Crée une instance du panneau de personnalisation
     * @param {Object} app - Instance de l'application Obsidian
     * @param {Object} options - Options de configuration
     * @param {Object} options.epcisValidator - Instance du validateur EPCIS
     * @param {Function} options.onSave - Callback lors de la sauvegarde
     * @param {Function} options.onCancel - Callback lors de l'annulation
     * @param {string} options.customTemplatesPath - Chemin vers templates personnalisés
     * @example
     * const panel = new CustomizationPanel(this.app, {
     *   epcisValidator: validator,
     *   onSave: (template) => this.saveCustomTemplate(template),
     *   onCancel: () => this.returnToSelector(),
     *   customTemplatesPath: './templates/custom/'
     * });
     */
    constructor(app, options = {}) {
        this.app = app;
        this.options = {
            epcisValidator: options.epcisValidator,
            onSave: options.onSave || (() => {}),
            onCancel: options.onCancel || (() => {}),
            customTemplatesPath: options.customTemplatesPath || './templates/custom/',
            validateOnChange: options.validateOnChange !== false,
            previewUpdateDelay: options.previewUpdateDelay || 300
        };

        // État interne
        this.isVisible = false;
        this.currentTemplate = null;
        this.originalTemplate = null;
        this.customProperties = new Map();
        this.validationResult = null;
        this.isDirty = false;
        this.previewUpdateTimer = null;

        // Éléments DOM
        this.modal = null;
        this.generalPropsForm = null;
        this.epcisMetadataForm = null;
        this.workflowForm = null;
        this.previewContainer = null;
        this.validationDisplay = null;
        this.statusBar = null;

        // Palettes et configurations
        this.colorPalette = [
            '#2196F3', '#4CAF50', '#FF9800', '#F44336', '#9C27B0', 
            '#00BCD4', '#8BC34A', '#FFC107', '#E91E63', '#3F51B5',
            '#009688', '#CDDC39', '#FF5722', '#795548', '#607D8B'
        ];

        this.iconCategories = {
            'logistics': ['🚛', '📦', '🏭', '🚢', '✈️', '🚂'],
            'manufacturing': ['⚙️', '🔧', '⚡', '🏗️', '🔩', '⚒️'],
            'retail': ['🛒', '🏪', '💳', '🎯', '📊', '💰'],
            'pharmaceutical': ['💊', '🧪', '🔬', '🏥', '💉', '🧬'],
            'quality': ['🔍', '✅', '📋', '⭐', '🎖️', '📝'],
            'operational': ['🔧', '⚡', '📈', '🎛️', '🔄', '⚙️']
        };

        this.categoryOptions = [
            { value: 'logistics', label: 'Logistics 🚛', description: 'Transport, réception, expédition' },
            { value: 'manufacturing', label: 'Manufacturing ⚙️', description: 'Production, transformation, assemblage' },
            { value: 'retail', label: 'Retail 🛒', description: 'Vente, distribution, point de vente' },
            { value: 'pharmaceutical', label: 'Pharmaceutical 💊', description: 'Médicaments, dispositifs médicaux' },
            { value: 'quality', label: 'Quality 🔍', description: 'Contrôle, inspection, validation' },
            { value: 'operational', label: 'Operational 🔧', description: 'Opérations générales, maintenance' }
        ];

        this.epcisEventTypes = [
            { value: 'ObjectEvent', label: 'Object Event', description: 'Événement sur un objet spécifique' },
            { value: 'AggregationEvent', label: 'Aggregation Event', description: 'Regroupement ou séparation d\'objets' },
            { value: 'TransformationEvent', label: 'Transformation Event', description: 'Transformation de matières' },
            { value: 'TransactionEvent', label: 'Transaction Event', description: 'Transaction commerciale' },
            { value: 'AssociationEvent', label: 'Association Event', description: 'Association d\'objets' }
        ];

        this.epcisActions = [
            { value: 'ADD', label: 'ADD', description: 'Ajout d\'un objet au système' },
            { value: 'OBSERVE', label: 'OBSERVE', description: 'Observation d\'un objet existant' },
            { value: 'DELETE', label: 'DELETE', description: 'Suppression d\'un objet du système' }
        ];

        this.priorityLevels = [
            { value: 'high', label: 'High', color: '#F44336', description: 'Action critique, priorité maximale' },
            { value: 'medium', label: 'Medium', color: '#FF9800', description: 'Action importante, priorité normale' },
            { value: 'low', label: 'Low', color: '#4CAF50', description: 'Action optionnelle, faible priorité' }
        ];

        // Bind methods
        this.handleFormChange = this.handleFormChange.bind(this);
        this.handleKeyboard = this.handleKeyboard.bind(this);
        this.updatePreview = this.updatePreview.bind(this);
        this.validateTemplate = this.validateTemplate.bind(this);
    }

    /**
     * Affiche le panneau de personnalisation pour un template
     * @param {Object} template - Template à personnaliser
     * @sideEffect Crée la modal et charge les données du template
     * @returns {Promise<void>}
     * @example
     * // Personnaliser un template business step
     * await panel.show(receivingTemplate);
     */
    async show(template) {
        if (this.isVisible || !template) return;

        this.isVisible = true;
        this.currentTemplate = JSON.parse(JSON.stringify(template)); // Deep copy
        this.originalTemplate = JSON.parse(JSON.stringify(template));
        this.isDirty = false;

        try {
            // Créer l'interface modale
            this.createModal();
            
            // Charger les données du template
            await this.loadTemplateData();
            
            // Rendre les formulaires
            this.renderForms();
            
            // Validation initiale
            await this.validateTemplate();
            
            // Mise à jour preview initial
            this.updatePreview();
            
            // Attacher les événements
            this.attachEventListeners();
            
            // Focus sur le premier champ
            setTimeout(() => {
                const firstInput = this.modal.querySelector('input, select, textarea');
                if (firstInput) {
                    firstInput.focus();
                }
            }, 100);

        } catch (error) {
            console.error('Erreur lors du chargement de la personnalisation:', error);
            this.updateStatus('Erreur chargement template', 'error');
        }
    }

    /**
     * Masque le panneau et nettoie les ressources
     * @sideEffect Retire la modal du DOM et nettoie les listeners
     * @example
     * // Fermer le panneau
     * panel.hide();
     */
    hide() {
        if (!this.isVisible) return;

        // Vérifier s'il y a des modifications non sauvegardées
        if (this.isDirty) {
            const confirmed = confirm('Vous avez des modifications non sauvegardées. Voulez-vous vraiment fermer ?');
            if (!confirmed) return;
        }

        this.isVisible = false;
        this.detachEventListeners();
        
        if (this.modal && this.modal.parentNode) {
            this.modal.parentNode.removeChild(this.modal);
        }
        
        // Nettoyer l'état
        this.currentTemplate = null;
        this.originalTemplate = null;
        this.customProperties.clear();
        this.validationResult = null;
        this.isDirty = false;
    }

    /**
     * Charge les données du template dans les propriétés personnalisées
     * @private
     * @sideEffect Remplit customProperties avec les données du template
     * @returns {Promise<void>}
     */
    async loadTemplateData() {
        this.customProperties.clear();

        // Propriétés générales
        this.customProperties.set('name', this.currentTemplate.name || '');
        this.customProperties.set('description', this.currentTemplate.description || '');
        this.customProperties.set('category', this.currentTemplate.category || 'operational');
        this.customProperties.set('color', this.currentTemplate.color || '#2196F3');
        this.customProperties.set('icon', this.currentTemplate.icon || '🏷️');

        // Métadonnées EPCIS
        this.customProperties.set('eventType', this.currentTemplate.eventType || 'ObjectEvent');
        this.customProperties.set('action', this.currentTemplate.action || 'OBSERVE');
        this.customProperties.set('businessStep', this.currentTemplate.businessStep || this.currentTemplate.id);
        this.customProperties.set('disposition', this.currentTemplate.disposition || 'active');

        // Champs obligatoires/optionnels
        const requiredFields = this.currentTemplate.requiredFields || ['epc', 'bizStep', 'disposition', 'eventTime'];
        const optionalFields = this.currentTemplate.optionalFields || ['readPoint', 'bizLocation'];
        this.customProperties.set('requiredFields', requiredFields);
        this.customProperties.set('optionalFields', optionalFields);

        // Workflow et transitions
        this.customProperties.set('estimatedDuration', this.currentTemplate.estimatedDuration || '2-5 min');
        this.customProperties.set('priority', this.currentTemplate.priority || 'medium');
        this.customProperties.set('transitions', this.currentTemplate.transitions || []);
        this.customProperties.set('businessConstraints', this.currentTemplate.businessConstraints || []);

        // Génération nom personnalisé si nécessaire
        if (!this.customProperties.get('name') || this.customProperties.get('name') === this.currentTemplate.id) {
            const customName = this.generateCustomName();
            this.customProperties.set('name', customName);
        }
    }

    /**
     * Crée l'interface modale complète
     * @private
     * @sideEffect Crée et ajoute des éléments DOM
     */
    createModal() {
        // Container principal
        this.modal = document.createElement('div');
        this.modal.className = 'customization-panel-modal';
        this.modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.7);
            backdrop-filter: blur(6px);
            z-index: 10001;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.3s ease-out;
        `;

        // Dialog principal
        const dialog = document.createElement('div');
        dialog.className = 'customization-panel-dialog';
        dialog.style.cssText = `
            width: 1000px;
            height: 700px;
            max-width: 95vw;
            max-height: 95vh;
            background: var(--background-primary);
            border: 1px solid var(--background-modifier-border);
            border-radius: 16px;
            box-shadow: 0 12px 48px rgba(0, 0, 0, 0.4);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            animation: slideInScale 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        `;

        // Header avec titre
        const header = this.createHeader();
        dialog.appendChild(header);

        // Contenu principal (forms + preview)
        const mainContent = this.createMainContent();
        dialog.appendChild(mainContent);

        // Footer avec actions
        const footer = this.createFooter();
        dialog.appendChild(footer);

        this.modal.appendChild(dialog);
        document.body.appendChild(this.modal);

        // CSS animations
        this.injectCSS();
    }

    /**
     * Crée le header avec titre et informations
     * @private
     * @returns {HTMLElement} Element header
     */
    createHeader() {
        const header = document.createElement('div');
        header.className = 'customization-panel-header';
        header.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 20px 24px;
            background: linear-gradient(135deg, var(--background-secondary) 0%, var(--background-primary) 100%);
            border-bottom: 1px solid var(--background-modifier-border);
        `;

        const titleSection = document.createElement('div');
        titleSection.style.cssText = 'display: flex; flex-direction: column; gap: 4px;';

        const title = document.createElement('h2');
        title.innerHTML = `🎨 Personnalisation Template: <span style="color: var(--interactive-accent);">${this.currentTemplate.name}</span>`;
        title.style.cssText = `
            margin: 0;
            font-size: 20px;
            font-weight: 600;
            color: var(--text-normal);
        `;

        const subtitle = document.createElement('div');
        subtitle.innerHTML = `
            <span style="background: ${this.currentTemplate.color}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 500;">
                ${this.currentTemplate.type === 'business_step' ? 'Business Step' : 'Disposition'}
            </span>
            <span style="color: var(--text-muted); margin-left: 8px; font-size: 13px;">
                ${this.currentTemplate.category} • Validation temps réel
            </span>
        `;

        titleSection.appendChild(title);
        titleSection.appendChild(subtitle);

        // Boutons header
        const headerActions = document.createElement('div');
        headerActions.style.cssText = 'display: flex; gap: 8px; align-items: center;';

        // Bouton aide
        const helpButton = document.createElement('button');
        helpButton.innerHTML = '❓';
        helpButton.title = 'Aide personnalisation';
        helpButton.style.cssText = `
            width: 36px;
            height: 36px;
            border-radius: 8px;
            background: var(--background-modifier-hover);
            border: 1px solid var(--background-modifier-border);
            color: var(--text-muted);
            cursor: pointer;
            font-size: 16px;
            transition: all 0.2s;
        `;
        helpButton.addEventListener('click', () => this.showHelp());

        // Bouton fermeture
        const closeButton = document.createElement('button');
        closeButton.innerHTML = '×';
        closeButton.style.cssText = `
            width: 36px;
            height: 36px;
            border-radius: 8px;
            background: none;
            border: 1px solid var(--background-modifier-border);
            color: var(--text-muted);
            cursor: pointer;
            font-size: 24px;
            transition: all 0.2s;
        `;
        closeButton.addEventListener('click', () => this.hide());

        // Hover effects
        [helpButton, closeButton].forEach(btn => {
            btn.addEventListener('mouseenter', () => {
                btn.style.background = 'var(--background-modifier-hover)';
                btn.style.color = 'var(--text-normal)';
                btn.style.transform = 'scale(1.05)';
            });
            btn.addEventListener('mouseleave', () => {
                btn.style.background = btn === helpButton ? 'var(--background-modifier-hover)' : 'none';
                btn.style.color = 'var(--text-muted)';
                btn.style.transform = 'scale(1)';
            });
        });

        headerActions.appendChild(helpButton);
        headerActions.appendChild(closeButton);

        header.appendChild(titleSection);
        header.appendChild(headerActions);

        return header;
    }

    /**
     * Crée le contenu principal avec formulaires et preview
     * @private
     * @returns {HTMLElement} Element main content
     */
    createMainContent() {
        const mainContent = document.createElement('div');
        mainContent.className = 'customization-panel-main';
        mainContent.style.cssText = `
            flex: 1;
            display: flex;
            overflow: hidden;
        `;

        // Panel gauche - Formulaires
        const formsPanel = document.createElement('div');
        formsPanel.style.cssText = `
            flex: 0 0 60%;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            border-right: 1px solid var(--background-modifier-border);
        `;

        // Onglets des formulaires
        const tabsContainer = this.createFormTabs();
        formsPanel.appendChild(tabsContainer);

        // Container scrollable pour les formulaires
        const formsContainer = document.createElement('div');
        formsContainer.id = 'forms-container';
        formsContainer.style.cssText = `
            flex: 1;
            overflow-y: auto;
            padding: 20px;
            background: var(--background-primary);
        `;

        formsPanel.appendChild(formsContainer);

        // Panel droite - Preview et validation
        const previewPanel = document.createElement('div');
        previewPanel.style.cssText = `
            flex: 0 0 40%;
            display: flex;
            flex-direction: column;
            background: var(--background-secondary);
        `;

        // Header preview
        const previewHeader = document.createElement('div');
        previewHeader.style.cssText = `
            padding: 16px 20px;
            border-bottom: 1px solid var(--background-modifier-border);
            background: var(--background-secondary);
        `;

        previewHeader.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                <span style="font-size: 18px;">👁️</span>
                <h3 style="margin: 0; font-size: 16px; color: var(--text-normal);">Preview Live</h3>
            </div>
            <div style="font-size: 12px; color: var(--text-muted);">
                Aperçu temps réel • Validation EPCIS 2.0
            </div>
        `;

        // Container preview
        this.previewContainer = document.createElement('div');
        this.previewContainer.id = 'preview-container';
        this.previewContainer.style.cssText = `
            flex: 1;
            padding: 20px;
            overflow-y: auto;
        `;

        // Validation display
        this.validationDisplay = document.createElement('div');
        this.validationDisplay.id = 'validation-display';
        this.validationDisplay.style.cssText = `
            padding: 16px 20px;
            border-top: 1px solid var(--background-modifier-border);
            background: var(--background-primary);
            max-height: 150px;
            overflow-y: auto;
        `;

        previewPanel.appendChild(previewHeader);
        previewPanel.appendChild(this.previewContainer);
        previewPanel.appendChild(this.validationDisplay);

        mainContent.appendChild(formsPanel);
        mainContent.appendChild(previewPanel);

        return mainContent;
    }

    /**
     * Crée les onglets des formulaires
     * @private
     * @returns {HTMLElement} Container des onglets
     */
    createFormTabs() {
        const tabsContainer = document.createElement('div');
        tabsContainer.className = 'form-tabs-container';
        tabsContainer.style.cssText = `
            display: flex;
            background: var(--background-secondary);
            border-bottom: 1px solid var(--background-modifier-border);
        `;

        const tabs = [
            { id: 'general', label: '🏷️ Général', description: 'Nom, description, apparence' },
            { id: 'epcis', label: '🔧 EPCIS', description: 'Métadonnées, champs, conformité' },
            { id: 'workflow', label: '🔄 Workflow', description: 'Transitions, contraintes, priorité' }
        ];

        tabs.forEach((tab, index) => {
            const tabButton = document.createElement('button');
            tabButton.className = 'form-tab-button';
            tabButton.dataset.tabId = tab.id;
            tabButton.style.cssText = `
                flex: 1;
                padding: 12px 16px;
                background: ${index === 0 ? 'var(--background-primary)' : 'transparent'};
                border: none;
                border-bottom: 3px solid ${index === 0 ? 'var(--interactive-accent)' : 'transparent'};
                color: ${index === 0 ? 'var(--text-normal)' : 'var(--text-muted)'};
                cursor: pointer;
                transition: all 0.2s;
                text-align: center;
            `;

            tabButton.innerHTML = `
                <div style="font-weight: 500; margin-bottom: 2px;">${tab.label}</div>
                <div style="font-size: 10px; opacity: 0.8;">${tab.description}</div>
            `;

            tabButton.addEventListener('click', () => this.switchTab(tab.id));
            tabsContainer.appendChild(tabButton);
        });

        return tabsContainer;
    }

    /**
     * Crée le footer avec actions et status
     * @private
     * @returns {HTMLElement} Element footer
     */
    createFooter() {
        const footer = document.createElement('div');
        footer.className = 'customization-panel-footer';
        footer.style.cssText = `
            padding: 16px 24px;
            background: var(--background-secondary);
            border-top: 1px solid var(--background-modifier-border);
            display: flex;
            justify-content: space-between;
            align-items: center;
        `;

        // Status et dirty indicator
        const statusSection = document.createElement('div');
        statusSection.style.cssText = 'display: flex; align-items: center; gap: 12px;';

        const dirtyIndicator = document.createElement('div');
        dirtyIndicator.id = 'dirty-indicator';
        dirtyIndicator.style.cssText = `
            display: none;
            align-items: center;
            gap: 6px;
            padding: 4px 8px;
            background: var(--interactive-accent);
            color: white;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 500;
        `;
        dirtyIndicator.innerHTML = '● Modifications non sauvegardées';

        this.statusBar = document.createElement('div');
        this.statusBar.id = 'customization-status-bar';
        this.statusBar.style.cssText = `
            font-size: 13px;
            color: var(--text-muted);
        `;
        this.statusBar.textContent = 'Prêt pour personnalisation';

        statusSection.appendChild(dirtyIndicator);
        statusSection.appendChild(this.statusBar);

        // Boutons d'action
        const actionsSection = document.createElement('div');
        actionsSection.style.cssText = 'display: flex; gap: 12px;';

        const resetButton = document.createElement('button');
        resetButton.textContent = 'Réinitialiser';
        resetButton.className = 'customization-action-reset';
        resetButton.style.cssText = `
            padding: 10px 20px;
            background: var(--background-primary);
            border: 1px solid var(--background-modifier-border);
            border-radius: 8px;
            color: var(--text-normal);
            cursor: pointer;
            font-weight: 500;
            transition: all 0.2s;
        `;
        resetButton.addEventListener('click', () => this.resetToOriginal());

        const cancelButton = document.createElement('button');
        cancelButton.textContent = 'Annuler';
        cancelButton.className = 'customization-action-cancel';
        cancelButton.style.cssText = `
            padding: 10px 20px;
            background: var(--background-primary);
            border: 1px solid var(--background-modifier-border);
            border-radius: 8px;
            color: var(--text-normal);
            cursor: pointer;
            font-weight: 500;
            transition: all 0.2s;
        `;
        cancelButton.addEventListener('click', () => this.hide());

        const saveButton = document.createElement('button');
        saveButton.textContent = 'Enregistrer';
        saveButton.id = 'customization-save-button';
        saveButton.className = 'customization-action-save';
        saveButton.style.cssText = `
            padding: 10px 20px;
            background: var(--interactive-accent);
            border: 1px solid var(--interactive-accent);
            border-radius: 8px;
            color: white;
            cursor: pointer;
            font-weight: 500;
            transition: all 0.2s;
        `;
        saveButton.addEventListener('click', () => this.saveTemplate());

        // Hover effects
        [resetButton, cancelButton].forEach(btn => {
            btn.addEventListener('mouseenter', () => {
                btn.style.background = 'var(--background-modifier-hover)';
                btn.style.transform = 'translateY(-1px)';
            });
            btn.addEventListener('mouseleave', () => {
                btn.style.background = 'var(--background-primary)';
                btn.style.transform = 'translateY(0)';
            });
        });

        saveButton.addEventListener('mouseenter', () => {
            saveButton.style.background = 'var(--interactive-accent-hover)';
            saveButton.style.transform = 'translateY(-1px)';
        });
        saveButton.addEventListener('mouseleave', () => {
            saveButton.style.background = 'var(--interactive-accent)';
            saveButton.style.transform = 'translateY(0)';
        });

        actionsSection.appendChild(resetButton);
        actionsSection.appendChild(cancelButton);
        actionsSection.appendChild(saveButton);

        footer.appendChild(statusSection);
        footer.appendChild(actionsSection);

        return footer;
    }

    /**
     * Rend les formulaires selon l'onglet actif
     * @private
     * @sideEffect Remplit le container des formulaires
     */
    renderForms() {
        // Démarrer avec l'onglet général
        this.switchTab('general');
    }

    /**
     * Change d'onglet et affiche le formulaire correspondant
     * @private
     * @param {string} tabId - ID de l'onglet à afficher
     * @sideEffect Met à jour l'UI des onglets et le contenu du formulaire
     */
    switchTab(tabId) {
        // Mettre à jour l'UI des onglets
        this.modal.querySelectorAll('.form-tab-button').forEach(btn => {
            const isActive = btn.dataset.tabId === tabId;
            btn.style.background = isActive ? 'var(--background-primary)' : 'transparent';
            btn.style.borderBottomColor = isActive ? 'var(--interactive-accent)' : 'transparent';
            btn.style.color = isActive ? 'var(--text-normal)' : 'var(--text-muted)';
        });

        // Rendre le formulaire correspondant
        const formsContainer = document.getElementById('forms-container');
        if (!formsContainer) return;

        switch (tabId) {
            case 'general':
                formsContainer.innerHTML = '';
                formsContainer.appendChild(this.createGeneralPropsForm());
                break;
            case 'epcis':
                formsContainer.innerHTML = '';
                formsContainer.appendChild(this.createEPCISMetadataForm());
                break;
            case 'workflow':
                formsContainer.innerHTML = '';
                formsContainer.appendChild(this.createWorkflowForm());
                break;
        }
    }

    /**
     * Crée le formulaire des propriétés générales
     * @private
     * @returns {HTMLElement} Formulaire propriétés générales
     */
    createGeneralPropsForm() {
        const form = document.createElement('div');
        form.className = 'general-props-form';

        form.innerHTML = `
            <div class="form-section">
                <h3 class="form-section-title">
                    <span class="form-section-icon">🏷️</span>
                    Propriétés Générales
                </h3>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="template-name">Nom du Template *</label>
                        <input type="text" id="template-name" class="form-input" 
                               value="${this.customProperties.get('name')}" 
                               placeholder="Ex: Reception_Matiere_Premiere"
                               maxlength="50" required>
                        <div class="form-help">Nom unique pour identifier ce template personnalisé</div>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="template-description">Description</label>
                        <textarea id="template-description" class="form-textarea" 
                                  rows="3" maxlength="250" 
                                  placeholder="Décrivez l'objectif et l'usage de ce template...">${this.customProperties.get('description')}</textarea>
                        <div class="form-help">Description détaillée (250 caractères max)</div>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="template-category">Catégorie *</label>
                        <select id="template-category" class="form-select" required>
                            ${this.categoryOptions.map(cat => `
                                <option value="${cat.value}" ${this.customProperties.get('category') === cat.value ? 'selected' : ''}>
                                    ${cat.label}
                                </option>
                            `).join('')}
                        </select>
                        <div class="form-help">Catégorie fonctionnelle du template</div>
                    </div>
                </div>
            </div>

            <div class="form-section">
                <h3 class="form-section-title">
                    <span class="form-section-icon">🎨</span>
                    Apparence Visuelle
                </h3>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="template-color">Couleur du Template</label>
                        <div class="color-picker-container">
                            <input type="color" id="template-color" class="form-color-input" 
                                   value="${this.customProperties.get('color')}">
                            <div class="color-palette">
                                ${this.colorPalette.map(color => `
                                    <button type="button" class="color-swatch" 
                                            data-color="${color}" 
                                            style="background: ${color};"
                                            title="${color}"></button>
                                `).join('')}
                            </div>
                        </div>
                        <div class="form-help">Couleur d'identification visuelle dans ProcessMetaLanguage</div>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="template-icon">Icône du Template</label>
                        <div class="icon-picker-container">
                            <input type="text" id="template-icon" class="form-input icon-display" 
                                   value="${this.customProperties.get('icon')}" 
                                   readonly style="width: 60px; text-align: center; font-size: 18px;">
                            <div class="icon-categories">
                                ${Object.entries(this.iconCategories).map(([category, icons]) => `
                                    <div class="icon-category">
                                        <div class="icon-category-label">${category}</div>
                                        <div class="icon-grid">
                                            ${icons.map(icon => `
                                                <button type="button" class="icon-option" 
                                                        data-icon="${icon}" 
                                                        title="${icon}">${icon}</button>
                                            `).join('')}
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        <div class="form-help">Icône représentative pour la palette d'outils</div>
                    </div>
                </div>
            </div>
        `;

        // Attacher les événements
        this.attachGeneralFormEvents(form);

        return form;
    }

    /**
     * Crée le formulaire des métadonnées EPCIS
     * @private
     * @returns {HTMLElement} Formulaire métadonnées EPCIS
     */
    createEPCISMetadataForm() {
        const form = document.createElement('div');
        form.className = 'epcis-metadata-form';

        const requiredFields = this.customProperties.get('requiredFields') || [];
        const optionalFields = this.customProperties.get('optionalFields') || [];

        const allEPCISFields = [
            { name: 'epc', label: 'EPC (Electronic Product Code)', description: 'Identifiant unique de l\'objet' },
            { name: 'bizStep', label: 'Business Step', description: 'Étape métier de l\'événement' },
            { name: 'disposition', label: 'Disposition', description: 'État de l\'objet' },
            { name: 'eventTime', label: 'Event Time', description: 'Horodatage de l\'événement' },
            { name: 'readPoint', label: 'Read Point', description: 'Point de lecture/scan' },
            { name: 'bizLocation', label: 'Business Location', description: 'Localisation métier' },
            { name: 'quantity', label: 'Quantity', description: 'Quantité d\'objets' },
            { name: 'transformationID', label: 'Transformation ID', description: 'Identifiant transformation' },
            { name: 'sourceDestList', label: 'Source/Dest List', description: 'Liste sources/destinations' },
            { name: 'ilmd', label: 'Instance/Lot Master Data', description: 'Données maître instance/lot' }
        ];

        form.innerHTML = `
            <div class="form-section">
                <h3 class="form-section-title">
                    <span class="form-section-icon">🔧</span>
                    Métadonnées EPCIS 2.0
                </h3>
                
                <div class="form-row">
                    <div class="form-group form-group-half">
                        <label for="epcis-event-type">Type d'Événement *</label>
                        <select id="epcis-event-type" class="form-select" required>
                            ${this.epcisEventTypes.map(type => `
                                <option value="${type.value}" ${this.customProperties.get('eventType') === type.value ? 'selected' : ''}>
                                    ${type.label}
                                </option>
                            `).join('')}
                        </select>
                        <div class="form-help">Type d'événement EPCIS selon le standard 2.0</div>
                    </div>
                    
                    <div class="form-group form-group-half">
                        <label for="epcis-action">Action EPCIS *</label>
                        <select id="epcis-action" class="form-select" required>
                            ${this.epcisActions.map(action => `
                                <option value="${action.value}" ${this.customProperties.get('action') === action.value ? 'selected' : ''}>
                                    ${action.label}
                                </option>
                            `).join('')}
                        </select>
                        <div class="form-help">Action sur l'objet dans l'événement</div>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group form-group-half">
                        <label for="business-step-id">Business Step ID</label>
                        <input type="text" id="business-step-id" class="form-input" 
                               value="${this.customProperties.get('businessStep')}" 
                               placeholder="Ex: receiving"
                               readonly style="background: var(--background-secondary);">
                        <div class="form-help">Identifiant du business step (lecture seule)</div>
                    </div>
                    
                    <div class="form-group form-group-half">
                        <label for="disposition-id">Disposition Principale</label>
                        <input type="text" id="disposition-id" class="form-input" 
                               value="${this.customProperties.get('disposition')}" 
                               placeholder="Ex: active">
                        <div class="form-help">Disposition principale résultante</div>
                    </div>
                </div>
            </div>

            <div class="form-section">
                <h3 class="form-section-title">
                    <span class="form-section-icon">📋</span>
                    Champs EPCIS Configurables
                </h3>
                
                <div class="fields-configuration">
                    <div class="fields-column">
                        <h4 class="fields-column-title">
                            ⚠️ Champs Obligatoires
                            <span class="fields-count">${requiredFields.length}</span>
                        </h4>
                        <div class="fields-list" id="required-fields-list">
                            ${allEPCISFields.map(field => `
                                <label class="field-checkbox">
                                    <input type="checkbox" 
                                           value="${field.name}" 
                                           ${requiredFields.includes(field.name) ? 'checked' : ''}
                                           data-field-type="required">
                                    <span class="field-label">
                                        <strong>${field.label}</strong>
                                        <div class="field-description">${field.description}</div>
                                    </span>
                                </label>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="fields-column">
                        <h4 class="fields-column-title">
                            💡 Champs Optionnels
                            <span class="fields-count">${optionalFields.length}</span>
                        </h4>
                        <div class="fields-list" id="optional-fields-list">
                            ${allEPCISFields.map(field => `
                                <label class="field-checkbox">
                                    <input type="checkbox" 
                                           value="${field.name}" 
                                           ${optionalFields.includes(field.name) ? 'checked' : ''}
                                           data-field-type="optional">
                                    <span class="field-label">
                                        <strong>${field.label}</strong>
                                        <div class="field-description">${field.description}</div>
                                    </span>
                                </label>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Attacher les événements
        this.attachEPCISFormEvents(form);

        return form;
    }

    /**
     * Crée le formulaire du workflow
     * @private
     * @returns {HTMLElement} Formulaire workflow
     */
    createWorkflowForm() {
        const form = document.createElement('div');
        form.className = 'workflow-form';

        const transitions = this.customProperties.get('transitions') || [];
        const constraints = this.customProperties.get('businessConstraints') || [];

        form.innerHTML = `
            <div class="form-section">
                <h3 class="form-section-title">
                    <span class="form-section-icon">🔄</span>
                    Configuration Workflow
                </h3>
                
                <div class="form-row">
                    <div class="form-group form-group-half">
                        <label for="estimated-duration">Durée Estimée</label>
                        <input type="text" id="estimated-duration" class="form-input" 
                               value="${this.customProperties.get('estimatedDuration')}" 
                               placeholder="Ex: 2-5 min, 1h, 30s">
                        <div class="form-help">Temps d'exécution typique de l'opération</div>
                    </div>
                    
                    <div class="form-group form-group-half">
                        <label for="priority-level">Niveau de Priorité</label>
                        <select id="priority-level" class="form-select">
                            ${this.priorityLevels.map(priority => `
                                <option value="${priority.value}" ${this.customProperties.get('priority') === priority.value ? 'selected' : ''}>
                                    ${priority.label} - ${priority.description}
                                </option>
                            `).join('')}
                        </select>
                        <div class="form-help">Priorité relative dans les workflows</div>
                    </div>
                </div>
            </div>

            <div class="form-section">
                <h3 class="form-section-title">
                    <span class="form-section-icon">➡️</span>
                    Transitions d'États
                </h3>
                
                <div class="transitions-container">
                    <div class="transitions-header">
                        <span>États compatibles après cette action</span>
                        <button type="button" id="add-transition-btn" class="add-button">+ Ajouter</button>
                    </div>
                    <div class="transitions-list" id="transitions-list">
                        ${transitions.map((transition, index) => `
                            <div class="transition-item" data-index="${index}">
                                <input type="text" class="transition-input" 
                                       value="${transition}" 
                                       placeholder="Ex: active, in_progress">
                                <button type="button" class="remove-transition-btn" data-index="${index}">×</button>
                            </div>
                        `).join('')}
                        ${transitions.length === 0 ? '<div class="empty-state">Aucune transition configurée</div>' : ''}
                    </div>
                </div>
            </div>

            <div class="form-section">
                <h3 class="form-section-title">
                    <span class="form-section-icon">🔒</span>
                    Contraintes Métier
                </h3>
                
                <div class="constraints-container">
                    <div class="constraints-header">
                        <span>Règles et contraintes personnalisées</span>
                        <button type="button" id="add-constraint-btn" class="add-button">+ Ajouter</button>
                    </div>
                    <div class="constraints-list" id="constraints-list">
                        ${constraints.map((constraint, index) => `
                            <div class="constraint-item" data-index="${index}">
                                <textarea class="constraint-textarea" 
                                          placeholder="Ex: Nécessite validation qualité avant expédition">${constraint}</textarea>
                                <button type="button" class="remove-constraint-btn" data-index="${index}">×</button>
                            </div>
                        `).join('')}
                        ${constraints.length === 0 ? '<div class="empty-state">Aucune contrainte définie</div>' : ''}
                    </div>
                </div>
            </div>
        `;

        // Attacher les événements
        this.attachWorkflowFormEvents(form);

        return form;
    }

    /**
     * Attache les événements du formulaire général
     * @private
     * @param {HTMLElement} form - Formulaire général
     * @sideEffect Ajoute des listeners aux éléments du formulaire
     */
    attachGeneralFormEvents(form) {
        // Nom du template
        const nameInput = form.querySelector('#template-name');
        nameInput?.addEventListener('input', (e) => {
            this.customProperties.set('name', e.target.value);
            this.handleFormChange();
        });

        // Description
        const descInput = form.querySelector('#template-description');
        descInput?.addEventListener('input', (e) => {
            this.customProperties.set('description', e.target.value);
            this.handleFormChange();
        });

        // Catégorie
        const categorySelect = form.querySelector('#template-category');
        categorySelect?.addEventListener('change', (e) => {
            this.customProperties.set('category', e.target.value);
            this.handleFormChange();
        });

        // Color picker
        const colorInput = form.querySelector('#template-color');
        colorInput?.addEventListener('change', (e) => {
            this.customProperties.set('color', e.target.value);
            this.handleFormChange();
        });

        // Color swatches
        form.querySelectorAll('.color-swatch').forEach(swatch => {
            swatch.addEventListener('click', (e) => {
                const color = e.target.dataset.color;
                this.customProperties.set('color', color);
                colorInput.value = color;
                this.handleFormChange();
            });
        });

        // Icon picker
        form.querySelectorAll('.icon-option').forEach(iconBtn => {
            iconBtn.addEventListener('click', (e) => {
                const icon = e.target.dataset.icon;
                this.customProperties.set('icon', icon);
                form.querySelector('#template-icon').value = icon;
                this.handleFormChange();
            });
        });
    }

    /**
     * Attache les événements du formulaire EPCIS
     * @private
     * @param {HTMLElement} form - Formulaire EPCIS
     * @sideEffect Ajoute des listeners aux éléments du formulaire
     */
    attachEPCISFormEvents(form) {
        // Event type
        const eventTypeSelect = form.querySelector('#epcis-event-type');
        eventTypeSelect?.addEventListener('change', (e) => {
            this.customProperties.set('eventType', e.target.value);
            this.handleFormChange();
        });

        // Action
        const actionSelect = form.querySelector('#epcis-action');
        actionSelect?.addEventListener('change', (e) => {
            this.customProperties.set('action', e.target.value);
            this.handleFormChange();
        });

        // Disposition
        const dispositionInput = form.querySelector('#disposition-id');
        dispositionInput?.addEventListener('input', (e) => {
            this.customProperties.set('disposition', e.target.value);
            this.handleFormChange();
        });

        // Champs obligatoires/optionnels
        form.querySelectorAll('input[data-field-type]').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.updateEPCISFields();
                this.handleFormChange();
            });
        });
    }

    /**
     * Attache les événements du formulaire workflow
     * @private
     * @param {HTMLElement} form - Formulaire workflow
     * @sideEffect Ajoute des listeners aux éléments du formulaire
     */
    attachWorkflowFormEvents(form) {
        // Durée estimée
        const durationInput = form.querySelector('#estimated-duration');
        durationInput?.addEventListener('input', (e) => {
            this.customProperties.set('estimatedDuration', e.target.value);
            this.handleFormChange();
        });

        // Priorité
        const prioritySelect = form.querySelector('#priority-level');
        prioritySelect?.addEventListener('change', (e) => {
            this.customProperties.set('priority', e.target.value);
            this.handleFormChange();
        });

        // Boutons ajouter transitions/contraintes
        form.querySelector('#add-transition-btn')?.addEventListener('click', () => {
            this.addTransition();
        });

        form.querySelector('#add-constraint-btn')?.addEventListener('click', () => {
            this.addConstraint();
        });

        // Boutons supprimer existants
        form.querySelectorAll('.remove-transition-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.removeTransition(index);
            });
        });

        form.querySelectorAll('.remove-constraint-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.removeConstraint(index);
            });
        });

        // Inputs transitions existants
        form.querySelectorAll('.transition-input').forEach(input => {
            input.addEventListener('input', () => {
                this.updateTransitionsFromInputs();
                this.handleFormChange();
            });
        });

        // Textareas contraintes existants
        form.querySelectorAll('.constraint-textarea').forEach(textarea => {
            textarea.addEventListener('input', () => {
                this.updateConstraintsFromInputs();
                this.handleFormChange();
            });
        });
    }

    /**
     * Gère les changements dans les formulaires
     * @private
     * @sideEffect Met à jour l'état dirty, validation et preview
     */
    handleFormChange() {
        this.isDirty = true;
        this.updateDirtyIndicator();
        
        // Debounce validation et preview
        clearTimeout(this.previewUpdateTimer);
        this.previewUpdateTimer = setTimeout(() => {
            this.validateTemplate();
            this.updatePreview();
        }, this.options.previewUpdateDelay);
    }

    /**
     * Met à jour les champs EPCIS depuis les checkboxes
     * @private
     * @sideEffect Met à jour les propriétés requiredFields et optionalFields
     */
    updateEPCISFields() {
        const requiredFields = [];
        const optionalFields = [];

        this.modal.querySelectorAll('input[data-field-type="required"]:checked').forEach(cb => {
            requiredFields.push(cb.value);
        });

        this.modal.querySelectorAll('input[data-field-type="optional"]:checked').forEach(cb => {
            optionalFields.push(cb.value);
        });

        this.customProperties.set('requiredFields', requiredFields);
        this.customProperties.set('optionalFields', optionalFields);

        // Mettre à jour les compteurs
        const requiredCount = this.modal.querySelector('#required-fields-list + .fields-count');
        const optionalCount = this.modal.querySelector('#optional-fields-list + .fields-count');
        if (requiredCount) requiredCount.textContent = requiredFields.length;
        if (optionalCount) optionalCount.textContent = optionalFields.length;
    }

    /**
     * Ajoute une nouvelle transition
     * @private
     * @sideEffect Ajoute un élément de transition à la liste
     */
    addTransition() {
        const transitions = this.customProperties.get('transitions') || [];
        transitions.push('');
        this.customProperties.set('transitions', transitions);
        
        this.refreshTransitionsList();
        this.handleFormChange();
    }

    /**
     * Supprime une transition
     * @private
     * @param {number} index - Index de la transition à supprimer
     * @sideEffect Supprime la transition de la liste
     */
    removeTransition(index) {
        const transitions = this.customProperties.get('transitions') || [];
        transitions.splice(index, 1);
        this.customProperties.set('transitions', transitions);
        
        this.refreshTransitionsList();
        this.handleFormChange();
    }

    /**
     * Ajoute une nouvelle contrainte
     * @private
     * @sideEffect Ajoute un élément de contrainte à la liste
     */
    addConstraint() {
        const constraints = this.customProperties.get('businessConstraints') || [];
        constraints.push('');
        this.customProperties.set('businessConstraints', constraints);
        
        this.refreshConstraintsList();
        this.handleFormChange();
    }

    /**
     * Supprime une contrainte
     * @private
     * @param {number} index - Index de la contrainte à supprimer
     * @sideEffect Supprime la contrainte de la liste
     */
    removeConstraint(index) {
        const constraints = this.customProperties.get('businessConstraints') || [];
        constraints.splice(index, 1);
        this.customProperties.set('businessConstraints', constraints);
        
        this.refreshConstraintsList();
        this.handleFormChange();
    }

    /**
     * Met à jour les transitions depuis les inputs
     * @private
     * @sideEffect Met à jour la propriété transitions
     */
    updateTransitionsFromInputs() {
        const transitions = [];
        this.modal.querySelectorAll('.transition-input').forEach(input => {
            if (input.value.trim()) {
                transitions.push(input.value.trim());
            }
        });
        this.customProperties.set('transitions', transitions);
    }

    /**
     * Met à jour les contraintes depuis les textareas
     * @private
     * @sideEffect Met à jour la propriété businessConstraints
     */
    updateConstraintsFromInputs() {
        const constraints = [];
        this.modal.querySelectorAll('.constraint-textarea').forEach(textarea => {
            if (textarea.value.trim()) {
                constraints.push(textarea.value.trim());
            }
        });
        this.customProperties.set('businessConstraints', constraints);
    }

    /**
     * Rafraîchit la liste des transitions
     * @private
     * @sideEffect Recrée les éléments de transition dans le DOM
     */
    refreshTransitionsList() {
        const container = this.modal.querySelector('#transitions-list');
        if (!container) return;

        const transitions = this.customProperties.get('transitions') || [];
        
        container.innerHTML = transitions.length === 0 
            ? '<div class="empty-state">Aucune transition configurée</div>'
            : transitions.map((transition, index) => `
                <div class="transition-item" data-index="${index}">
                    <input type="text" class="transition-input" 
                           value="${transition}" 
                           placeholder="Ex: active, in_progress">
                    <button type="button" class="remove-transition-btn" data-index="${index}">×</button>
                </div>
            `).join('');

        // Rattacher les événements
        container.querySelectorAll('.remove-transition-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.removeTransition(index);
            });
        });

        container.querySelectorAll('.transition-input').forEach(input => {
            input.addEventListener('input', () => {
                this.updateTransitionsFromInputs();
                this.handleFormChange();
            });
        });
    }

    /**
     * Rafraîchit la liste des contraintes
     * @private
     * @sideEffect Recrée les éléments de contrainte dans le DOM
     */
    refreshConstraintsList() {
        const container = this.modal.querySelector('#constraints-list');
        if (!container) return;

        const constraints = this.customProperties.get('businessConstraints') || [];
        
        container.innerHTML = constraints.length === 0 
            ? '<div class="empty-state">Aucune contrainte définie</div>'
            : constraints.map((constraint, index) => `
                <div class="constraint-item" data-index="${index}">
                    <textarea class="constraint-textarea" 
                              placeholder="Ex: Nécessite validation qualité avant expédition">${constraint}</textarea>
                    <button type="button" class="remove-constraint-btn" data-index="${index}">×</button>
                </div>
            `).join('');

        // Rattacher les événements
        container.querySelectorAll('.remove-constraint-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.removeConstraint(index);
            });
        });

        container.querySelectorAll('.constraint-textarea').forEach(textarea => {
            textarea.addEventListener('input', () => {
                this.updateConstraintsFromInputs();
                this.handleFormChange();
            });
        });
    }

    /**
     * Valide le template avec le validateur EPCIS
     * @private
     * @sideEffect Met à jour validationResult et l'affichage
     * @returns {Promise<void>}
     */
    async validateTemplate() {
        if (!this.options.epcisValidator || !this.options.validateOnChange) {
            this.validationResult = { valid: true, errors: [], warnings: [] };
            this.displayValidation();
            return;
        }

        try {
            // Construire l'objet template pour validation
            const templateForValidation = this.buildTemplateObject();
            
            // Validation EPCIS 2.0
            this.validationResult = this.options.epcisValidator.validateBusinessStep 
                ? this.options.epcisValidator.validateBusinessStep(templateForValidation)
                : this.options.epcisValidator.validate(templateForValidation);

            // Validations supplémentaires ProcessMetaLanguage
            this.validateProcessMetaLanguageRules(templateForValidation);
            
            this.displayValidation();
            
        } catch (error) {
            console.error('Erreur validation template:', error);
            this.validationResult = {
                valid: false,
                errors: [`Erreur validation: ${error.message}`],
                warnings: []
            };
            this.displayValidation();
        }
    }

    /**
     * Valide les règles spécifiques ProcessMetaLanguage
     * @private
     * @param {Object} template - Template à valider
     * @sideEffect Modifie validationResult
     */
    validateProcessMetaLanguageRules(template) {
        if (!this.validationResult) return;

        // Validation nom unique
        if (!template.name || template.name.trim().length < 3) {
            this.validationResult.errors.push('Le nom doit contenir au moins 3 caractères');
        }

        // Validation transitions
        const transitions = template.transitions || [];
        if (transitions.length === 0) {
            this.validationResult.warnings.push('Aucune transition configurée - considérez ajouter des états suivants');
        }

        // Validation champs EPCIS
        const requiredFields = template.requiredFields || [];
        if (!requiredFields.includes('epc')) {
            this.validationResult.warnings.push('Le champ EPC est recommandé comme obligatoire');
        }

        if (!requiredFields.includes('eventTime')) {
            this.validationResult.warnings.push('Le champ eventTime est recommandé comme obligatoire');
        }

        // Validation durée
        const duration = template.estimatedDuration;
        if (duration && !duration.match(/^\d+[-]\d+\s+(min|h|s)$|^\d+\s+(min|h|s)$/)) {
            this.validationResult.warnings.push('Format durée recommandé: "2-5 min", "1h", "30s"');
        }

        // Recalculer valid
        this.validationResult.valid = this.validationResult.errors.length === 0;
    }

    /**
     * Affiche le résultat de validation
     * @private
     * @sideEffect Met à jour l'affichage de validation
     */
    displayValidation() {
        if (!this.validationDisplay || !this.validationResult) return;

        const { valid, errors, warnings } = this.validationResult;
        
        let validationHtml = `
            <div class="validation-header">
                <div class="validation-status ${valid ? 'valid' : 'invalid'}">
                    ${valid ? '✅' : '❌'} ${valid ? 'Conforme EPCIS 2.0' : 'Non conforme'}
                </div>
                <div class="validation-counts">
                    ${errors.length > 0 ? `<span class="error-count">${errors.length} erreur${errors.length > 1 ? 's' : ''}</span>` : ''}
                    ${warnings.length > 0 ? `<span class="warning-count">${warnings.length} avertissement${warnings.length > 1 ? 's' : ''}</span>` : ''}
                </div>
            </div>
        `;

        if (errors.length > 0) {
            validationHtml += `
                <div class="validation-section errors">
                    <h4>❌ Erreurs à corriger</h4>
                    <ul>
                        ${errors.map(error => `<li>${error}</li>`).join('')}
                    </ul>
                </div>
            `;
        }

        if (warnings.length > 0) {
            validationHtml += `
                <div class="validation-section warnings">
                    <h4>⚠️ Avertissements</h4>
                    <ul>
                        ${warnings.map(warning => `<li>${warning}</li>`).join('')}
                    </ul>
                </div>
            `;
        }

        if (valid && errors.length === 0 && warnings.length === 0) {
            validationHtml += `
                <div class="validation-success">
                    <div class="success-message">
                        🎉 Template parfaitement configuré !
                    </div>
                    <div class="success-details">
                        Conformité EPCIS 2.0 ✓ • ProcessMetaLanguage ✓ • Prêt pour sauvegarde
                    </div>
                </div>
            `;
        }

        this.validationDisplay.innerHTML = validationHtml;
    }

    /**
     * Met à jour le preview live du template
     * @private
     * @sideEffect Met à jour l'affichage du preview
     */
    updatePreview() {
        if (!this.previewContainer) return;

        const template = this.buildTemplateObject();
        
        this.previewContainer.innerHTML = `
            <div class="template-preview-live">
                <!-- Composant Graphique -->
                <div class="preview-component">
                    <div class="component-header">
                        <span class="preview-title">🔷 Aperçu Composant ProcessMetaLanguage</span>
                    </div>
                    <div class="graphical-preview">
                        <div class="object-preview">
                            <div class="hexagon-preview" style="background: ${template.color}20; border: 2px solid ${template.color};">
                                <span class="object-icon">${template.icon}</span>
                                <div class="object-label">OBJECT</div>
                            </div>
                            <div class="state-banner" style="background: ${template.color};">
                                <span class="state-text">${template.disposition || 'Active'}</span>
                            </div>
                            <div class="action-rectangle" style="border: 2px solid ${template.color}; color: ${template.color};">
                                <span class="action-text">${template.name}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Métadonnées -->
                <div class="preview-metadata">
                    <div class="metadata-section">
                        <h4>📋 Propriétés Template</h4>
                        <div class="metadata-grid">
                            <div class="metadata-item">
                                <span class="label">Nom:</span>
                                <span class="value">${template.name}</span>
                            </div>
                            <div class="metadata-item">
                                <span class="label">Catégorie:</span>
                                <span class="value">${template.category}</span>
                            </div>
                            <div class="metadata-item">
                                <span class="label">Type Événement:</span>
                                <span class="value">${template.eventType}</span>
                            </div>
                            <div class="metadata-item">
                                <span class="label">Action:</span>
                                <span class="value">${template.action}</span>
                            </div>
                            <div class="metadata-item">
                                <span class="label">Priorité:</span>
                                <span class="value priority-${template.priority}">${template.priority?.toUpperCase()}</span>
                            </div>
                            <div class="metadata-item">
                                <span class="label">Durée:</span>
                                <span class="value">${template.estimatedDuration}</span>
                            </div>
                        </div>
                    </div>

                    <div class="metadata-section">
                        <h4>🔧 Champs EPCIS</h4>
                        <div class="fields-preview">
                            <div class="fields-group">
                                <span class="fields-label">Obligatoires (${template.requiredFields?.length || 0}):</span>
                                <div class="fields-tags">
                                    ${(template.requiredFields || []).map(field => 
                                        `<span class="field-tag required">${field}</span>`
                                    ).join('')}
                                </div>
                            </div>
                            <div class="fields-group">
                                <span class="fields-label">Optionnels (${template.optionalFields?.length || 0}):</span>
                                <div class="fields-tags">
                                    ${(template.optionalFields || []).map(field => 
                                        `<span class="field-tag optional">${field}</span>`
                                    ).join('')}
                                </div>
                            </div>
                        </div>
                    </div>

                    ${template.transitions && template.transitions.length > 0 ? `
                        <div class="metadata-section">
                            <h4>➡️ Transitions (${template.transitions.length})</h4>
                            <div class="transitions-preview">
                                ${template.transitions.map(transition => 
                                    `<span class="transition-tag">${transition}</span>`
                                ).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>

                <!-- Description -->
                ${template.description ? `
                    <div class="preview-description">
                        <h4>📝 Description</h4>
                        <p>${template.description}</p>
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Construit l'objet template à partir des propriétés personnalisées
     * @private
     * @returns {Object} Objet template complet
     */
    buildTemplateObject() {
        const template = {
            // Copier les propriétés originales
            ...this.originalTemplate,
            
            // Appliquer les personnalisations
            name: this.customProperties.get('name'),
            description: this.customProperties.get('description'),
            category: this.customProperties.get('category'),
            color: this.customProperties.get('color'),
            icon: this.customProperties.get('icon'),
            eventType: this.customProperties.get('eventType'),
            action: this.customProperties.get('action'),
            businessStep: this.customProperties.get('businessStep'),
            disposition: this.customProperties.get('disposition'),
            requiredFields: this.customProperties.get('requiredFields'),
            optionalFields: this.customProperties.get('optionalFields'),
            estimatedDuration: this.customProperties.get('estimatedDuration'),
            priority: this.customProperties.get('priority'),
            transitions: this.customProperties.get('transitions'),
            businessConstraints: this.customProperties.get('businessConstraints'),
            
            // Métadonnées de personnalisation
            isCustomized: true,
            customizedAt: new Date().toISOString(),
            originalTemplateId: this.originalTemplate.id
        };

        return template;
    }

    /**
     * Génère un nom personnalisé par défaut
     * @private
     * @returns {string} Nom personnalisé généré
     */
    generateCustomName() {
        const base = this.currentTemplate.name || this.currentTemplate.id || 'Custom';
        const category = this.customProperties.get('category') || 'Template';
        const timestamp = Date.now().toString().slice(-4);
        
        return `${base}_${category}_${timestamp}`;
    }

    /**
     * Met à jour l'indicateur de modifications
     * @private
     * @sideEffect Met à jour l'affichage de l'indicateur dirty
     */
    updateDirtyIndicator() {
        const indicator = this.modal?.querySelector('#dirty-indicator');
        if (indicator) {
            indicator.style.display = this.isDirty ? 'flex' : 'none';
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
                    this.updateStatus('Prêt pour personnalisation');
                }, 3000);
            }
        }
    }

    /**
     * Remet le template à son état original
     * @sideEffect Réinitialise les propriétés et recharge les formulaires
     */
    resetToOriginal() {
        const confirmed = confirm('Voulez-vous vraiment annuler toutes vos modifications ?');
        if (!confirmed) return;

        this.currentTemplate = JSON.parse(JSON.stringify(this.originalTemplate));
        this.isDirty = false;
        
        // Recharger les données
        this.loadTemplateData().then(() => {
            // Re-rendre les formulaires
            this.renderForms();
            
            // Re-valider et mettre à jour preview
            this.validateTemplate();
            this.updatePreview();
            this.updateDirtyIndicator();
            
            this.updateStatus('Template réinitialisé', 'success');
        });
    }

    /**
     * Sauvegarde le template personnalisé
     * @sideEffect Déclenche le callback onSave et ferme le panneau
     * @returns {Promise<void>}
     */
    async saveTemplate() {
        if (!this.validationResult?.valid) {
            const proceed = confirm('Le template contient des erreurs. Voulez-vous vraiment l\'enregistrer ?');
            if (!proceed) return;
        }

        try {
            this.updateStatus('Enregistrement en cours...', 'info');
            
            const customTemplate = this.buildTemplateObject();
            
            // Déclencher le callback de sauvegarde
            await this.options.onSave(customTemplate);
            
            this.updateStatus('Template enregistré avec succès', 'success');
            this.isDirty = false;
            this.updateDirtyIndicator();
            
            // Fermer après un court délai
            setTimeout(() => {
                this.hide();
            }, 1000);
            
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
            this.updateStatus('Erreur lors de la sauvegarde', 'error');
        }
    }

    /**
     * Affiche l'aide pour la personnalisation
     * @private
     * @sideEffect Affiche une modal d'aide
     */
    showHelp() {
        const helpContent = `
            <div class="help-modal">
                <h3>🎨 Guide de Personnalisation</h3>
                
                <div class="help-section">
                    <h4>🏷️ Propriétés Générales</h4>
                    <ul>
                        <li><strong>Nom :</strong> Identifiant unique de votre template personnalisé</li>
                        <li><strong>Description :</strong> Explique l'usage et le contexte du template</li>
                        <li><strong>Catégorie :</strong> Classification fonctionnelle (Logistics, Manufacturing, etc.)</li>
                        <li><strong>Couleur :</strong> Identification visuelle dans ProcessMetaLanguage</li>
                        <li><strong>Icône :</strong> Symbole représentatif dans la palette d'outils</li>
                    </ul>
                </div>
                
                <div class="help-section">
                    <h4>🔧 Métadonnées EPCIS</h4>
                    <ul>
                        <li><strong>Type Événement :</strong> Nature de l'événement EPCIS (ObjectEvent, etc.)</li>
                        <li><strong>Action :</strong> Opération sur l'objet (ADD, OBSERVE, DELETE)</li>
                        <li><strong>Champs Obligatoires :</strong> Données requises pour l'événement</li>
                        <li><strong>Champs Optionnels :</strong> Données supplémentaires disponibles</li>
                    </ul>
                </div>
                
                <div class="help-section">
                    <h4>🔄 Configuration Workflow</h4>
                    <ul>
                        <li><strong>Durée Estimée :</strong> Temps d'exécution typique (ex: "2-5 min")</li>
                        <li><strong>Priorité :</strong> Classification d'urgence (High/Medium/Low)</li>
                        <li><strong>Transitions :</strong> États possibles après cette action</li>
                        <li><strong>Contraintes :</strong> Règles métier et conditions spéciales</li>
                    </ul>
                </div>
                
                <div class="help-tips">
                    <h4>💡 Conseils</h4>
                    <ul>
                        <li>La validation temps réel vous guide vers la conformité EPCIS 2.0</li>
                        <li>Le preview live montre l'apparence finale dans ProcessMetaLanguage</li>
                        <li>Les templates personnalisés sont sauvegardés séparément des standards</li>
                        <li>Vous pouvez réinitialiser à tout moment vers le template original</li>
                    </ul>
                </div>
            </div>
        `;
        
        alert(helpContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim());
    }

    /**
     * Attache tous les listeners d'événements
     * @private
     * @sideEffect Ajoute des listeners globaux
     */
    attachEventListeners() {
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
        if (this.previewUpdateTimer) {
            clearTimeout(this.previewUpdateTimer);
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
        } else if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            this.saveTemplate();
        }
    }

    /**
     * Injecte les styles CSS nécessaires
     * @private
     * @sideEffect Ajoute une balise style au document
     */
    injectCSS() {
        if (document.getElementById('customization-panel-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'customization-panel-styles';
        styles.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            @keyframes slideInScale {
                from { 
                    opacity: 0; 
                    transform: translateY(50px) scale(0.9); 
                }
                to { 
                    opacity: 1; 
                    transform: translateY(0) scale(1); 
                }
            }
            
            .customization-panel-modal * {
                box-sizing: border-box;
            }
            
            .form-section {
                margin-bottom: 24px;
                padding: 20px;
                background: var(--background-secondary);
                border-radius: 12px;
                border: 1px solid var(--background-modifier-border);
            }
            
            .form-section-title {
                display: flex;
                align-items: center;
                gap: 8px;
                margin: 0 0 16px 0;
                font-size: 16px;
                font-weight: 600;
                color: var(--text-normal);
                border-bottom: 1px solid var(--background-modifier-border);
                padding-bottom: 8px;
            }
            
            .form-section-icon {
                font-size: 18px;
            }
            
            .form-row {
                display: flex;
                gap: 16px;
                margin-bottom: 16px;
            }
            
            .form-group {
                flex: 1;
                display: flex;
                flex-direction: column;
                gap: 6px;
            }
            
            .form-group-half {
                flex: 0 0 calc(50% - 8px);
            }
            
            .form-group label {
                font-size: 13px;
                font-weight: 500;
                color: var(--text-normal);
            }
            
            .form-input, .form-select, .form-textarea {
                padding: 10px 12px;
                border: 1px solid var(--background-modifier-border);
                border-radius: 6px;
                background: var(--background-primary);
                color: var(--text-normal);
                font-size: 14px;
                transition: all 0.2s;
            }
            
            .form-input:focus, .form-select:focus, .form-textarea:focus {
                outline: none;
                border-color: var(--interactive-accent);
                box-shadow: 0 0 0 2px var(--interactive-accent-hover);
            }
            
            .form-help {
                font-size: 11px;
                color: var(--text-muted);
                font-style: italic;
            }
            
            .color-picker-container {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            
            .form-color-input {
                width: 60px;
                height: 36px;
                border: 1px solid var(--background-modifier-border);
                border-radius: 6px;
                cursor: pointer;
            }
            
            .color-palette {
                display: flex;
                gap: 4px;
                flex-wrap: wrap;
            }
            
            .color-swatch {
                width: 24px;
                height: 24px;
                border-radius: 4px;
                border: 1px solid var(--background-modifier-border);
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .color-swatch:hover {
                transform: scale(1.1);
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
            }
            
            .icon-picker-container {
                display: flex;
                gap: 12px;
                align-items: flex-start;
            }
            
            .icon-categories {
                flex: 1;
                max-height: 200px;
                overflow-y: auto;
                border: 1px solid var(--background-modifier-border);
                border-radius: 6px;
                padding: 8px;
                background: var(--background-primary);
            }
            
            .icon-category {
                margin-bottom: 12px;
            }
            
            .icon-category-label {
                font-size: 11px;
                font-weight: 500;
                color: var(--text-muted);
                text-transform: uppercase;
                margin-bottom: 4px;
            }
            
            .icon-grid {
                display: flex;
                gap: 4px;
                flex-wrap: wrap;
            }
            
            .icon-option {
                width: 28px;
                height: 28px;
                border: 1px solid var(--background-modifier-border);
                border-radius: 4px;
                background: var(--background-secondary);
                cursor: pointer;
                font-size: 14px;
                transition: all 0.2s;
            }
            
            .icon-option:hover {
                background: var(--interactive-accent);
                color: white;
                transform: scale(1.1);
            }
            
            .fields-configuration {
                display: flex;
                gap: 20px;
            }
            
            .fields-column {
                flex: 1;
                background: var(--background-primary);
                border-radius: 8px;
                padding: 16px;
                border: 1px solid var(--background-modifier-border);
            }
            
            .fields-column-title {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 12px;
                font-size: 14px;
                font-weight: 500;
                color: var(--text-normal);
                border-bottom: 1px solid var(--background-modifier-border);
                padding-bottom: 8px;
            }
            
            .fields-count {
                background: var(--interactive-accent);
                color: white;
                padding: 2px 6px;
                border-radius: 10px;
                font-size: 10px;
                font-weight: 600;
            }
            
            .field-checkbox {
                display: flex;
                align-items: flex-start;
                gap: 8px;
                margin-bottom: 8px;
                cursor: pointer;
                padding: 6px;
                border-radius: 4px;
                transition: background 0.2s;
            }
            
            .field-checkbox:hover {
                background: var(--background-modifier-hover);
            }
            
            .field-label {
                flex: 1;
                font-size: 12px;
            }
            
            .field-description {
                color: var(--text-muted);
                font-size: 10px;
                margin-top: 2px;
            }
            
            .transitions-container, .constraints-container {
                background: var(--background-primary);
                border-radius: 8px;
                padding: 16px;
                border: 1px solid var(--background-modifier-border);
            }
            
            .transitions-header, .constraints-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 12px;
                font-size: 14px;
                font-weight: 500;
                color: var(--text-normal);
            }
            
            .add-button {
                padding: 6px 12px;
                background: var(--interactive-accent);
                color: white;
                border: none;
                border-radius: 4px;
                font-size: 12px;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .add-button:hover {
                background: var(--interactive-accent-hover);
                transform: translateY(-1px);
            }
            
            .transition-item, .constraint-item {
                display: flex;
                gap: 8px;
                align-items: flex-start;
                margin-bottom: 8px;
            }
            
            .transition-input {
                flex: 1;
                padding: 6px 8px;
                font-size: 12px;
            }
            
            .constraint-textarea {
                flex: 1;
                min-height: 60px;
                padding: 6px 8px;
                font-size: 12px;
                resize: vertical;
            }
            
            .remove-transition-btn, .remove-constraint-btn {
                width: 24px;
                height: 24px;
                background: #F44336;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                font-weight: bold;
                transition: all 0.2s;
            }
            
            .remove-transition-btn:hover, .remove-constraint-btn:hover {
                background: #D32F2F;
                transform: scale(1.1);
            }
            
            .empty-state {
                text-align: center;
                color: var(--text-muted);
                font-style: italic;
                padding: 20px;
            }
            
            .validation-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 12px;
                padding-bottom: 8px;
                border-bottom: 1px solid var(--background-modifier-border);
            }
            
            .validation-status {
                font-weight: 600;
                font-size: 14px;
            }
            
            .validation-status.valid {
                color: #4CAF50;
            }
            
            .validation-status.invalid {
                color: #F44336;
            }
            
            .validation-counts {
                display: flex;
                gap: 8px;
                font-size: 11px;
            }
            
            .error-count {
                background: #F44336;
                color: white;
                padding: 2px 6px;
                border-radius: 10px;
            }
            
            .warning-count {
                background: #FF9800;
                color: white;
                padding: 2px 6px;
                border-radius: 10px;
            }
            
            .validation-section {
                margin-bottom: 12px;
            }
            
            .validation-section h4 {
                margin: 0 0 6px 0;
                font-size: 12px;
            }
            
            .validation-section ul {
                margin: 0;
                padding-left: 16px;
                font-size: 11px;
                color: var(--text-muted);
            }
            
            .validation-success {
                text-align: center;
                padding: 16px;
                background: var(--background-modifier-success);
                border-radius: 8px;
            }
            
            .success-message {
                font-size: 14px;
                font-weight: 600;
                color: #4CAF50;
                margin-bottom: 4px;
            }
            
            .success-details {
                font-size: 11px;
                color: var(--text-muted);
            }
            
            .template-preview-live {
                display: flex;
                flex-direction: column;
                gap: 16px;
            }
            
            .preview-component {
                background: var(--background-primary);
                border-radius: 8px;
                padding: 16px;
                border: 1px solid var(--background-modifier-border);
            }
            
            .preview-title {
                font-size: 14px;
                font-weight: 500;
                color: var(--text-normal);
                margin-bottom: 12px;
                display: block;
            }
            
            .graphical-preview {
                display: flex;
                justify-content: center;
                padding: 20px;
            }
            
            .object-preview {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 8px;
            }
            
            .hexagon-preview {
                width: 80px;
                height: 60px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%);
                position: relative;
                font-size: 20px;
            }
            
            .object-label {
                font-size: 8px;
                font-weight: bold;
                margin-top: -4px;
            }
            
            .state-banner {
                padding: 4px 12px;
                border-radius: 12px;
                color: white;
                font-size: 10px;
                font-weight: 600;
                text-transform: uppercase;
            }
            
            .action-rectangle {
                padding: 8px 16px;
                border-radius: 6px;
                background: var(--background-primary);
                font-size: 11px;
                font-weight: 500;
                text-align: center;
                min-width: 100px;
            }
            
            .preview-metadata {
                background: var(--background-primary);
                border-radius: 8px;
                padding: 16px;
                border: 1px solid var(--background-modifier-border);
            }
            
            .metadata-section {
                margin-bottom: 16px;
            }
            
            .metadata-section h4 {
                margin: 0 0 8px 0;
                font-size: 13px;
                color: var(--text-normal);
                border-bottom: 1px solid var(--background-modifier-border);
                padding-bottom: 4px;
            }
            
            .metadata-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 6px;
                font-size: 11px;
            }
            
            .metadata-item {
                display: flex;
                justify-content: space-between;
            }
            
            .metadata-item .label {
                color: var(--text-muted);
                font-weight: 500;
            }
            
            .metadata-item .value {
                color: var(--text-normal);
                font-weight: 600;
            }
            
            .priority-high { color: #F44336; }
            .priority-medium { color: #FF9800; }
            .priority-low { color: #4CAF50; }
            
            .fields-preview {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            
            .fields-group {
                display: flex;
                flex-direction: column;
                gap: 4px;
            }
            
            .fields-label {
                font-size: 11px;
                color: var(--text-muted);
                font-weight: 500;
            }
            
            .fields-tags {
                display: flex;
                gap: 4px;
                flex-wrap: wrap;
            }
            
            .field-tag {
                padding: 2px 6px;
                border-radius: 10px;
                font-size: 9px;
                font-weight: 500;
            }
            
            .field-tag.required {
                background: #F44336;
                color: white;
            }
            
            .field-tag.optional {
                background: var(--background-modifier-hover);
                color: var(--text-normal);
            }
            
            .transitions-preview {
                display: flex;
                gap: 4px;
                flex-wrap: wrap;
            }
            
            .transition-tag {
                padding: 2px 6px;
                background: var(--interactive-accent);
                color: white;
                border-radius: 10px;
                font-size: 9px;
                font-weight: 500;
            }
            
            .preview-description {
                background: var(--background-primary);
                border-radius: 8px;
                padding: 16px;
                border: 1px solid var(--background-modifier-border);
            }
            
            .preview-description h4 {
                margin: 0 0 8px 0;
                font-size: 13px;
                color: var(--text-normal);
            }
            
            .preview-description p {
                margin: 0;
                font-size: 12px;
                color: var(--text-muted);
                line-height: 1.4;
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
        const styles = document.getElementById('customization-panel-styles');
        if (styles) {
            styles.remove();
        }
        
        // Vider les données
        this.customProperties.clear();
        this.currentTemplate = null;
        this.originalTemplate = null;
        this.validationResult = null;
    }
}

// Export pour utilisation
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CustomizationPanel };
}

// <!-- END OF FILE: customization-panel.js -->