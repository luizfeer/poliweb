# Sprint 11 — Passagens de ônibus (Sul Minas / ex-Santa Cruz)

> **Status:** rascunho. Cidade-foco: Carmo do Rio Claro/MG.
> **Codinome curto:** `passagens`.
> **Dependências:** módulo `transport` novo em `city_modules`; perfil `merchant` (agência) opcional; PIX integrado no portal (planejado em sprint 10).

---

## 1. Por que entrar nesse mercado

- Carmo do Rio Claro não tem rodoviária digital. Hoje, o passageiro liga, vai no balcão da Sul Minas (ex-Santa Cruz) na praça, ou compra com revendedor informal.
- Sul Minas opera os trechos regionais que importam pra cidade: **Carmo ↔ Alfenas**, **Passos**, **Poços de Caldas**, **Varginha**, **BH (Tietê via Pouso Alegre)** e **São Paulo (Tietê)**.
- Ticket médio R$ 35–R$ 180. Volume estimado: ~80–150 vendas/dia entre os 3 PdVs físicos da cidade. Capturar 20% disso já paga o módulo.
- Encaixa no posicionamento "tudo da cidade num app só" — combina com turismo, agenda e comércio.

## 2. Como ganhar dinheiro (modelos de comissão)

Três caminhos, do mais rápido pro mais lucrativo:

### A. Afiliado de marketplace de passagem (rápido, baixa fricção)

| Plataforma | Comissão | Tem Sul Minas? | Integração |
|---|---|---|---|
| **ClickBus** (programa de afiliados) | **5%–8%** sobre valor da passagem | Sim, parcial | Link de afiliado + API de busca (B2B) |
| **Distribusion / Quero Passagem** | **6%–10%** | Sim, no inventário regional | API REST B2B (auth OAuth) |
| **Embarca Aí** | até **10%** | Apenas regiões selecionadas | API |
| **Buser** | variável (foco fretamento) | Não tem rota CRC | n/a |

> Recomendação MVP: **ClickBus + Distribusion em paralelo**, comparando preço e disponibilidade. Quem tiver o melhor horário/preço aparece primeiro. Sem CNPJ rodoviário, sem custódia financeira, sem risco operacional.

### B. Credenciamento direto como agência Sul Minas (médio prazo)

- Comissão típica: **8%–12%** sobre passagens vendidas + bonificação por meta mensal.
- Repasse: quinzenal ou mensal, mediante prestação de contas.
- Requisitos: CNPJ ativo, alvará municipal, ponto físico ou digital homologado, capital de giro (você adianta o pagamento, recebe depois) e treinamento no sistema interno deles (geralmente um WebApp ou planilha).
- Caminho: **diretoria comercial regional em Pouso Alegre / Varginha** (não tem programa nacional formal). Contato precisa ser direto, comercial humano.
- Vantagem: comissão bruta maior + acesso a horários e ofertas que o marketplace não mostra (encomendas, fretamento, viagens locais).

### C. Plataforma white-label (longo prazo, virar PdV digital próprio)

- **Vexado**, **Wmais**, **Bilhete a Bordo** licenciam plataforma SaaS pra agências.
- Custo: mensalidade + setup; em troca a comissão líquida sobe (12%–15%) porque você opera o checkout.
- Faz sentido só quando o volume justificar (>500 vendas/mês na cidade).

### D. Receita extra do portal — taxa de conveniência

Em **todos** os modelos, o portal pode cobrar uma **taxa de conveniência de R$ 2,90–R$ 4,90 por passagem** (padrão de mercado, ClickBus cobra ~R$ 3,50). Essa taxa é **100% receita do portal**, somada à comissão do operador. É o que paga o gateway PIX e a operação.

> **Estratégia recomendada:** começar como afiliado ClickBus (1–2 semanas pra entrar) → em paralelo abrir conversa direta com Sul Minas regional → migrar pra credenciamento direto quando tiver volume e CNPJ.

## 3. Escopo MVP (front mockado primeiro)

Front 100% navegável com dados mock. Quando a integração afiliada chegar, troca a fonte de dados sem mexer na UI.

### 3.1 Rotas públicas

