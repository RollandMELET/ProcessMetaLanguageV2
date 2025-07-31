# Guide Test Utilisateur Phase 1 - ProcessMetaLanguage

**Version:** 1.0.0  
**Date:** 2025-07-28 19:15  
**Auteur:** Rolland MELET & Claude Code  
**Document:** Guide complet test utilisateur Phase 1 - TASK-T002

---

## 🎯 OBJECTIF DU TEST

Valider que l'utilisateur peut créer un processus industriel complet avec **3 composants ProcessMetaLanguage** (OBJECT → STATE → ACTION) et obtenir une documentation synchronisée automatiquement.

### Critères de Réussite Global
- ✅ Création intuitive des 3 composants graphiques
- ✅ Dimensions exactes respectées (120x80 + 80x40 + 140x60)
- ✅ Tags ProcessMetaLanguage appliqués automatiquement
- ✅ Synchronisation canvas → markdown fonctionnelle 
- ✅ Documentation complète générée en <5s
- ✅ Workflow État-Actions deux niveaux validé

---

## 🛠️ PRÉREQUIS TECHNIQUE

### Environnement Requis
- **Obsidian** 1.4.16+ avec plugin Excalidraw 2.0.0+
- **Node.js** 18+ pour exécution tests
- **Navigateur** Chrome/Edge pour Playwright
- **Plugins Obsidian** : Excalidraw + Templater + ExcalidrawAutomate activé

### Installation Test
```bash
cd /Users/rollandmelet/Développement/Projets/ProcessMetaLanguage
npm install
npm run test:user:phase1
```

---

## 📋 SCÉNARIO TEST PRINCIPAL

### Scenario 1: "Création Processus Fabrication Pièce Mécanique"

**Contexte utilisateur** : Ingénieur industriel documentant un processus de fabrication

**Durée estimée** : 10-15 minutes

**Étapes détaillées** :

#### 1️⃣ PRÉPARATION (2 min)
- [ ] Ouvrir Obsidian dans vault de test
- [ ] Créer nouveau fichier `processus-test-phase1.excalidraw`
- [ ] Vérifier que ExcalidrawAutomate est activé
- [ ] S'assurer que ProcessMetaLanguage est configuré

