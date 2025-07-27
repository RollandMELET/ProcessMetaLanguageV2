# PRD - Process Meta Language

**Projet :** Process Meta Language  
**Description :** Métalanguage Graphique pour Processus de Traçabilité

## 1. CONTEXTE ET VISION PRODUIT

### 1.1 Problème à résoudre
Les processus de traçabilité industrielle sont complexes et difficiles à documenter de manière standardisée. Il existe un besoin de créer une **correspondance directe** entre :
- **Représentation graphique intuitive** (diagrammes de processus)
- **Spécifications techniques standardisées** (documentation markdown structurée)

### 1.2 Vision produit
Créer un **système de métalanguage graphique** dans Obsidian Excalidraw qui permet de :
1. **Dessiner** des processus de traçabilité avec des formes standardisées
2. **Générer automatiquement** une documentation markdown consolidée et standardisée
3. **Préparer l'implémentation** de ces processus dans des plateformes de traçabilité (360SmartConnect et autres systèmes)

### 1.3 Utilisateurs cibles
- **Ingénieurs process** : Conception des workflows de traçabilité
- **Responsables qualité** : Validation et documentation des processus
- **Agents IA d'implémentation** : Consommation des spécifications pour déploiement automatique
- **Développeurs** : Utilisation des spécifications pour implémentation manuelle dans divers systèmes

## 2. SPÉCIFICATIONS FONCTIONNELLES

### 2.1 Composants du métalanguage

#### 2.1.1 OBJET (Hexagone)
**Représentation graphique :**
- Forme : Hexagone
- Taille standardisée : 120x80px
- Couleur fond + bordure selon type d'objet (configurable par projet)
- Texte : Nom de l'objet à l'intérieur

**Template markdown associé :**
```markdown
---
type: process-object
object-type: [Type d'objet selon nomenclature projet]
company: [Entreprise]
id: [Généré automatiquement]
---

# Objet : {Nom de l'objet}

## Type et Entreprise
- **Type d'objet** : {Type sélectionné dans nomenclature}
- **Entreprise** : {Entreprise responsable}

## Fichiers associés (Optionnel)
- {Liste des fichiers liés à cet objet}

## Historique
- {Ressource historique des modifications}

## Informations additionnelles
| Clef | Valeur | Type | Unité | Définition |
|------|--------|------|-------|------------|
| {clef1} | {valeur1} | {texte/nombre/booléen/date} | {unité} | {définition} |

## Références
- Référencement : `{nomObjet}.{clef}` utilisable dans actions/états/conditions
```

#### 2.1.2 ÉTAT (Fanion)
**Représentation graphique :**
- Forme : Fanion (superposé sur hexagone OBJET)
- Couleur unique pour tous les états
- Différenciation par nom affiché sur le fanion

**Architecture à deux niveaux d'actions :**
- **Action Principale** (OBLIGATOIRE) : Exposition des informations + navigation
- **Actions Secondaires** (OPTIONNELLES) : Actions métier effectives avec transitions

**Template markdown associé :**
```markdown
---
type: process-state
id: [auto-generated]
object-ref: [parent-object-id]
architecture: "two-level-actions"
---

# État : {Nom de l'état}

## Action Principale : {Nom Action Principale}
### Type
exposition-navigation

### Exposition des informations
| Donnée | Valeur | Source |
|--------|--------|--------|
| {propriété1} | {valeur1} | {nomObjet}.{propriété1} |
| {propriété2} | {valeur2} | {nomObjet}.{propriété2} |

### Navigation disponible
- **Actions secondaires possibles** : {liste auto-générée}
- **Permissions requises** : {rôles autorisés}

### API M2M
```json
GET /api/avatars/{object-id}/state
Response: {
  "current_state": "{Nom de l'état}",
  "state_data": { ... },
  "available_actions": [ ... ]
}
```

## Actions Secondaires

### Action : {Nom Action Secondaire 1}
**Type** : {manuelle|automatique|conditionnelle|contrôle|arrêt}

#### Exposition spécialisée
{Données contextuelles à cette action}

#### Capture de données
| Champ | Type | Obligatoire | Validation |
|-------|------|-------------|------------|
| {champ1} | {string|number|boolean|date} | {oui|non} | {règles} |

#### Workflow interne
{Si sous-actions présentes}
1. Sous-action : {nom1} → {objectif1}
2. Sous-action : {nom2} → {objectif2}
3. Sous-action : {nomN} → {objectifN}

#### Transition
- **État de destination** : {État cible}
- **Conditions** : {Critères de succès}
- **Échec** : {Gestion des erreurs}

#### API M2M
```json
POST /api/avatars/{object-id}/actions/{action-name}
Request: {
  "operator": { ... },
  "data": { ... },
  "context": { ... }
}
Response: {
  "success": true,
  "new_state": "{État cible}",
  "updated_data": { ... }
}
```

## Contrôles d'accès
- **Lecture** (Action Principale) : {rôles autorisés}
- **Écriture** (Actions Secondaires) : {rôles par action}

## Intégration Machine-to-Machine
### Déclencheurs automatiques
- **Conditions système** : {triggers basés sur données/temps}
- **Événements externes** : {webhooks entrants}

### Événements générés
- **Webhooks sortants** : {notifications lors des transitions}
- **Messages** : {événements pour bus de messages}

### Monitoring
- **Métriques** : Temps dans l'état, nombre de transitions
- **Logs** : Traçabilité des actions et opérateurs
```

