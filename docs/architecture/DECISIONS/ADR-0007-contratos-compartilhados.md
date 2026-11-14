# ADR-0007 — Contratos compartilhados com Zod e tipos inferidos

- **Status:** Proposta (Zod: ✅ confirmado na stack; localização e regras são 💡)
- **Data:** 13/11/2026
- **Requisitos relacionados:** RF-012, RNF-003, RNF-021, RNF-023, RF-049, RF-050

## Contexto

Front-end e Back-end precisam concordar sobre o formato das requisições, respostas, códigos de erro e documento de simulação. A Engine deve permanecer sem dependências (ADR-0002), mas as operações que ela define fazem parte do documento persistido. É preciso evitar duplicação manual de tipos e validações, que costuma ser a maior fonte de divergência em projetos Full Stack.

## Decisão

1. Cria-se `packages/contracts` com **schemas Zod** para: corpos e parâmetros da API (auth, projetos, simulações), **documento de simulação**, **catálogo de códigos de erro** e paginação.
2. Os **tipos TypeScript dos contratos são inferidos dos schemas**: um schema, um tipo.
3. **Dono dos tipos:** a Engine é dona dos tipos de domínio (estado, passo, operação, `LIMITS`); `contracts` é dono dos tipos de fronteira. `contracts` depende da Engine; o inverso é proibido.
4. **Zod fica só em `contracts`.** A Engine valida suas entradas por conta própria e devolve problemas com códigos.
5. **Alinhamento Engine ↔ contratos por testes de tipo** (`expectTypeOf`, do Vitest): o schema de operações em `contracts` deve ser equivalente aos tipos de operação da Engine; divergência quebra a compilação dos testes.
6. **Limites** definidos **uma vez** na Engine e reutilizados pelos schemas (RN-002).
7. Nenhum tipo de `apps/web` ou `apps/api` é exportado para o outro lado; compartilhamento sobe para `contracts`. Tipos do Prisma não saem dos repositórios.
8. **No cliente**, respostas da API **não** são revalidadas em tempo de execução (cliente e servidor são entregues juntos), **exceto o documento de simulação carregado**, que pode vir de uma versão anterior do formato (RNF-033).

## Alternativas consideradas

| Alternativa | Por que não |
|---|---|
| **Duplicar tipos em cada app** | Divergência inevitável |
| **tRPC** | Segurança de tipos ponta a ponta, mas acopla a um framework e a um estilo de chamada; poucos recursos aqui; REST + Zod compartilhado entrega a maior parte do ganho |
| **OpenAPI + geração de cliente** | Ferramental pesado para ~10 endpoints |
| **Zod dentro da Engine** | Quebra o critério "zero dependências" |
| **Tipos TypeScript sem validação em tempo de execução** | Tipos não protegem a fronteira; dados externos precisam ser validados (RNF-003) |
| **Os schemas morando em `apps/api`, importados pelo Web** | Cria dependência do Web sobre a API (proibida) |

## Justificativa

A fronteira HTTP é onde dados não confiáveis entram; ali a **validação em tempo de execução** é obrigatória, e fazê-la com os mesmos schemas que geram os tipos elimina a classe de erros "o tipo diz uma coisa, a validação outra". Manter os tipos de domínio na Engine preserva a independência dela. Testes de tipo dão a garantia de alinhamento sem dependência adicional.

## Consequências

**Positivas**
- Uma definição por contrato; Web e API sempre concordam.
- Códigos de erro compartilhados permitem mensagens consistentes (ERR-xxx) sem *strings* soltas.
- Base pronta para exportar/importar simulações (RF-053).

**Negativas / custos**
- O schema de operações é um **espelho** dos tipos da Engine (não é inferido deles); depende dos testes de tipo para manter o alinhamento.
- Mais um pacote para manter.
- Zod entra no bundle do Web se o cliente reutilizar os schemas (por exemplo, ao validar o documento carregado); impacto pequeno, a medir (RNF-011).

**Riscos:** esquecer de atualizar o espelho ao criar uma nova operação → mitigado por testes de tipo e pela CI.
