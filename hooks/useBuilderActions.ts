import { useState, useCallback } from 'react';
import { BuilderAction, SyncPayload } from '../types';

export function useBuilderActions(documentId: string) {
  const [actions, setActions] = useState<BuilderAction[]>([]);
  const [isSync, setIsSync] = useState(false);
  const [lastSyncVersion, setLastSyncVersion] = useState(0);

  const addAction = useCallback((action: BuilderAction) => {
    setActions(prev => [...prev, action]);
  }, []);

  const syncActions = useCallback(async () => {
    if (actions.length === 0 || isSync) return;

    setIsSync(true);
    
    try {
      const payload: SyncPayload = {
        documentId,
        actions,
        lastKnownVersion: lastSyncVersion,
      };

      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result = await response.json();
        setLastSyncVersion(result.currentVersion);
        setActions([]);
      } else {
        console.error('Sync failed:', response.statusText);
      }
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      setIsSync(false);
    }
  }, [documentId, actions, lastSyncVersion, isSync]);

  const clearActions = useCallback(() => {
    setActions([]);
  }, []);

  return {
    actions,
    addAction,
    syncActions,
    clearActions,
    isSync,
    actionCount: actions.length,
  };
}