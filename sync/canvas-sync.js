// <!-- START OF FILE: canvas-sync.js -->
// FILENAME: canvas-sync.js
// Version: 1.0.0
// Date: 2025-08-01 15:30
// Author: Rolland MELET & Claude Code
// Description: Canvas synchronization module wrapper

/**
 * Canvas synchronization module
 * Wraps bidirectional sync functionality
 * @module CanvasSync
 */

import { BidirectionalSync } from './bidirectional-sync.js';
import { CanvasReader } from './canvas-reader.js';
import { CanvasUpdater } from './canvas-updater.js';

export class CanvasSync {
    constructor(app, settings = {}) {
        this.app = app;
        this.settings = settings;
        this.bidirectionalSync = new BidirectionalSync(app, settings);
        this.canvasReader = new CanvasReader();
        this.canvasUpdater = new CanvasUpdater();
    }
    
    /**
     * Initialize synchronization
     * @sideEffect Sets up event listeners
     */
    async initialize() {
        await this.bidirectionalSync.initialize();
    }
    
    /**
     * Start synchronization
     * @sideEffect Begins monitoring canvas changes
     */
    async startSync() {
        return this.bidirectionalSync.startSync();
    }
    
    /**
     * Stop synchronization
     * @sideEffect Removes event listeners
     */
    async stopSync() {
        return this.bidirectionalSync.stopSync();
    }
    
    /**
     * Force sync now
     * @sideEffect Triggers immediate synchronization
     */
    async syncNow() {
        return this.bidirectionalSync.syncNow();
    }
}

// <!-- END OF FILE: canvas-sync.js -->