import { describe, expect, it } from 'vitest';
import { SinglyLinkedList, type NodeView } from './list';

/** Percorre só por `head -> next`, sem usar `toArray`: prova que os nós estão mesmo ligados. */
function walk<T>(list: SinglyLinkedList<T>): T[] {
  const values: T[] = [];
  for (let node: NodeView<T> | null = list.head; node !== null; node = node.next) {
    values.push(node.value);
  }
  return values;
}

function listOf<T>(...values: T[]): SinglyLinkedList<T> {
  const list = new SinglyLinkedList<T>();
  for (const value of values) list.append(value);
  return list;
}

describe('lista recém-criada', () => {
  it('começa vazia, sem nós e com tamanho 0', () => {
    const list = new SinglyLinkedList<number>();
    expect(list.isEmpty()).toBe(true);
    expect(list.size).toBe(0);
    expect(list.head).toBeNull();
    expect(list.tail).toBeNull();
    expect(list.toArray()).toEqual([]);
  });
});

describe('inserção de um elemento', () => {
  it('prepend em lista vazia: o nó é início e fim ao mesmo tempo', () => {
    const list = new SinglyLinkedList<number>().prepend(7);
    expect(list.isEmpty()).toBe(false);
    expect(list.size).toBe(1);
    expect(list.head?.value).toBe(7);
    expect(list.head?.next).toBeNull();
    expect(list.tail).toBe(list.head);
    expect(list.toArray()).toEqual([7]);
  });

  it('append em lista vazia: o nó é início e fim ao mesmo tempo', () => {
    const list = new SinglyLinkedList<number>().append(7);
    expect(list.size).toBe(1);
    expect(list.head?.value).toBe(7);
    expect(list.head?.next).toBeNull();
    expect(list.tail).toBe(list.head);
    expect(list.toArray()).toEqual([7]);
  });
});

describe('inserção no início (prepend)', () => {
  it('o novo nó vira o início e aponta para o antigo início', () => {
    const list = listOf(2, 3);
    const oldHead = list.head;
    list.prepend(1);
    expect(list.head?.value).toBe(1);
    expect(list.head?.next).toBe(oldHead);
    expect(list.toArray()).toEqual([1, 2, 3]);
  });

  it('não altera o fim da lista quando ela já tinha elementos', () => {
    const list = listOf(2, 3);
    const oldTail = list.tail;
    list.prepend(1);
    expect(list.tail).toBe(oldTail);
    expect(list.tail?.value).toBe(3);
  });

  it('vários prepend invertem a ordem de chegada', () => {
    const list = new SinglyLinkedList<number>();
    [1, 2, 3, 4].forEach((value) => list.prepend(value));
    expect(list.toArray()).toEqual([4, 3, 2, 1]);
  });
});

describe('inserção no final (append)', () => {
  it('o antigo último aponta para o novo, que vira o fim', () => {
    const list = listOf(1, 2);
    const oldTail = list.tail;
    list.append(3);
    expect(oldTail?.next).toBe(list.tail);
    expect(list.tail?.value).toBe(3);
    expect(list.tail?.next).toBeNull();
    expect(list.toArray()).toEqual([1, 2, 3]);
  });

  it('não altera o início da lista quando ela já tinha elementos', () => {
    const list = listOf(1, 2);
    const oldHead = list.head;
    list.append(3);
    expect(list.head).toBe(oldHead);
  });

  it('vários append mantêm a ordem de chegada', () => {
    const list = new SinglyLinkedList<number>();
    [1, 2, 3, 4].forEach((value) => list.append(value));
    expect(list.toArray()).toEqual([1, 2, 3, 4]);
  });
});

describe('inserção de vários elementos e preservação da ordem', () => {
  it('mistura de prepend e append respeita a posição de cada inserção', () => {
    const list = new SinglyLinkedList<string>();
    list.append('b'); // b
    list.prepend('a'); // a b
    list.append('c'); // a b c
    list.prepend('z'); // z a b c
    list.append('d'); // z a b c d
    expect(list.toArray()).toEqual(['z', 'a', 'b', 'c', 'd']);
    expect(walk(list)).toEqual(['z', 'a', 'b', 'c', 'd']);
  });

  it('a ligação por nós e o toArray sempre contam a mesma história', () => {
    const list = new SinglyLinkedList<number>();
    for (let i = 0; i < 25; i += 1) {
      if (i % 3 === 0) list.prepend(i);
      else list.append(i);
      expect(walk(list)).toEqual(list.toArray());
    }
  });

  it('tail sempre é o último nó alcançável a partir de head', () => {
    const list = new SinglyLinkedList<number>();
    for (let i = 0; i < 10; i += 1) {
      if (i % 2 === 0) list.prepend(i);
      else list.append(i);
      let last = list.head;
      while (last?.next) last = last.next;
      expect(list.tail).toBe(last);
    }
  });
});

