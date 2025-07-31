# Guide de Test Rapide - ProcessMetaLanguage v1.0.0-beta.1

**Date:** 2025-08-01  
**Version:** 1.0.0-beta.1  
**Package:** ProcessMetaLanguage-v1.0.0-beta.1.zip  

---

## 🚀 Installation Rapide (5 min)

### 1. Préparer Obsidian
```bash
# Créer un nouveau vault de test
# Nom suggéré: "PML-Beta-Test-v2"
```

### 2. Installer les Dépendances
1. Ouvrir Obsidian → Settings → Community plugins
2. Turn off "Restricted mode"
3. Browse → Installer:
   - **Excalidraw** (by Zsolt Viczian)
   - **Templater** (by SilentVoid13)

### 3. Configurer Excalidraw
- Settings → Excalidraw
- ✅ Enable "ExcalidrawAutomate"
- ✅ Script Engine: "Enabled"

### 4. Installer ProcessMetaLanguage
```bash
# 1. Extraire ProcessMetaLanguage-v1.0.0-beta.1.zip
# 2. Copier le contenu dans:
#    .obsidian/plugins/processmetalanguage/
# 3. Structure finale:
#    .obsidian/plugins/processmetalanguage/
#    ├── main.js
#    ├── manifest.json
#    ├── styles.css
#    └── INSTALL.md
```

### 5. Activer le Plugin
1. Settings → Community plugins
2. Chercher "ProcessMetaLanguage"
3. Toggle ON
4. **Redémarrer Obsidian** (important!)

---

## ✅ Test d'Installation (2 min)

### Vérification 1: Plugin Chargé
```javascript
// Console Obsidian (Cmd+Opt+I / Ctrl+Shift+I)
app.plugins.enabledPlugins.has('processmetalanguage')
// Expected: true
```

### Vérification 2: Commandes Disponibles
1. Cmd/Ctrl + P
2. Taper "ProcessMeta"
3. Devrait voir:
   - ProcessMetaLanguage: Toggle Interface
   - ProcessMetaLanguage: Create Object
   - ProcessMetaLanguage: Initialize Project

### Vérification 3: ExcalidrawAutomate
1. Créer nouveau dessin Excalidraw
2. Console:
```javascript
typeof ExcalidrawAutomate
// Expected: "object"
```

---

## 🧪 Tests Essentiels (10 min)

### Test 1: Premier Objet (2 min)
1. Ouvrir un dessin Excalidraw
2. Cmd+P → "ProcessMetaLanguage: Toggle Interface"
3. Interface apparaît à droite? ✅
4. Cliquer "Create Object"
5. Nommer: "Test-Product-001"
6. Objet hexagonal créé? ✅

### Test 2: État et Actions (3 min)
1. Sélectionner l'objet créé
2. Dans l'interface → "Add State"
3. Choisir "active"
4. État créé sous l'objet? ✅
5. Action principale auto-générée? ✅

### Test 3: Template EPCIS (3 min)
1. Interface → "Templates"
2. Voir 41 business steps? ✅
3. Cliquer "receiving"
4. Template appliqué? ✅
5. Métadonnées EPCIS présentes? ✅

### Test 4: Synchronisation (2 min)
1. Modifier nom objet dans canvas
2. Attendre 2 secondes
3. Vérifier sync (devrait voir notification)
4. Export → Markdown
5. Documentation générée? ✅

---

## 📊 Métriques à Noter

### Performance
- [ ] Temps création objet: _____ ms (cible < 100ms)
- [ ] Temps application template: _____ ms
- [ ] Lag interface: Aucun / Léger / Important
- [ ] Mémoire (F12 → Memory): _____ MB

### Utilisabilité
- [ ] Interface intuitive: ⭐⭐⭐⭐⭐
- [ ] Templates clairs: ⭐⭐⭐⭐⭐
- [ ] Messages d'erreur: Clairs / Confus
- [ ] Documentation aide: Oui / Non

### Bugs Rencontrés
```markdown
BUG-001:
Description: 
Étapes repro:
Fréquence: Toujours/Parfois/Une fois
```

---

## 🏁 Test Cas Réel (15 min)

### Scénario: Traçabilité Livraison Construction

1. **Créer Objet**
   - Nom: "Lot-Beton-2024-001"
   - Type: raw_material

2. **Ajouter États**
   - arriving (livraison)
   - inspecting (contrôle)
   - storing (stockage)
   - in_transit (vers chantier)

3. **Actions pour "arriving"**
   - Main: "Scan QR livraison"
   - Secondary: "Photo camion"
   - Secondary: "Validation quantité"

4. **Métadonnées**
   - Fournisseur: "LafargeHolcim"
   - Quantité: "25m³"
   - Chantier: "Tour-A-Site-Nord"

5. **Export**
   - Markdown → Vérifier lisibilité
   - OpenAPI → Vérifier structure
   - 360SmartConnect → Compatible?

### Critères Succès
- [ ] Process complet modélisé
- [ ] Toutes données préservées
- [ ] Export utilisable
- [ ] Pas de crash/erreur

---

## 💾 Sauvegarde Résultats

### Captures d'Écran
1. Interface complète
2. Process créé
3. Export généré
4. Erreurs (si any)

### Logs Console
```javascript
// Copier tous les logs/erreurs
// Sauver dans: beta-test-console.log
```

### Fichiers Générés
- Export markdown
- Export OpenAPI
- Canvas .excalidraw

---

## 🎯 Décision Go/No-Go

### ✅ GO si:
- [ ] Installation < 10 min
- [ ] Tous tests essentiels passent
- [ ] Cas réel fonctionne
- [ ] Pas de bugs bloquants
- [ ] Performance acceptable

### ❌ NO-GO si:
- [ ] Crash au démarrage
- [ ] Fonctions core cassées
- [ ] Perte de données
- [ ] Interface inutilisable

### Verdict: [ ] GO [ ] NO-GO

**Commentaires:**
_____________________________
_____________________________
_____________________________

---

## 📧 Rapport Final

Envoyer résultats à l'équipe dev:
- Screenshots
- Logs erreurs
- Métriques performance
- Suggestions amélioration

---

*Bon test! 🚀*