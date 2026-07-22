# Carmo Local — Design System

> Portal Hiperlocal de Carmo do Rio Claro/MG — utilidade pública, turismo (Furnas/Canastra), agenda, comunidade, transparência e comércio local. Padrão visual inspirado no app da Amazon: denso, prático, com banners promocionais, ícones de categoria e listagens curtas — mas com identidade própria do interior mineiro.

**Status do nome:** ainda sem nome final. Trabalhamos com **"Carmo Local"** como placeholder. Outros candidatos: *Praça* (referência à praça central da cidade), *No Carmo*, *DaCidade*, *Quitanda*. Trocar quando o usuário decidir.

## Sources

- **Codebase:** `luizfeer/hail-mary` (GitHub) — Next.js 16 + Tailwind v4 + shadcn/ui + Supabase. Estágio Sprint 0 (scaffold). UI ainda não foi desenhada — esse design system **define** a direção visual; não documenta uma já existente.
- **Pasted brief:** plano estratégico do Portal Hiperlocal (5 camadas: serviços públicos, transparência, turismo, comércio, comunidade).
- **Reference screenshots:** `uploads/IMG_2329.PNG` … `IMG_2333.PNG` — capturas do app da Amazon.com.br (banner 5.5, cupons, categorias, recomendações, parceria HBO/Prime). São referência de **densidade e padrão de layout**, não de marca.

## Index

| Arquivo | Para quê |
|---|---|
| `README.md` | (este arquivo) — contexto, fundamentos de conteúdo, fundamentos visuais, iconografia |
| `colors_and_type.css` | Tokens CSS — paleta, tipografia, raios, sombras, espaçamentos |
| `SKILL.md` | Skill compatível com Agent Skills (Claude Code) |
| `assets/` | Logos, marcas, ícones, banners de exemplo |
| `fonts/` | (Google Fonts via CDN — sem arquivos locais; documentado abaixo) |
| `preview/` | Cards do Design System (paleta, type, components, etc) |
| `ui_kits/app/` | UI kit do app mobile — `index.html` + componentes JSX |

## Five layers of the product (refresher)

1. **Serviços públicos** — coleta de lixo, água/energia, saúde, trânsito, telefones úteis (gancho de retenção)
2. **Transparência** — Diário Oficial municipal resumido por IA, atas da câmara, licitações, obras
3. **Turismo** — pousadas, passeios na represa de Furnas, pesca, restaurantes, eventos (camada comercial mais forte)
4. **Comércio local** — guia comercial, promoções, classificados, prestadores
5. **Comunidade** — agenda, achados/perdidos, pets, obituários, comunicados de bairro

Três papéis (do CLAUDE.md do repo): `admin`, `merchant` (comerciante), `citizen` (cidadão). Default no signup é `citizen`.

---

## CONTENT FUNDAMENTALS

**Idioma e voz**

- **Sempre PT-BR.** Toda string de UI em português brasileiro. Código em inglês (do CLAUDE.md do repo).
- **Sotaque interior, não bairro chique.** "Hoje em Carmo", "Aqui pertinho", "No bairro", "Da nossa cidade". Evitar anglicismos desnecessários (*hub*, *tap*, *swipe*) — preferir "central", "toque", "deslize".
- **Tratamento "você", nunca "tu" nem "vós".** Direto, próximo, sem formalidade artificial. Em comunicados oficiais (prefeitura, câmara) o tom muda para neutro institucional, sempre com badge de fonte.
- **Sem gírias datadas.** "Bombar", "top", "manda ver" — não. O público é amplo (do adolescente ao idoso de 70 anos que abre o app pra ver o calendário da coleta).

**Casing**

- **Sentence case em títulos e labels.** "Coleta de lixo" — não "Coleta de Lixo".
- **EXCEÇÕES em title case:** nomes próprios da cidade ("Ilha do Chico", "Lagoa da Prata", "Serra da Canastra", "Represa de Furnas"), nomes de estabelecimentos, nomes de eventos oficiais ("Festa do Padroeiro").
- **MAIÚSCULAS:** apenas em badges curtos de oferta ("FRETE GRÁTIS", "OFERTA RELÂMPAGO", "NOVO") e abreviações (UBS, SAMU, IPTU). Evitar em corpo de texto.

**Tom por contexto**

| Contexto | Tom | Exemplo |
|---|---|---|
| Serviços públicos | Direto, factual | "A coleta na sua rua é amanhã, terça-feira." |
| Turismo | Caloroso, convidativo | "Conheça as praias da Represa — 14 pontos pra banhar." |
| Transparência | Neutro, com fonte explícita | "A câmara aprovou esta semana 3 projetos. Resumido por IA — ver original." |
| Comércio | Promocional, mas sem caps lock | "30% off em pizzaria do centro — só hoje." |
| Comunidade | Próximo, empático | "Bidu sumiu na rua das Acácias. Ajude a encontrar." |

