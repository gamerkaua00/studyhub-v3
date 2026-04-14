import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const REPO_NAME = "studyhub-v3";

export default defineConfig({
  plugins: [react()],
  base: `/${REPO_NAME}/`,
  build: {
    outDir: "dist",
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
          dateFns: ["date-fns"],
        },
      },
    },
  },
});
