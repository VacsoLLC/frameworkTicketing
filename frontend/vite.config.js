import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ["react", "react-dom"],
  },
  optimizeDeps: {
    include: [
      "react",
      "prop-types",
      "react-dom",
      "zustand",
      "interweave",
      "react-router-dom",
    ],
  },

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
