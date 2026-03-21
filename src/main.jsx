/**
 * @file src/main.jsx
 * @description Entry point for Bocage Champagne Society.
 * Mounts the React app to the DOM and initializes native Capacitor features
 * (splash screen, status bar, push notifications) on startup.
 * @imports src/App.jsx, src/index.css, src/lib/capacitor.js
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { initializeApp } from './lib/capacitor';
import './index.css';

// Initialize native features (no-op on web)
initializeApp();

// Mount React app
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
