# ProcessMetaLanguage - Interface Principale

**Version**: 1.0.0  
**Date**: 2025-07-31  
**Tâche**: TASK-F007 - Créer interface principale ProcessMetaLanguage  
**Phase**: Phase 6 - Interface Utilisateur et Ergonomie  

## Vue d'Ensemble

L'interface principale ProcessMetaLanguage (`main-interface.js`) est le point d'entrée unique pour toutes les fonctionnalités du système. Elle orchestre tous les modules existants dans une interface utilisateur intuitive et cohérente, spécialement conçue pour l'environnement Obsidian + Excalidraw.

## Fonctionnalités Principales

### 🏠 Navigation Intuitive
- **Tableau de Bord**: Vue d'ensemble projet et métriques temps réel
- **Création**: Outils de création composants avec propriétés
- **Templates**: Sélection et personnalisation templates EPCIS 2.0
- **Export**: Génération documentation et spécifications API
- **Validation**: Contrôle qualité et conformité processus

### ⚡ Actions Rapides
- Création composants 1-clic (Objet, État, Action)
- Accès direct aux templates EPCIS
- Export rapide workflow complet
- Validation architecture État-Actions

### 📊 Métriques Temps Réel
- Compteurs composants créés
- Templates utilisés
- Temps de session
- Performance canvas

### 🎨 Interface Responsive
- Layout adaptatif desktop/mobile
- Sidebar configurable (gauche/droite)
- Thème auto/light/dark
- Navigation clavier optimisée

## Architecture Technique

### Structure des Classes

```javascript
ProcessMetaLanguageInterface
├── Configuration et État
├── Initialisation Modules
├── Création DOM et Styles
├── Event Handling
├── Navigation entre Vues
├── Gestion Actions Utilisateur
└── Métriques et Performance
```

### Modules Intégrés

| Module | Fichier | Fonctionnalité |
|--------|---------|----------------|
| Palette Composants | `components-palette.js` | Création rapide composants |
| Sélecteur Templates | `template-selector.js` | Templates EPCIS 2.0 |
| Panneau Personnalisation | `customization-panel.js` | Propriétés composants |
| Compilateur Workflow | `../export/workflow-compiler.js` | Documentation finale |
| Générateur Matrices | `../export/matrix-generator.js` | Visualisations analytics |
| Générateur OpenAPI | `../export/openapi-generator.js` | Spécifications API |
| Mapper 360SmartConnect | `../export/360sc-mapper.js` | Intégration système |

### Configuration par Défaut

```javascript
{
    theme: 'auto',              // auto, light, dark
    autoSave: true,             // Sauvegarde automatique
    layout: {
        sidebar: 'right',       // left, right
        toolbar: 'top',         // top, bottom
        width: 350,             // Largeur sidebar (px)
        height: '100vh'         // Hauteur interface
    }
}
```

## Utilisation

### Intégration Obsidian Plugin

```javascript
import { ProcessMetaLanguageInterface } from './main-interface.js';

// Dans votre plugin Obsidian
const pmlInterface = new ProcessMetaLanguageInterface(
    this.app,                   // Instance Obsidian App
    ExcalidrawAutomate,         // API ExcalidrawAutomate
    {
        theme: 'auto',
        autoSave: true,
        layout: { sidebar: 'right', width: 350 }
    }
);

// Initialiser et afficher
await pmlInterface.initialize();
pmlInterface.show();
```

### Utilisation Standalone (Demo)

```javascript
// Configuration environnement minimal
window.mockObsidianApp = { /* API Obsidian simulée */ };
window.ExcalidrawAutomate = { /* API ExcalidrawAutomate simulée */ };

// Créer et initialiser interface
const pmlInterface = new ProcessMetaLanguageInterface(
    window.mockObsidianApp,
    window.ExcalidrawAutomate
);

await pmlInterface.initialize();
pmlInterface.show();
```

## API Principale

### Méthodes Publiques

#### `constructor(app, excalidrawAPI, options)`
Crée une instance de l'interface principale.

**Paramètres:**
- `app` (Object): Instance Obsidian App
- `excalidrawAPI` (Object): API ExcalidrawAutomate
- `options` (Object): Configuration interface

#### `async initialize()`
Initialise tous les modules et crée la structure DOM.

**Effets de bord:**
- Charge et initialise tous les modules
- Crée structure DOM complète
- Attache event listeners
- Applique thème et configuration

#### `show()` / `hide()`
Affiche/masque l'interface dans le DOM.

#### `switchView(viewName)`
Change la vue active.

**Paramètres:**
- `viewName` (string): 'dashboard', 'creation', 'templates', 'export', 'validation'

#### `handleAction(action)` / `handleExport(exportType)`
Gère les actions utilisateur et exports.

#### `updateMetrics()`
Met à jour les métriques affichées en temps réel.

#### `destroy()`
Nettoie et détruit l'interface.

### Events et Callbacks

```javascript
// Callbacks modules intégrés
onComponentCreated(type, id)     // Création composant
onTemplatesSelected(templates)   // Sélection templates
onCustomizationUpdate(changes)   // Personnalisation
```

## Vues Interface

### 1. Dashboard (Tableau de Bord)
- **Objectif**: Vue d'ensemble projet et accès rapide
- **Contenu**: Infos projet, statistiques, actions rapides, performance
- **Navigation**: Point d'entrée principal

### 2. Creation (Création)
- **Objectif**: Création et modification composants
- **Contenu**: Outils création, propriétés, validation temps réel
- **Intégration**: Palette composants + panneau propriétés

