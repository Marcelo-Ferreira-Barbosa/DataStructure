// Configuração única de lint para todo o monorepo (flat config).
// Regras de fronteira: ver docs/architecture/PROJECT_STRUCTURE.md §6.4.
import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const TEST_FILES = ['**/*.test.{ts,tsx}'];

// Engine: sem dependências externas e sem importar o apoio de testes em código de produção.
const ENGINE_PATTERNS = [
  { regex: '^[^.]', message: 'A Engine não tem dependências: só imports relativos.' },
  {
    group: ['**/testing/**'],
    message: 'testing/ é apoio de testes e não pode ser importado por código de produção.',
  },
];
const DEEP_IMPORT = {
  group: ['@dss/*/*'],
  message: 'Importe pela entrada pública do pacote (ex.: "@dss/engine").',
};

export default tseslint.config(
  { ignores: ['**/dist/**', '**/coverage/**', '**/generated/**', '**/node_modules/**'] },

  // Em vez de aceitar `// eslint-disable` esquecido, exige que cada um ainda seja necessário.
  { linterOptions: { reportUnusedDisableDirectives: 'error' } },

  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: { parserOptions: { projectService: true } },
    rules: {
      eqeqeq: ['error', 'always'],
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },

  // Arquivos JavaScript (apenas configurações): sem regras que dependem de tipos.
  { files: ['**/*.js'], ...tseslint.configs.disableTypeChecked },

  // Imports entre pacotes: só pela entrada pública (@dss/engine), nunca por caminho interno,
  // e um app nunca importa o outro. Cada bloco abaixo declara as proibições do seu pacote.
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [{ name: '@dss/api', message: 'O Web não depende da API; use @dss/contracts.' }],
          patterns: [DEEP_IMPORT],
        },
      ],
    },
  },
  {
    files: ['apps/api/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            { name: '@dss/web', message: 'A API não depende do Web.' },
            { name: 'react', message: 'A API não usa React.' },
            { name: 'react-dom', message: 'A API não usa React.' },
          ],
          patterns: [DEEP_IMPORT],
        },
      ],
    },
  },

  // Web: navegador e regras de hooks do React.
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
    ...reactHooks.configs.flat['recommended-latest'],
  },

  // API: Node. Variáveis de ambiente só são lidas na composição (main.ts) e em config/.
  {
    files: ['apps/api/**/*.ts'],
    languageOptions: { globals: globals.node },
    rules: {
      'no-restricted-properties': [
        'error',
        {
          object: 'process',
          property: 'env',
          message: 'Leia o ambiente só em src/config/env.ts (e main.ts).',
        },
      ],
    },
  },
  {
    files: ['apps/api/src/config/env.ts', 'apps/api/src/main.ts', ...TEST_FILES],
    rules: { 'no-restricted-properties': 'off' },
  },

  // Contracts: só tipos e schemas de fronteira; nada de framework.
  {
    files: ['packages/contracts/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: ['react', 'react-dom', 'express', '@prisma/client'].map((name) => ({
            name,
            message: 'Contracts não depende de frameworks (ADR-0007).',
          })),
          patterns: [DEEP_IMPORT],
        },
      ],
    },
  },

  // Engine (ADR-0002): pura, determinística, sem dependências, sem DOM/Node,
  // sem tempo, aleatoriedade nativa nem ordenação nativa (instável entre implementações).
  {
    files: ['packages/engine/src/**/*.ts'],
    ignores: TEST_FILES,
    rules: {
      'no-restricted-imports': ['error', { patterns: ENGINE_PATTERNS }],
      'no-restricted-globals': [
        'error',
        ...[
          'Date',
          'window',
          'document',
          'process',
          'console',
          'fetch',
          'setTimeout',
          'setInterval',
          'localStorage',
        ].map((name) => ({ name, message: 'Proibido na Engine (determinismo e pureza).' })),
      ],
      'no-restricted-properties': [
        'error',
        { object: 'Math', property: 'random', message: 'Use o PRNG semeado da Engine.' },
        { object: 'Date', property: 'now', message: 'A Engine não conhece o tempo.' },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: 'CallExpression[callee.property.name=/^(sort|toSorted)$/]',
          message: 'Ordenação nativa é proibida na Engine: implemente o algoritmo do laboratório.',
        },
      ],
    },
  },

  // Engine, núcleo: nunca depende dos itens nem do catálogo (ENGINE.md §4.2).
  {
    files: ['packages/engine/src/core/**/*.ts'],
    ignores: TEST_FILES,
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            ...ENGINE_PATTERNS,
            {
              group: ['**/labs/**', '**/catalog/**'],
              message: 'core/ não pode depender de labs/ nem de catalog/.',
            },
          ],
        },
      ],
    },
  },
);
