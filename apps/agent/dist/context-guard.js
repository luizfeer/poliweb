const OFF_TOPIC_PATTERNS = [
    // Outros países
    /\b(Estados Unidos|China|Jap[ãa]o|Fran[çc]a|It[áa]lia|Espanha|Portugal|Argentina|Chile|Peru|Col[ôo]mbia|Venezuela|Bol[íi]via|Paraguai|Uruguai|Equador|Guiana|Suriname|Panam[áa]|Costa Rica|Nicar[áa]gua|Honduras|Guatemala|Belize|El Salvador|M[ée]xico|Cuba|Jamaica|Haiti|Rep[úu]blica Dominicana|Puerto Rico|Trinidad|Bahamas|Barbados|Santa L[úu]cia|Granada|Dominica|S[ãa]o Vicente|Ant[íi]gua|Barbuda|S[ãa]o Crist[óo]v[ãa]o|N[ée]vis)\b/i,
    // Cidades internacionais famosas
    /\b(Nova York|Los Angeles|Chicago|Miami|Las Vegas|San Francisco|Boston|Seattle|Washington|Filad[ée]lfia|Dallas|Houston|Austin|Atlanta|Denver|Phoenix|Portland|Detroit|Nashville|Orlando|Londres|Paris|Roma|Madri|Lisboa|Berlim|Munique|Amsterd[ãa]|Bruxelas|Viena|Praga|Budapeste|Vars[óo]via|Atenas|Istambul|Dubai|T[óo]quio|Pequim|Xangai|Hong Kong|Singapura|Bangkok|Seul|Sydney|Melbourne|Auckland|Toronto|Vancouver|Montreal|Cidade do M[ée]xico|Canc[úu]n|Buenos Aires|Santiago|Lima|Bogot[áa]|Caracas|Montevid[ée]u|Assun[çc][ãa]o|Quito|Georgetown|Paramaribo|Porto Pr[íi]ncipe|Havana|Kingston)\b/i,
    // Tecnologia / programação (claramente off-topic)
    /\b(receita de |como fazer |tutorial de |como instalar |como programar |c[óo]digo em |linguagem |framework |html|css|javascript|python|java|c\+\+|golang|ruby|php|react|angular|vue|next\.?js|node\.?js)\b/i,
    // Esportes globais (claramente off-topic)
    /\b(quem ganhou |campeonato mundial |copa do mundo |olimp[íi]ada |jogos ol[íi]mpicos|f1|formula 1|nba|nfl|mlb|ufc|wwe| champions league|premier league|la liga|bundesliga|serie a)\b/i,
    // Política federal não-local
    /\b(pol[íi]tica federal|presidente do brasil|governador de (?!minas|mg)|senador|deputado federal|ministro da|supremo tribunal|stf|congresso nacional)\b/i,
];
export function guardQuery(query, cityName) {
    for (const pattern of OFF_TOPIC_PATTERNS) {
        if (pattern.test(query)) {
            return {
                allowed: false,
                reason: `Sou o assistente exclusivo de ${cityName}. Não posso responder perguntas fora do contexto local.`,
            };
        }
    }
    return { allowed: true };
}
