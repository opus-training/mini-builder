import type { NextApiRequest, NextApiResponse } from 'next';
import { SyncPayload, SyncResponse, BuilderAction, DocumentState } from '../../types';

let documents: Map<string, DocumentState> = new Map();
let documentVersions: Map<string, number> = new Map();
let documentActions: Map<string, BuilderAction[]> = new Map();

function applyAction(content: string, action: BuilderAction): string {
  switch (action.type) {
    case 'INSERT':
      return content.slice(0, action.position) + (action.content || '') + content.slice(action.position);
    case 'DELETE':
      return content.slice(0, action.position) + content.slice(action.position + (action.length || 0));
    case 'REPLACE':
      return action.content || '';
    default:
      return content;
  }
}

function initializeDocument(documentId: string): DocumentState {
  if (!documents.has(documentId)) {
    const document: DocumentState = {
      id: documentId,
      content: '',
      lastModified: Date.now(),
    };
    documents.set(documentId, document);
    documentVersions.set(documentId, 0);
    documentActions.set(documentId, []);
  }
  return documents.get(documentId)!;
}

export default function handler(req: NextApiRequest, res: NextApiResponse<SyncResponse>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, currentVersion: 0 });
  }

  try {
    const payload: SyncPayload = req.body;
    const { documentId, actions, lastKnownVersion } = payload;

    const document = initializeDocument(documentId);
    const currentVersion = documentVersions.get(documentId) || 0;
    const allActions = documentActions.get(documentId) || [];

    if (lastKnownVersion < currentVersion) {
      const conflictActions = allActions.slice(lastKnownVersion);
      return res.status(409).json({
        success: false,
        currentVersion,
        conflictActions,
      });
    }

    let updatedContent = document.content;
    for (const action of actions) {
      updatedContent = applyAction(updatedContent, action);
      allActions.push(action);
    }

    const newDocument: DocumentState = {
      ...document,
      content: updatedContent,
      lastModified: Date.now(),
    };

    const newVersion = currentVersion + actions.length;

    documents.set(documentId, newDocument);
    documentVersions.set(documentId, newVersion);
    documentActions.set(documentId, allActions);

    res.status(200).json({
      success: true,
      currentVersion: newVersion,
    });
  } catch (error) {
    console.error('Sync API error:', error);
    res.status(500).json({ success: false, currentVersion: 0 });
  }
}