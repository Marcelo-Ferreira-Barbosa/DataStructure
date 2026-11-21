import { getItem, type Item, type LinkedListState } from '@dss/engine';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LabPage } from './LabPage';
import { LabProvider } from './LabContext';
import { createLabStore, type LabStore } from './store';

const engineItem = getItem('singly-linked-list') as Item;

interface Options {
  autoplay?: boolean;
  item?: Item;
}

function renderLab({ autoplay = false, item }: Options = {}) {
  const store: LabStore = createLabStore({ autoplay: () => autoplay, ...(item ? { item } : {}) });
  // `delay: null` dispensa os timers internos do user-event, que travariam com relógio falso.
  const user = userEvent.setup({ delay: null });
  const view = render(
    <LabProvider store={store}>
      <LabPage />
    </LabProvider>,
  );
  const nodes = (): HTMLElement[] => [
    ...view.container.querySelectorAll<HTMLElement>('[data-node-id]'),
  ];
  const values = (): number[] => nodes().map((n) => Number(n.dataset.value));
  const node = (value: number): HTMLElement => {
    const found = nodes().find((n) => Number(n.dataset.value) === value);
    if (!found) throw new Error(`nó ${value} não está desenhado`);
    return found;
  };
  return { store, user, view, nodes, values, node };
}

async function run(
  ctx: ReturnType<typeof renderLab>,
  type: string,
  fields: Record<string, string> = {},
): Promise<void> {
  await ctx.user.selectOptions(screen.getByLabelText('Operação'), type);
  for (const [label, text] of Object.entries(fields)) {
    const input = screen.getByLabelText(label);
    await ctx.user.clear(input);
    await ctx.user.type(input, text);
  }
  await ctx.user.click(screen.getByRole('button', { name: 'Executar' }));
}

/**
 * Versão síncrona de `run` para os testes com relógio falso: o user-event e o `asyncWrapper` da
 * Testing Library esperam timers reais e travariam, então aqui os eventos são disparados direto.
 */
function runSync(type: string): void {
  fireEvent.change(screen.getByLabelText('Operação'), { target: { value: type } });
  fireEvent.click(screen.getByRole('button', { name: 'Executar' }));
}

/**
 * Deixa passar `ticks` intervalos de reprodução. Cada tick agenda o seguinte numa renderização
 * posterior, então o tempo precisa avançar em `act` separados, como acontece no navegador.
 */
function elapse(ticks: number, intervalMs = 900): void {
  for (let i = 0; i < ticks; i++) {
    act(() => {
      vi.advanceTimersByTime(intervalMs);
    });
  }
}

const button = (name: string): HTMLElement => screen.getByRole('button', { name });
const message = (): string => screen.getByTestId('step-message').textContent;
const result = (): string => screen.getByTestId('result').textContent;

afterEach(() => {
  vi.useRealTimers();
});

describe('estado inicial', () => {
  it('mostra a lista de exemplo vinda da Engine e controles desligados', () => {
    const { values } = renderLab();
    expect(values()).toEqual([4, 8, 15]);
    expect(screen.getByRole('img', { name: /Lista com 3 nós: 4, 8, 15/ })).toBeTruthy();
    expect(button('Reproduzir').hasAttribute('disabled')).toBe(true);
    expect(button('Passo anterior').hasAttribute('disabled')).toBe(true);
    expect(button('Próximo passo').hasAttribute('disabled')).toBe(true);
    expect(message()).toContain('Escolha uma operação');
    expect(result()).toBe('Nenhuma operação executada ainda.');
  });

  it('lista os 10 itens de operação do descritor, agrupados', () => {
    renderLab();
    const select = screen.getByLabelText('Operação');
    expect(within(select).getAllByRole('option')).toHaveLength(10);
    expect(
      within(select)
        .getAllByRole('group')
        .map((g) => g.getAttribute('label')),
    ).toEqual(['Inserir', 'Remover', 'Consultar', 'Percorrer']);
  });
});

