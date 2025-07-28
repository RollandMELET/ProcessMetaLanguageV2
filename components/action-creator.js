// <!-- START OF FILE: action-creator.js -->
// FILENAME: action-creator.js
// Version: 1.0.0
// Date: 2025-07-27 20:30
// Author: Rolland MELET & Claude Code
// Description: Module création rectangle ACTION arrondi standardisé ProcessMetaLanguage selon spécifications TASK-F003

/**
 * Module ProcessMetaLanguage - Création Composants ACTION
 * 
 * Spécialiste création rectangles ACTION standardisés dans Excalidraw
 * Architecture État-Actions deux niveaux pour traçabilité industrielle
 * Support business steps EPCIS 2.0 + types actions + métadonnées automatiques
 */

/**
 * Configuration par défaut des actions ProcessMetaLanguage
 * @constant {Object}
 */
const ACTION_CONFIG = {
    // Dimensions standard rectangle ACTION
    width: 140,
    height: 60,
    
    // Style rectangle arrondi
    borderRadius: 12, // Coins arrondis pour différenciation avec états
    
    // Styles graphiques standardisés
    strokeWidth: 2,
    strokeColor: "#1e1e1e",
    fillStyle: "solid",
    roughness: 0, // Forme précise pour professionnalisme
    
    // Typographie
    fontSize: 14,
    fontFamily: 3, // Cascadia Code
    textColor: "#ffffff", // Texte blanc pour contraste
    
    // Métadonnées
    processTag: "#process-action",
    version: "1.0.0"
};

/**
 * Palette couleurs par type d'action ProcessMetaLanguage
 * @constant {Object}
 */
const ACTION_TYPE_COLORS = {
    "primary": {
        background: "#1976D2",
        description: "Action principale (consultation/lecture)",
        category: "main"
    },
    "secondary": {
        background: "#FF8F00", 
        description: "Action secondaire (interaction/modification)",
        category: "optional"
    },
    "system": {
        background: "#7B1FA2",
        description: "Action automatique/système",
        category: "automated"
    },
    "user": {
        background: "#388E3C",
        description: "Action utilisateur manuel",
        category: "manual"
    },
    "api": {
        background: "#0097A7",
        description: "Action intégration externe",
        category: "integration"
    },
    "validation": {
        background: "#D32F2F",
        description: "Action contrôle/validation",
        category: "control"
    }
};

/**
 * Mapping business steps EPCIS 2.0 prioritaires vers types d'actions
 * @constant {Object}
 */
const EPCIS_BUSINESS_STEPS = {
    "receiving": {
        defaultActionType: "secondary",
        description: "Réception matière/produit",
        verb: "Recevoir",
        dataFlow: "input",
        epcisCode: "urn:epcglobal:cbv:bizstep:receiving"
    },
    "shipping": {
        defaultActionType: "secondary", 
        description: "Expédition/envoi",
        verb: "Expédier",
        dataFlow: "output",
        epcisCode: "urn:epcglobal:cbv:bizstep:shipping"
    },
    "packing": {
        defaultActionType: "secondary",
        description: "Conditionnement/emballage", 
        verb: "Conditionner",
        dataFlow: "transformation",
        epcisCode: "urn:epcglobal:cbv:bizstep:packing"
    },
    "inspecting": {
        defaultActionType: "validation",
        description: "Contrôle qualité",
        verb: "Contrôler",
        dataFlow: "validation",
        epcisCode: "urn:epcglobal:cbv:bizstep:inspecting"
    },
    "storing": {
        defaultActionType: "system",
        description: "Stockage/entreposage",
        verb: "Stocker", 
        dataFlow: "storage",
        epcisCode: "urn:epcglobal:cbv:bizstep:storing"
    },
    "transforming": {
        defaultActionType: "secondary",
        description: "Transformation/fabrication",
        verb: "Transformer",
        dataFlow: "transformation",
        epcisCode: "urn:epcglobal:cbv:bizstep:transforming"
    },
    "commissioning": {
        defaultActionType: "user",
        description: "Mise en service",
        verb: "Commissionner",
        dataFlow: "activation",
        epcisCode: "urn:epcglobal:cbv:bizstep:commissioning"
    },
    "decommissioning": {
        defaultActionType: "user",
        description: "Mise hors service",
        verb: "Décommissionner",
        dataFlow: "deactivation",
        epcisCode: "urn:epcglobal:cbv:bizstep:decommissioning"
    }
};

