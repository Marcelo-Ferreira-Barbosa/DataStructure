export type JsonPrimitive = string | number | boolean | null;
export type JsonValue =
  JsonPrimitive | readonly JsonValue[] | { readonly [key: string]: JsonValue };

/**
 * Mapeia T para a sua forma JSON. Se T contiver algo que não sobrevive a
 * JSON.stringify/JSON.parse (função, undefined, Map, Set, Date, classe), aquele ponto vira `never`
 * e `IsSerializable<T>` deixa de ser verdadeiro.
 */
export type JsonSafe<T> = T extends JsonPrimitive
  ? T
  : T extends (...args: never[]) => unknown
    ? never
    : T extends readonly (infer U)[]
      ? readonly JsonSafe<U>[]
      : T extends object
        ? { readonly [K in keyof T]: JsonSafe<T[K]> }
        : never;

/** Verdadeiro se T sobrevive a JSON sem perdas. */
export type IsSerializable<T> = [T] extends [JsonSafe<T>] ? true : false;

/** Uso: `type _ = Expect<IsSerializable<StackState>>;` (não compila se for `false`). */
export type Expect<T extends true> = T;
