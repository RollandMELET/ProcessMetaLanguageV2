// <!-- START OF FILE: fix-hexagon-shape-final.js -->
// FILENAME: fix-hexagon-shape-final.js
// Version: 1.0.0
// Date: 2025-01-31 22:55
// Author: Rolland MELET & Claude Code
// Description: Correction finale de la forme hexagonale

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Lire le plugin actuel
let currentPlugin = fs.readFileSync(path.join(__dirname, '../dist/main.js'), 'utf8');

// Remplacer la création de l'hexagone avec une version plus robuste
currentPlugin = currentPlugin.replace(
    /\/\/ Créer l'hexagone \(toujours avec addLine\)[\s\S]*?const hexagonId = ea\.addLine\(points\);/g,
    `// Créer l'hexagone avec des lignes séparées pour éviter la conversion en ellipse
            const lines = [];
            const points = [];
            
            // Calculer les 6 points de l'hexagone
            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI / 3) * i - Math.PI / 2;
                const x = centerX + radius * Math.cos(angle);
                const y = centerY + radius * Math.sin(angle);
                points.push([x, y]);
            }
            
            // Créer 6 lignes séparées
            for (let i = 0; i < 6; i++) {
                const start = points[i];
                const end = points[(i + 1) % 6];
                const lineId = ea.addLine([start, end]);
                if (lineId) {
                    lines.push(lineId);
                    elementIds.push(lineId);
                }
            }
            
            const hexagonId = lines[0]; // Pour compatibilité
            console.log('Hexagon created with ' + lines.length + ' lines');`
);

// Sauvegarder dans dist
const distPath = path.join(__dirname, '../dist/main.js');
fs.writeFileSync(distPath, currentPlugin);

// Copier vers le vault de test
const testVaultPath = '/Users/rollandmelet/Développement/Projets/ProcessMetaLanguage/VaultTestObsidian/PML-Beta-Test-v2/.obsidian/plugins/processmetalanguage/main.js';
fs.writeFileSync(testVaultPath, currentPlugin);

console.log('✅ Hexagon shape final fix applied!');
console.log('🔄 Please reload Obsidian (Cmd+R) to test.');
console.log('📝 Changes:');
console.log('   - Hexagon created with 6 separate lines');
console.log('   - Prevents automatic conversion to ellipse');
console.log('   - All lines are grouped together');