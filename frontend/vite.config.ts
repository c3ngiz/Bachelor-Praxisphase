import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/** Vite configuration for the new React frontend. */
export default defineConfig({
  plugins: [react()],
});
