# ProcessMetaLanguage API Reference

**Version:** 1.0.0  
**Date:** 2025-08-01  
**Author:** Rolland MELET & Claude Code  

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Core Modules](#core-modules)
3. [Component APIs](#component-apis)
4. [Synchronization APIs](#synchronization-apis)
5. [Export APIs](#export-apis)
6. [Validation APIs](#validation-apis)
7. [UI APIs](#ui-apis)
8. [Events & Hooks](#events--hooks)
9. [Error Handling](#error-handling)
10. [Code Examples](#code-examples)

---

## 🎯 Overview

ProcessMetaLanguage provides a comprehensive API for creating and managing industrial traceability processes in Obsidian Excalidraw. This reference covers all public APIs available to developers.

### API Design Principles

- **Async-First**: All I/O operations return Promises
- **Event-Driven**: Real-time updates via EventEmitter
- **Validation**: Built-in parameter validation
- **Error Handling**: Consistent error objects
- **Documentation**: Full JSDoc annotations

### Global Namespace

All ProcessMetaLanguage APIs are available under the global `ProcessMetaLanguage` namespace once initialized:

```javascript
// Access after Obsidian loads
const PML = window.ProcessMetaLanguage;
```

---

## 🔧 Core Modules

### TemplateProcessor

Processes YAML templates into component specifications.

```javascript
class TemplateProcessor {
  /**
   * Initialize the template processor
   * @param {App} app - Obsidian app instance
   * @returns {Promise<void>}
   */
  async initialize(app)

  /**
   * Process a template file
   * @param {string} templatePath - Path to template file
   * @param {Object} context - Template variables
   * @returns {Promise<Object>} Processed template data
   */
  async processTemplate(templatePath, context)

  /**
   * Validate template structure
   * @param {Object} template - Template object
   * @returns {ValidationResult} Validation result
   */
  validateTemplate(template)

  /**
   * Get all available templates
   * @returns {Promise<Template[]>} Array of templates
   */
  async getTemplates()
}
```

### WorkflowOrchestrator

Manages complex workflow operations and state transitions.

```javascript
class WorkflowOrchestrator {
  /**
   * Create a new workflow object
   * @param {Object} config - Object configuration
   * @param {string} config.type - Object type
   * @param {string} config.name - Object name
   * @param {Object} config.metadata - Additional metadata
   * @returns {Promise<WorkflowObject>} Created object
   */
  async createObject(config)

  /**
   * Execute a state transition
   * @param {string} objectId - Object identifier
   * @param {string} targetState - Target state disposition
   * @param {Object} transitionData - Transition metadata
   * @returns {Promise<TransitionResult>}
   */
  async executeTransition(objectId, targetState, transitionData)

  /**
   * Create workflow branch for parallel execution
   * @param {Object} branchConfig - Branch configuration
   * @returns {Promise<WorkflowBranch>}
   */
  async createBranch(branchConfig)

  /**
   * Get complete object genealogy
   * @param {string} objectId - Object identifier
   * @returns {Promise<Genealogy>} Object history tree
   */
  async getCompleteGenealogy(objectId)
}
```

### TemplateManager

CRUD operations for template management.

```javascript
class TemplateManager {
  /**
   * Create new template
   * @param {Object} template - Template definition
   * @returns {Promise<string>} Template ID
   */
  async createTemplate(template)

  /**
   * Update existing template
   * @param {string} templateId - Template identifier
   * @param {Object} updates - Updates to apply
   * @returns {Promise<void>}
   */
  async updateTemplate(templateId, updates)

  /**
   * Delete template
   * @param {string} templateId - Template identifier
   * @returns {Promise<void>}
   */
  async deleteTemplate(templateId)

  /**
   * Duplicate template with inheritance
   * @param {string} sourceId - Source template ID
   * @param {string} newName - New template name
   * @returns {Promise<string>} New template ID
   */
  async duplicateTemplate(sourceId, newName)
}
```

---

## 🎨 Component APIs

### Object Creator

Create standardized hexagon objects.

```javascript
/**
 * Create a standard object in Excalidraw
 * @param {ExcalidrawAutomate} ea - ExcalidrawAutomate instance
 * @param {Object} config - Object configuration
 * @param {string} config.name - Object name
 * @param {string} config.type - Object type
 * @param {Point} config.position - Canvas position {x, y}
 * @param {Object} config.metadata - Additional metadata
 * @returns {Promise<ProcessObject>} Created object
 * @sideEffect Modifies Excalidraw canvas
 */
async function createStandardObject(ea, config)

// Return type
interface ProcessObject {
  id: string;           // Unique identifier
  elementId: string;    // Excalidraw element ID
  name: string;         // Display name
  type: string;         // Object type
  metadata: Object;     // Custom metadata
  position: Point;      // Canvas coordinates
  created: Date;        // Creation timestamp
}
```

### State Creator

Create state banners for objects.

```javascript
/**
 * Create state for an object
 * @param {ExcalidrawAutomate} ea - ExcalidrawAutomate instance
 * @param {string} objectId - Parent object ID
 * @param {Object} stateConfig - State configuration
 * @param {string} stateConfig.disposition - EPCIS disposition
 * @param {string} stateConfig.location - Business location
 * @param {Object} stateConfig.metadata - Additional data
 * @returns {Promise<ProcessState>} Created state
 */
async function createStateForObject(ea, objectId, stateConfig)

// State dispositions enum
const Dispositions = {
  ACTIVE: 'active',
  IN_PROGRESS: 'in_progress', 
  IN_TRANSIT: 'in_transit',
  INACTIVE: 'inactive',
  DAMAGED: 'damaged',
  // ... 20 more dispositions
};
```

### Action Creator

Create action rectangles for states.

```javascript
/**
 * Create action for a state
 * @param {ExcalidrawAutomate} ea - ExcalidrawAutomate instance
 * @param {string} stateId - Parent state ID
 * @param {Object} actionConfig - Action configuration
 * @param {string} actionConfig.businessStep - EPCIS business step
 * @param {boolean} actionConfig.isSecondary - Secondary action flag
 * @param {string[]} actionConfig.inputData - Required inputs
 * @param {Object} actionConfig.transitions - State transitions
 * @returns {Promise<ProcessAction>} Created action
 */
async function createActionForState(ea, stateId, actionConfig)

// Business steps enum
const BusinessSteps = {
  RECEIVING: 'receiving',
  INSPECTING: 'inspecting',
  STORING: 'storing',
  PICKING: 'picking',
  PACKING: 'packing',
  SHIPPING: 'shipping',
  // ... 35 more steps
};
```

---

## 🔄 Synchronization APIs

### Canvas Sync

Bidirectional synchronization between canvas and data model.

```javascript
class CanvasSync {
  /**
   * Sync canvas to templates
   * @param {Object} options - Sync options
   * @param {boolean} options.incremental - Incremental sync
   * @param {string[]} options.filter - Component types to sync
   * @returns {Promise<SyncResult>}
   */
  async syncToTemplates(options = {})

  /**
   * Sync templates to canvas
   * @param {Object} options - Sync options
   * @returns {Promise<SyncResult>}
   */
  async syncFromTemplates(options = {})

  /**
   * Enable real-time sync
   * @param {Object} config - Sync configuration
   * @param {number} config.interval - Sync interval (ms)
   * @param {Function} config.onChange - Change callback
   * @returns {void}
   */
  enableRealtimeSync(config)

  /**
   * Get sync status
   * @returns {SyncStatus} Current sync status
   */
  getSyncStatus()
}

// Sync result type
interface SyncResult {
  success: boolean;
  itemsSynced: number;
  errors: Error[];
  duration: number;
  timestamp: Date;
}
```

### Canvas Reader

Extract elements from Excalidraw canvas.

```javascript
class CanvasReader {
  /**
   * Get all process elements
   * @param {Object} filters - Optional filters
   * @returns {Promise<CanvasElements>}
   */
  async getAllElements(filters = {})

  /**
   * Get elements by type
   * @param {string} type - Element type
   * @returns {Promise<ProcessElement[]>}
   */
  async getElementsByType(type)

  /**
   * Get element relationships
   * @param {string} elementId - Element ID
   * @returns {Promise<Relationship[]>}
   */
  async getRelationships(elementId)
}
```

---

## 📤 Export APIs

### Workflow Exporter

Export workflows to various formats.

```javascript
class WorkflowExporter {
  /**
   * Export to Markdown
   * @param {Object} options - Export options
   * @param {boolean} options.includeDiagrams - Include Mermaid diagrams
   * @param {boolean} options.includeMetadata - Include frontmatter
   * @param {string} options.template - Custom template path
   * @returns {Promise<string>} Markdown content
   */
  async exportToMarkdown(options = {})

  /**
   * Export to JSON
   * @param {Object} options - Export options
   * @returns {Promise<Object>} JSON structure
   */
  async exportToJSON(options = {})

  /**
   * Export to YAML
   * @param {Object} options - Export options
   * @returns {Promise<string>} YAML content
   */
  async exportToYAML(options = {})
}
```

### OpenAPI Generator

Generate OpenAPI 3.0 specifications.

```javascript
class OpenAPIGenerator {
  /**
   * Generate API specification
   * @param {Object} config - API configuration
   * @param {string} config.version - API version
   * @param {string} config.baseUrl - Base URL
   * @param {string} config.title - API title
   * @param {Object} config.servers - Server configurations
   * @returns {Promise<string>} OpenAPI spec (JSON)
   */
  async generateSpecification(config)

  /**
   * Add custom endpoints
   * @param {Object[]} endpoints - Custom endpoints
   * @returns {void}
   */
  addCustomEndpoints(endpoints)
}

// Generated endpoint example
{
  "/objects/{objectId}": {
    "get": {
      "summary": "Get object details",
      "parameters": [...],
      "responses": {...}
    },
    "put": {
      "summary": "Update object",
      "requestBody": {...},
      "responses": {...}
    }
  }
}
```

### 360SmartConnect Mapper

Map ProcessMetaLanguage to 360SmartConnect format.

```javascript
class SmartConnectMapper {
  /**
   * Generate SmartConnect mapping
   * @param {Object} options - Mapping options
   * @returns {Promise<SmartConnectMapping>}
   */
  async generateMapping(options = {})

  /**
   * Map object to avatar
   * @param {ProcessObject} object - Process object
   * @returns {Avatar} SmartConnect avatar
   */
  mapObjectToAvatar(object)

  /**
   * Map workflow to API calls
   * @param {Workflow} workflow - Process workflow
   * @returns {APICall[]} API call sequence
   */
  mapWorkflowToAPICalls(workflow)
}
```

---

## ✅ Validation APIs

### EPCIS Validator

Validate EPCIS 2.0 compliance.

```javascript
class EPCISValidator {
  /**
   * Validate business step
   * @param {string} step - Business step code
   * @returns {ValidationResult}
   */
  validateBusinessStep(step)

  /**
   * Validate disposition
   * @param {string} disposition - Disposition code
   * @returns {ValidationResult}
   */
  validateDisposition(disposition)

  /**
   * Create EPCIS event
   * @param {Object} eventConfig - Event configuration
   * @returns {Promise<EPCISEvent>}
   */
  async createEvent(eventConfig)

  /**
   * Validate complete process
   * @param {Process} process - Process to validate
   * @returns {Promise<ComplianceReport>}
   */
  async validateProcess(process)
}

// Validation result type
interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: string[];
}
```

### Architecture Validator

Validate two-level architecture compliance.

```javascript
class ArchitectureValidator {
  /**
   * Validate architecture
   * @param {Object} options - Validation options
   * @returns {Promise<ArchitectureReport>}
   */
  async validateArchitecture(options = {})

  /**
   * Check for orphaned components
   * @returns {Promise<OrphanedComponent[]>}
   */
  async findOrphanedComponents()

  /**
   * Detect circular dependencies
   * @returns {Promise<CircularDependency[]>}
   */
  async detectCircularDependencies()
}
```

---

## 🖥️ UI APIs

### Main Interface

Control the main ProcessMetaLanguage interface.

```javascript
class ProcessMetaLanguageInterface {
  /**
   * Show interface
   * @param {Object} options - Display options
   * @returns {void}
   */
  show(options = {})

  /**
   * Hide interface
   * @returns {void}
   */
  hide()

  /**
   * Switch view
   * @param {string} viewName - View to switch to
   * @returns {void}
   */
  switchView(viewName)

  /**
   * Get current view
   * @returns {string} Current view name
   */
  getCurrentView()

  /**
   * Register view
   * @param {string} name - View name
   * @param {ViewComponent} component - View component
   * @returns {void}
   */
  registerView(name, component)
}
```

### Smart Suggestions

AI-powered workflow suggestions.

```javascript
class SmartSuggestions {
  /**
   * Enable suggestions
   * @param {Object} config - Suggestion config
   * @returns {void}
   */
  enable(config = {})

  /**
   * Get suggestions for context
   * @param {Object} context - Current context
   * @returns {Promise<Suggestion[]>}
   */
  async generateSuggestions(context)

  /**
   * Apply suggestion
   * @param {Suggestion} suggestion - Suggestion to apply
   * @returns {Promise<void>}
   */
  async applySuggestion(suggestion)
}

// Suggestion type
interface Suggestion {
  id: string;
  type: 'component' | 'template' | 'workflow';
  title: string;
  description: string;
  confidence: number;
  action: Function;
}
```

### Auto Completion

Intelligent field completion.

```javascript
class AutoCompletion {
  /**
   * Initialize auto-completion
   * @param {App} app - Obsidian app
   * @returns {Promise<void>}
   */
  async initialize(app)

  /**
   * Register custom completions
   * @param {string} context - Completion context
   * @param {string[]} completions - Completion values
   * @returns {void}
   */
  registerCompletions(context, completions)

  /**
   * Get completions for input
   * @param {string} input - User input
   * @param {string} context - Input context
   * @returns {Completion[]} Matching completions
   */
  getCompletions(input, context)
}
```

---

## 📡 Events & Hooks

### Event System

ProcessMetaLanguage uses an event-driven architecture:

```javascript
// Global event emitter
const events = ProcessMetaLanguage.events;

// Subscribe to events
events.on('object:created', (data) => {
  console.log('New object:', data.object);
});

events.on('state:changed', (data) => {
  console.log('State transition:', data.from, '->', data.to);
});

events.on('sync:complete', (data) => {
  console.log('Sync finished:', data.itemsSynced);
});

// Available events
const Events = {
  // Component events
  'object:created': 'New object created',
  'object:updated': 'Object modified',
  'object:deleted': 'Object removed',
  'state:created': 'New state created',
  'state:changed': 'State transition',
  'action:created': 'New action created',
  'action:executed': 'Action executed',
  
  // Sync events
  'sync:started': 'Sync operation started',
  'sync:progress': 'Sync progress update',
  'sync:complete': 'Sync finished',
  'sync:error': 'Sync error occurred',
  
  // Validation events
  'validation:started': 'Validation started',
  'validation:complete': 'Validation finished',
  'validation:error': 'Validation error',
  
  // Export events
  'export:started': 'Export started',
  'export:complete': 'Export finished',
  'export:error': 'Export error'
};
```

### Lifecycle Hooks

Register hooks for component lifecycle:

```javascript
// Before object creation
ProcessMetaLanguage.hooks.register('beforeObjectCreate', async (config) => {
  // Modify config or validate
  if (!config.metadata.gtin) {
    throw new Error('GTIN required');
  }
  return config;
});

// After state transition
ProcessMetaLanguage.hooks.register('afterStateTransition', async (result) => {
  // Log transition
  await logTransition(result);
});

// Available hooks
const Hooks = {
  // Component hooks
  'beforeObjectCreate': 'Before creating object',
  'afterObjectCreate': 'After object created',
  'beforeStateCreate': 'Before creating state',
  'afterStateCreate': 'After state created',
  'beforeActionExecute': 'Before executing action',
  'afterActionExecute': 'After action executed',
  
  // Validation hooks
  'beforeValidation': 'Before validation',
  'afterValidation': 'After validation',
  
  // Export hooks
  'beforeExport': 'Before export',
  'afterExport': 'After export'
};
```

---

## ⚠️ Error Handling

### Error Types

ProcessMetaLanguage defines specific error types:

```javascript
// Base error class
class ProcessMetaLanguageError extends Error {
  constructor(message, code, details) {
    super(message);
    this.code = code;
    this.details = details;
    this.timestamp = new Date();
  }
}

// Specific error types
class ValidationError extends ProcessMetaLanguageError {
  constructor(message, validationDetails) {
    super(message, 'VALIDATION_ERROR', validationDetails);
  }
}

class SyncError extends ProcessMetaLanguageError {
  constructor(message, syncDetails) {
    super(message, 'SYNC_ERROR', syncDetails);
  }
}

class ExportError extends ProcessMetaLanguageError {
  constructor(message, exportDetails) {
    super(message, 'EXPORT_ERROR', exportDetails);
  }
}
```

### Error Handling Patterns

```javascript
// Try-catch with specific handling
try {
  await ProcessMetaLanguage.workflowOrchestrator.createObject(config);
} catch (error) {
  if (error instanceof ValidationError) {
    // Handle validation error
    console.error('Validation failed:', error.details);
  } else if (error instanceof SyncError) {
    // Handle sync error
    await ProcessMetaLanguage.canvasSync.recover();
  } else {
    // Generic error
    console.error('Unexpected error:', error);
  }
}

// Promise error handling
ProcessMetaLanguage.exporter.exportToMarkdown()
  .then(markdown => {
    // Success
  })
  .catch(error => {
    if (error.code === 'EXPORT_TIMEOUT') {
      // Handle timeout
    }
  });
```

---

## 💻 Code Examples

### Example 1: Create Complete Workflow

```javascript
async function createOrderFulfillmentWorkflow() {
  const PML = window.ProcessMetaLanguage;
  const ea = PML.excalidrawAPI;
  
  // Create order object
  const order = await PML.components.createStandardObject(ea, {
    name: 'Order-2024-001',
    type: 'order',
    position: { x: 100, y: 100 },
    metadata: {
      customer: 'ACME Corp',
      items: 50,
      value: 5000
    }
  });
  
  // Add states
  const states = ['pending', 'picking', 'packing', 'shipped'];
  let previousState = null;
  
  for (const disposition of states) {
    const state = await PML.components.createStateForObject(ea, order.id, {
      disposition,
      previousState
    });
    
    // Auto-generate main action
    await PML.mainActionGenerator.generateForState(state.id);
    
    // Add business step action
    const businessStep = getBusinessStepForState(disposition);
    await PML.components.createActionForState(ea, state.id, {
      businessStep,
      isSecondary: true
    });
    
    previousState = state.id;
  }
  
  // Validate architecture
  const validation = await PML.validator.validateArchitecture();
  if (!validation.isValid) {
    throw new Error('Architecture validation failed');
  }
  
  // Export documentation
  const markdown = await PML.exporter.exportToMarkdown({
    includeDiagrams: true
  });
  
  return { order, markdown };
}
```

### Example 2: Real-time Monitoring

```javascript
function setupRealtimeMonitoring() {
  const PML = window.ProcessMetaLanguage;
  
  // Enable real-time sync
  PML.canvasSync.enableRealtimeSync({
    interval: 5000, // 5 seconds
    onChange: (changes) => {
      console.log(`${changes.length} changes detected`);
    }
  });
  
  // Monitor events
  PML.events.on('object:created', async (data) => {
    // Auto-suggest next steps
    const suggestions = await PML.suggestions.generateSuggestions({
      object: data.object,
      context: 'object_created'
    });
    
    if (suggestions.length > 0) {
      PML.ui.showSuggestions(suggestions);
    }
  });
  
  PML.events.on('validation:error', (data) => {
    // Show validation errors in UI
    PML.ui.showNotification({
      type: 'error',
      message: `Validation failed: ${data.errors[0].message}`,
      duration: 5000
    });
  });
  
  // Performance monitoring
  setInterval(() => {
    const status = PML.canvasSync.getSyncStatus();
    const metrics = {
      lastSync: status.lastSync,
      itemsInQueue: status.queue.length,
      syncTime: status.averageSyncTime
    };
    
    updateDashboard(metrics);
  }, 10000);
}
```

### Example 3: Custom Export Format

```javascript
async function exportToCustomFormat() {
  const PML = window.ProcessMetaLanguage;
  
  // Get process data
  const process = await PML.orchestrator.getProcessData();
  
  // Transform to custom format
  const customData = {
    metadata: {
      version: '1.0',
      created: new Date().toISOString(),
      generator: 'ProcessMetaLanguage'
    },
    entities: process.objects.map(obj => ({
      id: obj.id,
      type: obj.type,
      attributes: obj.metadata,
      states: obj.states.map(state => ({
        disposition: state.disposition,
        timestamp: state.timestamp,
        actions: state.actions
      }))
    })),
    relationships: extractRelationships(process),
    compliance: {
      epcis: await PML.validator.validateProcess(process),
      custom: await validateCustomRules(process)
    }
  };
  
  // Export options
  const options = {
    format: 'json',
    pretty: true,
    includeSchema: true
  };
  
  // Generate export
  const exported = JSON.stringify(customData, null, 2);
  
  // Save to file
  await PML.app.vault.create(
    `exports/custom-export-${Date.now()}.json`,
    exported
  );
  
  return exported;
}
```

---

## 📚 Additional Resources

### TypeScript Definitions

TypeScript definitions are available:

```typescript
import { 
  ProcessMetaLanguage,
  ProcessObject,
  ProcessState,
  ProcessAction,
  WorkflowOrchestrator,
  ValidationResult
} from 'processmetalanguage';
```

### API Versioning

The API follows semantic versioning:
- **Major**: Breaking changes
- **Minor**: New features, backward compatible
- **Patch**: Bug fixes

Check version:
```javascript
console.log(ProcessMetaLanguage.version); // "1.0.0"
```

### Performance Considerations

- Batch operations when creating multiple components
- Use incremental sync for large processes
- Enable caching for repeated operations
- Limit real-time sync frequency based on process size

### Support

- **API Documentation**: [docs.processmetalanguage.io/api](https://docs.processmetalanguage.io/api)
- **GitHub Issues**: [github.com/RollandMELET/ProcessMetaLanguage/issues](https://github.com/RollandMELET/ProcessMetaLanguage/issues)
- **Developer Forum**: [forum.processmetalanguage.io/dev](https://forum.processmetalanguage.io/dev)

---

*ProcessMetaLanguage API Reference v1.0.0*  
*Last updated: 2025-08-01*