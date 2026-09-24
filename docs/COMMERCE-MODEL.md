# Comércio Poliweb V2

O produto possui registro próprio em `commerce_products`, com nome, descrição, preço em centavos, tipo, categoria, opções e referência à imagem enviada pelo upload existente. Cada escolha de variação ou adicional pode acrescentar um valor. Novos produtos usam V2; os arquivos antigos foram importados automaticamente e continuam visíveis pelo fallback quando inválidos.

Ao abrir a administração da loja pela primeira vez, o lojista configura entrega, coleta de endereço, taxa, informações de entrega e pagamentos. Essas opções ficam em `commerce_settings` no PostgreSQL da API principal. O cliente informa nome e telefone, escolhe endereço salvo ou digita outro quando há entrega, seleciona o pagamento e confirma o carrinho.

O backend recalcula preços e adicionais a partir do catálogo e salva em `commerce_orders` uma cópia dos itens, escolhas, observações, endereço, pagamento e valores. A linha é uma estatística de pedido gerado no site; ela não confirma o envio da mensagem. O WhatsApp continua sendo a única notificação ao lojista. Se a gravação estatística falhar, o cliente ainda pode enviar a mensagem pelo WhatsApp.

As migrações repetíveis ficam na API: `20260924_commerce_products_v2.sql` e `20260924_commerce_orders.sql`. A primeira registra arquivos legados inválidos em `commerce_product_migration_errors` para revisão. A leitura V2 também informa produtos desativados para impedir que a interface os recoloque pelo fallback legado.
