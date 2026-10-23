import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

/** Security rules from spec 13.3: no HTML injection sinks, no eval-like code. */
const securityRules = {
  'no-eval': 'error',
  'no-implied-eval': 'error',
  'no-new-func': 'error',
  'no-restricted-properties': [
    'error',
    { property: 'innerHTML', message: 'innerHTML ist verboten (spec 13.3).' },
    { property: 'outerHTML', message: 'outerHTML ist verboten (spec 13.3).' },
    { property: 'insertAdjacentHTML', message: 'insertAdjacentHTML ist verboten (spec 13.3).' },
    { object: 'document', property: 'write', message: 'document.write ist verboten (spec 13.3).' },
    { object: 'document', property: 'writeln', message: 'document.writeln ist verboten (spec 13.3).' },
  ],
  'no-restricted-syntax': [
    'error',
    {
      selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']",
      message: 'dangerouslySetInnerHTML ist verboten (spec 13.3).',
    },
    {
      selector: "Property[key.name='dangerouslySetInnerHTML']",
      message: 'dangerouslySetInnerHTML ist verboten (spec 13.3).',
    },
  ],
};

export default tseslint.config(
  { ignores: ['dist/', 'dev-dist/', 'node_modules/', 'test-results/', 'playwright-report/'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}', 'tests/**/*.ts'],
    languageOptions: { globals: globals.browser },
    rules: securityRules,
  },
  {
    // Spec 5: all reads and writes go through src/data/, the UI never touches Dexie.
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/data/**', 'src/main.tsx'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [{ name: 'dexie', message: 'Nur über src/data/ auf die Datenbank zugreifen.' }],
          patterns: [{ group: ['**/data/db'], message: 'Repository-Module aus src/data/ verwenden.' }],
        },
      ],
    },
  },
  {
    files: ['public/**/*.js'],
    languageOptions: { globals: globals.browser, sourceType: 'script' },
    rules: securityRules,
  },
  {
    files: ['scripts/**/*.mjs', '*.config.{js,ts}'],
    languageOptions: { globals: globals.node },
    rules: securityRules,
  },
);
