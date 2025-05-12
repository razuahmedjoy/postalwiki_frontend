import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({

  plugins: [
    react()
  ].filter(Boolean),
  build: {
    outDir: 'dist',
    // Make sure .htaccess is copied to the build
    copyPublicDir: true
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
