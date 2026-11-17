export type MessageParams = {
  readonly [name: string]: number | boolean | string;
};
/** Catálogo de mensagens de um item: chave -> tipo dos parâmetros. Use `type`, não `interface`. */
export type MessageCatalog = { readonly [key: string]: MessageParams };

/** `{chave, parâmetros}` tipado: cada chave exige exatamente os seus parâmetros (ADR-0004). */
export type Message<C extends MessageCatalog = MessageCatalog> = {
  [K in keyof C & string]: { readonly key: K; readonly params: C[K] };
}[keyof C & string];