### 3. Templates (Templates EPCIS)
- **Objectif**: Sélection et personnalisation templates
- **Contenu**: 41 business steps + 25 dispositions + filtres + preview
- **Standard**: Conformité GS1 EPCIS 2.0

### 4. Export (Export et Documentation)
- **Objectif**: Génération documentation et spécifications
- **Contenu**: 4 modules export + historique + options
- **Formats**: Markdown, JSON, YAML, HTML, OpenAPI 3.0

### 5. Validation (Validation et Qualité)
- **Objectif**: Contrôle conformité et qualité
- **Contenu**: Architecture, EPCIS 2.0, performance, outils validation
- **Métriques**: Scores qualité + recommandations

## Styles et Thèmes

### Variables CSS Obsidian
L'interface utilise les variables CSS natives d'Obsidian pour une intégration parfaite:

```css
--background-primary
--background-secondary
--background-modifier-hover
--text-normal
--text-muted
--text-accent
--interactive-accent
--font-interface
```

### Responsive Design
- **Desktop**: Layout sidebar + contenu principal
- **Tablet**: Sidebar réduite, navigation optimisée
- **Mobile**: Sidebar overlay, interface tactile

### Thèmes Supportés
- **Auto**: Suit le thème Obsidian
- **Light**: Thème clair optimisé
- **Dark**: Thème sombre avec contrastes adaptés

## Testing et Démonstration

### Fichier de Test
`test-main-interface.html` - Page de démonstration complète avec:
- Environnement Obsidian simulé
- API ExcalidrawAutomate mockée
- Navigation automatique (démo)
- Raccourcis clavier
- Toggle thème en temps réel

### Raccourcis Demo
- `Ctrl/Cmd + T`: Toggle thème
- `Ctrl/Cmd + N`: Navigation automatique
- `Ctrl/Cmd + O/S/A`: Simuler création composants
- `Ctrl/Cmd + I`: Debug info console

### Ouverture Demo
```bash
# Servir fichiers localement (requis pour modules ES6)
python3 -m http.server 8000
# Ouvrir http://localhost:8000/ui/test-main-interface.html
```

## Performance et Optimisations

### Métriques Cibles
- **Initialisation**: < 2s (chargement tous modules)
- **Navigation vues**: < 200ms
- **Mise à jour métriques**: < 50ms
- **Export génération**: < 30s

### Optimisations Implémentées
- **Lazy loading**: Contenu vues chargé à la demande
- **Event delegation**: Event listeners optimisés
- **Cache intelligent**: Modules et données mises en cache
- **DOM virtuel**: Mise à jour incrémentale interface

## Intégration Plugin Obsidian

Le fichier `pml-plugin-integration.js` fournit:

### Commands Palette
- `Toggle ProcessMetaLanguage Interface` (Ctrl+Shift+P)
- `New ProcessMetaLanguage Project`
- `Create Process Object/State/Action` (Ctrl+Shift+O/S/A)
- `Export Process Workflow`
- `Validate Process Architecture`

### Ribbon Button
Accès 1-clic à l'interface depuis la barre d'outils Obsidian.

### Status Bar
Indicateur état interface (Active/Inactive) avec toggle clic.

### Settings Tab
Configuration complète depuis les paramètres Obsidian.

### Auto-Detection
Ouverture automatique interface lors d'ouverture fichiers `.excalidraw`.

## Dépendances

### Modules ProcessMetaLanguage
- `components/object-creator.js`
- `components/state-creator.js`
- `components/action-creator.js`
- `ui/components-palette.js`
- `ui/template-selector.js`
- `ui/customization-panel.js`
- `export/workflow-compiler.js`
- `export/matrix-generator.js`
- `export/openapi-generator.js`
- `export/360sc-mapper.js`

### APIs Externes
- **Obsidian API**: App, Plugin, TFile, Modal, Setting
- **ExcalidrawAutomate**: Création et manipulation éléments canvas

### Standards
- **EPCIS 2.0**: Business steps et dispositions GS1
- **OpenAPI 3.0**: Spécifications API REST
- **ES6 Modules**: Import/export natifs JavaScript

## Maintenance et Évolution

### Points d'Extension
1. **Nouvelles vues**: Ajouter dans `switchView()` et créer HTML
2. **Nouveaux modules**: Intégrer dans `initializeModules()`
3. **Actions personnalisées**: Étendre `handleAction()`
4. **Thèmes additionnels**: Ajouter variables CSS

### Debugging
```javascript
// Accès debug console navigateur
window.pmlInterface.metrics        // Métriques actuelles
window.pmlInterface.modules        // Modules chargés
window.pmlInterface.currentView    // Vue active
window.pmlInterface.config         // Configuration
```

### Logs Structurés
Tous les événements importants sont loggés avec préfixes:
- `🚀` Initialisation
- `📄` Navigation vues
- `🎯` Actions utilisateur
- `📤` Exports
- `✅` Succès opérations
- `❌` Erreurs

## Conclusion

L'interface principale ProcessMetaLanguage TASK-F007 fournit une expérience utilisateur complète et intuitive pour la création de processus industriels avec l'architecture État-Actions deux niveaux. Elle intègre parfaitement tous les modules existants dans une interface cohérente, responsive et performante, spécialement optimisée pour l'écosystème Obsidian + Excalidraw.

---

*Documentation Interface Principale ProcessMetaLanguage*  
*TASK-F007 Phase 6 - Créée le 2025-07-31*