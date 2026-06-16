# Feed de Fotos com Legendas (estilo Instagram)

## Objetivo

Permitir que comércios publiquem fotos com legendas em texto livre (JSON), exibidas em um feed estilo Instagram para visitantes, com área de gestão completa (CRUD) para o dono do perfil.

---

## O que foi feito

### Backend — `poliwebapp-api`

#### Migration `20260616_category_ad_files_meta.sql`
- Adicionou coluna `meta JSONB NULL` na tabela `categories_ads_files`
- A descrição/legenda da foto fica em `meta.caption` (JSON livre — pode ser expandido sem nova migration)

#### Tipo de arquivo `post`
- O campo `type` em `categories_ads_files` já era livre (VARCHAR) — nenhuma mudança de schema necessária
- Posts são arquivos com `type = 'post'` e `meta = { "caption": "..." }`

#### Novo endpoint público `GET /categories/ads/:id/posts`
- Lista posts de um anúncio filtrando por `type = 'post'` e `deleted_at IS NULL`
- Suporta paginação via `limit` e `offset` (default: 12)
- Retorna `link` (URL CDN) junto com o objeto

#### Endpoint de upload existente `POST /categories/ads/:id/files/post`
- Já existia; agora aceita `?meta=<JSON>` como query param para salvar a legenda no upload
- Exemplo: `POST /categories/ads/5/files/post?meta={"caption":"Novo produto!"}`

#### Endpoint de edição existente `POST /categories/ads/files/:id`
- Já existia; agora aceita campo `meta` no body para atualizar a legenda
- DTO atualizado: `IUpdateCategoryAdFileDTO` e `ICreateCategoryAdFileDTO` agora incluem `meta`

#### Arquivos alterados no back
- `src/migrations/20260616_category_ad_files_meta.sql` (novo)
- `src/components/category/Category.ts` — `CategoryAdFile` + campo `meta`
- `src/components/category/repositories/implementations/queries/insert-category_ad_file.sql`
- `src/components/category/repositories/implementations/queries/update-category_ad_file.sql`
- `src/components/category/repositories/implementations/queries/select-category_ad_file_by_id.sql`
- `src/components/category/repositories/implementations/queries/select-category_ad_posts.sql` (novo)
- `src/components/category/repositories/implementations/queries/index.ts`
- `src/components/category/repositories/ICategoriesRepository.ts`
- `src/components/category/repositories/implementations/PostgresCategoriesRepository.ts`
- `src/components/category/useCases/CreateCategoryAdFileUseCase/ICreateCategoryAdFileDTO.ts`
- `src/components/category/useCases/UpdateCategoryAdFileUseCase/IUpdateCategoryAdFileDTO.ts`
- `src/components/category/useCases/CreateCategoryAdFileUseCase/CreateCategoryAdFileUseCase.ts`
- `src/components/category/CategoryController.ts` — importa repo, novo route GET posts, meta no upload
- `src/components/category/Schemas.ts` — `meta` no update schema + `getCategoryAdPostsSchema`
- `src/components/category/index.ts` — passa repo ao controller

---

### Frontend — `poliweb`

#### `src/components/PhotoFeed.vue` (novo)
- Grid 3 colunas, estilo Instagram
- Lightbox ao clicar: exibe foto em tela cheia + legenda + data
- Ícone de balão aparece sobre fotos que têm legenda
- Paginação com botão "Ver mais"
- Usado em `Ads.vue` para visitantes

#### `src/pages/ManagePosts.vue` (novo)
- Acesso: `/posts/:adId` (requer login — customer ou admin)
- Seleção de múltiplas fotos com preview antes de publicar
- Campo de legenda por foto antes do upload
- Grid de fotos publicadas com botão de editar/excluir
- Edição de legenda e exclusão com confirmação
- Gestão via API: upload → `POST /categories/ads/:id/files/post`, edição → `POST /categories/ads/files/:id`, exclusão → `DELETE /categories/ads/files/:id`

#### `src/components/Ads.vue`
- Seção "Fotos" adicionada entre a galeria de stories e a descrição
- Botão "Gerenciar" visível só para admin, leva a `/posts/:id`
- `PhotoFeed` registrado como componente local

#### `src/router/routes.js`
- Rota `/posts/:id` adicionada apontando para `ManagePosts.vue`

---

## Fluxo completo

```
Visitante abre perfil do comércio
  → vê seção "Fotos" com grid Instagram (PhotoFeed.vue)
  → clica na foto → lightbox com legenda e data

Dono do perfil (logado)
  → vê botão "Gerenciar" na seção Fotos
  → vai para /posts/:adId (ManagePosts.vue)
  → seleciona foto → adiciona legenda → publica
  → pode editar legenda ou excluir foto existente
```

---

## Esforço

| Etapa | Tempo estimado |
|---|---|
| Análise da estrutura existente (back + front) | ~30 min |
| Migration + backend (DTOs, queries, repo, controller, schema) | ~90 min |
| Frontend: `PhotoFeed.vue` | ~45 min |
| Frontend: `ManagePosts.vue` | ~60 min |
| Integração em `Ads.vue` + rota | ~15 min |
| Documentação | ~15 min |
| **Total** | **~4h 15min** |

---

## Status

- [x] Migration aplicada em produção
- [x] Backend buildado e reiniciado (PM2)
- [ ] QA: publicar foto com legenda via `/posts/:id`
- [ ] QA: editar legenda de foto existente
- [ ] QA: excluir foto
- [ ] QA: feed aparece na página pública do comércio
- [ ] QA: lightbox mobile

---

## Data

2026-06-16
