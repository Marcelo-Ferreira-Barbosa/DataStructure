# DataStructure Studio — Visão Geral do Produto

> **Status do documento:** rascunho v0.1 (etapa de planejamento, sem código)
> **Convenção de leitura:** cada decisão é marcada como
> - ✅ **Confirmada** — informada explicitamente pelo autor do projeto;
> - 💡 **Sugestão** — proposta deste documento, ainda sujeita à aprovação;
> - ❓ **Em aberto** — precisa ser decidida antes de avançar.

---

## 1. Apresentação

O **DataStructure Studio** é uma plataforma interativa para aprender estruturas de dados e algoritmos. Em vez de apenas ler definições, a pessoa usuária **executa operações** (inserir, remover, buscar, ordenar), **vê a estrutura mudar** na tela e **acompanha cada passo** do algoritmo, podendo avançar, retroceder e pausar a execução.

O projeto é uma aplicação **Full Stack** com foco equilibrado entre Front-end e Back-end (✅), e com uma característica central: as estruturas de dados e os algoritmos são **implementações próprias**, e não wrappers de bibliotecas prontas (✅).

É um projeto de **portfólio real**, desenvolvido progressivamente por um estudante de Ciência da Computação (✅).

---

## 2. Problema que a plataforma pretende resolver

Estruturas de dados e algoritmos são conteúdo central da formação em computação, mas costumam ser aprendidos de forma pouco concreta:

1. **Abstração difícil de enxergar.** Ponteiros em uma lista ligada, rotações em uma árvore AVL ou a pilha de chamadas de uma recursão são difíceis de imaginar apenas lendo texto ou código.
2. **Material estático.** Livros e slides mostram "fotos" do estado, não a transição entre estados, que é onde o entendimento acontece.
3. **Visualizadores existentes costumam ser "caixas-pretas".** Muitos mostram a animação, mas não deixam claro *qual linha da lógica* está sendo executada, nem permitem comparar execuções ou salvar um cenário para revisitar.
4. **Distância entre teoria e prática.** Quem aprende vê a animação, mas raramente conecta com o código que a produz.

**O que o projeto quer resolver:** reduzir a distância entre o conceito, o código e o comportamento observável, dando controle ao estudante sobre a execução.

> 💡 *Nota de honestidade:* o problema não é inédito e já existem ferramentas de visualização. A justificativa do projeto depende dos diferenciais da seção 5 e da qualidade da execução, não da ausência de concorrentes.

---

## 3. Objetivos

### 3.1 Objetivo principal

Construir uma plataforma Full Stack em que estudantes e desenvolvedores **experimentem operações, visualizem estruturas dinamicamente e acompanhem a execução de algoritmos passo a passo** (✅).

### 3.2 Objetivos específicos

**De produto**
- Permitir manipular estruturas de dados por meio de operações interativas.
- Exibir a execução como uma sequência de passos navegáveis (avançar, voltar, pausar, ajustar velocidade).
- Explicar, em cada passo, o que está acontecendo e por quê. 💡
- Permitir salvar e reabrir experimentos. 💡

**Técnicos**
- Implementar estruturas de dados e algoritmos do zero, em TypeScript, de forma testável e isolada da interface (✅ implementação própria; 💡 isolamento em pacote separado).
- Organizar o código em monorepo com pnpm Workspaces (✅).
- Validar dados nas fronteiras da aplicação com Zod (✅).
- Garantir qualidade com testes unitários (Vitest) e de ponta a ponta (Playwright) (✅).
- Automatizar verificação com GitHub Actions e padronizar o ambiente com Docker (✅).

**De portfólio / formação**
- Demonstrar domínio de estruturas de dados, arquitetura de software e engenharia de qualidade.
- Servir como projeto evolutivo, com histórico de commits e documentação que mostrem o processo.

---

## 4. Público-alvo

| Perfil | Necessidade | Prioridade |
|---|---|---|
| Estudantes de graduação em computação (disciplinas de Estruturas de Dados / Algoritmos) | Visualizar e experimentar o que veem em aula | 💡 Principal |
| Autodidatas e iniciantes em programação | Entender o conceito de forma guiada | 💡 Secundário |
| Desenvolvedores se preparando para entrevistas técnicas | Revisar rapidamente o comportamento de estruturas/algoritmos | 💡 Secundário |
| Professores/monitores | Usar como apoio em aula | 💡 Fora do escopo do MVP |

O enunciado confirma "estudantes e desenvolvedores" (✅); a priorização acima é sugestão.

---

## 5. Proposta de valor e diferenciais

### 5.1 Proposta de valor

