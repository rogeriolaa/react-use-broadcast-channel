import { renderHook, act } from '@testing-library/react';
import useBroadcastChannel from '../src/useBroadcastChannel';

// Mock BroadcastChannel
let mockPostMessage: jest.Mock;
let mockClose: jest.Mock;
let mockOnMessage: ((event: Partial<MessageEvent>) => void) | null = null;
let mockOnMessageError: ((event: Partial<MessageEvent>) => void) | null = null;
let broadcastChannelInstances: any[] = [];

const mockBroadcastChannel = jest.fn().mockImplementation((channelName: string) => {
  const instance = {
    name: channelName,
    postMessage: mockPostMessage,
    close: mockClose,
    set onmessage(handler: ((event: Partial<MessageEvent>) => void) | null) {
      mockOnMessage = handler;
    },
    get onmessage() {
      return mockOnMessage;
    },
    set onmessageerror(handler: ((event: Partial<MessageEvent>) => void) | null) {
      mockOnMessageError = handler;
    },
    get onmessageerror() {
      return mockOnMessageError;
    },
  };
  broadcastChannelInstances.push(instance);
  return instance;
});

// Helper to simulate receiving a message
const simulateMessage = (data: any, channelName?: string) => {
  // Find the correct onmessage handler if multiple channels are tested, though typically one per test.
  if (mockOnMessage) {
    act(() => {
      mockOnMessage!({ data });
    });
  }
};

// Helper to simulate a message error
const simulateMessageError = (errorData: any, channelName?: string) => {
  if (mockOnMessageError) {
    act(() => {
      mockOnMessageError!({ data: errorData });
    });
  }
};

