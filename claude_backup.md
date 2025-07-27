# BACKUP CLAUDE.MD - ProcessMetaLanguage
# Date: 2025-07-27
# Backup avant enrichissement orchestration PACT

# CLAUDE.md - ProcessMetaLanguage

## 🎯 PROJECT OVERVIEW

ProcessMetaLanguage is a **graphical meta-language system** for designing industrial traceability processes in Obsidian Excalidraw. It transforms visual diagrams into comprehensive technical documentation ready for implementation in traceability systems.

**Core Concept**: Two-level State-Actions architecture where each OBJECT has STATES, and each STATE has one MAIN ACTION (required) and multiple SECONDARY ACTIONS (optional).

### Context Business Rolland MELET
- **Projet :** ProcessMetaLanguage - Système méta-langage graphique 
- **Objectif :** Transformation diagrammes visuels → Documentation technique
- **Contexte :** Innovation R&D pour 360SmartConnect (traçabilité industrielle)
- **Timeline :** Développement iteratif 4 semaines, livraison MVP

## 🏗️ KEY ARCHITECTURE

### Component Hierarchy
```
OBJECT (Hexagon - Traced Avatar)
├── STATE (Flag/Banner)
│   ├── 🔵 MAIN_ACTION (REQUIRED)
│   │   ├── Data exposition
│   │   └── Navigation to available actions
│   ├── 🟡 SECONDARY_ACTION_1 (OPTIONAL)
│   │   ├── Data capture + Internal workflow
│   │   └── Transition to TARGET_STATE_1
│   └── 🟡 SECONDARY_ACTION_N (OPTIONAL)
└── OBJECT_DATA (Metadata + History)
```

### Standardized Graphic Components
- **OBJECT**: Hexagon (120x80px) - Traced entity (Avatar)
- **STATE**: Flag/Banner (80x40px) - Current object condition
- **ACTION**: Rounded rectangle (140x60px) - User/system interaction

## 🛠️ TECHNOLOGY STACK

### Core Platform
- **Platform**: Obsidian + Excalidraw plugin + Templater plugin
- **Scripting**: JavaScript (ExcalidrawAutomate API, Obsidian API)
- **Standards**: GS1 EPCIS 2.0 (41 business steps + 25 dispositions)
- **Output**: Markdown with YAML frontmatter
- **Configuration**: YAML with schema validation

### Prerequisites
- Obsidian (1.4.16+)
- Excalidraw plugin (2.0.0+) with ExcalidrawAutomate enabled
- Templater plugin (2.0.0+)
- Node.js (for development and testing)

## 🎯 STANDARDS DÉVELOPPEMENT ROLLAND MELET

### Format Fichiers OBLIGATOIRE
```javascript
// <!-- START OF FILE: FileName.js -->
// FILENAME: FileName.js
// Version: 1.0.0
// Date: YYYY-MM-DD HH:MM
// Author: Rolland MELET & Claude Code
// Description: Description des changements
```

### Documentation OBLIGATOIRE
- **JSDoc COMPLET** sur TOUTES les fonctions
- **Tag @sideEffect** si effets externes (Obsidian API, fichiers)
- **Exemples réalistes** avec vraies valeurs (pas "foo/bar")
- **Zero exception** : Aucune fonction non documentée

### Exemple Standard Code ProcessMetaLanguage
```javascript
/**
 * Crée un objet graphique standardisé dans Excalidraw
 * @param {string} objectName - Nom de l'objet tracé (ex: "Lot-Matière-001")
 * @param {string} objectType - Type d'objet (raw-material, product, etc.)
 * @param {Object} position - Position {x, y} dans le canvas
 * @returns {string} ID unique de l'objet créé
 * @sideEffect Modifie le canvas Excalidraw actif, sauvegarde automatique
 * @example
 * // Création objet matière première en réception
 * const objId = createObject("Lot-Acier-A001", "raw-material", {x: 100, y: 200});
 * // Returns: "obj_raw_material_1234567890"
 */
function createObject(objectName, objectType, position) {
    // Implementation...
}
```

## 🔧 DÉVELOPPEMENT COMMANDS

### Setup et Configuration
```bash
# Configuration projet
cp config/project-config.example.yaml config/project-config.yaml

# Vérification plugins Obsidian
# Dans console Obsidian (Ctrl+Shift+I):
console.log(typeof ExcalidrawAutomate !== 'undefined' ? 'OK' : 'MISSING');
```

### Tests et Validation
```bash
# Tests acceptation utilisateur
npm run test:user-acceptance

# Tests spécifiques fonctionnalités
npm run test:component-creation
npm run test:template-system
npm run test:synchronization

# Tests automatisés
npm run test:unit
npm run test:integration
npm run test:epcis-compliance

# Standards code
npm run lint
npm run test
```

## 🎭 AGENTS PACT INTÉGRÉS

Ce projet utilise les agents PACT spécialisés pour optimiser le développement :

### Phase Préparation
```bash
/agent:preparer → Analyse requirements et recherche EPCIS 2.0
```

### Phase Architecture  
```bash
/agent:architect → Design système components graphiques ↔ documentation
```

### Phase Code
```bash
/agent:backend → APIs synchronisation + validation EPCIS
/agent:frontend → Interface Obsidian + composants graphiques
/agent:database → Structures métadonnées + historique
```

### Phase Tests
```bash
/agent:test → Tests unitaires + intégration + acceptation utilisateur
```

## 📁 CORE DEVELOPMENT MODULES

