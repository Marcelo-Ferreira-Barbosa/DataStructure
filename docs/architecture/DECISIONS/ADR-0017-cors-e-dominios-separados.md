# ADR-0017 — Web e API em domínios separados, com CORS restrito

- **Status:** **Aceita** (decisão do autor, Q98, 22/11/2026)
- **Substitui parcialmente:** ADR-0012 (decisão 1, "mesma origem") e o trecho "mesma origem dispensa CORS" do ADR-0009
- **Requisitos relacionados:** RNF-003, RNF-034

## Contexto

O ADR-0012 previa que a API servisse o SPA (mesma origem, sem CORS). O autor preferiu **domínios separados** por organização da estrutura (Web e API implantados de forma independente).

## Decisão

1. Web e API ficam em origens diferentes. A API **não** serve o SPA.
2. CORS com **uma única origem permitida**, `APP_ORIGIN`, comparada por igualdade exata. Nunca `*`, nunca eco de qualquer `Origin`, nunca `null`.
3. `Access-Control-Allow-Credentials: true` (a sessão futura viaja em cookie), métodos `GET, POST, PATCH, DELETE`, cabeçalho `Content-Type`, `X-Request-Id` exposto, `Max-Age` 600 s, `Vary: Origin`.
4. Origem não permitida não recebe nenhum `Access-Control-*`.
5. Implementado em ~40 linhas próprias (`shared/http/cors.ts`), **sem** dependência nova (ADR-0014).
6. A verificação de `Origin` nas mutações (API.md §2.3) **continua**: CORS protege quem lê a resposta, não impede que o servidor processe uma requisição forjada.

## Consequências

- Em dev, o proxy do Vite sai de cena; o Web chama a API direto com `credentials: 'include'`.
- **Cookie de sessão (❓ Q101, a decidir com a autenticação):** `SameSite=Lax` só funciona se Web e API forem do **mesmo site** (subdomínios do mesmo domínio registrável). Em sites distintos seria necessário `SameSite=None; Secure`, que exige HTTPS e enfraquece a proteção contra CSRF. **Recomendação:** hospedar ambos sob o mesmo domínio registrável.
- `localhost:5173` e `localhost:3000` são do mesmo site, então o desenvolvimento local funciona com `Lax`.
- Perde-se o "um comando, um processo" do ADR-0012 em produção; o Docker completo (futuro) terá dois serviços.
