#!/usr/bin/env node

import { Command } from 'commander';
import { ConfigManager } from './config/manager';
import { FeatureStatus, FeatureValidation, AIModelConfig, AIModelProvider } from './types/feature';

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
  .option('--deps <ids>', 'Comma-separated list of feature IDs this feature depends on')
  .option('--validation <validation>', 'Simple validation string or JSON object')
  .option('--ai-model <model>', 'AI model configuration as JSON object')
  .action((options) => {
    const dependencies = options.deps ? options.deps.split(',').map((id: string) => id.trim()) : [];
    let validation: FeatureValidation | undefined = undefined;
    if (options.validation) {
      try {
        validation = JSON.parse(options.validation);
      } catch {
        validation = options.validation;
      }
    }
    let aiModel: AIModelConfig | undefined = undefined;
    if (options.aiModel) {
      try {
        aiModel = JSON.parse(options.aiModel);
      } catch (e) {
        console.error('\nError: AI model configuration must be a valid JSON object\n');
        return;
      }
    }
    const feature = configManager.addFeature(options.title, options.description, dependencies, validation, aiModel);
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

program
  .command('dependencies')
  .description('Update feature dependencies')
  .requiredOption('-t, --title <title>', 'Feature title')
  .requiredOption('--deps <ids>', 'Comma-separated list of feature IDs this feature depends on')
  .action((options) => {
    const dependencies = options.deps.split(',').map((id: string) => id.trim());
    const updatedFeature = configManager.updateFeatureDependencies(options.title, dependencies);
    if (updatedFeature) {
      console.log('\nFeature dependencies updated:');
      console.log(JSON.stringify(updatedFeature, null, 2));
      console.log(); // Add newline at end
    } else {
      console.error(`\nError: No feature found with title "${options.title}"\n`);
    }
  });

program
  .command('validation')
  .description('Update feature validation rules')
  .requiredOption('-t, --title <title>', 'Feature title')
  .requiredOption('--validation <validation>', 'Validation string or JSON object')
  .action((options) => {
    let validation: FeatureValidation;
    try {
      validation = JSON.parse(options.validation);
    } catch {
      validation = options.validation;
    }
    const updatedFeature = configManager.updateFeatureValidation(options.title, validation);
    if (updatedFeature) {
      console.log('\nFeature validation updated:');
      console.log(JSON.stringify(updatedFeature, null, 2));
      console.log(); // Add newline at end
    } else {
      console.error(`\nError: No feature found with title "${options.title}"\n`);
    }
  });

program
  .command('ai-model')
  .description('Update feature AI model configuration')
  .requiredOption('-t, --title <title>', 'Feature title')
  .requiredOption('--provider <provider>', 'AI model provider (anthropic, google, openai, deepseek, other)')
  .requiredOption('--model <model>', 'Model name/identifier')
  .option('--api-key <key>', 'API key for the model provider')
  .option('--temperature <temp>', 'Temperature setting (0-1)', parseFloat)
  .option('--max-tokens <tokens>', 'Maximum tokens to generate', parseInt)
  .option('--custom-endpoint <url>', 'Custom API endpoint URL')
  .action((options) => {
    const provider = options.provider as AIModelProvider;
    if (!['anthropic', 'google', 'openai', 'deepseek', 'other'].includes(provider)) {
      console.error('\nError: Provider must be one of: anthropic, google, openai, deepseek, other\n');
      return;
    }

    const aiModel: AIModelConfig = {
      provider,
      model: options.model,
      ...(options.apiKey ? { apiKey: options.apiKey } : {}),
      ...(options.temperature ? { temperature: options.temperature } : {}),
      ...(options.maxTokens ? { maxTokens: options.maxTokens } : {}),
      ...(options.customEndpoint ? { customEndpoint: options.customEndpoint } : {})
    };

    const updatedFeature = configManager.updateFeatureAIModel(options.title, aiModel);
    if (updatedFeature) {
      console.log('\nFeature AI model updated:');
      console.log(JSON.stringify(updatedFeature, null, 2));
      console.log(); // Add newline at end
    } else {
      console.error(`\nError: No feature found with title "${options.title}"\n`);
    }
  });

program.parse();