#### 2️⃣ CRÉATION OBJECT - Lot Matière (3 min)
- [ ] **Action** : Créer hexagone pour "Lot Acier A001"
- [ ] **Vérifier** : Dimensions exactes 120x80px
- [ ] **Vérifier** : Couleur verte (#4CAF50) appliquée
- [ ] **Vérifier** : Tag `#process-object` ajouté automatiquement
- [ ] **Vérifier** : Position (200, 200) respectée

**Validation attendue** :
```
🔷 Hexagone OBJECT
├── Nom: "Lot Acier A001"  
├── Dimensions: 120x80px
├── Type: raw-material (inféré)
├── Couleur: #4CAF50
└── Tag: #process-object ✅
```

#### 3️⃣ CRÉATION STATE - État Production (2 min)
- [ ] **Action** : Créer bannière "En Production" 
- [ ] **Position** : Superposée sur l'objet (210, 180)
- [ ] **Vérifier** : Dimensions exactes 80x40px
- [ ] **Vérifier** : Couleur bleue (#2196F3) appliquée
- [ ] **Vérifier** : Tag `#process-state` ajouté automatiquement

**Validation attendue** :
```
🏃 Bannière STATE
├── Nom: "En Production"
├── Dimensions: 80x40px  
├── Disposition: active (inférée)
├── Superposition: OBJECT ✅
├── Couleur: #2196F3
└── Tag: #process-state ✅
```

#### 4️⃣ CRÉATION ACTION - Contrôle Qualité (2 min)
- [ ] **Action** : Créer rectangle arrondi "Contrôler Qualité"
- [ ] **Position** : Proche de l'état (350, 190)
- [ ] **Vérifier** : Dimensions exactes 140x60px
- [ ] **Vérifier** : Coins arrondis (radius 8px)
- [ ] **Vérifier** : Couleur rouge (#F44336) appliquée
- [ ] **Vérifier** : Tag `#process-action` ajouté automatiquement

**Validation attendue** :
```
🎬 Rectangle ACTION
├── Nom: "Contrôler Qualité"
├── Dimensions: 140x60px
├── Type: validation_action (inféré)
├── Coins arrondis: 8px ✅
├── Couleur: #F44336
└── Tag: #process-action ✅
```

#### 5️⃣ RELATIONS WORKFLOW (1 min)
- [ ] **Action** : Tracer flèche OBJECT → STATE
- [ ] **Action** : Tracer flèche STATE → ACTION
- [ ] **Vérifier** : Relations détectées par proximité spatiale

#### 6️⃣ SYNCHRONISATION (3 min)
- [ ] **Action** : Déclencher synchronisation ProcessMetaLanguage
- [ ] **Vérifier** : Génération <5s
- [ ] **Vérifier** : 4 fichiers markdown créés
- [ ] **Vérifier** : Structure dossiers correcte

**Structure attendue** :
```
docs/generated/
├── objects/lot-acier-a001.md ✅
├── states/en-production.md ✅  
├── actions/controler-qualite.md ✅
└── workflow-consolide.md ✅
```

#### 7️⃣ VALIDATION DOCUMENTATION (2 min)
- [ ] **Vérifier** : Métadonnées EPCIS 2.0 présentes
- [ ] **Vérifier** : Action principale automatique générée
- [ ] **Vérifier** : Workflow interne complet
- [ ] **Vérifier** : Correspondances 360SmartConnect

---

## ✅ CHECKLIST VALIDATION DÉTAILLÉE

### 📐 Conformité Graphique
- [ ] **Hexagone OBJECT** : 120x80px exactement
- [ ] **Bannière STATE** : 80x40px exactement  
- [ ] **Rectangle ACTION** : 140x60px exactement
- [ ] **Coins arrondis** : Actions avec radius 8px
- [ ] **Couleurs standard** : Vert/Bleu/Rouge selon types
- [ ] **Positionnement** : Superposition STATE sur OBJECT

### 🏷️ Tags ProcessMetaLanguage
- [ ] **#process-object** : Ajouté automatiquement aux hexagones
- [ ] **#process-state** : Ajouté automatiquement aux bannières
- [ ] **#process-action** : Ajouté automatiquement aux rectangles
- [ ] **Pas de duplication** : Tags existants non dupliqués
- [ ] **Format correct** : Tags à la fin du texte

### 🔄 Synchronisation Canvas → Markdown
- [ ] **Détection éléments** : 3 composants ProcessMetaLanguage détectés
- [ ] **Relations spatiales** : Proximité OBJECT↔STATE et STATE↔ACTION
- [ ] **Performance** : Génération complète <5s
- [ ] **Fichiers créés** : 4 documents markdown minimum
- [ ] **Structure dossiers** : objects/, states/, actions/, workflow/

### 📊 Qualité Documentation
- [ ] **Métadonnées complètes** : Type, position, dimensions, couleurs
- [ ] **EPCIS 2.0 compliance** : Business steps et dispositions correctes
- [ ] **Action principale auto** : Consulter_[État] générée pour chaque état
- [ ] **Workflow interne** : Étapes validation/exécution/sortie
- [ ] **Paramètres I/O** : Entrées et sorties définies
- [ ] **Rollback strategy** : Compensation définie si applicable

### 🎯 Architecture ProcessMetaLanguage
- [ ] **Deux niveaux** : États avec actions principales + secondaires
- [ ] **Entités tracées** : Objects comme avatars d'entités physiques
- [ ] **Transitions** : Actions secondaires pour changements d'état
- [ ] **Navigation** : Actions principales pour consultation données
- [ ] **Workflow consolidé** : Vue d'ensemble du processus complet

---

## 🚨 POINTS DE VIGILANCE

### Erreurs Fréquentes à Éviter
1. **Dimensions incorrectes** : Vérifier mesure exacte avec règle Excalidraw
2. **Tags manquants** : S'assurer que #process-* apparaît dans le texte
3. **Superposition ratée** : STATE doit être visuellement sur OBJECT
4. **Relations non détectées** : Éléments trop éloignés (>100px)
5. **Performance dégradée** : Canvas trop complexe pour test initial

### Diagnostics Dépannage
```bash
# Vérifier configuration
npm run validate:config

# Test composants isolés  
npm run test:components

# Debug synchronisation
npm run debug:sync

# Logs détaillés
npm run test:user:phase1 --verbose
```

---

## 📈 MÉTRIQUES DE SUCCÈS

### Seuils de Performance
- **Temps création** : <2min par composant
- **Temps synchronisation** : <5s pour 3 composants
- **Taux de réussite** : >90% des critères validés
- **Utilisabilité** : Processus intuitif sans documentation

### KPI Utilisateur
- **Time to First Success** : <15min pour processus complet
- **Error Recovery** : <2min pour corriger erreur courante
- **Learning Curve** : Maîtrise après 2-3 processus créés
- **Satisfaction** : Score >8/10 sur utilisabilité

---

## 🔄 WORKFLOW POST-TEST

### Actions Automatiques
1. **Sauvegarde résultats** : Screenshots + logs dans `/test-results/`
2. **Génération rapport** : Résumé succès/échecs au format JSON
3. **Nettoyage** : Suppression fichiers temporaires
4. **Archivage** : Conservation exemples réussis

### Feedback Utilisateur
- [ ] **Difficultés rencontrées** : Noter points de friction
- [ ] **Suggestions amélioration** : Propositions UX/UI
- [ ] **Bugs identifiés** : Comportements inattendus
- [ ] **Performance ressentie** : Vitesse subjective vs. objective

### Décision Go/No-Go Phase 2
**Critères pour passage Phase 2** :
- ✅ Score validation ≥90%
- ✅ Performance <5s respectée
- ✅ Aucun bug bloquant
- ✅ Feedback utilisateur positif (≥7/10)

---

## 🆘 SUPPORT & ESCALATION

### Contacts Équipe
- **Technique** : Rolland MELET (rm@360sc.io)
- **Product** : ProcessMetaLanguage Team
- **QA** : Test Engineering Team

### Resources Utiles
- **Documentation** : ./docs/user-guide.md
- **FAQ** : ./docs/faq.md
- **Issues** : GitHub ProcessMetaLanguage/issues
- **Slack** : #processmetalanguage-support

---

*Guide TASK-T002 - Test Utilisateur Phase 1 - ProcessMetaLanguage v1.0.0*