**Conteúdo gerado por IA**

- Sempre acompanhado do badge: **"Resumido por IA — sujeito a verificação"** + link para a fonte original (do CLAUDE.md).
- Nunca distorcer, opinar ou tomar partido em conteúdo de transparência. IA resume, não interpreta.

**Datas e números**

- Datas em português: "ter, 5 mai" (lista) ou "terça-feira, 5 de maio" (detalhe). Fuso `America/Sao_Paulo`.
- Hora: 24h, "14:30".
- Moeda: `R$ 1.069,00` — `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`.
- Distância: km com vírgula ("2,4 km"). Nunca "mi".

**Emoji**

- **Não usar emoji em UI estrutural** (botões, navegação, títulos, status). Usa-se ícones SVG do conjunto Lucide.
- **Permitido** em conteúdo gerado por usuário (UGC) e em alguns comunicados de comunidade leves ("Achados e perdidos 🐶") — mas com parcimônia.
- **Nunca** em transparência, serviços públicos ou notas oficiais.

**Copy de exemplo** (use como espelho ao escrever novas strings)

- CTA primário: "Ver tudo" / "Abrir" / "Reservar" / "Ligar agora"
- CTA secundário: "Mais detalhes" / "Como chegar" / "Adicionar à agenda"
- Estado vazio: "Nada por aqui ainda. Volte amanhã." (não usar "Ops!" ou "Oops!")
- Erro: "Não rolou. Tente de novo em alguns segundos." (humano, sem "Ocorreu um erro inesperado")
- Carregando: "Carregando…" (simples; sem skeleton-text criativo)
- Vazio em busca: "Nada encontrado para *consulta*. Tente outras palavras."
- Confirmação destrutiva: "Tem certeza? Isso não pode ser desfeito."

**LGPD**

- Nunca exibir CPF, endereço residencial completo, dados de saúde individuais (CLAUDE.md). Boletins de polícia sempre anonimizados.

---

## VISUAL FOUNDATIONS

**Filosofia**

Denso como Amazon, mas com **respiro mineiro**. Cards justapostos com pequenos gaps; banners cheios de cor; mas sempre uma faixa de tipografia sóbria por cima — pra parecer cidade (não shopping). A laranja-Amazon foi calibrada pra um tom mais terroso (telha/argila), referenciando o solo da Canastra e o avermelhado do entardecer na Represa.

**Cores**

| Token | Valor | Uso |
|---|---|---|
| `--carmo-clay-500` | `#E0561B` (oklch ~0.66 0.18 40) | **Primária**. Banners promocionais, CTAs, badges de oferta, ícones em destaque. Versão "telha" da laranja Amazon. |
| `--carmo-clay-600` | `#C84810` | Hover/pressed da primária |
| `--carmo-clay-50` | `#FFF1E8` | Tinted backgrounds, chips selecionados |
| `--carmo-cerrado-700` | `#1F4A2C` | **Secundária verde-canastra** — turismo, eventos, "natureza", confirmações |
| `--carmo-cerrado-100` | `#E1EEDE` | Tags de turismo, fundos de blocos |
| `--carmo-sun-500` | `#F4B73A` | **Acento amarelo** — destaque sutil, estrelas, ratings, "novo" |
| `--carmo-sky-700` | `#0F4C81` | Links, botões secundários, cidadania/transparência |
| `--carmo-discount` | `#C81E4A` | Badge "X% off" — somente para descontos. Magenta-vinho, NÃO o vermelho destrutivo. |
| `--carmo-destructive` | `#B23A3A` | Erros e ações destrutivas |
| `--carmo-ink-900` | `#191919` | Texto principal |
| `--carmo-ink-600` | `#5A5A5A` | Texto secundário, metadados |
| `--carmo-ink-300` | `#C9C9C9` | Bordas suaves, separadores |
| `--carmo-paper` | `#FAF8F5` | Background "página" (off-white quentinho, não branco frio) |
| `--carmo-paper-card` | `#FFFFFF` | Background de card |
| `--carmo-paper-deep` | `#F2EEE7` | Faixa de seções, footer |

**Vibe das imagens:** quentes, levemente saturadas, com um amarelado dourado (entardecer na Represa, sol no Cerrado). Evitar fotos cool/azuis. Para banners promocionais, fundo de cor sólida (a laranja-telha) com produto recortado em primeiro plano — exatamente o padrão da Amazon, mas com a cor mais terrosa.

**Tipografia**

