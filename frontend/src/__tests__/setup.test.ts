/**
 * Basic setup test to verify testing infrastructure
 */

import { describe, it, expect } from 'vitest';

describe('Frontend Setup', () => {
  it('should have testing infrastructure configured', () => {
    expect(true).toBe(true);
  });

  it('should be able to import types', () => {
    const role: 'Employee' | 'Reviewer' | 'Implementer' | 'Admin' = 'Employee';
    expect(role).toBe('Employee');
  });
});
