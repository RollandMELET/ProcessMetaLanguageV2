# Exemples Techniques ProcessMetaLanguage

**Version:** 1.0.0  
**Date:** 2025-07-27 17:30  
**Auteur:** Rolland MELET & Claude Code  
**Document:** Patterns techniques et exemples de code pour développement ProcessMetaLanguage

---

## 1. PATTERNS EXCALIDRAW COMPONENT CREATION

### 1.1 Création Hexagone OBJECT Standardisé

```javascript
/**
 * Crée un hexagone OBJECT standardisé dans Excalidraw
 * @param {string} objectName - Nom de l'objet tracé (ex: "Lot-Acier-001")
 * @param {string} objectType - Type d'objet selon nomenclature
 * @param {Object} position - Position {x, y} dans le canvas
 * @param {string} color - Couleur de fond hexagone
 * @returns {string} ID unique de l'élément créé
 * @sideEffect Modifie le canvas Excalidraw actif
 * @example
 * const objId = await createHexagonObject("Lot-001", "raw-material", {x: 100, y: 200}, "#E3F2FD");
 */
async function createHexagonObject(objectName, objectType, position, color) {
    const ea = ExcalidrawAutomate;
    ea.reset();
    
    // Configuration style hexagone
    ea.style.strokeColor = "#1e1e1e";
    ea.style.backgroundColor = color;
    ea.style.fillStyle = "solid";
    ea.style.strokeWidth = 2;
    ea.style.roughness = 0; // Forme précise
    
    // Points pour créer un hexagone (120x80px)
    const width = 120;
    const height = 80;
    const cx = position.x;
    const cy = position.y;
    
    // Calcul des 6 points de l'hexagone
    const points = [
        [cx - width/2, cy],           // Gauche
        [cx - width/4, cy - height/2], // Haut gauche
        [cx + width/4, cy - height/2], // Haut droite
        [cx + width/2, cy],           // Droite
        [cx + width/4, cy + height/2], // Bas droite
        [cx - width/4, cy + height/2]  // Bas gauche
    ];
    
    // Créer le polygone hexagone
    const hexagonId = ea.addPolygon(points);
    
    // Ajouter le texte centré
    ea.style.fontSize = 16;
    ea.style.fontFamily = 3; // Cascadia
    ea.style.textAlign = "center";
    ea.style.verticalAlign = "middle";
    ea.addText(cx, cy, objectName, {
        width: width - 20,
        height: height - 20,
        textAlign: "center"
    });
    
    // Ajouter métadonnées et tags
    ea.addElementWith(hexagonId, {
        customData: {
            processTag: "#process-object",
            objectType: objectType,
            objectName: objectName,
            createdAt: new Date().toISOString()
        }
    });
    
    // Créer dans le canvas
    await ea.create();
    
    return hexagonId;
}
```

### 1.2 Création Bannière STATE Superposée

```javascript
/**
 * Crée une bannière STATE superposée sur un hexagone OBJECT
 * @param {string} stateName - Nom de l'état (ex: "En_Production")
 * @param {string} parentObjectId - ID de l'hexagone parent
 * @param {Object} ea - Instance ExcalidrawAutomate
 * @returns {string} ID de la bannière créée
 * @sideEffect Ajoute un fanion sur l'hexagone parent
 * @example
 * const stateId = await createStateBanner("En_Réception", objId, ea);
 */
async function createStateBanner(stateName, parentObjectId, ea) {
    // Récupérer position de l'objet parent
    const parentElement = ea.getElement(parentObjectId);
    if (!parentElement) {
        throw new Error(`Objet parent ${parentObjectId} non trouvé`);
    }
    
    const parentX = parentElement.x + parentElement.width / 2;
    const parentY = parentElement.y - 20; // Position au-dessus
    
    // Configuration style bannière
    ea.style.strokeColor = "#1e1e1e";
    ea.style.backgroundColor = "#BBE5FF"; // Couleur unique états
    ea.style.fillStyle = "solid";
    ea.style.strokeWidth = 1;
    ea.style.roughness = 0;
    
    // Créer forme bannière/fanion (80x40px)
    const width = 80;
    const height = 40;
    
    const points = [
        [parentX - width/2, parentY],
        [parentX + width/2, parentY],
        [parentX + width/2, parentY + height * 0.8],
        [parentX, parentY + height],
        [parentX - width/2, parentY + height * 0.8]
    ];
    
    const bannerId = ea.addPolygon(points);
    
    // Ajouter texte état
    ea.style.fontSize = 14;
    ea.addText(parentX, parentY + height/3, stateName, {
        width: width - 10,
        textAlign: "center"
    });
    
    // Métadonnées état
    ea.addElementWith(bannerId, {
        customData: {
            processTag: "#process-state",
            stateName: stateName,
            parentObjectId: parentObjectId,
            stateEnteredAt: new Date().toISOString()
        }
    });
    
    await ea.create();
    return bannerId;
}
```