> *"Veja, controle e entenda cada passo de uma estrutura de dados ou algoritmo — e experimente você mesmo."*

### 5.2 Diferenciais candidatos

Os diferenciais abaixo são **sugestões**. A tabela indica o quanto cada um se sustenta; o diferencial só "conta" se for efetivamente entregue.

| # | Diferencial | Por que importa | Custo / risco | Avaliação |
|---|---|---|---|---|
| D1 | **Motor de execução por passos** (cada operação gera uma lista de eventos que a interface apenas "toca") | Permite voltar, pausar, ir ao passo N e testar a lógica sem interface. É a base de todo o resto. | Médio. Exige bom desenho do formato de "passo". | 💡 **Núcleo do produto** |
| D2 | **Implementação própria** das estruturas e algoritmos | É o que dá substância técnica ao portfólio e evita ser "só uma UI". | Médio; exige testes rigorosos. | ✅ Confirmado como requisito |
| D3 | **Explicação textual por passo** (o que aconteceu e por quê) | Transforma animação em aprendizado. | Baixo/Médio. | 💡 Forte candidato ao MVP |
| D4 | **Complexidade observável** (contagem de comparações/trocas/acessos por execução) | Conecta com Big-O de forma concreta. | Baixo, nasce quase de graça do motor de passos. | 💡 Forte candidato ao MVP |
| D5 | **Salvar e reabrir experimentos** (estado inicial + operações) | Justifica o Back-end e o banco de dados além de um CRUD. | Médio. | 💡 Candidato ao MVP |
| D6 | **Comparação lado a lado de algoritmos** (ex.: dois ordenadores sobre a mesma entrada) | Valor didático alto. | Médio/Alto na interface. | 💡 Versão futura |
| D7 | **Link compartilhável de experimento** | Útil para dúvidas entre colegas. | Baixo se D5 existir. | 💡 Versão futura |

**Avaliação crítica:** a plataforma se justifica principalmente por **D1 + D3 + D4**, e secundariamente por D5. Sem essa combinação, o projeto seria equivalente aos visualizadores que já existem. Esses três itens devem receber atenção de qualidade desde o início.

---

## 6. Principais funcionalidades previstas

Todas as funcionalidades abaixo são **sugestões** organizadas a partir do contexto fornecido, salvo as marcadas como confirmadas.

### 6.1 Interação e visualização
- Painel de operações por estrutura (inserir, remover, buscar, limpar, gerar dados aleatórios). ✅ *(experimentar operações)*
- Visualização dinâmica da estrutura. ✅
- Execução passo a passo, com controles de reprodução (play/pausa, anterior/próximo, velocidade, reiniciar). ✅ *(passo a passo)* / 💡 *(detalhes dos controles)*
- Destaque visual dos elementos envolvidos em cada passo. 💡
- Painel de explicação do passo atual. 💡
- Contadores de operações (comparações, trocas, acessos). 💡
- Histórico das operações executadas na sessão. 💡

### 6.2 Persistência e conta
- Salvar/abrir/excluir experimentos. 💡
- Autenticação de usuário. ❓ *(ver seção 12 e itens em aberto)*

### 6.3 Qualidade e engenharia
- Validação de entradas com Zod. ✅
- Testes unitários dos algoritmos e da API; testes E2E dos fluxos principais. ✅
- Pipeline de CI e ambiente Docker. ✅

---

## 7. Descrição dos laboratórios

Chamamos de **laboratório** cada módulo temático da plataforma, uma área dedicada a uma família de estruturas ou algoritmos, com seu próprio painel de operações e visualização.

> ❓ **A lista de laboratórios ainda não foi definida pelo autor.** A proposta abaixo é uma **sugestão** para discussão. Ela segue uma ordem crescente de dificuldade, pensando no desenvolvimento progressivo.

| Ordem | Laboratório | Conteúdo sugerido | Valor didático | Complexidade de implementação |
|---|---|---|---|---|
| 1 | **Estruturas lineares** | Array/vetor dinâmico, Pilha, Fila | Base de tudo; visualização simples | Baixa |
| 2 | **Listas ligadas** | Lista simplesmente ligada (depois duplamente ligada) | Mostra ponteiros e referências | Baixa/Média |
| 3 | **Ordenação** | Bubble, Selection, Insertion, Merge, Quick | Ótimo para passo a passo e comparação | Média |
| 4 | **Busca** | Busca linear e binária | Contraste de complexidade | Baixa |
| 5 | **Árvores** | BST; depois AVL | Rotações e balanceamento são o ponto de maior ganho visual | Média/Alta |
| 6 | **Heap / Fila de prioridade** | Min/Max Heap | Relação entre árvore e array | Média |
| 7 | **Tabelas hash** | Encadeamento e/ou endereçamento aberto | Colisões são muito didáticas | Média |
| 8 | **Grafos** | Representação, BFS, DFS; depois Dijkstra | Alto valor, mas maior custo de layout | Alta |

