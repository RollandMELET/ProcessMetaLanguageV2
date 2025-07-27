# Architecture État-Actions à Deux Niveaux - ProcessMetaLanguage

**Document :** Architecture État-Actions à Deux Niveaux  
**Projet :** Process Meta Language  
**Version :** 1.0.0  
**Date :** 2025-07-27  
**Auteur :** Rolland MELET & Agent IA  

---

## 1. INTRODUCTION ET VISION

### 1.1 Objectif du document
Ce document détaille l'architecture conceptuelle retenue pour le ProcessMetaLanguage, basée sur un **modèle État-Actions à deux niveaux** optimisé pour les processus de traçabilité industrielle et l'intégration Machine-to-Machine (M2M).

### 1.2 Principe fondamental
**Un ÉTAT possède TOUJOURS une ACTION PRINCIPALE et peut avoir plusieurs ACTIONS SECONDAIRES optionnelles**, chacune pouvant mener à des états différents selon la logique métier.

### 1.3 Compatibilité 360SmartConnect
Cette architecture est conçue pour s'intégrer naturellement avec l'écosystème 360SmartConnect :
- **Avatar** = OBJET tracé
- **État Avatar** = ÉTAT avec ses données
- **Finger/API** = Points d'interaction (Actions)

---

## 2. ARCHITECTURE CONCEPTUELLE

### 2.1 Vue d'ensemble

```
OBJET (Avatar 360SmartConnect)
├── ÉTAT_ACTUEL
│   ├── 🔵 ACTION_PRINCIPALE (OBLIGATOIRE)
│   │   ├── Exposition des données d'état
│   │   └── Navigation vers actions disponibles
│   │
│   ├── 🟡 ACTION_SECONDAIRE_1 (OPTIONNELLE)
│   │   ├── Exposition + Capture de données
│   │   ├── Workflow interne (sous-actions)
│   │   └── → Transition vers ÉTAT_CIBLE_1
│   │
│   └── 🟡 ACTION_SECONDAIRE_N (OPTIONNELLE)
│       ├── Exposition + Capture de données
│       ├── Workflow interne (sous-actions)
│       └── → Transition vers ÉTAT_CIBLE_N
│
└── DONNÉES_OBJET (Métadonnées + Historique)
```

### 2.2 Cardinalités et relations

| Composant | Cardinalité | Rôle |
|-----------|-------------|------|
| OBJET → ÉTAT | 1:1 | Un objet a toujours exactement un état actuel |
| ÉTAT → ACTION_PRINCIPALE | 1:1 | Chaque état a obligatoirement une action principale |
| ÉTAT → ACTIONS_SECONDAIRES | 1:N | Un état peut avoir 0 à N actions secondaires |
| ACTION_SECONDAIRE → ÉTAT_CIBLE | 1:1 | Chaque action secondaire mène à un état précis |
| ACTION → SOUS_ACTIONS | 1:N | Une action peut avoir un workflow interne |

---

## 3. DÉTAIL DES COMPOSANTS

### 3.1 OBJET (Hexagone - Avatar 360SmartConnect)

#### Caractéristiques
- **Représentation graphique** : Hexagone coloré selon type
- **Données persistantes** : Métadonnées, historique, propriétés métier
- **État actuel** : Référence vers l'état en cours
- **Identité unique** : ID système + identifiants métier

#### Responsabilités
- Maintenir les données de l'entité tracée
- Conserver l'historique des transitions d'état
- Exposer les propriétés via la syntaxe `{nomObjet}.{propriété}`

#### Mapping 360SmartConnect
```json
{
  "avatar_id": "uuid-unique",
  "name": "v0:TYPE_OBJET:NOM_INSTANCE",
  "current_state": "état_actuel",
  "metadata": {
    "propriété1": "valeur1",
    "propriété2": "valeur2"
  },
  "state_history": [ ... ]
}
```

### 3.2 ÉTAT (Fanion - État Avatar)

