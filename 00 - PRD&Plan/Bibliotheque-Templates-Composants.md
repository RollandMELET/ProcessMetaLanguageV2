# Bibliothèque de Templates de Composants - ProcessMetaLanguage

**Document :** Bibliothèque Templates  
**Projet :** Process Meta Language  
**Version :** 1.0.0  
**Date :** 2025-07-27  
**Auteur :** Rolland MELET & Agent IA  
**Référence :** Architecture-Etat-Actions-DeuxNiveaux.md

---

## 1. INTRODUCTION

### 1.1 Objectif
Définir une bibliothèque standardisée de templates de composants (États et Actions) réutilisables, incluant l'intégration complète du vocabulaire EPCIS 2.0 de GS1 pour assurer la compatibilité avec les standards de traçabilité industrielle.

### 1.2 Gestion des templates
La bibliothèque supporte trois modes de création/gestion :
1. **Création from scratch** : Nouveau template entièrement personnalisé
2. **Duplication** : Copie d'un template existant avec modifications
3. **Héritage** : Extension d'un template parent avec propriétés ajoutées

---

## 2. TEMPLATES D'ÉTATS

### 2.1 États de Base

#### 2.1.1 TEMPLATE : État Initial
```yaml
template_id: "state_initial"
type: "state_template"
name: "État Initial"
description: "État de démarrage d'un objet dans le processus"
category: "base"
heritage: null

# Configuration graphique
visual:
  color: "#E8F5E8"
  icon: "▶️"
  border_style: "bold"

# Action principale automatique
action_principale:
  name: "Consulter_Initial"
  exposition:
    - propriété: "date_creation"
      source: "{nomObjet}.date_creation"
    - propriété: "statut_initial"
      source: "active"
  navigation:
    actions_secondaires: []  # Défini lors de l'instanciation

# Métadonnées EPCIS 2.0
epcis_mapping:
  bizStep: "commissioning"  # CBV: création d'objet
  disposition: "active"     # CBV: état actif
  eventType: "ObjectEvent"
  action: "ADD"

# Template markdown
markdown_template: |
  # État : État Initial - {nom_objet}
  
  ## Action Principale : Consulter_Initial
  ### Exposition des informations
  | Donnée | Valeur | Source |
  |--------|--------|--------|
  | Date création | {date_creation} | {nomObjet}.date_creation |
  | Statut initial | Active | Système |
  
  ### Navigation disponible
  - Actions secondaires : {liste_actions}
  
  ## Correspondance EPCIS 2.0
  - **Business Step** : commissioning (création d'objet)
  - **Disposition** : active (objet actif)
  - **Event Type** : ObjectEvent
```

#### 2.1.2 TEMPLATE : État Rebut
```yaml
template_id: "state_rebut"
type: "state_template"
name: "État Rebut"
description: "État terminal pour objets non conformes ou défaillants"
category: "terminal"
heritage: null

# Configuration graphique
visual:
  color: "#FFCDD2"
  icon: "❌"
  border_style: "solid"

# Action principale automatique
action_principale:
  name: "Consulter_Rebut"
  exposition:
    - propriété: "date_rebut"
      source: "{nomObjet}.date_rebut"
    - propriété: "raison_rebut"
      source: "{nomObjet}.raison_rebut"
    - propriété: "operateur_rebut"
      source: "{nomObjet}.operateur_rebut"
  navigation:
    actions_secondaires: []  # État terminal

# Métadonnées EPCIS 2.0
epcis_mapping:
  bizStep: "decommissioning"  # CBV: suppression d'objet
  disposition: "destroyed"    # CBV: détruit/inutilisable
  eventType: "ObjectEvent"
  action: "DELETE"

# Template markdown
markdown_template: |
  # État : Rebut - {nom_objet}
  
  ## Action Principale : Consulter_Rebut
  ### Exposition des informations
  | Donnée | Valeur | Source |
  |--------|--------|--------|
  | Date rebut | {date_rebut} | {nomObjet}.date_rebut |
  | Raison | {raison_rebut} | {nomObjet}.raison_rebut |
  | Opérateur | {operateur_rebut} | {nomObjet}.operateur_rebut |
  
  ### Navigation disponible
  - **État terminal** : Aucune action disponible
  
  ## Correspondance EPCIS 2.0
  - **Business Step** : decommissioning (suppression d'objet)
  - **Disposition** : destroyed (détruit)
  - **Event Type** : ObjectEvent
```

---

## 3. TEMPLATES D'ACTIONS

