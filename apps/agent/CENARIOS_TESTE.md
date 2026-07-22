# Cenários de Teste do City-Agent

## 1. Busca por categoria → search_entities
- [x] "quero um guia turistico"
- [x] "restaurantes bons"
- [x] "pousada com piscina"
- [x] "onde pescar"
- [ ] **"cultos no carmo"** → deve buscar igrejas/templos
- [ ] "lugar pra comer pizza"
- [ ] "tem algum mecânico?"
- [ ] "igrejas"
- [ ] "templos"
- [ ] "padarias"

## 2. Horário de lugar específico → get_entity_status
- [ ] **"Saulinho Lanches abre que horas?"**
- [ ] "Pé Na Estrada funciona de noite?"
- [ ] "qual o horário da Me Leve Turismo?"
- [ ] "Saulinho Lanche está aberto agora?"

## 3. FAQ da plataforma → get_platform_faq
- [x] "como cadastrar meu comercio"
- [x] "quero divulgar meu negocio"
- [ ] "esqueci minha senha"
- [ ] "como editar meu perfil"
- [ ] "quanto custa o destaque?"

## 4. Notícias → get_city_news
- [ ] "tem noticias novas?"
- [ ] "o que aconteceu na cidade?"

## 5. Eventos → get_city_events
- [ ] "tem eventos esse fim de semana?"
- [ ] "festas em janeiro"
- [ ] "agenda cultural"

## 6. Off-topic → Bloqueio
- [x] "o que fazer em Paris"
- [x] "como programar em Python"
- [x] "quem ganhou o jogo do Brasil"

## 7. Mensagens amigáveis (fallback)
- [ ] Quando não encontra: "Não encontrei nada para essa busca" → deve ser mais amigável
- [ ] Quando lugar não existe: "Não conheço esse lugar em Carmo do Rio Claro. Tem o nome certinho?"
- [ ] Quando não entendeu: "Pode reformular? Não entendi direito o que você precisa."

---

## Regras de Negócio

### Palavras-chave de busca (router)
Sempre que detectar: restaurante, pousada, hotel, comércio, lanchonete, padaria, mercado, farmácia, mecânico, dentista, médico, turismo, guia, passeio, pescaria, pesqueiro, cachoeira, trilha, lugar, onde posso, o que fazer, tem algum, **igreja, templo, culto, missa**

### Horários
Sempre que detectar: aberto, abre, fecha, fechado, funciona, funcionamento, horário, atende, que horas + nome de lugar
→ Deve primeiro buscar o lugar com search_entities, depois get_entity_status

### Fallback amigável
NUNCA responder: "Não encontrei nada para essa busca"
Sempre responder algo como:
- "Não encontrei resultados para essa busca. Quer tentar outras palavras?"
- "Não sei bem o que você procura. Pode me dar mais detalhes?"
