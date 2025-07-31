# ProcessMetaLanguage - Guide Utilisateur Complet

**Version**: 1.0.0  
**Date**: 2025-07-31  
**Tâche**: TASK-D008 - Documentation utilisateur complète  
**Phase**: Phase 6 - Interface Utilisateur et Ergonomie  

---

## Table des Matières

1. [Introduction](#introduction)
2. [Installation](#installation)
3. [Démarrage Rapide](#démarrage-rapide)
4. [Concepts Fondamentaux](#concepts-fondamentaux)
5. [Interface Principale](#interface-principale)
6. [Création de Composants](#création-de-composants)
7. [Templates EPCIS 2.0](#templates-epcis-20)
8. [Workflow et Transitions](#workflow-et-transitions)
9. [Export et Documentation](#export-et-documentation)
10. [Fonctionnalités Avancées](#fonctionnalités-avancées)
11. [Dépannage](#dépannage)
12. [Référence Rapide](#référence-rapide)

---

## Introduction

### Qu'est-ce que ProcessMetaLanguage ?

ProcessMetaLanguage est un **système de méta-langage graphique** pour concevoir des processus de traçabilité industrielle directement dans Obsidian avec Excalidraw. Il transforme vos diagrammes visuels en documentation technique complète, prête pour l'implémentation.

### Avantages Clés

- ✅ **Design Visuel** : Créez vos processus graphiquement
- ✅ **Standards EPCIS 2.0** : Conformité GS1 automatique
- ✅ **Documentation Automatique** : Génération markdown, OpenAPI, matrices
- ✅ **Suggestions Intelligentes** : IA pour accélérer votre workflow
- ✅ **Export Multi-format** : Intégration systèmes existants

### Pour Qui ?

- 🏭 **Ingénieurs Process** : Conception rapide de workflows
- 📊 **Analystes Supply Chain** : Modélisation traçabilité
- 💻 **Développeurs** : Spécifications API automatiques
- 🎯 **Chefs de Projet** : Documentation claire et visuelle

---

## Installation

### Prérequis

1. **Obsidian** (v1.4.16+) - [Télécharger](https://obsidian.md)
2. **Plugin Excalidraw** (v2.0.0+) avec ExcalidrawAutomate activé
3. **Plugin Templater** (v2.0.0+) pour templates dynamiques
4. **Node.js** (optionnel, pour tests)

### Installation du Plugin ProcessMetaLanguage

#### Méthode 1 : Installation Manuelle

1. Téléchargez la dernière release depuis GitHub
2. Extrayez l'archive dans `.obsidian/plugins/processmetalanguage/`
3. Redémarrez Obsidian
4. Activez le plugin dans Paramètres → Plugins Communautaires

#### Méthode 2 : Installation depuis Obsidian (prochainement)

1. Paramètres → Plugins Communautaires → Parcourir
2. Rechercher "ProcessMetaLanguage"
3. Installer et Activer

### Configuration Initiale

1. **Ouvrir les Paramètres ProcessMetaLanguage**
   - Paramètres → Plugins → ProcessMetaLanguage

2. **Configurer les Préférences**
   ```
   ☑️ Auto-afficher sur fichiers Excalidraw
   ☑️ Sauvegarde automatique
   📍 Position sidebar : Droite
   🎨 Thème : Auto (suit Obsidian)
   ```

3. **Définir les Raccourcis** (optionnel)
   - `Ctrl+Shift+P` : Toggle Interface
   - `Ctrl+Shift+O` : Créer Objet
   - `Ctrl+Shift+S` : Créer État
   - `Ctrl+Shift+A` : Créer Action

---

## Démarrage Rapide

### 1. Créer un Nouveau Projet

```
1. Créer un fichier Excalidraw : MonProcessus.excalidraw
2. L'interface ProcessMetaLanguage s'ouvre automatiquement
3. Cliquer "Nouveau Projet" dans le dashboard
4. Remplir les informations :
   - Nom : "Processus Fabrication"
   - Description : "Workflow production pièces métalliques"
   - Industrie : "Manufacturing"
```

### 2. Ajouter Votre Premier Objet

```
1. Cliquer le bouton "⬡ Objet" dans la toolbar
2. Nommer l'objet : "Lot-Matière-001"
3. Type : "raw_material"
4. L'hexagone bleu apparaît sur le canvas
```

### 3. Définir un État

```
1. Sélectionner l'objet créé
2. Cliquer "🏷️ État"
3. Choisir disposition : "active"
4. La bannière verte se superpose à l'objet
```

### 4. Ajouter une Action

```
1. Cliquer "▭ Action"
2. Sélectionner business step : "receiving"
3. Le rectangle orange apparaît, connecté à l'état
```

### 5. Visualiser et Exporter

```
1. Aller dans l'onglet "Export"
2. Cliquer "Générer Documentation"
3. Choisir format : Markdown
4. La documentation complète est générée !
```

---

## Concepts Fondamentaux

### Architecture État-Actions Deux Niveaux

ProcessMetaLanguage utilise une architecture hiérarchique :

```
OBJET (Entité tracée)
├── ÉTAT (Condition actuelle)
│   ├── ACTION PRINCIPALE (Obligatoire)
│   └── ACTIONS SECONDAIRES (Optionnelles)
└── MÉTADONNÉES (Historique + Propriétés)
```

### Les 3 Types de Composants

#### 1. OBJET (Hexagone Bleu)
- **Représente** : L'entité physique ou logique tracée
- **Exemples** : Lot matière, Produit fini, Commande, Container
- **Taille** : 120x80 pixels
- **Couleur** : Bleu (#4a90e2)

#### 2. ÉTAT (Bannière Verte)
- **Représente** : La condition/disposition actuelle
- **Exemples** : Actif, En transit, En production, Endommagé
- **Taille** : 80x40 pixels  
- **Couleur** : Selon disposition EPCIS

#### 3. ACTION (Rectangle Orange)
- **Représente** : L'opération qui transforme l'objet
- **Exemples** : Réception, Inspection, Expédition, Transformation
- **Taille** : 140x60 pixels
- **Types** :
  - 🔵 **Principale** : Expose données + navigation
  - 🟡 **Secondaire** : Capture données + transitions

### Standards EPCIS 2.0

ProcessMetaLanguage intègre nativement :
- **41 Business Steps** (receiving, shipping, inspecting...)
- **25 Dispositions** (active, in_transit, damaged...)
- **Conformité GS1 CBV 2.0** automatique

---

## Interface Principale

### Vue Dashboard

Le dashboard est votre point d'entrée :

```
┌─────────────────────────────────────┐
│ 🏠 Dashboard ProcessMetaLanguage    │
├─────────────────────────────────────┤
│ Projet: Processus Fabrication       │
│ Industrie: Manufacturing            │
│ Composants: 12 objets, 18 états    │
│                                     │
│ [📊 Métriques]  [⚡ Actions Rapides]│
│                                     │
│ Dernière sync: il y a 2 minutes    │
└─────────────────────────────────────┘
```

**Sections Dashboard** :
- **Infos Projet** : Nom, description, statistiques
- **Métriques** : Composants créés, templates utilisés
- **Actions Rapides** : Création 1-clic, validation, export
- **Performance** : Temps synchronisation, cache

### Navigation Entre Vues

5 vues principales accessibles :

1. **🏠 Dashboard** : Vue d'ensemble et accès rapide
2. **🔧 Création** : Outils création et propriétés
3. **📋 Templates** : Bibliothèque EPCIS 2.0
4. **📤 Export** : Génération documentation
5. **✅ Validation** : Contrôle qualité processus

Navigation :
- Cliquer sur les onglets
- Raccourcis : `Alt+1` à `Alt+5`
- Breadcrumb pour contexte

### Barre d'Outils Excalidraw

Toolbar intégrée avec 4 groupes :

```
[🔧 Création] [📋 Templates] [🔄 Workflow] [📤 Export]
```

**Groupe Création** :
- ⬡ Objet (Ctrl+Shift+O)
- 🏷️ État (Ctrl+Shift+S)  
- ▭ Action (Ctrl+Shift+A)

**Groupe Templates** :
- 📊 EPCIS Standards
- ⚙️ Templates Custom

**Groupe Workflow** :
- ✅ Valider Architecture
- 🔄 Synchroniser Canvas

**Groupe Export** :
- 📋 Export Workflow
- 🔌 Export API

---

## Création de Composants

### Créer un Objet

#### Méthode 1 : Toolbar
```
1. Cliquer "⬡ Objet" dans toolbar
2. Cliquer sur canvas pour positionner
3. Remplir propriétés dans panneau :
   - Nom : Identifiant unique
   - Type : raw_material, product, container...
   - Description : Optionnelle
```

#### Méthode 2 : Panneau Création
```
1. Aller dans vue "Création"
2. Section "Nouvel Objet"
3. Remplir formulaire complet
4. Cliquer "Créer"
```

#### Méthode 3 : Raccourci Clavier
```
1. Appuyer Ctrl+Shift+O
2. L'objet apparaît au centre
3. Double-cliquer pour éditer nom
```

### Créer un État

Les états définissent la condition d'un objet :

```
1. Sélectionner un objet existant
2. Cliquer "🏷️ État"
3. Choisir disposition EPCIS :
   - active (vert) : Disponible
   - in_progress (jaune) : En cours
   - in_transit (bleu) : En transit
   - damaged (rouge) : Endommagé
4. L'état se superpose automatiquement
```

**💡 Astuce** : Un objet peut avoir plusieurs états successifs dans le temps

### Créer une Action

#### Action Principale (Automatique)
```
Chaque état génère automatiquement son action principale qui :
- Expose les métadonnées de l'objet
- Fournit navigation vers états suivants
- Implémente l'API read/query
```

#### Actions Secondaires
```
1. Sélectionner un état avec action principale
2. Cliquer "+ Action Secondaire"
3. Choisir business step EPCIS
4. Configurer :
   - Capture données : Champs requis
   - Transition : État destination
   - Validation : Règles métier
```

### Propriétés Avancées

Chaque composant a des propriétés configurables :

**Objet** :
- `gtin` : Global Trade Item Number
- `lot` : Numéro de lot
- `serialNumber` : Numéro série unique
- `expirationDate` : Date expiration
- Métadonnées custom

**État** :
- `disposition` : Code EPCIS
- `bizLocation` : Localisation
- `readPoint` : Point lecture RFID
- `timestamp` : Horodatage auto

**Action** :
- `businessStep` : Étape EPCIS
- `inputData` : Données entrée
- `outputData` : Données sortie
- `apiEndpoint` : URL généré

---

## Templates EPCIS 2.0

### Accéder aux Templates

```
1. Vue "Templates" ou bouton "📊 EPCIS"
2. Interface de sélection avec :
   - 41 Business Steps organisés
   - 25 Dispositions standards
   - Recherche et filtres
   - Preview temps réel
```

### Business Steps Fréquents

#### Receiving (Réception)
```yaml
businessStep: receiving
description: Réception marchandises/matériaux
inputs:
  - shipmentId
  - supplierId
  - quantity
outputs:
  - lotNumber
  - location
transitions:
  - inspecting
  - storing
```

#### Inspecting (Inspection)
```yaml
businessStep: inspecting  
description: Contrôle qualité
inputs:
  - lotNumber
  - inspectionCriteria
outputs:
  - qualityStatus
  - defectsFound
transitions:
  - accepting (si OK)
  - rejecting (si KO)
```

#### Shipping (Expédition)
```yaml
businessStep: shipping
description: Envoi vers destination
inputs:
  - orderId
  - destinationId
outputs:
  - trackingNumber
  - carrier
transitions:
  - in_transit
  - delivered
```

### Dispositions Standards

Les 5 dispositions les plus utilisées :

1. **active** 🟢 : Opérationnel et disponible
2. **in_progress** 🟡 : Traitement en cours
3. **in_transit** 🔵 : En déplacement
4. **inactive** ⚫ : Temporairement indisponible
5. **damaged** 🔴 : Endommagé/défectueux

### Personnaliser un Template

```
1. Sélectionner template de base
2. Cliquer "Personnaliser"
3. Modifier dans panneau :
   - Nom et description
   - Champs données
   - Règles validation
   - Transitions permises
4. Sauvegarder comme nouveau template
```

---

## Workflow et Transitions

### Créer des Connexions

#### Méthode Visuelle
```
1. Sélectionner composant source
2. Maintenir Ctrl et cliquer destination
3. Une flèche se crée automatiquement
4. Le système détecte le type de relation
```

#### Types de Relations
- **Objet → État** : Association possession
- **État → Action** : Déclenchement opération
- **Action → État** : Transition résultat
- **État → État** : Évolution temporelle

### Patterns de Workflow

#### Pattern Quality Control
```
Receiving → Inspecting → [Accepting/Rejecting]
```

#### Pattern Order Fulfillment  
```
Picking → Packing → Shipping → Delivering
```

#### Pattern Production
```
Raw Material → Transforming → Assembling → Finished Product
```

### Validation Architecture

Le système valide automatiquement :
- ✅ Chaque objet a au moins un état
- ✅ Chaque état a une action principale
- ✅ Pas de cycles infinis
- ✅ Transitions cohérentes EPCIS

Validation manuelle :
```
1. Cliquer "✅ Valider" dans toolbar
2. Rapport détaillé avec :
   - Score conformité (%)
   - Issues détectées
   - Suggestions corrections
```

---

## Export et Documentation

### Formats d'Export Disponibles

#### 1. Documentation Markdown
```
- README processus complet
- Diagrammes états-transitions
- Spécifications détaillées
- Guide implémentation
```

#### 2. Spécifications OpenAPI 3.0
```yaml
openapi: 3.0.0
paths:
  /objects/{objectId}:
    get: # Action principale
    post: # Actions secondaires
```

#### 3. Matrice des Flux
```
Visualisations analytiques :
- Matrice transitions états
- Diagramme temporel
- Flux de données
- Dépendances composants
```

#### 4. Mapping 360SmartConnect
```json
{
  "avatars": [...],  // Objets → Avatars
  "metadata": [...], // États → Métadonnées
  "workflows": [...] // Actions → API calls
}
```

### Processus d'Export

```
1. Vue "Export" → Sélectionner module
2. Configurer options :
   - Format sortie
   - Niveau détail
   - Inclure diagrammes
3. Cliquer "Générer"
4. Télécharger ou copier résultat
```

### Historique Exports

Tous les exports sont sauvegardés :
- Horodatage et version
- Possibilité de comparer
- Re-téléchargement

---

## Fonctionnalités Avancées

### Suggestions Intelligentes

Le système analyse votre workflow et suggère :

#### Suggestions Contextuelles
- Prochaine étape logique selon industrie
- Templates EPCIS pertinents
- Optimisations architecture

#### Déclenchement
- Automatique après 1s d'inactivité
- Panneau discret non-intrusif
- Accept avec Tab ou clic

#### Types de Suggestions
1. **Basiques** : Composants manquants
2. **Industrie** : Patterns sectoriels
3. **EPCIS** : Complétion workflows standards
4. **Optimisation** : Amélioration layout/nommage

### Auto-complétion

Active sur tous les champs de saisie :

#### Fonctionnement
```
1. Taper 2+ caractères
2. Suggestions apparaissent
3. Naviguer avec ↑↓
4. Valider avec Enter/Tab
```

#### Dictionnaires
- 41 business steps EPCIS
- 25 dispositions standards
- Types objets industriels
- Termes personnalisés

### Mode Compact Mobile

Pour écrans < 768px :
- Toolbar condensée
- Panneau latéral overlay
- Gestes tactiles optimisés

### Synchronisation Temps Réel

#### Canvas → Documentation
- Détection automatique changements
- Mise à jour < 5 secondes
- Indicateur sync actif

#### Documentation → Canvas
- Édition markdown externe
- Import modifications
- Résolution conflits

### Raccourcis Productivité

**Globaux** :
- `Ctrl+Shift+P` : Toggle interface
- `Ctrl+S` : Sauvegarder
- `Ctrl+Z/Y` : Undo/Redo

**Création** :
- `Ctrl+Shift+O` : Nouvel objet
- `Ctrl+Shift+S` : Nouvel état
- `Ctrl+Shift+A` : Nouvelle action

**Navigation** :
- `Alt+1-5` : Changer vue
- `Tab` : Élément suivant
- `Escape` : Fermer panneaux

---

## Dépannage

### Problèmes Fréquents

#### Interface ne s'affiche pas
```
1. Vérifier Excalidraw plugin activé
2. Vérifier ExcalidrawAutomate dans console (Ctrl+Shift+I)
3. Redémarrer Obsidian
4. Réinstaller le plugin
```

#### Synchronisation lente
```
1. Vérifier nombre composants (< 100 recommandé)
2. Nettoyer cache : Paramètres → Vider cache
3. Désactiver sync auto temporairement
```

#### Templates non visibles
```
1. Vérifier dossier templates/ existe
2. Recharger templates : Vue Templates → Rafraîchir
3. Vérifier permissions fichiers
```

### Messages d'Erreur

**"ExcalidrawAutomate non disponible"**
- Installer/activer plugin Excalidraw
- Activer ExcalidrawAutomate dans paramètres Excalidraw

**"Validation échouée : État sans action"**
- Chaque état doit avoir une action principale
- Sélectionner état → Ajouter action

**"Export timeout"**
- Processus trop complexe (> 200 composants)
- Diviser en sous-processus
- Augmenter timeout dans paramètres

### Logs et Debug

Activer mode debug :
```
Paramètres → ProcessMetaLanguage → Mode Debug
```

Consulter logs :
```
Console développeur (Ctrl+Shift+I) → Filtrer "PML"
```

---

## Référence Rapide

### Commandes Essentielles

| Action | Raccourci | Description |
|--------|-----------|-------------|
| Toggle Interface | `Ctrl+Shift+P` | Afficher/masquer |
| Créer Objet | `Ctrl+Shift+O` | Nouvel hexagone |
| Créer État | `Ctrl+Shift+S` | Nouvelle bannière |
| Créer Action | `Ctrl+Shift+A` | Nouveau rectangle |
| Valider | `Ctrl+Shift+V` | Check architecture |
| Export | `Ctrl+Shift+E` | Générer docs |

### Codes Couleur

| Composant | Couleur | Hex | Signification |
|-----------|---------|-----|---------------|
| Objet | Bleu | #4a90e2 | Entité tracée |
| État Actif | Vert | #7ed321 | Opérationnel |
| État Transit | Bleu | #00a8ff | En mouvement |
| État Erreur | Rouge | #d0021b | Problème |
| Action Main | Bleu foncé | #2e5c8a | Obligatoire |
| Action Sec. | Orange | #f5a623 | Optionnelle |

### Tailles Standards

| Composant | Largeur | Hauteur | Ratio |
|-----------|---------|---------|-------|
| Objet | 120px | 80px | 3:2 |
| État | 80px | 40px | 2:1 |
| Action | 140px | 60px | 7:3 |

### Business Steps Top 10

1. **receiving** - Réception entrante
2. **inspecting** - Contrôle qualité
3. **storing** - Mise en stock
4. **picking** - Prélèvement
5. **packing** - Emballage
6. **shipping** - Expédition
7. **transforming** - Transformation
8. **assembling** - Assemblage
9. **accepting** - Acceptation
10. **commissioning** - Mise en service

### Dispositions Principales

1. **active** - ✅ Disponible
2. **in_progress** - 🔄 En cours
3. **in_transit** - 🚚 En transit
4. **inactive** - ⏸️ Inactif
5. **damaged** - ❌ Endommagé

---

## Support et Ressources

### Obtenir de l'Aide

- **Documentation** : [processmetalanguage.io/docs](https://processmetalanguage.io/docs)
- **GitHub** : [github.com/RollandMELET/ProcessMetaLanguage](https://github.com)
- **Forum** : [forum.processmetalanguage.io](https://forum.processmetalanguage.io)
- **Email** : support@processmetalanguage.io

### Contribuer

ProcessMetaLanguage est open source !
- Reporter bugs sur GitHub Issues
- Proposer améliorations via Pull Requests
- Partager vos templates personnalisés

### Roadmap

**Version 1.1** (Q2 2024) :
- Support multi-langues
- Templates industrie pharmaceutique
- API REST pour intégration

**Version 2.0** (Q4 2024) :
- Mode collaboratif temps réel
- IA générative workflows
- Export direct ERP/WMS

---

*ProcessMetaLanguage - Simplifier la traçabilité industrielle*  
*Guide utilisateur v1.0.0 - 2025*