describe('inserção visual', () => {
  it('o nó nasce solto, é ligado e termina na posição certa', async () => {
    const ctx = renderLab();
    await run(ctx, 'insertTail', { Valor: '23' });

    // Passo 1: nada mudou ainda.
    expect(ctx.values()).toEqual([4, 8, 15]);
    expect(screen.getByLabelText('Passo 1 de 6')).toBeTruthy();

    // Passo 3: o nó existe, mas solto (fora da lista), marcado como novo.
    await ctx.user.click(button('Próximo passo'));
    await ctx.user.click(button('Próximo passo'));
    const loose = ctx.node(23);
    expect(loose.dataset.zone).toBe('tray');
    expect(loose.dataset.roles).toContain('inserted');
    expect(screen.getByTestId('tray-label')).toBeTruthy();
    expect(message()).toContain('solto');

    // Último passo: ligado, na cadeia, com tail nele.
    await ctx.user.click(button('Ir ao último passo'));
    expect(ctx.values()).toEqual([4, 8, 15, 23]);
    expect(ctx.node(23).dataset.zone).toBe('chain');
    expect(ctx.node(23).querySelector('[data-pointer="tail"]')).not.toBeNull();
    expect(screen.queryByTestId('tray-label')).toBeNull();
    expect(result()).toBe('Pronto: a lista agora tem 4 nós.');
  });

  it('insere no meio, na posição pedida', async () => {
    const ctx = renderLab();
    await run(ctx, 'insertAt', { Posição: '1', Valor: '9' });
    await ctx.user.click(button('Ir ao último passo'));
    expect(ctx.values()).toEqual([4, 9, 8, 15]);
  });

  it('insere no início e head passa para o novo nó', async () => {
    const ctx = renderLab();
    await run(ctx, 'insertHead', { Valor: '1' });
    await ctx.user.click(button('Ir ao último passo'));
    expect(ctx.values()).toEqual([1, 4, 8, 15]);
    expect(ctx.node(1).querySelector('[data-pointer="head"]')).not.toBeNull();
    expect(ctx.node(4).querySelector('[data-pointer="head"]')).toBeNull();
  });

  it('em lista vazia o nó é início e fim ao mesmo tempo', async () => {
    const ctx = renderLab();
    await ctx.user.clear(screen.getByLabelText(/Valores da lista/));
    await ctx.user.click(button('Criar lista'));
    expect(ctx.values()).toEqual([]);
    expect(screen.getByText('Lista vazia')).toBeTruthy();
    await run(ctx, 'insertHead', { Valor: '5' });
    await ctx.user.click(button('Ir ao último passo'));
    const only = ctx.node(5);
    expect(only.querySelector('[data-pointer="head"]')).not.toBeNull();
    expect(only.querySelector('[data-pointer="tail"]')).not.toBeNull();
  });
});

describe('remoção visual', () => {
  it('o nó removido fica solto e riscado antes de sumir', async () => {
    const ctx = renderLab();
    await run(ctx, 'removeAt', { Posição: '1' });
    const states = ctx.store.getState().execution?.steps ?? [];
    const unlinkIndex = states.findIndex((s) => s.anchor === 'sll.removeAt.unlink');
    expect(unlinkIndex).toBeGreaterThan(0);
    for (let i = 0; i < unlinkIndex; i++) await ctx.user.click(button('Próximo passo'));

    const removed = ctx.node(8);
    expect(removed.dataset.zone).toBe('tray');
    expect(removed.dataset.roles).toContain('removed');
    expect(removed.textContent).toContain('✕ removido');

    await ctx.user.click(button('Ir ao último passo'));
    expect(ctx.values()).toEqual([4, 15]);
    expect(result()).toBe('Valor removido: 8.');
  });

  it('remover do final atualiza tail para o penúltimo', async () => {
    const ctx = renderLab();
    await run(ctx, 'removeTail');
    await ctx.user.click(button('Ir ao último passo'));
    expect(ctx.values()).toEqual([4, 8]);
    expect(ctx.node(8).querySelector('[data-pointer="tail"]')).not.toBeNull();
    expect(result()).toBe('Valor removido: 15.');
  });

  it('remover do início tira o primeiro', async () => {
    const ctx = renderLab();
    await run(ctx, 'removeHead');
    await ctx.user.click(button('Ir ao último passo'));
    expect(ctx.values()).toEqual([8, 15]);
  });
});

