
// Konfigurasi Tailwind CSS untuk styling
import { fontFamily } from "tailwindcss/defaultTheme"

/** @type {import('tailwindcss').Config} */
export default {
  // Mode dark berdasarkan class
  darkMode: ["class"],
  
  // File yang akan di-scan untuk class Tailwind
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  
  // Prefix untuk class Tailwind (opsional)
  prefix: "",
  
  theme: {
    // Container dengan responsive padding
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    
    extend: {
      // Konfigurasi warna menggunakan CSS variables
      colors: {
        // Warna border
        border: "hsl(var(--border))",
        // Warna input border
        input: "hsl(var(--input))",
        // Warna ring focus
        ring: "hsl(var(--ring))",
        // Warna background utama
        background: "hsl(var(--background))",
        // Warna foreground (text)
        foreground: "hsl(var(--foreground))",
        
        // Warna primary
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        
        // Warna secondary
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        
        // Warna destructive (error)
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        
        // Warna muted (text sekunder)
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        
        // Warna accent
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        
        // Warna popover
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        
        // Warna card
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      
      // Konfigurasi border radius
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      
      // Konfigurasi font family
      fontFamily: {
        sans: ["var(--font-sans)", ...fontFamily.sans],
      },
      
      // Konfigurasi animasi kustom
      keyframes: {
        // Animasi accordion slide down
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        // Animasi accordion slide up
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        // Animasi caret blink untuk input OTP
        "caret-blink": {
          "0%,70%,100%": { opacity: "1" },
          "20%,50%": { opacity: "0" },
        },
      },
      
      // Mapping nama animasi ke keyframes
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "caret-blink": "caret-blink 1.25s ease-out infinite",
      },
    },
  },
  
  // Plugin Tailwind yang digunakan
  plugins: [require("tailwindcss-animate")],
}
