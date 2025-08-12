import type { NextApiRequest, NextApiResponse } from 'next';
import { DocumentState } from '../../types';
import { getDocuments, getDocumentVersions } from './sync';

interface DocumentListItem {
  id: string;
  content: string;
  lastModified: number;
  version: number;
  contentLength: number;
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const documents = getDocuments();
    const versions = getDocumentVersions();

    const documentList: DocumentListItem[] = Array.from(documents.entries()).map(([id, doc]) => ({
      id,
      content: doc.content,
      lastModified: doc.lastModified,
      version: versions.get(id) || 0,
      contentLength: doc.content.length,
    }));

    res.status(200).json({
      success: true,
      documents: documentList,
      count: documentList.length,
    });
  } catch (error) {
    console.error('List documents error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to list documents' 
    });
  }
} 