describe('useBroadcastChannel', () => {
  const CHANNEL_NAME = 'test-channel';
  const INITIAL_VALUE = { data: 'initial' };

  beforeEach(() => {
    mockPostMessage = jest.fn();
    mockClose = jest.fn();
    mockOnMessage = null;
    mockOnMessageError = null;
    broadcastChannelInstances = [];
    global.BroadcastChannel = mockBroadcastChannel;
  });

  afterEach(() => {
    jest.restoreAllMocks();
    // @ts-ignore
    delete global.BroadcastChannel; // Clean up to ensure it doesn't leak between tests
  });

  describe('Initial State', () => {
    it('should return initialValue', () => {
      const { result } = renderHook(() => useBroadcastChannel(CHANNEL_NAME, INITIAL_VALUE));
      expect(result.current[0]).toEqual(INITIAL_VALUE);
    });

    it('should set isSupported to true when BroadcastChannel is available', () => {
      const { result } = renderHook(() => useBroadcastChannel(CHANNEL_NAME, INITIAL_VALUE));
      expect(result.current[2].isSupported).toBe(true);
    });

    it('should set isSupported to false when BroadcastChannel is not available', () => {
      // @ts-ignore
      delete global.BroadcastChannel;
      const { result } = renderHook(() => useBroadcastChannel(CHANNEL_NAME, INITIAL_VALUE));
      expect(result.current[2].isSupported).toBe(false);
      expect(result.current[2].error).toBe(null); // No error, just not supported
    });

    it('should post initialValue to the channel on mount', () => {
      renderHook(() => useBroadcastChannel(CHANNEL_NAME, INITIAL_VALUE));
      expect(mockPostMessage).toHaveBeenCalledTimes(1);
      expect(mockPostMessage).toHaveBeenCalledWith(JSON.stringify(INITIAL_VALUE));
    });

    it('should have error as null initially', () => {
      const { result } = renderHook(() => useBroadcastChannel(CHANNEL_NAME, INITIAL_VALUE));
      expect(result.current[2].error).toBeNull();
    });
  });

  describe('Sending Messages', () => {
    it('should call postMessage on the channel instance and update local state', () => {
      const { result } = renderHook(() => useBroadcastChannel(CHANNEL_NAME, INITIAL_VALUE));
      const newMessage = { data: 'new-message' };

      act(() => {
        result.current[1](newMessage);
      });

      expect(mockPostMessage).toHaveBeenCalledWith(JSON.stringify(newMessage));
      expect(result.current[0]).toEqual(newMessage);
      expect(result.current[2].error).toBeNull();
    });

    it('should not update local state if doNotSetLocalStateOnSend is true', () => {
      const { result } = renderHook(() =>
        useBroadcastChannel(CHANNEL_NAME, INITIAL_VALUE, { doNotSetLocalStateOnSend: true })
      );
      const newMessage = { data: 'another-message' };

      act(() => {
        result.current[1](newMessage);
      });

      expect(mockPostMessage).toHaveBeenCalledWith(JSON.stringify(newMessage));
      expect(result.current[0]).toEqual(INITIAL_VALUE); // State remains initial
      expect(result.current[2].error).toBeNull();
    });

    it('should set error if postMessage fails', () => {
      const errorMessage = 'Failed to post';
      mockPostMessage.mockImplementationOnce(() => {
        throw new Error(errorMessage);
      });
      const { result } = renderHook(() => useBroadcastChannel(CHANNEL_NAME, INITIAL_VALUE));
      const newMessage = { data: 'test' };

      act(() => {
        result.current[1](newMessage);
      });

      expect(result.current[2].error).toEqual(new Error(`Error sending message: ${errorMessage}`));
    });
  });

  describe('Receiving Messages', () => {
    it('should update local state when a message is received', () => {
      const { result } = renderHook(() => useBroadcastChannel(CHANNEL_NAME, INITIAL_VALUE));
      const receivedMessage = { data: 'received' };

      simulateMessage(JSON.stringify(receivedMessage));

      expect(result.current[0]).toEqual(receivedMessage);
      expect(result.current[2].error).toBeNull();
    });

    it('should set error if deserialization fails', () => {
      const { result } = renderHook(() => useBroadcastChannel(CHANNEL_NAME, INITIAL_VALUE));
      const malformedMessage = 'not-json';

      simulateMessage(malformedMessage);

      // The exact error message depends on JSON.parse
      expect(result.current[2].error).toBeInstanceOf(Error);
      expect(result.current[2].error?.message).toContain('Error deserializing message:');
    });
  });

  describe('Close Method', () => {
    it('should call close on the channel instance and nullify channelRef', () => {
      const { result } = renderHook(() => useBroadcastChannel(CHANNEL_NAME, INITIAL_VALUE));

      act(() => {
        result.current[2].close();
      });

      expect(mockClose).toHaveBeenCalledTimes(1);
      // Attempting to post after close should set an error
      const newMessage = { data: 'message-after-close' };
      act(() => {
        result.current[1](newMessage);
      });
      expect(result.current[2].error?.message).toBe(
        'BroadcastChannel is not initialized or closed.'
      );
    });

    it('should clear error on explicit close', () => {
      const { result } = renderHook(() => useBroadcastChannel(CHANNEL_NAME, INITIAL_VALUE));
      // Induce an error
      act(() => {
        // @ts-ignore
        mockOnMessageError({ data: 'some error' });
      });
      expect(result.current[2].error).not.toBeNull();

      act(() => {
        result.current[2].close();
      });
      expect(result.current[2].error).toBeNull();
    });
  });

  describe('Cleanup', () => {
    it('should call close on unmount', () => {
      const { unmount } = renderHook(() => useBroadcastChannel(CHANNEL_NAME, INITIAL_VALUE));

      unmount();

      expect(mockClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Serialization/Deserialization', () => {
    it('should use custom serializer and deserializer', () => {
      const customSerializer = jest.fn((data: any) => `custom:${data.value}`);
      const customDeserializer = jest.fn((data: string) => ({
        value: data.split(':')[1] + ':parsed',
      }));

      const { result } = renderHook(() =>
        useBroadcastChannel(
          CHANNEL_NAME,
          { value: 'initial' },
          { serializer: customSerializer, deserializer: customDeserializer }
        )
      );

      // Test initial post
      expect(customSerializer).toHaveBeenCalledWith({ value: 'initial' });
      expect(mockPostMessage).toHaveBeenCalledWith('custom:initial');
      customSerializer.mockClear(); // Clear mock for the next call

      const newMessage = { value: 'sent' };
      act(() => {
        result.current[1](newMessage);
      });
      expect(customSerializer).toHaveBeenCalledWith(newMessage);
      expect(mockPostMessage).toHaveBeenCalledWith('custom:sent');
      expect(result.current[0]).toEqual({ value: 'sent' }); // Local state update with raw message if not from channel

      const receivedData = 'custom:received_from_channel';
      simulateMessage(receivedData);
      expect(customDeserializer).toHaveBeenCalledWith(receivedData);
      expect(result.current[0]).toEqual({ value: 'received_from_channel:parsed' });
    });

    it('should handle error during custom deserialization', () => {
      const errMsg = 'Custom deserialize error';
      const customSerializer = (data: any) => JSON.stringify(data);
      const customDeserializer = jest.fn((data: string) => {
        throw new Error(errMsg);
      });

      const { result } = renderHook(() =>
        useBroadcastChannel(CHANNEL_NAME, INITIAL_VALUE, {
          serializer: customSerializer,
          deserializer: customDeserializer,
        })
      );

      simulateMessage(JSON.stringify({ data: 'some data' }));
      expect(customDeserializer).toHaveBeenCalled();
      expect(result.current[2].error).toEqual(new Error(`Error deserializing message: ${errMsg}`));
    });
  });

  describe('Error Handling', () => {
    it('should set error if channelName is missing', () => {
      // @ts-ignore
      const { result } = renderHook(() => useBroadcastChannel(null, INITIAL_VALUE));
      expect(result.current[2].error).toEqual(new Error('channelName is required'));
    });

    it('should set error if BroadcastChannel constructor throws', () => {
      const constructorError = 'Constructor failed';
      // @ts-ignore
      global.BroadcastChannel = jest.fn().mockImplementation(() => {
        throw new Error(constructorError);
      });
      const { result } = renderHook(() => useBroadcastChannel(CHANNEL_NAME, INITIAL_VALUE));
      expect(result.current[2].error).toEqual(
        new Error(`Error creating BroadcastChannel: ${constructorError}`)
      );
    });

    it('should call onmessageerror and set error state', () => {
      const { result } = renderHook(() => useBroadcastChannel(CHANNEL_NAME, INITIAL_VALUE));
      const errorData = { message: 'test error event' };

      simulateMessageError(errorData);

      expect(result.current[2].error).toEqual(new Error(`Message error: ${errorData}`));
    });
  });
});
