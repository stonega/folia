import { describe, expect, test } from 'bun:test';
import { makeCard, readableRecordCount } from '../src/model';

describe('card data', () => {
  test('requires a nonempty name and trims editable text', () => {
    expect(() =>
      makeCard({ name: '  ', subtitle: '', category: 'Other', look: 'forest' }),
    ).toThrow('Give your card a name.');
    const card = makeCard({
      name: '  Studio North  ',
      subtitle: '  Main entrance  ',
      category: 'Access',
      look: 'blue',
    });
    expect(card.name).toBe('Studio North');
    expect(card.subtitle).toBe('Main entrance');
    expect(card.isDemo).toBeUndefined();
  });

  test('labels saved NDEF records without implying phone emulation', () => {
    expect(readableRecordCount()).toBe('No NFC linked');
    expect(
      readableRecordCount({
        technology: 'NDEF',
        scannedAt: '2026-01-01',
        records: [
          { tnf: 1, type: 'T', id: [], payload: [2, 101, 110, 72, 105] },
        ],
      }),
    ).toBe('1 NFC record saved');
  });
});
