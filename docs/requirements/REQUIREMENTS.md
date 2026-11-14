# DataStructure Studio — Levantamento de Requisitos

> **Versão:** 0.1 (rascunho para validação)
> **Data:** 12/11/2026
> **Base:** `docs/product/PROJECT_OVERVIEW.md` v0.1
> **Escopo desta etapa:** definir *o que* o sistema deve fazer e com que qualidade. Não define arquitetura, tecnologias de implementação, modelo de dados nem layout de telas.

---

## 1. Como ler este documento

### 1.1 Convenções de status
Mantém-se a convenção do documento anterior:

- ✅ **Confirmado:** informado explicitamente pelo autor do projeto.
- 💡 **Sugestão:** proposta deste levantamento, aguardando aprovação. Valores numéricos (limites, tempos, metas) são sugestões, salvo indicação contrária.
- ❓ **Em aberto:** precisa de decisão do autor. Os itens estão consolidados na seção 9.

### 1.2 Priorização MoSCoW e mapeamento para versões

| MoSCoW | Significado neste projeto | Onde está neste documento |
|---|---|---|
| **Must** | Indispensável para o MVP. Sem ele o MVP não é entregue. | Seção 4 |
| **Should** | Importante, deve entrar logo após o MVP (versão 2). | Seção 5 |
| **Could** | Desejável, entra se houver tempo/valor (versão 3 em diante). | Seção 5 |
| **Won't** | **Não será desenvolvido neste primeiro momento.** Pode ser reavaliado depois. | Seção 6 |

### 1.3 Identificação
- **RF-nnn:** requisito funcional. **RNF-nnn:** requisito não funcional.
- Os códigos são únicos e **permanentes**: não são reaproveitados nem renumerados, mesmo que um requisito mude de prioridade.
- A numeração segue a ordem das áreas funcionais (seção 3), não a prioridade. Por isso, a seção 4 mostra números com "saltos", que correspondem a requisitos tratados na seção 5 ou 6.

### 1.4 Formato dos critérios de aceitação
Cada critério é verificável por teste automatizado ou inspeção objetiva. "Dado/Quando/Então" é usado quando ajuda a eliminar ambiguidade.

---

## 2. Glossário e premissas

### 2.1 Glossário

| Termo | Definição (💡 proposta) |
|---|---|
| **Laboratório** | Módulo temático da plataforma (ex.: Ordenação, Listas ligadas). Agrupa estruturas/algoritmos relacionados. |
| **Estrutura / Algoritmo** | Item executável dentro de um laboratório (ex.: Pilha, Bubble Sort). |
| **Operação** | Ação do usuário sobre uma estrutura (ex.: empilhar 7) ou execução de um algoritmo sobre uma entrada (ex.: ordenar). |
| **Execução** | Resultado de uma operação: uma sequência ordenada e finita de **passos**. |
| **Passo** | Unidade observável de uma execução. Associa o estado da estrutura, os elementos em destaque, a explicação, a linha de pseudocódigo e os contadores naquele instante. |
| **Simulação** | Conjunto salvável composto por: dados iniciais + sequência de operações executadas. É o termo adotado para o que o `PROJECT_OVERVIEW.md` chamava de "experimento". |
| **Projeto** | Contêiner nomeado, pertencente a um usuário, que organiza simulações. |
| **Histórico da sessão** | Lista das operações feitas na sessão de trabalho atual (volátil até ser salva). |
| **Histórico de simulações** | Lista das simulações **salvas** de um projeto (persistente). |
| **Visitante** | Pessoa que usa a plataforma sem conta. |
| **Catálogo MVP** | Conjunto de estruturas e algoritmos do MVP, descrito no Anexo A. |

### 2.2 Premissas assumidas (todas 💡/❓, a validar)

- **P1.** O Catálogo MVP é o do Anexo A (Pilha, Fila, Lista ligada simples, Bubble/Insertion/Merge Sort, busca linear e binária). Está pendente de confirmação.
- **P2.** O MVP trabalha com **números inteiros** como valores dos elementos.
- **P3.** A **autenticação existe no MVP** porque o enunciado lista "usuários e autenticação" e a persistência precisa de dono. Os laboratórios, porém, **não exigem login** (modo visitante).
- **P4.** O sistema é uma aplicação web usada em navegador. Aplicativos nativos estão fora do escopo.
- **P5.** Este documento é **agnóstico quanto ao local de execução da lógica** (navegador ou servidor). Os requisitos dizem *que* a execução deve ser gerada e reproduzível, não *onde*. Essa decisão pertence à etapa de arquitetura.

---

## 3. Áreas funcionais e distribuição dos requisitos

| Área | Requisitos |
|---|---|
| Navegação e dashboard | RF-001 a RF-003 |
| Acesso aos laboratórios | RF-004 a RF-006 |
| Operações com estruturas de dados | RF-007 a RF-015 |
| Visualizações e animações | RF-016 a RF-019 |
| Execução passo a passo | RF-020 a RF-027 |
| Pseudocódigo | RF-028, RF-029 |
| Análise de complexidade | RF-030 a RF-032 |
| Usuários e autenticação | RF-033 a RF-041 |
| Criação e gerenciamento de projetos | RF-042 a RF-048 |
| Persistência e histórico de simulações | RF-049 a RF-054 |
| Expansão de conteúdo e recursos futuros | RF-055 a RF-074 |

**Totais por prioridade**

| | Must | Should | Could | Won't | Total |
|---|---|---|---|---|---|
| Requisitos funcionais | 41 | 12 | 12 | 9 | 74 |
| Requisitos não funcionais | 26 | 8 | 1 | 3 | 38 |

---

## 4. Obrigatórios para o MVP (Must)

### 4.1 Requisitos funcionais

#### Navegação e dashboard

##### RF-001 — Navegação principal
- **Prioridade:** Must · **Dependências:** —
- **Descrição:** o sistema oferece um menu persistente com acesso a Início/Dashboard, Laboratórios, Projetos (para usuário autenticado) e Entrar/Conta.
- **Critérios de aceitação:**
  - O menu está presente em todas as telas da aplicação.
  - A página atual é identificada visualmente e para leitores de tela.
  - Para o visitante, itens que exigem conta ficam ocultos ou levam a um convite claro para entrar (decisão de UX, não afeta o requisito).

##### RF-002 — Dashboard
- **Prioridade:** Must · **Dependências:** RF-001, RF-004, RF-043
- **Descrição:** tela inicial com acesso rápido aos laboratórios e, para o usuário autenticado, aos projetos recentes.
- **Critérios de aceitação:**
  - Usuário autenticado com projetos vê os 5 mais recentes (💡), ordenados por última atualização.
  - Usuário sem projetos vê um estado vazio com chamada para criar o primeiro.
  - O visitante vê os laboratórios e um convite para criar conta, sem elementos quebrados ou vazios.
  - Cada cartão leva ao destino com um clique.

