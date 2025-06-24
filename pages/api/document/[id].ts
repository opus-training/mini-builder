import type { NextApiRequest, NextApiResponse } from 'next';
import { DocumentState } from '../../../types';

// Import shared document store from sync.ts
const getSharedDocuments = () => {
  // We'll access the shared maps through a shared module
  const syncModule = require('../sync');
  return syncModule.getDocuments();
};

const getDocumentVersions = () => {
  const syncModule = require('../sync');
  return syncModule.getDocumentVersions();
};

export default function handler(req: NextApiRequest, res: NextApiResponse<DocumentState | { error: string }>) {
  const { id } = req.query;
  
  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid document ID' });
  }

  if (req.method === 'GET') {
    const documents = getSharedDocuments();
    const versions = getDocumentVersions();
    let document = documents.get(id);
    let version = versions.get(id) || 0;
    
    if (!document) {
      document = {
        id,
        content: '',
        lastModified: Date.now(),
      };
      documents.set(id, document);
      versions.set(id, 0);
      version = 0;
    }
    
    return res.status(200).json({
      ...document,
      version
    });
  }

  res.status(405).json({ error: 'Method not allowed' });
}