### 1.3 Création Rectangle ACTION Arrondi

```javascript
/**
 * Crée un rectangle arrondi ACTION
 * @param {string} actionName - Nom de l'action
 * @param {string} actionType - Type (principale/secondaire)
 * @param {Object} position - Position {x, y}
 * @param {string} targetStateId - ID état cible (optionnel)
 * @returns {Object} {actionId, arrowId} IDs créés
 * @sideEffect Crée action + flèche vers état cible
 * @example
 * const {actionId} = await createActionRectangle("Valider_Qualité", "secondaire", {x: 300, y: 200});
 */
async function createActionRectangle(actionName, actionType, position, targetStateId = null) {
    const ea = ExcalidrawAutomate;
    
    // Couleurs selon type action
    const colors = {
        principale: "#E8F4FD",
        secondaire: "#FFF9C4",
        controle: "#E1F5FE",
        arret: "#FCE4EC"
    };
    
    ea.style.backgroundColor = colors[actionType] || "#F5F5F5";
    ea.style.strokeColor = "#1e1e1e";
    ea.style.fillStyle = "solid";
    ea.style.strokeWidth = actionType === "principale" ? 3 : 2;
    ea.style.roundness = { type: 3, value: 16 }; // Coins arrondis
    
    // Créer rectangle (140x60px)
    const width = actionType === "principale" ? 160 : 140;
    const height = 60;
    
    const actionId = ea.addRect(
        position.x - width/2,
        position.y - height/2,
        width,
        height
    );
    
    // Ajouter texte action
    ea.style.fontSize = 16;
    ea.addText(position.x, position.y, actionName, {
        width: width - 20,
        height: height - 10,
        textAlign: "center",
        verticalAlign: "middle"
    });
    
    // Métadonnées action
    ea.addElementWith(actionId, {
        customData: {
            processTag: "#process-action",
            actionName: actionName,
            actionType: actionType,
            targetStateId: targetStateId
        }
    });
    
    // Si état cible, créer flèche
    let arrowId = null;
    if (targetStateId) {
        const targetElement = ea.getElement(targetStateId);
        if (targetElement) {
            ea.style.strokeColor = "#666666";
            ea.style.strokeWidth = 2;
            ea.style.arrowhead = "arrow";
            
            arrowId = ea.addArrow([
                [position.x + width/2, position.y],
                [targetElement.x, targetElement.y + targetElement.height/2]
            ]);
        }
    }
    
    await ea.create();
    return { actionId, arrowId };
}
```

## 2. API SYNCHRONISATION PATTERNS

### 2.1 Détection Changements Canvas

```javascript
/**
 * Détecte tous les éléments ProcessMetaLanguage dans le canvas
 * @param {Object} ea - Instance ExcalidrawAutomate
 * @returns {Object} Éléments groupés par type
 * @example
 * const elements = detectProcessElements(ea);
 * console.log(`Trouvé ${elements.objects.length} objets`);
 */
function detectProcessElements(ea) {
    const allElements = ea.getViewElements();
    
    const processElements = {
        objects: [],
        states: [],
        actions: [],
        relations: []
    };
    
    allElements.forEach(element => {
        const tag = element.customData?.processTag;
        if (!tag) return;
        
        switch(tag) {
            case "#process-object":
                processElements.objects.push({
                    id: element.id,
                    name: element.customData.objectName,
                    type: element.customData.objectType,
                    position: {x: element.x, y: element.y}
                });
                break;
                
            case "#process-state":
                processElements.states.push({
                    id: element.id,
                    name: element.customData.stateName,
                    parentObjectId: element.customData.parentObjectId
                });
                break;
                
            case "#process-action":
                processElements.actions.push({
                    id: element.id,
                    name: element.customData.actionName,
                    type: element.customData.actionType,
                    targetStateId: element.customData.targetStateId
                });
                break;
        }
    });
    
    // Détecter relations par flèches
    const arrows = allElements.filter(el => el.type === "arrow");
    arrows.forEach(arrow => {
        if (arrow.startBinding && arrow.endBinding) {
            processElements.relations.push({
                from: arrow.startBinding.elementId,
                to: arrow.endBinding.elementId,
                type: "transition"
            });
        }
    });
    
    return processElements;
}
```

