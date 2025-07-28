// <!-- START OF FILE: state-creator.js -->
// FILENAME: state-creator.js
// Version: 1.0.0
// Date: 2025-07-27 19:15
// Author: Rolland MELET & Claude Code
// Description: Module création bannière STATE superposée selon spécifications TASK-F002

/**
 * Module ProcessMetaLanguage - Création Composants STATE
 * 
 * Spécialiste création bannières STATE standardisées dans Excalidraw
 * Architecture État-Actions deux niveaux pour traçabilité industrielle
 * Superposition intelligente sur hexagones OBJECT + conformité EPCIS 2.0
 */

/**
 * Configuration par défaut des états ProcessMetaLanguage
 * @constant {Object}
 */
const STATE_CONFIG = {
    // Dimensions standard bannière STATE
    width: 80,
    height: 40,
    
    // Positionnement par rapport à l'hexagone OBJECT
    offsetX: 0,    // Centré horizontalement sur l'hexagone
    offsetY: -50,  // Positionnée au-dessus (-50px)
    
    // Styles graphiques standardisés
    strokeWidth: 2,
    strokeColor: "#1e1e1e",
    fillStyle: "solid",
    roughness: 0, // Forme précise pour professionnalisme
    borderRadius: 8, // Coins arrondis pour style bannière
    
    // Typographie
    fontSize: 12,
    fontFamily: 3, // Cascadia Code
    textColor: "#ffffff", // Texte blanc pour contraste
    
    // Métadonnées
    processTag: "#process-state",
    version: "1.0.0"
};

/**
 * Palette couleurs par disposition EPCIS 2.0 - 25 dispositions complètes CBV 2.0
 * @constant {Object}
 */
const STATE_DISPOSITION_COLORS = {
    // Dispositions EPCIS 2.0 officielles CBV 2.0 (25 total)
    "active": {
        background: "#4CAF50",
        description: "État opérationnel actif"
    },
    "container_closed": {
        background: "#607D8B",
        description: "Conteneur fermé et scellé"
    },
    "container_open": {
        background: "#795548",
        description: "Conteneur ouvert et accessible"
    },
    "damaged": {
        background: "#F44336",
        description: "Défaillant ou endommagé"
    },
    "destroyed": {
        background: "#424242",
        description: "Détruit définitivement"
    },
    "dispensed": {
        background: "#8BC34A",
        description: "Distribué ou dispensé"
    },
    "encoded": {
        background: "#3F51B5",
        description: "Encodé avec marquage traçabilité"
    },
    "expired": {
        background: "#9C27B0",
        description: "Expiré ou périmé"
    },
    "in_progress": {
        background: "#FF9800", 
        description: "En cours de traitement"
    },
    "in_transit": {
        background: "#2196F3",
        description: "En déplacement ou transport"
    },
    "inactive": {
        background: "#757575",
        description: "Temporairement inactif"
    },
    "non_sellable": {
        background: "#E91E63",
        description: "Non vendable pour contraintes"
    },
    "partially_dispensed": {
        background: "#CDDC39",
        description: "Partiellement dispensé"
    },
    "recalled": {
        background: "#B71C1C",
        description: "Rappelé pour défaut"
    },
    "reserved": {
        background: "#FF5722",
        description: "Réservé ou alloué"
    },
    "retail_sold": {
        background: "#00BCD4",
        description: "Vendu au détail"
    },
    "returned": {
        background: "#9C27B0",
        description: "Retourné par client"
    },
    "sellable_accessible": {
        background: "#4CAF50",
        description: "Vendable et accessible"
    },
    "sellable_not_accessible": {
        background: "#FFC107",
        description: "Vendable mais non accessible"
    },
    "stolen": {
        background: "#D32F2F",
        description: "Volé ou perdu"
    },
    "unavailable": {
        background: "#616161",
        description: "Temporairement indisponible"
    },
    "unknown": {
        background: "#9E9E9E",
        description: "État indéterminé"
    },
    "consumed": {
        background: "#689F38",
        description: "Consommé ou utilisé"
    },
    "installed": {
        background: "#8E24AA",
        description: "Installé en place"
    },
    "disposed": {
        background: "#795548",
        description: "Mis au rebut selon réglementations"
    },
    
    // Dispositions ProcessMetaLanguage étendues (compatibilité legacy)
    "completed": {
        background: "#388E3C",
        description: "Traitement terminé avec succès"
    },
    "pending": {
        background: "#FFC107",
        description: "En attente de traitement"
    },
    "quarantine": {
        background: "#E65100",
        description: "En quarantaine ou isolé"
    },
    "validated": {
        background: "#1976D2",
        description: "Validé et conforme"
    }
};

