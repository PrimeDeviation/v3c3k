export type FeatureStatus = 'todo' | 'in_progress' | 'done';

export interface FeatureItem {
  id: string;
  title: string;
  description: string;
  status: FeatureStatus;
  createdAt: string;
  updatedAt: string;
} 