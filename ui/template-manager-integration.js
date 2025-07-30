// <!-- START OF FILE: template-manager-integration.js -->
// FILENAME: template-manager-integration.js
// Version: 1.0.0
// Date: 2025-07-30 11:00
// Author: Rolland MELET & Claude Code
// Description: Intégration TemplateManager avec UI existante - TASK-B005

import { TemplateManager } from '../core/template-manager.js';

/**
 * Extension du TemplateSelector pour intégrer le TemplateManager
 * Ajoute les fonctionnalités de gestion avancée des templates
 * @class
 */
export class TemplateManagerIntegration {
    /**
     * Initialise l'intégration avec le TemplateSelector existant
     * @param {TemplateSelector} templateSelector - Instance du sélecteur de templates
     * @param {Object} options - Options de configuration
     */
    constructor(templateSelector, options = {}) {
        this.templateSelector = templateSelector;
        this.options = {
            templatesPath: options.templatesPath || './templates/',
            userTemplatesDir: options.userTemplatesDir || './templates/user-templates/',
            versionsDir: options.versionsDir || './templates/.versions/',
            backupsDir: options.backupsDir || './templates/.backups/',
            enableVersioning: options.enableVersioning !== false,
            enableInheritance: options.enableInheritance !== false,
            ...options
        };

        // Initialiser le Template Manager
        this.templateManager = new TemplateManager({
            templatesBaseDir: this.options.templatesPath,
            userTemplatesDir: this.options.userTemplatesDir,
            versionsDir: this.options.versionsDir,
            backupsDir: this.options.backupsDir
        });

        // État
        this.isInitialized = false;
        this.managerMode = 'view'; // 'view', 'create', 'edit', 'version'
        this.currentTemplate = null;
        
        // UI Elements
        this.managerPanel = null;
        this.managementButtons = null;
        this.versionHistory = null;

        // Bind methods
        this.handleTemplateAction = this.handleTemplateAction.bind(this);
        this.handleVersionAction = this.handleVersionAction.bind(this);
    }

    /**
     * Initialise l'intégration avec le Template Manager
     * @returns {Promise<void>}
     * @sideEffect Initialise le manager et modifie l'interface
     */
    async initialize() {
        if (this.isInitialized) return;

        try {
            // Initialiser le Template Manager
            await this.templateManager.initialize();

            // Étendre l'interface du TemplateSelector
            this.enhanceTemplateSelector();

            // Ajouter les contrôles de gestion
            this.addManagementControls();

            // Intercepter les événements du sélecteur
            this.interceptSelectorEvents();

            this.isInitialized = true;
            console.log('✅ TemplateManagerIntegration initialisée');

        } catch (error) {
            console.error('❌ Erreur initialisation TemplateManagerIntegration:', error);
            throw error;
        }
    }

    /**
     * Améliore l'interface du TemplateSelector existant
     * @private
     * @sideEffect Ajoute des boutons et panneaux à l'interface
     */
    enhanceTemplateSelector() {
        // Sauvegarder la méthode originale de création du preview
        const originalPreviewTemplate = this.templateSelector.previewTemplate.bind(this.templateSelector);
        
        // Étendre la méthode de preview pour inclure les options de gestion
        this.templateSelector.previewTemplate = (template) => {
            originalPreviewTemplate(template);
            this.enhancePreviewPanel(template);
        };

        // Sauvegarder la méthode originale de création des cartes
        const originalCreateTemplateCard = this.templateSelector.createTemplateCard.bind(this.templateSelector);
        
        // Étendre la création des cartes pour inclure les indicateurs de versioning
        this.templateSelector.createTemplateCard = (template) => {
            const card = originalCreateTemplateCard(template);
            this.enhanceTemplateCard(card, template);
            return card;
        };
    }

