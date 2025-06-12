export type FeatureStatus = 'todo' | 'in_progress' | 'done';

export type FeatureValidation = string | {
  acceptanceCriteria?: string[];
  testCases?: string[];
};

export interface FeatureItem {
  id: string;
  title: string;
  description: string;
  status: FeatureStatus;
  createdAt: string;
  updatedAt: string;
  dependencies: string[]; // Array of feature IDs
  validation?: FeatureValidation;
} 