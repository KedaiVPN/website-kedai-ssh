
/**
 * Entry point aplikasi React
 * File ini mengatur rendering komponen App ke dalam DOM
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Mencari elemen root di HTML untuk mounting aplikasi React
const container = document.getElementById('root');

// Validasi keberadaan elemen root
if (!container) {
  throw new Error('Root element not found');
}

// Membuat root React dan render aplikasi dalam StrictMode
// StrictMode membantu mendeteksi masalah potential dalam development
createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>
);
