import { useState, useEffect, useRef, useCallback } from 'react';
import { z } from 'zod';
import { ws } from '@shared/routes';
import { useAuth } from './use-auth';

type WSState = {
  connected: boolean;
  frequencyState: z.infer<typeof ws.receive.frequencyState> | null;
  error: string | null;
};

export function useWebSocket() {
  const { isAuthenticated } = useAuth();
  const [state, setState] = useState<WSState>({
    connected: false,
    frequencyState: null,
    error: null,
  });
  
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const socket = new WebSocket(wsUrl);
    wsRef.current = socket;

    socket.onopen = () => {
      setState(s => ({ ...s, connected: true, error: null }));
    };

    socket.onclose = () => {
      setState(s => ({ ...s, connected: false }));
    };

    socket.onerror = () => {
      setState(s => ({ ...s, error: 'WebSocket connection error' }));
    };

    socket.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        const { type, payload } = parsed;
        
        if (type === 'frequencyState') {
          const validated = ws.receive.frequencyState.parse(payload);
          setState(s => ({ ...s, frequencyState: validated }));
        } else if (type === 'userJoined' || type === 'userLeft' || type === 'userSpeaking') {
          // Typically handled by a full state sync 'frequencyState' broadcast,
          // but we can merge optimistic updates here if needed. 
          // For simplicity, we rely on server broadcasting frequencyState on changes.
        }
      } catch (err) {
        console.error("Failed to parse WS message", err);
      }
    };

    return () => {
      socket.close();
      wsRef.current = null;
    };
  }, [isAuthenticated]);

  const emit = useCallback(<K extends keyof typeof ws.send>(
    type: K,
    payload: z.infer<typeof ws.send[K]>
  ) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, payload }));
    }
  }, []);

  return { ...state, emit };
}