#### Caractéristiques
- **Représentation graphique** : Fanion superposé sur l'hexagone objet
- **Couleur unique** : Tous les états ont la même couleur
- **Nom descriptif** : Verbe ou phrase décrivant la condition

#### Responsabilités
- Définir les données exposables dans ce contexte
- Lister les actions possibles depuis cet état
- Contrôler l'accès aux fonctionnalités selon les permissions

#### Architecture interne
```
ÉTAT "En_Production"
├── 🔵 ACTION_PRINCIPALE "Consulter_Production"
│   ├── Exposer : données de production, qualité, temps
│   └── Menu : [Contrôler_Qualité, Expédier, Maintenance]
│
├── 🟡 ACTION_SECONDAIRE "Contrôler_Qualité"
│   ├── Exposer : critères qualité, historique contrôles
│   ├── Capturer : résultats mesures, observations
│   ├── Sous-actions : [Mesurer_Température, Vérifier_Dimensions]
│   └── → Transition vers "Contrôle_OK" ou "Contrôle_KO"
│
└── 🟡 ACTION_SECONDAIRE "Expédier"
    ├── Exposer : infos client, adresse livraison
    ├── Capturer : transporteur, numéro tracking
    └── → Transition vers "Expédié"
```

### 3.3 ACTIONS (Rectangles arrondis)

#### 3.3.1 ACTION PRINCIPALE (Obligatoire)

**Caractéristiques :**
- **Couleur distinctive** : Différente des actions secondaires
- **Toujours présente** : Même pour les états terminaux
- **Rôle dual** : Information + Navigation

**Responsabilités :**
1. **Exposition des informations** : Afficher les données de l'état actuel
2. **Navigation** : Présenter le menu des actions secondaires disponibles
3. **Point d'entrée M2M** : API GET pour inspection d'état

**API M2M :**
```http
GET /api/avatars/{id}/state
Response: {
  "current_state": "En_Production",
  "state_data": {
    "temperature": 23.5,
    "production_rate": 85,
    "quality_score": 0.98
  },
  "available_actions": [
    {
      "name": "controler_qualite",
      "endpoint": "/api/avatars/{id}/actions/controler_qualite",
      "required_permissions": ["quality_operator"]
    },
    {
      "name": "expedier", 
      "endpoint": "/api/avatars/{id}/actions/expedier",
      "required_permissions": ["shipping_operator"]
    }
  ],
  "timestamps": {
    "state_entered": "2025-07-27T10:30:00Z",
    "last_action": "2025-07-27T09:15:00Z"
  }
}
```

#### 3.3.2 ACTIONS SECONDAIRES (Optionnelles)

**Caractéristiques :**
- **Couleurs différenciées** : Selon le type d'action métier
- **Nombre variable** : 0 à N par état
- **Orientation métier** : Actions effectives de transformation

**Responsabilités :**
1. **Exposition spécialisée** : Données contextuelles à l'action
2. **Capture de données** : Collecter les informations nécessaires
3. **Workflow interne** : Orchestrer les sous-actions si nécessaire
4. **Transition d'état** : Faire évoluer l'objet vers le nouvel état

**API M2M :**
```http
POST /api/avatars/{id}/actions/controler_qualite
Request: {
  "operator": {
    "type": "human|system|robot",
    "id": "operator_123",
    "location": "station_qc_01"
  },
  "measurements": {
    "temperature": 23.2,
    "dimensions": [105.2, 50.1, 30.0],
    "visual_inspection": "conforme"
  },
  "automated_trigger": false,
  "context": {
    "batch_id": "B20250727001",
    "previous_actions": ["production_completed"]
  }
}

Response: {
  "success": true,
  "action_result": "quality_passed",
  "new_state": "Controle_OK", 
  "updated_data": {
    "quality_score": 0.99,
    "last_control": "2025-07-27T11:45:00Z",
    "control_operator": "operator_123"
  },
  "next_available_actions": [
    {
      "name": "expedier",
      "endpoint": "/api/avatars/{id}/actions/expedier"
    }
  ],
  "generated_events": [
    {
      "type": "quality_control_completed",
      "webhook_url": "https://erp-system.com/webhooks/quality",
      "payload": { ... }
    }
  ]
}
```

