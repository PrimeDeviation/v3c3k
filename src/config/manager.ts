import fs from 'fs';
import path from 'path';
import { FeatureItem, FeatureStatus, FeatureValidation, AIModelConfig } from '../types/feature';
import { v4 as uuidv4 } from 'uuid';

const CONFIG_DIR = '.v3c3k';
const FEATURES_FILE = 'features.json';

export class ConfigManager {
  private configPath: string;
  private featuresPath: string;

  constructor() {
    this.configPath = path.join(process.cwd(), CONFIG_DIR);
    this.featuresPath = path.join(this.configPath, FEATURES_FILE);
    this.initializeConfig();
  }

  private initializeConfig() {
    if (!fs.existsSync(this.configPath)) {
      fs.mkdirSync(this.configPath);
    }
    if (!fs.existsSync(this.featuresPath)) {
      fs.writeFileSync(this.featuresPath, JSON.stringify([], null, 2));
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
} 