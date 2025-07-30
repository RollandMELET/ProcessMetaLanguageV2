---
# ProcessMetaLanguage Action Template
action_id: "{{ACTION_ID}}"
action_name: "{{ACTION_NAME}}"
action_type: "{{ACTION_TYPE}}" # main_action, secondary_action, workflow_action, api_action
action_category: "{{ACTION_CATEGORY}}" # data_exposition, data_capture, state_transition, validation, transformation
parent_state_id: "{{PARENT_STATE_ID}}"
parent_state_name: "{{PARENT_STATE_NAME}}"
parent_object_id: "{{PARENT_OBJECT_ID}}"
source_state: "{{SOURCE_STATE}}"
target_state: "{{TARGET_STATE}}"
target_disposition: "{{TARGET_DISPOSITION}}"
created_at: "{{TIMESTAMP}}"
modified_at: "{{TIMESTAMP}}"
position:
  x: {{X_COORDINATE}}
  y: {{Y_COORDINATE}}
dimensions:
  width: 140
  height: 60
epcis_mapping:
  business_step: "{{BUSINESS_STEP}}"
  disposition: "{{TARGET_DISPOSITION}}"
  business_location: "{{BUSINESS_LOCATION}}"
  event_time: "{{EVENT_TIME}}"
  event_time_zone_offset: "{{EVENT_TIMEZONE}}"
  action_type: "{{EPCIS_ACTION_TYPE}}"
input_parameters: {{INPUT_PARAMETERS}}
output_parameters: {{OUTPUT_PARAMETERS}}
workflow_internal: {{WORKFLOW_INTERNAL}}
validation_rules: {{VALIDATION_RULES}}
api_specifications: {{API_SPECIFICATIONS}}
process_tags:
  - "#process-action"
  - "#action-{{ACTION_TYPE}}"
  - "#action-{{ACTION_NAME}}"
  - "#parent-state-{{PARENT_STATE_ID}}"
sync_status: "synchronized"
canvas_element_id: "{{CANVAS_ELEMENT_ID}}"
template_version: "1.0.0"
---

# Action: {{ACTION_NAME}}

## Description Action
**Nom:** {{ACTION_NAME}}  
**Type:** {{ACTION_TYPE}} ({{ACTION_CATEGORY}})  
**État source:** {{SOURCE_STATE}}  
**État cible:** {{TARGET_STATE}} ({{TARGET_DISPOSITION}})  
**Objet parent:** {{PARENT_OBJECT_ID}}

