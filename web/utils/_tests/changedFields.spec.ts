import { describe, it, expect } from 'vitest';

import { changedFields } from '../changedFields';

describe('changedFields', () => {
  it('returns only the entries whose values differ', () => {
    expect(
      changedFields(
        { name: 'Ada', email: 'ada@example.com', role: 'user' },
        { name: 'Ada Lovelace', email: 'ada@example.com', role: 'user' }
      )
    ).toEqual({ name: 'Ada Lovelace' });
  });

  it('returns an empty object when nothing changed', () => {
    expect(
      changedFields(
        { name: 'Ada', role: 'user' },
        { name: 'Ada', role: 'user' }
      )
    ).toEqual({});
  });

  it('includes keys absent from the original object', () => {
    // ! Callers must therefore exclude optional inputs like passwords themselves — an empty
    // ! string differs from undefined and would be sent as a change.
    expect(
      changedFields({ name: 'Ada' }, { name: 'Ada', password: '' })
    ).toEqual({ password: '' });
  });

  it('compares shallowly and strictly', () => {
    expect(changedFields({ id: 1 }, { id: '1' as unknown as number })).toEqual({
      id: '1'
    });
  });
});