/**
 * Générateur d'ID unique pour actions ProcessMetaLanguage
 * @returns {string} ID unique au format action_[timestamp]_[random]
 * @example
 * // Returns: "action_1706375400123_xyz789"
 * const id = generateActionId();
 */
function generateActionId() {
    return `action_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * Calcule la position optimale d'une action par rapport à son état parent
 * @param {Object} statePosition - Position {x, y} de l'état parent
 * @param {number} stateWidth - Largeur de l'état (par défaut 80px)
 * @param {number} stateHeight - Hauteur de l'état (par défaut 40px)
 * @param {string} actionRole - Rôle de l'action ("primary" ou "secondary")
 * @param {number} actionIndex - Index pour actions multiples (0, 1, 2...)
 * @returns {Object} Position {x, y} pour l'action
 * @example
 * // État en (200, 300), action principale
 * const actionPos = calculateActionPosition({x: 200, y: 300}, 80, 40, "primary", 0);
 * // Returns: {x: 170, y: 360} (action centrée sous l'état)
 */
function calculateActionPosition(statePosition, stateWidth = 80, stateHeight = 40, actionRole = "primary", actionIndex = 0) {
    const offsetY = 20; // Espacement vertical entre état et actions
    const offsetBetweenActions = 15; // Espacement entre actions multiples
    
    if (actionRole === "primary") {
        // Action principale : centrée sous l'état
        return {
            x: statePosition.x + (stateWidth / 2) - (ACTION_CONFIG.width / 2),
            y: statePosition.y + stateHeight + offsetY
        };
    } else {
        // Actions secondaires : disposition en ligne sous l'action principale
        const primaryActionHeight = ACTION_CONFIG.height;
        const secondaryOffsetY = offsetY + primaryActionHeight + offsetY; // Sous l'action principale
        
        return {
            x: statePosition.x + (stateWidth / 2) - (ACTION_CONFIG.width / 2) + (actionIndex * (ACTION_CONFIG.width + offsetBetweenActions)),
            y: statePosition.y + stateHeight + secondaryOffsetY
        };
    }
}

/**
 * Valide les paramètres d'entrée pour création d'action
 * @param {string} actionName - Nom de l'action à créer
 * @param {string} actionType - Type d'action ou business step EPCIS
 * @param {Object} position - Position {x, y}
 * @param {string} [parentStateId] - ID optionnel de l'état parent
 * @throws {Error} Si les paramètres sont invalides
 */
function validateActionParameters(actionName, actionType, position, parentStateId = null) {
    // Validation nom action
    if (!actionName || typeof actionName !== 'string' || actionName.trim().length === 0) {
        throw new Error("Le nom de l'action est requis et doit être une chaîne non vide");
    }
    
    if (actionName.length > 25) {
        throw new Error("Le nom de l'action ne peut pas dépasser 25 caractères (contrainte rectangle 140px)");
    }
    
    // Validation type action ou business step
    if (!actionType || typeof actionType !== 'string') {
        throw new Error("Le type d'action est requis et doit être une chaîne");
    }
    
    if (!ACTION_TYPE_COLORS[actionType] && !EPCIS_BUSINESS_STEPS[actionType]) {
        console.warn(`Type d'action '${actionType}' non reconnu, utilisation du type 'secondary'`);
    }
    
    // Validation position
    if (!position || typeof position !== 'object') {
        throw new Error("La position est requise et doit être un objet");
    }
    
    if (typeof position.x !== 'number' || typeof position.y !== 'number') {
        throw new Error("La position doit contenir des coordonnées x et y numériques");
    }
    
    // Validation ID état parent (optionnel)
    if (parentStateId && typeof parentStateId !== 'string') {
        throw new Error("L'ID de l'état parent doit être une chaîne");
    }
}

/**
 * Résout le type d'action final basé sur business step EPCIS ou type direct
 * @param {string} actionType - Type d'action ou business step EPCIS
 * @returns {Object} Configuration {colorConfig, businessStep, finalType}
 * @example
 * // Business step EPCIS
 * const config = resolveActionTypeConfig("inspecting");
 * // Returns: {colorConfig: ACTION_TYPE_COLORS.validation, businessStep: EPCIS_BUSINESS_STEPS.inspecting, finalType: "validation"}
 */
