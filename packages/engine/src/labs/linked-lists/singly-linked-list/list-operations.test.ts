import { describe, expect, it } from 'vitest';
import { SinglyLinkedList } from './list';

function listOf<T>(...values: T[]): SinglyLinkedList<T> {
  const list = new SinglyLinkedList<T>();
  for (const value of values) list.append(value);
  return list;
}

/** Depois de uma remoção, o fim precisa continuar certo: inserir no final prova isso. */
function appendAndRead(list: SinglyLinkedList<number>, value: number): number[] {
  list.append(value);
  return list.toArray();
}

describe('insertAt', () => {
  it('posição 0 equivale a inserir no início (inclusive em lista vazia)', () => {
    expect(new SinglyLinkedList<number>().insertAt(0, 9).toArray()).toEqual([9]);
    expect(listOf(1, 2).insertAt(0, 9).toArray()).toEqual([9, 1, 2]);
  });

  it('posição igual ao tamanho equivale a inserir no final', () => {
    const list = listOf(1, 2).insertAt(2, 9);
    expect(list.toArray()).toEqual([1, 2, 9]);
    expect(list.tail?.value).toBe(9);
  });

  it('no meio: liga o novo nó entre o anterior e o seguinte, sem perder a cauda', () => {
    const list = listOf(1, 2, 4).insertAt(2, 3);
    expect(list.toArray()).toEqual([1, 2, 3, 4]);
    expect(list.size).toBe(4);
    expect(list.head?.value).toBe(1);
    expect(list.tail?.value).toBe(4);
  });

  it('com repetidos, entra exatamente na posição pedida', () => {
    expect(listOf(5, 5, 5).insertAt(1, 5).insertAt(2, 7).toArray()).toEqual([5, 5, 7, 5, 5]);
  });

  it.each([-1, 3, 99, 1.5, Number.NaN])(
    'posição inválida %s lança RangeError e não altera a lista',
    (p) => {
      const list = listOf(1, 2);
      expect(() => list.insertAt(p, 9)).toThrow(RangeError);
      expect(list.toArray()).toEqual([1, 2]);
      expect(list.size).toBe(2);
    },
  );

  it('em lista vazia, só a posição 0 existe', () => {
    expect(() => new SinglyLinkedList<number>().insertAt(1, 9)).toThrow(RangeError);
  });
});

describe('removeFirst', () => {
  it('lista vazia: lança RangeError', () => {
    expect(() => new SinglyLinkedList<number>().removeFirst()).toThrow(RangeError);
  });

  it('com vários: devolve o primeiro, preserva a ordem do resto e o fim', () => {
    const list = listOf(1, 2, 3);
    expect(list.removeFirst()).toBe(1);
    expect(list.toArray()).toEqual([2, 3]);
    expect(list.size).toBe(2);
    expect(list.tail?.value).toBe(3);
  });

  it('com um só elemento: a lista volta a ficar vazia (head, tail e tamanho)', () => {
    const list = listOf(7);
    expect(list.removeFirst()).toBe(7);
    expect(list.isEmpty()).toBe(true);
    expect(list.head).toBeNull();
    expect(list.tail).toBeNull();
    expect(list.size).toBe(0);
    expect(appendAndRead(list, 8)).toEqual([8]);
  });
});

describe('removeLast', () => {
  it('lista vazia: lança RangeError', () => {
    expect(() => new SinglyLinkedList<number>().removeLast()).toThrow(RangeError);
  });

  it('com vários: devolve o último e o novo fim é o penúltimo', () => {
    const list = listOf(1, 2, 3);
    expect(list.removeLast()).toBe(3);
    expect(list.toArray()).toEqual([1, 2]);
    expect(list.tail?.value).toBe(2);
    expect(list.tail?.next).toBeNull();
    expect(appendAndRead(list, 4)).toEqual([1, 2, 4]);
  });

  it('com um só elemento: a lista volta a ficar vazia', () => {
    const list = listOf(7);
    expect(list.removeLast()).toBe(7);
    expect(list.isEmpty()).toBe(true);
    expect(list.tail).toBeNull();
    expect(appendAndRead(list, 8)).toEqual([8]);
  });
});

