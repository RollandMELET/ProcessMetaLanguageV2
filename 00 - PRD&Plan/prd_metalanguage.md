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

### 2.1 Composants du métalanguage et système de templates

Le ProcessMetaLanguage intègre une **bibliothèque de templates standardisés** permettant la création rapide et cohérente de composants. Cette bibliothèque inclut l'intégration complète du standard **EPCIS 2.0 de GS1** pour la compatibilité avec les systèmes de traçabilité industrielle.

**Référence complète :** Voir document `Bibliotheque-Templates-Composants.md` pour les spécifications détaillées des templates.

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
template_source: [Template utilisé si applicable]
---

# Objet : {Nom de l'objet}

## Type et Entreprise
- **Type d'objet** : {Type sélectionné dans nomenclature}
- **Entreprise** : {Entreprise responsable}
- **Template source** : {Template de base si utilisé}

## Fichiers associés (Optionnel)
- {Liste des fichiers liés à cet objet}

## Historique
- {Ressource historique des modifications}

## Informations additionnelles
| Clef | Valeur | Type | Unité | Définition |
|------|--------|------|-------|------------|
| {clef1} | {valeur1} | {texte/nombre/booléen/date} | {unité} | {définition} |

## Correspondance EPCIS 2.0
- **Identifier Pattern** : {Format GS1 pour cet objet}
- **Object Class** : {Classe d'objet selon CBV}

## Références
- Référencement : `{nomObjet}.{clef}` utilisable dans actions/états/conditions
```

**Templates disponibles :** Le système propose des templates d'objets prédéfinis selon les types d'objets industriels standards et la nomenclature EPCIS 2.0.

#### 2.1.2 ÉTAT (Fanion)
**Représentation graphique :**
- Forme : Fanion (superposé sur hexagone OBJET)
- Couleur unique pour tous les états
- Différenciation par nom affiché sur le fanion

**Architecture à deux niveaux d'actions :**
- **Action Principale** (OBLIGATOIRE) : Exposition des informations + navigation
- **Actions Secondaires** (OPTIONNELLES) : Actions métier effectives avec transitions

**Bibliothèque de templates d'états :**
- **États de base** : État Initial, État Rebut, États terminaux
- **États EPCIS 2.0** : Basés sur les 25+ dispositions CBV (active, in_transit, destroyed, etc.)
- **États personnalisés** : Créés par duplication ou héritage

**Template markdown associé :**
```markdown
---
type: process-state
id: [auto-generated]
object-ref: [parent-object-id]
architecture: "two-level-actions"
template_source: [Template utilisé si applicable]
epcis_bizstep: [Business step EPCIS si applicable]
epcis_disposition: [Disposition EPCIS si applicable]
---

# État : {Nom de l'état}

## Template Source
- **Template utilisé** : {Template de base}
- **Personnalisations** : {Modifications apportées}

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

## Correspondance EPCIS 2.0 (si applicable)
- **Business Step** : {epcis_bizstep}
- **Disposition** : {epcis_disposition}
- **Event Type** : {type d'événement EPCIS}
- **Action** : {ADD|DELETE|OBSERVE}
```

**Templates d'états disponibles :**
- **État Initial** : commissioning/active (template prêt à l'emploi)
- **État Rebut** : decommissioning/destroyed (template prêt à l'emploi)
- **41 templates EPCIS 2.0** : Basés sur les business steps CBV
- **Création personnalisée** : From scratch, duplication, héritage

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

**Bibliothèque de templates d'actions :**
- **Actions de base** : Point de contrôle, Point d'arrêt, Transfert d'information, RAZ objet, Assemblage
- **41 actions EPCIS 2.0** : Tous les business steps CBV (receiving, shipping, packing, inspecting, etc.)
- **Actions personnalisées** : Créées par duplication ou héritage des templates existants

**Template markdown associé :**
```markdown
---
type: process-action
action-level: [principale|secondaire|sous-action]
parent-action: [Si sous-action, référence vers parent]
template_source: [Template utilisé si applicable]
epcis_bizstep: [Business step EPCIS si applicable]
id: [Généré automatiquement]
---

# Action : {Nom de l'action}

## Template Source
- **Template utilisé** : {Template de base}
- **Type EPCIS** : {Business step CBV si applicable}
- **Personnalisations** : {Modifications apportées}

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

## Correspondance EPCIS 2.0 (si applicable)
- **Business Step** : {epcis_bizstep}
- **Disposition** : {disposition résultante}
- **Event Type** : {ObjectEvent|AggregationEvent|TransformationEvent|etc.}
- **Action** : {ADD|DELETE|OBSERVE}
```

**Templates d'actions disponibles :**
- **Point de Contrôle** : Template validé (inspecting/in_progress)
- **Point d'Arrêt** : Template de décision multiple
- **Transfert d'Information** : Template de communication
- **RAZ Objet** : Template de remise à zéro
- **Assemblage d'Objet** : Template d'agrégation (packing/active)
- **41 templates EPCIS 2.0** : receiving, shipping, packing, inspecting, storing, etc.
- **Gestion des templates** : Création from scratch, duplication, héritage

**Référence complète :** Voir document `Bibliotheque-Templates-Composants.md` pour tous les templates disponibles.

### 2.2 Système de configuration et templates

#### 2.2.1 Configuration par projet avec bibliothèque de templates
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

# Bibliothèque de templates
templates:
  enabled: true
  
  # Templates d'états
  state_templates:
    - id: "state_initial"
      name: "État Initial"
      epcis_mapping: {bizStep: "commissioning", disposition: "active"}
    - id: "state_rebut"
      name: "État Rebut"
      epcis_mapping: {bizStep: "decommissioning", disposition: "destroyed"}
  
  # Templates d'actions de base
  action_templates:
    - id: "action_point_controle"
      name: "Point de Contrôle"
      epcis_mapping: {bizStep: "inspecting", disposition: "in_progress"}
    - id: "action_point_arret"
      name: "Point d'Arrêt"
      epcis_mapping: {bizStep: "other", disposition: "in_progress"}
    - id: "action_transfert_info"
      name: "Transfert d'Information"
      epcis_mapping: {bizStep: "other", disposition: "in_transit"}
    - id: "action_raz_objet"
      name: "RAZ de l'Objet"
      epcis_mapping: {bizStep: "other", disposition: "active"}
    - id: "action_assemblage_objet"
      name: "Assemblage d'Objet"
      epcis_mapping: {bizStep: "packing", disposition: "active"}
  
  # Templates EPCIS 2.0 (41 business steps)
  epcis_templates:
    auto_import: true
    cbv_version: "2.0"
    include_all_bizsteps: true
  
  # Gestion des templates personnalisés
  custom_templates:
    creation_modes: ["from_scratch", "duplicate", "inherit"]
    validation: "strict"
    versioning: true
```

**Référence complète :** Voir document `Bibliotheque-Templates-Composants.md` pour la liste exhaustive des templates et leur gestion.

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

#### 3.2.1 Scripts de création avec templates
- **Script création OBJET** : Création hexagone + fichier markdown (avec templates optionnels)
- **Script création ÉTAT** : Création fanion + fichier markdown (avec bibliothèque templates d'états)
- **Script création ACTION** : Création rectangle + fichier markdown (avec bibliothèque EPCIS 2.0)
- **Palette de templates** : Interface ExcalidrawAutomate pour sélection rapide
- **Configuration d'instance** : Personnalisation des templates instanciés

#### 3.2.2 Scripts de conversion et gestion de templates
- **Conversion forme existante** : Transformation forme libre → composant taggé
- **Détection automatique** : Hexagone → OBJET, Rectangle → ACTION, etc.
- **Gestion de templates** : Création, duplication, héritage de templates
- **Validation EPCIS** : Vérification conformité CBV 2.0

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
- ✅ Bibliothèque de templates EPCIS 2.0 complète (41 business steps + 25 dispositions)
- ✅ Gestion avancée des templates (création/duplication/héritage)

### 4.2 Critères techniques
- ✅ Scripts ExcalidrawAutomate fonctionnels
- ✅ Templates Obsidian valides
- ✅ Configuration YAML bien formée
- ✅ Output markdown structuré conforme
- ✅ Performance acceptable (<5s pour synchronisation)
- ✅ Templates EPCIS 2.0 validés et conformes CBV
- ✅ Interface de gestion de templates fonctionnelle

### 4.3 Critères d'adoption
- ✅ Interface intuitive pour utilisateurs non-techniques
- ✅ Documentation utilisateur complète
- ✅ Starter pack projet fonctionnel
- ✅ Exemples concrets industriels fournis
- ✅ Palette de templates accessible et intuitive
- ✅ Documentation templates complète et exemples d'usage

## 5. CONTRAINTES ET LIMITATIONS

### 5.1 Contraintes techniques
- Dépendance au plugin Excalidraw pour Obsidian
- Limitation à l'écosystème Obsidian
- Scripts JavaScript uniquement (pas de TypeScript compilé)

### 5.2 Limitations fonctionnelles
- Maximum 20 types d'objets par projet
- Maximum 50 types d'actions custom (hors bibliothèque EPCIS 2.0)
- Synchronisation manuelle (pas temps réel)
- Templates EPCIS limités à la version CBV 2.0

### 5.3 Prérequis
- Obsidian avec plugin Excalidraw installé
- Plugin Templater pour automation
- Connaissances de base en markdown pour utilisateurs
- Compréhension optionnelle des standards EPCIS 2.0 pour l'utilisation avancée des templates

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

---

## RÉFÉRENCE BIBLIOTHÈQUE DE TEMPLATES

**Document maître :** `Bibliotheque-Templates-Composants.md`

Cette bibliothèque complète le ProcessMetaLanguage avec :
- **Templates d'États** : État Initial, État Rebut + 25 dispositions EPCIS 2.0
- **Templates d'Actions de Base** : Point de contrôle, Point d'arrêt, Transfert d'information, RAZ objet, Assemblage
- **Intégration EPCIS 2.0 complète** : 41 business steps CBV standardisés
- **Système de gestion** : Création from scratch, duplication, héritage
- **Interface ExcalidrawAutomate** : Palette de templates et configuration d'instances
- **Exemples d'usage** : Processus alimentaire HACCP, logistique express

---

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

En cas de divergence, les documents `Architecture-Etat-Actions-DeuxNiveaux.md` et `Bibliotheque-Templates-Composants.md` font autorité.

---

## 10. Historique des Révisions

| Version | Date       | Auteur           | Description de la Révision                                     |
| :------ | :--------- | :--------------- | :------------------------------------------------------------- |
| 1.0.0   | 2025-07-27 | Agent IA PRD Expert | Régénération complète du PRD selon format expert avec intégration de l'architecture État-Actions à deux niveaux, bibliothèque de templates EPCIS 2.0 complète, et patterns d'intégration M2M. Consolidation des décisions prises dans les documents de référence. |

---

## 11. Références et Documents Associés

### 11.1. Documents de Référence Maîtres
* **`Architecture-Etat-Actions-DeuxNiveaux.md`** : Spécification complète de l'architecture conceptuelle à deux niveaux (901 lignes)
  * Sections 1-3 : Architecture conceptuelle et composants
  * Section 4 : Patterns d'intégration Machine-to-Machine
  * Sections 6-9 : Exemples industriels et implémentation technique

* **`Bibliotheque-Templates-Composants.md`** : Spécification complète de la bibliothèque de templates (988 lignes)
  * Section 2 : 25+ templates d'états basés sur les dispositions EPCIS 2.0
  * Section 3 : 41+ templates d'actions basés sur les business steps CBV 2.0
  * Section 4 : Système de gestion avancée (création, duplication, héritage)
  * Section 5 : Interface ExcalidrawAutomate et exemples industriels

### 11.2. Correspondances Techniques
* **Standard GS1 EPCIS 2.0** : Référence complète pour tous les templates et correspondances industrielles
* **Core Business Vocabulary (CBV) 2.0** : Vocabulaire standardisé intégré dans la bibliothèque de templates
* **API 360SmartConnect** : Correspondances techniques pour l'implémentation automatique

### 11.3. Hiérarchie des Documents
En cas de divergence entre les documents, l'ordre de priorité suivant s'applique :
1. **Architecture-Etat-Actions-DeuxNiveaux.md** : Autorité sur l'architecture conceptuelle
2. **Bibliotheque-Templates-Composants.md** : Autorité sur les templates et leur gestion
3. **PRD-ProcessMetaLanguage-1.0.0.md** (ce document) : Consolidation et vision produit

---

## 12. Annexes Techniques

### 12.1. Exemples de Configuration YAML v2.0
Référence complète dans `Architecture-Etat-Actions-DeuxNiveaux.md` section 7.3 :
```yaml
# Configuration ProcessMetaLanguage v2.0 - Architecture Deux Niveaux
project:
  name: "Processus Traçabilité Alimentaire"
  version: "2.0.0"
  architecture: "two-level-actions"
  epcis_compliance: true

architecture_actions:
  action_principale:
    obligatoire: true
    api_pattern: "GET /api/avatars/{id}/state"
  actions_secondaires:
    api_pattern: "POST /api/avatars/{id}/actions/{name}"
    
templates:
  epcis_templates:
    auto_import: true
    cbv_version: "2.0"
    include_all_bizsteps: true
```

### 12.2. Templates Markdown de Référence
Les templates complets sont spécifiés dans `Bibliotheque-Templates-Composants.md` sections 2.1-3.2, incluant :
* Templates d'états avec action principale automatique
* Templates d'actions avec workflows internes
* Correspondances EPCIS 2.0 complètes
* Exemples d'usage industriels (HACCP, logistique, manufacturing)

### 12.3. Patterns d'Intégration M2M
Architecture complète documentée dans `Architecture-Etat-Actions-DeuxNiveaux.md` section 4 :
* Polling pattern pour systèmes legacy
* Webhook pattern pour intégrations temps réel
* Event-driven pattern pour architectures microservices
* Correspondances directes avec l'écosystème 360SmartConnect

---

## 13. Scope et Limitations du Projet

### 13.1. Scope Inclus
* ✅ Métalanguage graphique standardisé dans Obsidian Excalidraw
* ✅ Architecture État-Actions à deux niveaux complète
* ✅ Bibliothèque de templates EPCIS 2.0 (41 business steps + 25 dispositions)
* ✅ Système de gestion avancée des templates (création/duplication/héritage)
* ✅ Synchronisation bidirectionnelle graphique ↔ markdown
* ✅ Génération de documentation consolidée prête pour implémentation
* ✅ Correspondances techniques avec 360SmartConnect et autres systèmes
* ✅ Patterns d'intégration Machine-to-Machine

### 13.2. Scope Exclu (Hors Périmètre)
* ❌ Implémentation effective dans les systèmes de traçabilité
* ❌ Développement d'APIs ou de backends de traçabilité
* ❌ Interface web ou mobile pour utilisation des processus
* ❌ Système de monitoring ou d'analytics des processus déployés
* ❌ Formation des utilisateurs finaux des systèmes de traçabilité

### 13.3. Livrable Final
Le livrable principal du ProcessMetaLanguage est un **fichier Markdown consolidé et standardisé** généré à partir du diagramme visuel, contenant toutes les spécifications nécessaires pour l'implémentation par :
* Des agents IA d'implémentation automatique
* Des développeurs pour implémentation manuelle
* Des équipes qualité pour validation et audit

Ce fichier servira de **source unique de vérité** pour toute implémentation ultérieure dans les systèmes de traçabilité cibles.

---

<!-- END OF FILE: PRD-ProcessMetaLanguage-1.0.0.md -->