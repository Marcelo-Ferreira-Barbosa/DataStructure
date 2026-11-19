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

  /**
   * Insere na posição `index` (0 a `size`; em `size`, vira inserção no final).
   * Lança `RangeError` se a posição não existe. O(1) nas pontas, O(n) no meio.
   */
  insertAt(index: number, value: T): this {
    if (!Number.isInteger(index) || index < 0 || index > this.#size) {
      throw new RangeError(`Posição ${index} inexistente: aceita de 0 a ${this.#size}`);
    }
    if (index === 0) return this.prepend(value);
    if (index === this.#size) return this.append(value);
    const previous = this.#nodeAt(index - 1);
    const node = new Node(value);
    node.next = previous.next; // primeiro o novo nó aponta para o resto...
    previous.next = node; // ...depois o anterior aponta para o novo: nunca se perde a cauda
    this.#size += 1;
    return this;
  }

  /** Remove o primeiro nó e devolve o valor. Lança `RangeError` se a lista está vazia. O(1). */
  removeFirst(): T {
    const first = this.#head;
    if (first === null) throw new RangeError('Lista vazia: não há nó para remover');
    this.#head = first.next;
    if (this.#head === null) this.#tail = null;
    this.#size -= 1;
    return first.value;
  }

  /** Remove o último nó e devolve o valor. Lança `RangeError` se vazia. O(n): precisa do anterior. */
  removeLast(): T {
    if (this.#head === null) throw new RangeError('Lista vazia: não há nó para remover');
    return this.removeAt(this.#size - 1);
  }

  /**
   * Remove o nó da posição `index` e devolve o valor. Lança `RangeError` se a posição não
   * existe (inclusive em lista vazia). O(1) no início, O(n) nas demais.
   */
  removeAt(index: number): T {
    this.#assertExists(index);
    if (index === 0) return this.removeFirst();
    const previous = this.#nodeAt(index - 1);
    const target = previous.next;
    if (target === null) throw new Error('invariante violada: ligação ausente');
    previous.next = target.next;
    if (target === this.#tail) this.#tail = previous;
    this.#size -= 1;
    return target.value;
  }

  /** Valor da posição `index`. Lança `RangeError` se a posição não existe. O(n). */
  get(index: number): T {
    this.#assertExists(index);
    return this.#nodeAt(index).value;
  }

  /**
   * Posição da PRIMEIRA ocorrência de `value` (comparação por `===`), ou -1 se ausente.
   * Com repetidos, devolve sempre a menor posição. O(n).
   */
  indexOf(value: T): number {
    let index = 0;
    for (let current = this.#head; current !== null; current = current.next) {
      if (current.value === value) return index;
      index += 1;
    }
    return -1;
  }

  /** Percorre do início ao fim, na ordem da lista. O(n). */
  *[Symbol.iterator](): IterableIterator<T> {
    for (let current = this.#head; current !== null; current = current.next) {
      yield current.value;
    }
  }

  #assertExists(index: number): void {
    if (this.#size === 0) throw new RangeError('Lista vazia: não há posição válida');
    if (!Number.isInteger(index) || index < 0 || index >= this.#size) {
      throw new RangeError(`Posição ${index} inexistente: aceita de 0 a ${this.#size - 1}`);
    }
  }

  /** Anda de nó em nó até `index` (já validado). */
  #nodeAt(index: number): Node<T> {
    let current = this.#head;
    for (let i = 0; i < index && current !== null; i += 1) current = current.next;
    if (current === null) throw new Error('invariante violada: posição fora da lista');
    return current;
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
