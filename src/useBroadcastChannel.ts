import { useState, useEffect, useCallback, useRef } from 'react';

interface UseBroadcastChannelOptions<T> {
  doNotSetLocalStateOnSend?: boolean;
  serializer?: (data: T) => string;
  deserializer?: (data: string) => T;
}

type BroadcastChannelResult<T> = [
  T,
  (message: T) => void,
  {
    isSupported: boolean;
    error: Error | null;
    close: () => void;
  },
];

function useBroadcastChannel<T>(
  channelName: string,
  initialValue: T,
  options?: UseBroadcastChannelOptions<T>
): BroadcastChannelResult<T> {
  const {
    doNotSetLocalStateOnSend = false,
    serializer = JSON.stringify,
    deserializer = JSON.parse,
  } = options || {};

  const [state, setState] = useState<T>(initialValue);
  const [error, setError] = useState<Error | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const isSupported = typeof window !== 'undefined' && 'BroadcastChannel' in window;

  useEffect(() => {
    if (!isSupported) {
      console.warn('BroadcastChannel is not supported in this browser.');
      return;
    }

    if (!channelName) {
      setError(new Error('channelName is required'));
      return;
    }

    try {
      const bc = new BroadcastChannel(channelName);
      channelRef.current = bc;
      setError(null);

      bc.onmessage = (event: MessageEvent) => {
        try {
          const data = deserializer(event.data);
          setState(data);
        } catch (e) {
          setError(new Error(`Error deserializing message: ${(e as Error).message}`));
          console.error('Error deserializing message:', e);
        }
      };

      bc.onmessageerror = (event: MessageEvent) => {
        setError(new Error(`Message error: ${event.data}`));
        console.error('BroadcastChannel message error:', event);
      };

      // Set initial value for other tabs
      // Note: This might cause an initial sync issue if multiple tabs load simultaneously
      // and all try to post their initialValue. A more robust solution might involve
      // a leader election or a "request initial value" message.
      // For this version, we'll keep it simple.
      bc.postMessage(serializer(initialValue));
    } catch (e) {
      setError(new Error(`Error creating BroadcastChannel: ${(e as Error).message}`));
      console.error('Error creating BroadcastChannel:', e);
      if (channelRef.current) {
        channelRef.current.close();
        channelRef.current = null;
      }
    }

    return () => {
      if (channelRef.current) {
        channelRef.current.close();
        channelRef.current = null;
      }
    };
  }, [channelName, isSupported, serializer, deserializer, initialValue]); // Added initialValue to dependencies

  const postMessage = useCallback(
    (message: T) => {
      if (!channelRef.current) {
        setError(new Error('BroadcastChannel is not initialized or closed.'));
        console.error('BroadcastChannel is not initialized or closed.');
        return;
      }
      try {
        const serializedMessage = serializer(message);
        channelRef.current.postMessage(serializedMessage);
        if (!doNotSetLocalStateOnSend) {
          setState(message);
        }
        setError(null);
      } catch (e) {
        setError(new Error(`Error sending message: ${(e as Error).message}`));
        console.error('Error sending message:', e);
      }
    },
    [channelRef, doNotSetLocalStateOnSend, serializer]
  );

  const close = useCallback(() => {
    if (channelRef.current) {
      channelRef.current.close();
      channelRef.current = null;
      setError(null); // Clear error on explicit close
    }
  }, [channelRef]);

  return [
    state,
    postMessage,
    {
      isSupported,
      error,
      close,
    },
  ];
}

export default useBroadcastChannel;
