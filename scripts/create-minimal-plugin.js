// <!-- START OF FILE: create-minimal-plugin.js -->
// FILENAME: create-minimal-plugin.js
// Version: 1.0.0
// Date: 2025-08-01 17:50
// Author: Rolland MELET & Claude Code
// Description: Crée un plugin minimal pour tester le chargement dans Obsidian

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const minimalPlugin = `
var obsidian = require('obsidian');

class ProcessMetaLanguagePlugin extends obsidian.Plugin {
    async onload() {
        console.log('ProcessMetaLanguage: Plugin loading...');
        
        // Commande de test simple
        this.addCommand({
            id: 'pml-test',
            name: 'Test ProcessMetaLanguage',
            callback: () => {
                new obsidian.Notice('ProcessMetaLanguage is working!');
            }
        });
        
        // Vérifier si ExcalidrawAutomate existe
        this.registerInterval(
            window.setInterval(() => {
                if (typeof ExcalidrawAutomate !== 'undefined' && !this.excalidrawReady) {
                    this.excalidrawReady = true;
                    console.log('ProcessMetaLanguage: ExcalidrawAutomate detected!');
                    this.initializeFullPlugin();
                }
            }, 1000)
        );
        
        console.log('ProcessMetaLanguage: Plugin loaded (minimal mode)');
    }
    
    async initializeFullPlugin() {
        // Ajouter la commande principale
        this.addCommand({
            id: 'pml-toggle-interface',
            name: 'Toggle Interface',
            callback: () => {
                new obsidian.Notice('ProcessMetaLanguage Interface (coming soon)');
            }
        });
        
        console.log('ProcessMetaLanguage: Full plugin initialized');
    }
    
    onunload() {
        console.log('ProcessMetaLanguage: Plugin unloaded');
    }
}

module.exports = ProcessMetaLanguagePlugin;
`;

// Sauvegarder dans dist
const distPath = path.join(__dirname, '../dist/main.js');
fs.writeFileSync(distPath, minimalPlugin);

// Copier vers le vault de test
const testVaultPath = '/Users/rollandmelet/Développement/Projets/ProcessMetaLanguage/VaultTestObsidian/PML-Beta-Test-v2/.obsidian/plugins/processmetalanguage/main.js';
fs.writeFileSync(testVaultPath, minimalPlugin);

console.log('✅ Minimal plugin created and copied to test vault!');
console.log('🔄 Please restart Obsidian and try enabling the plugin again.');