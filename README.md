# ProcessMetaLanguage

**Version:** 1.0.0  
**Statut:** En développement  
**Architecture:** État-Actions à deux niveaux  
**Standard:** GS1 EPCIS 2.0 compatible  

---

## 🎯 Vue d'ensemble

ProcessMetaLanguage est un **métalanguage graphique standardisé** pour la conception de processus de traçabilité industrielle dans Obsidian Excalidraw. Il permet de créer visuellement des processus complexes tout en générant automatiquement une documentation technique complète et standardisée.

### Objectif Principal
Transformer des **diagrammes visuels intuitifs** en **spécifications techniques exhaustives** prêtes pour l'implémentation dans des systèmes de traçabilité (360SmartConnect, SAP, etc.).

### Livrable Final
**Fichier Markdown consolidé** contenant toutes les spécifications nécessaires pour l'implémentation automatique par des agents IA ou manuelle par des développeurs.

---

## 📋 Architecture et Composants

### Architecture État-Actions à Deux Niveaux
```
OBJET (Hexagone - Avatar tracé)
├── ÉTAT_ACTUEL (Fanion)
│   ├── 🔵 ACTION_PRINCIPALE (OBLIGATOIRE)
│   │   ├── Exposition des données d'état
│   │   └── Navigation vers actions disponibles
│   │   └── API: GET /api/avatars/{id}/state
│   │
│   ├── 🟡 ACTION_SECONDAIRE_1 (OPTIONNELLE)
│   │   ├── Capture de données + Workflow interne
│   │   ├── Transition vers ÉTAT_CIBLE_1
│   │   └── API: POST /api/avatars/{id}/actions/{name}
│   │
│   └── 🟡 ACTION_SECONDAIRE_N (OPTIONNELLE)
└── DONNÉES_OBJET (Métadonnées + Historique)
```

### Composants Graphiques Standardisés

| Composant | Forme | Taille | Couleur | Fonction |
|-----------|-------|--------|---------|----------|
| **OBJET** | Hexagone | 120x80px | Configurable par type | Entité tracée (Avatar) |
| **ÉTAT** | Fanion | 80x40px | Unique pour tous | Condition actuelle objet |
| **ACTION** | Rectangle arrondi | 140x60px | Par type d'action | Interaction utilisateur/système |

---

## 🗂️ Structure du Projet

```
ProcessMetaLanguage/
├── README.md                           # Ce fichier
├── 00 - PRD&Plan/                      # Documentation projet
│   ├── prd_metalanguage.md             # PRD complet (1191 lignes)
│   ├── Architecture-Etat-Actions-DeuxNiveaux.md  # Architecture détaillée (901 lignes)
│   ├── Bibliotheque-Templates-Composants.md      # Templates EPCIS 2.0 (988 lignes)
│   └── *.backup*.md                    # Versions antérieures
├── src/                                # Code source (à créer)
│   ├── core/                          # Fonctions principales
│   │   ├── component-factory.js       # Création composants
│   │   ├── template-manager.js        # Gestion templates
│   │   ├── synchronizer.js           # Sync graphique ↔ markdown
│   │   └── validator.js              # Validation EPCIS 2.0
│   ├── templates/                     # Bibliothèque templates
│   │   ├── epcis-templates.js        # 41 business steps + 25 dispositions
│   │   ├── base-templates.js         # Templates de base
│   │   └── custom-templates.js       # Templates personnalisés
│   ├── exporters/                     # Générateurs documentation
│   │   ├── workflow-generator.js     # Workflow consolidé
│   │   ├── api-mapper.js            # Correspondances 360SmartConnect
│   │   └── openapi-generator.js      # Spécifications API
│   └── config/                        # Configuration
│       ├── project-config.js         # Config projet
│       └── epcis-vocabulary.js       # Vocabulaire CBV 2.0
├── templates/                          # Templates Obsidian Templater
│   ├── object-templates/              # Templates objets
│   ├── state-templates/               # Templates états
│   └── action-templates/              # Templates actions
├── examples/                           # Exemples et cas d'usage
│   ├── processus-alimentaire-haccp/   # Exemple HACCP
│   ├── logistique-express/           # Exemple logistique
│   └── manufacturing-basic/          # Exemple manufacturing
├── ui-references/                      # Références UI (Section 15 PRD)
│   ├── actions-principales/          # UI consultation/navigation
│   ├── actions-secondaires/          # UI interactions métier
│   └── workflow-etapes/              # UI workflow interne
├── ui-mockups/                        # Fichiers design détaillés
│   ├── figma-exports/                # Exports Figma
│   ├── sketch-files/                 # Fichiers Sketch
│   └── html-demos/                   # Démos HTML/CSS
├── tests/                             # Tests automatisés
│   ├── unit/                         # Tests unitaires
│   ├── integration/                  # Tests d'intégration
│   └── user-acceptance/              # Tests utilisateur
└── docs/                              # Documentation générée
    ├── api/                          # Documentation API
    ├── user-guide/                   # Guide utilisateur
    └── technical/                    # Documentation technique
```