describe('pesquisa', () => {
  it('destaca o nó encontrado e informa a posição', async () => {
    const ctx = renderLab();
    await run(ctx, 'search', { 'Valor procurado': '8' });
    await ctx.user.click(button('Ir ao último passo'));
    expect(ctx.node(8).dataset.roles).toContain('found');
    expect(ctx.node(4).dataset.roles).toContain('visited');
    expect(result()).toBe('Encontrado: 8 está na posição 1.');
    expect(ctx.values()).toEqual([4, 8, 15]);
  });

  it('valor ausente não é erro: percorre tudo e avisa', async () => {
    const ctx = renderLab();
    await run(ctx, 'search', { 'Valor procurado': '99' });
    await ctx.user.click(button('Ir ao último passo'));
    expect(result()).toBe('99 não está na lista (percorreu 3 nós).');
    const alerts = screen
      .getAllByRole('alert')
      .map((a) => a.textContent)
      .join('');
    expect(alerts).toBe('');
  });
});

describe('avanço e retrocesso', () => {
  it('cada passo mostra a mensagem, o pseudocódigo e os contadores do passo da Engine', async () => {
    const ctx = renderLab();
    await run(ctx, 'search', { 'Valor procurado': '15' });
    const steps = ctx.store.getState().execution?.steps ?? [];
    const seen: string[] = [];
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      expect(screen.getByLabelText(`Passo ${i + 1} de ${steps.length}`)).toBeTruthy();
      expect(screen.getByTestId('counter-comparisons').textContent).toBe(
        String(step?.counters.comparisons),
      );
      expect(screen.getByTestId('counter-accesses').textContent).toBe(
        String(step?.counters.accesses),
      );
      const current = document.querySelectorAll('[aria-current="step"]');
      expect(current.length).toBeGreaterThan(0);
      seen.push(message());
      if (i < steps.length - 1) await ctx.user.click(button('Próximo passo'));
    }
    expect(new Set(seen).size).toBeGreaterThan(2);
  });

  it('voltar reproduz exatamente os mesmos estados (sem corromper nada)', async () => {
    const ctx = renderLab();
    await run(ctx, 'insertAt', { Posição: '2', Valor: '9' });
    const last = (ctx.store.getState().execution?.steps.length ?? 1) - 1;
    const forward: { values: number[]; text: string }[] = [];
    for (let i = 0; i <= last; i++) {
      forward.push({
        values: [...ctx.nodes()].map((n) => Number(n.dataset.value)),
        text: message(),
      });
      if (i < last) await ctx.user.click(button('Próximo passo'));
    }
    const backward: { values: number[]; text: string }[] = [];
    for (let i = last; i >= 0; i--) {
      backward.unshift({
        values: [...ctx.nodes()].map((n) => Number(n.dataset.value)),
        text: message(),
      });
      if (i > 0) await ctx.user.click(button('Passo anterior'));
    }
    expect(backward).toEqual(forward);
  });

  it('os botões respeitam as bordas e a barra leva a qualquer passo', async () => {
    const ctx = renderLab();
    await run(ctx, 'traverse');
    expect(button('Passo anterior').hasAttribute('disabled')).toBe(true);
    expect(button('Próximo passo').hasAttribute('disabled')).toBe(false);
    await ctx.user.click(button('Ir ao último passo'));
    expect(button('Próximo passo').hasAttribute('disabled')).toBe(true);
    expect(button('Ir ao último passo').hasAttribute('disabled')).toBe(true);
    const slider = screen.getByRole('slider');
    act(() => {
      ctx.store.getState().actions.dispatch({ type: 'seek', index: 2 });
    });
    expect(slider.getAttribute('aria-valuetext')).toMatch(/^Passo 3 de /);
  });

  it('navegar não altera a lista em repouso nem o histórico', async () => {
    const ctx = renderLab();
    await run(ctx, 'insertHead', { Valor: '1' });
    const before = ctx.store.getState();
    await ctx.user.click(button('Próximo passo'));
    await ctx.user.click(button('Ir ao último passo'));
    await ctx.user.click(button('Passo anterior'));
    const after = ctx.store.getState();
    expect(after.structure).toBe(before.structure);
    expect(after.history).toBe(before.history);
    expect(after.execution).toBe(before.execution);
  });
});

