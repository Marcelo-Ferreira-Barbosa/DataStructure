# ADR-0012 — Topologia de execução, mesma origem e Docker

- **Status:** Proposta (Docker: ✅ confirmado na stack; topologia é 💡)
- **Data:** 13/11/2026
- **Requisitos relacionados:** RNF-002, RNF-005, RNF-006, RNF-024, RNF-027, RNF-031, RNF-035
- **Depende de:** Q4 (deploy público ou não)

## Contexto

É preciso definir como o SPA e a API são servidos e como o ambiente é reproduzido. O requisito RNF-024 exige que, em máquina limpa com apenas Docker, o projeto suba **com um único comando**. A decisão de publicar ou não o sistema online (Q4) ainda está em aberto. A autenticação usa cookies (ADR-0009), sensíveis a questões de origem.

## Decisão

1. **Mesma origem.** Em produção, o **processo da API serve o SPA compilado** (arquivos estáticos) e a API em `/api`. Em desenvolvimento, o **servidor do Vite faz *proxy*** de `/api` para a API. **Não há CORS** em nenhum ambiente.
2. **Um único *deployable*** em produção: uma imagem Docker (construção em etapas: compilar Web, empacotar API, imagem de execução enxuta).
3. **Dois perfis no `docker compose`:**
   - **Desenvolvimento:** apenas o **PostgreSQL**; Web e API rodam localmente com recarregamento rápido.
   - **Completo:** app + PostgreSQL, para atender RNF-024 e para rodar os testes E2E contra o *build* real.
4. **Introdução gradual do Docker:** primeiro só o PostgreSQL; a imagem do app entra quando houver o que empacotar.
5. **Migrações** do Prisma aplicadas na subida do contêiner/na CI. **Endpoint de saúde** usado pelo Docker e pela CI.
6. **Configuração por variáveis de ambiente** validadas na subida; `.env.example` versionado; nenhum segredo no repositório (RNF-006).
7. **Segurança de borda:** cabeçalhos via `helmet`; política CSP restritiva a validar com Tailwind e SVG; `Secure` nos cookies em produção; HTTPS terminado pelo provedor/proxy reverso quando houver deploy (RNF-002, condicionado a Q4).
8. **Hospedagem pública:** adiada (Q4). A mesma imagem serve a qualquer provedor de contêineres com PostgreSQL gerenciado.

## Alternativas consideradas

| Alternativa | Por que não |
|---|---|
| **SPA e API em origens separadas** (host estático + API) | Exige CORS e cookies entre sites (`SameSite=None`), ampliando riscos de CSRF e complexidade |
| **Proxy reverso (Nginx) na frente de tudo** | Útil em produção real, mas desnecessário para subir o projeto; pode ser adicionado depois sem mudar o desenho |
| **Dois contêineres (web e api)** | Mais peças sem ganho para o escopo |
| **SSR (Next.js)** | Sem requisito de SEO ou renderização no servidor |
| **Rodar tudo localmente sem Docker** | Não atende RNF-024 e dificulta a reprodução |
| **SQLite em vez de PostgreSQL** | Mais simples, porém contraria a stack confirmada e diverge do ambiente de produção |

## Justificativa

- **Mesma origem** simplifica cookies, elimina CORS e reduz a superfície de ataque CSRF.
- Um único artefato é mais fácil de construir, testar (E2E contra o mesmo artefato) e, eventualmente, publicar.
- O perfil de desenvolvimento só com banco mantém o ciclo de edição rápido; o perfil completo garante a reprodutibilidade e dá ao E2E um alvo realista.
- Adiar Docker do app evita configuração prematura.

## Consequências

**Positivas**
- Cookies e autenticação funcionam igual em desenvolvimento e produção.
- CI e demonstração usam o mesmo artefato.
- Poucas peças móveis.

**Negativas / custos**
- A API serve arquivos estáticos (aceitável nesta escala; um CDN/proxy poderia assumir depois).
- O *proxy* do Vite e a produção precisam permanecer equivalentes; um teste E2E no *build* final cobre divergências (R-08).
- Escalar horizontalmente (RNF-027, *Should*) exige atenção ao limitador por IP em memória e a sessões — estas, por estarem no banco, já funcionam com várias instâncias.

**Pontos em aberto:** ❓ Q4 — deploy público (define HTTPS, backups RNF-035, hospedagem).