##### RF-003 — URLs dedicadas e navegação do navegador
- **Prioridade:** Must · **Dependências:** RF-004
- **Descrição:** cada laboratório, estrutura/algoritmo e projeto possui endereço próprio, compatível com os botões voltar/avançar e com recarregar página.
- **Critérios de aceitação:**
  - Abrir diretamente a URL de um laboratório o exibe (inclusive para visitante).
  - Recarregar a página mantém o usuário no mesmo local.
  - URL inexistente exibe página "não encontrado" com caminho de volta ao início.
  - URL de projeto de outro usuário é tratada conforme RF-038.

#### Acesso aos laboratórios

##### RF-004 — Catálogo de laboratórios
- **Prioridade:** Must · **Dependências:** —
- **Descrição:** lista dos laboratórios disponíveis, com nome, descrição curta, itens contidos e nível de dificuldade.
- **Critérios de aceitação:**
  - Todos os laboratórios do Catálogo MVP aparecem.
  - O catálogo é acessível sem login.
  - Laboratórios planejados e ainda indisponíveis (se exibidos) aparecem como "em breve" e não clicáveis.

##### RF-005 — Abertura de laboratório e seleção de estrutura/algoritmo
- **Prioridade:** Must · **Dependências:** RF-004
- **Descrição:** ao abrir um laboratório, o usuário escolhe a estrutura ou algoritmo a explorar.
- **Critérios de aceitação:**
  - Após a seleção, o painel de operações, a visualização e o pseudocódigo correspondem ao item escolhido.
  - Trocar de item com trabalho não salvo e já executado exige confirmação.
  - Trocar de item reinicia a visualização para o estado inicial do novo item.

#### Operações com estruturas de dados

##### RF-007 — Operações de Pilha e Fila
- **Prioridade:** Must · **Dependências:** RF-020
- **Descrição:** Pilha: empilhar, desempilhar e consultar o topo. Fila: enfileirar, desenfileirar e consultar a frente.
- **Critérios de aceitação:**
  - Dado empilhar 1, 2, 3 e depois desempilhar, então o elemento removido é 3 e o topo passa a ser 2.
  - Dado enfileirar 1, 2, 3 e depois desenfileirar, então o elemento removido é 1 e a frente passa a ser 2.
  - Cada operação gera uma execução conforme RF-020.

##### RF-008 — Operações de Lista ligada simples
- **Prioridade:** Must · **Dependências:** RF-020
- **Descrição:** inserir no início, no fim e em uma posição; remover por valor e por posição; buscar por valor.
- **Critérios de aceitação:**
  - A inserção em posição P atualiza as ligações e a visualização mostra os ponteiros alterados.
  - A busca exibe o percurso nó a nó e termina indicando a posição encontrada ou a ausência.
  - Casos de borda (lista vazia, primeira e última posição) estão cobertos por testes.

##### RF-009 — Execução de algoritmos de ordenação
- **Prioridade:** Must · **Dependências:** RF-011, RF-020
- **Descrição:** o usuário executa Bubble Sort, Insertion Sort e Merge Sort sobre o conjunto de entrada definido.
- **Critérios de aceitação:**
  - O resultado final está ordenado e é uma permutação da entrada.
  - Entrada vazia ou com 1 elemento gera execução trivial, sem erro.
  - Elementos repetidos são tratados corretamente e preservam a ordem relativa original (os três algoritmos são estáveis).

##### RF-010 — Execução de algoritmos de busca
- **Prioridade:** Must · **Dependências:** RF-011, RF-020
- **Descrição:** busca linear e busca binária por um valor-alvo informado.
- **Critérios de aceitação:**
  - A busca linear informa a posição da primeira ocorrência ou "não encontrado".
  - Se a busca binária for solicitada sobre entrada não ordenada, o sistema avisa e oferece ordenar antes. Ela nunca executa em silêncio produzindo resultado incorreto.
  - A visualização mostra a faixa de busca sendo reduzida a cada passo na busca binária.

##### RF-011 — Definição dos dados de entrada
- **Prioridade:** Must · **Dependências:** RF-012, RF-015
- **Descrição:** o usuário define os dados iniciais de três formas: digitação manual, geração aleatória (informando o tamanho) e exemplos predefinidos.
- **Critérios de aceitação:**
  - A geração aleatória usa uma semente; a mesma semente reproduz o mesmo conjunto.
  - Existem exemplos predefinidos para ordenação e busca (💡 aleatório, já ordenado, ordem inversa, com repetições).
  - Valores aceitos: inteiros (premissa P2).

##### RF-012 — Validação de entradas
- **Prioridade:** Must · **Dependências:** —
- **Descrição:** toda entrada do usuário é validada quanto a formato, faixa e tamanho antes de ser usada.
- **Critérios de aceitação:**
  - Valores não numéricos são rejeitados com mensagem que indica o campo e o motivo.
  - Uma entrada inválida nunca altera o estado da estrutura nem inicia execução.
  - Mensagens usam linguagem simples, sem jargão técnico interno.

##### RF-013 — Operações inválidas como evento didático
- **Prioridade:** Must · **Dependências:** RF-007, RF-008, RF-024
- **Descrição:** situações como desempilhar pilha vazia, posição inexistente ou remover valor ausente são tratadas como resultado explicado, não como falha do sistema.
- **Critérios de aceitação:**
  - O sistema informa o motivo em linguagem didática (ex.: "a pilha está vazia, não há o que remover").
  - A estrutura permanece inalterada.
  - O evento aparece no histórico da sessão (RF-025).

##### RF-014 — Limpar e reiniciar
- **Prioridade:** Must · **Dependências:** RF-011
- **Descrição:** o usuário pode esvaziar a estrutura ou restaurar o estado inicial da simulação.
- **Critérios de aceitação:**
  - Há confirmação quando existe trabalho executado e não salvo.
  - Após a ação, visualização, contadores, explicação e histórico da sessão voltam ao estado inicial.

##### RF-015 — Limites de entrada
- **Prioridade:** Must · **Dependências:** —
- **Descrição:** o sistema impõe limite de quantidade de elementos (💡 máx. 50) e faixa de valores (💡 -999 a 999).
- **Critérios de aceitação:**
  - Exceder o limite é bloqueado com mensagem que informa o limite vigente.
  - Os limites são definidos em um único ponto de configuração, não repetidos em várias telas.

#### Visualizações e animações

##### RF-016 — Visualização do estado da estrutura
- **Prioridade:** Must · **Dependências:** RF-020
- **Descrição:** cada estrutura/algoritmo tem representação gráfica adequada (pilha vertical, fila horizontal, lista com nós e ponteiros, vetor em células ou barras).
- **Critérios de aceitação:**
  - A representação visual corresponde exatamente ao estado lógico em todos os passos (verificável por teste automatizado).
  - A visualização atualiza após cada operação e a cada passo.
  - Estrutura vazia tem representação explícita, não uma área em branco.

