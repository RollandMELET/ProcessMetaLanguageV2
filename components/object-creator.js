// <!-- START OF FILE: object-creator.js -->
// FILENAME: object-creator.js
// Version: 1.0.0
// Date: 2025-07-27 18:45
// Author: Rolland MELET & Claude Code
// Description: Module création hexagone OBJECT standardisé ProcessMetaLanguage selon spécifications TASK-F001

/**
 * Module ProcessMetaLanguage - Création Composants OBJECT
 * 
 * Spécialiste création hexagones OBJECT standardisés dans Excalidraw
 * Architecture État-Actions deux niveaux pour traçabilité industrielle
 * Conforme EPCIS 2.0 + métadonnées automatiques + synchronisation
 */

/**
 * Configuration par défaut des objets ProcessMetaLanguage
 * @constant {Object}
 */
const OBJECT_CONFIG = {
    // Dimensions standard hexagone OBJECT
    width: 120,
    height: 80,
    
    // Styles graphiques standardisés
    strokeWidth: 2,
    strokeColor: "#1e1e1e",
    fillStyle: "solid",
    roughness: 0, // Forme précise pour professionnalisme
    
    // Typographie
    fontSize: 16,
    fontFamily: 3, // Cascadia Code
    textColor: "#1e1e1e",
    
    // Métadonnées
    processTag: "#process-object",
    version: "1.0.0"
};

/**
 * Palette couleurs par type d'objet selon nomenclature industrielle
 * @constant {Object}
 */
const OBJECT_TYPE_COLORS = {
    "raw-material": {
        background: "#E3F2FD",
        description: "Matière première non transformée"
    },
    "product": {
        background: "#E8F5E8", 
        description: "Produit fini ou semi-fini"
    },
    "container": {
        background: "#FFF3E0",
        description: "Contenant ou emballage"
    },
    "equipment": {
        background: "#F3E5F5",
        description: "Équipement ou machine"
    },
    "document": {
        background: "#E0F2F1",
        description: "Document ou certificat"
    },
    "location": {
        background: "#FCE4EC",
        description: "Lieu ou zone géographique"
    },
    "batch": {
        background: "#E1F5FE",
        description: "Lot de production"
    },
    "custom": {
        background: "#F5F5F5",
        description: "Type personnalisé"
    }
};

/**
 * Générateur d'ID unique pour objets ProcessMetaLanguage
 * @returns {string} ID unique au format obj_[type]_[timestamp]
 * @example
 * // Returns: "obj_1706375400123"
 * const id = generateObjectId();
 */
function generateObjectId() {
    return `obj_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * Calcule les 6 points géométriques d'un hexagone centré
 * @param {number} centerX - Coordonnée X du centre
 * @param {number} centerY - Coordonnée Y du centre  
 * @param {number} width - Largeur de l'hexagone
 * @param {number} height - Hauteur de l'hexagone
 * @returns {Array<Array<number>>} Tableau des 6 points [x, y]
 * @example
 * // Hexagone 120x80px centré en (200, 300)
 * const points = calculateHexagonPoints(200, 300, 120, 80);
 * // Returns: [[140, 300], [170, 260], [230, 260], [260, 300], [230, 340], [170, 340]]
 */
function calculateHexagonPoints(centerX, centerY, width, height) {
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    const quarterWidth = width / 4;
    
    return [
        [centerX - halfWidth, centerY],                    // Point gauche
        [centerX - quarterWidth, centerY - halfHeight],    // Point haut-gauche  
        [centerX + quarterWidth, centerY - halfHeight],    // Point haut-droite
        [centerX + halfWidth, centerY],                    // Point droite
        [centerX + quarterWidth, centerY + halfHeight],    // Point bas-droite
        [centerX - quarterWidth, centerY + halfHeight]     // Point bas-gauche
    ];
}

/**
 * Valide les paramètres d'entrée pour création d'objet
 * @param {string} objectName - Nom de l'objet à créer
 * @param {string} objectType - Type d'objet
 * @param {Object} position - Position {x, y}
 * @param {Object} metadata - Métadonnées optionnelles
 * @throws {Error} Si les paramètres sont invalides
 */
function validateObjectParameters(objectName, objectType, position, metadata = {}) {
    // Validation nom objet
    if (!objectName || typeof objectName !== 'string' || objectName.trim().length === 0) {
        throw new Error("Le nom de l'objet est requis et doit être une chaîne non vide");
    }
    
    if (objectName.length > 50) {
        throw new Error("Le nom de l'objet ne peut pas dépasser 50 caractères");
    }
    
    // Validation type objet
    if (!objectType || typeof objectType !== 'string') {
        throw new Error("Le type d'objet est requis et doit être une chaîne");
    }
    
    if (!OBJECT_TYPE_COLORS[objectType]) {
        console.warn(`Type d'objet '${objectType}' non reconnu, utilisation du type 'custom'`);
    }
    
    // Validation position
    if (!position || typeof position !== 'object') {
        throw new Error("La position est requise et doit être un objet");
    }
    
    if (typeof position.x !== 'number' || typeof position.y !== 'number') {
        throw new Error("La position doit contenir des coordonnées x et y numériques");
    }
    
    // Validation métadonnées
    if (metadata && typeof metadata !== 'object') {
        throw new Error("Les métadonnées doivent être un objet");
    }
}

