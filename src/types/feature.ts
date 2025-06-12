export interface FeatureItem {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'done';
  createdAt: string;
  updatedAt: string;
} 