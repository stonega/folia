import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import {
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import { useFonts } from 'expo-font';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { ArrowUpRight, CreditCard, Plus, Sparkles } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { CardDetail, type CardRect } from './src/components/CardDetail';
import { CardEditor } from './src/components/CardEditor';
import { CardFace } from './src/components/CardFace';
import type { WalletCard } from './src/model';
import { DEMO_CARDS } from './src/model';
import { loadCards, removePhoto, saveCards } from './src/storage';
import { colors, fonts } from './src/theme';

type SelectedCard = { id: string; origin: CardRect };

export default function App() {
  const [fontsLoaded] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
  });
  const [cards, setCards] = useState<WalletCard[]>(DEMO_CARDS);
  const [ready, setReady] = useState(false);
  const [selected, setSelected] = useState<SelectedCard | null>(null);
  const [editing, setEditing] = useState<WalletCard | 'new' | null>(null);
  const rootRef = useRef<View | null>(null);
  const cardRefs = useRef<Record<string, View | null>>({});
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width - 44, 440);
  const featured = cards[0];
  const rest = cards.slice(1);

  useEffect(() => {
    loadCards()
      .then(setCards)
      .catch(() => setCards(DEMO_CARDS))
      .finally(() => setReady(true));
  }, []);

  function commit(next: WalletCard[]) {
    setCards(next);
    saveCards(next).catch((error) =>
      console.warn('Could not save cards', error),
    );
  }

  function openCard(card: WalletCard) {
    const ref = cardRefs.current[card.id];
    if (!ref) return;
    ref.measureInWindow((x, y, cardWidth, cardHeight) => {
      rootRef.current?.measureInWindow((rootX, rootY) => {
        Haptics.selectionAsync().catch(() => undefined);
        setSelected({
          id: card.id,
          origin: {
            x: x - rootX,
            y: y - rootY,
            width: cardWidth,
            height: cardHeight,
          },
        });
      });
    });
  }

  async function saveCard(card: WalletCard) {
    const previous = cards.find((item) => item.id === card.id);
    const exists = Boolean(previous);
    const next = exists
      ? cards.map((item) => (item.id === card.id ? card : item))
      : [card, ...cards];
    await saveCards(next);
    setCards(next);
    setEditing(null);
    if (previous?.photoUri && previous.photoUri !== card.photoUri) {
      removePhoto(previous.photoUri);
    }
  }

  async function deleteSelected() {
    if (!selected) return;
    const removed = cards.find((card) => card.id === selected.id);
    const next = cards.filter((card) => card.id !== selected.id);
    await saveCards(next);
    setCards(next);
    setSelected(null);
    removePhoto(removed?.photoUri);
  }

  const active = selected
    ? cards.find((card) => card.id === selected.id)
    : undefined;

  if (!fontsLoaded || !ready) {
    return (
      <SafeAreaProvider>
        <View style={styles.loading}>
          <Text style={styles.loadingMark}>f.</Text>
          <ActivityIndicator color={colors.ink} />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <View ref={rootRef} collapsable={false} style={styles.root}>
        <StatusBar style={selected ? 'light' : 'dark'} />
        <SafeAreaView style={styles.safe} edges={['top']}>
          <View style={styles.topBar}>
            <View style={styles.brandRow}>
              <View style={styles.brandIcon}>
                <Text style={styles.brandGlyph}>f.</Text>
              </View>
              <Text style={styles.brandWord}>folio</Text>
              <View style={styles.brandDot} />
            </View>
            <View style={styles.topRight}>
              <Sparkles size={13} color="#74876B" strokeWidth={1.8} />
              <Text style={styles.topRightText}>MADE FOR YOUR EVERYDAY</Text>
            </View>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollInner}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.intro}>
              <Text style={styles.eyebrow}>YOUR SPACE, IN YOUR POCKET</Text>
              <Text style={styles.title}>
                Your cards.
                <Text style={styles.titleSoft}>{'\n'}Beautifully kept.</Text>
              </Text>
              <Text style={styles.lead}>
                The little things that open big doors.
              </Text>
            </View>

            {featured ? (
              <>
                <View style={styles.sectionHeading}>
                  <Text style={styles.sectionLabel}>FEATURED CARD</Text>
                  <View style={styles.countPill}>
                    <Text style={styles.countText}>
                      {String(cards.length).padStart(2, '0')} IN FOLIO
                    </Text>
                  </View>
                </View>
                <View style={styles.heroWrap}>
                  <View style={styles.heroGlow} />
                  <View
                    ref={(ref) => {
                      cardRefs.current[featured.id] = ref;
                    }}
                    collapsable={false}
                    style={{ opacity: selected?.id === featured.id ? 0 : 1 }}
                  >
                    <Pressable
                      onPress={() => openCard(featured)}
                      accessibilityLabel={`Open ${featured.name}`}
                      accessibilityRole="button"
                    >
                      <CardFace card={featured} width={contentWidth} />
                    </Pressable>
                  </View>
                </View>
                <Pressable
                  onPress={() => openCard(featured)}
                  style={styles.featuredCaption}
                  accessibilityRole="button"
                >
                  <View>
                    <Text style={styles.featuredName}>{featured.name}</Text>
                    <Text style={styles.featuredType}>
                      {featured.category} ·{' '}
                      {featured.isDemo
                        ? 'Sample card'
                        : featured.tag
                          ? 'NFC data saved'
                          : featured.photoUri
                            ? 'Photo card'
                            : 'Custom card'}
                    </Text>
                  </View>
                  <View style={styles.arrowCircle}>
                    <ArrowUpRight
                      size={18}
                      color={colors.ink}
                      strokeWidth={1.7}
                    />
                  </View>
                </Pressable>
              </>
            ) : null}

            <View
              style={[styles.sectionHeading, { marginTop: featured ? 31 : 9 }]}
            >
              <Text style={styles.sectionLabel}>
                {featured ? 'THE COLLECTION' : 'START YOUR COLLECTION'}
              </Text>
              <Text style={styles.sectionAside}>
                {featured ? `${rest.length} MORE` : 'YOUR FIRST CARD AWAITS'}
              </Text>
            </View>
            {rest.length ? (
              rest.map((card, index) => (
                <Pressable
                  key={card.id}
                  onPress={() => openCard(card)}
                  style={[styles.listItem, index > 0 && styles.listDivider]}
                  accessibilityLabel={`Open ${card.name}`}
                  accessibilityRole="button"
                >
                  <View
                    ref={(ref) => {
                      cardRefs.current[card.id] = ref;
                    }}
                    collapsable={false}
                    style={{ opacity: selected?.id === card.id ? 0 : 1 }}
                  >
                    <CardFace card={card} width={106} compact />
                  </View>
                  <View style={styles.listCopy}>
                    <Text numberOfLines={1} style={styles.listName}>
                      {card.name}
                    </Text>
                    <Text style={styles.listType}>
                      {card.category} ·{' '}
                      {card.isDemo
                        ? 'Sample'
                        : card.tag
                          ? 'NFC linked'
                          : 'Saved'}
                    </Text>
                  </View>
                  <ArrowUpRight size={18} color="#899287" strokeWidth={1.5} />
                </Pressable>
              ))
            ) : featured ? (
              <Text style={styles.emptySecondary}>
                The rest of your collection begins here.
              </Text>
            ) : (
              <View style={styles.emptyState}>
                <CreditCard size={31} color="#7E8B7A" strokeWidth={1.4} />
                <Text style={styles.emptyTitle}>A lovely place to start.</Text>
                <Text style={styles.emptyText}>
                  Add a card, take its photo, and keep its details close.
                </Text>
              </View>
            )}
            <View style={{ height: 20 }} />
          </ScrollView>

          <View style={styles.bottomBar}>
            <View>
              <Text style={styles.bottomKicker}>YOUR COLLECTION</Text>
              <Text style={styles.bottomCount}>
                {cards.length} {cards.length === 1 ? 'card' : 'cards'} with you
              </Text>
            </View>
            <Pressable
              onPress={() => {
                Haptics.selectionAsync().catch(() => undefined);
                setEditing('new');
              }}
              style={styles.addButton}
              accessibilityLabel="Add a card"
              accessibilityRole="button"
            >
              <Plus size={24} color={colors.ink} strokeWidth={2} />
            </Pressable>
          </View>
        </SafeAreaView>

        {active && selected && (
          <CardDetail
            card={active}
            origin={selected.origin}
            onClose={() => setSelected(null)}
            onEdit={() => setEditing(active)}
            onDelete={deleteSelected}
            onTagScanned={(card) =>
              commit(cards.map((item) => (item.id === card.id ? card : item)))
            }
            isEditorOpen={editing !== null}
          />
        )}
        {editing && (
          <CardEditor
            card={editing === 'new' ? undefined : editing}
            onClose={() => setEditing(null)}
            onSave={saveCard}
          />
        )}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  safe: { flex: 1 },
  loading: {
    flex: 1,
    backgroundColor: colors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  loadingMark: {
    fontSize: 56,
    fontWeight: '800',
    color: colors.ink,
    letterSpacing: -5,
  },
  topBar: {
    height: 69,
    paddingHorizontal: 23,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandRow: { flexDirection: 'row', alignItems: 'center' },
  brandIcon: {
    width: 31,
    height: 31,
    borderRadius: 10,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandGlyph: {
    fontFamily: fonts.displayBold,
    color: colors.accent,
    fontSize: 23,
    lineHeight: 29,
    letterSpacing: -2,
    marginRight: 2,
  },
  brandWord: {
    fontFamily: fonts.displayBold,
    fontSize: 21,
    letterSpacing: -1.6,
    color: colors.ink,
    marginLeft: 9,
  },
  brandDot: {
    width: 5,
    height: 5,
    backgroundColor: '#8BAB65',
    borderRadius: 3,
    marginLeft: 2,
    marginTop: 12,
  },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  topRightText: {
    fontFamily: fonts.bold,
    fontSize: 8,
    letterSpacing: 1.2,
    color: '#849180',
  },
  scroll: { flex: 1 },
  scrollInner: { paddingHorizontal: 22, alignItems: 'center' },
  intro: { width: '100%', maxWidth: 440, paddingTop: 31, paddingBottom: 31 },
  eyebrow: {
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 2.2,
    color: '#819078',
    marginBottom: 14,
  },
  title: {
    fontFamily: fonts.displayBold,
    fontSize: 38,
    lineHeight: 42,
    letterSpacing: -2.1,
    color: colors.ink,
  },
  titleSoft: { color: '#849181' },
  lead: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.secondary,
    marginTop: 14,
  },
  sectionHeading: {
    width: '100%',
    maxWidth: 440,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  sectionLabel: {
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 1.8,
    color: '#3F4B3C',
  },
  sectionAside: {
    fontFamily: fonts.bold,
    fontSize: 9,
    letterSpacing: 1.5,
    color: '#A2AA9E',
  },
  countPill: {
    backgroundColor: '#E6ECDD',
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  countText: {
    fontFamily: fonts.bold,
    color: '#6A7B61',
    fontSize: 9,
    letterSpacing: 1,
  },
  heroWrap: { width: '100%', maxWidth: 440, alignItems: 'center' },
  heroGlow: {
    position: 'absolute',
    left: 17,
    right: 17,
    top: 12,
    bottom: -15,
    backgroundColor: '#A8C1A660',
    borderRadius: 28,
  },
  featuredCaption: {
    width: '100%',
    maxWidth: 440,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 23,
  },
  featuredName: { color: colors.ink, fontFamily: fonts.semibold, fontSize: 15 },
  featuredType: {
    color: colors.secondary,
    fontFamily: fonts.body,
    fontSize: 11,
    marginTop: 4,
  },
  arrowCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D5DBCF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listItem: {
    width: '100%',
    maxWidth: 440,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
  },
  listDivider: { borderTopWidth: 1, borderTopColor: '#E2E4DC' },
  listCopy: { flex: 1, paddingHorizontal: 15 },
  listName: { fontFamily: fonts.semibold, color: colors.ink, fontSize: 14 },
  listType: {
    fontFamily: fonts.body,
    color: colors.secondary,
    fontSize: 11,
    marginTop: 5,
  },
  emptySecondary: {
    width: '100%',
    maxWidth: 440,
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.secondary,
    paddingVertical: 12,
  },
  emptyState: {
    width: '100%',
    maxWidth: 440,
    alignItems: 'center',
    backgroundColor: '#E9ECE5',
    padding: 30,
    borderRadius: 20,
    marginTop: 8,
  },
  emptyTitle: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: colors.ink,
    marginTop: 12,
  },
  emptyText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.secondary,
    textAlign: 'center',
    marginTop: 7,
    lineHeight: 18,
  },
  bottomBar: {
    height: 83,
    backgroundColor: '#F5F3EEFA',
    borderTopWidth: 1,
    borderTopColor: '#E4E5DD',
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bottomKicker: {
    fontFamily: fonts.bold,
    color: '#96A091',
    fontSize: 9,
    letterSpacing: 1.8,
  },
  bottomCount: {
    fontFamily: fonts.semibold,
    color: colors.ink,
    fontSize: 14,
    marginTop: 3,
  },
  addButton: {
    width: 51,
    height: 51,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    shadowColor: '#7F9F53',
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
});
