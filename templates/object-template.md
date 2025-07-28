---
# ProcessMetaLanguage Object Template
object_id: "{{OBJECT_ID}}"
object_name: "{{OBJECT_NAME}}"
object_type: "{{OBJECT_TYPE}}" # raw-material, product, container, equipment, document, location, batch, custom
created_at: "{{TIMESTAMP}}"
modified_at: "{{TIMESTAMP}}"
position: 
  x: {{X_COORDINATE}}
  y: {{Y_COORDINATE}}
dimensions:
  width: 120
  height: 80
epcis_mapping:
  epc: "urn:epc:id:sgtin:{{COMPANY}}.{{PRODUCT}}.{{SERIAL}}"
  parent_id: "{{PARENT_OBJECT_ID}}"
  child_ids: []
  business_step: "{{BUSINESS_STEP}}"
  disposition: "{{DISPOSITION}}"
process_tags:
  - "#process-object"
  - "#object-{{OBJECT_TYPE}}"
  - "#object-{{OBJECT_NAME}}"
  - "#object-id-{{OBJECT_ID}}"
sync_status: "synchronized"
canvas_element_id: "{{CANVAS_ELEMENT_ID}}"
template_version: "1.0.0"
---

# Object: {{OBJECT_NAME}}

## Description
{{OBJECT_DESCRIPTION}}

**Type d'objet:** {{OBJECT_TYPE}}  
**Description type:** {{OBJECT_TYPE_DESCRIPTION}}

## État Actuel
**État actuel:** {{CURRENT_STATE}}  
**Dernière modification:** {{MODIFIED_AT}}  
**Statut synchronisation:** {{SYNC_STATUS}}

## Métadonnées Techniques
- **Type:** {{OBJECT_TYPE}}
- **Position canvas:** ({{X_COORDINATE}}, {{Y_COORDINATE}})
- **Dimensions:** {{DIMENSIONS_WIDTH}}px × {{DIMENSIONS_HEIGHT}}px
- **ID unique:** {{OBJECT_ID}}
- **ID élément canvas:** {{CANVAS_ELEMENT_ID}}
- **Version template:** {{TEMPLATE_VERSION}}

## Conformité EPCIS 2.0
- **EPC:** {{EPC}}
- **Société:** {{COMPANY}}
- **Produit:** {{PRODUCT}}
- **Numéro de série:** {{SERIAL}}
- **Business Step:** {{BUSINESS_STEP}}
- **Disposition:** {{DISPOSITION}}

## Historique États
| Date | État | Action | Utilisateur | Business Step |
|------|------|--------|-------------|---------------|
| {{TIMESTAMP}} | {{INITIAL_STATE}} | Creation | System | receiving |

## Relations Hiérarchiques
### Objet Parent
{{#if PARENT_OBJECT_ID}}
- **Parent ID:** {{PARENT_OBJECT_ID}}
- **Relation:** Conteneur/Assemblage
{{else}}
- **Parent:** Aucun (objet racine)
{{/if}}

### Objets Enfants
{{#if CHILD_IDS}}
{{#each CHILD_IDS}}
- **Enfant:** {{this}}
{{/each}}
{{else}}
- **Enfants:** Aucun
{{/if}}

## Actions Disponibles
### 🔵 Actions Principales (Toujours disponibles)
- **Consulter état actuel**
  - Affichage métadonnées complètes
  - Historique des modifications
  - Relations parent/enfant
  
- **Voir historique complet**
  - Chronologie des états
  - Traçabilité des actions
  - Audit trail EPCIS 2.0

### 🟡 Actions Secondaires (Contextuelles)
{{#if AVAILABLE_ACTIONS}}
{{#each AVAILABLE_ACTIONS}}
- **{{this.name}}**
  - Description: {{this.description}}
  - Prérequis: {{this.prerequisites}}
  - État cible: {{this.target_state}}
{{/each}}
{{else}}
- **Modifier métadonnées**
  - Mise à jour propriétés objet
  - Validation conformité EPCIS
  - Synchronisation automatique
  
- **Créer transition**
  - Définir nouvel état
  - Configurer action déclencheur
  - Valider workflow business
  
- **Ajouter relation**
  - Lier objet parent/enfant
  - Définir type de relation
  - Mettre à jour hiérarchie
{{/if}}

## Correspondances 360SmartConnect
- **Avatar ID:** {{AVATAR_ID}}
- **Company ID:** {{COMPANY_ID}}
- **API Endpoint:** `/api/avatars/{{AVATAR_ID}}`
- **Webhook URL:** `{{WEBHOOK_URL}}`

### Mapping API Endpoints
```json
{
  "get_object": "/api/avatars/{{AVATAR_ID}}",
  "update_object": "/api/avatars/{{AVATAR_ID}}",
  "get_history": "/api/avatars/{{AVATAR_ID}}/history",
  "create_transition": "/api/avatars/{{AVATAR_ID}}/transitions",
  "get_children": "/api/avatars/{{AVATAR_ID}}/children",
  "get_parent": "/api/avatars/{{AVATAR_ID}}/parent"
}
```

## Métadonnées Utilisateur
{{#if USER_METADATA}}
{{#each USER_METADATA}}
- **{{@key}}:** {{this}}
{{/each}}
{{else}}
*Aucune métadonnée utilisateur définie*
{{/if}}

## Configuration Canvas
- **Couleur fond:** {{BACKGROUND_COLOR}}
- **Couleur bordure:** {{STROKE_COLOR}}
- **Épaisseur bordure:** {{STROKE_WIDTH}}px
- **Taille police:** {{FONT_SIZE}}px
- **Famille police:** {{FONT_FAMILY}}

## Validation et Conformité
- **Conformité EPCIS 2.0:** ✅ Validé
- **Structure template:** ✅ Conforme v1.0.0
- **Synchronisation canvas:** {{SYNC_STATUS}}
- **Dernière validation:** {{VALIDATION_TIMESTAMP}}

---

*Template généré automatiquement par ProcessMetaLanguage*  
*Version template: {{TEMPLATE_VERSION}}*  
*Date génération: {{GENERATION_TIMESTAMP}}*