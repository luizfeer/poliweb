export const metadata = {
  title: 'Privacidade | Portal Carmelitano',
  description: 'Política de privacidade e LGPD do Portal Carmelitano.',
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-4xl space-y-8 px-4 py-10">
      <header className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-clay-600">
          Privacidade
        </p>
        <h1 className="text-3xl font-bold md:text-5xl">Política de privacidade</h1>
        <p className="max-w-2xl text-muted-foreground">
          Esta página explica como o Portal Carmelitano trata dados pessoais de moradores,
          visitantes, comerciantes e administradores, em conformidade com a LGPD (Lei nº 13.709/2018).
        </p>
      </header>

      <section className="space-y-5 rounded-2xl border bg-card p-5 md:p-7">
        <PolicyBlock title="Responsável pelo tratamento">
          <p>
            O Portal Carmelitano é operado pela CidadeViva, nome fantasia de LUIZ
            FERNANDO FERREIRA DE ALMEIDA, CNPJ 65.205.651/0001-63. Encarregado de dados (DPO)
            pode ser contatado pelos canais oficiais do portal.
          </p>
        </PolicyBlock>

        <PolicyBlock title="Dados que coletamos">
          <ul className="list-disc space-y-2 pl-5">
            <li>Dados de cadastro, login, perfil e preferências informadas pelo usuário.</li>
            <li>Dados enviados em formulários, classificados, newsletter, contato e solicitações.</li>
            <li>
              Dados públicos de entidades cadastradas: nome, slug, fotos, telefone comercial,
              site, endereço comercial e geolocalização.
            </li>
            <li>
              Dados técnicos de segurança e navegação: logs, dispositivo, navegador, sistema
              operacional, IP truncado e páginas acessadas.
            </li>
            <li>
              Dados de uso e interação: cliques em fichas de empresas, anúncios visualizados,
              buscas realizadas, rotas no mapa e métricas de conversão (ex.: clique em
              telefone, WhatsApp, site ou rota da ficha de um comércio).
            </li>
          </ul>
        </PolicyBlock>

        <PolicyBlock title="Cookies e tecnologias semelhantes">
          <p className="mb-2">Usamos três categorias de cookies:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong>Essenciais</strong> — necessários para login, sessão, segurança e
              preferências básicas. Não dependem de consentimento.
            </li>
            <li>
              <strong>Análise (analytics)</strong> — medem audiência, performance e
              navegação agregada. Ativados após consentimento. Usamos provedores que
              respeitam IP anonimizado quando disponível.
            </li>
            <li>
              <strong>Publicidade e conversão</strong> — medem visualizações e cliques em
              anúncios, e conversões em fichas de empresas (ex.: clique em telefone,
              WhatsApp, site, rota). Ativados após consentimento.
            </li>
          </ul>
          <p className="mt-2">
            Você pode aceitar ou recusar análise e publicidade no banner exibido na primeira
            visita, e revisar sua escolha a qualquer momento limpando os cookies do navegador
            ou pelo painel quando disponível.
          </p>
        </PolicyBlock>

        <PolicyBlock title="Como usamos os dados">
          <ul className="list-disc space-y-2 pl-5">
            <li>Operar o portal, autenticar usuários e publicar conteúdos aprovados.</li>
            <li>Exibir fichas públicas de turismo, comércio, eventos, serviços e comunidade.</li>
            <li>
              Medir audiência e desempenho do portal por meio de estatísticas agregadas e
              anonimizadas.
            </li>
            <li>
              Exibir anúncios e patrocínios de empresas locais, medir suas visualizações e
              cliques, e fornecer relatórios de desempenho aos anunciantes — sempre em
              formato agregado, sem identificar visitantes individuais.
            </li>
            <li>
              Medir conversões em fichas de empresas (cliques em telefone, WhatsApp, site,
              rota, formulário de contato) para mostrar ao comerciante quanto tráfego o
              portal está gerando para o negócio dele.
            </li>
            <li>Enviar newsletters ou comunicados apenas quando houver base legal adequada.</li>
            <li>Prevenir fraude, abuso e violações dos termos de uso.</li>
          </ul>
        </PolicyBlock>

        <PolicyBlock title="Bases legais (LGPD)">
          <ul className="list-disc space-y-2 pl-5">
            <li><strong>Execução de contrato</strong> — para operar a conta e os serviços do portal.</li>
            <li><strong>Legítimo interesse</strong> — para segurança, prevenção a fraude e métricas agregadas.</li>
            <li><strong>Consentimento</strong> — para cookies de análise, publicidade e conversão, e para comunicações de marketing.</li>
            <li><strong>Cumprimento de obrigação legal</strong> — quando exigido por lei ou autoridade competente.</li>
          </ul>
        </PolicyBlock>

        <PolicyBlock title="Compartilhamento">
          <p>
            Não vendemos dados pessoais. Compartilhamos dados apenas com provedores
            necessários para operar o portal: hospedagem e banco de dados (Supabase),
            envio de email (Resend), mapas (OpenStreetMap/Maplibre), análise de audiência,
            redes de anúncios e provedores de IA — todos sob contrato e com finalidade
            específica. Dados públicos de fichas aprovadas ficam visíveis aos visitantes.
            Anunciantes recebem apenas relatórios agregados, nunca dados pessoais
            identificáveis dos visitantes.
          </p>
        </PolicyBlock>

        <PolicyBlock title="Conteúdo público e geolocalização">
          <p>
            O portal exibe apenas dados de entidades e conteúdos destinados a publicação:
            atrativos, hospedagens, restaurantes, comércios, eventos e serviços.
            Localização residencial completa, documentos pessoais (CPF, RG) e dados
            sensíveis (saúde, religião, biometria) não são publicados.
          </p>
        </PolicyBlock>

        <PolicyBlock title="Seus direitos">
          <p>
            Você pode solicitar acesso, correção, exclusão, portabilidade, anonimização,
            informações sobre compartilhamento, revogação de consentimento ou oposição ao
            tratamento. Pedidos podem ser enviados pelos canais de contato do portal, pela
            página <code>/lgpd</code> ou pelo painel quando disponível. Para excluir sua
            conta, acesse <code>/excluir-conta</code>. Respondemos em até 15 dias.
          </p>
        </PolicyBlock>

        <PolicyBlock title="Segurança e retenção">
          <p>
            Mantemos dados pelo tempo necessário para operar o serviço, cumprir obrigações
            legais e prevenir abuso. Usamos controle de acesso, RLS no banco de dados,
            criptografia em trânsito (HTTPS), provedores reconhecidos e revisões técnicas
            para reduzir riscos. Métricas de audiência e conversão são retidas em formato
            agregado por até 24 meses.
          </p>
        </PolicyBlock>

        <PolicyBlock title="Preferências granulares">
          <p>
            O portal separa consentimentos opcionais por finalidade: análise de audiência,
            medição de publicidade local, newsletter, push notifications, processamento por
            IA e publicação de conteúdo enviado pelo usuário. Cookies essenciais de login,
            segurança e contexto de cidade continuam ativos porque são necessários para o
            serviço funcionar.
          </p>
        </PolicyBlock>

        <PolicyBlock title="App Store e aplicativos futuros">
          <p>
            Se o portal for distribuído como aplicativo iOS, as informações desta política
            serão usadas para preencher os rótulos de privacidade da App Store. Permissões
            como notificações, localização, fotos, câmera e rastreamento só serão pedidas
            quando forem necessárias para uma funcionalidade clara. A exclusão de conta
            continuará disponível pelo app e pela página <code>/excluir-conta</code>.
          </p>
        </PolicyBlock>

        <PolicyBlock title="Crianças e adolescentes">
          <p>
            O portal não é direcionado a menores de 13 anos. Conteúdo enviado por
            adolescentes entre 13 e 18 anos deve ter ciência dos responsáveis.
          </p>
        </PolicyBlock>

        <PolicyBlock title="Atualizações desta política">
          <p>
            Esta política pode ser atualizada para refletir mudanças no portal ou na
            legislação. A data da última revisão fica registrada abaixo. Mudanças
            relevantes serão comunicadas pelo portal.
          </p>
          <p className="mt-2 text-sm">Última revisão: 15/05/2026.</p>
        </PolicyBlock>
      </section>
    </main>
  );
}

function PolicyBlock({
  title,
  children,
}: Readonly<{
  title: string;
  children: React.ReactNode;
}>) {
  return (
    <section className="space-y-2 border-b pb-5 last:border-b-0 last:pb-0">
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="text-muted-foreground leading-relaxed">{children}</div>
    </section>
  );
}
