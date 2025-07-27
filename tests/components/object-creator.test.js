// <!-- START OF FILE: object-creator.test.js -->
// FILENAME: object-creator.test.js
// Version: 1.0.0
// Date: 2025-07-27 18:45
// Author: Rolland MELET & Claude Code
// Description: Tests unitaires module object-creator.js - Validation TASK-F001

/**
 * Suite de tests unitaires pour object-creator.js
 * 
 * Valide conformité spécifications TASK-F001:
 * - Hexagone 120x80px dimensions exactes
 * - Couleurs configurables selon types objets
 * - Métadonnées automatiques (ID unique, timestamp, type)
 * - Performance <2s création
 * - Validation paramètres d'entrée
 */

// Import du module à tester
const {
    createObjectComponent,
    getObjectMetadata,
    updateObjectMetadata,
    deleteObjectComponent,
    getAvailableObjectTypes,
    calculateHexagonPoints,
    generateObjectId,
    OBJECT_CONFIG,
    OBJECT_TYPE_COLORS
} = require('../../components/object-creator.js');

/**
 * Mock ExcalidrawAutomate pour tests isolés
 * Simule le comportement de l'API ExcalidrawAutomate
 */
class MockExcalidrawAutomate {
    constructor() {
        this.reset();
        this.elements = new Map();
        this.style = {};
    }
    
    reset() {
        this.style = {
            strokeColor: "#000000",
            backgroundColor: "#ffffff", 
            fillStyle: "solid",
            strokeWidth: 1,
            roughness: 1,
            fontSize: 12,
            fontFamily: 1,
            textAlign: "left",
            verticalAlign: "top"
        };
    }
    
    addPolygon(points) {
        const id = `polygon_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        this.elements.set(id, {
            id: id,
            type: "polygon",
            points: points,
            style: {...this.style},
            customData: {}
        });
        return id;
    }
    
    addText(x, y, text, options = {}) {
        const id = `text_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        this.elements.set(id, {
            id: id,
            type: "text",
            x: x,
            y: y,
            text: text,
            options: options,
            style: {...this.style}
        });
        return id;
    }
    
    setElementWithAttributes(elementId, attributes) {
        const element = this.elements.get(elementId);
        if (element) {
            Object.assign(element, attributes);
        }
    }
    
    getElement(elementId) {
        return this.elements.get(elementId);
    }
    
    deleteElement(elementId) {
        return this.elements.delete(elementId);
    }
    
    async create() {
        // Simulation du temps de création
        await new Promise(resolve => setTimeout(resolve, 10));
        return true;
    }
}

// Configuration environnement de test
let mockEA;

beforeEach(() => {
    // Setup mock ExcalidrawAutomate avant chaque test
    mockEA = new MockExcalidrawAutomate();
    global.ExcalidrawAutomate = mockEA;
    global.performance = {
        now: () => Date.now()
    };
    global.console = {
        log: jest.fn(),
        warn: jest.fn(),
        error: jest.fn()
    };
});

afterEach(() => {
    // Nettoyage après chaque test
    delete global.ExcalidrawAutomate;
    delete global.performance;
    jest.clearAllMocks();
});

/**
 * TESTS DE CONFIGURATION ET CONSTANTES
 */
describe('Configuration et Constantes', () => {
    
    test('OBJECT_CONFIG contient toutes les propriétés requises', () => {
        expect(OBJECT_CONFIG).toHaveProperty('width', 120);
        expect(OBJECT_CONFIG).toHaveProperty('height', 80);
        expect(OBJECT_CONFIG).toHaveProperty('strokeWidth', 2);
        expect(OBJECT_CONFIG).toHaveProperty('processTag', '#process-object');
        expect(OBJECT_CONFIG).toHaveProperty('version', '1.0.0');
    });
    
    test('OBJECT_TYPE_COLORS contient les types standards', () => {
        const requiredTypes = [
            'raw-material', 'product', 'container', 
            'equipment', 'document', 'location', 'batch', 'custom'
        ];
        
        requiredTypes.forEach(type => {
            expect(OBJECT_TYPE_COLORS).toHaveProperty(type);
            expect(OBJECT_TYPE_COLORS[type]).toHaveProperty('background');
            expect(OBJECT_TYPE_COLORS[type]).toHaveProperty('description');
        });
    });
    
});

/**
 * TESTS FONCTIONS UTILITAIRES
 */
