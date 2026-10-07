# CLAUDE.md

> Fichier canonique pour tout agent (Claude Code, Codex, RC1, RC2). `CLAUDE.md` est un symlink vers ce fichier.

## Project Overview

ProcessMetaLanguage is a visual workflow modeling system that extends Obsidian Excalidraw to create standardized process descriptions using embedded templates. The project implements a metalanguage (v2.3) for describing workflows, processes, states, and behaviors in industrial contexts, particularly for the 360SmartConnect traceability platform.

## Core Architecture

### Hierarchical Structure
```
🏗️ WORKFLOW (Global orchestration, multi-objects/processes)
    └── 📄 PROCESSUS (State sequence for ONE specific object)
        └── 🏳️ ÉTAT (Instantaneous object situation)
            └── 📚 TEMPLATES (Reusable behaviors)
```

### Key Concepts
- **WORKFLOW**: Global orchestration managing multiple processes across different objects
- **PROCESSUS**: Lifecycle of a single specific object through state transitions  
- **ÉTAT**: Current state of an object with typed classification (initial/intermediate/final)
- **COMPORTEMENT**: Behavior patterns that can be templated and reused
- **ACTION**: Triggers that cause state transitions
- **VUE/AFFICHAGE**: UI representations linked to behaviors

## Development Context

### Technology Stack
- **Obsidian** (https://github.com/obsidianmd) - Knowledge base platform
- **Excalidraw Plugin** (https://github.com/zsviczian/obsidian-excalidraw-plugin) - Visual drawing integration
- **Dataview Plugin** (https://github.com/blacksmithgu/obsidian-dataview) - Data presentation for objects
- **Templater Plugin** (https://github.com/SilentVoid13/Templater) - Template management

### Existing Scripts Location
- **embed-object-from-template**: `/Users/rollandmelet/Développement/Projets/EXCALIDRAW_Script_EmbededDrawingFromTemplate`
  - Creates and embeds objects from templates in Excalidraw
  - Version 1.3.0 with bilingual support (EN/FR)
  
- **excalidraw-embedded-extractor**: `/Users/rollandmelet/Développement/Projets/EXCALIDRAW_Template_ExtractEmbedded`
  - Extracts embedded files from Excalidraw and generates markdown
  - Based on Zsviczian's Writing Machine

## Current Development Tasks

### Template Creation Priority
1. OBJET template with BackOfTheCard structure
2. ETAT template with state type classification
3. COMPORTEMENT template for behavior patterns
4. ACTION template for state transitions
5. VUE/AFFICHAGE template for UI wireframes
6. PROCESS template for object lifecycles
7. WORKFLOW template for global orchestration

### Script Development Goals
- Create new scripts (not modify existing ones) for:
  - Object creation and management
  - Process definition and state sequencing
  - Behavior and action assignment
  - View/display wireframe integration
  - Canvas to markdown transformation

## ProcessMetaLanguage v2.3 Rules

### Fundamental Rules
1. **Object-Process-State Rule**: If an object has a `processus_objet_id`, it MUST have an `etat_actuel_id`
2. **Clean URL Rule**: Each object has a unique clean URL (`/objects/{uid}`) for direct access
3. **Automatic Redirection**: Object URL automatically redirects to current state behavior
4. **State Classification**: States must be typed as initial/final/intermediate/unique
5. **Transition Logging**: All state changes MUST be logged in history

### State Types
- **initial**: Entry point, no predecessor, can create object
- **intermediate**: Has both predecessor and successor states
- **final**: Exit point, no successor, triggers finalization
- **unique**: Single-state process (rare case)

## 360SmartConnect Context

The system targets the 360SmartConnect SaaS platform for industrial traceability with:
- Multi-tenant architecture for concurrent client/project management
- Parallel handling of thousands of objects and processes
- Scalable workflow orchestration
- Cross-process intelligent coordination

## Working Directory Structure

Main project location:
```
/Users/rollandmelet/Library/CloudStorage/GoogleDrive-rm@360sc.io/Mon Drive/OBSIDIAN/CHATTERS/002 - Projets/PERSO/ProcessMetaLanguage/
```

Note: Avoid files in the `./old/` subdirectory as they contain outdated versions.

## Development Guidelines

When creating templates or scripts:
1. Follow the hierarchical structure (Workflow → Process → State → Template)
2. Ensure state type classification is explicit
3. Implement transition logging for traceability
4. Use bilingual support (FR/EN) pattern from existing scripts
5. Maintain compatibility with Obsidian Excalidraw API
6. Create "BackOfTheCard" style templates for visual clarity

## Template Structure Pattern

Templates should follow this structure:
- Front: Visual representation (Excalidraw drawing)
- Back: Metadata and properties (YAML/JSON structure)
- Embedded content: Markdown documentation
- State transitions: Action definitions
- Behavior patterns: Reusable components
- add to memory en phase de developpement de TOUJOURS generer des scripts qui loggent leur actions dans la console, une fois que l'utilisateur est ok avec le fonctionnement du script proposer de generer une version de production SANS logg dans la console