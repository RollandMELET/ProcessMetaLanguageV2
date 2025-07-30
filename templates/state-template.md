---
# ProcessMetaLanguage State Template
state_id: "{{STATE_ID}}"
state_name: "{{STATE_NAME}}"
disposition: "{{DISPOSITION}}" # active, in_progress, destroyed, etc. (EPCIS 2.0)
disposition_description: "{{DISPOSITION_DESCRIPTION}}"
parent_object_id: "{{PARENT_OBJECT_ID}}"
parent_object_name: "{{PARENT_OBJECT_NAME}}"
created_at: "{{TIMESTAMP}}"
modified_at: "{{TIMESTAMP}}"
position:
  x: {{X_COORDINATE}}
  y: {{Y_COORDINATE}}
dimensions:
  width: 80
  height: 40
epcis_mapping:
  disposition: "{{DISPOSITION}}"
  business_step: "{{BUSINESS_STEP}}"
  business_location: "{{BUSINESS_LOCATION}}"
  event_time: "{{EVENT_TIME}}"
  event_time_zone_offset: "{{EVENT_TIMEZONE}}"
architecture_level: "state" # Architecture État-Actions deux niveaux
main_action:
  generated: true
  type: "data_exposition"
  name: "Consulter État {{STATE_NAME}}"
secondary_actions: []
process_tags:
  - "#process-state"
  - "#state-{{DISPOSITION}}"
  - "#state-{{STATE_NAME}}"
  - "#parent-object-{{PARENT_OBJECT_ID}}"
sync_status: "synchronized"
canvas_element_id: "{{CANVAS_ELEMENT_ID}}"
template_version: "1.0.0"
---

# État: {{STATE_NAME}}

## Description État
**État actuel:** {{STATE_NAME}}  
**Disposition EPCIS 2.0:** {{DISPOSITION}}  
**Description:** {{DISPOSITION_DESCRIPTION}}  
**Objet parent:** {{PARENT_OBJECT_NAME}} ({{PARENT_OBJECT_ID}})

## Architecture État-Actions Deux Niveaux

### 🔵 Action Principale (Automatique)
**Type:** Exposition de données  
**Nom:** Consulter État {{STATE_NAME}}  
**Description:** Action principale générée automatiquement pour tout état. Expose les données complètes de l'objet dans son état actuel.

#### Données Exposées
- **Métadonnées objet:** Identifiant, nom, type, relations
- **État actuel:** {{STATE_NAME}} ({{DISPOSITION}})
- **Historique:** Transitions précédentes et actions effectuées
- **Relations:** Objets parents/enfants liés
- **Conformité EPCIS:** Business step {{BUSINESS_STEP}}, disposition {{DISPOSITION}}

