# ProcessMetaLanguage - Foire Aux Questions (FAQ)

---

## Questions Générales

### Q: Qu'est-ce que ProcessMetaLanguage ?
**R**: ProcessMetaLanguage est un système de méta-langage graphique pour Obsidian qui permet de créer des processus de traçabilité industrielle visuellement avec Excalidraw, puis de générer automatiquement toute la documentation technique nécessaire (markdown, API, matrices de flux).

### Q: Pourquoi utiliser ProcessMetaLanguage plutôt qu'un outil BPM classique ?
**R**: ProcessMetaLanguage offre plusieurs avantages :
- **Intégration native** dans votre système de notes Obsidian
- **Standards EPCIS 2.0** intégrés pour conformité GS1
- **Architecture État-Actions** unique pour traçabilité précise
- **Export multi-format** automatique (pas de verrouillage vendeur)
- **Open source** et extensible

### Q: Quelles industries sont supportées ?
**R**: ProcessMetaLanguage supporte toutes les industries nécessitant de la traçabilité :
- 🏭 **Manufacturing** (automobile, électronique, métallurgie)
- 📦 **Logistics** (transport, entreposage, distribution)
- 🛒 **Retail** (commerce détail, e-commerce)
- 💊 **Healthcare** (pharmaceutique, dispositifs médicaux)
- 🍎 **Food & Beverage** (agroalimentaire, restauration)
- ✈️ **Aerospace** (aéronautique, défense)

---

## Installation et Configuration

### Q: Quels sont les prérequis système ?
**R**: 
- **Obsidian** v1.4.16 ou supérieur
- **Plugin Excalidraw** v2.0.0+ avec ExcalidrawAutomate activé
- **Plugin Templater** v2.0.0+ (pour templates dynamiques)
- **Navigateur moderne** (Chrome, Firefox, Safari, Edge)
- **4GB RAM minimum** (8GB recommandé pour gros projets)

### Q: Comment activer ExcalidrawAutomate ?
**R**: 
1. Ouvrir Paramètres Obsidian
2. Aller dans Plugins → Excalidraw
3. Activer "Enable ExcalidrawAutomate"
4. Redémarrer Obsidian

### Q: Où sont stockés mes processus ?
**R**: Vos processus sont stockés localement dans votre vault Obsidian :
- **Canvas** : `VotreProcessus.excalidraw`
- **Documentation** : `VotreProcessus.md`
- **Templates** : `.obsidian/plugins/processmetalanguage/templates/`
- **Exports** : Dossier de votre choix

---

## Utilisation

### Q: Comment créer mon premier processus ?
**R**: 
1. Créer un nouveau fichier `.excalidraw`
2. L'interface ProcessMetaLanguage s'ouvre automatiquement
3. Utiliser la toolbar : ⬡ Objet → 🏷️ État → ▭ Action
4. Les composants s'assemblent automatiquement
5. Export → Générer documentation

### Q: Quelle est la différence entre Action Principale et Secondaire ?
**R**: 
- **Action Principale** (obligatoire) :
  - Expose les données de l'objet (lecture)
  - Fournit navigation vers autres états
  - Une seule par état
  - Couleur bleue
  
- **Actions Secondaires** (optionnelles) :
  - Capturent nouvelles données (écriture)
  - Déclenchent transitions d'état
  - Multiples possibles par état
  - Couleur orange

### Q: Comment utiliser les templates EPCIS ?
**R**: 
1. Cliquer "📊 EPCIS" dans la toolbar
2. Parcourir les 41 business steps ou 25 dispositions
3. Sélectionner et personnaliser si besoin
4. Le template s'applique automatiquement avec conformité garantie

### Q: Les suggestions intelligentes sont-elles obligatoires ?
**R**: Non, elles sont optionnelles et peuvent être désactivées :
- Paramètres → ProcessMetaLanguage → Désactiver suggestions
- Ou ignorer simplement les suggestions affichées
- Elles s'adaptent à votre style de travail