function resolveActionTypeConfig(actionType) {
    // Vérifier si c'est un business step EPCIS 2.0
    if (EPCIS_BUSINESS_STEPS[actionType]) {
        const businessStep = EPCIS_BUSINESS_STEPS[actionType];
        const finalType = businessStep.defaultActionType;
        const colorConfig = ACTION_TYPE_COLORS[finalType];
        
        return {
            colorConfig: colorConfig,
            businessStep: businessStep,
            finalType: finalType,
            isEpcisBusinessStep: true
        };
    }
    
    // Vérifier si c'est un type d'action direct
    if (ACTION_TYPE_COLORS[actionType]) {
        return {
            colorConfig: ACTION_TYPE_COLORS[actionType],
            businessStep: null,
            finalType: actionType,
            isEpcisBusinessStep: false
        };
    }
    
    // Fallback vers type secondaire
    console.warn(`Type '${actionType}' non reconnu, utilisation du type 'secondary'`);
    return {
        colorConfig: ACTION_TYPE_COLORS.secondary,
        businessStep: null,
        finalType: "secondary",
        isEpcisBusinessStep: false
    };
}

/**
 * Crée un composant Action rectangle arrondi standardisé ProcessMetaLanguage
 * 
 * Cette fonction génère un rectangle ACTION parfaitement dimensionné (140x60px)
 * avec coins arrondis et intégration complète des business steps EPCIS 2.0.
 * Support architecture État-Actions deux niveaux avec métadonnées automatiques.
 * 
 * @param {string} actionName - Nom action visible (ex: "Contrôler_Qualité")
 * @param {string} actionType - Type action/business step (primary, inspecting, etc.)
 * @param {Object} position - Position {x, y} dans canvas
 * @param {Object} options - Options {parentStateId, targetStateId, metadata, role}
 * @returns {string} ID unique composant créé
 * @sideEffect Modifie canvas Excalidraw actif, ajoute métadonnées synchronisation
 * @throws {Error} Si ExcalidrawAutomate non disponible ou paramètres invalides
 * @example
 * // Création action principale depuis état
 * const actionId = await createActionComponent("Consulter_Données", "primary", 
 *   {x: 170, y: 320}, {parentStateId: "state_123", role: "primary"});
 * // Returns: "action_1706375400123_xyz789"
 * 
 * @example 
 * // Création action business step EPCIS avec transition
 * const actionId = await createActionComponent("Contrôler_Qualité_Lot", "inspecting",
 *   {x: 200, y: 380}, {
 *     parentStateId: "state_123", 
 *     targetStateId: "state_456",
 *     metadata: {inspector: "Marie.Martin", duration: "30min"}
 *   });
 */
