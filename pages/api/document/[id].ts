import type { NextApiRequest, NextApiResponse } from 'next';
import { DocumentState } from '../../../types';

let documents: Map<string, DocumentState> = new Map();

export default function handler(req: NextApiRequest, res: NextApiResponse<DocumentState | { error: string }>) {
  const { id } = req.query;
  
  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid document ID' });
  }

  if (req.method === 'GET') {
    let document = documents.get(id);
    
    if (!document) {
      document = {
        id,
        content: '',
        lastModified: Date.now(),
      };
      documents.set(id, document);
    }
    
    return res.status(200).json(document);
  }

  res.status(405).json({ error: 'Method not allowed' });
}