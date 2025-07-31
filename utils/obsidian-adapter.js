// <!-- START OF FILE: obsidian-adapter.js -->
// FILENAME: obsidian-adapter.js
// Version: 1.0.0
// Date: 2025-08-01 16:15
// Author: Rolland MELET & Claude Code
// Description: Adapter for Node.js modules to Obsidian API

/**
 * Obsidian Adapter
 * Provides compatibility layer between Node.js modules and Obsidian API
 * @module ObsidianAdapter
 */

// Mock fs module using Obsidian API
export const fs = {
    promises: {
        readFile: async (path, encoding = 'utf8') => {
            if (window.app && window.app.vault) {
                const file = window.app.vault.getAbstractFileByPath(path);
                if (file && file instanceof window.TFile) {
                    return await window.app.vault.read(file);
                }
                throw new Error(`File not found: ${path}`);
            }
            throw new Error('Obsidian app not available');
        },
        
        writeFile: async (path, content) => {
            if (window.app && window.app.vault) {
                const file = window.app.vault.getAbstractFileByPath(path);
                if (file && file instanceof window.TFile) {
                    await window.app.vault.modify(file, content);
                } else {
                    await window.app.vault.create(path, content);
                }
                return;
            }
            throw new Error('Obsidian app not available');
        },
        
        mkdir: async (path, options = {}) => {
            if (window.app && window.app.vault) {
                if (!window.app.vault.getAbstractFileByPath(path)) {
                    await window.app.vault.createFolder(path);
                }
                return;
            }
            throw new Error('Obsidian app not available');
        },
        
        readdir: async (path) => {
            if (window.app && window.app.vault) {
                const folder = window.app.vault.getAbstractFileByPath(path);
                if (folder && folder instanceof window.TFolder) {
                    return folder.children.map(child => child.name);
                }
                throw new Error(`Directory not found: ${path}`);
            }
            throw new Error('Obsidian app not available');
        },
        
        stat: async (path) => {
            if (window.app && window.app.vault) {
                const file = window.app.vault.getAbstractFileByPath(path);
                if (file) {
                    return {
                        isDirectory: () => file instanceof window.TFolder,
                        isFile: () => file instanceof window.TFile,
                        mtime: new Date(file.stat?.mtime || Date.now()),
                        size: file.stat?.size || 0
                    };
                }
                throw new Error(`Path not found: ${path}`);
            }
            throw new Error('Obsidian app not available');
        }
    },
    
    // Sync versions (not recommended but provided for compatibility)
    readFileSync: (path, encoding = 'utf8') => {
        console.warn('Sync file operations are not recommended in Obsidian');
        return '';
    },
    
    writeFileSync: (path, content) => {
        console.warn('Sync file operations are not recommended in Obsidian');
    }
};

// Mock path module
export const path = {
    join: (...parts) => {
        return parts.filter(p => p).join('/').replace(/\/+/g, '/');
    },
    
    dirname: (filepath) => {
        const parts = filepath.split('/');
        parts.pop();
        return parts.join('/');
    },
    
    basename: (filepath, ext) => {
        const parts = filepath.split('/');
        let base = parts[parts.length - 1];
        if (ext && base.endsWith(ext)) {
            base = base.slice(0, -ext.length);
        }
        return base;
    },
    
    extname: (filepath) => {
        const lastDot = filepath.lastIndexOf('.');
        return lastDot > 0 ? filepath.slice(lastDot) : '';
    },
    
    resolve: (...parts) => {
        return parts.filter(p => p).join('/').replace(/\/+/g, '/');
    },
    
    relative: (from, to) => {
        // Simple implementation
        if (to.startsWith(from)) {
            return to.slice(from.length + 1);
        }
        return to;
    },
    
    parse: (filepath) => {
        const dir = path.dirname(filepath);
        const base = path.basename(filepath);
        const ext = path.extname(filepath);
        const name = ext ? base.slice(0, -ext.length) : base;
        
        return { dir, base, ext, name, root: '' };
    }
};

// Mock crypto module
export const crypto = {
    randomUUID: () => {
        // Simple UUID v4 implementation
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    },
    
    createHash: (algorithm) => {
        return {
            update: () => {},
            digest: () => 'mock-hash-' + Date.now()
        };
    }
};

// Mock events module
export class EventEmitter {
    constructor() {
        this.events = {};
    }
    
    on(event, listener) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(listener);
        return this;
    }
    
    emit(event, ...args) {
        if (this.events[event]) {
            this.events[event].forEach(listener => listener(...args));
        }
        return this;
    }
    
    off(event, listener) {
        if (this.events[event]) {
            this.events[event] = this.events[event].filter(l => l !== listener);
        }
        return this;
    }
    
    once(event, listener) {
        const onceWrapper = (...args) => {
            listener(...args);
            this.off(event, onceWrapper);
        };
        this.on(event, onceWrapper);
        return this;
    }
}

// Mock performance module
export const performance = window.performance || {
    now: () => Date.now()
};

// Helper to check if running in Obsidian
export function isObsidian() {
    return typeof window !== 'undefined' && 
           window.app && 
           window.app.vault;
}

// Get Obsidian app instance
export function getApp() {
    if (isObsidian()) {
        return window.app;
    }
    throw new Error('Not running in Obsidian environment');
}

// Get vault instance
export function getVault() {
    const app = getApp();
    return app.vault;
}

// Get ExcalidrawAutomate API
export function getExcalidrawAPI() {
    if (window.ExcalidrawAutomate) {
        return window.ExcalidrawAutomate;
    }
    throw new Error('ExcalidrawAutomate not available. Make sure Excalidraw plugin is installed and a drawing is open.');
}

// <!-- END OF FILE: obsidian-adapter.js -->