### `/src/core/`
- **component-factory.js**: Creates standardized graphical components
- **template-manager.js**: Manages template library (EPCIS 2.0 + custom)
- **synchronizer.js**: Syncs graphical elements ↔ markdown documentation
- **validator.js**: Validates EPCIS 2.0 compliance

### `/src/templates/`
- **epcis-templates.js**: 41 business steps + 25 dispositions (GS1 CBV 2.0)
- **base-templates.js**: Foundation templates
- **custom-templates.js**: Project-specific templates

### `/src/exporters/`
- **workflow-generator.js**: Generates consolidated workflow documentation
- **api-mapper.js**: Maps to 360SmartConnect API endpoints
- **openapi-generator.js**: Generates OpenAPI 3.0 specifications

## 🚀 MÉTHODOLOGIE DÉVELOPPEMENT

### Rapid Feedback Loops (1-3 jours max par groupe)
1. **Development** → 2. **User Test** (15-30 min) → 3. **Feedback** → 4. **Adjustments** → 5. **TDD**

### 7 Groupes Développement Logiques
1. **Base Component Creation** (Semaine 1) + `/agent:architect` + `/agent:frontend`
2. **Base Templates & Customization** (Semaine 1-2) + `/agent:backend`
3. **States & Main Actions** (Semaine 2) + `/agent:frontend` + `/qcheckf`
4. **Secondary Actions & Transitions** (Semaine 2-3) + `/agent:backend` + `/qcheckt`
5. **Synchronization & Detection** (Semaine 3) + `/agent:backend` + `/qcheck`
6. **EPCIS 2.0 Templates** (Semaine 3-4) + `/agent:database` + `/qcheckt`
7. **Final Workflow Generation** (Semaine 4) + `/agent:test` + `/qux`

## 🔗 INTÉGRATION 360SMARTCONNECT

### Mapping Components
- **OBJECT** → Avatar 360SmartConnect
- **STATE** → Avatar State avec données
- **ACTION** → Points d'interaction Finger/API

### API Generation
- Génération automatique spécifications OpenAPI 3.0
- Mapping endpoints REST pour 360SmartConnect
- Formats de réponse standardisés

## 🧪 EPCIS 2.0 INTEGRATION

### Templates Disponibles
- **Business Steps**: receiving, shipping, packing, inspecting, storing, transforming, etc. (41 total)
- **Dispositions**: active, in_transit, destroyed, damaged, expired, etc. (25 total)

### Requirements Validation
- Tous templates conformes GS1 EPCIS 2.0 standard
- Intégration métadonnées CBV (Core Business Vocabulary) 2.0
- Conformité 100% pour templates standard

## 📊 QUALITY STANDARDS

### Code Standards
- **JavaScript ES6+** avec modules
- **Documentation JSDoc** obligatoire toutes fonctions  
- **Tests unitaires** pour chaque fonction
- **Validation ESLint** avant commits
- **Performance targets**: Création composant < 2s, Synchronisation < 5s (50 composants)

### Git Workflow
- **Messages Conventional Commits** obligatoires
- **Branches**: main → develop → feature/TICKET-description
- **Tests**: Couverture > 80% avant merge
- **Reviews**: Validation architecture + code + tests

## 🔧 RACCOURCIS CLAUDE CODE DISPONIBLES

### Qualité Code
```bash
/qcheck → Révision complète selon standards
/qcheckf → Focus fonctions modifi��es (après agent work)
/qcheckt → Validation stratégie tests
```

### Git & Workflow
```bash
/qgit → Commit automatisé Conventional Commits
/qux → Scénarios test UX (interface Obsidian)
```

### Agents PACT
```bash
/agent:preparer → Research + requirements analysis
/agent:architect → System design + component planning
/agent:backend → Server-side coding (APIs, sync)
/agent:frontend → Client-side coding (Obsidian interface)
/agent:database → Data structures + metadata
/agent:test → Testing strategy + implementation
```

## 🚨 TROUBLESHOOTING

### Common Issues
```javascript
// Check ExcalidrawAutomate availability
if (typeof ExcalidrawAutomate === 'undefined') {
  console.error('Excalidraw plugin missing or misconfigured');
}

// Enable detailed logging
ProcessMetaLanguage.setLogLevel('debug');

// System diagnostics
ProcessMetaLanguage.diagnostics();
```

### Required Element Tags
All graphical elements must have proper tags for synchronization:
- `#process-object`
- `#process-state`  
- `#process-action`

## 📁 FILE STRUCTURE CONVENTIONS

### Template Organization
```
templates/
├── object-templates/    # Object type templates
├── state-templates/     # State templates
└── action-templates/    # Action templates (EPCIS 2.0 aligned)
```

### Documentation Output
```
docs/generated/
├── objects/            # Individual object specifications
├── workflows/          # Process workflow documentation
└── api-specs/          # OpenAPI specifications
```

## 🎯 WORKFLOW RECOMMANDÉ

### Démarrage Nouveau Feature
```bash
/agent:preparer "Feature: [description]"  # Research + requirements
/agent:architect "Design: [feature]"      # Architecture
/agent:frontend "UI: [feature]"           # Interface Obsidian
/qcheckf                                  # Validation code
/qgit "feat([scope]): [description]"     # Commit standardisé
```

### Validation Avant Livraison
```bash
/qcheck     # Révision complète
/qcheckt    # Validation tests
/qux        # Scénarios UX Obsidian
/agent:test # Tests finaux
```