async function createActionComponent(actionName, actionType, position, options = {}) {
    // Mesurer performance selon critères TASK-F003
    const startTime = performance.now();
    
    try {
        // Vérification disponibilité ExcalidrawAutomate
        if (typeof ExcalidrawAutomate === 'undefined') {
            throw new Error("ExcalidrawAutomate non disponible. Vérifiez que le plugin Excalidraw est actif avec ExcalidrawAutomate enabled.");
        }
        
        // Extraction options avec valeurs par défaut
        const { 
            parentStateId = null, 
            targetStateId = null, 
            metadata = {}, 
            role = "secondary" 
        } = options;
        
        // Validation paramètres
        validateActionParameters(actionName, actionType, position, parentStateId);
        
        // Instance ExcalidrawAutomate
        const ea = ExcalidrawAutomate;
        
        // Réinitialisation style pour éviter héritages
        ea.reset();
        
        // Résolution configuration type action
        const typeConfig = resolveActionTypeConfig(actionType);
        
        // Configuration style rectangle selon type d'action
        ea.style.strokeColor = ACTION_CONFIG.strokeColor;
        ea.style.backgroundColor = typeConfig.colorConfig.background;
        ea.style.fillStyle = ACTION_CONFIG.fillStyle;
        ea.style.strokeWidth = ACTION_CONFIG.strokeWidth;
        ea.style.roughness = ACTION_CONFIG.roughness;
        
        // Création rectangle arrondi pour action
        const rectangleId = ea.addRect(
            position.x, 
            position.y, 
            ACTION_CONFIG.width, 
            ACTION_CONFIG.height
        );
        
        // Configuration typographie pour texte centré
        ea.style.fontSize = ACTION_CONFIG.fontSize;
        ea.style.fontFamily = ACTION_CONFIG.fontFamily;
        ea.style.textAlign = "center";
        ea.style.verticalAlign = "middle";
        ea.style.strokeColor = ACTION_CONFIG.textColor;
        
        // Calcul position centrage texte dans rectangle
        const textX = position.x + (ACTION_CONFIG.width / 2);
        const textY = position.y + (ACTION_CONFIG.height / 2);
        
        // Ajout texte nom action centré dans rectangle
        const textId = ea.addText(textX, textY, actionName, {
            width: ACTION_CONFIG.width - 20, // Marge intérieure
            height: ACTION_CONFIG.height - 10,
            textAlign: "center",
            verticalAlign: "middle"
        });
        
        // Génération ID unique pour traçabilité
        const uniqueId = generateActionId();
        
        // Récupération métadonnées état parent si disponible
        let parentStateMetadata = null;
        if (parentStateId && typeof window !== 'undefined' && window.ProcessMetaLanguageStateCreator) {
            parentStateMetadata = window.ProcessMetaLanguageStateCreator.getStateMetadata(parentStateId);
        }
        
        // Récupération métadonnées état cible si disponible
        let targetStateMetadata = null;
        if (targetStateId && typeof window !== 'undefined' && window.ProcessMetaLanguageStateCreator) {
            targetStateMetadata = window.ProcessMetaLanguageStateCreator.getStateMetadata(targetStateId);
        }
        
        // Métadonnées ProcessMetaLanguage automatiques
        const processMetadata = {
            // Identifiants ProcessMetaLanguage
            processType: "action",
            processTag: ACTION_CONFIG.processTag,
            uniqueId: uniqueId,
            
            // Données action
            actionName: actionName,
            actionType: typeConfig.finalType,
            actionTypeDescription: typeConfig.colorConfig.description,
            actionCategory: typeConfig.colorConfig.category,
            role: role, // "primary" ou "secondary"
            
            // Business step EPCIS 2.0 si applicable
            epcisBusinessStep: typeConfig.businessStep?.epcisCode || null,
            businessStepDescription: typeConfig.businessStep?.description || null,
            businessStepVerb: typeConfig.businessStep?.verb || null,
            dataFlow: typeConfig.businessStep?.dataFlow || null,
            isEpcisCompliant: typeConfig.isEpcisBusinessStep,
            
            // Relations État-Actions architecture
            parentStateId: parentStateId,
            parentStateName: parentStateMetadata?.stateName || null,
            targetStateId: targetStateId,
            targetStateName: targetStateMetadata?.stateName || null,
            
            // Positionnement et dimensions
            position: {
                x: position.x,
                y: position.y
            },
            dimensions: {
                width: ACTION_CONFIG.width,
                height: ACTION_CONFIG.height,
                borderRadius: ACTION_CONFIG.borderRadius
            },
            
            // Horodatage
            createdAt: new Date().toISOString(),
            version: ACTION_CONFIG.version,
            
            // Métadonnées utilisateur fusionnées
            userMetadata: metadata,
            
            // Conformité EPCIS 2.0
            epcisCompliant: true,
            epcisVersion: "2.0"
        };
        
        // Application métadonnées au rectangle
        ea.setElementWithAttributes(rectangleId, {
            customData: processMetadata
        });
        
        // Stocker l'ID réel de l'élément dans les métadonnées
        processMetadata.elementId = rectangleId;
        
        // Tags obligatoires pour synchronisation
        const requiredTags = [
            ACTION_CONFIG.processTag,
            `#action-${typeConfig.finalType}`,
            `#action-${actionName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`,
            `#action-id-${uniqueId}`,
            `#action-role-${role}`
        ];
        
        // Tags business step EPCIS si applicable
        if (typeConfig.isEpcisBusinessStep) {
            requiredTags.push(`#epcis-${actionType}`);
            requiredTags.push(`#business-step-${actionType}`);
        }
        
        // Tags de relation avec états
        if (parentStateId) {
            requiredTags.push(`#parent-state-${parentStateId}`);
        }
        if (targetStateId) {
            requiredTags.push(`#target-state-${targetStateId}`);
        }
        
        // Application des tags (simulation car ExcalidrawAutomate ne supporte pas directement les tags)
        processMetadata.syncTags = requiredTags;
        
        // Création finale dans le canvas
        await ea.create();
        
        // Setup event listeners pour interactions futures
        setupActionEventListeners(rectangleId, processMetadata);
        
        // Mise à jour métadonnées état parent si disponible
        if (parentStateId && typeof window !== 'undefined' && window.ProcessMetaLanguageStateCreator) {
            const currentActions = parentStateMetadata?.attachedActions || [];
            window.ProcessMetaLanguageStateCreator.updateStateMetadata(parentStateId, {
                attachedActions: [...currentActions, {
                    actionId: rectangleId,
                    uniqueId: uniqueId,
                    actionName: actionName,
                    actionType: typeConfig.finalType,
                    role: role,
                    targetStateId: targetStateId,
                    createdAt: processMetadata.createdAt
                }]
            });
        }
        
        // Mesure performance finale
        const endTime = performance.now();
        const executionTime = endTime - startTime;
        
        // Validation critère performance <2s
        if (executionTime > 2000) {
            console.warn(`⚠️ Performance warning: Création action en ${executionTime.toFixed(2)}ms (target: <2000ms)`);
        } else {
            console.log(`✅ Action créée en ${executionTime.toFixed(2)}ms (performance OK)`);
        }
        
        // Log création pour débogage
        console.log(`⚡ Action ProcessMetaLanguage créée:`, {
            id: rectangleId,
            uniqueId: uniqueId,
            name: actionName,
            type: typeConfig.finalType,
            businessStep: typeConfig.businessStep?.epcisCode || "none",
            role: role,
            position: position,
            parentStateId: parentStateId,
            targetStateId: targetStateId,
            executionTime: `${executionTime.toFixed(2)}ms`
        });
        
        return rectangleId;
        
    } catch (error) {
        console.error(`❌ Erreur création action '${actionName}':`, error.message);
        throw error;
    }
}