### 2.2 Export Markdown avec YAML

```javascript
/**
 * Génère le contenu markdown pour un OBJECT avec frontmatter YAML
 * @param {Object} objectData - Données de l'objet
 * @param {Object} template - Template markdown à utiliser
 * @returns {string} Contenu markdown complet
 * @example
 * const markdown = generateObjectMarkdown(objectData, objectTemplate);
 */
function generateObjectMarkdown(objectData, template) {
    // Générer frontmatter YAML
    const frontmatter = {
        type: "process-object",
        "object-type": objectData.type,
        company: objectData.company || "Non spécifiée",
        id: objectData.id,
        "template_source": template.id || "custom",
        created: new Date().toISOString(),
        "last-modified": new Date().toISOString()
    };
    
    // Convertir en YAML
    let yamlContent = "---\n";
    for (const [key, value] of Object.entries(frontmatter)) {
        yamlContent += `${key}: ${typeof value === 'string' ? `"${value}"` : value}\n`;
    }
    yamlContent += "---\n\n";
    
    // Remplacer variables dans template
    let bodyContent = template.content;
    bodyContent = bodyContent.replace(/\{nom_objet\}/g, objectData.name);
    bodyContent = bodyContent.replace(/\{type\}/g, objectData.type);
    bodyContent = bodyContent.replace(/\{entreprise\}/g, objectData.company || "Non spécifiée");
    
    // Ajouter données additionnelles
    if (objectData.metadata) {
        bodyContent += "\n## Informations additionnelles\n";
        bodyContent += "| Clef | Valeur | Type | Unité | Définition |\n";
        bodyContent += "|------|--------|------|-------|------------|\n";
        
        for (const [key, meta] of Object.entries(objectData.metadata)) {
            bodyContent += `| ${key} | ${meta.value} | ${meta.type} | ${meta.unit || "-"} | ${meta.definition || "-"} |\n`;
        }
    }
    
    return yamlContent + bodyContent;
}
```

### 2.3 Synchronisation Bidirectionnelle

```javascript
/**
 * Synchronise les changements du canvas vers les fichiers markdown
 * @param {Object} app - Instance Obsidian app
 * @param {Object} processElements - Éléments détectés
 * @returns {Object} Résultat synchronisation
 * @sideEffect Crée/modifie fichiers markdown dans le vault
 * @example
 * const result = await syncCanvasToMarkdown(app, processElements);
 */
async function syncCanvasToMarkdown(app, processElements) {
    const results = {
        created: [],
        updated: [],
        errors: []
    };
    
    // Synchroniser les objets
    for (const obj of processElements.objects) {
        try {
            const filePath = `objects/${obj.name}.md`;
            const existingFile = app.vault.getAbstractFileByPath(filePath);
            
            if (existingFile) {
                // Mise à jour fichier existant
                await app.fileManager.processFrontMatter(existingFile, (frontmatter) => {
                    frontmatter["last-modified"] = new Date().toISOString();
                    frontmatter["canvas-position"] = `${obj.position.x},${obj.position.y}`;
                });
                results.updated.push(filePath);
            } else {
                // Créer nouveau fichier
                const template = await loadTemplate("object", obj.type);
                const content = generateObjectMarkdown(obj, template);
                await app.vault.create(filePath, content);
                results.created.push(filePath);
            }
        } catch (error) {
            results.errors.push({
                object: obj.name,
                error: error.message
            });
        }
    }
    
    // Synchroniser états et actions de manière similaire...
    
    return results;
}
```

## 3. PATTERNS INTÉGRATION EPCIS 2.0

### 3.1 Implementation Business Steps

