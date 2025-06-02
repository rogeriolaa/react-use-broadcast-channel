# @n0n3br/react-use-broadcast-channel

A React hook that enables simple and efficient cross-tab communication using the [Broadcast Channel API](https://developer.mozilla.org/en-US/docs/Web/API/Broadcast_Channel_API) with TypeScript support.

[![NPM Version](https://img.shields.io/npm/v/@n0n3br/react-use-broadcast-channel.svg)](https://www.npmjs.com/package/@n0n3br/react-use-broadcast-channel)
[![NPM Downloads](https://img.shields.io/npm/dm/@n0n3br/react-use-broadcast-channel.svg)](https://www.npmjs.com/package/@n0n3br/react-use-broadcast-channel)
[![MIT License](https://img.shields.io/npm/l/@n0n3br/react-use-broadcast-channel.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://img.shields.io/github/actions/workflow/status/rogeriolaa/react-use-broadcast-channel/ci.yml?branch=main)](https://github.com/rogeriolaa/react-use-broadcast-channel/actions/workflows/ci.yml)

## Key Features

- **Cross-tab state synchronization:** Easily share and sync state across multiple browser tabs or windows of the same origin.
- **TypeScript support:** Written in TypeScript with full type definitions.
- **Lightweight:** Minimal dependencies.
- **Customizable serialization:** Use custom serializers and deserializers for complex data types.
- **Local state update control:** Choose whether sending a message also updates the state of the sender tab.
- **Error handling:** Provides information about errors during channel setup or messaging.
- **Graceful degradation:** Indicates whether the Broadcast Channel API is supported by the browser.
- **Easy to use:** Simple and intuitive API.

## Installation

```bash
npm install @n0n3br/react-use-broadcast-channel
# or
yarn add @n0n3br/react-use-broadcast-channel
```

## Usage

### Basic Example: Cross-Tab Counter

```tsx
import React from 'react';
import useBroadcastChannel from '@n0n3br/react-use-broadcast-channel';

function Counter() {
  const [count, setCount, { error, isSupported }] = useBroadcastChannel<number>(
    'my-counter-channel',
    0
  );

  if (!isSupported) {
    return <p>BroadcastChannel API is not supported in this browser.</p>;
  }

  if (error) {
    return <p>Error: {error.message}</p>;
  }

  return (
    <div>
      <h1>Counter: {count}</h1>
      <button onClick={() => setCount(count + 1)}>Increment</button>
      <button onClick={() => setCount(count - 1)}>Decrement</button>
      <p>(Open this in another tab to see the count sync!)</p>
    </div>
  );
}

export default Counter;
```

### Advanced Example: Custom Serialization and Options

```tsx
import React, { useState } from 'react';
import useBroadcastChannel from '@n0n3br/react-use-broadcast-channel';

interface MyData {
  id: number;
  timestamp: Date;
  payload: string;
}

// Custom serializer and deserializer for Date objects
const customSerializer = (data: MyData): string => {
  return JSON.stringify({
    ...data,
    timestamp: data.timestamp.toISOString(), // Convert Date to string
  });
};

const customDeserializer = (dataStr: string): MyData => {
  const parsed = JSON.parse(dataStr);
  return {
    ...parsed,
    timestamp: new Date(parsed.timestamp), // Convert string back to Date
  };
};

function AdvancedSharedData() {
  const initialData: MyData = { id: 1, timestamp: new Date(), payload: 'Initial load' };
  const [data, setData, { error, isSupported, close }] = useBroadcastChannel<MyData>(
    'my-advanced-channel',
    initialData,
    {
      doNotSetLocalStateOnSend: true, // Sender tab's state won't update directly via setData
      serializer: customSerializer,
      deserializer: customDeserializer,
    }
  );

  const [localInput, setLocalInput] = useState('');

  if (!isSupported) {
    return <p>BroadcastChannel API is not supported.</p>;
  }

  const handleSendData = () => {
    const newData: MyData = {
      id: Math.random(),
      timestamp: new Date(),
      payload: localInput || 'Empty message',
    };
    setData(newData); // This will send the message to other tabs
    // If doNotSetLocalStateOnSend were false, this would also update 'data' here.
    setLocalInput('');
  };

  return (
    <div>
      <h2>Shared Data (Advanced)</h2>
      <p>ID: {data.id}</p>
      <p>Timestamp: {data.timestamp.toLocaleString()}</p>
      <p>Payload: {data.payload}</p>
      {error && <p style={{ color: 'red' }}>Error: {error.message}</p>}

      <input
        type="text"
        value={localInput}
        onChange={(e) => setLocalInput(e.target.value)}
        placeholder="New payload"
      />
      <button onClick={handleSendData}>Send Data to Other Tabs</button>
      <button onClick={close}>Close Channel</button>
      <p className="text-sm text-gray-500">
        Note: Sender tab state is not updated directly by `setData` due to
        `doNotSetLocalStateOnSend: true`. It will update if another tab sends a message, or upon
        initial load from other tabs.
      </p>
    </div>
  );
}

export default AdvancedSharedData;
```

## API Reference

The `useBroadcastChannel` hook returns an array containing the state, a function to post messages, and an object with status information.

`useBroadcastChannel<T>(channelName: string, initialValue: T, options?: Options): [T, (message: T) => void, Status]`

### Parameters

- `channelName: string`: **Required.** A unique name for the broadcast channel. Communication only happens between hooks sharing the same `channelName`.
- `initialValue: T`: **Required.** The initial value for the state. This value will also be broadcast to other tabs when the hook initializes.
- `options?: Options`: _Optional._ An object to configure the hook's behavior.
  - `doNotSetLocalStateOnSend?: boolean`: (Default: `false`) If `true`, calling the `postMessage` function will not update the state of the tab that sent the message. The state will still update upon receiving messages from other tabs.
  - `serializer?: (data: T) => string`: (Default: `JSON.stringify`) A function to serialize your data before sending it through the channel.
  - `deserializer?: (data: string) => T`: (Default: `JSON.parse`) A function to deserialize the data received from the channel.

### Return Value

A tuple `[state, postMessage, status]` where:

1.  `state: T`: The current value of the shared state. It updates when messages are received from other tabs or (by default) when `postMessage` is called in the current tab.
2.  `postMessage: (message: T) => void`: A function to send a message to all other tabs connected to the same channel.
3.  `status: Status`: An object containing:
    - `isSupported: boolean`: `true` if the Broadcast Channel API is available in the browser, `false` otherwise.
    - `error: Error | null`: An `Error` object if an error occurred (e.g., during channel initialization, message sending, or deserialization), `null` otherwise.
    - `close: () => void`: A function to manually close the broadcast channel and clean up resources. The channel also closes automatically when the component unmounts.

## Browser Support

The Broadcast Channel API is [widely supported](https://caniuse.com/broadcastchannel) by modern browsers, including Chrome, Firefox, Safari, Edge, and Opera. It is not available in Internet Explorer. The `isSupported` flag can be used to handle cases where the API is not available.

## Development

### Setup

Clone the repository and install dependencies:

```bash
git clone https://github.com/rogeriolaa/react-use-broadcast-channel.git
cd react-use-broadcast-channel
npm install
```

### Available Scripts

- `npm run build`: Builds the library for production (outputs to `dist` folder).
- `npm run test`: Runs unit tests using Jest.
- `npm run lint`: Lints the codebase using ESLint.
- `npm run example:dev`: Runs the example application in development mode (usually on `http://localhost:5173`).
- `npm run example:build`: Builds the example application for production.

## Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/rogeriolaa/react-use-broadcast-channel/issues).

## License

This project is [MIT licensed](https://opensource.org/licenses/MIT).
