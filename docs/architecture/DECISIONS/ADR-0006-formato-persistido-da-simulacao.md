# ADR-0006 — Formato persistido da simulação: entradas e operações, com versão

- **Status:** Proposta (inclui uma parte opcional, "validação por reprodução", ❓ Q37)
- **Data:** 13/11/2026
- **Requisitos relacionados:** RF-049, RF-050, RF-051, RN-016 a RN-019, RNF-029, RNF-032, RNF-033, RNF-003
- **Trata:** conflito C3 de `REQUIREMENTS.md`.

## Contexto

Uma simulação salva deve poder ser reaberta e reproduzida com o **mesmo estado final e a mesma sequência de passos** (RF-050, RN-019). O C3 apontou uma tensão: se guardamos apenas dados e operações, uma correção futura em um algoritmo poderia gerar passos diferentes dos que o usuário viu; se guardamos os passos, o armazenamento cresce e o formato fica preso ao modelo interno. Além disso, o servidor não executa simulações (ADR-0005) e precisa validar o que recebe.

## Decisão

1. **Persiste-se a *receita*, não o resultado.** O documento contém: **versão do formato**, **item** (laboratório e estrutura/algoritmo), **dados iniciais** (origem — manual, aleatória ou exemplo —, valores e **semente**, quando houver) e a **lista ordenada de operações** executadas. **Os passos não são persistidos.**
2. **Reabrir = reproduzir:** o cliente valida o documento e pede à Engine que **reproduza** as operações a partir do estado inicial. O determinismo (RNF-029) garante o mesmo resultado.
3. **Versionamento:** o documento tem **versão de formato**. O leitor aceita as versões conhecidas ou migra; documentos incompatíveis ou corrompidos produzem ERR-017 sem afetar as demais simulações. 💡 Também se registra uma **revisão da Engine** para detectar mudanças de comportamento.
4. **Resumo para listagem:** nº de operações, item, datas e um resumo do resultado ficam em **campos escalares** ao lado do documento (RF-051), não dentro do JSON, para consulta eficiente.
5. **Gravação transacional** (simulação + atualização do projeto): tudo-ou-nada (RN-017, RNF-032).
6. **Limites** de documento (💡 máx. 200 operações; 50 elementos; faixa de valores) validados no servidor.
7. **Proteção contra deriva:** *fixtures* de simulações de versões anteriores são reabertas na CI (RNF-033). Se uma mudança na Engine alterar a sequência de passos de um *fixture*, a mudança é **deliberada**, acompanhada da atualização da revisão.
8. **💡 Validação por reprodução no servidor (opcional, ❓ Q37):** ao salvar, a API **reproduz as operações com a mesma Engine** e **calcula o resumo no servidor**, recusando documentos que a Engine não consegue reproduzir. O cliente não é a autoridade do resumo.
9. **💡 Idempotência de salvamento:** o cliente envia um identificador por tentativa de salvar; o servidor trata repetições do mesmo identificador como a mesma criação (evita duplicatas após *timeout*).

## Alternativas consideradas

| Alternativa | Por que não |
|---|---|
| **Persistir os passos gerados** | Armazenamento muito maior (milhares de *snapshots*); prende o banco ao modelo interno; reabrir mostra algo que o código atual talvez não produza mais |
| **Persistir só o estado final** | Perde a reprodução passo a passo (RF-050) |
| **Persistir passos + operações** | Dois formatos a manter coerentes; ganho pequeno |
| **Colunas relacionais para cada operação** | Rigidez sem benefício; o documento é lido e escrito sempre por inteiro |
| **Sem validação por reprodução** | Mais simples, porém o servidor aceitaria documentos não reproduzíveis e o Back-end ficaria sem responsabilidade de domínio (R-05) |

## Justificativa

- Receita + determinismo é **o menor armazenamento** que preserva a reprodução exata.
- Resolve C3 sem duplicar dados: a deriva é detectada por *fixtures* e revisão, não por armazenar tudo.
- A validação por reprodução dá ao Back-end uma **responsabilidade real** e demonstra que a Engine roda em dois ambientes, sem mover a execução ao servidor.
- JSONB do PostgreSQL acomoda o documento; campos escalares atendem às listagens.

## Consequências

**Positivas**
- Armazenamento pequeno e simples; formato portável (base para exportar/importar, RF-053, e compartilhar, RF-063).
- Servidor com integridade de dados verificada (se a validação por reprodução for adotada).

**Negativas / custos**
- **Corrigir um algoritmo pode mudar o que simulações antigas mostram.** É inerente à abordagem; mitiga-se com versão, revisão da Engine e *fixtures*. Um documento anterior que gere execução diferente deve ser tratado como migração ou aviso, não ignorado.
- A API passa a depender da Engine (se Q37 for aprovada), então o ciclo de versões é conjunto (aceitável em monorepo).
- Custo de CPU por salvamento (reprodução): desprezível para os limites do MVP, mas deve ser medido.

**Riscos:** R-03 (deriva). Mitigações listadas acima.

## Pontos em aberto
- ❓ Q37 — adotar a validação por reprodução.
- ❓ Q42 — valores-limite (operações por simulação, tamanho máximo do documento).
- ❓ Q13/Q23 — política de sobrescrever ou criar nova entrada ao continuar, e como apresentar a reprodução ao reabrir (decisões de produto, compatíveis com este formato).