##### RF-017 — Destaque dos elementos envolvidos
- **Prioridade:** Must · **Dependências:** RF-016, RF-020
- **Descrição:** os elementos participantes do passo atual (comparados, trocados, apontados, faixa de busca) são destacados.
- **Critérios de aceitação:**
  - Em cada passo de comparação, os dois elementos comparados estão destacados.
  - O destaque some quando o elemento deixa de estar envolvido.
  - Os destaques não dependem apenas de cor (ver RNF-018).

##### RF-018 — Animação de transições
- **Prioridade:** Must · **Dependências:** RF-016, RF-022
- **Descrição:** mudanças de estado entre passos são animadas.
- **Critérios de aceitação:**
  - Uma troca de posições aparece como movimento, não como "salto".
  - A duração da animação acompanha a velocidade escolhida (RF-022).
  - Com a preferência de movimento reduzido ativa, ou com a opção desligada, a transição é instantânea e nenhuma informação se perde.

#### Execução passo a passo

##### RF-020 — Geração da execução em passos
- **Prioridade:** Must · **Dependências:** RF-007, RF-008, RF-009, RF-010
- **Descrição:** toda operação ou algoritmo produz uma execução: sequência ordenada e finita de passos. Cada passo carrega o estado resultante, os destaques, a explicação, a linha de pseudocódigo e os contadores.
- **Critérios de aceitação:**
  - A execução é determinística: mesma entrada e mesma operação geram a mesma sequência (RNF-029).
  - O estado do último passo coincide com o resultado esperado da operação.
  - O primeiro passo representa o estado anterior à operação.
  - Toda execução termina (não há laço infinito para nenhuma entrada válida).

##### RF-021 — Controles de reprodução
- **Prioridade:** Must · **Dependências:** RF-020
- **Descrição:** iniciar/pausar, avançar um passo, retroceder um passo e reiniciar a execução.
- **Critérios de aceitação:**
  - Retroceder do passo N restaura exatamente o estado do passo N-1, incluindo contadores, destaques, explicação e linha de pseudocódigo.
  - "Retroceder" fica desabilitado no primeiro passo e "avançar" no último.
  - Pausar mantém o estado atual e permite retomar do mesmo ponto.
  - Ao chegar ao último passo em reprodução automática, a reprodução para e sinaliza o fim.

##### RF-022 — Controle de velocidade
- **Prioridade:** Must · **Dependências:** RF-021
- **Descrição:** o usuário escolhe a velocidade da reprodução automática, inclusive durante a reprodução.
- **Critérios de aceitação:**
  - Há ao menos 3 níveis (💡 0,5x, 1x, 2x).
  - A troca de velocidade durante a reprodução vale a partir do passo seguinte, sem reiniciar.

##### RF-023 — Indicador de progresso
- **Prioridade:** Must · **Dependências:** RF-020
- **Descrição:** o sistema mostra a posição atual na execução ("Passo X de N") com indicação visual de progresso.
- **Critérios de aceitação:**
  - O indicador é atualizado ao avançar, retroceder e reiniciar.
  - O valor de N corresponde ao total real de passos da execução.

##### RF-024 — Explicação textual por passo
- **Prioridade:** Must · **Dependências:** RF-020
- **Descrição:** cada passo exibe uma explicação em linguagem simples do que acontece e por quê (ex.: "Comparando 5 com 3: 5 é maior, então os dois trocam de lugar").
- **Critérios de aceitação:**
  - Todo passo de todo item do Catálogo MVP tem explicação não vazia (verificável por teste).
  - A explicação cita os valores e posições reais envolvidos, não texto genérico.
  - A explicação muda em sincronia com o estado ao avançar e ao retroceder.

##### RF-025 — Histórico de operações da sessão
- **Prioridade:** Must · **Dependências:** RF-020
- **Descrição:** lista cronológica das operações executadas na sessão atual, com tipo, parâmetros e resultado.
- **Critérios de aceitação:**
  - Cada operação concluída, inclusive as inválidas de RF-013, aparece na ordem em que ocorreu.
  - Reiniciar (RF-014) limpa o histórico após confirmação.
  - Este histórico é a base do que será salvo em RF-049 e é diferente do histórico de simulações (RF-051).

#### Pseudocódigo

##### RF-028 — Apresentação do pseudocódigo
- **Prioridade:** Must · **Dependências:** RF-005
- **Descrição:** o pseudocódigo da operação ou algoritmo selecionado fica visível ao lado da visualização.
- **Critérios de aceitação:**
  - Existe pseudocódigo para todas as operações e algoritmos do Catálogo MVP.
  - Em telas de desktop, o pseudocódigo cabe sem rolagem horizontal.
  - O idioma do pseudocódigo segue a decisão ❓ da seção 9.

##### RF-029 — Realce da linha corrente
- **Prioridade:** Must · **Dependências:** RF-020, RF-028
- **Descrição:** a linha de pseudocódigo correspondente ao passo atual é realçada e acompanha a navegação.
- **Critérios de aceitação:**
  - Ao avançar ou retroceder, o realce acompanha o passo.
  - Todo passo mapeia para ao menos uma linha existente (teste automatizado percorre todos os passos de todos os itens do Catálogo MVP).

#### Análise de complexidade

##### RF-030 — Contadores de operações
- **Prioridade:** Must · **Dependências:** RF-020
- **Descrição:** o sistema exibe contadores acumulados até o passo atual: comparações, trocas/movimentações, acessos (quando aplicável) e passos.
- **Critérios de aceitação:**
  - Os valores acompanham o passo exibido; ao retroceder, diminuem de forma consistente.
  - As definições de "comparação", "troca" e "acesso" estão documentadas e são aplicadas uniformemente a todos os algoritmos.
  - Os totais coincidem com valores esperados definidos em casos de teste documentados.

##### RF-031 — Complexidade teórica
- **Prioridade:** Must · **Dependências:** RF-005
- **Descrição:** para cada algoritmo e operação, o sistema apresenta a complexidade de tempo (melhor, médio e pior caso) e de espaço, com nota explicativa curta.
- **Critérios de aceitação:**
  - Há informação para todo item do Catálogo MVP.
  - Os valores são conferidos contra referência bibliográfica citada na documentação (ex.: busca binária: O(log n) em tempo e O(1) em espaço).

#### Usuários e autenticação

##### RF-033 — Cadastro de usuário
- **Prioridade:** Must · **Dependências:** RF-012
- **Descrição:** a pessoa cria uma conta com e-mail, nome de exibição e senha.
- **Critérios de aceitação:**
  - A senha atende à política mínima (💡 ≥ 8 caracteres).
  - E-mail já cadastrado é tratado sem expor dados da conta existente.
  - Após o cadastro, a pessoa consegue entrar com as credenciais criadas.
  - Verificação de e-mail ❓ (💡 não exigida no MVP).

##### RF-034 — Login
- **Prioridade:** Must · **Dependências:** RF-033
- **Descrição:** autenticação por e-mail e senha.
- **Critérios de aceitação:**
  - Credenciais válidas iniciam a sessão e levam ao dashboard.
  - Credenciais inválidas geram mensagem genérica, que não revela se o e-mail existe.
  - Tentativas repetidas falhas sofrem limitação (RNF-005).

