# Prompt de Integracao: Email Dispatcher Brevo

Use este prompt quando for integrar um novo projeto a este worker de emails:

```text
Integre este projeto ao dispatcher de emails Brevo que ja existe no Hail Mary.

Regras:
- Nao chamar a API da Brevo diretamente no app novo.
- Nao salvar chave Brevo no banco, fila, payload ou metadata.
- O app novo deve criar um job de email na fila Supabase usada pelo worker `email:deliveries`.
- Identifique o servico em `notifications.metadata.email_service`.
- O valor de `email_service` deve bater com uma chave configurada no `.env` do worker em `BREVO_SERVICES_JSON`.
- Sempre usar Brevo transacional.

Formato esperado:
- `notifications.title`: assunto do email.
- `notifications.body`: corpo em texto simples.
- `notifications.target_url`: URL absoluta ou path relativo ao `appUrl` do servico.
- `notifications.metadata.email_to`: destinatario explicito quando nao houver profile do Supabase Auth.
- `notifications.metadata.email_service`: identificador do servico, por exemplo `ingresso_facil`.
- `notifications.metadata.email_brand_name`: opcional, nome exibido no cabecalho do email.
- `notifications.metadata.email_cta_label`: opcional, texto do botao. Padrao: `Abrir no painel`.
- `notifications.metadata.email_footnote`: opcional, texto de rodape.
- `notifications.metadata.email_tags`: opcional, array de tags extras da Brevo.
- `notification_deliveries.channel`: `email`.
- `notification_deliveries.status`: `pending`.
- `notification_deliveries.provider`: `brevo`.

Exemplo de metadata:
{
  "email_service": "ingresso_facil",
  "email_to": "organizador@exemplo.com",
  "email_brand_name": "Ingresso Facil",
  "email_cta_label": "Abrir evento",
  "email_tags": ["organizer", "event"]
}

No worker, adicionar a conta Brevo no `.env`, por exemplo:
BREVO_SERVICES_JSON={"ingresso_facil":{"apiKey":"xkeysib-...","fromEmail":"contato@ingressofacil.online","fromName":"Ingresso Facil","appUrl":"https://ingressofacil.online","defaultTags":["ingresso_facil"]}}

Depois rodar:
pnpm --filter worker build
pm2 restart worker-email-deliveries --update-env
pm2 save
```

Observacoes:
- O servico default atual e `hail_mary`, usando `BREVO_API_KEY`, `BREVO_FROM_EMAIL`, `BREVO_FROM_NAME` e `APP_URL`.
- Se o worker receber `email_service` sem configuracao no `.env`, ele marca o delivery como `failed` para nao ficar preso em loop.
- Para trocar Brevo ou mover para um projeto separado no futuro, mantenha esse mesmo contrato de fila.
