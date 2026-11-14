# ADR-0003 — Modelo de execução: passos como *snapshots* imutáveis, geração *eager*

- **Status:** Proposta
- **Data:** 13/11/2026
- **Requisitos relacionados:** RF-016 a RF-018, RF-020 a RF-024, RF-029, RF-030, RN-005, RN-010, RN-012, RNF-009, RNF-010, RNF-029

## Contexto

Toda operação deve produzir uma sequência navegável nos dois sentidos (RF-020, RF-021). Retroceder do passo N deve restaurar **exatamente** o passo N-1, incluindo estado, destaques, explicação, linha de pseudocódigo e contadores (RN-010). O indicador "Passo X de N" exige conhecer N de antemão (RF-023). As transições devem ser animadas como movimento, não como "salto" (RF-018). Os tamanhos são didáticos: até 50 elementos (RN-002).

Este é o contrato mais importante do sistema: se estiver errado, todos os itens precisarão ser reescritos (risco R-01).

## Decisão

1. **A execução é uma lista finita de passos, gerada integralmente antes da reprodução** (*eager*).
2. **Cada passo é um *snapshot* completo, imutável e serializável**: estado da estrutura, destaques, mensagem (chave e parâmetros), âncora de pseudocódigo e contadores **acumulados**.
3. **Os elementos têm identidade estável** (identificador determinístico) ao longo dos passos, para que a interface associe o "mesmo" elemento entre passos e o anime.
4. **O passo 0 é o estado anterior à operação; o último passo é o resultado.** Nunca há laço infinito: existe um teto de passos (💡 10.000); excedê-lo é erro de programação.
5. **Só a execução corrente é mantida em memória** no Front-end. O histórico guarda *registros de operação*, não passos; execuções anteriores se reproduzem a partir das operações.
6. **Desfechos:** entrada inválida e pré-condição não atendida não geram execução; operação rejeitada gera execução curta explicando o motivo (ver `ARCHITECTURE.md`, seção 7.4).

## Alternativas consideradas

| Alternativa | Vantagem | Por que não |
|---|---|---|
| **Diferenças (*diffs*) e operações inversas** | Menor memória | Retroceder exige desfazer corretamente cada tipo de mudança; risco alto de divergência (o oposto de RN-010); mais código por item |
| **Geradores/iteradores *lazy*** | Memória mínima, simples de escrever | Não permite retroceder (sem reexecutar), nem conhecer N (RF-023) |
| **Reexecutar do início até N-1 ao retroceder** | Sem armazenamento | Custo e complexidade maiores; ainda precisa conhecer N |
| ***Snapshots* de passos-chave com reconstrução** | Meio-termo | Complexidade desnecessária para n ≤ 50 |
| **Estruturas persistentes (compartilhamento estrutural)** | Memória e tempo ótimos | Complexidade alta e pouco ganho no tamanho-alvo |

## Justificativa

- **Corretude por construção:** retroceder é trocar um índice. Não há lógica de "desfazer" para errar. RN-010 passa a ser consequência do modelo, não uma propriedade a testar caso a caso.
- **Simplicidade para o autor:** cada algoritmo apenas "registra" passos; a navegação é genérica e única para todos os itens (apoia RNF-023).
- **Custo aceitável:** pior caso previsto ≈ 2.500 passos × 50 elementos (≈ 125 mil elementos) para a execução corrente — dezenas de milissegundos de geração (RNF-010) e alguns megabytes (a confirmar no PoC, risco R-02).
- **Determinismo e testabilidade:** a execução inteira é um valor comparável (*fixtures* dourados).
- **Animações corretas** (RF-018) graças à identidade estável de elementos.

## Consequências

**Positivas**
- Navegação genérica e trivial; salto direto a um passo (RF-026, *Should*) vem de graça.
- Contadores e destaques por passo são dados, não cálculo da interface.
- A execução é serializável e portável (Web, Node, *worker*).

**Negativas / custos**
- Uso de memória cresce com o produto *passos × elementos*; por isso os limites (RN-002) e o teto de passos são parte do desenho, não detalhe.
- Cada passo repete o estado inteiro; uma representação compacta pode ser necessária se os limites subirem (R-02).
- Se o *Passo* mudar, **todos** os itens e *fixtures* são afetados. Mitigação: fatia vertical primeiro e congelamento do contrato após três itens de tipos visuais distintos.

## Pontos em aberto
- ❓ Q42 — valores-limite (teto de passos, operações por simulação).
- Validar o consumo de memória e o tempo no PoC (n = 50, pior caso de Bubble e Insertion Sort).