### 3.1 Actions de Base

#### 3.1.1 TEMPLATE : Point de Contrôle
```yaml
template_id: "action_point_controle"
type: "action_template"
name: "Point de Contrôle"
description: "Action de validation avec 1 entrée → 1 sortie"
category: "validation"
heritage: null

# Configuration graphique
visual:
  color: "#E1F5FE"
  icon: "🔍"
  border_style: "solid"

# Paramètres d'action
parameters:
  niveau: "secondaire"
  type_action: "Point de contrôle"
  
  # Exposition
  exposition:
    - propriété: "criteres_controle"
      description: "Critères de validation à vérifier"
    - propriété: "historique_controles"
      description: "Historique des contrôles précédents"
  
  # Capture
  capture:
    - champ: "resultat_controle"
      type: "boolean"
      obligatoire: true
      validation: "true|false"
    - champ: "observations"
      type: "string"
      obligatoire: false
      validation: "max_length:500"
    - champ: "operateur"
      type: "string"
      obligatoire: true
      validation: "user_id"

  # Transitions possibles
  transitions:
    - condition: "resultat_controle == true"
      etat_cible: "Controle_OK"
    - condition: "resultat_controle == false"
      etat_cible: "Controle_KO"

# Métadonnées EPCIS 2.0
epcis_mapping:
  bizStep: "inspecting"      # CBV: inspection/contrôle
  disposition: "in_progress" # CBV: en cours
  eventType: "ObjectEvent"
  action: "OBSERVE"

# API M2M
api_template:
  method: "POST"
  endpoint: "/api/avatars/{id}/actions/point_controle"
  request_schema:
    operator:
      type: "human|system|robot"
      id: "string"
    measurements:
      resultat_controle: "boolean"
      observations: "string"
    context:
      criteres: "object"
  response_schema:
    success: "boolean"
    new_state: "string"
    control_result: "boolean"

# Template markdown
markdown_template: |
  # Action : Point de Contrôle - {nom_action}
  
  ## Type et niveau d'action
  Action Secondaire - Point de contrôle
  
  ## Exposition spécialisée
  - **Critères de contrôle** : {criteres_controle}
  - **Historique contrôles** : {historique_controles}
  
  ## Capture de données
  | Champ | Type | Obligatoire | Validation |
  |-------|------|-------------|------------|
  | resultat_controle | boolean | oui | true/false |
  | observations | string | non | max 500 caractères |
  | operateur | string | oui | user_id valide |
  
  ## Transitions
  - **Si conforme** → État "Controle_OK"
  - **Si non conforme** → État "Controle_KO"
  
  ## Correspondance EPCIS 2.0
  - **Business Step** : inspecting (contrôle qualité)
  - **Disposition** : in_progress (en cours)
  - **Event Type** : ObjectEvent
```

#### 3.1.2 TEMPLATE : Point d'Arrêt
```yaml
template_id: "action_point_arret"
type: "action_template"
name: "Point d'Arrêt"
description: "Action de décision avec 1 entrée → N sorties possibles"
category: "decision"
heritage: null

# Configuration graphique
visual:
  color: "#FCE4EC"
  icon: "🔀"
  border_style: "solid"

# Paramètres d'action
parameters:
  niveau: "secondaire"
  type_action: "Point d'arrêt"
  
  # Exposition
  exposition:
    - propriété: "options_disponibles"
      description: "Liste des orientations possibles"
    - propriété: "criteres_decision"
      description: "Critères pour chaque orientation"
  
  # Capture
  capture:
    - champ: "decision"
      type: "enum"
      obligatoire: true
      validation: "options_predefinies"
    - champ: "justification"
      type: "string"
      obligatoire: false
      validation: "max_length:200"
    - champ: "operateur"
      type: "string"
      obligatoire: true
      validation: "user_id"

  # Transitions multiples (configurées par instance)
  transitions: []  # Défini lors de l'instanciation

# Métadonnées EPCIS 2.0
epcis_mapping:
  bizStep: "other"          # CBV: autre processus
  disposition: "in_progress" # CBV: en cours
  eventType: "ObjectEvent"
  action: "OBSERVE"

# Template markdown
markdown_template: |
  # Action : Point d'Arrêt - {nom_action}
  
  ## Type et niveau d'action
  Action Secondaire - Point d'arrêt (décision multiple)
  
  ## Exposition spécialisée
  - **Options disponibles** : {options_disponibles}
  - **Critères de décision** : {criteres_decision}
  
  ## Capture de données
  | Champ | Type | Obligatoire | Validation |
  |-------|------|-------------|------------|
  | decision | enum | oui | options prédéfinies |
  | justification | string | non | max 200 caractères |
  | operateur | string | oui | user_id valide |
  
  ## Transitions
  {transitions_configurees}
  
  ## Correspondance EPCIS 2.0
  - **Business Step** : other (processus spécialisé)
  - **Disposition** : in_progress (en cours)
  - **Event Type** : ObjectEvent
```

