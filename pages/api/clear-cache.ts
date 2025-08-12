import type { NextApiRequest, NextApiResponse } from 'next';
import { getDocuments, getDocumentVersions, getDocumentActions } from './sync';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const documents = getDocuments();
    const versions = getDocumentVersions();
    const actions = getDocumentActions();

    // Clear all maps
    documents.clear();
    versions.clear();
    actions.clear();

    res.status(200).json({ 
      success: true, 
      message: 'Server cache cleared successfully' 
    });
  } catch (error) {
    console.error('Clear cache error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to clear cache' 
    });
  }
} 