**Observação de escopo:** oito laboratórios completos não são realistas para o MVP. Veja a seção 8.

---

## 8. Definição do MVP

### 8.1 Princípio

O MVP deve provar **a ideia central** (motor de passos + visualização + explicação) em poucas estruturas bem feitas, e não cobrir muitas estruturas de forma rasa. 💡

### 8.2 Proposta de MVP (💡 sugestão)

**Incluído**
- **Laboratórios:** Estruturas lineares (Pilha, Fila), Lista ligada simples, Ordenação (Bubble, Insertion, Merge) e Busca (linear e binária).
- **Núcleo de execução passo a passo** (gerar passos, reproduzir, voltar, avançar, velocidade).
- **Explicação textual** e **contadores** por execução.
- **API Node/Express** com **persistência em PostgreSQL via Prisma** para salvar e reabrir experimentos.
- **Validação com Zod** nas entradas da API e do formulário.
- **Testes:** unitários cobrindo o núcleo de estruturas/algoritmos; ao menos alguns fluxos E2E com Playwright.
- **Docker** (ambiente de desenvolvimento) e **GitHub Actions** (lint, tipos, testes).

**Critério de corte:** se o tempo apertar, o MVP pode ser reduzido a *Pilha + Fila + Lista ligada + Bubble/Insertion Sort*, desde que o motor de passos e a persistência estejam sólidos.

### 8.3 Por que esse recorte?

- Cobre **três paradigmas diferentes** (linear, ligada, algoritmos), o suficiente para validar o formato de "passo" de forma genérica.
- Evita as partes mais custosas (layout de árvores e grafos) até que o motor esteja estável.
- Exercita o Back-end com algo além de CRUD (execução, validação, persistência de experimentos).

---

## 9. Funcionalidades para versões futuras

Todas as itens são 💡 sugestões:

- Laboratórios de **Árvores (BST/AVL)**, **Heap**, **Tabelas hash** e **Grafos**.
- **Comparação lado a lado** de algoritmos (D6).
- **Compartilhamento por link** (D7).
- **Modo "desafio"**: exercícios com verificação automática. 
- **Editor de código** para o usuário implementar a própria versão e ver a visualização (alto custo; exige execução segura de código).
- **Exportar** execução (imagem/GIF/JSON).
- **Internacionalização** (pt-BR/en).
- **Acessibilidade avançada** (navegação por teclado completa, leitor de tela para os passos) *(o básico deve existir desde o MVP)*.
- Trilhas de estudo e acompanhamento de progresso.
- Área para professores.

---

## 10. Resultados esperados

**Para o produto**
- Uma aplicação funcional e publicável, em que uma pessoa consiga executar e entender, passo a passo, os algoritmos do MVP.

**Para o autor**
- Domínio demonstrável de estruturas de dados, TypeScript, arquitetura em monorepo, API, banco de dados, testes e CI.
- Um repositório com documentação e histórico que conte a evolução do projeto.

**Para o portfólio**
- Um projeto que, em uma demonstração de poucos minutos, mostre algo visualmente claro **e** tenha profundidade técnica verificável no código.

---

## 11. Critérios gerais de sucesso

Os critérios abaixo são 💡 sugestões e devem ser confirmados pelo autor.

**Funcionais**
- Cada estrutura/algoritmo do MVP executa corretamente todas as operações previstas.
- Toda execução pode ser navegada passo a passo, para frente e para trás.
- Um experimento salvo pode ser reaberto e reproduz exatamente o mesmo resultado.

**Qualidade técnica**
- Núcleo de algoritmos com cobertura de testes alta e testes baseados em propriedades simples (ex.: saída de ordenação está ordenada e é permutação da entrada).
- Pipeline de CI verde em todo merge para a branch principal.
- Projeto sobe com um único comando via Docker.
- Tipagem estrita sem `any` não justificado.

**De experiência**
- Uma pessoa nova consegue executar uma operação e entender o resultado **sem instruções externas**.
- Interface utilizável em notebook; fluida com entradas de tamanho didático (ex.: até ~50 elementos).

**De portfólio**
- README claro, com demonstração visual e decisões de arquitetura documentadas.

---

## 12. Limitações e riscos conhecidos

### 12.1 Riscos