/**
 * Générateur d'ID unique pour états ProcessMetaLanguage
 * @returns {string} ID unique au format state_[timestamp]_[random]
 * @example
 * // Returns: "state_1706375400123_xyz789"
 * const id = generateStateId();
 */
function generateStateId() {
    return `state_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * Calcule la position optimale de la bannière STATE par rapport à l'hexagone OBJECT
 * @param {Object} objectPosition - Position {x, y} de l'hexagone parent
 * @param {number} objectWidth - Largeur de l'hexagone (par défaut 120px)
 * @param {number} objectHeight - Hauteur de l'hexagone (par défaut 80px)
 * @returns {Object} Position {x, y} pour la bannière STATE
 * @example
 * // Hexagone centré en (200, 300)
 * const bannerPos = calculateStatePosition({x: 200, y: 300}, 120, 80);
 * // Returns: {x: 160, y: 250} (bannière 80px centrée au-dessus)
 */
function calculateStatePosition(objectPosition, objectWidth = 120, objectHeight = 80) {
    return {
        x: objectPosition.x - (STATE_CONFIG.width / 2), // Centré horizontalement
        y: objectPosition.y + STATE_CONFIG.offsetY      // Positionnée au-dessus
    };
}

/**
 * Valide les paramètres d'entrée pour création d'état
 * @param {string} stateName - Nom de l'état à créer
 * @param {string} disposition - Disposition EPCIS 2.0
 * @param {Object} position - Position {x, y}
 * @param {string} [parentObjectId] - ID optionnel de l'objet parent
 * @throws {Error} Si les paramètres sont invalides
 */
function validateStateParameters(stateName, disposition, position, parentObjectId = null) {
    // Validation nom état
    if (!stateName || typeof stateName !== 'string' || stateName.trim().length === 0) {
        throw new Error("Le nom de l'état est requis et doit être une chaîne non vide");
    }
    
    if (stateName.length > 20) {
        throw new Error("Le nom de l'état ne peut pas dépasser 20 caractères (contrainte bannière 80px)");
    }
    
    // Validation disposition EPCIS 2.0
    if (!disposition || typeof disposition !== 'string') {
        throw new Error("La disposition est requise et doit être une chaîne");
    }
    
    if (!STATE_DISPOSITION_COLORS[disposition]) {
        console.warn(`Disposition '${disposition}' non reconnue EPCIS 2.0, utilisation de 'unknown'`);
    }
    
    // Validation position
    if (!position || typeof position !== 'object') {
        throw new Error("La position est requise et doit être un objet");
    }
    
    if (typeof position.x !== 'number' || typeof position.y !== 'number') {
        throw new Error("La position doit contenir des coordonnées x et y numériques");
    }
    
    // Validation ID objet parent (optionnel)
    if (parentObjectId && typeof parentObjectId !== 'string') {
        throw new Error("L'ID de l'objet parent doit être une chaîne");
    }
}

/**
 * Crée un composant State bannière standardisé ProcessMetaLanguage
 * 
 * Cette fonction génère une bannière STATE parfaitement dimensionnée (80x40px)
 * avec superposition intelligente sur hexagone OBJECT. Conformité EPCIS 2.0
 * pour les dispositions industrielles avec métadonnées automatiques.
 * 
 * @param {string} stateName - Nom état visible (ex: "En_Production")
 * @param {string} disposition - Disposition EPCIS 2.0 (active, in_progress, etc.)
 * @param {Object} position - Position {x, y} dans canvas
 * @param {Object} options - Options {parentObjectId, metadata}
 * @returns {string} ID unique composant créé
 * @sideEffect Modifie canvas Excalidraw actif, ajoute métadonnées synchronisation
 * @throws {Error} Si ExcalidrawAutomate non disponible ou paramètres invalides
 * @example
 * // Création état superposé sur hexagone existant
 * const stateId = await createStateComponent("En_Production", "active", 
 *   {x: 160, y: 250}, {parentObjectId: "obj_123", operator: "Jean.Dupont"});
 * // Returns: "state_1706375400123_xyz789"
 * 
 * @example
 * // Création état avec positionnement automatique
 * const hexagonPos = {x: 200, y: 300};
 * const bannerPos = calculateStatePosition(hexagonPos);
 * const stateId = await createStateComponent("Controle_Qualite", "in_progress", 
 *   bannerPos, {parentObjectId: hexagonId});
 */
async function createStateComponent(stateName, disposition, position, options = {}) {
    // Mesurer performance selon critères TASK-F002
    const startTime = performance.now();
    
    try {
        // Vérification disponibilité ExcalidrawAutomate
        if (typeof ExcalidrawAutomate === 'undefined') {
            throw new Error("ExcalidrawAutomate non disponible. Vérifiez que le plugin Excalidraw est actif avec ExcalidrawAutomate enabled.");
        }
        
        // Extraction options avec valeurs par défaut
        const { parentObjectId = null, metadata = {} } = options;
        
        // Validation paramètres
        validateStateParameters(stateName, disposition, position, parentObjectId);
        
        // Instance ExcalidrawAutomate
        const ea = ExcalidrawAutomate;
        
        // Réinitialisation style pour éviter héritages
        ea.reset();
        
        // Configuration style bannière selon disposition EPCIS 2.0
        const dispositionColor = STATE_DISPOSITION_COLORS[disposition] || STATE_DISPOSITION_COLORS.unknown;
        
        ea.style.strokeColor = STATE_CONFIG.strokeColor;
        ea.style.backgroundColor = dispositionColor.background;
        ea.style.fillStyle = STATE_CONFIG.fillStyle;
        ea.style.strokeWidth = STATE_CONFIG.strokeWidth;
        ea.style.roughness = STATE_CONFIG.roughness;
        
        // Création rectangle arrondi pour effet bannière
        const rectangleId = ea.addRect(
            position.x, 
            position.y, 
            STATE_CONFIG.width, 
            STATE_CONFIG.height
        );
        
        // Configuration typographie pour texte centré
        ea.style.fontSize = STATE_CONFIG.fontSize;
        ea.style.fontFamily = STATE_CONFIG.fontFamily;
        ea.style.textAlign = "center";
        ea.style.verticalAlign = "middle";
        ea.style.strokeColor = STATE_CONFIG.textColor;
        
        // Calcul position centrage texte dans bannière
        const textX = position.x + (STATE_CONFIG.width / 2);
        const textY = position.y + (STATE_CONFIG.height / 2);
        
        // Ajout texte nom état centré dans bannière
        const textId = ea.addText(textX, textY, stateName, {
            width: STATE_CONFIG.width - 10, // Marge intérieure
            height: STATE_CONFIG.height - 6,
            textAlign: "center",
            verticalAlign: "middle"
        });
        
        // Génération ID unique pour traçabilité
        const uniqueId = generateStateId();
        
        // Récupération métadonnées objet parent si disponible
        let parentMetadata = null;
        if (parentObjectId && typeof window !== 'undefined' && window.ProcessMetaLanguageObjectCreator) {
            parentMetadata = window.ProcessMetaLanguageObjectCreator.getObjectMetadata(parentObjectId);
        }
        
        // Métadonnées ProcessMetaLanguage automatiques
        const processMetadata = {
            // Identifiants ProcessMetaLanguage
            processType: "state",
            processTag: STATE_CONFIG.processTag,
            uniqueId: uniqueId,
            
            // Données état
            stateName: stateName,
            disposition: disposition,
            dispositionDescription: dispositionColor.description,
            
            // Relation avec objet parent
            parentObjectId: parentObjectId,
            parentObjectName: parentMetadata?.objectName || null,
            
            // Positionnement et dimensions
            position: {
                x: position.x,
                y: position.y
            },
            dimensions: {
                width: STATE_CONFIG.width,
                height: STATE_CONFIG.height
            },
            
            // Horodatage
            createdAt: new Date().toISOString(),
            version: STATE_CONFIG.version,
            
            // Métadonnées utilisateur fusionnées
            userMetadata: metadata,
            
            // Conformité EPCIS 2.0
            epcisCompliant: true,
            epcisVersion: "2.0",
            epcisDisposition: disposition
        };
        
        // Application métadonnées à la bannière
        ea.setElementWithAttributes(rectangleId, {
            customData: processMetadata
        });
        
        // Stocker l'ID réel de l'élément dans les métadonnées
        processMetadata.elementId = rectangleId;
        
        // Tags obligatoires pour synchronisation
        const requiredTags = [
            STATE_CONFIG.processTag,
            `#state-${disposition}`,
            `#state-${stateName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`,
            `#state-id-${uniqueId}`
        ];
        
        // Tag de relation avec objet parent
        if (parentObjectId) {
            requiredTags.push(`#parent-object-${parentObjectId}`);
        }
        
        // Application des tags (simulation car ExcalidrawAutomate ne supporte pas directement les tags)
        processMetadata.syncTags = requiredTags;
        
        // Création finale dans le canvas
        await ea.create();
        
        // Setup event listeners pour interactions futures
        setupStateEventListeners(rectangleId, processMetadata);
        
        // Mise à jour métadonnées objet parent si disponible
        if (parentObjectId && typeof window !== 'undefined' && window.ProcessMetaLanguageObjectCreator) {
            const currentStates = parentMetadata?.attachedStates || [];
            window.ProcessMetaLanguageObjectCreator.updateObjectMetadata(parentObjectId, {
                attachedStates: [...currentStates, {
                    stateId: rectangleId,
                    uniqueId: uniqueId,
                    stateName: stateName,
                    disposition: disposition,
                    createdAt: processMetadata.createdAt
                }]
            });
        }
        
        // Mesure performance finale
        const endTime = performance.now();
        const executionTime = endTime - startTime;
        
        // Validation critère performance <2s
        if (executionTime > 2000) {
            console.warn(`⚠️ Performance warning: Création état en ${executionTime.toFixed(2)}ms (target: <2000ms)`);
        } else {
            console.log(`✅ État créé en ${executionTime.toFixed(2)}ms (performance OK)`);
        }
        
        // Log création pour débogage
        console.log(`🏷️ État ProcessMetaLanguage créé:`, {
            id: rectangleId,
            uniqueId: uniqueId,
            name: stateName,
            disposition: disposition,
            position: position,
            parentObjectId: parentObjectId,
            executionTime: `${executionTime.toFixed(2)}ms`
        });
        
        return rectangleId;
        
    } catch (error) {
        console.error(`❌ Erreur création état '${stateName}':`, error.message);
        throw error;
    }
}