---

## Fonctionnalités Avancées

### Q: Comment gérer des processus complexes (100+ composants) ?
**R**: Pour les grands processus :
1. **Diviser en sous-processus** liés
2. **Utiliser les vues filtrées** par type/état
3. **Activer le mode performance** dans paramètres
4. **Désactiver sync auto** temporairement
5. **Exporter par sections**

### Q: Puis-je personnaliser les business steps EPCIS ?
**R**: Oui, tout en gardant la conformité :
1. Sélectionner un business step standard
2. Cliquer "Personnaliser"
3. Ajouter vos champs spécifiques
4. Sauvegarder comme template custom
5. La conformité EPCIS reste validée

### Q: Comment intégrer avec mon système existant ?
**R**: ProcessMetaLanguage génère plusieurs formats :
- **OpenAPI 3.0** : Pour générer clients/serveurs automatiquement
- **JSON/YAML** : Pour import dans autres outils
- **360SmartConnect** : Mapping direct pour le SaaS
- **Webhooks** : Points d'intégration temps réel

### Q: L'auto-complétion fonctionne-t-elle partout ?
**R**: L'auto-complétion est active sur :
- Tous les champs marqués `pml-autocomplete`
- Noms de composants
- Business steps et dispositions
- Propriétés EPCIS
- Termes personnalisés ajoutés

---

## Problèmes Techniques

### Q: L'interface ne s'affiche pas du tout
**R**: Vérifiez dans l'ordre :
1. Plugin ProcessMetaLanguage activé
2. Fichier ouvert est bien `.excalidraw`
3. Console (`Ctrl+Shift+I`) pour erreurs
4. Désactiver/réactiver le plugin
5. Redémarrer Obsidian

### Q: La synchronisation est très lente
**R**: Optimisations possibles :
1. Réduire nombre de composants visibles
2. Paramètres → Augmenter délai sync (5s → 10s)
3. Nettoyer cache : Paramètres → Vider cache
4. Désactiver suggestions temporairement
5. Utiliser mode manuel pour gros changements

### Q: "Validation échouée" - que faire ?
**R**: Lire le rapport de validation qui indique :
- ❌ **Composant isolé** : Connecter avec flèches
- ❌ **État sans action** : Action principale auto-générée manquante
- ❌ **Cycle détecté** : Revoir transitions
- ❌ **EPCIS non conforme** : Utiliser template standard

### Q: Export bloqué ou timeout
**R**: Solutions :
1. Vérifier taille processus (< 200 composants recommandé)
2. Exporter par modules séparés
3. Augmenter timeout : Paramètres → Export timeout → 60s
4. Désactiver "Inclure diagrammes" temporairement
5. Vérifier espace disque disponible

---

## Données et Sécurité

### Q: Mes données sont-elles envoyées quelque part ?
**R**: **Non**, ProcessMetaLanguage fonctionne 100% localement :
- Aucune donnée envoyée à des serveurs
- Tout reste dans votre vault Obsidian
- Pas de télémétrie ou tracking
- Open source pour vérification

### Q: Comment sauvegarder mes processus ?
**R**: Vos processus sont des fichiers Obsidian normaux :
1. Sauvegarde automatique Obsidian
2. Sync Obsidian (si activé)
3. Git pour versioning
4. Export régulier en markdown
5. Backup du dossier vault

### Q: Puis-je collaborer sur un processus ?
**R**: Oui, via les méthodes Obsidian habituelles :
- **Obsidian Sync** pour équipes
- **Git** pour versioning avancé
- **Export/Import** de processus
- **Templates partagés**
- Mode collaboratif prévu v2.0

---

## Performance et Limites

### Q: Quelle est la taille maximale d'un processus ?
**R**: Limites pratiques recommandées :
- **100 composants** : Performance optimale
- **200 composants** : Acceptable avec optimisations
- **500+ composants** : Diviser en sous-processus
- **RAM** : ~50MB par 100 composants

