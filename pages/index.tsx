import { useState, useEffect } from 'react';
import TextEditor from '../components/TextEditor';
import { useBuilderActions } from '../hooks/useBuilderActions';
import { DocumentState, BuilderAction } from '../types';

interface DocumentListItem {
  id: string;
  content: string;
  lastModified: number;
  version: number;
  contentLength: number;
}

export default function Home() {
  const [document, setDocument] = useState<DocumentState | null>(null);
  const [loading, setLoading] = useState(true);
  const [clearingCache, setClearingCache] = useState(false);
  const [availableDocuments, setAvailableDocuments] = useState<DocumentListItem[]>([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState('demo-document');
  console.log('selectedDocumentId', selectedDocumentId);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  
  const { actions, addAction, syncActions, isSync, actionCount } = useBuilderActions(selectedDocumentId);

  const loadAvailableDocuments = async () => {
    setLoadingDocuments(true);
    try {
      const response = await fetch('/api/documents');
      const data = await response.json();
      if (data.success) {
        setAvailableDocuments(data.documents);
      }
      console.log('availableDocuments', data.documents);

    } catch (error) {
      console.error('Failed to load available documents:', error);
    } finally {
      setLoadingDocuments(false);
    }
  };

  const loadDocument = async (documentId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/document/${documentId}`);
      const doc = await response.json();
      setDocument(doc);
    } catch (error) {
      console.error('Failed to load document:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocument(selectedDocumentId);
    loadAvailableDocuments();
  }, [selectedDocumentId]);

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

  const handleDocumentChange = (documentId: string) => {
    if (documentId !== selectedDocumentId) {
      setSelectedDocumentId(documentId);
    }
  };

  const handleClearCache = async () => {
    setClearingCache(true);
    try {
      const response = await fetch('/api/clear-cash', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Reload the document after clearing cache
        setDocument(null);
        setAvailableDocuments([]);
        await loadDocument(selectedDocumentId);
        await loadAvailableDocuments();
      } else {
        console.error('Failed to clear cache');
      }
    } catch (error) {
      console.error('Clear cache error:', error);
    } finally {
      setClearingCache(false);
    }
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
      {/* Document Selector */}
      <div className="max-w-4xl mx-auto mb-6 p-4 bg-white rounded-lg shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-semibold text-gray-800">Document Selector</h3>
            <div className="flex items-center gap-4 text-sm">
              <span className={`px-2 py-1 rounded ${isSync ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                {isSync ? 'Syncing...' : 'Synced'}
              </span>
              <span className="text-gray-600">
                Pending Actions: {actionCount}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleClearCache}
              disabled={clearingCache || isSync}
              className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {clearingCache ? 'Clearing...' : 'Clear Server Cache'}
            </button>
            <button
              onClick={loadAvailableDocuments}
              disabled={loadingDocuments}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loadingDocuments ? 'Refreshing...' : 'Refresh List'}
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-4 mb-3">
          <label htmlFor="document-select" className="text-sm font-medium text-gray-700">
            Add new document:
          </label>          
          <input
            type="text"
            placeholder="Or enter new document ID"
            className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                const target = e.target as HTMLInputElement;
                if (target.value.trim()) {
                  handleDocumentChange(target.value.trim());
                  target.value = '';
                  loadAvailableDocuments();
                }
              }
            }}
          />
        </div>

        {availableDocuments.length > 0 && (
          <div className="text-sm text-gray-600">
            <strong>{availableDocuments.length}</strong> document(s) in cache:
            <div className="mt-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {availableDocuments.map(doc => (
                <div
                  key={doc.id}
                  className={`p-3 border rounded cursor-pointer transition-colors ${
                    doc.id === selectedDocumentId 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={() => handleDocumentChange(doc.id)}
                >
                  <div className="font-mono text-sm font-medium text-gray-900 truncate">{doc.id}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <TextEditor 
        initialDocument={document} 
        onAction={handleAction}
      />
      
      {actions.length > 0 && (
        <div className="max-w-4xl mx-auto mt-6 p-4 bg-white rounded-lg shadow-sm">
          <h4 className="font-medium text-gray-800 mb-2">Pending Actions:</h4>
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
  );
}