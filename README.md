# Dossel — Monitoramento por Satélite da Amazônia

Painel web que cruza focos de calor (NASA FIRMS), desmatamento (INPE/PRODES) e clima/hidrologia (Open-Meteo) da Amazônia Legal em tempo real. Construído em **TypeScript + Vite**, sem framework de UI — só o necessário para ter tipagem, módulos organizados e um build otimizado para hospedagem estática.

## Stack

- **TypeScript** — tipagem em todo o domínio (focos de calor, estados, série PRODES, respostas de API).
- **Vite** — bundler e dev server, build de produção com `base: './'` para funcionar em qualquer sub-path do GitHub Pages.
- **Leaflet** (via npm, não CDN) — mapa dos focos de calor.
- **CSS puro** com variáveis (`custom properties`) — sem pré-processador, já que os recursos modernos de CSS (grid, clamp, container-ready) cobrem tudo que o projeto precisa.
- **Canvas 2D nativo** para os gráficos de barra — sem biblioteca de gráficos.

## Estrutura

```
Dossel-project/
├── index.html                 # marcação e composição das seções
├── vite.config.ts             # base relativa p/ GitHub Pages
├── tsconfig.json
├── package.json
├── .github/workflows/deploy.yml   # build + deploy automático no GitHub Pages
├── scripts/
│   └── smoke-test.ts          # teste de fumaça: exercita a lógica de cada módulo com fixtures reais
└── src/
    ├── main.ts                # ponto de entrada, conecta todos os módulos
    ├── types/domain.ts        # tipos compartilhados do domínio
    ├── modules/
    │   ├── state.ts            # constantes: bbox, estados, série PRODES, cidades
    │   ├── utils.ts             # helpers de DOM, formatação e toast
    │   ├── charts.ts             # gráfico de barras em canvas + gauge de risco em SVG
    │   ├── map.ts                 # bootstrap do mapa Leaflet
    │   ├── fires.ts                 # NASA FIRMS: chave, parsing CSV, risco, comparativo ano a ano
    │   ├── deforestation.ts          # painel PRODES + participação por estado
    │   ├── climate.ts                 # clima e vazão de rios via Open-Meteo
    │   ├── clock.ts                    # relógio ao vivo da nav
    │   └── reveal.ts                    # animação de entrada ao rolar a página
    └── styles/
        ├── tokens.css          # cor, tipografia, raio, easing
        ├── layout.css           # reset, nav, hero, grid das seções
        ├── components.css       # painéis, cards, mapa, gráficos, toast
        └── effects.css           # parallax do dossel, grão, pulso de hotspot, scroll reveal
```

## Fontes de dados

| Painel | Fonte | Autenticação |
|---|---|---|
| Focos de calor + comparativo ano a ano | [NASA FIRMS](https://firms.modaps.eosdis.nasa.gov/) — VIIRS_SNPP_NRT / VIIRS_SNPP_SP | MAP_KEY gratuita |
| Desmatamento | [INPE / PRODES](https://terrabrasilis.dpi.inpe.br) | dado de referência consolidado; sem chave |
| Clima | [Open-Meteo Forecast API](https://open-meteo.com) | sem chave |
| Vazão de rios | [Open-Meteo Flood API](https://open-meteo.com/en/docs/flood-api) (GloFAS) | sem chave |

**Sobre o painel de desmatamento:** o cliente REST simples que a TerraBrasilis expunha para consulta agregada (`terrabrasilisAnalyticsAPI`) foi descontinuado pelo próprio INPE. O que resta é o serviço geoespacial (GeoServer/WFS), que não expõe cabeçalho CORS para chamadas de navegador nem devolve contagem agregada pronta — só geometria bruta. Por isso este painel usa a série consolidada do PRODES como fonte primária ao invés de simular uma chamada "ao vivo" que dependeria de um endpoint instável.

## Chave do NASA FIRMS

O projeto vem com uma MAP_KEY padrão embutida em `src/modules/fires.ts` para funcionar out-of-the-box. Como é uma chave pessoal com limite de 5.000 transações por intervalo de 10 minutos, se ela algum dia esbarrar no limite:

1. Gere a sua em [firms.modaps.eosdis.nasa.gov/api/map_key](https://firms.modaps.eosdis.nasa.gov/api/map_key/) (gratuito).
2. Cole no campo que aparece no painel de queimadas — fica salva só no `localStorage` do seu navegador, sem tocar no código.

**Atenção:** por este ser um repositório público, a chave padrão embutida fica visível para qualquer pessoa. Isso não dá acesso a nada além da própria API pública do FIRMS, mas ela pode ser usada por terceiros até você trocá-la.

## Rodando localmente

```bash
npm install
npm run dev       # servidor de desenvolvimento
npm run build     # type-check + build de produção em dist/
npm run preview   # serve o build de produção localmente
npm test          # teste de fumaça (lógica de todos os módulos, com fixtures das APIs reais)
```

## Testes

`npm test` roda `scripts/smoke-test.ts`: simula um DOM real com `jsdom`, injeta respostas *shape-corretas* das três APIs (CSV do FIRMS com as colunas reais do produto VIIRS, JSON do Open-Meteo forecast e flood) e executa a lógica de cada painel de ponta a ponta — parsing de CSV, cálculo do índice de risco, comparativo ano a ano, atualização do DOM e tratamento de erro quando a API está fora do ar. Não substitui testar no navegador contra a internet real, mas garante que nenhuma mudança quebra silenciosamente a lógica de um painel.

## Deploy no GitHub Pages

O workflow em `.github/workflows/deploy.yml` builda e publica automaticamente a cada push na branch `main`. Só precisa habilitar, uma vez, em **Settings → Pages → Source → GitHub Actions** no repositório.

Para subir o projeto pela primeira vez:

```bash
git init
git add .
git commit -m "Dossel — painel de monitoramento por satélite da Amazônia"
git branch -M main
git remote add origin https://github.com/gabrielzortt/Dossel-project.git
git push -u origin main
```
