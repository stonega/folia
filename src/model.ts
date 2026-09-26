export type CardCategory = 'Access' | 'Membership' | 'Transit' | 'Other';
export type CardLook = 'forest' | 'peach' | 'blue' | 'violet';

export type NdefRecord = {
  tnf: number;
  type: string | number[];
  id: number[];
  payload: number[];
};

export type SavedTag = {
  technology: string;
  scannedAt: string;
  records: NdefRecord[];
};

export type WalletCard = {
  id: string;
  name: string;
  subtitle: string;
  category: CardCategory;
  look: CardLook;
  photoUri?: string;
  tag?: SavedTag;
  isDemo?: boolean;
  createdAt: string;
};

export const DEMO_CARDS: WalletCard[] = [
  {
    id: 'demo-atelier',
    name: 'Atelier Club',
    subtitle: 'Your space to create',
    category: 'Membership',
    look: 'forest',
    isDemo: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'demo-metro',
    name: 'Metro Pass',
    subtitle: 'Everywhere, effortlessly',
    category: 'Transit',
    look: 'peach',
    isDemo: true,
    createdAt: '2026-01-02T00:00:00.000Z',
  },
  {
    id: 'demo-studio',
    name: 'Studio North',
    subtitle: 'Member access',
    category: 'Access',
    look: 'blue',
    isDemo: true,
    createdAt: '2026-01-03T00:00:00.000Z',
  },
];

export function makeCard(
  input: Pick<
    WalletCard,
    'name' | 'subtitle' | 'category' | 'look' | 'photoUri' | 'tag'
  >,
): WalletCard {
  const name = input.name.trim();
  if (!name) throw new Error('Give your card a name.');
  return {
    ...input,
    name,
    subtitle: input.subtitle.trim(),
    id: `card-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  };
}

export function readableRecordCount(tag?: SavedTag): string {
  if (!tag) return 'No NFC linked';
  const count = tag.records.length;
  return `${count} NFC ${count === 1 ? 'record' : 'records'} saved`;
}