---

## 🛠️ Technologies et Dépendances

### Stack Technique
- **Frontend :** Obsidian + Plugin Excalidraw + ExcalidrawAutomate API
- **Templating :** Plugin Templater pour Obsidian
- **Scripting :** JavaScript (ExcalidrawAutomate, Obsidian API)
- **Configuration :** YAML avec validation de schéma
- **Documentation :** Markdown avec métadonnées YAML frontmatter

### Prérequis
- [Obsidian](https://obsidian.md/) (version recommandée : 1.4.16+)
- [Plugin Excalidraw](https://github.com/zsviczian/obsidian-excalidraw-plugin) (version 2.0.0+)
- [Plugin Templater](https://github.com/SilentVoid13/Templater) (version 2.0.0+)
- Node.js (pour tests et développement)

### Standards Intégrés
- **GS1 EPCIS 2.0** : 41 business steps + 25 dispositions CBV
- **OpenAPI 3.0** : Génération spécifications API
- **Markdown** : Documentation standardisée

---

## 📦 Installation

### 1. Prérequis Obsidian
```bash
# Installer Obsidian depuis le site officiel
# https://obsidian.md/download

# Installer les plugins requis via Obsidian Community Plugins :
# - Excalidraw (par Zsolt Viczian)
# - Templater (par SilentVoid13)
```

### 2. Installation ProcessMetaLanguage
```bash
# Cloner le projet dans votre vault Obsidian
cd /path/to/your/obsidian-vault/
git clone https://github.com/your-repo/ProcessMetaLanguage.git

# Ou télécharger et extraire dans le vault
```

### 3. Configuration Obsidian
```yaml
# Dans les paramètres d'Excalidraw :
# - Activer "ExcalidrawAutomate" 
# - Autoriser les scripts JavaScript
# - Configurer le dossier de templates

# Dans les paramètres de Templater :
# - Définir le dossier templates : ProcessMetaLanguage/templates/
# - Activer l'exécution automatique
# - Autoriser les scripts système
```

### 4. Configuration Projet
```bash
# Copier le fichier de configuration par défaut
cp config/project-config.example.yaml config/project-config.yaml

# Éditer la configuration selon vos besoins
# (types d'objets, couleurs, intégrations, etc.)
```

### 5. Vérification Installation
```javascript
// Dans la console Obsidian (Ctrl+Shift+I) :
// Vérifier que ExcalidrawAutomate est disponible
console.log(typeof ExcalidrawAutomate !== 'undefined' ? 'OK' : 'MANQUANT');

// Tester la création d'un composant simple
// (script de test à développer)
```

---

## 🚀 Guide d'utilisation

### Workflow de Base

#### 1. Configuration Projet
```yaml
# Éditer config/project-config.yaml
project:
  name: "Mon Processus Traçabilité"
  version: "1.0.0"
  architecture: "two-level-actions"

types_objets:
  - nom: "Matière première"
    couleur: "#E3F2FD"
  - nom: "Produit fini"
    couleur: "#E8F5E8"
```

#### 2. Création Canvas Processus
1. Créer un nouveau fichier Excalidraw : `Mon-Processus.excalidraw`
2. Utiliser la palette ProcessMetaLanguage (à développer)
3. Créer les composants standardisés

#### 3. Création Composants

##### OBJET (Hexagone)
```javascript
// Via ExcalidrawAutomate (script à développer)
ProcessMetaLanguage.createObject({
  name: "Matière Première Lot-001",
  type: "matiere-premiere",
  position: {x: 100, y: 100}
});
```

##### ÉTAT (Fanion)
```javascript
// Ajouter un état à un objet existant
ProcessMetaLanguage.createState({
  objectId: "obj-001",
  name: "En Réception",
  template: "state_initial"
});
```

##### ACTION (Rectangle)
```javascript
// Créer une action liée à un état
ProcessMetaLanguage.createAction({
  stateId: "state-001",
  name: "Contrôler Conformité",
  type: "point-controle",
  template: "epcis_inspecting"
});
```

#### 4. Association UI (Nouvelle fonctionnalité)
```javascript
// Associer des wireframes aux actions
ProcessMetaLanguage.addUISchema({
  actionId: "action-001",
  wireframe: "#ui-wireframe-controle-conformite",
  references: ["./ui-references/form-controle.png"],
  figmaUrl: "https://figma.com/file/abc123/controle-frame"
});
```

#### 5. Synchronisation
```javascript
// Synchroniser le canvas avec la documentation
ProcessMetaLanguage.synchronize({
  canvasFile: "Mon-Processus.excalidraw",
  outputDir: "./docs/generated/"
});
```

#### 6. Génération Documentation
```javascript
// Générer le workflow final consolidé
ProcessMetaLanguage.generateWorkflow({
  projectConfig: "./config/project-config.yaml",
  outputFile: "./docs/workflow-final.md"
});
```

### Templates Disponibles

#### États de Base
- `state_initial` : État Initial (commissioning/active)
- `state_rebut` : État Rebut (decommissioning/destroyed)

#### Actions de Base
- `action_point_controle` : Point de Contrôle (inspecting)
- `action_point_arret` : Point d'Arrêt (décision multiple)
- `action_transfert_info` : Transfert d'Information
- `action_raz_objet` : RAZ de l'Objet
- `action_assemblage_objet` : Assemblage d'Objet (packing)

#### Templates EPCIS 2.0
- **Business Steps :** receiving, shipping, packing, inspecting, storing, etc. (41 au total)
- **Dispositions :** active, in_transit, destroyed, damaged, expired, etc. (25 au total)

### Exemples Concrets

#### Processus HACCP Alimentaire
```bash
# Charger l'exemple dans Obsidian
open examples/processus-alimentaire-haccp/processus-haccp.excalidraw

# Templates utilisés :
# - Matière première → État "Réception" → Action "Contrôler température"
# - Produit fini → État "Conditionné" → Action "Étiqueter traçabilité"
```

#### Logistique Express
```bash
# Charger l'exemple
open examples/logistique-express/expedition-colis.excalidraw

# Workflow typique :
# Colis → "En préparation" → "Scanner code-barres" → "En transit"
```

---

## 🔄 Méthodologie de Développement

### Boucles Rapides de Feedback
Le ProcessMetaLanguage suit une **méthodologie de développement en boucles rapides** :

1. **Développement** (1-3 jours max) : Groupe logique de fonctions
2. **Test Utilisateur** (15-30 min) : Démo + test hands-on
3. **Feedback** : OK / Presque / Non / À améliorer
4. **Ajustements** : Corrections immédiates si ≠ "OK"
5. **TDD** : Formalisation tests si validation OK

### 7 Groupes Logiques de Développement
1. **Création Composant de Base** (Semaine 1)
2. **Template de Base et Personnalisation** (Semaine 1-2)
3. **États et Action Principale** (Semaine 2)
4. **Actions Secondaires et Transitions** (Semaine 2-3)
5. **Synchronisation et Détection** (Semaine 3)
6. **Templates EPCIS 2.0** (Semaine 3-4)
7. **Génération Workflow Final** (Semaine 4)

---

## 🧪 Tests

### Tests Utilisateur
```bash
# Lancer les tests d'acceptance utilisateur
npm run test:user-acceptance

# Tests par groupe de fonctionnalités
npm run test:component-creation
npm run test:template-system
npm run test:synchronization
```

### Tests Automatisés
```bash
# Tests unitaires
npm run test:unit

# Tests d'intégration
npm run test:integration

# Tests de conformité EPCIS 2.0
npm run test:epcis-compliance
```

### Validation Manuelle
1. **Test création composant** : Vérifier hexagone + fichier markdown
2. **Test synchronisation** : Modifier graphique → vérifier mise à jour markdown
3. **Test templates EPCIS** : Sélectionner "receiving" → valider métadonnées CBV
4. **Test workflow final** : Générer documentation complète

---

## 📊 Métriques et Performance

### Objectifs Performance
- **Création composant :** < 2 secondes
- **Synchronisation :** < 5 secondes (50 composants)
- **Génération workflow :** < 10 secondes

### Métriques Qualité
- **Conformité EPCIS 2.0 :** 100% pour templates standards
- **Couverture tests :** > 80%
- **Satisfaction utilisateur :** > 8/10

---

## 🔧 Développement et Contribution

### Architecture Modulaire
Le code est organisé en modules indépendants pour faciliter la maintenance et l'évolution :

- **core/** : Fonctions principales (création, sync, validation)
- **templates/** : Bibliothèque extensible de templates
- **exporters/** : Générateurs de documentation
- **config/** : Gestion configuration et standards

### Standards de Code
- **JavaScript ES6+** avec modules
- **Documentation JSDoc** obligatoire
- **Tests unitaires** pour chaque fonction
- **Validation ESLint** avant commit

### Processus de Contribution
1. Fork du repository
2. Branche feature : `feature/nouvelle-fonctionnalite`
3. Développement avec tests
4. Pull Request avec description détaillée
5. Review et validation
6. Merge après approbation

---

## 📚 Documentation de Référence

### Documents Maîtres
- **[PRD Complet](./00%20-%20PRD&Plan/prd_metalanguage.md)** : Spécifications produit (1191 lignes)
- **[Architecture Détaillée](./00%20-%20PRD&Plan/Architecture-Etat-Actions-DeuxNiveaux.md)** : Architecture technique (901 lignes)
- **[Bibliothèque Templates](./00%20-%20PRD&Plan/Bibliotheque-Templates-Composants.md)** : Templates EPCIS 2.0 (988 lignes)

### Standards Intégrés
- **[GS1 EPCIS 2.0](https://www.gs1.org/standards/epcis)** : Standard de traçabilité
- **[Core Business Vocabulary 2.0](https://www.gs1.org/standards/epcis/epcis-cbv)** : Vocabulaire métier

### APIs et Intégrations
- **[ExcalidrawAutomate](https://github.com/zsviczian/obsidian-excalidraw-plugin)** : API création graphique
- **[Obsidian API](https://docs.obsidian.md/Plugins/Getting+started/Build+a+plugin)** : API plateforme
- **[360SmartConnect](https://360smartconnect.com)** : Correspondances SaaS traçabilité

---

## 🐛 Dépannage

### Problèmes Fréquents

#### Erreur "ExcalidrawAutomate non trouvé"
```javascript
// Vérification dans la console Obsidian
if (typeof ExcalidrawAutomate === 'undefined') {
  console.error('Plugin Excalidraw manquant ou mal configuré');
}
// Solution : Réinstaller le plugin Excalidraw
```

#### Templates non chargés
```yaml
# Vérifier config/project-config.yaml
templates:
  enabled: true
  epcis_templates:
    auto_import: true
```

#### Synchronisation échoue
```javascript
// Vérifier que les éléments ont les bons tags
#process-object, #process-state, #process-action
```

### Logs et Debug
```javascript
// Activer les logs détaillés
ProcessMetaLanguage.setLogLevel('debug');

// Vérifier l'état du système
ProcessMetaLanguage.diagnostics();
```

---

## 📈 Roadmap

### Version 1.0 (Q4 2025)
- ✅ Architecture État-Actions à deux niveaux
- ✅ Bibliothèque templates EPCIS 2.0 complète
- ✅ Spécifications UI intégrées
- 🔄 Interface ExcalidrawAutomate
- 🔄 Synchronisation automatique
- 🔄 Génération documentation

### Version 1.1 (Q1 2026)
- 📋 Interface graphique de gestion templates
- 📋 Export formats multiples (PDF, HTML)
- 📋 Intégration CI/CD pour validation
- 📋 Marketplace templates communautaires

### Version 2.0 (Q2 2026)
- 📋 Support processus multi-entreprises
- 📋 Intégration blockchain pour traçabilité
- 📋 IA pour suggestion templates automatiques
- 📋 Simulation processus temps réel

---

## 🤝 Support et Communauté

### Support Technique
- **Issues GitHub** : [Repository Issues](https://github.com/your-repo/ProcessMetaLanguage/issues)
- **Documentation** : [Wiki du projet](https://github.com/your-repo/ProcessMetaLanguage/wiki)
- **Email** : support@processmetalanguage.com

### Communauté
- **Discord** : [Serveur ProcessMetaLanguage](https://discord.gg/processmetalanguage)
- **Forum** : [Discussions GitHub](https://github.com/your-repo/ProcessMetaLanguage/discussions)
- **LinkedIn** : [Groupe Traçabilité Industrielle](https://linkedin.com/groups/tracabilite-industrielle)

---

## 📄 Licence

MIT License - Voir [LICENSE](./LICENSE) pour les détails complets.

---

## 👥 Équipe et Contributeurs

### Core Team
- **Rolland MELET** - Product Owner & Vision
- **Agent IA PRD Expert** - Architecture & Spécifications
- **Agents Spécialisés** - Développement (à venir)

### Contributeurs
Voir [CONTRIBUTORS.md](./CONTRIBUTORS.md) pour la liste complète.

---

## 🔄 Maintenance de ce README

**⚠️ IMPORTANT POUR LES AGENTS DE DÉVELOPPEMENT :**

Ce fichier README.md doit être **maintenu à jour en permanence** par les agents de production responsables du développement du ProcessMetaLanguage. 

### Responsabilités de Maintenance
- **Mise à jour structure projet** : Refléter la structure réelle des dossiers et fichiers
- **Documentation API** : Synchroniser avec le code développé
- **Instructions installation** : Valider et corriger selon tests réels
- **Exemples usage** : Maintenir les exemples fonctionnels
- **Métriques performance** : Actualiser selon mesures réelles
- **Roadmap** : Réviser selon avancement effectif

### Fréquence de Mise à Jour
- **Quotidienne** : Lors de développement actif
- **Hebdomadaire** : Révision générale et cohérence
- **À chaque livrable** : Validation complète avant release

### Validation Qualité README
- **Tests instructions** : Vérifier que l'installation fonctionne
- **Exemples fonctionnels** : Tous les exemples doivent être exécutables
- **Liens valides** : Aucun lien brisé autorisé
- **Cohérence versions** : Numéros versions synchronisés partout

**Le README.md est la vitrine du projet - il doit toujours refléter fidèlement la réalité fonctionnelle du ProcessMetaLanguage.**

---

*Dernière mise à jour : 2025-07-27 par Agent IA PRD Expert*  
*Version README : 1.0.0*  
*Statut projet : Phase de développement - Groupe 1 à démarrer*