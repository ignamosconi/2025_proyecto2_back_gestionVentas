// ==============================
// ESLint Config — NestJS + TS
// ==============================
// Este archivo está adaptado a ESLint 9 (flat config).
// Incluye métricas moderadas sobre:
// - Complejidad
// - Duplicación
// - Buenas prácticas
// - Riesgos de mantenimiento

import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';

export default [
  {
    files: ['**/*.ts', '**/*.mts'],
    ignores: ['**/*.spec.ts', 'dist/**'], // Ignorar archivos de test y compilados

    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2023,
        sourceType: 'module',
        project: './tsconfig.json',
      },
    },

    plugins: {
      '@typescript-eslint': tsPlugin,
    },

    rules: {
      // ============================
      // 1️⃣ COMPLEJIDAD DEL CÓDIGO
      // ============================
      // Limita la cantidad de ramas lógicas por función
      complexity: ['warn', 12],
      // Controla la cantidad de líneas por función
      'max-lines-per-function': ['warn', 150],
      // Controla la profundidad de anidamiento (bucles / if)
      'max-depth': ['warn', 4],

      // ============================
      // 2️⃣ DUPLICACIÓN Y REDUNDANCIAS
      // ============================
      'no-duplicate-imports': 'warn', // Evita imports duplicados
      'no-redeclare': 'warn', // Evita variables o funciones redeclaradas
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],

      // ============================
      // 3️⃣ BUENAS PRÁCTICAS DE PROGRAMACIÓN
      // ============================
      eqeqeq: ['warn', 'always'], // Forzar uso de === y !==
      curly: 'warn', // Requiere llaves en bloques
      '@typescript-eslint/explicit-function-return-type': 'warn', // Retornos explícitos
      'no-console': 'warn', // Evitar console.log en producción
      'prefer-const': 'warn', // Promueve uso de const sobre let

      // ============================
      // 4️⃣ VULNERABILIDADES / RIESGOS DE MANTENIMIENTO
      // ============================
      'no-eval': 'error', // Prohíbe eval()
      'no-implied-eval': 'error', // Prohíbe eval indirecto
      'no-empty-function': 'warn', // Evita funciones vacías
      'no-param-reassign': 'warn', // No reasignar parámetros de función
      '@typescript-eslint/no-extraneous-class': 'warn', // Evita clases vacías o innecesarias
    },
  },
];
