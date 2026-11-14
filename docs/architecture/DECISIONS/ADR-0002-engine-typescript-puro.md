# ADR-0002 — Engine em TypeScript puro, sem dependências

- **Status:** **Aceita** — a decisão central vem do autor (✅). Os mecanismos de imposição e as regras internas são 💡 propostas.
- **Data:** 13/11/2026
- **Requisitos relacionados:** RNF-020, RNF-023, RNF-028, RNF-029, RF-020, RF-012, RF-015

## Contexto

O valor do projeto está na implementação própria de estruturas de dados e algoritmos e na capacidade de mostrá-los passo a passo. O autor decidiu (✅) que o motor deve ser independente de React e Express e funcionar como TypeScript puro, sem dependência de interface gráfica ou banco de dados. É preciso definir o que "puro" significa na prática e como impedir que a independência se perca ao longo do projeto.

## Decisão

`packages/engine` é um pacote **TypeScript puro com zero dependências de execução**, que:

1. **Não importa** nada além de si mesmo: sem React, Express, Prisma, Zod, bibliotecas utilitárias.
2. **Não acessa** DOM, APIs do Node, relógio nem aleatoriedade nativa. O tempo não existe na Engine; a aleatoriedade vem de um **PRNG próprio, pequeno e semeado**.
3. **Implementa a estrutura real** (por exemplo, nós com ponteiros em uma lista ligada) e emite *snapshots* planos e serializáveis (ADR-0003).
4. **Valida suas próprias entradas** (formato, faixa, limites) e devolve problemas como **valores**, não exceções (seção 13.2).
5. **Define os limites** (`LIMITS`) — fonte única de RN-002 — e os metadados de cada item (complexidade, operações, tipo visual).
6. **Não contém texto em linguagem natural** (ADR-0004).

**Imposição (💡):** `package.json` sem `dependencies`; `tsconfig` sem a biblioteca `DOM` e com `types` vazio (referências a `document`, `process` etc. não compilam); modo estrito do pnpm; regras de lint proibindo `Date`, `Math.random` e importações externas; teste de arquitetura na CI.

**"Implementação própria" (💡, proposta para Q14):** nas operações observadas, a Engine não delega a funções nativas que fariam o trabalho do algoritmo (por exemplo, `Array.prototype.sort`). Armazenamento básico nativo (um *array* como base de uma pilha) é permitido, desde que as operações lógicas e as contagens sejam implementadas e instrumentadas pela Engine. Funções nativas só são aceitas em **testes** de verificação.

## Alternativas consideradas

| Alternativa | Por que não |
|---|---|
| Lógica dentro de componentes React ou *hooks* | Viola a decisão do autor; impede testes sem DOM e reuso no servidor |
| Lógica na API, com o Front só exibindo | Contraria ADR-0005; latência por passo; torna o Back-end um ponto único de falha |
| Engine com dependências "leves" (Zod, lodash) | Quebra o critério verificável "zero dependências"; Zod é desnecessário (validação própria, simples) |
| Independência apenas por convenção/revisão | Frágil; a independência se perderia silenciosamente |
| Engine com classes de domínio expostas | Dificulta serialização e passagem entre ambientes; *snapshots* planos são mais simples |

## Justificativa

- **Atende RNF-020** de forma mensurável (não é possível importar o que não está declarado e não compila o que não existe no ambiente).
- **Testabilidade máxima:** roda em Node puro, sem navegador.
- **Reutilização:** a mesma Engine pode rodar no navegador (agora), na API (validação, ADR-0006), em um *worker* ou no servidor (futuro).
- **Valor de portfólio:** demonstra domínio das estruturas, não de bibliotecas.
- **Determinismo (RNF-029):** sem relógio e sem aleatoriedade nativa, a mesma entrada produz a mesma saída.

## Consequências

**Positivas**
- Núcleo testável, portável e auditável.
- A independência é protegida contra regressão por ferramenta.

**Negativas / custos**
- É necessário escrever utilitários pequenos que bibliotecas já oferecem (PRNG, validação de entradas).
- Sem Zod, os esquemas de operação precisam ser espelhados em `contracts`; **testes de tipo** garantem que não divirjam (ADR-0007).
- Um *registrador de passos* interno precisa ser desenhado com cuidado, pois todos os algoritmos dependem dele (risco R-01).

**Riscos e mitigação:** fricção de regras de lint estritas → regras com mensagens claras e exceções explícitas e raras; ambiguidade de "implementação própria" → regra acima, a confirmar (Q14).

## Pontos em aberto
- ❓ Q14 — confirmar a definição de "implementação própria".
- ❓ Q17 — definições finais de comparação, troca e acesso (serão escritas junto aos algoritmos, materializadas no registrador de passos).
