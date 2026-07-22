# Prompts de sessão — Carmo Local

Prompts prontos pra colar no início de novas sessões do Claude Code. Economizam exploração e mantêm consistência entre sessões.

## Como usar

1. **Toda nova sessão começa com:** `00-onboarding.md` (cole o conteúdo inteiro como primeira mensagem)
2. **Em seguida**, cole o prompt do sprint específico que vai trabalhar

Exemplo:
```
[cola 00-onboarding.md]

[cola 12-pwa-push.md]

Vamos começar o Sprint 12. Comece lendo o plano e os arquivos referenciados.
```

## Inventário

| Arquivo | Quando usar |
|---------|-------------|
| `00-onboarding.md` | **Sempre** — toda sessão nova começa por aqui |
| `11-referral-finalizacao.md` | ✅ **COMPLETO** — Sprint 11 implementado (backend + pages com dados reais) |
| `11-referral-finalizacao-producao.md` | Quando voltar pra finalizar: gerar CRON_SECRET, agendar cron, smoke test E2E (etapas operacionais) |
| `12-pwa-push.md` | Implementar PWA + web push notifications |
| `13-busca-semantica.md` | Implementar busca unificada com embeddings OpenAI + pgvector |
| `14-analytics-comerciante.md` | Implementar dashboard de métricas pro merchant |

## Princípios dos prompts

- **Self-contained** — não dependem de contexto da sessão anterior
- **Citam arquivos exatos** — reduz tempo de exploração
- **Listam pré-requisitos** — antes de codar
- **Têm ordem dia-a-dia** — não só "o quê", mas "em que ordem"
- **Cuidados explícitos** — armadilhas conhecidas (Next 16 quirks, RLS pegadinhas, custo de API)
- **DoD com critério final** — não basta "compilar", tem que entregar valor
