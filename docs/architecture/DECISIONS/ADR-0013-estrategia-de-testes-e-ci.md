# ADR-0013 — Estratégia de testes e CI

- **Status:** Proposta (Vitest, Playwright, GitHub Actions: ✅ confirmados na stack; estratégia é 💡)
- **Data:** 13/11/2026
- **Requisitos relacionados:** RNF-004, RNF-020, RNF-021, RNF-028 a RNF-033, RF-016, RF-029, RF-024, RN-010, RN-019

## Contexto

O projeto exige testes unitários com cobertura elevada no núcleo (≥ 90% proposto), testes de propriedades simples para ordenação e busca (RNF-028), determinismo verificável (RNF-029), E2E dos fluxos críticos (RNF-030), CI em todo *push* e *pull request* com duração de até 10 minutos (RNF-031) e testes de acesso cruzado entre usuários em todos os pontos (RNF-004). A arquitetura foi desenhada para que a maior parte da lógica seja testável sem navegador, HTTP ou banco.

## Decisão

**Pirâmide de testes por camada:**

| Camada | Teste | Foco |
|---|---|---|
| Engine | Unitário e de propriedades (PRNG semeado, sem biblioteca); ***fixtures* dourados**; completude de chaves/âncoras; invariantes do passo | Corretude, determinismo, estabilidade, limites |
| Contracts | Unitário + **testes de tipo** (`expectTypeOf`) | Schemas e alinhamento com a Engine |
| Web — lógica | Unitário | *Reducer* de reprodução, seletores, funções de layout |
| Web — componentes | Testing Library em jsdom | **Para cada passo de cada item, o DOM reflete o estado lógico** (RF-016); formulários e mensagens |
| API | **Integração com PostgreSQL real**, com `fetch` nativo contra a aplicação em porta efêmera | Rotas, serviços, banco, transações, **acesso cruzado em todos os endpoints**, erros padronizados |
| Ponta a ponta | Playwright, contra o *build* de produção | Cadastro/login, execução com avançar e retroceder, salvar e reabrir, modo visitante |
| Acessibilidade | Verificação automatizada nas telas principais + roteiro manual de teclado | RNF-016 a RNF-019 |

**Regras:**
1. **Sem *mocks* do banco.** Testes de API usam PostgreSQL real (serviço na CI, `docker compose` localmente).
2. **Sem `supertest`**; sem biblioteca de testes de propriedade.
3. **Tempo e aleatoriedade controlados:** a Engine não os conhece; a API recebe relógio por parâmetro quando precisa (expiração de sessão).
4. **Cobertura** do núcleo medida na CI (💡 ≥ 90% de linhas e ramos na Engine).
5. **Invariantes verificadas automaticamente** para todo item do catálogo: primeiro passo = estado anterior; último = resultado; contadores não decrescentes; toda mensagem e âncora emitida existe; execução termina dentro do teto; mesma entrada → mesma sequência.
6. ***Fixtures* de simulações antigas** reabertas na CI (RNF-033).
7. **Introdução gradual:** Vitest e CI mínima desde o primeiro dia; integração da API com a primeira rota; **Playwright após o primeiro fluxo vertical** funcionar.

**Pipeline de CI:** instalar (cache do pnpm) → estilo e regras de limite entre pacotes → verificação de tipos → auditoria de dependências e de segredos → testes unitários e de componente → integração da API com PostgreSQL → *build* → E2E. Qualquer falha bloqueia a integração. Meta ≤ 10 min.

## Alternativas consideradas

| Alternativa | Por que não |
|---|---|
| **Mock do Prisma** nos testes de API | Esconde transações, restrições e erros de consulta, exatamente o que importa |
| **Jest** | Vitest já faz parte da stack, integra com Vite e roda a Engine sem configuração extra |
| **Cypress** | Playwright é a escolha da stack (múltiplos navegadores, nativo em CI) |
| **Muitos testes E2E** | Lentos e frágeis; E2E apenas nos fluxos críticos |
| **`fast-check`** | Útil, mas o PRNG semeado da própria Engine cobre as propriedades necessárias sem dependência |
| **`supertest`** | `fetch` nativo contra servidor efêmero é suficiente |
| **Cobertura por *mutation testing* desde o início** | Custo alto; considerar depois para a Engine |

## Justificativa

- Concentrar testes onde há **mais lógica e mais risco** (Engine, regras de reprodução, autorização) dá o maior retorno.
- **Invariantes automáticas** sobre todos os itens detectam, de uma vez, erros em algoritmos novos.
- **Banco real** nos testes de integração evita falsa segurança.
- **E2E enxuto no *build* final** protege contra divergências entre desenvolvimento e produção (R-08) sem tornar a CI lenta.

## Consequências

**Positivas**
- Confiança para refatorar a Engine e mudar o modelo de passos.
- Regressões de comportamento ficam visíveis nos *fixtures* dourados.
- A CI documenta o que "funciona" significa.

**Negativas / custos**
- Testes de integração exigem PostgreSQL na CI e localmente.
- *Fixtures* dourados precisam ser **atualizados deliberadamente** quando um algoritmo muda de propósito (isso é uma qualidade, mas exige disciplina).
- Testes de componente para "cada passo de cada item" crescem com o catálogo; devem ser **gerados a partir do catálogo**, não escritos um a um.

**Riscos:** CI lenta (> 10 min, RNF-031) → paralelizar etapas, cache de dependências; reavaliar orquestração (Turborepo) só se necessário.
