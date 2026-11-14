# ADR-0010 — Gerenciamento de estado no Front-end

- **Status:** Proposta (Zustand: ✅ confirmado na stack; escopo e demais escolhas são 💡; ❓ Q36, Q40)
- **Data:** 13/11/2026
- **Requisitos relacionados:** RF-014, RF-021 a RF-025, RF-037, RF-049, RF-054 (*Should*), RN-010, RN-013, RN-017, RN-025, RNF-013

## Contexto

O Front-end tem estados de naturezas diferentes: o estado **interno e local** de uma simulação (execução corrente, cursor, reprodução), o estado **do servidor** (usuário, projetos, simulações salvas), preferências e estado de URL. A reprodução é consumida por cerca de seis regiões da tela de laboratório (visualização, explicação, pseudocódigo, contadores, controles, histórico) e acionada por um temporizador fora da árvore React. Requisitos exigem que a simulação **sobreviva** a sessão expirada, falha de gravação e navegação até as telas de login (RN-025, RN-017, ERR-013, ERR-015).

## Decisão

1. **Cinco naturezas de estado, cada uma no seu lugar:**

| Natureza | Lugar |
|---|---|
| **Sessão de laboratório** (item, dados iniciais, semente, histórico de operações, execução corrente, cursor, status de reprodução, "há trabalho não salvo") | **Store Zustand** |
| **Preferências** (velocidade, animação) | Store Zustand, persistida em `localStorage` com `try/catch` |
| **Estado de servidor** (usuário atual, projetos, simulações) | Camada de consultas e mutações (💡 TanStack Query, ❓ Q36) |
| **Estado de URL** (laboratório, item, projeto/simulação) | Rotas |
| **Estado local de UI** (campo, diálogo, aba) | `useState` no componente |

2. **O estado de laboratório é independente do estado de servidor.** Nenhum deles depende do outro para existir.
3. **O passo atual é derivado** (`execução.passos[cursor]`), assim como contadores, "pode retroceder" e "estrutura vazia": **seletores**, nunca duplicados no estado.
4. **Somente ações da store chamam a Engine.** Componentes não executam operações diretamente.
5. **Transições de reprodução** são um *reducer* puro com a máquina de estados do fluxo F-05 (pronto, reproduzindo, pausado, concluído), testável sem React. O temporizador é um *hook* fino que só dispara `tick`.
6. **Só a execução corrente é guardada.** O histórico guarda registros de operação (ADR-0003).
7. **Zustand restrito** a sessão de laboratório e preferências. Não é repositório global.
8. **Consultas e mutações:** leituras com nova tentativa limitada a falhas de rede; **mutações nunca repetem automaticamente** (nova tentativa é ação do usuário, ERR-015); invalidação de cache após mutações.
9. 💡 **Rascunho do visitante:** a store sobrevive à navegação interna do SPA, então "Salvar → Entrar → voltar" não perde o trabalho sem recarregar. Opcionalmente (❓ Q40), a sessão de laboratório é espelhada em `sessionStorage` para sobreviver a recarregamentos (com `try/catch`). Isso aproxima RF-054 (*Should*) do MVP.

## Alternativas consideradas

| Alternativa | Por que não |
|---|---|
| **`useReducer` + Context** para a sessão de laboratório | Viável, mas todos os consumidores re-renderizam a cada passo sem seletores finos; o temporizador fora da árvore fica incômodo. Zustand resolve isso com pouco código |
| **Redux Toolkit** | Cerimônia desproporcional |
| **MobX / Jotai / Recoil** | Sem vantagem relevante sobre Zustand aqui |
| **Tudo em um único estado global** | Mistura servidor e laboratório; perderia a independência exigida por RN-025 |
| **Guardar toda a execução e o histórico de execuções** | Memória crescente sem benefício; reproduzível a partir das operações |
| **Estado de servidor com hooks próprios** | Possível (~8 chamadas), mas repete cache, nova tentativa e invalidação; Query resolve isso (opcional, Q36) |
| **Persistir a sessão de laboratório no servidor automaticamente** | Contraria a persistência explícita (RF-049) e o modo visitante |

## Justificativa

- Separar **laboratório** de **servidor** é o que permite cumprir, por estrutura, as promessas de não perder trabalho.
- **Derivar em vez de duplicar** elimina a classe de erros em que visualização, explicação e contadores divergem (RF-021, RN-010).
- O *reducer* puro isola a parte mais propensa a *bugs* (corrida entre temporizador e navegação manual, R-07) em algo testável.
- Zustand é pequeno e adequado ao caso específico que o motivou; limitar seu escopo evita que vire dependência onipresente.

## Consequências

**Positivas**
- Sessão expirada, falha ao salvar e navegação para login não destroem a simulação.
- Seletores finos reduzem re-renderizações durante a reprodução.
- Regras de reprodução testáveis em isolamento.

**Negativas / custos**
- Duas ferramentas de estado (Zustand + consultas de servidor). Se Q36 for rejeitada, hooks próprios assumem o papel de consultas.
- Disciplina para não colocar estado derivado na store.

**Riscos:** cursor fora do intervalo após reiniciar ou executar nova operação → invariantes no *reducer* e testes.

## Pontos em aberto
- ❓ Q36 — adotar TanStack Query.
- ❓ Q40 — rascunho em `sessionStorage` e eventual promoção de RF-054.
- ❓ Q20, Q21, Q30 — comportamento ao disparar nova operação ou navegar manualmente durante a reprodução (decisões de produto, já refletidas como sugestões em `USE_CASES.md`).
