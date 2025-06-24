import { useState, useEffect } from 'react';
import TextEditor from '../components/TextEditor';
import { useBuilderActions } from '../hooks/useBuilderActions';
import { DocumentState, BuilderAction } from '../types';

export default function Home() {
  const [document, setDocument] = useState<DocumentState | null>(null);
  const [loading, setLoading] = useState(true);
  const documentId = 'demo-document';
  
  const { actions, addAction, syncActions, isSync, actionCount } = useBuilderActions(documentId);

  useEffect(() => {
    async function loadDocument() {
      try {
        const response = await fetch(`/api/document/${documentId}`);
        const doc = await response.json();
        setDocument(doc);
      } catch (error) {
        console.error('Failed to load document:', error);
      } finally {
        setLoading(false);
      }
    }

    loadDocument();
  }, []);

  useEffect(() => {
    if (actionCount > 0) {
      const timer = setTimeout(() => {
        syncActions();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [actionCount, syncActions]);

  const handleAction = (action: BuilderAction) => {
    addAction(action);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading document...</div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-red-600">Failed to load document</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <TextEditor 
        initialDocument={document} 
        onAction={handleAction}
      />
      
      <div className="max-w-4xl mx-auto mt-6 p-4 bg-white rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Sync Status</h3>
        <div className="flex items-center gap-4 text-sm">
          <span className={`px-2 py-1 rounded ${isSync ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
            {isSync ? 'Syncing...' : 'Synced'}
          </span>
          <span className="text-gray-600">
            Pending Actions: {actionCount}
          </span>
        </div>
        
        {actions.length > 0 && (
          <div className="mt-4">
            <h4 className="font-medium text-gray-800 mb-2">Recent Actions:</h4>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {actions.slice(-5).map((action) => (
                <div key={action.id} className="text-xs text-gray-600 font-mono">
                  {action.type} at pos {action.position}
                  {action.content && `: "${action.content.slice(0, 20)}${action.content.length > 20 ? '...' : ''}"`}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}