
// Konfigurasi Vite untuk build dan development
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Ekspor konfigurasi Vite
export default defineConfig({
  // Plugin yang digunakan
  plugins: [react()],
  
  // Konfigurasi resolver untuk alias path
  resolve: {
    alias: {
      // Alias @ untuk merujuk ke folder src
      "@": path.resolve(__dirname, "./src"),
    },
  },
  
  // Konfigurasi server development
  server: {
    // Port untuk development server
    port: 5173,
    // Buka browser secara otomatis
    open: true,
    // Konfigurasi proxy untuk API calls
    proxy: {
      // Proxy untuk API backend
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  
  // Konfigurasi build
  build: {
    // Folder output build
    outDir: 'dist',
    // Generate source maps untuk debugging
    sourcemap: true,
    // Optimasi chunk splitting
    rollupOptions: {
      output: {
        // Pisahkan vendor libraries ke chunk terpisah
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu']
        }
      }
    }
  },
  
  // Konfigurasi optimisasi dependencies
  optimizeDeps: {
    // Include dependencies yang perlu di-bundle
    include: ['react', 'react-dom', 'react-router-dom']
  }
})