#### 3.1.3 TEMPLATE : Transfert d'Information
```yaml
template_id: "action_transfert_info"
type: "action_template"
name: "Transfert d'Information"
description: "Action d'échange de données entre systèmes ou acteurs"
category: "communication"
heritage: null

# Configuration graphique
visual:
  color: "#F3E5F5"
  icon: "📡"
  border_style: "dashed"

# Paramètres d'action
parameters:
  niveau: "secondaire"
  type_action: "Transfert d'information"
  
  # Exposition
  exposition:
    - propriété: "donnees_disponibles"
      description: "Données disponibles pour transfert"
    - propriété: "destinataires"
      description: "Systèmes/acteurs destinataires"
  
  # Capture
  capture:
    - champ: "donnees_transferees"
      type: "object"
      obligatoire: true
      validation: "json_valid"
    - champ: "destinataire"
      type: "string"
      obligatoire: true
      validation: "system_id"
    - champ: "mode_transfert"
      type: "enum"
      obligatoire: true
      validation: "api|webhook|file|manual"

  # Transitions
  transitions:
    - condition: "transfert_success == true"
      etat_cible: "Info_Transferee"
    - condition: "transfert_success == false"
      etat_cible: "Transfert_Echec"

# Métadonnées EPCIS 2.0
epcis_mapping:
  bizStep: "other"          # CBV: processus personnalisé
  disposition: "in_transit" # CBV: en transit (données)
  eventType: "ObjectEvent"
  action: "OBSERVE"

# Template markdown
markdown_template: |
  # Action : Transfert d'Information - {nom_action}
  
  ## Type et niveau d'action
  Action Secondaire - Transfert d'information
  
  ## Exposition spécialisée
  - **Données disponibles** : {donnees_disponibles}
  - **Destinataires** : {destinataires}
  
  ## Capture de données
  | Champ | Type | Obligatoire | Validation |
  |-------|------|-------------|------------|
  | donnees_transferees | object | oui | JSON valide |
  | destinataire | string | oui | system_id valide |
  | mode_transfert | enum | oui | api/webhook/file/manual |
  
  ## Transitions
  - **Si succès** → État "Info_Transferee"
  - **Si échec** → État "Transfert_Echec"
  
  ## Correspondance EPCIS 2.0
  - **Business Step** : other (processus personnalisé)
  - **Disposition** : in_transit (en transit)
  - **Event Type** : ObjectEvent
```

#### 3.1.4 TEMPLATE : RAZ de l'Objet
```yaml
template_id: "action_raz_objet"
type: "action_template"
name: "RAZ de l'Objet"
description: "Remise à zéro des propriétés d'un objet"
category: "maintenance"
heritage: null

# Configuration graphique
visual:
  color: "#FFF9C4"
  icon: "🔄"
  border_style: "solid"

# Paramètres d'action
parameters:
  niveau: "secondaire"
  type_action: "RAZ objet"
  
  # Exposition
  exposition:
    - propriété: "proprietes_actuelles"
      description: "État actuel des propriétés"
    - propriété: "proprietes_par_defaut"
      description: "Valeurs par défaut"
  
  # Capture
  capture:
    - champ: "proprietes_a_reset"
      type: "array"
      obligatoire: true
      validation: "property_names"
    - champ: "confirmation"
      type: "boolean"
      obligatoire: true
      validation: "true"
    - champ: "operateur"
      type: "string"
      obligatoire: true
      validation: "user_id"

  # Transitions
  transitions:
    - condition: "reset_success == true"
      etat_cible: "Objet_RAZ"

# Métadonnées EPCIS 2.0
epcis_mapping:
  bizStep: "other"          # CBV: processus spécialisé
  disposition: "active"     # CBV: actif après RAZ
  eventType: "ObjectEvent"
  action: "OBSERVE"

# Template markdown
markdown_template: |
  # Action : RAZ de l'Objet - {nom_action}
  
  ## Type et niveau d'action
  Action Secondaire - Remise à zéro objet
  
  ## Exposition spécialisée
  - **Propriétés actuelles** : {proprietes_actuelles}
  - **Propriétés par défaut** : {proprietes_par_defaut}
  
  ## Capture de données
  | Champ | Type | Obligatoire | Validation |
  |-------|------|-------------|------------|
  | proprietes_a_reset | array | oui | noms propriétés valides |
  | confirmation | boolean | oui | true obligatoire |
  | operateur | string | oui | user_id valide |
  
  ## Transitions
  - **Si succès** → État "Objet_RAZ"
  
  ## Correspondance EPCIS 2.0
  - **Business Step** : other (processus spécialisé)
  - **Disposition** : active (objet actif)
  - **Event Type** : ObjectEvent
```