#### 3.3.3 SOUS-ACTIONS (Workflow interne)

**Caractéristiques :**
- **Couleurs dérivées** : Basées sur l'action parent
- **Enchaînement** : Workflow séquentiel ou conditionnel
- **Scope local** : Internes à l'action secondaire

**Exemple de workflow :**
```
ACTION_SECONDAIRE "Contrôler_Qualité"
├── Sous-action 1.1 "Mesurer_Température"
│   ├── Capturer : température ambiante + produit
│   └── Validation : dans plage acceptable
├── Sous-action 1.2 "Vérifier_Dimensions" 
│   ├── Capturer : longueur, largeur, hauteur
│   └── Validation : conformité tolérances
└── Sous-action 1.3 "Finaliser_Contrôle"
    ├── Agréger : résultats précédents
    ├── Décision : PASS/FAIL
    └── Archiver : rapport de contrôle
```

---

## 4. PATTERNS D'INTÉGRATION M2M

### 4.1 Pattern Polling (Interrogation périodique)

**Cas d'usage :** Système tiers vérifie périodiquement les états

```javascript
// Monitoring automatique
async function monitorAvatar(avatarId) {
  const state = await api.get(`/avatars/${avatarId}/state`);
  
  if (state.current_state === "Attente_Contrôle") {
    if (state.available_actions.includes("controler_qualite")) {
      // Déclencher le contrôle automatique
      await api.post(`/avatars/${avatarId}/actions/controler_qualite`, {
        operator: { type: "system", id: "qc_robot_01" },
        automated_trigger: true,
        measurements: await collectMeasurements()
      });
    }
  }
}

// Exécution périodique
setInterval(() => monitorAvatar("avatar_123"), 30000);
```

### 4.2 Pattern Webhook (Notification proactive)

**Cas d'usage :** 360SmartConnect notifie les systèmes tiers des changements

```javascript
// Configuration des webhooks
const webhookConfig = {
  "avatar_state_changed": "https://erp.com/webhooks/avatar-state",
  "quality_control_completed": "https://quality.com/webhooks/control",
  "production_finished": "https://planning.com/webhooks/production"
};

// Réception webhook côté système tiers
app.post('/webhooks/avatar-state', (req, res) => {
  const { avatar_id, from_state, to_state, triggered_by } = req.body;
  
  if (to_state === "Production_Terminée") {
    // Planifier automatiquement le contrôle qualité
    scheduleQualityControl(avatar_id);
  }
  
  res.status(200).send('OK');
});
```

### 4.3 Pattern Event-Driven (Messages asynchrones)

**Cas d'usage :** Architecture découplée avec bus de messages

```javascript
// Publication d'événements
const eventBus = new EventBus();

// Lors d'une transition d'état
eventBus.publish('avatar.state.transition', {
  avatar_id: "avatar_123",
  from_state: "En_Production", 
  to_state: "Contrôle_Qualité",
  timestamp: "2025-07-27T11:30:00Z",
  triggered_by: "operator_456",
  context: {
    batch_id: "B20250727001",
    production_duration: 3600
  }
});

// Consommation par systèmes tiers
eventBus.subscribe('avatar.state.transition', (event) => {
  if (event.to_state === "Contrôle_Qualité") {
    qualitySystem.prepareControlStation(event.avatar_id);
  }
  
  if (event.from_state === "En_Production") {
    productionSystem.releaseMachine(event.context.machine_id);
  }
});
```

---

## 5. AVANTAGES DE L'ARCHITECTURE

### 5.1 Séparation des responsabilités

| Composant | Responsabilité | Avantage |
|-----------|---------------|----------|
| ACTION_PRINCIPALE | Information + Navigation | Point d'entrée unique et prévisible |
| ACTIONS_SECONDAIRES | Logique métier + Transitions | Flexibilité et évolutivité |
| SOUS_ACTIONS | Workflow détaillé | Granularité et réutilisabilité |

