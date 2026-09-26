import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import {
  Camera,
  Check,
  ChevronDown,
  ImagePlus,
  Radio,
  X,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
  useReducedMotion,
} from 'react-native-reanimated';
import {
  type CardCategory,
  type CardLook,
  makeCard,
  type SavedTag,
  type WalletCard,
} from '../model';
import { scanNdefTag } from '../nfc';
import { preservePhoto } from '../storage';
import { colors, fonts } from '../theme';
import { CardFace } from './CardFace';

const categories: CardCategory[] = ['Access', 'Membership', 'Transit', 'Other'];
const looks: CardLook[] = ['forest', 'peach', 'blue', 'violet'];

type Props = {
  card?: WalletCard;
  onClose: () => void;
  onSave: (card: WalletCard) => Promise<void>;
};

export function CardEditor({ card, onClose, onSave }: Props) {
  const { width } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const previewWidth = Math.min(width - 96, 280);
  const [name, setName] = useState(card?.name ?? '');
  const [subtitle, setSubtitle] = useState(card?.subtitle ?? '');
  const [category, setCategory] = useState<CardCategory>(
    card?.category ?? 'Membership',
  );
  const [look, setLook] = useState<CardLook>(card?.look ?? 'forest');
  const [photoUri, setPhotoUri] = useState(card?.photoUri);
  const [tag, setTag] = useState<SavedTag | undefined>(card?.tag);
  const [scanning, setScanning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        onClose();
        return true;
      },
    );
    return () => subscription.remove();
  }, [onClose]);

  const preview: WalletCard = {
    id: card?.id ?? 'preview',
    name: name.trim() || 'Your card',
    subtitle: subtitle.trim() || 'A little piece of your world',
    category,
    look,
    photoUri,
    tag,
    createdAt: card?.createdAt ?? new Date().toISOString(),
  };

  async function choosePhoto(source: 'camera' | 'library') {
    setError('');
    try {
      if (source === 'camera') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted)
          throw new Error('Allow camera access to photograph your card.');
      }
      const result =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync({
              mediaTypes: ['images'],
              quality: Platform.OS === 'web' ? 0.7 : 0.9,
              base64: Platform.OS === 'web',
              cameraType: ImagePicker.CameraType.back,
            })
          : await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ['images'],
              quality: Platform.OS === 'web' ? 0.7 : 0.9,
              base64: Platform.OS === 'web',
              allowsEditing: false,
            });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const imageUri =
          Platform.OS === 'web' && asset.base64
            ? asset.base64.startsWith('data:')
              ? asset.base64
              : `data:${asset.mimeType ?? 'image/jpeg'};base64,${asset.base64}`
            : asset.uri;
        setPhotoUri(imageUri);
        Haptics.selectionAsync().catch(() => undefined);
      }
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Could not open the camera or photos.',
      );
    }
  }

  async function scan() {
    setError('');
    setScanning(true);
    try {
      const result = await scanNdefTag();
      setTag(result);
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

  async function save() {
    if (!name.trim()) {
      setError('Give your card a name first.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const finalPhotoUri =
        photoUri && photoUri !== card?.photoUri
          ? await preservePhoto(photoUri)
          : photoUri;
      const saved = card
        ? {
            ...card,
            name: name.trim(),
            subtitle: subtitle.trim(),
            category,
            look,
            photoUri: finalPhotoUri,
            tag,
            isDemo: false,
          }
        : makeCard({
            name,
            subtitle,
            category,
            look,
            photoUri: finalPhotoUri,
            tag,
          });
      await onSave(saved);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => undefined,
      );
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Could not save the card.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.screen}>
      <Animated.View entering={FadeIn.duration(220)} style={styles.scrim}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityLabel="Close card editor"
        />
      </Animated.View>
      <Animated.View
        entering={
          reduceMotion
            ? FadeIn.duration(100)
            : SlideInDown.duration(300).easing(Easing.out(Easing.cubic))
        }
        exiting={
          reduceMotion ? FadeOut.duration(100) : SlideOutDown.duration(220)
        }
        style={styles.sheet}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}
        >
          <View style={styles.grabber} />
          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>
                {card ? 'MAKE IT YOURS' : 'A NEW ADDITION'}
              </Text>
              <Text style={styles.heading}>
                {card ? 'Edit card' : 'Add a card'}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              style={styles.close}
              accessibilityLabel="Close"
            >
              <X size={20} color={colors.ink} strokeWidth={1.8} />
            </Pressable>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.previewWell}>
              <Text style={styles.previewLabel}>LIVE PREVIEW</Text>
              <CardFace card={preview} width={previewWidth} />
              <Text style={styles.previewHint}>
                Your photo becomes the exact face of this card.
              </Text>
            </View>

            <View style={styles.photoRow}>
              <Pressable
                onPress={() => choosePhoto('camera')}
                style={styles.photoButton}
              >
                <Camera size={18} color={colors.ink} strokeWidth={1.8} />
                <Text style={styles.photoButtonText}>Take photo</Text>
              </Pressable>
              <Pressable
                onPress={() => choosePhoto('library')}
                style={styles.photoButton}
              >
                <ImagePlus size={18} color={colors.ink} strokeWidth={1.8} />
                <Text style={styles.photoButtonText}>Choose photo</Text>
              </Pressable>
            </View>
            <Text style={styles.tip}>
              For the best match, photograph the card straight on in even light.
            </Text>

            <Text style={styles.fieldLabel}>CARD NAME</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Studio membership"
              placeholderTextColor="#A7AAA3"
              style={styles.input}
              maxLength={32}
              autoCapitalize="words"
            />
            <Text style={styles.fieldLabel}>
              A LITTLE DETAIL <Text style={styles.optional}>OPTIONAL</Text>
            </Text>
            <TextInput
              value={subtitle}
              onChangeText={setSubtitle}
              placeholder="e.g. Your place to unwind"
              placeholderTextColor="#A7AAA3"
              style={styles.input}
              maxLength={42}
            />

            <Text style={styles.fieldLabel}>CATEGORY</Text>
            <View style={styles.chips}>
              {categories.map((item) => (
                <Pressable
                  key={item}
                  onPress={() => setCategory(item)}
                  style={[styles.chip, category === item && styles.chipActive]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      category === item && styles.chipTextActive,
                    ]}
                  >
                    {item}
                  </Text>
                </Pressable>
              ))}
            </View>

            {!photoUri && (
              <>
                <Text style={styles.fieldLabel}>CARD FINISH</Text>
                <View style={styles.looks}>
                  {looks.map((item) => (
                    <Pressable
                      key={item}
                      onPress={() => setLook(item)}
                      style={[
                        styles.look,
                        {
                          backgroundColor: {
                            forest: '#234A3F',
                            peach: '#D99480',
                            blue: '#243C70',
                            violet: '#6B5377',
                          }[item],
                        },
                        look === item && styles.lookActive,
                      ]}
                      accessibilityLabel={`${item} card finish`}
                    >
                      {look === item && (
                        <Check size={18} color="white" strokeWidth={2.5} />
                      )}
                    </Pressable>
                  ))}
                </View>
              </>
            )}

            <View style={styles.nfcBlock}>
              <View style={styles.nfcIcon}>
                <Radio size={20} color={colors.ink} strokeWidth={1.7} />
              </View>
              <View style={styles.nfcCopy}>
                <Text style={styles.nfcTitle}>
                  {tag ? 'NFC data saved' : 'Link an NFC tag'}
                </Text>
                <Text style={styles.nfcDescription}>
                  {tag
                    ? `${tag.records.length} NDEF records saved locally`
                    : 'Save compatible NDEF records from your physical card.'}
                </Text>
              </View>
              <Pressable
                onPress={scan}
                disabled={scanning}
                style={styles.nfcAction}
                accessibilityLabel={tag ? 'Scan NFC tag again' : 'Scan NFC tag'}
              >
                {scanning ? (
                  <ActivityIndicator size="small" color={colors.ink} />
                ) : (
                  <ChevronDown
                    size={18}
                    color={colors.ink}
                    style={{ transform: [{ rotate: '-90deg' }] }}
                  />
                )}
              </Pressable>
            </View>
            <Text style={styles.nfcNote}>
              NFC reading needs a development build and an NFC phone. Saving a
              scan does not emulate the original card.
            </Text>
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </ScrollView>

          <View style={styles.footer}>
            <Pressable
              onPress={save}
              disabled={saving}
              style={[styles.saveButton, saving && { opacity: 0.6 }]}
              accessibilityRole="button"
            >
              {saving ? (
                <ActivityIndicator color={colors.ink} />
              ) : (
                <>
                  <Text style={styles.saveText}>
                    {card ? 'Save changes' : 'Add to Folio'}
                  </Text>
                  <Check size={20} color={colors.ink} strokeWidth={2} />
                </>
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: {
    ...StyleSheet.absoluteFill,
    zIndex: 30,
    justifyContent: 'flex-end',
  },
  scrim: { ...StyleSheet.absoluteFill, backgroundColor: '#08140DB0' },
  sheet: {
    height: '93%',
    backgroundColor: colors.canvas,
    borderTopLeftRadius: 31,
    borderTopRightRadius: 31,
    overflow: 'hidden',
  },
  grabber: {
    width: 36,
    height: 4,
    borderRadius: 4,
    backgroundColor: '#CED0C7',
    alignSelf: 'center',
    marginTop: 11,
  },
  header: {
    paddingHorizontal: 25,
    paddingTop: 20,
    paddingBottom: 19,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eyebrow: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: '#7F887C',
    letterSpacing: 2.2,
    marginBottom: 6,
  },
  heading: {
    fontFamily: fonts.displayBold,
    fontSize: 30,
    color: colors.ink,
    letterSpacing: -1.5,
  },
  close: {
    width: 39,
    height: 39,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: { paddingHorizontal: 25, paddingBottom: 25 },
  previewWell: {
    backgroundColor: '#E9EDE3',
    borderRadius: 22,
    paddingTop: 16,
    paddingBottom: 19,
    alignItems: 'center',
    overflow: 'hidden',
  },
  previewLabel: {
    alignSelf: 'flex-start',
    marginLeft: 20,
    marginBottom: 15,
    color: '#68766A',
    fontSize: 9,
    letterSpacing: 2,
    fontFamily: fonts.bold,
  },
  previewHint: {
    marginTop: 16,
    color: '#657367',
    fontFamily: fonts.body,
    fontSize: 11,
  },
  photoRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  photoButton: {
    flex: 1,
    height: 49,
    backgroundColor: colors.white,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 9,
    borderWidth: 1,
    borderColor: colors.line,
  },
  photoButtonText: {
    color: colors.ink,
    fontFamily: fonts.semibold,
    fontSize: 12,
  },
  tip: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.secondary,
    marginTop: 11,
    marginBottom: 22,
    lineHeight: 16,
  },
  fieldLabel: {
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 1.9,
    color: '#757C72',
    marginBottom: 9,
    marginTop: 17,
  },
  optional: { color: '#AFB3A9', fontSize: 9 },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 15,
    height: 50,
    paddingHorizontal: 15,
    fontFamily: fonts.medium,
    color: colors.ink,
    fontSize: 14,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: '#D6D9D0',
    borderRadius: 99,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  chipActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  chipText: { fontFamily: fonts.medium, color: '#5F685E', fontSize: 11 },
  chipTextActive: { color: colors.white },
  looks: { flexDirection: 'row', gap: 12 },
  look: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lookActive: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
    outlineColor: colors.ink,
    outlineWidth: 1,
  },
  nfcBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E7EADC',
    borderRadius: 18,
    padding: 14,
    marginTop: 25,
  },
  nfcIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nfcCopy: { flex: 1, paddingHorizontal: 12 },
  nfcTitle: { fontFamily: fonts.semibold, fontSize: 13, color: colors.ink },
  nfcDescription: {
    fontFamily: fonts.body,
    fontSize: 11,
    lineHeight: 16,
    color: '#667063',
    marginTop: 3,
  },
  nfcAction: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFFFFF9A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nfcNote: {
    fontFamily: fonts.body,
    fontSize: 10,
    lineHeight: 15,
    color: '#838A80',
    marginTop: 9,
  },
  error: {
    color: '#A73E35',
    fontFamily: fonts.medium,
    fontSize: 12,
    marginTop: 14,
  },
  footer: {
    paddingHorizontal: 25,
    paddingTop: 11,
    paddingBottom: Platform.OS === 'ios' ? 32 : 18,
    backgroundColor: colors.canvas,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  saveButton: {
    height: 55,
    borderRadius: 16,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  saveText: { fontFamily: fonts.bold, fontSize: 14, color: colors.ink },
});