describe('Fonctions Utilitaires', () => {
    
    test('generateObjectId génère des IDs uniques', () => {
        const id1 = generateObjectId();
        const id2 = generateObjectId();
        
        expect(id1).toMatch(/^obj_\d+_[a-z0-9]{6}$/);
        expect(id2).toMatch(/^obj_\d+_[a-z0-9]{6}$/);
        expect(id1).not.toBe(id2);
    });
    
    test('calculateHexagonPoints génère 6 points corrects', () => {
        const points = calculateHexagonPoints(200, 300, 120, 80);
        
        expect(points).toHaveLength(6);
        expect(points[0]).toEqual([140, 300]); // Point gauche
        expect(points[3]).toEqual([260, 300]); // Point droite
        
        // Vérification dimensions
        const minX = Math.min(...points.map(p => p[0]));
        const maxX = Math.max(...points.map(p => p[0]));
        const minY = Math.min(...points.map(p => p[1]));
        const maxY = Math.max(...points.map(p => p[1]));
        
        expect(maxX - minX).toBe(120); // Largeur exacte
        expect(maxY - minY).toBe(80);  // Hauteur exacte
    });
    
    test('getAvailableObjectTypes retourne la liste complète', () => {
        const types = getAvailableObjectTypes();
        
        expect(types).toBeInstanceOf(Array);
        expect(types.length).toBeGreaterThan(0);
        
        types.forEach(type => {
            expect(type).toHaveProperty('key');
            expect(type).toHaveProperty('background');
            expect(type).toHaveProperty('description');
        });
    });
    
});

/**
 * TESTS VALIDATION PARAMÈTRES
 */
describe('Validation Paramètres', () => {
    
    test('Rejette nom objet vide ou invalide', async () => {
        await expect(createObjectComponent("", "raw-material", {x: 100, y: 200}))
            .rejects.toThrow("Le nom de l'objet est requis");
        
        await expect(createObjectComponent(null, "raw-material", {x: 100, y: 200}))
            .rejects.toThrow("Le nom de l'objet est requis");
        
        await expect(createObjectComponent("x".repeat(51), "raw-material", {x: 100, y: 200}))
            .rejects.toThrow("ne peut pas dépasser 50 caractères");
    });
    
    test('Rejette type objet invalide', async () => {
        await expect(createObjectComponent("Test", "", {x: 100, y: 200}))
            .rejects.toThrow("Le type d'objet est requis");
        
        await expect(createObjectComponent("Test", null, {x: 100, y: 200}))
            .rejects.toThrow("Le type d'objet est requis");
    });
    
    test('Rejette position invalide', async () => {
        await expect(createObjectComponent("Test", "raw-material", null))
            .rejects.toThrow("La position est requise");
        
        await expect(createObjectComponent("Test", "raw-material", {x: "invalid", y: 200}))
            .rejects.toThrow("coordonnées x et y numériques");
        
        await expect(createObjectComponent("Test", "raw-material", {x: 100}))
            .rejects.toThrow("coordonnées x et y numériques");
    });
    
    test('Accepte métadonnées optionnelles valides', async () => {
        const metadata = {supplier: "Test Corp", batch: "B001"};
        
        await expect(createObjectComponent("Test", "raw-material", {x: 100, y: 200}, metadata))
            .resolves.toBeDefined();
    });
    
    test('Rejette métadonnées non-objet', async () => {
        await expect(createObjectComponent("Test", "raw-material", {x: 100, y: 200}, "invalid"))
            .rejects.toThrow("Les métadonnées doivent être un objet");
    });
    
});

/**
 * TESTS CRÉATION OBJET PRINCIPAL
 */
describe('Création Objet Principal', () => {
    
    test('Crée objet avec paramètres minimaux valides', async () => {
        const objectId = await createObjectComponent(
            "Lot-Test-001",
            "raw-material", 
            {x: 200, y: 300}
        );
        
        expect(objectId).toMatch(/^obj_\d+_[a-z0-9]{6}$/);
        expect(mockEA.elements.size).toBeGreaterThan(0);
    });
    
    test('Applique couleur selon type objet', async () => {
        await createObjectComponent("Test", "raw-material", {x: 100, y: 200});
        
        const polygonElement = Array.from(mockEA.elements.values())
            .find(el => el.type === 'polygon');
        
        expect(polygonElement.style.backgroundColor)
            .toBe(OBJECT_TYPE_COLORS['raw-material'].background);
    });
    
    test('Génère métadonnées complètes automatiques', async () => {
        const objectId = await createObjectComponent(
            "Test-Metadata",
            "product",
            {x: 150, y: 250},
            {customField: "customValue"}
        );
        
        const element = mockEA.getElement(objectId);
        const metadata = element.customData;
        
        // Vérifications métadonnées obligatoires
        expect(metadata).toHaveProperty('processType', 'object');
        expect(metadata).toHaveProperty('processTag', '#process-object');
        expect(metadata).toHaveProperty('uniqueId');
        expect(metadata).toHaveProperty('objectName', 'Test-Metadata');
        expect(metadata).toHaveProperty('objectType', 'product');
        expect(metadata).toHaveProperty('createdAt');
        expect(metadata).toHaveProperty('position', {x: 150, y: 250});
        expect(metadata).toHaveProperty('dimensions', {width: 120, height: 80});
        expect(metadata).toHaveProperty('userMetadata', {customField: "customValue"});
        expect(metadata).toHaveProperty('epcisCompliant', true);
        expect(metadata).toHaveProperty('syncTags');
        
        // Validation format horodatage ISO
        expect(new Date(metadata.createdAt)).toBeInstanceOf(Date);
    });
    
    test('Génère tags synchronisation requis', async () => {
        const objectId = await createObjectComponent(
            "Test-Tags",
            "raw-material",
            {x: 100, y: 200}
        );
        
        const element = mockEA.getElement(objectId);
        const tags = element.customData.syncTags;
        
        expect(tags).toContain('#process-object');
        expect(tags).toContain('#object-raw-material');
        expect(tags).toContain('#object-test-tags');
        expect(tags.some(tag => tag.startsWith('#object-id-'))).toBe(true);
    });
    
    test('Mesure et valide performance <2s', async () => {
        const startTime = performance.now();
        
        await createObjectComponent("Test-Performance", "raw-material", {x: 100, y: 200});
        
        const endTime = performance.now();
        const executionTime = endTime - startTime;
        
        expect(executionTime).toBeLessThan(2000); // Critère TASK-F001
    });
    
});