describe('controle do tamanho', () => {
  it('cresce 1 a cada inserção, no início ou no fim', () => {
    const list = new SinglyLinkedList<number>();
    expect(list.size).toBe(0);
    list.append(1);
    expect(list.size).toBe(1);
    list.prepend(2);
    expect(list.size).toBe(2);
    list.append(3);
    expect(list.size).toBe(3);
    expect(list.size).toBe(list.toArray().length);
  });

  it('isEmpty vira false na primeira inserção e continua false', () => {
    const list = new SinglyLinkedList<number>();
    expect(list.isEmpty()).toBe(true);
    list.append(1);
    expect(list.isEmpty()).toBe(false);
    list.prepend(2);
    expect(list.isEmpty()).toBe(false);
  });
});

describe('elementos repetidos', () => {
  it('guarda cada repetição como um nó próprio', () => {
    const list = listOf(5, 5, 5);
    list.prepend(5);
    expect(list.size).toBe(4);
    expect(list.toArray()).toEqual([5, 5, 5, 5]);
    expect(list.head).not.toBe(list.head?.next);
  });

  it('repetidos não confundem a ordem entre os demais', () => {
    const list = listOf(1, 2, 1, 2);
    list.prepend(2);
    list.append(1);
    expect(list.toArray()).toEqual([2, 1, 2, 1, 2, 1]);
  });
});

describe('toArray', () => {
  it('devolve uma cópia: alterar o array não altera a lista', () => {
    const list = listOf(1, 2, 3);
    const copy = list.toArray();
    copy.push(99);
    copy[0] = -1;
    expect(list.toArray()).toEqual([1, 2, 3]);
    expect(list.size).toBe(3);
  });

  it('chamar duas vezes dá o mesmo resultado (não consome a lista)', () => {
    const list = listOf(1, 2, 3);
    expect(list.toArray()).toEqual(list.toArray());
  });
});

describe('valores permitidos pela tipagem (genérico)', () => {
  it('aceita números, inclusive negativos, zero e decimais', () => {
    expect(listOf(-1, 0, 0.5, Number.MAX_SAFE_INTEGER).toArray()).toEqual([
      -1,
      0,
      0.5,
      Number.MAX_SAFE_INTEGER,
    ]);
  });

  it('aceita strings, inclusive vazia', () => {
    expect(listOf('a', '', 'c').toArray()).toEqual(['a', '', 'c']);
  });

  it('aceita objetos e mantém a identidade da referência', () => {
    const first = { id: 1 };
    const second = { id: 2 };
    const list = new SinglyLinkedList<{ id: number }>().append(first).append(second);
    const [a, b] = list.toArray();
    expect(a).toBe(first);
    expect(b).toBe(second);
  });

  it('aceita valores "falsos" (0, "", false, null, undefined) sem confundir com lista vazia', () => {
    const list = new SinglyLinkedList<number | string | boolean | null | undefined>();
    list.append(0).append('').append(false).append(null).append(undefined);
    expect(list.size).toBe(5);
    expect(list.toArray()).toEqual([0, '', false, null, undefined]);
    expect(walk(list)).toHaveLength(5);
  });

  it('o compilador impede valores de outro tipo', () => {
    // Nunca chamada: só o compilador a examina (os @ts-expect-error falham se o erro sumir).
    const compileOnly = (): void => {
      const numbers = new SinglyLinkedList<number>();
      // @ts-expect-error uma lista de números não aceita string
      numbers.append('x');
      // @ts-expect-error nem no início
      numbers.prepend(true);
    };
    expect(typeof compileOnly).toBe('function');
    const texts: string[] = new SinglyLinkedList<string>().append('a').toArray();
    expect(texts).toEqual(['a']);
  });
});

describe('encapsulamento', () => {
  it('o nó exposto é somente leitura na tipagem e head/tail/size não têm setter', () => {
    // Nunca chamada: só o compilador a examina.
    const compileOnly = (list: SinglyLinkedList<number>): void => {
      const head = list.head;
      if (head === null) return;
      // @ts-expect-error `next` é somente leitura para quem está de fora
      head.next = null;
      // @ts-expect-error `value` é somente leitura
      head.value = 99;
      // @ts-expect-error `size` só é alterado pelas inserções
      list.size = 0;
      // @ts-expect-error `head` não pode ser trocado de fora
      list.head = null;
    };
    expect(typeof compileOnly).toBe('function');
  });

  it('o estado interno é privado de verdade (campos # não aparecem no objeto)', () => {
    const list = listOf(1, 2, 3);
    expect(Object.keys(list)).toEqual([]);
    expect(JSON.stringify(list)).toBe('{}');
  });
});
