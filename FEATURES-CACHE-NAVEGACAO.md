# Features de cache e navegacao

Este documento registra as melhorias adicionadas para reduzir skeletons, esperas de API e reloads indesejados durante a navegacao.

## TanStack Query para Vue

Foi adicionado o pacote oficial:

```bash
@tanstack/vue-query
```

O boot fica em:

```text
src/boot/vue-query.js
```

Configuracao atual do `QueryClient`:

- `staleTime`: 5 minutos por padrao.
- `gcTime`: 1 hora.
- `refetchOnWindowFocus`: desativado.
- `retry`: 1 tentativa.

O boot foi registrado em:

```text
quasar.conf.js
```

## Cache de categorias por cidade

Arquivo principal:

```text
src/store/categories/actions.js
```

A action `categories/fetchCategories` agora usa TanStack Query com a key:

```js
['city-categories', cityId]
```

Comportamento:

- Cache por cidade.
- `staleTime` especifico de 30 minutos.
- Reaproveita dados ja carregados ao voltar entre rotas.
- Evita requests duplicadas para a mesma cidade.
- Mantem Vuex como ponte para telas antigas que ainda leem `store.categories.list`.
- Mantem `localStorage` para hidratar a lista inicial ao abrir/recarregar o app.

Persistencias usadas:

```text
categoriesCache
categories
```

`categoriesCache` guarda os dados por `cityId`. `categories` foi mantido por compatibilidade com telas antigas que ainda leem essa chave diretamente.

## Cache da rota de categoria

Arquivo:

```text
src/pages/Categories.vue
```

A pagina `/categorias/:id` agora cacheia os anuncios da categoria com TanStack Query usando a key:

```js
['category-ads', String(categoryId)]
```

Comportamento:

- Ao entrar em uma categoria, os anuncios sao buscados em `/categories/:id/ads?nonDeleted=true`.
- Ao abrir um anuncio e voltar para a categoria, a pagina renderiza os anuncios cacheados imediatamente.
- Se houver cache, o skeleton nao aparece.
- O cache da lista de anuncios da categoria fica fresh por 5 minutos.
- Se uma atualizacao em background falhar e ja existir cache, a lista nao e apagada e o usuario nao e redirecionado para a Home.

Tambem foi ajustada a resolucao do nome da categoria para reaproveitar:

```js
store.dispatch('categories/fetchCategories', { loc: { id: cityId } })
```

Assim a pagina evita chamar `/cities/:id/categories?nonDeleted=true` diretamente quando o dado ja existe no cache compartilhado.

## Reload automatico em desenvolvimento

Arquivo:

```text
src-pwa/register-service-worker.js
```

Antes, quando o service worker detectava uma atualizacao, a notificacao chamava:

```js
location.reload(true)
```

Isso podia causar reload completo no ambiente de desenvolvimento.

Comportamento atual:

- Em `process.env.DEV`, o service worker nao e registrado.
- Em `process.env.DEV`, qualquer service worker antigo encontrado e desregistrado.
- Em producao, a notificacao de nova versao nao recarrega sozinha.
- Em producao, o reload so acontece se o usuario clicar na acao `Atualizar`.

## Ecommerce: telefones ativos e UI da loja

Arquivos:

```text
src/pages/ViewEcommerce.vue
src/pages/EditEcommerce.vue
```

### Filtro de telefones removidos

O ecommerce agora ignora telefones com `deletedAt` ao escolher o WhatsApp da loja.

Antes, um numero removido podia continuar sendo usado em:

- Botao de WhatsApp da loja.
- Finalizacao de pedido pelo carrinho.
- Validacao do painel de ecommerce.

Comportamento atual:

- `phoneZap` usa apenas telefones ativos.
- O carregamento do anuncio filtra `phones` com `!deletedAt`.
- O painel de edicao tambem considera apenas WhatsApp ativo para liberar ecommerce.
- Se a loja nao tiver WhatsApp ativo, o checkout fica desabilitado e mostra aviso.
- O botao de WhatsApp da loja avisa o usuario quando nao existe WhatsApp ativo.

### Melhorias de usabilidade da loja

A pagina publica da loja recebeu controles para facilitar navegacao em lojas com muitos produtos:

- Resumo com total de produtos e categorias.
- Campo de busca por produto.
- Filtro horizontal por categoria.
- Estado vazio quando nenhum produto corresponde aos filtros.
- Acao para limpar filtros.
- Estado vazio quando a loja nao possui produtos ativos.
- Tratamento visual para botao de WhatsApp indisponivel.
- Cards de produto com acao de carrinho compacta e circular, substituindo o botao retangular largo.
- Badge de quantidade diretamente no botao circular quando o item ja esta no carrinho.
- Clique no card abre a pagina de detalhe do produto em `/loja/:id/produto/:productId`.
- A pagina de produto usa o mesmo JSON do ecommerce (`title`, `subtitle`, `label`, `link`, `id`) para montar titulo, descricao, valor, categoria e informacoes.
- Detalhe do produto com imagem maior, `Comprar agora`, `Adicionar`, informacoes estruturadas e recomendados da mesma categoria quando existirem.
- Compartilhar/copiar link usa a URL atual, entao no detalhe copia o link direto do produto.

As listas de produtos continuam vindo de:

```text
/categories/ads/:id?nonDeleted=true
```

Os produtos continuam sendo filtrados por `deletedAt` antes de montar `ecommerceFiltered`.

## Validacoes executadas

Foram executados:

```bash
npx eslint src/boot/vue-query.js src/store/categories/actions.js src/store/categories/state.js src/store/categories/mutations.js quasar.conf.js
npx eslint src-pwa/register-service-worker.js
npx eslint src/pages/Categories.vue
npx eslint src/pages/ViewEcommerce.vue src/pages/EditEcommerce.vue
npm run build
```

O build PWA compilou com sucesso.

Tambem foi feita verificacao visual no ambiente local em:

```text
http://localhost:3050/loja/8549
```

A loja carregou produtos, busca e controles sem erros de console.

## Observacoes

- O app ainda usa Vuex em varias telas. Por isso, o TanStack Query foi introduzido de forma incremental.
- Para novas telas ou novos endpoints, a preferencia deve ser usar TanStack Query diretamente.
- Para telas antigas, pode-se continuar usando Vuex como ponte enquanto a migracao acontece aos poucos.
- O `npm install @tanstack/vue-query` atualizou `package.json`, `package-lock.json` e `yarn.lock`.
- O `npm audit` reportou vulnerabilidades ja existentes no projeto; elas nao foram corrigidas nesta mudanca.