/**
 * TESTS FONCTIONS GESTION MÉTADONNÉES
 */
describe('Gestion Métadonnées', () => {
    
    let testObjectId;
    
    beforeEach(async () => {
        testObjectId = await createObjectComponent(
            "Test-Metadata-Ops",
            "raw-material",
            {x: 100, y: 200},
            {initialData: "test"}
        );
    });
    
    test('getObjectMetadata récupère métadonnées existantes', () => {
        const metadata = getObjectMetadata(testObjectId);
        
        expect(metadata).toBeDefined();
        expect(metadata.objectName).toBe("Test-Metadata-Ops");
        expect(metadata.userMetadata.initialData).toBe("test");
    });
    
    test('getObjectMetadata retourne null pour objet inexistant', () => {
        const metadata = getObjectMetadata("nonexistent_id");
        expect(metadata).toBeNull();
    });
    
    test('updateObjectMetadata met à jour correctement', () => {
        const success = updateObjectMetadata(testObjectId, {
            status: "validated",
            quality: "A"
        });
        
        expect(success).toBe(true);
        
        const updatedMetadata = getObjectMetadata(testObjectId);
        expect(updatedMetadata.status).toBe("validated");
        expect(updatedMetadata.quality).toBe("A");
        expect(updatedMetadata).toHaveProperty('lastModified');
    });
    
    test('updateObjectMetadata échoue pour objet inexistant', () => {
        const success = updateObjectMetadata("nonexistent_id", {test: "value"});
        expect(success).toBe(false);
    });
    
    test('deleteObjectComponent supprime objet et nettoie', () => {
        const success = deleteObjectComponent(testObjectId);
        
        expect(success).toBe(true);
        expect(mockEA.getElement(testObjectId)).toBeUndefined();
    });
    
});

/**
 * TESTS GESTION ERREURS
 */
describe('Gestion Erreurs', () => {
    
    test('Gère absence ExcalidrawAutomate gracieusement', async () => {
        delete global.ExcalidrawAutomate;
        
        await expect(createObjectComponent("Test", "raw-material", {x: 100, y: 200}))
            .rejects.toThrow("ExcalidrawAutomate non disponible");
    });
    
    test('Log warnings pour types objets non reconnus', async () => {
        await createObjectComponent("Test", "unknown-type", {x: 100, y: 200});
        
        expect(console.warn).toHaveBeenCalledWith(
            expect.stringContaining("Type d'objet 'unknown-type' non reconnu")
        );
    });
    
    test('Log performance warnings si >2s', async () => {
        // Mock performance lente
        const originalNow = performance.now;
        let callCount = 0;
        performance.now = () => {
            callCount++;
            return callCount === 1 ? 0 : 2500; // Simulation 2.5s
        };
        
        await createObjectComponent("Test-Slow", "raw-material", {x: 100, y: 200});
        
        expect(console.warn).toHaveBeenCalledWith(
            expect.stringContaining("Performance warning")
        );
        
        // Restaurer performance.now
        performance.now = originalNow;
    });
    
});

/**
 * TESTS TYPES OBJETS SPÉCIALISÉS
 */
