# ADR-0004 — Conteúdo didático por chaves e âncoras, fora da Engine

- **Status:** Proposta
- **Data:** 13/11/2026
- **Requisitos relacionados:** RF-024, RF-028, RF-029, RF-031, RF-065 (*Could*), RNF-014, RNF-020

## Contexto

Cada passo precisa de uma explicação em linguagem simples (RF-024), e cada item precisa de pseudocódigo com a linha corrente realçada (RF-028, RF-029) e de complexidade com nota explicativa (RF-031). O idioma de interface, explicações e pseudocódigo ainda não foi decidido (Q3), e a internacionalização é um requisito futuro (RF-065). A Engine deve permanecer pura e sem preocupação de apresentação (ADR-0002).

## Decisão

1. A Engine **não contém texto em linguagem natural**. Cada passo carrega:
   - uma **mensagem** como `{chave, parâmetros}` (por exemplo, "comparando", com os valores e posições envolvidos);
   - uma **âncora** simbólica da linha de pseudocódigo.
2. A Engine exporta, como **tipos**, a união de todas as chaves de mensagem e de todas as âncoras, com os tipos de parâmetros de cada chave.
3. O **catálogo de conteúdo** vive no Front-end (`apps/web/src/content`, por idioma) e é **tipado de forma que falte algo = erro de compilação**: toda chave tem um modelo de texto e toda âncora tem sua linha de pseudocódigo.
4. **Metadados independentes de idioma** (notação de complexidade como "O(n log n)", tipo visual, operações) ficam na Engine; apenas as **notas explicativas** vão ao catálogo.
5. Os parâmetros das mensagens são **valores reais** (elementos e posições envolvidos), de modo que o texto resultante cita os dados da execução, não frases genéricas (RF-024).

## Alternativas consideradas

| Alternativa | Por que não |
|---|---|
| **Texto pronto dentro da Engine** | Acopla a Engine a um idioma; torna Q3 e RF-065 caros; mistura apresentação e domínio |
| **Texto no servidor/banco** | Latência e dependência de rede sem ganho; o conteúdo é versionado com o código |
| **Biblioteca de i18n completa desde já** | Dependência sem necessidade comprovada (idioma único no MVP, Q3); o catálogo tipado cobre o caso |
| **Pseudocódigo dentro da Engine** | Acopla ao idioma; porém preserva proximidade com o algoritmo — mitigada por âncoras tipadas e teste de cobertura |

## Justificativa

- Mantém a Engine **universal e testável** sem dependência de idioma.
- Transforma "toda explicação existe" (RF-024) e "todo passo mapeia a uma linha existente" (RF-029) em **garantias de compilação**, mais fortes que testes.
- Prepara internacionalização sem exigir biblioteca agora.
- A separação reflete a divisão natural: a Engine decide **o que aconteceu**; o catálogo decide **como contar**.

## Consequências

**Positivas**
- Mudar o idioma ou o tom didático não toca nenhum algoritmo.
- Adicionar um item novo obriga (pelo compilador) a escrever suas explicações e seu pseudocódigo.
- Testes da Engine verificam chaves e âncoras sem depender de texto.

**Negativas / custos**
- Dois lugares para tocar ao criar um item (Engine e catálogo).
- O pseudocódigo fica longe da implementação; risco de deriva sutil. **Mitigação:** âncoras tipadas e um teste que percorre todos os passos de todos os itens garantindo que cada âncora aponta para uma linha existente; revisão ao alterar algoritmos.
- Mensagens parametrizadas exigem disciplina para manter a concordância gramatical (singular/plural, gênero).

## Pontos em aberto
- ❓ Q3 — idioma da interface, das explicações e do pseudocódigo.
- ❓ Q18 — fonte bibliográfica de referência para pseudocódigo e complexidade.