#### 3.1.5 TEMPLATE : Assemblage d'Objet
```yaml
template_id: "action_assemblage_objet"
type: "action_template"
name: "Assemblage d'Objet"
description: "Regroupement de plusieurs objets en un objet parent"
category: "aggregation"
heritage: null

# Configuration graphique
visual:
  color: "#E8F4FD"
  icon: "📦"
  border_style: "solid"

# Paramètres d'action
parameters:
  niveau: "secondaire"
  type_action: "Assemblage objet"
  
  # Exposition
  exposition:
    - propriété: "objets_disponibles"
      description: "Objets disponibles pour assemblage"
    - propriété: "regles_assemblage"
      description: "Règles et contraintes d'assemblage"
  
  # Capture
  capture:
    - champ: "objets_enfants"
      type: "array"
      obligatoire: true
      validation: "object_ids"
    - champ: "objet_parent"
      type: "string"
      obligatoire: true
      validation: "object_id"
    - champ: "operateur"
      type: "string"
      obligatoire: true
      validation: "user_id"

  # Transitions
  transitions:
    - condition: "assemblage_success == true"
      etat_cible: "Objet_Assemble"

# Métadonnées EPCIS 2.0
epcis_mapping:
  bizStep: "packing"        # CBV: emballage/assemblage
  disposition: "active"     # CBV: actif
  eventType: "AggregationEvent"
  action: "ADD"

# Template markdown
markdown_template: |
  # Action : Assemblage d'Objet - {nom_action}
  
  ## Type et niveau d'action
  Action Secondaire - Assemblage d'objets
  
  ## Exposition spécialisée
  - **Objets disponibles** : {objets_disponibles}
  - **Règles d'assemblage** : {regles_assemblage}
  
  ## Capture de données
  | Champ | Type | Obligatoire | Validation |
  |-------|------|-------------|------------|
  | objets_enfants | array | oui | object_ids valides |
  | objet_parent | string | oui | object_id valide |
  | operateur | string | oui | user_id valide |
  
  ## Transitions
  - **Si succès** → État "Objet_Assemble"
  
  ## Correspondance EPCIS 2.0
  - **Business Step** : packing (assemblage)
  - **Disposition** : active (objet actif)
  - **Event Type** : AggregationEvent
```

---

## 4. BIBLIOTHÈQUE EPCIS 2.0 COMPLÈTE

### 4.1 Actions basées sur les Business Steps EPCIS 2.0

Basé sur les 41 business steps du CBV 2.0 :  description: "Vendu au détail"
  
disposition_returned:
  value: "returned"
  description: "Objet retourné"
  
disposition_sellable_accessible:
  value: "sellable_accessible"
  description: "Vendable et accessible"
  
disposition_sellable_not_accessible:
  value: "sellable_not_accessible"
  description: "Vendable mais non accessible"
  
disposition_stolen:
  value: "stolen"
  description: "Objet volé"
  
disposition_unknown:
  value: "unknown"
  description: "État inconnu"
```

---

## 5. SYSTÈME DE GESTION DES TEMPLATES

### 5.1 Structure de Fichiers

```
/Templates/
├── /States/
│   ├── /Base/
│   │   ├── state_initial.yaml
│   │   ├── state_rebut.yaml
│   │   └── state_terminal.yaml
│   ├── /EPCIS/
│   │   ├── state_active.yaml
│   │   ├── state_in_transit.yaml
│   │   └── state_destroyed.yaml
│   └── /Custom/
│       └── [templates utilisateur]
├── /Actions/
│   ├── /Base/
│   │   ├── action_point_controle.yaml
│   │   ├── action_point_arret.yaml
│   │   ├── action_transfert_info.yaml
│   │   ├── action_raz_objet.yaml
│   │   └── action_assemblage_objet.yaml
│   ├── /EPCIS/
│   │   ├── action_receiving.yaml
│   │   ├── action_shipping.yaml
│   │   ├── action_packing.yaml
│   │   ├── action_inspecting.yaml
│   │   └── [tous les 41 business steps]
│   └── /Custom/
│       └── [templates utilisateur]
└── /Config/
    ├── template_registry.yaml
    └── inheritance_rules.yaml