describe('Types Objets Spécialisés', () => {
    
    test('Crée objet raw-material avec couleur spécifique', async () => {
        await createObjectComponent("Matière-Test", "raw-material", {x: 100, y: 200});
        
        const element = Array.from(mockEA.elements.values())
            .find(el => el.type === 'polygon');
        
        expect(element.style.backgroundColor).toBe("#E3F2FD");
    });
    
    test('Crée objet product avec métadonnées appropriées', async () => {
        const objectId = await createObjectComponent(
            "Produit-Test",
            "product",
            {x: 200, y: 300},
            {serialNumber: "SN123456"}
        );
        
        const metadata = getObjectMetadata(objectId);
        expect(metadata.objectType).toBe("product");
        expect(metadata.objectTypeDescription).toContain("Produit fini");
        expect(metadata.userMetadata.serialNumber).toBe("SN123456");
    });
    
    test('Gère type custom avec couleur par défaut', async () => {
        const objectId = await createObjectComponent(
            "Custom-Test",
            "unknown-type",
            {x: 100, y: 200}
        );
        
        const element = Array.from(mockEA.elements.values())
            .find(el => el.type === 'polygon');
        
        expect(element.style.backgroundColor).toBe("#F5F5F5");
    });
    
});

/**
 * TESTS INTÉGRATION ET RÉGRESSION
 */
describe('Tests Intégration', () => {
    
    test('Crée multiple objets sans interférence', async () => {
        const obj1Id = await createObjectComponent("Objet-1", "raw-material", {x: 100, y: 200});
        const obj2Id = await createObjectComponent("Objet-2", "product", {x: 300, y: 400});
        
        expect(obj1Id).not.toBe(obj2Id);
        
        const metadata1 = getObjectMetadata(obj1Id);
        const metadata2 = getObjectMetadata(obj2Id);
        
        expect(metadata1.objectName).toBe("Objet-1");
        expect(metadata2.objectName).toBe("Objet-2");
        expect(metadata1.objectType).toBe("raw-material");
        expect(metadata2.objectType).toBe("product");
    });
    
    test('Workflow complet: création → lecture → modification → suppression', async () => {
        // Création
        const objectId = await createObjectComponent(
            "Workflow-Test",
            "container",
            {x: 150, y: 250},
            {status: "initial"}
        );
        
        // Lecture
        let metadata = getObjectMetadata(objectId);
        expect(metadata.objectName).toBe("Workflow-Test");
        expect(metadata.userMetadata.status).toBe("initial");
        
        // Modification
        const updated = updateObjectMetadata(objectId, {status: "processed"});
        expect(updated).toBe(true);
        
        metadata = getObjectMetadata(objectId);
        expect(metadata.status).toBe("processed");
        
        // Suppression
        const deleted = deleteObjectComponent(objectId);
        expect(deleted).toBe(true);
        expect(getObjectMetadata(objectId)).toBeNull();
    });
    
});

/**
 * RÉSUMÉ VALIDATION SPÉCIFICATIONS TASK-F001
 */
describe('Validation TASK-F001', () => {
    
    test('✅ Critère: Hexagone 120x80px dimensions exactes', () => {
        const points = calculateHexagonPoints(200, 300, 120, 80);
        const minX = Math.min(...points.map(p => p[0]));
        const maxX = Math.max(...points.map(p => p[0]));
        const minY = Math.min(...points.map(p => p[1]));
        const maxY = Math.max(...points.map(p => p[1]));
        
        expect(maxX - minX).toBe(120);
        expect(maxY - minY).toBe(80);
    });
    
    test('✅ Critère: Couleurs configurables selon types objets', () => {
        expect(Object.keys(OBJECT_TYPE_COLORS)).toContain('raw-material');
        expect(Object.keys(OBJECT_TYPE_COLORS)).toContain('product');
        expect(OBJECT_TYPE_COLORS['raw-material'].background).toBe("#E3F2FD");
    });
    
    test('✅ Critère: Métadonnées automatiques (ID unique, timestamp, type)', async () => {
        const objectId = await createObjectComponent("Test", "raw-material", {x: 100, y: 200});
        const metadata = getObjectMetadata(objectId);
        
        expect(metadata.uniqueId).toMatch(/^obj_\d+_[a-z0-9]{6}$/);
        expect(metadata.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
        expect(metadata.objectType).toBe("raw-material");
    });
    
    test('✅ Critère: Tag #process-object obligatoire pour synchronisation', async () => {
        const objectId = await createObjectComponent("Test", "raw-material", {x: 100, y: 200});
        const metadata = getObjectMetadata(objectId);
        
        expect(metadata.processTag).toBe("#process-object");
        expect(metadata.syncTags).toContain("#process-object");
    });
    
    test('✅ Critère: Performance <2s création', async () => {
        const startTime = performance.now();
        await createObjectComponent("Test-Performance", "raw-material", {x: 100, y: 200});
        const endTime = performance.now();
        
        expect(endTime - startTime).toBeLessThan(2000);
    });
    
});

// <!-- END OF FILE: object-creator.test.js -->