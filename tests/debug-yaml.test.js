// Test de débogage YAML
import { describe, it, expect } from 'vitest';
import { TemplateProcessor } from '../core/template-processor.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

describe('Debug YAML Generation', () => {
    it('devrait générer YAML avec guillemets', async () => {
        const tempDir = path.join(os.tmpdir(), `debug-${Date.now()}`);
        const templatesDir = path.join(tempDir, 'templates');
        
        await fs.mkdir(templatesDir, { recursive: true });
        
        // Template complet avec champs requis
        const template = `---
object_id: "{{OBJECT_ID}}"
object_name: "{{OBJECT_NAME}}"
object_type: "{{OBJECT_TYPE}}"
created_at: "{{CREATED_AT}}"
position:
  x: {{X_COORDINATE}}
  y: {{Y_COORDINATE}}
sync_status: "{{SYNC_STATUS}}"
---
# {{OBJECT_NAME}}`;
        
        await fs.writeFile(path.join(templatesDir, 'debug.md'), template);
        
        const processor = new TemplateProcessor({
            templatesDir,
            outputDir: tempDir
        });
        
        const canvasData = {
            uniqueId: 'test_123',
            objectName: 'Test Object',
            objectType: 'raw-material'
        };
        
        const outputPath = path.join(tempDir, 'debug-output.md');
        
        await processor.generateFromCanvas(canvasData, 'debug', outputPath);
        
        const content = await fs.readFile(outputPath, 'utf-8');
        console.log('Generated content:');
        console.log(content);
        
        expect(content).toContain('object_id: "test_123"');
        expect(content).toContain('object_name: "Test Object"');
        expect(content).toContain('object_type: "raw-material"');
        
        // Cleanup
        await fs.rm(tempDir, { recursive: true, force: true });
    });
});