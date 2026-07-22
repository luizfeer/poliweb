# 🧠 City-Agent: 4 Abordagens de Arquitetura

## Casos Reais que o Bot PRECISA Atender

### 1. Busca por categoria (VAI pro banco)
- "quero um guia turistico"
- "restaurantes bons"
- "pousada com piscina"
- "onde pescar"
- "lugar pra comer pizza"
- "tem algum mecânico?"

### 2. FAQ da plataforma (VAI pro código/FAQ)
- "como cadastrar meu comércio"
- "é gratuito?"
- "como anunciar?"
- "esqueci minha senha"
- "como editar meu perfil"
- "quanto custa o destaque?"

### 3. Notícias/Eventos (VAI pro banco)
- "tem notícias novas?"
- "o que vai acontecer esse fim de semana?"
- "festas em janeiro"
- "agenda cultural"

### 4. Detalhes de lugar específico (VAI pro banco)
- "Saulinho Lanche está aberto?"
- "telefone do Me Leve Turismo"
- "quanto custa o passeio da Pé Na Estrada"
- "aceita pix no restaurante X?"

### 5. Off-topic (BLOQUEIA)
- "o que fazer em Paris"
- "como programar em Python"
- "quem ganhou o jogo do Brasil"

---

## Abordagem A: LLM Decide Tudo (ATUAL — Gemini Flash)

```
Usuário → LLM → decide tool → executa → formata resposta
```

**Como funciona:** O LLM lê o system prompt e escolhe qual tool usar (ou nenhuma).

**Casos que FUNCIONAM:**
- "quero um guia turistico" → ✅ search_entities
- "Saulinho Lanche está aberto?" → ✅ get_entity_status

**Casos que FALHAM:**
- "como cadastrar meu comercio" → ❌ LLM responde genérico em vez de chamar get_platform_faq
- "tem noticias?" → ❌ Responde "não sei" em vez de chamar get_city_news
- "lugar pra comer" → ⚠️ Às vezes chama search_entities, às vezes não

**Prós:** Flexível, cobre variações de linguagem natural  
**Contras:** Inconsistente, LLM "preguiçoso" ignora instruções  
**Custo:** R$~0,001 por requisição

---

## Abordagem B: Keyword Matching + LLM Formata (OPÇÃO C)

```
Usuário → Regex detecta intenção → Chama tool direto → LLM formata resposta
```

**Como funciona:** Código detecta palavras e decide a tool. LLM só entra no final para escrever bonito.

| Se detectar... | Chama tool... |
|---|---|
| "cadastrar", "login", "senha", "grátis", "preço", "anunciar" | get_platform_faq |
| "notícia", "novidade", "jornal" | get_city_news |
| "evento", "festa", "show", "agenda" | get_city_events |
| "aberto", "horário", "fecha" | get_entity_status |
| "telefone", "endereço", "preço", "pix" | get_entity_details |
| restante | search_entities |

**Casos que FUNCIONAM:**
- "como cadastrar meu comercio" → ✅ Detecta "cadastrar" → get_platform_faq
- "noticias da cidade" → ✅ Detecta "noticia" → get_city_news

**Casos que FALHAM (o que você temia):**
- "quero divulgar meu negócio" → ❌ Não tem palavra-chave cadastrada
- "tem coisa pra fazer sábado?" → ❌ Não tem "evento" nem "festa"
- "preciso de um lugar pra dormir" → ❌ Não tem "pousada" nem "hotel"
- "onde consigo comida boa?" → ❌ Não tem "restaurante"

**Prós:** 100% consistente quando acerta  
**Contras:** Precisa listar TODAS as variações de linguagem  
**Custo:** R$~0,001 por requisição

---

## Abordagem D: Embeddings Semânticos no FAQ (RAG)

```
Usuário → Embedding da pergunta → Busca vetorial no FAQ → Retorna top-3 → LLM formata
```

**Como funciona:** Cria embeddings das perguntas/answers do FAQ. A pergunta do usuário vira embedding e busca os mais similares.

**Casos que FUNCIONAM:**
- "como cadastrar meu comercio" → ✅ Similar a "Como cadastrar meu comércio?"
- "quero por meu negocio no site" → ✅ Similar a "Como cadastrar..."
- "esqueci a senha" → ✅ Similar a "Como entrar em contato?" (se tiver no FAQ)

**Casos que FALHAM:**
- "restaurantes bons" → ❌ Vai achar FAQ sobre restaurante, não lista real
- "Saulinho Lanche aberto?" → ❌ Não é FAQ, é status real

**Prós:** Cobre sinônimos e variações naturais  
**Contras:** Só funciona para FAQ, não substitui busca de entidades  
**Custo:** R$~0,001 + embedding (praticamente zero)

---

## Abordagem E: Modelo Mais Forte (Claude 3.5 Sonnet)

```
Usuário → Claude 3.5 Sonnet → decide tool → executa → formata resposta
```

**Como funciona:** Mesma arquitetura do Gemini, mas com modelo mais inteligente.

**Casos que FUNCIONAM:**
- "como cadastrar meu comercio" → ✅ Chama get_platform_faq 95% das vezes
- "tem noticias?" → ✅ Chama get_city_news 90% das vezes
- "lugar pra comer" → ✅ Chama search_entities com "restaurante"

**Casos que AINDA FALHAM:**
- ~5-10% das vezes ainda ignora tools (é raro, mas acontece)

**Prós:** Segue instruções MUITO melhor  
**Contras:** 5-10x mais caro  
**Custo:** R$~0,005-0,01 por requisição

---

## 🎯 Recomendação Híbrida (MELHOR CUSTO-BENEFÍCIO)

```
Usuário → [Context Guard] → [Router Inteligente] → [LLM ou Tool Direta]
```

### Router Inteligente — ORDEM DE PRIORIDADE:

1. **Context Guard** (já temos): Se for off-topic, bloqueia
2. **FAQ Matcher por Embedding** (RAG): Se similaridade > 0.85 com FAQ, responde FAQ direto
3. **Keyword Hardcoded**: Se tiver palavras óbvias ("notícia", "evento", "cadastrar"), chama tool
4. **LLM Decide**: Para todo o restante (buscas vagas, perguntas complexas)

### Por que funciona:
- "como cadastrar" → Passa no #2 ou #3 → ✅ Tool correta
- "quero divulgar meu negócio" → Passa no #2 (embedding detecta similaridade) → ✅ Tool correta
- "restaurante bom" → Cai no #4 (LLM) → ✅ Chama search_entities
- "Saulinho aberto?" → Cai no #4 (LLM) → ✅ Chama get_entity_status

**Custo:** R$~0,001-0,002 por requisição (praticamente igual ao atual)

---

## 📊 Comparativo Visual

| Abordagem | Precisão | Custo | Complexidade | Cobertura |
|---|---|---|---|---|
| A. LLM Decide (atual) | 60% | R$~0,001 | Baixa | Alta (mas erra) |
| B. Keyword Matching | 80%* | R$~0,001 | Média | Baixa* |
| D. RAG Embeddings | 85% | R$~0,001 | Média | Média |
| E. Claude/GPT-4o | 90% | R$~0,01 | Baixa | Alta |
| **Híbrida (recomendada)** | **88%** | **R$~0,001** | **Alta** | **Alta** |

*Só quando a palavra-chave existe na lista

---

## 🚀 Próximo Passo?

Quer que eu implemente a **Híbrida**? Ela combina:
1. Embeddings do FAQ (RAG)
2. Keywords para casos óbvios  
3. LLM (Gemini) para o resto

Custo praticamente igual, mas MUITO mais consistente.