```

### 5.2 Modes de Création

#### 5.2.1 Création From Scratch
```yaml
# Interface de création nouveau template
create_template:
  mode: "from_scratch"
  type: "action_template|state_template"
  
  # Informations de base
  metadata:
    name: "Nom du template"
    description: "Description détaillée"
    category: "custom"
    author: "user_id"
    created_date: "2025-07-27"
  
  # Configuration graphique
  visual:
    color: "#hexcolor"
    icon: "emoji_or_symbol"
    border_style: "solid|dashed|bold"
  
  # Spécifique selon type
  parameters: {}
  
  # Correspondance EPCIS (optionnelle)
  epcis_mapping:
    bizStep: "other"
    disposition: "active"
    eventType: "ObjectEvent"
```

#### 5.2.2 Duplication
```yaml
# Duplication d'un template existant
duplicate_template:
  mode: "duplicate"
  source_template_id: "action_point_controle"
  
  # Modifications à apporter
  modifications:
    name: "Point de Contrôle Qualité"
    description: "Version spécialisée pour contrôle qualité"
    visual:
      color: "#E8F5E8"  # Nouvelle couleur
    parameters:
      capture:
        - champ: "niveau_qualite"
          type: "enum"
          obligatoire: true
          validation: "A|B|C|D"
```

#### 5.2.3 Héritage
```yaml
# Héritage d'un template parent
inherit_template:
  mode: "inherit"
  parent_template_id: "action_point_controle"
  
  # Extensions ajoutées
  extensions:
    # Propriétés ajoutées (conserve celles du parent)
    parameters:
      capture:
        # Ajoute aux champs existants
        - champ: "temperature_ambiante"
          type: "number"
          obligatoire: false
          validation: "range:-10,50"
    
    # Nouvelle correspondance EPCIS
    epcis_mapping:
      bizStep: "inspecting"
      disposition: "in_progress"
      
  # Surcharges (remplace celles du parent)
  overrides:
    visual:
      icon: "🌡️"  # Nouveau icône
```

### 5.3 Interface de Gestion

#### 5.3.1 Commandes de Base
```javascript
// API de gestion des templates
const templateManager = {
  
  // Lister tous les templates
  listTemplates: (type = null, category = null) => {
    // Retourne liste filtrée
  },
  
  // Créer nouveau template
  createTemplate: (mode, config) => {
    // from_scratch | duplicate | inherit
  },
  
  // Instancier template dans le canvas
  instantiateTemplate: (templateId, position, customParams) => {
    // Crée l'élément graphique + fichier markdown
  },
  
  // Modifier template existant
  editTemplate: (templateId, modifications) => {
    // Met à jour le template
  },
  
  // Supprimer template
  deleteTemplate: (templateId) => {
    // Supprime avec vérifications dépendances
  }
};
```

#### 5.3.2 Validation et Cohérence
```yaml
# Règles de validation
validation_rules:
  
  # Templates d'États
  state_template:
    required_fields: ["name", "action_principale", "visual"]
    visual:
      color: "hex_color"
      icon: "single_emoji_or_symbol"
    action_principale:
      required: true
      name: "string_non_empty"
      exposition: "array"
  
  # Templates d'Actions  
  action_template:
    required_fields: ["name", "parameters", "visual"]
    parameters:
      niveau: "principale|secondaire|sous-action"
      type_action: "string"
      capture: "array"
      transitions: "array"
  
  # Correspondance EPCIS
  epcis_mapping:
    bizStep: "valid_cbv_business_step"
    disposition: "valid_cbv_disposition"
    eventType: "ObjectEvent|AggregationEvent|TransformationEvent|TransactionEvent|AssociationEvent"
    action: "ADD|DELETE|OBSERVE"