##### RF-035 — Logout
- **Prioridade:** Must · **Dependências:** RF-034
- **Descrição:** o usuário encerra a sessão.
- **Critérios de aceitação:**
  - Após o logout, páginas protegidas redirecionam ao login.
  - Dados da conta ficam inacessíveis, inclusive com o botão voltar do navegador.

##### RF-036 — Manutenção e expiração de sessão
- **Prioridade:** Must · **Dependências:** RF-034
- **Descrição:** a sessão persiste entre recarregamentos por um tempo definido e expira de forma controlada.
- **Critérios de aceitação:**
  - A duração da sessão é configurável (💡 7 dias ❓).
  - Ao expirar, a próxima ação protegida pede novo login sem perder a simulação que está em memória.
  - Uma sessão adulterada ou inválida é rejeitada.

##### RF-037 — Modo visitante
- **Prioridade:** Must · **Dependências:** RF-004, RF-005
- **Descrição:** laboratórios, execução passo a passo, pseudocódigo e complexidade funcionam sem conta. Salvar e gerenciar projetos exigem login.
- **Critérios de aceitação:**
  - O visitante executa todo o fluxo de RF-007 a RF-031 sem ser interrompido.
  - Ao tentar salvar, é convidado a entrar ou cadastrar-se e é informado de que o trabalho não salvo pode ser perdido (ver RF-054, que o preserva).

##### RF-038 — Acesso restrito aos próprios dados
- **Prioridade:** Must · **Dependências:** RF-034
- **Descrição:** cada usuário só lista, abre, altera ou exclui seus próprios projetos e simulações.
- **Critérios de aceitação:**
  - Tentativa de acessar recurso de outro usuário é negada sem revelar se o recurso existe.
  - Há teste automatizado cobrindo todos os pontos de acesso a projetos e simulações (RNF-004).

#### Criação e gerenciamento de projetos

##### RF-042 — Criar projeto
- **Prioridade:** Must · **Dependências:** RF-034, RF-038
- **Descrição:** o usuário autenticado cria um projeto informando nome (obrigatório), descrição (opcional) e laboratório associado.
- **Critérios de aceitação:**
  - Nome com tamanho fora do intervalo definido (💡 3 a 60 caracteres) é rejeitado.
  - O projeto criado aparece imediatamente na lista (RF-043).
  - A política para nomes duplicados está definida (💡 permitidos) ❓.

##### RF-043 — Listar projetos
- **Prioridade:** Must · **Dependências:** RF-042
- **Descrição:** lista os projetos do usuário com nome, laboratório, data da última atualização e quantidade de simulações.
- **Critérios de aceitação:**
  - A lista é paginada (RNF-026).
  - Ordem padrão: mais recentemente atualizado primeiro.
  - Sem projetos, exibe estado vazio com chamada para criar.

##### RF-044 — Abrir projeto
- **Prioridade:** Must · **Dependências:** RF-043, RF-051
- **Descrição:** abre o projeto no laboratório associado, mostrando o histórico de simulações e permitindo retomar a mais recente.
- **Critérios de aceitação:**
  - Abrir um projeto sem simulações abre o laboratório em estado inicial.
  - Abrir um projeto com simulações oferece retomar a última ou escolher outra.

##### RF-045 — Editar projeto
- **Prioridade:** Must · **Dependências:** RF-042
- **Descrição:** renomear e alterar a descrição.
- **Critérios de aceitação:**
  - Valem as mesmas validações de RF-042.
  - A data de atualização é modificada.

##### RF-046 — Excluir projeto
- **Prioridade:** Must · **Dependências:** RF-042
- **Descrição:** exclusão com confirmação explícita; remove também as simulações do projeto.
- **Critérios de aceitação:**
  - A confirmação informa que a ação é irreversível e quantas simulações serão removidas.
  - Após excluído, o projeto e suas simulações não aparecem em listas nem são acessíveis por URL.

#### Persistência e histórico de simulações

##### RF-049 — Salvar simulação
- **Prioridade:** Must · **Dependências:** RF-025, RF-042
- **Descrição:** salva, dentro de um projeto, os dados iniciais e a sequência de operações da sessão, com nome e data.
- **Critérios de aceitação:**
  - A simulação salva aparece no histórico do projeto (RF-051).
  - Em caso de falha ao salvar, o usuário é informado, o trabalho em memória é preservado e é possível tentar novamente (RNF-032).
  - O nome tem sugestão automática (💡 laboratório + data/hora) e pode ser editado.

##### RF-050 — Reabrir e reproduzir simulação
- **Prioridade:** Must · **Dependências:** RF-049, RF-020
- **Descrição:** carregar uma simulação salva e reproduzi-la.
- **Critérios de aceitação:**
  - Reabrir e executar produz o mesmo estado final e a mesma sequência de passos da execução original (comparação automatizada).
  - O usuário pode continuar a simulação com novas operações.
  - Salvar após continuar cria nova entrada em vez de sobrescrever a original, salvo escolha explícita do usuário (💡 ❓).

##### RF-051 — Histórico de simulações do projeto
- **Prioridade:** Must · **Dependências:** RF-049
- **Descrição:** lista cronológica das simulações salvas de um projeto, com nome, data e resumo (laboratório, item e nº de operações).
- **Critérios de aceitação:**
  - Ordenado do mais recente ao mais antigo e paginado.
  - Cada item pode ser reaberto (RF-050).

---

### 4.2 Requisitos não funcionais

> Os valores numéricos são 💡 metas sugeridas, a validar na seção 9.

#### Segurança

| ID | Categoria | Descrição | Critério verificável | Prior. |
|---|---|---|---|---|
| RNF-001 | Segurança | Senhas nunca são armazenadas nem registradas em texto legível; usa-se mecanismo de proteção adequado a senhas (hash adaptativo, com sal). | Inspeção do banco e dos logs não revela senhas; teste automatizado garante que a resposta da API nunca contém a senha ou seu hash. | Must |
| RNF-002 | Segurança | Todo tráfego em produção ocorre por conexão criptografada (HTTPS). *(condicionado à decisão de deploy ❓)* | Requisição HTTP é redirecionada ou recusada; verificação com ferramenta de análise de TLS sem alertas críticos. | Must |
| RNF-003 | Segurança | Toda entrada é validada no lado do servidor, independentemente da validação do cliente. | Para cada ponto de entrada da API existe teste com payload inválido, que retorna erro 4xx padronizado sem efeito colateral. | Must |
| RNF-004 | Segurança | Autorização por propriedade do recurso: um usuário nunca acessa dados de outro. | Suíte de testes tenta, como usuário A, ler/alterar/excluir recursos do usuário B em todos os pontos de acesso e todas as tentativas são negadas. | Must |
| RNF-005 | Segurança | Proteção contra ameaças comuns da web (injeção, XSS, falsificação de requisição, força bruta no login). | Limitação de tentativas de login (💡 5 falhas em 15 min por conta/IP); checklist OWASP Top 10 revisado sem falha crítica aberta; auditoria de dependências no CI sem vulnerabilidade de severidade alta aberta. | Must |
| RNF-006 | Segurança | Nenhum segredo (chaves, senhas de banco, tokens) é versionado no repositório. | Verificação automatizada de segredos no CI passa; histórico do repositório sem credenciais. | Must |
| RNF-007 | Segurança / Privacidade | Coleta mínima de dados pessoais (e-mail e nome de exibição), em conformidade com a LGPD. | Lista de dados coletados e finalidade documentada; nenhum dado pessoal além do documentado é armazenado. | Must |