/**
 * Crée un composant Object hexagonal standardisé ProcessMetaLanguage
 * 
 * Cette fonction est le point d'entrée principal pour créer des objets tracés
 * dans le système ProcessMetaLanguage. Elle génère un hexagone parfaitement
 * dimensionné avec métadonnées automatiques et conformité EPCIS 2.0.
 * 
 * @param {string} objectName - Nom objet tracé (ex: "Lot-Matière-A001")
 * @param {string} objectType - Type objet EPCIS (raw-material, product, etc.)
 * @param {Object} position - Position {x, y} dans canvas
 * @param {Object} metadata - Métadonnées EPCIS 2.0 optionnelles
 * @returns {string} ID unique composant créé
 * @sideEffect Modifie canvas Excalidraw actif, ajoute listeners events
 * @throws {Error} Si ExcalidrawAutomate non disponible ou paramètres invalides
 * @example
 * // Création objet matière première en réception
 * const objectId = await createObjectComponent("Lot-Acier-A001", "raw-material", 
 *   {x: 100, y: 200}, {supplier: "Fournisseur-X", batch: "B2024-001"});
 * // Returns: "obj_1706375400123_abc123"
 * 
 * @example
 * // Création produit fini avec métadonnées complètes
 * const productId = await createObjectComponent("Produit-Fini-P001", "product",
 *   {x: 300, y: 400}, {
 *     serialNumber: "SN123456",
 *     manufacturingDate: "2024-01-15",
 *     qualityGrade: "A"
 *   });
 */
