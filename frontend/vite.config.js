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
      "react-router",
      "nuqs",
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
        configure: (proxy, _options) => {
          proxy.on("error", (err, _req, _res) => {
            console.log("proxy error", err);
          });
          proxy.on("open", (proxySocket) => {
            console.log("proxy open", proxySocket);
          });
          proxy.on("proxyReq", (proxyReq, req, _res) => {
            console.log(
              "Sending Request:",
              req.method,
              req.url,
              " => TO THE TARGET =>  ",
              proxyReq.method,
              proxyReq.protocol,
              proxyReq.host,
              proxyReq.path,
              JSON.stringify(proxyReq.getHeaders())
            );
          });
          proxy.on("proxyRes", (proxyRes, req, _res) => {
            console.log(
              "Received Response from the Target:",
              proxyRes.statusCode,
              req.url,
              JSON.stringify(proxyRes.headers)
            );
          });
        },
      },
    },
  },
});
