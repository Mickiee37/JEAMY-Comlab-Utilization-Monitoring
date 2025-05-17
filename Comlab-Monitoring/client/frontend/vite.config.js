import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: '0.0.0.0', // Bind to all network interfaces
    fs: {
      strict: false,  // Disable strict file serving mode
      allow: [
        // Add the exact path as it appears in the error message
        'C:/ComputerLab-Monitoring/ComputerLab-Monitoring/Comlab-Monitoring/node_modules/@fortawesome/fontawesome-free/webfonts',
        path.resolve(__dirname, 'src'),  // Ensure src is allowed
      ]
    }
  }
});
