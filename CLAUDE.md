# CLAUDE.md - ProcessMetaLanguage

## 🎯 PROJECT OVERVIEW

ProcessMetaLanguage is a **graphical meta-language system** for designing industrial traceability processes in Obsidian Excalidraw. It transforms visual diagrams into comprehensive technical documentation ready for implementation in traceability systems.

**Core Concept**: Two-level State-Actions architecture where each OBJECT has STATES, and each STATE has one MAIN ACTION (required) and multiple SECONDARY ACTIONS (optional).

### Context Business Rolland MELET
- **Projet :** ProcessMetaLanguage - Système méta-langage graphique 
- **Objectif :** Transformation diagrammes visuels → Documentation technique
- **Contexte :** Innovation R&D pour 360SmartConnect (traçabilité industrielle)
- **Timeline :** Développement iteratif 4 semaines, livraison MVP

## 🎭 ORCHESTRATION PACT - WORKFLOW MAÎTRE

### 🎯 MISSION ORCHESTRATEUR CLAUDE CODE

En tant qu'orchestrateur ProcessMetaLanguage, je coordonne les **6 agents PACT spécialisés** selon un workflow structuré avec suivi de progression via les fichiers plan.md et tasks.md.

**WORKFLOW OBLIGATOIRE** :
1. **Lecture plan.md** → Comprendre les étapes détaillées à suivre
2. **Consultation tasks.md** → Identifier les tâches précises à effectuer
3. **Délégation aux agents** → Assigner les bonnes tâches aux bons agents
4. **Suivi progression** → Cocher les tâches accomplies dans tasks.md
5. **Validation qualité** → Vérifier que chaque phase respecte les standards

### 📋 GESTION DU PLAN MAÎTRE

**FICHIER OBLIGATOIRE** : `./00 - PRD&Plan/plan.md`

Le plan détaillé contient :
- **Phases de développement** avec chronologie précise
- **Dépendances** entre modules et composants
- **Livrables attendus** pour chaque étape
- **Critères de validation** avant passage phase suivante
- **Ressources nécessaires** (agents, outils MCP, documentation)

**ACTIONS ORCHESTRATEUR** :
- ✅ Lire plan.md **AVANT** toute action
- ✅ Identifier la phase actuelle dans le plan
- ✅ Vérifier les prérequis avant délégation
- ✅ Adapter la stratégie selon les contraintes identifiées

### 📝 GESTION DES TÂCHES DÉTAILLÉES

**FICHIER OBLIGATOIRE** : `./00 - PRD&Plan/tasks.md`

Format standardisé des tâches :```markdown
## Phase: [Nom Phase]
### Agent: [Agent Responsable]
- [ ] **TÂCHE-001** : Description précise de la tâche
  - Delivrable : Fichier ou résultat attendu
  - Critères : Critères de validation
  - MCP Tools : Outils MCP à utiliser
  - Durée estimée : Temps prévu
- [x] **TÂCHE-002** : Tâche déjà accomplie (cochée)
- [ ] **TÂCHE-003** : Tâche en attente
```

**ACTIONS ORCHESTRATEUR** :
- ✅ **Lecture tasks.md** → Comprendre le détail des tâches
- ✅ **Identification tâche suivante** → Prioriser selon plan.md  
- ✅ **Délégation agent spécialisé** → Assigner la tâche appropriée
- ✅ **Cochage progression** → Marquer [x] les tâches accomplies
- ✅ **Validation livrables** → Vérifier conformité avant passage suivant

### 🔄 UTILISATION DES OUTILS MCP ROLLAND MELET

**TASK-MASTER MCP** : Décomposition précise des tâches
```bash
# Utilisation task-master pour décomposer une fonctionnalité
task-master "Décomposer 'création composant graphique standardisé' en sous-tâches précises avec critères validation"
```

**REF-TOOLS MCP** : Recherche d'exemples techniques  
```bash
# Recherche exemples implementation patterns
ref-tools "Excalidraw plugin development component creation patterns"
ref-tools "JavaScript canvas manipulation best practices"
```

**FILESYSTEM MCP** : Gestion fichiers projet
```bash
# Lecture plan et tasks
filesystem read "./00 - PRD&Plan/plan.md"
filesystem read "./00 - PRD&Plan/tasks.md"
```

**MEMORY-BANK MCP** : Persistance contexte projet
```bash
# Sauvegarde progression session
memory-bank save "ProcessMetaLanguage-Progress-[date]"
```

### 🎯 PROTOCOL DE DÉLÉGATION AUX AGENTS

**AVANT DÉLÉGATION** :
1. ✅ **Lire plan.md** → Comprendre le contexte de la tâche
2. ✅ **Consulter tasks.md** → Identifier la tâche précise à assigner
3. ✅ **Vérifier prérequis** → S'assurer que les dépendances sont satisfaites
4. ✅ **Préparer contexte** → Fournir toute la documentation nécessaire

**DÉLÉGATION TYPE** :
```bash
/agent:architect "
CONTEXTE : [Résumé du plan.md pertinent]
TÂCHE : [Tâche précise du tasks.md]  
LIVRABLES : [Fichiers attendus]
CRITÈRES : [Critères de validation]
DÉPENDANCES : [Fichiers/modules requis]
OUTILS MCP : [Outils spécifiques à utiliser]
"
```

