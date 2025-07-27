# Architecture ProcessMetaLanguage - Synthèse Complète

**Version:** 1.0.0  
**Date:** 2025-07-27 17:00  
**Auteur:** Rolland MELET & Claude Code  
**Document:** Synthèse architecture et décisions techniques ProcessMetaLanguage

---

## VUE D'ENSEMBLE ARCHITECTURE

Le ProcessMetaLanguage est un système de métalangage graphique pour Obsidian Excalidraw qui transforme des diagrammes visuels de processus de traçabilité en documentation technique structurée. L'architecture repose sur un modèle État-Actions à deux niveaux avec intégration complète des standards EPCIS 2.0.

### Architecture Conceptuelle
```
OBJET (Hexagone - Avatar tracé)
├── ÉTAT (Bannière - Condition actuelle)
│   ├── 🔵 ACTION_PRINCIPALE (OBLIGATOIRE)
│   │   ├── Exposition des données
│   │   └── Navigation vers actions disponibles
│   ├── 🟡 ACTION_SECONDAIRE_1 (OPTIONNELLE)
│   │   ├── Capture + Workflow interne
│   │   └── Transition vers ÉTAT_CIBLE_1
│   └── 🟡 ACTION_SECONDAIRE_N (OPTIONNELLE)
└── MÉTADONNÉES (YAML + Historique)
```

---

## DÉCISIONS ARCHITECTURALES CRITIQUES

### 1. Stack Technique Validée

#### Core Platform
- **Obsidian** 1.4.16+ avec plugins Excalidraw 2.0.0+ et Templater 2.0.0+
- **JavaScript ES6+** (pas de TypeScript - contrainte Obsidian)
- **ExcalidrawAutomate API** pour création programmatique
- **Node.js** pour développement et tests hors Obsidian

#### Standards d'Intégration
- **EPCIS 2.0 + CBV 2.0** : 41 business steps + 25 dispositions
- **OpenAPI 3.0** pour spécifications API automatiques
- **Markdown + YAML** pour documentation structurée
- **360SmartConnect** : Correspondances Avatar/Finger/API

### 2. Architecture État-Actions Deux Niveaux

#### Principe Fondamental
**Un ÉTAT possède TOUJOURS une ACTION PRINCIPALE et peut avoir plusieurs ACTIONS SECONDAIRES optionnelles**

#### Justification Architecture
- **ACTION_PRINCIPALE** : Point d'entrée uniforme (GET) pour consultation état
- **ACTIONS_SECONDAIRES** : Points d'interaction métier (POST) avec transitions
- **Séparation lecture/écriture** : Pattern CQRS naturel pour M2M
- **Workflow interne** : Sous-actions possibles dans actions secondaires

### 3. Synchronisation Bidirectionnelle

#### Pattern Canvas → Markdown
```javascript
// Détection éléments taggés
const elements = ea.getElements()
  .filter(el => el.customData?.processTag);
// Génération fichiers markdown synchronisés
await generateMarkdownFiles(elements);
```

#### Pattern Markdown → Canvas
```javascript
// Lecture métadonnées YAML
const frontmatter = app.metadataCache
  .getFileCache(file).frontmatter;
// Mise à jour visuelle canvas
await updateCanvasElements(frontmatter);
```

### 4. Système de Templates EPCIS 2.0

#### Bibliothèque Intégrée
- **41 Business Steps CBV** : receiving, shipping, packing, inspecting, etc.
- **25 Dispositions CBV** : active, in_transit, destroyed, damaged, etc.
- **Templates de base** : État Initial, État Rebut, Points de contrôle
- **Gestion avancée** : Création, duplication, héritage

#### Exemple Mapping EPCIS
```yaml
epcis_mapping:
  bizStep: "receiving"
  disposition: "in_progress"
  eventType: "ObjectEvent"
  action: "ADD"
```

---

## ARCHITECTURE TECHNIQUE DÉTAILLÉE

### 1. Structure Modulaire

#### Module Components (Frontend)
```
components/
├── object-creator.js      # Création hexagone OBJECT
├── state-creator.js       # Création bannière STATE
├── action-creator.js      # Création rectangle ACTION
└── relation-detector.js   # Détection flèches/transitions
```

#### Module Sync (Backend)
```
sync/
├── canvas-reader.js       # Lecture éléments Excalidraw
├── markdown-generator.js  # Génération fichiers markdown
├── bidirectional-sync.js  # Orchestration synchronisation
└── batch-processor.js     # Optimisation performance
```

#### Module Templates (Database)
```
templates/
├── epcis/
│   ├── business-steps/   # 41 templates EPCIS
│   └── dispositions/     # 25 dispositions CBV
├── base/                 # Templates de base
└── custom/               # Templates personnalisés
```

### 2. Performance et Optimisation

#### Objectifs Validés
- **Création composant** : <2s (ExcalidrawAutomate natif)
- **Synchronisation** : <5s pour 50 composants
- **Détection changements** : Temps réel avec watchers

#### Stratégies d'Optimisation
- **Batch processing** pour synchronisations multiples
- **Cache métadonnées** Obsidian API
- **Templates précompilés** pour performance
- **Lazy loading** composants non visibles

### 3. Intégration 360SmartConnect

