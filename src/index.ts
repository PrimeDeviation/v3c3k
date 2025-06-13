#!/usr/bin/env node

import { Command } from 'commander';
import { ConfigManager } from './config/manager';
import { FeatureStatus, FeatureValidation, AIModelConfig, AIModelProvider } from './types/feature';

const program = new Command();
const configManager = new ConfigManager();

interface CLIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  status?: string;
  progress?: {
    current: number;
    total: number;
    message: string;
  };
}

// Exit codes
const EXIT_CODES = {
  SUCCESS: 0,
  INVALID_INPUT: 1,
  FEATURE_NOT_FOUND: 2,
  VALIDATION_ERROR: 3,
  AI_ERROR: 4,
  SYSTEM_ERROR: 5
};

function outputResponse<T>(response: CLIResponse<T>, json: boolean) {
  if (json) {
    console.log(JSON.stringify(response));
  } else {
    if (response.success) {
      if (response.data) {
        console.log('\n' + JSON.stringify(response.data, null, 2) + '\n');
      }
    } else {
      console.error(`\nError: ${response.error}\n`);
    }
  }
  
  // Set appropriate exit code
  if (!response.success) {
    switch (response.status) {
      case 'invalid_input':
        process.exit(EXIT_CODES.INVALID_INPUT);
      case 'feature_not_found':
        process.exit(EXIT_CODES.FEATURE_NOT_FOUND);
      case 'validation_error':
        process.exit(EXIT_CODES.VALIDATION_ERROR);
      case 'ai_error':
        process.exit(EXIT_CODES.AI_ERROR);
      default:
        process.exit(EXIT_CODES.SYSTEM_ERROR);
    }
  }
}

function updateProgress(current: number, total: number, message: string, json: boolean) {
  const progress = { current, total, message };
  if (json) {
    console.log(JSON.stringify({ success: true, progress }));
  } else {
    const percentage = Math.round((current / total) * 100);
    console.log(`\n[${percentage}%] ${message}\n`);
  }
}

program
  .name('v3c3k')
  .description('V3C3K - AI-assisted product validation tool')
  .version('0.1.0')
  .option('--json', 'Output in JSON format')
  .option('--machine', 'Output in machine-readable format');

program
  .command('add')
  .description('Add a new feature item')
  .requiredOption('-t, --title <title>', 'Feature title')
  .requiredOption('-d, --description <description>', 'Feature description')
  .option('--deps <ids>', 'Comma-separated list of feature IDs this feature depends on')
  .option('--validation <validation>', 'Simple validation string or JSON object')
  .option('--ai-model <model>', 'AI model configuration as JSON object')
  .action((options) => {
    updateProgress(1, 3, 'Validating input', options.json);
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
        outputResponse({ 
          success: false, 
          error: 'AI model configuration must be a valid JSON object',
          status: 'invalid_input'
        }, options.json);
        return;
      }
    }
    
    updateProgress(2, 3, 'Creating feature', options.json);
    const feature = configManager.addFeature(options.title, options.description, dependencies, validation, aiModel);
    
    updateProgress(3, 3, 'Feature created successfully', options.json);
    outputResponse({ success: true, data: feature }, options.json);
  });

program
  .command('list')
  .description('List all feature items')
  .action((options) => {
    const features = configManager.listFeatures();
    if (options.json) {
      outputResponse({ success: true, data: features }, true);
    } else {
      console.log('\nFeatures:');
      features.forEach(feature => {
        console.log(`- ${feature.title} (${feature.status})`);
      });
      console.log();
    }
  });

program
  .command('view')
  .description('View detailed information about features')
  .argument('[title]', 'Optional: Feature title to view specific feature')
  .action((title, options) => {
    if (title) {
      const feature = configManager.getFeatureByTitle(title);
      if (feature) {
        outputResponse({ success: true, data: feature }, options.json);
      } else {
        outputResponse({ success: false, error: `No feature found with title "${title}"` }, options.json);
      }
    } else {
      const features = configManager.listFeatures();
      outputResponse({ success: true, data: features }, options.json);
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
      outputResponse({ success: false, error: 'Status must be one of: todo, in_progress, done' }, options.json);
      return;
    }

    const updatedFeature = configManager.updateFeatureStatus(options.title, status);
    if (updatedFeature) {
      outputResponse({ success: true, data: updatedFeature }, options.json);
    } else {
      outputResponse({ success: false, error: `No feature found with title "${options.title}"` }, options.json);
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
      outputResponse({ success: true, data: updatedFeature }, options.json);
    } else {
      outputResponse({ success: false, error: `No feature found with title "${options.title}"` }, options.json);
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
      outputResponse({ success: true, data: updatedFeature }, options.json);
    } else {
      outputResponse({ success: false, error: `No feature found with title "${options.title}"` }, options.json);
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
      outputResponse({ success: false, error: 'Provider must be one of: anthropic, google, openai, deepseek, other' }, options.json);
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
      outputResponse({ success: true, data: updatedFeature }, options.json);
    } else {
      outputResponse({ success: false, error: `No feature found with title "${options.title}"` }, options.json);
    }
  });

program
  .command('remove')
  .description('Remove a feature')
  .requiredOption('-t, --title <title>', 'Feature title')
  .option('--force', 'Force removal even if feature has dependencies')
  .action((options) => {
    const result = configManager.removeFeature(options.title);
    if (result.success) {
      outputResponse({ 
        success: true, 
        data: { message: `Feature "${options.title}" removed successfully` } 
      }, options.json);
    } else {
      if (result.dependentFeatures && !options.force) {
        outputResponse({ 
          success: false, 
          error: result.error || 'Unknown error',
          data: { 
            dependentFeatures: result.dependentFeatures,
            message: 'Use --force to remove anyway (not recommended)'
          }
        }, options.json);
      } else {
        outputResponse({ 
          success: false, 
          error: result.error || 'Unknown error'
        }, options.json);
      }
    }
  });

program.parse();