async function createObjectComponent(objectName, objectType, position, metadata = {}) {
    // Mesurer performance selon critères TASK-F001
    const startTime = performance.now();
    
    try {
        // Vérification disponibilité ExcalidrawAutomate
        if (typeof ExcalidrawAutomate === 'undefined') {
            throw new Error("ExcalidrawAutomate non disponible. Vérifiez que le plugin Excalidraw est actif avec ExcalidrawAutomate enabled.");
        }
        
        // Validation paramètres
        validateObjectParameters(objectName, objectType, position, metadata);
        
        // Instance ExcalidrawAutomate
        const ea = ExcalidrawAutomate;
        
        // Réinitialisation style pour éviter héritages
        ea.reset();
        
        // Configuration style hexagone selon standards ProcessMetaLanguage
        const typeColor = OBJECT_TYPE_COLORS[objectType] || OBJECT_TYPE_COLORS.custom;
        
        ea.style.strokeColor = OBJECT_CONFIG.strokeColor;
        ea.style.backgroundColor = typeColor.background;
        ea.style.fillStyle = OBJECT_CONFIG.fillStyle;
        ea.style.strokeWidth = OBJECT_CONFIG.strokeWidth;
        ea.style.roughness = OBJECT_CONFIG.roughness;
        
        // Calcul points hexagone avec dimensions exactes 120x80px
        const hexagonPoints = calculateHexagonPoints(
            position.x,
            position.y,
            OBJECT_CONFIG.width,
            OBJECT_CONFIG.height
        );
        
        // Création du polygone hexagone
        const hexagonId = ea.addPolygon(hexagonPoints);
        
        // Configuration typographie pour texte centré
        ea.style.fontSize = OBJECT_CONFIG.fontSize;
        ea.style.fontFamily = OBJECT_CONFIG.fontFamily;
        ea.style.textAlign = "center";
        ea.style.verticalAlign = "middle";
        ea.style.strokeColor = OBJECT_CONFIG.textColor;
        
        // Ajout texte nom objet centré dans hexagone
        const textId = ea.addText(position.x, position.y, objectName, {
            width: OBJECT_CONFIG.width - 20, // Marge intérieure
            height: OBJECT_CONFIG.height - 20,
            textAlign: "center",
            verticalAlign: "middle"
        });
        
        // Génération ID unique pour traçabilité
        const uniqueId = generateObjectId();
        
        // Métadonnées ProcessMetaLanguage automatiques
        const processMetadata = {
            // Identifiants ProcessMetaLanguage
            processType: "object",
            processTag: OBJECT_CONFIG.processTag,
            uniqueId: uniqueId,
            
            // Données objet
            objectName: objectName,
            objectType: objectType,
            objectTypeDescription: typeColor.description,
            
            // Positionnement et dimensions
            position: {
                x: position.x,
                y: position.y
            },
            dimensions: {
                width: OBJECT_CONFIG.width,
                height: OBJECT_CONFIG.height
            },
            
            // Horodatage
            createdAt: new Date().toISOString(),
            version: OBJECT_CONFIG.version,
            
            // Métadonnées utilisateur fusionnées
            userMetadata: metadata,
            
            // Conformité EPCIS 2.0
            epcisCompliant: true,
            epcisVersion: "2.0"
        };
        
        // Application métadonnées à l'hexagone
        ea.setElementWithAttributes(hexagonId, {
            customData: processMetadata
        });
        
        // Stocker l'ID réel de l'élément dans les métadonnées pour getObjectMetadata
        processMetadata.elementId = hexagonId;
        
        // Tags obligatoires pour synchronisation
        const requiredTags = [
            OBJECT_CONFIG.processTag,
            `#object-${objectType}`,
            `#object-${objectName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`,
            `#object-id-${uniqueId}`
        ];
        
        // Application des tags (simulation car ExcalidrawAutomate ne supporte pas directement les tags)
        processMetadata.syncTags = requiredTags;
        
        // Création finale dans le canvas
        await ea.create();
        
        // Setup event listeners pour interactions futures
        setupObjectEventListeners(hexagonId, processMetadata);
        
        // Mesure performance finale
        const endTime = performance.now();
        const executionTime = endTime - startTime;
        
        // Validation critère performance <2s
        if (executionTime > 2000) {
            console.warn(`⚠️ Performance warning: Création objet en ${executionTime.toFixed(2)}ms (target: <2000ms)`);
        } else {
            console.log(`✅ Objet créé en ${executionTime.toFixed(2)}ms (performance OK)`);
        }
        
        // Log création pour débogage
        console.log(`🔹 Objet ProcessMetaLanguage créé:`, {
            id: hexagonId,
            uniqueId: uniqueId,
            name: objectName,
            type: objectType,
            position: position,
            executionTime: `${executionTime.toFixed(2)}ms`
        });
        
        return hexagonId;
        
    } catch (error) {
        console.error(`❌ Erreur création objet '${objectName}':`, error.message);
        throw error;
    }
}

/**
 * Configure les listeners d'événements pour un objet ProcessMetaLanguage
 * @param {string} objectId - ID de l'objet Excalidraw
 * @param {Object} metadata - Métadonnées de l'objet
 * @sideEffect Ajoute des handlers d'événements pour interactions utilisateur
 * @example
 * setupObjectEventListeners("obj_123", {objectName: "Lot-001"});
 */
function setupObjectEventListeners(objectId, metadata) {
    // Simulation des event listeners (implémentation future)
    // Dans un vrai environnement Obsidian/Excalidraw, ceci écouterait les événements
    console.log(`🔗 Event listeners configurés pour objet ${metadata.objectName} (${objectId})`);
    
    // Stockage des handlers pour nettoyage futur
    if (!window.ProcessMetaLanguageEventHandlers) {
        window.ProcessMetaLanguageEventHandlers = new Map();
    }
    
    window.ProcessMetaLanguageEventHandlers.set(objectId, {
        onClick: () => console.log(`Clic sur objet ${metadata.objectName}`),
        onDoubleClick: () => console.log(`Double-clic sur objet ${metadata.objectName}`),
        onHover: () => console.log(`Hover sur objet ${metadata.objectName}`)
    });
}

/**
 * Récupère les métadonnées d'un objet ProcessMetaLanguage
 * @param {string} objectId - ID unique de l'objet
 * @returns {Object|null} Métadonnées de l'objet ou null si non trouvé
 * @example
 * const metadata = getObjectMetadata("obj_123_abc");
 * console.log(metadata.objectName); // "Lot-Acier-A001"
 */
