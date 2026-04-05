import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const REPO_NAME = "studyhub-app";

export default defineConfig({
  plugins: [react()],
  base: process.env.NODE_ENV === "production" ? `/${REPO_NAME}/` : "/",
  build: { outDir: "dist", sourcemap: false },
  server: {
    port: 5173,
    proxy: { "/api": { target: "http://localhost:3001", changeOrigin: true } },
  },
});
