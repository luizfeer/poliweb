import * as WebBrowser from 'expo-web-browser';

import { env } from '@/lib/env';

export type LegalDocPath = '/termos' | '/privacidade';

export async function openLegalDoc(path: LegalDocPath): Promise<void> {
  await WebBrowser.openBrowserAsync(`${env.webBaseUrl}${path}`, {
    presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
  });
}
