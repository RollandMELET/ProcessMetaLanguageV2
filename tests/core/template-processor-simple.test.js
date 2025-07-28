// <!-- START OF FILE: template-processor-simple.test.js -->
// FILENAME: template-processor-simple.test.js
// Version: 1.0.0
// Date: 2025-07-28 10:15
// Author: Rolland MELET & Claude Code
// Description: Tests unitaires simplifiés TemplateProcessor - TASK-B001

import { describe, it, expect, beforeEach } from 'vitest';
import { TemplateProcessor, TEMPLATE_CONFIG } from '../../core/template-processor.js';

describe('TemplateProcessor - Tests Basiques', () => {
    let processor;
    
    beforeEach(() => {
        processor = new TemplateProcessor();
    });
    
    describe('Initialisation', () => {
        it('devrait initialiser correctement', () => {
            expect(processor).toBeDefined();
            expect(processor.config).toBeDefined();
            expect(processor.templateCache).toBeDefined();
        });
        
        it('devrait avoir configuration par défaut', () => {
            expect(processor.config.templateVersion).toBe('1.0.0');
            expect(processor.config.variablePattern).toBeDefined();
        });
    });
    
    describe('Parsing Frontmatter', () => {
        it('devrait parser frontmatter YAML valide', () => {
            const content = `---
title: "Test"
version: "1.0.0"
---
# Content here`;
            
            const result = processor.parseFrontmatter(content);
            
            expect(result.frontmatter.title).toBe('Test');
            expect(result.frontmatter.version).toBe('1.0.0');
            expect(result.body.trim()).toBe('# Content here');
        });
        
        it('devrait lever erreur pour frontmatter invalide', () => {
            const content = `No frontmatter here`;
            
            expect(() => processor.parseFrontmatter(content)).toThrow();
        });
    });
    
    describe('Extraction Variables', () => {
        it('devrait extraire variables {{VAR}}', () => {
            const content = 'Hello {{NAME}}, your ID is {{USER_ID}}';
            const variables = processor.extractVariables(content);
            
            expect(variables).toContain('NAME');
            expect(variables).toContain('USER_ID');
            expect(variables.length).toBe(2);
        });
        
        it('devrait retourner tableau vide sans variables', () => {
            const content = 'No variables here';
            const variables = processor.extractVariables(content);
            
            expect(variables).toEqual([]);
        });
    });
    
    describe('Remplacement Variables', () => {
        it('devrait remplacer variables simples', () => {
            const template = 'Hello {{NAME}}';
            const variables = { NAME: 'Rolland' };
            
            const result = processor.replaceVariables(template, variables);
            
            expect(result).toBe('Hello Rolland');
        });
        
        it('devrait conserver variables non trouvées', () => {
            const template = 'Hello {{MISSING}}';
            const variables = {};
            
            const result = processor.replaceVariables(template, variables);
            
            expect(result).toBe('Hello {{MISSING}}');
        });
    });
    
    describe('Préparation Variables Canvas', () => {
        it('devrait préparer variables depuis données canvas', () => {
            const canvasData = {
                uniqueId: 'obj_123',
                objectName: 'Test-Object',
                objectType: 'raw-material',
                position: { x: 100, y: 200 }
            };
            
            const variables = processor.prepareTemplateVariables(canvasData);
            
            expect(variables.OBJECT_ID).toBe('obj_123');
            expect(variables.OBJECT_NAME).toBe('Test-Object');
            expect(variables.OBJECT_TYPE).toBe('raw-material');
            expect(variables.X_COORDINATE).toBe(100);
            expect(variables.Y_COORDINATE).toBe(200);
        });
        
        it('devrait utiliser valeurs par défaut', () => {
            const canvasData = {};
            
            const variables = processor.prepareTemplateVariables(canvasData);
            
            expect(variables.OBJECT_ID).toBe('unknown');
            expect(variables.OBJECT_NAME).toBe('Unnamed Object');
            expect(variables.OBJECT_TYPE).toBe('custom');
        });
    });
    
    describe('Traitement Conditions', () => {
        it('devrait traiter condition vraie', () => {
            const template = '{{#if SHOW}}Visible{{/if}}';
            const variables = { SHOW: true };
            
            const result = processor.processConditionals(template, variables);
            
            expect(result).toBe('Visible');
        });
        
        it('devrait traiter condition fausse', () => {
            const template = '{{#if SHOW}}Hidden{{/if}}';
            const variables = { SHOW: false };
            
            const result = processor.processConditionals(template, variables);
            
            expect(result).toBe('');
        });
    });
    
    describe('Traitement Boucles', () => {
        it('devrait traiter boucle sur tableau', () => {
            const template = '{{#each ITEMS}}{{this}} {{/each}}';
            const variables = { ITEMS: ['A', 'B', 'C'] };
            
            const result = processor.processLoops(template, variables);
            
            expect(result).toBe('A B C ');
        });
        
        it('devrait retourner vide si pas tableau', () => {
            const template = '{{#each ITEMS}}{{this}}{{/each}}';
            const variables = { ITEMS: 'not array' };
            
            const result = processor.processLoops(template, variables);
            
            expect(result).toBe('');
        });
    });
    
    describe('Performance', () => {
        it('devrait traiter rapidement variables multiples', () => {
            const startTime = performance.now();
            
            const template = 'Name: {{NAME}}, Type: {{TYPE}}, ID: {{ID}}';
            const variables = {
                NAME: 'TestObject',
                TYPE: 'raw-material',
                ID: 'obj_123'
            };
            
            const result = processor.replaceVariables(template, variables);
            
            const endTime = performance.now();
            const executionTime = endTime - startTime;
            
            expect(result).toBe('Name: TestObject, Type: raw-material, ID: obj_123');
            expect(executionTime).toBeLessThan(10); // <10ms pour traitement simple
        });
    });
    
    describe('Statistiques', () => {
        it('devrait retourner statistiques initiales', () => {
            const stats = processor.getPerformanceStats();
            
            expect(stats.templatesGenerated).toBe(0);
            expect(stats.cacheSize).toBe(0);
            expect(stats.errors).toEqual([]);
        });
    });
    
    describe('Cache', () => {
        it('devrait vider cache correctement', () => {
            // Ajouter quelque chose au cache
            processor.templateCache.set('test', { data: 'test' });
            expect(processor.templateCache.size).toBe(1);
            
            processor.clearCache();
            expect(processor.templateCache.size).toBe(0);
        });
    });
});

// <!-- END OF FILE: template-processor-simple.test.js -->