/**
 * Configure les listeners d'événements pour une action ProcessMetaLanguage
 * @param {string} actionId - ID de l'action Excalidraw
 * @param {Object} metadata - Métadonnées de l'action
 * @sideEffect Ajoute des handlers d'événements pour interactions utilisateur
 * @example
 * setupActionEventListeners("action_123", {actionName: "Contrôler_Qualité"});
 */
function setupActionEventListeners(actionId, metadata) {
    // Simulation des event listeners (implémentation future)
    console.log(`🔗 Event listeners configurés pour action ${metadata.actionName} (${actionId})`);
    
    // Stockage des handlers pour nettoyage futur
    if (!window.ProcessMetaLanguageActionEventHandlers) {
        window.ProcessMetaLanguageActionEventHandlers = new Map();
    }
    
    window.ProcessMetaLanguageActionEventHandlers.set(actionId, {
        onClick: () => console.log(`Clic sur action ${metadata.actionName} → Exécuter action`),
        onDoubleClick: () => console.log(`Double-clic sur action ${metadata.actionName} → Ouvrir paramètres`),
        onHover: () => console.log(`Hover sur action ${metadata.actionName} → Afficher workflow`)
    });
}

/**
 * Crée automatiquement une action positionnée par rapport à un état parent
 * @param {string} stateId - ID de l'état parent
 * @param {string} actionName - Nom de l'action
 * @param {string} actionType - Type action/business step EPCIS
 * @param {string} role - Rôle action ("primary" ou "secondary")
 * @param {Object} options - Options {targetStateId, metadata, actionIndex}
 * @returns {string} ID unique de l'action créée
 * @sideEffect Calcule automatiquement la position et crée l'action
 * @example
 * // Création action principale automatiquement positionnée
 * const actionId = await createActionForState("state_123", "Consulter_Données", "primary", "primary",
 *   {metadata: {dataType: "lot-information"}});
 * 
 * @example
 * // Création action secondaire business step avec transition
 * const actionId = await createActionForState("state_123", "Contrôler_Qualité", "inspecting", "secondary",
 *   {targetStateId: "state_456", actionIndex: 0});
 */
