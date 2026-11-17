import type { Complexity } from '../../../core/complexity';
import { elementId } from '../../../core/ids';
import type { ItemDefinition } from '../../../core/item';
import { LIMITS } from '../../../core/limits';
import type { StackState } from '../../../core/state';
import { defineItem } from '../../../core/define-item';

type NoParams = { readonly [name: string]: never };

export type StackOperation =
  | { readonly type: 'push'; readonly value: number }
  | { readonly type: 'pop' }
  | { readonly type: 'peek' };

export type StackAnchor =
  | 'stack.push.entry'
  | 'stack.push.write'
  | 'stack.pop.check-empty'
  | 'stack.pop.read'
  | 'stack.pop.remove'
  | 'stack.peek.check-empty'
  | 'stack.peek.read';

export type StackMessages = {
  'stack.push.start': { value: number };
  'stack.push.done': { value: number; size: number };
  'stack.pop.start': NoParams;
  'stack.pop.reading': { value: number };
  'stack.pop.done': { value: number; size: number };
  'stack.peek.start': NoParams;
  'stack.peek.done': { value: number };
  'stack.empty': NoParams;
};

export interface StackTypes {
  readonly state: StackState;
  readonly operation: StackOperation;
  readonly messages: StackMessages;
  readonly anchors: StackAnchor;
}

const CONSTANT: Complexity = {
  time: { best: 'O(1)', average: 'O(1)', worst: 'O(1)' },
  space: 'O(1)',
  amortized: null,
};

const stackDefinition: ItemDefinition<StackTypes> = {
  descriptor: {
    id: 'stack',
    labId: 'linear',
    stateKind: 'stack',
    operations: [
      {
        type: 'push',
        params: [{ name: 'value', role: 'value', min: LIMITS.minValue, max: LIMITS.maxValue }],
        complexity: CONSTANT,
      },
      { type: 'pop', params: [], complexity: CONSTANT },
      { type: 'peek', params: [], complexity: CONSTANT },
    ],
    anchors: [
      'stack.push.entry',
      'stack.push.write',
      'stack.pop.check-empty',
      'stack.pop.read',
      'stack.pop.remove',
      'stack.peek.check-empty',
      'stack.peek.read',
    ],
    messageKeys: [
      'stack.push.start',
      'stack.push.done',
      'stack.pop.start',
      'stack.pop.reading',
      'stack.pop.done',
      'stack.peek.start',
      'stack.peek.done',
      'stack.empty',
    ],
    examples: [{ id: 'basic', values: [4, 8, 15] }],
  },

  createInitialState(values) {
    return {
      kind: 'stack',
      nextId: values.length,
      elements: values.map((value, i) => ({ id: elementId(i), value })),
    };
  },

  checkOperation(state, operation) {
    if (operation.type === 'push' && state.elements.length >= LIMITS.maxElements) {
      return [{ code: 'LIMIT_EXCEEDED', path: 'value', meta: { min: 0, max: LIMITS.maxElements } }];
    }
    return [];
  },

  execute({ state, operation, recorder }) {
    switch (operation.type) {
      case 'push': {
        const { value } = operation;
        recorder.step({
          state,
          message: { key: 'stack.push.start', params: { value } },
          anchor: 'stack.push.entry',
        });
        const element = { id: elementId(state.nextId), value };
        const next: StackState = {
          ...state,
          nextId: state.nextId + 1,
          elements: [...state.elements, element],
        };
        recorder.move();
        recorder.step({
          state: next,
          highlights: [
            { target: { type: 'element', id: element.id }, role: 'inserted' },
            { target: { type: 'element', id: element.id }, role: 'top' },
          ],
          message: { key: 'stack.push.done', params: { value, size: next.elements.length } },
          anchor: 'stack.push.write',
        });
        return { outcome: 'completed', finalState: next, result: { type: 'none' } };
      }

      case 'pop': {
        recorder.step({
          state,
          message: { key: 'stack.pop.start', params: {} },
          anchor: 'stack.pop.check-empty',
        });
        const top = state.elements.at(-1);
        if (top === undefined) {
          recorder.step({
            state,
            message: { key: 'stack.empty', params: {} },
            anchor: 'stack.pop.check-empty',
          });
          return { outcome: 'rejected', reason: 'EMPTY_STRUCTURE' };
        }
        recorder.access();
        recorder.step({
          state,
          highlights: [{ target: { type: 'element', id: top.id }, role: 'top' }],
          message: { key: 'stack.pop.reading', params: { value: top.value } },
          anchor: 'stack.pop.read',
        });
        const next: StackState = { ...state, elements: state.elements.slice(0, -1) };
        recorder.move();
        recorder.step({
          state: next,
          highlights: [{ target: { type: 'element', id: top.id }, role: 'removed' }],
          message: {
            key: 'stack.pop.done',
            params: { value: top.value, size: next.elements.length },
          },
          anchor: 'stack.pop.remove',
        });
        return {
          outcome: 'completed',
          finalState: next,
          result: { type: 'value', value: top.value },
        };
      }

      case 'peek': {
        recorder.step({
          state,
          message: { key: 'stack.peek.start', params: {} },
          anchor: 'stack.peek.check-empty',
        });
        const top = state.elements.at(-1);
        if (top === undefined) {
          recorder.step({
            state,
            message: { key: 'stack.empty', params: {} },
            anchor: 'stack.peek.check-empty',
          });
          return { outcome: 'rejected', reason: 'EMPTY_STRUCTURE' };
        }
        recorder.access();
        recorder.step({
          state,
          highlights: [{ target: { type: 'element', id: top.id }, role: 'top' }],
          message: { key: 'stack.peek.done', params: { value: top.value } },
          anchor: 'stack.peek.read',
        });
        return {
          outcome: 'completed',
          finalState: state,
          result: { type: 'value', value: top.value },
        };
      }
    }
  },
};

export const stackItem = defineItem(stackDefinition);