**Référence architecture :** Voir document `Architecture-Etat-Actions-DeuxNiveaux.md` section 7.2

#### 2.1.3 ACTION (Rectangle arrondi)
**Représentation graphique :**
- Forme : Rectangle arrondi (140x60px)
- Couleur selon type d'action :
  - **Action Principale** : Couleur spécifique (toujours présente)
  - **Action Secondaire** : Couleurs différenciées selon type métier
  - **Sous-actions** : Couleurs dérivées de l'action parent
- Annotation visuelle si effets de bord
- Texte : Nom d'action à l'intérieur

**Hiérarchie des actions :**
1. **Action Principale** : Point d'entrée obligatoire (exposition + navigation)
2. **Actions Secondaires** : Actions métier optionnelles (capture + transition)
3. **Sous-actions** : Workflow interne des actions secondaires

**Template markdown associé :**
```markdown
---
type: process-action
action-level: [principale|secondaire|sous-action]
parent-action: [Si sous-action, référence vers parent]
id: [Généré automatiquement]
---

# Action : {Nom de l'action}

## Type et niveau d'action
{Action Principale / Action Secondaire / Sous-action de [parent]}

## Paramètres
### Paramètres d'entrée
{Ce qui est attendu en input}

### Paramètres de sortie
{Ce qui est produit en output}

## Relations
### État source
{État d'entrée - généré par flèches graphiques}

### État(s) de destination
{État(s) de sortie possible(s) - générés par flèches graphiques}

## Comportements
### Exposition d'information
{Comment l'action expose des données}

### Capture d'information
{Comment l'action collecte des données}

### Workflow interne (si applicable)
{Sous-actions et leur enchaînement}

## Intégration M2M
### Endpoint API
- **Type** : GET (principale) | POST (secondaire)
- **URL** : `/api/avatars/{id}/[state|actions/{action_name}]`

### Paramètres M2M
- `operator_type`: "human" | "system" | "robot"
- `automated_trigger`: true/false
- `context_data`: {objet JSON}

### Réponse attendue
```json
{
  "success": true,
  "new_state": "État_Cible",
  "updated_data": { ... },
  "next_actions": [ ... ]
}
```

## Déclencheurs automatiques
### Conditions système
{Triggers automatiques basés sur données/temps/événements}

### Intégrations tierces
{Webhooks entrants/sortants}
```

### 2.2 Système de configuration

#### 2.2.1 Configuration par projet
**Fichier : `config-projet.yaml`**
```yaml
# Configuration ProcessMetaLanguage v2.0 
# Référence: Architecture-Etat-Actions-DeuxNiveaux.md section 7.3
project:
  name: "Mon Projet Traçabilité"
  version: "2.0.0" 
  architecture: "two-level-actions"
  created: "2025-07-27"

# Types d'objets avec couleurs
types_objets:
  - couleur: "#E3F2FD"
    nom: "Matière première"
    description: "Matières brutes entrant dans le processus"
  - couleur: "#E8F5E8"
    nom: "Produit fini"
    description: "Produits finalisés prêts à livrer"
  - couleur: "#FFF3E0"
    nom: "Composant"
    description: "Éléments intermédiaires assemblés"

# Architecture des actions à deux niveaux
architecture_actions:
  action_principale:
    couleur: "#E8F4FD"
    obligatoire: true
    rôles: ["exposition", "navigation"]
    api_pattern: "GET /api/avatars/{id}/state"
    
  actions_secondaires:
    types:
      - nom: "Action Manuelle"
        couleur: "#FFF9C4"
        heritage: "secondaire"
        description: "Action nécessitant intervention humaine"
        api_pattern: "POST /api/avatars/{id}/actions/{name}"
      - nom: "Action Automatique"
        couleur: "#FFCDD2"
        heritage: "secondaire"
        description: "Action exécutée par système/machine"
        triggers_auto: true
      - nom: "Action Conditionnelle"
        couleur: "#F3E5F5"
        heritage: "secondaire"
        description: "Action selon critères/conditions"
        conditions_required: true
      - nom: "Point de contrôle"
        couleur: "#E1F5FE"
        heritage: "secondaire"
        description: "Validation avec 1 entrée → 1 sortie"
        validation_required: true
      - nom: "Point d'arrêt"
        couleur: "#FCE4EC"
        heritage: "secondaire"
        description: "Décision avec 1 entrée → N sorties"
        multiple_outputs: true

# Configuration état (couleur unique)
couleur_etat: "#BBE5FF"

# Intégration M2M
integration_m2m:
  api_base_url: "https://api.360smartconnect.com/v2"
  authentication: "bearer_token"
  webhook_endpoints:
    state_changed: "/webhooks/state-transition"
    action_completed: "/webhooks/action-result"
  event_bus:
    provider: "rabbitmq|kafka|azure_service_bus"
    topics: ["avatar.state.transition", "avatar.action.completed"]

# Tailles et styles graphiques
styles_graphiques:
  hexagone_objet: {largeur: 120, hauteur: 80}
  fanion_etat: {largeur: 80, hauteur: 40}
  action_principale: {largeur: 160, hauteur: 60, border_style: "bold"}
  action_secondaire: {largeur: 140, hauteur: 60, border_style: "normal"}
  sous_action: {largeur: 100, hauteur: 40, border_style: "dashed"}
```

