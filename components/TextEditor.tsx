import { useState, useCallback, useRef } from 'react';
import { BuilderAction, DocumentState } from '../types';

interface TextEditorProps {
  initialDocument: DocumentState;
  onAction: (action: BuilderAction) => void;
}

export default function TextEditor({ initialDocument, onAction }: TextEditorProps) {
  const [content, setContent] = useState(initialDocument.content);
  const [version, setVersion] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const generateActionId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const handleContentChange = useCallback((newContent: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursorPosition = textarea.selectionStart;
    const oldContent = content;

    if (newContent.length > oldContent.length) {
      const insertedText = newContent.slice(cursorPosition - (newContent.length - oldContent.length), cursorPosition);
      const action: BuilderAction = {
        id: generateActionId(),
        type: 'INSERT',
        timestamp: Date.now(),
        position: cursorPosition - insertedText.length,
        content: insertedText,
      };
      onAction(action);
    } else if (newContent.length < oldContent.length) {
      const action: BuilderAction = {
        id: generateActionId(),
        type: 'DELETE',
        timestamp: Date.now(),
        position: cursorPosition,
        length: oldContent.length - newContent.length,
      };
      onAction(action);
    } else {
      const action: BuilderAction = {
        id: generateActionId(),
        type: 'REPLACE',
        timestamp: Date.now(),
        position: 0,
        content: newContent,
        length: oldContent.length,
      };
      onAction(action);
    }

    setContent(newContent);
    setVersion(v => v + 1);
  }, [content, onAction]);

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Real-time Document Editor</h1>
        <p className="text-sm text-gray-600">Document ID: {initialDocument.id} | Version: {version}</p>
      </div>
      
      <div className="border border-gray-300 rounded-lg p-4 bg-white shadow-sm">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          className="w-full h-96 p-4 border border-gray-200 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
          placeholder="Start typing to see builder actions in action..."
        />
      </div>
      
      <div className="mt-4 text-xs text-gray-500">
        Actions are automatically generated and synced as you type
      </div>
    </div>
  );
}