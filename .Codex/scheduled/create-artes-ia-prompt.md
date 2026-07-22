# Tarefa agendada: melhorar tela de criar artes com IA

Voce esta no repositorio `/home/ubuntu/projects/hail-mary`.

Execute a tarefa com alto esforco de raciocinio e acompanhe ate deixar implementado, verificado e resumido. Siga rigorosamente o `AGENTS.md` do repositorio:

- Next.js 16 App Router + React 19.
- Server Components por padrao; use `'use client'` apenas quando necessario.
- Mutations via Server Actions com Zod.
- Supabase apenas pelos helpers em `apps/web/lib/supabase/*`.
- Toda query de dominio filtra por `city_id`.
- UI em PT-BR.
- Componentes nomeados, exceto `page.tsx` e `layout.tsx`.
- Nao usar `any`.
- Edicoes pontuais; cuidado com acentos e revisar diff contra mojibake.
- Se alterar ou criar feature relevante, atualizar a documentacao Davia relevante em `.davia/assets/`.

Objetivo do produto: melhorar profundamente a tela/fluxo de criar artes para comercio, deixando menos generico e mais inteligente, usando dados reais do comercio, galeria, produtos e avaliacoes.

Antes de editar:

1. Localize a tela atual de criar artes, componentes relacionados, Server Actions, chamadas Gemini/IA existentes e modelos usados no chat.
2. Leia os arquivos relevantes em `.davia/assets/` se a mudanca tocar fluxo/documentacao de businesses, ai-pipeline, ownership ou multi-city.
3. Rode buscas com `rg` para entender nomenclatura atual antes de criar novas abstracoes.

Implementar, dentro dos padroes existentes:

1. Fluxo inicial com perguntas antes de gerar:
   - Perguntar se o comercio tem Instagram.
   - Se tiver, pedir o @.
   - Se nao tiver, usar o nome do comercio em vez de exemplo fixo como `@recantofurnas`.
   - Perguntar a intencao do post/arte, com opcoes uteis e campo livre quando fizer sentido.
   - Permitir incluir itens disponiveis como imagens da galeria, foto de capa, produtos e avaliacao selecionada.

2. Geracao inteligente com IA:
   - Adicionar botao para criar carrossel com IA.
   - Usar fotos do comercio: capa e outras da galeria.
   - Quando houver produtos, usar produtos como insumo e sugerir paginas/cards adequados.
   - Permitir post baseado em avaliacao selecionada de cliente.
   - Usar logo do comercio quando disponivel.
   - Enviar ao modelo contexto rico do comercio para entender o melhor conteudo: nome, descricao, categoria, endereco publico quando apropriado, horario, contatos, redes, produtos, galeria, avaliacoes selecionadas e objetivo do post.
   - Pode reaproveitar o mesmo modelo/padrao Gemini usado no chat, se existir. Se houver camada local de IA, integrar nela em vez de criar cliente solto.
   - Cada tipo de pagina/card deve ter um pre-template de copy para orientar a IA e evitar resultado generico.
   - A IA deve sugerir e montar algo bom, mas sem inventar fatos sensiveis ou dados que nao existem.

3. Melhorar templates e cards:
   - Corrigir card "um dia por aqui": hoje o titulo esta sobreposto/sem espacamento.
   - Adicionar cards uteis de horario de funcionamento.
   - Adicionar card de plaquinha Pix perguntando a chave Pix.
   - Adaptar templates para usar dados reais do comercio, nao textos genericos.
   - Garantir que textos longos nao estourem nem se sobreponham em mobile/desktop.

4. Melhorar editor:
   - Cards devem poder ser reordenados.
   - Menu de 3 pontinhos em cada card com opcoes para duplicar e apagar.
   - Melhorar a edicao dos cards existentes mantendo a UX consistente.
   - Reusar componentes/ui ja existentes quando possivel.

5. Verificacao:
   - Rode lint/typecheck/testes relevantes conforme scripts existentes.
   - Se for app visual, suba o dev server se necessario e valide pelo menos o render principal, idealmente com screenshot/Playwright se ja existir padrao no repo.
   - Revise `git diff` e procure mojibake em textos PT-BR: `Ã`, `Â`, `â€¦`, `â€”`, `�`.

Entregavel esperado:

- Codigo implementado.
- Documentacao Davia atualizada se aplicavel.
- Log claro do que foi feito, comandos de verificacao e qualquer pendencia real.
- Nao fazer commit a menos que o usuario tenha pedido explicitamente.
