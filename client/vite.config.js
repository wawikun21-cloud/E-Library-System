import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  base: '/',
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        // F-05 FIX: rewrite Set-Cookie domain so the browser accepts
        // cookies from :5000 responses when proxied through :5173
        cookieDomainRewrite: {
          'localhost:5000': 'localhost',
          'localhost': 'localhost',
        },
        cookiePathRewrite: { '*': '/' },
      }
    }
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        cookieDomainRewrite: {
          'localhost:5000': 'localhost',
          'localhost': 'localhost',
        },
        cookiePathRewrite: { '*': '/' },
      }
    }
  }
})