describe('reinicialização', () => {
  it('reiniciar volta ao passo 1, pausada, e a simulação pode ser repetida', async () => {
    const ctx = renderLab();
    await run(ctx, 'insertTail', { Valor: '7' });
    await ctx.user.click(button('Ir ao último passo'));
    expect(button('Repetir')).toBeTruthy();
    await ctx.user.click(button('Reiniciar simulação'));
    expect(screen.getByLabelText(/^Passo 1 de /)).toBeTruthy();
    expect(ctx.values()).toEqual([4, 8, 15]);
    expect(ctx.store.getState().playback.status).toBe('paused');
    expect(result()).toBe('O resultado aparece no último passo.');
    await ctx.user.click(button('Ir ao último passo'));
    expect(ctx.values()).toEqual([4, 8, 15, 7]);
  });

  it('criar uma nova lista apaga a execução e o histórico', async () => {
    const ctx = renderLab();
    await run(ctx, 'insertTail', { Valor: '7' });
    await ctx.user.click(button('Exemplo'));
    expect(ctx.store.getState().history).toEqual([]);
    expect(ctx.store.getState().execution).toBeNull();
    expect(screen.getByText('As operações executadas aparecem aqui.')).toBeTruthy();
    expect(ctx.values()).toEqual([4, 8, 15]);
    expect(button('Reproduzir').hasAttribute('disabled')).toBe(true);
  });
});

describe('reprodução automática', () => {
  it('avança sozinha com o tempo, pausa e retoma', () => {
    vi.useFakeTimers();
    const ctx = renderLab({ autoplay: true });
    runSync('traverse');
    expect(ctx.store.getState().playback).toMatchObject({ cursor: 0, status: 'playing' });
    elapse(1);
    expect(ctx.store.getState().playback.cursor).toBe(1);
    fireEvent.click(button('Pausar'));
    elapse(5);
    expect(ctx.store.getState().playback.cursor).toBe(1);
    fireEvent.click(button('Reproduzir'));
    elapse(20);
    const { playback } = ctx.store.getState();
    expect(playback.cursor).toBe(playback.stepCount - 1);
    expect(playback.status).toBe('paused');
    expect(button('Repetir')).toBeTruthy();
  });

  it('a velocidade muda o intervalo entre passos', () => {
    vi.useFakeTimers();
    const ctx = renderLab({ autoplay: true });
    fireEvent.change(screen.getByLabelText('Velocidade'), { target: { value: '4' } });
    runSync('traverse');
    act(() => {
      vi.advanceTimersByTime(900 / 4 - 1);
    });
    expect(ctx.store.getState().playback.cursor).toBe(0);
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(ctx.store.getState().playback.cursor).toBe(1);
  });

  it('executar outra operação no meio da reprodução reinicia a exibição na nova', () => {
    vi.useFakeTimers();
    const ctx = renderLab({ autoplay: true });
    runSync('traverse');
    elapse(2);
    expect(ctx.store.getState().playback.cursor).toBe(2);
    runSync('toArray');
    expect(ctx.store.getState().playback.cursor).toBe(0);
    expect(ctx.store.getState().history).toHaveLength(2);
  });

  it('com movimento reduzido a execução começa pausada', async () => {
    const ctx = renderLab({ autoplay: false });
    await run(ctx, 'traverse');
    expect(ctx.store.getState().playback.status).toBe('paused');
  });
});