async function createActionForState(stateId, actionName, actionType, role = "secondary", options = {}) {
    try {
        // Extraction options
        const { targetStateId = null, metadata = {}, actionIndex = 0 } = options;
        
        // Récupération métadonnées état parent
        let stateMetadata = null;
        if (typeof window !== 'undefined' && window.ProcessMetaLanguageStateCreator) {
            stateMetadata = window.ProcessMetaLanguageStateCreator.getStateMetadata(stateId);
        }
        
        if (!stateMetadata) {
            throw new Error(`État parent ${stateId} non trouvé ou inaccessible`);
        }
        
        // Calcul position automatique de l'action
        const actionPosition = calculateActionPosition(
            stateMetadata.position,
            stateMetadata.dimensions.width,
            stateMetadata.dimensions.height,
            role,
            actionIndex
        );
        
        // Création action avec intégration automatique
        return await createActionComponent(actionName, actionType, actionPosition, {
            parentStateId: stateId,
            targetStateId: targetStateId,
            metadata: metadata,
            role: role
        });
        
    } catch (error) {
        console.error(`❌ Erreur création action pour état ${stateId}:`, error.message);
        throw error;
    }
}

/**
 * Récupère les métadonnées d'une action ProcessMetaLanguage
 * @param {string} actionId - ID unique de l'action
 * @returns {Object|null} Métadonnées de l'action ou null si non trouvé
 * @example
 * const metadata = getActionMetadata("action_123_xyz");
 * console.log(metadata.actionName); // "Contrôler_Qualité"
 */
function getActionMetadata(actionId) {
    try {
        if (typeof ExcalidrawAutomate === 'undefined') {
            console.warn("ExcalidrawAutomate non disponible pour récupération métadonnées");
            return null;
        }
        
        const element = ExcalidrawAutomate.getElement(actionId);
        return element?.customData || null;
        
    } catch (error) {
        console.error(`Erreur récupération métadonnées action ${actionId}:`, error);
        return null;
    }
}

/**
 * Met à jour les métadonnées d'une action existante
 * @param {string} actionId - ID de l'action à modifier
 * @param {Object} newMetadata - Nouvelles métadonnées à fusionner
 * @returns {boolean} True si mise à jour réussie
 * @sideEffect Modifie les métadonnées de l'action dans le canvas
 * @example
 * const success = updateActionMetadata("action_123", {
 *   lastExecuted: new Date().toISOString(),
 *   executionCount: 5
 * });
 */
function updateActionMetadata(actionId, newMetadata) {
    try {
        if (typeof ExcalidrawAutomate === 'undefined') {
            throw new Error("ExcalidrawAutomate non disponible");
        }
        
        const currentMetadata = getActionMetadata(actionId);
        if (!currentMetadata) {
            throw new Error(`Action ${actionId} non trouvée`);
        }
        
        // Fusion métadonnées avec horodatage
        const updatedMetadata = {
            ...currentMetadata,
            ...newMetadata,
            lastModified: new Date().toISOString()
        };
        
        ExcalidrawAutomate.setElementWithAttributes(actionId, {
            customData: updatedMetadata
        });
        
        console.log(`✅ Métadonnées mises à jour pour action ${currentMetadata.actionName}`);
        return true;
        
    } catch (error) {
        console.error(`❌ Erreur mise à jour métadonnées action:`, error.message);
        return false;
    }
}

/**
 * Change le type d'une action existante (couleur et configuration)
 * @param {string} actionId - ID de l'action à modifier
 * @param {string} newActionType - Nouveau type d'action ou business step
 * @returns {boolean} True si changement réussi
 * @sideEffect Modifie la couleur et les métadonnées de l'action
 * @example
 * // Changer action de "secondary" vers business step "inspecting"
 * const success = changeActionType("action_123", "inspecting");
 */
