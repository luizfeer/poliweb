import 'server-only';

import type { WaSendTemplateInput, WaSendTextInput, WaTemplate } from './types';

const GRAPH_VERSION = 'v22.0';
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;

export class WaApiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly httpStatus: number,
    public readonly raw: unknown,
  ) {
    super(message);
    this.name = 'WaApiError';
  }
}

type MetaErrorBody = {
  error?: {
    message?: string;
    type?: string;
    code?: number;
    error_subcode?: number;
    fbtrace_id?: string;
  };
};

async function graph<T>(
  path: string,
  init: RequestInit & { token: string },
): Promise<T> {
  const { token, ...rest } = init;
  const response = await fetch(`${GRAPH_BASE}${path}`, {
    ...rest,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(rest.headers ?? {}),
    },
  });
  const body = (await response.json()) as T & MetaErrorBody;
  if (!response.ok || body.error) {
    throw new WaApiError(
      body.error?.message ?? `Graph API ${response.status}`,
      String(body.error?.code ?? response.status),
      response.status,
      body,
    );
  }
  return body;
}

export function createMetaClient(opts: {
  accessToken: string;
  phoneNumberId: string;
  wabaId?: string;
}) {
  const { accessToken, phoneNumberId, wabaId } = opts;

  return {
    async sendText(input: WaSendTextInput) {
      return graph<{ messages: Array<{ id: string }> }>(
        `/${phoneNumberId}/messages`,
        {
          method: 'POST',
          token: accessToken,
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: input.to,
            type: 'text',
            text: { body: input.text, preview_url: input.previewUrl ?? false },
          }),
        },
      );
    },

    async sendTemplate(input: WaSendTemplateInput) {
      const components: unknown[] = [];
      if (input.variables) {
        const parameters = Object.keys(input.variables)
          .sort((a, b) => Number(a) - Number(b))
          .map((k) => ({ type: 'text', text: input.variables![k] }));
        if (parameters.length > 0) {
          components.push({ type: 'body', parameters });
        }
      }
      if (input.urlButtonVariables?.length) {
        input.urlButtonVariables.forEach((value, idx) => {
          components.push({
            type: 'button',
            sub_type: 'url',
            index: idx,
            parameters: [{ type: 'text', text: value }],
          });
        });
      }

      return graph<{ messages: Array<{ id: string }> }>(
        `/${phoneNumberId}/messages`,
        {
          method: 'POST',
          token: accessToken,
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: input.to,
            type: 'template',
            template: {
              name: input.templateName,
              language: { code: input.language ?? 'pt_BR' },
              ...(components.length > 0 ? { components } : {}),
            },
          }),
        },
      );
    },

    async markRead(wamid: string) {
      return graph<{ success: boolean }>(`/${phoneNumberId}/messages`, {
        method: 'POST',
        token: accessToken,
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          status: 'read',
          message_id: wamid,
        }),
      });
    },

    async getMediaUrl(mediaId: string) {
      return graph<{ url: string; mime_type: string; sha256: string }>(
        `/${mediaId}`,
        { token: accessToken },
      );
    },

    async getPhoneNumberInfo() {
      return graph<{
        verified_name: string;
        display_phone_number: string;
        quality_rating: 'GREEN' | 'YELLOW' | 'RED' | 'UNKNOWN';
      }>(`/${phoneNumberId}?fields=verified_name,display_phone_number,quality_rating`, {
        token: accessToken,
      });
    },

    // ── Templates ─────────────────────────────────────────────────────────

    async listTemplates() {
      if (!wabaId) throw new Error('wabaId required for template management');
      return graph<{
        data: Array<{
          id: string;
          name: string;
          language: string;
          category: string;
          status: string;
          components: unknown[];
          rejected_reason?: string;
        }>;
      }>(
        `/${wabaId}/message_templates?fields=id,name,language,category,status,components,rejected_reason&limit=200`,
        { token: accessToken },
      );
    },

    async createTemplate(t: WaTemplate) {
      if (!wabaId) throw new Error('wabaId required for template management');
      return graph<{ id: string; status: string; category: string }>(
        `/${wabaId}/message_templates`,
        {
          method: 'POST',
          token: accessToken,
          body: JSON.stringify({
            name: t.name,
            language: t.language,
            category: t.category,
            components: t.components,
          }),
        },
      );
    },

    async deleteTemplate(name: string) {
      if (!wabaId) throw new Error('wabaId required for template management');
      return graph<{ success: boolean }>(
        `/${wabaId}/message_templates?name=${encodeURIComponent(name)}`,
        { method: 'DELETE', token: accessToken },
      );
    },
  };
}

export type MetaClient = ReturnType<typeof createMetaClient>;