### 2.3 Workflow de synchronisation

#### 2.3.1 Détection automatique
Le système doit détecter automatiquement :
- **Éléments taggés** : `#process-object`, `#process-state`, `#process-action`
- **Relations par flèches** : Connexions entre éléments taggés
- **Éléments non-taggés** : Documentation complémentaire

#### 2.3.2 Génération du workflow final
**Fichier de sortie : `workflow-final.md`**
```markdown
# Workflow de Traçabilité : {Nom du processus}

## Métadonnées
- **Projet** : {Nom du projet}
- **Version** : {Version}
- **Créé le** : {Date}
- **Dernière synchronisation** : {Date/heure}

## Vue d'ensemble
{Description générale du processus}

## Objets du processus
{Liste complète des objets avec leurs spécifications}

## États définis
{Liste complète des états avec leurs comportements}

## Actions disponibles
{Liste complète des actions avec leurs paramètres}

## Matrice des flux
{Représentation des transitions OBJET+ÉTAT → ACTION → OBJET+ÉTAT}

## Références croisées
{Index de toutes les références nomObjet.clef utilisées}

## Documentation complémentaire
{Éléments graphiques non-standardisés du canvas}

## Annexes pour implémentation
{Correspondances conceptuelles avec les APIs 360SmartConnect et autres systèmes - Voir détails dans `Architecture-Etat-Actions-DeuxNiveaux.md` sections 4-5}
```

**Référence architecture :** Voir document `Architecture-Etat-Actions-DeuxNiveaux.md` pour les spécifications complètes du workflow de synchronisation.

## 3. SPÉCIFICATIONS TECHNIQUES

### 3.1 Architecture système

#### 3.1.1 Technologies utilisées
- **Frontend** : Obsidian Excalidraw Plugin
- **Scripting** : ExcalidrawAutomate API + JavaScript
- **Configuration** : YAML
- **Templates** : Obsidian Templater Plugin
- **Output** : Markdown structuré

#### 3.1.2 APIs principales
**ExcalidrawAutomate :**
```javascript
// Exemple de création d'éléments standardisés
const ea = ExcalidrawAutomate;
ea.reset();

// Création hexagone OBJET
ea.style.strokeColor = "#E3F2FD";
ea.style.fillStyle = "solid";
ea.addRect(-60, -40, 120, 80); // Sera converti en hexagone
ea.addText(0, 0, "Nom Objet", {textAlign: "center"});

// Tags et métadonnées
ea.addMetadata("#process-object");
ea.addMetadata("object-type:matiere-premiere");

await ea.create();
```

**Obsidian API :**
```javascript
// Exemple de création de fichier markdown
const templateContent = await this.app.vault.read(templateFile);
const filledTemplate = templateContent
  .replace("{{nom}}", objectName)
  .replace("{{type}}", objectType);

await this.app.vault.create(
  `objects/${objectName}.md`, 
  filledTemplate
);
```

### 3.2 Fonctionnalités d'automation

#### 3.2.1 Scripts de création
- **Script création OBJET** : Création hexagone + fichier markdown
- **Script création ÉTAT** : Création fanion + fichier markdown  
- **Script création ACTION** : Création rectangle + fichier markdown

#### 3.2.2 Scripts de conversion
- **Conversion forme existante** : Transformation forme libre → composant taggé
- **Détection automatique** : Hexagone → OBJET, Rectangle → ACTION, etc.

