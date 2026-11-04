import { createHashHistory, createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { DefaultCatchBoundary } from "@/components/DefaultCatchBoundary";
import { NotFound } from "@/components/NotFound";

// Historial por "hash" (#/ruta): GitHub Pages solo sirve archivos estáticos,
// así que las rutas internas viven después del # y funcionan al recargar o
// compartir cualquier enlace, sin importar el nombre del repositorio.
export function getRouter() {
  return createRouter({
    routeTree,
    history: createHashHistory(),
    defaultPreload: "intent",
    defaultErrorComponent: DefaultCatchBoundary,
    defaultNotFoundComponent: () => <NotFound />,
    scrollRestoration: true,
  });
}
