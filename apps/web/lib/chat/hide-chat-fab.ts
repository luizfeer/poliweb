/** Rotas onde o FAB de chat some (comércio usa o FAB de postar mídia do dono). */
export function shouldHideChatFab(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  if (pathname.startsWith('/assistente')) return true;
  if (pathname === '/mapa') return true;
  if (pathname === '/turismo/onde-ficar') return true;
  if (pathname.startsWith('/comercio')) return true;
  if (pathname.startsWith('/painel/comercio')) return true;
  return false;
}
