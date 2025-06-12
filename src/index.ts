#!/usr/bin/env node

import { Command } from 'commander';
import { ConfigManager } from './config/manager';

const program = new Command();
const configManager = new ConfigManager();

program
  .name('v3c3k')
  .description('V3C3K - AI-assisted product validation tool')
  .version('0.1.0');

program
  .command('add')
  .description('Add a new feature item')
  .requiredOption('-t, --title <title>', 'Feature title')
  .requiredOption('-d, --description <description>', 'Feature description')
  .action((options) => {
    const feature = configManager.addFeature(options.title, options.description);
    console.log('Feature added:', feature);
  });

program
  .command('list')
  .description('List all feature items')
  .action(() => {
    const features = configManager.listFeatures();
    console.log('Features:', features);
  });

program.parse();
