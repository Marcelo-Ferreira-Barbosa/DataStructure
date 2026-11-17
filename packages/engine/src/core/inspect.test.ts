import { describe, expect, it } from 'vitest';
import { elementId as id } from './ids';
import { inspectState } from './inspect';
import type { StructureState } from './state';

const el = (n: number, value: number) => ({ id: id(n), value });

const cases: [string, StructureState, { elementCount: number; ids: number[]; values: number[] }][] =
  [
    [
      'sequence (inclui áreas auxiliares)',
      {
        kind: 'sequence',
        nextId: 4,
        elements: [el(0, 5), el(1, 6)],
        auxiliary: [{ name: 'tmp', elements: [el(2, 7)] }],
      },
      { elementCount: 2, ids: [0, 1, 2], values: [5, 6, 7] },
    ],
    [
      'stack',
      { kind: 'stack', nextId: 2, elements: [el(0, 1), el(1, 2)] },
      { elementCount: 2, ids: [0, 1], values: [1, 2] },
    ],
    [
      'queue',
      { kind: 'queue', nextId: 1, elements: [el(0, 9)] },
      { elementCount: 1, ids: [0], values: [9] },
    ],
    [
      'heap',
      { kind: 'heap', nextId: 2, order: 'min', elements: [el(0, 1), el(1, 3)] },
      { elementCount: 2, ids: [0, 1], values: [1, 3] },
    ],
    [
      'linked-list',
      {
        kind: 'linked-list',
        variant: 'singly',
        nextId: 2,
        head: id(0),
        tail: id(1),
        nodes: [
          { id: id(0), value: 4, next: id(1), prev: null },
          { id: id(1), value: 8, next: null, prev: null },
        ],
      },
      { elementCount: 2, ids: [0, 1], values: [4, 8] },
    ],
    [
      'binary-tree',
      {
        kind: 'binary-tree',
        nextId: 2,
        root: id(0),
        nodes: [
          { id: id(0), value: 5, left: id(1), right: null },
          { id: id(1), value: 3, left: null, right: null },
        ],
      },
      { elementCount: 2, ids: [0, 1], values: [5, 3] },
    ],
    [
      'hash-table (chave e valor)',
      {
        kind: 'hash-table',
        nextId: 2,
        capacity: 2,
        buckets: [
          { index: 0, entries: [{ id: id(0), key: 10, value: 1 }] },
          { index: 1, entries: [{ id: id(1), key: 11, value: 2 }] },
        ],
      },
      { elementCount: 2, ids: [0, 1], values: [10, 1, 11, 2] },
    ],
    [
      'graph (vértices contam; arestas só entram em ids e pesos)',
      {
        kind: 'graph',
        nextId: 4,
        directed: false,
        vertices: [
          { id: id(0), label: 'A' },
          { id: id(1), label: 'B' },
        ],
        edges: [
          { id: id(2), from: id(0), to: id(1), weight: 7 },
          { id: id(3), from: id(1), to: id(0), weight: null },
        ],
      },
      { elementCount: 2, ids: [0, 1, 2, 3], values: [7] },
    ],
  ];

describe('inspectState', () => {
  it.each(cases)('%s', (_name, state, expected) => {
    expect(inspectState(state)).toEqual(expected);
  });
});
