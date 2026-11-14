# ADR-0008 — API em camadas por módulo e envelope de erro padronizado

- **Status:** Proposta (Node, Express, Prisma, PostgreSQL: ✅ confirmados na stack; organização interna é 💡)
- **Data:** 13/11/2026
- **Requisitos relacionados:** RF-038, RF-042 a RF-046, RF-049 a RF-051, RNF-003, RNF-004, RNF-008, RNF-026, RNF-032, RNF-034

## Contexto

A API deve cuidar de autenticação, projetos e simulações, com autorização rigorosa por propriedade (RN-020), erros padronizados sem vazar detalhes internos (RNF-034), paginação (RNF-026) e gravação transacional (RNF-032). O projeto não pode virar "um CRUD sem estrutura" (Overview); a organização precisa ser testável sem HTTP e simples para um estudante.

## Decisão

1. **Módulos por funcionalidade** (`auth`, `projects`, `simulations`, mais `health`), cada um com a mesma estrutura em camadas:
   **rotas → validação (Zod) → serviços → repositórios (Prisma) → banco.**
2. **Rotas** só traduzem HTTP: mapeiam verbo e caminho, validam entrada com os schemas de `contracts`, chamam o serviço e formatam a resposta.
3. **Serviços** concentram as regras de negócio e **não conhecem Express** (nem `req`/`res`, nem cookies). Recebem dados já validados e o usuário autenticado.
4. **Repositórios** são o **único** lugar que usa o Prisma. As consultas de projeto e simulação **recebem o usuário e filtram sempre por ele** (autorização por construção, RN-020). Recurso alheio e inexistente produzem o mesmo resultado (404).
5. **Middlewares** tratam preocupações transversais: segurança de cabeçalhos, identificador de requisição, limite de taxa, resolução da sessão.
6. **Tratador de erros central:** serviços lançam **erros de domínio** (com `code` e status); validação produz `VALIDATION_FAILED`; qualquer outra exceção vira 500 genérico com `requestId`, **sem detalhes internos**.
7. **Envelope de erro único** (`code` estável do catálogo de `contracts`, `message`, `fields` opcional, `requestId`) e tabela de status definida em `ARCHITECTURE.md`, seção 13.3.
8. **Paginação** por página e tamanho (💡 20 por página); listagens ordenadas do mais recente ao mais antigo.
9. **Transações** para gravações compostas (simulação + atualização do projeto).
10. **Configuração** por variáveis de ambiente validadas na subida; falha imediata se faltar algo.
11. **Express e `app` separados do `listen`**: a aplicação é construída por uma função, o que permite testá-la em porta efêmera.

## Alternativas consideradas

| Alternativa | Por que não |
|---|---|
| **Tudo nas rotas** | Mistura HTTP e regra; difícil testar; cresce mal |
| **Arquitetura hexagonal/DDD completa** (portas, adaptadores, agregados) | Excessiva para 3 módulos e um estudante; a divisão acima captura os ganhos essenciais |
| **Injeção de dependência por contêiner** | Dependência e cerimônia sem necessidade; passagem manual de dependências basta |
| **Organização por tipo de arquivo** (todas as rotas juntas, todos os serviços juntos) | Espalha a mudança de uma funcionalidade por várias pastas |
| **Framework opinativo** (Nest, Fastify) | Fora da stack confirmada; trocar não resolve problema atual |
| **Filtrar por usuário na rota/serviço** em vez do repositório | Fácil de esquecer; no repositório vira regra impossível de contornar |

## Justificativa

- **Autorização no repositório** torna RNF-004 uma propriedade estrutural: não há consulta de dados do usuário que não passe pelo filtro.
- **Serviços sem HTTP** podem ser testados diretamente (e com banco real, ADR-0013).
- **Erros como valores de domínio traduzidos em um ponto** garantem o formato único e evitam vazar detalhes.
- Separar `app` de `listen` facilita testes de integração sem mocks de HTTP.

## Consequências

**Positivas**
- Cada funcionalidade nova segue um molde conhecido.
- Menos chance de falha de autorização por esquecimento.
- Erros previsíveis para o Front-end (códigos estáveis).

**Negativas / custos**
- Alguma cerimônia (quatro camadas) para operações simples; aceitável, pois mantém consistência.
- Os repositórios precisam ser disciplinados: toda função recebe o usuário. Revisão e testes de acesso cruzado cobrem isso.

**Riscos:** camadas "anêmicas" (serviços que só repassam) em operações triviais → aceitável; não criar abstrações adicionais sem necessidade.
