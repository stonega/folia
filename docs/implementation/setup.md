# Setup and development

1. Install [Bun](https://bun.sh/) and run `bun install`.
2. Run `bun start` for the Metro server. The photo collection works in Expo Go; NFC does not.
3. To scan NFC, run `bunx expo run:android` on an NFC-capable Android phone, or create an Expo development build. iOS native builds require macOS and an Apple signing setup. The `react-native-nfc-manager` config plugin is in `app.json`.
4. Run `bun run check` and `bun test` before shipping changes.

The NFC dependency is pinned to `react-native-nfc-manager@4.0.0-beta.9` because v3 supports only the legacy React Native architecture. Expo Doctor's React Native Directory entry is package-level and still flags the beta, so that single entry is excluded in `package.json`. An Android debug APK was built successfully with SDK 57; scan behavior still needs a real NFC tag test on each target phone.

The web target is a visual preview (`bun run web`). Web cannot scan NFC. Photos are copied to app documents on native platforms and stored in AsyncStorage as references. Web preview photos are stored as data URLs in browser storage so they survive reloads; large collections may hit browser storage limits.

The app is a starter product, not a credential emulator. Any future tap-to-use integration must be implemented per card issuer and platform capability. Native platform behavior must be tested on real hardware before release.

## Signed Android releases

Build signed Android releases locally using the signing setup below. The [App checks workflow](../../.github/workflows/checks.yml) runs `bun run check` and `bun test` manually from GitHub Actions or when a `v*` tag is pushed.

Keep a separate, secure backup of the keystore and passwords. Direct APK updates for the same Android package must use the same signing key. With Play App Signing, Google signs the installed app, while this keystore is the upload key used to sign AAB submissions. Keep using the registered upload key for later submissions unless you reset it through Play Console. The keystore and passwords must never be committed. The generated Gradle project reads the file path and passwords from environment variables only during a release build; a missing keystore leaves a local release build unsigned instead of using the debug certificate.

### Local Play bundle

The Android package is `com.stone.folio`. The first Play release is version `1.0.0`, version code `1`. Increment `expo.android.versionCode` in `app.json` before each subsequent uploaded build, then regenerate Android with `CI=1 bunx expo prebuild --platform android --no-install`.

The local upload key and private credentials are stored outside the repository under `~/.config/folio/android-signing/`. Back up that directory securely. `folio-upload.jks` is the private keystore, `credentials.json` contains its passwords and alias, and `upload-certificate.pem` is the public certificate. The directory has mode `0700`; its files have mode `0600`.

To build with these local credentials without printing passwords or putting them in command-line arguments, run this from the repository root:

```sh
python3 - <<'PY'
import json
import os
import subprocess
from pathlib import Path

credentials = json.loads(
    (Path.home() / '.config/folio/android-signing/credentials.json').read_text()
)
env = os.environ.copy()
env.update({
    'FOLIO_ANDROID_STORE_FILE': credentials['keystorePath'],
    'FOLIO_ANDROID_STORE_PASSWORD': credentials['keystorePassword'],
    'FOLIO_ANDROID_KEY_ALIAS': credentials['keyAlias'],
    'FOLIO_ANDROID_KEY_PASSWORD': credentials['keyPassword'],
})
subprocess.run(
    ['./gradlew', ':app:bundleRelease', '--no-daemon'],
    cwd='android', env=env, check=True,
)
PY
```

Upload `android/app/build/outputs/bundle/release/app-release.aab` to **Testing > Internal testing** in Play Console. Enable Play App Signing for the first upload. The AAB is the publishing artifact; it is not installed directly on a phone. The development-signed APK currently installed on a test phone cannot be updated in place by a differently signed Play build; preserve local card data before switching installations.

Before requesting a public release, complete the store listing, add a public privacy policy and an in-app policy link, complete Play's app-content declarations, and test photo persistence and NFC on real devices. A successful bundle build does not complete these release steps.
