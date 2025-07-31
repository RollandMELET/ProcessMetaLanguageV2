# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🎯 PROJECT OVERVIEW

ProcessMetaLanguage is a **graphical meta-language system** for designing industrial traceability processes in Obsidian Excalidraw. It transforms visual diagrams into comprehensive technical documentation ready for implementation in traceability systems.

**Core Concept**: Two-level State-Actions architecture where each OBJECT has STATES, and each STATE has one MAIN ACTION (required) and multiple SECONDARY ACTIONS (optional).

## 🛠️ DEVELOPMENT COMMANDS

### Testing
```bash
# Run all tests
npm test

# Run tests in watch mode  
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests with UI interface
npm run dev

# Manual UI testing
npm run test:ui-manual
```

### Building
```bash
# Build the project
npm run build
```

### Testing Strategy
- **Unit tests**: Located in `tests/` directory, using Vitest
- **Integration tests**: Canvas-template synchronization tests  
- **User acceptance tests**: Phase-based validation tests
- **EPCIS compliance tests**: Validation of GS1 EPCIS 2.0 standard conformity

## 🏗️ ARCHITECTURE & STRUCTURE

### Core Architecture
The project follows a **two-level State-Actions architecture**:

```
OBJECT (Hexagon - Tracked Entity)
├── STATE (Flag/Banner - Current Condition)
│   ├── 🔵 MAIN_ACTION (REQUIRED - Data exposition + Navigation)
│   ├── 🟡 SECONDARY_ACTION_1 (OPTIONAL - Data capture + Workflow)
│   └── 🟡 SECONDARY_ACTION_N (OPTIONAL - State transitions)
└── OBJECT_DATA (Metadata + History)
```

### Key Modules

**Core Components** (`components/`):
- `object-creator.js` - Creates standardized hexagon objects (120x80px)
- `state-creator.js` - Creates state banners (80x40px) 
- `action-creator.js` - Creates action rectangles (140x60px)

**Core Logic** (`core/`):
- `template-processor.js` - Processes YAML templates into markdown
- `template-manager.js` - Manages template creation/duplication/inheritance
- `main-action-generator.js` - Auto-generates main actions for states
- `secondary-actions.js` - Manages secondary actions and workflows
- `transition-manager.js` - Handles state transitions
- `workflow-orchestrator.js` - Orchestrates complete workflows

**Synchronization** (`sync/`):
- `canvas-reader.js` - Reads Excalidraw canvas elements
- `markdown-generator.js` - Generates markdown documentation from canvas

**Templates** (`templates/`):
- `epcis/` - Contains 41 business steps + 25 dispositions from GS1 EPCIS 2.0
- `*-template.md` - Base templates for objects, states, and actions

**UI** (`ui/`):
- `components-palette.js` - Toolbar for creating standard components
- `template-selector.js` - Interface for selecting EPCIS templates
- `customization-panel.js` - Panel for customizing template properties

## 🛠️ TECHNOLOGY STACK

### Core Platform
- **Platform**: Obsidian + Excalidraw plugin + Templater plugin
- **Scripting**: JavaScript ES6+ with modules
- **Testing**: Vitest with jsdom environment
- **Standards**: GS1 EPCIS 2.0 (41 business steps + 25 dispositions)
- **Output**: Markdown with YAML frontmatter
- **Configuration**: YAML with schema validation

### Prerequisites
- Obsidian (1.4.16+)
- Excalidraw plugin (2.0.0+) with ExcalidrawAutomate enabled
- Templater plugin (2.0.0+)
- Node.js (for development and testing)

### Development Environment
- **Testing**: jsdom environment with Vitest
- **Coverage**: v8 provider with HTML/LCOV reports
- **File watching**: Vitest watch mode for rapid development

## 🎯 CODING STANDARDS

### File Format Requirements
All JavaScript files must follow this header format:
```javascript
// <!-- START OF FILE: FileName.js -->
// FILENAME: FileName.js
// Version: 1.0.0
// Date: YYYY-MM-DD HH:MM
// Author: Rolland MELET & Claude Code
// Description: Brief description of changes/purpose
```

