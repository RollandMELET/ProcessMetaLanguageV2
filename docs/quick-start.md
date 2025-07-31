# ProcessMetaLanguage - Guide de Démarrage Rapide

**Prêt en 5 minutes !** 🚀

---

## 1. Installation Express (2 min)

### Prérequis
✅ Obsidian installé  
✅ Plugin Excalidraw activé  
✅ Plugin Templater activé  

### Installation Plugin
```
1. Télécharger ProcessMetaLanguage.zip
2. Extraire dans .obsidian/plugins/
3. Redémarrer Obsidian
4. Activer le plugin
```

---

## 2. Premier Processus (3 min)

### Étape 1 : Créer Canvas
```
Fichier → Nouveau → MonProcessus.excalidraw
```
*L'interface ProcessMetaLanguage s'ouvre automatiquement* ✨

### Étape 2 : Ajouter Objet
```
Toolbar → ⬡ Objet → Clic sur canvas
Nom : "Lot-001"
```

### Étape 3 : Définir État
```
Sélectionner objet → 🏷️ État
Choisir : "active"
```

### Étape 4 : Créer Action
```
Toolbar → ▭ Action
Business Step : "receiving"
```

### Étape 5 : Exporter
```
📤 Export → Documentation → Générer
```

**Bravo ! Votre premier processus est créé** 🎉

---

## 3. Raccourcis Essentiels

| Action | Raccourci | Mnémonique |
|--------|-----------|------------|
| **O**bjet | `Ctrl+Shift+O` | **O**bject |
| **S**tate | `Ctrl+Shift+S` | **S**tate |
| **A**ction | `Ctrl+Shift+A` | **A**ction |
| **P**rocessMetaLanguage | `Ctrl+Shift+P` | **P**ML |

---

## 4. Workflow Type : Réception Marchandises

### Canvas Visuel
```
[Shipment] → [In Transit] → (Receiving)
    ↓
[Shipment] → [Received] → (Inspecting)
    ↓
[Shipment] → [Accepted] → (Storing)
```

### Code Équivalent (Auto-généré)
```yaml
process: Reception_Marchandises
objects:
  - name: Shipment
    states:
      - disposition: in_transit
        actions:
          - businessStep: receiving
            transition: received
      - disposition: received
        actions:
          - businessStep: inspecting
            transition: accepted
      - disposition: accepted
        actions:
          - businessStep: storing
```

---

## 5. Templates Rapides

### Manufacturing
```
Raw Material → Transforming → Component
Component → Assembling → Product
Product → Packing → Package
```

### Logistics
```
Package → Picking → Order
Order → Shipping → In Transit
In Transit → Delivering → Delivered
```

### Retail
```
Product → Receiving → In Stock
In Stock → Selling → Sold
Sold → Returning → Returned
```

---

## 6. Astuces Pro 💡

### Auto-complétion
- Taper 2 lettres → Suggestions
- `Tab` pour accepter
- `Esc` pour fermer

### Suggestions IA
- Pause 1 seconde → Suggestions contextuelles
- Clic pour appliquer

### Navigation Rapide
- `Alt+1` : Dashboard
- `Alt+2` : Création
- `Alt+3` : Templates
- `Alt+4` : Export

### Validation
- Badge temps réel dans toolbar
- ✅ = Conforme
- ⚠️ = Attention requise

---

## 7. Erreurs Courantes

### ❌ "ExcalidrawAutomate non disponible"
**Solution** : Paramètres Excalidraw → Activer ExcalidrawAutomate

### ❌ "État sans action principale"
**Solution** : Chaque état génère automatiquement son action, vérifier synchronisation

### ❌ "Export vide"
**Solution** : Au moins 1 objet + 1 état requis

---

## 8. Exemple Complet : Traçabilité Café ☕

### 1. Créer Objets
```
- Lot-Café-Arabica
- Sac-Jute-25kg
- Container-Export
```

### 2. Définir États
```
Lot-Café → harvested → dried → roasted
Sac-Jute → filled → sealed → labeled
Container → loading → shipped → delivered
```

### 3. Ajouter Actions
```
harvesting → drying → roasting
filling → sealing → labeling
loading → shipping → delivering
```

### 4. Exporter Documentation
```
→ README complet avec workflow
→ API OpenAPI pour intégration
→ Matrice traçabilité supply chain
```

---

## 9. Prochaines Étapes

1. 📖 Lire le [Guide Utilisateur Complet](user-guide.md)
2. 🎯 Explorer les 41 Business Steps EPCIS
3. 🏭 Personnaliser pour votre industrie
4. 🤝 Partager vos templates

---

## 10. Aide Rapide

**Question ?** Hover sur n'importe quel bouton pour tooltip  
**Problème ?** Console (`Ctrl+Shift+I`) → Filtrer "PML"  
**Suggestion ?** GitHub Issues bienvenues !  

---

**ProcessMetaLanguage** - *Design it. Draw it. Deploy it.* 🚀

*Quick Start Guide v1.0.0 - Ready in 5 minutes!*