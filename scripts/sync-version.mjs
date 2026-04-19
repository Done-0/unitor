#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const packageJsonPath = join(rootDir, 'package.json');
const pluginJsonPath = join(rootDir, 'plugins/unitor/.claude-plugin/plugin.json');
const marketplaceJsonPath = join(rootDir, '.claude-plugin/marketplace.json');

const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
const version = packageJson.version;

const pluginJson = JSON.parse(readFileSync(pluginJsonPath, 'utf8'));
pluginJson.version = version;
writeFileSync(pluginJsonPath, JSON.stringify(pluginJson, null, 2) + '\n');

const marketplaceJson = JSON.parse(readFileSync(marketplaceJsonPath, 'utf8'));
marketplaceJson.metadata.version = version;
marketplaceJson.plugins[0].version = version;
writeFileSync(marketplaceJsonPath, JSON.stringify(marketplaceJson, null, 2) + '\n');

console.log(`✓ Version synced to ${version}`);
console.log(`  - package.json: ${version}`);
console.log(`  - plugin.json: ${version}`);
console.log(`  - marketplace.json: ${version}`);
