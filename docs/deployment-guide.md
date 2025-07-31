# ProcessMetaLanguage Deployment Guide

**Version:** 1.0.0  
**Date:** 2025-08-01  
**Author:** Rolland MELET & Claude Code  

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation Guide](#installation-guide)
3. [Configuration](#configuration)
4. [Deployment Options](#deployment-options)
5. [Production Setup](#production-setup)
6. [Monitoring & Maintenance](#monitoring--maintenance)
7. [Troubleshooting](#troubleshooting)
8. [Security Checklist](#security-checklist)
9. [Backup & Recovery](#backup--recovery)
10. [Performance Tuning](#performance-tuning)

---

## 🔧 Prerequisites

### System Requirements

#### Minimum Requirements
- **OS**: Windows 10+, macOS 10.15+, Linux (Ubuntu 20.04+)
- **RAM**: 4GB
- **Storage**: 500MB free space
- **Display**: 1920x1080 resolution
- **Network**: Stable internet connection

#### Recommended Requirements
- **OS**: Latest stable version
- **RAM**: 8GB+
- **Storage**: 2GB free space
- **Display**: 2560x1440 or higher
- **Network**: High-speed connection for sync

### Software Dependencies

#### Required
- **Obsidian**: v1.4.16 or higher
- **Node.js**: v16.0.0 or higher (for development)
- **Git**: v2.30.0 or higher

#### Obsidian Plugins
- **Excalidraw**: v2.0.0+ (with ExcalidrawAutomate enabled)
- **Templater**: v2.0.0+

### Pre-Installation Checklist

```bash
# Check Node.js version
node --version  # Should be >= 16.0.0

# Check npm version
npm --version   # Should be >= 7.0.0

# Check Git version
git --version   # Should be >= 2.30.0

# Check Obsidian version
# Open Obsidian → Settings → About
```

---

## 🚀 Installation Guide

### Step 1: Install Obsidian

#### Windows
```powershell
# Using Chocolatey
choco install obsidian

# Or download from
# https://obsidian.md/download
```

#### macOS
```bash
# Using Homebrew
brew install --cask obsidian

# Or download from
# https://obsidian.md/download
```

#### Linux
```bash
# Ubuntu/Debian
wget https://github.com/obsidianmd/obsidian-releases/releases/download/v1.4.16/obsidian_1.4.16_amd64.deb
sudo dpkg -i obsidian_1.4.16_amd64.deb

# Fedora
wget https://github.com/obsidianmd/obsidian-releases/releases/download/v1.4.16/obsidian-1.4.16.x86_64.rpm
sudo rpm -i obsidian-1.4.16.x86_64.rpm
```

### Step 2: Create Obsidian Vault

1. Open Obsidian
2. Click "Create new vault"
3. Name: "ProcessMetaLanguage" (or your preference)
4. Location: Choose accessible directory
5. Click "Create"

### Step 3: Install Required Plugins

#### Via Obsidian Community Plugins
1. Open Settings (⚙️) → Community plugins
2. Turn off "Restricted mode"
3. Click "Browse" and search for:
   - **Excalidraw** by Zsolt Viczian
   - **Templater** by SilentVoid13
4. Install and enable both plugins

#### Configure Excalidraw
```yaml
# Settings → Excalidraw
- Enable "ExcalidrawAutomate"
- Script Engine: "Enabled"
- Default save location: "drawings/"
- Compress files: "Yes"
- Auto-export SVG: "Yes"
- Auto-export PNG: "No"
```

#### Configure Templater
```yaml
# Settings → Templater
- Template folder: "templates/"
- Enable "Trigger on new file creation"
- Enable "Enable system commands"
- Timeout: 5 seconds
```

### Step 4: Install ProcessMetaLanguage

#### Option A: Git Clone (Recommended)
```bash
# Navigate to your vault
cd /path/to/your/obsidian/vault

# Clone the repository
git clone https://github.com/RollandMELET/ProcessMetaLanguage.git .

# Install dependencies
npm install
```

#### Option B: Download Release
```bash
# Download latest release
wget https://github.com/RollandMELET/ProcessMetaLanguage/releases/latest/download/ProcessMetaLanguage.zip

# Extract to vault
unzip ProcessMetaLanguage.zip -d /path/to/your/obsidian/vault

# Install dependencies
cd /path/to/your/obsidian/vault
npm install
```

### Step 5: Initialize ProcessMetaLanguage

1. Restart Obsidian
2. Open Command Palette (Ctrl/Cmd + P)
3. Run: "ProcessMetaLanguage: Initialize"
4. Verify toolbar appears in Excalidraw

### Step 6: Verify Installation

```javascript
// Open Obsidian Console (Ctrl+Shift+I)
// Run verification script
ProcessMetaLanguage.verify();

// Expected output:
// ✅ ExcalidrawAutomate: Available
// ✅ Templater: Configured
// ✅ Templates: 66 loaded (41 steps + 25 dispositions)
// ✅ Core modules: Initialized
// ✅ Sync engine: Ready
// ✅ Export modules: Available
```

---

## ⚙️ Configuration

### Project Configuration

Create `config/project-config.yaml`:

```yaml
# ProcessMetaLanguage Configuration
project:
  name: "My Traceability Process"
  version: "1.0.0"
  description: "Industrial traceability implementation"
  author: "Your Name"
  company: "Your Company"

# Architecture settings
architecture:
  type: "two-level-actions"
  validation: "strict"
  auto_sync: true
  sync_interval: 5000  # milliseconds

# Object types configuration
object_types:
  - id: "raw_material"
    name: "Raw Material"
    color: "#E3F2FD"
    icon: "📦"
    template: "epcis_raw_material"
  
  - id: "product"
    name: "Product"
    color: "#E8F5E9"
    icon: "📱"
    template: "epcis_product"
  
  - id: "batch"
    name: "Batch"
    color: "#FFF3E0"
    icon: "🏭"
    template: "epcis_batch"

# EPCIS settings
epcis:
  version: "2.0"
  validation_level: "strict"
  namespace: "https://your-company.com/epcis"
  enable_extensions: true

# Export settings
export:
  output_dir: "./exports"
  formats:
    markdown: true
    openapi: true
    smartconnect: true
    pdf: false
  
  markdown_options:
    include_toc: true
    include_diagrams: true
    mermaid_enabled: true
  
  openapi_options:
    version: "3.0.0"
    servers:
      - url: "https://api.your-company.com/v1"
        description: "Production API"
      - url: "https://staging-api.your-company.com/v1"
        description: "Staging API"

# UI settings
ui:
  theme: "default"
  language: "en"
  show_hints: true
  auto_complete: true
  toolbar_position: "right"

# Performance settings
performance:
  max_canvas_items: 500
  batch_sync_size: 50
  cache_enabled: true
  cache_ttl: 3600  # seconds

# Integration settings
integrations:
  smartconnect:
    enabled: true
    api_key: "${SMARTCONNECT_API_KEY}"
    endpoint: "https://api.360smartconnect.com/v2"
  
  github:
    enabled: true
    auto_backup: true
    branch: "main"
```

### Environment Variables

Create `.env` file:

```bash
# API Keys (DO NOT COMMIT)
SMARTCONNECT_API_KEY=your_api_key_here
GITHUB_TOKEN=your_github_token_here

# Paths
OBSIDIAN_VAULT_PATH=/path/to/vault
EXPORT_OUTPUT_DIR=./exports
BACKUP_DIR=./backups

# Features
EXCALIDRAW_API_ENABLED=true
EPCIS_VALIDATION_LEVEL=strict
AUTO_SYNC_ENABLED=true
DEBUG_MODE=false

# Performance
MAX_WORKERS=4
CACHE_SIZE_MB=100
```

### Security Configuration

Create `config/security.yaml`:

```yaml
# Security Configuration
security:
  # Input validation
  input_validation:
    enabled: true
    sanitize_html: true
    max_input_length: 10000
    allowed_file_types: ['.md', '.excalidraw', '.yaml', '.json']
  
  # File system
  filesystem:
    restrict_paths: true
    allowed_paths:
      - "./templates"
      - "./exports"
      - "./drawings"
    max_file_size_mb: 10
  
  # API security
  api:
    rate_limiting:
      enabled: true
      max_requests_per_minute: 100
    cors:
      enabled: true
      allowed_origins:
        - "https://your-domain.com"
    authentication:
      type: "bearer"
      token_expiry: 3600
  
  # Audit logging
  audit:
    enabled: true
    log_level: "info"
    retention_days: 90
    sensitive_data_masking: true
```

---

## 🌐 Deployment Options

### Option 1: Standalone Desktop

**Best for**: Individual users, small teams

```bash
# Install script for desktop
#!/bin/bash
echo "Installing ProcessMetaLanguage Desktop..."

# Create application directory
mkdir -p ~/ProcessMetaLanguage
cd ~/ProcessMetaLanguage

# Download and setup
git clone https://github.com/RollandMELET/ProcessMetaLanguage.git .
npm install --production

# Create desktop shortcut
cat > ~/Desktop/ProcessMetaLanguage.desktop << EOF
[Desktop Entry]
Name=ProcessMetaLanguage
Exec=obsidian --vault=~/ProcessMetaLanguage
Icon=~/ProcessMetaLanguage/assets/icon.png
Type=Application
Categories=Office;
EOF

chmod +x ~/Desktop/ProcessMetaLanguage.desktop
echo "✅ Installation complete!"
```

### Option 2: Team Server

**Best for**: Teams, shared workflows

```yaml
# docker-compose.yml
version: '3.8'

services:
  processmetalanguage:
    build: .
    container_name: processmetalanguage
    ports:
      - "3000:3000"
    volumes:
      - vault_data:/app/vault
      - ./config:/app/config
    environment:
      - NODE_ENV=production
      - VAULT_PATH=/app/vault
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  nginx:
    image: nginx:alpine
    container_name: pml_nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - processmetalanguage

volumes:
  vault_data:
```

### Option 3: Cloud Deployment

**Best for**: Enterprise, scalability

#### AWS Deployment
```bash
# CloudFormation template
AWSTemplateFormatVersion: '2010-09-09'
Description: 'ProcessMetaLanguage AWS Deployment'

Resources:
  EC2Instance:
    Type: AWS::EC2::Instance
    Properties:
      InstanceType: t3.medium
      ImageId: ami-0c55b159cbfafe1f0
      SecurityGroups:
        - !Ref InstanceSecurityGroup
      UserData:
        Fn::Base64: !Sub |
          #!/bin/bash
          yum update -y
          yum install -y nodejs git
          git clone https://github.com/RollandMELET/ProcessMetaLanguage.git /opt/pml
          cd /opt/pml && npm install --production
          npm start

  InstanceSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: ProcessMetaLanguage Security Group
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
```

#### Azure Deployment
```json
{
  "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#",
  "contentVersion": "1.0.0.0",
  "resources": [
    {
      "type": "Microsoft.Web/sites",
      "apiVersion": "2021-02-01",
      "name": "processmetalanguage",
      "location": "[resourceGroup().location]",
      "properties": {
        "serverFarmId": "[resourceId('Microsoft.Web/serverfarms', 'pml-plan')]",
        "siteConfig": {
          "appSettings": [
            {
              "name": "NODE_ENV",
              "value": "production"
            }
          ]
        }
      }
    }
  ]
}
```

### Option 4: Obsidian Sync

**Best for**: Personal use, automatic sync

1. Enable Obsidian Sync in Settings
2. Select ProcessMetaLanguage vault
3. Configure sync settings:
   ```yaml
   - Sync settings: ON
   - Sync plugins: ON
   - Sync themes: ON
   - Excluded folders:
     - node_modules/
     - .git/
     - exports/
   ```

---

## 🏭 Production Setup

### Pre-Production Checklist

- [ ] All tests passing (`npm test`)
- [ ] Security audit clean (`npm audit`)
- [ ] Performance benchmarks met
- [ ] Documentation complete
- [ ] Backup strategy implemented
- [ ] Monitoring configured
- [ ] SSL certificates installed
- [ ] Environment variables secured

### Production Build

```bash
# Clean previous builds
rm -rf dist/

# Install production dependencies only
npm ci --only=production

# Run production build
npm run build:prod

# Optimize assets
npm run optimize

# Generate documentation
npm run docs:generate

# Package for deployment
npm run package
```

### Nginx Configuration

```nginx
# /etc/nginx/sites-available/processmetalanguage
server {
    listen 80;
    server_name processmetalanguage.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name processmetalanguage.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';" always;
}
```

### Systemd Service

```ini
# /etc/systemd/system/processmetalanguage.service
[Unit]
Description=ProcessMetaLanguage Service
After=network.target

[Service]
Type=simple
User=pml
WorkingDirectory=/opt/processmetalanguage
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=10

Environment=NODE_ENV=production
Environment=PORT=3000

# Security
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/processmetalanguage/exports /opt/processmetalanguage/vault

[Install]
WantedBy=multi-user.target
```

### Database Setup (Optional)

```sql
-- PostgreSQL schema for audit logging
CREATE DATABASE processmetalanguage;

CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id VARCHAR(255),
    action VARCHAR(100),
    object_type VARCHAR(50),
    object_id VARCHAR(255),
    details JSONB,
    ip_address INET,
    user_agent TEXT
);

CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_action ON audit_logs(action);

-- Performance metrics table
CREATE TABLE performance_metrics (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metric_name VARCHAR(100),
    value NUMERIC,
    unit VARCHAR(20),
    context JSONB
);

CREATE INDEX idx_metrics_timestamp ON performance_metrics(timestamp);
CREATE INDEX idx_metrics_name ON performance_metrics(metric_name);
```

---

## 📊 Monitoring & Maintenance

### Health Checks

```javascript
// health-check.js
const healthCheck = {
  checkObsidian: async () => {
    return typeof app !== 'undefined' && app.vault;
  },
  
  checkExcalidraw: async () => {
    return typeof ExcalidrawAutomate !== 'undefined';
  },
  
  checkTemplates: async () => {
    const templates = await ProcessMetaLanguage.getTemplateCount();
    return templates >= 66; // 41 steps + 25 dispositions
  },
  
  checkSync: async () => {
    const lastSync = await ProcessMetaLanguage.getLastSyncTime();
    const now = Date.now();
    return (now - lastSync) < 300000; // 5 minutes
  },
  
  checkDiskSpace: async () => {
    const stats = await ProcessMetaLanguage.getDiskUsage();
    return stats.available > 100 * 1024 * 1024; // 100MB
  }
};

// Run all checks
const runHealthCheck = async () => {
  const results = {
    obsidian: await healthCheck.checkObsidian(),
    excalidraw: await healthCheck.checkExcalidraw(),
    templates: await healthCheck.checkTemplates(),
    sync: await healthCheck.checkSync(),
    diskSpace: await healthCheck.checkDiskSpace()
  };
  
  const allHealthy = Object.values(results).every(v => v === true);
  return { healthy: allHealthy, checks: results };
};
```

### Monitoring Stack

```yaml
# docker-compose.monitoring.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana:latest
    depends_on:
      - prometheus
    ports:
      - "3002:3000"
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana/dashboards:/etc/grafana/provisioning/dashboards
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_USERS_ALLOW_SIGN_UP=false

  node_exporter:
    image: prom/node-exporter:latest
    ports:
      - "9100:9100"
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.sysfs=/host/sys'
      - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)'

volumes:
  prometheus_data:
  grafana_data:
```

### Maintenance Scripts

```bash
#!/bin/bash
# maintenance.sh - Weekly maintenance script

echo "Starting ProcessMetaLanguage maintenance..."

# 1. Backup
echo "Creating backup..."
./scripts/backup.sh

# 2. Clean old exports
echo "Cleaning old exports..."
find ./exports -name "*.md" -mtime +30 -delete
find ./exports -name "*.json" -mtime +30 -delete

# 3. Optimize vault
echo "Optimizing vault..."
find ./vault -name "*.md" -empty -delete
find ./vault -name "*.excalidraw" -size 0 -delete

# 4. Update dependencies
echo "Checking for updates..."
npm outdated
npm update

# 5. Run integrity check
echo "Running integrity check..."
npm run check:integrity

# 6. Generate report
echo "Generating maintenance report..."
cat > maintenance-report-$(date +%Y%m%d).md << EOF
# Maintenance Report - $(date)

## Backup Status
$(ls -la ./backups | tail -5)

## Disk Usage
$(df -h .)

## System Health
$(npm run health:check)

## Recent Errors
$(tail -20 ./logs/error.log | grep ERROR)

EOF

echo "✅ Maintenance complete!"
```

### Log Rotation

```conf
# /etc/logrotate.d/processmetalanguage
/opt/processmetalanguage/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 pml pml
    sharedscripts
    postrotate
        systemctl reload processmetalanguage
    endscript
}
```

---

## 🔧 Troubleshooting

### Common Issues

#### Issue: ExcalidrawAutomate not found
```javascript
// Solution
if (typeof ExcalidrawAutomate === 'undefined') {
  // 1. Check Excalidraw plugin is enabled
  // 2. Enable ExcalidrawAutomate in settings
  // 3. Restart Obsidian
  
  // Verify in console:
  app.plugins.enabledPlugins.has('obsidian-excalidraw-plugin')
}
```

#### Issue: Templates not loading
```bash
# Check template directory
ls -la ./templates/

# Verify YAML syntax
npm run validate:templates

# Rebuild template cache
npm run templates:rebuild
```

#### Issue: Sync not working
```javascript
// Debug sync issues
ProcessMetaLanguage.debug.sync = true;
ProcessMetaLanguage.syncNow();

// Check sync status
ProcessMetaLanguage.getSyncStatus();

// Reset sync
ProcessMetaLanguage.resetSync();
```

#### Issue: Export failing
```bash
# Check permissions
ls -la ./exports/

# Test export manually
npm run export:test

# Check disk space
df -h .
```

### Debug Mode

Enable debug mode for detailed logging:

```javascript
// In Obsidian console
ProcessMetaLanguage.setDebugMode(true);

// Or via environment
export DEBUG_MODE=true
```

### Performance Issues

```javascript
// Performance profiler
const profiler = ProcessMetaLanguage.profiler;

// Start profiling
profiler.start('operation-name');

// ... operation ...

// Stop and get results
const results = profiler.stop('operation-name');
console.log(`Operation took: ${results.duration}ms`);

// Get all metrics
const metrics = profiler.getAllMetrics();
console.table(metrics);
```

---

## 🔒 Security Checklist

### Pre-Deployment Security

- [ ] **Dependencies**: Run `npm audit` and fix vulnerabilities
- [ ] **Secrets**: No hardcoded credentials in code
- [ ] **Environment**: `.env` file not in repository
- [ ] **Permissions**: Proper file/directory permissions set
- [ ] **HTTPS**: SSL certificates installed and valid
- [ ] **Headers**: Security headers configured
- [ ] **Input**: All user inputs sanitized
- [ ] **Output**: XSS prevention in place
- [ ] **Auth**: Authentication mechanism secure
- [ ] **Logs**: No sensitive data in logs

### Security Headers

```javascript
// security-headers.js
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';",
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
};
```

### Regular Security Tasks

```bash
# Weekly security scan
npm audit
npm run security:scan

# Monthly dependency update
npm update
npm outdated

# Quarterly penetration test
npm run security:pentest
```

---

## 💾 Backup & Recovery

### Backup Strategy

#### Automated Backups
```bash
#!/bin/bash
# backup.sh - Daily backup script

BACKUP_DIR="/backups/processmetalanguage"
DATE=$(date +%Y%m%d_%H%M%S)
VAULT_DIR="/opt/processmetalanguage/vault"

# Create backup directory
mkdir -p "$BACKUP_DIR/$DATE"

# Backup vault
tar -czf "$BACKUP_DIR/$DATE/vault.tar.gz" "$VAULT_DIR"

# Backup configuration
cp -r /opt/processmetalanguage/config "$BACKUP_DIR/$DATE/"

# Backup database (if used)
pg_dump processmetalanguage > "$BACKUP_DIR/$DATE/database.sql"

# Create manifest
cat > "$BACKUP_DIR/$DATE/manifest.json" << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "version": "$(cat /opt/processmetalanguage/package.json | jq -r .version)",
  "vault_size": "$(du -sh $VAULT_DIR | cut -f1)",
  "files_count": $(find $VAULT_DIR -type f | wc -l)
}
EOF

# Cleanup old backups (keep 30 days)
find "$BACKUP_DIR" -type d -mtime +30 -exec rm -rf {} +

echo "✅ Backup completed: $BACKUP_DIR/$DATE"
```

#### Backup to Cloud
```bash
# S3 backup
aws s3 sync "$BACKUP_DIR" s3://your-bucket/processmetalanguage-backups/

# Google Cloud Storage
gsutil -m rsync -r "$BACKUP_DIR" gs://your-bucket/processmetalanguage-backups/

# Azure Blob Storage
az storage blob upload-batch -d processmetalanguage-backups -s "$BACKUP_DIR"
```

### Recovery Procedures

#### Full Recovery
```bash
#!/bin/bash
# restore.sh - Recovery script

if [ $# -eq 0 ]; then
    echo "Usage: ./restore.sh <backup-date>"
    exit 1
fi

BACKUP_DATE=$1
BACKUP_DIR="/backups/processmetalanguage/$BACKUP_DATE"
RESTORE_DIR="/opt/processmetalanguage"

# Verify backup exists
if [ ! -d "$BACKUP_DIR" ]; then
    echo "❌ Backup not found: $BACKUP_DIR"
    exit 1
fi

# Stop service
systemctl stop processmetalanguage

# Backup current state
mv "$RESTORE_DIR/vault" "$RESTORE_DIR/vault.old"

# Restore vault
tar -xzf "$BACKUP_DIR/vault.tar.gz" -C "$RESTORE_DIR"

# Restore configuration
cp -r "$BACKUP_DIR/config" "$RESTORE_DIR/"

# Restore database
psql processmetalanguage < "$BACKUP_DIR/database.sql"

# Start service
systemctl start processmetalanguage

echo "✅ Recovery completed from: $BACKUP_DATE"
```

#### Partial Recovery
```javascript
// Recover specific process
ProcessMetaLanguage.recovery.recoverProcess({
  processId: 'process-001',
  backupDate: '2025-08-01',
  includeHistory: true
});

// Recover templates only
ProcessMetaLanguage.recovery.recoverTemplates({
  backupPath: '/backups/templates-20250801.tar.gz'
});
```

---

## ⚡ Performance Tuning

### Optimization Settings

```javascript
// performance-config.js
const performanceConfig = {
  // Canvas optimization
  canvas: {
    maxElements: 500,
    virtualizeThreshold: 100,
    debounceSync: 1000,
    batchOperations: true
  },
  
  // Sync optimization
  sync: {
    batchSize: 50,
    parallelWorkers: 4,
    incrementalSync: true,
    compressionEnabled: true
  },
  
  // Cache settings
  cache: {
    enabled: true,
    maxSize: 100 * 1024 * 1024, // 100MB
    ttl: 3600, // 1 hour
    preload: ['templates', 'schemas']
  },
  
  // Memory management
  memory: {
    maxHeapSize: 2048, // MB
    gcInterval: 300000, // 5 minutes
    alertThreshold: 0.8
  }
};
```

### Performance Monitoring

```javascript
// Monitor key metrics
const monitor = ProcessMetaLanguage.performance.monitor;

monitor.track('component-creation', async () => {
  // Measure component creation time
  const start = performance.now();
  await createComponent(data);
  return performance.now() - start;
});

monitor.track('sync-operation', async () => {
  // Measure sync time
  const start = performance.now();
  await syncCanvas();
  return performance.now() - start;
});

// Get performance report
const report = monitor.getReport();
console.log('Average creation time:', report['component-creation'].avg);
console.log('Average sync time:', report['sync-operation'].avg);
```

### Database Optimization

```sql
-- Indexes for performance
CREATE INDEX CONCURRENTLY idx_objects_created ON objects(created_at);
CREATE INDEX CONCURRENTLY idx_states_object ON states(object_id);
CREATE INDEX CONCURRENTLY idx_actions_state ON actions(state_id);

-- Materialized view for reports
CREATE MATERIALIZED VIEW process_summary AS
SELECT 
  p.id,
  p.name,
  COUNT(DISTINCT o.id) as object_count,
  COUNT(DISTINCT s.id) as state_count,
  COUNT(DISTINCT a.id) as action_count,
  MAX(o.updated_at) as last_activity
FROM processes p
LEFT JOIN objects o ON o.process_id = p.id
LEFT JOIN states s ON s.object_id = o.id
LEFT JOIN actions a ON a.state_id = s.id
GROUP BY p.id, p.name;

-- Refresh periodically
CREATE OR REPLACE FUNCTION refresh_summary()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY process_summary;
END;
$$ LANGUAGE plpgsql;
```

### CDN Configuration

```nginx
# CDN cache headers
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    add_header X-Content-Type-Options "nosniff";
}

location ~* \.(json|yaml|md)$ {
    expires 1h;
    add_header Cache-Control "public, must-revalidate";
}
```

---

## 📋 Deployment Checklist

### Pre-Deployment
- [ ] Code review completed
- [ ] All tests passing
- [ ] Documentation updated
- [ ] Security scan clean
- [ ] Performance benchmarks met
- [ ] Backup tested
- [ ] Rollback plan ready

### Deployment
- [ ] Maintenance window announced
- [ ] Backup created
- [ ] Dependencies updated
- [ ] Database migrations run
- [ ] Configuration validated
- [ ] Service deployed
- [ ] Health checks passing

### Post-Deployment
- [ ] Smoke tests passed
- [ ] Monitoring active
- [ ] Performance normal
- [ ] No error spikes
- [ ] User acceptance verified
- [ ] Documentation published
- [ ] Team notified

---

## 🎯 Quick Reference

### Essential Commands

```bash
# Installation
npm install

# Development
npm run dev

# Testing
npm test

# Build
npm run build

# Deploy
npm run deploy

# Health check
npm run health:check

# Backup
npm run backup

# Restore
npm run restore <backup-date>
```

### Important Paths

```
/opt/processmetalanguage/       # Installation directory
├── vault/                      # Obsidian vault
├── config/                     # Configuration files
├── exports/                    # Generated exports
├── backups/                    # Local backups
├── logs/                       # Application logs
└── scripts/                    # Utility scripts
```

### Support Contacts

- **Technical Support**: support@processmetalanguage.io
- **Security Issues**: security@processmetalanguage.io
- **Documentation**: docs@processmetalanguage.io
- **Emergency**: +33 X XX XX XX XX

---

*Last updated: 2025-08-01 - ProcessMetaLanguage v1.0.0*