| Rota | Função |
|---|---|
| `/passagens` | Hero + form de busca (origem fixa Carmo, destino, data, passageiros) + destinos populares + horários do dia + info Sul Minas |
| `/passagens/buscar` | Lista de horários (ida) com empresa, duração, preço, "selecionar" |
| `/passagens/[id]` | Detalhe da viagem + mapa de assentos (mock visual) |
| `/passagens/checkout` | Dados do passageiro + escolha de pagamento (PIX/cartão) |
| `/passagens/confirmacao/[code]` | Bilhete digital + QR + instruções de embarque |

### 3.2 Painel do cidadão

- `/painel/passagens` — histórico de compras, bilhete digital re-emitido, status (paga / cancelada / utilizada).

### 3.3 Painel admin (super_admin / city_admin)

- `/painel/super/passagens` — relatório de vendas, comissão acumulada, ticket médio, rotas mais vendidas.
- (Pós-MVP) Painel da agência credenciada: prestação de contas Sul Minas.

## 4. Modelo de dados (proposta — não migrar ainda)

```sql
-- module_transport: bus_routes, bus_schedules, bus_tickets, bus_orders
-- (planejar quando a integração afiliada estiver decidida)

bus_operators (id, name, slug, logo_url, contact)             -- "Sul Minas", "Cristo Rei", etc
bus_routes (id, city_id, origin_terminal, destination_city,
            destination_terminal, distance_km, duration_min)
bus_schedules (id, route_id, operator_id, departure_time,
               arrival_time, price_cents, days_of_week,
               vehicle_class, source, source_ref)            -- source: 'clickbus'|'distribusion'|'manual'
bus_orders (id, city_id, citizen_profile_id, status,
            total_cents, fee_cents, commission_cents,
            payment_method, payment_ref, created_at)
bus_tickets (id, order_id, schedule_id, travel_date,
             passenger_name, passenger_doc_masked, seat,
             ticket_code, qr_payload, status)
```

LGPD: `passenger_doc_masked` armazena só os 3 últimos dígitos do CPF (`***.***.***-12`). CPF completo nunca persiste no portal — vai direto pro provedor via API criptografada e some.

## 5. Integração financeira

- **Gateway recomendado:** Asaas ou Pagar.me (PIX + cartão + split).
- **Split automático** quando entrar credenciamento direto: X% pra Sul Minas, Y% taxa de conveniência pro portal, Z% comissão pro portal.
- Reembolso: regra do operador (geralmente até 3h antes da viagem com taxa de 5%). Portal não decide, replica a regra.

## 6. Checklist Definition of Done

- [ ] Plano aprovado com modelo de comissão escolhido
- [ ] Front mockado: 5 rotas públicas navegáveis (`/passagens`, `/buscar`, `/[id]`, `/checkout`, `/confirmacao`)
- [ ] Mock visual responsivo (mobile-first, design Carmo)
- [ ] Conversa aberta com ClickBus (cadastro afiliado) **e** com regional Sul Minas (credenciamento)
- [ ] Decisão sobre gateway de pagamento
- [ ] Migration `2026XXXXXXXXXX_transport.sql` (após ter dados reais)
- [ ] Server Actions com Zod (após ter integração)
- [ ] Page `/painel/passagens` (histórico)

## 7. Riscos vivos

- **Sul Minas pode não estar 100% no marketplace afiliado** → começa com horários parciais; no front, sempre exibir "horários parciais — consulte rodoviária local" enquanto não houver credenciamento direto.
- **Repasse de comissão demora** → manter caixa pra cobrir 30–45 dias entre venda e recebimento se for credenciamento direto.
- **Cancelamento de viagem** (chuva, deslizamento na MG-050) → operacional 24/7 que não temos no MVP. Por enquanto: redirecionar pra contato Sul Minas, sem assumir responsabilidade.
- **LGPD CPF** → nunca persistir CPF completo. Validar com DPO antes do go-live.

## 8. Próximos passos imediatos

1. Aprovar este plano e o modelo de comissão (afiliado primeiro).
2. Cadastrar CNPJ do portal no programa de afiliados ClickBus.
3. Front mockado em produção (`/passagens` ligado quando o módulo `transport` estiver enabled em `city_modules`).
4. Mensagem comercial pra Sul Minas regional (Pouso Alegre / Varginha).
