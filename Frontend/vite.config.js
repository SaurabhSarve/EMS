import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    watch: {
      usePolling: true,
      interval: 100,
    },
    proxy: {
      "/api": {
        target: "http://localhost:5000", // your backend server
        changeOrigin: true,
        secure: false,
      },
    },
  },
});