#### Correspondances Conceptuelles
- **OBJECT** → Avatar 360SmartConnect
- **STATE** → Métadonnées avatar + état actuel
- **ACTION_PRINCIPALE** → GET /api/avatars/{id}/state
- **ACTIONS_SECONDAIRES** → POST /api/avatars/{id}/actions/{name}

#### Exemple Mapping API
```javascript
// OBJECT → Avatar
{
  "name": "v0:TYPE_OBJET:INSTANCE",
  "alphaId": "v0:TYPE_OBJET",
  "generateMCFinger": "/api/fingers/[id]",
  "company": "/api/companies/[id]"
}

// STATE → Métadonnées
{
  "current_state": "En_Production",
  "state_data": {
    "temperature": 23.5,
    "quality_score": 0.98
  }
}
```

---

## RISQUES ET MITIGATIONS

### Risques Techniques Identifiés

| Risque | Impact | Probabilité | Mitigation |
|--------|---------|-------------|------------|
| Performance sync >50 composants | Élevé | Moyenne | Tests charge + optimisation batch |
| Breaking changes Excalidraw API | Élevé | Faible | Version lock + tests regression |
| Complexité templates EPCIS | Moyen | Moyenne | Documentation + exemples |
| Adoption utilisateurs | Élevé | Moyenne | UX intuitive + formation |

### Stratégies de Mitigation
1. **Tests de charge précoces** avec 100+ composants
2. **API abstractions** pour isoler dépendances externes
3. **Templates progressifs** : Simple → Avancé
4. **Feedback loops courts** : Validation utilisateur continue

---

## WORKFLOW DÉVELOPPEMENT RECOMMANDÉ

### 1. Méthodologie Boucles Rapides
```
Développement (1-2j) → Test Utilisateur (30min) → 
Feedback → Ajustement (même jour) → TDD → Commit
```

### 2. Phases Prioritaires
1. **Phase 1** : Composants de base + sync simple (CRITIQUE)
2. **Phase 2** : Templates EPCIS 2.0 + personnalisation
3. **Phase 3** : Architecture deux niveaux complète
4. **Phase 4** : Synchronisation bidirectionnelle optimisée
5. **Phase 5** : Export documentation + API specs
6. **Phase 6** : Interface utilisateur finale
7. **Phase 7** : Tests complets + déploiement

### 3. Points de Validation Utilisateur
- **Fin Phase 1** : Création basique fonctionnelle
- **Fin Phase 2** : Templates EPCIS utilisables
- **Fin Phase 3** : Logique métier validée
- **Chaque semaine** : Démo progress + feedback

---

## STANDARDS QUALITÉ APPLIQUÉS

### Code JavaScript
```javascript
// <!-- START OF FILE: example.js -->
// FILENAME: example.js
// Version: 1.0.0
// Date: 2025-07-27 17:00
// Author: Rolland MELET & Claude Code
// Description: [Description précise]

/**
 * Documentation JSDoc OBLIGATOIRE
 * @param {string} objectName - Nom de l'objet tracé
 * @returns {string} ID unique créé
 * @sideEffect Modifie le canvas Excalidraw
 * @example
 * const id = createObject("Lot-001", "raw-material", {x: 100, y: 200});
 */
```

### Tests Requis
- **Unitaires** : Chaque fonction isolée
- **Intégration** : Workflows complets
- **Performance** : Benchmarks synchronisation
- **Utilisateur** : Scripts validation UX

---

## LIVRABLES ARCHITECTURE

### Documentation Technique
- ✅ **stack-decisions.md** : Choix techniques justifiés
- ✅ **plan.md** : Planning détaillé 7 phases / 4 semaines
- ✅ **tasks.md** : 48 tâches atomiques décomposées
- ✅ **architecture.md** : Synthèse complète (ce document)

### Références Architecturales
- **Architecture-Etat-Actions-DeuxNiveaux.md** : Spécification détaillée modèle
- **Bibliotheque-Templates-Composants.md** : Templates EPCIS 2.0 complets
- **PRD ProcessMetaLanguage** : Vision produit et contraintes

### Exemples Techniques Recherchés
Via ref-tools MCP, patterns validés pour :
- Création composants ExcalidrawAutomate
- Synchronisation bidirectionnelle canvas/fichiers
- Gestion templates avec héritage
- Intégration EPCIS 2.0 dans JavaScript

---

## PROCHAINES ÉTAPES

### Recommandation Immédiate
**Agent suivant** : /agent:frontend  
**Tâche prioritaire** : TASK-F001 - Créer module hexagone OBJECT standardisé  
**Validation requise** : Hexagone 120x80px + métadonnées + tag #process-object

### Checklist Pré-Développement
- [x] Stack technique validée et documentée
- [x] Plan chronologique détaillé créé
- [x] Tâches atomiques décomposées
- [x] Architecture deux niveaux spécifiée
- [x] Templates EPCIS 2.0 identifiés
- [x] Risques analysés avec mitigations
- [ ] Premier prototype à valider (Phase 1)

---

**Cette architecture garantit un développement structuré du ProcessMetaLanguage avec validation continue et conformité aux standards de traçabilité industrielle.**

<!-- END OF FILE: architecture.md -->