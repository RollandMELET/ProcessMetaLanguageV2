// <!-- START OF FILE: fix-hexagon-shape.js -->
// FILENAME: fix-hexagon-shape.js
// Version: 1.0.0
// Date: 2025-01-31 22:10
// Author: Rolland MELET & Claude Code
// Description: Correction de la forme hexagonale pour tous les objets

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Lire le plugin actuel
const currentPlugin = fs.readFileSync(path.join(__dirname, '../dist/main.js'), 'utf8');

// Forcer l'utilisation de addLine pour créer l'hexagone
const fixedPlugin = currentPlugin.replace(
    /\/\/ Créer l'hexagone[\s\S]*?hexagonId = ea\.addLine\(points\);\s*\}/g,
    `// Créer l'hexagone
            // Toujours utiliser addLine pour un hexagone parfait
            console.log('Creating hexagon with addLine');
            const points = [];
            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI / 3) * i - Math.PI / 2;
                const x = centerX + radius * Math.cos(angle);
                const y = centerY + radius * Math.sin(angle);
                points.push([x, y]);
            }
            points.push(points[0]); // Fermer l'hexagone
            const hexagonId = ea.addLine(points);`
);

// Sauvegarder dans dist
const distPath = path.join(__dirname, '../dist/main.js');
fs.writeFileSync(distPath, fixedPlugin);

// Copier vers le vault de test
const testVaultPath = '/Users/rollandmelet/Développement/Projets/ProcessMetaLanguage/VaultTestObsidian/PML-Beta-Test-v2/.obsidian/plugins/processmetalanguage/main.js';
fs.writeFileSync(testVaultPath, fixedPlugin);

console.log('✅ Hexagon shape fix applied!');
console.log('🔄 Please reload Obsidian (Cmd+R) to test.');
console.log('📝 Changes:');
console.log('   - Force using addLine method for consistent hexagon shape');
console.log('   - All objects should now have proper hexagon shape');