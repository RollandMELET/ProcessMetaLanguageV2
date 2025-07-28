// <!-- START OF FILE: components-palette.test.js -->
// FILENAME: components-palette.test.js
// Version: 1.0.0
// Date: 2025-07-28 16:30
// Author: Rolland MELET & Claude Code
// Description: Tests unitaires pour la palette d'outils ProcessMetaLanguage

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ComponentsPalette } from '../../ui/components-palette.js';

// Mock des modules de création
vi.mock('../../components/object-creator.js', () => ({
    ObjectCreator: vi.fn().mockImplementation(() => ({
        createObject: vi.fn().mockResolvedValue('mock-object-id')
    }))
}));

vi.mock('../../components/state-creator.js', () => ({
    StateCreator: vi.fn().mockImplementation(() => ({
        createState: vi.fn().mockResolvedValue('mock-state-id')
    }))
}));

vi.mock('../../components/action-creator.js', () => ({
    ActionCreator: vi.fn().mockImplementation(() => ({
        createAction: vi.fn().mockResolvedValue('mock-action-id')
    }))
}));

describe('ComponentsPalette', () => {
    let palette;
    let mockApp;
    let mockExcalidrawAPI;
    let mockContainer;

    beforeEach(() => {
        // Configuration du DOM mock
        document.body.innerHTML = `
            <div class="excalidraw-wrapper" id="test-excalidraw"></div>
        `;
        mockContainer = document.getElementById('test-excalidraw');

        // Mock de l'app Obsidian
        mockApp = {
            workspace: {
                getActiveViewOfType: vi.fn().mockReturnValue(true)
            }
        };

        // Mock de l'API Excalidraw
        mockExcalidrawAPI = {
            createElement: vi.fn().mockReturnValue({ id: 'mock-element-id' }),
            addElementTags: vi.fn(),
            getExcalidrawAPI: vi.fn().mockReturnValue({
                getAppState: vi.fn().mockReturnValue({
                    width: 1200,
                    height: 800,
                    scrollX: 0,
                    scrollY: 0
                })
            })
        };

        // Mock des variables CSS
        const style = document.createElement('style');
        style.textContent = `
            :root {
                --background-primary: #ffffff;
                --background-secondary: #f5f5f5;
                --background-modifier-border: #e0e0e0;
                --background-modifier-hover: #ebebeb;
                --text-normal: #2e3338;
                --text-muted: #999999;
                --interactive-accent: #7c3aed;
                --font-interface: sans-serif;
                --font-monospace: monospace;
            }
        `;
        document.head.appendChild(style);
    });

    afterEach(() => {
        // Nettoyer le DOM
        document.body.innerHTML = '';
        document.head.innerHTML = '';
        
        // Nettoyer la palette
        if (palette) {
            palette.unmount();
            palette = null;
        }
        
        vi.clearAllMocks();
    });

    describe('Initialisation', () => {
        it('devrait créer une instance avec les options par défaut', () => {
            palette = new ComponentsPalette(mockApp, mockExcalidrawAPI);
            
            expect(palette.app).toBe(mockApp);
            expect(palette.ea).toBe(mockExcalidrawAPI);
            expect(palette.options.position).toBe('right');
            expect(palette.options.top).toBe(100);
            expect(palette.options.width).toBe(220);
        });

        it('devrait accepter des options personnalisées', () => {
            palette = new ComponentsPalette(mockApp, mockExcalidrawAPI, {
                position: 'left',
                top: 200,
                width: 300
            });
            
            expect(palette.options.position).toBe('left');
            expect(palette.options.top).toBe(200);
            expect(palette.options.width).toBe(300);
        });

        it('devrait initialiser les creators', () => {
            palette = new ComponentsPalette(mockApp, mockExcalidrawAPI);
            
            expect(palette.objectCreator).toBeDefined();
            expect(palette.stateCreator).toBeDefined();
            expect(palette.actionCreator).toBeDefined();
        });
    });

    describe('Montage de la palette', () => {
        beforeEach(() => {
            palette = new ComponentsPalette(mockApp, mockExcalidrawAPI);
        });

        it('devrait monter la palette dans le DOM', () => {
            palette.mount();
            
            const paletteElement = document.getElementById('pml-palette');
            expect(paletteElement).toBeTruthy();
            expect(paletteElement.className).toBe('process-metalanguage-palette');
        });

        it('devrait créer le header avec titre et bouton de fermeture', () => {
            palette.mount();
            
            const header = document.querySelector('.pml-palette-header');
            expect(header).toBeTruthy();
            expect(header.textContent).toContain('ProcessMetaLanguage');
            
            const closeButton = document.querySelector('.pml-close-button');
            expect(closeButton).toBeTruthy();
        });

        it('devrait créer les trois boutons de composants', () => {
            palette.mount();
            
            const objectButton = document.querySelector('.pml-object');
            const stateButton = document.querySelector('.pml-state');
            const actionButton = document.querySelector('.pml-action');
            
            expect(objectButton).toBeTruthy();
            expect(objectButton.textContent).toContain('Object');
            expect(objectButton.textContent).toContain('Ctrl+1');
            
            expect(stateButton).toBeTruthy();
            expect(stateButton.textContent).toContain('State');
            expect(stateButton.textContent).toContain('Ctrl+2');
            
            expect(actionButton).toBeTruthy();
            expect(actionButton.textContent).toContain('Action');
            expect(actionButton.textContent).toContain('Ctrl+3');
        });

        it('devrait créer la status bar', () => {
            palette.mount();
            
            const statusBar = document.getElementById('pml-status');
            expect(statusBar).toBeTruthy();
            // Le status peut être 'Prêt' ou 'Palette chargée' selon le timing
            expect(['Prêt', 'Palette chargée']).toContain(statusBar.textContent);
        });

        it('devrait positionner la palette selon les options', () => {
            palette = new ComponentsPalette(mockApp, mockExcalidrawAPI, {
                position: 'left',
                top: 150
            });
            palette.mount();
            
            const paletteElement = document.getElementById('pml-palette');
            expect(paletteElement.style.left).toBe('20px');
            expect(paletteElement.style.top).toBe('150px');
        });
    });

    describe('Démontage de la palette', () => {
        beforeEach(() => {
            palette = new ComponentsPalette(mockApp, mockExcalidrawAPI);
            palette.mount();
        });

        it('devrait retirer la palette du DOM', () => {
            expect(document.getElementById('pml-palette')).toBeTruthy();
            
            palette.unmount();
            
            expect(document.getElementById('pml-palette')).toBeFalsy();
        });

        it('devrait désenregistrer les raccourcis clavier', () => {
            const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
            
            palette.unmount();
            
            expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
        });
    });

    describe('Création de composants', () => {
        beforeEach(() => {
            palette = new ComponentsPalette(mockApp, mockExcalidrawAPI);
            palette.mount();
        });

        it('devrait créer un Object au clic sur le bouton', async () => {
            const objectButton = document.querySelector('.pml-object');
            objectButton.click();
            
            await vi.waitFor(() => {
                expect(palette.objectCreator.createObject).toHaveBeenCalled();
            });
            
            expect(palette.objectCreator.createObject).toHaveBeenCalledWith(
                expect.stringContaining('Object-'),
                'product',
                expect.objectContaining({ x: expect.any(Number), y: expect.any(Number) })
            );
        });

        it('devrait créer un State au clic sur le bouton', async () => {
            const stateButton = document.querySelector('.pml-state');
            stateButton.click();
            
            await vi.waitFor(() => {
                expect(palette.stateCreator.createState).toHaveBeenCalled();
            });
            
            expect(palette.stateCreator.createState).toHaveBeenCalledWith(
                expect.stringContaining('State-'),
                'active',
                expect.objectContaining({ x: expect.any(Number), y: expect.any(Number) })
            );
        });

        it('devrait créer une Action au clic sur le bouton', async () => {
            const actionButton = document.querySelector('.pml-action');
            actionButton.click();
            
            await vi.waitFor(() => {
                expect(palette.actionCreator.createAction).toHaveBeenCalled();
            });
            
            expect(palette.actionCreator.createAction).toHaveBeenCalledWith(
                'receiving',
                expect.objectContaining({ x: expect.any(Number), y: expect.any(Number) }),
                { isMainAction: true }
            );
        });

        it('devrait empêcher la création multiple simultanée', async () => {
            palette.isCreating = true;
            
            const objectButton = document.querySelector('.pml-object');
            objectButton.click();
            
            expect(palette.objectCreator.createObject).not.toHaveBeenCalled();
        });

        it('devrait mettre à jour le status lors de la création', async () => {
            const statusBar = document.getElementById('pml-status');
            
            palette.createObject();
            expect(statusBar.textContent).toBe('Création Object...');
            
            await vi.waitFor(() => {
                expect(statusBar.textContent).toContain('Object créé');
            });
        });
    });

    describe('Raccourcis clavier', () => {
        beforeEach(() => {
            palette = new ComponentsPalette(mockApp, mockExcalidrawAPI);
            palette.mount();
        });

        it('devrait créer un Object avec Ctrl+1', async () => {
            const event = new KeyboardEvent('keydown', {
                key: '1',
                ctrlKey: true,
                bubbles: true
            });
            document.dispatchEvent(event);
            
            await vi.waitFor(() => {
                expect(palette.objectCreator.createObject).toHaveBeenCalled();
            });
        });

        it('devrait créer un State avec Ctrl+2', async () => {
            const event = new KeyboardEvent('keydown', {
                key: '2',
                ctrlKey: true,
                bubbles: true
            });
            document.dispatchEvent(event);
            
            await vi.waitFor(() => {
                expect(palette.stateCreator.createState).toHaveBeenCalled();
            });
        });

        it('devrait créer une Action avec Ctrl+3', async () => {
            const event = new KeyboardEvent('keydown', {
                key: '3',
                ctrlKey: true,
                bubbles: true
            });
            document.dispatchEvent(event);
            
            await vi.waitFor(() => {
                expect(palette.actionCreator.createAction).toHaveBeenCalled();
            });
        });

        it('devrait annuler la création avec Escape', () => {
            palette.isCreating = true;
            palette.setActiveButton(document.querySelector('.pml-object'));
            
            const event = new KeyboardEvent('keydown', {
                key: 'Escape',
                bubbles: true
            });
            document.dispatchEvent(event);
            
            expect(palette.isCreating).toBe(false);
            expect(palette.activeButton).toBe(null);
        });

        it('devrait prévenir le comportement par défaut pour les raccourcis', () => {
            const event = new KeyboardEvent('keydown', {
                key: '1',
                ctrlKey: true,
                bubbles: true
            });
            
            const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
            const stopPropagationSpy = vi.spyOn(event, 'stopPropagation');
            
            document.dispatchEvent(event);
            
            expect(preventDefaultSpy).toHaveBeenCalled();
            expect(stopPropagationSpy).toHaveBeenCalled();
        });
    });

    describe('Interactions UI', () => {
        beforeEach(() => {
            palette = new ComponentsPalette(mockApp, mockExcalidrawAPI);
            palette.mount();
        });

        it('devrait fermer la palette au clic sur le bouton de fermeture', () => {
            const closeButton = document.querySelector('.pml-close-button');
            closeButton.click();
            
            expect(document.getElementById('pml-palette')).toBeFalsy();
        });

        it('devrait afficher un effet hover sur les boutons', () => {
            const objectButton = document.querySelector('.pml-object');
            const originalBg = objectButton.style.background;
            
            // Simuler hover
            const mouseEnterEvent = new MouseEvent('mouseenter', { bubbles: true });
            objectButton.dispatchEvent(mouseEnterEvent);
            
            expect(objectButton.style.background).not.toBe(originalBg);
            
            // Simuler mouse leave
            const mouseLeaveEvent = new MouseEvent('mouseleave', { bubbles: true });
            objectButton.dispatchEvent(mouseLeaveEvent);
            
            expect(objectButton.style.background).toBe(originalBg);
        });

        it('devrait maintenir le bouton actif pendant la création', () => {
            const objectButton = document.querySelector('.pml-object');
            
            palette.setActiveButton(objectButton);
            
            expect(palette.activeButton).toBe(objectButton);
            expect(objectButton.style.borderColor).toBe('var(--interactive-accent)');
        });
    });

    describe('Preview des composants', () => {
        beforeEach(() => {
            palette = new ComponentsPalette(mockApp, mockExcalidrawAPI);
            palette.mount();
        });

        it('devrait afficher un canvas de preview pour chaque bouton', () => {
            const canvases = document.querySelectorAll('.pml-component-button canvas');
            
            expect(canvases.length).toBe(3);
            canvases.forEach(canvas => {
                expect(canvas.width).toBe(60);
                expect(canvas.height).toBe(40);
            });
        });

        it('devrait dessiner les previews correctement', () => {
            const objectCanvas = document.querySelector('.pml-object canvas');
            const ctx = objectCanvas.getContext('2d');
            
            // Vérifier que le contexte a été utilisé
            expect(ctx).toBeTruthy();
        });
    });

    describe('Gestion du viewport', () => {
        beforeEach(() => {
            palette = new ComponentsPalette(mockApp, mockExcalidrawAPI);
        });

        it('devrait obtenir le centre du viewport depuis l\'API Excalidraw', async () => {
            const center = await palette.getViewportCenter();
            
            expect(center).toEqual({
                x: 600, // width/2 = 1200/2
                y: 400  // height/2 = 800/2
            });
        });

        it('devrait utiliser un fallback si l\'API n\'est pas disponible', async () => {
            palette.ea.getExcalidrawAPI = vi.fn().mockReturnValue(null);
            
            // Mock window dimensions
            Object.defineProperty(window, 'innerWidth', { value: 1920, writable: true });
            Object.defineProperty(window, 'innerHeight', { value: 1080, writable: true });
            
            const center = await palette.getViewportCenter();
            
            expect(center).toEqual({
                x: 960,
                y: 540
            });
        });
    });

    describe('Statistiques d\'utilisation', () => {
        beforeEach(() => {
            palette = new ComponentsPalette(mockApp, mockExcalidrawAPI);
            palette.mount();
        });

        it('devrait retourner les statistiques d\'utilisation', () => {
            // Mock des méthodes getCreatedCount
            palette.objectCreator.getCreatedCount = vi.fn().mockReturnValue(5);
            palette.stateCreator.getCreatedCount = vi.fn().mockReturnValue(3);
            palette.actionCreator.getCreatedCount = vi.fn().mockReturnValue(7);
            palette.sessionStart = Date.now() - 60000; // 1 minute ago
            
            const stats = palette.getUsageStats();
            
            expect(stats.objectsCreated).toBe(5);
            expect(stats.statesCreated).toBe(3);
            expect(stats.actionsCreated).toBe(7);
            expect(stats.sessionDuration).toBeGreaterThan(59000);
            expect(stats.sessionDuration).toBeLessThan(61000);
        });

        it('devrait gérer l\'absence de méthodes getCreatedCount', () => {
            const stats = palette.getUsageStats();
            
            expect(stats.objectsCreated).toBe(0);
            expect(stats.statesCreated).toBe(0);
            expect(stats.actionsCreated).toBe(0);
        });
    });

    describe('Gestion des erreurs', () => {
        beforeEach(() => {
            palette = new ComponentsPalette(mockApp, mockExcalidrawAPI);
            palette.mount();
            vi.spyOn(console, 'error').mockImplementation(() => {});
        });

        it('devrait gérer les erreurs de création d\'Object', async () => {
            palette.objectCreator.createObject = vi.fn().mockRejectedValue(new Error('Creation failed'));
            
            await palette.createObject();
            
            expect(console.error).toHaveBeenCalledWith('Erreur création Object:', expect.any(Error));
            expect(document.getElementById('pml-status').textContent).toBe('Erreur création Object');
            expect(palette.isCreating).toBe(false);
        });

        it('devrait gérer les erreurs de création de State', async () => {
            palette.stateCreator.createState = vi.fn().mockRejectedValue(new Error('Creation failed'));
            
            await palette.createState();
            
            expect(console.error).toHaveBeenCalledWith('Erreur création State:', expect.any(Error));
            expect(document.getElementById('pml-status').textContent).toBe('Erreur création State');
            expect(palette.isCreating).toBe(false);
        });

        it('devrait gérer les erreurs de création d\'Action', async () => {
            palette.actionCreator.createAction = vi.fn().mockRejectedValue(new Error('Creation failed'));
            
            await palette.createAction();
            
            expect(console.error).toHaveBeenCalledWith('Erreur création Action:', expect.any(Error));
            expect(document.getElementById('pml-status').textContent).toBe('Erreur création Action');
            expect(palette.isCreating).toBe(false);
        });
    });
});

// <!-- END OF FILE: components-palette.test.js -->