function changeActionType(actionId, newActionType) {
    try {
        const currentMetadata = getActionMetadata(actionId);
        if (!currentMetadata) {
            throw new Error(`Action ${actionId} non trouvée`);
        }
        
        // Résolution nouvelle configuration
        const newTypeConfig = resolveActionTypeConfig(newActionType);
        
        // Mise à jour style visuel
        if (typeof ExcalidrawAutomate !== 'undefined') {
            ExcalidrawAutomate.setElementWithAttributes(actionId, {
                backgroundColor: newTypeConfig.colorConfig.background
            });
        }
        
        // Mise à jour métadonnées
        const success = updateActionMetadata(actionId, {
            actionType: newTypeConfig.finalType,
            actionTypeDescription: newTypeConfig.colorConfig.description,
            actionCategory: newTypeConfig.colorConfig.category,
            epcisBusinessStep: newTypeConfig.businessStep?.epcisCode || null,
            businessStepDescription: newTypeConfig.businessStep?.description || null,
            businessStepVerb: newTypeConfig.businessStep?.verb || null,
            dataFlow: newTypeConfig.businessStep?.dataFlow || null,
            isEpcisCompliant: newTypeConfig.isEpcisBusinessStep,
            typeChangedAt: new Date().toISOString()
        });
        
        if (success) {
            console.log(`🎨 Type action '${currentMetadata.actionName}' changé: ${currentMetadata.actionType} → ${newTypeConfig.finalType}`);
        }
        
        return success;
        
    } catch (error) {
        console.error(`❌ Erreur changement type action:`, error.message);
        return false;
    }
}

/**
 * Supprime une action ProcessMetaLanguage du canvas
 * @param {string} actionId - ID de l'action à supprimer
 * @returns {boolean} True si suppression réussie
 * @sideEffect Supprime l'action et nettoie les event listeners + références parent
 * @example
 * const deleted = deleteActionComponent("action_123_xyz");
 */
function deleteActionComponent(actionId) {
    try {
        if (typeof ExcalidrawAutomate === 'undefined') {
            throw new Error("ExcalidrawAutomate non disponible");
        }
        
        // Récupérer métadonnées pour log et nettoyage avant suppression
        const metadata = getActionMetadata(actionId);
        const actionName = metadata?.actionName || actionId;
        const parentStateId = metadata?.parentStateId;
        
        // Nettoyer référence dans l'état parent
        if (parentStateId && typeof window !== 'undefined' && window.ProcessMetaLanguageStateCreator) {
            const parentMetadata = window.ProcessMetaLanguageStateCreator.getStateMetadata(parentStateId);
            if (parentMetadata?.attachedActions) {
                const updatedActions = parentMetadata.attachedActions.filter(action => action.actionId !== actionId);
                window.ProcessMetaLanguageStateCreator.updateStateMetadata(parentStateId, {
                    attachedActions: updatedActions
                });
            }
        }
        
        // Supprimer l'élément du canvas
        ExcalidrawAutomate.deleteElement(actionId);
        
        // Nettoyer event listeners
        if (window.ProcessMetaLanguageActionEventHandlers) {
            window.ProcessMetaLanguageActionEventHandlers.delete(actionId);
        }
        
        console.log(`🗑️ Action supprimée: ${actionName} (${actionId})`);
        return true;
        
    } catch (error) {
        console.error(`❌ Erreur suppression action:`, error.message);
        return false;
    }
}

/**
 * Obtient la liste des types d'actions disponibles
 * @returns {Array<Object>} Liste des types avec descriptions et couleurs
 * @example
 * const types = getAvailableActionTypes();
 * types.forEach(type => console.log(`${type.key}: ${type.description}`));
 */
function getAvailableActionTypes() {
    return Object.entries(ACTION_TYPE_COLORS).map(([key, value]) => ({
        key: key,
        background: value.background,
        description: value.description,
        category: value.category
    }));
}

/**
 * Obtient la liste des business steps EPCIS 2.0 disponibles
 * @returns {Array<Object>} Liste des business steps avec descriptions
 * @example
 * const businessSteps = getAvailableBusinessSteps();
 * businessSteps.forEach(step => console.log(`${step.key}: ${step.description}`));
 */
function getAvailableBusinessSteps() {
    return Object.entries(EPCIS_BUSINESS_STEPS).map(([key, value]) => ({
        key: key,
        description: value.description,
        verb: value.verb,
        dataFlow: value.dataFlow,
        defaultActionType: value.defaultActionType,
        epcisCode: value.epcisCode
    }));
}

/**
 * Trouve toutes les actions attachées à un état spécifique
 * @param {string} stateId - ID de l'état parent
 * @returns {Array<Object>} Liste des actions avec leurs métadonnées
 * @example
 * const actions = findActionsByState("state_123");
 * actions.forEach(action => console.log(`Action: ${action.actionName} (${action.role})`));
 */
