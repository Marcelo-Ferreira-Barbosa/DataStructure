/**
 * Verificações SÓ de compilação (não executa nada em tempo de execução).
 * Se alguma linha com `@ts-expect-error` deixar de falhar, o `tsc` acusa o erro.
 */
import type { Execution } from '../core/execution';
import type { Expect, IsSerializable } from '../core/json';
import type { Message } from '../core/message';
import type { StructureState } from '../core/state';
import type { StackMessages, StackTypes } from '../labs/linear/stack/stack';

// 1) Estados e execuções são serializáveis.
export type StatesAreSerializable = Expect<IsSerializable<StructureState>>;
export type StackExecutionIsSerializable = Expect<IsSerializable<Execution<StackTypes>>>;
export type ErasedExecutionIsSerializable = Expect<IsSerializable<Execution>>;

// 2) O verificador realmente reprova o que não é serializável.
interface WithFunction {
  readonly run: () => void;
}
interface WithUndefined {
  readonly maybe: number | undefined;
}
interface WithMap {
  readonly cache: Map<string, number>;
}
// @ts-expect-error função não é serializável
export type FunctionRejected = Expect<IsSerializable<WithFunction>>;
// @ts-expect-error undefined não sobrevive ao JSON
export type UndefinedRejected = Expect<IsSerializable<WithUndefined>>;
// @ts-expect-error Map não sobrevive ao JSON
export type MapRejected = Expect<IsSerializable<WithMap>>;

// 3) Mensagens são tipadas: chave e parâmetros precisam combinar.
export const validMessage: Message<StackMessages> = {
  key: 'stack.push.done',
  params: { value: 1, size: 2 },
};
// @ts-expect-error parâmetro obrigatório ausente
export const missingParam: Message<StackMessages> = {
  key: 'stack.push.done',
  params: { value: 1 },
};
// @ts-expect-error chave inexistente
export const unknownKey: Message<StackMessages> = { key: 'stack.fly', params: {} };
