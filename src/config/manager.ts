import fs from 'fs';
import path from 'path';
import { FeatureItem, FeatureStatus, FeatureValidation, AIModelConfig } from '../types/feature';
import { v4 as uuidv4 } from 'uuid';

const CONFIG_DIR = '.v3c3k';
const FEATURES_FILE = 'features.json';
const CONFIG_FILE = 'config.json';
const INTENTIONS_FILE = 'intentions.json';
const ENV_FILE = '.env';

export class ConfigManager {
  private configPath: string;
  private featuresPath: string;
  private configFilePath: string;
  private intentionsPath: string;
  private envPath: string;

  constructor() {
    this.configPath = path.join(process.cwd(), CONFIG_DIR);
    this.featuresPath = path.join(this.configPath, FEATURES_FILE);
    this.configFilePath = path.join(this.configPath, CONFIG_FILE);
    this.intentionsPath = path.join(this.configPath, INTENTIONS_FILE);
    this.envPath = path.join(process.cwd(), ENV_FILE);
    this.initializeConfig();
  }

  private initializeConfig() {
    if (!fs.existsSync(this.configPath)) {
      fs.mkdirSync(this.configPath);
    }
    if (!fs.existsSync(this.featuresPath)) {
      fs.writeFileSync(this.featuresPath, JSON.stringify([], null, 2));
    }
    if (!fs.existsSync(this.configFilePath)) {
      fs.writeFileSync(this.configFilePath, JSON.stringify({
        provider: "mock",
        model: "mock-basic",
        validationMode: "dev"
      }, null, 2));
    }
    if (!fs.existsSync(this.intentionsPath)) {
      fs.writeFileSync(this.intentionsPath, JSON.stringify([], null, 2));
    }
    if (!fs.existsSync(this.envPath)) {
      const envTemplate = `# Anthropic (Claude)
ANTHROPIC_API_KEY=

# Google (Gemini)
GOOGLE_API_KEY=

# OpenAI
OPENAI_API_KEY=

# DeepSeek
DEEPSEEK_API_KEY=

# Optional: Custom endpoints
ANTHROPIC_API_ENDPOINT=
GOOGLE_API_ENDPOINT=
OPENAI_API_ENDPOINT=
DEEPSEEK_API_ENDPOINT=

# Provider-specific API keys
PROVIDER_API_KEY=
`;
      fs.writeFileSync(this.envPath, envTemplate);
    }
  }

  private readFeatures(): FeatureItem[] {
    const content = fs.readFileSync(this.featuresPath, 'utf-8');
    return JSON.parse(content);
  }

  private writeFeatures(features: FeatureItem[]) {
    fs.writeFileSync(this.featuresPath, JSON.stringify(features, null, 2));
  }

  addFeature(title: string, description: string, dependencies?: string[], validation?: FeatureValidation, aiModel?: AIModelConfig): FeatureItem {
    const features = this.readFeatures();
    const newFeature: FeatureItem = {
      id: uuidv4(),
      title,
      description,
      status: 'todo',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dependencies: dependencies ?? [],
      ...(validation ? { validation } : {}),
      ...(aiModel ? { aiModel } : {})
    };
    
    features.push(newFeature);
    this.writeFeatures(features);
    return newFeature;
  }

  listFeatures(): FeatureItem[] {
    return this.readFeatures();
  }

  getFeatureByTitle(title: string): FeatureItem | undefined {
    const features = this.readFeatures();
    return features.find(feature => feature.title.toLowerCase() === title.toLowerCase());
  }

  updateFeatureStatus(title: string, status: FeatureStatus): FeatureItem | undefined {
    const features = this.readFeatures();
    const featureIndex = features.findIndex(feature => feature.title.toLowerCase() === title.toLowerCase());
    
    if (featureIndex === -1) {
      return undefined;
    }

    const feature = features[featureIndex];
    if (!feature) {
      return undefined;
    }

    features[featureIndex] = {
      id: feature.id,
      title: feature.title,
      description: feature.description,
      status,
      createdAt: feature.createdAt,
      updatedAt: new Date().toISOString(),
      dependencies: feature.dependencies ?? [],
      ...(feature.validation ? { validation: feature.validation } : {}),
      ...(feature.aiModel ? { aiModel: feature.aiModel } : {})
    };

    this.writeFeatures(features);
    return features[featureIndex];
  }

  updateFeatureDependencies(title: string, dependencies: string[]): FeatureItem | undefined {
    const features = this.readFeatures();
    const featureIndex = features.findIndex(feature => feature.title.toLowerCase() === title.toLowerCase());
    if (featureIndex === -1) {
      return undefined;
    }
    const feature = features[featureIndex];
    if (!feature) {
      return undefined;
    }
    features[featureIndex] = {
      ...feature,
      dependencies,
      updatedAt: new Date().toISOString()
    };
    this.writeFeatures(features);
    return features[featureIndex];
  }

  updateFeatureValidation(title: string, validation: FeatureValidation): FeatureItem | undefined {
    const features = this.readFeatures();
    const featureIndex = features.findIndex(feature => feature.title.toLowerCase() === title.toLowerCase());
    if (featureIndex === -1) {
      return undefined;
    }
    const feature = features[featureIndex];
    if (!feature) {
      return undefined;
    }
    features[featureIndex] = {
      ...feature,
      validation,
      updatedAt: new Date().toISOString()
    };
    this.writeFeatures(features);
    return features[featureIndex];
  }

  updateFeatureAIModel(title: string, aiModel: AIModelConfig): FeatureItem | undefined {
    const features = this.readFeatures();
    const featureIndex = features.findIndex(feature => feature.title.toLowerCase() === title.toLowerCase());
    if (featureIndex === -1) {
      return undefined;
    }
    const feature = features[featureIndex];
    if (!feature) {
      return undefined;
    }
    features[featureIndex] = {
      ...feature,
      aiModel,
      updatedAt: new Date().toISOString()
    };
    this.writeFeatures(features);
    return features[featureIndex];
  }

  removeFeature(title: string): { success: boolean; error?: string; dependentFeatures?: string[] } {
    const features = this.readFeatures();
    const featureIndex = features.findIndex(feature => feature.title.toLowerCase() === title.toLowerCase());
    
    if (featureIndex === -1) {
      return { success: false, error: `No feature found with title "${title}"` };
    }

    const featureToRemove = features[featureIndex];
    if (!featureToRemove) {
      return { success: false, error: `Error accessing feature "${title}"` };
    }
    
    // Check for dependent features
    const dependentFeatures = features.filter(f => 
      f.dependencies && f.dependencies.includes(featureToRemove.id)
    );

    if (dependentFeatures.length > 0) {
      return { 
        success: false, 
        error: `Cannot remove feature "${title}" as it is a dependency for other features`,
        dependentFeatures: dependentFeatures.map(f => f.title)
      };
    }

    // Remove the feature
    features.splice(featureIndex, 1);
    this.writeFeatures(features);
    return { success: true };
  }
} 