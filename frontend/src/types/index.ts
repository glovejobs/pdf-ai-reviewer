export interface Document {
  id: string;
  filename: string;
  fileSize: number;
  pageCount?: number;
  status: 'UPLOADED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  uploadedAt: string;
  overallRating?: number;
  confidence?: number;
}

export interface DocumentStatus {
  documentId: string;
  filename: string;
  status: 'UPLOADED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  pageCount?: number;
  overallProgress: number;
  jobs: Job[];
  uploadedAt: string;
  updatedAt: string;
}

export interface Job {
  type: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  progress: number;
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

export interface DocumentResult {
  documentId: string;
  filename: string;
  pageCount?: number;
  result: {
    overallRating: number;
    ratingName: string;
    scores: {
      violence: number;
      sexualContent: number;
      profanity: number;
      hate?: number;
      selfHarm?: number;
    };
    confidence: number;
    flaggedTerms: {
      total: number;
      byCategory: Record<string, number>;
    };
    summary: string;
    rationale: string;
    evidence: Evidence[];
  };
  analyzedAt: string;
}

export interface Evidence {
  page?: number;
  quote: string;
  category: string;
}

export interface TermList {
  id: string;
  name: string;
  category: string;
  terms: string[];
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Template {
  id: string;
  name: string;
  description?: string;
  format: string;
  template: any;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export const RATING_LEVELS = [
  { value: 0, name: 'All Ages', color: 'bg-green-500' },
  { value: 1, name: 'Juvenile Advisory', color: 'bg-blue-500' },
  { value: 2, name: 'Youth Advisory', color: 'bg-yellow-500' },
  { value: 3, name: 'Youth Restricted', color: 'bg-orange-500' },
  { value: 4, name: 'Adults Only', color: 'bg-red-500' },
  { value: 5, name: 'Deviant Content', color: 'bg-purple-900' },
];

export function getRatingInfo(rating: number) {
  return RATING_LEVELS[rating] || RATING_LEVELS[0];
}