describe('removeAt', () => {
  it.each([-1, 3, 99, 1.5])('posição %s inexistente lança RangeError e não altera a lista', (p) => {
    const list = listOf(1, 2, 3);
    expect(() => list.removeAt(p)).toThrow(RangeError);
    expect(list.toArray()).toEqual([1, 2, 3]);
    expect(list.size).toBe(3);
  });

  it('lista vazia: qualquer posição lança RangeError', () => {
    expect(() => new SinglyLinkedList<number>().removeAt(0)).toThrow(RangeError);
  });

  it('início, meio e fim', () => {
    expect(listOf(1, 2, 3, 4).removeAt(0)).toBe(1);
    const middle = listOf(1, 2, 3, 4);
    expect(middle.removeAt(1)).toBe(2);
    expect(middle.toArray()).toEqual([1, 3, 4]);
    const last = listOf(1, 2, 3, 4);
    expect(last.removeAt(3)).toBe(4);
    expect(last.tail?.value).toBe(3);
    expect(appendAndRead(last, 9)).toEqual([1, 2, 3, 9]);
  });

  it('com repetidos, remove só o nó da posição pedida', () => {
    const list = listOf(5, 5, 5, 5);
    list.removeAt(2);
    expect(list.toArray()).toEqual([5, 5, 5]);
    expect(list.size).toBe(3);
  });

  it('com um só elemento, a posição 0 esvazia a lista', () => {
    const list = listOf(7);
    expect(list.removeAt(0)).toBe(7);
    expect(list.isEmpty()).toBe(true);
    expect(list.tail).toBeNull();
  });
});

describe('get', () => {
  it('devolve o valor de cada posição', () => {
    const list = listOf(10, 20, 30);
    expect([0, 1, 2].map((i) => list.get(i))).toEqual([10, 20, 30]);
  });

  it.each([-1, 3, 1.5])('posição %s inexistente lança RangeError', (p) => {
    expect(() => listOf(1, 2, 3).get(p)).toThrow(RangeError);
  });

  it('lista vazia lança RangeError', () => {
    expect(() => new SinglyLinkedList<number>().get(0)).toThrow(RangeError);
  });

  it('não altera a lista', () => {
    const list = listOf(1, 2, 3);
    list.get(2);
    expect(list.toArray()).toEqual([1, 2, 3]);
  });
});

describe('indexOf', () => {
  it('devolve a posição da primeira ocorrência quando há repetidos', () => {
    expect(listOf(4, 7, 4, 7).indexOf(7)).toBe(1);
    expect(listOf(4, 7, 4, 7).indexOf(4)).toBe(0);
  });

  it('valor ausente e lista vazia devolvem -1', () => {
    expect(listOf(1, 2, 3).indexOf(9)).toBe(-1);
    expect(new SinglyLinkedList<number>().indexOf(1)).toBe(-1);
  });

  it('encontra valores "falsos" (0, undefined) sem confundir com ausência', () => {
    expect(listOf<number | undefined>(1, 0, undefined).indexOf(0)).toBe(1);
    expect(listOf<number | undefined>(1, 0, undefined).indexOf(undefined)).toBe(2);
  });
});

describe('percurso (iterador)', () => {
  it('visita os valores na ordem e pode ser repetido', () => {
    const list = listOf(1, 2, 3);
    expect([...list]).toEqual([1, 2, 3]);
    expect([...list]).toEqual([1, 2, 3]);
  });

  it('lista vazia não visita nada', () => {
    expect([...new SinglyLinkedList<number>()]).toEqual([]);
  });
});

describe('sequências de inserções e remoções', () => {
  it('tamanho, ordem e fim continuam coerentes depois de uma sequência mista', () => {
    const list = new SinglyLinkedList<number>();
    list.append(1).append(2).append(3); // 1 2 3
    list.insertAt(1, 9); // 1 9 2 3
    list.removeLast(); // 1 9 2
    list.prepend(0); // 0 1 9 2
    list.removeAt(2); // 0 1 2
    list.removeFirst(); // 1 2
    expect(list.toArray()).toEqual([1, 2]);
    expect(list.size).toBe(2);
    expect(list.tail?.value).toBe(2);
    expect(appendAndRead(list, 3)).toEqual([1, 2, 3]);
  });

  it('esvaziar por completo e reutilizar a lista funciona', () => {
    const list = listOf(1, 2, 3);
    while (!list.isEmpty()) list.removeLast();
    expect(list.size).toBe(0);
    expect(list.toArray()).toEqual([]);
    list.prepend(5);
    expect(list.toArray()).toEqual([5]);
    expect(list.tail?.value).toBe(5);
  });
});
