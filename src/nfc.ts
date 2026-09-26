import { Platform } from 'react-native';
import type { NdefRecord, SavedTag } from './model';

export async function scanNdefTag(): Promise<SavedTag> {
  if (Platform.OS === 'web') {
    throw new Error(
      'NFC scanning requires an Android or iPhone development build.',
    );
  }

  let manager: typeof import('react-native-nfc-manager').default;
  let tech: typeof import('react-native-nfc-manager').NfcTech;
  try {
    const module = await import('react-native-nfc-manager');
    manager = module.default;
    tech = module.NfcTech;
  } catch {
    throw new Error(
      'NFC is unavailable in Expo Go. Open a development build on an NFC phone.',
    );
  }

  try {
    await manager.start();
  } catch {
    throw new Error(
      'NFC is unavailable in Expo Go. Open a development build on an NFC phone.',
    );
  }
  const supported = await manager.isSupported();
  if (!supported) throw new Error('This phone does not support NFC scanning.');
  const enabled = await manager.isEnabled();
  if (!enabled)
    throw new Error('Turn on NFC in your phone settings and try again.');

  try {
    await manager.requestTechnology(tech.Ndef);
    const tag = await manager.getTag();
    if (!tag) throw new Error('No NFC tag was found.');
    const records: NdefRecord[] = (tag.ndefMessage ?? []).map((record) => ({
      tnf: record.tnf ?? 0,
      type:
        typeof record.type === 'string'
          ? record.type
          : Array.from(record.type ?? []),
      id: Array.from(record.id ?? []),
      payload: Array.from(record.payload ?? []),
    }));
    return {
      technology: 'NDEF',
      scannedAt: new Date().toISOString(),
      records,
    };
  } finally {
    await manager.cancelTechnologyRequest().catch(() => undefined);
  }
}
