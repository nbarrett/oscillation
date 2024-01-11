import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import express from "./express-plugin";

// see: https://vitejs.dev/config/
const port = process.env["VITE"] ? 5173 : +(process.env["PORT"] || 3002);
console.log("defineConfig settings:VITE =", process.env["VITE"], "port:", port);
export default defineConfig({
  plugins: [react(), express('src/server')],
  server: {
    proxy: {"/api": "http://localhost:" + port},
  },
});
