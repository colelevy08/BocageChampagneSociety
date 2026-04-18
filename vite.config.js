/**
 * @file vite.config.js
 * @description Vite build configuration for Bocage Champagne Society.
 * Uses React plugin for JSX transform and Tailwind CSS v4 plugin for styling.
 * @connects index.html (entry), src/main.jsx (app entry)
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: '/society/',
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 5173,
  },
});
