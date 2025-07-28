// <!-- START OF FILE: components-palette.js -->
// FILENAME: components-palette.js
// Version: 1.0.0
// Date: 2025-07-28 16:30
// Author: Rolland MELET & Claude Code
// Description: Palette d'outils ExcalidrawAutomate pour création rapide des composants ProcessMetaLanguage

import { ObjectCreator } from '../components/object-creator.js';
import { StateCreator } from '../components/state-creator.js';
import { ActionCreator } from '../components/action-creator.js';
import { TemplateSelector } from './template-selector.js';

/**
 * Classe principale pour la palette d'outils ProcessMetaLanguage
 * Fournit une interface visuelle pour créer rapidement Object, State et Action
 * @class
 */
export class ComponentsPalette {
    /**
     * Crée une instance de la palette d'outils
     * @param {Object} app - Instance de l'application Obsidian
     * @param {Object} excalidrawAPI - API ExcalidrawAutomate
     * @param {Object} options - Options de configuration
     * @param {string} options.position - Position de la palette ('left' ou 'right')
     * @param {number} options.top - Position verticale en pixels
     * @example
     * const palette = new ComponentsPalette(this.app, ExcalidrawAutomate, {
     *   position: 'right',
     *   top: 100
     * });
     * palette.mount();
     */
    constructor(app, excalidrawAPI, options = {}) {
        this.app = app;
        this.ea = excalidrawAPI;
        this.options = {
            position: options.position || 'right',
            top: options.top || 100,
            width: options.width || 220
        };
        
        this.objectCreator = new ObjectCreator(excalidrawAPI);
        this.stateCreator = new StateCreator(excalidrawAPI);
        this.actionCreator = new ActionCreator(excalidrawAPI);
        this.templateSelector = new TemplateSelector(app, {
            templatesPath: './templates/epcis/',
            onSelect: (templates) => this.applyTemplates(templates),
            multiSelect: true
        });
        
        this.container = null;
        this.isCreating = false;
        this.activeButton = null;
        
        this.shortcuts = {
            'mod+1': () => this.createObject(),
            'mod+2': () => this.createState(),
            'mod+3': () => this.createAction(),
            'mod+4': () => this.showTemplateSelector(),
            'escape': () => this.cancelCreation()
        };
    }

    /**
     * Monte la palette dans le DOM et configure les raccourcis clavier
     * @sideEffect Ajoute des éléments au DOM et des listeners d'événements
     * @example
     * // Monter la palette lors de l'activation du plugin
     * const palette = new ComponentsPalette(app, ea);
     * palette.mount();
     */
    mount() {
        this.createPaletteUI();
        this.registerShortcuts();
        this.attachToExcalidraw();
    }

