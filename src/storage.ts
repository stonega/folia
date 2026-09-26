import AsyncStorage from '@react-native-async-storage/async-storage';
import { Directory, File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';
import { DEMO_CARDS, type WalletCard } from './model';

const STORAGE_KEY = 'folio.cards.v1';

export async function loadCards(): Promise<WalletCard[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (raw === null) return DEMO_CARDS;
  try {
    const cards: unknown = JSON.parse(raw);
    return Array.isArray(cards) ? (cards as WalletCard[]) : DEMO_CARDS;
  } catch {
    return DEMO_CARDS;
  }
}

export async function saveCards(cards: WalletCard[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
}

export async function preservePhoto(uri: string): Promise<string> {
  if (Platform.OS === 'web') return uri;
  const folder = new Directory(Paths.document, 'card-photos');
  folder.create({ idempotent: true, intermediates: true });
  const extension = uri.split('?')[0]?.split('.').pop()?.toLowerCase();
  const safeExtension =
    extension === 'png' || extension === 'heic' ? extension : 'jpg';
  const source = new File(uri);
  const target = new File(folder, `card-${Date.now()}.${safeExtension}`);
  source.copy(target);
  return target.uri;
}

export function removePhoto(uri?: string): void {
  if (!uri || Platform.OS === 'web') return;
  const folderUri = new Directory(Paths.document, 'card-photos').uri.replace(
    /\/$/,
    '',
  );
  if (!uri.startsWith(`${folderUri}/`)) return;
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch (error) {
    console.warn('Could not remove old card photo', error);
  }
}
