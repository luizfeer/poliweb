import { type Href, router } from 'expo-router';

/** Catálogo de comércio — mesma página que /comercio/pousadas no portal. */
export const POUSADAS_ROUTE = '/webview/comercio-pousadas' as Href;

/** Atalhos de hospedagem apontam para o guia comercial de pousadas. */
export const ONDE_FICAR_ROUTE = POUSADAS_ROUTE;

export function openOndeFicar(): void {
  router.push(POUSADAS_ROUTE);
}

export function openPousadasCatalog(): void {
  router.push(POUSADAS_ROUTE);
}
