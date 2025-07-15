
// File utama entry point aplikasi React
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Mendapatkan elemen root dari HTML dan merender aplikasi React
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* Komponen App utama dibungkus dengan StrictMode untuk deteksi masalah development */}
    <App />
  </StrictMode>,
)
