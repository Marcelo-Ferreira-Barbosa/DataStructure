# ADR-0009 — Autenticação por sessão no PostgreSQL e cookie `httpOnly`

- **Status:** Proposta (❓ Q35, Q39)
- **Data:** 13/11/2026
- **Requisitos relacionados:** RF-033 a RF-038, RNF-001, RNF-004, RNF-005, RNF-006, RNF-007, RN-023 a RN-026

## Contexto

O MVP exige cadastro, login, logout e expiração controlada (RF-033 a RF-036). **Logout deve efetivamente invalidar a sessão**, e uma sessão adulterada deve ser rejeitada (RF-036). Credenciais inválidas geram mensagem genérica; tentativas repetidas sofrem limitação (RN-024, RNF-005). Senhas nunca podem ficar legíveis (RNF-001). Cliente e servidor ficam na **mesma origem** (ADR-0012).

## Decisão

1. **Sessões do lado do servidor**, guardadas no **PostgreSQL**. O cliente recebe um **token opaco e aleatório** (gerado por gerador criptograficamente seguro); no banco guarda-se **somente o hash** do token, com data de expiração.
2. **Cookie** `httpOnly`, `Secure` (em produção), `SameSite=Lax`, com caminho restrito. O JavaScript do navegador **nunca** vê o token.
3. **Expiração** configurável (💡 7 dias, Q11), **absoluta** no MVP. **Logout apaga** a sessão no servidor; sessões expiradas são recusadas e removidas de forma oportunista.
4. **Senhas:** hash adaptativo com sal. 💡 `scrypt` nativo do Node (sem dependência nativa), com parâmetros mínimos da OWASP vigente; alternativa `argon2id` (❓ Q39). Política mínima: ≥ 8 caracteres (Q11).
5. **Mensagens genéricas:** login inválido devolve `INVALID_CREDENTIALS` sem indicar se o e-mail existe (ERR-011). Cadastro com e-mail existente devolve mensagem **neutra** (ERR-010). O tempo de resposta não deve distinguir os casos de forma óbvia (executar o hash também quando o usuário não existe).
6. **Limitação de tentativas:** **contador de falhas por conta, no banco** (autoridade; funciona com várias instâncias) **mais** limitador por IP em memória como complemento (💡 5 falhas em 15 minutos, RNF-005).
7. **CSRF:** `SameSite=Lax` + exigência de `Content-Type: application/json` em mutações + verificação do cabeçalho `Origin`.
8. **Autorização:** a sessão resolve o usuário em um middleware; os repositórios filtram por ele (ADR-0008).
9. **Reautenticação (D-05):** resposta `401 UNAUTHENTICATED` → o cliente reautentica **sem tocar na store de laboratório** e repete a ação.
10. **Sem verificação de e-mail e sem recuperação de senha no MVP** (RF-039 é *Should*; exige serviço de e-mail).

## Alternativas consideradas

| Alternativa | Por que não |
|---|---|
| **JWT stateless em *cookie* ou *header*** | Logout e revogação reais exigem lista de bloqueio, o que recria o estado do servidor; mais pontos de erro sutis (algoritmo, expiração, rotação) |
| **JWT em `localStorage`** | Exposto a XSS; descartado |
| **Passport / bibliotecas de sessão** | Dependências desnecessárias para um fluxo pequeno e transparente |
| **Sessão em Redis** | Nova infraestrutura sem ganho na escala nominal (RNF-025) |
| **OAuth/login social** | *Won't* no MVP (RF-072) |
| **`argon2id` desde já** | Preferência da OWASP, mas exige dependência nativa; adiar até haver razão (Q39) |

## Justificativa

- Sessão no servidor torna **logout, expiração e invalidação** verdadeiras e testáveis (RF-035, RF-036).
- Guardar só o **hash do token** limita o dano de um vazamento do banco.
- Cookie `httpOnly` elimina o roubo do token por XSS.
- **Mesma origem** dispensa CORS e simplifica CSRF.
- Escopo pequeno e totalmente transparente, adequado a um projeto de portfólio que deve demonstrar compreensão, não só uso de bibliotecas.

## Consequências

**Positivas**
- Controle total do ciclo de vida da sessão; testes diretos de expiração e logout.
- Baixa superfície de dependências.

**Negativas / custos**
- Uma consulta ao banco por requisição autenticada (aceitável na escala nominal; índice por hash do token).
- Implementação própria exige cuidado: risco R-10 (falha sutil). Mitigações: código pequeno e revisado, testes de acesso cruzado, de expiração e de logout, checklist OWASP.
- Limitador por IP em memória não é compartilhado entre instâncias (RNF-027, *Should*); a contagem por conta, no banco, cobre o essencial.
- **Limitação aceita:** sem verificação de e-mail, não é possível impedir totalmente a *enumeração de contas* no cadastro; a mensagem neutra e o limite de taxa a reduzem.

## Pontos em aberto
- ❓ Q35 — confirmar sessão no banco (em vez de JWT).
- ❓ Q39 — `scrypt` nativo ou `argon2id`.
- ❓ Q11 — política de senha, duração da sessão e verificação de e-mail.
