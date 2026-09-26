# Setup and development

1. Install [Bun](https://bun.sh/) and run `bun install`.
2. Run `bun start` for the Metro server. The photo collection works in Expo Go; NFC does not.
3. To scan NFC, run `bunx expo run:android` on an NFC-capable Android phone, or create an Expo development build. iOS native builds require macOS and an Apple signing setup. The `react-native-nfc-manager` config plugin is in `app.json`.
4. Run `bun run check` and `bun test` before shipping changes.

The NFC dependency is pinned to `react-native-nfc-manager@4.0.0-beta.9` because v3 supports only the legacy React Native architecture. Expo Doctor's React Native Directory entry is package-level and still flags the beta, so that single entry is excluded in `package.json`. An Android debug APK was built successfully with SDK 57; scan behavior still needs a real NFC tag test on each target phone.

The web target is a visual preview (`bun run web`). Web cannot scan NFC. Photos are copied to app documents on native platforms and stored in AsyncStorage as references. Web preview photos are stored as data URLs in browser storage so they survive reloads; large collections may hit browser storage limits.

The app is a starter product, not a credential emulator. Any future tap-to-use integration must be implemented per card issuer and platform capability. Native platform behavior must be tested on real hardware before release.

## Signed Android APK

The [Signed Android APK workflow](../../.github/workflows/signed-apk.yml) runs manually from GitHub Actions or when a `v*` tag is pushed. It regenerates `android/`, builds `:app:assembleRelease`, verifies that the APK certificate matches the release keystore, and uploads the APK as a workflow artifact for 30 days.

Configure these repository Actions secrets before running it:

- `FOLIO_ANDROID_KEYSTORE_BASE64`: the base64 encoding of the release keystore file, with no line breaks.
- `FOLIO_ANDROID_STORE_PASSWORD`: the keystore password.
- `FOLIO_ANDROID_KEY_ALIAS`: the signing key alias.
- `FOLIO_ANDROID_KEY_PASSWORD`: the key password.

Keep a separate, secure backup of the keystore and passwords. Future APK updates for the same Android package must use the same signing key. The keystore and passwords must never be committed. The generated Gradle project reads the file path and passwords from environment variables only during a release build; a missing keystore leaves a local release build unsigned instead of using the debug certificate.
