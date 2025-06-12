#!/usr/bin/env node

import { Command } from 'commander';
import { ConfigManager } from './config/manager';
import { FeatureStatus } from './types/feature';

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
  .description('List all feature items (titles only)')
  .action(() => {
    const features = configManager.listFeatures();
    console.log('\nFeatures:');
    features.forEach(feature => {
      console.log(`- ${feature.title} (${feature.status})`);
    });
    console.log(); // Add newline at end
  });

program
  .command('view')
  .description('View detailed information about features')
  .argument('[title]', 'Optional: Feature title to view specific feature')
  .action((title) => {
    if (title) {
      const feature = configManager.getFeatureByTitle(title);
      if (feature) {
        console.log('\nFeature Details:');
        console.log(JSON.stringify(feature, null, 2));
        console.log(); // Add newline at end
      } else {
        console.error(`\nError: No feature found with title "${title}"\n`);
      }
    } else {
      const features = configManager.listFeatures();
      console.log('\nAll Features:');
      console.log(JSON.stringify(features, null, 2));
      console.log(); // Add newline at end
    }
  });

program
  .command('status')
  .description('Update feature status')
  .requiredOption('-t, --title <title>', 'Feature title')
  .requiredOption('-s, --status <status>', 'New status (todo, in_progress, done)')
  .action((options) => {
    const status = options.status as FeatureStatus;
    if (!['todo', 'in_progress', 'done'].includes(status)) {
      console.error('\nError: Status must be one of: todo, in_progress, done\n');
      return;
    }

    const updatedFeature = configManager.updateFeatureStatus(options.title, status);
    if (updatedFeature) {
      console.log('\nFeature status updated:');
      console.log(JSON.stringify(updatedFeature, null, 2));
      console.log(); // Add newline at end
    } else {
      console.error(`\nError: No feature found with title "${options.title}"\n`);
    }
  });

program.parse();
