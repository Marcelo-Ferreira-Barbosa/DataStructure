import type { Message, MessageParams, SinglyLinkedListMessages as Catalog } from '@dss/engine';
import { nodes, values } from './text';

/**
 * Uma frase para cada chave de mensagem da lista (ADR-0004). O tipo mapeado exige TODAS as
 * chaves: a Engine ganhar uma mensagem sem texto aqui é erro de compilação.
 */
type Texts = { readonly [K in keyof Catalog]: (params: Catalog[K]) => string };

const WALKING = (p: { value: number; index: number }): string =>
  `Percorrendo: nó da posição ${p.index} (valor ${p.value}).`;

export const messages: Texts = {
  // compartilhadas
  'sll.empty': () => 'A lista está vazia: não há nenhum nó para esta operação.',
  'sll.position.out-of-range': (p) =>
    `A posição ${p.position} não existe: a lista tem ${nodes(p.size)}.`,
  'sll.head.updated': (p) => `head agora aponta para o nó com valor ${p.value}.`,
  'sll.tail.updated': (p) => `tail agora aponta para o nó com valor ${p.value}.`,
  'sll.tail.cleared': () => 'A lista ficou vazia, então tail passa a ser null.',

  // insertHead
  'sll.insertHead.start': (p) => `Inserir ${p.value} no início da lista.`,
  'sll.insertHead.allocated': (p) =>
    `Cria um novo nó com o valor ${p.value}. Ele ainda está solto, fora da lista.`,
  'sll.insertHead.linked-next': (p) =>
    p.hasNext
      ? `O novo nó (${p.value}) passa a apontar para o antigo primeiro nó.`
      : `Como a lista estava vazia, o novo nó (${p.value}) aponta para null.`,
  'sll.insertHead.done': (p) =>
    `${p.value} foi inserido no início. A lista agora tem ${nodes(p.size)}.`,

  // insertTail
  'sll.insertTail.start': (p) => `Inserir ${p.value} no final da lista.`,
  'sll.insertTail.checking': (p) =>
    p.empty
      ? 'A lista está vazia: o novo nó será ao mesmo tempo início e fim.'
      : 'A lista tem nós: o novo nó será ligado depois do último (tail).',
  'sll.insertTail.allocated': (p) =>
    `Cria um novo nó com o valor ${p.value}. Ele ainda está solto, fora da lista.`,
  'sll.insertTail.linked-tail': (p) =>
    `O último nó (${p.tailValue}) passa a apontar para o novo nó (${p.value}).`,
  'sll.insertTail.done': (p) =>
    `${p.value} foi inserido no final. A lista agora tem ${nodes(p.size)}.`,

  // insertAt
  'sll.insertAt.start': (p) => `Inserir ${p.value} na posição ${p.position}.`,
  'sll.insertAt.at-head': () => 'A posição é 0: é uma inserção no início.',
  'sll.insertAt.at-tail': () => 'A posição é o tamanho da lista: é uma inserção no final.',
  'sll.insertAt.visit': WALKING,
  'sll.insertAt.allocated': (p) =>
    `Cria um novo nó com o valor ${p.value}. Ele ainda está solto, fora da lista.`,
  'sll.insertAt.linked-next': (p) =>
    `O novo nó (${p.value}) passa a apontar para o nó ${p.nextValue}, que ocupava a posição.`,
  'sll.insertAt.linked-previous': (p) =>
    `O nó anterior (${p.previousValue}) passa a apontar para o novo nó (${p.value}). Agora ele está na lista.`,
  'sll.insertAt.done': (p) =>
    `${p.value} foi inserido na posição ${p.position}. A lista agora tem ${nodes(p.size)}.`,

  // removeHead
  'sll.removeHead.start': () => 'Remover o primeiro nó da lista.',
  'sll.removeHead.reading': (p) => `Guarda o primeiro nó (valor ${p.value}) para removê-lo.`,
  'sll.removeHead.head-moved': (p) =>
    p.hasNext
      ? 'head avança para o segundo nó.'
      : 'O nó removido era o único: head passa a ser null.',
  'sll.removeHead.done': (p) => `${p.value} foi removido. A lista agora tem ${nodes(p.size)}.`,

  // removeTail
  'sll.removeTail.start': () => 'Remover o último nó da lista.',
  'sll.removeTail.delegate': (p) =>
    `Na lista simples não dá para voltar: remove a posição ${p.position} (a última), percorrendo desde o início.`,

  // removeAt
  'sll.removeAt.start': (p) => `Remover o nó da posição ${p.position}.`,
  'sll.removeAt.at-head': () => 'A posição é 0: é uma remoção no início.',
  'sll.removeAt.visit': WALKING,
  'sll.removeAt.target': (p) => `Achou o nó a remover: posição ${p.position}, valor ${p.value}.`,
  'sll.removeAt.unlinked': (p) =>
    p.hasNext
      ? `O nó anterior (${p.previousValue}) passa a apontar para o nó seguinte, pulando o removido.`
      : `O nó anterior (${p.previousValue}) passa a apontar para null, pois o removido era o último.`,
  'sll.removeAt.done': (p) => `${p.value} foi removido. A lista agora tem ${nodes(p.size)}.`,

  // search
  'sll.search.start': (p) => `Procurar o valor ${p.value} a partir do início.`,
  'sll.search.compare': (p) =>
    p.equal
      ? `Posição ${p.index}: ${p.candidate} é igual a ${p.value}.`
      : `Posição ${p.index}: ${p.candidate} é diferente de ${p.value}; segue para o próximo nó.`,
  'sll.search.found': (p) => `Encontrado: ${p.value} está na posição ${p.index}.`,
  'sll.search.not-found': (p) => `${p.value} não está na lista: chegou ao final sem encontrá-lo.`,

  // getAt
  'sll.getAt.start': (p) => `Ler o valor da posição ${p.position}.`,
  'sll.getAt.visit': WALKING,
  'sll.getAt.done': (p) => `A posição ${p.position} guarda o valor ${p.value}.`,

  // traverse
  'sll.traverse.start': (p) =>
    p.size === 0
      ? 'Percorrer a lista vazia: não há nós para visitar.'
      : `Percorrer os ${nodes(p.size)} do início ao fim.`,
  'sll.traverse.visit': (p) => `Visita o nó da posição ${p.index} (valor ${p.value}).`,
  'sll.traverse.done': (p) => `Percurso concluído: ${nodes(p.size)} visitados.`,

  // toArray
  'sll.toArray.start': (p) => `Copiar os ${nodes(p.size)} para um array, do início ao fim.`,
  'sll.toArray.visit': (p) => `Copia ${p.value} para a posição ${p.index} do array.`,
  'sll.toArray.done': (p) => `Array completo, com ${values(p.size)}.`,
};

/**
 * A Engine entrega a mensagem sem tipo específico (fachada `Item`). A conferência de que toda
 * chave tem texto é feita por teste contra `descriptor.messageKeys`; aqui, uma chave
 * desconhecida aparece como a própria chave, para o defeito ficar visível em vez de sumir.
 */
export function renderMessage(message: Message): string {
  const text = (messages as unknown as Record<string, (p: MessageParams) => string | undefined>)[
    message.key
  ];
  return typeof text === 'function' ? (text(message.params) ?? message.key) : message.key;
}
