// <!-- START OF FILE: fix-hexagon-color.js -->
// FILENAME: fix-hexagon-color.js
// Version: 1.0.0
// Date: 2025-01-31 23:00
// Author: Rolland MELET & Claude Code
// Description: Restaurer la couleur de remplissage des hexagones

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Lire le plugin actuel
let currentPlugin = fs.readFileSync(path.join(__dirname, '../dist/main.js'), 'utf8');

// Remplacer la création de l'hexagone pour utiliser un polygone fermé avec remplissage
currentPlugin = currentPlugin.replace(
    /\/\/ Créer l'hexagone avec des lignes séparées pour éviter la conversion en ellipse[\s\S]*?console\.log\('Hexagon created with ' \+ lines\.length \+ ' lines'\);/g,
    `// Créer l'hexagone comme polygone fermé avec remplissage
            const points = [];
            
            // Calculer les 7 points de l'hexagone (le dernier est identique au premier)
            for (let i = 0; i <= 6; i++) {
                const angle = (Math.PI / 3) * i - Math.PI / 2;
                const x = centerX + radius * Math.cos(angle);
                const y = centerY + radius * Math.sin(angle);
                points.push([x, y]);
            }
            
            // S'assurer que le polygone est bien fermé
            if (points[0][0] !== points[6][0] || points[0][1] !== points[6][1]) {
                points[6] = [...points[0]];
            }
            
            // Créer le polygone avec le style défini
            const hexagonId = ea.addLine(points);
            console.log('Hexagon polygon created with ID:', hexagonId);`
);

// Nettoyer le code redondant
currentPlugin = currentPlugin.replace(
    /if \(hexagonId\) \{[\s\S]*?console\.log\('Hexagon created with ID:', hexagonId\);\s*\}/g,
    ``
);

// Sauvegarder dans dist
const distPath = path.join(__dirname, '../dist/main.js');
fs.writeFileSync(distPath, currentPlugin);

// Copier vers le vault de test
const testVaultPath = '/Users/rollandmelet/Développement/Projets/ProcessMetaLanguage/VaultTestObsidian/PML-Beta-Test-v2/.obsidian/plugins/processmetalanguage/main.js';
fs.writeFileSync(testVaultPath, currentPlugin);

console.log('✅ Hexagon color fix applied!');
console.log('🔄 Please reload Obsidian (Cmd+R) to test.');
console.log('📝 Changes:');
console.log('   - Reverted to closed polygon for color fill');
console.log('   - Added 7th point to ensure proper closure');
console.log('   - Hexagons should now have blue fill color');