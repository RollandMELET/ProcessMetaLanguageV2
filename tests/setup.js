// <!-- START OF FILE: setup.js -->
// FILENAME: setup.js
// Version: 1.0.0
// Date: 2025-07-28 16:30
// Author: Rolland MELET & Claude Code
// Description: Configuration globale pour les tests Vitest

import { vi, beforeEach, afterEach } from 'vitest';

// Configuration globale pour les tests UI
beforeEach(() => {
    // Mock des API du navigateur
    global.ResizeObserver = vi.fn().mockImplementation(() => ({
        observe: vi.fn(),
        unobserve: vi.fn(),
        disconnect: vi.fn(),
    }));

    global.IntersectionObserver = vi.fn().mockImplementation(() => ({
        observe: vi.fn(),
        unobserve: vi.fn(),
        disconnect: vi.fn(),
    }));

    // Mock de requestAnimationFrame
    global.requestAnimationFrame = vi.fn((cb) => setTimeout(cb, 16));
    global.cancelAnimationFrame = vi.fn();

    // Mock de getComputedStyle
    global.getComputedStyle = vi.fn().mockReturnValue({
        getPropertyValue: vi.fn().mockReturnValue(''),
    });

    // Variables CSS pour les tests
    if (typeof window !== 'undefined') {
        const mockStyleElement = document.createElement('style');
        mockStyleElement.textContent = `
            :root {
                --background-primary: #ffffff;
                --background-secondary: #f5f5f5;
                --background-modifier-border: #e0e0e0;
                --background-modifier-hover: #ebebeb;
                --text-normal: #2e3338;
                --text-muted: #999999;
                --text-accent: #7c3aed;
                --text-success: #4caf50;
                --text-error: #e91e63;
                --interactive-accent: #7c3aed;
                --font-interface: sans-serif;
                --font-monospace: monospace;
            }
        `;
        document.head?.appendChild(mockStyleElement);
    }
});

afterEach(() => {
    // Nettoyer le DOM après chaque test
    if (typeof document !== 'undefined') {
        document.body.innerHTML = '';
        // Garder seulement les éléments de style nécessaires
        const styleElements = document.head?.querySelectorAll('style');
        styleElements?.forEach(el => {
            if (!el.textContent?.includes(':root')) {
                el.remove();
            }
        });
    }

    // Nettoyer les timers
    vi.clearAllTimers();
});

// Configuration spécifique pour jsdom
// Mock de fetch pour les tests
global.fetch = vi.fn();

// Mock des méthodes Canvas manquantes dans jsdom
if (typeof HTMLCanvasElement !== 'undefined') {
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
        clearRect: vi.fn(),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        closePath: vi.fn(),
        stroke: vi.fn(),
        arc: vi.fn(),
        fillRect: vi.fn(),
        strokeRect: vi.fn(),
        globalAlpha: 1,
        strokeStyle: '#000000',
        lineWidth: 1,
    });
}

// S'assurer que document existe dans jsdom
if (typeof document !== 'undefined') {
    // Mock des méthodes DOM manquantes
    Element.prototype.scrollIntoView = vi.fn();
    window.scrollTo = vi.fn();
}

// Mock de window si pas disponible
if (typeof window === 'undefined') {
    global.window = {
        innerWidth: 1920,
        innerHeight: 1080,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
    };
}

// <!-- END OF FILE: setup.js -->