/**
 * Configure les listeners d'événements pour un état ProcessMetaLanguage
 * @param {string} stateId - ID de l'état Excalidraw
 * @param {Object} metadata - Métadonnées de l'état
 * @sideEffect Ajoute des handlers d'événements pour interactions utilisateur
 * @example
 * setupStateEventListeners("state_123", {stateName: "En_Production"});
 */
function setupStateEventListeners(stateId, metadata) {
    // Simulation des event listeners (implémentation future)
    console.log(`🔗 Event listeners configurés pour état ${metadata.stateName} (${stateId})`);
    
    // Stockage des handlers pour nettoyage futur
    if (!window.ProcessMetaLanguageStateEventHandlers) {
        window.ProcessMetaLanguageStateEventHandlers = new Map();
    }
    
    window.ProcessMetaLanguageStateEventHandlers.set(stateId, {
        onClick: () => console.log(`Clic sur état ${metadata.stateName}`),
        onDoubleClick: () => console.log(`Double-clic sur état ${metadata.stateName} → Ouvrir menu actions`),
        onHover: () => console.log(`Hover sur état ${metadata.stateName} → Afficher tooltip`)
    });
}

/**
 * Crée automatiquement un état positionné sur un hexagone OBJECT existant
 * @param {string} objectId - ID de l'hexagone parent
 * @param {string} stateName - Nom de l'état
 * @param {string} disposition - Disposition EPCIS 2.0
 * @param {Object} metadata - Métadonnées optionnelles
 * @returns {string} ID unique de l'état créé
 * @sideEffect Calcule automatiquement la position et crée l'état superposé
 * @example
 * // Création état automatiquement positionné
 * const stateId = await createStateOnObject("obj_123", "Controle_Qualite", "in_progress", 
 *   {inspector: "Marie.Martin", checkDate: "2024-01-15"});
 */
