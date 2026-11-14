# ADR-0005 — Simulações executam no navegador

- **Status:** **Aceita** — decisão do autor (✅): "inicialmente, as simulações poderão executar no ambiente do navegador; a API será responsável pelas funcionalidades de gerenciamento e persistência".
- **Data:** 13/11/2026
- **Requisitos relacionados:** RF-020, RF-021, RF-037, RF-049, RNF-008, RNF-009, RNF-010, RNF-025
- **Resolve:** Q2 e conflito C2 de `REQUIREMENTS.md`.

## Contexto

Era preciso decidir onde roda a lógica dos algoritmos (Q2): navegador, API ou ambos. A escolha afeta latência da reprodução, o modelo de erros, o papel do Back-end, o custo de infraestrutura e o modo visitante (RF-037: sem conta, tudo exceto salvar deve funcionar).

## Decisão

1. **A Engine executa no navegador**, na **thread principal**, de forma **síncrona**: o usuário aciona uma operação e a execução completa (lista de passos) é gerada localmente.
2. **A API não executa algoritmos** no fluxo normal. Responsabilidades da API: autenticação, projetos, persistência e consulta de simulações, e segurança.
3. A API **pode reutilizar a Engine** (pura) apenas para **verificar** documentos salvos por reprodução (ADR-0006, 💡 opcional). Isso é verificação, não execução de simulação para o usuário.
4. **Sem *Web Worker* no MVP:** para n ≤ 50, a geração leva dezenas de milissegundos (RNF-010 exige ≤ 100 ms). Por ser pura e serializável, a Engine pode migrar para um *worker* sem reescrita se for necessário.
5. O estado da simulação vive **na memória do cliente** (ADR-0010).

## Alternativas consideradas

| Alternativa | Por que não |
|---|---|
| **Executar na API, o cliente só reproduz** | Latência por operação; modo visitante dependeria do servidor; custo de infraestrutura; contraria a decisão do autor |
| **Executar nos dois lados** | Duplica responsabilidade e superfície de erros sem necessidade; apenas a **verificação** no servidor é proposta |
| ***Web Worker* desde já** | Complexidade de comunicação sem ganho para n ≤ 50 |
| **WebAssembly / outra linguagem** | Fora da stack, sem ganho para o tamanho-alvo |

## Justificativa

- **Experiência fluida e offline-friendly** durante o uso (sem rede entre uma operação e outra).
- **Modo visitante trivial** (RF-037): laboratórios não dependem de servidor nem de conta.
- **Falhas de rede não interrompem o estudo**: salvar pode falhar sem perder o trabalho (RN-017, ERR-015).
- **Sessão expirada não destrói a simulação** (RN-025).
- **Simplicidade e custo:** o servidor só atende às funções de gerenciamento.

## Consequências

**Positivas**
- Latência zero entre operações; sem estado de "carregando" para gerar passos (ajuste em `USER_FLOWS.md`, T-03).
- RNF-008 (latência da API) deixa de se aplicar à execução; RNF-009/RNF-010 passam a ser medidos no navegador.
- Carga no servidor muito menor (RNF-025).

**Negativas / custos**
- **O servidor não tem autoridade sobre a execução.** Um cliente adulterado pode enviar documentos arbitrários. Mitigação: validação de forma e limites no servidor e, 💡, **reprodução** do documento (ADR-0006); como o conteúdo pertence ao próprio usuário, o risco é de integridade de dados, não de segurança de terceiros.
- **O Back-end tende a ser pequeno** (autenticação + CRUD). Isso é uma tensão com o "foco equilibrado" do Overview, tratada na seção 9.5 de `ARCHITECTURE.md`.
- Desempenho depende do dispositivo do usuário; limita-se pelo tamanho de entrada (RN-002).

**Riscos:** se o requisito mudar (ex.: desafios com correção no servidor), a Engine já é portável; apenas a camada de chamada mudaria (R-12).