```javascript
/**
 * Applique un business step EPCIS à une action
 * @param {Object} action - Données de l'action
 * @param {string} bizStep - Business step EPCIS (ex: "receiving")
 * @returns {Object} Action enrichie avec métadonnées EPCIS
 * @example
 * const enrichedAction = applyEPCISBusinessStep(action, "receiving");
 */
function applyEPCISBusinessStep(action, bizStep) {
    // Mapping des business steps EPCIS 2.0
    const epcisBusinessSteps = {
        "receiving": {
            description: "The process of taking possession of product",
            eventType: "ObjectEvent",
            action: "ADD",
            typicalDisposition: "in_progress"
        },
        "shipping": {
            description: "Preparation and handover for transportation",
            eventType: "ObjectEvent", 
            action: "OBSERVE",
            typicalDisposition: "in_transit"
        },
        "packing": {
            description: "Placing objects into shipping container",
            eventType: "AggregationEvent",
            action: "ADD",
            typicalDisposition: "container_open"
        },
        "inspecting": {
            description: "Review of object characteristics",
            eventType: "ObjectEvent",
            action: "OBSERVE",
            typicalDisposition: "in_progress"
        },
        "storing": {
            description: "Placement in storage location",
            eventType: "ObjectEvent",
            action: "OBSERVE",
            typicalDisposition: "inactive"
        },
        "transforming": {
            description: "Physical or chemical change",
            eventType: "TransformationEvent",
            action: "ADD",
            typicalDisposition: "active"
        }
        // ... autres business steps
    };
    
    const epcisData = epcisBusinessSteps[bizStep];
    if (!epcisData) {
        throw new Error(`Business step '${bizStep}' non reconnu`);
    }
    
    return {
        ...action,
        epcis: {
            bizStep: bizStep,
            ...epcisData,
            timestamp: new Date().toISOString()
        }
    };
}
```

### 3.2 CBV Dispositions Mapping

```javascript
/**
 * Mappe une disposition CBV vers métadonnées d'état
 * @param {string} disposition - Disposition CBV (ex: "active")
 * @returns {Object} Métadonnées de disposition
 * @example
 * const dispMeta = mapCBVDisposition("in_transit");
 */
function mapCBVDisposition(disposition) {
    // Dispositions CBV 2.0 standards
    const cbvDispositions = {
        "active": {
            description: "Available for business operations",
            color: "#4CAF50",
            allowedTransitions: ["in_progress", "inactive", "damaged"]
        },
        "in_transit": {
            description: "In process of transportation",
            color: "#2196F3",
            allowedTransitions: ["active", "damaged", "destroyed"]
        },
        "destroyed": {
            description: "Permanently decommissioned",
            color: "#F44336",
            allowedTransitions: [], // État terminal
            terminal: true
        },
        "damaged": {
            description: "Impaired but potentially repairable",
            color: "#FF9800",
            allowedTransitions: ["active", "destroyed", "inactive"]
        },
        "expired": {
            description: "Past expiration date",
            color: "#9E9E9E",
            allowedTransitions: ["destroyed"],
            terminal: false
        },
        "in_progress": {
            description: "Undergoing processing",
            color: "#03A9F4",
            allowedTransitions: ["active", "damaged", "destroyed"]
        },
        "inactive": {
            description: "Temporarily unavailable",
            color: "#607D8B",
            allowedTransitions: ["active", "destroyed"]
        }
        // ... autres dispositions
    };
    
    return cbvDispositions[disposition] || {
        description: "Custom disposition",
        color: "#9E9E9E",
        allowedTransitions: []
    };
}
```

## 4. PATTERNS GESTION TEMPLATES

### 4.1 Chargement et Application Templates

```javascript
/**
 * Charge et applique un template depuis la bibliothèque
 * @param {string} templateType - Type de template (object/state/action)
 * @param {string} templateId - ID du template
 * @param {Object} instanceData - Données pour instanciation
 * @returns {Object} Instance du template personnalisée
 * @example
 * const instance = await loadAndApplyTemplate("action", "receiving", {name: "Recevoir_Lot_001"});
 */
async function loadAndApplyTemplate(templateType, templateId, instanceData) {
    const app = this.app;
    
    // Chemins des templates
    const templatePaths = {
        object: `templates/objects/${templateId}.yaml`,
        state: `templates/states/${templateId}.yaml`,
        action: `templates/epcis/business-steps/${templateId}.yaml`
    };
    
    const templatePath = templatePaths[templateType];
    const templateFile = app.vault.getAbstractFileByPath(templatePath);
    
    if (!templateFile) {
        throw new Error(`Template ${templateId} non trouvé`);
    }
    
    // Lire le template YAML
    const templateContent = await app.vault.read(templateFile);
    const template = parseYAML(templateContent);
    
    // Appliquer les données d'instance
    const instance = {
        ...template,
        ...instanceData,
        template_source: templateId,
        instantiated_at: new Date().toISOString()
    };
    
    // Personnaliser selon le type
    switch(templateType) {
        case "action":
            if (template.epcis_mapping) {
                instance.epcis = applyEPCISBusinessStep(instance, template.epcis_mapping.bizStep);
            }
            break;
            
        case "state":
            if (template.epcis_mapping?.disposition) {
                instance.disposition = mapCBVDisposition(template.epcis_mapping.disposition);
            }
            break;
    }
    
    return instance;
}
```