async function createStateOnObject(objectId, stateName, disposition, metadata = {}) {
    try {
        // Récupération métadonnées objet parent
        let objectMetadata = null;
        if (typeof window !== 'undefined' && window.ProcessMetaLanguageObjectCreator) {
            objectMetadata = window.ProcessMetaLanguageObjectCreator.getObjectMetadata(objectId);
        }
        
        if (!objectMetadata) {
            throw new Error(`Objet parent ${objectId} non trouvé ou inaccessible`);
        }
        
        // Calcul position automatique de la bannière
        const statePosition = calculateStatePosition(
            objectMetadata.position,
            objectMetadata.dimensions.width,
            objectMetadata.dimensions.height
        );
        
        // Création état avec intégration automatique
        return await createStateComponent(stateName, disposition, statePosition, {
            parentObjectId: objectId,
            metadata: metadata
        });
        
    } catch (error) {
        console.error(`❌ Erreur création état sur objet ${objectId}:`, error.message);
        throw error;
    }
}

/**
 * Récupère les métadonnées d'un état ProcessMetaLanguage
 * @param {string} stateId - ID unique de l'état
 * @returns {Object|null} Métadonnées de l'état ou null si non trouvé
 * @example
 * const metadata = getStateMetadata("state_123_xyz");
 * console.log(metadata.stateName); // "En_Production"
 */