describe('tratamento de erros', () => {
  it('campo vazio: a Engine pede o valor e o erro aparece no campo', async () => {
    const ctx = renderLab();
    await ctx.user.click(button('Executar'));
    const field = screen.getByLabelText('Valor');
    expect(field.getAttribute('aria-invalid')).toBe('true');
    expect(screen.getByText('Informe um número.')).toBeTruthy();
    expect(ctx.store.getState().history).toEqual([]);
    expect(ctx.values()).toEqual([4, 8, 15]);
  });

  it('valor fora da faixa mostra o intervalo e não executa', async () => {
    const ctx = renderLab();
    await run(ctx, 'insertHead', { Valor: '5000' });
    expect(screen.getByText('Use um número de -999 a 999.')).toBeTruthy();
    expect(ctx.store.getState().execution).toBeNull();
  });

  it('texto e decimais são recusados pela Engine', async () => {
    const ctx = renderLab();
    await run(ctx, 'insertHead', { Valor: 'abc' });
    expect(screen.getByText(/número inteiro/)).toBeTruthy();
    await run(ctx, 'insertHead', { Valor: '1.5' });
    expect(screen.getByText(/número inteiro/)).toBeTruthy();
    expect(ctx.store.getState().history).toEqual([]);
  });

  it('posição negativa é entrada inválida; posição inexistente é recusa explicada', async () => {
    const ctx = renderLab();
    await run(ctx, 'removeAt', { Posição: '-1' });
    expect(screen.getByLabelText('Posição').getAttribute('aria-invalid')).toBe('true');
    expect(ctx.store.getState().history).toEqual([]);

    await run(ctx, 'removeAt', { Posição: '9' });
    await ctx.user.click(button('Ir ao último passo'));
    expect(message()).toBe('A posição 9 não existe: a lista tem 3 nós.');
    expect(result()).toBe('Operação recusada: a posição não existe nesta lista.');
    expect(ctx.values()).toEqual([4, 8, 15]);
    expect(screen.getByText(/⚠ recusada/)).toBeTruthy();
  });

  it('lista vazia: remover é recusa explicada, com 2 passos', async () => {
    const ctx = renderLab();
    await ctx.user.clear(screen.getByLabelText(/Valores da lista/));
    await ctx.user.click(button('Criar lista'));
    await run(ctx, 'removeHead');
    expect(ctx.store.getState().playback.stepCount).toBe(2);
    await ctx.user.click(button('Ir ao último passo'));
    expect(message()).toContain('A lista está vazia');
    expect(result()).toBe('Operação recusada: a lista está vazia.');
  });

  it('o erro do campo some ao executar com sucesso', async () => {
    const ctx = renderLab();
    await run(ctx, 'insertHead', { Valor: '5000' });
    expect(screen.queryByText('Use um número de -999 a 999.')).not.toBeNull();
    await run(ctx, 'insertHead', { Valor: '5' });
    expect(screen.queryByText('Use um número de -999 a 999.')).toBeNull();
  });

  it('lista inicial inválida: aponta o valor com problema e mantém a lista atual', async () => {
    const ctx = renderLab();
    const input = screen.getByLabelText(/Valores da lista/);
    await ctx.user.clear(input);
    await ctx.user.type(input, '1, 2000, 3');
    await ctx.user.click(button('Criar lista'));
    expect(screen.getByText(/Valor 2: Use um número de -999 a 999\./)).toBeTruthy();
    expect(ctx.values()).toEqual([4, 8, 15]);
  });

  it('tamanho aleatório fora do limite vira problema do campo, não falha', async () => {
    const ctx = renderLab();
    await ctx.user.clear(screen.getByLabelText('Tamanho'));
    await ctx.user.type(screen.getByLabelText('Tamanho'), '80');
    await ctx.user.click(button('Lista aleatória'));
    expect(ctx.store.getState().feedback).toMatchObject({ source: 'list' });
    expect(ctx.values()).toEqual([4, 8, 15]);
  });

  it('falha inesperada da Engine: aviso na tela e a lista continua como estava', async () => {
    const broken = {
      descriptor: engineItem.descriptor,
      createInitialState: engineItem.createInitialState.bind(engineItem),
      run: () => {
        throw new Error('invariante violada');
      },
    } as unknown as Item;
    const ctx = renderLab({ item: broken });
    await run(ctx, 'traverse');
    const alert = screen.getByText(/Algo inesperado aconteceu/);
    expect(alert.textContent).toContain('invariante violada');
    expect(ctx.values()).toEqual([4, 8, 15]);
    expect(ctx.store.getState().history).toEqual([]);
  });
});