## Paramètres d'Entrée
{{#if INPUT_PARAMETERS}}
### Paramètres Requis
{{#each INPUT_PARAMETERS.required}}
- **{{this.name}}** (`{{this.type}}`) 
  - **Description:** {{this.description}}
  - **Validation:** {{this.validation}}
  - **Exemple:** `{{this.example}}`
{{/each}}

### Paramètres Optionnels
{{#if INPUT_PARAMETERS.optional}}
{{#each INPUT_PARAMETERS.optional}}
- **{{this.name}}** (`{{this.type}}`) *[Optionnel]*
  - **Description:** {{this.description}}
  - **Valeur par défaut:** `{{this.default}}`
  - **Exemple:** `{{this.example}}`
{{/each}}
{{else}}
*Aucun paramètre optionnel*
{{/if}}
{{else}}
*Aucun paramètre d'entrée requis pour cette action*
{{/if}}

## Paramètres de Sortie
{{#if OUTPUT_PARAMETERS}}
### Données Retournées
{{#each OUTPUT_PARAMETERS.success}}
- **{{this.name}}** (`{{this.type}}`)
  - **Description:** {{this.description}}
  - **Condition:** {{this.condition}}
  - **Format:** {{this.format}}
{{/each}}

### Métadonnées Générées
{{#if OUTPUT_PARAMETERS.metadata}}
{{#each OUTPUT_PARAMETERS.metadata}}
- **{{this.name}}:** {{this.description}}
{{/each}}
{{else}}
*Aucune métadonnée spécifique générée*
{{/if}}
{{else}}
*Cette action ne retourne pas de données spécifiques*
{{/if}}

## Workflow Interne
{{#if WORKFLOW_INTERNAL}}
### Étapes d'Exécution
{{#each WORKFLOW_INTERNAL.steps}}
{{@index}}. **{{this.name}}**
   - **Action:** {{this.action}}
   - **Description:** {{this.description}}
   - **Condition:** {{this.condition}}
   - **Timeout:** {{this.timeout}}s
   - **Gestion erreur:** {{this.error_handling}}
{{/each}}

### Transitions d'État
- **État initial:** {{WORKFLOW_INTERNAL.initial_state}}
- **États intermédiaires:** 
{{#each WORKFLOW_INTERNAL.intermediate_states}}
  - {{this.name}} ({{this.duration}}s max)
{{/each}}
- **État final:** {{WORKFLOW_INTERNAL.final_state}}

### Rollback et Compensation
{{#if WORKFLOW_INTERNAL.rollback}}
- **Support rollback:** {{WORKFLOW_INTERNAL.rollback.supported}}
- **Stratégie:** {{WORKFLOW_INTERNAL.rollback.strategy}}
- **Actions compensation:** 
{{#each WORKFLOW_INTERNAL.rollback.compensation_actions}}
  - {{this}}
{{/each}}
{{else}}
*Aucune stratégie de rollback définie*
{{/if}}
{{else}}
*Workflow simple sans étapes complexes*
{{/if}}

## Règles de Validation
{{#if VALIDATION_RULES}}
### Validations Pré-Exécution
{{#each VALIDATION_RULES.pre_execution}}
- **{{this.name}}:** {{this.description}}
  - **Règle:** {{this.rule}}
  - **Message erreur:** {{this.error_message}}
  - **Criticité:** {{this.severity}}
{{/each}}

### Validations Post-Exécution
{{#if VALIDATION_RULES.post_execution}}
{{#each VALIDATION_RULES.post_execution}}
- **{{this.name}}:** {{this.description}}
  - **Règle:** {{this.rule}}
  - **Action si échec:** {{this.failure_action}}
{{/each}}
{{else}}
*Aucune validation post-exécution*
{{/if}}

### Contraintes Business
{{#if VALIDATION_RULES.business_constraints}}
{{#each VALIDATION_RULES.business_constraints}}
- {{this.description}} ({{this.type}})
{{/each}}
{{else}}
*Aucune contrainte business spécifique*
{{/if}}
{{else}}
*Aucune règle de validation spécifiée*
{{/if}}

## Spécifications API
{{#if API_SPECIFICATIONS}}
### Endpoint REST
```http
{{API_SPECIFICATIONS.method}} {{API_SPECIFICATIONS.endpoint}}
Content-Type: application/json
Authorization: Bearer {{API_TOKEN}}
```

### Schéma de Requête
```json
{{API_SPECIFICATIONS.request_schema}}
```

### Schéma de Réponse
#### Succès (200)
```json
{{API_SPECIFICATIONS.response_success_schema}}
```

#### Erreur (4xx/5xx)
```json
{{API_SPECIFICATIONS.response_error_schema}}
```

### Codes de Réponse
{{#each API_SPECIFICATIONS.response_codes}}
- **{{this.code}}:** {{this.description}}
{{/each}}

### Authentification
- **Type:** {{API_SPECIFICATIONS.auth_type}}
- **Scope requis:** {{API_SPECIFICATIONS.auth_scope}}
- **Rate limiting:** {{API_SPECIFICATIONS.rate_limit}} req/min
{{else}}
*Cette action n'expose pas d'API REST directe*
{{/if}}

## Métadonnées Techniques
- **ID unique action:** {{ACTION_ID}}
- **ID élément canvas:** {{CANVAS_ELEMENT_ID}}
- **Position rectangle:** ({{X_COORDINATE}}, {{Y_COORDINATE}})
- **Dimensions:** {{DIMENSIONS_WIDTH}}px × {{DIMENSIONS_HEIGHT}}px
- **Couleur action:** {{ACTION_COLOR}}
- **Version template:** {{TEMPLATE_VERSION}}

## Conformité EPCIS 2.0
- **Business Step:** {{BUSINESS_STEP}}
- **Action Type:** {{EPCIS_ACTION_TYPE}}
- **Business Location:** {{BUSINESS_LOCATION}}
- **Event Time:** {{EVENT_TIME}}
- **Event Timezone:** {{EVENT_TIMEZONE}}
- **Conformité validée:** ✅ EPCIS 2.0

## Historique Exécutions
| Date | Utilisateur | Paramètres | Résultat | Durée | État Final |
|------|-------------|------------|----------|-------|------------|
| {{TIMESTAMP}} | {{OPERATOR}} | {{EXECUTION_PARAMS}} | {{RESULT}} | {{DURATION}}ms | {{FINAL_STATE}} |

## Correspondances 360SmartConnect

### Action Avatar
```json
{
  "avatar_id": "{{AVATAR_ID}}",
  "action": {
    "action_id": "{{ACTION_ID}}",
    "action_name": "{{ACTION_NAME}}",
    "action_type": "{{ACTION_TYPE}}",
    "source_state": "{{SOURCE_STATE}}",
    "target_state": "{{TARGET_STATE}}",
    "parameters": {{INPUT_PARAMETERS}},
    "workflow": {{WORKFLOW_INTERNAL}}
  }
}
```

### API Endpoints Actions
```json
{
  "execute_action": "/api/avatars/{{AVATAR_ID}}/actions/{{ACTION_ID}}/execute",
  "validate_action": "/api/avatars/{{AVATAR_ID}}/actions/{{ACTION_ID}}/validate",
  "get_action_history": "/api/avatars/{{AVATAR_ID}}/actions/{{ACTION_ID}}/history",
  "get_action_schema": "/api/avatars/{{AVATAR_ID}}/actions/{{ACTION_ID}}/schema",
  "simulate_action": "/api/avatars/{{AVATAR_ID}}/actions/{{ACTION_ID}}/simulate"
}
```

## Métriques et Performance
- **Temps exécution moyen:** {{AVERAGE_EXECUTION_TIME}}ms
- **Taux de succès:** {{SUCCESS_RATE}}%
- **Rollbacks effectués:** {{ROLLBACK_COUNT}}
- **Dernière optimisation:** {{LAST_OPTIMIZATION}}

## Sécurité et Permissions
{{#if SECURITY_RULES}}
### Permissions Requises
{{#each SECURITY_RULES.permissions}}
- **{{this.name}}:** {{this.description}}
  - **Scope:** {{this.scope}}
  - **Niveau:** {{this.level}}
{{/each}}

### Audit et Logging
- **Audit activé:** {{SECURITY_RULES.audit_enabled}}
- **Données loggées:** {{SECURITY_RULES.logged_data}}
- **Rétention logs:** {{SECURITY_RULES.log_retention}} jours
{{else}}
*Aucune règle de sécurité spécifique définie*
{{/if}}

## Configuration Visuelle
- **Couleur rectangle:** {{RECTANGLE_COLOR}}
- **Couleur texte:** {{TEXT_COLOR}}
- **Style bordure:** {{BORDER_STYLE}}
- **Coin arrondi:** {{BORDER_RADIUS}}px
- **Z-index:** {{Z_INDEX}}

## Débogage et Tests
### Tests Unitaires
{{#if UNIT_TESTS}}
{{#each UNIT_TESTS}}
- **{{this.name}}:** {{this.description}}
  - **Statut:** {{this.status}}
  - **Couverture:** {{this.coverage}}%
{{/each}}
{{else}}
*Aucun test unitaire défini*
{{/if}}

### Tests d'Intégration
{{#if INTEGRATION_TESTS}}
{{#each INTEGRATION_TESTS}}
- **{{this.name}}:** {{this.description}}
  - **Environnement:** {{this.environment}}
  - **Dernier résultat:** {{this.last_result}}
{{/each}}
{{else}}
*Aucun test d'intégration défini*
{{/if}}

## Validation et Synchronisation
- **Dernière synchronisation:** {{LAST_SYNC}}
- **Statut synchronisation:** {{SYNC_STATUS}}
- **Validation paramètres:** ✅ Schémas validés
- **Validation workflow:** ✅ Étapes cohérentes
- **Validation API:** {{API_VALIDATION_STATUS}}

---

*Template Action ProcessMetaLanguage - Paramètres + Workflow + API*  
*Version: {{TEMPLATE_VERSION}}*  
*Généré: {{GENERATION_TIMESTAMP}}*