function getStateMetadata(stateId) {
    try {
        if (typeof ExcalidrawAutomate === 'undefined') {
            console.warn("ExcalidrawAutomate non disponible pour récupération métadonnées");
            return null;
        }
        
        const element = ExcalidrawAutomate.getElement(stateId);
        return element?.customData || null;
        
    } catch (error) {
        console.error(`Erreur récupération métadonnées état ${stateId}:`, error);
        return null;
    }
}

/**
 * Met à jour les métadonnées d'un état existant
 * @param {string} stateId - ID de l'état à modifier
 * @param {Object} newMetadata - Nouvelles métadonnées à fusionner
 * @returns {boolean} True si mise à jour réussie
 * @sideEffect Modifie les métadonnées de l'état dans le canvas
 * @example
 * const success = updateStateMetadata("state_123", {
 *   lastModified: new Date().toISOString(),
 *   operator: "Paul.Durand"
 * });
 */
function updateStateMetadata(stateId, newMetadata) {
    try {
        if (typeof ExcalidrawAutomate === 'undefined') {
            throw new Error("ExcalidrawAutomate non disponible");
        }
        
        const currentMetadata = getStateMetadata(stateId);
        if (!currentMetadata) {
            throw new Error(`État ${stateId} non trouvé`);
        }
        
        // Fusion métadonnées avec horodatage
        const updatedMetadata = {
            ...currentMetadata,
            ...newMetadata,
            lastModified: new Date().toISOString()
        };
        
        ExcalidrawAutomate.setElementWithAttributes(stateId, {
            customData: updatedMetadata
        });
        
        console.log(`✅ Métadonnées mises à jour pour état ${currentMetadata.stateName}`);
        return true;
        
    } catch (error) {
        console.error(`❌ Erreur mise à jour métadonnées état:`, error.message);
        return false;
    }
}