describe('lista aleatória', () => {
  it('a mesma semente e o mesmo tamanho repetem a mesma lista', async () => {
    const ctx = renderLab();
    await ctx.user.clear(screen.getByLabelText('Tamanho'));
    await ctx.user.type(screen.getByLabelText('Tamanho'), '6');
    await ctx.user.clear(screen.getByLabelText('Semente'));
    await ctx.user.type(screen.getByLabelText('Semente'), '42');
    await ctx.user.click(button('Lista aleatória'));
    const first = ctx.values();
    expect(first).toHaveLength(6);
    await ctx.user.click(button('Exemplo'));
    await ctx.user.click(button('Lista aleatória'));
    expect(ctx.values()).toEqual(first);
  });
});

describe('sincronização entre a Engine e a interface', () => {
  it('em TODO passo, os nós desenhados são exatamente os do estado do passo da Engine', async () => {
    const ctx = renderLab();
    await run(ctx, 'removeAt', { Posição: '1' });
    const steps = ctx.store.getState().execution?.steps ?? [];
    let totalMarked = 0;
    for (let i = 0; i < steps.length; i++) {
      const state = steps[i]?.state as LinkedListState;
      const drawn = ctx.nodes().map((n) => Number(n.dataset.nodeId));
      expect(drawn.sort()).toEqual(state.nodes.map((n) => Number(n.id)).sort());
      // Um destaque pode apontar para um nó que já não existe no estado (o removido, no fim):
      // então nunca há MAIS nós marcados do que destaques de elemento.
      const roles = steps[i]?.highlights.filter((h) => h.target.type === 'element').length ?? 0;
      const marked = ctx.nodes().filter((n) => (n.dataset.roles ?? '') !== '').length;
      expect(marked).toBeLessThanOrEqual(roles);
      totalMarked += marked;
      if (i < steps.length - 1) await ctx.user.click(button('Próximo passo'));
    }
    expect(totalMarked).toBeGreaterThan(0);
  });

  it('a lista em repouso encadeia as operações: a seguinte parte do resultado da anterior', async () => {
    const ctx = renderLab();
    await run(ctx, 'insertTail', { Valor: '23' });
    await run(ctx, 'removeHead');
    await run(ctx, 'insertHead', { Valor: '1' });
    await ctx.user.click(button('Ir ao último passo'));
    expect(ctx.values()).toEqual([1, 8, 15, 23]);
    const entries = within(screen.getByRole('region', { name: 'Histórico' })).getAllByRole(
      'listitem',
    );
    expect(entries).toHaveLength(3);
    expect(entries[2]?.textContent).toContain('em exibição');
  });

  it('o painel de complexidade mostra o que a Engine declarou para a operação', async () => {
    const ctx = renderLab();
    await run(ctx, 'insertHead', { Valor: '1' });
    const row = screen.getByTestId('complexity-row');
    expect(row.textContent).toBe('O(1)O(1)O(1)O(1)');
    await run(ctx, 'search', { 'Valor procurado': '8' });
    expect(screen.getByTestId('complexity-row').textContent).toBe('O(1)O(n)O(n)O(1)');
    expect(screen.getByText('Isto é teoria: conta passos, não mede tempo.')).toBeTruthy();
  });

  it('o pseudocódigo troca de bloco quando a operação delega (removeTail → removeAt)', async () => {
    const ctx = renderLab();
    await run(ctx, 'removeTail');
    expect(screen.getByText('removerFim()', { selector: 'p' })).toBeTruthy();
    await ctx.user.click(button('Próximo passo'));
    await ctx.user.click(button('Próximo passo'));
    expect(screen.getByText('removerEm(pos)', { selector: 'p' })).toBeTruthy();
  });

  it('a mensagem fica numa região viva para leitores de tela', () => {
    renderLab();
    const region = screen.getByTestId('step-message');
    expect(region.getAttribute('role')).toBe('status');
    expect(region.getAttribute('aria-live')).toBe('polite');
  });
});
