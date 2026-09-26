import { LinearGradient } from 'expo-linear-gradient';
import { Image, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import type { WalletCard } from '../model';
import { fonts } from '../theme';

const looks = {
  forest: {
    base: '#173D35',
    mid: '#235347',
    end: '#0D2C27',
    text: '#EAF4D9',
    muted: '#BDD3BE',
  },
  peach: {
    base: '#EBB599',
    mid: '#D6846F',
    end: '#A45457',
    text: '#4B232A',
    muted: '#6F3D41',
  },
  blue: {
    base: '#182B57',
    mid: '#27457A',
    end: '#142142',
    text: '#F0F5FF',
    muted: '#B9CBE7',
  },
  violet: {
    base: '#524065',
    mid: '#796387',
    end: '#3A2E52',
    text: '#FAF0FF',
    muted: '#E1CEEA',
  },
} as const;

type Props = {
  card: WalletCard;
  width: number;
  height?: number;
  compact?: boolean;
};

export function CardFace({
  card,
  width,
  height = width / 1.586,
  compact = false,
}: Props) {
  const look = looks[card.look];
  const pad = compact ? 12 : 23;
  const titleSize = compact ? 14 : Math.min(31, width * 0.088);

  return (
    <View
      style={[styles.card, { width, height, borderRadius: compact ? 12 : 23 }]}
    >
      {card.photoUri ? (
        <Image
          source={{ uri: card.photoUri }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
      ) : (
        <>
          <LinearGradient
            colors={[look.base, look.mid, look.end]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <DemoArtwork look={card.look} width={width} height={height} />
          <View style={[styles.content, { padding: pad }]}>
            <View style={styles.topRow}>
              <View
                style={[
                  styles.monogram,
                  {
                    borderColor: `${look.text}99`,
                    width: compact ? 19 : 27,
                    height: compact ? 19 : 27,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.monogramText,
                    { color: look.text, fontSize: compact ? 10 : 14 },
                  ]}
                >
                  {card.name.slice(0, 1)}
                </Text>
              </View>
              <Text
                style={[
                  styles.cardCategory,
                  { color: look.muted, fontSize: compact ? 7 : 9 },
                ]}
              >
                {card.category.toUpperCase()}
              </Text>
            </View>
            <View>
              <Text
                numberOfLines={1}
                style={[
                  styles.cardTitle,
                  { color: look.text, fontSize: titleSize },
                ]}
              >
                {card.name}
              </Text>
              {!compact && (
                <Text style={[styles.cardSubtitle, { color: look.muted }]}>
                  {card.subtitle}
                </Text>
              )}
            </View>
          </View>
        </>
      )}
      <LinearGradient
        pointerEvents="none"
        colors={['#FFFFFF18', '#FFFFFF00', '#00000012']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View pointerEvents="none" style={styles.hairline} />
    </View>
  );
}

function DemoArtwork({
  look,
  width,
  height,
}: {
  look: WalletCard['look'];
  width: number;
  height: number;
}) {
  if (look === 'forest') {
    return (
      <View
        style={[
          styles.art,
          {
            left: width * 0.38,
            top: -height * 0.58,
            width: width * 0.89,
            height: width * 0.89,
          },
        ]}
      >
        <Svg width="100%" height="100%" viewBox="0 0 320 320">
          <Circle
            cx="160"
            cy="160"
            r="135"
            fill="none"
            stroke="#C6DCAC"
            strokeOpacity=".4"
            strokeWidth="1"
          />
          <Circle
            cx="160"
            cy="160"
            r="111"
            fill="none"
            stroke="#D9E7C0"
            strokeOpacity=".56"
            strokeWidth="1"
          />
          <Circle
            cx="160"
            cy="160"
            r="86"
            fill="none"
            stroke="#D9E7C0"
            strokeOpacity=".47"
            strokeWidth="1"
          />
          <Circle
            cx="160"
            cy="160"
            r="61"
            fill="none"
            stroke="#D9E7C0"
            strokeOpacity=".42"
            strokeWidth="1"
          />
          <Circle
            cx="160"
            cy="160"
            r="36"
            fill="none"
            stroke="#D9E7C0"
            strokeOpacity=".34"
            strokeWidth="1"
          />
        </Svg>
      </View>
    );
  }
  if (look === 'peach') {
    return (
      <View
        style={[
          styles.art,
          {
            right: -width * 0.09,
            top: -height * 0.22,
            width: width * 0.64,
            height: height * 1.43,
            transform: [{ rotate: '-23deg' }],
          },
        ]}
      >
        <LinearGradient
          colors={['#F8E2BB', '#F1BC98', '#D17770']}
          style={styles.sculpture}
        />
        <View style={styles.sculptureInset} />
      </View>
    );
  }
  return (
    <View
      style={[
        styles.art,
        {
          right: -width * 0.2,
          top: -height * 0.65,
          width: width * 0.92,
          height: width * 0.92,
        },
      ]}
    >
      <Svg width="100%" height="100%" viewBox="0 0 320 320">
        <Circle
          cx="160"
          cy="160"
          r="144"
          fill="none"
          stroke="#A5D8FF"
          strokeOpacity=".36"
          strokeWidth="48"
        />
        <Circle
          cx="160"
          cy="160"
          r="100"
          fill="none"
          stroke="#BCD2F9"
          strokeOpacity=".32"
          strokeWidth="3"
        />
        <Path
          d="M30 167 C95 250 223 247 291 167"
          fill="none"
          stroke="#F3EAFF"
          strokeOpacity=".45"
          strokeWidth="1"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    backgroundColor: '#193B33',
    shadowColor: '#19322B',
    shadowOpacity: 0.22,
    shadowOffset: { width: 0, height: 17 },
    shadowRadius: 24,
    elevation: 7,
  },
  content: { ...StyleSheet.absoluteFill, justifyContent: 'space-between' },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  monogram: {
    borderWidth: 1,
    borderRadius: 99,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monogramText: { fontFamily: fonts.displayBold },
  cardCategory: { fontFamily: fonts.bold, letterSpacing: 2 },
  cardTitle: { fontFamily: fonts.display, letterSpacing: -1.2 },
  cardSubtitle: {
    fontFamily: fonts.body,
    fontSize: 11,
    letterSpacing: 0.3,
    marginTop: 4,
  },
  art: { position: 'absolute', opacity: 0.9 },
  sculpture: { flex: 1, borderRadius: 999 },
  sculptureInset: {
    position: 'absolute',
    left: '28%',
    right: '28%',
    top: '22%',
    bottom: '22%',
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#B25F5D80',
  },
  hairline: {
    ...StyleSheet.absoluteFill,
    borderWidth: 1,
    borderColor: '#FFFFFF29',
    borderRadius: 22,
  },
});