### Documentation Requirements
- **JSDoc required** for ALL functions and methods
- **@sideEffect tag** required for functions with external effects (Obsidian API, file system)
- **Realistic examples** in JSDoc (avoid "foo", "bar", "test")
- **Zero exceptions**: No undocumented functions allowed

### Example Standard Code
```javascript
/**
 * Creates a standardized graphic object in Excalidraw
 * @param {string} objectName - Name of the traced object (e.g., "Lot-Material-001")
 * @param {string} objectType - Object type (raw-material, product, etc.)
 * @param {Object} position - Position {x, y} on canvas
 * @returns {string} Unique ID of created object
 * @sideEffect Modifies active Excalidraw canvas, triggers auto-save
 * @example
 * // Create raw material object at reception
 * const objId = createObject("Lot-Steel-A001", "raw-material", {x: 100, y: 200});
 * // Returns: "obj_raw_material_1234567890"
 */
function createObject(objectName, objectType, position) {
    // Implementation...
}
```

## 🎭 WORKFLOW GUIDANCE

### Task Coordination
When working on this project, follow this workflow:
1. **Read plan.md** → Understand detailed development phases
2. **Check tasks.md** → Identify specific tasks and their completion status  
3. **Update progress** → Mark completed tasks with [x] in tasks.md
4. **Validate quality** → Ensure each deliverable meets the defined criteria

### Agent Specializations
The project is designed for specialized agents:
- **frontend**: UI components, Excalidraw integration, user interfaces
- **backend**: Core logic, synchronization, workflow orchestration
- **database**: EPCIS templates, data structures, validation
- **test**: Unit tests, integration tests, user acceptance tests

## 🚨 TROUBLESHOOTING

### Common Issues

**ExcalidrawAutomate not found**
```javascript
// Check in Obsidian console (Ctrl+Shift+I)
if (typeof ExcalidrawAutomate === 'undefined') {
  console.error('Excalidraw plugin missing or misconfigured');
}
// Solution: Reinstall Excalidraw plugin
```

**Templates not loading**
- Verify template files exist in `templates/` directory
- Check YAML frontmatter syntax
- Ensure template-processor.js can read files

**Synchronization failures**
- Verify canvas elements have correct tags: `#process-object`, `#process-state`, `#process-action`
- Check canvas-reader.js for compatibility with current Excalidraw version

**Test failures**
```bash
# Check test environment
npm run test:coverage
# Review test output for specific failures
```

### Performance Targets
- **Component creation**: < 2 seconds
- **Canvas synchronization**: < 5 seconds (50 components)
- **Template processing**: < 1 second (batch operations)
- **Test suite**: < 30 seconds (full suite)

## 🧪 EPCIS 2.0 INTEGRATION

### Templates Available
- **Business Steps**: 41 standard steps (receiving, shipping, packing, inspecting, storing, transforming, etc.)
- **Dispositions**: 25 standard dispositions (active, in_transit, destroyed, damaged, expired, etc.)
- **Location**: `templates/epcis/business-steps/` and `templates/epcis/dispositions/`
- **Format**: YAML files with GS1 EPCIS 2.0 compliance
- **Validation**: epcis-validator.js ensures CBV 2.0 conformity

## 🔧 IMPORTANT NOTES

### Element Tags
All graphical elements must have proper tags for synchronization:
- `#process-object` for hexagon objects
- `#process-state` for state banners  
- `#process-action` for action rectangles

### Project Planning Files
- `00 - PRD&Plan/plan.md` - Master development plan with phases and milestones
- `00 - PRD&Plan/tasks.md` - Atomic tasks with completion tracking [x]
- Always check and update these files when working on tasks

### Quality Requirements
- All functions must have complete JSDoc documentation
- Tests must pass before committing changes
- Coverage should be > 80% for new code
- Follow the standardized file header format

### Git Workflow
- Use Conventional Commits for all commit messages
- Run tests before committing: `npm test`
- Check for linting issues: `npm run test:coverage`
- Update task completion in `tasks.md` when finishing work