#### Navigation Actions Disponibles
{{#if AVAILABLE_SECONDARY_ACTIONS}}
Les actions secondaires suivantes sont disponibles depuis cet état:
{{#each AVAILABLE_SECONDARY_ACTIONS}}
- **{{this.name}}** → État cible: {{this.target_state}}
{{/each}}
{{else}}
Aucune action secondaire configurée. L'état est terminal ou en attente de configuration.
{{/if}}

### 🟡 Actions Secondaires (Optionnelles)
{{#if SECONDARY_ACTIONS}}
{{#each SECONDARY_ACTIONS}}
#### Action: {{this.name}}
- **Type:** {{this.type}}
- **Description:** {{this.description}}
- **État cible:** {{this.target_state}}
- **Disposition cible:** {{this.target_disposition}}
- **Workflow interne:** {{this.internal_workflow}}
- **Validation requise:** {{this.validation_required}}
- **Capture données:** {{this.data_capture}}

**Paramètres entrée:**
{{#if this.input_parameters}}
{{#each this.input_parameters}}
- {{@key}}: {{this.type}} - {{this.description}}
{{/each}}
{{else}}
Aucun paramètre requis
{{/if}}

**Transition vers:** État "{{this.target_state}}" avec disposition "{{this.target_disposition}}"
{{/each}}
{{else}}
*Aucune action secondaire définie pour cet état. Les actions secondaires sont optionnelles et permettent les transitions vers d'autres états avec capture de données.*
{{/if}}

## Métadonnées Techniques
- **ID unique état:** {{STATE_ID}}
- **ID élément canvas:** {{CANVAS_ELEMENT_ID}}
- **Position bannière:** ({{X_COORDINATE}}, {{Y_COORDINATE}})
- **Dimensions:** {{DIMENSIONS_WIDTH}}px × {{DIMENSIONS_HEIGHT}}px
- **Couleur disposition:** {{DISPOSITION_COLOR}}
- **Version template:** {{TEMPLATE_VERSION}}

## Conformité EPCIS 2.0
- **Disposition CBV 2.0:** {{DISPOSITION}}
- **Business Step actuel:** {{BUSINESS_STEP}}
- **Business Location:** {{BUSINESS_LOCATION}}
- **Event Time:** {{EVENT_TIME}}
- **Event Timezone:** {{EVENT_TIMEZONE}}
- **Conformité validée:** ✅ EPCIS 2.0 CBV

## Historique Transitions
| Date | État Précédent | Action | État Actuel | Opérateur |
|------|----------------|--------|-------------|-----------|
| {{TIMESTAMP}} | {{PREVIOUS_STATE}} | {{TRANSITION_ACTION}} | {{STATE_NAME}} | {{OPERATOR}} |

## Relations Hiérarchiques

### Objet Parent
- **ID:** {{PARENT_OBJECT_ID}}
- **Nom:** {{PARENT_OBJECT_NAME}}
- **Type:** {{PARENT_OBJECT_TYPE}}
- **Lien:** [[{{PARENT_OBJECT_NAME}}]]

### États Liés
{{#if RELATED_STATES}}
{{#each RELATED_STATES}}
- **État {{this.relation_type}}:** {{this.state_name}} ({{this.disposition}})
{{/each}}
{{else}}
- Aucun état lié défini
{{/if}}

## Règles de Transition

### Transitions Autorisées Depuis Cet État
{{#if ALLOWED_TRANSITIONS}}
{{#each ALLOWED_TRANSITIONS}}
- **Vers:** {{this.target_state}}
  - **Conditions:** {{this.conditions}}
  - **Business Step:** {{this.business_step}}
  - **Validation:** {{this.validation_type}}
{{/each}}
{{else}}
*État terminal - Aucune transition autorisée*
{{/if}}

### Contraintes Business
{{#if BUSINESS_CONSTRAINTS}}
{{#each BUSINESS_CONSTRAINTS}}
- {{this.description}}
{{/each}}
{{else}}
- Aucune contrainte business spécifique
{{/if}}

## Correspondances 360SmartConnect

### État Avatar
```json
{
  "avatar_id": "{{AVATAR_ID}}",
  "current_state": {
    "state_id": "{{STATE_ID}}",
    "state_name": "{{STATE_NAME}}",
    "disposition": "{{DISPOSITION}}",
    "entered_at": "{{TIMESTAMP}}",
    "metadata": {{STATE_METADATA}}
  }
}
```

### API Endpoints États
```json
{
  "get_state": "/api/avatars/{{AVATAR_ID}}/states/{{STATE_ID}}",
  "get_state_data": "/api/avatars/{{AVATAR_ID}}/states/{{STATE_ID}}/data",
  "list_actions": "/api/avatars/{{AVATAR_ID}}/states/{{STATE_ID}}/actions",
  "execute_action": "/api/avatars/{{AVATAR_ID}}/states/{{STATE_ID}}/actions/execute",
  "get_transitions": "/api/avatars/{{AVATAR_ID}}/states/{{STATE_ID}}/transitions"
}
```

## Données Spécifiques État
{{#if STATE_SPECIFIC_DATA}}
### Données Contextuelles
{{#each STATE_SPECIFIC_DATA}}
- **{{@key}}:** {{this}}
{{/each}}
{{else}}
*Aucune donnée spécifique à cet état*
{{/if}}

## Configuration Visuelle
- **Couleur bannière:** {{BANNER_COLOR}}
- **Couleur texte:** {{TEXT_COLOR}}
- **Style bordure:** {{BORDER_STYLE}}
- **Offset vertical:** {{VERTICAL_OFFSET}}px
- **Z-index:** {{Z_INDEX}}

## Validation et Synchronisation
- **Dernière synchronisation:** {{LAST_SYNC}}
- **Statut synchronisation:** {{SYNC_STATUS}}
- **Validation architecture:** ✅ Deux niveaux (État + Actions)
- **Validation EPCIS:** ✅ Disposition CBV 2.0
- **Intégrité relations:** {{RELATIONS_INTEGRITY}}

---

*Template État ProcessMetaLanguage - Architecture État-Actions Deux Niveaux*  
*Version: {{TEMPLATE_VERSION}}*  
*Généré: {{GENERATION_TIMESTAMP}}*