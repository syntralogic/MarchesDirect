import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import path from "path";

export default defineConfig({
  plugins: [
    react({
      // This helps Vite handle files that export both components (Providers) and hooks (like useLang/useToast)
      // It prevents the "Could not Fast Refresh" warning
      fastRefresh: true,
    }),
    svgr({
      svgrOptions: {
        icon: true,
        exportType: "named",
        namedExport: "ReactComponent",
      },
    }),
  ],
  server: {
    // Matches backend's default FRONTEND_URL / CORS origin (localhost:3000,
    // see backend/.env.example). Vite's own default is 5173 - without this,
    // a fresh clone of both repos fails CORS out of the box because the
    // frontend runs on a different port than the backend expects.
    port: 3000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-dom/client",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
    ],
  },
});