#### 3.2.3 Script de synchronisation
- **Lecture canvas** : Analyse éléments taggés + relations
- **Mise à jour templates** : Synchronisation fichiers markdown
- **Génération workflow** : Compilation finale

## 4. CRITÈRES DE SUCCÈS

### 4.1 Critères fonctionnels
- ✅ Création de composants standardisés en 1 clic
- ✅ Conversion de formes existantes automatique
- ✅ Synchronisation graphique ↔ texte en 1 action
- ✅ Génération workflow final consolidé et standardisé
- ✅ Configuration par projet flexible
- ✅ Documentation prête pour implémentation par agents IA

### 4.2 Critères techniques
- ✅ Scripts ExcalidrawAutomate fonctionnels
- ✅ Templates Obsidian valides
- ✅ Configuration YAML bien formée
- ✅ Output markdown structuré conforme
- ✅ Performance acceptable (<5s pour synchronisation)

### 4.3 Critères d'adoption
- ✅ Interface intuitive pour utilisateurs non-techniques
- ✅ Documentation utilisateur complète
- ✅ Starter pack projet fonctionnel
- ✅ Exemples concrets industriels fournis

## 5. CONTRAINTES ET LIMITATIONS

### 5.1 Contraintes techniques
- Dépendance au plugin Excalidraw pour Obsidian
- Limitation à l'écosystème Obsidian
- Scripts JavaScript uniquement (pas de TypeScript compilé)

### 5.2 Limitations fonctionnelles
- Maximum 20 types d'objets par projet
- Maximum 50 types d'actions (incluant custom)
- Synchronisation manuelle (pas temps réel)

### 5.3 Prérequis
- Obsidian avec plugin Excalidraw installé
- Plugin Templater pour automation
- Connaissances de base en markdown pour utilisateurs

## 6. COMPATIBILITÉ POUR IMPLÉMENTATION

### 6.1 Scope et objectif
Le fichier markdown consolidé généré doit inclure toutes les informations nécessaires pour permettre à un agent IA d'implémentation de déployer le processus sur différentes plateformes, en priorité 360SmartConnect, mais aussi d'autres systèmes de traçabilité.

### 6.2 Correspondances conceptuelles avec 360SmartConnect

**Note :** Cette section documente les correspondances conceptuelles pour faciliter l'implémentation future par des agents IA. Le scope du ProcessMetaLanguage s'arrête à la génération de spécifications.

#### OBJET → Avatar 360SmartConnect
Correspondance documentée pour permettre la génération future de :
```json
{
  "name": "v0:TYPE_OBJET:{{OBJECT_NAME}}",
  "alphaId": "v0:TYPE_OBJET", 
  "generateMCFinger": "/api/fingers/[finger-id]",
  "generateMCQuantity": 1,
  "company": "/api/companies/[company-id]",
  "metadataAvatarType": "/api/metadata_avatar_types/[type-id]"
}
```

#### ÉTAT → Statut Avatar avec métadonnées
- Chaque état devient une propriété de métadonnée de l'avatar
- Horodatage automatique des changements d'état
- Traçabilité complète des transitions
- ACTION_PRINCIPALE → Point d'inspection (GET /api/avatars/{id}/state)
- ACTIONS_SECONDAIRES → Points d'interaction (POST /api/avatars/{id}/actions/{name})

#### ACTION → Points d'interaction API
- **Action Principale** → `GET /api/avatars/{id}/state` (Consultation)
- **Actions Secondaires** → `POST /api/avatars/{id}/actions/{name}` (Exécution)
- **Webhooks** → Événements de transition automatiques

### 6.3 Informations d'implémentation à inclure
Le fichier markdown final doit contenir :
1. **Mapping des types d'objets** vers les concepts 360SmartConnect
2. **Structure des métadonnées** pour chaque état
3. **Points d'intégration API** pour chaque action
4. **Règles de validation** et contraintes
5. **Données de test** suggérées

## RÉFÉRENCE ARCHITECTURE

**Document maître :** `Architecture-Etat-Actions-DeuxNiveaux.md`

Ce PRD est aligné sur l'architecture détaillée dans le document de référence qui contient :
- **Architecture conceptuelle complète** (sections 1-3)
- **Patterns d'intégration M2M** (section 4) 
- **Exemples concrets industriels** (section 6)
- **Templates markdown enrichis** (section 7.2)
- **Configuration YAML v2.0** (section 7.3)
- **Scripts d'automatisation** (section 8)
- **Intégrations systèmes** (section 9)

En cas de divergence, le document `Architecture-Etat-Actions-DeuxNiveaux.md` fait autorité.