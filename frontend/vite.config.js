import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Define process.env to avoid ReferenceError in browser
  define: {
    'process.env': {},
  },
  esbuild: {
    loader: 'jsx',
    include: [
      'src/**/*.js',
    ],
    exclude: [],
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
  },
  // Optional: Configure server port if needed
  // server: {
  //   port: 3000,
  // },
  // Optional: Configure proxy for backend API calls during development
  // server: {
  //   proxy: {
  //     \'/api\': \'http://localhost:5000\' // Replace with your backend URL
  //   }
  // }
}); 