### Q: Combien de templates puis-je avoir ?
**R**: Pas de limite stricte :
- **Standards EPCIS** : 66 inclus (41+25)
- **Templates custom** : Illimités
- **Performance** : Pas d'impact
- **Organisation** : Dossiers recommandés

### Q: Les exports sont-ils limités en taille ?
**R**: Limites export :
- **Markdown** : Pas de limite
- **JSON** : ~50MB pratique
- **OpenAPI** : ~10MB recommandé
- **Matrices** : 1000x1000 cellules max

---

## Évolution et Support

### Q: Comment reporter un bug ?
**R**: 
1. **GitHub Issues** : [github.com/ProcessMetaLanguage/issues](https://github.com)
2. Inclure :
   - Version Obsidian et plugins
   - Étapes pour reproduire
   - Messages d'erreur (console)
   - Capture écran si pertinent

### Q: Puis-je contribuer au projet ?
**R**: Oui ! ProcessMetaLanguage est open source :
- **Code** : Pull requests bienvenues
- **Documentation** : Améliorations appréciées
- **Templates** : Partagez vos créations
- **Traductions** : Aidez l'internationalisation
- **Tests** : Rapports de bugs utiles

### Q: Quelle est la roadmap ?
**R**: Principales évolutions prévues :
- **v1.1** : Multi-langues, plus d'industries
- **v1.2** : API REST pour intégration
- **v2.0** : Mode collaboratif temps réel
- **v2.1** : IA générative de processus
- **v3.0** : Version standalone

### Q: Y a-t-il une version payante ?
**R**: Non, ProcessMetaLanguage est et restera :
- ✅ 100% Open Source (MIT License)
- ✅ Gratuit pour tous usages
- ✅ Sans limitations artificielles
- ✅ Support communautaire
- 💡 Support entreprise envisagé (optionnel)

---

## Cas d'Usage Spécifiques

### Q: Puis-je modéliser des processus non-industriels ?
**R**: Oui ! ProcessMetaLanguage est adaptable :
- Workflows administratifs
- Processus de service
- Parcours client
- Flux d'information
- Tout processus avec états et transitions

### Q: Comment gérer les processus parallèles ?
**R**: Utilisez :
1. **Branches multiples** depuis un état
2. **Actions simultanées** (multiples secondaires)
3. **Points de synchronisation** (état "waiting")
4. **Sous-processus** indépendants
5. **Conditions** sur transitions

### Q: Puis-je importer des processus existants ?
**R**: Import possible depuis :
- **BPMN** : Convertisseur prévu v1.2
- **JSON** : Format ProcessMetaLanguage
- **CSV** : Via templates + script
- **Visio** : Export SVG puis import Excalidraw

---

## Astuces et Bonnes Pratiques

### Q: Comment nommer mes composants efficacement ?
**R**: Conventions recommandées :
- **Objets** : `Type-Identifiant-Version` (ex: `Lot-MAT-2024-001`)
- **États** : Utiliser dispositions EPCIS standards
- **Actions** : Business steps EPCIS si possible
- **Cohérence** : Même pattern dans tout le processus

### Q: Comment optimiser mes workflows ?
**R**: 
1. **Commencer simple** : 3-5 composants
2. **Itérer** : Ajouter détails progressivement
3. **Réutiliser** : Templates pour patterns récurrents
4. **Valider souvent** : Correction au fur et à mesure
5. **Documenter** : Descriptions claires

### Q: Y a-t-il des raccourcis cachés ?
**R**: Raccourcis avancés :
- `Double-clic` canvas : Création rapide
- `Shift+Drag` : Dupliquer composant
- `Ctrl+G` : Grouper sélection
- `Alt+Scroll` : Zoom rapide
- `?` : Afficher tous raccourcis

---

*Cette FAQ est mise à jour régulièrement. Pour questions non couvertes, consultez la [documentation complète](user-guide.md) ou créez une issue sur GitHub.*

*FAQ ProcessMetaLanguage v1.0.0 - 2025*