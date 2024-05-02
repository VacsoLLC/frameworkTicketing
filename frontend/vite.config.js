import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ["react", "react-dom"],
  },
  //optimizeDeps: {
  //exclude: ["frameworkfrontend"],
  //},
  server: {
    fs: {
      strict: false,
    },
    proxy: {
      "/api": {
        target: `http://localhost:3001`,
        changeOrigin: true,
      },
    },
  },
});