#### Desempenho

| ID | Categoria | Descrição | Critério verificável | Prior. |
|---|---|---|---|---|
| RNF-008 | Desempenho | As operações de API (autenticação, projetos, simulações) respondem rapidamente sob carga nominal. | Latência p95 ≤ 300 ms em teste automatizado com ambiente de referência e dados de volume nominal (RNF-025). | Must |
| RNF-009 | Desempenho | A visualização é fluida durante animações. | ≥ 30 quadros/s (meta 60) com entradas de até 50 elementos, em notebook de referência a definir ❓, medido com ferramenta de perfil do navegador. | Must |
| RNF-010 | Desempenho | A geração da execução completa é praticamente instantânea para entradas didáticas. | Para n = 50, geração dos passos de qualquer algoritmo do Catálogo MVP ≤ 100 ms (teste de benchmark automatizado). | Must |

#### Usabilidade

| ID | Categoria | Descrição | Critério verificável | Prior. |
|---|---|---|---|---|
| RNF-013 | Usabilidade | Toda ação do usuário recebe feedback visível imediato; estados de carregamento, vazio e erro são sempre comunicados. | Resposta visual a uma interação ≤ 100 ms; revisão de telas confirma que existem estados de carregamento, vazio e erro em todas as telas com dados remotos. | Must |

#### Responsividade

| ID | Categoria | Descrição | Critério verificável | Prior. |
|---|---|---|---|---|
| RNF-015 | Responsividade / Compatibilidade | A interface se adapta a diferentes larguras e funciona nos navegadores modernos. Prioridade: notebook e tablet; celular com funcionalidade completa, ainda que com layout simplificado ❓. | Sem rolagem horizontal da página nas larguras 360, 768, 1280 e 1920 px; fluxos principais passam nos testes E2E em Chromium, Firefox e WebKit; suporte às duas versões mais recentes de Chrome, Firefox, Edge e Safari ❓. | Must |

#### Acessibilidade

| ID | Categoria | Descrição | Critério verificável | Prior. |
|---|---|---|---|---|
| RNF-017 | Acessibilidade | Todos os controles de execução e operações podem ser usados só pelo teclado, com foco visível e ordem lógica. | Roteiro de teste manual de teclado cobre os fluxos principais; teste E2E percorre execução passo a passo apenas com teclado. | Must |
| RNF-018 | Acessibilidade | A informação visual não depende apenas de cor, e animações respeitam a preferência de movimento reduzido. | Destaques possuem marcador adicional (forma, rótulo ou padrão); com `prefers-reduced-motion` ativo não há animações de movimento; contraste de texto ≥ 4,5:1 verificado por ferramenta. | Must |

#### Manutenibilidade

| ID | Categoria | Descrição | Critério verificável | Prior. |
|---|---|---|---|---|
| RNF-020 | Manutenibilidade | **Independência e autoria do núcleo:** a lógica de estruturas e algoritmos não depende da interface nem de framework de UI e é implementação própria (requisito confirmado ✅ no Overview). | Regra automatizada de dependências comprova que o módulo do núcleo não importa framework de UI nem acesso ao DOM; revisão confirma que as operações observadas não delegam a funções prontas (ex.: ordenação nativa) ❓ ver definição de "implementação própria" na seção 9. | Must |
| RNF-021 | Manutenibilidade | Padrão de código uniforme com tipagem estrita. | Compilação em modo estrito sem erros; verificação de estilo e formatação automatizada; o CI falha em qualquer violação; uso de `any` apenas com justificativa documentada. | Must |
| RNF-022 | Manutenibilidade | Documentação suficiente para que uma pessoa nova consiga rodar e entender o projeto. | README com pré-requisitos, passo a passo de instalação e execução; decisões técnicas relevantes registradas; uma pessoa externa consegue subir o projeto seguindo apenas a documentação. | Must |
| RNF-023 | Manutenibilidade | Extensibilidade: acrescentar um novo algoritmo/estrutura não exige alterar o mecanismo de reprodução, os controles nem o painel de explicação/complexidade. | O 4º algoritmo adicionado após o MVP é incorporado sem alterar o código dos controles de reprodução (verificável no diff). | Must |
| RNF-024 | Manutenibilidade / Portabilidade | Ambiente de desenvolvimento reproduzível (✅ Docker na stack). | Em máquina limpa com apenas Docker instalado, o projeto sobe com um único comando documentado. | Must |

#### Escalabilidade

| ID | Categoria | Descrição | Critério verificável | Prior. |
|---|---|---|---|---|
| RNF-026 | Escalabilidade | Listagens que podem crescer são paginadas e consultadas de forma eficiente. | Listagens retornam no máximo 20 itens por página (💡); com 1.000 simulações por usuário, a listagem mantém RNF-008. | Must |

#### Testabilidade

| ID | Categoria | Descrição | Critério verificável | Prior. |
|---|---|---|---|---|
| RNF-028 | Testabilidade | Cobertura de testes unitários elevada no núcleo, com testes de propriedades simples para ordenação e busca. | Cobertura de linhas e ramos do núcleo ≥ 90% (💡) medida no CI; testes verificam que a saída de ordenação está ordenada e é permutação da entrada. | Must |
| RNF-029 | Testabilidade | Determinismo: mesma entrada e mesma operação produzem sempre a mesma execução; aleatoriedade usa semente registrada. | Teste executa a mesma operação duas vezes e compara as sequências de passos (idênticas); a semente é parte dos dados de simulação. | Must |
| RNF-030 | Testabilidade | Fluxos críticos cobertos por testes ponta a ponta (✅ Playwright). | Suíte E2E cobre: cadastro/login, execução passo a passo (avançar/retroceder), salvar e reabrir simulação, e modo visitante; executa no CI. | Must |
| RNF-031 | Testabilidade | Verificação automática a cada alteração. | CI executa verificação de tipos, estilo e testes em cada push e pull request; build falha se algo falhar; duração total ≤ 10 min (💡). | Must |

#### Confiabilidade

| ID | Categoria | Descrição | Critério verificável | Prior. |
|---|---|---|---|---|
| RNF-032 | Confiabilidade | Integridade: salvar uma simulação é tudo-ou-nada; uma falha nunca deixa registro parcial ou corrompido. | Teste com falha injetada durante o salvamento confirma que nada parcial permanece e que o usuário vê erro claro. | Must |
| RNF-034 | Confiabilidade | Erros inesperados não derrubam a aplicação; o usuário recebe mensagem amigável e a API responde em formato de erro padronizado. | Teste força exceções no cliente e na API: a interface exibe tela de contingência recuperável e a API retorna o formato padrão sem expor detalhes internos. | Must |

