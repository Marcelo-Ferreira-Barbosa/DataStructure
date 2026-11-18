/**
 * Lista simplesmente encadeada genérica: o MODELO DE REFERÊNCIA do item.
 *
 * Estrutura real, feita de nós ligados por referência. Não há vetor por trás: a ordem vem só de
 * `head -> next -> next -> ...`. Não sabe nada de passos, mensagens ou destaques (isso é do item,
 * em `singly-linked-list.ts`); serve para definir o que a lista FAZ e para conferir, em teste,
 * que a simulação passo a passo chega ao mesmo resultado.
 */

/** O que quem está de fora pode ver de um nó: só leitura, sem poder religar nada. */
export interface NodeView<T> {
  readonly value: T;
  readonly next: NodeView<T> | null;
}

/** Nó: um valor e a referência para o próximo nó (`null` no último). */
class Node<T> implements NodeView<T> {
  next: Node<T> | null = null;

  constructor(readonly value: T) {}
}

export class SinglyLinkedList<T> {
  /** Primeiro nó (referência inicial da lista). */
  #head: Node<T> | null = null;
  /** Último nó; permite inserir no fim sem percorrer a lista. */
  #tail: Node<T> | null = null;
  #size = 0;

  /** Número de nós. Mantido a cada inserção: ler o tamanho é O(1). */
  get size(): number {
    return this.#size;
  }

  get head(): NodeView<T> | null {
    return this.#head;
  }

  get tail(): NodeView<T> | null {
    return this.#tail;
  }

  isEmpty(): boolean {
    return this.#head === null;
  }

  /** Insere no início. O(1). */
  prepend(value: T): this {
    const node = new Node(value);
    node.next = this.#head;
    this.#head = node;
    this.#tail ??= node;
    this.#size += 1;
    return this;
  }

  /** Insere no fim. O(1), graças à referência para o último nó. */
  append(value: T): this {
    const node = new Node(value);
    if (this.#tail === null) {
      this.#head = node;
    } else {
      this.#tail.next = node;
    }
    this.#tail = node;
    this.#size += 1;
    return this;
  }

  /** Percorre do início ao fim e devolve os valores na ordem da lista. O(n) em tempo e em espaço. */
  toArray(): T[] {
    const values: T[] = [];
    for (let current = this.#head; current !== null; current = current.next) {
      values.push(current.value);
    }
    return values;
  }
}
