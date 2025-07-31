// <!-- START OF FILE: template-manager.test.js -->
// FILENAME: template-manager.test.js
// Version: 1.0.0
// Date: 2025-07-30 10:30
// Author: Rolland MELET & Claude Code
// Description: Tests unitaires pour TemplateManager - TASK-B005

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import { TemplateManager } from '../../core/template-manager.js';

// Mock des modules
vi.mock('fs/promises');
vi.mock('../../core/template-processor.js');
vi.mock('../../core/epcis-validator.js');

describe('TemplateManager', () => {
    let manager;
    let mockFs;
    const testDir = '/test/templates';
    
    beforeEach(async () => {
        // Configuration test
        manager = new TemplateManager({
            templatesBaseDir: testDir,
            userTemplatesDir: path.join(testDir, 'user-templates'),
            versionsDir: path.join(testDir, '.versions'),
            backupsDir: path.join(testDir, '.backups')
        });
        
        // Mock fs
        mockFs = {
            mkdir: vi.fn().mockResolvedValue(undefined),
            writeFile: vi.fn().mockResolvedValue(undefined),
            readFile: vi.fn().mockResolvedValue('{}'),
            unlink: vi.fn().mockResolvedValue(undefined),
            readdir: vi.fn().mockResolvedValue([]),
            rm: vi.fn().mockResolvedValue(undefined),
            stat: vi.fn().mockResolvedValue({ mtime: new Date() }),
            access: vi.fn().mockResolvedValue(undefined)
        };
        
        Object.assign(fs, mockFs);
        
        // Initialiser manager
        await manager.initialize();
    });
    
    afterEach(() => {
        vi.clearAllMocks();
    });
    
    describe('Initialisation', () => {
        it('devrait créer les dossiers nécessaires', async () => {
            expect(mockFs.mkdir).toHaveBeenCalledWith(
                path.join(testDir, 'user-templates'),
                { recursive: true }
            );
            expect(mockFs.mkdir).toHaveBeenCalledWith(
                path.join(testDir, '.versions'),
                { recursive: true }
            );
            expect(mockFs.mkdir).toHaveBeenCalledWith(
                path.join(testDir, '.backups'),
                { recursive: true }
            );
        });
        
        it('devrait charger le registry des templates', async () => {
            const mockRegistry = {
                'tpl_test_001': { name: 'Test Template', type: 'object' }
            };
            
            mockFs.readFile.mockResolvedValueOnce(JSON.stringify(mockRegistry));
            
            await manager.loadTemplateRegistry();
            
            expect(mockFs.readFile).toHaveBeenCalledWith(
                path.join(testDir, '.registry.json'),
                'utf-8'
            );
        });
    });
    
    describe('MODE 1: Création from scratch', () => {
        const newTemplateData = {
            name: 'Custom Process Template',
            type: 'object',
            category: 'custom',
            description: 'Template personnalisé pour processus spécifique',
            author: 'test-user',
            tags: ['process', 'custom'],
            frontmatter: {
                custom_field: 'value'
            },
            body: '# Custom Template\n\nContent here...'
        };
        
        it('devrait créer un nouveau template from scratch', async () => {
            const result = await manager.createFromScratch(newTemplateData);
            
            expect(result.success).toBe(true);
            expect(result.template).toBeDefined();
            expect(result.template.name).toBe(newTemplateData.name);
            expect(result.template.version).toBe('1.0.0');
            expect(result.template.metadata.source).toBe('scratch');
        });
        
        it('devrait valider les données du template', async () => {
            const invalidData = {
                // name manquant
                type: 'object'
            };
            
            await expect(manager.createFromScratch(invalidData))
                .rejects.toThrow('Nom de template invalide');
        });
        
        it('devrait créer une version initiale', async () => {
            await manager.createFromScratch(newTemplateData);
            
            // Vérifier création fichier version
            expect(mockFs.writeFile).toHaveBeenCalledWith(
                expect.stringContaining('v1.0.0.json'),
                expect.stringContaining('"version":"1.0.0"')
            );
        });
        
        it('devrait sauvegarder dans le registry', async () => {
            await manager.createFromScratch(newTemplateData);
            
            expect(mockFs.writeFile).toHaveBeenCalledWith(
                path.join(testDir, '.registry.json'),
                expect.any(String)
            );
        });
        
        it('devrait utiliser le body par défaut si non fourni', async () => {
            const dataWithoutBody = { ...newTemplateData };
            delete dataWithoutBody.body;
            
            const result = await manager.createFromScratch(dataWithoutBody);
            
            expect(result.template.body).toContain('# Object:');
            expect(result.template.body).toContain('{{OBJECT_NAME}}');
        });
    });
    
    describe('MODE 2: Duplication de template', () => {
        const sourceTemplate = {
            id: 'tpl_source_001',
            name: 'Source Template',
            type: 'object',
            category: 'epcis',
            version: '2.1.0',
            author: 'original-author',
            permissions: { read: true, write: true, delete: false },
            metadata: {
                tags: ['source', 'original'],
                custom: 'value'
            },
            frontmatter: {
                field1: 'value1'
            },
            body: '# Source Content'
        };
        
        beforeEach(() => {
            // Ajouter template source au registry
            manager.templateRegistry.set(sourceTemplate.id, sourceTemplate);
        });
        
        it('devrait dupliquer un template existant', async () => {
            const modifications = {
                name: 'Duplicated Template',
                description: 'Version personnalisée'
            };
            
            const result = await manager.duplicateTemplate(sourceTemplate.id, modifications);
            
            expect(result.success).toBe(true);
            expect(result.template.name).toBe(modifications.name);
            expect(result.template.version).toBe('1.0.0'); // Reset version
            expect(result.template.metadata.source).toBe('duplication');
            expect(result.template.metadata.parentTemplate).toBe(sourceTemplate.id);
        });
        
        it('devrait conserver le contenu source si non modifié', async () => {
            const result = await manager.duplicateTemplate(sourceTemplate.id);
            
            expect(result.template.body).toBe(sourceTemplate.body);
            expect(result.template.frontmatter.field1).toBe('value1');
        });
        
        it('devrait appliquer les modifications fournies', async () => {
            const modifications = {
                type: 'state',
                category: 'custom',
                body: '# Modified Content',
                frontmatter: {
                    field2: 'value2'
                }
            };
            
            const result = await manager.duplicateTemplate(sourceTemplate.id, modifications);
            
            expect(result.template.type).toBe('state');
            expect(result.template.category).toBe('custom');
            expect(result.template.body).toBe(modifications.body);
            expect(result.template.frontmatter.field2).toBe('value2');
        });
        
        it('devrait générer un nom par défaut si non fourni', async () => {
            const result = await manager.duplicateTemplate(sourceTemplate.id);
            
            expect(result.template.name).toBe('Source Template (Copy)');
        });
        
        it('devrait échouer si template source introuvable', async () => {
            await expect(manager.duplicateTemplate('invalid_id'))
                .rejects.toThrow('Template source \'invalid_id\' introuvable');
        });
        
        it('devrait vérifier les permissions de lecture', async () => {
            sourceTemplate.permissions.read = false;
            
            await expect(manager.duplicateTemplate(sourceTemplate.id))
                .rejects.toThrow('Permissions insuffisantes');
        });
    });
    
    describe('MODE 3: Héritage de template', () => {
        const parentTemplate = {
            id: 'tpl_parent_001',
            name: 'Parent Template',
            type: 'workflow',
            category: 'epcis',
            version: '1.5.0',
            permissions: { read: true, write: true },
            metadata: {
                noInheritance: false,
                tags: ['parent', 'base']
            },
            frontmatter: {
                base_field: 'base_value',
                override_field: 'parent_value'
            },
            body: '# Parent Content\n\n## Section 1\nParent section content'
        };
        
        beforeEach(() => {
            manager.templateRegistry.set(parentTemplate.id, parentTemplate);
        });
        
        it('devrait créer un template par héritage', async () => {
            const childData = {
                name: 'Child Template',
                description: 'Extension du template parent',
                extensions: {
                    additionalSteps: ['step1', 'step2']
                }
            };
            
            const result = await manager.inheritTemplate(parentTemplate.id, childData);
            
            expect(result.success).toBe(true);
            expect(result.template.name).toBe(childData.name);
            expect(result.template.metadata.source).toBe('inheritance');
            expect(result.template.metadata.parentTemplate).toBe(parentTemplate.id);
            expect(result.template.metadata.inheritance).toBeDefined();
        });
        
        it('devrait fusionner le frontmatter hérité', async () => {
            const childData = {
                name: 'Child Template',
                frontmatter: {
                    override_field: 'child_value',
                    new_field: 'new_value'
                }
            };
            
            const result = await manager.inheritTemplate(parentTemplate.id, childData);
            
            expect(result.template.frontmatter.base_field).toBe('base_value');
            expect(result.template.frontmatter.override_field).toBe('child_value');
            expect(result.template.frontmatter.new_field).toBe('new_value');
        });
        
        it('devrait gérer l\'extension du body', async () => {
            const childData = {
                name: 'Child Template',
                body: '{{PARENT_CONTENT}}\n\n## Additional Section\nChild content'
            };
            
            const result = await manager.inheritTemplate(parentTemplate.id, childData);
            
            expect(result.template.body).toContain('# Parent Content');
            expect(result.template.body).toContain('## Additional Section');
        });
        
        it('devrait appliquer les overrides', async () => {
            const childData = {
                name: 'Child Template',
                overrides: {
                    frontmatter: {
                        base_field: 'overridden'
                    }
                }
            };
            
            const result = await manager.inheritTemplate(parentTemplate.id, childData);
            
            expect(result.template.frontmatter.base_field).toBe('overridden');
        });
        
        it('devrait échouer si parent interdit l\'héritage', async () => {
            parentTemplate.metadata.noInheritance = true;
            
            await expect(manager.inheritTemplate(parentTemplate.id, { name: 'Child' }))
                .rejects.toThrow('ne permet pas l\'héritage');
        });
        
        it('devrait enregistrer la relation parent-enfant', async () => {
            await manager.inheritTemplate(parentTemplate.id, { name: 'Child' });
            
            expect(mockFs.writeFile).toHaveBeenCalledWith(
                path.join(testDir, '.inheritance.json'),
                expect.stringContaining(parentTemplate.id)
            );
        });
        
        it('devrait retourner la chaîne d\'héritage', async () => {
            const result = await manager.inheritTemplate(parentTemplate.id, { name: 'Child' });
            
            expect(result.inheritanceChain).toBeDefined();
            expect(result.inheritanceChain.length).toBeGreaterThan(0);
        });
    });
    
    describe('Système de versioning', () => {
        const template = {
            id: 'tpl_version_test',
            name: 'Version Test Template',
            version: '1.0.0'
        };
        
        it('devrait créer une nouvelle version', async () => {
            const result = await manager.createVersion(template, '1.1.0', 'Minor update');
            
            expect(result.success).toBe(true);
            expect(result.version).toBe('1.1.0');
            expect(mockFs.writeFile).toHaveBeenCalledWith(
                expect.stringContaining('v1.1.0.json'),
                expect.stringContaining('"changeLog":"Minor update"')
            );
        });
        
        it('devrait valider le format de version semver', async () => {
            await expect(manager.createVersion(template, '1.a.0', 'Invalid'))
                .rejects.toThrow('Format de version invalide');
        });
        
        it('devrait empêcher les versions dupliquées', async () => {
            manager.versionCache.set(template.id, [{ version: '1.1.0' }]);
            
            await expect(manager.createVersion(template, '1.1.0', 'Duplicate'))
                .rejects.toThrow('version 1.1.0 existe déjà');
        });
        
        it('devrait calculer le checksum du template', async () => {
            await manager.createVersion(template, '1.1.0', 'Update');
            
            const writtenContent = mockFs.writeFile.mock.calls[0][1];
            const versionData = JSON.parse(writtenContent);
            
            expect(versionData.checksum).toBeDefined();
            expect(versionData.checksum).toHaveLength(64); // SHA256 hex
        });
        
        it('devrait nettoyer les anciennes versions si limite dépassée', async () => {
            manager.config.maxVersionsPerTemplate = 2;
            mockFs.readdir.mockResolvedValue(['v1.0.0.json', 'v1.1.0.json', 'v1.2.0.json']);
            
            await manager.cleanOldVersions(template.id);
            
            expect(mockFs.unlink).toHaveBeenCalledWith(
                expect.stringContaining('v1.0.0.json')
            );
        });
    });
    
    describe('Restauration de version', () => {
        const templateId = 'tpl_restore_test';
        const versionData = {
            version: '1.2.0',
            snapshot: {
                id: templateId,
                name: 'Restored Template',
                version: '1.2.0',
                body: 'Version 1.2.0 content'
            }
        };
        
        it('devrait restaurer une version spécifique', async () => {
            mockFs.readFile.mockResolvedValueOnce(JSON.stringify(versionData));
            
            const result = await manager.restoreVersion(templateId, '1.2.0');
            
            expect(result.success).toBe(true);
            expect(result.template.body).toBe('Version 1.2.0 content');
            expect(result.restoredVersion).toBe('1.2.0');
        });
        
        it('devrait créer un backup avant restauration', async () => {
            const currentTemplate = { id: templateId, name: 'Current' };
            manager.templateRegistry.set(templateId, currentTemplate);
            
            mockFs.readFile.mockResolvedValueOnce(JSON.stringify(versionData));
            
            await manager.restoreVersion(templateId, '1.2.0');
            
            expect(mockFs.writeFile).toHaveBeenCalledWith(
                expect.stringContaining('.backups'),
                expect.stringContaining('before_restore')
            );
        });
    });
    
    describe('Mise à jour de template', () => {
        const template = {
            id: 'tpl_update_test',
            name: 'Update Test',
            version: '1.0.0',
            permissions: { write: true },
            metadata: {},
            frontmatter: { field: 'value' },
            body: 'Original content'
        };
        
        beforeEach(() => {
            manager.templateRegistry.set(template.id, template);
        });
        
        it('devrait mettre à jour un template existant', async () => {
            const updates = {
                description: 'Updated description',
                body: 'Updated content',
                metadata: { updated: true }
            };
            
            const result = await manager.updateTemplate(template.id, updates, 'Test update');
            
            expect(result.success).toBe(true);
            expect(result.template.description).toBe(updates.description);
            expect(result.template.body).toBe(updates.body);
            expect(result.newVersion).toBe('1.0.1');
        });
        
        it('devrait vérifier les permissions d\'écriture', async () => {
            template.permissions.write = false;
            
            await expect(manager.updateTemplate(template.id, {}, 'Update'))
                .rejects.toThrow('Permissions insuffisantes');
        });
        
        it('devrait empêcher la mise à jour d\'un template verrouillé', async () => {
            manager.lockedTemplates.add(template.id);
            
            await expect(manager.updateTemplate(template.id, {}, 'Update'))
                .rejects.toThrow('est verrouillé');
        });
        
        it('devrait créer des versions avant et après update', async () => {
            await manager.updateTemplate(template.id, { body: 'New' }, 'Update');
            
            // Vérifier création de 2 versions
            const versionCalls = mockFs.writeFile.mock.calls
                .filter(call => call[0].includes('.versions'));
            
            expect(versionCalls.length).toBeGreaterThanOrEqual(2);
        });
        
        it('devrait propager les changements aux templates enfants', async () => {
            mockFs.readFile.mockResolvedValueOnce(JSON.stringify({
                [template.id]: ['child_001']
            }));
            
            const childTemplate = {
                id: 'child_001',
                metadata: { inheritance: { parent: { id: template.id } } }
            };
            manager.templateRegistry.set('child_001', childTemplate);
            
            await manager.updateTemplate(template.id, { body: 'Updated' }, 'Update');
            
            // La propagation devrait être appelée
            expect(manager.templateRegistry.get('child_001')).toBeDefined();
        });
    });
    
    describe('Suppression de template', () => {
        const template = {
            id: 'tpl_delete_test',
            name: 'Delete Test',
            permissions: { delete: true }
        };
        
        beforeEach(() => {
            manager.templateRegistry.set(template.id, template);
        });
        
        it('devrait supprimer un template', async () => {
            const result = await manager.deleteTemplate(template.id);
            
            expect(result.success).toBe(true);
            expect(mockFs.unlink).toHaveBeenCalled();
            expect(manager.templateRegistry.has(template.id)).toBe(false);
        });
        
        it('devrait vérifier les permissions de suppression', async () => {
            template.permissions.delete = false;
            
            await expect(manager.deleteTemplate(template.id))
                .rejects.toThrow('Permissions insuffisantes');
        });
        
        it('devrait empêcher suppression si templates enfants', async () => {
            mockFs.readFile.mockResolvedValueOnce(JSON.stringify({
                [template.id]: ['child_001']
            }));
            
            await expect(manager.deleteTemplate(template.id))
                .rejects.toThrow('templates enfants');
        });
        
        it('devrait forcer suppression avec flag force', async () => {
            mockFs.readFile.mockResolvedValueOnce(JSON.stringify({
                [template.id]: ['child_001']
            }));
            
            const result = await manager.deleteTemplate(template.id, true);
            
            expect(result.success).toBe(true);
        });
        
        it('devrait créer un backup avant suppression', async () => {
            await manager.deleteTemplate(template.id);
            
            expect(mockFs.writeFile).toHaveBeenCalledWith(
                expect.stringContaining('.backups'),
                expect.stringContaining('before_deletion')
            );
        });
        
        it('devrait supprimer les versions associées', async () => {
            await manager.deleteTemplate(template.id);
            
            expect(mockFs.rm).toHaveBeenCalledWith(
                path.join(testDir, '.versions', template.id),
                { recursive: true }
            );
        });
    });
    
    describe('Recherche de templates', () => {
        beforeEach(() => {
            // Ajouter plusieurs templates pour tests recherche
            const templates = [
                {
                    id: 'tpl_001',
                    name: 'Process Template',
                    type: 'object',
                    category: 'epcis',
                    author: 'user1',
                    created: '2025-01-01',
                    metadata: { tags: ['process', 'epcis'] }
                },
                {
                    id: 'tpl_002',
                    name: 'State Template',
                    type: 'state',
                    category: 'custom',
                    author: 'user2',
                    created: '2025-01-02',
                    metadata: { tags: ['state', 'custom'] }
                },
                {
                    id: 'tpl_003',
                    name: 'Action Process',
                    type: 'action',
                    category: 'epcis',
                    author: 'user1',
                    created: '2025-01-03',
                    metadata: { tags: ['action', 'process'] }
                }
            ];
            
            templates.forEach(t => manager.templateRegistry.set(t.id, t));
        });
        
        it('devrait rechercher par type', async () => {
            const results = await manager.searchTemplates({ type: 'object' });
            
            expect(results).toHaveLength(1);
            expect(results[0].type).toBe('object');
        });
        
        it('devrait rechercher par catégorie', async () => {
            const results = await manager.searchTemplates({ category: 'epcis' });
            
            expect(results).toHaveLength(2);
            expect(results.every(r => r.category === 'epcis')).toBe(true);
        });
        
        it('devrait rechercher par texte', async () => {
            const results = await manager.searchTemplates({ search: 'process' });
            
            expect(results).toHaveLength(2);
            expect(results.every(r => 
                r.name.toLowerCase().includes('process') ||
                r.metadata.tags.includes('process')
            )).toBe(true);
        });
        
        it('devrait rechercher par tags', async () => {
            const results = await manager.searchTemplates({ tags: ['process'] });
            
            expect(results).toHaveLength(2);
        });
        
        it('devrait trier les résultats', async () => {
            const results = await manager.searchTemplates({ sortBy: 'created' });
            
            expect(results[0].id).toBe('tpl_003'); // Plus récent
            expect(results[2].id).toBe('tpl_001'); // Plus ancien
        });
        
        it('devrait paginer les résultats', async () => {
            const results = await manager.searchTemplates({ 
                limit: 2, 
                offset: 1 
            });
            
            expect(results).toHaveLength(2);
            expect(results[0].id).toBe('tpl_002');
        });
    });
    
    describe('Import/Export', () => {
        const templateToExport = {
            id: 'tpl_export_test',
            name: 'Export Test',
            type: 'object',
            metadata: {}
        };
        
        beforeEach(() => {
            manager.templateRegistry.set(templateToExport.id, templateToExport);
        });
        
        it('devrait exporter un template en JSON', async () => {
            const exported = await manager.exportTemplate(templateToExport.id, 'json');
            
            expect(exported.template).toEqual(templateToExport);
            expect(exported.metadata.format).toBe('json');
            expect(exported.metadata.exportDate).toBeDefined();
        });
        
        it('devrait inclure l\'historique des versions', async () => {
            const mockVersions = [
                { version: '1.0.0', created: '2025-01-01' },
                { version: '1.1.0', created: '2025-01-02' }
            ];
            
            mockFs.readdir.mockResolvedValueOnce(['v1.0.0.json', 'v1.1.0.json']);
            mockFs.readFile
                .mockResolvedValueOnce(JSON.stringify(mockVersions[0]))
                .mockResolvedValueOnce(JSON.stringify(mockVersions[1]));
            
            const exported = await manager.exportTemplate(templateToExport.id, 'json');
            
            expect(exported.versions).toHaveLength(2);
        });
        
        it('devrait importer un template', async () => {
            const importData = {
                template: {
                    name: 'Imported Template',
                    type: 'state',
                    category: 'custom',
                    metadata: {}
                }
            };
            
            const result = await manager.importTemplate(importData);
            
            expect(result.success).toBe(true);
            expect(result.template.name).toBe('Imported Template');
            expect(result.template.metadata.imported).toBeDefined();
        });
        
        it('devrait gérer les conflits de noms à l\'import', async () => {
            manager.templateRegistry.set('existing', { name: 'Existing Template' });
            
            const importData = {
                template: { name: 'Existing Template' }
            };
            
            await expect(manager.importTemplate(importData))
                .rejects.toThrow('existe déjà');
        });
        
        it('devrait permettre l\'écrasement avec option', async () => {
            const existing = { id: 'existing', name: 'Existing Template' };
            manager.templateRegistry.set('existing', existing);
            
            const importData = {
                template: { name: 'Existing Template', type: 'new' }
            };
            
            const result = await manager.importTemplate(importData, { overwrite: true });
            
            expect(result.success).toBe(true);
        });
    });
    
    describe('Utilitaires', () => {
        describe('Validation version semver', () => {
            it('devrait valider versions correctes', () => {
                expect(manager.isValidVersion('1.0.0')).toBe(true);
                expect(manager.isValidVersion('2.1.3')).toBe(true);
                expect(manager.isValidVersion('1.0.0-alpha')).toBe(true);
                expect(manager.isValidVersion('1.0.0+build123')).toBe(true);
            });
            
            it('devrait rejeter versions incorrectes', () => {
                expect(manager.isValidVersion('1.0')).toBe(false);
                expect(manager.isValidVersion('v1.0.0')).toBe(false);
                expect(manager.isValidVersion('1.a.0')).toBe(false);
            });
        });
        
        describe('Comparaison versions', () => {
            it('devrait comparer correctement les versions', () => {
                expect(manager.compareVersions('2.0.0', '1.0.0')).toBe(1);
                expect(manager.compareVersions('1.0.0', '2.0.0')).toBe(-1);
                expect(manager.compareVersions('1.0.0', '1.0.0')).toBe(0);
                expect(manager.compareVersions('1.2.0', '1.1.0')).toBe(1);
                expect(manager.compareVersions('1.0.2', '1.0.1')).toBe(1);
            });
        });
        
        describe('Incrémentation version', () => {
            it('devrait incrémenter version patch', () => {
                expect(manager.incrementVersion('1.0.0')).toBe('1.0.1');
            });
            
            it('devrait incrémenter version minor', () => {
                expect(manager.incrementVersion('1.0.5', 'minor')).toBe('1.1.0');
            });
            
            it('devrait incrémenter version major', () => {
                expect(manager.incrementVersion('1.2.3', 'major')).toBe('2.0.0');
            });
        });
        
        describe('Différences objets', () => {
            it('devrait calculer diff entre objets', () => {
                const obj1 = { a: 1, b: 2, c: 3 };
                const obj2 = { a: 1, b: 3, d: 4 };
                
                const diff = manager.diffObjects(obj1, obj2);
                
                expect(diff.added).toEqual({ d: 4 });
                expect(diff.removed).toEqual({ c: 3 });
                expect(diff.modified).toEqual({ b: { old: 2, new: 3 } });
            });
        });
    });
    
    describe('Gestion des erreurs', () => {
        it('devrait gérer erreur lecture fichier', async () => {
            mockFs.readFile.mockRejectedValueOnce(new Error('File not found'));
            
            await expect(manager.restoreVersion('invalid', '1.0.0'))
                .rejects.toThrow();
        });
        
        it('devrait gérer erreur écriture fichier', async () => {
            mockFs.writeFile.mockRejectedValueOnce(new Error('Disk full'));
            
            await expect(manager.createFromScratch({ name: 'Test' }))
                .rejects.toThrow();
        });
        
        it('devrait déverrouiller template en cas d\'erreur', async () => {
            const templateId = 'tpl_lock_test';
            manager.templateRegistry.set(templateId, { 
                id: templateId,
                permissions: { write: true }
            });
            
            mockFs.writeFile.mockRejectedValueOnce(new Error('Error'));
            
            try {
                await manager.updateTemplate(templateId, {}, 'Update');
            } catch (error) {
                // Erreur attendue
            }
            
            expect(manager.lockedTemplates.has(templateId)).toBe(false);
        });
    });
});

// <!-- END OF FILE: template-manager.test.js -->