    /**
     * Améliore le panneau de preview avec les options de gestion
     * @private
     * @param {Object} template - Template en cours de preview
     * @sideEffect Ajoute des boutons de gestion au preview
     */
    enhancePreviewPanel(template) {
        const previewContent = document.getElementById('template-preview-content');
        if (!previewContent) return;

        // Ajouter section de gestion
        const managementSection = document.createElement('div');
        managementSection.className = 'template-management-section';
        managementSection.style.cssText = `
            margin-top: 20px;
            padding-top: 16px;
            border-top: 1px solid var(--background-modifier-border);
        `;

        // Titre section
        const sectionTitle = document.createElement('h4');
        sectionTitle.textContent = 'Gestion Template';
        sectionTitle.style.cssText = `
            color: var(--text-normal);
            font-size: 14px;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            gap: 8px;
        `;
        sectionTitle.innerHTML = '⚙️ Gestion Template';

        // Boutons de gestion
        const managementButtons = document.createElement('div');
        managementButtons.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 6px;
        `;

        // Bouton Dupliquer
        const duplicateBtn = this.createActionButton(
            '📋 Dupliquer',
            'Créer une copie de ce template',
            () => this.showDuplicationDialog(template)
        );

        // Bouton Créer par Héritage
        const inheritBtn = this.createActionButton(
            '🧬 Hériter',
            'Créer un template par héritage',
            () => this.showInheritanceDialog(template),
            this.options.enableInheritance
        );

        // Bouton Historique Versions
        const versionsBtn = this.createActionButton(
            '📚 Versions',
            'Voir l\'historique des versions',
            () => this.showVersionHistory(template),
            this.options.enableVersioning
        );

        // Bouton Propriétés
        const propertiesBtn = this.createActionButton(
            '🔧 Propriétés',
            'Modifier les propriétés du template',
            () => this.showPropertiesDialog(template)
        );

        managementButtons.appendChild(duplicateBtn);
        if (this.options.enableInheritance) managementButtons.appendChild(inheritBtn);
        if (this.options.enableVersioning) managementButtons.appendChild(versionsBtn);
        managementButtons.appendChild(propertiesBtn);

        managementSection.appendChild(sectionTitle);
        managementSection.appendChild(managementButtons);

        // Insérer avant les actions existantes
        const existingActions = previewContent.querySelector('.preview-actions');
        if (existingActions) {
            previewContent.insertBefore(managementSection, existingActions);
        } else {
            previewContent.appendChild(managementSection);
        }
    }

    /**
     * Améliore une carte template avec les indicateurs de versioning
     * @private
     * @param {HTMLElement} card - Carte template
     * @param {Object} template - Données du template
     * @sideEffect Ajoute des indicateurs visuels à la carte
     */
    enhanceTemplateCard(card, template) {
        // Ajouter indicateur de version si template géré
        if (template.isManaged) {
            const versionBadge = document.createElement('span');
            versionBadge.textContent = `v${template.version || '1.0.0'}`;
            versionBadge.style.cssText = `
                position: absolute;
                top: 8px;
                right: 8px;
                background: var(--interactive-accent);
                color: white;
                font-size: 9px;
                padding: 2px 6px;
                border-radius: 8px;
                font-weight: 600;
            `;
            card.appendChild(versionBadge);
        }

        // Ajouter indicateur héritage si applicable
        if (template.isInherited) {
            const inheritanceBadge = document.createElement('span');
            inheritanceBadge.innerHTML = '🧬';
            inheritanceBadge.title = `Hérite de: ${template.parentTemplateName}`;
            inheritanceBadge.style.cssText = `
                position: absolute;
                top: 8px;
                right: ${template.isManaged ? '32px' : '8px'};
                font-size: 12px;
            `;
            card.appendChild(inheritanceBadge);
        }

        // Ajouter indicateur template personnalisé
        if (template.isCustom) {
            const customBadge = document.createElement('span');
            customBadge.innerHTML = '⭐';
            customBadge.title = 'Template personnalisé';
            customBadge.style.cssText = `
                position: absolute;
                top: 8px;
                right: ${template.isManaged ? (template.isInherited ? '50px' : '32px') : (template.isInherited ? '26px' : '8px')};
                font-size: 12px;
            `;
            card.appendChild(customBadge);
        }

        // Ajouter menu contextuel
        const contextMenu = document.createElement('button');
        contextMenu.innerHTML = '⋮';
        contextMenu.className = 'template-context-menu';
        contextMenu.style.cssText = `
            position: absolute;
            bottom: 8px;
            right: 8px;
            background: var(--background-modifier-hover);
            border: none;
            border-radius: 4px;
            width: 20px;
            height: 20px;
            cursor: pointer;
            font-size: 12px;
            color: var(--text-muted);
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            transition: opacity 0.2s;
        `;

        contextMenu.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showContextMenu(template, contextMenu);
        });

        // Afficher le menu au hover
        card.addEventListener('mouseenter', () => {
            contextMenu.style.opacity = '1';
        });
        card.addEventListener('mouseleave', () => {
            contextMenu.style.opacity = '0';
        });

        card.appendChild(contextMenu);
    }

    /**
     * Ajoute les contrôles de gestion généraux
     * @private
     * @sideEffect Ajoute un panneau de contrôles à l'interface
     */
    addManagementControls() {
        // Trouver le header du sélecteur
        const header = this.templateSelector.modal?.querySelector('.template-selector-header');
        if (!header) return;

        // Créer bouton de gestion
        const manageButton = document.createElement('button');
        manageButton.innerHTML = '⚙️ Gérer';
        manageButton.className = 'template-manage-button';
        manageButton.style.cssText = `
            padding: 6px 12px;
            background: var(--background-secondary);
            border: 1px solid var(--background-modifier-border);
            border-radius: 6px;
            color: var(--text-normal);
            cursor: pointer;
            font-size: 12px;
            transition: all 0.2s;
            margin-right: 8px;
        `;

        manageButton.addEventListener('click', () => this.showManagementPanel());
        manageButton.addEventListener('mouseenter', () => {
            manageButton.style.background = 'var(--interactive-accent)';
            manageButton.style.color = 'white';
        });
        manageButton.addEventListener('mouseleave', () => {
            manageButton.style.background = 'var(--background-secondary)';
            manageButton.style.color = 'var(--text-normal)';
        });

        // Insérer avant le bouton de fermeture
        const closeButton = header.querySelector('.template-selector-close');
        if (closeButton) {
            header.insertBefore(manageButton, closeButton);
        }
    }

    /**
     * Intercepte les événements du sélecteur pour les étendre
     * @private
     * @sideEffect Modifie le comportement des événements existants
     */
    interceptSelectorEvents() {
        // Sauvegarder la méthode originale d'application
        const originalApplySelection = this.templateSelector.applySelection.bind(this.templateSelector);
        
        // Étendre pour inclure les templates gérés
        this.templateSelector.applySelection = async () => {
            // Synchroniser les templates gérés avant application
            await this.syncManagedTemplates();
            originalApplySelection();
        };

        // Intercepter la recherche pour inclure les templates gérés
        const originalApplyFilters = this.templateSelector.applyFilters.bind(this.templateSelector);
        
        this.templateSelector.applyFilters = () => {
            this.includeManagedTemplatesInSearch();
            originalApplyFilters();
        };
    }

    /**
     * Crée un bouton d'action pour le panneau de preview
     * @private
     * @param {string} text - Texte du bouton
     * @param {string} title - Tooltip du bouton
     * @param {Function} onClick - Handler du clic
     * @param {boolean} enabled - Si le bouton est activé
     * @returns {HTMLElement} Bouton créé
     */
    createActionButton(text, title, onClick, enabled = true) {
        const button = document.createElement('button');
        button.textContent = text;
        button.title = title;
        button.disabled = !enabled;
        button.style.cssText = `
            padding: 6px 12px;
            background: ${enabled ? 'var(--background-primary)' : 'var(--background-modifier-hover)'};
            border: 1px solid var(--background-modifier-border);
            border-radius: 4px;
            color: ${enabled ? 'var(--text-normal)' : 'var(--text-muted)'};
            cursor: ${enabled ? 'pointer' : 'not-allowed'};
            font-size: 12px;
            text-align: left;
            transition: all 0.2s;
            width: 100%;
        `;

        if (enabled) {
            button.addEventListener('click', onClick);
            button.addEventListener('mouseenter', () => {
                button.style.background = 'var(--background-modifier-hover)';
            });
            button.addEventListener('mouseleave', () => {
                button.style.background = 'var(--background-primary)';
            });
        }

        return button;
    }

    /**
     * Affiche le dialogue de duplication d'un template
     * @param {Object} template - Template à dupliquer
     * @sideEffect Crée et affiche un dialogue modal
     */
    async showDuplicationDialog(template) {
        const dialog = this.createDialog('Dupliquer Template', 400, 300);
        
        const form = document.createElement('form');
        form.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 16px;
            padding: 20px;
        `;

        // Nom du nouveau template
        const nameGroup = this.createFormGroup(
            'Nouveau nom:',
            'text',
            `${template.name} (Copie)`,
            'Nom du template dupliqué'
        );

        // Description
        const descGroup = this.createFormGroup(
            'Description:',
            'textarea',
            `Copie de: ${template.description}`,
            'Description du template'
        );

        // Modifications optionnelles
        const modificationsGroup = document.createElement('div');
        modificationsGroup.innerHTML = `
            <label style="font-size: 12px; font-weight: 500; color: var(--text-normal); margin-bottom: 8px; display: block;">
                Modifications (optionnel):
            </label>
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                <label style="display: flex; align-items: center; gap: 4px; font-size: 11px;">
                    <input type="checkbox" id="modify-colors"> Modifier couleurs
                </label>
                <label style="display: flex; align-items: center; gap: 4px; font-size: 11px;">
                    <input type="checkbox" id="modify-fields"> Modifier champs
                </label>
                <label style="display: flex; align-items: center; gap: 4px; font-size: 11px;">
                    <input type="checkbox" id="modify-workflow"> Modifier workflow
                </label>
            </div>
        `;

        // Boutons
        const buttonsGroup = document.createElement('div');
        buttonsGroup.style.cssText = `
            display: flex;
            gap: 8px;
            justify-content: flex-end;
            margin-top: 16px;
        `;

        const cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.textContent = 'Annuler';
        cancelBtn.className = 'dialog-cancel-btn';
        cancelBtn.addEventListener('click', () => this.closeDialog(dialog));

        const duplicateBtn = document.createElement('button');
        duplicateBtn.type = 'submit';
        duplicateBtn.textContent = 'Dupliquer';
        duplicateBtn.className = 'dialog-confirm-btn';

        buttonsGroup.appendChild(cancelBtn);
        buttonsGroup.appendChild(duplicateBtn);

        form.appendChild(nameGroup);
        form.appendChild(descGroup);
        form.appendChild(modificationsGroup);
        form.appendChild(buttonsGroup);

        // Handler de soumission
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(form);
            const newName = formData.get('name');
            const newDescription = formData.get('description');
            
            const modifications = {
                name: newName,
                description: newDescription,
                modifyColors: document.getElementById('modify-colors').checked,
                modifyFields: document.getElementById('modify-fields').checked,
                modifyWorkflow: document.getElementById('modify-workflow').checked
            };

            try {
                duplicateBtn.disabled = true;
                duplicateBtn.textContent = 'Duplication...';

                const result = await this.templateManager.duplicateTemplate(template.id, modifications);
                
                if (result.success) {
                    this.showSuccessMessage('Template dupliqué avec succès');
                    await this.refreshTemplatesList();
                    this.closeDialog(dialog);
                }
            } catch (error) {
                console.error('Erreur duplication:', error);
                this.showErrorMessage('Erreur lors de la duplication: ' + error.message);
                duplicateBtn.disabled = false;
                duplicateBtn.textContent = 'Dupliquer';
            }
        });

        dialog.appendChild(form);
        this.showDialog(dialog);
    }

    /**
     * Affiche le dialogue d'héritage d'un template
     * @param {Object} template - Template parent
     * @sideEffect Crée et affiche un dialogue modal
     */
    async showInheritanceDialog(template) {
        const dialog = this.createDialog('Créer par Héritage', 450, 400);
        
        const form = document.createElement('form');
        form.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 16px;
            padding: 20px;
        `;

        // Info du parent
        const parentInfo = document.createElement('div');
        parentInfo.style.cssText = `
            background: var(--background-secondary);
            padding: 12px;
            border-radius: 6px;
            font-size: 12px;
            color: var(--text-muted);
        `;
        parentInfo.innerHTML = `
            <strong>Template Parent:</strong> ${template.name}<br>
            <strong>Type:</strong> ${template.type}<br>
            <strong>Catégorie:</strong> ${template.category}
        `;

        // Nom du template enfant
        const nameGroup = this.createFormGroup(
            'Nom du template enfant:',
            'text',
            `${template.name} Extended`,
            'Nom du nouveau template'
        );

        // Description
        const descGroup = this.createFormGroup(
            'Description:',
            'textarea',
            `Extension de: ${template.name}`,
            'Description du template enfant'
        );

        // Extensions
        const extensionsGroup = document.createElement('div');
        extensionsGroup.innerHTML = `
            <label style="font-size: 12px; font-weight: 500; color: var(--text-normal); margin-bottom: 8px; display: block;">
                Extensions:
            </label>
            <div style="display: flex; flex-direction: column; gap: 8px;">
                <label style="display: flex; align-items: center; gap: 6px; font-size: 11px;">
                    <input type="checkbox" id="extend-fields"> Ajouter des champs personnalisés
                </label>
                <label style="display: flex; align-items: center; gap: 6px; font-size: 11px;">
                    <input type="checkbox" id="extend-workflow"> Étendre le workflow
                </label>
                <label style="display: flex; align-items: center; gap: 6px; font-size: 11px;">
                    <input type="checkbox" id="extend-validations"> Ajouter des validations
                </label>
                <label style="display: flex; align-items: center; gap: 6px; font-size: 11px;">
                    <input type="checkbox" id="extend-actions"> Ajouter des actions personnalisées
                </label>
            </div>
        `;

        // Overrides
        const overridesGroup = document.createElement('div');
        overridesGroup.innerHTML = `
            <label style="font-size: 12px; font-weight: 500; color: var(--text-normal); margin-bottom: 8px; display: block;">
                Overrides (remplacer):
            </label>
            <div style="display: flex; flex-direction: column; gap: 8px;">
                <label style="display: flex; align-items: center; gap: 6px; font-size: 11px;">
                    <input type="checkbox" id="override-colors"> Remplacer les couleurs
                </label>
                <label style="display: flex; align-items: center; gap: 6px; font-size: 11px;">
                    <input type="checkbox" id="override-description"> Remplacer la description
                </label>
            </div>
        `;

        // Boutons
        const buttonsGroup = document.createElement('div');
        buttonsGroup.style.cssText = `
            display: flex;
            gap: 8px;
            justify-content: flex-end;
            margin-top: 16px;
        `;

        const cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.textContent = 'Annuler';
        cancelBtn.className = 'dialog-cancel-btn';
        cancelBtn.addEventListener('click', () => this.closeDialog(dialog));

        const inheritBtn = document.createElement('button');
        inheritBtn.type = 'submit';
        inheritBtn.textContent = 'Créer par Héritage';
        inheritBtn.className = 'dialog-confirm-btn';

        buttonsGroup.appendChild(cancelBtn);
        buttonsGroup.appendChild(inheritBtn);

        form.appendChild(parentInfo);
        form.appendChild(nameGroup);
        form.appendChild(descGroup);
        form.appendChild(extensionsGroup);
        form.appendChild(overridesGroup);
        form.appendChild(buttonsGroup);

        // Handler de soumission
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(form);
            const childData = {
                name: formData.get('name'),
                description: formData.get('description'),
                extensions: {
                    fields: document.getElementById('extend-fields').checked,
                    workflow: document.getElementById('extend-workflow').checked,
                    validations: document.getElementById('extend-validations').checked,
                    actions: document.getElementById('extend-actions').checked
                },
                overrides: {
                    colors: document.getElementById('override-colors').checked,
                    description: document.getElementById('override-description').checked
                }
            };

            try {
                inheritBtn.disabled = true;
                inheritBtn.textContent = 'Création...';

                const result = await this.templateManager.inheritTemplate(template.id, childData);
                
                if (result.success) {
                    this.showSuccessMessage('Template créé par héritage avec succès');
                    await this.refreshTemplatesList();
                    this.closeDialog(dialog);
                }
            } catch (error) {
                console.error('Erreur héritage:', error);
                this.showErrorMessage('Erreur lors de la création: ' + error.message);
                inheritBtn.disabled = false;
                inheritBtn.textContent = 'Créer par Héritage';
            }
        });

        dialog.appendChild(form);
        this.showDialog(dialog);
    }

    /**
     * Affiche l'historique des versions d'un template
     * @param {Object} template - Template dont voir les versions
     * @sideEffect Crée et affiche un panneau d'historique
     */
    async showVersionHistory(template) {
        const dialog = this.createDialog(`Historique - ${template.name}`, 600, 500);
        
        const container = document.createElement('div');
        container.style.cssText = `
            display: flex;
            flex-direction: column;
            height: 100%;
        `;

        // Header avec actions
        const header = document.createElement('div');
        header.style.cssText = `
            padding: 16px 20px;
            border-bottom: 1px solid var(--background-modifier-border);
            display: flex;
            justify-content: space-between;
            align-items: center;
        `;

        const title = document.createElement('h3');
        title.textContent = `Versions de: ${template.name}`;
        title.style.cssText = `
            margin: 0;
            font-size: 16px;
            color: var(--text-normal);
        `;

        const newVersionBtn = document.createElement('button');
        newVersionBtn.textContent = '+ Nouvelle Version';
        newVersionBtn.style.cssText = `
            padding: 6px 12px;
            background: var(--interactive-accent);
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
        `;
        newVersionBtn.addEventListener('click', () => this.showNewVersionDialog(template, dialog));

        header.appendChild(title);
        header.appendChild(newVersionBtn);

        // Liste des versions
        const versionsList = document.createElement('div');
        versionsList.style.cssText = `
            flex: 1;
            overflow-y: auto;
            padding: 16px;
        `;

        try {
            const versions = await this.templateManager.getVersionHistory(template.id);
            
            if (versions.length === 0) {
                versionsList.innerHTML = `
                    <div style="text-align: center; color: var(--text-muted); margin-top: 40px;">
                        <div style="font-size: 48px; margin-bottom: 12px;">📚</div>
                        <div>Aucune version trouvée</div>
                        <div style="font-size: 12px; margin-top: 8px;">
                            Les versions apparaîtront ici après création
                        </div>
                    </div>
                `;
            } else {
                versions.forEach((version, index) => {
                    const versionItem = this.createVersionItem(version, template, index === 0);
                    versionsList.appendChild(versionItem);
                });
            }
        } catch (error) {
            versionsList.innerHTML = `
                <div style="text-align: center; color: var(--text-accent); margin-top: 40px;">
                    <div style="font-size: 48px; margin-bottom: 12px;">⚠️</div>
                    <div>Erreur chargement versions</div>
                    <div style="font-size: 12px; margin-top: 8px;">
                        ${error.message}
                    </div>
                </div>
            `;
        }

        container.appendChild(header);
        container.appendChild(versionsList);
        dialog.appendChild(container);
        this.showDialog(dialog);
    }

    /**
     * Crée un élément d'affichage de version
     * @private
     * @param {Object} version - Données de version
     * @param {Object} template - Template parent
     * @param {boolean} isCurrent - Si c'est la version actuelle
     * @returns {HTMLElement} Élément de version
     */
    createVersionItem(version, template, isCurrent) {
        const item = document.createElement('div');
        item.style.cssText = `
            background: var(--background-primary);
            border: 1px solid ${isCurrent ? 'var(--interactive-accent)' : 'var(--background-modifier-border)'};
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 12px;
            position: relative;
        `;

        // Badge version actuelle
        if (isCurrent) {
            const currentBadge = document.createElement('span');
            currentBadge.textContent = 'ACTUELLE';
            currentBadge.style.cssText = `
                position: absolute;
                top: 12px;
                right: 12px;
                background: var(--interactive-accent);
                color: white;
                font-size: 10px;
                padding: 4px 8px;
                border-radius: 10px;
                font-weight: 600;
            `;
            item.appendChild(currentBadge);
        }

        // Contenu version
        const content = document.createElement('div');
        content.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                <span style="font-size: 18px; font-weight: 600; color: var(--text-normal);">
                    v${version.version}
                </span>
                <span style="font-size: 12px; color: var(--text-muted);">
                    ${new Date(version.created).toLocaleString()}
                </span>
                <span style="font-size: 12px; color: var(--text-muted);">
                    par ${version.author}
                </span>
            </div>
            <div style="color: var(--text-muted); font-size: 13px; margin-bottom: 12px;">
                ${version.changeLog || 'Aucune description'}
            </div>
            <div style="font-size: 11px; color: var(--text-muted); font-family: monospace;">
                Checksum: ${version.checksum?.substring(0, 16)}...
            </div>
        `;

        // Boutons d'action
        const actions = document.createElement('div');
        actions.style.cssText = `
            display: flex;
            gap: 8px;
            margin-top: 12px;
        `;

        if (!isCurrent) {
            const restoreBtn = document.createElement('button');
            restoreBtn.textContent = '↩️ Restaurer';
            restoreBtn.style.cssText = `
                padding: 4px 8px;
                background: var(--background-secondary);
                border: 1px solid var(--background-modifier-border);
                border-radius: 4px;
                color: var(--text-normal);
                cursor: pointer;
                font-size: 11px;
            `;
            restoreBtn.addEventListener('click', () => this.restoreVersion(template, version));
            actions.appendChild(restoreBtn);
        }

        const compareBtn = document.createElement('button');
        compareBtn.textContent = '🔍 Comparer';
        compareBtn.style.cssText = `
            padding: 4px 8px;
            background: var(--background-secondary);
            border: 1px solid var(--background-modifier-border);
            border-radius: 4px;
            color: var(--text-normal);
            cursor: pointer;
            font-size: 11px;
        `;
        compareBtn.addEventListener('click', () => this.compareVersions(template, version));
        actions.appendChild(compareBtn);

        content.appendChild(actions);
        item.appendChild(content);

        return item;
    }

    /**
     * Synchronise les templates gérés avec l'affichage
     * @private
     * @returns {Promise<void>}
     */
    async syncManagedTemplates() {
        try {
            // Rechercher tous les templates gérés
            const managedTemplates = await this.templateManager.searchTemplates({
                source: 'all',
                sortBy: 'modified'
            });

            // Ajouter à la liste des templates du sélecteur
            managedTemplates.forEach(template => {
                if (!this.templateSelector.templates.has(template.id)) {
                    this.templateSelector.templates.set(template.id, {
                        ...template,
                        isManaged: true,
                        searchableText: `${template.name} ${template.description} ${template.category}`.toLowerCase()
                    });
                }
            });

        } catch (error) {
            console.warn('Erreur synchronisation templates gérés:', error);
        }
    }

    /**
     * Inclut les templates gérés dans la recherche
     * @private
     */
    includeManagedTemplatesInSearch() {
        // Cette méthode s'assure que les templates gérés sont inclus dans les filtres
        // L'implémentation dépend de la structure exacte du TemplateSelector
    }

    /**
     * Rafraîchit la liste des templates
     * @private
     * @returns {Promise<void>}
     */
    async refreshTemplatesList() {
        await this.syncManagedTemplates();
        this.templateSelector.applyFilters();
        this.templateSelector.updateStats();
    }

    /**
     * Crée un groupe de formulaire
     * @private
     * @param {string} label - Label du champ
     * @param {string} type - Type de champ
     * @param {string} defaultValue - Valeur par défaut
     * @param {string} placeholder - Placeholder
     * @returns {HTMLElement} Groupe de formulaire
     */
    createFormGroup(label, type, defaultValue = '', placeholder = '') {
        const group = document.createElement('div');
        
        const labelEl = document.createElement('label');
        labelEl.textContent = label;
        labelEl.style.cssText = `
            font-size: 12px;
            font-weight: 500;
            color: var(--text-normal);
            margin-bottom: 8px;
            display: block;
        `;

        let input;
        if (type === 'textarea') {
            input = document.createElement('textarea');
            input.rows = 3;
        } else {
            input = document.createElement('input');
            input.type = type;
        }

        input.name = label.toLowerCase().replace(/[^a-z]/g, '');
        input.value = defaultValue;
        input.placeholder = placeholder;
        input.style.cssText = `
            width: 100%;
            padding: 8px 12px;
            border: 1px solid var(--background-modifier-border);
            border-radius: 4px;
            background: var(--background-secondary);
            color: var(--text-normal);
            font-size: 13px;
            resize: ${type === 'textarea' ? 'vertical' : 'none'};
        `;

        group.appendChild(labelEl);
        group.appendChild(input);

        return group;
    }

    /**
     * Crée un dialogue modal
     * @private
     * @param {string} title - Titre du dialogue
     * @param {number} width - Largeur du dialogue
     * @param {number} height - Hauteur du dialogue
     * @returns {HTMLElement} Dialogue créé
     */
    createDialog(title, width, height) {
        const overlay = document.createElement('div');
        overlay.className = 'template-manager-dialog-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(4px);
            z-index: 10001;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        const dialog = document.createElement('div');
        dialog.className = 'template-manager-dialog';
        dialog.style.cssText = `
            width: ${width}px;
            height: ${height}px;
            max-width: 95vw;
            max-height: 95vh;
            background: var(--background-primary);
            border: 1px solid var(--background-modifier-border);
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            display: flex;
            flex-direction: column;
            overflow: hidden;
        `;

        // Header du dialogue
        const header = document.createElement('div');
        header.style.cssText = `
            padding: 16px 20px;
            border-bottom: 1px solid var(--background-modifier-border);
            background: var(--background-secondary);
            display: flex;
            justify-content: space-between;
            align-items: center;
        `;

        const titleEl = document.createElement('h3');
        titleEl.textContent = title;
        titleEl.style.cssText = `
            margin: 0;
            font-size: 16px;
            color: var(--text-normal);
        `;

        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '×';
        closeBtn.style.cssText = `
            background: none;
            border: none;
            font-size: 20px;
            color: var(--text-muted);
            cursor: pointer;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        closeBtn.addEventListener('click', () => this.closeDialog(overlay));

        header.appendChild(titleEl);
        header.appendChild(closeBtn);
        dialog.appendChild(header);

        overlay.appendChild(dialog);
        overlay.dialog = dialog; // Référence pour faciliter l'accès

        return overlay;
    }

    /**
     * Affiche un dialogue modal
     * @private
     * @param {HTMLElement} dialog - Dialogue à afficher
     * @sideEffect Ajoute le dialogue au DOM
     */
    showDialog(dialog) {
        document.body.appendChild(dialog);
        
        // Animation d'entrée
        dialog.style.animation = 'fadeIn 0.2s ease-out';
        dialog.querySelector('.template-manager-dialog').style.animation = 'slideInUp 0.3s ease-out';
    }

    /**
     * Ferme un dialogue modal
     * @private
     * @param {HTMLElement} dialog - Dialogue à fermer
     * @sideEffect Retire le dialogue du DOM
     */
    closeDialog(dialog) {
        if (dialog && dialog.parentNode) {
            dialog.parentNode.removeChild(dialog);
        }
    }

    /**
     * Affiche un message de succès
     * @private
     * @param {string} message - Message à afficher
     */
    showSuccessMessage(message) {
        this.templateSelector.updateStatus(message, 'success');
    }

    /**
     * Affiche un message d'erreur
     * @private
     * @param {string} message - Message à afficher
     */
    showErrorMessage(message) {
        this.templateSelector.updateStatus(message, 'error');
    }

    /**
     * Nettoie les ressources et détruit l'intégration
     * @sideEffect Nettoie les listeners et références
     */
    destroy() {
        // Nettoyer les dialogues ouverts
        document.querySelectorAll('.template-manager-dialog-overlay').forEach(dialog => {
            this.closeDialog(dialog);
        });

        // Nettoyer le Template Manager
        if (this.templateManager) {
            // Note: TemplateManager n'a pas de méthode destroy, mais on peut nettoyer
            this.templateManager.clearCache();
        }

        // Nettoyer les références
        this.templateSelector = null;
        this.templateManager = null;
        this.isInitialized = false;
    }
}

// Export pour utilisation
export default TemplateManagerIntegration;

// <!-- END OF FILE: template-manager-integration.js -->