---

## 5. Importantes para versões posteriores (Should e Could)

### 5.1 Requisitos funcionais

| ID | Nome | Área | MoSCoW | Descrição | Critérios de aceitação | Dependências |
|---|---|---|---|---|---|---|
| RF-006 | Resumo conceitual | Laboratórios | Should | Cada estrutura/algoritmo apresenta uma breve explicação teórica (o que é, quando usar). | Existe texto para todo item do catálogo; texto curto o bastante para ser lido sem rolagem em desktop. | RF-005 |
| RF-019 | Legenda visual | Visualização | Should | Painel que explica o significado de cores, formas e setas usadas. | A legenda aparece em todo laboratório e cobre todos os tipos de destaque usados. | RF-017 |
| RF-026 | Ir diretamente a um passo | Execução | Should | Barra interativa para saltar a qualquer passo da execução. | Saltar ao passo N exibe o estado exato do passo N (incluindo contadores e pseudocódigo). | RF-021, RF-023 |
| RF-027 | Atalhos de teclado | Execução | Should | Atalhos para reproduzir/pausar, avançar, retroceder e reiniciar. | Cada atalho funciona e está listado em ajuda acessível; não conflita com atalhos do navegador. | RF-021, RNF-017 |
| RF-032 | Gráfico de crescimento | Complexidade | Could | Gráfico que compara contagens reais, em várias entradas, com a curva teórica. | Para 5 tamanhos de entrada, o gráfico exibe as contagens reais conforme RF-030 e a curva de referência. | RF-030, RF-031 |
| RF-039 | Recuperação de senha | Autenticação | Should | Redefinição de senha por link enviado ao e-mail. | O link expira (💡 1 h) e só pode ser usado uma vez; resposta idêntica para e-mail existente e inexistente. | RF-033, *serviço de e-mail* |
| RF-040 | Gerenciar perfil | Autenticação | Should | Editar nome de exibição e trocar senha. | Troca de senha exige a senha atual; sessões antigas são invalidadas (💡). | RF-034 |
| RF-041 | Exclusão de conta | Autenticação | Should | O usuário exclui a conta e todos os seus dados. *(Subir para Must se houver deploy público com usuários reais ❓, por conta da LGPD.)* | Após confirmação, conta, projetos e simulações são removidos definitivamente e o e-mail pode ser reutilizado. | RF-034, RF-046 |
| RF-047 | Busca, filtro e ordenação de projetos | Projetos | Should | Pesquisar por nome e filtrar/ordenar por laboratório e data. | A busca retorna só projetos do usuário; ordenações e filtros combinam corretamente. | RF-043 |
| RF-048 | Duplicar projeto | Projetos | Could | Cria cópia de um projeto com suas simulações. | A cópia é independente: alterações em um não afetam o outro. | RF-042, RF-049 |
| RF-052 | Renomear e excluir simulação | Persistência | Should | Gerenciar simulações individuais dentro do projeto. | Exclusão exige confirmação e é irreversível; renomear mantém data original. | RF-051 |
| RF-053 | Exportar e importar simulação (JSON) | Persistência | Could | Baixar e carregar uma simulação em arquivo. | Exportar e importar a mesma simulação reproduz execução idêntica (RF-050); arquivo inválido é rejeitado com mensagem clara. | RF-050 |
| RF-054 | Preservar trabalho do visitante | Persistência | Should | Ao entrar ou cadastrar-se, o trabalho não salvo do visitante é mantido e oferecido para salvar. | Após login, a simulação em memória continua intacta e pode ser salva em um projeto. | RF-037, RF-049 |
| RF-055 | Laboratório de Árvores (BST) | Conteúdo | Should | Inserção, remoção e busca em árvore binária de busca, com percursos. | Visualização em árvore, passo a passo, pseudocódigo e contadores como nos demais laboratórios; invariante da BST verificada por teste. | RF-020, RNF-023 |
| RF-056 | Árvores balanceadas (AVL) | Conteúdo | Could | Inserção/remoção com rotações visíveis. | Fator de balanceamento visível; toda rotação é um passo explicado; árvore resultante é sempre balanceada (teste). | RF-055 |
| RF-057 | Laboratório de Heap | Conteúdo | Could | Min/Max Heap com representação em árvore e em vetor. | As duas representações permanecem sincronizadas; propriedade do heap verificada por teste. | RF-020 |
| RF-058 | Laboratório de Tabelas hash | Conteúdo | Could | Hash com tratamento de colisões (encadeamento e/ou endereçamento aberto). | Colisões são destacadas e explicadas; função de hash exibida. | RF-020 |
| RF-059 | Laboratório de Grafos (BFS/DFS) | Conteúdo | Could | Representação de grafos e percursos em largura/profundidade. | Ordem de visita correta (teste); disposição legível para grafos de até 12 vértices (💡). | RF-020 |
| RF-060 | Ordenações adicionais | Conteúdo | Should | Selection Sort e Quick Sort. | Mesmos critérios de RF-009; estabilidade documentada (Selection e Quick não são estáveis). | RF-009 |
| RF-061 | Estruturas lineares adicionais | Conteúdo | Could | Array dinâmico e lista duplamente ligada. | Mesmos critérios de RF-007/RF-008, adaptados. | RF-007, RF-008 |
| RF-062 | Comparação lado a lado | Execução | Could | Executar dois algoritmos sobre a mesma entrada em painéis sincronizados. | Ambos recebem entrada idêntica; contadores comparáveis lado a lado; controle de reprodução comum. | RF-009, RF-030 |
| RF-063 | Compartilhamento por link | Persistência | Could | Gerar link que permite que outra pessoa visualize uma simulação. | Link reproduz a simulação em modo somente leitura; revogável pelo dono; não expõe outros dados (RNF-004). | RF-050, RF-038 |
| RF-064 | Pseudocódigo em TypeScript | Pseudocódigo | Could | Alternar a exibição entre pseudocódigo e código real. | Realce de linha sincronizado também no código real. | RF-029 |
| RF-065 | Internacionalização | Transversal | Could | Interface em mais de um idioma (pt-BR e en). | Todos os textos da interface e as explicações dos passos existem nos dois idiomas. | — |

### 5.2 Requisitos não funcionais

