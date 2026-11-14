# ADR-0011 — Renderização das visualizações em SVG com React

- **Status:** Proposta
- **Data:** 13/11/2026
- **Requisitos relacionados:** RF-016, RF-017, RF-018, RNF-009, RNF-015, RNF-017, RNF-018, RNF-019, RN-029

## Contexto

As estruturas precisam ser desenhadas e **animadas como movimento** entre passos (RF-018), com destaques que não dependam só de cor (RNF-018), respeitando movimento reduzido (RN-029) e sendo utilizáveis por teclado e leitores de tela (RNF-017, RNF-019). Os tamanhos são pequenos (até 50 elementos) e o fluxo é determinístico. A representação visual deve corresponder exatamente ao estado lógico em todos os passos, e isso deve ser testável (RF-016).

## Decisão

1. **SVG gerado por componentes React.** A interface visual de uma estrutura é uma **função pura do passo atual** (estado + destaques) e das preferências.
2. **Um visualizador por *tipo visual*** (sequência — vetor/barras, pilha, fila, lista ligada), **não por item**. Cada item declara na Engine qual tipo visual usa; assim, novos algoritmos sobre o mesmo tipo não exigem novo visualizador (RNF-023).
3. **Layout é função pura** (`estado → posições`), separado do componente e testável em Node.
4. **Animação por transições CSS** em elementos com **chave estável** (identidade do elemento na Engine, ADR-0003). Nenhuma biblioteca de animação no MVP.
5. **Movimento reduzido:** a preferência do sistema e uma opção do usuário desativam as transições; toda informação continua presente por destaque estático (RN-029).
6. **Acessibilidade:** cada visualizador produz também uma **descrição textual do estado** (para leitores de tela e para testes). Destaques usam **forma ou rótulo além de cor**. O texto da explicação do passo é anunciável (RNF-019, *Should*).
7. **Diálogos** com o elemento nativo `<dialog>`; biblioteca de componentes acessíveis só se surgirem lacunas reais.
8. **Testabilidade:** os elementos SVG expõem atributos de dados (identidade, valor, papel do destaque) para que testes de componente verifiquem, **para cada passo de cada item**, que o DOM reflete o estado lógico.

## Alternativas consideradas

| Alternativa | Por que não |
|---|---|
| **Canvas** | Mais rápido para milhares de elementos, mas inacessível por padrão, difícil de testar por DOM e sem necessidade para n ≤ 50 |
| **DOM/HTML + CSS** (divs posicionadas) | Funciona para barras e pilhas; ponteiros e setas da lista ligada ficam desajeitados |
| **D3** | Poderoso, mas disputa o controle do DOM com React; os layouts aqui são simples |
| **Framer Motion (ou similar)** | Facilita animações de layout, mas é dependência e não é necessária com transições CSS e chaves estáveis; reavaliar se houver necessidade real |
| **Bibliotecas de grafos/árvores prontas** | Escondem o que o projeto quer mostrar; difícil sincronizar com o modelo de passos |
| **WebGL/Three.js** | Desproporcional |

## Justificativa

- **SVG é declarativo, acessível e testável**, e combina com "UI = função do passo", reforçando a corretude de RF-016.
- Chaves estáveis (identidade da Engine) permitem que o próprio React/CSS anime o movimento sem lógica adicional.
- Layout puro isola a geometria, a parte mais fácil de errar, em funções testáveis.
- Evitar bibliotecas de animação e de visualização reduz dependências (ADR-0014).

## Consequências

**Positivas**
- Visualizadores simples e previsíveis; mesma entrada, mesmo SVG.
- Acessibilidade e testes de DOM acessíveis desde o início.
- Novos algoritmos sobre tipos visuais existentes não exigem trabalho visual.

**Negativas / custos**
- Desempenho de SVG degrada com muitos elementos; aceitável pelo limite (RN-002). Se os limites crescerem, reavaliar.
- Animações complexas (ex.: rotações de AVL, grafos) podem exigir mais trabalho ou biblioteca no futuro; fora do MVP.
- Cada **tipo visual novo** (árvore, grafo, hash) é um investimento de layout próprio.

**Riscos:** R-09 (acessibilidade de SVG animado subestimada) → descrição textual desde o primeiro visualizador; CSP e estilos inline do SVG a validar com a política de segurança (ADR-0012).
