export interface DocumentState {
  id: string;
  content: string;
  lastModified: number;
  version?: number;
}

export interface BuilderAction {
  id: string;
  type: 'INSERT' | 'DELETE' | 'REPLACE';
  timestamp: number;
  position: number;
  content?: string;
  length?: number;
}

export interface SyncPayload {
  documentId: string;
  actions: BuilderAction[];
}

export interface SyncResponse {
  success: boolean;
  currentVersion: number;
  conflictActions?: BuilderAction[];
}