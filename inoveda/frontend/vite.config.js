import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['@mui/material', '@mui/x-data-grid', '@emotion/react', '@emotion/styled'],
          'vendor-charts': ['recharts'],
          'vendor-motion': ['framer-motion'],
          'vendor-utils': ['axios', 'date-fns', 'notistack', 'lucide-react'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
})