### 5.2 Compatibilité 360SmartConnect

- **Avatar** → Mapping direct avec OBJET
- **État Avatar** → Correspondence naturelle avec ÉTAT
- **Finger** → Implémentation des ACTION_PRINCIPALE
- **API** → Endpoints pour ACTIONS_SECONDAIRES
- **Webhooks** → Événements de transition

### 5.3 Extensibilité M2M

- **Standards API** : RESTful avec JSON
- **Authentification** : Compatible OAuth2/JWT
- **Monitoring** : Logs et métriques intégrés
- **Évolutivité** : Architecture micro-services ready

### 5.4 Modélisation graphique intuitive

- **Lecture naturelle** : État → Actions possibles
- **Flèches multiples** : Une action secondaire par transition
- **Hiérarchie visuelle** : Actions principales vs secondaires
- **Couleurs codées** : Types d'actions différenciés

---

## 6. EXEMPLES CONCRETS

### 6.1 Processus de fabrication d'un composant

```
OBJET "Composant_C2025001"
├── ÉTAT "En_Usinage"
│   ├── 🔵 ACTION_PRINCIPALE "Consulter_Usinage"
│   │   ├── Exposer : progression, paramètres machine, temps restant
│   │   └── Menu : [Contrôler_Dimensions, Arrêter_Urgence]
│   │
│   ├── 🟡 ACTION_SECONDAIRE "Contrôler_Dimensions"
│   │   ├── Sous-actions : [Mesurer_X, Mesurer_Y, Mesurer_Z]
│   │   └── → "Usinage_Conforme" ou "Usinage_Défaillant"
│   │
│   └── 🟡 ACTION_SECONDAIRE "Arrêter_Urgence"
│       └── → "Arrêt_Urgence"
```

### 6.2 Gestion logistique d'un colis

```
OBJET "Colis_LOG2025789"
├── ÉTAT "En_Transit"
│   ├── 🔵 ACTION_PRINCIPALE "Suivre_Colis"
│   │   ├── Exposer : position GPS, transporteur, ETA
│   │   └── Menu : [Scanner_Étape, Signaler_Incident]
│   │
│   ├── 🟡 ACTION_SECONDAIRE "Scanner_Étape"
│   │   ├── Capturer : lieu, heure, opérateur
│   │   └── → "Étape_Validée"
│   │
│   └── 🟡 ACTION_SECONDAIRE "Signaler_Incident"
│       ├── Capturer : type incident, photos, description
│       └── → "Incident_Déclaré"
```

### 6.3 Contrôle qualité alimentaire

```
OBJET "Lot_Alimentaire_A789"
├── ÉTAT "Attente_Contrôle"
│   ├── 🔵 ACTION_PRINCIPALE "Consulter_Lot"
│   │   ├── Exposer : date production, DLC, composition
│   │   └── Menu : [Contrôle_Microbiologique, Contrôle_Chimique, Libérer_Lot]
│   │
│   ├── 🟡 ACTION_SECONDAIRE "Contrôle_Microbiologique"
│   │   ├── Sous-actions : [Prélever_Échantillon, Analyser_Lab, Valider_Résultats]
│   │   └── → "Micro_Conforme" ou "Micro_Non_Conforme"
│   │
│   ├── 🟡 ACTION_SECONDAIRE "Contrôle_Chimique"
│   │   ├── Sous-actions : [Test_Additifs, Test_Contaminants, Générer_Rapport]
│   │   └── → "Chimie_Conforme" ou "Chimie_Non_Conforme"
│   │
│   └── 🟡 ACTION_SECONDAIRE "Libérer_Lot"
│       ├── Conditions : Tous contrôles conformes
│       └── → "Lot_Libéré"
```

---

## 7. IMPLÉMENTATION DANS LE MÉTALANGUAGE

### 7.1 Représentation graphique

