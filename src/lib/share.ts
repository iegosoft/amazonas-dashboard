export type ShareResult = 'shared' | 'copied' | 'cancelled' | 'failed'

type Nav = Partial<Pick<Navigator, 'share' | 'clipboard'>>

/**
 * Compartilha o link da tela atual: menu nativo do sistema no celular (WhatsApp etc.),
 * cópia para a área de transferência no computador ou se o menu nativo falhar.
 */
export async function shareLink(url: string, title: string, preferNative: boolean, nav: Nav = navigator): Promise<ShareResult> {
  if (preferNative && typeof nav.share === 'function') {
    try {
      await nav.share({ title, url })
      return 'shared'
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return 'cancelled'
      // outros erros (permissão, navegador sem suporte real): tenta copiar
    }
  }
  try {
    await nav.clipboard!.writeText(url)
    return 'copied'
  } catch {
    return 'failed'
  }
}