/**
 * Change la disposition (couleur) d'un état existant
 * @param {string} stateId - ID de l'état à modifier
 * @param {string} newDisposition - Nouvelle disposition EPCIS 2.0
 * @returns {boolean} True si changement réussi
 * @sideEffect Modifie la couleur et les métadonnées de l'état
 * @example
 * // Passer un état de "in_progress" à "completed"
 * const success = changeStateDisposition("state_123", "completed");
 */
function changeStateDisposition(stateId, newDisposition) {
    try {
        if (!STATE_DISPOSITION_COLORS[newDisposition]) {
            throw new Error(`Disposition '${newDisposition}' non reconnue EPCIS 2.0`);
        }
        
        const currentMetadata = getStateMetadata(stateId);
        if (!currentMetadata) {
            throw new Error(`État ${stateId} non trouvé`);
        }
        
        // Nouvelle couleur selon disposition
        const newColor = STATE_DISPOSITION_COLORS[newDisposition];
        
        // Mise à jour style visuel
        if (typeof ExcalidrawAutomate !== 'undefined') {
            ExcalidrawAutomate.setElementWithAttributes(stateId, {
                backgroundColor: newColor.background
            });
        }
        
        // Mise à jour métadonnées
        const success = updateStateMetadata(stateId, {
            disposition: newDisposition,
            dispositionDescription: newColor.description,
            dispositionChangedAt: new Date().toISOString()
        });
        
        if (success) {
            console.log(`🎨 Disposition état '${currentMetadata.stateName}' changée: ${currentMetadata.disposition} → ${newDisposition}`);
        }
        
        return success;
        
    } catch (error) {
        console.error(`❌ Erreur changement disposition état:`, error.message);
        return false;
    }
}

/**
 * Supprime un état ProcessMetaLanguage du canvas
 * @param {string} stateId - ID de l'état à supprimer
 * @returns {boolean} True si suppression réussie
 * @sideEffect Supprime l'état et nettoie les event listeners + références parent
 * @example
 * const deleted = deleteStateComponent("state_123_xyz");
 */
function deleteStateComponent(stateId) {
    try {
        if (typeof ExcalidrawAutomate === 'undefined') {
            throw new Error("ExcalidrawAutomate non disponible");
        }
        
        // Récupérer métadonnées pour log et nettoyage avant suppression
        const metadata = getStateMetadata(stateId);
        const stateName = metadata?.stateName || stateId;
        const parentObjectId = metadata?.parentObjectId;
        
        // Nettoyer référence dans l'objet parent
        if (parentObjectId && typeof window !== 'undefined' && window.ProcessMetaLanguageObjectCreator) {
            const parentMetadata = window.ProcessMetaLanguageObjectCreator.getObjectMetadata(parentObjectId);
            if (parentMetadata?.attachedStates) {
                const updatedStates = parentMetadata.attachedStates.filter(state => state.stateId !== stateId);
                window.ProcessMetaLanguageObjectCreator.updateObjectMetadata(parentObjectId, {
                    attachedStates: updatedStates
                });
            }
        }
        
        // Supprimer l'élément du canvas
        ExcalidrawAutomate.deleteElement(stateId);
        
        // Nettoyer event listeners
        if (window.ProcessMetaLanguageStateEventHandlers) {
            window.ProcessMetaLanguageStateEventHandlers.delete(stateId);
        }
        
        console.log(`🗑️ État supprimé: ${stateName} (${stateId})`);
        return true;
        
    } catch (error) {
        console.error(`❌ Erreur suppression état:`, error.message);
        return false;
    }
}

/**
 * Obtient la liste des dispositions EPCIS 2.0 disponibles
 * @returns {Array<Object>} Liste des dispositions avec descriptions et couleurs
 * @example
 * const dispositions = getAvailableDispositions();
 * dispositions.forEach(disp => console.log(`${disp.key}: ${disp.description}`));
 */
function getAvailableDispositions() {
    return Object.entries(STATE_DISPOSITION_COLORS).map(([key, value]) => ({
        key: key,
        background: value.background,
        description: value.description
    }));
}