### 4.2 Gestion Héritage Templates

```javascript
/**
 * Crée un nouveau template par héritage
 * @param {string} parentTemplateId - ID template parent
 * @param {Object} customizations - Personnalisations
 * @returns {Object} Nouveau template créé
 * @sideEffect Crée fichier template dans vault
 * @example
 * const newTemplate = await createInheritedTemplate("receiving", {
 *     name: "Receiving_WithPhoto",
 *     additionalFields: [{name: "photo", type: "image", required: true}]
 * });
 */
async function createInheritedTemplate(parentTemplateId, customizations) {
    // Charger template parent
    const parent = await loadAndApplyTemplate("action", parentTemplateId, {});
    
    // Créer nouveau template avec héritage
    const newTemplate = {
        ...parent,
        ...customizations,
        template_id: `${parentTemplateId}_${Date.now()}`,
        heritage: parentTemplateId,
        created_at: new Date().toISOString()
    };
    
    // Fusionner champs additionnels
    if (customizations.additionalFields) {
        newTemplate.capture_fields = [
            ...(parent.capture_fields || []),
            ...customizations.additionalFields
        ];
    }
    
    // Sauvegarder nouveau template
    const newPath = `templates/custom/${newTemplate.template_id}.yaml`;
    const yamlContent = stringifyYAML(newTemplate);
    await this.app.vault.create(newPath, yamlContent);
    
    return newTemplate;
}
```

## 5. PATTERNS PERFORMANCE ET OPTIMISATION

### 5.1 Batch Processing pour Synchronisation

```javascript
/**
 * Traite les éléments par batch pour optimiser performance
 * @param {Array} elements - Éléments à traiter
 * @param {Function} processor - Fonction de traitement
 * @param {number} batchSize - Taille des batchs
 * @returns {Object} Résultats du traitement
 * @example
 * const results = await processBatch(elements, syncElement, 10);
 */
async function processBatch(elements, processor, batchSize = 10) {
    const results = {
        processed: 0,
        errors: [],
        duration: 0
    };
    
    const startTime = performance.now();
    
    // Diviser en batchs
    for (let i = 0; i < elements.length; i += batchSize) {
        const batch = elements.slice(i, i + batchSize);
        
        // Traiter batch en parallèle
        const batchPromises = batch.map(async (element) => {
            try {
                await processor(element);
                results.processed++;
            } catch (error) {
                results.errors.push({
                    element: element.id || element.name,
                    error: error.message
                });
            }
        });
        
        // Attendre fin du batch avant le suivant
        await Promise.all(batchPromises);
        
        // Pause pour éviter surcharge
        if (i + batchSize < elements.length) {
            await new Promise(resolve => setTimeout(resolve, 50));
        }
    }
    
    results.duration = performance.now() - startTime;
    return results;
}
```

### 5.2 Cache Métadonnées Obsidian

```javascript
/**
 * Gestionnaire de cache pour métadonnées fichiers
 * @class MetadataCache
 * @example
 * const cache = new MetadataCache(app);
 * const meta = await cache.getMetadata("objects/Lot-001.md");
 */
class MetadataCache {
    constructor(app) {
        this.app = app;
        this.cache = new Map();
        this.maxAge = 5 * 60 * 1000; // 5 minutes
    }
    
    /**
     * Récupère métadonnées avec cache
     * @param {string} path - Chemin du fichier
     * @returns {Object} Métadonnées frontmatter
     */
    async getMetadata(path) {
        // Vérifier cache
        const cached = this.cache.get(path);
        if (cached && Date.now() - cached.timestamp < this.maxAge) {
            return cached.data;
        }
        
        // Charger depuis Obsidian
        const file = this.app.vault.getAbstractFileByPath(path);
        if (!file) return null;
        
        const cache = this.app.metadataCache.getFileCache(file);
        const metadata = cache?.frontmatter || {};
        
        // Mettre en cache
        this.cache.set(path, {
            data: metadata,
            timestamp: Date.now()
        });
        
        return metadata;
    }
    
    /**
     * Invalide cache pour un fichier
     * @param {string} path - Chemin du fichier
     */
    invalidate(path) {
        this.cache.delete(path);
    }
    
    /**
     * Vide tout le cache
     */
    clear() {
        this.cache.clear();
    }
}
```