```

---

## 6. INTÉGRATION AVEC LE MÉTALANGUAGE

### 6.1 Utilisation dans Excalidraw

#### 6.1.1 Palette de Templates
```javascript
// Extension ExcalidrawAutomate pour templates
const templatePalette = {
  
  // Afficher palette de templates
  showTemplatePalette: () => {
    const palette = createPaletteUI();
    palette.addSection("États de Base", baseStateTemplates);
    palette.addSection("Actions de Base", baseActionTemplates);
    palette.addSection("EPCIS 2.0", epcisTemplates);
    palette.addSection("Mes Templates", userTemplates);
    return palette;
  },
  
  // Drag & Drop depuis palette
  onTemplateDrop: (templateId, position) => {
    const template = templateRegistry.get(templateId);
    const instance = instantiateTemplate(template, position);
    return instance;
  }
};
```

#### 6.1.2 Propriétés Contextuelles
```javascript
// Interface de configuration d'instance
const instanceConfig = {
  
  // Configurer instance créée
  configureInstance: (elementId, templateId) => {
    const template = templateRegistry.get(templateId);
    const configPanel = createConfigPanel(template);
    
    // Champs spécifiques au template
    template.parameters.capture?.forEach(field => {
      configPanel.addField(field);
    });
    
    // Correspondance EPCIS
    if (template.epcis_mapping) {
      configPanel.addEPCISSection(template.epcis_mapping);
    }
    
    return configPanel;
  }
};
```

### 6.2 Génération Markdown Enrichie

#### 6.2.1 Templates Markdown Dynamiques
```javascript
// Générateur markdown basé sur templates
const markdownGenerator = {
  
  generateFromTemplate: (templateId, instanceData) => {
    const template = templateRegistry.get(templateId);
    let markdown = template.markdown_template;
    
    // Substitution des variables
    Object.keys(instanceData).forEach(key => {
      const regex = new RegExp(`{${key}}`, 'g');
      markdown = markdown.replace(regex, instanceData[key]);
    });
    
    // Ajout correspondance EPCIS
    if (template.epcis_mapping) {
      markdown += generateEPCISSection(template.epcis_mapping);
    }
    
    return markdown;
  }
};
```

---

## 7. MIGRATION ET ÉVOLUTION

### 7.1 Versioning des Templates
```yaml
# Système de versions
template_versioning:
  schema_version: "1.0.0"
  
  # Compatibilité descendante
  backward_compatibility:
    - from: "0.9.x"
      to: "1.0.0"
      migration_script: "migrate_0_9_to_1_0.js"
  
  # Évolution EPCIS
  epcis_updates:
    current_version: "2.0"
    auto_update: true
    fallback_bizstep: "other"
```

### 7.2 Import/Export
```yaml
# Formats d'échange
exchange_formats:
  
  # Export
  export:
    - format: "yaml"
      description: "Format natif du système"
    - format: "json"
      description: "Échange avec systèmes tiers"
    - format: "epcis_json"
      description: "Format EPCIS 2.0 natif"
  
  # Import
  import:
    - format: "yaml"
      validation: "strict"
    - format: "json"
      validation: "with_schema"
    - format: "epcis_events"
      conversion: "auto_template_generation"
```

---

## 8. EXEMPLES D'UTILISATION

### 8.1 Cas d'Usage : Processus Alimentaire

```yaml
# Template spécialisé héritage
template_controle_haccp:
  mode: "inherit"
  parent: "action_inspecting"
  
  extensions:
    parameters:
      capture:
        - champ: "temperature"
          type: "number"
          obligatoire: true
          validation: "range:-20,60"
        - champ: "ph_level"
          type: "number"
          obligatoire: true
          validation: "range:0,14"
        - champ: "haccp_compliance"
          type: "boolean"
          obligatoire: true
  
  epcis_mapping:
    bizStep: "inspecting"
    disposition: "active"
    eventType: "ObjectEvent"
    # Extensions EPCIS 2.0 pour food safety
    sensorData:
      - type: "temperature"
        uom: "celsius"
      - type: "ph"
        uom: "ph_units"
```

### 8.2 Cas d'Usage : Logistique

```yaml
# Template duplication personnalisée
template_expedition_express:
  mode: "duplicate"
  source: "action_shipping"
  
  modifications:
    name: "Expédition Express"
    parameters:
      capture:
        - champ: "service_level"
          type: "enum"
          validation: "express_24h|express_48h|standard"
        - champ: "tracking_number"
          type: "string"
          obligatoire: true
        - champ: "insurance_value"
          type: "number"
          obligatoire: false
    
    transitions:
      - condition: "service_level == 'express_24h'"
        etat_cible: "En_Transit_Express"
      - condition: "service_level != 'express_24h'"
        etat_cible: "En_Transit_Standard"
```

---

**Bibliothèque de Templates Complète - Prête pour implémentation ProcessMetaLanguage**