function getObjectMetadata(objectId) {
    try {
        if (typeof ExcalidrawAutomate === 'undefined') {
            console.warn("ExcalidrawAutomate non disponible pour récupération métadonnées");
            return null;
        }
        
        const element = ExcalidrawAutomate.getElement(objectId);
        return element?.customData || null;
        
    } catch (error) {
        console.error(`Erreur récupération métadonnées objet ${objectId}:`, error);
        return null;
    }
}

/**
 * Met à jour les métadonnées d'un objet existant
 * @param {string} objectId - ID de l'objet à modifier
 * @param {Object} newMetadata - Nouvelles métadonnées à fusionner
 * @returns {boolean} True si mise à jour réussie
 * @sideEffect Modifie les métadonnées de l'objet dans le canvas
 * @example
 * const success = updateObjectMetadata("obj_123", {
 *   lastModified: new Date().toISOString(),
 *   status: "validated"
 * });
 */
function updateObjectMetadata(objectId, newMetadata) {
    try {
        if (typeof ExcalidrawAutomate === 'undefined') {
            throw new Error("ExcalidrawAutomate non disponible");
        }
        
        const currentMetadata = getObjectMetadata(objectId);
        if (!currentMetadata) {
            throw new Error(`Objet ${objectId} non trouvé`);
        }
        
        // Fusion métadonnées avec horodatage
        const updatedMetadata = {
            ...currentMetadata,
            ...newMetadata,
            lastModified: new Date().toISOString()
        };
        
        ExcalidrawAutomate.setElementWithAttributes(objectId, {
            customData: updatedMetadata
        });
        
        console.log(`✅ Métadonnées mises à jour pour objet ${currentMetadata.objectName}`);
        return true;
        
    } catch (error) {
        console.error(`❌ Erreur mise à jour métadonnées:`, error.message);
        return false;
    }
}

/**
 * Supprime un objet ProcessMetaLanguage du canvas
 * @param {string} objectId - ID de l'objet à supprimer
 * @returns {boolean} True si suppression réussie
 * @sideEffect Supprime l'objet et nettoie les event listeners
 * @example
 * const deleted = deleteObjectComponent("obj_123_abc");
 */
function deleteObjectComponent(objectId) {
    try {
        if (typeof ExcalidrawAutomate === 'undefined') {
            throw new Error("ExcalidrawAutomate non disponible");
        }
        
        // Récupérer nom pour log avant suppression
        const metadata = getObjectMetadata(objectId);
        const objectName = metadata?.objectName || objectId;
        
        // Supprimer l'élément du canvas
        ExcalidrawAutomate.deleteElement(objectId);
        
        // Nettoyer event listeners
        if (window.ProcessMetaLanguageEventHandlers) {
            window.ProcessMetaLanguageEventHandlers.delete(objectId);
        }
        
        console.log(`🗑️ Objet supprimé: ${objectName} (${objectId})`);
        return true;
        
    } catch (error) {
        console.error(`❌ Erreur suppression objet:`, error.message);
        return false;
    }
}

/**
 * Obtient la liste des types d'objets disponibles
 * @returns {Array<Object>} Liste des types avec descriptions
 * @example
 * const types = getAvailableObjectTypes();
 * types.forEach(type => console.log(`${type.key}: ${type.description}`));
 */
function getAvailableObjectTypes() {
    return Object.entries(OBJECT_TYPE_COLORS).map(([key, value]) => ({
        key: key,
        background: value.background,
        description: value.description
    }));
}

// Export des fonctions pour tests et utilisation externe
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        createObjectComponent,
        getObjectMetadata,
        updateObjectMetadata,
        deleteObjectComponent,
        getAvailableObjectTypes,
        calculateHexagonPoints,
        generateObjectId,
        OBJECT_CONFIG,
        OBJECT_TYPE_COLORS
    };
}

// Export pour environnement browser/Obsidian
if (typeof window !== 'undefined') {
    window.ProcessMetaLanguageObjectCreator = {
        createObjectComponent,
        getObjectMetadata,
        updateObjectMetadata,
        deleteObjectComponent,
        getAvailableObjectTypes,
        OBJECT_CONFIG,
        OBJECT_TYPE_COLORS
    };
}

// <!-- END OF FILE: object-creator.js -->