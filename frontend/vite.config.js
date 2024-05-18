import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import basicSsl from "@vitejs/plugin-basic-ssl";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),

    basicSsl({
      name: "home.wasteoftime.org",
      domains: ["home.wasteoftime.org", "home.wasteoftime.local", "localhost"],
      certDir: "./cert",
    }),
  ],
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
        target: `http://127.0.0.1:3001`,
        changeOrigin: true,
      },
    },
  },
});
