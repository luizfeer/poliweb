export type WaTemplateCategory = 'UTILITY' | 'AUTHENTICATION' | 'MARKETING';

export type WaTemplateComponent =
  | {
      type: 'HEADER';
      format?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';
      text?: string;
      example?: { header_text?: string[]; header_handle?: string[] };
    }
  | {
      type: 'BODY';
      text: string;
      example?: { body_text: string[][] };
    }
  | { type: 'FOOTER'; text: string }
  | {
      type: 'BUTTONS';
      buttons: Array<
        | { type: 'QUICK_REPLY'; text: string }
        | { type: 'URL'; text: string; url: string; example?: string[] }
        | { type: 'PHONE_NUMBER'; text: string; phone_number: string }
      >;
    };

export type WaTemplate = {
  name: string;
  language: 'pt_BR' | 'en_US';
  category: WaTemplateCategory;
  components: WaTemplateComponent[];
};

export type WaSendTemplateInput = {
  to: string;
  templateName: string;
  language?: string;
  variables?: Record<string, string>;
  urlButtonVariables?: string[];
};

export type WaSendTextInput = {
  to: string;
  text: string;
  previewUrl?: boolean;
};

export type WaInboundMessage = {
  wamid: string;
  from: string;
  timestamp: string;
  type: 'text' | 'image' | 'audio' | 'video' | 'document' | 'location' | 'button' | 'interactive' | 'reaction' | 'sticker' | 'contacts';
  text?: { body: string };
  image?: { id: string; mime_type: string; sha256: string; caption?: string };
  interactive?: {
    type: 'button_reply' | 'list_reply';
    button_reply?: { id: string; title: string };
    list_reply?: { id: string; title: string; description?: string };
  };
};

export type WaStatusUpdate = {
  id: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  recipient_id: string;
  errors?: Array<{ code: number; title: string; message?: string }>;
};

export type WaWebhookPayload = {
  object: 'whatsapp_business_account';
  entry: Array<{
    id: string;
    changes: Array<{
      field: 'messages';
      value: {
        messaging_product: 'whatsapp';
        metadata: { display_phone_number: string; phone_number_id: string };
        contacts?: Array<{ wa_id: string; profile?: { name?: string } }>;
        messages?: WaInboundMessage[];
        statuses?: WaStatusUpdate[];
      };
    }>;
  }>;
};