    /**
     * Démonte la palette et nettoie les ressources
     * @sideEffect Retire les éléments du DOM et les listeners d'événements
     * @example
     * // Démonter la palette lors de la désactivation du plugin
     * palette.unmount();
     */
    unmount() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        this.unregisterShortcuts();
    }

    /**
     * Crée l'interface utilisateur de la palette
     * @private
     * @sideEffect Crée et ajoute des éléments DOM
     */
    createPaletteUI() {
        // Création du container principal
        this.container = document.createElement('div');
        this.container.className = 'process-metalanguage-palette';
        this.container.id = 'pml-palette';
        
        // Styles de base avec variables CSS Obsidian
        const positionStyle = this.options.position === 'left' 
            ? `left: 20px;` 
            : `right: 20px;`;
            
        this.container.style.cssText = `
            position: fixed;
            ${positionStyle}
            top: ${this.options.top}px;
            width: ${this.options.width}px;
            background: var(--background-primary);
            border: 1px solid var(--background-modifier-border);
            border-radius: 8px;
            padding: 12px;
            z-index: 1000;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
            font-family: var(--font-interface);
            user-select: none;
        `;

        // Header de la palette
        const header = document.createElement('div');
        header.className = 'pml-palette-header';
        header.style.cssText = `
            font-size: 14px;
            font-weight: 600;
            color: var(--text-normal);
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 1px solid var(--background-modifier-border);
            display: flex;
            align-items: center;
            justify-content: space-between;
        `;
        
        const title = document.createElement('span');
        title.textContent = 'ProcessMetaLanguage';
        header.appendChild(title);
        
        // Bouton de fermeture
        const closeButton = document.createElement('button');
        closeButton.className = 'pml-close-button';
        closeButton.innerHTML = '×';
        closeButton.style.cssText = `
            background: none;
            border: none;
            font-size: 20px;
            color: var(--text-muted);
            cursor: pointer;
            padding: 0;
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 4px;
            transition: all 0.2s;
        `;
        closeButton.addEventListener('click', () => this.unmount());
        closeButton.addEventListener('mouseenter', () => {
            closeButton.style.background = 'var(--background-modifier-hover)';
            closeButton.style.color = 'var(--text-normal)';
        });
        closeButton.addEventListener('mouseleave', () => {
            closeButton.style.background = 'none';
            closeButton.style.color = 'var(--text-muted)';
        });
        header.appendChild(closeButton);
        
        this.container.appendChild(header);

        // Création des boutons de composants
        const components = [
            {
                type: 'object',
                icon: '🔷',
                label: 'Object',
                shortcut: 'Ctrl+1',
                description: 'Hexagone 120×80',
                color: '#4A90E2',
                creator: () => this.createObject()
            },
            {
                type: 'state',
                icon: '🏷️',
                label: 'State',
                shortcut: 'Ctrl+2',
                description: 'Bannière 80×40',
                color: '#7ED321',
                creator: () => this.createState()
            },
            {
                type: 'action',
                icon: '⚡',
                label: 'Action',
                shortcut: 'Ctrl+3',
                description: 'Rectangle 140×60',
                color: '#F5A623',
                creator: () => this.createAction()
            },
            {
                type: 'templates',
                icon: '📋',
                label: 'Templates',
                shortcut: 'Ctrl+4',
                description: '66 Templates EPCIS',
                color: '#9C27B0',
                creator: () => this.showTemplateSelector()
            }
        ];

        components.forEach(comp => {
            const button = this.createComponentButton(comp);
            this.container.appendChild(button);
        });

        // Status bar
        const statusBar = document.createElement('div');
        statusBar.className = 'pml-status-bar';
        statusBar.id = 'pml-status';
        statusBar.style.cssText = `
            margin-top: 12px;
            padding-top: 8px;
            border-top: 1px solid var(--background-modifier-border);
            font-size: 12px;
            color: var(--text-muted);
            text-align: center;
            min-height: 20px;
        `;
        statusBar.textContent = 'Prêt';
        this.container.appendChild(statusBar);
    }

    /**
     * Crée un bouton de composant avec preview
     * @private
     * @param {Object} config - Configuration du bouton
     * @returns {HTMLElement} Element bouton créé
     * @sideEffect Ajoute des listeners d'événements au bouton
     */
    createComponentButton(config) {
        const button = document.createElement('button');
        button.className = `pml-component-button pml-${config.type}`;
        button.dataset.type = config.type;
        button.style.cssText = `
            width: 100%;
            margin: 6px 0;
            padding: 10px;
            background: var(--background-secondary);
            border: 1px solid var(--background-modifier-border);
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            position: relative;
            overflow: hidden;
        `;

        // Header du bouton
        const buttonHeader = document.createElement('div');
        buttonHeader.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: space-between;
            width: 100%;
            margin-bottom: 4px;
        `;

        const labelContainer = document.createElement('div');
        labelContainer.style.cssText = `
            display: flex;
            align-items: center;
            gap: 8px;
        `;

        const icon = document.createElement('span');
        icon.textContent = config.icon;
        icon.style.fontSize = '18px';
        labelContainer.appendChild(icon);

        const label = document.createElement('span');
        label.textContent = config.label;
        label.style.cssText = `
            font-weight: 500;
            color: var(--text-normal);
        `;
        labelContainer.appendChild(label);

        const shortcut = document.createElement('span');
        shortcut.textContent = config.shortcut;
        shortcut.style.cssText = `
            font-size: 11px;
            color: var(--text-muted);
            background: var(--background-primary);
            padding: 2px 6px;
            border-radius: 3px;
            font-family: monospace;
        `;

        buttonHeader.appendChild(labelContainer);
        buttonHeader.appendChild(shortcut);
        button.appendChild(buttonHeader);

        // Description
        const description = document.createElement('div');
        description.textContent = config.description;
        description.style.cssText = `
            font-size: 12px;
            color: var(--text-muted);
        `;
        button.appendChild(description);

        // Preview canvas
        const preview = document.createElement('canvas');
        preview.width = 60;
        preview.height = 40;
        preview.style.cssText = `
            position: absolute;
            right: 10px;
            bottom: 8px;
            opacity: 0.3;
            transition: opacity 0.2s;
        `;
        this.drawPreview(preview, config.type, config.color);
        button.appendChild(preview);

        // Event listeners
        button.addEventListener('click', () => {
            if (!this.isCreating) {
                this.setActiveButton(button);
                config.creator();
            }
        });

        button.addEventListener('mouseenter', () => {
            if (!this.isCreating) {
                button.style.background = 'var(--background-modifier-hover)';
                button.style.borderColor = config.color;
                button.style.transform = 'translateY(-1px)';
                preview.style.opacity = '0.6';
            }
        });

        button.addEventListener('mouseleave', () => {
            if (!this.isCreating && button !== this.activeButton) {
                button.style.background = 'var(--background-secondary)';
                button.style.borderColor = 'var(--background-modifier-border)';
                button.style.transform = 'translateY(0)';
                preview.style.opacity = '0.3';
            }
        });

        return button;
    }

    /**
     * Dessine un aperçu du composant dans un canvas
     * @private
     * @param {HTMLCanvasElement} canvas - Canvas pour le preview
     * @param {string} type - Type de composant
     * @param {string} color - Couleur du composant
     */
    drawPreview(canvas, type, color) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.8;

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        switch (type) {
            case 'object':
                // Dessiner un hexagone miniature
                ctx.beginPath();
                for (let i = 0; i < 6; i++) {
                    const angle = (Math.PI / 3) * i;
                    const x = centerX + 15 * Math.cos(angle);
                    const y = centerY + 12 * Math.sin(angle);
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.closePath();
                ctx.stroke();
                break;

            case 'state':
                // Dessiner une bannière miniature
                ctx.beginPath();
                ctx.moveTo(centerX - 20, centerY - 8);
                ctx.lineTo(centerX + 15, centerY - 8);
                ctx.lineTo(centerX + 20, centerY);
                ctx.lineTo(centerX + 15, centerY + 8);
                ctx.lineTo(centerX - 20, centerY + 8);
                ctx.closePath();
                ctx.stroke();
                break;

            case 'action':
                // Dessiner un rectangle arrondi miniature
                const radius = 3;
                ctx.beginPath();
                ctx.moveTo(centerX - 20 + radius, centerY - 10);
                ctx.lineTo(centerX + 20 - radius, centerY - 10);
                ctx.arc(centerX + 20 - radius, centerY - 10 + radius, radius, -Math.PI/2, 0);
                ctx.lineTo(centerX + 20, centerY + 10 - radius);
                ctx.arc(centerX + 20 - radius, centerY + 10 - radius, radius, 0, Math.PI/2);
                ctx.lineTo(centerX - 20 + radius, centerY + 10);
                ctx.arc(centerX - 20 + radius, centerY + 10 - radius, radius, Math.PI/2, Math.PI);
                ctx.lineTo(centerX - 20, centerY - 10 + radius);
                ctx.arc(centerX - 20 + radius, centerY - 10 + radius, radius, Math.PI, Math.PI*3/2);
                ctx.closePath();
                ctx.stroke();
                break;
        }
    }

    /**
     * Attache la palette au container Excalidraw
     * @private
     * @sideEffect Modifie le DOM d'Excalidraw
     */
    attachToExcalidraw() {
        // Attendre que Excalidraw soit chargé
        const checkAndAttach = () => {
            const excalidrawContainer = document.querySelector('.excalidraw-wrapper') || 
                                       document.querySelector('.excalidraw') ||
                                       document.querySelector('[data-type="excalidraw"]');
            
            if (excalidrawContainer) {
                excalidrawContainer.appendChild(this.container);
                this.updateStatus('Palette chargée');
            } else {
                // Réessayer après un court délai
                setTimeout(checkAndAttach, 500);
            }
        };
        
        checkAndAttach();
    }

    /**
     * Enregistre les raccourcis clavier
     * @private
     * @sideEffect Ajoute des listeners d'événements globaux
     */
    registerShortcuts() {
        this.keydownHandler = (e) => {
            const key = this.getShortcutKey(e);
            if (this.shortcuts[key]) {
                e.preventDefault();
                e.stopPropagation();
                this.shortcuts[key]();
            }
        };
        
        document.addEventListener('keydown', this.keydownHandler);
    }

    /**
     * Désenregistre les raccourcis clavier
     * @private
     * @sideEffect Retire les listeners d'événements globaux
     */
    unregisterShortcuts() {
        if (this.keydownHandler) {
            document.removeEventListener('keydown', this.keydownHandler);
        }
    }

    /**
     * Convertit un événement clavier en clé de raccourci
     * @private
     * @param {KeyboardEvent} e - Événement clavier
     * @returns {string} Clé de raccourci formatée
     */
    getShortcutKey(e) {
        const parts = [];
        if (e.ctrlKey || e.metaKey) parts.push('mod');
        if (e.altKey) parts.push('alt');
        if (e.shiftKey) parts.push('shift');
        
        if (e.key === 'Escape') {
            parts.push('escape');
        } else if (e.key >= '0' && e.key <= '9') {
            parts.push(e.key);
        }
        
        return parts.join('+');
    }

    /**
     * Définit le bouton actif et met à jour l'UI
     * @private
     * @param {HTMLElement} button - Bouton à activer
     * @sideEffect Modifie les styles des boutons
     */
    setActiveButton(button) {
        // Désactiver l'ancien bouton actif
        if (this.activeButton) {
            this.activeButton.style.background = 'var(--background-secondary)';
            this.activeButton.style.borderColor = 'var(--background-modifier-border)';
        }
        
        // Activer le nouveau bouton
        this.activeButton = button;
        if (button) {
            button.style.background = 'var(--background-modifier-hover)';
            button.style.borderColor = 'var(--interactive-accent)';
        }
    }

    /**
     * Crée un composant Object au centre du canvas
     * @sideEffect Modifie le canvas Excalidraw et déclenche une sauvegarde
     * @example
     * // Création d'un objet via le bouton ou raccourci
     * palette.createObject();
     */
    async createObject() {
        if (this.isCreating) return;
        
        this.isCreating = true;
        this.updateStatus('Création Object...');
        
        try {
            // Obtenir le centre du viewport
            const viewport = await this.getViewportCenter();
            
            // Créer l'objet avec nom par défaut
            const objectId = await this.objectCreator.createObject(
                `Object-${Date.now()}`,
                'product',
                viewport
            );
            
            this.updateStatus(`Object créé (ID: ${objectId.substring(0, 8)}...)`);
            
            // Feedback visuel
            this.flashButton('object', '#4A90E2');
            
        } catch (error) {
            console.error('Erreur création Object:', error);
            this.updateStatus('Erreur création Object');
        } finally {
            this.isCreating = false;
            this.setActiveButton(null);
        }
    }

    /**
     * Crée un composant State au centre du canvas
     * @sideEffect Modifie le canvas Excalidraw et déclenche une sauvegarde
     * @example
     * // Création d'un state via le bouton ou raccourci
     * palette.createState();
     */
    async createState() {
        if (this.isCreating) return;
        
        this.isCreating = true;
        this.updateStatus('Création State...');
        
        try {
            const viewport = await this.getViewportCenter();
            
            const stateId = await this.stateCreator.createState(
                `State-${Date.now()}`,
                'active',
                viewport
            );
            
            this.updateStatus(`State créé (ID: ${stateId.substring(0, 8)}...)`);
            this.flashButton('state', '#7ED321');
            
        } catch (error) {
            console.error('Erreur création State:', error);
            this.updateStatus('Erreur création State');
        } finally {
            this.isCreating = false;
            this.setActiveButton(null);
        }
    }

    /**
     * Crée un composant Action au centre du canvas
     * @sideEffect Modifie le canvas Excalidraw et déclenche une sauvegarde
     * @example
     * // Création d'une action via le bouton ou raccourci
     * palette.createAction();
     */
    async createAction() {
        if (this.isCreating) return;
        
        this.isCreating = true;
        this.updateStatus('Création Action...');
        
        try {
            const viewport = await this.getViewportCenter();
            
            const actionId = await this.actionCreator.createAction(
                'receiving',
                viewport,
                { isMainAction: true }
            );
            
            this.updateStatus(`Action créée (ID: ${actionId.substring(0, 8)}...)`);
            this.flashButton('action', '#F5A623');
            
        } catch (error) {
            console.error('Erreur création Action:', error);
            this.updateStatus('Erreur création Action');
        } finally {
            this.isCreating = false;
            this.setActiveButton(null);
        }
    }

    /**
     * Annule la création en cours
     * @sideEffect Met à jour l'état de l'UI
     */
    cancelCreation() {
        if (this.isCreating) {
            this.isCreating = false;
            this.setActiveButton(null);
            this.updateStatus('Création annulée');
        }
    }

    /**
     * Obtient le centre du viewport Excalidraw
     * @private
     * @returns {Promise<{x: number, y: number}>} Coordonnées du centre
     */
    async getViewportCenter() {
        // Utiliser l'API Excalidraw pour obtenir le viewport
        const api = this.ea.getExcalidrawAPI();
        if (api && api.getAppState) {
            const appState = api.getAppState();
            const { width, height, scrollX, scrollY } = appState;
            
            return {
                x: -scrollX + width / 2,
                y: -scrollY + height / 2
            };
        }
        
        // Fallback: centre de l'écran
        return {
            x: window.innerWidth / 2,
            y: window.innerHeight / 2
        };
    }

    /**
     * Met à jour le message de statut
     * @private
     * @param {string} message - Message à afficher
     * @sideEffect Modifie le contenu du status bar
     */
    updateStatus(message) {
        const statusBar = document.getElementById('pml-status');
        if (statusBar) {
            statusBar.textContent = message;
            
            // Réinitialiser après 3 secondes
            clearTimeout(this.statusTimeout);
            this.statusTimeout = setTimeout(() => {
                statusBar.textContent = 'Prêt';
            }, 3000);
        }
    }

    /**
     * Fait clignoter un bouton pour feedback visuel
     * @private
     * @param {string} type - Type de composant
     * @param {string} color - Couleur du flash
     * @sideEffect Modifie temporairement les styles du bouton
     */
    flashButton(type, color) {
        const button = this.container.querySelector(`.pml-${type}`);
        if (button) {
            const originalBg = button.style.background;
            button.style.background = color;
            button.style.opacity = '0.3';
            
            setTimeout(() => {
                button.style.background = originalBg;
                button.style.opacity = '1';
            }, 200);
        }
    }

    /**
     * Affiche le sélecteur de templates EPCIS 2.0
     * @sideEffect Ouvre la modal de sélection de templates
     * @example
     * // Ouvrir le sélecteur de templates via le bouton ou raccourci
     * palette.showTemplateSelector();
     */
    async showTemplateSelector() {
        if (this.isCreating) return;
        
        this.isCreating = true;
        this.updateStatus('Ouverture sélecteur templates...');
        
        try {
            await this.templateSelector.show();
            this.updateStatus('Sélecteur templates ouvert');
        } catch (error) {
            console.error('Erreur ouverture sélecteur:', error);
            this.updateStatus('Erreur ouverture sélecteur');
        } finally {
            this.isCreating = false;
            this.setActiveButton(null);
        }
    }

    /**
     * Applique les templates sélectionnés aux composants du canvas
     * @param {Array} templates - Templates EPCIS sélectionnés
     * @sideEffect Modifie les composants existants ou crée de nouveaux composants
     * @example
     * // Callback automatique lors de la sélection de templates
     * palette.applyTemplates([{id: 'receiving', type: 'business_step', ...}]);
     */
    async applyTemplates(templates) {
        if (!templates || templates.length === 0) return;
        
        this.updateStatus(`Application de ${templates.length} template(s)...`);
        
        try {
            for (let i = 0; i < templates.length; i++) {
                await this.applyTemplate(templates[i], i);
            }
            
            this.updateStatus(`${templates.length} template(s) appliqué(s) avec succès`);
            
            // Flash visual feedback
            this.flashButton('templates', '#9C27B0');
            
        } catch (error) {
            console.error('Erreur application templates:', error);
            this.updateStatus('Erreur application templates');
        }
    }

    /**
     * Applique un template individuel au canvas
     * @private
     * @param {Object} template - Template EPCIS à appliquer
     * @param {number} index - Index du template pour décalage position
     * @sideEffect Crée un composant correspondant au template
     */
    async applyTemplate(template, index = 0) {
        const viewport = await this.getViewportCenter();
        
        // Décaler la position pour éviter la superposition
        const offset = index * 30;
        const position = {
            x: viewport.x + offset,
            y: viewport.y + offset
        };
        
        if (template.type === 'business_step') {
            // Créer une action basée sur le business step
            await this.actionCreator.createAction(
                template.id,
                position,
                {
                    isMainAction: template.actionType === 'primary',
                    category: template.category,
                    description: template.description,
                    color: template.color,
                    epcisData: {
                        businessStep: template.id,
                        category: template.category,
                        actionType: template.actionType,
                        workflowPosition: template.workflowPosition
                    }
                }
            );
        } else if (template.type === 'disposition') {
            // Créer un state basé sur la disposition
            await this.stateCreator.createState(
                template.id,
                template.id,
                position,
                {
                    category: template.category,
                    description: template.description,
                    color: template.color,
                    isSellable: template.isSellable,
                    requiresAction: template.requiresAction,
                    epcisData: {
                        disposition: template.id,
                        category: template.category,
                        dispositionType: template.dispositionType,
                        isSellable: template.isSellable,
                        requiresAction: template.requiresAction
                    }
                }
            );
        }
    }

    /**
     * Obtient les statistiques d'utilisation de la palette
     * @returns {Object} Statistiques d'utilisation
     * @example
     * const stats = palette.getUsageStats();
     * console.log(`Objects créés: ${stats.objectsCreated}`);
     */
    getUsageStats() {
        return {
            objectsCreated: this.objectCreator.getCreatedCount?.() || 0,
            statesCreated: this.stateCreator.getCreatedCount?.() || 0,
            actionsCreated: this.actionCreator.getCreatedCount?.() || 0,
            templatesApplied: this.templatesApplied || 0,
            sessionDuration: Date.now() - this.sessionStart
        };
    }
}

// Export pour utilisation dans Obsidian
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ComponentsPalette;
}

// <!-- END OF FILE: components-palette.js -->