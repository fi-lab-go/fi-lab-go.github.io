import path from "node:path";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// `base: "./"` hace que los archivos se carguen con rutas relativas, así el
// sitio funciona igual en https://usuario.github.io/repositorio/ que en un
// dominio propio, sin tener que configurar nada.
export default defineConfig({
  base: "./",
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "src") } },
  plugins: [
    // Genera src/routeTree.gen.ts a partir de los archivos de src/routes.
    tanstackRouter({ target: "react", autoCodeSplitting: false }),
    react(),
  ],
});