function findActionsByState(stateId) {
    try {
        // Récupération via métadonnées état parent (plus efficace)
        if (typeof window !== 'undefined' && window.ProcessMetaLanguageStateCreator) {
            const stateMetadata = window.ProcessMetaLanguageStateCreator.getStateMetadata(stateId);
            return stateMetadata?.attachedActions || [];
        }
        
        // Fallback : recherche dans tous les handlers d'événements
        const attachedActions = [];
        if (window.ProcessMetaLanguageActionEventHandlers) {
            for (const [actionId, handlers] of window.ProcessMetaLanguageActionEventHandlers.entries()) {
                const metadata = getActionMetadata(actionId);
                if (metadata?.parentStateId === stateId) {
                    attachedActions.push({
                        actionId: actionId,
                        uniqueId: metadata.uniqueId,
                        actionName: metadata.actionName,
                        actionType: metadata.actionType,
                        role: metadata.role,
                        targetStateId: metadata.targetStateId,
                        createdAt: metadata.createdAt
                    });
                }
            }
        }
        
        return attachedActions;
        
    } catch (error) {
        console.error(`Erreur recherche actions pour état ${stateId}:`, error);
        return [];
    }
}

/**
 * Crée automatiquement l'action principale pour un état selon architecture ProcessMetaLanguage
 * @param {string} stateId - ID de l'état pour lequel créer l'action principale
 * @param {Object} metadata - Métadonnées optionnelles pour l'action
 * @returns {string} ID de l'action principale créée
 * @sideEffect Crée action exposition données automatique selon convention État-Actions
 * @example
 * // Création action principale automatique
 * const mainActionId = await createMainActionForState("state_123", {
 *   dataExposition: ["objectMetadata", "stateHistory", "availableActions"]
 * });
 */
async function createMainActionForState(stateId, metadata = {}) {
    try {
        // Récupération métadonnées état pour génération nom action automatique
        let stateMetadata = null;
        if (typeof window !== 'undefined' && window.ProcessMetaLanguageStateCreator) {
            stateMetadata = window.ProcessMetaLanguageStateCreator.getStateMetadata(stateId);
        }
        
        if (!stateMetadata) {
            throw new Error(`État parent ${stateId} non trouvé pour création action principale`);
        }
        
        // Génération nom action principale automatique
        const mainActionName = `Consulter_${stateMetadata.stateName}`;
        
        // Métadonnées action principale enrichies
        const mainActionMetadata = {
            ...metadata,
            exposedData: [
                "objectMetadata",
                "stateHistory", 
                "attachedActions",
                "transitionOptions"
            ],
            isAutoGenerated: true,
            purpose: "exposition_données"
        };
        
        return await createActionForState(
            stateId, 
            mainActionName, 
            "primary", 
            "primary",
            { metadata: mainActionMetadata }
        );
        
    } catch (error) {
        console.error(`❌ Erreur création action principale pour état ${stateId}:`, error.message);
        throw error;
    }
}

// Export des fonctions pour tests et utilisation externe
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        createActionComponent,
        createActionForState,
        createMainActionForState,
        getActionMetadata,
        updateActionMetadata,
        changeActionType,
        deleteActionComponent,
        getAvailableActionTypes,
        getAvailableBusinessSteps,
        findActionsByState,
        calculateActionPosition,
        generateActionId,
        validateActionParameters, // Ajout pour tests
        resolveActionTypeConfig, // Ajout pour tests
        setupActionEventListeners, // Ajout pour tests
        ACTION_CONFIG,
        ACTION_TYPE_COLORS,
        EPCIS_BUSINESS_STEPS
    };
}

// Export pour environnement browser/Obsidian
if (typeof window !== 'undefined') {
    window.ProcessMetaLanguageActionCreator = {
        createActionComponent,
        createActionForState,
        createMainActionForState,
        getActionMetadata,
        updateActionMetadata,
        changeActionType,
        deleteActionComponent,
        getAvailableActionTypes,
        getAvailableBusinessSteps,
        findActionsByState,
        calculateActionPosition,
        ACTION_CONFIG,
        ACTION_TYPE_COLORS,
        EPCIS_BUSINESS_STEPS
    };
}

// <!-- END OF FILE: action-creator.js -->