#### Conventions visuelles
- **OBJET** : Hexagone coloré selon type
- **ÉTAT** : Fanion superposé sur l'hexagone
- **ACTION PRINCIPALE** : Rectangle arrondi avec couleur spécifique (#E8F4FD)
- **ACTIONS SECONDAIRES** : Rectangles arrondis avec couleurs métier
- **SOUS-ACTIONS** : Rectangles plus petits, couleurs dérivées

#### Tags et métadonnées
- **#process-object** : Pour les hexagones OBJET
- **#process-state** : Pour les fanions ÉTAT
- **#process-action-main** : Pour les actions principales
- **#process-action-secondary** : Pour les actions secondaires
- **#process-subaction** : Pour les sous-actions

#### Connexions et flèches
- **OBJET → ÉTAT** : Superposition (pas de flèche)
- **ÉTAT → ACTION_PRINCIPALE** : Flèche pointillée (relation conceptuelle)
- **ÉTAT → ACTIONS_SECONDAIRES** : Flèches pleines depuis l'état
- **ACTIONS_SECONDAIRES → ÉTATS_CIBLES** : Flèches pleines vers nouveaux états
- **ACTION → SOUS_ACTIONS** : Flèches internes (workflow)

### 7.2 Templates markdown générés

#### Template ÉTAT enrichi
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

### Action : {Nom Action Secondaire 2}
{Même structure que action 1}

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

### 7.3 Configuration YAML enrichie

```yaml
# Configuration ProcessMetaLanguage v2.0
project:
  name: "Mon Projet Traçabilité"
  version: "2.0.0" 
  architecture: "two-level-actions"
  created: "2025-07-27"

# Types d'objets (inchangé)
types_objets:
  - couleur: "#E3F2FD"
    nom: "Matière première"
    description: "Matières brutes entrant dans le processus"
  - couleur: "#E8F5E8" 
    nom: "Produit fini"
    description: "Produits finalisés prêts à livrer"

# Architecture des actions à deux niveaux
architecture_actions:
  action_principale:
    couleur: "#E8F4FD"
    obligatoire: true
    rôles: ["exposition", "navigation"]
    api_pattern: "GET /api/avatars/{id}/state"
    
  actions_secondaires:
    types:
      - nom: "Manuelle"
        couleur: "#FFF9C4"
        description: "Action nécessitant intervention humaine"
        api_pattern: "POST /api/avatars/{id}/actions/{name}"
      - nom: "Automatique"
        couleur: "#FFCDD2"
        description: "Action exécutée par système/machine"
        triggers_auto: true
      - nom: "Conditionnelle"
        couleur: "#F3E5F5"
        description: "Action selon critères/conditions"
        conditions_required: true
      - nom: "Point de contrôle"
        couleur: "#E1F5FE"
        description: "Validation avec 1 entrée → 1 sortie"
        validation_required: true
      - nom: "Point d'arrêt"
        couleur: "#FCE4EC"
        description: "Décision avec 1 entrée → N sorties"
        multiple_outputs: true

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

---

## 8. WORKFLOW DE DÉVELOPPEMENT

### 8.1 Processus de création graphique

1. **Placer OBJET** : Créer hexagone avec type et nom
2. **Ajouter ÉTAT** : Superposer fanion avec nom d'état
3. **Créer ACTION_PRINCIPALE** : Rectangle spécial lié à l'état
4. **Ajouter ACTIONS_SECONDAIRES** : Rectangles reliés par flèches
5. **Définir SOUS_ACTIONS** : Si workflow complexe nécessaire
6. **Connecter TRANSITIONS** : Flèches vers états de destination

### 8.2 Scripts d'automatisation

#### Script de création d'état complet
```javascript
async function createCompleteState(stateName, objectRef) {
  const ea = ExcalidrawAutomate;
  
  // 1. Créer le fanion état
  const stateElement = ea.addFlag(0, 0, stateName);
  ea.addMetadata(stateElement, "#process-state");
  ea.addMetadata(stateElement, `object-ref:${objectRef}`);
  
  // 2. Créer l'action principale automatiquement
  const mainAction = ea.addRoundedRect(100, 0, "Consulter_" + stateName);
  ea.setStrokeColor(mainAction, "#E8F4FD");
  ea.addMetadata(mainAction, "#process-action-main");
  ea.addMetadata(mainAction, `state-ref:${stateElement.id}`);
  
  // 3. Connecter avec flèche pointillée
  ea.addArrow(stateElement, mainAction, {style: "dashed"});
  
  await ea.create();
  
  // 4. Générer le template markdown
  await generateStateTemplate(stateName, objectRef);
}
```

#### Script de synchronisation global
```javascript
async function synchronizeWorkflow() {
  // 1. Analyser le canvas
  const elements = ea.getElementsInCurrentView();
  const objects = elements.filter(e => e.metadata?.includes("#process-object"));
  const states = elements.filter(e => e.metadata?.includes("#process-state"));
  const actions = elements.filter(e => e.metadata?.includes("#process-action"));
  
  // 2. Construire le graphe de relations
  const workflow = buildWorkflowGraph(objects, states, actions);
  
  // 3. Valider l'architecture à deux niveaux
  validateTwoLevelArchitecture(workflow);
  
  // 4. Générer le fichier markdown consolidé
  await generateConsolidatedMarkdown(workflow);
  
  // 5. Générer les spécifications M2M
  await generateM2MSpecifications(workflow);
}
```

### 8.3 Validation automatique

#### Règles de validation
1. **Chaque ÉTAT** doit avoir exactement une ACTION_PRINCIPALE
2. **Chaque OBJET** doit avoir exactement un ÉTAT actuel
3. **Chaque ACTION_SECONDAIRE** doit avoir une flèche de sortie
4. **Les couleurs** doivent respecter la configuration YAML
5. **Les métadonnées** doivent être présentes et cohérentes

#### Script de validation
```javascript
function validateWorkflow(workflow) {
  const errors = [];
  
  // Validation des états
  workflow.states.forEach(state => {
    const mainActions = state.actions.filter(a => a.type === "principale");
    if (mainActions.length !== 1) {
      errors.push(`État ${state.name}: doit avoir exactement 1 action principale`);
    }
    
    const secondaryActions = state.actions.filter(a => a.type === "secondaire");
    secondaryActions.forEach(action => {
      if (!action.targetState) {
        errors.push(`Action ${action.name}: doit avoir un état de destination`);
      }
    });
  });
  
  // Validation des objets
  workflow.objects.forEach(object => {
    if (!object.currentState) {
      errors.push(`Objet ${object.name}: doit avoir un état actuel`);
    }
  });
  
  return errors;
}
```

---

## 9. EXEMPLES D'INTÉGRATION

### 9.1 Intégration ERP

```javascript
// Configuration ERP
const erpIntegration = {
  baseUrl: "https://erp.entreprise.com/api/v1",
  authentication: "api-key",
  endpoints: {
    createWorkOrder: "/production/work-orders",
    updateStatus: "/production/status",
    qualityResults: "/quality/results"
  }
};

// Workflow de production
async function handleProductionWorkflow(avatarId, action, data) {
  switch(action) {
    case "demarrer_production":
      // Créer ordre de fabrication dans l'ERP
      const workOrder = await erpIntegration.createWorkOrder({
        avatar_id: avatarId,
        product_code: data.product_code,
        quantity: data.quantity
      });
      
      // Transition vers "En_Production"
      return { 
        new_state: "En_Production",
        updated_data: { work_order_id: workOrder.id }
      };
      
    case "terminer_production":
      // Mettre à jour le statut dans l'ERP
      await erpIntegration.updateStatus({
        work_order_id: data.work_order_id,
        status: "completed",
        actual_quantity: data.actual_quantity
      });
      
      return { new_state: "Production_Terminée" };
  }
}
```

### 9.2 Intégration IoT/Capteurs

```javascript
// Intégration capteurs industriels
const sensorIntegration = {
  mqttClient: mqtt.connect("mqtt://sensors.usine.com"),
  topics: {
    temperature: "sensors/temperature/+",
    pressure: "sensors/pressure/+", 
    vibration: "sensors/vibration/+"
  }
};

// Déclenchement automatique basé sur capteurs
sensorIntegration.mqttClient.on('message', async (topic, message) => {
  const sensorData = JSON.parse(message.toString());
  const [_, sensorType, machineId] = topic.split('/');
  
  // Rechercher avatars liés à cette machine
  const avatars = await findAvatarsByMachine(machineId);
  
  for (const avatar of avatars) {
    if (avatar.current_state === "En_Production") {
      // Vérifier seuils critiques
      if (sensorType === "temperature" && sensorData.value > 80) {
        // Déclencher automatiquement l'arrêt d'urgence
        await triggerAction(avatar.id, "arreter_urgence", {
          trigger_reason: "temperature_exceeded",
          sensor_value: sensorData.value,
          threshold: 80,
          automated: true
        });
      }
    }
  }
});
```

### 9.3 Intégration Système Qualité

```javascript
// Système de gestion qualité
const qualitySystem = {
  labEquipment: "http://lab-equipment.local/api",
  qmsSystem: "https://qms.entreprise.com/api"
};

// Workflow de contrôle qualité automatisé
async function handleQualityControl(avatarId, controlType, data) {
  const results = {};
  
  switch(controlType) {
    case "controle_dimensionnel":
      // Déclencher mesure automatique
      const measurements = await qualitySystem.labEquipment.measure({
        avatar_id: avatarId,
        measurement_type: "dimensional",
        parameters: ["length", "width", "height"]
      });
      
      // Valider conformité
      const conformity = validateMeasurements(measurements, data.tolerances);
      
      // Enregistrer dans QMS
      await qualitySystem.qmsSystem.recordControl({
        avatar_id: avatarId,
        control_type: "dimensional",
        results: measurements,
        conformity: conformity,
        operator: data.operator
      });
      
      return {
        new_state: conformity ? "Controle_OK" : "Controle_KO",
        updated_data: {
          quality_results: measurements,
          conformity_status: conformity
        }
      };
  }
}
```

---

## 10. CONCLUSION ET PERSPECTIVES

### 10.1 Bénéfices de l'architecture

Cette architecture à deux niveaux offre :

1. **Simplicité conceptuelle** : Modèle mental clair et intuitif
2. **Flexibilité opérationnelle** : Adaptation à divers contextes métier
3. **Compatibilité système** : Intégration naturelle avec 360SmartConnect
4. **Extensibilité M2M** : Support complet des architectures automatisées
5. **Traçabilité complète** : Historique détaillé des transitions et actions

### 10.2 Évolutions futures

#### Phase 2 : Intelligence artificielle
- **Prédiction d'actions** : IA suggérant les prochaines étapes
- **Optimisation de workflows** : Analyse des goulots d'étranglement
- **Détection d'anomalies** : Alertes proactives sur comportements atypiques

#### Phase 3 : Orchestration avancée
- **Workflows parallèles** : Gestion de processus concurrents
- **Compensation automatique** : Rollback en cas d'échec
- **Orchestration multi-objets** : Coordination entre entités

#### Phase 4 : Analytics et BI
- **Tableaux de bord temps réel** : Visualisation des flux
- **Analyse de performance** : KPIs sur les processus
- **Simulation de scénarios** : Test de modifications avant déploiement

### 10.3 Recommandations d'implémentation

1. **Commencer simple** : Implémenter d'abord les cas d'usage de base
2. **Itérer rapidement** : Cycles courts avec feedback utilisateur
3. **Standardiser progressivement** : Établir les patterns réutilisables
4. **Monitorer intensivement** : Métriques dès le premier déploiement
5. **Former les équipes** : Adoption facilitée par la formation

---

**Document complet - Architecture État-Actions à Deux Niveaux v1.0**  
**Prêt pour implémentation dans ProcessMetaLanguage**