import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import express from "./express-plugin";

// see: https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), express('src/server')],
});