| # | Risco | Impacto | Mitigação sugerida |
|---|---|---|---|
| R1 | **Escopo excessivo** (muitas estruturas + pilha de tecnologias grande) | Alto | MVP enxuto, entregas por laboratório, cortes explícitos |
| R2 | **Formato de "passo" mal desenhado** exige reescrever todos os laboratórios | Alto | Validar o formato com 2–3 estruturas diferentes antes de expandir; documentar o contrato |
| R3 | **Complexidade de visualização** (árvores e grafos) | Médio/Alto | Adiar para pós-MVP; escolher biblioteca/abordagem de renderização só depois |
| R4 | **Back-end "decorativo"** (virar apenas CRUD de experimentos) | Médio | Dar responsabilidades reais à API (validação, execução/verificação, regras) — decisão a tomar, ver seção 13 |
| R5 | **Curva de aprendizado** de muitas tecnologias ao mesmo tempo | Médio | Introduzir ferramentas progressivamente (ex.: Playwright e Actions após existir algo para testar) |
| R6 | **Concorrentes existentes** diminuem percepção de novidade | Médio | Concentrar-se em D1 + D3 + D4 e em qualidade de execução |
| R7 | **Desempenho** do front com muitas animações/elementos | Baixo/Médio | Limitar tamanho de entrada no MVP |
| R8 | **Tempo disponível** de um estudante em paralelo à graduação | Alto | Marcos pequenos, projeto utilizável a cada etapa |

### 12.2 Limitações assumidas (💡)
- Foco em **fins didáticos**, não em benchmark real de desempenho.
- Entradas de tamanho pequeno/médio.
- Sem execução de código arbitrário de usuários no MVP.
- Sem recursos de colaboração em tempo real no MVP.

### 12.3 Observações sobre a stack (✅ confirmada, com pontos de atenção)
- **TypeScript e JavaScript listados juntos:** não são alternativas excludentes, mas convém registrar a regra de uso (sugestão: TypeScript como padrão em todo o código; JavaScript apenas em arquivos de configuração quando necessário).
- **HTML5/CSS3** são a base da interface; com Tailwind, o CSS "puro" tende a ficar restrito a casos pontuais.
- **Volume de ferramentas:** Docker, GitHub Actions, Playwright e pnpm Workspaces agregam valor, mas também esforço de configuração. A ordem de introdução importa (ver R5).

---

## 13. Quadro de decisões

### 13.1 Decisões confirmadas ✅
- Nome: **DataStructure Studio**.
- Natureza: plataforma interativa de aprendizado de estruturas de dados e algoritmos.
- Capacidades centrais: experimentar operações, visualizar dinamicamente, acompanhar a execução passo a passo.
- Aplicação **Full Stack**, com foco equilibrado entre Front-end e Back-end.
- **Implementação própria** de estruturas de dados e algoritmos.
- **Não** será um CRUD simples.
- Projeto de portfólio, desenvolvido progressivamente por estudante de Ciência da Computação.
- Stack: React, TypeScript, JavaScript, Node.js, Express, PostgreSQL, Prisma, HTML5/CSS3, Vite, Tailwind CSS, Zustand, Zod, Vitest, Playwright, Docker, GitHub Actions, pnpm Workspaces.

### 13.2 Sugestões deste documento 💡 (aguardando aprovação)
- Priorização do público (estudantes de graduação como foco principal).
- Diferenciais D1–D5 como núcleo; D6–D7 como futuro.
- Lista de laboratórios (seção 7) e recorte de MVP (seção 8).
- Critérios de sucesso (seção 11).
- Estrutura do monorepo com um pacote separado para o núcleo de algoritmos, independente da interface.

### 13.3 Pontos em aberto ❓
1. **Laboratórios do MVP:** o recorte sugerido está adequado? Quais laboratórios são imprescindíveis para o autor?
2. **Autenticação:** haverá contas de usuário no MVP ou experimentos anônimos/locais? (Impacta modelo de dados e segurança.)
3. **Onde executa a lógica dos algoritmos:** apenas no navegador, apenas na API, ou ambos? Esta decisão define o papel real do Back-end e é crítica para evitar o risco R4.
4. **Idioma da interface** (pt-BR, en ou ambos) e do código/documentação.
5. **Deploy/publicação:** haverá versão online? Onde? (Afeta Docker e CI/CD.)
6. **Estratégia de renderização das visualizações** (SVG, Canvas, DOM) — pode ser decidida na etapa de arquitetura.
7. **Meta de tempo/prazo** para o MVP.
8. **Nível de acessibilidade** exigido no MVP.
9. **Licença** do repositório e política de contribuição.

---

*Fim do documento. Próximas etapas (arquitetura, modelo de dados, estrutura do monorepo, etc.) só serão iniciadas mediante solicitação.*
