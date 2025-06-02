import React, { useState, useEffect } from 'react';
// Assuming the hook is in ../../src relative to example/src/App.tsx
import useBroadcastChannel from '../../src/useBroadcastChannel';

function App() {
  // Counter channel
  const [count, setCount, { isSupported: counterIsSupported, error: counterError }] =
    useBroadcastChannel<number>('counter-channel', 0);

  // Message channel - store an array of messages
  const [messages, setMessages] = useState<string[]>([]);
  const [receivedMessage, broadcastMessage, { isSupported: msgIsSupported, error: msgError }] =
    useBroadcastChannel<string>('message-channel', '');

  const [localMessage, setLocalMessage] = useState('');

  // Effect to handle incoming messages and add them to the list
  useEffect(() => {
    if (receivedMessage && !messages.includes(receivedMessage)) {
      // Check to avoid duplicate entries if initial value is resent
      // Add new message to the beginning of the array
      // If receivedMessage is the initial empty string, don't add it.
      if (receivedMessage !== '') {
        setMessages((prevMessages) => [receivedMessage, ...prevMessages.slice(0, 4)]); // Keep last 5 messages
      }
    }
  }, [receivedMessage]); // removed "messages" from dependency array to avoid loop with setMessages

  const handleIncrement = () => setCount(count + 1);
  const handleDecrement = () => {
    if (count > 0) {
      // Prevent negative counts, adjust if needed
      setCount(count - 1);
    }
  };

  const handleSendMessage = () => {
    if (localMessage.trim() === '') return; // Don't send empty messages
    broadcastMessage(localMessage);
    setLocalMessage(''); // Clear input after sending
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-700 text-white p-4 sm:p-8 flex flex-col items-center">
      <div className="w-full max-w-3xl mx-auto space-y-8">
        <header className="text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600">
            React <code>useBroadcastChannel</code> Demo
          </h1>
          <p className="mt-4 text-lg text-slate-300 bg-slate-800/50 p-4 rounded-xl shadow-xl border border-slate-700">
            🚀 Open this page in multiple browser tabs or windows to witness live cross-tab
            communication!
          </p>
        </header>

        {/* Counter Section */}
        <section className="p-6 bg-slate-800/70 shadow-2xl rounded-xl border border-slate-700 backdrop-blur-md">
          <h2 className="text-2xl sm:text-3xl font-semibold mb-6 text-center text-sky-400">
            Cross-Tab Counter
          </h2>
          <p className="text-6xl sm:text-7xl font-bold text-center my-6 text-transparent bg-clip-text bg-gradient-to-r from-lime-400 to-green-500">
            {count}
          </p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={handleIncrement}
              className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-lg shadow-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-emerald-400/50"
            >
              Increment +
            </button>
            <button
              onClick={handleDecrement}
              className="px-8 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold rounded-lg shadow-lg hover:from-red-600 hover:to-rose-700 transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-rose-400/50"
            >
              Decrement -
            </button>
          </div>
          <div className="mt-5 text-center">
            {counterIsSupported ? (
              <p className="text-xs px-3 py-1 inline-block bg-green-500/20 text-green-300 rounded-full">
                Counter: BroadcastChannel Supported
              </p>
            ) : (
              <p className="text-xs px-3 py-1 inline-block bg-red-500/20 text-red-300 rounded-full">
                Counter: BroadcastChannel NOT Supported
              </p>
            )}
            {counterError && (
              <p className="text-red-400 bg-red-900/50 p-3 rounded-md mt-3 text-sm shadow-md">
                Counter Error: {counterError.message}
              </p>
            )}
          </div>
        </section>

        {/* Message Section */}
        <section className="p-6 bg-slate-800/70 shadow-2xl rounded-xl border border-slate-700 backdrop-blur-md">
          <h2 className="text-2xl sm:text-3xl font-semibold mb-6 text-center text-sky-400">
            Global Message Board
          </h2>
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 mb-6">
            <input
              type="text"
              value={localMessage}
              onChange={(e) => setLocalMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type a message..."
              className="flex-grow p-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none text-slate-100 placeholder-slate-400 shadow-inner"
            />
            <button
              onClick={handleSendMessage}
              className="px-8 py-3 bg-gradient-to-r from-sky-500 to-cyan-600 text-white font-bold rounded-lg shadow-lg hover:from-sky-600 hover:to-cyan-700 transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-cyan-400/50"
            >
              Send Message
            </button>
          </div>
          <div className="mt-4 p-4 bg-slate-900/50 rounded-lg min-h-[150px] border border-slate-700 shadow-inner">
            <h3 className="font-semibold text-slate-300 mb-2 border-b border-slate-700 pb-2">
              Latest Received Messages (Max 5):
            </h3>
            {messages.length === 0 ? (
              <p className="text-slate-400 italic">
                No messages yet. Send one or wait for incoming messages!
              </p>
            ) : (
              <ul className="space-y-2">
                {messages.map((msg, index) => (
                  <li
                    key={index}
                    className="text-slate-200 bg-slate-700/50 p-3 rounded-md shadow animate-fadeIn"
                  >
                    {msg}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="mt-5 text-center">
            {msgIsSupported ? (
              <p className="text-xs px-3 py-1 inline-block bg-green-500/20 text-green-300 rounded-full">
                Messaging: BroadcastChannel Supported
              </p>
            ) : (
              <p className="text-xs px-3 py-1 inline-block bg-red-500/20 text-red-300 rounded-full">
                Messaging: BroadcastChannel NOT Supported
              </p>
            )}
            {msgError && (
              <p className="text-red-400 bg-red-900/50 p-3 rounded-md mt-3 text-sm shadow-md">
                Message Error: {msgError.message}
              </p>
            )}
          </div>
        </section>

        <footer className="text-center text-sm text-slate-400 mt-12 pb-6">
          <p>
            Powered by <code>@n0n3br/react-use-broadcast-channel</code>
          </p>
          <p>A Vite + React + TypeScript + Tailwind CSS Example</p>
        </footer>
      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}

export default App;