| ID | Categoria | Descrição | Critério verificável | Prior. |
|---|---|---|---|---|
| RNF-011 | Desempenho | Carregamento inicial rápido. | LCP ≤ 2,5 s em conexão simulada de banda larga; tamanho do pacote inicial dentro do orçamento definido (💡 ≤ 300 KB comprimido ❓). | Should |
| RNF-012 | Usabilidade | O estudante novo executa sua primeira operação e entende o resultado sem instruções externas (critério do Overview). | Teste com ≥ 5 pessoas: ≥ 80% executam uma operação e leem o resultado em ≤ 2 min sem ajuda. | Should |
| RNF-014 | Usabilidade | Linguagem e padrões de interface consistentes (rótulos, mensagens, componentes de controle). | Guia de textos/componentes documentado; revisão não encontra rótulos divergentes para a mesma ação. | Should |
| RNF-016 | Acessibilidade | Conformidade com WCAG 2.2 nível AA nas telas principais (💡 meta ❓). | Auditoria automatizada sem violações críticas ou sérias; revisão manual das telas principais. | Should |
| RNF-019 | Acessibilidade | A explicação de cada passo é anunciada por leitores de tela. | Teste manual com leitor de tela confirma que a explicação do passo é anunciada ao avançar/retroceder, sem anúncios duplicados. | Should |
| RNF-025 | Escalabilidade | Capacidade nominal de usuários simultâneos. | Teste de carga com 100 usuários simultâneos (💡) mantém RNF-008. | Could |
| RNF-027 | Escalabilidade | Possibilidade de executar mais de uma instância da API sem perda de funcionalidade. | Duas instâncias lado a lado passam na suíte E2E principal. | Should |
| RNF-033 | Confiabilidade | Simulações salvas continuam abrindo após evolução do sistema (versionamento do formato salvo). | Fixtures de simulações salvas em versões anteriores são reabertas com sucesso (e com resultado idêntico, quando aplicável) pelos testes. | Should |
| RNF-035 | Confiabilidade | Backup periódico do banco e meta de disponibilidade. *(condicionado à decisão de deploy ❓)* | Backup automático com restauração testada ao menos uma vez; disponibilidade mensal ≥ 99% (💡). | Should |

---

## 6. Fora do escopo neste primeiro momento (Won't)

Os itens abaixo **não serão desenvolvidos** até que o autor decida reavaliá-los. Estar aqui não significa descarte definitivo.

### 6.1 Requisitos funcionais

| ID | Nome | Motivo da exclusão | Quando reavaliar |
|---|---|---|---|
| RF-066 | Editor de código do usuário com visualização | Exige execução segura de código arbitrário; custo e risco muito altos para o MVP. | Após estabilizar o motor de passos e se houver necessidade clara. |
| RF-067 | Colaboração em tempo real | Complexidade de sincronização sem relação com o objetivo central. | Somente se houver uso em sala de aula. |
| RF-068 | Área do professor / turmas | Exige papéis, permissões e fluxos adicionais. | Após validação com estudantes. |
| RF-069 | Modo desafio com correção automática | Exige banco de exercícios e critérios de correção. | Depois de existirem vários laboratórios. |
| RF-070 | Trilhas de estudo e acompanhamento de progresso | Dependem de conteúdo curricular e de métricas por usuário. | Depois de RF-069. |
| RF-071 | Exportar execução como GIF ou vídeo | Custo técnico alto; exportação em JSON (RF-053) cobre a necessidade básica. | Se houver demanda de compartilhamento. |
| RF-072 | Login social / SSO | Aumenta superfície de segurança e configuração; e-mail/senha atende ao MVP. | Se houver deploy público. |
| RF-073 | Aplicativo móvel nativo | Fora do escopo web; responsividade (RNF-015) cobre o uso em celular. | Improvável. |
| RF-074 | Algoritmos avançados de grafos (Dijkstra, etc.) | Dependem do laboratório de Grafos (RF-059) e de bom layout. | Após RF-059. |

### 6.2 Requisitos não funcionais

| ID | Categoria | Descrição | Motivo da exclusão |
|---|---|---|---|
| RNF-036 | Confiabilidade/Escalabilidade | Alta disponibilidade multi-região e recuperação de desastres. | Desproporcional a um projeto de portfólio. |
| RNF-037 | Acessibilidade | Conformidade WCAG nível AAA. | A meta é AA (RNF-016). |
| RNF-038 | Confiabilidade | Funcionamento offline (PWA). | Fora do foco; exigiria sincronização de dados. |

---

## 7. Dependências entre requisitos

### 7.1 Cadeias críticas

1. **Motor de execução em passos (RF-020) é a raiz do produto.** Dele dependem RF-021 a RF-025 (reprodução, explicação, histórico), RF-028 e RF-029 (pseudocódigo), RF-030 (contadores), RF-016 a RF-018 (visualização) e RF-049/RF-050 (salvar e reproduzir). **O formato do "passo" precisa ser fechado antes de implementar qualquer laboratório** (ver risco R2 do Overview).
2. **Autenticação → Projetos → Persistência:** RF-033 → RF-034 → RF-038 → RF-042 → RF-049 → RF-051 → RF-050.
3. **Entrada de dados:** RF-012 (validação) e RF-015 (limites) sustentam RF-011, que alimenta RF-009 e RF-010.
4. **Determinismo (RNF-029):** é pré-condição de RF-050 (reproduzir) e de RF-053 (importar/exportar). Sem ele, "reabrir uma simulação" não é confiável.
5. **Extensibilidade (RNF-023) e independência do núcleo (RNF-020):** condicionam a viabilidade de todos os laboratórios futuros (RF-055 a RF-061).

### 7.2 Dependências externas

| Requisito | Depende de | Observação |
|---|---|---|
| RF-039 (recuperar senha) | Serviço de envio de e-mail | Introduz custo/infra. Por isso ficou como Should. |
| RNF-002, RNF-035, RF-041 | Decisão de deploy ❓ | O nível de exigência muda se houver uso público. |
| RNF-016 | Decisão de acessibilidade ❓ | Define a profundidade das auditorias. |

---

## 8. Conflitos e tensões identificados

