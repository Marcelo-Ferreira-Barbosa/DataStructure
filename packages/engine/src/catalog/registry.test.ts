import { describe, expect, it } from 'vitest';
import type { Item } from '../core/item';
import { LIMITS } from '../core/limits';
import { checkItemInvariants, sampleOperations } from '../testing/invariants';
import { getItem, listItems } from './registry';

const items: Item[] = listItems().flatMap((descriptor) => {
  const item = getItem(descriptor.id);
  return item === undefined ? [] : [item];
});

describe('catálogo', () => {
  it('contém ao menos um item e todo descritor resolve para um item', () => {
    expect(items.length).toBeGreaterThan(0);
    expect(items).toHaveLength(listItems().length);
  });

  it('ids de itens são únicos e getItem devolve undefined para ids desconhecidos', () => {
    const ids = listItems().map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(getItem('não-existe')).toBeUndefined();
  });
});

describe.each(items.map((item) => [item.descriptor.id, item] as const))('item %s', (_id, item) => {
  const { descriptor } = item;

  it('tem descritor consistente', () => {
    expect(descriptor.operations.length).toBeGreaterThan(0);
    expect(new Set(descriptor.operations.map((o) => o.type)).size).toBe(
      descriptor.operations.length,
    );
    expect(new Set(descriptor.anchors).size).toBe(descriptor.anchors.length);
    expect(new Set(descriptor.messageKeys).size).toBe(descriptor.messageKeys.length);
    expect(descriptor.examples.length).toBeGreaterThan(0);
    for (const op of descriptor.operations) {
      for (const p of op.params) expect(p.min).toBeLessThanOrEqual(p.max);
    }
  });

  it('seus exemplos são dados iniciais válidos', () => {
    for (const example of descriptor.examples) {
      expect(example.values.length).toBeLessThanOrEqual(LIMITS.maxElements);
      expect(item.createInitialState(example.values).ok).toBe(true);
    }
  });

  // Estados de partida: cada exemplo e a estrutura vazia.
  const starts = [...descriptor.examples.map((e) => e.values), []];

  for (const operation of descriptor.operations) {
    it(`operação "${operation.type}" respeita as invariantes I-01 a I-15`, () => {
      let executed = 0;
      for (const values of starts) {
        const created = item.createInitialState(values);
        if (!created.ok) throw new Error('exemplo inválido');
        for (const sample of sampleOperations(operation)) {
          expect(checkItemInvariants(item, created.state, sample), JSON.stringify(sample)).toEqual(
            [],
          );
          if (item.run(created.state, sample).outcome !== 'invalid-input') executed++;
        }
      }
      // Garante que a verificação exercitou execuções de verdade (não só entradas inválidas).
      expect(executed).toBeGreaterThan(0);
    });
  }
});
