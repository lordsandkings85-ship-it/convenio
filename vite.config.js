import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const groqKey = env.GROQ_API_KEY || env.VITE_GROQ_API_KEY;
  const resendKey = env.RESEND_API_KEY || env.VITE_RESEND_API_KEY;

  return {
    plugins: [tailwindcss(), react()],
    build: {
      chunkSizeWarningLimit: 800,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('leaflet') || id.includes('react-leaflet')) {
                return 'vendor-leaflet';
              }
              if (id.includes('@supabase')) {
                return 'vendor-supabase';
              }
              if (id.includes('react-markdown') || id.includes('micromark') || id.includes('unist') || id.includes('vfile') || id.includes('mdast')) {
                return 'vendor-markdown';
              }
              if (id.includes('lucide-react')) {
                return 'vendor-icons';
              }
              if (id.includes('react-router-dom') || id.includes('react-helmet-async') || id.includes('react-dom') || id.includes('react')) {
                return 'vendor-react';
              }
              return 'vendor-utils';
            }
          },
        },
      },
    },
    server: {
      proxy: {
        '/api/groq': {
          target: 'https://api.groq.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/groq/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              if (groqKey) {
                proxyReq.setHeader('Authorization', `Bearer ${groqKey}`);
              }
            });
          },
        },
        '/api/resend': {
          target: 'https://api.resend.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/resend/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              if (resendKey) {
                proxyReq.setHeader('Authorization', `Bearer ${resendKey}`);
              }
            });
          },
        },
      },
    },
  };
});