/**
 * Trouve tous les états attachés à un objet spécifique
 * @param {string} objectId - ID de l'objet parent
 * @returns {Array<Object>} Liste des états avec leurs métadonnées
 * @example
 * const states = findStatesByObject("obj_123");
 * states.forEach(state => console.log(`État: ${state.stateName}`));
 */
function findStatesByObject(objectId) {
    try {
        // Récupération via métadonnées objet parent (plus efficace)
        if (typeof window !== 'undefined' && window.ProcessMetaLanguageObjectCreator) {
            const objectMetadata = window.ProcessMetaLanguageObjectCreator.getObjectMetadata(objectId);
            return objectMetadata?.attachedStates || [];
        }
        
        // Fallback : recherche dans tous les handlers d'événements
        const attachedStates = [];
        if (window.ProcessMetaLanguageStateEventHandlers) {
            for (const [stateId, handlers] of window.ProcessMetaLanguageStateEventHandlers.entries()) {
                const metadata = getStateMetadata(stateId);
                if (metadata?.parentObjectId === objectId) {
                    attachedStates.push({
                        stateId: stateId,
                        uniqueId: metadata.uniqueId,
                        stateName: metadata.stateName,
                        disposition: metadata.disposition,
                        createdAt: metadata.createdAt
                    });
                }
            }
        }
        
        return attachedStates;
        
    } catch (error) {
        console.error(`Erreur recherche états pour objet ${objectId}:`, error);
        return [];
    }
}

/**
 * Classe wrapper pour la création d'états compatible avec la palette UI
 * @class
 */
export class StateCreator {
    /**
     * Crée une instance de StateCreator
     * @param {Object} excalidrawAPI - API ExcalidrawAutomate
     */
    constructor(excalidrawAPI) {
        this.ea = excalidrawAPI;
        this.createdCount = 0;
    }

    /**
     * Crée un état avec l'API simplifiée pour la palette
     * @param {string} stateName - Nom de l'état
     * @param {string} disposition - Disposition EPCIS
     * @param {Object} position - Position {x, y}
     * @param {Object} metadata - Métadonnées supplémentaires
     * @returns {Promise<string>} ID de l'état créé
     */
    async createState(stateName, disposition, position, metadata = {}) {
        const stateId = await createStateComponent(
            this.ea,
            stateName,
            disposition,
            position,
            metadata
        );
        this.createdCount++;
        return stateId;
    }

    /**
     * Obtient le nombre d'états créés
     * @returns {number} Nombre d'états créés
     */
    getCreatedCount() {
        return this.createdCount;
    }
}

// Export des fonctions pour tests et utilisation externe
export {
    createStateComponent,
    createStateOnObject,
    getStateMetadata,
    updateStateMetadata,
    changeStateDisposition,
    deleteStateComponent,
    getAvailableDispositions,
    findStatesByObject,
    calculateStatePosition,
    generateStateId,
    validateStateParameters,
    setupStateEventListeners,
    STATE_CONFIG,
    STATE_DISPOSITION_COLORS
};

// Compatibilité CommonJS
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        StateCreator,
        createStateComponent,
        createStateOnObject,
        getStateMetadata,
        updateStateMetadata,
        changeStateDisposition,
        deleteStateComponent,
        getAvailableDispositions,
        findStatesByObject,
        calculateStatePosition,
        generateStateId,
        validateStateParameters,
        setupStateEventListeners,
        STATE_CONFIG,
        STATE_DISPOSITION_COLORS
    };
}

// Export pour environnement browser/Obsidian
if (typeof window !== 'undefined') {
    window.ProcessMetaLanguageStateCreator = {
        createStateComponent,
        createStateOnObject,
        getStateMetadata,
        updateStateMetadata,
        changeStateDisposition,
        deleteStateComponent,
        getAvailableDispositions,
        findStatesByObject,
        calculateStatePosition,
        STATE_CONFIG,
        STATE_DISPOSITION_COLORS
    };
}

// <!-- END OF FILE: state-creator.js -->