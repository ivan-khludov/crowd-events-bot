import jsdoc from 'eslint-plugin-jsdoc';
import prettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['node_modules', '.wrangler', 'dist', 'migrations/**/*.sql'],
  },
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ['eslint.config.js'],
    ...tseslint.configs.disableTypeChecked,
  },
  prettier,
  // WARNING: this block sits AFTER `eslint-config-prettier` on purpose so that
  // our custom rules win over its disables (specifically `curly`, which
  // prettier turns off to avoid conflicts with `"multi-line"`/`"multi-or-nest"`
  // — we use `"all"`, which is safe).
  //
  // Before adding ANY new rule here, check whether `eslint-config-prettier`
  // disables it (https://github.com/prettier/eslint-config-prettier#special-rules).
  // If it does, the rule likely conflicts with Prettier formatting and you
  // will get infinite `lint:fix` vs `format` ping-pong. Prefer letting
  // Prettier own stylistic decisions and only enable non-formatting rules
  // (logic, naming, JSDoc, blank lines between statements, etc.) here.
  {
    files: ['src/**/*.ts'],
    plugins: { jsdoc },
    rules: {
      ...jsdoc.configs['flat/recommended-typescript'].rules,
      'jsdoc/require-jsdoc': [
        'error',
        {
          publicOnly: false,
          require: {
            ClassDeclaration: true,
            FunctionDeclaration: true,
            MethodDefinition: true,
            ArrowFunctionExpression: false,
            FunctionExpression: false,
          },
          contexts: [
            'ExportNamedDeclaration[declaration.type="VariableDeclaration"]',
            'ExportNamedDeclaration[declaration.type="TSTypeAliasDeclaration"]',
            'ExportNamedDeclaration[declaration.type="TSInterfaceDeclaration"]',
            'TSInterfaceDeclaration',
            'TSTypeAliasDeclaration',
          ],
          checkConstructors: false,
        },
      ],
      'jsdoc/require-description': 'error',
      'jsdoc/require-param-description': 'error',
      'jsdoc/require-returns-description': 'error',
      'jsdoc/no-types': 'error',
      'jsdoc/tag-lines': ['error', 'any', { startLines: 1 }],
      'jsdoc/check-alignment': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      curly: ['error', 'all'],
      'padding-line-between-statements': [
        'error',
        {
          blankLine: 'always',
          prev: '*',
          next: ['if', 'for', 'while', 'switch'],
        },
        {
          blankLine: 'always',
          prev: ['if', 'for', 'while', 'switch'],
          next: '*',
        },
        { blankLine: 'always', prev: '*', next: 'return' },
      ],
    },
  },
);
