/**
 * Jest type declarations for test files
 */

import type { Mock, MockInstance } from 'vitest';

declare global {
  namespace NodeJS {
    interface Global {
      jest: typeof import('vitest');
    }
  }

  // Jest global functions
  const jest: {
    mock: (path: string, factory?: () => unknown) => unknown;
    fn: () => Mock;
    spyOn: (obj: object, method: string) => MockInstance;
    clearAllMocks: () => void;
    resetAllMocks: () => void;
    restoreAllMocks: () => void;
    doMock: (path: string, factory?: () => unknown) => unknown;
    doUnmock: (path: string) => void;
    enableAutomock: () => void;
    disableAutomock: () => void;
    setSystemTime: (time: number | Date) => void;
    useRealTimers: () => void;
    useFakeTimers: (config?: object) => void;
  };

  // Global jest functions (shorthand)
  function describe(name: string, fn: () => void): void;
  function it(name: string, fn: () => void | Promise<void>): void;
  function test(name: string, fn: () => void | Promise<void>): void;
  function expect(actual: unknown): {
    toBe: (expected: unknown) => void;
    toEqual: (expected: unknown) => void;
    toBeTruthy: () => void;
    toBeFalsy: () => void;
    toBeNull: () => void;
    toBeUndefined: () => void;
    toBeDefined: () => void;
    toContain: (item: unknown) => void;
    toHaveLength: (length: number) => void;
    toThrow: () => void;
    toMatchObject: (expected: object) => void;
    not: ReturnType<typeof expect>;
  };
  function beforeEach(fn: () => void | Promise<void>): void;
  function afterEach(fn: () => void | Promise<void>): void;
  function beforeAll(fn: () => void | Promise<void>): void;
  function afterAll(fn: () => void | Promise<void>): void;
}

export {};