Stack principal **"Inter"** já vem no codebase (Geist Sans / Geist Mono via `next/font/google`). Vou propor um upgrade:

- **Display / Headings: `Fraunces`** (Google Fonts) — serifa contemporânea com personalidade, ressoa "cidade histórica" sem virar caricatura colonial. Pesos: 600 (semi), 800 (display).
- **UI / Body: `Inter`** (Google Fonts) — sem-serifa neutra, ótima legibilidade em densidade alta.
- **Mono: `JetBrains Mono`** — códigos, números técnicos (raro no app).

Sim, *Inter* foi flagada como "fonte usada demais" no nosso guideline interno. **A FLAG:** mantemos Inter por compatibilidade com o codebase (Geist é parecida e já tá lá), mas considerar `Manrope` ou `Plus Jakarta Sans` como alternativa em uma iteração futura. O usuário deve sinalizar se prefere trocar.

**Escala** (mobile-first, base 16px)

| Token | Tamanho | Line | Uso |
|---|---|---|---|
| `--text-display` | 32 / 28 | 1.05 | Telas de boas-vindas, headers de turismo full-bleed |
| `--text-h1` | 24 | 1.15 | Títulos de tela |
| `--text-h2` | 20 | 1.2 | Cabeçalhos de seção ("Aprovéite: Ofertas", "Categorias") |
| `--text-h3` | 17 | 1.3 | Títulos de card |
| `--text-body` | 15 | 1.45 | Corpo de texto, descrições |
| `--text-sm` | 13 | 1.4 | Metadados, labels, captions |
| `--text-xs` | 11 | 1.3 | Badges, distância, "Ofertas 5.5" |

**Espaçamentos** (escala de 4px)

`4 8 12 16 20 24 32 40 56 80` — usar variáveis `--sp-1` … `--sp-9`.

**Cantos / raios**

- `--radius-xs: 4px` — chips, badges retangulares
- `--radius-sm: 8px` — botões pequenos, inputs
- `--radius-md: 12px` — botões padrão, ícones de categoria (na verdade `--radius-full` pra eles)
- `--radius-lg: 16px` — cards de produto, banners
- `--radius-xl: 20px` — cards grandes, modais
- `--radius-full: 999px` — chips de localização, pills de filtro, ícones circulares de categoria, busca

Cards usam **16px**. Banners promocionais usam **16px** com clipping interno. Botão primário: **8px**.

**Sombras**

Sutis. Estamos num app mobile denso — sombras pesadas viram visual ruído.

- `--shadow-card: 0 1px 2px rgba(25,25,25,0.04), 0 0 0 1px rgba(25,25,25,0.06)` — borda + sombra mínima nos cards
- `--shadow-pop: 0 8px 24px rgba(25,25,25,0.10)` — menus, modais, action sheets
- `--shadow-banner: 0 2px 6px rgba(192,72,16,0.18)` — banners coloridos com leve glow da própria cor
- **Inner shadows:** evitar.

**Bordas**

- Card: `1px solid rgba(25,25,25,0.06)` (basicamente só pra separar de background paper).
- Input: `1px solid var(--carmo-ink-300)`, focus muda para `--carmo-clay-500` com `box-shadow: 0 0 0 3px var(--carmo-clay-50)`.
- Separadores de seção: `1px solid var(--carmo-paper-deep)`.

**Backgrounds**

- Página: `--carmo-paper` (off-white quente).
- Cards: branco puro.
- Banners promocionais: cor sólida (laranja-telha, verde-canastra, ou azul-sky), com produto/imagem em primeiro plano. **Não gradientes**, exceto um caso: hero de turismo pode usar overlay escuro `linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.6))` sobre foto pra texto branco ficar legível.
- Faixa de seção (entre blocos densos): `--carmo-paper-deep`, dá pausa visual.
- Padrão repetido / textura: **não usar.** Mantém limpo.

**Animação**

- **Easing:** `cubic-bezier(0.2, 0.8, 0.2, 1)` (out-quint suave) é o default. Tudo que abre/aparece usa isso.
- **Durações:** `120ms` micro (hover/press), `200ms` padrão (fade, slide curto), `320ms` modais e action sheets.
- **Fades sim, bounces não.** Pode haver um leve `scale(0.98 → 1)` em modais que aparecem, mas sem overshoot.
- Carrosséis horizontais: scroll-snap, sem animação automática (chato e gasta dado móvel).

**Estados**

