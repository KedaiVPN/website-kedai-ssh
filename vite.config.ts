
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: "./",
  server: {
    host: "127.0.0.1",
    port: 8080,
    proxy: {
      // Proxy untuk semua permintaan API
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
      // Proxy untuk gambar yang diupload
      '/uploads': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
    }
  },
  build: {
    outDir: "dist",
    assetsDir: "assets",
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