**APRÈS DÉLÉGATION** :
1. ✅ **Valider livrables** → Vérifier conformité aux critères
2. ✅ **Cocher tasks.md** → Marquer la tâche comme accomplie
3. ✅ **Mettre à jour plan.md** → Noter les ajustements si nécessaire
4. ✅ **Identifier tâche suivante** → Continuer selon la séquence

### 🔍 AGENT ARCHITECT - MISSIONS SPÉCIFIQUES ROLLAND MELET

**L'agent architect a 4 missions critiques** :

**1. CHOIX STACK TECHNIQUE**
- Analyse des contraintes ProcessMetaLanguage (Obsidian + Excalidraw)
- Évaluation compatibilité avec outils MCP existants
- Validation avec architecture État-Actions deux niveaux
- Documentation justifiée des choix technologiques

**2. PLAN DÉTAILLÉ → ./00 - PRD&Plan/plan.md**
- Séquencement des phases de développement
- Identification des dépendances critiques
- Estimation des durées et ressources nécessaires  
- Définition des jalons et critères de validation

**3. DÉCOMPOSITION TÂCHES → ./00 - PRD&Plan/tasks.md**
- **Utilisation OBLIGATOIRE task-master MCP** pour décomposition précise
- Création tâches atomiques avec critères mesurables
- Attribution agents appropriés pour chaque tâche
- Estimation temps et complexité par tâche

**4. RECHERCHE EXEMPLES CODE → ref-tools MCP**
- **Utilisation OBLIGATOIRE ref-tools MCP** pour patterns techniques
- Recherche best practices Excalidraw plugin development
- Documentation exemples pertinents pour les agents coders
- Validation faisabilité technique des approches

### 📊 SUIVI DE PROGRESSION OBLIGATOIRE

**INDICATEURS DE PROGRESSION** :
```markdown
## Progression ProcessMetaLanguage
- **Phase actuelle** : [Nom de la phase en cours]
- **Tâches accomplies** : [X]/[Total] 
- **Agent actif** : [Agent responsable tâche actuelle]
- **Prochaine étape** : [Prochaine tâche dans tasks.md]
- **Blocages identifiés** : [Problèmes à résoudre]
```

**ACTIONS RÉGULIÈRES** :
- ✅ **Mise à jour quotidienne** des fichiers plan.md et tasks.md
- ✅ **Validation livrables** avant passage étape suivante
- ✅ **Synchronisation Memory-Bank** pour persistance contexte
- ✅ **Communication progrès** à Rolland MELET avec step-by-step

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
```STATE** → Avatar State avec données
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
/qcheckf → Focus fonctions modifiées (après agent work)
/qcheckt → Validation stratégie tests
```

### Git & Workflow
```bash
/qgit → Commit automatisé Conventional Commits
/qux → Scénarios test UX (interface Obsidian)
```

### Agents PACT (ORCHESTRÉS via plan.md + tasks.md)
```bash
/agent:preparer → Research + requirements analysis
/agent:architect → System design + planning + task decomposition + code examples
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

### Project Planning (NOUVEAUX FICHIERS OBLIGATOIRES)
```
00 - PRD&Plan/
├── plan.md            # Plan détaillé phases et jalons
├── tasks.md           # Décomposition tâches précises avec cochage
├── architecture.md    # Décisions architecturales de l'agent architect
└── progress.md        # Suivi progression temps réel
```

## 🎯 WORKFLOW ORCHESTRÉ RECOMMANDÉ

### Démarrage Nouveau Development Cycle
```bash
# 1. PRÉPARATION
filesystem read "./00 - PRD&Plan/plan.md"      # Lire plan maître
filesystem read "./00 - PRD&Plan/tasks.md"     # Identifier tâche suivante

# 2. RECHERCHE (si nécessaire)
/agent:preparer "CONTEXTE: [phase] RECHERCHE: [sujet] UTILISER: brave-search + ref-tools"

# 3. ARCHITECTURE 
/agent:architect "MISSIONS: stack + plan.md + tasks.md + exemples UTILISER: task-master + ref-tools"

# 4. DÉVELOPPEMENT
/agent:frontend "CONTEXTE: [arch] TÂCHE: [tasks.md] UTILISER: filesystem + github"
/qcheckf                                        # Validation code

# 5. TESTS
/agent:test "TESTS: [type requis] UTILISER: filesystem + github"
/qcheckt                                        # Validation tests

# 6. FINALISATION
filesystem edit "./00 - PRD&Plan/tasks.md"     # Cocher tâche accomplie [x]
/qgit "feat([scope]): [description]"           # Commit standardisé
```

### Validation Avant Livraison
```bash
/qcheck     # Révision complète
/qcheckt    # Validation tests
/qux        # Scénarios UX Obsidian
/agent:test "VALIDATION FINALE" # Tests complets
```

## 🔄 CYCLE D'AMÉLIORATION CONTINUE

### Feedback Loop Intégré
1. **Développement** (agent spécialisé + outils MCP)
2. **Validation** (raccourcis qcheck/qcheckf/qcheckt)  
3. **Tests utilisateur** (qux + agent:test)
4. **Ajustements** (mise à jour plan.md + tasks.md)
5. **Commit** (qgit + github MCP)

### Métriques de Suivi
- **Tâches accomplies** : Ratio [x]/[ ] dans tasks.md
- **Qualité code** : Résultats qcheck + qcheckf
- **Couverture tests** : Rapports agent:test + qcheckt
- **Performance** : Temps exécution vs objectifs plan.md