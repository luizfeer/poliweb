"use server";

import { headers } from "next/headers";

export type LeadFormState = {
  ok: boolean;
  message: string;
};

const initialState: LeadFormState = {
  ok: false,
  message: "",
};

export { initialState as leadFormInitialState };

export async function submitLeadAction(
  _previousState: LeadFormState,
  formData: FormData,
): Promise<LeadFormState> {
  const email = normalize(formData.get("email"));
  const consent = formData.get("consent") === "on";

  if (!email || !email.includes("@")) {
    return { ok: false, message: "Informe um email valido." };
  }

  if (!consent) {
    return { ok: false, message: "Aceite a politica de privacidade para enviar." };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      ok: false,
      message: "Formulario ainda sem configuracao de Supabase neste ambiente.",
    };
  }

  const requestHeaders = await headers();
  const payload = {
    source: normalize(formData.get("source")) || "cidadeviva_lp",
    form_type: normalize(formData.get("form_type")) || "landing_page",
    name: normalize(formData.get("name")),
    email,
    phone: normalize(formData.get("phone")),
    business_name: normalize(formData.get("business_name")),
    city: normalize(formData.get("city")),
    message: normalize(formData.get("message")),
    consent,
    page_path: normalize(formData.get("page_path")) || "/",
    user_agent: requestHeaders.get("user-agent"),
  };

  const response = await fetch(`${supabaseUrl}/rest/v1/cidadeviva_leads`, {
    method: "POST",
    headers: {
      apikey: supabaseAnonKey,
      authorization: `Bearer ${supabaseAnonKey}`,
      "content-type": "application/json",
      prefer: "return=minimal",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    return {
      ok: false,
      message: "Nao foi possivel enviar agora. Tente novamente em instantes.",
    };
  }

  return {
    ok: true,
    message: "Recebido. Vou te chamar para apresentar o Carmelitano e o modelo Cidade Viva.",
  };
}

function normalize(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
