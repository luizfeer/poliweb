# Múltiplas Faixas de Horário por Dia

## Objetivo

Permitir que um comércio cadastre mais de uma faixa de horário no mesmo dia (ex: manhã e noite), em vez de um único bloco contínuo.

**Exemplo de uso:**
- Segunda: 08:00–12:00 e 14:00–18:00

---

## O que foi alterado

### Frontend — `src/components/OpeningHoursEditor.vue`

**Antes:** cada dia exibia apenas um par de inputs (Abre / Fecha), sempre fixado em `intervals[0]`.

**Depois:**
- Todos os intervalos do array `intervals` são renderizados, um abaixo do outro.
- Botão **"Adicionar faixa"** (`add`) insere um novo intervalo padrão `08:00–18:00` no dia.
- Botão **"×"** (`remove_circle_outline`) ao lado de cada faixa remove aquela faixa. Se o usuário remover a última, um intervalo padrão é reinserido automaticamente para manter o estado consistente.
- Layout dos inputs mudou de `grid 2 colunas` para `grid 3 colunas (Abre | Fecha | Remover)`.
- "Copiar para todos" foi movido para a área de ações abaixo das faixas e copia **todas** as faixas do dia, não só a primeira.

### Backend — nenhuma alteração necessária

O backend (`poliwebapp-api`) já suportava múltiplos intervalos desde a criação do campo `opening_hours`. A estrutura `{ day, enabled, intervals: [{ open, close }] }` já aceita N intervalos por dia, com validação de sobreposição e formato.

### Utilitário JS — `src/js/openingHours.js`

Nenhuma alteração. As funções `normalizeOpeningHours`, `formatOpeningHours` e `getOpeningStatus` já iteram sobre todos os intervalos.

---

## Esforço

| Etapa | Tempo estimado |
|---|---|
| Análise da estrutura existente (back + front + utilitário) | ~20 min |
| Implementação no `OpeningHoursEditor.vue` | ~30 min |
| Documentação | ~10 min |
| **Total** | **~60 min** |

---

## Status

- [x] Implementado no front
- [ ] Testado em ambiente de staging/produção
- [ ] QA visual no mobile (Quasar)

---

## Data

2026-06-16