## 6. PATTERNS VALIDATION ET TESTS

### 6.1 Validation Architecture État-Actions

```javascript
/**
 * Valide qu'un processus respecte l'architecture deux niveaux
 * @param {Object} process - Processus à valider
 * @returns {Object} Rapport de validation
 * @example
 * const validation = validateProcessArchitecture(processData);
 * if (!validation.valid) console.error(validation.errors);
 */
function validateProcessArchitecture(process) {
    const validation = {
        valid: true,
        errors: [],
        warnings: []
    };
    
    // Règle 1: Chaque état doit avoir une action principale
    process.states.forEach(state => {
        const mainAction = process.actions.find(
            a => a.stateId === state.id && a.type === "principale"
        );
        
        if (!mainAction) {
            validation.valid = false;
            validation.errors.push(
                `État '${state.name}' n'a pas d'action principale`
            );
        }
    });
    
    // Règle 2: Actions secondaires doivent avoir état cible
    process.actions
        .filter(a => a.type === "secondaire")
        .forEach(action => {
            if (!action.targetStateId) {
                validation.warnings.push(
                    `Action secondaire '${action.name}' sans état cible`
                );
            }
        });
    
    // Règle 3: Pas de cycles infinis détectés
    const cycles = detectCycles(process);
    if (cycles.length > 0) {
        validation.warnings.push(
            `Cycles détectés: ${cycles.join(", ")}`
        );
    }
    
    // Règle 4: États terminaux ne doivent pas avoir d'actions secondaires
    process.states
        .filter(s => s.terminal)
        .forEach(state => {
            const secondaryActions = process.actions.filter(
                a => a.stateId === state.id && a.type === "secondaire"
            );
            
            if (secondaryActions.length > 0) {
                validation.errors.push(
                    `État terminal '${state.name}' a des actions secondaires`
                );
                validation.valid = false;
            }
        });
    
    return validation;
}
```

## 7. EXEMPLES D'UTILISATION COMPLÈTE

### 7.1 Création Processus Réception Matière

```javascript
/**
 * Exemple complet : Processus réception matière première
 * @example
 * await createReceptionProcess();
 */
async function createReceptionProcess() {
    const ea = ExcalidrawAutomate;
    ea.reset();
    
    // 1. Créer objet matière première
    const objectId = await createHexagonObject(
        "Lot-Acier-A001",
        "raw-material",
        {x: 200, y: 200},
        "#E3F2FD"
    );
    
    // 2. Créer état initial "En_Réception"
    const state1Id = await createStateBanner(
        "En_Réception",
        objectId,
        ea
    );
    
    // 3. Créer action principale consultation
    const mainAction1 = await createActionRectangle(
        "Consulter_Réception",
        "principale",
        {x: 200, y: 350}
    );
    
    // 4. Créer action secondaire avec template EPCIS
    const receiveAction = await createActionRectangle(
        "Valider_Réception",
        "secondaire",
        {x: 400, y: 350}
    );
    
    // Appliquer business step EPCIS
    const enrichedAction = applyEPCISBusinessStep(
        {id: receiveAction.actionId, name: "Valider_Réception"},
        "receiving"
    );
    
    // 5. Créer état suivant "Stocké"
    const state2Id = await createStateBanner(
        "Stocké",
        objectId,
        ea
    );
    
    // 6. Créer flèche transition
    ea.style.strokeColor = "#666666";
    ea.style.arrowhead = "arrow";
    ea.addArrow([
        [400, 380],  // Depuis action
        [200, 450]   // Vers nouvel état
    ]);
    
    await ea.create();
    
    // 7. Synchroniser vers markdown
    const elements = detectProcessElements(ea);
    const syncResult = await syncCanvasToMarkdown(this.app, elements);
    
    console.log("Processus créé:", syncResult);
}
```

---

**Ces exemples techniques fournissent des patterns réutilisables et des bonnes pratiques pour le développement du ProcessMetaLanguage. Les agents développeurs peuvent s'appuyer sur ces exemples pour implémenter les fonctionnalités selon les standards définis.**

<!-- END OF FILE: technical-examples.md -->