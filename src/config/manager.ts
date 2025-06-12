import fs from 'fs';
import path from 'path';
import { FeatureItem } from '../types/feature';
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

  addFeature(title: string, description: string): FeatureItem {
    const features = this.readFeatures();
    const newFeature: FeatureItem = {
      id: uuidv4(),
      title,
      description,
      status: 'todo',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
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
} 