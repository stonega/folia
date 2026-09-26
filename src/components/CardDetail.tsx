import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  MoreHorizontal,
  PenLine,
  Radio,
  Trash2,
} from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { WalletCard } from '../model';
import { readableRecordCount } from '../model';
import { scanNdefTag } from '../nfc';
import { fonts } from '../theme';
import { CardFace } from './CardFace';

export type CardRect = { x: number; y: number; width: number; height: number };

type Props = {
  card: WalletCard;
  origin: CardRect;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => Promise<void>;
  onTagScanned: (card: WalletCard) => void;
  isEditorOpen: boolean;
};

export function CardDetail({
  card,
  origin,
  onClose,
  onEdit,
  onDelete,
  onTagScanned,
  isEditorOpen,
}: Props) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const cardWidth = Math.min(width - 40, 420);
  const cardHeight = cardWidth / 1.586;
  const targetX = (width - cardWidth) / 2;
  const targetY = insets.top + 104;
  const dx = origin.x + origin.width / 2 - (targetX + cardWidth / 2);
  const dy = origin.y + origin.height / 2 - (targetY + cardHeight / 2);
  const scale = origin.width / cardWidth;
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(0);
  const tiltX = useSharedValue(0);
  const tiltY = useSharedValue(0);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const closing = useRef(false);
  const closeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    progress.value = reduceMotion
      ? withTiming(1, { duration: 100 })
      : withSpring(1, { damping: 24, stiffness: 190, mass: 0.92 });
  }, [progress, reduceMotion]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: progress.value }));
  const chromeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0.42, 1], [0, 1]),
    transform: [{ translateY: interpolate(progress.value, [0, 1], [28, 0]) }],
  }));
  const cardPositionStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(progress.value, [0, 1], [dx, 0]) },
      { translateY: interpolate(progress.value, [0, 1], [dy, 0]) },
      { scale: interpolate(progress.value, [0, 1], [scale, 1]) },
    ],
  }));
  const tiltStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1000 },
      { rotateX: `${tiltX.value}deg` },
      { rotateY: `${tiltY.value}deg` },
    ],
  }));
  const sheenStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tiltY.value * 8 }],
  }));

  const close = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    tiltX.value = withSpring(0);
    tiltY.value = withSpring(0);
    progress.value = withTiming(0, { duration: reduceMotion ? 100 : 330 });
    closeTimeout.current = setTimeout(onClose, reduceMotion ? 105 : 335);
  }, [onClose, progress, reduceMotion, tiltX, tiltY]);

  useEffect(() => {
    if (isEditorOpen) return;
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        close();
        return true;
      },
    );
    return () => subscription.remove();
  }, [close, isEditorOpen]);

  useEffect(
    () => () => {
      if (closeTimeout.current) clearTimeout(closeTimeout.current);
    },
    [],
  );

  function confirmDelete() {
    const remove = async () => {
      try {
        await onDelete();
        Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Warning,
        ).catch(() => undefined);
      } catch {
        setError('Could not remove this card. Please try again.');
      }
    };
    if (Platform.OS === 'web') {
      if (globalThis.confirm?.(`Remove ${card.name} from Folio?`))
        void remove();
      return;
    }
    Alert.alert(
      'Remove this card?',
      'The photo and saved NFC data will be removed from Folio.',
      [
        { text: 'Keep card', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => void remove() },
      ],
    );
  }

  async function scan() {
    setError('');
    setScanning(true);
    try {
      const tag = await scanNdefTag();
      onTagScanned({ ...card, tag, isDemo: false });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => undefined,
      );
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Could not read this tag.',
      );
    } finally {
      setScanning(false);
    }
  }

  return (
    <View style={styles.root}>
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <LinearGradient
          colors={['#1B3129', '#121D19', '#101714']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.ambientOrb} />
      </Animated.View>

      <Animated.View
        style={[styles.header, { top: insets.top + 14 }, chromeStyle]}
      >
        <Pressable
          onPress={close}
          style={styles.roundButton}
          accessibilityLabel="Back to cards"
        >
          <ArrowLeft size={21} color="#F0F5ED" strokeWidth={1.8} />
        </Pressable>
        <Text style={styles.headerTitle}>FOLIO / CARD</Text>
        <Pressable
          onPress={onEdit}
          style={styles.roundButton}
          accessibilityLabel="Edit card"
        >
          <MoreHorizontal size={22} color="#F0F5ED" strokeWidth={1.8} />
        </Pressable>
      </Animated.View>

      <Animated.View
        style={[
          styles.cardPosition,
          { top: targetY, left: targetX, width: cardWidth, height: cardHeight },
          cardPositionStyle,
        ]}
      >
        <Animated.View
          style={tiltStyle}
          onTouchMove={(event) => {
            if (reduceMotion) return;
            const { locationX, locationY } = event.nativeEvent;
            tiltX.value = Math.max(
              -7,
              Math.min(7, (0.5 - locationY / cardHeight) * 12),
            );
            tiltY.value = Math.max(
              -7,
              Math.min(7, (locationX / cardWidth - 0.5) * 12),
            );
          }}
          onTouchEnd={() => {
            tiltX.value = withSpring(0);
            tiltY.value = withSpring(0);
          }}
          onTouchCancel={() => {
            tiltX.value = withSpring(0);
            tiltY.value = withSpring(0);
          }}
        >
          <CardFace card={card} width={cardWidth} height={cardHeight} />
          <Animated.View
            pointerEvents="none"
            style={[styles.sheen, sheenStyle]}
          >
            <LinearGradient
              colors={[
                '#FFFFFF00',
                card.photoUri ? '#FFFFFF22' : '#FFFFFF40',
                '#FFFFFF00',
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </Animated.View>
      </Animated.View>

      <Animated.View
        style={[
          styles.detailContent,
          { top: targetY + cardHeight + 30, bottom: insets.bottom + 8 },
          chromeStyle,
        ]}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.detailScroll}
        >
          <View style={styles.categoryRow}>
            <View style={styles.categoryDot} />
            <Text style={styles.categoryText}>
              {card.category.toUpperCase()}
            </Text>
            {card.isDemo && <Text style={styles.demoPill}>SAMPLE</Text>}
          </View>
          <Text style={styles.name}>{card.name}</Text>
          <Text style={styles.subtitle}>
            {card.subtitle || 'A card worth keeping close.'}
          </Text>

          <View style={styles.statusPanel}>
            <View style={styles.statusIcon}>
              {card.tag ? (
                <Check size={19} color="#D9F6BC" strokeWidth={2} />
              ) : (
                <Radio size={19} color="#D9F6BC" strokeWidth={1.7} />
              )}
            </View>
            <View style={styles.statusCopy}>
              <Text style={styles.statusTitle}>
                {card.tag ? 'Scan captured' : 'Ready to link'}
              </Text>
              <Text style={styles.statusText}>
                {readableRecordCount(card.tag)}
              </Text>
            </View>
            <ArrowUpRight size={19} color="#A9B7A8" strokeWidth={1.5} />
          </View>

          <Pressable
            onPress={scan}
            disabled={scanning}
            style={styles.primaryButton}
            accessibilityRole="button"
          >
            {scanning ? (
              <ActivityIndicator color="#102019" />
            ) : (
              <>
                <Radio size={20} color="#102019" strokeWidth={1.9} />
                <Text style={styles.primaryText}>
                  {card.tag ? 'Scan again' : 'Scan physical card'}
                </Text>
                <ArrowUpRight
                  size={20}
                  color="#102019"
                  strokeWidth={1.9}
                  style={{ marginLeft: 'auto' }}
                />
              </>
            )}
          </Pressable>

          <View style={styles.actions}>
            <Pressable onPress={onEdit} style={styles.action}>
              <PenLine size={16} color="#C8D5C9" strokeWidth={1.7} />
              <Text style={styles.actionText}>Edit card</Text>
            </Pressable>
            <View style={styles.separator} />
            <Pressable onPress={confirmDelete} style={styles.action}>
              <Trash2 size={16} color="#C8D5C9" strokeWidth={1.7} />
              <Text style={styles.actionText}>Remove</Text>
            </Pressable>
          </View>
          <Text style={styles.disclaimer}>
            Folio saves compatible NDEF data on this device. A saved scan cannot
            make your phone behave as every physical card.
          </Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFill, zIndex: 20 },
  backdrop: { ...StyleSheet.absoluteFill, overflow: 'hidden' },
  ambientOrb: {
    position: 'absolute',
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: '#6E9C6B18',
    top: 95,
    left: '34%',
  },
  header: {
    position: 'absolute',
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#ADBBAE',
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 2.1,
  },
  roundButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFFFFF36',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardPosition: { position: 'absolute' },
  sheen: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '18%',
    width: '65%',
    borderRadius: 22,
    overflow: 'hidden',
    opacity: 0.35,
    transform: [{ skewX: '-17deg' }],
  },
  detailContent: { position: 'absolute', left: 0, right: 0 },
  detailScroll: { paddingHorizontal: 25, paddingBottom: 18 },
  categoryRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  categoryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#C7F176',
  },
  categoryText: {
    fontFamily: fonts.bold,
    color: '#C1D4BD',
    letterSpacing: 1.9,
    fontSize: 10,
  },
  demoPill: {
    color: '#B0BFAF',
    fontFamily: fonts.bold,
    letterSpacing: 1.5,
    fontSize: 8,
    borderWidth: 1,
    borderColor: '#FFFFFF32',
    borderRadius: 99,
    paddingHorizontal: 7,
    paddingVertical: 3,
    marginLeft: 6,
  },
  name: {
    fontFamily: fonts.displayBold,
    color: '#F5F6F0',
    fontSize: 35,
    letterSpacing: -1.7,
    marginTop: 12,
  },
  subtitle: {
    fontFamily: fonts.body,
    color: '#AAB8A9',
    fontSize: 13,
    marginTop: 3,
  },
  statusPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF10',
    borderWidth: 1,
    borderColor: '#FFFFFF18',
    borderRadius: 18,
    padding: 14,
    marginTop: 26,
  },
  statusIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#D7F5A91D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusCopy: { flex: 1, paddingLeft: 12 },
  statusTitle: { fontFamily: fonts.semibold, color: '#F3F6EF', fontSize: 13 },
  statusText: {
    fontFamily: fonts.body,
    color: '#A7B5A7',
    fontSize: 11,
    marginTop: 3,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 56,
    backgroundColor: '#C7F176',
    borderRadius: 16,
    paddingHorizontal: 19,
    marginTop: 16,
  },
  primaryText: { color: '#102019', fontFamily: fonts.bold, fontSize: 14 },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
    gap: 21,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 9,
  },
  actionText: { fontFamily: fonts.medium, color: '#C8D5C9', fontSize: 12 },
  separator: { height: 17, width: 1, backgroundColor: '#FFFFFF2A' },
  disclaimer: {
    fontFamily: fonts.body,
    color: '#89988B',
    fontSize: 10,
    lineHeight: 16,
    textAlign: 'center',
    marginTop: 21,
    paddingHorizontal: 10,
  },
  error: {
    fontFamily: fonts.medium,
    color: '#FFB3A3',
    fontSize: 11,
    lineHeight: 17,
    textAlign: 'center',
    marginTop: 12,
  },
});