| # | Conflito / tensão | Requisitos | Tratamento proposto |
|---|---|---|---|
| C1 | **Aprendizado sem atrito vs. necessidade de conta para salvar.** Exigir login para tudo prejudica a experiência; permitir tudo sem login cria um "meio caminho" confuso para salvar. | RF-037, RF-049, RF-054 | Visitante usa tudo, exceto salvar; RF-054 (Should) preserva o trabalho ao entrar. Até RF-054 existir, o aviso de RF-037 é obrigatório. |
| C2 | **Onde roda a lógica (navegador ou servidor)** não foi decidido e afeta desempenho, testes e o papel do Back-end. | RF-020, RNF-008, RNF-010, RNF-025, RNF-030 | Os requisitos foram escritos de forma agnóstica (premissa P5). A decisão é pré-requisito da etapa de arquitetura. Se tudo rodar no navegador, o Back-end se limita à conta e à persistência. |
| C3 | **O que é salvo:** apenas dados iniciais e operações (reconstrói os passos) ou também os passos gerados. Se o algoritmo for corrigido ou alterado depois, reconstruir pode gerar passos diferentes dos que o usuário viu. | RF-050, RNF-029, RNF-033 | Requisito RF-050 exige resultado idêntico. A estratégia fica para a arquitetura, mas RNF-033 garante que a decisão seja testada com fixtures. |
| C4 | **Responsividade vs. densidade da tela.** Visualização + pseudocódigo + explicação + contadores + controles competem por espaço, principalmente em celular. | RF-016, RF-028, RF-024, RNF-015 | O MVP prioriza notebook/tablet; em celular, painéis podem ficar em abas, desde que todas as funções existam (RNF-015 ❓). |
| C5 | **Animação vs. acessibilidade.** RF-018 pede movimento; usuários com sensibilidade a movimento precisam de alternativa. | RF-018, RNF-018 | Sem conflito real: ambos atendidos (movimento reduzido mantém a informação por destaque estático). |
| C6 | **Escopo do MVP vs. tempo disponível.** Há 41 requisitos Must funcionais e 26 não funcionais — muito para um estudante em ritmo progressivo (risco R1/R8 do Overview). | Seção 4 | Plano de corte, em ordem: (1) remover Merge Sort do MVP; (2) reduzir RF-031 a texto estático; (3) reduzir RNF-020/023 à prática sem automação; (4) reduzir o catálogo ao "MVP reduzido" do Overview (Pilha, Fila, Lista ligada e Bubble/Insertion). Os requisitos de motor, persistência e testes **não** devem ser cortados. |
| C7 | **Duas noções de "histórico".** Histórico da sessão (volátil) vs. histórico de simulações (salvo) podem confundir usuário e desenvolvedor. | RF-025, RF-051 | Nomes e definições distintos (glossário, seção 2); interface deve usar rótulos diferentes. |
| C8 | **Terminologia: "experimento" (Overview) vs. "simulação/projeto" (enunciado desta etapa).** | Seção 2 | Adotado "simulação" (conteúdo salvo) e "projeto" (contêiner). O Overview deve ser atualizado quando houver revisão. |
| C9 | **Aleatoriedade vs. determinismo.** Gerar dados aleatórios parece contradizer reprodutibilidade. | RF-011, RNF-029 | Aleatoriedade com semente armazenada junto à simulação. |
| C10 | **LGPD (exclusão de conta) classificada como Should, mas é obrigação legal se houver usuários reais.** | RF-041, RNF-007 | Subir para Must caso haja deploy público (❓). |
| C11 | **Acessibilidade AA como meta vs. prazo.** RNF-016 completo é custoso e fica como Should, enquanto o básico (RNF-017, RNF-018) é Must. | RNF-016, 017, 018 | Básico garantido no MVP; auditoria completa na versão 2. |
| C12 | **"Implementação própria" é ambígua.** Usar `Array` nativo como armazenamento de uma Pilha é aceitável? Usar `Array.sort` para validar resultados em testes é aceitável? | RNF-020 | Proposta: armazenamento básico nativo é permitido, mas operações observadas (push/pop lógico, comparações, trocas) são implementadas e instrumentadas pelo próprio núcleo; funções nativas só em testes de verificação. Precisa de confirmação ❓. |

---

## 9. Requisitos e decisões que precisam de esclarecimento

### 9.1 Decisões herdadas do documento anterior que impactam este documento

| # | Pergunta | Requisitos afetados |
|---|---|---|
| Q1 | **Autenticação no MVP e modo visitante:** confirmar a premissa P3 (conta existe, laboratórios abertos a visitantes). | RF-033 a RF-038, RF-054 |
| Q2 | **Onde a lógica dos algoritmos executa** (navegador, API ou ambos). | RF-020, RNF-008, RNF-010, RNF-025 |
| Q3 | **Idioma** da interface, das explicações dos passos e do pseudocódigo. | RF-024, RF-028, RF-065, RNF-014 |
| Q4 | **Deploy público?** Muda a exigência de HTTPS, backup, LGPD, disponibilidade. | RNF-002, RNF-035, RF-041, RF-072 |
| Q5 | **Nível de acessibilidade esperado** no MVP (básico vs. WCAG AA). | RNF-016 a RNF-019 |
| Q6 | **Prazo-alvo do MVP**, necessário para validar o plano de corte C6. | Seção 4 |
| Q7 | **Confirmação do Catálogo MVP** (Anexo A). | RF-004, RF-007 a RF-010, RF-028 |

### 9.2 Novos pontos levantados nesta etapa

| # | Pergunta | Sugestão | Requisitos |
|---|---|---|---|
| Q8 | Cada projeto está ligado a **um único laboratório** ou pode conter simulações de laboratórios diferentes? | Um laboratório por projeto (mais simples). | RF-042 a RF-044 |
| Q9 | **Tipos de dados** dos elementos: só inteiros? Texto/caracteres? | Só inteiros no MVP. | RF-011, RF-012 |
| Q10 | **Limites** de tamanho e faixa de valores. | 50 elementos; -999 a 999. | RF-015 |
| Q11 | **Política de senha**, verificação de e-mail e duração da sessão. | ≥ 8 caracteres; sem verificação no MVP; 7 dias. | RF-033, RF-036 |
| Q12 | **Nomes duplicados** de projetos são permitidos? | Sim. | RF-042 |
| Q13 | Ao continuar uma simulação reaberta, salvar **sobrescreve ou cria nova**? | Cria nova entrada por padrão. | RF-050 |
| Q14 | Definição de **"implementação própria"** (ver C12). | Ver C12. | RNF-020 |
| Q15 | **Suporte a celular** no MVP: funcionalidade completa ou apenas leitura? | Completa, com layout simplificado. | RNF-015 |
| Q16 | **Navegadores suportados** e dispositivo de referência para medir desempenho. | Duas últimas versões de Chrome, Firefox, Edge, Safari. | RNF-009, RNF-015 |
| Q17 | Definição formal das **contagens** ("comparação", "troca", "acesso") para cada algoritmo. | Documentar em um glossário técnico antes de implementar. | RF-030 |
| Q18 | **Fonte bibliográfica** de referência para complexidade e pseudocódigo (ex.: livro-texto adotado na disciplina). | Escolher uma obra e citá-la. | RF-028, RF-031 |
| Q19 | Metas numéricas de desempenho e carga (valores 💡 neste documento) estão adequadas ao contexto? | Manter e ajustar após a decisão de deploy. | RNF-008 a RNF-011, RNF-025 |

---

## Anexo A — Catálogo MVP (💡 sugerido, aguardando confirmação)

| Laboratório | Itens | Operações / execuções |
|---|---|---|
| Estruturas lineares | Pilha, Fila | Empilhar/desempilhar/topo; enfileirar/desenfileirar/frente |
| Listas ligadas | Lista ligada simples | Inserir (início/fim/posição), remover (valor/posição), buscar |
| Ordenação | Bubble Sort, Insertion Sort, Merge Sort | Ordenar a entrada definida |
| Busca | Busca linear, Busca binária | Buscar valor-alvo |

**MVP reduzido (plano de corte do Overview):** Pilha, Fila, Lista ligada simples, Bubble Sort e Insertion Sort, mantendo o motor de passos, a persistência e os testes.

---

*Fim do documento. A próxima etapa (arquitetura) só será iniciada mediante solicitação.*