| Estado | Tratamento |
|---|---|
| Hover (desktop, raro) | `opacity: 0.92` em ícones; `background` 8% mais escuro em botões e cards |
| Press | `transform: scale(0.97)` + `opacity: 0.9` em 80ms; cor primária um shade mais escuro |
| Focus visível | `outline: 2px solid var(--carmo-clay-500); outline-offset: 2px` |
| Selecionado (chip, tab) | Fundo `--carmo-clay-50`, borda `--carmo-clay-500`, texto `--carmo-clay-600` |
| Disabled | `opacity: 0.4`, sem mudança de cor |
| Loading | Skeleton em `--carmo-paper-deep` com leve pulso (opacity 0.5 ↔ 1, 1.4s) |

**Layout**

- **Mobile-first.** Largura de design = 390px (iPhone moderno). Densidade alta.
- **Bottom tab bar fixa**, 4 itens (Início, Conta, Carrinho, Menu) — 56px altura, separador superior, ícones 24px + label 11px. Ativo = `--carmo-clay-500`, inativo = `--carmo-ink-600`.
- **Header sticky** com busca + chips de localização (CEP/cidade), 100–110px de altura quando expandido, encolhe ao rolar.
- **Carrosséis horizontais** com scroll-snap, mostrando 1.2× ou 2.2× cards (preview do próximo). Padding lateral 16px.
- **Grid de categorias**: 5 colunas no mobile, ícones circulares de 56px com label de 12px.
- **Espaçamento entre seções:** 24px vertical.

**Transparência e blur**

- Backdrop blur somente em: action sheets (`backdrop-filter: blur(8px)` no overlay), e na search bar quando o header faz transição sticky (efeito glass sutil).
- Não abusar — performance em mobile importa.

**Cards (recapitulando)**

- Branco puro
- Raio 16px (12px nos pequenos)
- Borda + sombra mínimas
- Padding interno 12–16px
- Imagem topo full-width (raio só nos cantos superiores)
- Título 15–17px medium, preço destacado em 17px bold com `R$` menor sobrescrito (estilo Amazon)
- Badge de desconto absoluto no canto inferior-esquerdo da imagem ou abaixo do preço

---

## ICONOGRAPHY

**Sistema escolhido: Lucide** (CDN — `lucide.dev`).

Por quê: o codebase usa shadcn/ui que combina nativamente com Lucide. Stroke 1.75px, 24×24, estética limpa que combina com a tipografia Inter. Não vamos hand-rollar SVGs.

**Como usar**

- No HTML estático (preview e UI kit): incluir via CDN `<script src="https://unpkg.com/lucide@latest"></script>` e marcar com `<i data-lucide="map-pin"></i>`.
- No app real (Next.js): `import { MapPin } from "lucide-react"`.
- **Tamanhos:** 16px (inline em texto), 20px (input/buttons), 24px (default), 32px (categorias grandes).
- **Stroke uniforme** em todo app: `stroke-width: 1.75`. Não misturar pesos.
- **Cor:** herda `currentColor`. Em ícones de categoria, usar laranja-telha sobre fundo `--carmo-clay-50` (círculo).

**Ícones-chave por camada**

| Camada | Ícones (Lucide) |
|---|---|
| Serviços públicos | `trash-2` (lixo), `droplet` (água), `zap` (energia), `heart-pulse` (saúde), `traffic-cone` (trânsito), `phone-call` (telefones úteis) |
| Transparência | `landmark` (câmara), `file-text` (DO), `gavel` (licitações), `hard-hat` (obras) |
| Turismo | `mountain-snow`, `fish` (pesca), `tent` (camping), `utensils-crossed` (gastronomia), `bed` (pousadas), `map` |
| Comércio | `store`, `tag` (promoções), `truck` (delivery), `wrench` (prestadores) |
| Comunidade | `calendar-days`, `paw-print` (pets), `flower-2` (obituários), `users` (associações) |
| Sistema | `search`, `map-pin`, `chevron-right`, `bell`, `user`, `shopping-cart`, `menu`, `home` |

**Emoji:** ver seção CONTENT FUNDAMENTALS — não em UI estrutural.

**Logos e marca**

- `assets/logo-mark.svg` — símbolo (sol nascendo sobre montanha, redutível). Cor: `--carmo-clay-500`.
- `assets/logo-lockup.svg` — símbolo + wordmark "Carmo Local" (ou nome final).
- `assets/logo-mono.svg` — versão monocromática para fundos coloridos.

**Substituições flagadas**

- **Fontes:** Fraunces e Inter via Google Fonts CDN. Nenhum arquivo `.ttf`/`.woff2` local. Se o usuário quiser self-host (recomendado para perf real), precisamos baixar.
- **Logo:** símbolo placeholder até definição de marca. **Pedir ao usuário** decisão de nome + logo final.
- **Fotos:** os banners de exemplo usam ilustrações vetoriais e composições com texto + cor sólida. **Pedir ao usuário** fotos reais (Represa de Furnas, Ilha do Chico, praça de Carmo) quando tiver.
